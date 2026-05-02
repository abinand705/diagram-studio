# Diagram Tool — Complete Implementation Spec
## Shapes + Connection Lines for All 13 Diagram Types

> **Instructions for AI Coding Assistant:**
> Read this entire file before writing any code. Implement every section in order.
> This file is the single source of truth for all shapes, connections, and interactions.

---

# PART A — CORE DATA MODELS

## A1. Shape Object

```js
{
  id: string,               // unique, e.g. "shape_001"
  definitionId: string,     // refers to shape type, e.g. "class_box"
  diagramType: string,      // e.g. "Class Diagram"
  x: number,                // top-left x on canvas
  y: number,                // top-left y on canvas
  width: number,            // current width in px
  height: number,           // current height in px
  fill: string,             // fill color, e.g. "#ffffff"
  stroke: string,           // border color, e.g. "#000000"
  strokeWidth: number,      // border thickness in px
  strokeDash: number[],     // [] = solid | [6,3] = dashed | [2,2] = dotted
  label: string,            // primary text
  labelPosition: string,    // "inside" | "top" | "bottom" | "none"
  compartments: string[],   // text for each compartment, e.g. ["name", "attrs", "methods"]
  opacity: number,          // 0–100
  zIndex: number,           // render order
  ports: Port[]             // computed from bounds, see A3
}
```

## A2. Connection Object

```js
{
  id: string,                    // unique, e.g. "conn_001"
  definitionId: string,          // e.g. "class_inheritance"
  diagramType: string,
  sourceShapeId: string | null,  // null = floating start
  targetShapeId: string | null,  // null = floating end
  sourcePortIndex: number | null,// 0=top 1=right 2=bottom 3=left
  targetPortIndex: number | null,
  points: { x: number, y: number }[], // ALL points: [start, ...waypoints, end]
  routing: "sharp" | "curved" | "straight",
  stroke: string,
  strokeWidth: number,
  strokeDash: number[],
  markerStart: MarkerType,       // "none"|"arrow"|"hollow-arrow"|"diamond"|"filled-diamond"|"circle"
  markerEnd: MarkerType,
  label: string,
  labelOffsetX: number,
  labelOffsetY: number,
  opacity: number
}
```

## A3. Port (Connection Point on a Shape)

```js
// Computed from shape bounds — do NOT store, derive on render
function getPorts(shape) {
  const { x, y, width: w, height: h } = shape;
  return [
    { index: 0, x: x + w / 2, y: y },         // top-center
    { index: 1, x: x + w,     y: y + h / 2 }, // right-center
    { index: 2, x: x + w / 2, y: y + h },     // bottom-center
    { index: 3, x: x,         y: y + h / 2 }, // left-center
  ];
}

// For ellipses use:
function getEllipsePorts(shape) {
  const cx = shape.x + shape.width / 2;
  const cy = shape.y + shape.height / 2;
  const rx = shape.width / 2, ry = shape.height / 2;
  return [
    { index: 0, x: cx,      y: cy - ry },
    { index: 1, x: cx + rx, y: cy      },
    { index: 2, x: cx,      y: cy + ry },
    { index: 3, x: cx - rx, y: cy      },
  ];
}
```

---

# PART B — SHAPE DEFINITIONS (All 13 Diagram Types)

Each entry is a **shape definition** (the template). Actual instances use the
Shape Object from A1 with these as defaults.

## B1. Class Diagram

### class_box — Class
```
svgShape:     "rect"
defaultSize:  160 × 80
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "ClassName"
labelPos:     "top"
compartments: 3   (row 1 = name, row 2 = attributes, row 3 = methods)
hasCompartments: true

DRAW: rect, then draw 2 horizontal divider lines inside at h/3 and 2h/3.
      Each compartment scrolls independently if content overflows.
```

### interface_box — Interface
```
svgShape:     "rect"
defaultSize:  160 × 70
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "«interface»\nInterfaceName"
labelPos:     "top"
compartments: 2   (name+stereotype | methods)
```

