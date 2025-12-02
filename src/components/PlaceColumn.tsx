import { useState } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Cluster } from '@/types';
import { PhotoCard } from './PhotoCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Pencil, Check } from 'lucide-react';

interface PlaceColumnProps {
  cluster: Cluster;
  onRename: (clusterId: string, newName: string) => void;
}

export function PlaceColumn({ cluster, onRename }: PlaceColumnProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(cluster.name || `Place ${cluster.order_index + 1}`);

  const handleSave = () => {
    if (name.trim() !== cluster.name) {
      onRename(cluster.id, name);
    }
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full min-w-[300px] w-[300px] bg-gray-100/50 rounded-lg border border-gray-200">
      <div className="p-3 border-b bg-white rounded-t-lg flex items-center justify-between gap-2 sticky top-0 z-10">
        {isEditing ? (
          <div className="flex items-center gap-1 w-full">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-xl"
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={handleSave}>
              <Check className="w-4 h-4 text-green-600" />
            </Button>
          </div>
        ) : (
          <>
            <h3 className="font-semibold text-base truncate flex-1" title={name}>
              <span className="ml-2 text-base text-gray-400 font-normal">({cluster.photos.length})</span>
              {name}
            </h3>
            <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setIsEditing(true)}>
              <Pencil className="w-3 h-3 text-gray-400" />
            </Button>
          </>
        )}
      </div>

      <Droppable droppableId={cluster.id.toString()}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 p-2 overflow-y-auto min-h-[150px] transition-colors
              ${snapshot.isDraggingOver ? 'bg-blue-50/50' : ''}
            `}
          >
            <div className="grid grid-cols-2 gap-2">
              {cluster.photos.map((photo, index) => (
                <PhotoCard key={photo.id} photo={photo} index={index} />
              ))}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}