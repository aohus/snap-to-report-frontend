import { useState, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Cluster, Photo } from '@/types';
import { PhotoCard, PhotoCardInner } from './PhotoCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Pencil, Check, AlertCircle, Plus, CheckCircle2, ArrowUp, ArrowDown, Trash2, Image as ImageIcon, MoveDown, BringToFront } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlaceRowProps {
  cluster: Cluster;
  onCreate: (order_index: number, photos: { id: string, clusterId: string }[]) => void;
  onAddPhotosToExistingCluster: (clusterId: string, photos: { id: string, clusterId: string }[]) => void;
  onRename: (clusterId: string, newName: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  onDeleteCluster: (clusterId: string) => void;
  onMoveCluster: (clusterId: string, direction: 'up' | 'down') => void;
  selectedPhotos: { id: string, clusterId: string }[];
  onSelectPhoto: (photoId: string, clusterId: string, e?: React.MouseEvent) => void;
  onPreviewPhoto?: (photo: Photo) => void;
  isCompact?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onEditLabels: (photoId: string) => void;
  isDragging?: boolean;
}


export function PlaceRow({ 
  cluster, 
  onCreate, 
  onAddPhotosToExistingCluster, 
  onRename, 
  onDeletePhoto, 
  onDeleteCluster, 
  onMoveCluster, 
  selectedPhotos, 
  onSelectPhoto,
  onPreviewPhoto,
  isCompact = false,
  isCollapsed = false,
  onToggleCollapse,
  onEditLabels,
  isDragging = false
}: PlaceRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState(cluster.name || `Place ${cluster.order_index + 1}`);

  const selectedPhotoIds = selectedPhotos.map(p => p.id);

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

  const handleCreateEmpty = async () => {
    const orderIndex = cluster.order_index + 1; // Insert Below
    onCreate(orderIndex, []); 
  };

  const photoCount = cluster.photos.length;
  const isComplete = photoCount === 3;
  const isOverLimit = photoCount > 3;

  return (
    <div className={`
      flex flex-col bg-white rounded-md border border-slate-200 shadow-subtle transition-all group
      ${isComplete ? 'border-emerald-200 bg-emerald-50/10' : ''}
      ${isCompact ? 'text-sm' : ''}
    `}>
      {/* Header Section */}
      <div className={`
        border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/30 rounded-t-md
        ${isCompact ? 'px-3 py-1.5' : 'px-3 md:px-4 py-2 md:py-2.5'}
      `}>
        <div className="flex-1 space-y-1 w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <div className="flex-1 w-full flex items-center justify-between md:justify-start gap-2">
              {onToggleCollapse && (
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 -ml-1 text-slate-400 hover:text-slate-900 rounded-md transition-all" 
                  onClick={onToggleCollapse}
                >
                  {isCollapsed ? <ArrowDown className="w-3.5 h-3.5" /> : <ArrowUp className="w-3.5 h-3.5" />}
                </Button>
              )}
              {isEditing ? (
                <div className="flex items-center gap-2 w-full max-w-xl">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`font-bold bg-white shadow-subtle focus-visible:ring-primary/10 ${isCompact ? 'h-8 text-sm' : 'h-8 md:h-9 text-sm md:text-base'}`}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                  <Button size="sm" onClick={handleSave} className={`bg-emerald-600 hover:bg-emerald-700 h-8 md:h-9 px-3 rounded-md shadow-subtle`}>
                    <Check className={`mr-1.5 w-4 h-4`} /> <span className="hidden md:inline font-bold">저장</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 md:gap-3 group/title cursor-pointer flex-1 overflow-hidden" onClick={() => setIsEditing(true)}>
                  <h3 className={`font-bold text-slate-800 group-hover/title:text-primary transition-colors truncate mb-0 ${isCompact ? 'text-sm' : 'text-sm md:text-base'}`}>
                    {name}
                  </h3>
                  <Button variant="ghost" size="icon" className={`flex-shrink-0 rounded-md bg-slate-100/50 hover:bg-primary/5 text-slate-400 hover:text-primary opacity-0 group-hover/title:opacity-100 transition-all ${isCompact ? 'h-6 w-6' : 'h-7 w-7'}`}>
                    <Pencil className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto mt-1 md:mt-0">
              {/* Action Buttons: Move & Delete */}
              <div className="flex items-center gap-0.5 bg-slate-100/50 rounded-md p-0.5 opacity-100 md:opacity-40 md:group-hover:opacity-100 transition-all">
                <Button 
                  variant="ghost" size="icon" 
                  className={`text-slate-500 hover:text-primary hover:bg-white rounded-md ${isCompact ? 'h-6 w-6' : 'h-7 w-7'}`}
                  onClick={() => onMoveCluster(cluster.id, 'up')}
                  title="위로 이동"
                >
                  <ArrowUp className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className={`text-slate-500 hover:text-primary hover:bg-white rounded-md ${isCompact ? 'h-6 w-6' : 'h-7 w-7'}`}
                  onClick={() => onMoveCluster(cluster.id, 'down')}
                  title="아래로 이동"
                >
                  <ArrowDown className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                </Button>
                <div className="w-px h-3 bg-slate-200 mx-1"></div>
                <Button
                  variant="ghost" size="icon"
                  className={`text-slate-400 hover:text-rose-600 hover:bg-white rounded-md ${isCompact ? 'h-6 w-6' : 'h-7 w-7'}`}
                  onClick={() => onDeleteCluster(cluster.id)}
                  title="장소 삭제"
                >
                  <Trash2 className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                </Button>
              </div>
                
              {/* Add Button */}
              <div className={cn(
                "transition-all duration-200",
                selectedPhotoIds.length > 0 ? "opacity-100" : "opacity-100 md:opacity-0 md:group-hover:opacity-100"
              )}>
            
                            {selectedPhotoIds.length > 0 ? (
            
                              <DropdownMenu open={isOpen} onOpenChange={setIsOpen} >
            
                                <DropdownMenuTrigger asChild>
            
                                  <div
            
                                    onMouseEnter={() => setIsOpen(true)}
            
                                    onMouseLeave={() => setIsOpen(false)}
            
                                    className="inline-block"
            
                                  >
            
                                    <Button
            
                                      size="sm"
            
                                      variant="default"
            
                                      className={`bg-primary text-white shadow-subtle rounded-md ml-auto md:ml-0 font-bold tracking-tight ${isCompact ? 'h-7 px-2.5 text-[11px]' : 'h-7 md:h-8 px-2.5 md:px-3 text-[11px] md:text-xs'}`}
            
                                      onClick={() => onAddPhotosToExistingCluster(cluster.id, selectedPhotos)}
            
                                    >
            
                                      <Plus className={isCompact ? "w-3 h-3 mr-1" : "w-3.5 h-3.5 mr-1 stroke-[3]"} />
            
                                      <span className="whitespace-nowrap">이 장소에 추가 ({selectedPhotoIds.length})</span>
            
                                    </Button>
            
                                  </div>
            
                                </DropdownMenuTrigger>
            
                                <DropdownMenuContent
            
                                  align="end"
                                  className="rounded-md shadow-elevated border-slate-100 p-1 min-w-[180px]"
                                  onMouseEnter={() => setIsOpen(true)}
            
                                  onMouseLeave={() => setIsOpen(false)}
            
                                >
            
                                  <DropdownMenuItem
                                    className="font-bold rounded-md cursor-pointer py-1.5 text-xs"
                                    onClick={() => onAddPhotosToExistingCluster(cluster.id, selectedPhotos)}
            
                                  >
            
                                    <BringToFront className="mr-2 h-3.5 w-3.5 opacity-60" />
            
                                    <span>현재 위치에 추가</span>
            
                                  </DropdownMenuItem>
            
                                  <DropdownMenuItem
                                    className="font-bold rounded-md cursor-pointer py-1.5 text-xs"
                                    onClick={() => onCreate(cluster.order_index + 1, selectedPhotos)}
            
                                  >
            
                                    <MoveDown className="mr-2 h-3.5 w-3.5 opacity-60" />
            
                                    <span>아래에 새 장소로 추가</span>
            
                                  </DropdownMenuItem>
            
                                  <DropdownMenuSeparator className="bg-slate-100 my-1" />

                                  <DropdownMenuItem 
                                    className="font-bold rounded-md cursor-pointer py-1.5 text-xs text-slate-500"
                                    onClick={() => onCreate(cluster.order_index + 1, [])}
                                  >
            
                                    <Plus className="mr-2 h-3.5 w-3.5 opacity-60" />
            
                                    <span>빈 장소 추가</span>
            
                                  </DropdownMenuItem>
            
                                </DropdownMenuContent>
            
                              </DropdownMenu>
            
                            ) : (
            
                              <Button
            
                                size="sm"
            
                                variant="outline"
            
                                className={`border-slate-200 text-slate-500 hover:bg-slate-50 hover:text-slate-900 rounded-md ml-auto md:ml-0 font-bold ${isCompact ? 'h-7 px-2.5 text-[11px]' : 'h-7 md:h-8 px-2.5 md:px-3 text-[11px] md:text-xs'}`}
            
                                onClick={handleCreateEmpty}
            
                              >
            
                                <Plus className={isCompact ? "w-3 h-3 mr-1" : "w-3.5 h-3.5 mr-1 stroke-[3]"} />
            
                                <span className="whitespace-nowrap">빈 장소 추가</span>
            
                              </Button>
            
                            )}
            
                          </div>
            
                        </div>
            
            
                          </div>
                        </div>
                      </div>
      {/* Photos Area */}
      {!isCollapsed && (
      <Droppable 
        droppableId={cluster.id.toString()} 
        direction="horizontal"
        renderClone={(provided, snapshot, rubric) => (
            <PhotoCardInner
                photo={cluster.photos[rubric.source.index]}
                index={rubric.source.index}
                provided={provided}
                snapshot={snapshot}
                onDelete={onDeletePhoto ? () => onDeletePhoto(cluster.photos[rubric.source.index].id.toString()) : undefined}
                onSelect={(e) => onSelectPhoto(cluster.photos[rubric.source.index].id.toString(), cluster.id, e)}
                onPreview={() => onPreviewPhoto?.(cluster.photos[rubric.source.index] as any)}
                isSelected={selectedPhotoIds.includes(cluster.photos[rubric.source.index].id.toString())}
                isCompact={isCompact}
                onEditLabels={onEditLabels}
                isDraggingSomewhere={isDragging} 
            />
        )}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              transition-all duration-200 rounded-b-md flex flex-wrap relative
              ${isCompact ? 'p-2 gap-2 min-h-[80px]' : 'p-3 md:p-4 gap-3 md:gap-4 min-h-[140px]'}
              ${snapshot.isDraggingOver ? 'bg-primary/5 ring-1 ring-inset ring-primary/10' : ''}
              ${(isDragging && !snapshot.isDraggingOver) ? 'bg-slate-50/50' : ''}
            `}
          >
            {/* Drag Overlay Indicator */}
            {isDragging && (
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 z-10",
                    snapshot.isDraggingOver ? "opacity-0" : "opacity-100"
                )}>
                    <div className="border border-dashed border-slate-200 rounded-md w-[calc(100%-16px)] h-[calc(100%-16px)] flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                        <span className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">여기에 드롭</span>
                    </div>
                </div>
            )}

            {cluster.photos.length === 0 && !isDragging && (
              <div className={`w-full h-full flex flex-col items-center justify-center text-slate-300 border border-dashed border-slate-200 rounded-md ${isCompact ? 'p-4' : 'p-8 md:p-12'}`}>
                <p className={`font-semibold ${isCompact ? 'text-[10px]' : 'text-xs md:text-sm'}`}>사진이 없습니다.</p>
                {!isCompact && <p className="text-[11px] hidden md:block mt-1">여기로 사진을 끌어다 놓으세요.</p>}
              </div>
            )}
            {cluster.photos
              .map((photo, index) => (
                  <PhotoCard 
                    key={photo.id}
                    photo={photo}
                    index={index}
                    onDelete={onDeletePhoto ? () => onDeletePhoto(photo.id.toString()) : undefined}
                    onSelect={(e) => onSelectPhoto(photo.id.toString(), cluster.id, e)}
                    onPreview={() => onPreviewPhoto?.(photo as any)}
                    isSelected={selectedPhotoIds.includes(photo.id.toString())}
                    isCompact={isCompact}
                    onEditLabels={onEditLabels}
                    isDraggingSomewhere={isDragging} // Pass global drag state
                  />
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      )}
    </div>
  );
}
