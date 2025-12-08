import { Job, Cluster, ExportStatus, Photo, FileResponse } from '@/types';
import { AuthService } from './auth';
import { compressImage, isJPEGFile } from './image'; // Import isJPEGFile

const API_BASE_URL = '/api';

// JSON 요청용 + Authorization 헤더 조합
function authJsonHeaders(): HeadersInit {
  const h: HeadersInit = { 
    'Content-Type': 'application/json',
  };
  
  const accessToken = AuthService.getToken();
  if (accessToken) {
    h['Authorization'] = `Bearer ${accessToken}`;
  }
  return h;
}

// FormData 등 (Content-Type 자동 설정이 필요한 경우)용 헤더
function authHeadersWithoutContentType(): HeadersInit {
  const h: HeadersInit = {};
  const accessToken = AuthService.getToken();
  if (accessToken) {
    h['Authorization'] = `Bearer ${accessToken}`;
  }
  return h;
}

async function handleResponse<T>(response: Response): Promise<T> {
  // if (response.status === 401) {
  //   AuthService.getCurrentUser()
  // }
  
  if (!response.ok) {
    // 응답 바디가 JSON이 아닐 수도 있으므로 try-catch
    let errorMessage = response.statusText;
    try {
      const error = await response.json();
      errorMessage = error.detail || error.message || errorMessage;
    } catch {
      // ignore
    }
    throw new Error(errorMessage);
  }

  // 204 No Content 처리
  if (response.status === 204) {
    return undefined as T;
  }

  // 그 외에는 JSON 반환
  return response.json();
}