### abstract_class — Abstract Class
```
Same as class_box but label text is rendered in ITALIC.
```

### class_enumeration — Enumeration
```
svgShape:     "rect"
defaultSize:  140 × 80
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "«enumeration»\nEnumName"
compartments: 2
```

---

## B2. Object Diagram

### object_box — Object
```
svgShape:     "rect"
defaultSize:  160 × 60
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "objName : ClassName"   ← render UNDERLINED
labelPos:     "top"
compartments: 2   (name | attribute values)
```

---

## B3. Component Diagram

### component_box — Component
```
svgShape:     "custom"
defaultSize:  160 × 80
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "«component»\nComponentName"
labelPos:     "inside"

DRAW:
  1. Draw main rect (x, y, w, h)
  2. Draw two small rectangles protruding from the LEFT edge at 1/3 and 2/3 height:
     each small rect: width=16, height=10, x = x - 8 (half outside), centered on position
```

### provided_interface — Provided Interface (Lollipop)
```
svgShape:     "custom"
defaultSize:  40 × 40
label:        "Interface"   labelPos: "bottom"

DRAW:
  1. Line from (cx, y) down to (cx, cy)
  2. Small circle at (cx, cy+10), radius 8, fill=white, stroke=#000
```

### required_interface — Required Interface (Socket)
```
svgShape:     "custom"
defaultSize:  40 × 40
label:        "Interface"   labelPos: "bottom"

DRAW:
  1. Line from (cx, y) down to (cx, cy)
  2. Arc (half-circle opening right) at end: use SVG arc command
     d="M cx cy-10 A 10 10 0 0 1 cx cy+10"
```

---

## B4. Deployment Diagram

### deploy_node — Node (3D Box)
```
svgShape:     "custom"
defaultSize:  160 × 100
fill:         #f5f5f5   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "«node»\nNodeName"
labelPos:     "inside"

DRAW (3D perspective box, offset = 18px right, 12px up):
  Front face rect:   (x, y+12, w-18, h-12)
  Top face polygon:  (x, y+12) → (x+18, y) → (x+w, y) → (x+w-18, y+12)
  Right face polygon:(x+w-18, y+12) → (x+w, y) → (x+w, y+h-12) → (x+w-18, y+h)
  All faces same fill and stroke.
```

### deploy_artifact — Artifact (Dog-ear)
```
svgShape:     "custom"
defaultSize:  120 × 60
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "«artifact»\nFileName"
labelPos:     "inside"

DRAW (dog-ear fold at top-right, fold_size = 14):
  Outer polygon: (x,y) → (x+w-14,y) → (x+w,y+14) → (x+w,y+h) → (x,y+h) → close
  Fold triangle: (x+w-14,y) → (x+w,y+14) → (x+w-14,y+14) → close, fill=same, stroke=same
```

### deploy_device — Device
```
Same as deploy_node but label starts with "«device»"
```

### deploy_exec_env — Execution Environment
```
svgShape:     "rect"   (with rounded corners, radius=6)
defaultSize:  180 × 110
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "«executionEnvironment»\nEnvName"
labelPos:     "top"
```

---

## B5. Package Diagram

### package_box — Package (Folder)
```
svgShape:     "custom"
defaultSize:  180 × 120
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "PackageName"
labelPos:     "inside" (centered in body rect)

DRAW:
  Tab rect (top-left):  (x, y, 70, 22) — smaller rectangle like a folder tab
  Body rect (main):     (x, y+22, w, h-22)
  No fill difference between tab and body.
```

---

## B6. Use Case Diagram

### usecase_boundary — System Boundary
```
svgShape:     "rect"
defaultSize:  400 × 300
fill:         none (transparent)   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "System"
labelPos:     "top"
```

### usecase_actor — Actor (Stick Figure)
```
svgShape:     "custom"
defaultSize:  40 × 80
fill:         none   stroke: #000000   strokeWidth: 1.5   strokeDash: []
label:        "Actor"
labelPos:     "bottom"

DRAW (all relative to center x = cx, top y = y):
  Head:   circle at (cx, y+10), radius 10
  Body:   line from (cx, y+20) to (cx, y+48)
  Arms:   line from (cx-16, y+32) to (cx+16, y+32)
  Leg L:  line from (cx, y+48) to (cx-14, y+68)
  Leg R:  line from (cx, y+48) to (cx+14, y+68)
```

