import { normalize } from 'path';

export interface DuplicateGroup {
  id: string;
  files: File[];
  reason: 'name' | 'content' | 'mixed';
  keptFile: File;
}

// pHash settings
const SAMPLE_SIZE = 32; // Resize to 32x32
const LOW_FREQ_SIZE = 8; // Take top-left 8x8

async function createImageBitmap(file: File): Promise<ImageBitmap> {
  // Respect EXIF orientation so rotated originals match upright resized versions
  try {
    return await window.createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    // Fallback for browsers that don't support options or on error
    return window.createImageBitmap(file);
  }
}

// 1D DCT-II
function dct1D(data: number[]): number[] {
    const N = data.length;
    const result = new Float64Array(N);
    const PI_N = Math.PI / N;
    
    for (let u = 0; u < N; u++) {
        let sum = 0;
        for (let x = 0; x < N; x++) {
            sum += data[x] * Math.cos((x + 0.5) * u * PI_N);
        }
        // Orthogonal scaling
        // C(0) = sqrt(1/N), C(u) = sqrt(2/N)
        // We can skip scaling for hash comparisons if uniform, 
        // but for correctness relative to "mean" of AC coeffs, let's keep it close to standard.
        // Actually, for pHash, we just need relative magnitude.
        // Let's do raw summation, it works for comparisons.
        result[u] = sum; 
    }
    return Array.from(result);
}

