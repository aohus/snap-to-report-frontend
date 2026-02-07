# Report: UI Refinements & Mobile Optimization

## Status
- **State**: Completed
- **Completed**: 2026-02-08

## Summary
Implemented several UI refinements and mobile-specific features to improve usability.

### 1. Header Localization
- **Change**: Renamed "Field Note" to "**현장노트**" in `Dashboard.tsx`.

### 2. Mobile Sizing Optimization
- **PhotoUploader**:
  - Reduced padding (`p-6` vs `p-12`).
  - Reduced icon sizes (`w-10` vs `w-16`).
  - Reduced font sizes (`text-xl` vs `text-4xl`).
  - Increased grid columns to 3 (from 2) for better density.
- **UnsortedGrid**:
  - Reduced container padding.

### 3. PlaceRow Numbering
- **Feature**: Added a sequential number badge (e.g., `#1`, `#2`) to each `PlaceRow` header.
- **Implementation**: Passed `index` prop from `ClusterBoard` virtualizer to `PlaceRow`.

### 4. Mobile Photo Reordering
- **Feature**: Since drag-and-drop is disabled on mobile, added **Left (<)** and **Right (>)** arrow buttons to photos overlay on mobile.
- **Implementation**:
  - Added `onReorder` callback to `PhotoCard`.
  - Implemented `handleReorder` in `PlaceRow` which calculates the new index and calls `onMovePhoto`.
  - Buttons are only visible when `isMobile` is true.

- **Fix**: Added `whitespace-nowrap` to buttons in `PlaceRow.tsx` to prevent label wrapping.

### 5. Post-Fix Refinements
- **Issue**: Mobile reorder buttons were covering the center of the photo.
- **Fix**: Moved reorder buttons to the **bottom-left** and **bottom-right** corners and made them smaller/semi-transparent (`h-7 w-7 bg-white/60`) to minimize obstruction.
- **Issue**: "Move to Cluster" drawer list didn't show row numbers.
- **Fix**: Added `#{index}` badge to the list items in `ActionDrawer.tsx`.

## Files Modified
- `src/pages/Dashboard.tsx`
- `src/components/PhotoUploader.tsx`
- `src/components/dashboard/UnsortedGrid.tsx`
- `src/components/PlaceRow.tsx`
- `src/components/ClusterBoard.tsx`
- `src/components/PhotoCard.tsx`
- `src/components/dashboard/ActionDrawer.tsx`
- `conductor/tracks/ui_refinements_20260208/`
