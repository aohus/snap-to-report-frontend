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
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-slate-900 text-white p-2 pl-4 pr-2 rounded-full shadow-2xl border border-slate-700/50 backdrop-blur-md"
        >
          <span className="font-semibold mr-2">{selectedCount}개 선택됨</span>
          
          <div className="h-6 w-px bg-slate-700 mx-1" />
          
          <Button
            size="sm"
            variant="ghost"
            className="text-white hover:bg-slate-800 hover:text-white rounded-full h-9 px-3 gap-2"
            onClick={onMoveClick}
          >
            <FolderInput className="w-4 h-4" />
            이동
          </Button>
          
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-full h-9 px-3 gap-2"
            onClick={onDeleteClick}
          >
            <Trash2 className="w-4 h-4" />
            삭제
          </Button>

          <Button
            size="icon"
            variant="ghost"
            className="text-slate-400 hover:bg-slate-800 hover:text-white rounded-full h-9 w-9 ml-1"
            onClick={onClearSelection}
          >
            <X className="w-5 h-5" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
