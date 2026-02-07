# Report: Mobile UX & Drag Fixes

## Status
- **State**: Completed
- **Completed**: 2026-02-07

## Summary
Fixed several critical mobile usability issues and drag-and-drop mechanics.

### 1. Mobile Drag & Scroll
- **Issue**: Users could not scroll the ClusterBoard on mobile, and dragging was difficult.
- **Root Cause**: `Draggable` items were likely blocking touch events for scrolling, and the drag handle wasn't exclusively capturing drag gestures.
- **Fix**: 
  - Added `touch-pan-y` class to the `PhotoCard` main container on mobile to explicitly allow vertical scrolling.
  - Added `touch-none` class to the dedicated **Drag Handle** (`GripHorizontal`) on mobile to reserve it for dragging.
  - This separation ensures touching the image scrolls the page, while touching the handle drags the card.

### 2. Dashboard Stats Mobile Optimization
- **Issue**: Dashboard stats took up too much vertical space on mobile.
- **Fix**: 
  - Refactored `DashboardStats` to use a **horizontal scrollable row** (`flex-nowrap overflow-x-auto`) on mobile.
  - Reduced card width (`min-w-[200px]`) and padding/font-sizes for mobile screens.
  - Desktop layout remains a 4-column grid.

### 3. Vertical Text Fix (Typography)
- **Issue**: Table headers and cell content were breaking vertically (one char per line) on narrow screens.
- **Fix**: 
  - Added `whitespace-nowrap` to `TableHead` and `TableCell` in `JobTable.tsx`.
  - Added `whitespace-nowrap` to buttons in `PlaceRow.tsx` to prevent label wrapping.
  
### 4. Post-Fix Refinements (Round 2)
- **Issue**: "Scroll not working" persisted on mobile.
- **Root Cause**: `useIsMobile` initialized to `undefined` (false-y), causing the Desktop view (with drag handle on root) to render first. If hydrated or cached this way, or if inline styles persisted, scroll would be blocked.
- **Fix**: Updated `useIsMobile` to initialize with `window.innerWidth` if available.
- **Fix**: Explicitly added `touchAction: 'pan-y'` to the `PhotoCard` style on mobile to override any potential inline styles from the library.
- **Issue**: "Drag not working" on mobile.
- **Fix**: Increased z-index of buttons to `z-30` to ensure they are clickable, and verified handle placement.
- **Issue**: "분류된 장소" text breaking vertically.
- **Fix**: Added `whitespace-nowrap` to the ClusterBoard header text.

### 10. Post-Fix Refinements (Round 8: Disable Drag & Fix ActionBar)
- **Decision**: Disabled drag-and-drop on mobile entirely as per user request (users will use the "Move Site" feature instead).
- **Fix**: Set `isDragDisabled={isMobile}` on `Draggable` components and removed the drag handle icon on mobile.
- **Issue**: `FloatingActionBar` (Move Site component) was shifted right and buttons were partially invisible on mobile.
- **Fix**:
  - Added `max-w-[95vw]` to the bar to prevent screen overflow.
  - Reduced internal gaps and padding on mobile.
  - Added responsive text labels ("Move" vs "Move Site") to save space.
  - Ensured perfect centering using `left-1/2 -translate-x-1/2`.

## Files Modified
- `src/components/PhotoCard.tsx`
- `src/components/dashboard/FloatingActionBar.tsx`
- `src/components/PhotoUploader.tsx`
- `src/hooks/use-mobile.tsx`
- `src/components/PlaceRow.tsx`
- `src/components/ClusterBoard.tsx`
- `src/components/dashboard/ClusterSection.tsx`
- `src/pages/JobWorkspace.tsx`
- `conductor/tracks/mobile_ux_fixes_20260207/`
