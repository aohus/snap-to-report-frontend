import { Photo } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { api } from '@/lib/api';
interface PhotoGridProps {
  photos: Photo[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <h4 className="font-medium mb-4">{photos.length} photos uploaded</h4>
        <ScrollArea className="h-40">
          <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2">
            {photos.map((photo) => (
              <div key={photo.id} className="aspect-square bg-gray-100 rounded-md overflow-hidden">
            <img
              src={api.getPhotoUrl(photo.storage_path)}
              alt={photo.original_filename}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
              </div>
            ))}
          </div>
          <ScrollBar orientation="vertical" />
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
