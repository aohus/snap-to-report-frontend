import { Draggable } from '@hello-pangea/dnd';
import { Photo } from '@/types';
import { api } from '@/lib/api';
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

export function PhotoCard({ photo, index, onDelete, isReserve, onSelect, isSelected }: PhotoCardProps) {
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
            ${snapshot.isDragging ? 'shadow-2xl ring-4 ring-blue-500 z-50 scale-105 rotate-2' : 'border border-gray-200 hover:border-blue-400 hover:shadow-md'}
            ${!isReserve && index < 3 && !isSelected ? 'ring-2 ring-green-500 border-green-500' : ''}
            ${isSelected ? 'ring-4 ring-blue-500 border-blue-500' : ''}
          `}
          style={{
            ...provided.draggableProps.style,
            width: '420px',
            height: '240px',
          }}
        >
          {/* Selection Badge */}
          {!isReserve && index < 3 && (
            <div className="absolute top-2 left-2 z-10 bg-green-600 text-white px-2 py-0.5 rounded-md text-base font-bold shadow-md">
              #{index + 1}
            </div>
          )}

          {/* Delete Button */}
          {onDelete && (
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute top-1 right-1 z-10 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
              onClick={(e) => {
                e.stopPropagation(); // Prevent drag start and selection
                onDelete(photo.id);
              }}
            >
              <X className="w-4 h-4" />
            </Button>
          )}

          {/* Image */}
          <div className="flex-1 overflow-hidden bg-gray-100">
            <img
              src={photo.url}
              alt={photo.original_filename}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </div>
      )}
    </Draggable>
  );
}