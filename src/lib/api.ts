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

  syncClusters: async (jobId: string, clusters: Cluster[]): Promise<void> => {
    const payload = {
      clusters: clusters.map(c => ({
        id: c.id,
        name: c.name,
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
  getUploadUrls: async (jobId: string, files: { filename: string; content_type: string }[]): Promise<{ strategy: string; urls: { filename: string; upload_url: string | null; storage_path: string }[] }> => {
    const fileInfos = files.map(f => ({ filename: f.filename, content_type: f.content_type }));
    console.log("calling presigned with:", fileInfos);
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/photos/presigned`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(fileInfos),
    });
    console.log("calling presigned with:", response);
    return handleResponse(response);
  },

  notifyUploadComplete: async (jobId: string, uploadedFiles: { filename: string; storage_path: string }[]): Promise<Photo[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/photos/complete`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify(uploadedFiles),
    });
    return []; 
  },

  uploadPhotos: async (jobId: string, files: File[], onProgress?: (percent: number) => void): Promise<Photo[]> => {
    try {
      const totalFiles = files.length;
      let completedFiles = 0;

      const updateProgress = () => {
        if (onProgress) {
          const percent = Math.round((completedFiles / totalFiles) * 100);
          onProgress(percent);
        }
      };

      // Task Queue Pattern with Concurrency Limit
      const MAX_CONCURRENCY = 3; 
      
      // We'll manage a queue of file indices
      const queue = files.map((file, index) => ({ file, index }));
      
      const worker = async () => {
        while (queue.length > 0) {
          const item = queue.shift();
          if (!item) break;
          const { file } = item;

          try {
            // 1. Compression (Individual)
            let fileToUpload = file;
            if (isJPEGFile(file)) {
               try {
                 fileToUpload = await compressImage(file);
               } catch (e) {
                 console.warn(`Compression failed for ${file.name}, uploading original.`);
               }
            }

            // 2. Upload (Individual)
            // Try Presigned URL Strategy First
            let uploadedViaPresigned = false;
            try {
              const fileInfo = [{ filename: file.name, content_type: fileToUpload.type }];
              const { strategy, urls } = await api.getUploadUrls(jobId, fileInfo);

              if (strategy === 'presigned' && urls.length === 1 && urls[0].upload_url) {
                 await fetch(urls[0].upload_url, {
                    method: 'PUT',
                    body: fileToUpload,
                    headers: { 'Content-Type': fileToUpload.type }
                 });
                 
                 await api.notifyUploadComplete(jobId, [{
                    filename: urls[0].filename,
                    storage_path: urls[0].storage_path
                 }]);
                 uploadedViaPresigned = true;
              }
            } catch (err) {
               console.warn("Presigned upload failed, falling back to server upload", err);
            }

            // Fallback to Server Upload
            if (!uploadedViaPresigned) {
              const formData = new FormData();
              // Use original filename
              formData.append('files', fileToUpload, file.name);

              await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API_BASE_URL}/jobs/${jobId}/photos`);
                const accessToken = AuthService.getToken();
                if (accessToken) xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                xhr.onload = () => (xhr.status >= 200 && xhr.status < 300) ? resolve(undefined) : reject(new Error(xhr.statusText));
                xhr.onerror = () => reject(new Error('Network Error'));
                xhr.send(formData);
              });
            }
          } catch (error) {
             console.error(`Failed to process file ${file.name}`, error);
             // Continue processing other files even if one fails
          } finally {
            completedFiles++;
            updateProgress();
          }
        }
      };

      const workers = Array(Math.min(files.length, MAX_CONCURRENCY))
        .fill(null)
        .map(() => worker());

      await Promise.all(workers);

      const photos = await api.getPhotos(jobId);
      return photos as unknown as Photo[];

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