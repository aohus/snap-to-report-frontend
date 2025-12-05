import { useState, useRef } from 'react';
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      // Limit to 1000 files total if needed, but for now just add them
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
      setSelectedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const removeFile = (index: number) => {
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

  return (
    <div className="w-full max-w-3xl mx-auto space-y-6">
      <div
        className="border-2 border-dashed border-gray-300 rounded-lg p-6 md:p-10 text-center hover:bg-gray-50 transition-colors cursor-pointer"
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
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-blue-50 rounded-full">
            <Upload className="w-8 h-8 text-blue-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Click or drag photos here</h3>
            <p className="text-sm text-gray-500">Support up to 1000 photos</p>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium flex items-center gap-2">
                <FileImage className="w-4 h-4" />
                {selectedFiles.length} photos selected
              </h4>
              <Button variant="ghost" size="sm" onClick={() => setSelectedFiles([])}>
                Clear all
              </Button>
            </div>
            
            <div className="max-h-60 overflow-y-auto grid grid-cols-3 md:grid-cols-4 gap-2 mb-4">
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
                  ? '사진을 등록 중입니다...' 
                  : '사진 등록하기'}
            </Button>
          </CardContent>
        </Card>
      )}
      
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress ? `${progress}%` : 'Please wait'}</span>
          </div>
          <Progress value={progress} className="w-full" />
        </div>
      )}
    </div>
  );
}
