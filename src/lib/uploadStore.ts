import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface UploadItem {
  id: string;
  file: File;
  fileName: string;
  progress: number;
  status: 'pending' | 'compressing' | 'uploading' | 'completed' | 'failed';
  error?: string;
}

interface UploadState {
  items: Record<string, UploadItem>;
  itemIds: string[];
  isUploading: boolean;
  totalProgress: number;
  uploadStartedAt: number | null; // 예상 시간 계산용
  addFiles: (files: File[]) => void;
  updateItem: (id: string, updates: Partial<UploadItem>) => void;
  removeCompleted: () => void;
  setUploading: (isUploading: boolean) => void;
  retryFailed: (id: string) => void;
  clearQueue: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  items: {},
  itemIds: [],
  isUploading: false,
  totalProgress: 0,
  uploadStartedAt: null,

  addFiles: (files) => {
    const newItems: Record<string, UploadItem> = {};
    const newIds: string[] = [];
    
    files.forEach((file) => {
      const id = uuidv4();
      newItems[id] = {
        id,
        file,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      };
      newIds.push(id);
    });

    set((state) => ({
      items: { ...state.items, ...newItems },
      itemIds: [...state.itemIds, ...newIds],
      totalProgress: 0, // 초기화
    }));
  },

  updateItem: (id, updates) => {
    set((state) => {
      const item = state.items[id];
      if (!item) return state;

      const updatedItem = { ...item, ...updates };
      const updatedItems = {
        ...state.items,
        [id]: updatedItem,
      };

      // 전체 진행률 계산 (합산 방식이 오차가 적음)
      let totalSum = 0;
      state.itemIds.forEach(itemId => {
        totalSum += updatedItems[itemId].progress;
      });
      const totalProgress = state.itemIds.length > 0 
        ? Math.round(totalSum / state.itemIds.length) 
        : 0;

      return { items: updatedItems, totalProgress };
    });
  },

  removeCompleted: () => {
    const { items, itemIds } = get();
    const newItemIds = itemIds.filter(id => items[id].status !== 'completed');
    const newItems: Record<string, UploadItem> = {};
    newItemIds.forEach(id => {
      newItems[id] = items[id];
    });
    set({ items: newItems, itemIds: newItemIds, totalProgress: 0 });
  },

  setUploading: (isUploading) => set({ 
    isUploading,
    uploadStartedAt: isUploading ? Date.now() : null
  }),

  retryFailed: (id) => {
    set((state) => {
      const item = state.items[id];
      if (!item) return state;
      return {
        items: {
          ...state.items,
          [id]: { ...item, status: 'pending', progress: 0, error: undefined }
        }
      };
    });
  },

  clearQueue: () => set({ items: {}, itemIds: [], totalProgress: 0, isUploading: false, uploadStartedAt: null }),
}));