### usecase_ellipse — Use Case
```
svgShape:     "ellipse"
defaultSize:  130 × 50
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "Use Case"
labelPos:     "inside"
```

---

## B7. Sequence Diagram

### seq_lifeline — Lifeline
```
svgShape:     "custom"
defaultSize:  100 × 300
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        ":ClassName"
labelPos:     "top"

DRAW:
  Head rect:    (x, y, w, 40) — solid rect with label inside
  Dashed line:  from (x+w/2, y+40) straight down to (x+w/2, y+height)
                strokeDash: [6, 4]
```

### seq_activation — Activation Box
```
svgShape:     "rect"
defaultSize:  16 × 60
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        ""
labelPos:     "none"
NOTE: Place centered on the lifeline dashed line, at the y-position of the message.
```

### seq_combined_fragment — Combined Fragment
```
svgShape:     "custom"
defaultSize:  220 × 140
fill:         none   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "alt"   (operator: alt | opt | loop | par | ref | break)
labelPos:     "none"

DRAW:
  Main rect: (x, y, w, h)
  Pentagon label box at top-left: polygon (x,y)→(x+50,y)→(x+50,y+22)→(x+40,y+30)→(x,y+30)
  Operator text centered inside pentagon box.
  Dashed divider line inside for "alt" (separates [condition] branches):
    horizontal dashed line at mid-height
```

---

## B8. Activity Diagram

### act_initial — Initial Node
```
svgShape:     "ellipse"
defaultSize:  20 × 20
fill:         #000000   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        ""   labelPos: "none"
```

### act_final — Final Node
```
svgShape:     "custom"
defaultSize:  24 × 24
DRAW:
  Outer circle: radius 12, fill=none, stroke=#000
  Inner circle: radius 8,  fill=#000, stroke=none
```

### act_action — Action
```
svgShape:     "rect"   (border-radius: 20px — pill-like rounded)
defaultSize:  130 × 50
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "Action"
labelPos:     "inside"
```

### act_decision — Decision / Merge
```
svgShape:     "polygon"
defaultSize:  60 × 40
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        ""   labelPos: "none"
points:       4-point diamond: top, right, bottom, left midpoints
```

### act_fork_h — Fork / Join (Horizontal)
```
svgShape:     "rect"
defaultSize:  120 × 8
fill:         #000000   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        ""   labelPos: "none"
```

### act_fork_v — Fork / Join (Vertical)
```
svgShape:     "rect"
defaultSize:  8 × 120
fill:         #000000   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        ""   labelPos: "none"
```

### act_swimlane — Swimlane
```
svgShape:     "rect"
defaultSize:  180 × 400
fill:         none   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "Lane Name"
labelPos:     "top"
NOTE: Label rotated 0° at top, or optionally vertical on left side.
```

### act_send_signal — Send Signal (Pentagon pointing right)
```
svgShape:     "polygon"
defaultSize:  110 × 50
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "Signal"   labelPos: "inside"
points:       (x,y) → (x+w-20,y) → (x+w,y+h/2) → (x+w-20,y+h) → (x,y+h)
```

### act_receive_signal — Receive Signal (Concave left)
```
svgShape:     "polygon"
defaultSize:  110 × 50
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "Signal"   labelPos: "inside"
points:       (x,y) → (x+w,y) → (x+w,y+h) → (x,y+h) → (x+20,y+h/2)
```

### act_object_node — Object Node
```
svgShape:     "rect"
defaultSize:  120 × 40
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "ObjectName"   labelPos: "inside"
```

---

## B9. State Machine Diagram

### state_initial — Initial Pseudostate
```
svgShape:     "ellipse"
defaultSize:  20 × 20
fill:         #000000   stroke: #000000
label:        ""   labelPos: "none"
```

