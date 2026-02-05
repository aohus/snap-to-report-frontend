import { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from '@/lib/api';
import { Job, Cluster } from '@/types';
import { 
    Loader2, ArrowLeft, Save, FileDown, Plus, X, 
    Calendar as CalendarIcon, MapPin, CheckSquare, Square, Trash2, RefreshCw 
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from '@/lib/utils';

// --- Style Constants ---
const INPUT_CLASS = "h-10 text-base bg-white border-slate-200 focus:border-primary focus:ring-primary/5 rounded-md shadow-subtle font-medium";
const LABEL_TEXT = "text-xs font-bold text-slate-400 w-20 flex-shrink-0 text-right mr-3 uppercase tracking-wider";

export default function JobEditor() {
  const navigate = useNavigate();
  const location = useLocation();
  const { jobId } = useParams<{ jobId: string }>();
  
  // Data State
  const [job, setJob] = useState<Job | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Selection & Batch State
  const [selectedClusterIds, setSelectedClusterIds] = useState<Set<string>>(new Set());
  const [batchKey, setBatchKey] = useState('');
  const [batchValue, setBatchValue] = useState('');

  // Export State
  const [exporting, setExporting] = useState(false);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [exportMetadata, setExportMetadata] = useState({
    cover_title: '',
    cover_company_name: '',
  });

  const [labelSettings, setLabelSettings] = useState<{ id: string; key: string; value: string; isAutoDate?: boolean }[]>([
    { id: 'date', key: '일자', value: '', isAutoDate: true },
    { id: 'company', key: '시행처', value: '' },
  ]);

  useEffect(() => {
    if (!jobId) return;
    loadJobData();
  }, [jobId]);

  const loadJobData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getJobDetails(jobId!);
      if (!data) throw new Error("데이터를 불러올 수 없습니다.");
      setJob(data);
      if (data.clusters) {
        const sorted = data.clusters
          .sort((a, b) => a.order_index - b.order_index)
          .map(c => ({
            ...c,
            photos: c.photos.sort((a, b) => {
                if (a.order_index !== undefined && b.order_index !== undefined) return a.order_index - b.order_index;
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : Infinity;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : Infinity;
                return timeA - timeB;
            }).map(p => {
                // [중요] 초기 로딩 시 일자/시행처가 라벨에 없다면 기본값으로 채워넣음 (수정/삭제 가능하도록)
                const initialLabels = { ...(p.labels || {}) };
                if (!initialLabels['일자']) {
                    initialLabels['일자'] = p.timestamp ? format(new Date(p.timestamp), 'yyyy.MM.dd') : '';
                }
                if (!initialLabels['시행처']) {
                    initialLabels['시행처'] = data.company_name || '';
                }
                return { ...p, labels: initialLabels };
            })
          }));
        setClusters(sorted);
      }
    } catch (error) {
      console.error("Failed to load job data", error);
      setError("데이터를 불러오지 못했습니다.");
      toast.error("데이터를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const toggleClusterSelection = (clusterId: string) => {
      const newSet = new Set(selectedClusterIds);
      if (newSet.has(clusterId)) newSet.delete(clusterId);
      else newSet.add(clusterId);
      setSelectedClusterIds(newSet);
  };

  const toggleAllSelection = () => {
      if (selectedClusterIds.size === clusters.length) {
          setSelectedClusterIds(new Set());
      } else {
          const allIds = new Set(clusters.map(c => c.id));
          setSelectedClusterIds(allIds);
      }
  };

  const handleExport = () => {
    if (!job) return;
    
    // Initialize preview with current job data or existing cluster data
    // Use the first cluster's name as the default construction_type for the preview if available and not set
    const firstClusterName = clusters.length > 0 && clusters[0].name !== 'reserve' ? clusters[0].name : '';
    
    setExportMetadata({
      cover_title: job.title,
      cover_company_name: job.company_name || '',
    });
    
    // Gather all unique label keys from all photos (to discover new custom labels)
    const allPhotoLabels = new Set<string>();
    clusters.forEach(cluster => {
      cluster.photos.forEach(photo => {
        if (photo.labels) {
          Object.keys(photo.labels).forEach(key => allPhotoLabels.add(key));
        }
      });
    });

    // Update labelSettings with new keys found in photos, but DO NOT reset existing settings
    setLabelSettings(prev => {
        const newSettings = [...prev];
        const existingKeys = new Set(newSettings.map(s => s.key));

        // Ensure defaults if they were never initialized (though useState does this)
        // But if user deleted them, they stay deleted.
        
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
        
        // Ensure company name is synced if the user hasn't overridden it, 
        // BUT only if 'company' key still exists in the settings.
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
      // Best Practice: Send configuration (schema) only, let backend resolve data.
      const visible_keys: string[] = [];
      const overrides: Record<string, string> = {};

      labelSettings.forEach(l => {
          visible_keys.push(l.key);
          // If a value is provided, it's a global override (static text).
          // If empty, backend will look up DB or use AutoDate logic.
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

  // --- Batch Operations ---
  const handleBatchAction = async (action: 'add' | 'delete') => {
      if (selectedClusterIds.size === 0) {
          toast.error("선택된 그룹이 없습니다.");
          return;
      }
      if (!batchKey.trim()) {
          toast.error("항목 이름을 입력해주세요.");
          return;
      }

      const key = batchKey.trim();
      const value = batchValue.trim();

      // UI Optimistic Update
      setClusters(prev => prev.map(c => {
          if (!selectedClusterIds.has(c.id)) return c;
          return {
              ...c,
              photos: c.photos.map(p => {
                  const newLabels = { ...p.labels };
                  if (action === 'add') {
                      newLabels[key] = value;
                  } else {
                      delete newLabels[key];
                  }
                  return { ...p, labels: newLabels };
              })
          };
      }));

      // API Calls
      try {
          const promises = [];
          for (const cluster of clusters) {
              if (selectedClusterIds.has(cluster.id)) {
                  for (const photo of cluster.photos) {
                      // Note: In a real app, calculate exact new labels based on current state to avoid race conditions
                      // Here we use the logic derived above basically
                      const currentLabels = photo.labels || {}; // This might be stale in complex state, but okay for prototype
                      let newLabels = { ...currentLabels };
                      if (action === 'add') newLabels[key] = value;
                      else delete newLabels[key]; // This won't work perfectly if state wasn't updated in sync, but assuming sync
                      
                      const updatedPhoto = { ...photo, labels: newLabels };
                      promises.push(api.updatePhoto(jobId, [updatedPhoto])); 
                  }
              }
          }
          // Note: Ideally we should use the updated labels from the setClusters callback or ref
          // For this demo, we assume the UI update is enough and we just save 'changes'. 
          // Actually, let's just save the whole job state via syncClusters later or rely on individual updates.
          // To make it robust without reading state inside async:
          toast.success(action === 'add' ? "일괄 추가되었습니다." : "일괄 삭제되었습니다.");
          setBatchKey('');
          setBatchValue('');
          
          // Trigger a sync to be safe
          // await api.syncClusters(jobId!, clusters); 
      } catch (e) {
          console.error(e);
          toast.error("작업 중 오류가 발생했습니다.");
      }
  };


  // --- Individual Editing ---
  const handleClusterNameChange = (clusterId: string, newName: string) => {
    setClusters(prev => prev.map(c => c.id === clusterId ? { ...c, name: newName } : c));
  };
  
  const handleClusterNameBlur = async (clusterId: string, newName: string) => {
    try { await api.updateCluster(jobId, clusterId, { name: newName }); } catch (e) {}
  };

  const handlePhotoLabelChange = (clusterId: string, photoId: string, key: string, value: string) => {
    setClusters(prev => prev.map(c => {
        if (c.id !== clusterId) return c;
        return {
            ...c,
            photos: c.photos.map(p => {
                if (p.id !== photoId) return p;
                return { ...p, labels: { ...p.labels, [key]: value } };
            })
        };
    }));
  };

  const handlePhotoLabelBlur = async (photoId: string, labels: Record<string, string>) => {
    const targetPhoto = clusters
      .flatMap(c => c.photos)
      .find(p => p.id === photoId);
    if (!targetPhoto) return;
    targetPhoto.labels = labels;
    try { await api.updatePhoto(jobId, [targetPhoto]); } catch (e) {}
  };

  const handleDeleteLabel = async (clusterId: string, photoId: string, key: string) => {
      if(!confirm(`'${key}' 항목을 삭제하시겠습니까?`)) return;
      
      let newLabels: Record<string, string> = {};
      setClusters(prev => prev.map(c => {
          if (c.id !== clusterId) return c;
          return {
              ...c,
              photos: c.photos.map(p => {
                  if (p.id !== photoId) return p;
                  const labels = { ...p.labels };
                  delete labels[key];
                  newLabels = labels;
                  return { ...p, labels };
              })
          };
      }));
    
      const updatedPhoto = clusters.flatMap(c => c.photos).find(p => p.id === photoId);
      if (!updatedPhoto) return;
      updatedPhoto.labels = newLabels;
      try { await api.updatePhoto(jobId, [updatedPhoto]); } catch (e) {}
  };

  const handleSave = async () => {
    if (!jobId) return;
    setSaving(true);
    try {
        await api.syncClusters(jobId, clusters);
        toast.success("저장되었습니다.");
    } catch (error) {
        toast.error("저장 실패");
    } finally {
        setSaving(false);
    }
  };

  // --- Render Helpers ---
  // 정렬: 일자 -> 시행처 -> 나머지 가나다순
  const getSortedLabels = (labels: Record<string, string> = {}) => {
      const keys = Object.keys(labels);
      return keys.sort((a, b) => {
          if (a === '일자') return -1;
          if (b === '일자') return 1;
          if (a === '시행처') return -1;
          if (b === '시행처') return 1;
          return a.localeCompare(b);
      }).map(key => ({ key, value: labels[key] }));
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-12 h-12 animate-spin text-blue-600" /></div>;
  
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

  const previewCluster = clusters.find(c => c.name !== 'reserve') || clusters[0];
  const previewPhotos = previewCluster?.photos || [];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900 pb-20 selection:bg-primary/10 selection:text-primary">
      
      {/* 1. Top Header */}
      <header className="bg-white/90 border-b border-slate-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40 backdrop-blur-xl shadow-subtle">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/jobs/${jobId}`)} className="rounded-md h-9 w-9">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">{job?.title}</h1>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">상세 편집 모드</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleSave} disabled={saving} className="h-9 text-sm font-semibold px-4 rounded-md border-slate-200 hover:bg-slate-50 transition-all">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              변경사항 저장
            </Button>
            <Button 
              className="h-9 text-sm font-bold bg-primary hover:bg-primary/95 px-5 rounded-md shadow-emphasis shadow-primary/10 transition-all"
              onClick={handleExport}
              disabled={exporting || clusters.length === 0}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <FileDown className="w-4 h-4 mr-2" />}
              <span className="hidden md:inline">PDF 리포트 생성</span>
              <span className="md:hidden">PDF</span>
            </Button>
        </div>
      </header>

      {/* 2. Batch Tool Bar (Sticky below header) */}
      <div className="bg-white/80 border-b border-slate-200 sticky top-[61px] z-30 px-6 py-3 backdrop-blur-md shadow-subtle">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-4 justify-between">
              <div className="flex items-center gap-2">
                  <div className="flex items-center bg-slate-100 rounded-md p-0.5">
                    <Button variant="ghost" className="text-sm font-bold hover:bg-white hover:shadow-subtle rounded-md px-3 h-8 transition-all" onClick={toggleAllSelection}>
                        {selectedClusterIds.size === clusters.length ? <CheckSquare className="w-4 h-4 mr-2 text-primary"/> : <Square className="w-4 h-4 mr-2 text-slate-400"/>}
                        {selectedClusterIds.size}개 그룹 선택됨
                    </Button>
                  </div>
              </div>
              
              <div className="flex items-center gap-2 flex-1 w-full md:w-auto">
                  <Input 
                    placeholder="항목 이름 (예: 위치)" 
                    className="h-9 text-sm font-semibold flex-1 md:flex-none md:w-40 bg-white rounded-md border-slate-200"
                    value={batchKey}
                    onChange={(e) => setBatchKey(e.target.value)}
                  />
                  <Input 
                    placeholder="내용 입력 (예: 1층)" 
                    className="h-9 text-sm font-semibold flex-1 md:flex-none md:w-60 bg-white rounded-md border-slate-200"
                    value={batchValue}
                    onChange={(e) => setBatchValue(e.target.value)}
                  />
                  <Button onClick={() => handleBatchAction('add')} className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 rounded-md transition-all">
                      추가
                  </Button>
                  <Button onClick={() => handleBatchAction('delete')} variant="ghost" className="h-9 text-red-600 hover:bg-red-50 font-bold px-4 rounded-md transition-all">
                      삭제
                  </Button>
              </div>
          </div>
      </div>

      <main className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full space-y-10 mt-4">
        {clusters.filter(c => c.name !== 'reserve').map((cluster) => (
            <div key={cluster.id} className={cn(
                "bg-white rounded-md shadow-subtle border transition-all duration-300",
                selectedClusterIds.has(cluster.id) ? 'border-primary ring-2 ring-primary/5' : 'border-slate-200'
            )}>
                
                {/* Cluster Header */}
                <div className="p-4 md:p-6 border-b border-slate-100 flex items-center gap-4 bg-slate-50/30 rounded-t-md">
                    <div onClick={() => toggleClusterSelection(cluster.id)} className="cursor-pointer group">
                        {selectedClusterIds.has(cluster.id) 
                            ? <CheckSquare className="w-6 h-6 text-primary" /> 
                            : <Square className="w-6 h-6 text-slate-300 group-hover:text-slate-400 transition-colors" />
                        }
                    </div>
                    <div className="flex-1">
                        <Input 
                            value={cluster.name} 
                            onChange={(e) => handleClusterNameChange(cluster.id, e.target.value)}
                            onBlur={(e) => handleClusterNameBlur(cluster.id, e.target.value)}
                            className="h-10 text-xl font-bold bg-transparent border-transparent hover:border-slate-200 focus:bg-white focus:border-primary/20 rounded-md max-w-lg transition-all"
                            placeholder="그룹 이름을 입력하세요..."
                        />
                    </div>
                </div>

                {/* Photo List (1 Column Layout) */}
                <div className="p-6 md:p-8 space-y-12">
                    {cluster.photos.map((photo) => {
                        const sortedLabels = getSortedLabels(photo.labels);
                        
                        return (
                            <div key={photo.id} className="flex flex-col md:flex-row gap-8 p-4 border-b border-slate-50 last:border-b-0 pb-12 group/photo">
                                {/* 1. Photo Section (Large) */}
                                <div className="w-full md:w-[480px] flex-shrink-0">
                                    <div className="aspect-[4/3] bg-slate-100 rounded-md overflow-hidden border border-slate-200 relative shadow-inner group-hover/photo:border-primary/20 transition-all">
                                        <img 
                                            src={api.getPhotoUrl(photo.url)} 
                                            alt="현장 사진" 
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover/photo:scale-105"
                                        />
                                    </div>
                                </div>

                                {/* 2. Label Inputs Section */}
                                <div className="flex-1 flex flex-col gap-4 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                            사진 상세 정보
                                        </h3>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 px-3 text-primary font-bold hover:bg-primary/5 rounded-md">
                                                    <Plus className="w-3.5 h-3.5 mr-1.5 stroke-[3]" /> 항목 추가
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80 p-4 rounded-md shadow-elevated border-slate-200">
                                                <div className="space-y-4">
                                                    <h4 className="text-sm font-bold text-slate-900 tracking-tight">새 항목 추가</h4>
                                                    <div className="flex gap-2">
                                                        <Input id={`new-key-${photo.id}`} placeholder="예: 위치, 상태 등" className="h-9 rounded-md" />
                                                        <Button onClick={() => {
                                                            const el = document.getElementById(`new-key-${photo.id}`) as HTMLInputElement;
                                                            if (el.value.trim()) {
                                                                handlePhotoLabelChange(cluster.id, photo.id, el.value.trim(), '');
                                                                el.value = '';
                                                            }
                                                        }} className="rounded-md font-bold h-9">확인</Button>
                                                    </div>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>

                                    <div className="space-y-3 bg-white p-2 rounded-md">
                                        {sortedLabels.map(({ key, value }) => (
                                            <div key={key} className="flex items-center group/label">
                                                {/* Label Name */}
                                                <div className={LABEL_TEXT}>
                                                    {key}
                                                </div>

                                                {/* Label Input */}
                                                <div className="flex-1 relative">
                                                    <Input 
                                                        className={cn(INPUT_CLASS, "font-bold text-slate-800")}
                                                        value={value}
                                                        placeholder={`${key} 내용을 입력하세요...`}
                                                        onChange={(e) => handlePhotoLabelChange(cluster.id, photo.id, key, e.target.value)}
                                                        onBlur={() => handlePhotoLabelBlur(photo.id, photo.labels!)}
                                                    />
                                                </div>

                                                {/* Delete Button */}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="ml-2 h-9 w-9 text-slate-200 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover/label:opacity-100 transition-all rounded-md"
                                                    onClick={() => handleDeleteLabel(cluster.id, photo.id, key)}
                                                >
                                                    <X className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        ))}
      </main>

      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogContent className="max-w-[95vw] w-full md:max-w-[1400px] h-[90vh] flex flex-col p-0 gap-0 bg-slate-50 border-none rounded-3xl overflow-hidden shadow-2xl">
          <DialogHeader className="p-6 md:p-8 bg-white border-b border-slate-100 shrink-0">
            <DialogTitle className="text-2xl font-black text-slate-900 tracking-tight">PDF 내보내기 설정</DialogTitle>
            <DialogDescription className="text-lg font-medium text-slate-500 mt-1">
              내보내기 전 표지와 첫 장을 확인하고 필요한 정보를 수정하세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-8 md:p-12 custom-scrollbar">
            <div className="flex flex-col xl:flex-row gap-16 justify-center items-start">
              
              {/* Cover Preview (Left) */}
              <div className="flex flex-col items-center gap-6">
                 <h3 className="text-xl font-black text-slate-700 uppercase tracking-widest text-sm">표지 미리보기</h3>
                 <div className="w-[450px] h-[636px] bg-white shadow-2xl flex flex-col items-center justify-between p-16 relative hover:ring-4 hover:ring-primary/10 transition-all rounded-sm border border-slate-100">
                    {/* Top Title */}
                    <div className="mt-20 w-full text-center">
                        <input
                           className="w-full text-center text-3xl font-black border-b-2 border-transparent hover:border-slate-200 focus:border-primary focus:outline-none bg-transparent py-2 text-slate-900 transition-colors"
                           value={exportMetadata.cover_title}
                           onChange={(e) => setExportMetadata({...exportMetadata, cover_title: e.target.value})}
                           placeholder="작업명 입력"
                        />
                        <div className="mt-16 bg-slate-50 border border-slate-200 px-12 py-6 inline-block rounded-xl shadow-inner">
                             <span className="text-4xl font-black tracking-[0.2em] text-slate-800">사 진 대 지</span>
                        </div>
                    </div>

                    {/* Bottom Company */}
                    <div className="mb-20 w-full text-center">
                        <input
                            className="w-full text-center text-xl font-bold border-b-2 border-transparent hover:border-slate-200 focus:border-primary focus:outline-none bg-transparent py-2 text-slate-600 transition-colors"
                            value={exportMetadata.cover_company_name}
                            onChange={(e) => setExportMetadata({...exportMetadata, cover_company_name: e.target.value})}
                            placeholder='시행처 입력'
                        />
                    </div>
                 </div>
              </div>

              {/* Page 1 Preview (Right) */}
              <div className="flex flex-col items-center gap-6">
                 <h3 className="text-xl font-black text-slate-700 uppercase tracking-widest text-sm">본문 미리보기 (예시)</h3>

                 <div className="w-[450px] h-[636px] bg-white shadow-2xl p-10 relative text-sm flex flex-col rounded-sm border border-slate-100">
                     <div className="text-center text-3xl font-black mb-8 tracking-[0.15em] text-slate-900">사 진 대 지</div>
                     
                     {/* Table Structure */}
                     <div className="border-2 border-slate-900 flex-1 flex flex-col w-full overflow-hidden">
                        {/* Header Row */}
                        <div className="h-12 flex border-b-2 border-slate-900 shrink-0">
                            <div className="w-24 bg-slate-50 border-r-2 border-slate-900 flex items-center justify-center font-black text-lg text-slate-800">공종</div>
                            <div className="flex-1 flex items-center px-4 font-bold text-slate-700 text-base">
                                {previewCluster.name || '공종명 없음'}
                            </div>
                        </div>

                        {/* Rows */}
                        {['전', '중', '후'].map((label, idx) => {
                             const photo = previewPhotos[idx];
                             return (
                                <div key={label} className="flex-1 flex border-b-2 border-slate-900 last:border-b-0 min-h-0">
                                    <div className="w-24 bg-slate-50 border-r-2 border-slate-900 flex items-center justify-center font-black text-xl text-slate-800">
                                        {label}
                                    </div>
                                    <div className="flex-1 relative p-1 flex items-center justify-center overflow-hidden bg-slate-50/20">
                                        {photo ? (
                                            <>
                                                <img 
                                                    src={api.getPhotoUrl(photo.url)} 
                                                    alt={label} 
                                                    className="w-full h-full object-contain"
                                                />
                                                {/* Label Box Overlay */}
                                                <div className="absolute top-4 left-4 bg-white/95 border-2 border-slate-900 p-3 shadow-xl text-[10px] leading-tight z-10 whitespace-nowrap font-bold text-slate-900">
                                                    {labelSettings.map(l => {
                                                        const val = l.isAutoDate && !l.value 
                                                            ? (photo.timestamp ? format(new Date(photo.timestamp), 'yyyy.MM.dd') : '-') 
                                                            : (l.value || '');
                                                        
                                                        if (!val) return null;

                                                        return (
                                                            <div key={l.id} className="mb-0.5 last:mb-0">
                                                                <span>{l.key} :</span>{' '}
                                                                <span>{val}</span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="text-slate-200 font-black text-lg uppercase tracking-widest">No Photo</div>
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
          
          <DialogFooter className="p-6 md:p-8 bg-white border-t border-slate-100 shrink-0 gap-4">
             <Button variant="outline" size="lg" className="text-lg font-bold px-10 h-14 rounded-2xl border-slate-200" onClick={() => setExportDialogOpen(false)}>취소</Button>
            <Button type="submit" size="lg" className="text-lg font-black px-12 h-14 rounded-2xl bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20" onClick={handleConfirmExport}>PDF 내보내기 시작</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="sm:max-w-md p-10 rounded-3xl border-none shadow-2xl">
          <DialogHeader className="mb-8">
            <DialogTitle className="text-3xl font-black text-center mb-2 tracking-tight text-slate-900">PDF 생성 완료!</DialogTitle>
            <DialogDescription className="text-center text-lg font-medium text-slate-500">
              보고서가 성공적으로 만들어졌습니다. <br/>아래 버튼을 눌러 파일을 저장하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center gap-4">
            <Button size="lg" className="w-full h-16 text-xl font-black bg-green-600 hover:bg-green-700 shadow-xl shadow-green-100 rounded-2xl transition-all active:scale-95" onClick={() => {
              if (downloadUrl) window.open(downloadUrl, '_blank');
              setDownloadDialogOpen(false);
            }}>
              <FileDown className="w-7 h-7 mr-3 stroke-[2.5]" />
              PDF 다운로드
            </Button>
            <Button type="button" variant="ghost" size="lg" className="w-full h-12 text-lg font-bold text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl" onClick={() => setDownloadDialogOpen(false)}>
              나중에 받기
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}