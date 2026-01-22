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

import { UploadProgress } from './UploadProgress';

import { useUploadStore } from '@/lib/uploadStore';



interface PhotoUploaderProps {

  onUpload: (files: File[]) => Promise<void>;

}



export function PhotoUploader({ onUpload }: PhotoUploaderProps) {

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const [isCheckingDuplicates, setIsCheckingDuplicates] = useState(false);

  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([]);

  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  

  const isUploading = useUploadStore((state) => state.isUploading);

  // ... (이전 핸들러들 동일)



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

      

      const filesToUpload = [...selectedFiles];

      setSelectedFiles([]); // 즉시 비우기 (낙관적 UI)

      await onUpload(filesToUpload);

    } catch (error) {

      console.error("Error checking/uploading files:", error);

      const filesToUpload = [...selectedFiles];

      setSelectedFiles([]);

      await onUpload(filesToUpload);

    } finally {

      setIsCheckingDuplicates(false);

    }

  };



  // ... (다른 함수들 동일)



  const handleDeleteDuplicates = async () => {

    // ... (필터링 로직 동일)

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

    <div className={`w-full mx-auto space-y-6 transition-all duration-300 ${hasFiles ? 'max-w-7xl' : 'max-w-3xl'}`}>

      {/* ... (Dialog 내용 동일) */}



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

              <p className="text-sm text-gray-500 font-medium">

                클릭, 드래그 또는 <span className="text-blue-600 font-bold">복사-붙여넣기</span>로 등록하세요.

              </p>

              {!hasFiles && <p className="text-xs text-gray-400 mt-2 font-bold text-orange-600">최대 500장까지 한꺼번에 올릴 수 있어요!</p>}

            </div>

          </div>

        </div>



        {hasFiles && (

          <Card className="flex-1 h-fit shadow-lg border-2 border-blue-100">

            <CardContent className="p-4">

              <div className="flex items-center justify-between mb-4 border-b pb-2">

                <h4 className="text-lg font-bold flex items-center gap-2 text-slate-800">

                  <FileImage className="w-5 h-5 text-blue-600" />

                  올릴 사진 {selectedFiles.length}장을 확인하세요

                </h4>

                <Button variant="ghost" size="sm" className="text-slate-500 hover:text-red-500 font-bold" onClick={() => setSelectedFiles([])}>

                  모두 지우기

                </Button>

              </div>

              

              <div className="max-h-[400px] overflow-y-auto grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-6 p-2 bg-slate-50 rounded-lg">

                {selectedFiles.map((file, index) => (

                  <div key={index} className="relative group aspect-square bg-white rounded-lg shadow-sm overflow-hidden border-2 border-white hover:border-blue-400 transition-all">

                    <img 

                      src={URL.createObjectURL(file)} 

                      alt="preview" 

                      className="w-full h-full object-cover"

                      onLoad={(e) => URL.revokeObjectURL(e.currentTarget.src)}

                    />

                    <button 

                      onClick={(e) => { e.stopPropagation(); removeFile(index); }}

                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"

                    >

                      <X className="w-4 h-4" />

                    </button>

                  </div>

                ))}

              </div>



              <Button 

                className="w-full h-16 text-xl font-black bg-blue-600 hover:bg-blue-700 shadow-xl active:scale-[0.98] transition-all" 

                onClick={handleUploadClick} 

                disabled={isUploading || isCheckingDuplicates}

              >

                {isCheckingDuplicates 

                  ? '비슷한 사진이 있는지 확인 중...'

                  : isUploading 

                    ? '사진을 저장하고 있어요...' 

                    : '이 사진들을 모두 저장하기'}

              </Button>

              <p className="text-center text-sm text-gray-500 mt-3 font-medium">

                저장 버튼을 누르면 서버에 전송이 시작됩니다.

              </p>

            </CardContent>

          </Card>

        )}

      </div>

      

      {/* 업로드 프로그레스 전역 컴포넌트 */}

      <UploadProgress />

    </div>

  );

}
