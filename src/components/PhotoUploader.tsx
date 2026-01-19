import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileImage, X, AlertCircle } from 'lucide-react';
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

interface PhotoUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading: boolean;
  progress?: number;
}

export function PhotoUploader({ onUpload, isUploading, progress }: PhotoUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleUploadClick = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsCheckingDuplicates(true);
    try {
      const groups = await detectDuplicates(selectedFiles);
      if (groups.length > 0) {
        setDuplicateGroups(groups);
        setShowDuplicateDialog(true);
        setIsCheckingDuplicates(false);
        return;
      }
      
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error checking/uploading files:", error);
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } finally {
      setIsCheckingDuplicates(false);
    }
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

  /**
   * [핵심 로직] 중복 사진 삭제 확정 및 업로드
   * 사용자가 선택하지 않은(keptFile이 아닌) 중복 파일들을 전체 목록에서 제외합니다.
   */
  const handleDeleteDuplicates = async () => {
    const filesToRemove = new Set<File>();
    
    // 모든 중복 그룹을 돌며 keptFile이 아닌 파일들을 삭제 목록(Set)에 추가
    duplicateGroups.forEach(group => {
      group.files.forEach(f => {
        if (f !== group.keptFile) {
          filesToRemove.add(f);
        }
      });
    });
    
    // 전체 파일 목록에서 삭제 목록에 포함되지 않은 파일만 필터링 (원래 삭제 로직)
    const filteredFiles = selectedFiles.filter(f => !filesToRemove.has(f));
    
    setShowDuplicateDialog(false);
    setSelectedFiles(filteredFiles); // UI 반영
    
    try {
      await onUpload(filteredFiles);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <div className={`w-full mx-auto space-y-6 transition-all duration-300 ${hasFiles ? 'max-w-7xl' : 'max-w-3xl'}`}>
      {/* 중복 사진 관리 다이얼로그 */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2 text-xl font-bold">
              <AlertCircle className="w-6 h-6 text-orange-500" />
              중복 사진 발견
            </DialogTitle>
            <DialogDescription className="text-sm text-slate-500">
              총 {duplicateGroups.length}개의 중복 사진 그룹이 발견되었습니다.
              <br />
              '중복 사진 삭제'를 선택하면 각 그룹에서 최적의 사진 1장만 남기고 나머지는 제외됩니다.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-grow h-[600px] w-full border rounded-lg bg-slate-50/50 mt-4 min-w-0">
            <div 
              className="p-5 gap-y-6 w-full" 
              style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)' }}
            >
              {duplicateGroups.map((group, groupIndex) => (
                <div 
                  key={group.id} 
                  className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col w-full min-w-0 overflow-hidden"
                >
                  {/* 고정 헤더: 제목과 X 버튼 */}
                  <div className="flex items-center justify-between p-4 bg-white border-b border-slate-100 w-full flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-600 text-sm font-black">
                        {groupIndex + 1}
                      </span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-slate-900 truncate">
                          {group.reason === 'name' ? '파일명 중복' : '유사한 이미지'}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {group.files.length}개 중 1개 선택됨
                        </span>
                      </div>
                    </div>

                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="flex-shrink-0 h-9 w-9 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full ml-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeDuplicateGroup(group.id);
                      }}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="w-full min-w-0 overflow-hidden">
                    <div className="flex flex-nowrap gap-4 p-5 overflow-x-auto bg-white scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                      {group.files.map((file, fileIndex) => {
                        const isKept = file === group.keptFile;
                        return (
                          <div 
                            key={fileIndex} 
                            className="relative flex-shrink-0 w-60 group cursor-pointer select-none"
                            onClick={() => changeKeptFile(group.id, file)}
                          >
                            <div className={`aspect-square rounded-xl overflow-hidden border-4 transition-all duration-300 ${
                              isKept 
                                ? 'border-green-500 shadow-md scale-[1.02]' 
                                : 'border-slate-50 opacity-40 grayscale-[0.5] hover:opacity-100 hover:grayscale-0'
                            }`}>
                              <img 
                                src={URL.createObjectURL(file)} 
                                alt="preview" 
                                className="w-full h-full object-cover"
                                onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                              />
                            </div>
                            
                            <div className="mt-3">
                              <p className={`text-[11px] truncate ${isKept ? 'text-green-700 font-bold' : 'text-slate-400 line-through'}`}>
                                {file.name}
                              </p>
                            </div>

                            {isKept && (
                              <span className="absolute top-3 right-3 bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded-lg shadow-lg z-20">
                                KEEP
                              </span>
                            )}
                          </div>
                        );
                      })}
                      <div className="flex-shrink-0 w-2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="mt-6 flex-shrink-0 bg-white border-t pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDuplicateDialog(false)}
              className="px-6 border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              취소
            </Button>
            <Button 
              className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 shadow-md transition-all active:scale-95"
              onClick={handleDeleteDuplicates}
            >
              중복 사진 삭제 확정
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메인 업로드 영역 */}
      <div className={`flex flex-col gap-6 ${hasFiles ? 'md:flex-row' : ''}`}>
        <div
          className={`
            border-2 border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors cursor-pointer
            ${hasFiles ? 'w-full md:w-1/3 p-6' : 'w-full p-6 md:p-10'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileChange}
          />
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className={`p-3 bg-blue-50 rounded-full ${!hasFiles ? 'p-4' : ''}`}>
              <Upload className={`${hasFiles ? 'w-6 h-6' : 'w-8 h-8'} text-blue-500`} />
            </div>
            <div>
              <h3 className={`${hasFiles ? 'text-lg' : 'text-xl'} font-semibold`}>
                사진 {hasFiles ? '추가' : '등록'}
              </h3>
              <p className="text-sm text-gray-500">
                클릭, 드래그 또는 <span className="text-blue-600 font-medium">Ctrl+V</span>로 등록하세요.
              </p>
              {!hasFiles && <p className="text-xs text-gray-400 mt-2">최대 500장까지 등록 가능합니다.</p>}
            </div>
          </div>
        </div>

        {hasFiles && (
          <Card className="flex-1 h-fit">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium flex items-center gap-2 text-slate-700">
                  <FileImage className="w-4 h-4" />
                  {selectedFiles.length}개 사진 미리보기
                </h4>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-500" onClick={() => setSelectedFiles([])}>
                  모두 지우기
                </Button>
              </div>
              
              <div className="max-h-[500px] overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 mb-4 p-1">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group aspect-square bg-gray-100 rounded-md overflow-hidden border border-slate-100">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="preview" 
                      className="w-full h-full object-cover"
                      onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full h-12 text-base font-bold" 
                onClick={handleUploadClick} 
                disabled={isUploading || isCheckingDuplicates}
              >
                {isCheckingDuplicates 
                  ? '중복 사진 검사 중...'
                  : isUploading 
                    ? '사진 저장 중...' 
                    : '사진 저장하기'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* 업로드 프로그레스 바 */}
      {isUploading && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex justify-between text-sm font-medium text-slate-600">
            <span>서버로 전송 중...</span>
            <span>{progress ? `${progress}%` : '준비 중'}</span>
          </div>
          <Progress value={progress} className="w-full h-2" />
        </div>
      )}
    </div>
  );
}