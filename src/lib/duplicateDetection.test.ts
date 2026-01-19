import { describe, it, expect, vi } from 'vitest';
import { detectDuplicates } from './duplicateDetection';

// Mock the computeImageHash function locally or just mock the dependencies
// Since detectDuplicates calls computeImageHash internally, we need to mock the module or the canvas API.
// Easier to mock the module if I exported the hash function, but it's not exported.
// I'll rely on the Name detection test which doesn't strictly depend on Hash if name matches (Pass 1).
// For Pass 2 (Hash), I'd need to mock the canvas.

describe('detectDuplicates', () => {
  it('should detect name-based duplicates', async () => {
    // We can't easily mock the internal hash function without rewiring.
    // However, the function "detectDuplicates" handles exceptions in hashing by using a fallback hash.
    // In JSDOM/Node without full Canvas support, createImageBitmap might fail or be missing.
    // If it fails, it falls back to ERR_hash, which is unique per file size.
    
    // Let's create dummy files.
    const fileA = new File(['content'], 'photo.jpg', { type: 'image/jpeg' });
    const fileA_dup = new File(['content'], 'photo (1).jpg', { type: 'image/jpeg' });
    const fileB = new File(['other'], 'unique.jpg', { type: 'image/jpeg' });

    // Mock window.createImageBitmap to avoid crash
    // @ts-ignore
    global.window.createImageBitmap = vi.fn().mockRejectedValue(new Error('Not implemented'));

    const groups = await detectDuplicates([fileA, fileA_dup, fileB]);

    // Expect 1 group containing photo.jpg and photo (1).jpg
    expect(groups.length).toBe(1);
    expect(groups[0].files).toHaveLength(2);
    expect(groups[0].files.map(f => f.name)).toContain('photo.jpg');
    expect(groups[0].files.map(f => f.name)).toContain('photo (1).jpg');
  });

  it('should not group distinct files', async () => {
    // @ts-ignore
    global.window.createImageBitmap = vi.fn().mockRejectedValue(new Error('Not implemented'));

    const fileA = new File(['a'], 'a.jpg');
    const fileB = new File(['b'], 'b.jpg');

    const groups = await detectDuplicates([fileA, fileB]);
    expect(groups.length).toBe(0);
  });
});
