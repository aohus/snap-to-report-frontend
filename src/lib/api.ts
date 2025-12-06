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

  syncClusters: async (jobId: string, clusters: Cluster[]): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/clusters/sync`, {
      method: 'PUT',
      headers: authJsonHeaders(),
      body: JSON.stringify(clusters),
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
      // 1. Get Upload URLs (Required for initialization)
      // await api.getUploadUrls(jobId, files);
      
      const totalFiles = files.length;
      let completedFiles = 0;

      const updateProgress = () => {
        if (onProgress) {
          const percent = Math.round((completedFiles / totalFiles) * 100);
          onProgress(percent);
        }
      };

      // Optimization: Parallel Batch Uploads
      // We use a queue-based worker pattern to limit concurrency while maximizing throughput.
      const BATCH_SIZE = 5;
      const MAX_CONCURRENCY = 3; // Limit parallel requests to avoid browser stalling

      // Create all batches first
      const batches: File[][] = [];
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        batches.push(files.slice(i, i + BATCH_SIZE));
      }

      // Worker function to process batches from the queue
      const uploadWorker = async () => {
        while (batches.length > 0) {
          const batch = batches.shift();
          if (!batch) break;

          // Conditionally compress images before upload to improve speed, only for JPEGs
          const compressedBatch = await Promise.all(
            batch.map(async (file) => {
              try {
                if (isJPEGFile(file)) { // Only compress if it's a JPEG
                  return await compressImage(file);
                } else {
                  console.log(`Skipping compression for non-JPEG file: ${file.name}`);
                  return file; // Return original file if not JPEG
                }
              } catch (error) {
                console.warn(`Compression failed for ${file.name}, uploading original.`, error);
                return file;
              }
            })
          );

          let uploadedViaPresigned = false;

          // Try Presigned URL Strategy First
          try {
            // Use original filenames but compressed file types for requesting upload URLs
            const fileInfos = compressedBatch.map((f, i) => ({
              filename: batch[i].name,
              content_type: f.type,
            }));

            const { strategy, urls } = await api.getUploadUrls(jobId, fileInfos);
            console.log("PRESIGNED RESPONSE:", { strategy, urls });

            if (strategy === 'presigned' && urls.length === compressedBatch.length) {
              // Upload directly to storage (S3/GCS)
              await Promise.all(compressedBatch.map((file, idx) => {
                const urlInfo = urls[idx];
                if (!urlInfo.upload_url) throw new Error('Missing upload URL');
                
                return fetch(urlInfo.upload_url, {
                  method: 'PUT',
                  body: file,
                  headers: {
                    'Content-Type': file.type, // Important for some providers
                  }
                });
              }));

              // Notify backend of completion
              await api.notifyUploadComplete(jobId, urls.map(u => ({
                filename: u.filename,
                storage_path: u.storage_path
              })));
              
              uploadedViaPresigned = true;
            }
          } catch (error) {
            console.warn("Presigned upload failed, falling back to server upload:", error);
            // Fallthrough to standard upload
          }
          
          if (!uploadedViaPresigned) {
            const formData = new FormData();
            // Explicitly use original filename (batch[i].name) because compressed file might have 'blob' or different name
            compressedBatch.forEach((file, i) => formData.append('files', file, batch[i].name));
            
            try {
              await new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open('POST', `${API_BASE_URL}/jobs/${jobId}/photos`);
                
                const accessToken = AuthService.getToken();
                if (accessToken) {
                  xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
                }
                
                xhr.onload = () => {
                  if (xhr.status >= 200 && xhr.status < 300) {
                     resolve(undefined);
                  } else {
                     reject(new Error(xhr.statusText));
                  }
                };
                
                xhr.onerror = () => reject(new Error('Network Error'));
                xhr.send(formData);
              });
            } catch (error) {
              // If one batch fails, we re-throw to stop the process or handle retry logic.
              throw error;
            }
          }

          completedFiles += batch.length;
          updateProgress();
        }
      };

      // Start workers
      const workers = Array(Math.min(batches.length, MAX_CONCURRENCY))
        .fill(null)
        .map(() => uploadWorker());

      await Promise.all(workers);

      // After all batches, fetch actual photos to satisfy return type
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