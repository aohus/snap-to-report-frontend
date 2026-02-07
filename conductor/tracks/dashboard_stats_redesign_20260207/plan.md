# Implementation Plan

## 1. Redesign `DashboardStats.tsx`
- [ ] Calculate meaningful metrics:
    - **Active Jobs**: Total - Completed (Focus on what needs attention).
    - **Completion Rate**: Completed / Total %.
    - **Recent Jobs**: Created in last 7 days.
- [ ] Create a compact layout:
    - Use a 4-column grid (Desktop) / 2-column grid (Mobile) or scrollable row.
    - Style as "Small Cards" (Icon + Label + Value side-by-side or compact stack).
    - Remove large background icons.
    - Reduce padding from `p-6` to `p-4` or `p-3`.
    - Reduce font sizes (`text-5xl` -> `text-2xl`).

## 2. Verify Responsiveness
- [ ] Ensure mobile layout remains usable (using the previous `min-w-0` fixes).
- [ ] Check desktop layout allows seeing more of the table below.
