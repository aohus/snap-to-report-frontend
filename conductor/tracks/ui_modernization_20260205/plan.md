# Implementation Plan: UI Modernization & Dashboard Renewal

## Phase 1: Design System Foundation
- [x] Task: Define Design Tokens in `tailwind.config.ts` & `index.css`
    - [x] Define Color Palette (Primary, Secondary, Background, Surface, Border)
    - [x] Define Typography (Font Family, Sizes, Line Heights, Letter Spacing)
    - [x] Define Component Tokens (Radius, Shadows)
- [x] Task: Create/Update Core UI Components with new Design System
    - [x] Update `Button`, `Input`, `Card`, `Badge` components in `src/components/ui/`
    - [x] Ensure all base components use the defined semantic colors and tokens
- [ ] Task: Conductor - User Manual Verification 'Design System Foundation' (Protocol in workflow.md)

## Phase 2: Dashboard Renewal (Layout & Components)
- [ ] Task: Create Dashboard Widgets (Bento Grid)
    - [ ] Implement `DashboardStats` component using new Card style
- [ ] Task: Implement Advanced Job List (Data Grid)
    - [ ] Create `JobTable` component with sorting and filtering
    - [ ] Implement search functionality with debouncing
- [ ] Task: Update Dashboard Layout
    - [ ] Assemble Widgets and JobTable into the main `Dashboard` page layout
    - [ ] Apply responsive design for mobile and desktop
- [ ] Task: Conductor - User Manual Verification 'Dashboard Renewal' (Protocol in workflow.md)

## Phase 3: Global Consistency & Polish
- [ ] Task: Apply Design System to Other Pages
    - [ ] Update `Login/Signup` pages with new theme
    - [ ] Update `JobEditor` (Detail View) to match the new visual style
- [ ] Task: Refine Interactions & Animations
    - [ ] Add subtle hover effects and transitions using Framer Motion
- [ ] Task: Final Review & Cleanup
    - [ ] Check for any inconsistent styles or hardcoded colors
- [ ] Task: Conductor - User Manual Verification 'Global Consistency & Polish' (Protocol in workflow.md)
