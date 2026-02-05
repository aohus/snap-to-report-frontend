# Implementation Plan: Architecture & UX Modernization

## Phase 1: Structural Refactoring & Safety
- [x] Task: Create `useJobActions` hook to extract logic from Dashboard
    - [x] Move `handleMovePhoto`, `handleCreateCluster`, `handleDeletePhoto` logic
- [x] Task: Decompose `Dashboard.tsx` into smaller components
    - [x] Create `components/dashboard/ClusterSection.tsx`
    - [x] Create `components/dashboard/UnsortedGrid.tsx`
    - [x] Create `components/dashboard/ActionToolbar.tsx`
- [x] Task: Implement Global & Local Error Boundaries
    - [x] Wrap main routes with Global Error Boundary
    - [x] Wrap `PhotoGrid` with Sectional Error Boundary (with Retry button)
- [x] Task: Conductor - User Manual Verification 'Structural Refactoring & Safety' (Protocol in workflow.md)

## Phase 2: Performance Optimization
- [x] Task: Implement Virtualization for Photo Grid
    - [x] Install `@tanstack/react-virtual`
    - [x] Apply virtual scroller to `PhotoGrid.tsx` (Grid Layout)
- [x] Task: Implement Runtime Validation
    - [x] Define Zod schemas in `src/types/schema.ts` matching backend types
    - [x] Apply validation in `lib/api.ts` response handling
- [x] Task: Conductor - User Manual Verification 'Performance Optimization' (Protocol in workflow.md)

## Phase 3: UX Modernization (Professional Tool Polish)
- [x] Task: Design System Update for Professional Feel
    - [x] Update Color Palette (Slate/Navy theme for trust and clarity)
    - [x] Standardize Typography (Increase base font size, use Medium weight for labels)
- [x] Task: Implement Explicit Action Toolbar
    - [x] Create `ActionToolbar` component with Icon + Text buttons
    - [x] Replace existing icon-only toolbars
- [x] Task: Implement Mobile Selection Mode & Drawer
    - [x] Add "Select Mode" toggle
    - [x] Create `ActionDrawer` with large, labeled buttons for mobile operations
- [x] Task: Modernize Dashboard Stats (Bento Style)
    - [x] Rebuild top stats area into high-contrast Bento Cards
- [x] Task: Conductor - User Manual Verification 'UX Modernization' (Protocol in workflow.md)