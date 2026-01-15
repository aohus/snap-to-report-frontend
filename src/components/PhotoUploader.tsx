import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, FileImage, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface PhotoUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  isUploading: boolean;
  progress?: number;
}

export function PhotoUploader({ onUpload, isUploading, progress }: PhotoUploaderProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
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
    // 동일한 파일을 다시 선택할 수 있도록 input 초기화
    if (e.target) {
      e.target.value = '';
    }
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
      // 클립보드에 파일이 있는지 확인
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        e.preventDefault(); // 기본 붙여넣기 동작(이미지 새탭 열기 등) 방지
        const pastedFiles = Array.from(e.clipboardData.files);
        processFiles(pastedFiles);
      }
    };

    // 윈도우 전체에 리스너 등록
    window.addEventListener('paste', handlePaste);

    // 컴포넌트 언마운트 시 리스너 제거
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [processFiles]);

  const removeFile = (index: number) => {
    // 메모리 누수 방지를 위해 URL revoke는 브라우저에게 맡기거나, 
    // 엄격하게 관리하려면 별도 useEffect가 필요하지만, 
    // 여기서는 배열에서 제거하는 것으로 처리합니다.
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadClick = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      await onUpload(selectedFiles);
      setSelectedFiles([]);
    } catch (error) {
      console.error("Error uploading files:", error);
    }
  };

  const hasFiles = selectedFiles.length > 0;

  return (
    <div className={`w-full mx-auto space-y-6 transition-all duration-300 ${hasFiles ? 'max-w-7xl' : 'max-w-3xl'}`}>
      <div className={`flex flex-col gap-6 ${hasFiles ? 'md:flex-row' : ''}`}>
        <div
          className={`
            border-2 border-dashed border-gray-300 rounded-lg text-center hover:bg-gray-50 transition-colors cursor-pointer
            ${hasFiles ? 'w-full md:w-1/3 p-6' : 'w-full p-6 md:p-10'}
          `}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          // 접근성 및 포커스 처리를 위해 tabIndex 추가 (선택사항)
          // tabIndex={0}
        >
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            multiple
            accept="image/*"
            onChange={handleFileChange}
          />
          {hasFiles ? (
            <div className="flex flex-col items-center justify-center space-y-3">
              <div className="p-3 bg-blue-50 rounded-full">
                <Upload className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">사진 추가</h3>
                <p className="text-sm text-gray-500">클릭, 드래그 또는 <span className="text-blue-600">Ctrl+V</span>로 등록하세요. </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="p-4 bg-blue-50 rounded-full">
                <Upload className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">클릭, 드래그 또는 <span className="text-blue-600">Ctrl+V</span>로 등록하세요.</h3>
                <p className="text-base text-gray-500">최대 500장의 사진을 등록할 수 있습니다.</p>
              </div>
            </div>
          )}
        </div>

        {hasFiles && (
          <Card className="flex-1 h-fit">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-medium flex items-center gap-2">
                  <FileImage className="w-4 h-4" />
                  {selectedFiles.length}개 사진 미리보기
                </h4>
                <Button variant="ghost" size="sm" onClick={() => setSelectedFiles([])}>
                  모두 지우기
                </Button>
              </div>
              
              <div className="max-h-[600px] overflow-y-auto grid grid-cols-3 md:grid-cols-5 gap-2 mb-4">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="relative group aspect-square bg-gray-100 rounded-md overflow-hidden">
                    <img 
                      src={URL.createObjectURL(file)} 
                      alt="preview" 
                      className="w-full h-full object-cover"
                      onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}
                    />
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                      className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              <Button 
                className="w-full" 
                onClick={handleUploadClick} 
                disabled={isUploading}
              >
                {isUploading 
                    ? '사진을 저장 중입니다...' 
                    : '사진 저장하기'}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
      
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>사진 저장 중...</span>
            <span>{progress ? `${progress}%` : 'Please wait'}</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}
    </div>
  );
}
