import { Job, Cluster, Member, ExportStatus, Photo, FileResponse, JobStatusResponse } from '@/types';
import { AuthService } from './auth';
import { compressImage, isJPEGFile } from './image'; // Import isJPEGFile
import { uploadViaResumable, uploadViaPresigned, uploadViaServer } from '@/lib/uploadStrategies';
import pLimit from 'p-limit';

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
  // Check for auto-refreshed token in headers
  const authHeader = response.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    AuthService.setToken(authHeader.replace('Bearer ', ''));
  }

  if (response.status === 401) {
    AuthService.logout();
    throw new Error('Unauthorized');
  }

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
  startClustering: async (jobId: string): Promise<JobStatusResponse> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/clustering/start`, {
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

  updateCluster: async (jobId: string, clusterId: string, data: { name?: string; order_index?: number }): Promise<Cluster> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/clusters/${clusterId}`, {
      method: 'PUT',
      headers: authJsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Cluster>(response);
  },

  deleteCluster: async (jobId: string, clusterId: string): Promise<Cluster[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/clusters/${clusterId}`, {
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
      headers: {
        ...authJsonHeaders(),
        'Origin': window.location.origin, // Add Origin header
      },
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

  uploadPhotos: async (jobId: string, files: File[], onProgressTotal?: (percent: number) => void): Promise<void> => {
    // -------------------------------------------------------------------------
    // Performance Strategy for 500 photos / 30s
    // 1. Pipeline: Compression -> Upload
    // 2. High Concurrency: ~30 uploads (network bound), ~8 compressions (CPU bound)
    // 3. Batching: Fetch URLs in bulk, Notify completion in chunks
    // -------------------------------------------------------------------------
    
    const UPLOAD_CONCURRENCY = 30; 
    const COMPRESSION_CONCURRENCY = 8;
    const URL_BATCH_SIZE = 50; 
    const NOTIFY_BATCH_SIZE = 20;

    const totalFiles = files.length;
    const fileProgressMap = new Map<string, number>();

    const updateGlobalProgress = () => {
      if (!onProgressTotal) return;
      let totalPercent = 0;
      fileProgressMap.forEach((p) => (totalPercent += p));
      onProgressTotal(Math.round(totalPercent / totalFiles));
    };

    // Prepare items with indices to preserve order and unique tracking
    const items = files.map((file, index) => ({
      file,
      index,
      compressedFile: file,
      urlInfo: null as any
    }));

    // 1. Fetch URLs (Batched)
    const urlLimit = pLimit(5); // Limit concurrent metadata requests
    const chunks = [];
    for (let i = 0; i < items.length; i += URL_BATCH_SIZE) {
      chunks.push(items.slice(i, i + URL_BATCH_SIZE));
    }

    await Promise.all(chunks.map(chunk => urlLimit(async () => {
      try {
        const fileInfos = chunk.map(item => ({ 
          filename: item.file.name, 
          content_type: item.file.type 
        }));
        
        // Assume all are presigned strategy for now, or fallback later
        const response = await api.getUploadUrls(jobId, fileInfos);
        
        if (response && response.urls && response.urls.length === chunk.length) {
            chunk.forEach((item, i) => {
                item.urlInfo = response.urls[i];
            });
        }
      } catch (e) {
        console.error("Failed to fetch upload URLs for batch", e);
      }
    })));

    // 2. Pipeline Execution
    const uploadLimit = pLimit(UPLOAD_CONCURRENCY);
    const compressionLimit = pLimit(COMPRESSION_CONCURRENCY);
    const notifyLimit = pLimit(1); // Serializer for notifications
    
    let pendingNotifications: { filename: string; storage_path: string }[] = [];

    const flushNotifications = async () => {
        await notifyLimit(async () => {
            if (pendingNotifications.length === 0) return;
            const batch = [...pendingNotifications];
            pendingNotifications = [];
            try {
                await api.notifyUploadComplete(jobId, batch);
            } catch (e) {
                console.warn("Notification batch failed", e);
            }
        });
    };

    await Promise.all(items.map(async (item) => {
        // Skip if URL fetch failed (or handle fallback here? strict for now)
        if (!item.urlInfo) return;

        fileProgressMap.set(String(item.index), 0);

        try {
            // A. Compress
            if (isJPEGFile(item.file)) {
                await compressionLimit(async () => {
                    try {
                        item.compressedFile = await compressImage(item.file);
                    } catch (e) {
                        console.warn(`Compression failed for ${item.file.name}, using original.`);
                    }
                });
            }

            // B. Upload
            await uploadLimit(async () => {
                const { upload_url, filename, storage_path } = item.urlInfo;
                
                const onProgress = (p: number) => {
                    fileProgressMap.set(String(item.index), p);
                    updateGlobalProgress();
                };

                if (upload_url) {
                    await uploadViaPresigned(item.compressedFile, upload_url, onProgress);
                } else {
                    // Fallback
                     await uploadViaServer(jobId, item.compressedFile, filename, onProgress);
                }

                // C. Queue Notification
                await notifyLimit(async () => {
                    pendingNotifications.push({ filename, storage_path });
                });
                
                if (pendingNotifications.length >= NOTIFY_BATCH_SIZE) {
                    flushNotifications(); // Fire and forget
                }
            });
        } catch (e) {
            console.error(`Upload failed for ${item.file.name}`, e);
        }
    }));

    // Final flush
    await flushNotifications();
  },

  // uploadPhotos: async (jobId: string, files: File[], onProgressTotal?: (percent: number) => void): Promise<Photo[]> => {
  //   try {
  //     const BATCH_SIZE = 5; // Chunk size for processing
  //     const totalFiles = files.length;
  //     const fileProgressMap = new Map<string, number>();

  //     const updateGlobalProgress = () => {
  //       if (!onProgressTotal) return;
  //       let totalPercent = 0;
  //       fileProgressMap.forEach((p) => (totalPercent += p));
  //       onProgressTotal(Math.round(totalPercent / totalFiles));
  //     };

  //     // Helper to split array into chunks
  //     const chunks: File[][] = [];
  //     for (let i = 0; i < totalFiles; i += BATCH_SIZE) {
  //       chunks.push(files.slice(i, i + BATCH_SIZE));
  //     }

  //     for (const chunk of chunks) {
  //       // ---------------------------------------------------------
  //       // Step 1: Compress Chunk (Parallel)
  //       // ---------------------------------------------------------
  //       const compressedItems = await Promise.all(
  //         chunk.map(async (file) => {
  //           fileProgressMap.set(file.name, 0); // Init progress
  //           let fileToUpload = file;
  //           if (isJPEGFile(file)) {
  //             try {
  //               fileToUpload = await compressImage(file);
  //             } catch (e) {
  //               console.warn(`Compression failed for ${file.name}, using original.`);
  //             }
  //           }
  //           return { originalFile: file, fileToUpload };
  //         })
  //       );

  //       // ---------------------------------------------------------
  //       // Step 2: Get URLs for Chunk (Batch Request)
  //       // ---------------------------------------------------------
  //       let strategy = 'proxy';
  //       let urls: any[] = []; // Explicitly typed as any[] because response.urls structure is dynamic

  //       try {
  //         const fileInfos = compressedItems.map(({ fileToUpload }) => ({
  //           filename: fileToUpload.name,
  //           content_type: fileToUpload.type,
  //         }));

  //         const response = await api.getUploadUrls(jobId, fileInfos);

  //         if (response && response.strategy && response.urls.length === chunk.length) {
  //           strategy = response.strategy;
  //           urls = response.urls;
  //         } else {
  //           console.warn("Invalid URL response (length mismatch), falling back to server upload.");
  //         }
  //       } catch (e) {
  //         console.warn("Failed to get upload URLs, falling back to server upload.", e);
  //         strategy = 'proxy';
  //       }

  //       // ---------------------------------------------------------
  //       // Step 3: Upload Chunk (Parallel) & Notify
  //       // ---------------------------------------------------------
  //       const successfulUploads: { filename: string; storage_path: string }[] = [];

  //       await Promise.all(
  //         compressedItems.map(async (item, index) => {
  //           const { originalFile, fileToUpload } = item;
  //           const urlInfo = urls[index]; // Can be undefined if fallback

  //           const currentProgressCallback = (p: number) => {
  //             fileProgressMap.set(originalFile.name, p);
  //             updateGlobalProgress();
  //           };

  //           try {
  //             if (strategy === 'resumable' && urlInfo?.upload_url) {
  //               // 1. Resumable (GCS Session URL)
  //               await uploadViaResumable(fileToUpload, urlInfo.upload_url, currentProgressCallback);
  //               successfulUploads.push({
  //                 filename: urlInfo.filename,
  //                 storage_path: urlInfo.storage_path,
  //               });
  //             } else if (strategy === 'presigned' && urlInfo?.upload_url) {
  //               // 2. Presigned (Single PUT)
  //               await uploadViaPresigned(fileToUpload, urlInfo.upload_url, currentProgressCallback);
  //               successfulUploads.push({
  //                 filename: urlInfo.filename,
  //                 storage_path: urlInfo.storage_path,
  //               });
  //             } else {
  //               // 3. Fallback (Server Proxy)
  //               await uploadViaServer(jobId, fileToUpload, originalFile.name, currentProgressCallback);
  //             }
  //           } catch (error) {
  //             console.error(`Failed to upload ${originalFile.name} via ${strategy}`, error);
  //             // Continue with other files even if one fails
  //           }
  //         })
  //       );

  //       // ---------------------------------------------------------
  //       // Step 4: Notify Completion for Chunk (Batch)
  //       // ---------------------------------------------------------
  //       if (successfulUploads.length > 0 && (strategy === 'resumable' || strategy === 'presigned')) {
  //         try {
  //           await api.notifyUploadComplete(jobId, successfulUploads);
  //         } catch (e) {
  //           console.error("Failed to notify upload batch", e);
  //         }
  //       }
  //     }
  //     return 
  //   } catch (error) {
  //     console.error("Fatal error in upload process", error);
  //     throw error;
  //   }
  // },

  updatePhoto: async (jobId: string, members: Member[]): Promise<Member> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/cluster_members`, {
      method: 'PUT',
      headers: authJsonHeaders(),
      body: JSON.stringify({ members }),
    });
    return handleResponse<Member>(response);
  },

  deletePhoto: async (jobId: string, photoId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/photos/${photoId}`, {
      method: 'DELETE',
      headers: authJsonHeaders(),
    });
    return handleResponse<void>(response);
  },

  deleteClusterMember: async (jobId: string, clusterMemberId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/jobs/${jobId}/cluster_members/${clusterMemberId}`, {
      method: 'DELETE',
      headers: authJsonHeaders(),
    });
    return handleResponse<void>(response);
  },
  // Export
  startExport: async (jobId: string, metadata?: { cover_title?: string, cover_company_name?: string, labels?: { visible_keys: string[], overrides: Record<string, string> } }): Promise<ExportStatus> => {
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