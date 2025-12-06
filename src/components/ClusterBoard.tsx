import { useState } from 'react';
import { DragDropContext, DropResult, Droppable } from '@hello-pangea/dnd';
import { Cluster } from '@/types';
import { PlaceRow } from './PlaceRow';
import { PhotoCard } from './PhotoCard';
import { Archive, Minimize2, Maximize2, ChevronsDown, ChevronsUp, LayoutList, Rows, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface ClusterBoardProps {
  clusters: Cluster[];
  onMovePhoto: (photoId: string, sourceClusterId: string, targetClusterId: string) => void;
  onCreateCluster: (order_index: number, photoIds: string[]) => void;
  onAddPhotosToExistingCluster: (clusterId: string, photoIds: string[]) => void; // New prop
  onRenameCluster: (clusterId: string, newName: string) => void;
  onDeletePhoto: (photoId: string, clusterId: string) => void;
  onDeleteCluster: (clusterId: string) => void;
  onMoveCluster: (clusterId: string, direction: 'up' | 'down') => void;
  selectedPhotoIds: string[];
  onSelectPhoto: (photoId: string) => void;
}

export function ClusterBoard({ clusters, onMovePhoto,  onCreateCluster, onAddPhotosToExistingCluster, onRenameCluster, onDeletePhoto, onDeleteCluster, onMoveCluster, selectedPhotoIds, onSelectPhoto }: ClusterBoardProps) {
  const isMobile = useIsMobile();
  const [isCompact, setIsCompact] = useState(false);
  const [collapsedClusterIds, setCollapsedClusterIds] = useState<Set<string>>(new Set());
  const [hideCompleted, setHideCompleted] = useState(false);

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

  const toggleClusterCollapse = (clusterId: string) => {
    setCollapsedClusterIds(prev => {
      const next = new Set(prev);
      if (next.has(clusterId)) {
        next.delete(clusterId);
      } else {
        next.add(clusterId);
      }
      return next;
    });
  };

  const areAllCompletedCollapsed = placeClusters
    .filter(c => c.photos.length >= 3)
    .every(c => collapsedClusterIds.has(c.id));

  const toggleCollapseCompleted = () => {
    const completedClusters = placeClusters.filter(c => c.photos.length >= 3);
    setCollapsedClusterIds(prev => {
      const next = new Set(prev);
      if (areAllCompletedCollapsed) {
        // Expand all completed
        completedClusters.forEach(c => next.delete(c.id));
      } else {
        // Collapse all completed
        completedClusters.forEach(c => next.add(c.id));
      }
      return next;
    });
  };

  const displayedClusters = placeClusters.filter(c => {
    if (hideCompleted && c.photos.length >= 3) return false;
    return true;
  });

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
                  flex md:flex-col md:flex-wrap gap-2 md:gap-4 transition-colors scrollbar-hide content-start
                  ${snapshot.isDraggingOver ? 'bg-blue-100/50' : ''}
                `}
              >
                {reserveCluster?.photos.length === 0 && (
                  <div className="text-center text-gray-500 mt-4 md:mt-10 px-2 w-full">
                    <p className="text-sm md:text-base">Drag extra photos here.</p>
                  </div>
                )}
                {reserveCluster?.photos.map((photo, index) => (
                  <div key={photo.id} className={`flex-shrink-0 ${isCompact ? 'w-[100px] md:w-[120px]' : ''}`}>
                    <PhotoCard 
                      photo={photo} 
                      index={index} 
                      onDelete={(pid) => onDeletePhoto(pid.toString(), reserveCluster.id)}
                      isReserve={true}
                      onSelect={() => onSelectPhoto(photo.id.toString())}
                      isSelected={selectedPhotoIds.includes(photo.id.toString())}
                      isCompact={isCompact}
                    />
                  </div>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Left Area (Mobile: Bottom): Places List */}
        <div className="flex-1 overflow-y-auto pr-1 md:pr-2 pb-2 flex flex-col order-2 md:order-1">
          {/* Controls */}
          <div className="flex items-center justify-end gap-2 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setHideCompleted(!hideCompleted)}
              className="text-xs md:text-sm h-8"
              title={hideCompleted ? "완료된 항목 보이기" : "완료된 항목 감추기"}
            >
              {hideCompleted ? <Eye className="w-4 h-4 md:mr-1" /> : <EyeOff className="w-4 h-4 md:mr-1" />}
              <span className="hidden md:inline">{hideCompleted ? "완료 보이기" : "완료 감추기"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={toggleCollapseCompleted}
              className="text-xs md:text-sm h-8"
              title={areAllCompletedCollapsed ? "완료된 항목 펼치기" : "완료된 항목 접기"}
            >
              {areAllCompletedCollapsed ? <ChevronsDown className="w-4 h-4 md:mr-1" /> : <ChevronsUp className="w-4 h-4 md:mr-1" />}
              <span className="hidden md:inline">{areAllCompletedCollapsed ? "완료 펼치기" : "완료 접기"}</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCompact(!isCompact)}
              className="text-xs md:text-sm h-8"
              title={isCompact ? "크게 보기" : "작게 보기"}
            >
              {isCompact ? <Rows className="w-4 h-4 md:mr-1" /> : <LayoutList className="w-4 h-4 md:mr-1" />}
              <span className="hidden md:inline">{isCompact ? "기본 보기" : "작게 보기"}</span>
            </Button>
          </div>

          <div className={isCompact ? "grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-start" : "space-y-4 md:space-y-8"}>
            {displayedClusters.map((cluster) => (
              <PlaceRow
                key={cluster.id}
                cluster={cluster}
                onCreate={(order_index, photoIds) => onCreateCluster(order_index, photoIds)} // Pass new prop
                onAddPhotosToExistingCluster={(clusterId, photoIds) => onAddPhotosToExistingCluster(clusterId, photoIds)} // Pass new prop
                onRename={onRenameCluster}
                onDeletePhoto={(pid) => onDeletePhoto(pid, cluster.id)}
                onDeleteCluster={onDeleteCluster}
                onMoveCluster={onMoveCluster}
                selectedPhotoIds={selectedPhotoIds}
                onSelectPhoto={onSelectPhoto}
                isCompact={isCompact}
                isCollapsed={collapsedClusterIds.has(cluster.id)}
                onToggleCollapse={() => toggleClusterCollapse(cluster.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}