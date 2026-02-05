import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useJobActions } from './useJobActions';
import { api } from '@/lib/api';
import { Cluster, Photo, Member } from '@/types';
import { toast } from 'sonner';

// Mock api
vi.mock('@/lib/api', () => ({
  api: {
    updatePhoto: vi.fn(),
    createCluster: vi.fn(),
    deleteCluster: vi.fn(),
    deleteClusterMember: vi.fn(),
    updateCluster: vi.fn(),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useJobActions', () => {
  const jobId = 'test-job-id';
  let clusters: Cluster[];
  let setClusters: ReturnType<typeof vi.fn>;
  let selectedPhotos: { id: string; clusterId: string }[];
  let setSelectedPhotos: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Initial data
    clusters = [
      {
        id: 'cluster-1',
        name: 'Cluster 1',
        order_index: 0,
        photos: [
          { id: 'photo-1', cluster_id: 'cluster-1', order_index: 0, url: 'url1' } as any,
          { id: 'photo-2', cluster_id: 'cluster-1', order_index: 1, url: 'url2' } as any,
        ],
      },
      {
        id: 'cluster-2',
        name: 'Cluster 2',
        order_index: 1,
        photos: [],
      },
    ];
    setClusters = vi.fn((update) => {
        if (typeof update === 'function') {
            clusters = update(clusters);
        } else {
            clusters = update;
        }
    });
    
    selectedPhotos = [];
    setSelectedPhotos = vi.fn((update) => {
        if (typeof update === 'function') {
            selectedPhotos = update(selectedPhotos);
        } else {
            selectedPhotos = update;
        }
    });
  });

  it('handleMovePhoto should update state and call api', async () => {
    const { result } = renderHook(() => useJobActions({ jobId, clusters, setClusters, selectedPhotos, setSelectedPhotos }));

    (api.updatePhoto as any).mockResolvedValue({});

    await act(async () => {
      await result.current.handleMovePhoto('photo-1', 'cluster-1', 'cluster-2', 0);
    });

    // Check if setClusters was called to reflect the move
    expect(setClusters).toHaveBeenCalled();
    
    // Check if API was called
    expect(api.updatePhoto).toHaveBeenCalledWith(jobId, expect.arrayContaining([
        expect.objectContaining({ id: 'photo-1', cluster_id: 'cluster-2' })
    ]));
  });

  it('handleCreateCluster should create a new cluster and update state', async () => {
    const { result } = renderHook(() => useJobActions({ jobId, clusters, setClusters, selectedPhotos, setSelectedPhotos }));

    const newCluster: Cluster = {
      id: 'new-cluster',
      name: 'New Cluster',
      order_index: 2,
      photos: [],
    };
    (api.createCluster as any).mockResolvedValue(newCluster);

    await act(async () => {
      await result.current.handleCreateCluster(2, []);
    });

    expect(api.createCluster).toHaveBeenCalledWith(jobId, expect.any(String), 2, []);
    expect(setClusters).toHaveBeenCalled();
    expect(toast.success).toHaveBeenCalled();
  });

  it('handleDeletePhoto should remove photo and call api', async () => {
    const { result } = renderHook(() => useJobActions({ jobId, clusters, setClusters, selectedPhotos, setSelectedPhotos }));
    
    (api.deleteClusterMember as any).mockResolvedValue({});

    await act(async () => {
      await result.current.handleDeletePhoto('photo-1', 'cluster-1');
    });

    expect(setClusters).toHaveBeenCalled();
    expect(api.deleteClusterMember).toHaveBeenCalledWith(jobId, 'photo-1');
  });

  it('handleMoveCluster should reorder clusters', async () => {
    const { result } = renderHook(() => useJobActions({ jobId, clusters, setClusters, selectedPhotos, setSelectedPhotos }));

    (api.updateCluster as any).mockResolvedValue({});

    await act(async () => {
      // Move cluster-2 up (to index 0 area)
      await result.current.handleMoveCluster('cluster-2', 'up');
    });

    expect(setClusters).toHaveBeenCalled();
    expect(api.updateCluster).toHaveBeenCalledWith(jobId, 'cluster-2', expect.objectContaining({ order_index: expect.any(Number) }));
  });
});