### state_final — Final State (Bullseye)
```
svgShape:     "custom"
defaultSize:  26 × 26
DRAW:
  Outer circle: radius 13, fill=none, stroke=#000, strokeWidth=2
  Inner circle: radius 8,  fill=#000
```

### state_simple — Simple State
```
svgShape:     "rect"   (border-radius: 16px)
defaultSize:  130 × 60
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "StateName"   labelPos: "inside"
```

### state_composite — Composite State
```
svgShape:     "rect"   (border-radius: 16px)
defaultSize:  220 × 130
fill:         #f9f9f9   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "CompositeState"   labelPos: "top"
NOTE: Draw an inner dashed border rect at (x+8, y+30, w-16, h-38) to show the inner region.
```

### state_choice — Choice Pseudostate
```
svgShape:     "polygon"
defaultSize:  40 × 40
fill:         #ffffff   stroke: #000000
points:       diamond (same as act_decision)
```

### state_history — History Pseudostate
```
svgShape:     "custom"
defaultSize:  30 × 30
DRAW:
  Circle: radius 14, fill=white, stroke=#000
  Text "H" centered inside (or "H*" for deep history)
```

### state_fork — Fork / Join Bar
```
Same as act_fork_h. Use vertical (act_fork_v) for vertical orientation.
```

---

## B10. Communication Diagram

### comm_object — Object Box
```
svgShape:     "rect"
defaultSize:  150 × 50
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "obj : Class"   ← render UNDERLINED
labelPos:     "inside"
```

---

## B11. ER Diagram

### er_entity — Entity
```
svgShape:     "rect"
defaultSize:  120 × 50
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "Entity"   labelPos: "inside"
```

### er_weak_entity — Weak Entity (Double Rectangle)
```
svgShape:     "custom"
defaultSize:  120 × 50
DRAW:
  Outer rect: (x, y, w, h)
  Inner rect: (x+4, y+4, w-8, h-8)   same stroke, no fill change
```

### er_attribute — Attribute
```
svgShape:     "ellipse"
defaultSize:  100 × 40
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "attribute"   labelPos: "inside"
```

### er_multivalued_attr — Multivalued Attribute (Double Ellipse)
```
svgShape:     "custom"
defaultSize:  100 × 40
DRAW:
  Outer ellipse: (cx, cy, rx, ry)
  Inner ellipse: (cx, cy, rx-5, ry-5)
```

### er_derived_attr — Derived Attribute (Dashed Ellipse)
```
svgShape:     "ellipse"
defaultSize:  100 × 40
fill:         #ffffff   stroke: #000000   strokeDash: [4,3]
label:        "/attribute"   labelPos: "inside"
```

### er_key_attr — Key Attribute
```
svgShape:     "ellipse"
defaultSize:  100 × 40
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "key"   ← render UNDERLINED
labelPos:     "inside"
```

### er_relationship — Relationship Diamond
```
svgShape:     "polygon"
defaultSize:  110 × 60
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "relates"   labelPos: "inside"
points:       diamond (top, right, bottom, left)
```

### er_weak_relationship — Weak Relationship (Double Diamond)
```
svgShape:     "custom"
defaultSize:  110 × 60
DRAW:
  Outer diamond polygon
  Inner diamond polygon (inset by 5px on all sides)
```

---

## B12. DFD (Data Flow Diagram)

### dfd_external — External Entity
```
svgShape:     "rect"
defaultSize:  100 × 50
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "External"   labelPos: "inside"
```

### dfd_process — Process (Yourdon)
```
svgShape:     "ellipse"
defaultSize:  90 × 90
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "Process"   labelPos: "inside"
```

### dfd_datastore — Data Store (Open Rectangle)
```
svgShape:     "custom"
defaultSize:  150 × 40
fill:         #ffffff   stroke: #000000   strokeWidth: 1   strokeDash: []
label:        "D1 | Store Name"   labelPos: "inside"

DRAW (open-ended rect — right side is open):
  Top line:    M x y  H x+w
  Left line:   M x y  V y+h
  Bottom line: M x y+h  H x+w
  Inner divider line (for numbering):  M x+30 y  V y+h
  (No right-side line drawn — intentionally open)
```

