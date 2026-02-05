import { Drawer, DrawerContent, DrawerFooter, DrawerHeader, DrawerTitle, DrawerDescription, DrawerClose } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, FolderInput, X } from 'lucide-react';
import { Cluster } from '@/types';

interface ActionDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedCount: number;
  clusters: Cluster[];
  onMoveToCluster: (clusterId: string) => void;
  onDelete: () => void;
}

export function ActionDrawer({
  open,
  onOpenChange,
  selectedCount,
  clusters,
  onMoveToCluster,
  onDelete,
}: ActionDrawerProps) {
  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>{selectedCount}개 사진 선택됨</DrawerTitle>
            <DrawerDescription>선택한 사진을 이동하거나 삭제합니다.</DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 flex flex-col gap-4">
            <div className="space-y-2">
                <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <FolderInput className="w-4 h-4" />
                    이동할 장소 선택
                </h4>
                <ScrollArea className="h-[200px] border rounded-md p-2">
                    <div className="flex flex-col gap-1">
                        {clusters.map(cluster => (
                            <Button
                                key={cluster.id}
                                variant="ghost"
                                className="justify-start h-10 px-2 font-normal"
                                onClick={() => onMoveToCluster(cluster.id)}
                            >
                                <span className="truncate">{cluster.name}</span>
                                <span className="ml-auto text-xs text-muted-foreground">{cluster.photos.length}장</span>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            <Button variant="destructive" size="lg" className="w-full gap-2" onClick={onDelete}>
                <Trash2 className="w-5 h-5" />
                선택한 사진 삭제
            </Button>
          </div>

          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">취소</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
