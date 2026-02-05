import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useMultiSelection, SelectedPhoto } from './useMultiSelection';

describe('useMultiSelection', () => {
  const photos: SelectedPhoto[] = [
    { id: '1', clusterId: 'c1' },
    { id: '2', clusterId: 'c1' },
    { id: '3', clusterId: 'c2' },
    { id: '4', clusterId: 'c2' },
  ];

  it('should handle single selection', () => {
    const { result } = renderHook(() => useMultiSelection());

    act(() => {
      result.current.toggleSelection(photos[0], false, false, photos);
    });

    expect(result.current.selectedPhotos).toEqual([photos[0]]);
  });

  it('should handle multi selection (Ctrl+Click)', () => {
    const { result } = renderHook(() => useMultiSelection());

    act(() => {
      result.current.toggleSelection(photos[0], false, false, photos); // Select 1
    });
    
    act(() => {
      result.current.toggleSelection(photos[2], true, false, photos); // Add 3
    });

    expect(result.current.selectedPhotos).toHaveLength(2);
    expect(result.current.selectedPhotos).toEqual(expect.arrayContaining([photos[0], photos[2]]));
    
    // Deselect
    act(() => {
        result.current.toggleSelection(photos[0], true, false, photos);
    });
    expect(result.current.selectedPhotos).toEqual([photos[2]]);
  });

  it('should handle range selection (Shift+Click)', () => {
    const { result } = renderHook(() => useMultiSelection());

    // Select first
    act(() => {
      result.current.toggleSelection(photos[0], false, false, photos);
    });

    // Shift+Click last
    act(() => {
      result.current.toggleSelection(photos[3], false, true, photos);
    });

    expect(result.current.selectedPhotos).toHaveLength(4);
    // Should contain 1, 2, 3, 4
    expect(result.current.selectedPhotos.map(p => p.id)).toEqual(['1', '2', '3', '4']);
  });
});
