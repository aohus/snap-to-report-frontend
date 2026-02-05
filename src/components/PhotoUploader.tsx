import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, FileImage, X, AlertCircle, CloudUpload, CheckCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { detectDuplicates, DuplicateGroup } from '@/lib/duplicateDetection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useUploadStore } from '@/lib/uploadStore';
import { cn } from '@/lib/utils';

interface PhotoUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
}

export function PhotoUploader({ onUpload }: PhotoUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateProgress, setDuplicateProgress] = useState(0);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMounted = useRef(true);
  
  const { isUploading, items, itemIds, totalProgress } = useUploadStore();

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const processFiles = useCallback((files: File[]) => {
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...imageFiles]);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
    if (e.target) e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault();
        const pastedFiles = Array.from(e.clipboardData.files);
        processFiles(pastedFiles);
      }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [processFiles]);

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeDuplicateGroup = (groupId: string) => {
    setDuplicateGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const changeKeptFile = (groupId: string, newKeptFile: File) => {
    setDuplicateGroups((prev) =>
      prev.map((g) => {
        if (g.id === groupId) {
          return { ...g, keptFile: newKeptFile };
        }
        return g;
      })
    );
  };

  const handleUploadClick = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsCheckingDuplicates(true);
    setDuplicateProgress(0);
    try {
      const groups = await detectDuplicates(selectedFiles, (current, total) => {
        setDuplicateProgress(Math.round((current / total) * 100));
      });
      if (groups.length > 0) {
        setDuplicateGroups(groups);
        setShowDuplicateDialog(true);
        setIsCheckingDuplicates(false);
        return;
      }
      
      const filesToUpload = [...selectedFiles];
      setSelectedFiles([]); 
      await onUpload(filesToUpload);
    } catch (error) {
      console.error("Error checking/uploading files:", error);
      const filesToUpload = [...selectedFiles];
      setSelectedFiles([]);
      await onUpload(filesToUpload);
    } finally {
      if (isMounted.current) {
        setIsCheckingDuplicates(false);
        setDuplicateProgress(0);
      }
    }
  };

  const handleDeleteDuplicates = async () => {
    const filesToRemove = new Set<File>();
    duplicateGroups.forEach(group => {
      group.files.forEach(f => {
        if (f !== group.keptFile) {
          filesToRemove.add(f);
        }
      });
    });
    
    const filteredFiles = selectedFiles.filter(f => !filesToRemove.has(f));
    setShowDuplicateDialog(false);
    setSelectedFiles([]); 
    
    try {
      await onUpload(filteredFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const handleIgnoreDuplicates = async () => {
    const allFiles = [...selectedFiles];
    setShowDuplicateDialog(false);
    setSelectedFiles([]);
    
    try {
      await onUpload(allFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const hasFiles = selectedFiles.length > 0;
  const completedCount = itemIds.filter(id => items[id].status === 'completed').length;
  const totalCount = itemIds.length;

  return (
    <div className={cn("w-full mx-auto space-y-6 transition-all duration-500 ease-in-out", (hasFiles || isUploading) ? 'max-w-7xl' : 'max-w-3xl')}>
      {/* 중복 사진 관리 다이얼로그 */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-5xl w-[90vw] h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <DialogHeader className="p-8 pb-4 bg-white shrink-0 border-b">
            <DialogTitle className="flex items-center gap-3 text-3xl font-black text-slate-900 tracking-tighter">
              <AlertCircle className="w-10 h-10 text-orange-500" />
              똑같은 사진이 발견되었습니다!
            </DialogTitle>
            <DialogDescription className="text-lg font-bold text-slate-500 mt-2">
              중복된 사진들을 정리하고 올릴까요? 남길 사진을 선택해 주세요.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto bg-slate-50/50 p-8 custom-scrollbar">
            <div className="space-y-10">
              {duplicateGroups.map((group, groupIndex) => (
                <div key={group.id} className="bg-white rounded-3xl shadow-professional border border-slate-200/60 overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50/30">
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-2xl bg-primary text-white flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20">
                        {groupIndex + 1}
                      </span>
                      <span className="text-xl font-black text-slate-800 tracking-tight">
                        {group.reason === 'name' ? '이름이 똑같은 사진' : '내용이 완전히 똑같은 사진'}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeDuplicateGroup(group.id)} className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-full transition-colors">
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                  <div className="p-6 flex gap-6 overflow-x-auto pb-8 custom-scrollbar">
                    {group.files.map((file, fileIndex) => {
                      const isKept = file === group.keptFile;
                      return (
                        <div key={fileIndex} className="relative flex-shrink-0 w-56 cursor-pointer group" onClick={() => changeKeptFile(group.id, file)}>
                          <div className={cn("aspect-square rounded-2xl overflow-hidden border-4 transition-all duration-500", isKept ? "border-primary shadow-elevated scale-[1.03] ring-8 ring-primary/5" : "border-slate-100 opacity-40 grayscale hover:opacity-100 hover:grayscale-0")}>
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                          </div>
                          {isKept && <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1.5 rounded-xl text-xs font-black shadow-xl animate-in zoom-in-50 tracking-widest uppercase">Keep</div>}
                          <p className={cn("mt-4 text-sm truncate text-center font-black px-2 transition-colors", isKept ? "text-primary" : "text-slate-400")}>{file.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="p-8 bg-white border-t shrink-0 flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={handleIgnoreDuplicates} className="h-16 px-8 font-black text-xl text-slate-500 hover:bg-slate-50 border-2 rounded-2xl flex-1 transition-all">그대로 모두 저장</Button>
            <Button onClick={handleDeleteDuplicates} className="h-16 px-12 bg-primary hover:bg-primary/90 text-white font-black text-2xl shadow-xl shadow-primary/20 rounded-2xl flex-[1.5] transition-all active:scale-95">중복 사진 빼고 저장하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메인 레이아웃: 업로더 패널 + (미리보기 카드 OR 진행 리스트 카드) */}
      <div className={cn("flex flex-col gap-6", (hasFiles || isUploading) ? 'md:flex-row' : '')}>
        
        {/* 왼쪽: 컨트롤 패널 (업로드 또는 로딩 인디케이터) */}
        <div
          className={cn(
            "border-4 border-dashed rounded-[2.5rem] text-center transition-all bg-white group relative overflow-hidden",
            isUploading ? 'border-primary/20' : 'border-slate-200 hover:border-primary/40 hover:bg-slate-50/50',
            (hasFiles || isUploading) ? 'w-full md:w-1/3 p-10' : 'w-full p-12 md:p-24 cursor-pointer'
          )}
          onDrop={!isUploading ? handleDrop : undefined}
          onDragOver={!isUploading ? handleDragOver : undefined}
          onClick={!isUploading ? () => fileInputRef.current?.click() : undefined}
        >
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
          
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-8 py-4 animate-in fade-in zoom-in-95">
              <div className="relative">
                <Loader2 className="w-28 h-24 animate-spin text-primary opacity-20" />
                <div className="absolute inset-0 flex items-center justify-center font-black text-primary text-3xl tracking-tighter">
                  {totalProgress}%
                </div>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter text-center uppercase">Uploading...</h3>
                <p className="text-slate-400 font-bold text-sm tracking-tight">잠시만 기다려 주세요!</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner ring-1 ring-slate-200/50">
                <div 
                  className="bg-primary h-full transition-all duration-700 ease-out shadow-[0_0_20px_rgba(16,42,67,0.3)]" 
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <div className="bg-slate-900 text-white px-8 py-4 rounded-3xl shadow-xl shadow-slate-200 border border-white/10 font-black tracking-tight">
                총 {totalCount}장 중 {completedCount}장 완료
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className={cn("p-6 bg-slate-50 rounded-[2rem] shadow-sm group-hover:scale-110 group-hover:bg-white group-hover:shadow-xl transition-all duration-500 ring-1 ring-slate-100", !hasFiles ? 'p-10' : '')}>
                <Upload className={cn("text-primary transition-transform group-hover:-translate-y-1", hasFiles ? 'w-10 h-10' : 'w-16 h-12')} />
              </div>
              <div className="text-center space-y-3">
                <h3 className={cn("font-black text-slate-900 tracking-tighter leading-none", hasFiles ? 'text-2xl' : 'text-4xl')}>
                  {hasFiles ? '사진 더 추가' : '여기에 사진 드롭'}
                </h3>
                <p className="text-slate-400 font-bold text-base tracking-tight">
                  또는 클릭하여 <span className="text-primary underline underline-offset-4 decoration-4 decoration-primary/10">파일 선택</span>
                </p>
                {!hasFiles && <p className="text-emerald-600/40 font-black mt-10 text-xs uppercase tracking-[0.3em] animate-pulse">Up to 500 photos</p>}
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 상세 정보 카드 (미리보기 또는 전역 진행 목록) */}
        {(hasFiles || isUploading) && (
          <Card className="flex-1 min-h-[600px] max-h-[850px] shadow-emphasis border border-slate-200/60 rounded-[2.5rem] overflow-hidden flex flex-col bg-white">
            <CardContent className="p-8 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-8 shrink-0">
                <h4 className="text-2xl font-black flex items-center gap-4 text-slate-900 tracking-tighter">
                  {isUploading ? (
                    <><CloudUpload className="w-8 h-8 text-primary" /> 전송 진행 상황</>
                  ) : (
                    <><FileImage className="w-8 h-8 text-primary" /> 대기 중인 사진 <span className="text-primary/30 font-medium ml-1">{selectedFiles.length}장</span></>
                  )}
                </h4>
                {!isUploading && (
                  <Button variant="ghost" onClick={() => setSelectedFiles([])} className="text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-black text-sm uppercase tracking-widest h-10 px-4 rounded-xl transition-all">Clear All</Button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar -mx-2 px-2">
                {isUploading ? (
                  <div className="grid grid-cols-1 gap-3 pb-4">
                    {itemIds.map(id => {
                      const item = items[id];
                      return (
                        <div key={id} className="flex items-center justify-between p-5 rounded-[1.5rem] bg-slate-50/50 border border-slate-100 hover:border-primary/20 hover:bg-white hover:shadow-professional transition-all group">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate font-black text-slate-800 text-base tracking-tight">{item.fileName}</span>
                            <div className="flex items-center gap-4 mt-2.5">
                              <div className="flex-1 bg-slate-200/60 rounded-full h-2 overflow-hidden shadow-inner w-full max-w-[240px]">
                                <div className="bg-primary h-full transition-all duration-500 ease-out" style={{ width: `${item.progress}%` }} />
                              </div>
                              <span className="text-xs font-black text-primary tabular-nums tracking-widest">{item.progress}%</span>
                            </div>
                          </div>
                          <div className="ml-6 shrink-0">
                            {item.status === 'completed' ? (
                              <div className="bg-emerald-500 text-white p-2 rounded-full shadow-lg shadow-emerald-100 animate-in zoom-in duration-300"><CheckCircle className="w-5 h-5" /></div>
                            ) : item.status === 'failed' ? (
                              <div className="bg-rose-500 text-white p-2 rounded-full shadow-lg shadow-rose-100 animate-in shake duration-500"><AlertCircle className="w-5 h-5" /></div>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-primary uppercase tracking-widest animate-pulse bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-sm">
                                  {item.status === 'compressing' ? 'Optimize' : 'Upload'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 pb-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group aspect-square bg-slate-100 rounded-2xl shadow-sm overflow-hidden border border-slate-200 hover:border-primary/40 hover:shadow-emphasis transition-all duration-300">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover transition-transform group-hover:scale-110" onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)} />
                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <button onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all shadow-xl hover:scale-110 active:scale-90 ring-4 ring-white/20">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isUploading && (
                <div className="mt-8 pt-8 border-t border-slate-100 shrink-0">
                  <Button 
                    className="w-full h-24 text-3xl font-black bg-primary hover:bg-slate-900 text-white shadow-emphasis shadow-primary/20 active:scale-[0.98] transition-all rounded-[2rem] tracking-tighter" 
                    onClick={handleUploadClick} 
                    disabled={isCheckingDuplicates}
                  >
                    {isCheckingDuplicates 
                      ? `분석 중... ${duplicateProgress}%`
                      : '이 사진들로 작업 시작하기'}
                  </Button>
                  <p className="text-center text-slate-400 mt-5 font-black text-sm uppercase tracking-[0.2em] opacity-60">
                    Press button to start processing
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
