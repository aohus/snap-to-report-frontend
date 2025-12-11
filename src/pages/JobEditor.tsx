import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { api } from '@/lib/api';
import { Job, Cluster, Photo } from '@/types';
import { Loader2, ArrowLeft, Save, LogOut, Plus, Tags, X, Minus, FileDown, Settings, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

export default function JobEditor() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Export & Preview State
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

  // Label Editing State
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editLabelData, setEditLabelData] = useState<Record<string, string>>({});
  const [clusterBatchInputs, setClusterBatchInputs] = useState<Record<string, { key: string, value: string }>>({});

  useEffect(() => {
    if (!jobId) return;
    loadJobData();
  }, [jobId]);

  const loadJobData = async () => {
    setLoading(true);
    try {
      const data = await api.getJobDetails(jobId!);
      setJob(data);
      if (data.clusters) {
        // Sort clusters and photos
        const sorted = data.clusters
          .sort((a, b) => a.order_index - b.order_index)
          .map(c => ({
            ...c,
            photos: c.photos.sort((a, b) => {
                if (a.order_index !== undefined && b.order_index !== undefined) return a.order_index - b.order_index;
                const timeA = a.timestamp ? new Date(a.timestamp).getTime() : Infinity;
                const timeB = b.timestamp ? new Date(b.timestamp).getTime() : Infinity;
                return timeA - timeB;
            })
          }));
        setClusters(sorted);
      }
    } catch (error) {
      console.error("Failed to load job data", error);
      toast.error("Failed to load job data");
    } finally {
      setLoading(false);
    }
  };

  const handleClusterNameChange = (clusterId: string, newName: string) => {
    setClusters(clusters.map(c => c.id === clusterId ? { ...c, name: newName } : c));
  };

  const handleBatchInputChange = (clusterId: string, field: 'key' | 'value', val: string) => {
      setClusterBatchInputs(prev => ({
          ...prev,
          [clusterId]: { ...prev[clusterId], [field]: val }
      }));
  };

  const handleBatchAddLabel = async (clusterId: string) => {
      const inputs = clusterBatchInputs[clusterId];
      if (!inputs || !inputs.key.trim()) return;

      const cluster = clusters.find(c => c.id === clusterId);
      if (!cluster || cluster.photos.length === 0) return;

      const key = inputs.key.trim();
      const value = inputs.value.trim();

      // Optimistic update
      setClusters(prev => prev.map(c => {
          if (c.id === clusterId) {
              return {
                  ...c,
                  photos: c.photos.map(p => ({
                      ...p,
                      labels: { ...p.labels, [key]: value }
                  }))
              };
          }
          return c;
      }));

      // Clear inputs
      setClusterBatchInputs(prev => ({
          ...prev,
          [clusterId]: { key: '', value: '' }
      }));

      try {
          await Promise.all(cluster.photos.map(p => {
              const currentLabels = p.labels || {};
              const newLabels = { ...currentLabels, [key]: value };
              return api.updatePhoto(p.id, { labels: newLabels });
          }));
          toast.success("일괄 라벨 추가 완료");
      } catch (e) {
          console.error("Batch add label failed", e);
          toast.error("일괄 라벨 추가 실패");
          // Revert optimistic update? (Simplified: just reload or ignore for prototype)
      }
  };

  const handleBatchDeleteLabel = async (clusterId: string) => {
    const inputs = clusterBatchInputs[clusterId];
    if (!inputs || !inputs.key.trim()) return;

    const cluster = clusters.find(c => c.id === clusterId);
    if (!cluster || cluster.photos.length === 0) return;

    const keyToDelete = inputs.key.trim();

    // Optimistic update
    setClusters(prev => prev.map(c => {
        if (c.id === clusterId) {
            return {
                ...c,
                photos: c.photos.map(p => {
                    if (!p.labels) return p;
                    const newLabels = { ...p.labels };
                    delete newLabels[keyToDelete];
                    return { ...p, labels: newLabels };
                })
            };
        }
        return c;
    }));

    // Clear inputs
    setClusterBatchInputs(prev => ({
        ...prev,
        [clusterId]: { key: '', value: '' }
    }));

    try {
        await Promise.all(cluster.photos.map(p => {
            const currentLabels = p.labels || {};
            // Only update if key exists
            if (keyToDelete in currentLabels) {
                const newLabels = { ...currentLabels };
                delete newLabels[keyToDelete];
                return api.updatePhoto(p.id, { labels: newLabels });
            }
            return Promise.resolve();
        }));
        toast.success("일괄 라벨 삭제 완료");
    } catch (e) {
        console.error("Batch delete label failed", e);
        toast.error("일괄 라벨 삭제 실패");
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
      if (!editingPhotoId) return;
      
      const newLabels = { ...editLabelData };
      
      setClusters(prev => prev.map(c => ({
          ...c,
          photos: c.photos.map(p => p.id === editingPhotoId ? { ...p, labels: newLabels } : p)
      })));
      
      setEditingPhotoId(null);
      
      try {
          await api.updatePhoto(editingPhotoId, { labels: newLabels });
          toast.success("라벨 저장 완료");
      } catch (e) {
          console.error("Failed to save labels", e);
          toast.error("라벨 저장 실패");
      }
  };

  const handleSave = async () => {
    if (!jobId) return;
    setSaving(true);
    try {
        // Save all cluster names
        // Ideally we batch this or use the sync endpoint
        // Using syncClusters for order and names
        await api.syncClusters(jobId, clusters);
        toast.success("Changes saved successfully");
    } catch (error) {
        console.error("Failed to save changes", error);
        toast.error("Failed to save changes");
    } finally {
        setSaving(false);
    }
  };

  // Export Functions
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

  const handleExport = () => {
    if (!job) return;
    
    // Initialize preview with current job data or existing cluster data
    const firstClusterName = clusters.length > 0 && clusters[0].name !== 'reserve' ? clusters[0].name : '';
    
    setExportMetadata({
      cover_title: job.title,
      cover_company_name: job.company_name || '',
    });
    
    // Gather all unique label keys from all photos
    const allPhotoLabels = new Set<string>();
    clusters.forEach(cluster => {
      cluster.photos.forEach(photo => {
        if (photo.labels) {
          Object.keys(photo.labels).forEach(key => allPhotoLabels.add(key));
        }
      });
    });

    // Initialize labelSettings based on a default set and all unique photo labels
    const defaultLabelSettings = [
      { id: 'date', key: '일자', value: '', isAutoDate: true }, // Special case for timestamp
      { id: 'company', key: '시행처', value: job.company_name || '' }, // Special case for company_name
    ];
    
    const newLabelSettings: typeof labelSettings = [...defaultLabelSettings];

    allPhotoLabels.forEach(labelKey => {
      // Avoid adding duplicates if already in default settings (e.g. if a photo has a label '일자')
      if (!newLabelSettings.some(setting => setting.key === labelKey || (setting.id === 'company' && labelKey === '시행처'))) {
        newLabelSettings.push({ 
          id: `custom-${labelKey}`, // Use a unique ID for custom labels
          key: labelKey, 
          value: '', // Default to empty; the actual photo value will be picked up during render
          isAutoDate: false 
        });
      }
    });

    setLabelSettings(newLabelSettings);
    
    setExportDialogOpen(true);
  };

  const handleConfirmExport = async () => {
    if (!job) return;
    setExportDialogOpen(false);
    setExporting(true);
    
    try {
      // Best Practice: Send configuration (schema) only.
      const visible_keys: string[] = [];
      const overrides: Record<string, string> = {};

      labelSettings.forEach(l => {
          visible_keys.push(l.key);
          // If a value is provided, it's a global override.
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

  // Prepare preview data
  const previewCluster = clusters.find(c => c.name !== 'reserve') || clusters[0];
  const previewPhotos = previewCluster?.photos || [];

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!job) return <div className="h-screen flex items-center justify-center">Job not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <header className="bg-white border-b shadow-sm px-6 py-4 flex items-center justify-between sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(`/jobs/${jobId}`)}>
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900">
            {job.title} - 상세 수정
          </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button 
              onClick={handleSave} 
              disabled={saving} 
              className="md:text-base bg-blue-600 hover:bg-blue-700 shadow-md"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              저장
            </Button>
            <Button 
              variant="default" 
              onClick={handleExport} 
              className="md:text-base bg-blue-600 hover:bg-blue-700 shadow-md"
              disabled={exporting || clusters.length === 0}
            >
              {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              PDF 내보내기
            </Button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-5xl mx-auto w-full space-y-8">
        {clusters.filter(c => c.name !== 'reserve').map((cluster) => (
            <div key={cluster.id} className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                    <div className="flex items-center gap-4 flex-1">
                        <Label className="w-20 text-right text-gray-500 whitespace-nowrap">공종명</Label>
                        <Input 
                            value={cluster.name} 
                            onChange={(e) => handleClusterNameChange(cluster.id, e.target.value)}
                            className="flex-1 text-lg font-medium"
                        />
                    </div>
                    {/* Batch Label Input */}
                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                        <span className="text-xs font-bold text-gray-500 whitespace-nowrap">일괄 라벨:</span>
                        <Input 
                            placeholder="항목" 
                            className="h-8 w-20 text-xs bg-white"
                            value={clusterBatchInputs[cluster.id]?.key || ''}
                            onChange={(e) => handleBatchInputChange(cluster.id, 'key', e.target.value)}
                        />
                        <Input 
                            placeholder="내용" 
                            className="h-8 w-24 text-xs bg-white"
                            value={clusterBatchInputs[cluster.id]?.value || ''}
                            onChange={(e) => handleBatchInputChange(cluster.id, 'value', e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleBatchAddLabel(cluster.id)}
                        />
                        <Button size="sm" variant="outline" className="h-8 px-2" onClick={() => handleBatchAddLabel(cluster.id)}>
                            <Plus className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 px-2 text-red-500 hover:bg-red-50" onClick={() => handleBatchDeleteLabel(cluster.id)}>
                            <Minus className="w-3 h-3" />
                        </Button>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {cluster.photos.map((photo, idx) => (
                        <div key={photo.id} className="border rounded-lg p-3 space-y-3 bg-gray-50/50 relative group">
                            <div className="aspect-[4/3] bg-gray-200 rounded-md overflow-hidden border relative">
                                <img 
                                    src={api.getPhotoUrl(photo.url)} 
                                    alt="photo" 
                                    className="w-full h-full object-cover"
                                />
                                {photo.labels && Object.keys(photo.labels).length > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] p-1 backdrop-blur-sm truncate">
                                        {Object.entries(photo.labels).map(([k, v]) => `${k}:${v}`).join(', ')}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-2">
                                <div className="flex justify-end items-center">
                                    <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="h-6 w-6" 
                                        onClick={() => handleEditLabels(photo.id)}
                                    >
                                        <Tags className="w-3 h-3 text-gray-500 hover:text-blue-600" />
                                    </Button>
                                </div>
                                <div className="text-xs text-gray-600 space-y-1">
                                    {/* Default Date Label (from timestamp) */}
                                    <div>
                                        <span className="font-semibold mr-1">일자:</span>
                                        <span>{photo.timestamp ? format(new Date(photo.timestamp), 'yyyy.MM.dd') : '-'}</span>
                                    </div>
                                    {/* Default Company Label (from job) */}
                                    {job?.company_name && (
                                        <div>
                                            <span className="font-semibold mr-1">시행처:</span>
                                            <span>{job.company_name}</span>
                                        </div>
                                    )}
                                    {/* Custom Labels from photo.labels */}
                                    {photo.labels && Object.keys(photo.labels).length > 0 && (
                                        Object.entries(photo.labels).map(([key, value]) => (
                                            <div key={key}>
                                                <span className="font-semibold mr-1">{key}:</span>
                                                <span>{value}</span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                    {cluster.photos.length === 0 && (
                        <div className="col-span-3 py-8 text-center text-gray-400 italic">
                            사진이 없습니다.
                        </div>
                    )}
                </div>
            </div>
        ))}
      </main>

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
                      <X className="w-4 h-4" />
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
                                    <div className="w-20 bg-gray-50 border-r border-black flex items-center justify-center font-bold text-lg">
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
                                                                {l.value // User-defined value in label settings takes precedence
                                                                    || (l.isAutoDate && photo.timestamp ? format(new Date(photo.timestamp), 'yyyy.MM.dd') : null)
                                                                    || (photo.labels && photo.labels[l.key]) // Fallback to photo's specific label
                                                                    || '-'
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

      <Dialog open={downloadDialogOpen} onOpenChange={setDownloadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>PDF 내보내기 완료</DialogTitle>
            <DialogDescription>
              성공적으로 PDF가 생성되었습니다. 아래 버튼을 눌러 다운로드하세요.
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
          <DialogFooter className="sm:justify-start">
            <Button type="button" variant="secondary" onClick={() => setDownloadDialogOpen(false)}>
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
