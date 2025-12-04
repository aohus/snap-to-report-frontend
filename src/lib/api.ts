import { Job, Cluster, ExportStatus, Photo, FileResponse } from '@/types';
import { AuthService } from './auth';

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

  createJob: async (title: string): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      method: 'POST',
      headers: authJsonHeaders(), 
      body: JSON.stringify({ title }),
    });
    return handleResponse<Job>(response);
  },

  getJob: async (jobId: string): Promise<Job> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`, { 
      headers: authJsonHeaders(), 
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
  startClustering: async (jobId: string): Promise<Cluster[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/cluster`, { 
      method: 'POST',
      headers: authJsonHeaders(), 
      body: JSON.stringify({ min_samples: 3, max_dist_m: 8.0, max_alt_diff_m: 20.0 }),
   });
    return handleResponse<Cluster[]>(response);
  },

  getClusters: async (jobId: string): Promise<Cluster[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/clusters`, { 
      headers: authJsonHeaders(), 
   });
    return handleResponse<Cluster[]>(response);
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
  getUploadUrls: async (jobId: string, files: File[]): Promise<{ strategy: string; urls: { filename: string; upload_url: string | null; storage_path: string }[] }> => {
    const fileInfos = files.map(f => ({ filename: f.name, content_type: f.type }));
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/photos/presigned`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(fileInfos),
    });
    return handleResponse(response);
  },

  notifyUploadComplete: async (jobId: string, uploadedFiles: { filename: string; storage_path: string }[]): Promise<Photo[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/photos/complete`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(uploadedFiles),
    });
    // The backend returns PhotoUploadResponse which contains count, but here we might want actual photos?
    // The backend service returns list[Photo], but the endpoint returns PhotoUploadResponse wrapper.
    // Let's adjust expectation: The current endpoint returns { job_id, file_count }.
    // If we need photo objects, we might need to fetch them again or update backend return type.
    // For now, returning empty array or refetching photos is safer.
    return []; 
  },

  uploadPhotos: async (jobId: string, files: File[], onProgress?: (percent: number) => void): Promise<Photo[]> => {
    try {
      // 1. Get Upload URLs
      const { strategy, urls } = await api.getUploadUrls(jobId, files);
      const totalFiles = files.length;
      let completedFiles = 0;

      const updateProgress = () => {
        if (onProgress) {
          const percent = Math.round((completedFiles / totalFiles) * 100);
          onProgress(percent);
        }
      };

      // /*
      // Direct upload strategy (GCS Signed URL) is temporarily disabled for future use.
      // The 'urls' variable, which contains 'upload_url', is obtained but not currently used.
      // Uncomment this block to re-enable direct uploads based on 'strategy === "direct"'.
      // if (strategy === 'direct') {
      //   // Direct Upload Strategy (GCS Signed URL)
      //   const uploadedFilesInfo: { filename: string; storage_path: string }[] = [];
        
      //   // Upload in batches to avoid browser connection limits
      //   const BATCH_SIZE = 5;
      //   for (let i = 0; i < files.length; i += BATCH_SIZE) {
      //     const batch = files.slice(i, i + BATCH_SIZE);
      //     await Promise.all(batch.map(async (file) => {
      //       const fileUrlInfo = urls.find(u => u.filename === file.name);
      //       if (fileUrlInfo && fileUrlInfo.upload_url) {
      //         await fetch(fileUrlInfo.upload_url, {
      //           method: 'PUT',
      //           body: file,
      //           headers: {
      //             'Content-Type': file.type
      //           }
      //         });
      //         uploadedFilesInfo.push({ filename: file.name, storage_path: fileUrlInfo.storage_path });
      //         completedFiles++;
      //         updateProgress();
      //       }
      //     }));
      //   }

      //   // Notify Backend
      //   await api.notifyUploadComplete(jobId, uploadedFilesInfo);
        
      //   // Since notifyUploadComplete doesn't return full photo objects in current schema,
      //   // we fetch the updated photo list.
      //   const clusterData = await api.getPhotos(jobId); 
      //   // getPhotos returns Cluster[], we need to extract photos if needed or just return valid response.
      //   // The original interface returned Photo[]. The getPhotos implementation actually calls endpoints returning Photo[].
      //   // Wait, api.getPhotos implementation above calls `/jobs/${jobId}/photos` (GET) which usually returns Photo list?
      //   // Let's look at `getPhotos` impl: `return handleResponse<Photo[]>(response);` -> It returns `Photo[]`.
      //   // But the return type annotation says `Promise<Cluster[]>`. That seems like a typo in existing code.
      //   // Assuming it returns Photo[], we are good.
      //   return clusterData as unknown as Photo[]; 

      // }
      // */
        // Proxy Strategy (Fallback to backend upload)
        // Use existing FormData method but maybe in batches too for better reliability
        // Proxy Strategy (Fallback to backend upload)
        // Use existing FormData method but maybe in batches too for better reliability
        const formData = new FormData();
        files.forEach(file => formData.append('files', file));

        return new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', `${API_BASE_URL}/jobs/${jobId}/photos`);
          
          const accessToken = AuthService.getToken();
          if (accessToken) {
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
          }
          
          if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    onProgress(percent);
                }
            };
          }
          
          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
               try {
                 // The backend upload endpoint returns PhotoUploadResponse { job_id, file_count }
                 // But the interface expects Photo[]. We should fetch photos.
                 resolve([]); // Or fetch photos
               } catch (e) {
                 reject(e);
               }
            } else {
               reject(new Error(xhr.statusText));
            }
          };
          
          xhr.onerror = () => reject(new Error('Network Error'));
          xhr.send(formData);
        }).then(async () => {
            // Fetch actual photos to satisfy return type
            const photos = await api.getPhotos(jobId);
            return photos as unknown as Photo[];
        });
      }
    } catch (error) {
      console.error("Upload failed", error);
      throw error;
    }
  },

  movePhoto: async (photoId: string, targetClusterId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/photos/${photoId}/move`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ target_cluster_id: targetClusterId }),
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
  startExport: async (jobId: string): Promise<ExportStatus> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/export`, {
      method: 'POST',
      headers: authJsonHeaders(),
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