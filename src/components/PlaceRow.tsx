import { useState, useEffect } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Cluster } from '@/types';
import { PhotoCard } from './PhotoCard';
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
      flex flex-col bg-white rounded-2xl border border-slate-200 shadow-professional transition-all group
      ${isComplete ? 'border-emerald-200 bg-emerald-50/10' : ''}
      ${isCompact ? 'text-sm' : ''}
    `}>
      {/* Header Section */}
      <div className={`
        border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/30 rounded-t-2xl
        ${isCompact ? 'px-3 py-1.5' : 'px-4 py-2'}
      `}>
        <div className="flex-1 space-y-1 w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4">
            <div className="flex-1 w-full flex items-center justify-between md:justify-start gap-2">
              {onToggleCollapse && (
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 -ml-1.5 text-slate-400 hover:text-slate-900 rounded-full transition-all" 
                  onClick={onToggleCollapse}
                >
                  {isCollapsed ? <ArrowDown className="w-4 h-4" /> : <ArrowUp className="w-4 h-4" />}
                </Button>
              )}
              {isEditing ? (
                <div className="flex items-center gap-2 w-full max-w-xl">
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={`font-black bg-white shadow-inner focus-visible:ring-primary/10 ${isCompact ? 'h-8 text-base' : 'h-10 text-lg'}`}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                  <Button size="sm" onClick={handleSave} className={`bg-emerald-600 hover:bg-emerald-700 h-10 px-4 rounded-xl shadow-lg shadow-emerald-100`}>
                    <Check className={`mr-1.5 w-4 h-4`} /> <span className="hidden md:inline font-black">저장</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 md:gap-3 group/title cursor-pointer flex-1 overflow-hidden" onClick={() => setIsEditing(true)}>
                  <h3 className={`font-black text-slate-900 group-hover/title:text-primary transition-colors truncate mb-0 ${isCompact ? 'text-base' : 'text-xl'}`}>
                    {name}
                  </h3>
                  <Button variant="ghost" size="icon" className={`flex-shrink-0 rounded-full bg-slate-100/50 hover:bg-primary/5 text-slate-400 hover:text-primary opacity-0 group-hover/title:opacity-100 transition-all ${isCompact ? 'h-7 w-7' : 'h-8 w-8'}`}>
                    <Pencil className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto mt-1 md:mt-0">
              {/* Action Buttons: Move & Delete */}
              <div className="flex items-center gap-0.5 bg-slate-100/50 rounded-xl p-0.5 opacity-40 group-hover:opacity-100 transition-all">
                <Button 
                  variant="ghost" size="icon" 
                  className={`text-slate-500 hover:text-primary hover:bg-white rounded-lg ${isCompact ? 'h-7 w-7' : 'h-8 w-8'}`}
                  onClick={() => onMoveCluster(cluster.id, 'up')}
                  title="위로 이동"
                >
                  <ArrowUp className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                </Button>
                <Button
                  variant="ghost" size="icon"
                  className={`text-slate-500 hover:text-primary hover:bg-white rounded-lg ${isCompact ? 'h-7 w-7' : 'h-8 w-8'}`}
                  onClick={() => onMoveCluster(cluster.id, 'down')}
                  title="아래로 이동"
                >
                  <ArrowDown className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                </Button>
                <div className="w-px h-3 bg-slate-200 mx-1"></div>
                <Button
                  variant="ghost" size="icon"
                  className={`text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg ${isCompact ? 'h-7 w-7' : 'h-8 w-8'}`}
                  onClick={() => onDeleteCluster(cluster.id)}
                  title="장소 삭제"
                >
                  <Trash2 className={isCompact ? "w-3.5 h-3.5" : "w-4 h-4"} />
                </Button>
              </div>
                
              {/* Add Button: Visible on group hover or when selection exists */}
              <div className={cn(
                "transition-all duration-200",
                selectedPhotoIds.length > 0 ? "opacity-100" : "opacity-0 group-hover:opacity-100"
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
            
                                      className={`bg-primary text-white shadow-lg shadow-primary/20 rounded-xl ml-auto md:ml-0 font-black tracking-tight ${isCompact ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm'}`}
            
                                      onClick={() => onAddPhotosToExistingCluster(cluster.id, selectedPhotos)}
            
                                    >
            
                                      <Plus className={isCompact ? "w-3.5 h-3.5 mr-1" : "w-4 h-4 mr-1.5 stroke-[3]"} />
            
                                      <span className={isCompact ? "" : "hidden lg:inline"}>
            
                                        이 장소에 추가 ({selectedPhotoIds.length})
            
                                      </span>
            
                                      {!isCompact && <span className="lg:hidden">
            
                                        추가 ({selectedPhotoIds.length})
            
                                      </span>}
            
                                    </Button>
            
                                  </div>
            
                                </DropdownMenuTrigger>
            
                                <DropdownMenuContent
            
                                  align="end"
                                  className="rounded-2xl shadow-elevated border-slate-100 p-1.5 min-w-[200px]"
                                  onMouseEnter={() => setIsOpen(true)}
            
                                  onMouseLeave={() => setIsOpen(false)}
            
                                >
            
                                  <DropdownMenuItem
                                    className="font-black rounded-lg cursor-pointer py-2 text-sm"
                                    onClick={() => onAddPhotosToExistingCluster(cluster.id, selectedPhotos)}
            
                                  >
            
                                    <BringToFront className="mr-3 h-4 w-4 opacity-60" />
            
                                    <span>현재 위치에 추가</span>
            
                                  </DropdownMenuItem>
            
                                  <DropdownMenuItem
                                    className="font-black rounded-lg cursor-pointer py-2 text-sm"
                                    onClick={() => onCreate(cluster.order_index + 1, selectedPhotos)}
            
                                  >
            
                                    <MoveDown className="mr-3 h-4 w-4 opacity-60" />
            
                                    <span>아래에 새 장소로 추가</span>
            
                                  </DropdownMenuItem>
            
                                  <DropdownMenuSeparator className="bg-slate-100" />

                                  <DropdownMenuItem 
                                    className="font-black rounded-lg cursor-pointer py-2 text-sm text-slate-500"
                                    onClick={() => onCreate(cluster.order_index + 1, [])}
                                  >
            
                                    <Plus className="mr-3 h-4 w-4 opacity-60" />
            
                                    <span>빈 장소 추가</span>
            
                                  </DropdownMenuItem>
            
                                </DropdownMenuContent>
            
                              </DropdownMenu>
            
                            ) : (
            
                              <Button
            
                                size="sm"
            
                                variant="outline"
            
                                className={`border-2 border-emerald-600/20 text-emerald-600 hover:bg-emerald-50 rounded-xl ml-auto md:ml-0 font-black ${isCompact ? 'h-8 px-3 text-xs' : 'h-10 px-4 text-sm'}`}
            
                                onClick={handleCreateEmpty}
            
                              >
            
                                <Plus className={isCompact ? "w-3.5 h-3.5 mr-1" : "w-4 h-4 mr-1.5 stroke-[3]"} />
            
                                <span className={isCompact ? "" : "hidden md:inline"}>
            
                                  빈 장소 추가
            
                                </span>
            
                                {!isCompact && <span className="md:hidden">
            
                                  추가
            
                                </span>}
            
                              </Button>
            
                            )}
            
                          </div>
            
                        </div>
            
            
                          </div>
                        </div>
                      </div>
      {/* Photos Area */}
      {!isCollapsed && (
      <Droppable droppableId={cluster.id.toString()} direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              transition-all duration-200 rounded-b-2xl flex flex-wrap relative
              ${isCompact ? 'p-2 gap-2 min-h-[80px]' : 'p-3 md:py-6 md:pl-6 gap-3 md:gap-6 min-h-[120px] md:min-h-[160px]'}
              ${snapshot.isDraggingOver ? 'bg-primary/5 ring-2 ring-inset ring-primary/20' : ''}
              ${(isDragging && !snapshot.isDraggingOver) ? 'bg-slate-50/50' : ''}
            `}
          >
            {/* Drag Overlay Indicator */}
            {isDragging && (
                <div className={cn(
                    "absolute inset-0 flex items-center justify-center pointer-events-none transition-opacity duration-200 z-10",
                    snapshot.isDraggingOver ? "opacity-0" : "opacity-100"
                )}>
                    <div className="border-2 border-dashed border-slate-300 rounded-xl w-[calc(100%-24px)] h-[calc(100%-24px)] flex items-center justify-center bg-white/40 backdrop-blur-[1px]">
                        <span className="text-slate-400 font-black text-sm uppercase tracking-widest">Drop Here</span>
                    </div>
                </div>
            )}

            {cluster.photos.length === 0 && !isDragging && (
              <div className={`w-full h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl ${isCompact ? 'p-2' : 'p-4 md:p-8'}`}>
                <p className={`font-medium ${isCompact ? 'text-xs' : 'text-sm md:text-xl'}`}>No photos</p>
                {!isCompact && <p className="text-xs md:text-lg hidden md:block">Drag photos here</p>}
              </div>
            )}
            {cluster.photos
              .map((photo, index) => (
                <div key={photo.id} className="relative">
                  <PhotoCard 
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
                </div>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
      )}
    </div>
  );
}