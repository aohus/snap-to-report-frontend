# Report: Mobile & DnD Fixes

## Status
- **State**: Completed
- **Completed**: 2026-02-07

## Summary
Fixed several critical mobile usability issues and a drag-and-drop visualization bug.

### 1. Mobile Sidebar
- Implemented a `Sheet` component for the sidebar on mobile.
- Sidebar is now accessible via a "Menu" icon in the header on mobile devices.
- Desktop sidebar remains persistent.
- Fixes the issue where the sidebar was obstructing the Job List on small screens.

### 2. ClusterBoard Mobile Scrolling
- Identified that `Draggable` items were capturing all touch events, preventing scrolling.
- Added a `useIsMobile` hook to detect mobile environment.
- On mobile, the `dragHandleProps` are NOT applied to the entire card.
- Instead, a specific **Grip Horizontal** icon is rendered on the top of the card (only on mobile).
- Dragging is initiated only by touching/dragging this handle, allowing the rest of the card to be touched for scrolling.

### 3. Drag-and-Drop Visuals (z-index)
- Fixed the issue where a dragged photo would appear "behind" subsequent rows or elements.
- Used the `renderClone` prop of `Droppable`.
- This renders the dragged item at the root level (appended to body), ensuring it has the highest stacking context and isn't clipped by overflow containers.
- Refactored `PhotoCard` to `PhotoCardInner` to support reuse in `renderClone`.

### 4. Mobile Styling
- Reduced button sizes and padding in `PlaceRow` for mobile screens (`h-7`, `text-[11px]`).
- Adjusted Dashboard header elements to be more compact on mobile.

## Files Modified
- `src/pages/Dashboard.tsx`
- `src/components/PhotoCard.tsx`
- `src/components/PlaceRow.tsx`
- `src/components/ClusterBoard.tsx`
- `conductor/tracks/mobile_and_dnd_fixes_20260207/`
