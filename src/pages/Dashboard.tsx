import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';

import { api } from '@/lib/api';
import { Job, Cluster, Photo } from '@/types';
import { PhotoUploader } from '@/components/PhotoUploader';
import { PhotoGrid } from '@/components/PhotoGrid';
import { ClusterBoard } from '@/components/ClusterBoard';
import { LogOut, FileDown, Loader2, LayoutGrid, ArrowLeft, CloudUpload, CheckCircle, Settings, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Helper to sort photos within a cluster by order_index (proxy for timestamp)
const sortPhotosByOrderIndex = (photos: Photo[]): Photo[] => {
  return [...photos].sort((a, b) => {
    // 1. If both have order_index, compare them.
    if (a.order_index !== undefined && b.order_index !== undefined) {
      if (a.order_index !== b.order_index) {
        return a.order_index - b.order_index;
      }
    }

    // 2. If one has order_index and the other doesn't, the one with order_index comes first.
    if (a.order_index !== undefined && b.order_index === undefined) return -1;
    if (a.order_index === undefined && b.order_index !== undefined) return 1;

    // 3. If neither has order_index, sort by timestamp (ascending).
    // Treat missing timestamp as Infinity (place at the end).
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : Infinity;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : Infinity;

    if (timeA !== timeB) {
      return timeA - timeB;
    }

    // 4. Fallback to id for stable sort
    return a.id.localeCompare(b.id);
  });
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<{ id: string; clusterId: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isClustering, setIsClustering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const isSelectionLoaded = useRef(false);
  const [saving, setSaving] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  
  // Export & Preview State
  const [exportMetadata, setExportMetadata] = useState({
    title: '',
    construction_type: '', // This will serve as the cluster name override for the preview if needed, or job type
    cover_company_name: '',
    label_company_name: '',
  });
  const [labelSettings, setLabelSettings] = useState<{ id: string; key: string; value: string; isAutoDate?: boolean }[]>([
    { id: 'date', key: '일자', value: '', isAutoDate: true },
    { id: 'company', key: '시행처', value: '' },
  ]);

  const addLabelItem = () => {
    const id = Math.random().toString(36).substr(2, 9);
    setLabelSettings([...labelSettings, { id, key: '새 라벨', value: '' }]);
  };

  const removeLabelItem = (id: string) => {
    setLabelSettings(labelSettings.filter(l => l.id !== id));
  };

  const updateLabelItem = (id: string, field: 'key' | 'value', newValue: string) => {
    setLabelSettings(labelSettings.map(l => l.id === id ? { ...l, [field]: newValue } : l));
  };
  
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialLoad = useRef(true);

  useEffect(() => {
    if (!jobId) return;

    const fetchJobData = async () => {
      try {
        const data = await api.getJobDetails(jobId);
        setJob(data);
        if (data.clusters) {
           const sorted = data.clusters
              .sort((a, b) => a.order_index - b.order_index)
              .map(c => ({...c, photos: sortPhotosByOrderIndex(c.photos)}));
           setClusters(sorted);
        }
        if (data.photos) setPhotos(data.photos);
      } catch (error) {
        console.error("Failed to load job data", error);
        toast.error("Failed to load job data");
      }
    };
    fetchJobData();
  }, [jobId]);

  const handleUpload = async (files: FileList) => {
    if (!job) return;
    setLoading(true);
    setUploadProgress(0);
    try {
      await api.uploadPhotos(job.id, Array.from(files), (progress) => {
        setUploadProgress(progress);
      });
      
      const jobData = await api.getJobDetails(job.id);
      setJob(jobData);
      if (jobData.photos) setPhotos(jobData.photos);
      
      toast.success("Photos uploaded successfully");
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("Failed to upload photos");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleStartClustering = async () => {
    if (!job) return;
    setIsClustering(true);
    try {
      const result = await api.startClustering(job.id);
      console.log("startClustering response:", result);

      let newClusters: Cluster[] = [];

      // Check for PENDING status
      if (result && (result.status === 'PENDING' || result.status === 'PROCESSING')) {
        toast.info("Clustering started in background...");
        
        // Poll for results
        const pollInterval = 1000;
        const maxAttempts = 180; // 30 seconds timeout
        let attempts = 0;
        
        while (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, pollInterval));
          try {
             // We can check clusters or job status. Assuming checking clusters count.
             // Ideally the backend should provide a status endpoint or getJob should return status.
             // For now, let's check if we get clusters.
             const clusters = await api.getClusters(job.id);
             if (clusters && clusters.length > 0) {
               newClusters = clusters;
               break;
             }
             // Optional: If backend supports job status, check that here.
          } catch (e) {
            console.warn("Polling error", e);
          }
          attempts++;
        }
        
        if (newClusters.length === 0) {
           toast.warning("Clustering finished but no places were found, or it timed out.");
           // Fetch one last time just in case
           const clusters = await api.getClusters(job.id);
           if (clusters) newClusters = clusters;
        }

      } else if (Array.isArray(result)) {
        newClusters = result;
      } else if (result && typeof result === 'object' && Array.isArray((result as any).clusters)) {
        newClusters = (result as any).clusters;
      } else {
        console.warn("Unexpected clustering response format", result);
        throw new Error("Invalid clustering response format");
      }

      const sortedClusters = newClusters
        .sort((a, b) => (a.order_index ?? 0) - (b.order_index ?? 0))
        .map(c => ({...c, photos: sortPhotosByOrderIndex(c.photos)}));
      
      setClusters(sortedClusters);
      if (sortedClusters.length > 0) {
        toast.success(`Analysis complete. Found ${sortedClusters.length} places.`);
      }
    } catch (error) {
      console.error("Clustering failed", error);
      toast.error("Failed to cluster photos");
    } finally {
      setIsClustering(false);
    }
  };

  const handleSelectPhoto = (photoId: string, clusterId: string) => {
    setSelectedPhotos(prev => {
      const exists = prev.some(p => p.id === photoId);
      if (exists) {
        return prev.filter(p => p.id !== photoId);
      }
      return [...prev, { id: photoId, clusterId }];
    });
  };

  const handleMovePhoto = async (photoId: string, sourceClusterId: string, targetClusterId: string, newIndex: number) => {
    if (!job) return;

    let realTargetClusterId = targetClusterId;
    let createdReserveCluster: Cluster | null = null;

    // 1. Handle "reserve" target special case
    // If dropped on "reserve" zone but no reserve cluster exists in state with that ID
    if (targetClusterId === 'reserve') {
        const existingReserve = clusters.find(c => c.name === 'reserve');
        if (existingReserve) {
            realTargetClusterId = existingReserve.id;
        } else {
            // Create reserve cluster immediately
            try {
                createdReserveCluster = await api.createCluster(job.id, 'reserve', -1, []);
                // Ensure photos is initialized
                createdReserveCluster.photos = []; 
                realTargetClusterId = createdReserveCluster.id;
            } catch (e) {
                console.error("Failed to create reserve cluster auto-magically", e);
                toast.error("Failed to move to reserve (creation failed)");
                return;
            }
        }
    }

    // 2. Update Local State
    // We need to use functional update or get fresh state if we just added a cluster, 
    // but since we might have added `createdReserveCluster`, let's construct the new list carefully.
    
    const currentClusters = createdReserveCluster 
        ? [...clusters, createdReserveCluster] 
        : [...clusters];

    const newClusters = currentClusters.map(c => ({...c, photos: [...c.photos]}));
    
    const sourceCluster = newClusters.find(c => c.id === sourceClusterId);
    const targetCluster = newClusters.find(c => c.id === realTargetClusterId);

    if (!sourceCluster || !targetCluster) {
        console.error("Source or Target cluster not found during move", { sourceClusterId, realTargetClusterId });
        return;
    }

    const photoIndex = sourceCluster.photos.findIndex(p => p.id === photoId);
    if (photoIndex === -1) return;
    
    const [photo] = sourceCluster.photos.splice(photoIndex, 1);
    targetCluster.photos.splice(newIndex, 0, photo);

    // If source cluster is 'reserve' and becomes empty, do we delete it?
    // User said: "사진 길이가 0이 되어도 칸이 유지되는 것이 유일한 다른점" -> So we KEEP it.
    // But other clusters? Typically we keep them unless explicitly deleted.

    setClusters(newClusters);
    
    setSaving(true);
    try {
        // Atomic Move API
        await api.movePhoto(photoId, realTargetClusterId, newIndex);
    } catch (e) {
        console.error("Failed to move photo", e);
        toast.error("Failed to save move");
        // Revert? (Complex, maybe just reload)
    } finally {
        setSaving(false);
    }
  };

  const handleDeletePhoto = async (photoId: string, clusterId: string) => {
    // Optimistic UI update with functional state to prevent stale closures
    setClusters(prev => prev.map(c => {
        if (c.id === clusterId) {
            return { ...c, photos: c.photos.filter(p => p.id.toString() !== photoId.toString()) };
        }
        return c;
    }));
    
    setSaving(true);
    try {
        await api.deletePhoto(photoId);
    } catch (e) {
        console.error("Failed to delete photo", e);
        toast.error("Failed to delete photo");
        // Optional: Revert state if needed (requires fetching or undo logic)
    } finally {
        setSaving(false);
    }
  };

  const handleRenameCluster = async (clusterId: string, newName: string) => {
    setClusters(prev => prev.map(c => c.id === clusterId ? { ...c, name: newName } : c));
    
    // Add rename to pendingRenames queue and trigger sync
    // pendingRenames.current.set(clusterId, newName);
    // triggerAutoSave(); // No new cluster state, just trigger processing existing pending actions

    setSaving(true);
    try {
        await api.updateCluster(clusterId, { new_name: newName });
    } catch (e) {
        console.error("Failed to rename cluster", e);
        toast.error("Failed to rename cluster");
    } finally {
        setSaving(false);
    }
  };

  const handleDeleteCluster = async (clusterId: string) => {
    const clusterToDelete = clusters.find(c => c.id === clusterId);
    
    // We are deleting the cluster and its photos. 
    // Do NOT move photos to reserve.
    
    let newClusters = clusters.filter(c => c.id !== clusterId);
    
    if (clusterToDelete) {
       newClusters = newClusters.map(c => {
         if (c.order_index > clusterToDelete.order_index) {
            return { ...c, order_index: c.order_index - 1 };
         }
         return c;
       });
    }

    setClusters(newClusters);
    
    // Queue for cluster deletion
    // pendingClusterDeletes.current.add(clusterId);
    // triggerAutoSave(newClusters);
    setSaving(true);
    try {
        await api.deleteCluster(clusterId);
    } catch (e) {
        console.error("Failed to delete cluster", e);
        toast.error("Failed to delete cluster");
    } finally {
        setSaving(false);
    }
  };

  const handleMoveCluster = async (clusterId: string, direction: 'up' | 'down') => {
    const currentIndex = clusters.findIndex(c => c.id === clusterId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= clusters.length) return;

    // Deep copy to avoid mutation
    const newClusters = clusters.map(c => ({...c}));
    const currentCluster = newClusters[currentIndex];
    const targetCluster = newClusters[targetIndex];
    
    const tempOrder = currentCluster.order_index;
    currentCluster.order_index = targetCluster.order_index;
    targetCluster.order_index = tempOrder;

    newClusters.sort((a, b) => a.order_index - b.order_index);
    setClusters(newClusters);
    
    // triggerAutoSave(newClusters);
    if (!job) return;
    setSaving(true);
    try {
        // Swap orders atomically
        await Promise.all([
            api.updateCluster(currentCluster.id, { order_index: currentCluster.order_index }),
            api.updateCluster(targetCluster.id, { order_index: targetCluster.order_index })
        ]);
    } catch (e) {
        console.error("Failed to move cluster", e);
        toast.error("Failed to move cluster");
    } finally {
        setSaving(false);
    }
  };

  const handleCreateCluster = async (orderIndex: number, photosToMoveParam: { id: string; clusterId: string }[] = []) => {
    if (!job) return;

    const prevClusters = clusters; // Store current state for rollback
    const prevSelectedPhotos = selectedPhotos; // Store current selection for rollback

    const photoIds = photosToMoveParam.map(p => p.id);
    const fullPhotosToMove: Photo[] = photosToMoveParam.map(p => {
        // Find the full Photo object from the current clusters state
        return clusters.flatMap(cl => cl.photos).find(photo => photo.id === p.id) || p as any; // Fallback to partial object if not found (shouldn't happen)
    });

    try {
      // Optimistically update UI
      // 1. Integrate shifting and photo removal into a single map
      const optimisticClusters = clusters.map(c => {
        let updatedCluster = { ...c };
        
        // Shift existing clusters (order_index 업데이트)
        if (c.order_index >= orderIndex) {
            updatedCluster.order_index += 1;
        }
        
        // Remove moved photos from source clusters (photos 업데이트)
        const photosToRemoveFromHere = photosToMoveParam.filter(p => p.clusterId === c.id).map(p => p.id);
        if (photosToRemoveFromHere.length > 0) {
            updatedCluster.photos = c.photos.filter(p => !photosToRemoveFromHere.includes(p.id.toString()));
        }
        return updatedCluster;
      });

      // 2. Create the new cluster via API
      const newClusterResponse = await api.createCluster(job.id, `${job.title}`, orderIndex, photoIds);
      // Ensure the API response has photos, even if empty, so sortPhotosByOrderIndex works
      const newClusterWithPhotos = { ...newClusterResponse, photos: sortPhotosByOrderIndex(fullPhotosToMove) };

      // 3. Add new cluster and re-sort
      const finalClusters = [...optimisticClusters, newClusterWithPhotos].sort((a, b) => a.order_index - b.order_index);
      
      setClusters(finalClusters);
      setSelectedPhotos([]); // Clear selection after successful move/creation
      // triggerAutoSave(finalClusters); // Trigger sync for the new cluster

      toast.success(`New place created with ${photoIds.length} photos.`);
    } catch (error) {
      console.error("Failed to create new place", error);
      toast.error('Failed to create new place');
      setClusters(prevClusters); // Rollback clusters state
      setSelectedPhotos(prevSelectedPhotos); // Rollback selection state
    }
  };

  const handleAddPhotosToExistingCluster = async (targetClusterId: string, photosToMoveParam: { id: string; clusterId: string }[]) => {
    if (!job || photosToMoveParam.length === 0) return;

    const prevClusters = clusters; // Store current state for rollback
    const prevSelectedPhotos = selectedPhotos; // Store current selection for rollback

    const photoIds = photosToMoveParam.map(p => p.id);
    const fullPhotosToMove: Photo[] = photosToMoveParam.map(p => {
        return clusters.flatMap(cl => cl.photos).find(photo => photo.id === p.id) || p as any;
    });

    try {
      // Optimistically update UI
      const optimisticClusters = clusters.map(c => {
        let newPhotos = c.photos;

        // Remove photos from source clusters
        const photosToRemoveFromHere = photosToMoveParam.filter(p => p.clusterId === c.id).map(p => p.id);
        if (photosToRemoveFromHere.length > 0) {
            newPhotos = c.photos.filter(p => !photosToRemoveFromHere.includes(p.id.toString()));
        }
        
        // Add photos to target cluster
        if (c.id === targetClusterId) {
            // Only add unique photos and sort
            const existingPhotoIdsInTarget = new Set(newPhotos.map(p => p.id));
            const uniqueMovedPhotos = fullPhotosToMove.filter(p => !existingPhotoIdsInTarget.has(p.id));
            newPhotos = sortPhotosByOrderIndex([...newPhotos, ...uniqueMovedPhotos]);
        }
        return { ...c, photos: newPhotos };
      });
      
      setClusters(optimisticClusters);
      setSelectedPhotos([]); // Clear selection after successful move

      // API call
      await api.addPhotosToExistingCluster(targetClusterId, photoIds);
      toast.success(`Added ${photoIds.length} photos to place`);
    } catch (e) {
      console.error("Failed to add photos", e);
      toast.error("Failed to add photos");
      setClusters(prevClusters); // Rollback clusters state
      setSelectedPhotos(prevSelectedPhotos); // Rollback selection state
    }
  };

  const handleExport = () => {
    if (!job) return;
    
    // Initialize preview with current job data or existing cluster data
    // Use the first cluster's name as the default construction_type for the preview if available and not set
    const firstClusterName = clusters.length > 0 && clusters[0].name !== 'reserve' ? clusters[0].name : '';
    
    setExportMetadata({
      title: job.title,
      // If we have a stored construction type, use it. Otherwise, default to first cluster name or job title.
      construction_type: job.construction_type || firstClusterName || job.title,
      cover_company_name: job.company_name || '',
      label_company_name: job.company_name || '',
    });
    
    // Reset or keep label settings? Let's keep defaults or previous if we had persistence.
    // For now, reset company value to job.company_name if empty
    setLabelSettings(prev => prev.map(l => {
        if (l.id === 'company' && !l.value) return { ...l, value: job.company_name || '' };
        return l;
    }));
    
    setExportDialogOpen(true);
  };

  const handleConfirmExport = async () => {
    if (!job) return;
    setExportDialogOpen(false);
    setExporting(true);
    
    try {
      // Construct payload with detailed label settings
      const payload = {
        ...exportMetadata,
        labels: labelSettings
      };

      await api.startExport(job.id, payload);
      
      const interval = setInterval(async () => {
        const status = await api.getExportStatus(job.id);
        if (status.status === 'EXPORTED') {
          clearInterval(interval);
          setExporting(false);
          toast.success('PDF Export Successful');
          if (status.pdf_url) window.open(status.pdf_url, '_blank');
        } else if (status.status === 'FAILED') {
          clearInterval(interval);
          setExporting(false);
          toast.error(status.error_message || 'Export failed');
        }
      }, 2000);
    } catch (error) {
      setExporting(false);
      toast.error('Failed to start export');
    }
  };

  const completedPlaces = clusters.filter(c => c.name !== 'reserve' && c.photos.length === 3).length;
  const totalPlaces = clusters.filter(c => c.name !== 'reserve').length;

  // Prepare preview data
  const previewCluster = clusters.find(c => c.name !== 'reserve') || clusters[0];
  const previewPhotos = previewCluster?.photos || [];

  if (!job) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;

  return (
    <div className="h-screen bg-gray-100 flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b shadow-sm px-4 py-3 md:px-6 md:py-4 flex items-center justify-between flex-shrink-0 z-30">
        <div className="flex items-center gap-3 md:gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <div className="p-2 bg-blue-600 rounded-lg shadow-md hidden md:block">
            <LayoutGrid className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight truncate max-w-[150px] md:max-w-none">
              {job.title}
            </h1>
          </div>
        </div>
        {clusters.length > 0 && (
          <div className="flex items-center gap-2 md:gap-4">
            <div className="hidden lg:flex flex-col items-end mr-4">
                <div className="flex items-center gap-2 mb-1">
                  {saving ? (
                    <span className="text-xs text-blue-600 font-medium flex items-center gap-1 animate-pulse">
                      <CloudUpload className="w-3 h-3" /> 저장 중...
                    </span>
                  ) : (
                    <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> 저장됨
                    </span>
                  )}
                </div>
                <span className={`text-lg font-bold ${completedPlaces === totalPlaces && totalPlaces > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                  완료 장소: {completedPlaces} / {totalPlaces} 
                </span>
            </div>
            <Button 
              variant="default" 
              size="sm" 
              className="md:text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md md:h-11 md:px-8"
              onClick={handleStartClustering}
              disabled={isClustering}
            >
              {isClustering ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin md:mr-2" /> : <FileDown className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />}
              <span className="hidden md:inline">사진 분류 다시하기</span>
              <span className="md:hidden">재분류</span>
            </Button>
            <Button 
              variant="default" 
              size="sm" 
              className="md:text-lg bg-indigo-600 hover:bg-indigo-700 shadow-md md:h-11 md:px-8"
              onClick={handleExport}
              disabled={exporting || clusters.length === 0}
            >
              {exporting ? <Loader2 className="w-4 h-4 md:w-5 md:h-5 animate-spin md:mr-2" /> : <FileDown className="w-4 h-4 md:w-5 md:h-5 md:mr-2" />}
              <span className="hidden md:inline">PDF 내보내기</span>
              <span className="md:hidden">PDF</span>
            </Button>
          </div>
        )}
      </header>

      <main className="flex-1 p-2 md:p-6 max-w-[2000px] mx-auto w-full overflow-y-auto flex flex-col">
        <div className="flex flex-col h-full gap-4">
          {clusters.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border p-10">
              {!isClustering && (
                <PhotoUploader onUpload={handleUpload} isUploading={loading} progress={uploadProgress} />
              )}
              {photos.length > 0 && (
                <div className="w-full max-w-3xl mx-auto space-y-6 mt-6">
                  <PhotoGrid photos={photos} />
                  {isClustering ? (
                    // <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Clustering...</>
                    <div className="mt-8 text-center">
                      <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                      <p className="mt-4 text-xl font-medium text-gray-700">
                        사진 분류 작업 중입니다...
                      </p>
                      <p className="text-sm text-gray-500">이 작업은 시간이 걸릴 수 있습니다.</p>
                    </div>
                    ) : (
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleStartClustering}
                      disabled={isClustering}
                    >
                    사진 분류 시작하기
                    </Button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Main Board */}
                <div
                  className={`flex-1 overflow-hidden transition duration-200 ${
                    isClustering ? "opacity-40 pointer-events-none" : ""
                  }`}
                  aria-disabled={isClustering}
                >
                  <ClusterBoard 
                    clusters={clusters} 
                    onMovePhoto={handleMovePhoto}
                    onCreateCluster={handleCreateCluster}
                    onDeleteCluster={handleDeleteCluster}
                    onMoveCluster={handleMoveCluster}
                    onAddPhotosToExistingCluster={handleAddPhotosToExistingCluster}
                    onRenameCluster={handleRenameCluster}
                    onDeletePhoto={handleDeletePhoto}
                    selectedPhotos={selectedPhotos}
                    onSelectPhoto={handleSelectPhoto}
                  />
              </div>
            </>
          )}
        </div>
      </main>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full md:max-w-[1400px] h-[90vh] flex flex-col p-0 gap-0 bg-gray-50">
          <DialogHeader className="p-6 bg-white border-b shrink-0">
            <DialogTitle className="text-xl">PDF 내보내기 설정</DialogTitle>
            <DialogDescription className="text-base">
              내보내기 전 표지와 첫 장을 미리보고 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-8">
            <div className="flex flex-col xl:flex-row gap-12 justify-center items-start min-h-[700px]">
              
              {/* Cover Preview (Left) */}
              <div className="flex flex-col items-center gap-4">
                 <h3 className="text-lg font-bold text-gray-700">표지 미리보기</h3>
                 <div className="w-[450px] h-[636px] bg-white shadow-xl flex flex-col items-center justify-between p-12 relative hover:ring-2 hover:ring-blue-300 transition-all">
                    {/* Top Title */}
                    <div className="mt-20 w-full text-center">
                        <input
                           className="w-full text-center text-3xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent py-2"
                           value={exportMetadata.title}
                           onChange={(e) => setExportMetadata({...exportMetadata, title: e.target.value})}
                           placeholder="작업명 입력"
                        />
                        <div className="mt-16 bg-gray-100 border border-gray-300 px-10 py-4 inline-block">
                             <span className="text-3xl font-bold tracking-widest">사 진 대 지</span>
                        </div>
                    </div>

                    {/* Bottom Company */}
                    <div className="mb-20 w-full text-center">
                        {exportMetadata.cover_company_name ? (
                            <input
                                className="w-full text-center text-xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent py-2"
                                value={exportMetadata.cover_company_name}
                                onChange={(e) => setExportMetadata({...exportMetadata, cover_company_name: e.target.value})}
                            />
                        ) : (
                            <div 
                                className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-xl text-gray-400 cursor-text hover:border-blue-400 hover:text-blue-500 transition-colors"
                                onClick={() => setExportMetadata({...exportMetadata, cover_company_name: ' '})} // trigger input
                            >
                                시행처 입력 (클릭)
                            </div>
                        )}
                        {/* Fallback input if empty but focused */}
                        {exportMetadata.cover_company_name === ' ' && (
                             <input
                                className="w-full text-center text-2xl font-bold border-b-2 border-blue-500 focus:outline-none bg-transparent absolute bottom-20 left-0 px-12"
                                autoFocus
                                value={exportMetadata.cover_company_name}
                                onChange={(e) => setExportMetadata({...exportMetadata, cover_company_name: e.target.value})}
                                onBlur={() => { if(exportMetadata.cover_company_name.trim() === '') setExportMetadata({...exportMetadata, cover_company_name: ''}) }}
                            />
                        )}
                    </div>
                 </div>
              </div>

              {/* Page 1 Preview (Right) */}
              <div className="flex flex-col items-center gap-4">
                 <div className="flex items-center justify-between w-[450px]">
                    <h3 className="text-lg font-bold text-gray-700">첫장 미리보기 (예시)</h3>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 gap-2 text-sm text-gray-600 hover:text-blue-600" onClick={() => toast.info("개별 사진/클러스터 수정 페이지로 이동 (구현 예정)")}>
                           <Edit2 className="w-4 h-4" /> 개별 수정
                        </Button>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-8 gap-2 text-sm border-gray-300">
                            <Settings className="w-4 h-4" /> 라벨 설정
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <h4 className="font-medium leading-none">라벨 텍스트 설정</h4>
                                    <p className="text-xs text-muted-foreground">사진 위에 표시될 정보를 설정합니다.</p>
                                </div>
                                <div className="grid gap-2">
                                    {labelSettings.map((label) => (
                                        <div key={label.id} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
                                            <Input 
                                                className="h-8 text-sm px-2" 
                                                value={label.key}
                                                onChange={(e) => updateLabelItem(label.id, 'key', e.target.value)}
                                                placeholder="항목"
                                            />
                                            <div className="relative">
                                                <Input 
                                                    className="h-8 text-sm px-2" 
                                                    value={label.value}
                                                    onChange={(e) => updateLabelItem(label.id, 'value', e.target.value)}
                                                    placeholder={label.isAutoDate ? "자동 (촬영일자)" : "내용"}
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeLabelItem(label.id)}>
                                                <LogOut className="w-4 h-4 rotate-180" />
                                            </Button>
                                        </div>
                                    ))}
                                    <Button variant="outline" size="sm" className="w-full h-8 text-sm mt-1" onClick={addLabelItem}>
                                        + 항목 추가
                                    </Button>
                                </div>
                                {labelSettings.some(l => l.isAutoDate) && (
                                    <p className="text-xs text-blue-600">
                                        * 일자 항목을 비워두면 사진의 촬영 날짜가 자동으로 표시됩니다.
                                    </p>
                                )}
                            </div>
                        </PopoverContent>
                        </Popover>
                    </div>
                 </div>

                 <div className="w-[450px] h-[636px] bg-white shadow-xl p-8 relative text-sm flex flex-col">
                     <div className="text-center text-3xl font-bold mb-6 tracking-widest">사 진 대 지</div>
                     
                     {/* Table Structure */}
                     <div className="border border-black flex-1 flex flex-col w-full overflow-hidden">
                        {/* Header Row */}
                        <div className="h-10 flex border-b border-black shrink-0">
                            <div className="w-20 bg-gray-50 border-r border-black flex items-center justify-center font-bold text-lg">공종</div>
                            <div className="flex-1 flex items-center px-2">
                                <input 
                                    className="w-full bg-transparent focus:outline-none font-bold text-lg"
                                    value={exportMetadata.construction_type}
                                    onChange={(e) => setExportMetadata({...exportMetadata, construction_type: e.target.value})}
                                    placeholder="공종/제목 입력"
                                />
                            </div>
                        </div>

                        {/* Rows */}
                        {['전', '중', '후'].map((label, idx) => {
                             const photo = previewPhotos[idx];
                             return (
                                <div key={label} className="flex-1 flex border-b border-black last:border-b-0 min-h-0">
                                    <div className="w-24 bg-gray-50 border-r border-black flex items-center justify-center font-bold text-lg">
                                        {label}
                                    </div>
                                    <div className="flex-1 relative p-1 flex items-center justify-center overflow-hidden bg-gray-50/10">
                                        {photo ? (
                                            <>
                                                <img 
                                                    src={api.getPhotoUrl(photo.url)} 
                                                    alt={label} 
                                                    className="w-full h-full object-contain"
                                                />
                                                {/* Label Box Overlay */}
                                                <div className="absolute top-3 left-3 bg-white/95 border border-gray-300 p-2 shadow-sm rounded-sm text-xs leading-relaxed z-10 whitespace-nowrap">
                                                    {labelSettings.map(l => (
                                                        <div key={l.id}>
                                                            <span className="font-bold text-gray-800">{l.key} :</span>{' '}
                                                            <span className="text-gray-900">
                                                                {l.isAutoDate && !l.value 
                                                                    ? (photo.timestamp ? format(new Date(photo.timestamp), 'yyyy.MM.dd') : '-') 
                                                                    : (l.value || '-')
                                                                }
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-gray-300 font-medium">No Photo</div>
                                        )}
                                    </div>
                                </div>
                             )
                        })}
                     </div>
                 </div>
              </div>

            </div>
          </div>
          
          <DialogFooter className="p-5 bg-white border-t shrink-0 gap-4">
             <Button variant="outline" size="lg" className="text-lg px-8" onClick={() => setExportDialogOpen(false)}>취소</Button>
            <Button type="submit" size="lg" className="text-lg px-8 bg-blue-600 hover:bg-blue-700" onClick={handleConfirmExport}>PDF 내보내기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}