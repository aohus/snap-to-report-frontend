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
import { LogOut, FileDown, Loader2, LayoutGrid, ArrowLeft, CloudUpload, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isClustering, setIsClustering] = useState(false);
  const [exporting, setExporting] = useState(false);
  const isSelectionLoaded = useRef(false);
  const [saving, setSaving] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [exportMetadata, setExportMetadata] = useState({
    title: '',
    construction_type: '',
    client_name: '',
  });
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
  
  // Sequential Sync Logic
  const isSyncing = useRef(false);
  const pendingSync = useRef<Cluster[] | null>(null);
  const pendingDeletes = useRef<Set<string>>(new Set()); // For photo deletes
  const pendingClusterDeletes = useRef<Set<string>>(new Set()); // For cluster deletes
  const pendingRenames = useRef<Map<string, string>>(new Map()); // For cluster renames: Map<clusterId, newName>

  const processSync = async () => {
    if (!job || isSyncing.current) return; 

    // If nothing to sync and nothing to delete/rename, return
    if (!pendingSync.current &&
        pendingDeletes.current.size === 0 &&
        pendingClusterDeletes.current.size === 0 &&
        pendingRenames.current.size === 0) {
      setSaving(false); // Nothing to save, ensure indicator is off
      return;
    }

    isSyncing.current = true;
    setSaving(true);

    try {
      // 0. Process Cluster Renames (Needs to happen before sync possibly overwrites structure)
      if (pendingRenames.current.size > 0) {
        // Collect current pending renames and clear ref for next batch
        const renamesToProcess = new Map(pendingRenames.current);
        pendingRenames.current.clear(); 
        
        await Promise.all(
          Array.from(renamesToProcess.entries()).map(async ([clusterId, newName]) => {
            try {
              await api.updateCluster(clusterId, { new_name: newName });
            } catch (e) {
              console.error(`Failed to rename cluster ${clusterId} to ${newName}`, e);
            }
          })
        );
      }

      // 1. Sync Structure (Clusters and Photos)
      if (pendingSync.current) {
        const clustersToSync = pendingSync.current;
        pendingSync.current = null; // Clear pending queue
        await api.syncClusters(job.id, clustersToSync);
      }

      // 2. Process Photo Deletes
      if (pendingDeletes.current.size > 0) {
        const idsToDelete = Array.from(pendingDeletes.current);
        pendingDeletes.current.clear(); 
        await Promise.all(idsToDelete.map(id => api.deletePhoto(id)));
      }
      
      // 3. Process Cluster Deletes
      if (pendingClusterDeletes.current.size > 0) {
          const idsToDelete = Array.from(pendingClusterDeletes.current);
          pendingClusterDeletes.current.clear();
          await Promise.all(idsToDelete.map(id => api.deleteCluster(id)));
      }

    } catch (error) {
      console.error("Batch Sync/Action failed", error);
    } finally {
      isSyncing.current = false;
      // Check if new changes arrived while we were processing
      if (pendingSync.current || pendingDeletes.current.size > 0 || pendingClusterDeletes.current.size > 0 || pendingRenames.current.size > 0) {
        processSync();
      } else {
        setSaving(false); // Only turn off if nothing else is pending
      }
    }
  };

  // Auto-save helper
  const triggerAutoSave = useCallback((updatedClusters?: Cluster[] | null) => { // updatedClusters can be optional or null
    if (!job) return;

    if (updatedClusters) { // Only update pendingSync if cluster state is provided
      pendingSync.current = updatedClusters;
    }
    setSaving(true);

    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(() => {
      processSync();
    }, 2000);
  }, [job]);

  // ... existing code ...

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
      const newClusters = await api.startClustering(job.id);
      const sortedClusters = newClusters
        .sort((a, b) => a.order_index - b.order_index)
        .map(c => ({...c, photos: sortPhotosByOrderIndex(c.photos)}));
      
      setClusters(sortedClusters);
      toast.success("Photos clustered successfully");
    } catch (error) {
      console.error("Clustering failed", error);
      toast.error("Failed to cluster photos");
    } finally {
      setIsClustering(false);
    }
  };

  const handleSelectPhoto = (photoId: string) => {
    setSelectedPhotoIds(prev => 
      prev.includes(photoId) 
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleMovePhoto = (photoId: string, sourceClusterId: string, targetClusterId: string, newIndex: number) => {
    const newClusters = clusters.map(c => ({...c, photos: [...c.photos]}));
    
    const sourceCluster = newClusters.find(c => c.id === sourceClusterId);
    const targetCluster = newClusters.find(c => c.id === targetClusterId);

    if (!sourceCluster || !targetCluster) return;

    const photoIndex = sourceCluster.photos.findIndex(p => p.id === photoId);
    if (photoIndex === -1) return;
    
    const [photo] = sourceCluster.photos.splice(photoIndex, 1);
    targetCluster.photos.splice(newIndex, 0, photo);

    setClusters(newClusters);
    triggerAutoSave(newClusters);
  };

  const handleDeletePhoto = async (photoId: string, clusterId: string) => {
    const newClusters = clusters.map(c => {
        if (c.id === clusterId) {
            return { ...c, photos: c.photos.filter(p => p.id !== photoId) };
        }
        return c;
    });
    setClusters(newClusters);
    
    // Queue for deletion
    pendingDeletes.current.add(photoId);
    triggerAutoSave(newClusters);
  };

  const handleRenameCluster = async (clusterId: string, newName: string) => {
    setClusters(prev => prev.map(c => c.id === clusterId ? { ...c, name: newName } : c));
    
    // Add rename to pendingRenames queue and trigger sync
    pendingRenames.current.set(clusterId, newName);
    triggerAutoSave(); // No new cluster state, just trigger processing existing pending actions
  };

  const handleDeleteCluster = async (clusterId: string) => {
    const clusterToDelete = clusters.find(c => c.id === clusterId);
    const reserveCluster = clusters.find(c => c.name === 'reserve');
    
    let newClusters = clusters;
    
    if (clusterToDelete && reserveCluster && clusterToDelete.photos.length > 0) {
       newClusters = newClusters.map(c => {
           if (c.id === reserveCluster.id) {
               // Move photos to reserve, sorted
               const merged = [...c.photos, ...clusterToDelete.photos];
               return { ...c, photos: sortPhotosByOrderIndex(merged) };
           }
           return c;
       });
    }
    
    newClusters = newClusters.filter(c => c.id !== clusterId);
    setClusters(newClusters);
    
    // Queue for cluster deletion
    pendingClusterDeletes.current.add(clusterId);
    triggerAutoSave(newClusters);
  };

  const handleMoveCluster = async (clusterId: string, direction: 'up' | 'down') => {
    const currentIndex = clusters.findIndex(c => c.id === clusterId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= clusters.length) return;

    const currentCluster = clusters[currentIndex];
    const targetCluster = clusters[targetIndex];

    const newClusters = [...clusters];
    
    const tempOrder = currentCluster.order_index;
    currentCluster.order_index = targetCluster.order_index;
    targetCluster.order_index = tempOrder;

    newClusters.sort((a, b) => a.order_index - b.order_index);
    setClusters(newClusters);
    triggerAutoSave(newClusters);
  };

  const handleCreateCluster = async (orderIndex: number, photoIds: string[] = [], clusterId?: string) => {
    if (!job) return;
    try {
      const newCluster = await api.createCluster(job.id, `${job.title}`, orderIndex, photoIds);
      
      const sortedNewClusterPhotos = sortPhotosByOrderIndex(newCluster.photos || []);

      const newClusters = [...clusters, { ...newCluster, photos: sortedNewClusterPhotos }].sort((a, b) => a.order_index - b.order_index);
      setClusters(newClusters);
      triggerAutoSave(newClusters); // Trigger sync for the new cluster

      if (photoIds.length > 0) {
        const remainingSelection = selectedPhotoIds.filter(id => !photoIds.includes(id));
        setSelectedPhotoIds(remainingSelection);
        toast.success(`New place created with ${photoIds.length} photos.`);
      } else {
        toast.success('New empty place created.');
      }
    } catch (error) {
      toast.error('Failed to create new place');
    }
  };

  const handleAddPhotosToExistingCluster = async (clusterId: string, photoIds: string[]) => {
    if (!job || photoIds.length === 0) return;
    
    // Update local state ONLY. Sync will handle the backend association.
    const newClusters = clusters.map(c => {
      let newPhotos = c.photos.filter(p => !photoIds.includes(p.id));
      
      if (c.id === clusterId) {
        const movedPhotos = clusters
          .flatMap(cl => cl.photos)
          .filter(p => photoIds.includes(p.id));
          
        const uniqueMovedPhotos = Array.from(new Map(movedPhotos.map(p => [p.id, p])).values());
        newPhotos = sortPhotosByOrderIndex([...newPhotos, ...uniqueMovedPhotos]);
      }
      return { ...c, photos: newPhotos };
    });
    
    setClusters(newClusters);
    triggerAutoSave(newClusters);
    toast.success(`Added ${photoIds.length} photos to place`);
  };

  const handleExport = () => {
    if (!job) return;
    setExportMetadata({
      title: job.title,
      construction_type: job.construction_type || job.title,
      client_name: job.client_name || '',
    });
    setExportDialogOpen(true);
  };

  const handleConfirmExport = async () => {
    if (!job) return;
    setExportDialogOpen(false);
    setExporting(true);
    
    try {
      await api.startExport(job.id);
      
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
              {/* Instructions Bar */}
              {/* <div className="flex-shrink-0 bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-center gap-4 shadow-sm mb-2">
                <div className="bg-blue-100 px-2 py-1 rounded-full">
                  <LayoutGrid className="w-4 h-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-lg text-blue-900 font-medium">
                    Drag photos to arrange. Keep <strong>3 photos</strong> per place. Use the <strong>Reserve</strong> on the left for extras.
                  </p>
                </div>
                <Button size="lg" variant="outline" className="text-lg border-blue-200 hover:bg-blue-100" onClick={handleCreateCluster}>
                  <Plus className="w-6 h-6 mr-2" /> 장소 추가
                </Button>
              </div> */}
              
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
                    selectedPhotoIds={selectedPhotoIds}
                    onSelectPhoto={handleSelectPhoto}
                  />
              </div>
            </>
          )}
        </div>
      </main>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>PDF 내보내기 설정</DialogTitle>
            <DialogDescription>
              내보내기 전 작업 정보를 확인하고 수정할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                작업명
              </Label>
              <Input
                id="title"
                value={exportMetadata.title}
                onChange={(e) => setExportMetadata({ ...exportMetadata, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="construction_type" className="text-right">
                공종명
              </Label>
              <Input
                id="construction_type"
                value={exportMetadata.construction_type}
                onChange={(e) => setExportMetadata({ ...exportMetadata, construction_type: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="client_name" className="text-right">
                시행처
              </Label>
              <Input
                id="client_name"
                value={exportMetadata.client_name}
                onChange={(e) => setExportMetadata({ ...exportMetadata, client_name: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleConfirmExport}>내보내기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}