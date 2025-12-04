import React from 'react'; // React.memo 사용을 위해 import
import { Draggable } from '@hello-pangea/dnd';
import { Photo } from '@/types';
// import { api } from '@/lib/api'; // 사용되지 않아 제거 가능
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PhotoCardProps {
  photo: Photo;
  index: number;
  onDelete?: (id: number | string) => void;
  isReserve?: boolean;
  onSelect?: () => void;
  isSelected?: boolean;
}

// React.memo로 감싸서 props가 변하지 않으면 리렌더링 방지
export const PhotoCard = React.memo(function PhotoCard({ 
  photo, 
  index, 
  onDelete, 
  isReserve, 
  onSelect, 
  isSelected 
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
            relative group flex flex-col bg-white rounded-xl shadow-sm overflow-hidden cursor-grab active:cursor-grabbing
            transition-all duration-200 ease-in-out
            w-[280px] h-[160px] sm:w-[340px] sm:h-[200px] md:w-[420px] md:h-[240px]
            ${snapshot.isDragging ? 'shadow-2xl ring-4 ring-blue-500 z-50 scale-105 rotate-2' : 'border border-gray-200 hover:border-blue-400 hover:shadow-md'}
            ${!isReserve && index < 3 && !isSelected ? 'ring-2 ring-green-500 border-green-500' : ''}
            ${isSelected ? 'ring-4 ring-blue-500 border-blue-500' : ''}
          `}
          style={{
            ...provided.draggableProps.style,
          }}
        >
          {/* Selection Badge */}
          {!isReserve && index < 3 && (
            <div className="absolute top-2 left-2 z-10 bg-green-600 text-white px-2 py-0.5 rounded-md text-xs md:text-base font-bold shadow-md">
              #{index + 1}
            </div>
          )}

          {/* Delete Button */}
          {onDelete && (
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-1 right-1 z-10 h-6 w-6 md:h-7 md:w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(photo.id);
              }}
            >
              <X className="w-3 h-3 md:w-4 md:h-4" />
            </Button>
          )}

          {/* Image */}
          <div className="flex-1 overflow-hidden bg-gray-100">
            <img
              // 1. 썸네일이 있다면 우선 사용, 없다면 원본 사용 (백엔드 필드 확인 필요)
              // 예: src={photo.thumbnail_url || photo.url} 
              src={photo.thumbnail_path || photo.url} 
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
    prevProps.photo.url === nextProps.photo.url &&
    prevProps.index === nextProps.index &&
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isReserve === nextProps.isReserve
  );
});