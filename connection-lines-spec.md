# Connection Lines — Behavior Specification
## Instruction for AI Coding Assistant

This file describes **exactly how connection lines (edges/connectors) must behave**
in the diagram drawing tool, based on the observed draw.io interaction model.
Implement every behavior described here precisely.

---

## Overview of What Was Observed

1. User clicks on canvas → starts drawing a line from that point
2. Each click adds a **waypoint** — the line bends at each click
3. Double-click ends the line (drops the final endpoint)
4. The line can be **dragged in the middle** to add new bends
5. Lines support three routing modes: **Sharp**, **Curved**, **Straight**
6. Hovering a shape shows **connection port dots** on its edges
7. Dragging from a port snaps the line's start/end to that shape
8. A small **floating toolbar** appears near the line when selected
9. Selected line shows **blue endpoint handles** and **midpoint handles**

---

## Part 1 — Connection Data Model

Every connection is stored as an object:

```js
{
  id: string,                   // unique ID, e.g. "conn_001"
  sourceShapeId: string | null, // ID of shape at start, or null if floating
  targetShapeId: string | null, // ID of shape at end, or null if floating
  sourcePortIndex: number | null, // which port on source shape (0=top,1=right,2=bottom,3=left)
  targetPortIndex: number | null,
  points: [                     // ALL points including start and end
    { x: number, y: number },   // index 0 = start point
    // ... intermediate waypoints ...
    { x: number, y: number }    // last index = end point
  ],
  routing: "sharp" | "curved" | "straight",
  stroke: string,               // e.g. "#ffffff"
  strokeWidth: number,          // e.g. 1
  strokeDash: number[],         // [] = solid, [6,3] = dashed, [2,2] = dotted
  markerStart: MarkerType,
  markerEnd: MarkerType,
  label: string,
  labelOffsetX: number,         // manual label nudge from line midpoint
  labelOffsetY: number,
  opacity: number               // 0–100
}

type MarkerType = "none" | "arrow" | "hollow-arrow" | "diamond" | "filled-diamond" | "circle"
```

---

## Part 2 — Drawing a New Line (Click-to-Place Mode)

This is the core interaction seen in the video: clicking places waypoints one by one.

### Step-by-Step Implementation

```
STATE: idle
  → User selects the Line tool from the toolbar or sidebar

STATE: drawing
  → On canvas mousedown: create new connection, set points[0] = {x, y}
  → On canvas mousemove: update a "preview point" (last point follows cursor live)
  → On canvas click (each subsequent click): push {x, y} to points array
  → On canvas dblclick OR press Escape: finalize — remove the trailing preview
    point, set state back to idle, add connection to the diagram

DURING DRAWING:
  - Render all placed points as small cyan/blue filled circles (radius 5px)
  - Render the live preview segment as a thin line from last placed point to cursor
  - Show coordinate tooltip near cursor: e.g. "-280, 340 (677)" = (dx, dy, distance)
  - Snap points to grid (10px) while drawing
```

### Coordinate Tooltip Format
```
"{deltaX}, {deltaY} ({totalLength})"
e.g. "-280, 340 (677)"
Show in a small dark pill label near the cursor while drawing.
```

---

## Part 3 — Routing Modes

The right-panel shows a **Line dropdown** with three options. Switch between them live.

### 3a. Sharp (Default)
```
Render as SVG <path> using L (lineTo) commands only.
All turns are hard angle corners — no curves.

SVG path: M x0 y0 L x1 y1 L x2 y2 ... L xn yn
```

### 3b. Curved
```
Render as SVG <path> using Catmull-Rom spline through all waypoints.
The line flows smoothly through every point — no sharp corners.

Algorithm: Convert waypoints to cubic bezier using Catmull-Rom → Bezier conversion:
  For each segment i → i+1:
    cp1 = point[i] + (point[i+1] - point[i-1]) * tension / 6
    cp2 = point[i+1] - (point[i+2] - point[i]) * tension / 6
    (use tension = 1.0)
  Use C (cubic bezier) commands in the SVG path.

SVG path: M x0 y0 C cp1x cp1y cp2x cp2y x1 y1 C ...
```

