import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api';
import { Job, Cluster, Photo } from '@/types';
import { PhotoUploader } from '@/components/PhotoUploader';
import { PhotoGrid } from '@/components/PhotoGrid';
import { ClusterBoard } from '@/components/ClusterBoard';
import { LogOut, FileDown, Loader2, LayoutGrid, ArrowLeft } from 'lucide-react';
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
    // Optimistic update
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

    try {
      await api.movePhoto(photoId, targetClusterId);
      const cls = await api.getClusters(job!.id);
      setClusters(cls);
    } catch (error) {
      toast.error('Failed to move photo');
      // Revert on failure
      const cls = await api.getClusters(job!.id);
      setClusters(cls);
    }
  };

  const handleDeletePhoto = async (photoId: string, clusterId: string) => {
    // Optimistic update
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
        const cls = await api.getClusters(job!.id);
        setClusters(cls);
    }
  };

  const handleRenameCluster = async (clusterId: string, newName: string) => {
    setClusters(prev => prev.map(c => c.id === clusterId ? { ...c, name: newName } : c));
    try {
      await api.updateCluster(clusterId, { new_name: newName });
    } catch (error) {
      toast.error('Failed to rename place');
    }
  };

  const handleCreateCluster = async (orderIndex: number, clusterId?: string) => {
    if (!job) return;
    try {
      if (selectedPhotoIds.length > 0) {
        await api.createCluster(job.id, `${job.title}`, orderIndex, selectedPhotoIds);
        setSelectedPhotoIds([]);
        toast.success(`New place created with ${selectedPhotoIds.length} photos.`);
      } else {
        await api.createCluster(job.id, `${job.title}`, orderIndex);
        toast.success('New empty place created.');
      }
      const clusterData = await api.getClusters(job.id);
      setClusters(clusterData);
    } catch (error) {
      toast.error('Failed to create new place');
    }
  };

  const handleExport = async () => {
    if (!job) return;
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
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Progress</span>
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
    </div>
  );
}