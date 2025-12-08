import { AuthService } from './auth';

const API_BASE_URL = '/api';

// 1. Resumable Upload (Chunked) - 대용량 파일용
// GCS Session URL을 사용하여 5MB 단위로 끊어서 전송
export async function uploadViaResumable(
  file: File,
  sessionUrl: string,
  onProgress: (percent: number) => void
): Promise<void> {
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
  const totalBytes = file.size;
  let start = 0;

  while (start < totalBytes) {
    const end = Math.min(start + CHUNK_SIZE, totalBytes);
    const chunk = file.slice(start, end);
    
    // 재시도 로직 (네트워크 불안정 대비)
    let retries = 3;
    while (retries > 0) {
      try {
        const response = await fetch(sessionUrl, {
          method: 'PUT',
          body: chunk,
          headers: {
            'Content-Range': `bytes ${start}-${end - 1}/${totalBytes}`
          }
        });

        // 308: 청크 업로드 성공 (진행 중), 200/201: 전체 완료
        if (response.status === 308 || response.status === 200 || response.status === 201) {
          start = end;
          const percent = Math.min(Math.round((start / totalBytes) * 100), 100);
          onProgress(percent);
          break; // 성공 시 while(retries) 탈출 -> 다음 청크로
        } else {
          throw new Error(`GCS responded with ${response.status}`);
        }
      } catch (e) {
        retries--;
        if (retries === 0) throw e;
        await new Promise(r => setTimeout(r, 1000)); // 1초 대기 후 재시도
      }
    }
  }
}

// 2. Presigned Upload (Single PUT) - 일반적인 방식
export async function uploadViaPresigned(
  file: File,
  uploadUrl: string,
  onProgress: (percent: number) => void
): Promise<void> {
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: { 'Content-Type': file.type }
  });
  onProgress(100);
}

// 3. Server Fallback Upload (Proxy) - 최후의 수단
export async function uploadViaServer(
  jobId: string,
  file: File,
  originalFilename: string,
  onProgress: (percent: number) => void
): Promise<void> {
  const formData = new FormData();
  formData.append('files', file, originalFilename); // 원본 파일명 유지

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // 백엔드의 기존 서버 업로드 엔드포인트
    xhr.open('POST', `${API_BASE_URL}/jobs/${jobId}/photos`); 
    
    const accessToken = AuthService.getToken();
    if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(xhr.statusText || 'Server upload failed'));
    };
    xhr.onerror = () => reject(new Error('Network Error'));
    xhr.send(formData);
  });
}