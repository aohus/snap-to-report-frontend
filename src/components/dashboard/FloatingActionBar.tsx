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
          initial={{ y: 100, x: "-50%", opacity: 0, scale: 0.95 }}
          animate={{ y: 0, x: "-50%", opacity: 1, scale: 1 }}
          exit={{ y: 100, x: "-50%", opacity: 0, scale: 0.95 }}
          className="fixed bottom-8 left-1/2 z-50 flex items-center gap-1 md:gap-2 bg-slate-900 text-white p-1.5 md:p-2 pl-4 md:pl-5 rounded-xl shadow-elevated border border-white/10 backdrop-blur-xl max-w-[95vw] md:max-w-none transition-all"
        >
          <div className="flex flex-col mr-2 md:mr-3 shrink-0">
            <span className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">선택됨</span>
            <span className="text-sm md:text-base font-bold leading-none mt-1">{selectedCount}</span>
          </div>
          
          <div className="h-6 w-px bg-white/10 mx-1 shrink-0" />
          
          <div className="flex items-center gap-0.5 md:gap-1 overflow-hidden">
            <Button
                size="sm"
                variant="ghost"
                className="text-white hover:bg-white/10 rounded-lg h-9 px-2 md:px-3 gap-1.5 md:gap-2 font-semibold transition-all active:scale-[0.98] text-xs md:text-sm whitespace-nowrap"
                onClick={onMoveClick}
            >
                <FolderInput className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-70" />
                <span className="hidden xs:inline">현장 이동</span>
                <span className="xs:hidden">이동</span>
            </Button>
            
            <Button
                size="sm"
                variant="ghost"
                className="text-rose-400 hover:bg-rose-500/20 hover:text-rose-300 rounded-lg h-9 px-2 md:px-3 gap-1.5 md:gap-2 font-semibold transition-all active:scale-[0.98] text-xs md:text-sm whitespace-nowrap"
                onClick={onDeleteClick}
            >
                <Trash2 className="w-3.5 h-3.5 md:w-4 md:h-4 opacity-70" />
                <span className="hidden xs:inline">삭제</span>
            </Button>

            <Button
                size="icon"
                variant="ghost"
                className="text-slate-400 hover:bg-white/10 hover:text-white rounded-lg h-9 w-10 ml-0.5 md:ml-1 transition-all active:scale-[0.98] shrink-0"
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
