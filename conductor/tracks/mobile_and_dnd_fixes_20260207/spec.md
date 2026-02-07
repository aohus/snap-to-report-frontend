# Specification

## Mobile Layout
- **Sidebar**:
  - Hidden by default on screens < 768px (md).
  - Accessible via a Hamburger menu icon in the top header.
  - Opens as an overlay or pushes content (Overlay preferred for mobile).
- **Job List**:
  - Should take full width on mobile when sidebar is closed.

## Cluster Board
- **Scrolling**:
  - Touching a photo should NOT initiate drag immediately if it prevents scrolling.
  - Dragging should be initiated via a specific Handle OR a long-press (Handle is safer for web apps).
  - **Decision**: Add a visible "Grip" icon on the card top-right or top-left. Only this icon initiates drag.
  - *Alternative*: Long press. But explicit handle is clearer. Let's try adding a handle to the `PhotoCard` overlay.

- **Drag Visuals**:
  - The dragged item must not be clipped or obscured by other elements.
  - Implementation: `Droppable`'s `renderClone` feature will be used to render the drag preview at the root level.

## Styling
- **Buttons**:
  - Mobile buttons should look less "chunky".
  - Use `h-8` or smaller padding on mobile.
