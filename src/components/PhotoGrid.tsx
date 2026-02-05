import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Photo } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { useElementSize } from '@/hooks/useElementSize';

interface PhotoGridProps {
  photos: Photo[];
}

export function PhotoGrid({ photos }: PhotoGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const { width } = useElementSize(parentRef);

  const ITEM_MIN_WIDTH = 150;
  const GAP = 8; // 8px gap

  // Calculate columns
  // Avoid division by zero
  const safeWidth = width || 1000; // Fallback
  const columns = Math.max(1, Math.floor((safeWidth + GAP) / (ITEM_MIN_WIDTH + GAP)));
  
  // Calculate exact item width for aspect-square
  // width = cols * itemWidth + (cols - 1) * gap
  // width + gap = cols * (itemWidth + gap)
  // itemWidth + gap = (width + gap) / cols
  // itemWidth = ((width + gap) / cols) - gap
  const itemWidth = ((safeWidth + GAP) / columns) - GAP;
  const rowHeight = itemWidth + GAP;
  
  const rows = Math.ceil(photos.length / columns);

  const rowVirtualizer = useVirtualizer({
    count: rows,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 3,
  });

  return (
    <Card>
      <CardContent className="p-4 h-[500px] flex flex-col">
        <h4 className="font-medium mb-4 flex-shrink-0">{photos.length} photos uploaded</h4>
        <div 
            ref={parentRef} 
            className="flex-1 overflow-y-auto contain-strict"
            style={{ paddingRight: '4px' }} // Optional: space for scrollbar
        >
          <div
            style={{
              height: `${rowVirtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const startIndex = virtualRow.index * columns;
                const rowPhotos = photos.slice(startIndex, startIndex + columns);

                return (
                    <div
                        key={virtualRow.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: `${itemWidth}px`, // row content height
                            transform: `translateY(${virtualRow.start}px)`,
                            display: 'grid',
                            gridTemplateColumns: `repeat(${columns}, 1fr)`,
                            gap: `${GAP}px`,
                        }}
                    >
                        {rowPhotos.map(photo => (
                             <div key={photo.id} className="aspect-square bg-gray-100 rounded-md overflow-hidden relative border border-gray-100 shadow-sm">
                                <img
                                    src={photo.thumbnail_url || photo.url}
                                    alt={photo.original_filename}
                                    className="w-full h-full object-cover transition-transform hover:scale-105"
                                    loading="lazy"
                                />
                             </div>
                        ))}
                    </div>
                );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}