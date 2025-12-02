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
      <div className="px-6 py-3 border-b flex items-start justify-between gap-4 bg-gray-50/50 rounded-t-lg">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              {isEditing ? (
                <div className="flex items-center gap-2 w-full max-w-xl">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="text-2xl h-10 font-bold bg-white shadow-inner"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                  <Button size="base" onClick={handleSave} className="h-8 px-6 text-lg bg-green-600 hover:bg-green-700">
                    <Check className="w-4 h-6 mr-2" /> 저장
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setIsEditing(true)}>
                  <h3 className="text-2xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
                    {name}
                  </h3>
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600">
                    <Pencil className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </div>
            <div className={`
              flex items-center gap-1 px-1.0 py-2.0 rounded-full font-medium
              ${isComplete ? 'bg-green-100 text-green-600' : 
                isOverLimit ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-500'}
            `}>
              {isComplete ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              <span>{photoCount} / 3 Photos</span>
            </div>
            <Button size="base" variant="outline" className="h-10 px-4 text-base border-2 border-green-600 text-green-600 hover:bg-green-100" onClick={handleCreate}>
              <Plus className="w-6 h-6 mr-2" /> 
              {selectedPhotoIds.length > 0 ? `선택한 사진 (${selectedPhotoIds.length}) 추가` : '장소 추가'}
            </Button>
            {/* <Button size="base" variant="outline" className="h-10 px-4 text-base border-2 border-green-600 text-green-600 hover:bg-green-100" onClick={handleCreate}>
              <Plus className="w-6 h-6 mr-2" /> 
              {'장소 추가'}
            </Button> */}
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
              py-6 pl-6 min-h-[100px] flex flex-wrap gap-6 transition-colors rounded-b-2xl
              ${snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : ''}
            `}
          >
            {cluster.photos.length === 0 && (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl p-8">
                <p className="text-xl font-medium">No photos here yet</p>
                <p className="text-lg">Drag photos from other places to here</p>
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