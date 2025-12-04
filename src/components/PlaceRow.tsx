import { useState, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Cluster } from '@/types';
import { PhotoCard } from './PhotoCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Check, AlertCircle, Plus, CheckCircle2 } from 'lucide-react';

interface PlaceRowProps {
  cluster: Cluster;
  onCreate: (order_index: number) => void;
  onRename: (clusterId: string, newName: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  selectedPhotoIds: string[];
  onSelectPhoto: (photoId: string) => void;
}


export function PlaceRow({ cluster, onCreate, onRename, onDeletePhoto, selectedPhotoIds, onSelectPhoto }: PlaceRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(cluster.name || `Place ${cluster.order_index + 1}`);

  // Sync name if prop changes
  useEffect(() => {
    setName(cluster.name || `Place ${cluster.order_index + 1}`);
  }, [cluster.name, cluster.order_index]);

  const handleSave = () => {
    if (name.trim() && name.trim() !== cluster.name) {
      onRename(cluster.id, name.trim());
    }
    setIsEditing(false);
  };

  const handleCreate = async () => {
    const orderIndex = cluster.order_index + 1;
    onCreate(orderIndex);
  };

  const photoCount = cluster.photos.length;
  const isComplete = photoCount === 3;
  const isOverLimit = photoCount > 3;

  return (
    <div className={`
      flex flex-col bg-white rounded-xl border-2 shadow-sm transition-all
      ${isComplete ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}
    `}>
      {/* Header Section */}
      <div className="px-3 py-2 md:px-6 md:py-3 border-b flex items-start justify-between gap-4 bg-gray-50/50 rounded-t-lg">
        <div className="flex-1 space-y-1 md:space-y-2 w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <div className="flex-1 w-full flex items-center justify-between md:justify-start gap-2">
              {isEditing ? (
                <div className="flex items-center gap-2 w-full max-w-xl">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-lg md:text-2xl h-9 md:h-10 font-bold bg-white shadow-inner"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                  <Button size="sm" onClick={handleSave} className="h-8 md:h-8 px-3 md:px-6 text-sm md:text-lg bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-4 md:w-4 md:h-6 md:mr-2" /> <span className="hidden md:inline">저장</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 md:gap-3 group cursor-pointer flex-1 overflow-hidden" onClick={() => setIsEditing(true)}>
                  <h3 className="text-lg md:text-2xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors truncate">
                    {name}
                  </h3>
                  <Button variant="ghost" size="icon" className="h-8 w-8 md:h-10 md:w-10 flex-shrink-0 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600">
                    <Pencil className="w-4 h-4 md:w-5 md:h-5" />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto mt-1 md:mt-0">
              <div className={`
                flex items-center gap-1 px-2 py-1 md:px-3 md:py-2 rounded-full font-medium text-xs md:text-sm
                ${isComplete ? 'bg-green-100 text-green-600' : 
                  isOverLimit ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}
              `}>
                {isComplete ? <CheckCircle2 className="w-3 h-3 md:w-5 md:h-5" /> : <AlertCircle className="w-3 h-3 md:w-5 md:h-5" />}
                <span>{photoCount} / 3 <span className="hidden md:inline">Photos</span></span>
              </div>
              <Button 
                size="sm" 
                variant="outline" 
                className="h-8 md:h-10 px-2 md:px-4 text-xs md:text-base border-2 border-green-600 text-green-600 hover:bg-green-100 ml-auto md:ml-0" 
                onClick={handleCreate}
              >
                <Plus className="w-4 h-4 md:w-6 md:h-6 md:mr-2" /> 
                <span className="md:hidden">
                  {selectedPhotoIds.length > 0 ? `추가 (${selectedPhotoIds.length})` : '추가'}
                </span>
                <span className="hidden md:inline">
                  {selectedPhotoIds.length > 0 ? `선택한 사진 (${selectedPhotoIds.length}) 추가` : '장소 추가'}
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Photos Area */}
      <Droppable droppableId={cluster.id.toString()} direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              p-3 md:py-6 md:pl-6 min-h-[80px] md:min-h-[100px] flex flex-wrap gap-3 md:gap-6 transition-colors rounded-b-2xl
              ${snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : ''}
            `}
          >
            {cluster.photos.length === 0 && (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl p-4 md:p-8">
                <p className="text-sm md:text-xl font-medium">No photos here yet</p>
                <p className="text-xs md:text-lg hidden md:block">Drag photos from other places to here</p>
              </div>
            )}
            {[...cluster.photos]
              .sort((a, b) => a.order_index - b.order_index) // 숫자 오름차순 정렬
              .map((photo, index) => (
                <PhotoCard 
                  key={photo.id}
                  photo={photo}
                  index={index}
                  onDelete={onDeletePhoto ? () => onDeletePhoto(photo.id.toString()) : undefined}
                  onSelect={() => onSelectPhoto(photo.id.toString())}
                  isSelected={selectedPhotoIds.includes(photo.id.toString())}
                />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}