### 3c. Straight
```
Render as a single straight SVG line from points[0] to points[last].
All intermediate waypoints are ignored for rendering (but kept in data).

SVG: <line x1 y1 x2 y2 />
```

---

## Part 4 — Selecting a Line

Clicking on a line selects it and enters **edit mode**.

### Visual Feedback When Selected

```
1. ENDPOINT HANDLES — Large cyan filled circles (radius 6px) at:
   - points[0] (start)
   - points[last] (end)

2. MIDPOINT HANDLES — Small cyan filled circles (radius 4px) at the
   midpoint of each segment between consecutive waypoints.
   These are "ghost" handles — dragging one ADDS a new waypoint.

3. WAYPOINT HANDLES — Medium cyan circles (radius 5px) at each existing
   intermediate waypoint (not start/end). Drag to move the waypoint.

4. FLOATING MINI TOOLBAR appears near the line:
   [ ✏️ pencil icon ] [ L icon (routing toggle) ]
   - Pencil: edit label
   - L icon: cycle through routing modes (sharp → curved → straight)
```

---

## Part 5 — Manipulating Waypoints

### 5a. Moving an Existing Waypoint
```
mousedown on a WAYPOINT HANDLE (not start/end)
→ drag to new position
→ update points[i] = {x, y}
→ re-render line live while dragging
→ mouseup: finalize
```

### 5b. Adding a New Waypoint (Bend a Segment)
```
mousedown on a MIDPOINT HANDLE (the ghost handle at segment center)
→ this inserts a new point into the points array at that segment's index
→ drag it to the desired bend position
→ re-render live
→ mouseup: finalize
The midpoint handle disappears and two new midpoint handles appear
on the two new sub-segments.
```

### 5c. Moving Start or End Point
```
mousedown on ENDPOINT HANDLE
→ drag freely
→ if dragged near a shape's connection port: SNAP to that port
   (highlight the port with a green circle when close enough, threshold = 12px)
→ if dropped on port: set sourceShapeId / targetShapeId + sourcePortIndex / targetPortIndex
→ if dropped on empty canvas: set shapeId = null (floating endpoint)
→ mouseup: finalize
```

### 5d. Double-click on a Segment
```
Double-clicking anywhere on a line segment (not on a handle) ADDS a waypoint
at the clicked position, splitting that segment.
Insert new point at the correct index in the points array.
```

### 5e. Right-click on a Waypoint
```
Show context menu:
  [ Delete Waypoint ] — remove points[i], reconnect neighbors
```

---

## Part 6 — Connection Ports on Shapes

When the user **hovers over any shape**, show connection port indicators.

```
PORT POSITIONS (default, for rectangular shapes):
  port 0: top center    — (x + w/2, y)
  port 1: right center  — (x + w, y + h/2)
  port 2: bottom center — (x + w/2, y + h)
  port 3: left center   — (x, y + h/2)

PORT POSITIONS (for ellipses):
  port 0: top    — (cx, cy - ry)
  port 1: right  — (cx + rx, cy)
  port 2: bottom — (cx, cy + ry)
  port 3: left   — (cx - rx, cy)

VISUAL: Render each port as a small circle:
  - Normal: stroke #00AAFF, fill white, radius 5px
  - Hovered: fill #00AAFF, radius 6px, show green ring when a line endpoint is dragged near it

TRIGGER: Show ports when:
  a) Mouse hovers within 20px of the shape border
  b) User is actively dragging a line endpoint
```

### Connecting to a Shape Port
```
When drawing a new line:
  → If the user clicks near a shape port (within 12px), snap the start point
    to that port and record sourceShapeId + sourcePortIndex

When finishing a line (dblclick or final click):
  → If the final click is near a shape port, snap to it and record
    targetShapeId + targetPortIndex

When a connected shape moves:
  → Re-compute the attached endpoint position from the shape's new bounds + portIndex
  → Update points[0] or points[last] automatically
  → Re-render the line
```

---

## Part 7 — Line Rendering (SVG)

All lines are rendered as SVG elements inside an `<svg>` overlay covering the canvas.

### SVG Marker Definitions (place in `<defs>`)

