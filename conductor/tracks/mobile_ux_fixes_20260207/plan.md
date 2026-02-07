# Implementation Plan

## 1. Mobile Drag & Scroll Fix (`PhotoCard.tsx`)
- [ ] Ensure `touch-action` is correctly managed.
- [ ] The `dragHandle` should have `touch-action: none`.
- [ ] The `PhotoCard` content should NOT have `touch-action: none` to allow scrolling.
- [ ] Verify if `react-beautiful-dnd` / `hello-pangea/dnd` needs specific touch sensor configuration.
- [ ] **Crucial**: Ensure `Draggable` logic on mobile applies `dragHandleProps` ONLY to the handle icon, and the rest of the card is free for scrolling. This is already implemented, but maybe the overlay is blocking touch.

## 2. Dashboard Stats Mobile Optimization (`DashboardStats.tsx`)
- [ ] Change grid layout from `grid-cols-1` to `grid-cols-4` even on mobile, or use a flexible flex row with horizontal scroll, OR stack them compactly.
- [ ] User requested "1 row, very small area". This implies a horizontal scroll or a very compact summary strip.
- [ ] Plan: Use a compact horizontal scroll container or a single-line summary grid.

## 3. Vertical Text Fix (`JobTable.tsx`, `PlaceRow.tsx`)
- [ ] `JobTable`: Hide less important columns on mobile (already doing this for some, but need to check header text wrapping).
- [ ] `JobTable`: Ensure `TableHead` has `whitespace-nowrap` or sufficient min-width.
- [ ] `PlaceRow`: Check header layout. Ensure flex container doesn't squash the title. Add `min-w-0` or `whitespace-nowrap`.

## 4. Verification
- [ ] Verify scrolling works by touching the card body on mobile.
- [ ] Verify drag works by touching the handle.
- [ ] Check table headers are readable.
