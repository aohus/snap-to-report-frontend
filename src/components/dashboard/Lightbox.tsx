import React, { useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { Photo } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface LightboxProps {
  photo: Photo | null;
  onClose: () => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export function Lightbox({ photo, onClose, onNext, onPrev, hasNext, hasPrev }: LightboxProps) {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotate] = React.useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && onNext) onNext();
      if (e.key === 'ArrowLeft' && onPrev) onPrev();
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onNext, onPrev, onClose]);

  // Reset zoom and rotation when photo changes
  useEffect(() => {
    setZoom(1);
    setRotate(0);
  }, [photo?.id]);

  if (!photo) return null;

  return (
    <Dialog open={!!photo} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 bg-black/95 border-none overflow-hidden flex flex-col items-center justify-center rounded-3xl shadow-2xl">
        <DialogTitle className="sr-only">Photo Preview: {photo.original_filename}</DialogTitle>
        
        {/* Controls Overlay */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-50 pointer-events-none">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-4 pointer-events-auto">
                <span className="text-white font-bold text-sm truncate max-w-[200px] md:max-w-md">
                    {photo.original_filename}
                </span>
                <div className="h-4 w-px bg-white/20 mx-1" />
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={() => setZoom(prev => Math.min(prev + 0.5, 3))} aria-label="Zoom in">
                        <ZoomIn className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={() => setZoom(prev => Math.max(prev - 0.5, 0.5))} aria-label="Zoom out">
                        <ZoomOut className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white hover:bg-white/20 rounded-full" onClick={() => setRotate(prev => (prev + 90) % 360)} aria-label="Rotate">
                        <RotateCw className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                className="h-12 w-12 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 rounded-full border border-white/10 pointer-events-auto"
                onClick={onClose}
                aria-label="Close lightbox"
            >
                <X className="w-6 h-6" />
            </Button>
        </div>

        {/* Navigation Arrows */}
        {hasPrev && (
            <div className="absolute left-6 top-1/2 -translate-y-1/2 z-50">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-16 w-16 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 rounded-full border border-white/10"
                    onClick={(e) => { e.stopPropagation(); onPrev?.(); }}
                    aria-label="Previous photo"
                >
                    <ChevronLeft className="w-10 h-10" />
                </Button>
            </div>
        )}

        {hasNext && (
            <div className="absolute right-6 top-1/2 -translate-y-1/2 z-50">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-16 w-16 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 rounded-full border border-white/10"
                    onClick={(e) => { e.stopPropagation(); onNext?.(); }}
                    aria-label="Next photo"
                >
                    <ChevronRight className="w-10 h-10" />
                </Button>
            </div>
        )}

        {/* Main Image Container */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            <AnimatePresence mode="wait">
                <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ 
                        opacity: 1, 
                        scale: zoom,
                        rotate: rotation
                    }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="cursor-grab active:cursor-grabbing"
                >
                    <img
                        src={photo.url}
                        alt={photo.original_filename}
                        className="max-w-full max-h-[85vh] object-contain select-none pointer-events-none shadow-2xl"
                        draggable={false}
                    />
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Info Footer */}
        {photo.labels && Object.keys(photo.labels).length > 0 && (
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-wrap justify-center gap-2 max-w-2xl px-6 pointer-events-none">
                {Object.entries(photo.labels).map(([key, value]) => (
                    <div key={key} className="bg-black/60 backdrop-blur-xl px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2">
                        <span className="text-white/50 text-[10px] font-black uppercase tracking-widest">{key}</span>
                        <span className="text-white font-bold text-sm">{value}</span>
                    </div>
                ))}
            </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
