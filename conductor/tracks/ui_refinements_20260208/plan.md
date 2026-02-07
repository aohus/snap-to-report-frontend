# Implementation Plan

## 1. Header Text Change (`Dashboard.tsx`)
- [ ] Change "Field Note" to "현장노트".

## 2. Mobile Sizing Optimization (`PhotoUploader.tsx`, `UnsortedGrid.tsx`)
- [ ] Reduce padding and icon sizes in `PhotoUploader` on mobile.
- [ ] Adjust grid columns in `PhotoUploader` preview (e.g., 3-4 cols on mobile).

## 3. PlaceRow Numbering (`PlaceRow.tsx`)
- [ ] Add a visual number badge (e.g., `#1`, `#2`) to the left of the place name/input.
- [ ] Pass `index` prop to `PlaceRow`.

## 4. Mobile Photo Reordering (`PlaceRow.tsx`, `PhotoCard.tsx`)
- [ ] Add "Left/Right" arrow buttons to `PhotoCard` overlays ONLY on mobile.
- [ ] Implement handler `onReorderPhoto(photoId, direction)` in `ClusterBoard`.
- [ ] This avoids re-enabling complex drag-and-drop on mobile.
