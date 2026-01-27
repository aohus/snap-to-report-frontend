import { Job, Cluster, Member, ExportStatus, Photo, FileResponse, JobStatusResponse, Plan, Subscription, Site } from '@/types';
import { AuthService } from './auth';
import { compressImage, isJPEGFile } from './image'; // Import isJPEGFile
import { uploadViaResumable, uploadViaPresigned, uploadViaServer } from '@/lib/uploadStrategies';
import { useUploadStore } from './uploadStore';
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
  // Site Management
  getSites: async (): Promise<Site[]> => {
    const response = await fetch(`${API_BASE_URL}/sites`, {
      headers: authJsonHeaders(),
    });
    return handleResponse<Site[]>(response);
  },

  createSite: async (name: string, description?: string): Promise<Site> => {
    const response = await fetch(`${API_BASE_URL}/sites`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ name, description }),
    });
    return handleResponse<Site>(response);
  },

  updateSite: async (siteId: string, data: { name?: string; description?: string }): Promise<Site> => {
    const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
      method: 'PATCH',
      headers: authJsonHeaders(),
      body: JSON.stringify(data),
    });
    return handleResponse<Site>(response);
  },

  deleteSite: async (siteId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/sites/${siteId}`, {
      method: 'DELETE',
      headers: authJsonHeaders(),
    });
    return handleResponse<void>(response);
  },

  addJobsToSite: async (siteId: string, jobIds: string[]): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/sites/${siteId}/jobs`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ job_ids: jobIds }),
    });
    return handleResponse<void>(response);
  },

  removeJobFromSite: async (siteId: string, jobId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/sites/${siteId}/jobs/${jobId}`, {
      method: 'DELETE',
      headers: authJsonHeaders(),
    });
    return handleResponse<void>(response);
  },

  // Job Management
  getJobs: async (): Promise<Job[]> => {
    const response = await fetch(`${API_BASE_URL}/jobs`, {
      headers: authJsonHeaders(),
    });
    return handleResponse<Job[]>(response);
  },

  createJob: async (title: string, construction_type?: string, company_name?: string, site_id?: string): Promise<Job> => {
    const body: { title: string; construction_type?: string; company_name?: string; site_id?: string } = { title };
    if (construction_type) body.construction_type = construction_type;
    if (company_name) body.company_name = company_name;
    if (site_id) body.site_id = site_id;

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

  uploadPhotos: async (jobId: string, files: File[]): Promise<void> => {
    const UPLOAD_CONCURRENCY = 15; // 안정적인 네트워크 처리를 위해 조정
    const COMPRESSION_CONCURRENCY = 8;
    const URL_BATCH_SIZE = 50; 
    const NOTIFY_BATCH_SIZE = 20;

    const store = useUploadStore.getState();
    if (files.length > 0) {
      store.addFiles(files);
    }
    store.setUploading(true);

    const { items: currentItems, itemIds } = useUploadStore.getState();
    const itemsToProcess = itemIds
      .filter(id => currentItems[id].status === 'pending')
      .map(id => ({
        id,
        file: currentItems[id].file,
        compressedFile: currentItems[id].file,
        urlInfo: null as any
      }));

    if (itemsToProcess.length === 0) {
      store.setUploading(false);
      return;
    }

    // 1. Fetch URLs (Batched)
    const urlLimit = pLimit(5);
    const chunks = [];
    for (let i = 0; i < itemsToProcess.length; i += URL_BATCH_SIZE) {
      chunks.push(itemsToProcess.slice(i, i + URL_BATCH_SIZE));
    }

    await Promise.all(chunks.map(chunk => urlLimit(async () => {
      try {
        const fileInfos = chunk.map(item => ({ 
          filename: item.file.name, 
          content_type: item.file.type 
        }));
        
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
    const notifyLimit = pLimit(1);
    
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

    await Promise.all(itemsToProcess.map(async (item) => {
        if (!item.urlInfo) {
          store.updateItem(item.id, { status: 'failed', error: 'Failed to get upload URL' });
          return;
        }

        // A. Compress (Parallel)
        if (isJPEGFile(item.file)) {
            store.updateItem(item.id, { status: 'compressing' });
            await compressionLimit(async () => {
                try {
                    item.compressedFile = await compressImage(item.file);
                } catch (e) {
                    console.warn(`Compression failed for ${item.file.name}, using original.`);
                }
            });
        }

        // B. Upload (Parallel)
        return uploadLimit(async () => {
            store.updateItem(item.id, { status: 'uploading' });
            const { upload_url, filename, storage_path } = item.urlInfo;
            
            // Throttled Progress Update
            let lastUpdate = 0;
            const onProgress = (p: number) => {
                const now = Date.now();
                // 200ms 마다 또는 100%일 때만 업데이트하여 렌더링 부하 방지
                if (now - lastUpdate > 200 || p === 100) {
                    store.updateItem(item.id, { progress: p });
                    lastUpdate = now;
                }
            };

            try {
                if (upload_url) {
                    await uploadViaPresigned(item.compressedFile, upload_url, onProgress);
                } else {
                    await uploadViaServer(jobId, item.compressedFile, filename, onProgress);
                }

                store.updateItem(item.id, { status: 'completed', progress: 100 });

                await notifyLimit(async () => {
                    pendingNotifications.push({ filename, storage_path });
                });
                
                if (pendingNotifications.length >= NOTIFY_BATCH_SIZE) {
                    flushNotifications();
                }
            } catch (e) {
                console.error(`Upload failed for ${item.file.name}`, e);
                store.updateItem(item.id, { status: 'failed', error: String(e) });
            }
        });
    }));

    await flushNotifications();
    store.setUploading(false);
  },

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
  },

  // Subscription
  getPlans: async (): Promise<Plan[]> => {
    const response = await fetch(`${API_BASE_URL}/subscriptions/plans`, {
      headers: authJsonHeaders(),
    });
    return handleResponse<Plan[]>(response);
  },

  getMySubscription: async (): Promise<Subscription | null> => {
    const response = await fetch(`${API_BASE_URL}/subscriptions/me`, {
      headers: authJsonHeaders(),
    });
    // Handle 404 for no subscription gracefully if possible, 
    // but handleResponse throws error. We will catch it in component.
    return handleResponse<Subscription>(response);
  },

  subscribe: async (planId: string, paymentMethodId: string): Promise<Subscription> => {
    const response = await fetch(`${API_BASE_URL}/subscriptions/subscribe`, {
      method: 'POST',
      headers: authJsonHeaders(),
      body: JSON.stringify({ plan_id: planId, payment_method_id: paymentMethodId }),
    });
    return handleResponse<Subscription>(response);
  },

  cancelSubscription: async (): Promise<Subscription> => {
    const response = await fetch(`${API_BASE_URL}/subscriptions/cancel`, {
      method: 'POST',
      headers: authJsonHeaders(),
    });
    return handleResponse<Subscription>(response);
  }
};