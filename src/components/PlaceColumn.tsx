import { useState, useEffect, useRef } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Cluster } from '@/types';
import { PhotoCard } from './PhotoCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Pencil, Check, Plus, ArrowLeft, ArrowRight, Trash2, MoveDown, BringToFront } from 'lucide-react';

interface PlaceColumnProps {
  cluster: Cluster;
  onCreate: (order_index: number, photoIds: string[]) => void;
  onAddPhotosToExistingCluster: (clusterId: string, photoIds: string[]) => void;
  onRename: (clusterId: string, newName: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  onDeleteCluster: (clusterId: string) => void;
  onMoveCluster: (clusterId: string, direction: 'up' | 'down') => void;
  selectedPhotoIds: string[];
  onSelectPhoto: (photoId: string) => void;
  isCompact?: boolean; // Kept for compatibility, though column might ignore it or use it for card size
}

export function PlaceColumn({ 
  cluster, 
  onCreate, 
  onAddPhotosToExistingCluster, 
  onRename, 
  onDeletePhoto, 
  onDeleteCluster, 
  onMoveCluster, 
  selectedPhotoIds, 
  onSelectPhoto,
  isCompact = false
}: PlaceColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(cluster.name || `Place ${cluster.order_index + 1}`);
  const prevPhotoCount = useRef(cluster.photos.length);

  useEffect(() => {
    setName(cluster.name || `Place ${cluster.order_index + 1}`);
  }, [cluster.name, cluster.order_index]);

  useEffect(() => {
    if (prevPhotoCount.current > 0 && cluster.photos.length === 0) {
      if (cluster.name !== 'reserve') {
        onDeleteCluster(cluster.id);
      }
    }
    prevPhotoCount.current = cluster.photos.length;
  }, [cluster.photos.length, cluster.id, cluster.name, onDeleteCluster]);

  const handleSave = () => {
    if (name.trim() && name.trim() !== cluster.name) {
      onRename(cluster.id, name.trim());
    }
    setIsEditing(false);
  };

  const handleCreateEmpty = async () => {
    const orderIndex = cluster.order_index + 1;
    onCreate(orderIndex, []); 
  };

  return (
    <div className="flex flex-col h-full min-w-[460px] w-[460px] bg-gray-100/50 rounded-lg border border-gray-200 shadow-sm">
      <div className="p-2 border-b bg-white rounded-t-lg flex flex-col gap-2 sticky top-0 z-10">
        <div className="flex items-center justify-between gap-2">
          {isEditing ? (
            <div className="flex items-center gap-1 w-full">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-8 text-lg font-semibold"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
              />
              <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50" onClick={handleSave}>
                <Check className="w-5 h-5" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 overflow-hidden flex-1 group cursor-pointer" onClick={() => setIsEditing(true)}>
              <h3 className="font-bold text-lg text-gray-800 truncate" title={name}>
                {name}
              </h3>
              <span className="text-sm text-gray-400 font-normal flex-shrink-0">({cluster.photos.length})</span>
              <Pencil className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 bg-gray-100 rounded-md p-0.5">
            <Button 
              variant="ghost" size="icon" 
              className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => onMoveCluster(cluster.id, 'up')} // 'up' maps to Left in horizontal column layout
              title="왼쪽으로 이동"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Button 
              variant="ghost" size="icon" 
              className="h-7 w-7 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
              onClick={() => onMoveCluster(cluster.id, 'down')} // 'down' maps to Right in horizontal column layout
              title="오른쪽으로 이동"
            >
              <ArrowRight className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-gray-300 mx-1"></div>
            <Button 
              variant="ghost" size="icon" 
              className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
              onClick={() => onDeleteCluster(cluster.id)}
              title="장소 삭제"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {selectedPhotoIds.length > 0 ? (
            <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
              <DropdownMenuTrigger asChild>
                <div 
                  onMouseEnter={() => setIsOpen(true)} 
                  onMouseLeave={() => setIsOpen(false)}
                  className="inline-block"
                >
                   <Button 
                    size="sm" 
                    variant="outline" 
                    className="h-7 px-2 border-green-600 bg-green-600 text-white hover:bg-green-700 text-xs"
                    onClick={() => onAddPhotosToExistingCluster(cluster.id, selectedPhotoIds)}
                  >
                    <Plus className="w-3 h-3 mr-1" /> 
                    추가 ({selectedPhotoIds.length})
                  </Button>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                onMouseEnter={() => setIsOpen(true)} 
                onMouseLeave={() => setIsOpen(false)}
              >
                <DropdownMenuItem 
                  onClick={() => onAddPhotosToExistingCluster(cluster.id, selectedPhotoIds)}
                >
                  <BringToFront className="mr-2 h-4 w-4" />
                  <span>선택 사진 여기 추가</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onCreate(cluster.order_index + 1, selectedPhotoIds)}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  <span>선택 사진 옆에 추가</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onCreate(cluster.order_index + 1, [])}>
                  <Plus className="mr-2 h-4 w-4" />
                  <span>빈 장소 추가</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
             <Button 
              size="sm" 
              variant="outline" 
              className="h-7 px-2 border-green-600 text-green-600 hover:bg-green-100 text-xs"
              onClick={handleCreateEmpty}
            >
              <Plus className="w-3 h-3 mr-1" /> 
              추가
            </Button>
          )}
        </div>
      </div>

      <Droppable droppableId={cluster.id.toString()}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-2 overflow-y-auto min-h-[150px] transition-colors scrollbar-thin scrollbar-thumb-gray-300
              ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}
            `}
          >
            <div className="flex flex-col gap-2">
              {cluster.photos.map((photo, index) => (
                <PhotoCard 
                  key={photo.id} 
                  photo={photo} 
                  index={index} 
                  onDelete={onDeletePhoto ? () => onDeletePhoto(photo.id.toString()) : undefined}
                  onSelect={() => onSelectPhoto(photo.id.toString())}
                  isSelected={selectedPhotoIds.includes(photo.id.toString())}
                  isCompact={isCompact} 
                />
              ))}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}