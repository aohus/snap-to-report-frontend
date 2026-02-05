import { useState, useRef, useMemo } from 'react';
import { DragDropContext, DropResult, Droppable } from '@hello-pangea/dnd';
import { Cluster, Photo } from '@/types';
import { PlaceRow } from './PlaceRow';
import { PhotoCard } from './PhotoCard';
import { Archive, Minimize2, Maximize2, ChevronsDown, ChevronsUp, Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { useVirtualizer } from '@tanstack/react-virtual';

import { calculateNextSelection, SelectedPhoto } from '@/hooks/useMultiSelection';

import { Lightbox } from './dashboard/Lightbox';

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
  onSelectPhoto: (photoId: string, clusterId: string, e?: React.MouseEvent) => void;
  onSetSelectedPhotos?: (photos: ((prev: SelectedPhoto[]) => SelectedPhoto[]) | SelectedPhoto[]) => void; // New prop for bulk updates
  onPreviewPhoto?: (photo: Photo) => void;
  onEditLabels: (photoId: string) => void;
}

export function ClusterBoard({ clusters, onMovePhoto,  onCreateCluster, onAddPhotosToExistingCluster, onRenameCluster, onDeletePhoto, onDeleteCluster, onMoveCluster, selectedPhotos, onSelectPhoto, onSetSelectedPhotos, onPreviewPhoto, onEditLabels }: ClusterBoardProps) {
  const isMobile = useIsMobile();
  const [isCompact, setIsCompact] = useState(false);
  const [collapsedClusterIds, setCollapsedClusterIds] = useState<Set<string>>(new Set());
  const [hideCompleted, setHideCompleted] = useState(false);
  const [isReserveCollapsed, setIsReserveCollapsed] = useState(false);
  const [isDragging, setIsDragging] = useState(false); // Global drag state
  
  const [lastSelected, setLastSelected] = useState<SelectedPhoto | null>(null);
  const [draggingPhotoId, setDraggingPhotoId] = useState<string | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<Photo | null>(null); // New state for Lightbox
  
  const selectedPhotoIds = selectedPhotos.map(p => p.id);

  // Helper to get all currently visible photos in order
  const getVisiblePhotos = () => {
    const reserveCluster = clusters.find(c => c.name === 'reserve');
    const placeClusters = clusters.filter(c => c.id !== reserveCluster?.id).sort((a, b) => a.order_index - b.order_index);
    
    const photos: Photo[] = [];
    if (reserveCluster && !isReserveCollapsed) {
        photos.push(...reserveCluster.photos as any);
    }
    placeClusters.forEach(c => {
        if (!collapsedClusterIds.has(c.id)) {
            photos.push(...c.photos as any);
        }
    });
    return photos;
  };

  const handleNextPhoto = () => {
    const visiblePhotos = getVisiblePhotos();
    const currentIndex = visiblePhotos.findIndex(p => p.id === previewPhoto?.id);
    if (currentIndex !== -1 && currentIndex < visiblePhotos.length - 1) {
        setPreviewPhoto(visiblePhotos[currentIndex + 1]);
    }
  };

  const handlePrevPhoto = () => {
    const visiblePhotos = getVisiblePhotos();
    const currentIndex = visiblePhotos.findIndex(p => p.id === previewPhoto?.id);
    if (currentIndex > 0) {
        setPreviewPhoto(visiblePhotos[currentIndex - 1]);
    }
  };

  const handleDragStart = (start: any) => {
    setIsDragging(true);
    setDraggingPhotoId(start.draggableId);
  };

  const handleDragEnd = (result: DropResult) => {
    setIsDragging(false);
    setDraggingPhotoId(null);
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Handle Multi-drag
    // If the dragged photo is part of the selection, move all selected photos
    if (selectedPhotoIds.includes(draggableId)) {
        // Move all selected photos to the destination cluster
        // We'll perform multiple onMovePhoto calls or batch them if supported
        // For now, let's move them sequentially
        const targetClusterId = destination.droppableId;
        const targetIndex = destination.index;
        
        // Filter out photos already in the target cluster at the same or nearby index to avoid redundant moves
        // But for simplicity, we'll just move all.
        selectedPhotos.forEach((sp, idx) => {
            onMovePhoto(sp.id, sp.clusterId, targetClusterId, targetIndex + idx);
        });
    } else {
        // Normal single drag
        onMovePhoto(draggableId, source.droppableId, destination.droppableId, destination.index);
    }
  };

  const handleSelectPhotoInternal = (photoId: string, clusterId: string, e?: React.MouseEvent) => {
    // Revert to simple additive toggle without needing Shift/Ctrl/Cmd
    if (onSetSelectedPhotos) {
        onSetSelectedPhotos(prev => {
            const exists = prev.some(p => p.id === photoId);
            if (exists) {
                return prev.filter(p => p.id !== photoId);
            }
            return [...prev, { id: photoId, clusterId }];
        });
    } else {
        onSelectPhoto(photoId, clusterId, e);
    }
    setLastSelected({ id: photoId, clusterId });
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

  const parentRef = useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: displayedClusters.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isCompact ? 250 : 350, // Smaller estimate for compact mode
    overscan: 5,
  });

  return (
    <DragDropContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex flex-col md:flex-row h-full gap-4 md:gap-6">
        {/* Reserve Area Sidebar (Sticky) */}
        <div 
          className={`
            flex-shrink-0 flex flex-col bg-white/40 backdrop-blur-xl rounded-3xl border border-slate-200/60 shadow-xl overflow-hidden 
            w-full md:sticky md:top-6 md:h-[calc(100vh-120px)] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
            ${isReserveCollapsed 
              ? 'md:w-[80px] max-h-[60px] md:max-h-none' 
              : ((reserveCluster?.photos.length || 0) === 0 ? 'md:w-[320px]' : 'md:w-[440px]') + ' h-auto md:h-full max-h-[400px] md:max-h-none'
            }
          `}
        >
          <div className="p-4 bg-slate-50/50 border-b border-slate-200/50 flex items-center justify-between gap-2 z-10 h-[64px]">
             <div className="flex items-center gap-3 overflow-hidden ml-1">
                {!isReserveCollapsed && <Archive className="w-5 h-5 text-slate-400 flex-shrink-0" />}
                {!isReserveCollapsed && (
                  <h3 className="text-base font-black text-slate-800 tracking-tight whitespace-nowrap">임시 보관</h3>
                )}
                <span className={cn(
                    "bg-slate-900 text-white px-2.5 py-1 rounded-full text-[11px] font-black shadow-lg shadow-slate-200",
                    isReserveCollapsed ? "mx-auto" : ""
                )}>
                  {reserveCluster?.photos.length || 0}
                </span>
             </div>

            {/* Toggle Button */}
            <Button 
               variant="ghost" 
               size="icon" 
               className="h-10 w-10 text-slate-400 hover:text-slate-900 hover:bg-slate-200/50 rounded-full transition-all"
               onClick={() => setIsReserveCollapsed(!isReserveCollapsed)}
            >
               {isMobile ? (
                   isReserveCollapsed ? <ChevronsDown className="w-5 h-5" /> : <ChevronsUp className="w-5 h-5" />
               ) : (
                   isReserveCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />
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
                    flex-1 p-3 transition-all duration-200 custom-scrollbar relative
                    ${isMobile
                        ? 'overflow-x-auto overflow-y-hidden flex flex-row gap-3 items-start'
                        : 'overflow-y-auto overflow-x-hidden flex flex-col gap-3'
                    }
                    ${snapshot.isDraggingOver ? 'bg-primary/5' : ''}
                    ${(isDragging && !snapshot.isDraggingOver) ? 'bg-slate-100/50' : ''}
                    `}
                >
                    {/* Drag Overlay Indicator */}
                    {isDragging && (
                        <div className={cn(
                            "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 z-10 p-3",
                            snapshot.isDraggingOver ? "opacity-0" : "opacity-100"
                        )}>
                            <div className="border-2 border-dashed border-slate-300 rounded-xl w-full h-full flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                                <span className="text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">
                                    Drop to<br/>Reserve
                                </span>
                            </div>
                        </div>
                    )}

                    {reserveCluster?.photos.length === 0 && !isDragging && (
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
                        onSelect={(e) => handleSelectPhotoInternal(photo.id.toString(), reserveCluster.id, e)}
                        onPreview={() => setPreviewPhoto(photo as any)}
                        isSelected={selectedPhotoIds.includes(photo.id.toString())}
                        isCompact={isCompact} // Use state instead of forcing true
                        onEditLabels={onEditLabels}
                        isDraggingSomewhere={isDragging} // Pass global drag state
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
          <div className="flex-shrink-0 flex items-center justify-between gap-4 mb-8 p-4 bg-white/60 rounded-3xl border border-slate-200/60 shadow-xl shadow-slate-200/50 sticky top-6 z-20 backdrop-blur-xl">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight ml-2">
                분류된 장소 <span className="text-primary/40 ml-1 font-medium">{displayedClusters.length}</span>
            </h2>

            <div className="flex items-center gap-2">
                <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsCompact(!isCompact)}
                className={cn(
                    "h-10 px-4 rounded-2xl border border-transparent font-black transition-all",
                    isCompact ? "bg-primary text-white shadow-lg shadow-primary/30" : "text-slate-500 hover:bg-slate-100"
                )}
                >
                {isCompact ? <Maximize2 className="w-4 h-4 mr-2" /> : <Minimize2 className="w-4 h-4 mr-2" />}
                {isCompact ? "크게 보기" : "작게 보기"}
                </Button>

                <div className="w-px h-5 bg-slate-200 mx-2"></div>

                <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideCompleted(!hideCompleted)}
                className={cn(
                    "h-10 px-4 rounded-2xl border border-transparent font-black transition-all",
                    hideCompleted ? "bg-orange-500 text-white shadow-lg shadow-orange-200" : "text-slate-500 hover:bg-slate-100"
                )}
                >
                {hideCompleted ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                완료 숨김
                </Button>

                <Button
                variant="ghost"
                size="sm"
                onClick={toggleCollapseCompleted}
                className="h-10 px-4 rounded-2xl border border-slate-200 bg-white shadow-sm font-black text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-all active:scale-95"
                >
                {areAllCompletedCollapsed ? <ChevronsDown className="w-4 h-4 mr-2" /> : <ChevronsUp className="w-4 h-4 mr-2" />}
                완료 {areAllCompletedCollapsed ? "펼치기" : "접기"}
                </Button>
            </div>
          </div>

          {/* Clusters Grid (Virtualized) */}
          <div 
            ref={parentRef}
            className="flex-1 overflow-y-auto custom-scrollbar pr-1 relative"
          >
            <div 
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const cluster = displayedClusters[virtualRow.index];
                    return (
                        <div
                            key={virtualRow.key}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                            className="pb-6"
                        >
                            <PlaceRow
                                cluster={cluster}
                                onCreate={(order_index, photos) => onCreateCluster(order_index, photos)}
                                onAddPhotosToExistingCluster={(clusterId, photos) => onAddPhotosToExistingCluster(clusterId, photos)}
                                onRename={onRenameCluster}
                                onDeletePhoto={(pid) => onDeletePhoto(pid, cluster.id)}
                                onDeleteCluster={onDeleteCluster}
                                onMoveCluster={onMoveCluster}
                                selectedPhotos={selectedPhotos}
                                onSelectPhoto={handleSelectPhotoInternal}
                                isCompact={isCompact}
                                isCollapsed={collapsedClusterIds.has(cluster.id)}
                                onToggleCollapse={() => toggleClusterCollapse(cluster.id)}
                                onEditLabels={onEditLabels}
                                onPreviewPhoto={(photo) => setPreviewPhoto(photo as any)}
                                isDragging={isDragging}
                            />
                        </div>
                    );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox Preview */}
      <Lightbox
        photo={previewPhoto}
        onClose={() => setPreviewPhoto(null)}
        onNext={handleNextPhoto}
        onPrev={handlePrevPhoto}
        hasNext={getVisiblePhotos().findIndex(p => p.id === previewPhoto?.id) < getVisiblePhotos().length - 1}
        hasPrev={getVisiblePhotos().findIndex(p => p.id === previewPhoto?.id) > 0}
      />
    </DragDropContext>
  );
}
