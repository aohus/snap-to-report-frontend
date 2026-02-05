import { useState, useCallback } from 'react';

export interface SelectedPhoto {
  id: string;
  clusterId: string;
}

export function calculateNextSelection(
    currentSelection: SelectedPhoto[],
    lastSelected: SelectedPhoto | null,
    targetPhoto: SelectedPhoto,
    isMultiSelect: boolean,
    isRangeSelect: boolean,
    allPhotos: SelectedPhoto[]
): { nextSelection: SelectedPhoto[], nextLastSelected: SelectedPhoto | null } {
    if (isRangeSelect && lastSelected) {
        const currentIndex = allPhotos.findIndex(p => p.id === targetPhoto.id);
        const lastIndex = allPhotos.findIndex(p => p.id === lastSelected.id);
        
        if (currentIndex !== -1 && lastIndex !== -1) {
          const start = Math.min(currentIndex, lastIndex);
          const end = Math.max(currentIndex, lastIndex);
          const range = allPhotos.slice(start, end + 1);
          
          const newSet = new Set(currentSelection.map(p => p.id));
          const nextSelection = [...currentSelection];
          
          range.forEach(p => {
            if (!newSet.has(p.id)) {
              nextSelection.push(p);
            }
          });
          return { nextSelection, nextLastSelected: targetPhoto };
        }
      } 
      
      if (isMultiSelect) {
        const exists = currentSelection.some(p => p.id === targetPhoto.id);
        const nextSelection = exists 
            ? currentSelection.filter(p => p.id !== targetPhoto.id)
            : [...currentSelection, targetPhoto];
        return { nextSelection, nextLastSelected: targetPhoto };
      }

      // Default: Single selection
      return { nextSelection: [targetPhoto], nextLastSelected: targetPhoto };
}

export function useMultiSelection() {
  const [selectedPhotos, setSelectedPhotos] = useState<SelectedPhoto[]>([]);
  const [lastSelectedPhoto, setLastSelectedPhoto] = useState<SelectedPhoto | null>(null);

  const toggleSelection = useCallback((photo: SelectedPhoto, isMultiSelect: boolean, isRangeSelect: boolean, allPhotos: SelectedPhoto[]) => {
    const { nextSelection, nextLastSelected } = calculateNextSelection(
        selectedPhotos,
        lastSelectedPhoto,
        photo,
        isMultiSelect,
        isRangeSelect,
        allPhotos
    );
    setSelectedPhotos(nextSelection);
    setLastSelectedPhoto(nextLastSelected);
  }, [selectedPhotos, lastSelectedPhoto]);

  const clearSelection = useCallback(() => {
    setSelectedPhotos([]);
    setLastSelectedPhoto(null);
  }, []);

  return {
    selectedPhotos,
    lastSelectedPhoto,
    setSelectedPhotos,
    setLastSelectedPhoto,
    toggleSelection,
    clearSelection
  };
}