---

## B13. Context Diagram

### ctx_process — Central Process
```
svgShape:     "ellipse"
defaultSize:  140 × 140
fill:         #ffffff   stroke: #000000   strokeWidth: 1.5   strokeDash: []
label:        "System"   labelPos: "inside"
NOTE: There is only ONE of these per Context Diagram, placed at the center.
```

### ctx_external — External Entity
```
Same as dfd_external.
```

---

# PART C — CONNECTION LINES

## C1. How Lines Work (Behavior from Video)

These behaviors were observed directly and must be implemented exactly:

### Drawing a New Line (Click-to-Place)
```
1. User selects Line tool → canvas enters DRAWING mode
2. First click on canvas: places the START point (points[0])
3. Every subsequent click: pushes a new WAYPOINT to points[]
4. A live preview segment follows the cursor between the last placed point and the cursor
5. Double-click OR press Enter: places the final END point and FINISHES the line
6. Press Escape: cancels drawing, removes the in-progress line

VISUAL DURING DRAWING:
  - All placed points shown as filled cyan circles, radius 5px
  - Live segment: thin line from last point to cursor
  - Coordinate tooltip near cursor: "{deltaX}, {deltaY} ({distance})"
    e.g. "-280, 340 (677)"
  - Grid snap: all placed points snap to 10px grid
```

### Line Routing (Three Modes — toggle in toolbar)
```
SHARP (default):
  Hard-angle bends at every waypoint.
  SVG: M x0 y0 L x1 y1 L x2 y2 ... L xn yn

CURVED:
  Smooth Catmull-Rom spline through all waypoints.
  Convert to cubic bezier:
    for each segment i → i+1:
      p0 = points[i-1] (or points[i] if first)
      p1 = points[i]
      p2 = points[i+1]
      p3 = points[i+2] (or points[i+1] if last)
      cp1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 }
      cp2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 }
  SVG: M x0 y0 C cp1x cp1y cp2x cp2y x1 y1 C ...

STRAIGHT:
  Single direct line from start to end, ignores waypoints.
  SVG: M x0 y0 L xn yn
```

### Selected Line Handles
```
When a line is selected:

  ENDPOINT HANDLES (large):
    Filled cyan circles, radius 6px at points[0] and points[last]
    Drag to move the endpoint.
    If dragged near a shape port (within 12px): SNAP and attach to that port.
    After attachment: endpoint automatically follows shape when shape moves.

  WAYPOINT HANDLES (medium):
    Filled cyan circles, radius 5px at each intermediate points[i]
    Drag to reposition that waypoint.

  MIDPOINT GHOST HANDLES (small):
    Filled cyan circles, radius 4px at the midpoint of each SEGMENT
    (midpoint between consecutive points)
    Drag to INSERT a new waypoint at that position.
    The ghost handle splits into two new segments.

  FLOATING MINI TOOLBAR (appears near the selected line):
    [ ✏ ] — click to edit label (opens inline text input at label position)
    [ L ] — click to cycle routing: sharp → curved → straight → sharp
```

### Waypoint Interaction Details
```
Double-click anywhere on a line segment → inserts new waypoint at that position
Right-click on a waypoint → context menu: "Delete Waypoint"
Deleting a waypoint reconnects its two neighboring points directly.
```

### Shape Connection Ports
```
SHOW PORTS WHEN:
  - Mouse hovers within 20px of any shape edge
  - User is actively dragging a line endpoint

PORT POSITIONS:
  Rect shapes:    top-center, right-center, bottom-center, left-center
  Ellipse shapes: top (0°), right (90°), bottom (180°), left (270°)
  Custom shapes:  same as bounding rect

PORT VISUAL:
  Normal:    circle, radius 5px, stroke=#00AAFF, fill=white
  Hovered:   circle, radius 6px, fill=#00AAFF
  Snap-ready (endpoint dragged near it, threshold 12px):
             circle, radius 8px, fill=#00FF88 (green), ring glow

ON SNAP:
  Record sourceShapeId + sourcePortIndex (or target)
  When shape moves: re-derive endpoint from shape.x/y + port formula
```