```svg
<!-- Arrow (filled) -->
<marker id="marker-arrow" markerWidth="10" markerHeight="7"
        refX="9" refY="3.5" orient="auto">
  <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
</marker>

<!-- Hollow Arrow (open triangle, for inheritance) -->
<marker id="marker-hollow-arrow" markerWidth="10" markerHeight="7"
        refX="9" refY="3.5" orient="auto">
  <polygon points="0 0, 10 3.5, 0 7" fill="white" stroke="currentColor" stroke-width="1" />
</marker>

<!-- Diamond (hollow, for aggregation) -->
<marker id="marker-diamond" markerWidth="12" markerHeight="8"
        refX="11" refY="4" orient="auto">
  <polygon points="0 4, 6 0, 12 4, 6 8" fill="white" stroke="currentColor" stroke-width="1" />
</marker>

<!-- Filled Diamond (for composition) -->
<marker id="marker-filled-diamond" markerWidth="12" markerHeight="8"
        refX="11" refY="4" orient="auto">
  <polygon points="0 4, 6 0, 12 4, 6 8" fill="currentColor" />
</marker>

<!-- Circle -->
<marker id="marker-circle" markerWidth="8" markerHeight="8"
        refX="4" refY="4" orient="auto">
  <circle cx="4" cy="4" r="3" fill="white" stroke="currentColor" stroke-width="1" />
</marker>
```

### Rendering Each Connection

```js
function renderConnection(conn) {
  const pathD = buildPath(conn.points, conn.routing);

  return `
    <path
      id="${conn.id}"
      d="${pathD}"
      stroke="${conn.stroke}"
      stroke-width="${conn.strokeWidth}"
      stroke-dasharray="${conn.strokeDash.join(' ')}"
      fill="none"
      opacity="${conn.opacity / 100}"
      marker-start="${conn.markerStart !== 'none' ? `url(#marker-${conn.markerStart})` : ''}"
      marker-end="${conn.markerEnd !== 'none' ? `url(#marker-${conn.markerEnd})` : ''}"
    />
  `;
}

function buildPath(points, routing) {
  if (routing === "straight") {
    const s = points[0], e = points[points.length - 1];
    return `M ${s.x} ${s.y} L ${e.x} ${e.y}`;
  }
  if (routing === "sharp") {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }
  if (routing === "curved") {
    return catmullRomToBezier(points); // returns SVG path string with C commands
  }
}
```

---

## Part 8 — Line Label

Each line can have an optional text label displayed at its midpoint.

```
POSITION: midpoint of the entire path (arc length / 2)
STYLE:
  - White/light background pill behind text (padding 2px 6px)
  - Font: same as canvas default, 12px
  - Sits just above the line (offset -10px Y by default)
  - User can drag the label to reposition (updates labelOffsetX / labelOffsetY)

EDITING:
  - Double-click on the line (not on a handle) opens inline text input
  - Press Enter or click outside to confirm
```

---

## Part 9 — Line Jumps (Crossings)

When two lines cross, the one on top shows a small arc over the crossing point.

```
Detect all intersection points between all rendered connections.
For the line with higher z-order at each crossing:
  Draw a small arc (radius 6px) centered on the intersection,
  replacing the straight segment at that point.
  This gives the visual appearance of one line "jumping over" another.

This feature can be toggled globally via a "Line Jumps" checkbox in the panel.
```

---

## Part 10 — Right-Panel Properties (Style Panel for Selected Line)

When a line is selected, show these controls in the right panel:

```
Section: LINE
  [ ] Line checkbox (enable/disable)     Routing dropdown: Sharp | Curved | Straight
  Arrow start dropdown                   Line style dropdown (solid/dashed/dotted)   Stroke width (pt)
  Arrow end dropdown                     Diagonal line icon (orientation toggle)
  Size:  [6 pt] start   [6 pt] end
  Spacing: [0 pt] start  [0 pt] end
                         Line start       Line end (labels)

Section: LINE JUMPS
  Toggle for showing arc over intersecting lines

Opacity: [100 %] slider

Section: EFFECTS
  [ Edit ] button — open advanced style dialog
```

---

## Part 11 — Keyboard Shortcuts for Lines

