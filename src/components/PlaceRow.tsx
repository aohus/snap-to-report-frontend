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
} from "@/components/ui/dropdown-menu";
import { Pencil, Check, AlertCircle, Plus, CheckCircle2, ArrowUp, ArrowDown, Trash2, Image as ImageIcon, MoveDown, BringToFront } from 'lucide-react';

interface PlaceRowProps {
  cluster: Cluster;
  onCreate: (order_index: number, photos: { id: string, clusterId: string }[]) => void;
  onAddPhotosToExistingCluster: (clusterId: string, photos: { id: string, clusterId: string }[]) => void;
  onRename: (clusterId: string, newName: string) => void;
  onDeletePhoto?: (photoId: string) => void;
  onDeleteCluster: (clusterId: string) => void;
  onMoveCluster: (clusterId: string, direction: 'up' | 'down') => void;
  selectedPhotos: { id: string, clusterId: string }[];
  onSelectPhoto: (photoId: string, clusterId: string) => void;
  isCompact?: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onEditLabels: (photoId: string) => void;
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
  isCompact = false,
  isCollapsed = false,
  onToggleCollapse,
  onEditLabels
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
      flex flex-col bg-white rounded-xl border-2 shadow-sm transition-all
      ${isComplete ? 'border-green-200 bg-green-50/30' : 'border-gray-200'}
      ${isCompact ? 'text-sm' : ''}
    `}>
      {/* Header Section */}
      <div className={`
        border-b flex items-start justify-between gap-4 bg-gray-50/50 rounded-t-lg
        ${isCompact ? 'px-2 py-1' : 'px-3 py-2 md:px-4 md:py-2'}
      `}>
        <div className="flex-1 space-y-1 md:space-y-2 w-full">
          <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
            <div className="flex-1 w-full flex items-center justify-between md:justify-start gap-2">
              {onToggleCollapse && (
                 <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6 -ml-1 text-gray-500 mr-1 flex-shrink-0" 
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
                    className={`font-bold bg-white shadow-inner ${isCompact ? 'h-7 text-base' : 'h-8 text-lg'}`}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                  />
                  <Button size="sm" onClick={handleSave} className={`bg-green-600 hover:bg-green-700 ${isCompact ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm'}`}>
                    <Check className={`mr-1 ${isCompact ? 'w-3 h-3' : 'w-4 h-4'}`} /> <span className="hidden md:inline">저장</span>
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 md:gap-3 group cursor-pointer flex-1 overflow-hidden" onClick={() => setIsEditing(true)}>
                  <h3 className={`font-bold text-gray-800 group-hover:text-blue-700 transition-colors truncate ${isCompact ? 'text-base' : 'text-lg'}`}>
                    {name}
                  </h3>
                  <Button variant="ghost" size="icon" className={`flex-shrink-0 rounded-full bg-gray-100 hover:bg-blue-100 text-gray-500 hover:text-blue-600 ${isCompact ? 'h-6 w-6' : 'h-8 w-8'}`}>
                    <Pencil className={isCompact ? "w-3 h-3" : "w-4 h-4"} />
                  </Button>
                </div>
              )}
            </div>
            
            <div className="flex items-center justify-between md:justify-start gap-2 w-full md:w-auto mt-1 md:mt-0">
              {/* Action Buttons: Move & Delete */}
              <div className="flex items-center gap-0.5 md:gap-1 mx-1 md:mx-2 bg-gray-100/50 rounded-lg p-0.5">
                <Button 
                  variant="ghost" size="icon" 
                  className={`text-gray-500 hover:text-blue-600 hover:bg-blue-50 ${isCompact ? 'h-6 w-6' : 'h-7 w-7'}`}
                  onClick={() => onMoveCluster(cluster.id, 'up')}
                  title="위로 이동"
                >
                  <ArrowUp className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                </Button>
                                <Button
                                  variant="ghost" size="icon"
                                  className={`text-gray-500 hover:text-blue-600 hover:bg-blue-50 ${isCompact ? 'h-6 w-6' : 'h-7 w-7'}`}
                                  onClick={() => onMoveCluster(cluster.id, 'down')}
                                  title="아래로 이동"
                                >
                                  <ArrowDown className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                                </Button>
                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                <Button
                                  variant="ghost" size="icon"
                                  className={`text-gray-400 hover:text-red-600 hover:bg-red-50 ${isCompact ? 'h-6 w-6' : 'h-7 w-7'}`}
                                  onClick={() => onDeleteCluster(cluster.id)}
                                  title="장소 삭제"
                                >
                                  <Trash2 className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                                </Button>
                              </div>
                
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
                                        variant="outline"
                                        className={`border-2 border-green-600 bg-green-600 text-white hover:bg-green-700 ml-auto md:ml-0 ${isCompact ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm'}`}
                                        onClick={() => onAddPhotosToExistingCluster(cluster.id, selectedPhotos)}
                                      >
                                        <Plus className={isCompact ? "w-3 h-3 mr-1" : "w-4 h-4 mr-1"} />
                                        <span className={isCompact ? "" : "hidden md:inline"}>
                                          추가 ({selectedPhotoIds.length})
                                        </span>
                                        {!isCompact && <span className="md:hidden">
                                          ({selectedPhotoIds.length})
                                        </span>}
                                      </Button>
                                    </div>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                    align="end"
                                    onMouseEnter={() => setIsOpen(true)}
                                    onMouseLeave={() => setIsOpen(false)}
                                  >
                                    <DropdownMenuItem
                                      onClick={() => onAddPhotosToExistingCluster(cluster.id, selectedPhotos)}
                                    >
                                      <BringToFront className="mr-2 h-4 w-4" />
                                      <span>선택 사진 여기 추가 ({selectedPhotoIds.length})</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => onCreate(cluster.order_index + 1, selectedPhotos)}
                                    >
                                      <MoveDown className="mr-2 h-4 w-4" />
                                      <span>선택 사진 아래 추가 ({selectedPhotoIds.length})</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => onCreate(cluster.order_index + 1, [])}>
                                      <Plus className="mr-2 h-4 w-4" />
                                      <span>빈 장소 추가</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className={`border-2 border-green-600 text-green-600 hover:bg-green-100 ml-auto md:ml-0 ${isCompact ? 'h-7 px-2 text-xs' : 'h-8 px-3 text-sm'}`}
                                  onClick={handleCreateEmpty}
                                >
                                  <Plus className={isCompact ? "w-3 h-3 mr-1" : "w-4 h-4 mr-1"} />
                                  <span className={isCompact ? "" : "hidden md:inline"}>
                                    추가
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
      {/* Photos Area */}
      {!isCollapsed && (
      <Droppable droppableId={cluster.id.toString()} direction="horizontal">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              transition-colors rounded-b-2xl flex flex-wrap
              ${isCompact ? 'p-2 gap-2 min-h-[60px]' : 'p-3 md:py-6 md:pl-6 gap-3 md:gap-6 min-h-[80px] md:min-h-[100px]'}
              ${snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-inset ring-blue-200' : ''}
            `}
          >
            {cluster.photos.length === 0 && (
              <div className={`w-full h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-300 rounded-xl ${isCompact ? 'p-2' : 'p-4 md:p-8'}`}>
                <p className={`font-medium ${isCompact ? 'text-xs' : 'text-sm md:text-xl'}`}>No photos</p>
                {!isCompact && <p className="text-xs md:text-lg hidden md:block">Drag photos here</p>}
              </div>
            )}
            {cluster.photos
              .map((photo, index) => (
                <div key={photo.id}>
                  <PhotoCard 
                    photo={photo}
                    index={index}
                    onDelete={onDeletePhoto ? () => onDeletePhoto(photo.id.toString()) : undefined}
                    onSelect={() => onSelectPhoto(photo.id.toString(), cluster.id)}
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
      )}
    </div>
  );
}