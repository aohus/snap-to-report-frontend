# Specification

## Dashboard Stats (Mobile)
- Layout: Horizontal single row.
- Height: Reduced significantly.
- Content: Simplified stats (Total, Completed, etc.) in a compact format.
- Styling: Minimal padding, smaller fonts.

## Drag & Scroll
- Behavior:
  - Touching the card image/body -> Scroll page.
  - Touching the `Grip` icon -> Drag card.
- Implementation:
  - `touch-action: none` ONLY on the grip icon.
  - `touch-action: pan-y` on the card body (explicitly).

## Typography & Tables
- Table Headers: `whitespace-nowrap` to prevent vertical stacking of characters.
- Flex containers: Ensure `flex-shrink-0` on labels/icons to prevent squashing.
