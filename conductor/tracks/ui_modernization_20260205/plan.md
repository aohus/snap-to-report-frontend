# Implementation Plan: UI Modernization & Dashboard Renewal

## Phase 1: Design System Foundation
- [x] Task: Define Design Tokens in `tailwind.config.ts` & `index.css`
    - [x] Define Color Palette (Primary, Secondary, Background, Surface, Border)
    - [x] Define Typography (Font Family, Sizes, Line Heights, Letter Spacing)
    - [x] Define Component Tokens (Radius, Shadows)
- [x] Task: Create/Update Core UI Components with new Design System
    - [x] Update `Button`, `Input`, `Card`, `Badge` components in `src/components/ui/`
    - [x] Ensure all base components use the defined semantic colors and tokens
- [x] Task: Conductor - User Manual Verification 'Design System Foundation' (Protocol in workflow.md) [checkpoint: f7c8eba]

## Phase 2: Dashboard Renewal (Layout & Components)
- [x] Task: Create Dashboard Widgets (Bento Grid)
    - [x] Implement `DashboardStats` component using new Card style
- [x] Task: Reorganize Pages for clarity
    - [x] Rename current `Dashboard.tsx` to `JobWorkspace.tsx`
    - [x] Rename `JobList.tsx` to `Dashboard.tsx`
    - [x] Update `App.tsx` routes
- [x] Task: Implement Advanced Job List (Data Grid)
    - [x] Create `JobTable` component with sorting and filtering
    - [x] Implement search functionality with debouncing (moved into JobTable)
- [x] Task: Update Dashboard Layout
    - [x] Assemble Widgets and JobTable into the main `Dashboard` page layout
    - [x] Apply responsive design for mobile and desktop
- [ ] Task: Conductor - User Manual Verification 'Dashboard Renewal' (Protocol in workflow.md)

## Phase 3: Global Consistency & Polish
- [x] Task: Increase Global Font Size for Accessibility
    - [x] Update `src/index.css` base styles (html font-size, p, headings)
- [x] Task: Modernize Sidebar Navigation
    - [x] Redesign Sidebar with a cleaner look (better spacing, active states)
    - [x] Improve 'All', 'Unclassified' items visual hierarchy
- [x] Task: Apply Design System to Other Pages
    - [x] Update `Login/Signup` pages with new theme
    - [x] Update `JobEditor` (Detail View) to match the new visual style
- [x] Task: Refine Interactions & Animations
    - [x] Add subtle hover effects and transitions using Framer Motion
- [x] Task: Final Review & Cleanup
    - [x] Check for any inconsistent styles or hardcoded colors
- [x] Task: Conductor - User Manual Verification 'Global Consistency & Polish' (Protocol in workflow.md)
