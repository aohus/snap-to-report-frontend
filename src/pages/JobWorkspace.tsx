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
import { motion } from 'framer-motion';
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
    handleAddPhotosToExistingCluster,
    handleBatchDeletePhotos
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

  const handleSelectPhoto = (photoId: string, clusterId: string, e?: React.MouseEvent) => {
    if (!e || (!e.ctrlKey && !e.metaKey && !e.shiftKey)) {
        // Normal click: toggle single, but usually clears others if we want strict behavior.
        // For now, toggle single as before.
        setSelectedPhotos(prev => {
            const exists = prev.some(p => p.id === photoId);
            if (exists && prev.length === 1) return [];
            return [{ id: photoId, clusterId }];
        });
        return;
    }
    // Logic for modifiers will be handled by ClusterBoard via onSetSelectedPhotos if we add it,
    // or we can pass the whole array from handleSelectPhoto if we update the signature.
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
      if (confirm(`선택한 ${selectedPhotos.length}장의 사진을 정말 삭제하시겠습니까?`)) {
          await handleBatchDeletePhotos(selectedPhotos);
          setActionDrawerOpen(false);
      }
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
    <div className="h-screen bg-slate-50 flex flex-col font-sans overflow-hidden selection:bg-primary/10 selection:text-primary">
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

      <main className={cn(
        "flex-1 p-4 md:p-8 max-w-[2000px] mx-auto w-full flex flex-col relative custom-scrollbar",
        clusters.length > 0 ? "overflow-hidden" : "overflow-y-auto"
      )}>
        <DashboardSectionErrorBoundary>
            <div className="flex flex-col h-full gap-6">
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
                    onSetSelectedPhotos={setSelectedPhotos} // New bulk update prop
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
        <DialogContent className="max-w-md rounded-3xl border-none shadow-2xl p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">사진 상세 정보 수정</DialogTitle>
             <DialogDescription className="text-base font-medium text-slate-500">
               사진에 표시될 라벨 내용을 자유롭게 수정하세요.
             </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 max-h-[50vh] overflow-y-auto px-1 custom-scrollbar">
             {Object.entries(editLabelData).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[1fr_2fr_auto] items-center gap-3 bg-slate-50 p-2 rounded-xl border border-slate-100">
                   <span className="text-sm font-black text-slate-400 uppercase tracking-wider text-center">{key}</span>
                   <Input 
                     value={value} 
                     onChange={(e) => {
                       setEditLabelData({...editLabelData, [key]: e.target.value});
                     }} 
                     placeholder="내용 입력..." 
                     className="h-10 rounded-lg border-slate-200 bg-white font-bold"
                   />
                   <Button size="icon" variant="ghost" className="text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg" onClick={() => {
                       const newLabels = {...editLabelData};
                       delete newLabels[key];
                       setEditLabelData(newLabels);
                   }}>
                      <X className="w-4 h-4" />
                   </Button>
                </div>
             ))}
             
             <div className="mt-6 pt-6 border-t border-slate-100">
                <h4 className="text-sm font-black text-slate-900 mb-3 ml-1">새 항목 추가</h4>
                <div className="grid grid-cols-[1fr_2fr_auto] items-center gap-3">
                    <Input id="new-key" placeholder="항목명" className="h-11 rounded-xl border-slate-200" />
                    <Input id="new-value" placeholder="내용" className="h-11 rounded-xl border-slate-200" />
                    <Button size="icon" className="h-11 w-11 rounded-xl shadow-md" onClick={() => {
                        const keyEl = document.getElementById('new-key') as HTMLInputElement;
                        const valEl = document.getElementById('new-value') as HTMLInputElement;
                        if(keyEl.value) {
                            setEditLabelData({...editLabelData, [keyEl.value]: valEl.value});
                            keyEl.value = '';
                            valEl.value = '';
                        }
                    }}>
                    <Plus className="w-5 h-5 stroke-[3]" />
                    </Button>
                </div>
             </div>
          </div>
          <DialogFooter className="mt-8 gap-2">
             <Button variant="outline" onClick={() => setEditingPhotoId(null)} className="h-12 rounded-xl font-bold flex-1">취소</Button>
             <Button onClick={handleSaveLabels} className="h-12 rounded-xl font-black flex-1 shadow-lg shadow-primary/20">저장하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Job Info Edit Dialog */}
      <Dialog open={editJobDialogOpen} onOpenChange={setEditJobDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">현장 작업 정보 수정</DialogTitle>
            <DialogDescription className="text-base font-medium text-slate-500 mt-1">
              작업명, 시행처 등 기본 정보를 수정합니다.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-2">
            <div className="space-y-2">
              <Label htmlFor="title" className="text-sm font-black text-slate-700 ml-1">작업명</Label>
              <Input
                id="title"
                value={jobEditForm.title}
                onChange={(e) => setJobEditForm({ ...jobEditForm, title: e.target.value })}
                className="h-12 rounded-xl border-slate-200 font-bold"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="work_date" className="text-sm font-black text-slate-700 ml-1">작업일자</Label>
                    <Input
                        id="work_date"
                        type="date"
                        value={jobEditForm.work_date}
                        onChange={(e) => setJobEditForm({ ...jobEditForm, work_date: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 font-bold"
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="construction_type" className="text-sm font-black text-slate-700 ml-1">공종명</Label>
                    <Input
                        id="construction_type"
                        value={jobEditForm.construction_type}
                        onChange={(e) => setJobEditForm({ ...jobEditForm, construction_type: e.target.value })}
                        className="h-12 rounded-xl border-slate-200 font-bold"
                    />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="company_name" className="text-sm font-black text-slate-700 ml-1">시행처</Label>
              <Input
                id="company_name"
                value={jobEditForm.company_name}
                onChange={(e) => setJobEditForm({ ...jobEditForm, company_name: e.target.value })}
                className="h-12 rounded-xl border-slate-200 font-bold"
              />
            </div>
          </div>
          <DialogFooter className="mt-8 gap-2">
            <Button variant="outline" onClick={() => setEditJobDialogOpen(false)} className="h-12 rounded-xl font-bold flex-1">취소</Button>
            <Button type="submit" onClick={handleUpdateJobInfo} className="h-12 rounded-xl font-black flex-1 shadow-lg shadow-primary/20">정보 업데이트</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clustering Progress Dialog */}
      <Dialog open={showClusteringDialog} onOpenChange={setShowClusteringDialog}>
        <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-elevated p-0 overflow-hidden bg-white">
          <DialogHeader className="p-10 pb-0 shrink-0">
            <div className="bg-primary/5 w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 mx-auto">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
            <DialogTitle className="text-3xl font-black text-center text-slate-900 tracking-tighter">사진 분류 분석 중</DialogTitle>
            <DialogDescription className="text-center text-base font-bold text-slate-400 mt-2 tracking-tight">
              인공지능이 최적의 현장별 분류를 <br/>구성하고 있습니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-12 px-10">
            <p className="text-xl font-black text-slate-800 text-center tracking-tight mb-8">
              거의 다 되었습니다!
            </p>
            
            {remainingTime !== null && remainingTime > 0 ? (
                <div className="w-full space-y-4">
                    <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-200/50">
                        <motion.div 
                            className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_15px_rgba(16,42,67,0.3)]"
                            initial={{ width: "0%" }}
                            animate={{ width: "100%" }}
                            transition={{ duration: estimatedTime || 30, ease: "linear" }}
                        />
                    </div>
                    <div className="flex justify-center">
                        <span className="bg-slate-900 text-white px-6 py-2 rounded-full font-black text-sm tracking-widest shadow-xl border border-white/10 animate-in zoom-in-50">
                           예상 남은 시간: 약 {Math.ceil(remainingTime)}초
                        </span>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-4">
                    <div className="h-12 px-8 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center font-black text-sm animate-pulse tracking-widest uppercase">
                       사진 분석 중...
                    </div>
                </div>
            )}
            
            <p className="mt-12 text-xs text-slate-400 text-center font-black uppercase tracking-[0.2em] leading-relaxed opacity-60">
              이 창을 닫으셔도 좋습니다. <br/>
              분류 결과는 자동으로 반영됩니다.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full md:max-w-[1400px] h-[90vh] flex flex-col p-0 gap-0 bg-slate-50 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="p-8 bg-white border-b shrink-0">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">PDF 내보내기 설정</DialogTitle>
            <DialogDescription className="text-base font-medium text-slate-500 mt-1">
              최종 리포트를 생성하기 전 표지와 레이아웃을 확인하세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
            <div className="flex flex-col xl:flex-row gap-16 justify-center items-start min-h-[700px]">
              
              {/* Cover Preview (Left) */}
              <div className="flex flex-col items-center gap-6">
                 <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">표지 미리보기</h3>
                 <div className="w-[450px] h-[636px] bg-white shadow-elevated rounded-sm flex flex-col items-center justify-between p-12 relative ring-1 ring-slate-200 hover:ring-2 hover:ring-primary/20 transition-all">
                    {/* Top Title */}
                    <div className="mt-20 w-full text-center">
                        <input
                           className="w-full text-center text-3xl font-black border-b-2 border-transparent hover:border-slate-200 focus:border-primary focus:outline-none bg-transparent py-2 transition-all"
                           value={exportMetadata.cover_title}
                           onChange={(e) => setExportMetadata({...exportMetadata, cover_title: e.target.value})}
                           placeholder="작업명 입력"
                        />
                        <div className="mt-16 bg-slate-50 border border-slate-200 px-10 py-4 inline-block rounded-lg shadow-inner">
                             <span className="text-3xl font-black tracking-[0.3em] text-slate-800">사 진 대 지</span>
                        </div>
                    </div>

                    {/* Bottom Company */}
                    <div className="mb-20 w-full text-center">
                      <input
                          className="w-full text-center text-xl font-bold border-b-2 border-transparent hover:border-slate-200 focus:border-primary focus:outline-none bg-transparent py-2 transition-all text-slate-600"
                          value={exportMetadata.cover_company_name}
                          onChange={(e) => setExportMetadata({...exportMetadata, cover_company_name: e.target.value})}
                          placeholder='시행처 입력'
                      />
                    </div>
                 </div>
              </div>

              {/* Page 1 Preview (Right) */}
              <div className="flex flex-col items-center gap-6">
                 <div className="flex items-center justify-between w-[450px]">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">첫 장 레이아웃</h3>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="h-9 px-4 gap-2 text-sm font-black text-slate-500 hover:text-primary hover:bg-primary/5 rounded-xl transition-all" onClick={() => navigate(`/jobs/${job.id}/edit`, { state: { labelSettings } })}>
                           <Edit2 className="w-4 h-4" /> 라벨 전체 편집
                        </Button>
                        <Popover>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="h-9 px-4 gap-2 text-sm font-black border-slate-200 rounded-xl shadow-sm hover:bg-white hover:border-slate-300">
                            <Settings className="w-4 h-4 opacity-60" /> 라벨 설정
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-80 rounded-2xl shadow-elevated border-slate-100 p-4">
                            <div className="grid gap-4">
                                <div className="space-y-1.5">
                                    <h4 className="text-sm font-black text-slate-900 leading-none">라벨 텍스트 설정</h4>
                                    <p className="text-[11px] font-medium text-slate-400">사진 위에 표시될 정보를 설정합니다.</p>
                                </div>
                                <div className="grid gap-2">
                                    {labelSettings.map((label) => (
                                        <div key={label.id} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
                                            <Input 
                                                className="h-8 text-xs px-2 font-bold rounded-lg" 
                                                value={label.key}
                                                onChange={(e) => updateLabelItem(label.id, 'key', e.target.value)}
                                                placeholder="항목"
                                            />
                                            <div className="relative">
                                                <Input 
                                                    className="h-8 text-xs px-2 font-bold rounded-lg bg-slate-50" 
                                                    value={label.value}
                                                    onChange={(e) => updateLabelItem(label.id, 'value', e.target.value)}
                                                    placeholder={label.isAutoDate ? "자동 (촬영일자)" : "내용"}
                                                />
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-300 hover:text-rose-500 rounded-lg" onClick={() => removeLabelItem(label.id)}>
                                                <X className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                                      <Button variant="ghost" size="sm" className="flex-1 h-9 text-xs font-black text-primary hover:bg-primary/5 rounded-xl" onClick={addLabelItem}>
                                          + 항목 추가
                                      </Button>
                                      <PopoverClose asChild>
                                        <Button 
                                          variant="default" 
                                          size="sm" 
                                          className="h-9 px-4 text-xs font-black rounded-xl shadow-md"
                                        >
                                          적용
                                        </Button>
                                      </PopoverClose>
                                    </div>
                                </div>
                            </div>
                        </PopoverContent>
                        </Popover>
                    </div>
                 </div>

                 <div className="w-[450px] h-[636px] bg-white shadow-elevated rounded-sm p-10 relative ring-1 ring-slate-200 flex flex-col transition-all">
                     <div className="text-center text-3xl font-black mb-8 tracking-[0.2em] text-slate-800">사 진 대 지</div>
                     
                     {/* Table Structure */}
                     <div className="border border-slate-900 flex-1 flex flex-col w-full overflow-hidden">
                        {/* Header Row */}
                        <div className="h-12 flex border-b border-slate-900 shrink-0">
                            <div className="w-24 bg-slate-50 border-r border-slate-900 flex items-center justify-center font-black text-base text-slate-700">공종</div>
                            <div className="flex-1 flex items-center px-4 font-bold text-slate-900">
                                {previewCluster?.name || '공종명 없음'}
                            </div>
                        </div>

                        {/* Rows */}
                        {['전', '중', '후'].map((label, idx) => {
                             const photo = previewPhotos[idx];
                             return (
                                <div key={label} className="flex-1 flex border-b border-slate-900 last:border-b-0 min-h-0">
                                    <div className="w-24 bg-slate-50 border-r border-slate-900 flex items-center justify-center font-black text-base text-slate-700">
                                        {label}
                                    </div>
                                    <div className="flex-1 relative p-1.5 flex items-center justify-center overflow-hidden bg-slate-50/20">
                                        {photo ? (
                                            <>
                                                <img 
                                                    src={photo.thumbnail_url || photo.url} 
                                                    alt={label} 
                                                    className="w-full h-full object-contain"
                                                />
                                                {/* Label Box Overlay */}
                                                <div className="absolute top-4 left-4 bg-white/95 border border-slate-200 p-2.5 shadow-md rounded-lg text-[10px] leading-relaxed z-10 whitespace-nowrap ring-1 ring-black/5">
                                                    {labelSettings.map(l => {
                                                        const val = l.isAutoDate && !l.value 
                                                            ? (photo.timestamp ? format(new Date(photo.timestamp), 'yyyy.MM.dd') : '-') 
                                                            : (l.value || '');
                                                        
                                                        if (!val) return null;

                                                        return (
                                                            <div key={l.id} className="flex items-center gap-2">
                                                                <span className="font-black text-slate-400 uppercase tracking-tighter">{l.key}</span>
                                                                <span className="font-black text-slate-900">{val}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-slate-300 font-black text-xs uppercase tracking-widest">No Photo</div>
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
          
          <DialogFooter className="p-6 bg-white border-t shrink-0 gap-3">
             <Button variant="outline" size="lg" className="text-base px-8 h-12 rounded-xl font-bold border-slate-200" onClick={() => setExportDialogOpen(false)}>취소</Button>
            <Button type="submit" size="lg" className="text-base px-10 h-12 bg-primary hover:bg-primary/90 text-white rounded-xl font-black shadow-lg shadow-primary/20 transition-all active:scale-95" onClick={handleConfirmExport}>
                <FileDown className="w-5 h-5 mr-2" />
                PDF 리포트 생성
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-8">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight text-center">PDF 생성 완료!</DialogTitle>
            <DialogDescription className="text-base font-medium text-slate-500 text-center">
              보고서가 성공적으로 생성되었습니다. <br/>아래 버튼을 눌러 다운로드하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-6">
            <Button size="lg" className="w-full gap-3 text-lg h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 transition-all active:scale-95" onClick={() => {
              if (downloadUrl) window.open(downloadUrl, '_blank');
              setDownloadDialogOpen(false);
            }}>
              <FileDown className="w-6 h-6" />
              지금 다운로드
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