### Line Label
```
Position: at the geometric midpoint of the path (arc-length / 2)
Style:     small white background pill, 12px font, sits 10px above the line
Edit:      double-click the line opens inline <input> at label position
Drag:      user can drag label to adjust labelOffsetX / labelOffsetY
```

### Line Jumps (Crossings)
```
When two lines cross, draw a small arc (radius 6px) on the UPPER line
at each intersection, creating a visual "jump over" the lower line.
This can be toggled globally.
```

---

## C2. SVG Marker Definitions

Place these inside `<defs>` in your SVG layer. Reference via marker-start / marker-end.

```svg
<defs>

  <!-- Filled arrow (standard) -->
  <marker id="mk-arrow" markerWidth="10" markerHeight="7"
          refX="9" refY="3.5" orient="auto">
    <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke" />
  </marker>

  <!-- Open / hollow arrow (UML inheritance) -->
  <marker id="mk-hollow-arrow" markerWidth="12" markerHeight="8"
          refX="11" refY="4" orient="auto">
    <polygon points="0 0, 11 4, 0 8"
             fill="white" stroke="context-stroke" stroke-width="1" />
  </marker>

  <!-- Hollow diamond (aggregation) -->
  <marker id="mk-diamond" markerWidth="14" markerHeight="8"
          refX="13" refY="4" orient="auto">
    <polygon points="0 4, 6 0, 13 4, 6 8"
             fill="white" stroke="context-stroke" stroke-width="1" />
  </marker>

  <!-- Filled diamond (composition) -->
  <marker id="mk-filled-diamond" markerWidth="14" markerHeight="8"
          refX="13" refY="4" orient="auto">
    <polygon points="0 4, 6 0, 13 4, 6 8" fill="context-stroke" />
  </marker>

  <!-- Circle (containment) -->
  <marker id="mk-circle" markerWidth="10" markerHeight="10"
          refX="5" refY="5" orient="auto">
    <circle cx="5" cy="5" r="4" fill="white" stroke="context-stroke" stroke-width="1" />
  </marker>

</defs>
```

---

## C3. Connection Definitions per Diagram Type

### Class Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `class_association` | Association | sharp | [] | none | none |
| `class_directed_assoc` | Directed Association | sharp | [] | none | arrow |
| `class_inheritance` | Inheritance / Generalization | sharp | [] | none | hollow-arrow |
| `class_realization` | Realization | sharp | [6,3] | none | hollow-arrow |
| `class_dependency` | Dependency | sharp | [6,3] | none | arrow |
| `class_aggregation` | Aggregation | sharp | [] | diamond | none |
| `class_composition` | Composition | sharp | [] | filled-diamond | none |

### Object Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `object_link` | Link | sharp | [] | none | none |

### Component Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `comp_dependency` | Dependency | sharp | [6,3] | none | arrow |
| `comp_usage` | Usage | sharp | [6,3] | none | arrow |
| `comp_realization` | Realization | sharp | [6,3] | none | hollow-arrow |

### Deployment Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `deploy_comm_path` | Communication Path | sharp | [] | none | none |
| `deploy_dependency` | Deploy Dependency | sharp | [6,3] | none | arrow |
| `deploy_manifest` | Manifest | sharp | [6,3] | none | arrow |

### Package Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `pkg_merge` | Package Merge | sharp | [6,3] | none | hollow-arrow |
| `pkg_import` | Package Import | sharp | [6,3] | none | hollow-arrow |
| `pkg_containment` | Containment | sharp | [] | circle | none |
| `pkg_dependency` | Dependency | sharp | [6,3] | none | arrow |

### Use Case Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `uc_association` | Association | sharp | [] | none | none |
| `uc_include` | «include» | sharp | [6,3] | none | arrow |
| `uc_extend` | «extend» | sharp | [6,3] | none | arrow |
| `uc_generalization` | Generalization | sharp | [] | none | hollow-arrow |

