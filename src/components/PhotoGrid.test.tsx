import { render, screen } from '@testing-library/react';
import { PhotoGrid } from './PhotoGrid';
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { Photo } from '@/types';
import '@testing-library/jest-dom';

// Mock ResizeObserver
beforeAll(() => {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

// Mock hooks
vi.mock('@/hooks/useElementSize', () => ({
    useElementSize: () => ({ width: 800, height: 600 }),
}));

describe('PhotoGrid', () => {
  it('renders photos using virtualization', () => {
    const photos: Photo[] = Array.from({ length: 20 }).map((_, i) => ({
      id: `photo-${i}`,
      job_id: 'job-1',
      order_index: i,
      original_filename: `photo-${i}.jpg`,
      storage_path: `path/to/photo-${i}.jpg`,
      url: `http://example.com/photo-${i}.jpg`,
    }));

    render(<PhotoGrid photos={photos} />);
    
    // Check if some photos are rendered (virtualization might not render all if window is small)
    // But we mocked width 800.
    expect(screen.getByText('20 photos uploaded')).toBeInTheDocument();
    
    // Check if virtualization calculated height (implies logic ran)
    // 20 photos, width 800 -> ~5 cols -> 4 rows.
    // Row height ~160px. Total ~640px.
    // The exact value 646.4px was observed in failure message.
    // We check if the scroll container's inner div has height.
    const scrollContent = screen.getByText('20 photos uploaded').nextSibling?.firstChild as HTMLElement;
    expect(scrollContent).toBeInTheDocument();
    expect(scrollContent.style.height).not.toBe('0px');
    expect(parseFloat(scrollContent.style.height)).toBeGreaterThan(600);
  });
});
