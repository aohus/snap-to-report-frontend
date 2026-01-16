import { useState } from 'react';
import { DragDropContext, DropResult, Droppable } from '@hello-pangea/dnd';
import { Cluster } from '@/types';
import { PlaceRow } from './PlaceRow';
import { PlaceColumn } from './PlaceColumn';
import { PhotoCard } from './PhotoCard';
import { Archive, Minimize2, Maximize2, ChevronsDown, ChevronsUp, LayoutList, Rows, Eye, EyeOff, Columns, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';

interface ClusterBoardProps {
  clusters: Cluster[];
  onMovePhoto: (photoId: string, sourceClusterId: string, targetClusterId: string, targetIndex?: number) => void;
  onCreateCluster: (order_index: number, photos: { id: string, clusterId: string }[]) => void;
  onAddPhotosToExistingCluster: (clusterId: string, photos: { id: string, clusterId: string }[]) => void;
  onRenameCluster: (clusterId: string, newName: string) => void;
  onDeletePhoto: (photoId: string, clusterId: string) => void;
  onDeleteCluster: (clusterId: string) => void;
  onMoveCluster: (clusterId: string, direction: 'up' | 'down') => void;
  selectedPhotos: { id: string, clusterId: string }[];
  onSelectPhoto: (photoId: string, clusterId: string) => void;
  onEditLabels: (photoId: string) => void;
}

export function ClusterBoard({ clusters, onMovePhoto,  onCreateCluster, onAddPhotosToExistingCluster, onRenameCluster, onDeletePhoto, onDeleteCluster, onMoveCluster, selectedPhotos, onSelectPhoto, onEditLabels }: ClusterBoardProps) {
  const isMobile = useIsMobile();
  const [isCompact, setIsCompact] = useState(false);
  const [isVerticalMode, setIsVerticalMode] = useState(false); // false = Horizontal Mode (Reserve Top), true = Vertical Mode (Reserve Left)
  const [collapsedClusterIds, setCollapsedClusterIds] = useState<Set<string>>(new Set());
  const [hideCompleted, setHideCompleted] = useState(false);
  const [isReserveCollapsed, setIsReserveCollapsed] = useState(false);
  
  const selectedPhotoIds = selectedPhotos.map(p => p.id);

  const handleDragEnd = (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const photoId = draggableId;
    const sourceClusterId = source.droppableId;
    const targetClusterId = destination.droppableId;
    const targetIndex = destination.index;

    onMovePhoto(photoId, sourceClusterId, targetClusterId, targetIndex);
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
      <div className="flex flex-col md:flex-row h-full gap-4 md:gap-8">
        {/* Reserve Area */}
        {/* Always Left Column on Desktop. Top Row on Mobile. */}
        <div 
          className={`
            flex-shrink-0 flex flex-col bg-gray-200 rounded-xl md:rounded-2xl border-2 border-gray-300 overflow-hidden 
            w-full transition-all duration-300 ease-in-out
            ${isReserveCollapsed 
              ? 'md:w-[60px] max-h-[50px] md:max-h-none' 
              : ((reserveCluster?.photos.length || 0) === 0 ? 'md:w-[360px]' : 'md:w-[460px]') + ' h-auto md:h-full max-h-[220px] md:max-h-none'
            }
          `}
        >
          <div className="p-2 md:p-3 bg-gray-300 border-b border-gray-400 flex items-center justify-center md:justify-start gap-2 sticky top-0 z-10 h-[50px]">
             {/* Mobile Toggle Button (Left) */}
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-6 w-6 md:hidden absolute right-2"
               onClick={() => setIsReserveCollapsed(!isReserveCollapsed)}
             >
                {isReserveCollapsed ? <ChevronsDown className="w-4 h-4" /> : <ChevronsUp className="w-4 h-4" />}
             </Button>

            {!isReserveCollapsed && <Archive className="w-4 h-4 md:w-5 md:h-5 text-gray-700 flex-shrink-0" />}
            
            {!isReserveCollapsed && (
              <div className={`
                flex items-center gap-2 overflow-hidden transition-all duration-300
                ${(reserveCluster?.photos.length || 0) === 0 ? 'w-0 opacity-0 md:hidden' : 'w-auto opacity-100'}
              `}>
                <h3 className="text-base md:text-lg font-bold text-gray-800 whitespace-nowrap">임시 보관</h3>
                <span className="ml-auto bg-gray-600 text-white px-2 py-0.5 rounded-full text-xs md:text-sm">
                  {reserveCluster?.photos.length || 0}
                </span>
              </div>
            )}
            
            {/* Show count badge in collapsed mode */}
             {((reserveCluster?.photos.length || 0) === 0 || isReserveCollapsed) && (
                <span className={`hidden md:flex bg-gray-600 text-white w-5 h-5 items-center justify-center rounded-full text-xs ${isReserveCollapsed ? 'mx-auto' : ''}`}>
                  {reserveCluster?.photos.length || 0}
                </span>
             )}

            {/* Desktop Toggle Button */}
            <Button 
               variant="ghost" 
               size="icon" 
               className="h-6 w-6 hidden md:flex ml-auto"
               onClick={() => setIsReserveCollapsed(!isReserveCollapsed)}
            >
               {isReserveCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </Button>
          </div>
          
          <Droppable droppableId={reserveCluster?.id.toString() || 'reserve'} direction={isMobile ? "horizontal" : "vertical"}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={`
                  flex-1 p-2 md:p-4 transition-colors scrollbar-thin scrollbar-thumb-gray-300
                  ${isMobile
                    ? 'overflow-x-auto overflow-y-hidden flex flex-row gap-4 items-start content-start'
                    : 'overflow-y-auto overflow-x-hidden flex flex-col gap-4'
                  }
                  ${snapshot.isDraggingOver ? 'bg-blue-100/50' : ''}
                  ${(reserveCluster?.photos.length || 0) === 0 ? 'items-center' : ''}
                  ${isReserveCollapsed ? 'hidden' : ''}
                `}
              >
                {reserveCluster?.photos.length === 0 && (
                  <div className="text-center text-gray-500 m-auto px-2 w-full flex flex-col items-center">
                    <p className={`text-sm md:text-base transition-opacity duration-200 ${(reserveCluster?.photos.length || 0) === 0 ? 'hidden md:block md:opacity-0 md:group-hover:opacity-100' : ''}`}>
                      Drag extra photos here.
                    </p>
                  </div>
                )}
                {reserveCluster?.photos.map((photo, index) => (
                  <div key={photo.id} className="flex-shrink-0">
                    <PhotoCard 
                      photo={photo} 
                      index={index} 
                      onDelete={(pid) => onDeletePhoto(pid.toString(), reserveCluster.id)}
                      isReserve={true}
                      onSelect={() => onSelectPhoto(photo.id.toString(), reserveCluster.id)}
                      isSelected={selectedPhotoIds.includes(photo.id.toString())}
                      isCompact={isCompact}
                      onEditLabels={onEditLabels}
                    />
                  </div>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>

        {/* Main Places Area */}
        <div className="flex-1 flex flex-col overflow-hidden order-2">
          {/* Controls Toolbar */}
          <div className="flex-shrink-0 flex flex-wrap items-center justify-end gap-2 mb-4 p-2 bg-white rounded-xl border border-gray-200 shadow-sm sticky top-0 z-20 backdrop-blur-sm bg-white/90">
            
            {/* Layout Mode Group */}
            <div className="flex items-center gap-1 bg-gray-100/80 p-1 rounded-lg border border-gray-200">
                <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVerticalMode(false)}
                className={`h-7 px-3 text-xs rounded-md transition-all ${!isVerticalMode ? 'bg-white shadow-sm text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                title="위아래로 스크롤 (가로형)"
                >
                    <LayoutList className="w-3.5 h-3.5 mr-1.5" />
                    <span className="hidden xl:inline">가로형</span>
                </Button>
                <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVerticalMode(true)}
                className={`h-7 px-3 text-xs rounded-md transition-all ${isVerticalMode ? 'bg-white shadow-sm text-blue-700 font-semibold' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'}`}
                title="좌우로 스크롤 (세로형)"
                >
                    <Columns className="w-3.5 h-3.5 mr-1.5" />
                    <span className="hidden xl:inline">세로형</span>
                </Button>
            </div>

            <div className="w-px h-5 bg-gray-200 mx-1"></div>

             {/* View Options */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCompact(!isCompact)}
              className={`h-8 text-xs border transition-all ${isCompact ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-white border-transparent hover:bg-gray-100 text-gray-600'}`}
            >
              {isCompact ? <Maximize2 className="w-3.5 h-3.5 mr-1.5" /> : <Minimize2 className="w-3.5 h-3.5 mr-1.5" />}
              <span className="hidden md:inline">{isCompact ? "크게 보기" : "작게 보기"}</span>
            </Button>

            <div className="w-px h-5 bg-gray-200 mx-1"></div>

            {/* Filter Options */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHideCompleted(!hideCompleted)}
              className={`h-8 text-xs border transition-all ${hideCompleted ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-white border-transparent hover:bg-gray-100 text-gray-600'}`}
            >
              {hideCompleted ? <EyeOff className="w-3.5 h-3.5 mr-1.5" /> : <Eye className="w-3.5 h-3.5 mr-1.5" />}
              <span className="hidden md:inline">완료 숨김</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={toggleCollapseCompleted}
              className={`h-8 text-xs border transition-all ${areAllCompletedCollapsed ? 'bg-gray-100 text-gray-900 border-gray-200' : 'bg-white border-transparent hover:bg-gray-100 text-gray-600'}`}
            >
              {areAllCompletedCollapsed ? <ChevronsDown className="w-3.5 h-3.5 mr-1.5" /> : <ChevronsUp className="w-3.5 h-3.5 mr-1.5" />}
              <span className="hidden md:inline">{areAllCompletedCollapsed ? "완료 펼치기" : "완료 접기"}</span>
            </Button>
          </div>

          {/* Clusters List */}
          <div className={`
            flex-1 
            ${isVerticalMode 
              ? 'overflow-x-auto overflow-y-hidden' 
              : 'overflow-y-auto overflow-x-hidden'
            }
          `}>
            <div className={`
              ${isVerticalMode 
                ? 'flex flex-row gap-4 h-full items-start pb-4' 
                : (isCompact ? "grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-4 items-start" : "space-y-4 md:space-y-8")
              }
            `}>
              {displayedClusters.map((cluster) => (
                isVerticalMode ? (
                  <PlaceColumn 
                    key={cluster.id}
                    cluster={cluster}
                    onCreate={(order_index, photos) => onCreateCluster(order_index, photos)}
                    onAddPhotosToExistingCluster={(clusterId, photos) => onAddPhotosToExistingCluster(clusterId, photos)}
                    onRename={onRenameCluster}
                    onDeletePhoto={(pid) => onDeletePhoto(pid, cluster.id)}
                    onDeleteCluster={onDeleteCluster}
                    onMoveCluster={onMoveCluster}
                    selectedPhotos={selectedPhotos}
                    onSelectPhoto={onSelectPhoto}
                    isCompact={isCompact}
                    onEditLabels={onEditLabels}
                  />
                ) : (
                  <PlaceRow
                    key={cluster.id}
                    cluster={cluster}
                    onCreate={(order_index, photos) => onCreateCluster(order_index, photos)}
                    onAddPhotosToExistingCluster={(clusterId, photos) => onAddPhotosToExistingCluster(clusterId, photos)}
                    onRename={onRenameCluster}
                    onDeletePhoto={(pid) => onDeletePhoto(pid, cluster.id)}
                    onDeleteCluster={onDeleteCluster}
                    onMoveCluster={onMoveCluster}
                    selectedPhotos={selectedPhotos}
                    onSelectPhoto={onSelectPhoto}
                    isCompact={isCompact}
                    isCollapsed={collapsedClusterIds.has(cluster.id)}
                    onToggleCollapse={() => toggleClusterCollapse(cluster.id)}
                    onEditLabels={onEditLabels}
                  />
                )
              ))}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}