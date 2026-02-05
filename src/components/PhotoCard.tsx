import React from 'react'; // React.memo 사용을 위해 import
import { Draggable } from '@hello-pangea/dnd';
import { Photo } from '@/types';
// import { api } from '@/lib/api'; // 사용되지 않아 제거 가능
import { X, Tags, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

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
}

// React.memo로 감싸서 props가 변하지 않으면 리렌더링 방지
export const PhotoCard = React.memo(function PhotoCard({
  photo,
  index,
  onDelete,
  isReserve,
  onSelect,
  onPreview,
  isSelected,
  isCompact = false,
  onEditLabels,
  isDraggingSomewhere = false
}: PhotoCardProps) {
  return (
    <Draggable draggableId={photo.id.toString()} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={onSelect}
          className={`
            relative group flex flex-col bg-white rounded-3xl shadow-professional overflow-hidden cursor-grab active:cursor-grabbing
            transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
            ${isCompact 
              ? 'w-[200px] h-[150px] md:w-[240px] md:h-[180px] rounded-2xl' 
              : 'w-[280px] h-[160px] sm:w-[340px] sm:h-[200px] md:w-[420px] md:h-[240px]'
            }
            ${snapshot.isDragging 
              ? 'shadow-elevated ring-4 ring-primary/40 z-50 scale-105 rotate-2' 
              : 'border border-slate-200/60 hover:border-primary/40 hover:shadow-emphasis hover:-translate-y-1'
            }
            ${!isReserve && index < 3 && !isSelected ? 'ring-2 ring-emerald-500/50 border-emerald-500/50' : ''}
            ${isSelected ? 'ring-4 ring-primary border-primary bg-primary/5 shadow-emphasis shadow-primary/20' : ''}
            ${!snapshot.isDragging && isDraggingSomewhere && isSelected ? 'opacity-40 scale-[0.98] grayscale-[0.5]' : ''}
          `}
          style={{
            ...provided.draggableProps.style,
          }}
        >
          {/* Multi-drag Badge */}
          {snapshot.isDragging && isSelected && (
              <div className="absolute -top-3 -right-3 z-50 bg-primary text-white w-10 h-10 rounded-full flex items-center justify-center font-black shadow-2xl ring-4 ring-white animate-in zoom-in duration-300">
                  +
              </div>
          )}
          {/* Selection Badge */}
          {!isReserve && index < 3 && (
            <div className={`absolute top-3 left-3 z-10 bg-emerald-600/90 backdrop-blur-md text-white rounded-xl font-black shadow-lg ${isCompact ? 'px-2 py-0.5 text-[10px]' : 'px-3 py-1 text-xs md:text-sm'}`}>
              #{index + 1}
            </div>
          )}

          <div className="absolute top-2 right-2 flex gap-1.5 z-10">
             {/* Preview Button */}
             {onPreview && (
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className={`opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl bg-white/90 backdrop-blur-md hover:bg-white hover:scale-110 active:scale-90 ${isCompact ? 'h-7 w-7' : 'h-8 w-8 md:h-10 md:w-10'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onPreview();
                    }}
                    title="크게 보기"
                >
                    <Maximize2 className={isCompact ? "w-3.5 h-3.5 text-slate-700" : "w-4 h-4 md:w-5 md:h-5 text-slate-700"} />
                </Button>
             )}

             {/* Edit Labels Button */}             {onEditLabels && (
                <Button 
                    variant="secondary" 
                    size="icon" 
                    className={`opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl bg-white/90 backdrop-blur-md hover:bg-white hover:scale-110 active:scale-90 ${isCompact ? 'h-7 w-7' : 'h-8 w-8 md:h-10 md:w-10'}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEditLabels(photo.id.toString());
                    }}
                >
                    <Tags className={isCompact ? "w-3.5 h-3.5 text-slate-700" : "w-4 h-4 md:w-5 md:h-5 text-slate-700"} />
                </Button>
             )}

            {/* Delete Button */}
            {onDelete && (
                <Button 
                variant="destructive" 
                size="icon" 
                className={`opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl hover:scale-110 active:scale-90 ${isCompact ? 'h-7 w-7' : 'h-8 w-8 md:h-10 md:w-10'}`}
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete(photo.id);
                }}
                >
                <X className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4 md:w-5 md:h-5"} />
                </Button>
            )}
          </div>

          {/* Labels Overlay */}
          {photo.labels && Object.keys(photo.labels).length > 0 && (
             <div className="absolute bottom-3 left-3 right-3 bg-slate-900/80 text-white text-[11px] font-bold px-3 py-2 rounded-2xl backdrop-blur-md truncate z-10 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 border border-white/10 shadow-xl">
                {Object.entries(photo.labels).map(([k, v]) => (
                    <span key={k} className="mr-2 last:mr-0">
                        <span className="opacity-50 font-medium mr-1 uppercase text-[9px]">{k}</span>
                        <span>{v}</span>
                    </span>
                ))}
             </div>
          )}

          {/* Image */}
          <div className="flex-1 overflow-hidden bg-gray-100">
            <img
              // 1. 썸네일이 있다면 우선 사용, 없다면 원본 사용 (백엔드 필드 확인 필요)
              src={photo.thumbnail_url || photo.url} 
              alt={photo.original_filename}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
              decoding="async" // 2. 비동기 디코딩
            />
          </div>
        </div>
      )}
    </Draggable>
  );
}, (prevProps, nextProps) => {
  // 3. 커스텀 비교 함수 (선택사항): 
  // 드래그 앤 드롭 시 불필요한 리렌더링을 강력하게 막고 싶다면 사용합니다.
  return (
    prevProps.photo.id === nextProps.photo.id &&
    prevProps.photo.thumbnail_url === nextProps.photo.thumbnail_url &&
    prevProps.photo.labels === nextProps.photo.labels &&
    prevProps.index === nextProps.index &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isReserve === nextProps.isReserve &&
    prevProps.isCompact === nextProps.isCompact
  );
});