### Sequence Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `seq_sync` | Synchronous Call | straight | [] | none | arrow |
| `seq_async` | Asynchronous | straight | [] | none | arrow |
| `seq_return` | Return | straight | [6,3] | none | arrow |
| `seq_create` | Create | straight | [6,3] | none | arrow |
| `seq_destroy` | Destroy | straight | [] | none | arrow |

### Activity Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `act_flow` | Control Flow | sharp | [] | none | arrow |
| `act_object_flow` | Object Flow | sharp | [] | none | arrow |
| `act_exception` | Exception | sharp | [4,3] | none | arrow |

### State Machine Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `state_transition` | Transition | curved | [] | none | arrow |
| `state_internal` | Internal Transition | straight | [4,3] | none | none |

### Communication Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `comm_link` | Link | sharp | [] | none | none |
| `comm_message` | Message (numbered) | sharp | [] | none | arrow |
| `comm_self` | Self Message | curved | [] | none | arrow |

### ER Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `er_partial` | Partial Participation | sharp | [] | none | none |
| `er_total` | Total Participation | sharp | [] | none | none |
| `er_attr_link` | Attribute Link | sharp | [] | none | none |

> **Note for er_total:** Render as DOUBLE LINE (two parallel lines 3px apart), not a single stroke.
> ```svg
> <line x1 y1 x2 y2 stroke="#000" stroke-width="1" />
> <line x1' y1' x2' y2' stroke="#000" stroke-width="1" />
> (offset the second line by 3px perpendicular to the direction)
> ```

### DFD

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `dfd_flow` | Data Flow | sharp | [] | none | arrow |

### Context Diagram

| id | label | routing | strokeDash | markerStart | markerEnd |
|----|-------|---------|------------|-------------|-----------|
| `ctx_flow` | Data Flow | sharp | [] | none | arrow |

---

# PART D — INTERACTION & UX RULES

## D1. Shape Interactions

```
HOVER (over any shape):
  - Show connection port dots at all 4 edge midpoints
  - Show a faint blue highlight on the border

CLICK (select):
  - Show 8 resize handles: 4 corners + 4 edge midpoints (filled squares, 8×8px)
  - Show bounding box highlight

DRAG (move):
  - Shape moves with cursor, snaps to 10px grid
  - All attached connection endpoints follow automatically
  - Show {x, y} coordinate tooltip near cursor while dragging

RESIZE (drag a handle):
  - Shape resizes, ports recompute from new bounds
  - Connected line endpoints re-derive from new port positions
  - Minimum size: 20 × 20px

DOUBLE-CLICK:
  - Open inline text editor for the label
  - For compartmented shapes: double-click a specific compartment to edit that section
  - Press Enter to confirm, Escape to cancel

RIGHT-CLICK:
  Context menu:
    Copy | Paste | Delete | Edit Style | Bring to Front | Send to Back
    Add Connection | Edit Label
```

## D2. Canvas Interactions

```
GRID: 10px dot grid, visible by default
SNAP: shapes and waypoints snap to 10px grid while dragging
PAN: middle-click + drag, or Space + drag
ZOOM: Ctrl+scroll, or pinch on trackpad
SELECT ALL: Ctrl+A
UNDO: Ctrl+Z
REDO: Ctrl+Y or Ctrl+Shift+Z
DELETE selected: Delete or Backspace
MULTI-SELECT: Shift+click or drag selection rectangle on empty canvas
COPY/PASTE: Ctrl+C / Ctrl+V (paste at slight offset)
```

## D3. Z-Order Rules

```
Render order (bottom to top):
  1. Grid
  2. Swimlane / boundary shapes (always at back)
  3. All connection lines
  4. All shapes (boxes, ellipses, etc.)
  5. Selection handles and port indicators
  6. Floating toolbar
  7. Tooltip / coordinate readout
```

## D4. Right Panel (Properties)

