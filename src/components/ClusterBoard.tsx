import { DragDropContext, DropResult, Droppable } from '@hello-pangea/dnd';
import { Cluster } from '@/types';
import { PlaceRow } from './PlaceRow';
import { PhotoCard } from './PhotoCard';
import { Archive } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface ClusterBoardProps {
  clusters: Cluster[];
  onMovePhoto: (photoId: string, sourceClusterId: string, targetClusterId: string) => void;
  onCreateCluster: (order_index: number, photoIds: string[]) => void; // Updated signature
  onRenameCluster: (clusterId: string, newName: string) => void;
  onDeletePhoto: (photoId: string, clusterId: string) => void;
  onDeleteCluster: (clusterId: string) => void;
  onMoveCluster: (clusterId: string, direction: 'up' | 'down') => void;
  selectedPhotoIds: string[];
  onSelectPhoto: (photoId: string) => void;
}

export function ClusterBoard({ clusters, onMovePhoto,  onCreateCluster, onRenameCluster, onDeletePhoto, onDeleteCluster, onMoveCluster, selectedPhotoIds, onSelectPhoto }: ClusterBoardProps) {
  const isMobile = useIsMobile();
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
      <div className="flex flex-col md:flex-row gap-4 md:gap-8 h-full">
        {/* Right Sidebar (Mobile: Top): Reserve Area */}
        <div className="w-full md:w-80 flex-shrink-0 flex flex-col bg-gray-200 rounded-xl md:rounded-2xl border-2 border-gray-300 overflow-hidden order-1 md:order-2 max-h-[200px] md:max-h-none">
          <div className="p-3 md:p-4 bg-gray-300 border-b border-gray-400 flex items-center gap-2 sticky top-0 z-10">
            <Archive className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
            <h3 className="text-lg md:text-xl font-bold text-gray-800">임시 보관</h3>
            <span className="ml-auto bg-gray-600 text-white px-2 py-0.5 rounded-full text-xs md:text-sm">
              {reserveCluster?.photos.length || 0}
            </span>
          </div>
          
          <Droppable droppableId={reserveCluster?.id.toString() || 'reserve'} direction={isMobile ? "horizontal" : "vertical"}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`
                  flex-1 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto p-2 md:p-4 
                  flex md:flex-col gap-2 md:gap-4 transition-colors scrollbar-hide
                  ${snapshot.isDraggingOver ? 'bg-blue-100/50' : ''}
                `}
              >
                {reserveCluster?.photos.length === 0 && (
                  <div className="text-center text-gray-500 mt-4 md:mt-10 px-2 w-full">
                    <p className="text-sm md:text-base">Drag extra photos here.</p>
                  </div>
                )}
                {reserveCluster?.photos.map((photo, index) => (
                  <div key={photo.id} className="min-w-[100px] md:min-w-0">
                    <PhotoCard 
                      photo={photo} 
                      index={index} 
                      onDelete={(pid) => onDeletePhoto(pid.toString(), reserveCluster.id)}
                      isReserve={true}
                      onSelect={() => onSelectPhoto(photo.id.toString())}
                      isSelected={selectedPhotoIds.includes(photo.id.toString())}
                    />
                  </div>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Left Area (Mobile: Bottom): Places List */}
        <div className="flex-1 overflow-y-auto pr-1 md:pr-2 pb-2 space-y-4 md:space-y-8 order-2 md:order-1">
          {placeClusters.map((cluster) => (
            <PlaceRow
              key={cluster.id}
              cluster={cluster}
              onCreate={onCreateCluster}
              onRename={onRenameCluster}
              onDeletePhoto={(pid) => onDeletePhoto(pid, cluster.id)}
              onDeleteCluster={onDeleteCluster}
              onMoveCluster={onMoveCluster}
              selectedPhotoIds={selectedPhotoIds}
              onSelectPhoto={onSelectPhoto}
            />
          ))}
        </div>
      </div>
    </DragDropContext>
  );
}