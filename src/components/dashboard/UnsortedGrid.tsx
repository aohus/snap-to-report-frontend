import { Button } from '@/components/ui/button';
import { PhotoGrid } from '@/components/PhotoGrid';
import { PhotoUploader } from '@/components/PhotoUploader';
import { Photo } from '@/types';
import { cn } from '@/lib/utils';

interface UnsortedGridProps {
  photos: Photo[];
  isClustering: boolean;
  onStartClustering: () => void;
  onUpload: (files: File[]) => Promise<void>;
}

export function UnsortedGrid({ photos, isClustering, onStartClustering, onUpload }: UnsortedGridProps) {
  return (
    <div className={cn("flex-1 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border", photos.length > 0 ? "p-4 md:p-10" : "p-4 md:p-10")}>
      {photos.length > 0 && (
        <div className="w-full max-w-3xl mx-auto space-y-6 mt-6 mb-6">
          <PhotoGrid photos={photos} />
          <Button
            className="w-full"
            size="lg"
            onClick={onStartClustering}
            disabled={isClustering}
          >
            사진 분류 시작하기
          </Button>
        </div>
      )}
      {!isClustering && (
        <PhotoUploader onUpload={onUpload} />
      )}
    </div>
  );
}
