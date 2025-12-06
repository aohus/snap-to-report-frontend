import { useState, useEffect, useRef } from 'react';
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

  // Auto-save helper
  const triggerAutoSave = (updatedClusters: Cluster[]) => {
    if (!job) return;
    setSaving(true);
    if (saveTimer.current) clearTimeout(saveTimer.current);

    saveTimer.current = setTimeout(async () => {
      try {
        await api.syncClusters(job.id, updatedClusters);
        setSaving(false);
      } catch (error) {
        console.error("Auto-save failed", error);
        setSaving(false);
      }
    }, 2000);
  };

  // Load selection from local storage
  useEffect(() => {
    if (jobId) {
      const saved = localStorage.getItem(`selectedPhotoIds_${jobId}`);
      if (saved) {
        try {
          setSelectedPhotoIds(JSON.parse(saved));
        } catch (e) {
          console.error("Failed to parse selectedPhotoIds", e);
        }
      }
      isSelectionLoaded.current = true;
    }
  }, [jobId]);

  // Save selection to local storage
  useEffect(() => {
    if (jobId && isSelectionLoaded.current) {
      localStorage.setItem(`selectedPhotoIds_${jobId}`, JSON.stringify(selectedPhotoIds));
    }
  }, [selectedPhotoIds, jobId]);

  useEffect(() => {
    if (jobId) {
      loadJobData(jobId);
    }
  }, [jobId]);

  const loadJobData = async (id: string) => {
    try {
      setLoading(true);
      // Optimized: Fetch all job details in a single API call
      const jobData = await api.getJobDetails(id);
      
      setJob(jobData);
      setPhotos(jobData.photos);
      setClusters(jobData.clusters);

      if (jobData.status === "PROCESSING" || jobData.status === "PENDING") { // Handle PENDING as well
        setIsClustering(true);
      };
    } catch (error) {
      console.error(error);
      toast.error('Failed to load job data');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPhoto = (photoId: string) => {
    setSelectedPhotoIds(prev =>
      prev.includes(photoId)
        ? prev.filter(id => id !== photoId)
        : [...prev, photoId]
    );
  };

  const handleUpload = async (files: File[]) => {
    if (!job) return;
    try {
      setLoading(true);
      setUploadProgress(0);
      await api.uploadPhotos(job.id, files, (percent) => setUploadProgress(percent));
      toast.success('Photos uploaded successfully');
      // Reload full data to get new photos
      await loadJobData(job.id);
    } catch (error) {
      toast.error('Failed to upload photos');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const handleStartClustering = async () => {
    if (!job) return;
    try {
      setIsClustering(true);
      toast.info('Starting photo clustering...');
      await api.startClustering(job.id);

      // Polling for status only
      const interval = setInterval(async () => {
        try {
          const jobStatus = await api.getJob(job.id); // Lightweight status check
          if (jobStatus.status === 'COMPLETED' || jobStatus.status === 'FAILED') {
            clearInterval(interval);
            setIsClustering(false);
            if (jobStatus.status === 'COMPLETED') {
              toast.success('Clustering complete!');
              await loadJobData(job.id); // Fetch full data only on completion
            } else {
              toast.error('Clustering failed. Please try again.');
            }
          }
        } catch (error) {
          clearInterval(interval);
          setIsClustering(false);
          toast.error('Error checking clustering status.');
        }
      }, 3000);
    } catch (error) {
      setIsClustering(false);
      toast.error('Failed to start clustering.');
    }
  };

  const handleMovePhoto = async (photoId: string, sourceClusterId: string, targetClusterId: string) => {
    const newClusters = clusters.map(c => {
      if (c.id === sourceClusterId) {
        return { ...c, photos: c.photos.filter(p => p.id !== photoId) };
      }
      if (c.id === targetClusterId) {
        const sourceCluster = clusters.find(cl => cl.id === sourceClusterId);
        const photo = sourceCluster?.photos.find(p => p.id === photoId);
        if (photo) {
          return { ...c, photos: [...c.photos, photo] };
        }
      }
      return c;
    });
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

    try {
        await api.deletePhoto(photoId);
        toast.success('Photo deleted');
    } catch (error) {
        toast.error('Failed to delete photo');
    }
  };

  const handleRenameCluster = async (clusterId: string, newName: string) => {
    setClusters(prev => prev.map(c => c.id === clusterId ? { ...c, name: newName } : c));
    try {
      await api.updateCluster(clusterId, { new_name: newName });
    } catch (error) {
      console.error(error);
      toast.error('Failed to rename place');
    }
  };

  const handleDeleteCluster = async (clusterId: string) => {
    // if (!confirm('Are you sure you want to delete this place? Photos will be moved to reserve.')) return;

    const clusterToDelete = clusters.find(c => c.id === clusterId);
    const reserveCluster = clusters.find(c => c.name === 'reserve');
    
    let newClusters = clusters;
    
    // Optimistically move photos to reserve if it exists
    if (clusterToDelete && reserveCluster && clusterToDelete.photos.length > 0) {
       newClusters = newClusters.map(c => {
           if (c.id === reserveCluster.id) {
               return { ...c, photos: [...c.photos, ...clusterToDelete.photos] };
           }
           return c;
       });
    }
    
    newClusters = newClusters.filter(c => c.id !== clusterId);
    setClusters(newClusters);

    try {
      await api.deleteCluster(clusterId);
      toast.success('Place deleted');
    } catch (error) {
      toast.error('Failed to delete place');
    }
  };

  const handleMoveCluster = async (clusterId: string, direction: 'up' | 'down') => {
    const currentIndex = clusters.findIndex(c => c.id === clusterId);
    if (currentIndex === -1) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= clusters.length) return;

    const currentCluster = clusters[currentIndex];
    const targetCluster = clusters[targetIndex];

    const newClusters = [...clusters];
    
    // Swap order_index values
    const tempOrder = currentCluster.order_index;
    currentCluster.order_index = targetCluster.order_index;
    targetCluster.order_index = tempOrder;

    // Sort by order_index
    newClusters.sort((a, b) => a.order_index - b.order_index);
    setClusters(newClusters);
    triggerAutoSave(newClusters);
  };

  const handleCreateCluster = async (orderIndex: number, photoIds: string[] = [], clusterId?: string) => {
    if (!job) return;
    try {
      // API call needed to get valid ID
      const newCluster = await api.createCluster(job.id, `${job.title}`, orderIndex, photoIds);
      
      // Insert into local state
      const newClusters = [...clusters, newCluster].sort((a, b) => a.order_index - b.order_index);
      setClusters(newClusters);

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
    
    const targetClusterId = String(clusterId);
    const movingIds = new Set(photoIds.map(String));

    try {
      await api.addPhotosToExistingCluster(targetClusterId, photoIds);
      
      // Get all photos that are being moved (to ensure we have the objects)
      const photosToMove = clusters
        .flatMap(c => c.photos)
        .filter(p => movingIds.has(String(p.id)));

      // Update local state
      const newClusters = clusters.map(c => {
        // 1. Remove moved photos from ALL clusters
        let newPhotos = c.photos.filter(p => !movingIds.has(String(p.id)));
        
        // 2. Add photos to the TARGET cluster
        if (String(c.id) === targetClusterId) {
          // Use a Map to ensure uniqueness by ID, avoiding any potential duplication
          const uniqueMap = new Map();
          
          // Add existing photos (that weren't moved out)
          newPhotos.forEach(p => uniqueMap.set(String(p.id), p));
          
          // Add the moved photos
          photosToMove.forEach(p => uniqueMap.set(String(p.id), p));
          
          newPhotos = Array.from(uniqueMap.values());
        }
        
        return { ...c, photos: newPhotos };
      });

      setClusters(newClusters);
      triggerAutoSave(newClusters);

      // Remove used photos from selection
      const remainingSelection = selectedPhotoIds.filter(id => !movingIds.has(String(id)));
      setSelectedPhotoIds(remainingSelection);

      toast.success(`Added ${photoIds.length} photos to place.`);
    } catch (error) {
      console.error(error);
      toast.error('Failed to add photos to place');
    }
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
      await api.updateJob(job.id, exportMetadata);
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
            {/* <Button size="base" variant="outline" className="h-10 px-4 text-base border-2 border-green-600 text-green-600 hover:bg-green-100" onClick={handleCreateCluster}>
              <Plus className="w-6 h-6 mr-2" /> 
              {selectedPhotoIds.length > 0 ? `${selectedPhotoIds.length}개의 사진으로 장소 추가` : '장소 추가'}
            </Button> */}
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