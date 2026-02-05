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
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-lg font-bold">{selectedCount}개 사진 선택됨</DrawerTitle>
            <DrawerDescription className="text-xs">선택한 사진을 이동하거나 삭제합니다.</DrawerDescription>
          </DrawerHeader>
          
          <div className="p-4 flex flex-col gap-6">
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <FolderInput className="w-3.5 h-3.5" />
                    이동할 장소 선택
                </h4>
                <ScrollArea className="h-[240px] border border-slate-100 rounded-md p-1 bg-slate-50/50">
                    <div className="flex flex-col gap-0.5">
                        {clusters.map(cluster => (
                            <Button
                                key={cluster.id}
                                variant="ghost"
                                className="justify-start h-9 px-2 font-semibold text-sm hover:bg-white hover:shadow-subtle rounded-md transition-all"
                                onClick={() => onMoveToCluster(cluster.id)}
                            >
                                <span className="truncate">{cluster.name === 'reserve' ? '미분류' : cluster.name}</span>
                                <span className="ml-auto text-[10px] bg-slate-100 px-1.5 py-0.5 rounded-md text-slate-500 font-bold">{cluster.photos.length}장</span>
                            </Button>
                        ))}
                    </div>
                </ScrollArea>
            </div>

            <Button variant="destructive" size="lg" className="w-full gap-2 h-11 text-sm font-bold rounded-md" onClick={onDelete}>
                <Trash2 className="w-4 h-4" />
                선택한 사진 영구 삭제
            </Button>
          </div>

          <DrawerFooter className="pt-0">
            <DrawerClose asChild>
              <Button variant="ghost" className="h-10 font-bold text-slate-400">취소</Button>
            </DrawerClose>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
