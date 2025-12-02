import { DragDropContext, DropResult, Droppable } from '@hello-pangea/dnd';
import { Cluster } from '@/types';
import { PlaceRow } from './PlaceRow';
import { PhotoCard } from './PhotoCard';
import { Archive } from 'lucide-react';

interface ClusterBoardProps {
  clusters: Cluster[];
  onMovePhoto: (photoId: string, sourceClusterId: string, targetClusterId: string) => void;
  onCreateCluster: (order_index: number) => void;
  onRenameCluster: (clusterId: string, newName: string) => void;
  onDeletePhoto: (photoId: string, clusterId: string) => void;
  selectedPhotoIds: string[];
  onSelectPhoto: (photoId: string) => void;
}

export function ClusterBoard({ clusters, onMovePhoto,  onCreateCluster, onRenameCluster, onDeletePhoto, selectedPhotoIds, onSelectPhoto }: ClusterBoardProps) {
  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const photoId = draggableId;
    const sourceClusterId = source.droppableId;
    const targetClusterId = destination.droppableId;

    onMovePhoto(photoId, sourceClusterId, targetClusterId);
  };

  const reserveCluster = clusters.find(c => c.name === 'reserve');
  const placeClusters = clusters.filter(c => c.id !== reserveCluster?.id).sort((a, b) => a.order_index - b.order_index);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-8 h-[calc(100vh-20px)]">
        {/* Left Area: Places List */}
        <div className="flex-1 overflow-y-auto pr-2 pb-2 space-y-8">
          {placeClusters.map((cluster) => (
            <PlaceRow
              key={cluster.id}
              cluster={cluster}
              onCreate={onCreateCluster}
              onRename={onRenameCluster}
              onDeletePhoto={(pid) => onDeletePhoto(pid, cluster.id)}
              selectedPhotoIds={selectedPhotoIds}
              onSelectPhoto={onSelectPhoto}
            />
          ))}
        </div>

        {/* Right Sidebar: Reserve Area */}
        <div className="w-86 flex-shrink-0 flex flex-col bg-gray-200 rounded-2xl border-2 border-gray-300 overflow-hidden">
          <div className="p-4 bg-gray-300 border-b border-gray-400 flex items-center gap-2">
            <Archive className="w-6 h-6 text-gray-700" />
            <h3 className="text-xl font-bold text-gray-800">임시 보관</h3>
            <span className="ml-auto bg-gray-600 text-white px-2 py-0.5 rounded-full text-sm">
              {reserveCluster?.photos.length || 0}
            </span>
          </div>
          
          <Droppable droppableId={reserveCluster?.id.toString() || 'reserve'}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`
                  flex-1 overflow-y-auto p-4 space-y-4 transition-colors
                  ${snapshot.isDraggingOver ? 'bg-blue-100/50' : ''}
                `}
              >
                {reserveCluster?.photos.length === 0 && (
                  <div className="text-center text-gray-500 mt-10 px-2">
                    <p>Drag extra photos here to save them for later.</p>
                  </div>
                )}
                {reserveCluster?.photos.map((photo, index) => (
                  <PhotoCard 
                    key={photo.id} 
                    photo={photo} 
                    index={index} 
                    onDelete={(pid) => onDeletePhoto(pid.toString(), reserveCluster.id)}
                    isReserve={true}
                    onSelect={() => onSelectPhoto(photo.id.toString())}
                    isSelected={selectedPhotoIds.includes(photo.id.toString())}
                  />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </div>
    </DragDropContext>
  );
}