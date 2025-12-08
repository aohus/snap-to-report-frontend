/***********************************************************************
 * compressImage.ts
 *
 * Uses a pool of Web Workers for concurrent off-main-thread compression.
 ***********************************************************************/

import ImageWorker from './image.worker?worker';

// Determine concurrency based on hardware (clamp between 2 and 6)
// CPU 집약적인 압축 작업을 처리할 Worker의 수
const COMPRESSION_CONCURRENCY = Math.min(Math.max((navigator.hardwareConcurrency || 4) - 1, 2), 6);

const workers: Worker[] = [];
for (let i = 0; i < COMPRESSION_CONCURRENCY; i++) {
  workers.push(new ImageWorker());
}

let messageId = 0;
const pendingResolves = new Map<
  number,
  {
    resolve: (f: File) => void;
    reject: (e: unknown) => void;
    fileName: string;
  }
>();

// Round-robin index to distribute tasks
let nextWorkerIndex = 0;

// Set up listeners for all workers
workers.forEach((worker) => {
  worker.onmessage = (e) => {
    const { id, blob, error } = e.data;
    const pending = pendingResolves.get(id);
    if (!pending) return;

    pendingResolves.delete(id);

    if (error) {
      pending.reject(new Error(error));
    } else {
      // Worker에서 받은 Blob을 File 객체로 재구성
      const file = new File([blob], pending.fileName, {
        type: "image/jpeg", // JPEG으로 압축했으므로 타입 고정
        lastModified: Date.now(),
      });
      pending.resolve(file);
    }
  };
});

export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1920,
  quality: number = 0.8
): Promise<File> {
  return new Promise<File>(async (resolve, reject) => {
    const id = messageId++;
    // 압축 후 파일명은 .jpg로 변경
    const fileName = file.name.replace(/\.\w+$/, ".jpg"); 

    pendingResolves.set(id, { resolve, reject, fileName });

    // Transferable Object 사용: File을 ArrayBuffer로 변환하여 메모리 복사 최소화
    const arrayBuffer = await file.arrayBuffer();

    // Select worker round-robin
    const worker = workers[nextWorkerIndex];
    nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;

    worker.postMessage({
      id,
      arrayBuffer, // Transferable Object
      fileType: file.type,
      fileName: file.name,
      fileLastModified: file.lastModified,
      maxWidth,
      maxHeight,
      quality,
    }, [arrayBuffer]); // ArrayBuffer 소유권을 Worker로 이전

  }).catch((err) => {
    console.warn("Worker compression failed, returning original file:", err);
    return file;
  });
}

export function isJPEGFile(file: File): boolean {
  // JPEG 파일만 압축 로직을 태웁니다.
  return (
    file.type === "image/jpeg" ||
    file.name.toLowerCase().endsWith(".jpg") ||
    file.name.toLowerCase().endsWith(".jpeg")
  );
}