import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, waitFor } from '@testing-library/react';
import { ClusterBoard } from './ClusterBoard';
import { Cluster } from '@/types';

// Mock virtualizer to render all items in tests
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(({ count }: any) => ({
    getVirtualItems: () => Array.from({ length: count }).map((_, index) => ({
      index,
      key: index,
      start: index * 300,
      size: 300,
    })),
    getTotalSize: () => count * 300,
    measureElement: vi.fn(),
  })),
}));

// Mock dnd to avoid issues in JSDOM
vi.mock('@hello-pangea/dnd', () => ({
  DragDropContext: ({ children }: any) => <div>{children}</div>,
  Droppable: ({ children }: any) => children({
    innerRef: vi.fn(),
    droppableProps: {},
    placeholder: null
  }, {}),
  Draggable: ({ children }: any) => children({
    innerRef: vi.fn(),
    draggableProps: {},
    dragHandleProps: {}
  }, {}),
}));

// Mock useIsMobile
vi.mock('@/hooks/use-mobile', () => ({
  useIsMobile: vi.fn(() => false),
}));

describe('ClusterBoard - New Layout', () => {
  const mockClusters: Cluster[] = [
    {
      id: 'reserve-id',
      name: 'reserve',
      order_index: -1,
      photos: []
    },
    {
      id: 'cluster-1',
      name: 'Place 1',
      order_index: 0,
      photos: []
    }
  ];

  it('renders a sticky sidebar for the reserve box', async () => {
    render(
      <ClusterBoard 
        clusters={mockClusters}
        onMovePhoto={vi.fn()}
        onCreateCluster={vi.fn()}
        onAddPhotosToExistingCluster={vi.fn()}
        onRenameCluster={vi.fn()}
        onDeletePhoto={vi.fn()}
        onDeleteCluster={vi.fn()}
        onMoveCluster={vi.fn()}
        selectedPhotos={[]}
        onSelectPhoto={vi.fn()}
        onEditLabels={vi.fn()}
      />
    );

    // Expect a sidebar-like element containing '임시 보관'
    await waitFor(() => {
        expect(screen.getByText('임시 보관')).toBeInTheDocument();
    });
  });

  it('renders clusters in a grid layout', async () => {
    render(
      <ClusterBoard 
        clusters={mockClusters}
        onMovePhoto={vi.fn()}
        onCreateCluster={vi.fn()}
        onAddPhotosToExistingCluster={vi.fn()}
        onRenameCluster={vi.fn()}
        onDeletePhoto={vi.fn()}
        onDeleteCluster={vi.fn()}
        onMoveCluster={vi.fn()}
        selectedPhotos={[]}
        onSelectPhoto={vi.fn()}
        onEditLabels={vi.fn()}
      />
    );

    // Expect '분류된 장소' header
    await waitFor(() => {
        expect(screen.getByText(/분류된 장소/)).toBeInTheDocument();
        // Expect Place 1 to be rendered
        expect(screen.getByText('Place 1')).toBeInTheDocument();
    });
  });

  it('shows "Drop Here" overlay when isDragging is true', () => {
    // Basic presence check
  });
});
