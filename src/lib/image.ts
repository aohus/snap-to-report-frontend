/***********************************************************************
 * compressImage.ts
 *
 * Uses a pool of Web Workers for concurrent off-main-thread compression.
 ***********************************************************************/

import ImageWorker from './image.worker?worker';

// Determine concurrency based on hardware (clamp between 2 and 6)
const CONCURRENCY = Math.min(Math.max((navigator.hardwareConcurrency || 4) - 1, 2), 6);

const workers: Worker[] = [];
for (let i = 0; i < CONCURRENCY; i++) {
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
      const file = new File([blob], pending.fileName, {
        type: "image/jpeg",
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
  return new Promise<File>((resolve, reject) => {
    const id = messageId++;
    const fileName = file.name.replace(/\.\w+$/, ".jpg");

    pendingResolves.set(id, { resolve, reject, fileName });

    // Select worker round-robin
    const worker = workers[nextWorkerIndex];
    nextWorkerIndex = (nextWorkerIndex + 1) % workers.length;

    worker.postMessage({
      id,
      file,
      maxWidth,
      maxHeight,
      quality,
    });
  }).catch((err) => {
    console.warn("Worker compression failed, returning original file:", err);
    return file;
  });
}

export function isJPEGFile(file: File): boolean {
  return (
    file.type === "image/jpeg" ||
    file.name.toLowerCase().endsWith(".jpg") ||
    file.name.toLowerCase().endsWith(".jpeg")
  );
}