export const api = {
  // Job Management
  getJobs: async (): Promise<Job[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs`, { 
      headers: authJsonHeaders(), 
    });
    return handleResponse<Job[]>(response);
  },

  createJob: async (title: string, construction_type?: string, company_name?: string): Promise<Job> => {
    const body: { title: string; construction_type?: string; company_name?: string; } = { title };
    if (construction_type) body.construction_type = construction_type;
    if (company_name) body.company_name = company_name;

    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: authJsonHeaders(), 
      body: JSON.stringify(body),
    });
    return handleResponse<Job>(response);
  },

  getJob: async (jobId: string): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, { 
      headers: authJsonHeaders(), 
    });
    return handleResponse<Job>(response);
  },

  updateJob: async (jobId: string, data: Partial<Job>): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, {
      method: 'PATCH',
      headers: authJsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Job>(response);
  },

  getJobDetails: async (jobId: string): Promise<Job & { photos: Photo[], clusters: Cluster[] }> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/details`, { 
      headers: authJsonHeaders(), 
    });
    return handleResponse<Job & { photos: Photo[], clusters: Cluster[] }>(response);
  },

  deleteJob: async (jobId: string): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, { 
      method: 'DELETE',
      headers: authJsonHeaders(), 
    });
    return handleResponse<Job>(response);
  },

  getPhotos: async (jobId: string): Promise<Cluster[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/photos`, { 
      headers: authJsonHeaders(), 
   });
    return handleResponse<Photo[]>(response);
  },

  // Cluster/Place Management
  startClustering: async (jobId: string): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/cluster`, { 
      method: 'POST',
      headers: authJsonHeaders(), 
      body: JSON.stringify({ min_samples: 3, max_dist_m: 8.0, max_alt_diff_m: 20.0 }),
   });
    return handleResponse<any>(response);
  },

  getClusters: async (jobId: string): Promise<Cluster[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/clusters`, { 
      headers: authJsonHeaders(), 
   });
    return handleResponse<Cluster[]>(response);
  },

  syncClusters: async (jobId: string, clusters: Cluster[]): Promise<void> => {
    const payload = {
      clusters: clusters.map(c => ({
        id: c.id,
        name: c.name, // Removing name to prevent overwriting edits with stale data during sync
        order_index: c.order_index,
        photo_ids: c.photos.map(p => p.id)
      }))
    };
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/clusters/sync`, {
      method: 'PUT',
      headers: authJsonHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<void>(response);
  },

  createCluster: async (jobId: string, name: string, orderIndex: number, photo_ids?: string[]): Promise<Cluster> => {
    const payload: { name: string; order_index: number; photo_ids?: string[] } = { name, order_index: orderIndex };
    if (photo_ids && photo_ids.length > 0) {
      payload.photo_ids = photo_ids;
    }
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/clusters`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(payload),
    });
    return handleResponse<Cluster>(response);
  },

  updateCluster: async (clusterId: string, data: { new_name?: string; order_index?: number }): Promise<Cluster> => {
    const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}`, {
      method: 'PATCH',
      headers: authJsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Cluster>(response);
  },

  deleteCluster: async (clusterId: string): Promise<Cluster[]> => {
    const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}`, {
      method: 'DELETE',
      headers: authJsonHeaders(),
    });
    return handleResponse<Cluster[]>(response);
  },
// Photo Management
  // Presigned URL 요청을 배치(Batch) 처리하도록 개선
  getUploadUrls: async (jobId: string, files: { filename: string; content_type: string }[]): Promise<{ strategy: string; urls: { filename: string; upload_url: string | null; storage_path: string }[] }> => {
    // files 배열 전체를 한 번에 백엔드로 전송
    const fileInfos = files.map(f => ({ filename: f.filename, content_type: f.content_type }));
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/photos/presigned`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(fileInfos),
    });
    return handleResponse(response);
  },

  // 업로드 완료 통보 (후속 비동기 처리 트리거)
  notifyUploadComplete: async (jobId: string, uploadedFiles: { filename: string; storage_path: string }[]): Promise<Photo[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/photos/complete`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(uploadedFiles),
    });
    return handleResponse(response); 
  },

  // 메인 업로드 로직: 압축/업로드 병렬화 + Fallback 로직 포함
  uploadPhotos: async (jobId: string, files: File[], onProgress?: (percent: number) => void): Promise<Photo[]> => {
    try {
      const totalFiles = files.length;
      let completedFiles = 0;
      let uploadedFilesInfo: { filename: string; storage_path: string }[] = [];

      const updateProgress = () => {
        if (onProgress) {
          const percent = Math.round((completedFiles / totalFiles) * 100);
          onProgress(percent);
        }
      };

      const MAX_CONCURRENCY = 3; // 네트워크 I/O 동시 처리 제한

      // 1. 모든 파일에 대한 압축 작업을 병렬로 시작합니다.
      const compressionPromises = files.map(async (file, index) => {
        let fileToUpload = file;
        
        if (isJPEGFile(file)) {
          try {
            fileToUpload = await compressImage(file);
          } catch (e) {
            console.warn(`Compression failed for ${file.name}, uploading original.`);
          }
        }
        
        return { originalFile: file, fileToUpload, index };
      });
      
      // 모든 파일의 압축이 완료될 때까지 대기
      const compressedFiles = await Promise.all(compressionPromises);

      // 2. Presigned URL을 Batch로 요청합니다.
      const fileInfos = compressedFiles.map(({ fileToUpload }) => ({
        filename: fileToUpload.name, // 압축된 파일명 사용
        content_type: fileToUpload.type,
      }));
      
      let urls: { filename: string; upload_url: string | null; storage_path: string }[] = [];
      let strategy = '';
      let usePresignedStrategy = false;
      
      try {
        const urlResponse = await api.getUploadUrls(jobId, fileInfos);
        strategy = urlResponse.strategy;
        urls = urlResponse.urls;
        
        if (strategy === 'presigned' && urls.length === totalFiles) {
          usePresignedStrategy = true;
        } else {
          // Fallback trigger: 전략이 'presigned'가 아니거나 URL 개수가 일치하지 않음
          throw new Error('Presigned URL strategy mismatch or invalid count.');
        }
      } catch (err) {
         console.warn(`Presigned URL batch request failed or rejected. Falling back to Server Upload. Error:`, err);
         usePresignedStrategy = false;
      }
      
      // 3. 업로드 Queue 생성
      const uploadQueue = compressedFiles.map((item, index) => ({
        file: item.fileToUpload,
        originalFile: item.originalFile,
        urlInfo: usePresignedStrategy ? urls[index] : null,
      }));

      // Task Queue Pattern for Upload Concurrency
      const worker = async () => {
        while (uploadQueue.length > 0) {
          const item = uploadQueue.shift();
          if (!item) break;
          const { file, originalFile, urlInfo } = item;
          let uploadSuccessful = false;

          try {
            if (usePresignedStrategy && urlInfo?.upload_url) {
              // A. Presigned URL Direct Upload
              await fetch(urlInfo.upload_url, {
                method: 'PUT',
                body: file,
                headers: { 'Content-Type': file.type }
              });
              
              // 완료 정보 수집
              uploadedFilesInfo.push({
                  filename: urlInfo.filename,
                  storage_path: urlInfo.storage_path
              });
              uploadSuccessful = true;
            } else {
              // B. Fallback: Server Upload (XHR 사용)
              const formData = new FormData();
              // 서버가 원본 파일명 기반으로 처리할 수 있도록, 원본 파일명 사용 (혹은 압축된 파일명 사용에 대해 백엔드와 협의 필요)
              formData.append('files', file, originalFile.name); 

              await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API_BASE_URL}/jobs/${jobId}/photos`);
                const accessToken = AuthService.getToken();
                if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve(undefined) : reject(new Error(xhr.statusText));
                xhr.onerror = () => reject(new Error('Network Error'));
                xhr.send(formData);
              });
              
              // Fallback의 경우, 서버가 이미 처리 완료 통보를 받았다고 가정하거나
              // 별도의 서버 업로드 완료 통보 API를 호출해야 함. 
              // (기존 코드의 FormData 업로드는 별도의 complete 통보 로직이 없었으므로 여기서는 생략)
              uploadSuccessful = true;
            }

          } catch (error) {
             console.error(`Failed to upload file ${originalFile.name}`, error);
             // Continue processing other files even if one fails
          } finally {
            if (uploadSuccessful) {
                completedFiles++;
                updateProgress();
            }
          }
        }
      };

      // MAX_CONCURRENCY 수만큼 Upload Worker를 실행
      const workers = Array(Math.min(uploadQueue.length, MAX_CONCURRENCY))
        .fill(null)
        .map(() => worker());

      await Promise.all(workers);
      
      // 4. Presigned 전략을 사용했고 성공한 파일이 있다면 최종 통보
      if (usePresignedStrategy && uploadedFilesInfo.length > 0) {
        // 백엔드가 비동기 처리를 시작하도록 트리거
        await api.notifyUploadComplete(jobId, uploadedFilesInfo);
      }
      
      // 5. 서버에서 최종 Photo 목록을 가져옴
      const photos = await api.getPhotos(jobId);
      return photos as unknown as Photo[];

    } catch (error) {
      console.error("Fatal Upload failure", error);
      throw error;
    }
  },
  
  movePhoto: async (photoId: string, targetClusterId: string, orderIndex?: number): Promise<void> => {
    const body: any = { target_cluster_id: targetClusterId };
    if (orderIndex !== undefined) {
        body.order_index = orderIndex;
    }
    const response = await fetch(`${API_BASE_URL}/photos/${photoId}/move`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(body),
    });
    return handleResponse<void>(response);
  },

  addPhotosToExistingCluster: async (clusterId: string, photoIds: string[]): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/clusters/${clusterId}/add_photos`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ photo_ids: photoIds }),
    });
    return handleResponse<void>(response);
  },

  deletePhoto: async (photoId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/photos/${photoId}`, {
      method: 'DELETE',
      headers: authJsonHeaders(),
    });
    return handleResponse<void>(response);
  },

  // Export
  startExport: async (jobId: string, metadata?: { title?: string, construction_type?: string, company_name?: string }): Promise<ExportStatus> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/export`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(metadata || {}),
    });
    return handleResponse<ExportStatus>(response);
  },

  getExportStatus: async (jobId: string): Promise<ExportStatus> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/export/status`, { 
      headers: authJsonHeaders(),
    });
    return handleResponse<ExportStatus>(response);
  },

  // Helper for image URLs
  getPhotoUrl: (path: string) => {
    if (path.startsWith('http') || path.startsWith('blob')) return path;
    return `${API_BASE_URL}/uploads/${path}`; 
  },

  // Helper for image URLs
  getDownloadUrl: async (jobId: string) => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/export/download`, { 
      headers: authJsonHeaders(),
    });
    return handleResponse<FileResponse>(response);
  }
};