import { useState, useCallback } from 'react';
import { api } from '@/lib/api';
import { Cluster, Photo } from '@/types';
import { toast } from 'sonner';
import { sortPhotosByOrderIndex } from '@/lib/utils';

interface UseJobActionsProps {
  jobId: string;
  jobTitle?: string;
  clusters: Cluster[];
  setClusters: React.Dispatch<React.SetStateAction<Cluster[]>>;
  selectedPhotos: { id: string; clusterId: string }[];
  setSelectedPhotos: React.Dispatch<React.SetStateAction<{ id: string; clusterId: string }[]>>;
}

export function useJobActions({
  jobId,
  jobTitle,
  clusters,
  setClusters,
  selectedPhotos,
  setSelectedPhotos,
}: UseJobActionsProps) {
  const [saving, setSaving] = useState(false);

  const handleDeleteCluster = useCallback(async (clusterId: string) => {
    setClusters(prev => {
        const clusterToDelete = prev.find(c => c.id === clusterId);
        if (!clusterToDelete) return prev;
        
        let newClusters = prev.filter(c => c.id !== clusterId);
        
        newClusters = newClusters.map(c => {
            if (c.order_index > clusterToDelete.order_index) {
                return { ...c, order_index: c.order_index - 1 };
            }
            return c;
        });
        
        return newClusters;
    });

    setSaving(true);
    try {
        await api.deleteCluster(jobId, clusterId);
    } catch (e) {
        console.error("Failed to delete cluster", e);
        toast.error("Failed to delete cluster");
    } finally {
        setSaving(false);
    }
  }, [jobId, setClusters]);

  const handleMovePhoto = useCallback(async (photoId: string, sourceClusterId: string, targetClusterId: string, newIndex: number) => {
    let realTargetClusterId = targetClusterId;
    let createdReserveCluster: Cluster | null = null;
    
    // Find photo in current state (to avoid stale closures, but we rely on 'clusters' prop being fresh or we use functional updates cautiously)
    // Actually, 'clusters' prop might be stale if the callback isn't recreated. 
    // Ideally we use setClusters(prev => ...) for all logic.
    
    // But we need to make API calls with the moved photo data.
    // So we need access to the data. 
    // We will trust `clusters` prop is fresh if `useJobActions` is re-rendered or we use the functional update to derive the API payload (tricky).
    
    // Better: Calculate everything inside setClusters, and return the necessary data for API call? 
    // No, setClusters returns void.
    
    // Compromise: We use the `clusters` from the closure, assuming dependency array is correct.
    
    const sourceCluster = clusters.find(c => c.id === sourceClusterId);
    if (!sourceCluster) return;
    const movedPhoto = sourceCluster.photos.find(p => p.id === photoId);
    if (!movedPhoto) return;

    const photoToUpdate = { ...movedPhoto, cluster_id: targetClusterId };

    if (targetClusterId === 'reserve') {
        const existingReserve = clusters.find(c => c.name === 'reserve');
        if (existingReserve) {
            realTargetClusterId = existingReserve.id;
            photoToUpdate.cluster_id = existingReserve.id;
        } else {
            try {
                createdReserveCluster = await api.createCluster(jobId, 'reserve', -1, []);
                createdReserveCluster.photos = []; 
                realTargetClusterId = createdReserveCluster.id;
                photoToUpdate.cluster_id = createdReserveCluster.id;
            } catch (e) {
                console.error("Failed to create reserve cluster", e);
                toast.error("Failed to move to reserve");
                return;
            }
        }
    } else {
      photoToUpdate.cluster_id = realTargetClusterId;
    }

    setClusters(prev => {
        const currentClusters = createdReserveCluster 
            ? [...prev, createdReserveCluster] 
            : [...prev];

        const newClusters = currentClusters.map(c => ({...c, photos: [...c.photos]}));
        
        const sCluster = newClusters.find(c => c.id === sourceClusterId);
        const tCluster = newClusters.find(c => c.id === realTargetClusterId);

        if (!sCluster || !tCluster) return prev;

        const photoIndex = sCluster.photos.findIndex(p => p.id === photoId);
        if (photoIndex === -1) return prev;
        
        const [photo] = sCluster.photos.splice(photoIndex, 1);
        tCluster.photos.splice(newIndex, 0, photo);

        return newClusters;
    });
    
    setSaving(true);
    try {
        await api.updatePhoto(jobId, [photoToUpdate]);

        // Check if source cluster became empty
        // We need to check the *state after update*. 
        // We can approximate by checking if sourceCluster.photos.length was 1.
        if (sourceCluster.photos.length === 1 && sourceCluster.name !== 'reserve') {
             await handleDeleteCluster(sourceClusterId);
        }
    } catch (e) {
        console.error("Failed to move photo", e);
        toast.error("Failed to save move");
    } finally {
        setSaving(false);
    }
  }, [jobId, clusters, setClusters, handleDeleteCluster]);

  const handleCreateCluster = useCallback(async (orderIndex: number, photosToMoveParam: { id: string; clusterId: string }[] = []) => {
    const prevClusters = clusters; 
    const prevSelectedPhotos = selectedPhotos; 

    const photoIds = photosToMoveParam.map(p => p.id);
    const fullPhotosToMove: Photo[] = photosToMoveParam.map(p => {
        return clusters.flatMap(cl => cl.photos).find(photo => photo.id === p.id) || p as any; 
    });

    try {
      setClusters(prev => {
        const optimisticClusters = prev.map(c => {
            let updatedCluster = { ...c };
            if (c.order_index >= orderIndex) {
                updatedCluster.order_index += 1;
            }
            const photosToRemoveFromHere = photosToMoveParam.filter(p => p.clusterId === c.id).map(p => p.id);
            if (photosToRemoveFromHere.length > 0) {
                updatedCluster.photos = c.photos.filter(p => !photosToRemoveFromHere.includes(p.id.toString()));
            }
            return updatedCluster;
        });
        return optimisticClusters;
      });

      const newClusterResponse = await api.createCluster(jobId, `${jobTitle || 'New Cluster'}`, orderIndex, photoIds);
      const newClusterWithPhotos = { ...newClusterResponse, photos: sortPhotosByOrderIndex(fullPhotosToMove) };

      setClusters(prev => {
          // We need to re-apply the new cluster to the latest state (which should match optimistic, but safer to append/sort)
          // Actually, we should just insert it.
          // The previous setClusters did the shifting.
          // So just appending and sorting should work.
          return [...prev, newClusterWithPhotos].sort((a, b) => a.order_index - b.order_index);
      });
      
      setSelectedPhotos([]); 
      toast.success(`New place created with ${photoIds.length} photos.`);
    } catch (error) {
      console.error("Failed to create new place", error);
      toast.error('Failed to create new place');
      setClusters(prevClusters); 
      setSelectedPhotos(prevSelectedPhotos); 
    }
  }, [jobId, jobTitle, clusters, setClusters, selectedPhotos, setSelectedPhotos]);

  const handleDeletePhoto = useCallback(async (photoId: string, clusterId: string) => {
    setClusters(prev => prev.map(c => {
        if (c.id === clusterId) {
            return { ...c, photos: c.photos.filter(p => p.id.toString() !== photoId.toString()) };
        }
        return c;
    }));
    
    setSaving(true);
    try {
        await api.deleteClusterMember(jobId, photoId);
    } catch (e) {
        console.error("Failed to delete photo", e);
        toast.error("Failed to delete photo");
    } finally {
        setSaving(false);
    }
  }, [jobId, setClusters]);

  const handleRenameCluster = useCallback(async (clusterId: string, newName: string) => {
    setClusters(prev => prev.map(c => c.id === clusterId ? { ...c, name: newName } : c));
    
    setSaving(true);
    try {
        await api.updateCluster(jobId, clusterId, { name: newName });
    } catch (e) {
        console.error("Failed to rename cluster", e);
        toast.error("Failed to rename cluster");
    } finally {
        setSaving(false);
    }
  }, [jobId, setClusters]);

  const handleMoveCluster = useCallback(async (clusterId: string, direction: 'up' | 'down') => {
    const currentIndex = clusters.findIndex(c => c.id === clusterId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= clusters.length) return;

    let newOrderIndex: number = 0;
    
    // We calculate newOrderIndex based on CURRENT state
    const targetCluster = clusters[targetIndex];
    if (!targetCluster) return; // Should not happen given check above

    // This logic relies on `clusters` being up to date.
    const prevCluster = clusters[targetIndex - 1]; // relative to NEW position
    const nextCluster = clusters[targetIndex + 1]; // relative to NEW position (wait, indices shift)
    
    // Re-calculation logic copied from Dashboard:
    // It constructed `newClusters` array first.
    const tempClusters = [...clusters];
    const [movedCluster] = tempClusters.splice(currentIndex, 1);
    tempClusters.splice(targetIndex, 0, movedCluster);
    
    const pCluster = tempClusters[targetIndex - 1];
    const nCluster = tempClusters[targetIndex + 1];

    if (!pCluster) {
        newOrderIndex = nCluster ? nCluster.order_index / 2 : 1000; 
    } else if (!nCluster) {
        newOrderIndex = pCluster.order_index + 1024; 
    } else {
        newOrderIndex = (pCluster.order_index + nCluster.order_index) / 2;
    }

    setClusters(prev => {
        const newC = [...prev];
        const cIdx = newC.findIndex(c => c.id === clusterId);
        if (cIdx === -1) return prev;
        const [mC] = newC.splice(cIdx, 1);
        mC.order_index = newOrderIndex;
        // Re-insert at target index?
        // Actually since we rely on sort by order_index, we just update order_index and sort.
        // But for smooth UI, splicing is better if list is not strictly sorted by UI (but it IS).
        
        // Let's just update order_index and sort.
        newC.splice(targetIndex, 0, mC); // Put it where we think it goes visually
        
        return newC; // The ClusterBoard usually sorts by itself or receives sorted list. 
                     // Dashboard sorts clusters on fetch: `setClusters(sorted)`.
                     // But during moves, we rely on array order until refresh?
                     // Dashboard `ClusterBoard` iterates `clusters`.
    });
    
    setSaving(true);
    try {
        await api.updateCluster(jobId, clusterId, { order_index: newOrderIndex });
    } catch (e) {
        console.error("Failed to move cluster", e);
        toast.error("Failed to move cluster");
    } finally {
        setSaving(false);
    }
  }, [jobId, clusters, setClusters]);

  const handleAddPhotosToExistingCluster = useCallback(async (targetClusterId: string, photosToMoveParam: { id: string; clusterId: string }[]) => {
    if (photosToMoveParam.length === 0) return;

    const prevClusters = clusters; 
    const prevSelectedPhotos = selectedPhotos; 

    const fullPhotosToMove: Photo[] = photosToMoveParam.map(p => {
        return clusters.flatMap(cl => cl.photos).find(photo => photo.id === p.id) || p as any;
    });
    const updatedPhotos = fullPhotosToMove.map(p => ({ ...p, cluster_id: targetClusterId }));

    try {
      setClusters(prev => {
          const optimisticClusters = prev.map(c => {
            let newPhotos = c.photos;

            const photosToRemoveFromHere = photosToMoveParam.filter(p => p.clusterId === c.id).map(p => p.id);
            if (photosToRemoveFromHere.length > 0) {
                newPhotos = c.photos.filter(p => !photosToRemoveFromHere.includes(p.id.toString()));
            }
            
            if (c.id === targetClusterId) {
                const existingPhotoIdsInTarget = new Set(newPhotos.map(p => p.id));
                const uniqueMovedPhotos = fullPhotosToMove.filter(p => !existingPhotoIdsInTarget.has(p.id));
                newPhotos = sortPhotosByOrderIndex([...newPhotos, ...uniqueMovedPhotos]);
            }
            return { ...c, photos: newPhotos };
          });
          return optimisticClusters;
      });
      
      setSelectedPhotos([]); 

      await api.updatePhoto(jobId, updatedPhotos);
      toast.success(`Added ${updatedPhotos.length} photos to place`);
    } catch (e) {
      console.error("Failed to add photos", e);
      toast.error("Failed to add photos");
      setClusters(prevClusters); 
      setSelectedPhotos(prevSelectedPhotos); 
    }
  }, [jobId, clusters, setClusters, selectedPhotos, setSelectedPhotos]);

  const handleBatchDeletePhotos = useCallback(async (photosToDelete: { id: string; clusterId: string }[]) => {
    if (photosToDelete.length === 0) return;

    const prevClusters = clusters;
    const prevSelectedPhotos = selectedPhotos;

    try {
      setClusters(prev => prev.map(c => {
        const photosToRemoveFromHere = photosToDelete.filter(p => p.clusterId === c.id).map(p => p.id);
        if (photosToRemoveFromHere.length > 0) {
            return { ...c, photos: c.photos.filter(p => !photosToRemoveFromHere.includes(p.id.toString())) };
        }
        return c;
      }));

      setSelectedPhotos([]);

      // API calls (sequential for safety, or parallel if backend handles it)
      await Promise.all(photosToDelete.map(p => api.deleteClusterMember(jobId, p.id)));
      toast.success(`Deleted ${photosToDelete.length} photos`);
    } catch (e) {
      console.error("Failed to delete photos", e);
      toast.error("Failed to delete some photos");
      setClusters(prevClusters);
      setSelectedPhotos(prevSelectedPhotos);
    }
  }, [jobId, clusters, setClusters, selectedPhotos, setSelectedPhotos]);

  return {
    saving,
    handleDeleteCluster,
    handleMovePhoto,
    handleCreateCluster,
    handleDeletePhoto,
    handleRenameCluster,
    handleMoveCluster,
    handleAddPhotosToExistingCluster,
    handleBatchDeletePhotos,
  };
}