// Compute pHash (Perceptual Hash) using DCT
async function computeImageHash(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  
  const width = SAMPLE_SIZE;
  const height = SAMPLE_SIZE;

  let canvas: OffscreenCanvas | HTMLCanvasElement;
  let ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null;

  if (typeof OffscreenCanvas !== 'undefined') {
    canvas = new OffscreenCanvas(width, height);
    ctx = canvas.getContext('2d');
  } else {
    canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    ctx = canvas.getContext('2d');
  }
  
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // 1. Resize to 32x32
  ctx.drawImage(bitmap, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // 2. Convert to Grayscale
  const grayscaleMatrix: number[][] = []; // 32 rows of 32 cols
  for (let y = 0; y < height; y++) {
    const row: number[] = [];
    for (let x = 0; x < width; x++) {
       const idx = (y * width + x) * 4;
       // ITU-R 601-2 luma transform:
       // L = R * 299/1000 + G * 587/1000 + B * 114/1000
       const gray = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
       row.push(gray);
    }
    grayscaleMatrix.push(row);
  }

  // 3. Compute DCT
  // Separable DCT: Apply 1D DCT to rows, then to columns of the result.
  
  // Row DCT
  const dctRows: number[][] = grayscaleMatrix.map(row => dct1D(row));

  // Col DCT (Transpose -> DCT rows -> Transpose back)
  // Actually, we only need the first 8 columns of the result for the next step.
  // But let's keep it simple and compute full 32x32 DCT.
  const dctMatrix: number[][] = Array(height).fill(0).map(() => Array(width).fill(0));

  for (let x = 0; x < width; x++) {
      const col = dctRows.map(row => row[x]);
      const dctCol = dct1D(col);
      for (let y = 0; y < height; y++) {
          dctMatrix[y][x] = dctCol[y];
      }
  }

  // 4. Reduce to 8x8 (Low Frequencies)
  // 5. Compute Mean (excluding DC component at 0,0)
  let sum = 0;
  const pixels: number[] = [];
  
  for (let y = 0; y < LOW_FREQ_SIZE; y++) {
      for (let x = 0; x < LOW_FREQ_SIZE; x++) {
          if (x === 0 && y === 0) continue; // Skip DC
          const val = dctMatrix[y][x];
          pixels.push(val);
          sum += val;
      }
  }
  
  const mean = sum / pixels.length;

  // 6. Generate Hash
  let hash = '';
  for (let y = 0; y < LOW_FREQ_SIZE; y++) {
      for (let x = 0; x < LOW_FREQ_SIZE; x++) {
          // Note: We include DC in the hash string position (first bit), 
          // usually compared against mean of AC? 
          // Standard implementation often just compares all 64 against average.
          // Let's compare all 8x8 against the AC mean (excluding DC from mean calc is common).
          const val = dctMatrix[y][x];
          hash += val > mean ? '1' : '0';
      }
  }

  return hash;
}

function hammingDistance(hash1: string, hash2: string): number {
  let dist = 0;
  for (let i = 0; i < hash1.length; i++) {
    if (hash1[i] !== hash2[i]) dist++;
  }
  return dist;
}

// Regex to identify "name (N).ext" pattern
// Captures: 1: base name, 2: extension
const NAME_PATTERN = /^(.+?)(?:\s\(\d+\))?(\.[^.]+)$/;

function getNormalizedName(filename: string): string {
  const match = filename.match(NAME_PATTERN);
  if (match) {
    return (match[1] + match[2]).toLowerCase(); // Normalize case too
  }
  return filename.toLowerCase();
}

export async function detectDuplicates(files: File[], onProgress?: (current: number, total: number) => void): Promise<DuplicateGroup[]> {
  const fileData = await Promise.all(files.map(async (file, index) => {
    try {
      const hash = await computeImageHash(file);
      if (onProgress) onProgress(index + 1, files.length);
      return {
        file,
        index,
        hash,
        normName: getNormalizedName(file.name)
      };
    } catch (e) {
      console.warn(`Failed to hash image ${file.name}`, e);
      if (onProgress) onProgress(index + 1, files.length);
      // Fallback: use file size + name as a pseudo-hash to avoid crashing
      return {
        file,
        index,
        hash: `ERR_${file.size}`, 
        normName: getNormalizedName(file.name)
      };
    }
  }));

  const uf = new UnionFind(files.length);
  
  // pHash (64 bits). 
  // Distance <= 5 is extremely similar (often compression artifacts).
  // Distance <= 10 is usually the same image but maybe resized/stretched slightly.
  // 10 is a safe upper bound for "same image".
  const THRESHOLD = 10; 

  // O(N^2) comparison - acceptable for N=500 (125k checks) in JS
  for (let i = 0; i < fileData.length; i++) {
    for (let j = i + 1; j < fileData.length; j++) {
      const a = fileData[i];
      const b = fileData[j];

      // Check 1: Name Similarity
      if (a.normName === b.normName) {
        uf.union(i, j);
        continue;
      }

      // Check 2: Visual Similarity (Hash)
      // Only check if valid hashes
      if (!a.hash.startsWith('ERR_') && !b.hash.startsWith('ERR_')) {
        const dist = hammingDistance(a.hash, b.hash);
        if (dist <= THRESHOLD) {
          uf.union(i, j);
        }
      }
    }
  }

  // Group files
  const groups = new Map<number, File[]>();
  for (let i = 0; i < files.length; i++) {
    const root = uf.find(i);
    if (!groups.has(root)) {
      groups.set(root, []);
    }
    groups.get(root)?.push(files[i]);
  }

  // Convert to DuplicateGroup array
  const results: DuplicateGroup[] = [];
  groups.forEach((groupFiles, rootIndex) => {
    if (groupFiles.length > 1) {
      // Logic to pick "kept" file:
      // Prefer the one that doesn't have " (N)" in it if possible, or the first one.
      // We can sort by name length (shortest usually is the original).
      const sorted = [...groupFiles].sort((a, b) => a.name.length - b.name.length);
      
      results.push({
        id: `group-${rootIndex}`,
        files: groupFiles,
        reason: 'mixed', // Simplified reason
        keptFile: sorted[0]
      });
    }
  });

  return results;
}

// Simple Union-Find for grouping
class UnionFind {
  parent: number[];
  constructor(size: number) {
    this.parent = Array(size).fill(0).map((_, i) => i);
  }
  
  find(i: number): number {
    if (this.parent[i] === i) return i;
    this.parent[i] = this.find(this.parent[i]);
    return this.parent[i];
  }
  
  union(i: number, j: number) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) {
      this.parent[rootI] = rootJ;
    }
  }
}