```
Escape         — Cancel drawing in progress
Delete         — Delete selected connection
Backspace      — Delete selected connection
Ctrl+Z         — Undo last waypoint placement while drawing
Ctrl+D         — Duplicate selected connection
Tab            — Select next connection
Shift+click    — Add connection to selection (multi-select)
```

---

## Part 12 — Connection Lines per Diagram Type

Each diagram type from the shapes spec uses these line types. Map them here:

| Diagram | Connection ID | routing | strokeDash | markerStart | markerEnd |
|---------|--------------|---------|------------|-------------|-----------|
| Class | `class_association` | sharp | [] | none | none |
| Class | `class_inheritance` | sharp | [] | none | hollow-arrow |
| Class | `class_realization` | sharp | [6,3] | none | hollow-arrow |
| Class | `class_dependency` | sharp | [6,3] | none | arrow |
| Class | `class_aggregation` | sharp | [] | diamond | none |
| Class | `class_composition` | sharp | [] | filled-diamond | none |
| Object | `object_link` | sharp | [] | none | none |
| Component | `component_dependency` | sharp | [6,3] | none | arrow |
| Component | `component_usage` | sharp | [6,3] | none | arrow |
| Deployment | `deploy_comm_path` | sharp | [] | none | none |
| Deployment | `deploy_dependency` | sharp | [6,3] | none | arrow |
| Package | `package_merge` | sharp | [6,3] | none | hollow-arrow |
| Package | `package_import` | sharp | [6,3] | none | hollow-arrow |
| Package | `package_containment` | sharp | [] | circle | none |
| Use Case | `usecase_association` | sharp | [] | none | none |
| Use Case | `usecase_include` | sharp | [6,3] | none | arrow |
| Use Case | `usecase_extend` | sharp | [6,3] | none | arrow |
| Use Case | `usecase_generalization` | sharp | [] | none | hollow-arrow |
| Sequence | `seq_sync_msg` | straight | [] | none | arrow |
| Sequence | `seq_async_msg` | straight | [] | none | arrow |
| Sequence | `seq_return_msg` | straight | [6,3] | none | arrow |
| Activity | `act_flow` | sharp | [] | none | arrow |
| State | `state_transition` | curved | [] | none | arrow |
| Communication | `comm_message` | sharp | [] | none | arrow |
| Communication | `comm_self_link` | curved | [] | none | arrow |
| ER | `er_total_participation` | sharp | [] | none | none |
| ER | `er_partial_participation` | sharp | [] | none | none |
| DFD | `dfd_flow` | sharp | [] | none | arrow |
| Context | `ctx_flow` | sharp | [] | none | arrow |

---

## Part 13 — Implementation Checklist

Make sure every item below is working before considering this feature complete:

- [ ] Click-to-place waypoints on empty canvas
- [ ] Live preview segment follows cursor while placing
- [ ] Coordinate tooltip shown while drawing
- [ ] Double-click finishes the line
- [ ] Escape cancels drawing
- [ ] Sharp routing renders correctly (polyline)
- [ ] Curved routing renders correctly (Catmull-Rom)
- [ ] Straight routing renders as single line
- [ ] Routing toggle button in floating toolbar works
- [ ] Selected line shows endpoint handles (large cyan dots)
- [ ] Selected line shows midpoint ghost handles (small cyan dots)
- [ ] Dragging a midpoint handle INSERTS new waypoint
- [ ] Dragging an existing waypoint handle MOVES it
- [ ] Dragging endpoint SNAPS to shape ports within 12px
- [ ] Hovering a shape shows connection ports
- [ ] Connected line endpoint FOLLOWS shape when shape is moved
- [ ] Floating mini toolbar appears near selected line
- [ ] Label rendered at midpoint of line
- [ ] Double-click line to edit label inline
- [ ] Right-click waypoint shows delete option
- [ ] All SVG markers render correctly (arrow, hollow-arrow, diamond, filled-diamond, circle)
- [ ] Stroke dash patterns render correctly (solid, dashed, dotted)
- [ ] Line jumps arc renders at crossing points
- [ ] Keyboard shortcuts work (Delete, Escape, Ctrl+Z)
- [ ] All diagram-specific connection types use correct markerStart/End and strokeDash
