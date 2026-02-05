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
          initial={{ y: 100, opacity: 0, scale: 0.9 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 100, opacity: 0, scale: 0.9 }}
          className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900/90 text-white p-2 pl-6 pr-2 rounded-2xl shadow-elevated border border-white/10 backdrop-blur-xl"
        >
          <div className="flex flex-col mr-4">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Selected</span>
            <span className="text-lg font-black leading-none mt-1">{selectedCount}</span>
          </div>
          
          <div className="h-8 w-px bg-white/10 mx-2" />
          
          <div className="flex items-center gap-1">
            <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 rounded-xl h-10 px-4 gap-2 font-bold transition-all active:scale-95"
                onClick={onMoveClick}
            >
                <FolderInput className="w-4 h-4 opacity-70" />
                이동
            </Button>
            
            <Button
                size="sm"
                variant="ghost"
                className="text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-xl h-10 px-4 gap-2 font-bold transition-all active:scale-95"
                onClick={onDeleteClick}
            >
                <Trash2 className="w-4 h-4 opacity-70" />
                삭제
            </Button>

            <Button
                size="icon"
                variant="ghost"
                className="text-slate-400 hover:bg-white/10 hover:text-white rounded-xl h-10 w-10 ml-1 transition-all active:scale-95"
                onClick={onClearSelection}
            >
                <X className="w-5 h-5" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
