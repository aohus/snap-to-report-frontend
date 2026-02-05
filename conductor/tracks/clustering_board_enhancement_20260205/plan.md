# Implementation Plan: Clustering Board Enhancement

## Phase 1: Structural Refactoring & Vertical Grid Layout
- [x] Task: Refactor `ClusterBoard` to a fixed Vertical Layout [23b1d23]
    - [x] Remove `isVerticalMode` and horizontal scrolling logic.
    - [x] Implement a sticky Sidebar for the "Reserve Box" (left/right side).
    - [x] Redesign the main area as a responsive grid of Cluster Cards (2-4 columns depending on screen width).
    - [x] Fix Reserve Box aspect ratio and simplify Grid Layout [c8cc21e]
- [x] Task: TDD - Write unit tests for the new Vertical Layout and Sidebar visibility [23b1d23]
- [x] Task: Implement the new layout structure in `src/components/ClusterBoard.tsx`. [23b1d23]
- [x] Task: Conductor - User Manual Verification 'Structural Refactoring & Vertical Grid Layout' (Protocol in workflow.md) [checkpoint: c8cc21e]


## Phase 2: Dynamic Drop Zones & Interaction Feedback
- [ ] Task: Implement "On-Demand" Drop Zones
    - [ ] Detect drag states (using `snapshot.isDraggingOver` or global drag state).
    - [ ] Hide static "Add Photo" buttons and show "Drop Here" zones only during active drag.
- [ ] Task: TDD - Write tests for Drop Zone visibility during simulated drag events.
- [ ] Task: Update `PlaceRow`/`PlaceColumn` (or equivalent Cluster components) to support dynamic drop zones.
- [ ] Task: Conductor - User Manual Verification 'Dynamic Drop Zones & Interaction Feedback' (Protocol in workflow.md)

## Phase 2: Multi-selection & Bulk Actions
- [x] Task: Implement Multi-selection Logic [9b46074]
    - [x] Add state to `ClusterBoard` or a new hook for tracking selected photos.
    - [x] Support additive selection on click.
- [x] Task: Implement Bulk Action UI [79f2a0c]
    - [x] Create a Floating Action Bar that appears when photos are selected.
    - [x] Add buttons for "Move to Reserve", "Move to Place...", and "Delete".
- [x] Task: TDD - Write tests for selection logic and bulk movement accuracy. [79f2a0c]
- [x] Task: Implement selection handlers and the bulk action component. [cd42077]
- [x] Task: Conductor - User Manual Verification 'Multi-selection & Bulk Actions' (Protocol in workflow.md) [checkpoint: cd42077]

## Phase 3: Quick Preview & UI Polish
- [x] Task: Implement Quick Preview Lightbox [214b362]
    - [x] Create a `Lightbox` component using shadcn `Dialog` or a specialized library.
    - [x] Support image zoom and high-quality viewing.
    - [x] Implement keyboard navigation (ArrowLeft, ArrowRight, Esc).
- [x] Task: TDD - Write tests for Lightbox triggering and navigation. [214b362]
- [x] Task: Final UI/UX Polish (Consistency with latest trends, spacing, shadows). [d1a1ec0]
- [ ] Task: Conductor - User Manual Verification 'Quick Preview & UI Polish' (Protocol in workflow.md)

## Phase 5: Performance Optimization (Virtualization)
- [ ] Task: Integrate `@tanstack/react-virtual` for Cluster List
    - [ ] Implement virtualized rendering for the main list of clusters to handle large datasets (100+ clusters).
- [ ] Task: TDD - Write performance tests/benchmarks for large list scrolling.
- [ ] Task: Finalize virtualization and ensure DnD compatibility.
- [ ] Task: Conductor - User Manual Verification 'Performance Optimization (Virtualization)' (Protocol in workflow.md)
