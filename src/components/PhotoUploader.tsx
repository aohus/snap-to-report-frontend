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
import { ScrollArea } from "@/components/ui/scroll-area";
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
  
  const { isUploading, items, itemIds, totalProgress } = useUploadStore();

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
      setIsCheckingDuplicates(false);
      setDuplicateProgress(0);
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
    <div className={cn("w-full mx-auto space-y-6 transition-all duration-300", (hasFiles || isUploading) ? 'max-w-7xl' : 'max-w-3xl')}>
      {/* 중복 사진 관리 다이얼로그 */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-5xl w-[90vw] h-[85vh] flex flex-col p-0 overflow-hidden rounded-3xl border-none shadow-2xl">
          <DialogHeader className="p-8 pb-4 bg-white shrink-0 border-b">
            <DialogTitle className="flex items-center gap-3 text-3xl font-black text-slate-900">
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
                <div key={group.id} className="bg-white rounded-3xl shadow-sm border-2 border-slate-100 overflow-hidden">
                  <div className="flex items-center justify-between p-5 border-b bg-slate-50/30">
                    <div className="flex items-center gap-4">
                      <span className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-lg shadow-lg shadow-blue-200">
                        {groupIndex + 1}
                      </span>
                      <span className="text-xl font-black text-slate-800">
                        {group.reason === 'name' ? '이름이 똑같은 사진' : '완전히 똑같은 사진'}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => removeDuplicateGroup(group.id)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full">
                      <X className="w-6 h-6" />
                    </Button>
                  </div>
                  <div className="p-6 flex gap-6 overflow-x-auto pb-8">
                    {group.files.map((file, fileIndex) => {
                      const isKept = file === group.keptFile;
                      return (
                        <div key={fileIndex} className="relative flex-shrink-0 w-56 cursor-pointer group" onClick={() => changeKeptFile(group.id, file)}>
                          <div className={cn("aspect-square rounded-3xl overflow-hidden border-4 transition-all duration-300", isKept ? "border-blue-500 shadow-2xl scale-[1.03] ring-8 ring-blue-50" : "border-slate-100 opacity-40 grayscale hover:opacity-100 hover:grayscale-0")}>
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                          </div>
                          {isKept && <div className="absolute top-4 right-4 bg-blue-600 text-white px-3 py-1.5 rounded-xl text-sm font-black shadow-xl animate-in zoom-in-50">남김</div>}
                          <p className={cn("mt-4 text-sm truncate text-center font-bold px-2", isKept ? "text-blue-600" : "text-slate-400")}>{file.name}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <DialogFooter className="p-8 bg-white border-t shrink-0 flex flex-col sm:flex-row gap-4">
            <Button variant="outline" onClick={handleIgnoreDuplicates} className="h-16 px-8 font-black text-xl text-slate-500 hover:bg-slate-50 border-2 rounded-2xl flex-1">그대로 모두 저장</Button>
            <Button onClick={handleDeleteDuplicates} className="h-16 px-12 bg-blue-600 hover:bg-blue-700 text-white font-black text-2xl shadow-xl shadow-blue-100 rounded-2xl flex-[1.5]">중복 사진 빼고 저장하기</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메인 레이아웃: 업로더 패널 + (미리보기 카드 OR 진행 리스트 카드) */}
      <div className={cn("flex flex-col gap-6", (hasFiles || isUploading) ? 'md:flex-row' : '')}>
        
        {/* 왼쪽: 컨트롤 패널 (업로드 또는 로딩 인디케이터) */}
        <div
          className={cn(
            "border-4 border-dashed border-slate-200 rounded-3xl text-center transition-all bg-white group relative overflow-hidden",
            (hasFiles || isUploading) ? 'w-full md:w-1/3 p-8' : 'w-full p-12 md:p-20 cursor-pointer hover:bg-blue-50/50 hover:border-blue-300'
          )}
          onDrop={!isUploading ? handleDrop : undefined}
          onDragOver={!isUploading ? handleDragOver : undefined}
          onClick={!isUploading ? () => fileInputRef.current?.click() : undefined}
        >
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
          
          {isUploading ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-4 animate-in fade-in zoom-in-95">
              <div className="relative">
                <Loader2 className="w-24 h-24 animate-spin text-blue-600" />
                <div className="absolute inset-0 flex items-center justify-center font-black text-blue-600 text-xl">
                  {totalProgress}%
                </div>
              </div>
              <div className="space-y-2 text-center">
                <h3 className="text-2xl font-black text-slate-800 tracking-tight text-center">사진을 전송하고 있어요</h3>
                <p className="text-slate-500 font-bold">잠시만 기다려 주세요!</p>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-5 overflow-hidden shadow-inner border-2 border-slate-50">
                <div 
                  className="bg-blue-600 h-full transition-all duration-500 shadow-[0_0_20px_rgba(37,99,235,0.4)]" 
                  style={{ width: `${totalProgress}%` }}
                />
              </div>
              <p className="text-base font-black text-blue-600 bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 shadow-sm">
                총 {totalCount}장 중 {completedCount}장 완료
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className={cn("p-5 bg-blue-50 rounded-full group-hover:scale-110 transition-transform", !hasFiles ? 'p-8' : '')}>
                <Upload className={cn("text-blue-500", hasFiles ? 'w-8 h-8' : 'w-12 h-12')} />
              </div>
              <div className="text-center">
                <h3 className={cn("font-black text-slate-800", hasFiles ? 'text-xl' : 'text-3xl')}>
                  사진 {hasFiles ? '더 추가하기' : '이곳에 끌어놓으세요'}
                </h3>
                <p className="text-slate-500 font-bold mt-2">
                  또는 클릭하거나 <span className="text-blue-600 underline underline-offset-4 decoration-2">복사-붙여넣기</span> 하세요.
                </p>
                {!hasFiles && <p className="text-orange-600 font-black mt-8 text-xl animate-bounce tracking-tight">최대 500장까지 한꺼번에 가능!</p>}
              </div>
            </div>
          )}
        </div>

        {/* 오른쪽: 상세 정보 카드 (미리보기 또는 전역 진행 목록) */}
        {(hasFiles || isUploading) && (
          <Card className="flex-1 min-h-[600px] max-h-[800px] shadow-2xl border-2 border-blue-100 rounded-3xl overflow-hidden flex flex-col bg-white">
            <CardContent className="p-8 flex flex-col h-full overflow-hidden">
              <div className="flex items-center justify-between mb-6 border-b pb-6 shrink-0">
                <h4 className="text-2xl font-black flex items-center gap-3 text-slate-800 tracking-tight">
                  {isUploading ? (
                    <><CloudUpload className="w-8 h-8 text-blue-600" /> 전송 현황</>
                  ) : (
                    <><FileImage className="w-8 h-8 text-blue-600" /> 선택한 사진 {selectedFiles.length}장</>
                  )}
                </h4>
                {!isUploading && (
                  <Button variant="ghost" onClick={() => setSelectedFiles([])} className="text-red-500 hover:bg-red-50 font-black text-lg h-12 px-4 rounded-xl">모두 지우기</Button>
                )}
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar -mx-2 px-2">
                {isUploading ? (
                  <div className="space-y-4 pb-4">
                    {itemIds.map(id => {
                      const item = items[id];
                      return (
                        <div key={id} className="flex items-center justify-between p-5 rounded-2xl bg-slate-50/80 border-2 border-transparent hover:border-blue-200 transition-all group">
                          <div className="flex flex-col min-w-0 flex-1">
                            <span className="truncate font-bold text-slate-700 text-lg">{item.fileName}</span>
                            <div className="flex items-center gap-3 mt-2">
                              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner w-full max-w-[200px]">
                                <div className="bg-blue-500 h-full transition-all duration-300" style={{ width: `${item.progress}%` }} />
                              </div>
                              <span className="text-sm font-black text-blue-600 tabular-nums">{item.progress}%</span>
                            </div>
                          </div>
                          <div className="ml-6 shrink-0">
                            {item.status === 'completed' ? (
                              <div className="bg-green-100 p-2 rounded-full shadow-sm"><CheckCircle className="w-6 h-6 text-green-600" /></div>
                            ) : item.status === 'failed' ? (
                              <div className="bg-red-100 p-2 rounded-full shadow-sm"><AlertCircle className="w-6 h-6 text-red-500" /></div>
                            ) : (
                              <div className="flex flex-col items-end">
                                <span className="text-sm font-black text-blue-500 animate-pulse bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                                  {item.status === 'compressing' ? '다듬는 중' : '전송 중'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pb-4">
                    {selectedFiles.map((file, index) => (
                      <div key={index} className="relative group aspect-square bg-slate-50 rounded-2xl shadow-sm overflow-hidden border-2 border-white hover:border-blue-400 transition-all">
                        <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)} />
                        <button onClick={(e) => { e.stopPropagation(); removeFile(index); }} className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg hover:scale-110 active:scale-95">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!isUploading && (
                <div className="mt-6 pt-6 border-t shrink-0">
                  <Button 
                    className="w-full h-24 text-3xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-2xl active:scale-[0.98] transition-all rounded-3xl tracking-tight" 
                    onClick={handleUploadClick} 
                    disabled={isCheckingDuplicates}
                  >
                    {isCheckingDuplicates 
                      ? `사진 확인 중... ${duplicateProgress}%`
                      : '이 사진들 저장하기'}
                  </Button>
                  <p className="text-center text-slate-500 mt-4 font-bold text-lg tracking-tight">
                    저장 버튼을 누르면 업로드가 시작됩니다.
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