import React from 'react'; // React.memo 사용을 위해 import
import { Draggable, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Photo } from '@/types';
// import { api } from '@/lib/api'; // 사용되지 않아 제거 가능
import { X, Tags, Maximize2, CheckCircle2, GripHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onDelete?: (id: number | string) => void;
  isReserve?: boolean;
  onSelect?: (e: React.MouseEvent) => void;
  onPreview?: () => void; // New prop for triggering preview
  isSelected?: boolean;
  isCompact?: boolean;
  onEditLabels?: (id: string) => void;
  isDraggingSomewhere?: boolean; // New prop to detect global drag
  isMobile?: boolean; // New prop
}

interface PhotoCardInnerProps extends PhotoCardProps {
  provided: DraggableProvided;
  snapshot: DraggableStateSnapshot;
}

export const PhotoCardInner = React.memo(function PhotoCardInner({
  photo,
  index,
  onDelete,
  isReserve,
  onSelect,
  onPreview,
  isSelected,
  isCompact = false,
  onEditLabels,
  isDraggingSomewhere = false,
  provided,
  snapshot,
  isMobile: isMobileProp
}: PhotoCardInnerProps) {
  const isMobileHook = useIsMobile();
  const isMobile = isMobileProp ?? isMobileHook;

  return (
    <div
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...(!isMobile ? provided.dragHandleProps : {})}
      onClick={onSelect}
      className={`
        relative group flex flex-col bg-white rounded-md shadow-subtle overflow-hidden cursor-grab active:cursor-grabbing
        aspect-[16/10] flex-shrink-0
        ${!snapshot.isDragging ? 'transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]' : ''}
        ${isReserve 
          ? 'w-full' 
          : (isCompact ? 'w-[180px] md:w-[220px]' : 'w-[260px] sm:w-[320px] md:w-[400px]')
        }
        ${snapshot.isDragging 
          ? 'shadow-elevated ring-2 ring-primary/40 z-50 scale-105 rotate-1' 
          : 'border border-slate-200/60 hover:border-primary/40 hover:shadow-emphasis hover:-translate-y-0.5'
        }
        ${!isReserve && index < 3 && !isSelected ? 'ring-1 ring-emerald-500/50 border-emerald-500/50' : ''}
        ${isSelected 
          ? 'ring-[3px] ring-primary border-primary bg-primary/10 shadow-emphasis scale-[0.98]' 
          : ''
        }
        ${!snapshot.isDragging && isDraggingSomewhere && isSelected ? 'opacity-40 scale-[0.98] grayscale-[0.3]' : ''}
        ${isMobile && !snapshot.isDragging ? 'touch-pan-y' : ''} 
        ${isMobile && snapshot.isDragging ? 'touch-none' : ''}
      `}
      style={{
        ...provided.draggableProps.style,
        touchAction: isMobile ? (snapshot.isDragging ? 'none' : 'pan-y') : undefined,
      }}
    >
      {/* Mobile Drag Handle */}
      {isMobile && (
        <div 
            {...provided.dragHandleProps}
            className="absolute top-0 right-0 left-0 h-12 z-20 flex justify-center pt-1 pointer-events-auto"
            style={{ touchAction: 'none' }}
            onClick={(e) => e.stopPropagation()} // Prevent click propagation
        >
            <div className="bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-slate-100/50">
                <GripHorizontal className="w-5 h-5 text-slate-500" />
            </div>
        </div>
      )}

      {/* Selected Overlay & Icon */}
      {isSelected && (
        <div className="absolute inset-0 bg-primary/5 z-10 pointer-events-none transition-all duration-300">
          <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-0.5 shadow-lg animate-in zoom-in duration-200">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      )}

      {/* Multi-drag Badge */}
      {snapshot.isDragging && isSelected && (
          <div className="absolute -top-2 -right-2 z-50 bg-primary text-white w-8 h-8 rounded-full flex items-center justify-center font-bold shadow-elevated ring-2 ring-white animate-in zoom-in">
              +
          </div>
      )}
      {/* Selection Badge */}
      {!isReserve && index < 3 && (
        <div className={`absolute top-2 left-2 z-10 bg-emerald-600/90 backdrop-blur-md text-white rounded-md font-bold shadow-subtle ${isCompact ? 'px-1.5 py-0.5 text-[9px]' : 'px-2 py-0.5 text-[11px]'}`}>
          #{index + 1}
        </div>
      )}

      <div className="absolute top-1.5 right-1.5 flex gap-1 z-30">
          {/* Preview Button */}
          {onPreview && (
            <Button 
                variant="secondary" 
                size="icon" 
                className={`opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-subtle bg-white/90 backdrop-blur-md hover:bg-white hover:scale-105 active:scale-95 ${isCompact ? 'h-7 w-7' : 'h-8 w-8'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onPreview();
                }}
            >
                <Maximize2 className={isCompact ? "w-3.5 h-3.5 text-slate-700" : "w-4 h-4 text-slate-700"} />
            </Button>
          )}

          {/* Edit Labels Button */}
          {onEditLabels && (
            <Button 
                variant="secondary" 
                size="icon" 
                className={`opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-subtle bg-white/90 backdrop-blur-md hover:bg-white hover:scale-105 active:scale-95 ${isCompact ? 'h-7 w-7' : 'h-8 w-8'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onEditLabels(photo.id.toString());
                }}
            >
                <Tags className={isCompact ? "w-3.5 h-3.5 text-slate-700" : "w-4 h-4 text-slate-700"} />
            </Button>
          )}

        {/* Delete Button */}
        {onDelete && (
            <Button 
            variant="destructive" 
            size="icon" 
            className={`opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-subtle hover:scale-105 active:scale-95 ${isCompact ? 'h-7 w-7' : 'h-8 w-8'}`}
            onClick={(e) => {
                e.stopPropagation();
                onDelete(photo.id);
            }}
            >
            <X className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
            </Button>
        )}
      </div>

      {/* Labels Overlay */}
      {photo.labels && Object.keys(photo.labels).length > 0 && (
          <div className="absolute bottom-2 left-2 right-2 bg-slate-900/80 text-white text-[10px] font-semibold px-2 py-1.5 rounded-md backdrop-blur-md truncate z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/5 shadow-subtle">
            {Object.entries(photo.labels).map(([k, v]) => (
                <span key={k} className="mr-2 last:mr-0">
                    <span className="opacity-50 font-bold mr-1 uppercase text-[8px]">{k}</span>
                    <span>{v}</span>
                </span>
            ))}
          </div>
      )}

      {/* Image */}
      <div className="flex-1 overflow-hidden bg-gray-100">
        <img
          src={photo.thumbnail_url || photo.url} 
          alt={photo.original_filename}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          loading="lazy"
          decoding="async" 
        />
      </div>
    </div>
  );
});


// React.memo로 감싸서 props가 변하지 않으면 리렌더링 방지
export const PhotoCard = React.memo(function PhotoCard(props: PhotoCardProps) {
  const isMobile = useIsMobile();
  return (
    <Draggable draggableId={props.photo.id.toString()} index={props.index}>
      {(provided, snapshot) => (
         <PhotoCardInner {...props} provided={provided} snapshot={snapshot} isMobile={isMobile} />
      )}
    </Draggable>
  );
});