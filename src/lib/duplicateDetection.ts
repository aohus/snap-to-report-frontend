import DuplicateWorker from './duplicateDetection.worker?worker';

export interface DuplicateGroup {
  id: string;
  files: File[];
  reason: 'name' | 'content' | 'mixed';
  keptFile: File;
}

export async function detectDuplicates(
  files: File[], 
  onProgress?: (current: number, total: number) => void
): Promise<DuplicateGroup[]> {
  if (files.length < 2) return [];

  return new Promise((resolve, reject) => {
    const worker = new DuplicateWorker();
    const id = crypto.randomUUID();

    worker.onmessage = (e) => {
      const { type, results, current, total, error } = e.data;

      if (type === 'progress' && onProgress) {
        onProgress(current, total);
      } else if (type === 'done') {
        // 인덱스 배열을 DuplicateGroup 객체로 변환
        const groups: DuplicateGroup[] = results.map((indices: number[], groupIndex: number) => {
          const groupFiles = indices.map(idx => files[indices[0] === idx ? idx : idx]); // 정합성 유지
          const actualFiles = indices.map(idx => files[idx]);
          
          // 파일명 길이 기준 최적 파일(keptFile) 선택
          const sorted = [...actualFiles].sort((a, b) => a.name.length - b.name.length);
          
          return {
            id: `group-${groupIndex}`,
            files: actualFiles,
            reason: 'mixed',
            keptFile: sorted[0]
          };
        });
        
        worker.terminate();
        resolve(groups);
      } else if (type === 'error') {
        worker.terminate();
        reject(new Error(error));
      }
    };

    worker.onerror = (err) => {
      worker.terminate();
      reject(err);
    };

    // 워커에 파일 목록 전송
    worker.postMessage({ id, files });
  });
}
