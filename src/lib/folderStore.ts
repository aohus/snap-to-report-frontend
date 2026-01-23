import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export interface Folder {
  id: string;
  name: string;
  jobIds: string[];
}

interface FolderState {
  folders: Folder[];
  selectedFolderId: string | null; // null이면 '전체 보기'
  setFolders: (folders: Folder[]) => void;
  selectFolder: (id: string | null) => void;
  addFolder: (name: string) => void;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  moveJobToFolder: (jobId: string, folderId: string | null) => void;
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],
  selectedFolderId: null,

  setFolders: (folders) => set({ folders }),

  selectFolder: (id) => set({ selectedFolderId: id }),

  addFolder: (name) => set((state) => ({
    folders: [...state.folders, { id: uuidv4(), name, jobIds: [] }]
  })),

  updateFolder: (id, name) => set((state) => ({
    folders: state.folders.map(f => f.id === id ? { ...f, name } : f)
  })),

  deleteFolder: (id) => set((state) => ({
    folders: state.folders.filter(f => f.id !== id),
    selectedFolderId: state.selectedFolderId === id ? null : state.selectedFolderId
  })),

  moveJobToFolder: (jobId, folderId) => set((state) => {
    // 1. 기존 모든 폴더에서 해당 jobId 제거
    const cleanedFolders = state.folders.map(f => ({
      ...f,
      jobIds: f.jobIds.filter(id => id !== jobId)
    }));

    // 2. 새로운 폴더에 추가 (folderId가 null이 아니면)
    if (folderId) {
      return {
        folders: cleanedFolders.map(f => f.id === folderId ? { ...f, jobIds: [...f.jobIds, jobId] } : f)
      };
    }

    return { folders: cleanedFolders };
  }),
}));
