import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
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
import { UploadProgress } from './UploadProgress';
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
  
  const isUploading = useUploadStore((state) => state.isUploading);

  // ... (이전 핸들러들 동일)

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
      setSelectedFiles([]); // 낙관적 UI
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
    setSelectedFiles([]); // 즉시 비우기
    
    try {
      await onUpload(filteredFiles);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <div className={cn("w-full mx-auto space-y-6 transition-all duration-300", hasFiles ? 'max-w-7xl' : 'max-w-3xl')}>
      {/* 중복 사진 관리 다이얼로그 */}
      <Dialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <DialogContent className="max-w-5xl w-full flex flex-col max-h-[90vh] overflow-hidden p-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="flex items-center gap-2 text-2xl font-black">
              <AlertCircle className="w-7 h-7 text-orange-500" />
              비슷한 사진이 있어요!
            </DialogTitle>
            <DialogDescription className="text-lg font-medium text-slate-600">
              {duplicateGroups.length}개 묶음의 사진이 중복으로 보입니다. 
              남길 사진 1장씩만 선택해 주세요.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="flex-grow px-6 bg-slate-50/50">
            <div className="py-4 space-y-8">
              {duplicateGroups.map((group, groupIndex) => (
                <div key={group.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                  <div className="flex items-center justify-between p-4 border-b bg-white">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black">
                        {groupIndex + 1}
                      </span>
                      <span className="font-bold text-slate-900">
                        {group.reason === 'name' ? '파일명이 똑같아요' : '그림이 아주 비슷해요'}
                      </span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeDuplicateGroup(group.id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>

                  <div className="p-4 flex gap-4 overflow-x-auto pb-6">
                    {group.files.map((file, fileIndex) => {
                      const isKept = file === group.keptFile;
                      return (
                        <div 
                          key={fileIndex} 
                          className="relative flex-shrink-0 w-48 cursor-pointer group"
                          onClick={() => changeKeptFile(group.id, file)}
                        >
                          <div className={cn(
                            "aspect-square rounded-xl overflow-hidden border-4 transition-all duration-200",
                            isKept ? "border-blue-500 shadow-xl scale-105" : "border-slate-100 opacity-50 grayscale"
                          )}>
                            <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                          </div>
                          {isKept && (
                            <div className="absolute top-2 right-2 bg-blue-500 text-white px-2 py-1 rounded-md text-[10px] font-black shadow-lg">남김</div>
                          )}
                          <p className={cn("mt-2 text-xs truncate text-center font-medium", isKept ? "text-blue-600" : "text-slate-400")}>
                            {file.name}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <DialogFooter className="p-6 bg-white border-t">
            <Button variant="outline" onClick={() => setShowDuplicateDialog(false)} className="h-12 px-8 font-bold">취소</Button>
            <Button onClick={handleDeleteDuplicates} className="h-12 px-10 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg">
              중복 사진 빼고 저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 메인 업로드 영역 */}
      <div className={cn("flex flex-col gap-6", hasFiles ? 'md:flex-row' : '')}>
        <div
          className={cn(
            "border-4 border-dashed border-slate-200 rounded-3xl text-center hover:bg-blue-50/50 hover:border-blue-300 transition-all cursor-pointer bg-white group",
            hasFiles ? 'w-full md:w-1/3 p-8' : 'w-full p-12 md:p-20'
          )}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input type="file" ref={fileInputRef} className="hidden" multiple accept="image/*" onChange={handleFileChange} />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={cn("p-5 bg-blue-50 rounded-full group-hover:scale-110 transition-transform", !hasFiles ? 'p-8' : '')}>
              <Upload className={cn("text-blue-500", hasFiles ? 'w-8 h-8' : 'w-12 h-12')} />
            </div>
            <div>
              <h3 className={cn("font-black text-slate-800", hasFiles ? 'text-xl' : 'text-3xl')}>
                사진 {hasFiles ? '더 추가하기' : '이곳에 끌어놓으세요'}
              </h3>
              <p className="text-slate-500 font-bold mt-2">
                또는 클릭하거나 <span className="text-blue-600 underline underline-offset-4">복사-붙여넣기</span> 하세요.
              </p>
              {!hasFiles && <p className="text-orange-600 font-black mt-6 text-lg animate-bounce">최대 500장까지 한꺼번에 가능!</p>}
            </div>
          </div>
        </div>

        {hasFiles && (
          <Card className="flex-1 h-fit shadow-2xl border-2 border-blue-100 rounded-3xl overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6 border-b pb-4">
                <h4 className="text-2xl font-black flex items-center gap-3 text-slate-800">
                  <FileImage className="w-7 h-7 text-blue-600" />
                  올릴 사진 {selectedFiles.length}장 확인
                </h4>
                <Button variant="ghost" onClick={() => setSelectedFiles([])} className="text-red-500 hover:bg-red-50 font-black">모두 지우기</Button>
              </div>
              
              <div className="max-h-[450px] overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8 p-2 bg-slate-50 rounded-2xl">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group aspect-square bg-white rounded-xl shadow-sm overflow-hidden border-2 border-white hover:border-blue-400 transition-all">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="preview" 
                      className="w-full h-full object-cover"
                      onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                      className="absolute top-1.5 right-1.5 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full h-20 text-2xl font-black bg-blue-600 hover:bg-blue-700 text-white shadow-xl active:scale-[0.98] transition-all rounded-2xl" 
                onClick={handleUploadClick} 
                disabled={isUploading || isCheckingDuplicates}
              >
                {isCheckingDuplicates 
                  ? `비슷한 사진 확인 중... ${duplicateProgress}%`
                  : isUploading 
                    ? '사진을 저장하고 있어요...' 
                    : '이 사진들을 모두 저장하기'}
              </Button>
              <p className="text-center text-slate-500 mt-4 font-black">
                저장 버튼을 누르면 업로드가 시작됩니다.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <UploadProgress />
    </div>
  );
}