// -----------------------------------------------------------------
// duplicateDetection.worker.ts
// -----------------------------------------------------------------

// pHash settings
const SAMPLE_SIZE = 32;
const LOW_FREQ_SIZE = 8;

self.onmessage = async (e) => {
  const { id, files } = e.data; // files는 File 객체의 배열 또는 ArrayBuffer 배열

  try {
    const results = await performDetection(files, (current, total) => {
      self.postMessage({ type: 'progress', id, current, total });
    });
    self.postMessage({ type: 'done', id, results });
  } catch (error) {
    self.postMessage({ type: 'error', id, error: String(error) });
  }
};

async function performDetection(files: any[], onProgress: (c: number, t: number) => void) {
  const fileData = [];
  const total = files.length;

  for (let i = 0; i < total; i++) {
    const file = files[i];
    try {
      const hash = await computePHash(file);
      fileData.push({
        index: i,
        hash,
        normName: getNormalizedName(file.name)
      });
    } catch (e) {
      fileData.push({
        index: i,
        hash: `ERR_${file.size || i}`,
        normName: getNormalizedName(file.name)
      });
    }
    onProgress(i + 1, total);
  }

  // Union-Find grouping
  const uf = new UnionFind(total);
  // THRESHOLD 2: 거의 픽셀 단위로 일치하는 수준 (Hamming distance <= 2)
  const THRESHOLD = 2; 

  for (let i = 0; i < fileData.length; i++) {
    for (let j = i + 1; j < fileData.length; j++) {
      const a = fileData[i];
      const b = fileData[j];

      if (a.normName === b.normName) {
        uf.union(i, j);
        continue;
      }

      if (!a.hash.startsWith('ERR_') && !b.hash.startsWith('ERR_')) {
        const dist = hammingDistance(a.hash, b.hash);
        if (dist <= THRESHOLD) {
          uf.union(i, j);
        }
      }
    }
  }

  // 결과를 인덱스 배열로 반환 (실제 File 객체는 메인 스레드에서 복원)
  const groupsMap = new Map<number, number[]>();
  for (let i = 0; i < total; i++) {
    const root = uf.find(i);
    if (!groupsMap.has(root)) groupsMap.set(root, []);
    groupsMap.get(root)!.push(i);
  }

  const results = [];
  for (const [root, indices] of groupsMap.entries()) {
    if (indices.length > 1) {
      results.push(indices);
    }
  }

  return results;
}

async function computePHash(file: File): Promise<string> {
  // Worker에서는 OffscreenCanvas 사용
  const bitmap = await createImageBitmap(file);
  const canvas = new OffscreenCanvas(SAMPLE_SIZE, SAMPLE_SIZE);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Worker: No canvas context');

  ctx.drawImage(bitmap, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
  const imageData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;

  // Grayscale & DCT 로직 (기존 로직 이식)
  const gray = new Float64Array(SAMPLE_SIZE * SAMPLE_SIZE);
  for (let i = 0; i < gray.length; i++) {
    gray[i] = imageData[i * 4] * 0.299 + imageData[i * 4 + 1] * 0.587 + imageData[i * 4 + 2] * 0.114;
  }

  // Separable DCT
  const rows = [];
  for (let y = 0; y < SAMPLE_SIZE; y++) {
    rows.push(dct1D(Array.from(gray.slice(y * SAMPLE_SIZE, (y + 1) * SAMPLE_SIZE))));
  }

  const dctMatrix = Array(SAMPLE_SIZE).fill(0).map(() => Array(SAMPLE_SIZE).fill(0));
  for (let x = 0; x < SAMPLE_SIZE; x++) {
    const col = rows.map(row => row[x]);
    const dctCol = dct1D(col);
    for (let y = 0; y < SAMPLE_SIZE; y++) {
      dctMatrix[y][x] = dctCol[y];
    }
  }

  let sum = 0;
  const pixels = [];
  for (let y = 0; y < LOW_FREQ_SIZE; y++) {
    for (let x = 0; x < LOW_FREQ_SIZE; x++) {
      if (x === 0 && y === 0) continue;
      const val = dctMatrix[y][x];
      pixels.push(val);
      sum += val;
    }
  }
  const mean = sum / pixels.length;

  let hash = '';
  for (let y = 0; y < LOW_FREQ_SIZE; y++) {
    for (let x = 0; x < LOW_FREQ_SIZE; x++) {
      hash += dctMatrix[y][x] > mean ? '1' : '0';
    }
  }
  return hash;
}

function dct1D(data: number[]): number[] {
  const N = data.length;
  const result = new Float64Array(N);
  const PI_N = Math.PI / N;
  for (let u = 0; u < N; u++) {
    let sum = 0;
    for (let x = 0; x < N; x++) {
      sum += data[x] * Math.cos((x + 0.5) * u * PI_N);
    }
    result[u] = sum;
  }
  return Array.from(result);
}

function hammingDistance(h1: string, h2: string): number {
  let d = 0;
  for (let i = 0; i < h1.length; i++) if (h1[i] !== h2[i]) d++;
  return d;
}

function getNormalizedName(name: string): string {
  const match = name.match(/^(.+?)(?:\s\(\d+\))?(\.[^.]+)$/);
  return match ? (match[1] + match[2]).toLowerCase() : name.toLowerCase();
}

class UnionFind {
  parent: number[];
  constructor(s: number) { this.parent = Array(s).fill(0).map((_, i) => i); }
  find(i: number): number {
    if (this.parent[i] === i) return i;
    return this.parent[i] = this.find(this.parent[i]);
  }
  union(i: number, j: number) {
    const rootI = this.find(i);
    const rootJ = this.find(j);
    if (rootI !== rootJ) this.parent[rootI] = rootJ;
  }
}
