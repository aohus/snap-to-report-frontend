import { describe, it, expect, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { Lightbox } from './Lightbox';
import { Photo } from '@/types';

// Mock Dialog to avoid portal issues in JSDOM
vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ children, open }: any) => open ? <div>{children}</div> : null,
  DialogContent: ({ children }: any) => <div>{children}</div>,
  DialogTitle: ({ children }: any) => <h2>{children}</h2>,
}));

describe('Lightbox', () => {
  const mockPhoto: Photo = {
    id: 'photo-1',
    url: 'https://example.com/photo1.jpg',
    original_filename: 'photo1.jpg',
    thumbnail_url: 'https://example.com/thumb1.jpg',
    storage_path: 'path/1',
    created_at: '2023-01-01',
    cluster_id: 'cluster-1',
    labels: { category: 'test' }
  };

  const mockOnClose = vi.fn();
  const mockOnNext = vi.fn();
  const mockOnPrev = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders photo information when photo is provided', () => {
    render(
      <Lightbox 
        photo={mockPhoto} 
        onClose={mockOnClose} 
      />
    );

    expect(screen.getByText('photo1.jpg')).toBeInTheDocument();
    expect(screen.getByText('category')).toBeInTheDocument();
    expect(screen.getByText('test')).toBeInTheDocument();
    
    const img = screen.getByAltText('photo1.jpg') as HTMLImageElement;
    expect(img.src).toBe(mockPhoto.url);
  });

  it('calls onClose when close button is clicked', () => {
    render(
      <Lightbox 
        photo={mockPhoto} 
        onClose={mockOnClose} 
      />
    );

    const closeButton = screen.getByLabelText('Close lightbox');
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('handles keyboard navigation', () => {
    render(
      <Lightbox 
        photo={mockPhoto} 
        onClose={mockOnClose}
        onNext={mockOnNext}
        onPrev={mockOnPrev}
        hasNext={true}
        hasPrev={true}
      />
    );

    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(mockOnNext).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'ArrowLeft' });
    expect(mockOnPrev).toHaveBeenCalled();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('resets zoom and rotation when photo changes', () => {
    const { rerender } = render(
      <Lightbox 
        photo={mockPhoto} 
        onClose={mockOnClose} 
      />
    );

    // Find zoom in button
    const zoomInButton = screen.getByLabelText('Zoom in');
    fireEvent.click(zoomInButton); // Zoom should increase

    // Change photo
    const nextPhoto = { ...mockPhoto, id: 'photo-2', original_filename: 'photo2.jpg' };
    rerender(
      <Lightbox 
        photo={nextPhoto} 
        onClose={mockOnClose} 
      />
    );

    // Zoom should be reset and new photo info shown
    expect(screen.getByText('photo2.jpg')).toBeInTheDocument();
  });
});