When a shape is selected, show:
```
Section: STYLE
  Fill color picker
  Stroke color picker
  Stroke width (number input, pt)
  Stroke style dropdown: solid | dashed | dotted
  Border radius (for rect shapes)
  Opacity slider 0–100%

Section: TEXT
  Label text input
  Font size, bold, italic, underline toggles
  Text alignment: left | center | right

Section: ARRANGE
  X, Y position inputs
  W, H size inputs
  [ Bring to Front ] [ Send to Back ]
```

When a connection is selected, show:
```
Section: LINE
  Routing dropdown: Sharp | Curved | Straight
  Stroke color picker
  Stroke width
  Stroke style: solid | dashed | dotted
  Marker Start dropdown: none | arrow | hollow-arrow | diamond | filled-diamond | circle
  Marker End dropdown: (same options)
  Arrow size: start (pt) | end (pt)

Section: LINE JUMPS
  Toggle checkbox

Opacity slider
```

---

# PART E — IMPLEMENTATION CHECKLIST

Work through this list top to bottom. Mark each item done before moving to the next.

### Shapes
- [ ] Implement Shape data model (Part A1)
- [ ] Implement Port computation (Part A3)
- [ ] Render: rect (with optional border-radius)
- [ ] Render: ellipse
- [ ] Render: polygon (diamond, pentagons)
- [ ] Render: custom — class compartments (3-section rect with divider lines)
- [ ] Render: custom — component box with side tabs
- [ ] Render: custom — deploy_node 3D box
- [ ] Render: custom — deploy_artifact dog-ear
- [ ] Render: custom — package_box folder shape
- [ ] Render: custom — usecase_actor stick figure
- [ ] Render: custom — seq_lifeline (head rect + dashed vertical)
- [ ] Render: custom — seq_combined_fragment (rect + pentagon label)
- [ ] Render: custom — act_final / state_final bullseye
- [ ] Render: custom — state_history circle + H
- [ ] Render: custom — er_weak_entity double rect
- [ ] Render: custom — er_weak_relationship double diamond
- [ ] Render: custom — er_multivalued double ellipse
- [ ] Render: custom — dfd_datastore open-ended rect
- [ ] Render: custom — provided_interface lollipop
- [ ] Render: custom — required_interface socket

### Connections
- [ ] Implement Connection data model (Part A2)
- [ ] Click-to-place waypoints on canvas
- [ ] Live preview segment during drawing
- [ ] Coordinate tooltip while drawing
- [ ] Double-click to finish line
- [ ] Escape to cancel drawing
- [ ] Sharp routing (polyline L commands)
- [ ] Curved routing (Catmull-Rom → bezier C commands)
- [ ] Straight routing (single L command)
- [ ] All 5 SVG markers defined in <defs>
- [ ] marker-start and marker-end applied correctly per connection type
- [ ] strokeDash applied correctly (solid / dashed / dotted)
- [ ] Double-line rendering for er_total

### Interaction
- [ ] Shape hover shows port dots
- [ ] Line endpoint drag snaps to port (green highlight at 12px threshold)
- [ ] Connected endpoint follows shape on move
- [ ] Selected line: large endpoint handles
- [ ] Selected line: medium waypoint handles
- [ ] Selected line: small midpoint ghost handles (insert waypoint on drag)
- [ ] Floating mini toolbar on line select (routing toggle + label edit)
- [ ] Double-click segment inserts waypoint
- [ ] Right-click waypoint → delete
- [ ] Shape selection handles (8 corners+edges)
- [ ] Shape resize with connected line endpoint follow
- [ ] Shape drag with grid snap
- [ ] Double-click shape/compartment → inline label edit
- [ ] Line label at midpoint, draggable
- [ ] Double-click line → edit label
- [ ] Line jumps arcs at crossings
- [ ] Right-panel updates when shape or line selected
- [ ] Undo / Redo (Ctrl+Z / Ctrl+Y)
- [ ] Delete selected (Delete key)
- [ ] Multi-select (Shift+click, drag rect)
- [ ] Copy / Paste (Ctrl+C / Ctrl+V)
