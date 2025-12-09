import { Job, Cluster, ExportStatus, Photo, FileResponse } from '@/types';
import { AuthService } from './auth';
import { compressImage, isJPEGFile } from './image'; // Import isJPEGFile
import { uploadViaResumable, uploadViaPresigned, uploadViaServer } from '@/lib/uploadStrategies';

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

  getPhotos: async (jobId: string): Promise<Photo[]> => {
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

  uploadPhotos: async (jobId: string, files: File[], onProgressTotal?: (percent: number) => void): Promise<Photo[]> => {
    try {
      const totalFiles = files.length;
      let completedFilesCount = 0;
      
      // 진행률 관리
      const fileProgressMap = new Map<string, number>();
      const updateGlobalProgress = () => {
          if (!onProgressTotal) return;
          let totalPercent = 0;
          fileProgressMap.forEach(p => totalPercent += p);
          onProgressTotal(Math.round(totalPercent / totalFiles));
      };

      // ---------------------------------------------------------
      // Step 1: 병렬 압축 (CPU-bound)
      // ---------------------------------------------------------
      const compressionPromises = files.map(async (file) => {
        fileProgressMap.set(file.name, 0); // 초기화
        let fileToUpload = file;
        
        if (isJPEGFile(file)) {
          try {
            fileToUpload = await compressImage(file);
          } catch (e) {
            console.warn(`Compression failed for ${file.name}, using original.`);
          }
        }
        return { originalFile: file, fileToUpload };
      });

      const compressedFiles = await Promise.all(compressionPromises);


      // ---------------------------------------------------------
      // Step 2: 전략 및 URL 확보 (Batch Request)
      // ---------------------------------------------------------
      let strategy = 'proxy'; // 기본값
      let urls: any[] = [];
      
      try {
          const fileInfos = compressedFiles.map(({ fileToUpload }) => ({
            filename: fileToUpload.name,
            content_type: fileToUpload.type,
          }));
      
          const response = await api.getUploadUrls(jobId, fileInfos);
          
          // 백엔드 응답 검증
          if (response && response.strategy && response.urls.length === totalFiles) {
              strategy = response.strategy;
              urls = response.urls;
          } else {
              console.warn("Invalid URL response, falling back to server upload.");
          }
      } catch (e) {
          console.warn("Failed to get upload URLs, falling back to server upload.", e);
          strategy = 'proxy';
      }


      // ---------------------------------------------------------
      // Step 3: 업로드 큐 생성 (전략에 따른 매핑)
      // ---------------------------------------------------------
      const uploadQueue = compressedFiles.map((item, index) => ({
        file: item.fileToUpload,
        originalName: item.originalFile.name,
        urlInfo: urls[index] || null, // Fallback일 경우 null일 수 있음
      }));

      const successfulUploadsInfo: { filename: string; storage_path: string }[] = [];


      // ---------------------------------------------------------
      // Step 4: 워커 루프 정의 (병렬 처리)
      // ---------------------------------------------------------
      const MAX_CONCURRENCY = 3; 

      const worker = async () => {
        while (uploadQueue.length > 0) {
          const item = uploadQueue.shift();
          if (!item) break;
          const { file, originalName, urlInfo } = item;
          const currentProgressCallback = (p: number) => {
              fileProgressMap.set(originalName, p);
              updateGlobalProgress();
          };

          try {
            // *** 핵심: 전략에 따른 분기 처리 ***
            if (strategy === 'resumable' && urlInfo?.upload_url) {
                // 1. Resumable (GCS Session URL)
                await uploadViaResumable(file, urlInfo.upload_url, currentProgressCallback);
                
                successfulUploadsInfo.push({
                    filename: urlInfo.filename,
                    storage_path: urlInfo.storage_path
                });

            } else if (strategy === 'presigned' && urlInfo?.upload_url) {
                // 2. Presigned (Single PUT)
                await uploadViaPresigned(file, urlInfo.upload_url, currentProgressCallback);

                successfulUploadsInfo.push({
                    filename: urlInfo.filename,
                    storage_path: urlInfo.storage_path
                });

            } else {
                // 3. Fallback (Server Proxy)
                // strategy가 'server_fallback'이거나 'proxy'인 경우, 혹은 URL이 없는 경우
                await uploadViaServer(jobId, file, originalName, currentProgressCallback);
                
                // 서버 업로드는 보통 서버가 내부적으로 저장 경로를 알기 때문에 
                // notifyUploadComplete에 보낼 경로 정보가 다를 수 있음. 
                // 하지만 일관성을 위해 필요한 경우 여기서도 정보를 추가할 수 있음.
                // (일반적으로 서버 업로드 시엔 notifyUploadComplete가 필요 없는 경우가 많으나 로직 통일을 위해 생략 가능)
            }

          } catch (error) {
            console.error(`Failed to upload ${originalName} via ${strategy}`, error);
            // 개별 파일 실패 시 전체 프로세스를 멈출지, 무시할지 결정. 여기선 무시하고 진행.
          } finally {
            completedFilesCount++;
          }
        }
      };

      // ---------------------------------------------------------
      // Step 5: 실행 및 완료 처리
      // ---------------------------------------------------------
      const workers = Array(Math.min(uploadQueue.length, MAX_CONCURRENCY))
        .fill(null)
        .map(() => worker());

      await Promise.all(workers);

      // Resumable/Presigned 전략 사용 시에만 명시적 완료 통보가 필요함
      if ((strategy === 'resumable' || strategy === 'presigned') && successfulUploadsInfo.length > 0) {
        await api.notifyUploadComplete(jobId, successfulUploadsInfo);
      }

      // 💡 수정됨: Cluster[]를 Photo[]로 변환하여 반환
      const photos = await api.getPhotos(jobId);
      return photos

      } catch (error) {
        console.error("Fatal error in upload process", error);
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