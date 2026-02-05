import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { v4 as uuidv4 } from "uuid";
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
import { Loader2, CheckCircle, Plus, X, FileDown, RefreshCw, Edit2, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { Popover, PopoverContent, PopoverTrigger, PopoverClose } from "@/components/ui/popover"

import { useJobActions } from '@/hooks/useJobActions';
import { UnsortedGrid } from '@/components/dashboard/UnsortedGrid';
import { ClusterSection } from '@/components/dashboard/ClusterSection';
import { ActionToolbar } from '@/components/dashboard/ActionToolbar';
import { FloatingActionBar } from '@/components/dashboard/FloatingActionBar';
import { ActionDrawer } from '@/components/dashboard/ActionDrawer';
import { GlobalErrorBoundary } from '@/components/GlobalErrorBoundary';
import { DashboardSectionErrorBoundary } from '@/components/dashboard/DashboardSectionErrorBoundary';
import { sortPhotosByOrderIndex } from '@/lib/utils';

export default function DashboardPage() {
    return (
        <GlobalErrorBoundary>
            <DashboardContent />
        </GlobalErrorBoundary>
    );
}

function DashboardContent() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhotos, setSelectedPhotos] = useState<{ id: string; clusterId: string }[]>([]);
  const [isClustering, setIsClustering] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<number | null>(null);
  const [showClusteringDialog, setShowClusteringDialog] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
  
  // Label Editing State
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editLabelData, setEditLabelData] = useState<Record<string, string>>({});

  // Job Info Editing State
  const [editJobDialogOpen, setEditJobDialogOpen] = useState(false);
  const [jobEditForm, setJobEditForm] = useState({
    title: '',
    company_name: '',
    work_date: '',
    construction_type: ''
  });

  // Export & Preview State
  const [exportMetadata, setExportMetadata] = useState({
    cover_title: '',
    cover_company_name: '',
  });
  const [labelSettings, setLabelSettings] = useState<{ id: string; key: string; value: string; isAutoDate?: boolean }[]>([
    { id: 'date', key: '일자', value: '', isAutoDate: true },
    { id: 'company', key: '시행처', value: '' },
  ]);

  const { 
    handleMovePhoto, 
    handleCreateCluster, 
    handleDeleteCluster, 
    handleDeletePhoto,
    handleRenameCluster,
    handleMoveCluster,
    handleAddPhotosToExistingCluster
  } = useJobActions({
    jobId: jobId!,
    jobTitle: job?.title,
    clusters,
    setClusters,
    selectedPhotos,
    setSelectedPhotos
  });

  const addLabelItem = () => {
    const newItem = {
      id: uuidv4(),
      key: "새 라벨",
      value: "",
    };

    setLabelSettings(prev => [...prev, newItem]);
  };

  const removeLabelItem = (id: string) => {
    setLabelSettings(labelSettings.filter(l => l.id !== id));
  };

  const updateLabelItem = (id: string, field: 'key' | 'value', newValue: string) => {
    setLabelSettings(labelSettings.map(l => l.id === id ? { ...l, [field]: newValue } : l));
  };
  
  useEffect(() => {
    if (!jobId) return;

    const fetchJobData = async () => {
      try {
        setError(null);
        const data = await api.getJobDetails(jobId);
        if (!data) throw new Error("데이터를 불러올 수 없습니다.");
        setJob(data);
        
        // Init edit form
        setJobEditForm({
            title: data.title,
            company_name: data.company_name || '',
            work_date: data.work_date ? format(new Date(data.work_date), 'yyyy-MM-dd') : '',
            construction_type: data.construction_type || ''
        });

        if (data.status === 'PENDING' || data.status === 'PROCESSING') {
          setIsClustering(true);
        }

        if (data.clusters) {
           const sorted = data.clusters
              .sort((a, b) => a.order_index - b.order_index)
              .map(c => ({...c, photos: sortPhotosByOrderIndex(c.photos)}));
           setClusters(sorted);
        }
        if (data.photos) setPhotos(data.photos);
      } catch (error) {
        console.error("Failed to load job data", error);
        setError("데이터를 불러오지 못했습니다.");
        toast.error("Failed to load job data");
      }
    };
    fetchJobData();
  }, [jobId]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isClustering && remainingTime !== null && remainingTime > 0) {
      interval = setInterval(() => {
        setRemainingTime((prev) => {
          if (prev === null || prev <= 0) return 0;
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClustering, remainingTime]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    let attempts = 0;

    const checkStatus = async () => {
      if (!isClustering || !jobId) return;

      try {
        const jobData = await api.getJob(jobId);
        
        if (jobData.status === 'COMPLETED') {
           const fullData = await api.getJobDetails(jobId);
           setJob(fullData);
           if (fullData.clusters) {
              const sorted = fullData.clusters
                  .sort((a, b) => a.order_index - b.order_index)
                  .map(c => ({...c, photos: sortPhotosByOrderIndex(c.photos)}));
              setClusters(sorted);
              toast.success(`Analysis complete. Found ${sorted.length} places.`);
           }
           setIsClustering(false);
           setEstimatedTime(null);
           setShowClusteringDialog(false);
           return; 
        } else if (jobData.status === 'FAILED') {
           setIsClustering(false);
           setEstimatedTime(null);
           setShowClusteringDialog(false);
           toast.error("Clustering failed.");
           return;
        }

        attempts++;
        const delay = Math.min(2000 * Math.pow(1.5, attempts), 10000); 
        timeoutId = setTimeout(checkStatus, delay);

      } catch (e) {
        console.warn("Polling error", e);
        timeoutId = setTimeout(checkStatus, 5000); 
      }
    };

    if (isClustering) {
       timeoutId = setTimeout(checkStatus, 1000);
    }

    return () => clearTimeout(timeoutId);
  }, [isClustering, jobId]);

  const handleUpdateJobInfo = async () => {
      if (!job) return;
      try {
          const updated = await api.updateJob(job.id, {
              title: jobEditForm.title,
              company_name: jobEditForm.company_name,
              work_date: jobEditForm.work_date || undefined,
              construction_type: jobEditForm.construction_type
          });
          setJob(prev => prev ? ({ ...prev, ...updated }) : prev);
          setEditJobDialogOpen(false);
          toast.success("Job info updated");
      } catch (e) {
          console.error(e);
          toast.error("Failed to update job info");
      }
  };

  const handleDownloadPDF = async () => {
    if (!job) return;
    try {
      const response = await api.getDownloadUrl(job.id);
      if (response.path) {
        window.open(response.path, '_blank');
      } else {
        toast.error("Download URL not found");
      }
    } catch (e) {
      toast.error("Failed to download PDF");
    }
  };

  const handleEditLabels = (photoId: string) => {
      const photo = clusters.flatMap(c => c.photos).find(p => p.id === photoId);
      if (photo) {
          setEditingPhotoId(photoId);
          setEditLabelData(photo.labels || {});
      }
  };

  const handleSaveLabels = async () => {
      if (!editingPhotoId || !jobId) return;
      
      const newLabels = { ...editLabelData };
      const targetPhoto = clusters
          .flatMap(c => c.photos)
          .find(p => p.id === editingPhotoId);

      if (!targetPhoto) return;

      const updatedPhoto = { ...targetPhoto, labels: newLabels };

      // Optimistic Update
      setClusters(prev => prev.map(c => ({
          ...c,
          photos: c.photos.map(p => p.id === editingPhotoId ? updatedPhoto : p)
      })));
      
      setEditingPhotoId(null);
      
      try {
          await api.updatePhoto(jobId, [updatedPhoto]);
          toast.success("라벨이 저장되었습니다.");
      } catch (e) {
          console.error("Failed to save labels", e);
          toast.error("라벨 저장 실패");
      }
  };

  const handleUpload = async (files: File[]) => {
    if (!job) return;
    try {
      toast.info("사진 업로드를 시작합니다...");
      await api.uploadPhotos(job.id, Array.from(files));
      
      setTimeout(async () => {
          const jobData = await api.getJobDetails(job.id);
          
          if (jobData) {
            setJob(jobData);
            
            if (jobData.clusters) {
              const sorted = jobData.clusters
                .sort((a, b) => a.order_index - b.order_index)
                .map(c => ({...c, photos: sortPhotosByOrderIndex(c.photos)}));
              setClusters(sorted);
            }
            if (jobData.photos) setPhotos(jobData.photos);
          }
          toast.success("사진 전송을 모두 마쳤습니다.");
      }, 0);
    } catch (error) {
      console.error("Upload failed", error);
      toast.error("업로드 중 오류가 발생했습니다.");
    }
  };

  const handleStartClustering = async () => {
    if (!job) return;
    setIsClustering(true);
    setEstimatedTime(null);
    setRemainingTime(null);
    setShowClusteringDialog(true);
    try {
      const result = await api.startClustering(job.id);
      if (result.estimated_time) {
          setEstimatedTime(result.estimated_time);
          setRemainingTime(result.estimated_time);
      }
    } catch (error) {
      console.error("Clustering failed", error);
      toast.error("Failed to cluster photos");
      setIsClustering(false);
      setShowClusteringDialog(false);
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

  const handleExport = () => {
    if (!job) return;
    setExportMetadata({
      cover_title: job.title,
      cover_company_name: job.company_name || '',
    });
    
    const allPhotoLabels = new Set<string>();
    clusters.forEach(cluster => {
      cluster.photos.forEach(photo => {
        if (photo.labels) {
          Object.keys(photo.labels).forEach(key => allPhotoLabels.add(key));
        }
      });
    });

    setLabelSettings(prev => {
        const newSettings = [...prev];
        const existingKeys = new Set(newSettings.map(s => s.key));
        
        allPhotoLabels.forEach(labelKey => {
            if (!existingKeys.has(labelKey)) {
                newSettings.push({ 
                    id: `custom-${labelKey}`, 
                    key: labelKey, 
                    value: '', 
                    isAutoDate: false 
                });
            }
        });
        
        return newSettings.map(l => {
            if (l.id === 'company' && !l.value) return { ...l, value: job.company_name || '' };
            return l;
        });
    });
    
    setExportDialogOpen(true);
  };

  const handleConfirmExport = async () => {
    if (!job) return;
    setExportDialogOpen(false);
    setExporting(true);
    
    try {
      const visible_keys: string[] = [];
      const overrides: Record<string, string> = {};

      labelSettings.forEach(l => {
          visible_keys.push(l.key);
          if (l.value) {
              overrides[l.key] = l.value;
          }
      });

      const payload = {
        ...exportMetadata,
        labels: {
            visible_keys,
            overrides
        }
      };

      await api.startExport(job.id, payload);
      
      const interval = setInterval(async () => {
        const status = await api.getExportStatus(job.id);
        if (status.status === 'EXPORTED') {
          clearInterval(interval);
          setExporting(false);
          toast.success('PDF Export Successful');
          if (status.pdf_url) {
            setDownloadUrl(status.pdf_url);
            setDownloadDialogOpen(true);
          }
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

  const handleBatchDelete = async () => {
      const toDelete = [...selectedPhotos];
      for (const p of toDelete) {
          await handleDeletePhoto(p.id, p.clusterId);
      }
      setSelectedPhotos([]);
      setActionDrawerOpen(false);
  };

  const handleBatchMove = async (targetClusterId: string) => {
      await handleAddPhotosToExistingCluster(targetClusterId, selectedPhotos);
      setActionDrawerOpen(false);
  };

  const previewCluster = clusters.find(c => c.name !== 'reserve') || clusters[0];
  const previewPhotos = previewCluster?.photos || [];
  
  if (error) {
      return (
          <div className="h-screen flex flex-col items-center justify-center gap-6 bg-gray-50">
              <div className="text-center space-y-2">
                  <p className="text-xl font-bold text-gray-800">{error}</p>
                  <p className="text-gray-500">네트워크 상태를 확인하거나 잠시 후 다시 시도해주세요.</p>
              </div>
              <Button size="lg" onClick={() => window.location.reload()} className="bg-blue-600 hover:bg-blue-700">
                  <RefreshCw className="w-5 h-5 mr-2" />
                  다시 시도
              </Button>
          </div>
      );
    }
  
  if (!job) return <div data-testid="loader" className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="h-screen bg-gray-100 flex flex-col font-sans overflow-hidden">
      <ActionToolbar
        job={job}
        clusters={clusters}
        isClustering={isClustering}
        exporting={exporting}
        onEditJob={() => setEditJobDialogOpen(true)}
        onStartClustering={handleStartClustering}
        onEditLabels={() => navigate(`/jobs/${job.id}/edit`)}
        onDownloadPDF={handleDownloadPDF}
        onExport={handleExport}
      />

      <main className="flex-1 p-2 md:p-6 max-w-[2000px] mx-auto w-full overflow-y-auto flex flex-col relative">
        <DashboardSectionErrorBoundary>
            <div className="flex flex-col h-full gap-4">
            {clusters.length === 0 ? (
                <UnsortedGrid 
                photos={photos} 
                isClustering={isClustering} 
                onStartClustering={handleStartClustering} 
                onUpload={handleUpload} 
                />
            ) : (
                <ClusterSection
                    clusters={clusters}
                    isClustering={isClustering}
                    selectedPhotos={selectedPhotos}
                    onMovePhoto={handleMovePhoto}
                    onCreateCluster={handleCreateCluster}
                    onDeleteCluster={handleDeleteCluster}
                    onMoveCluster={handleMoveCluster}
                    onAddPhotosToExistingCluster={handleAddPhotosToExistingCluster}
                    onRenameCluster={handleRenameCluster}
                    onDeletePhoto={handleDeletePhoto}
                    onSelectPhoto={handleSelectPhoto}
                    onEditLabels={handleEditLabels}
                />
            )}
            </div>
        </DashboardSectionErrorBoundary>

        <FloatingActionBar 
            selectedCount={selectedPhotos.length}
            onClearSelection={() => setSelectedPhotos([])}
            onMoveClick={() => setActionDrawerOpen(true)}
            onDeleteClick={handleBatchDelete}
        />
      </main>

      <ActionDrawer 
        open={actionDrawerOpen}
        onOpenChange={setActionDrawerOpen}
        selectedCount={selectedPhotos.length}
        clusters={clusters}
        onMoveToCluster={handleBatchMove}
        onDelete={handleBatchDelete}
      />

      {/* Label Edit Dialog */}
      <Dialog open={!!editingPhotoId} onOpenChange={(open) => !open && setEditingPhotoId(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>사진 라벨 수정</DialogTitle>
             <DialogDescription>
               사진에 표시될 라벨 정보를 수정합니다.
             </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
             {Object.entries(editLabelData).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
                   <Input 
                     value={key} 
                     className="bg-gray-50"
                     readOnly
                     placeholder="Key" 
                   />
                   <Input 
                     value={value} 
                     onChange={(e) => {
                       setEditLabelData({...editLabelData, [key]: e.target.value});
                     }} 
                     placeholder="Value" 
                   />
                   <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => {
                       const newLabels = {...editLabelData};
                       delete newLabels[key];
                       setEditLabelData(newLabels);
                   }}>
                      <X className="w-4 h-4 rotate-180" />
                   </Button>
                </div>
             ))}
             <div className="relative my-2">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-muted-foreground">새 항목 추가</span></div>
             </div>
             <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
                <Input id="new-key" placeholder="항목명" />
                <Input id="new-value" placeholder="내용" />
                <Button size="icon" variant="outline" onClick={() => {
                    const keyEl = document.getElementById('new-key') as HTMLInputElement;
                    const valEl = document.getElementById('new-value') as HTMLInputElement;
                    if(keyEl.value) {
                        setEditLabelData({...editLabelData, [keyEl.value]: valEl.value});
                        keyEl.value = '';
                        valEl.value = '';
                    }
                }}>
                   <Plus className="w-4 h-4" />
                </Button>
             </div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setEditingPhotoId(null)}>취소</Button>
             <Button onClick={handleSaveLabels}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Info Edit Dialog */}
      <Dialog open={editJobDialogOpen} onOpenChange={setEditJobDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>작업 정보 수정</DialogTitle>
            <DialogDescription>
              작업명, 시행처 등의 기본 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                작업명
              </Label>
              <Input
                id="title"
                value={jobEditForm.title}
                onChange={(e) => setJobEditForm({ ...jobEditForm, title: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="work_date" className="text-right">
                작업일자
              </Label>
              <Input
                id="work_date"
                type="date"
                value={jobEditForm.work_date}
                onChange={(e) => setJobEditForm({ ...jobEditForm, work_date: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="company_name" className="text-right">
                시행처
              </Label>
              <Input
                id="company_name"
                value={jobEditForm.company_name}
                onChange={(e) => setJobEditForm({ ...jobEditForm, company_name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="construction_type" className="text-right">
                공종명
              </Label>
              <Input
                id="construction_type"
                value={jobEditForm.construction_type}
                onChange={(e) => setJobEditForm({ ...jobEditForm, construction_type: e.target.value })}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditJobDialogOpen(false)}>취소</Button>
            <Button type="submit" onClick={handleUpdateJobInfo}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clustering Progress Dialog */}
      <Dialog open={showClusteringDialog} onOpenChange={setShowClusteringDialog}>
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 bg-white border-b shrink-0">
            <DialogTitle className="text-3xl font-black text-center text-slate-900">사진 분류 작업 중</DialogTitle>
            <DialogDescription className="text-center text-lg font-bold text-slate-500 mt-2">
              인공지능이 현장별로 사진을 정리하고 있어요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-12 px-8 bg-slate-50/50">
            <div className="relative mb-8">
              <Loader2 className="w-24 h-24 animate-spin text-blue-600" />
              <CheckCircle className="w-8 h-8 text-blue-200 absolute inset-0 m-auto" />
            </div>
            
            <p className="text-2xl font-black text-gray-800 text-center">
              지금 열심히 정리하고 있어요!
            </p>
            
            {remainingTime !== null && remainingTime > 0 ? (
                <div className="mt-6 bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xl shadow-xl shadow-blue-100 animate-in zoom-in-50">
                   약 {Math.ceil(remainingTime)}초 남음
                </div>
            ) : (
                <div className="mt-6 bg-slate-200 text-slate-500 px-8 py-3 rounded-2xl font-black text-xl animate-pulse">
                   시간 계산 중...
                </div>
            )}
            
            <p className="mt-10 text-base text-gray-500 text-center font-bold leading-relaxed">
              페이지를 닫거나 다른 작업을 하셔도 괜찮습니다. <br/>
              정리가 끝나면 자동으로 사진들이 나타나요!
            </p>
          </div>
        </DialogContent>
      </Dialog>

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
                           value={exportMetadata.cover_title}
                           onChange={(e) => setExportMetadata({...exportMetadata, cover_title: e.target.value})}
                           placeholder="작업명 입력"
                        />
                        <div className="mt-16 bg-gray-100 border border-gray-300 px-10 py-4 inline-block">
                             <span className="text-3xl font-bold tracking-widest">사 진 대 지</span>
                        </div>
                    </div>

                    {/* Bottom Company */}
                    <div className="mb-20 w-full text-center">
                      <input
                          className="w-full text-center text-xl font-bold border-b-2 border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none bg-transparent py-2"
                          value={exportMetadata.cover_company_name}
                          onChange={(e) => setExportMetadata({...exportMetadata, cover_company_name: e.target.value})}
                          placeholder='시행처 입력'
                      />
                    </div>
                 </div>
              </div>

              {/* Page 1 Preview (Right) */}
              <div className="flex flex-col items-center gap-4">
                 <div className="flex items-center justify-between w-[450px]">
                    <h3 className="text-lg font-bold text-gray-700">첫장 미리보기 (예시)</h3>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-8 gap-2 text-sm text-gray-600 hover:text-blue-600" onClick={() => navigate(`/jobs/${job.id}/edit`, { state: { labelSettings } })}>
                           <Edit2 className="w-4 h-4" /> 라벨 전체 보기
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
                                                <X className="w-4 h-4 rotate-180" />
                                            </Button>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 mt-1">
                                      <Button variant="outline" size="sm" className="flex-1 h-8 text-sm" onClick={addLabelItem}>
                                          + 항목 추가
                                      </Button>
                                      <PopoverClose asChild>
                                        <Button 
                                          variant="outline" 
                                          size="sm" 
                                          className="h-8 text-sm"
                                        >
                                          저장
                                        </Button>
                                      </PopoverClose>
                                    </div>
                                </div>
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
                                {previewCluster?.name || '공종명 없음'}
                            </div>
                        </div>

                        {/* Rows */}
                        {['전', '중', '후'].map((label, idx) => {
                             const photo = previewPhotos[idx];
                             return (
                                <div key={label} className="flex-1 flex border-b border-black last:border-b-0 min-h-0">
                                    <div className="w-20 bg-gray-50 border-r border-black flex items-center justify-center font-bold text-lg">
                                        {label}
                                    </div>
                                    <div className="flex-1 relative p-1 flex items-center justify-center overflow-hidden bg-gray-50/10">
                                        {photo ? (
                                            <>
                                                <img 
                                                    src={photo.thumbnail_url || photo.url} 
                                                    alt={label} 
                                                    className="w-full h-full object-contain"
                                                />
                                                {/* Label Box Overlay */}
                                                <div className="absolute top-3 left-3 bg-white/95 border border-gray-300 p-2 shadow-sm rounded-sm text-xs leading-relaxed z-10 whitespace-nowrap">
                                                    {labelSettings.map(l => {
                                                        const val = l.isAutoDate && !l.value 
                                                            ? (photo.timestamp ? format(new Date(photo.timestamp), 'yyyy.MM.dd') : '-') 
                                                            : (l.value || '');
                                                        
                                                        if (!val) return null;

                                                        return (
                                                            <div key={l.id}>
                                                                <span className="font-bold text-gray-800">{l.key} :</span>{' '}
                                                                <span className="text-gray-900">{val}</span>
                                                            </div>
                                                        );
                                                    })}
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

      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>PDF 생성 완료!</DialogTitle>
            <DialogDescription>
              아래 버튼을 눌러 다운로드하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <Button size="lg" className="w-full gap-2 text-lg h-12 bg-green-600 hover:bg-green-700" onClick={() => {
              if (downloadUrl) window.open(downloadUrl, '_blank');
              setDownloadDialogOpen(false);
            }}>
              <FileDown className="w-6 h-6" />
              PDF 다운로드
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
