# Implementation Plan

## 1. Mobile Sidebar Fix (`Dashboard.tsx`)
- [ ] Add state to toggle sidebar visibility on mobile.
- [ ] Use `hidden md:flex` for the sidebar `aside`.
- [ ] Add a `Sheet` (or conditional overlay) for the sidebar on mobile triggered by a menu button in the header.

## 2. ClusterBoard Scroll Fix (`PhotoCard.tsx`, `ClusterBoard.tsx`)
- [ ] Issue: `dragHandleProps` on the entire card blocks touch scrolling.
- [ ] Fix: Move `dragHandleProps` to a specific "Drag Handle" icon/area on the card.
- [ ] Add a `Grip` icon to `PhotoCard`.
- [ ] Ensure `touch-action: pan-y` is preserved on the container.

## 3. Mobile Button Sizing
- [ ] Review `ClusterBoard` toolbar and `PlaceRow` buttons.
- [ ] Adjust padding and heights for mobile breakpoints (smaller visual size, but adequate touch target).
- [ ] Scale down `Dashboard` headers/buttons on mobile.

## 4. Drag-and-Drop Visual Fix (`PlaceRow.tsx`, `ClusterBoard.tsx`)
- [ ] Issue: Dragged item appears behind subsequent rows due to stacking context.
- [ ] Fix: Use `renderClone` prop on `Droppable` to render the dragged item appended to `body` (or root).
- [ ] This ensures the dragged item is in the highest stacking context.

## 5. Verification
- [ ] Verify scroll works on mobile (by simulating touch or checking code structure).
- [ ] Verify dragging is visible over all rows.
- [ ] Verify sidebar toggles on mobile.
