import { Button } from '@/components/ui/button';
import { Trash2, FolderInput, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface FloatingActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onMoveClick: () => void;
  onDeleteClick: () => void;
}

export function FloatingActionBar({
  selectedCount,
  onClearSelection,
  onMoveClick,
  onDeleteClick,
}: FloatingActionBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 100, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.95 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white p-1.5 pl-5 rounded-md shadow-elevated border border-white/5 backdrop-blur-xl"
        >
          <div className="flex flex-col mr-3">
            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">선택됨</span>
            <span className="text-base font-bold leading-none mt-1">{selectedCount}</span>
          </div>
          
          <div className="h-6 w-px bg-white/10 mx-1" />
          
          <div className="flex items-center gap-1">
            <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 rounded-md h-9 px-3 gap-2 font-semibold transition-all active:scale-[0.98]"
                onClick={onMoveClick}
            >
                <FolderInput className="w-4 h-4 opacity-70" />
                현장 이동
            </Button>
            
            <Button
                size="sm"
                variant="ghost"
                className="text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-md h-9 px-3 gap-2 font-semibold transition-all active:scale-[0.98]"
                onClick={onDeleteClick}
            >
                <Trash2 className="w-4 h-4 opacity-70" />
                삭제
            </Button>

            <Button
                size="icon"
                variant="ghost"
                className="text-slate-400 hover:bg-white/10 hover:text-white rounded-md h-9 w-9 ml-1 transition-all active:scale-[0.98]"
                onClick={onClearSelection}
            >
                <X className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
