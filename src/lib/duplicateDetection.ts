import { normalize } from 'path';

export interface DuplicateGroup {
  id: string;
  files: File[];
  reason: 'name' | 'content' | 'mixed';
  keptFile: File;
}

// 16x16 uses 256 bits, which provides much better accuracy than 8x8 (64 bits)
const HASH_SIZE = 16; 

async function createImageBitmap(file: File): Promise<ImageBitmap> {
  // Respect EXIF orientation so rotated originals match upright resized versions
  try {
    return await window.createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch (e) {
    // Fallback for browsers that don't support options or on error
    return window.createImageBitmap(file);
  }
}

// dHash (Difference Hash) implementation
// More robust than Average Hash for structural similarity
async function computeImageHash(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  
  // dHash requires (W+1) x H to compare adjacent pixels
  const width = HASH_SIZE + 1;
  const height = HASH_SIZE;

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

  // Use high-quality smoothing to reduce aliasing artifacts when downsizing large images.
  // This helps make the hash of a 4K image match the hash of its 500px thumbnail.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Resize image to (HASH_SIZE + 1) x HASH_SIZE
  ctx.drawImage(bitmap, 0, 0, width, height);
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let hash = '';
  
  // Calculate hash based on gradient between adjacent pixels
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < HASH_SIZE; x++) {
      const idx = (y * width + x) * 4;
      const rightIdx = (y * width + (x + 1)) * 4;

      // Basic luminance formula
      const grayLeft = data[idx] * 0.299 + data[idx + 1] * 0.587 + data[idx + 2] * 0.114;
      const grayRight = data[rightIdx] * 0.299 + data[rightIdx + 1] * 0.587 + data[rightIdx + 2] * 0.114;

      hash += grayLeft > grayRight ? '1' : '0';
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
  // 256 bits total.
  // 10 was too strict (~3.9%). 
  // 20 is ~7.8%, similar ratio to the original 8x8 logic, but dHash is structurally more robust against false positives.
  const THRESHOLD = 20; 

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
