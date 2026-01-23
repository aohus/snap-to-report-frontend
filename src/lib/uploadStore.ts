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
  queue: UploadItem[];
  isUploading: boolean;
  totalProgress: number;
  addFiles: (files: File[]) => void;
  updateItem: (id: string, updates: Partial<UploadItem>) => void;
  removeCompleted: () => void;
  setUploading: (isUploading: boolean) => void;
  retryFailed: (id: string) => void;
  clearQueue: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  queue: [],
  isUploading: false,
  totalProgress: 0,

  addFiles: (files) => {
    const newItems: UploadItem[] = files.map((file) => ({
      id: uuidv4(),
      file,
      fileName: file.name,
      progress: 0,
      status: 'pending',
    }));
    set((state) => ({
      queue: [...state.queue, ...newItems],
    }));
  },

  updateItem: (id, updates) => {
    set((state) => {
      const newQueue = state.queue.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      );

      const totalProgress = newQueue.length > 0
        ? Math.round(newQueue.reduce((acc, item) => acc + item.progress, 0) / newQueue.length)
        : 0;

      return { queue: newQueue, totalProgress };
    });
  },

  removeCompleted: () => {
    set((state) => ({
      queue: state.queue.filter((item) => item.status !== 'completed'),
    }));
  },

  setUploading: (isUploading) => set({ isUploading }),

  retryFailed: (id) => {
    set((state) => ({
      queue: state.queue.map((item) =>
        item.id === id ? { ...item, status: 'pending', progress: 0, error: undefined } : item
      ),
    }));
  },

  clearQueue: () => set({ queue: [], totalProgress: 0, isUploading: false }),
}));
