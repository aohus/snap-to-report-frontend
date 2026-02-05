import { useState } from 'react';
import { DragDropContext, DropResult, Droppable } from '@hello-pangea/dnd';
import { Cluster } from '@/types';
import { PlaceRow } from './PlaceRow';
import { PlaceColumn } from './PlaceColumn';
import { PhotoCard } from './PhotoCard';
import { Archive, Minimize2, Maximize2, ChevronsDown, ChevronsUp, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

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
      <div className="flex flex-col md:flex-row h-full gap-4 md:gap-6">
        {/* Reserve Area Sidebar (Sticky) */}
        <div 
          className={`
            flex-shrink-0 flex flex-col bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden 
            w-full md:sticky md:top-0 md:h-[calc(100vh-120px)] transition-all duration-300 ease-in-out
            ${isReserveCollapsed 
              ? 'md:w-[60px] max-h-[50px] md:max-h-none' 
              : ((reserveCluster?.photos.length || 0) === 0 ? 'md:w-[300px]' : 'md:w-[400px]') + ' h-auto md:h-full max-h-[300px] md:max-h-none'
            }
          `}
        >
          <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 z-10 h-[50px]">
             <div className="flex items-center gap-2 overflow-hidden">
                {!isReserveCollapsed && <Archive className="w-4 h-4 text-slate-500 flex-shrink-0" />}
                {!isReserveCollapsed && (
                  <h3 className="text-sm font-black text-slate-700 whitespace-nowrap">임시 보관</h3>
                )}
                <span className={cn(
                    "bg-slate-700 text-white px-2 py-0.5 rounded-md text-[10px] font-black",
                    isReserveCollapsed ? "mx-auto" : ""
                )}>
                  {reserveCluster?.photos.length || 0}
                </span>
             </div>

            {/* Toggle Button */}
            <Button 
               variant="ghost" 
               size="icon" 
               className="h-8 w-8 text-slate-400 hover:text-slate-600"
               onClick={() => setIsReserveCollapsed(!isReserveCollapsed)}
            >
               {isMobile ? (
                   isReserveCollapsed ? <ChevronsDown className="w-4 h-4" /> : <ChevronsUp className="w-4 h-4" />
               ) : (
                   isReserveCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
               )}
            </Button>
          </div>
          
          {!isReserveCollapsed && (
            <Droppable droppableId={reserveCluster?.id.toString() || 'reserve'} direction={isMobile ? "horizontal" : "vertical"}>
                {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`
                    flex-1 p-3 transition-colors custom-scrollbar
                    ${isMobile
                        ? 'overflow-x-auto overflow-y-hidden flex flex-row gap-3 items-start'
                        : 'overflow-y-auto overflow-x-hidden flex flex-col gap-3'
                    }
                    ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}
                    `}
                >
                    {reserveCluster?.photos.length === 0 && (
                    <div className="text-center text-slate-400 m-auto px-4 py-8 border-2 border-dashed border-slate-200 rounded-xl w-full">
                        <p className="text-xs font-bold">잘못 분류된 사진을<br/>여기에 보관하세요.</p>
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
                        isCompact={true}
                        onEditLabels={onEditLabels}
                        />
                    </div>
                    ))}
                    {provided.placeholder}
                </div>
                )}
            </Droppable>
          )}
        </div>

        {/* Main Grid Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Controls Toolbar */}
          <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-6 p-3 bg-white rounded-2xl border border-slate-200 shadow-sm sticky top-0 z-20 backdrop-blur-md bg-white/80">
            <h2 className="text-xl font-black text-slate-900 tracking-tight ml-2">
                분류된 장소 <span className="text-primary ml-1">{displayedClusters.length}</span>
            </h2>

            <div className="flex items-center gap-2">
                <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCompact(!isCompact)}
                className={cn(
                    "h-9 px-3 rounded-xl border border-transparent font-bold transition-all",
                    isCompact ? "bg-primary/10 text-primary border-primary/20" : "text-slate-500 hover:bg-slate-100"
                )}
                >
                {isCompact ? <Maximize2 className="w-4 h-4 mr-2" /> : <Minimize2 className="w-4 h-4 mr-2" />}
                {isCompact ? "크게 보기" : "작게 보기"}
                </Button>

                <div className="w-px h-4 bg-slate-200 mx-1"></div>

                <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideCompleted(!hideCompleted)}
                className={cn(
                    "h-9 px-3 rounded-xl border border-transparent font-bold transition-all",
                    hideCompleted ? "bg-orange-50 text-orange-600 border-orange-100" : "text-slate-500 hover:bg-slate-100"
                )}
                >
                {hideCompleted ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                완료 숨김
                </Button>

                <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapseCompleted}
                className="h-9 px-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50"
                >
                {areAllCompletedCollapsed ? <ChevronsDown className="w-4 h-4 mr-2" /> : <ChevronsUp className="w-4 h-4 mr-2" />}
                완료 {areAllCompletedCollapsed ? "펼치기" : "접기"}
                </Button>
            </div>
          </div>

          {/* Clusters Responsive Grid */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div className={cn(
                "grid gap-6 items-start pb-20",
                isCompact 
                    ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" 
                    : "grid-cols-1 xl:grid-cols-2"
            )}>
              {displayedClusters.map((cluster) => (
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
              ))}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}