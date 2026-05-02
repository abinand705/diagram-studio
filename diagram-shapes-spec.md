# Diagram Shapes Specification
## Instruction for AI Coding Assistant

You are helping build a **web-based diagram drawing tool**. Your task is to implement
all the shapes listed below for each diagram type. For every shape, add it to the
application's shape registry with the exact properties defined.

---

## How to Add Each Shape

Each shape must be registered with this data structure:

```js
{
  id: string,           // unique key, e.g. "class_box"
  name: string,         // display label in the UI
  diagram: string,      // which diagram type it belongs to
  svgShape: string,     // "rect" | "ellipse" | "polygon" | "path" | "line" | "custom"
  width: number,        // default width in px
  height: number,       // default height in px
  fill: string,         // default fill color
  stroke: string,       // border color
  strokeWidth: number,  // border thickness
  strokeDash: number[], // [] = solid, [6,3] = dashed, [2,2] = dotted
  label: string,        // default text inside/on shape
  labelPosition: string,// "inside" | "top" | "bottom" | "none"
  compartments: number, // 0 = none, 2 = two sections, 3 = three sections
  isConnector: boolean, // true = this is a line/arrow, not a box
  markerStart: string,  // "none"|"arrow"|"hollow-arrow"|"diamond"|"filled-diamond"|"circle"
  markerEnd: string,    // same options as markerStart
  notes: string         // brief description for developer reference
}
```

---

## 1. Class Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `class_box` | Class | rect | 160 | 80 | #fff | #000 | [] | ClassName | top | 3 | false | none | none | Name / attributes / methods compartments |
| `interface_box` | Interface | rect | 160 | 80 | #fff | #000 | [] | «interface» | top | 2 | false | none | none | Stereotype label + methods |
| `abstract_class` | Abstract Class | rect | 160 | 80 | #fff | #000 | [] | *AbstractName* | top | 3 | false | none | none | Italic name |
| `class_association` | Association | line | 120 | 0 | none | #000 | [] | | none | 0 | true | none | none | Plain line |
| `class_inheritance` | Inheritance | line | 120 | 0 | none | #000 | [] | | none | 0 | true | none | hollow-arrow | Hollow triangle arrowhead at parent |
| `class_realization` | Realization | line | 120 | 0 | none | #000 | [6,3] | | none | 0 | true | none | hollow-arrow | Dashed + hollow triangle |
| `class_dependency` | Dependency | line | 120 | 0 | none | #000 | [6,3] | | none | 0 | true | none | arrow | Dashed open arrow |
| `class_aggregation` | Aggregation | line | 120 | 0 | none | #000 | [] | | none | 0 | true | hollow-diamond | none | Hollow diamond at whole end |
| `class_composition` | Composition | line | 120 | 0 | none | #000 | [] | | none | 0 | true | filled-diamond | none | Filled diamond at whole end |

---

## 2. Object Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `object_box` | Object | rect | 160 | 60 | #fff | #000 | [] | objName:ClassName | top | 2 | false | none | none | Underlined name in top section |
| `object_link` | Link | line | 120 | 0 | none | #000 | [] | | none | 0 | true | none | none | Plain line between objects |

---

## 3. Component Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `component_box` | Component | custom | 160 | 80 | #fff | #000 | [] | «component» | inside | 0 | false | none | none | Rect with two small rectangles on left edge |
| `provided_interface` | Provided Interface | custom | 20 | 20 | none | #000 | [] | | bottom | 0 | false | none | none | Lollipop: line + small filled circle |
| `required_interface` | Required Interface | custom | 20 | 20 | none | #000 | [] | | bottom | 0 | false | none | none | Socket: line + half-circle (open arc) |
| `component_dependency` | Dependency | line | 120 | 0 | none | #000 | [6,3] | | none | 0 | true | none | arrow | Dashed arrow |
| `component_usage` | Usage | line | 120 | 0 | none | #000 | [6,3] | «use» | none | 0 | true | none | arrow | Dashed arrow with «use» label |

---

## 4. Deployment Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `deploy_node` | Node | custom | 160 | 100 | #f5f5f5 | #000 | [] | «node» NodeName | top | 0 | false | none | none | 3D box: rect + top parallelogram face + right parallelogram face |
| `deploy_artifact` | Artifact | custom | 120 | 60 | #fff | #000 | [] | «artifact» | top | 0 | false | none | none | Rect with folded dog-ear top-right corner |
| `deploy_device` | Device | custom | 160 | 100 | #e8e8e8 | #000 | [] | «device» | top | 0 | false | none | none | 3D box, same as node but labeled device |
| `deploy_exec_env` | Execution Environment | rect | 160 | 100 | #fff | #000 | [] | «executionEnvironment» | top | 0 | false | none | none | Rect with stereotype label |
| `deploy_comm_path` | Communication Path | line | 120 | 0 | none | #000 | [] | | none | 0 | true | none | none | Plain line |
| `deploy_dependency` | Deploy Dependency | line | 120 | 0 | none | #000 | [6,3] | «deploy» | none | 0 | true | none | arrow | Dashed arrow with «deploy» |

---

## 5. Package Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `package_box` | Package | custom | 160 | 100 | #fff | #000 | [] | PackageName | inside | 0 | false | none | none | Large rect with small tab rectangle at top-left |
| `package_merge` | Package Merge | line | 120 | 0 | none | #000 | [6,3] | «merge» | none | 0 | true | none | hollow-arrow | Dashed + hollow triangle |
| `package_import` | Package Import | line | 120 | 0 | none | #000 | [6,3] | «import» | none | 0 | true | none | hollow-arrow | Dashed + hollow triangle |
| `package_containment` | Containment | line | 60 | 0 | none | #000 | [] | | none | 0 | true | circle | none | Line with circle at container end |

---

## 6. Use Case Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `usecase_boundary` | System Boundary | rect | 400 | 300 | none | #000 | [] | System | top | 0 | false | none | none | Large empty rectangle, label at top |
| `usecase_actor` | Actor | custom | 40 | 80 | none | #000 | [] | Actor | bottom | 0 | false | none | none | Stick figure: circle head + line body + two arm lines + two leg lines |
| `usecase_ellipse` | Use Case | ellipse | 120 | 50 | #fff | #000 | [] | Use Case | inside | 0 | false | none | none | Plain ellipse |
| `usecase_association` | Association | line | 120 | 0 | none | #000 | [] | | none | 0 | true | none | none | Plain line actor ↔ use case |
| `usecase_include` | Include | line | 120 | 0 | none | #000 | [6,3] | «include» | none | 0 | true | none | arrow | Dashed arrow pointing to included use case |
| `usecase_extend` | Extend | line | 120 | 0 | none | #000 | [6,3] | «extend» | none | 0 | true | none | arrow | Dashed arrow pointing to base use case |
| `usecase_generalization` | Generalization | line | 120 | 0 | none | #000 | [] | | none | 0 | true | none | hollow-arrow | Solid line + hollow triangle |

---

## 7. Sequence Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `seq_lifeline` | Lifeline | custom | 100 | 300 | #fff | #000 | [] | :ClassName | top | 0 | false | none | none | Rect head on top + dashed vertical line going down |
| `seq_activation` | Activation Box | rect | 16 | 60 | #fff | #000 | [] | | none | 0 | false | none | none | Thin tall rect placed on top of lifeline dashed line |
| `seq_sync_msg` | Synchronous Message | line | 120 | 0 | none | #000 | [] | message() | top | 0 | true | none | arrow | Solid line + filled arrow |
| `seq_async_msg` | Asynchronous Message | line | 120 | 0 | none | #000 | [] | message() | top | 0 | true | none | arrow | Solid line + open arrow |
| `seq_return_msg` | Return Message | line | 120 | 0 | none | #000 | [6,3] | return | top | 0 | true | none | arrow | Dashed line + open arrow, going back |
| `seq_self_msg` | Self Message | custom | 60 | 40 | none | #000 | [] | self() | top | 0 | true | none | arrow | Loop: line right → line down → line back left with arrowhead |
| `seq_fragment` | Combined Fragment | rect | 200 | 120 | none | #000 | [] | alt | top | 0 | false | none | none | Rect with small pentagon label box at top-left for operator (alt/opt/loop/par) |

---

## 8. Activity Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `act_initial` | Initial Node | ellipse | 20 | 20 | #000 | #000 | [] | | none | 0 | false | none | none | Small solid black circle |
| `act_final` | Final Node | custom | 24 | 24 | none | #000 | [] | | none | 0 | false | none | none | Circle with inner filled circle (bullseye) |
| `act_action` | Action | rect | 120 | 50 | #fff | #000 | [] | Action | inside | 0 | false | none | none | Rounded rectangle (border-radius ~20) |
| `act_decision` | Decision / Merge | polygon | 60 | 40 | #fff | #000 | [] | | none | 0 | false | none | none | Diamond (4 points) |
| `act_fork_h` | Fork / Join (H) | rect | 120 | 8 | #000 | #000 | [] | | none | 0 | false | none | none | Thick horizontal black bar |
| `act_fork_v` | Fork / Join (V) | rect | 8 | 120 | #000 | #000 | [] | | none | 0 | false | none | none | Thick vertical black bar |
| `act_swimlane` | Swimlane | rect | 180 | 400 | none | #000 | [] | Lane | top | 0 | false | none | none | Large rect, label at top, no fill |
| `act_send_signal` | Send Signal | polygon | 100 | 50 | #fff | #000 | [] | Signal | inside | 0 | false | none | none | Pentagon pointing right (arrow-like) |
| `act_receive_signal` | Receive Signal | polygon | 100 | 50 | #fff | #000 | [] | Signal | inside | 0 | false | none | none | Pentagon with concave (notch) on left side |
| `act_flow` | Flow Edge | line | 100 | 0 | none | #000 | [] | | none | 0 | true | none | arrow | Solid line + filled arrow |

---

## 9. State Machine Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `state_initial` | Initial Pseudostate | ellipse | 20 | 20 | #000 | #000 | [] | | none | 0 | false | none | none | Solid black circle |
| `state_final` | Final State | custom | 24 | 24 | none | #000 | [] | | none | 0 | false | none | none | Bullseye: circle with inner filled circle |
| `state_simple` | State | rect | 120 | 60 | #fff | #000 | [] | StateName | inside | 0 | false | none | none | Rounded rectangle |
| `state_composite` | Composite State | rect | 200 | 120 | #f9f9f9 | #000 | [] | StateName | top | 0 | false | none | none | Rounded rect with inner region dashed border |
| `state_transition` | Transition | line | 100 | 0 | none | #000 | [] | event[guard]/action | top | 0 | true | none | arrow | Arrow with label |
| `state_choice` | Choice Pseudostate | polygon | 40 | 40 | #fff | #000 | [] | | none | 0 | false | none | none | Diamond |
| `state_fork` | Fork / Join | rect | 100 | 8 | #000 | #000 | [] | | none | 0 | false | none | none | Thick black bar |
| `state_history` | History Pseudostate | custom | 30 | 30 | #fff | #000 | [] | H | inside | 0 | false | none | none | Circle with "H" text inside |

---

## 10. Communication Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `comm_object` | Object | rect | 140 | 50 | #fff | #000 | [] | obj:Class | inside | 0 | false | none | none | Underlined name |
| `comm_link` | Link | line | 120 | 0 | none | #000 | [] | | none | 0 | true | none | none | Plain line |
| `comm_message` | Numbered Message | line | 120 | 0 | none | #000 | [] | 1: message() | top | 0 | true | none | arrow | Arrow with sequence number label |
| `comm_self_link` | Self Link | custom | 60 | 40 | none | #000 | [] | 1: self() | top | 0 | true | none | arrow | Loop arrow back to same object |

---

## 11. ER Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `er_entity` | Entity | rect | 120 | 50 | #fff | #000 | [] | Entity | inside | 0 | false | none | none | Plain rectangle |
| `er_weak_entity` | Weak Entity | custom | 120 | 50 | #fff | #000 | [] | WeakEntity | inside | 0 | false | none | none | Double rectangle (rect inside rect) |
| `er_attribute` | Attribute | ellipse | 100 | 40 | #fff | #000 | [] | attribute | inside | 0 | false | none | none | Plain ellipse |
| `er_multivalued_attr` | Multivalued Attribute | custom | 100 | 40 | #fff | #000 | [] | attribute | inside | 0 | false | none | none | Double ellipse |
| `er_derived_attr` | Derived Attribute | ellipse | 100 | 40 | #fff | #000 | [4,3] | /attribute | inside | 0 | false | none | none | Dashed ellipse |
| `er_key_attr` | Key Attribute | ellipse | 100 | 40 | #fff | #000 | [] | <u>key</u> | inside | 0 | false | none | none | Ellipse with underlined text |
| `er_relationship` | Relationship | polygon | 100 | 60 | #fff | #000 | [] | relates | inside | 0 | false | none | none | Diamond |
| `er_weak_relationship` | Weak Relationship | custom | 100 | 60 | #fff | #000 | [] | relates | inside | 0 | false | none | none | Double diamond |
| `er_total_participation` | Total Participation | line | 100 | 0 | none | #000 | [] | | none | 0 | true | none | none | Double line (two parallel lines) |
| `er_partial_participation` | Partial Participation | line | 100 | 0 | none | #000 | [] | | none | 0 | true | none | none | Single line |

---

## 12. DFD (Data Flow Diagram)

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `dfd_external` | External Entity | rect | 100 | 50 | #fff | #000 | [] | External | inside | 0 | false | none | none | Plain square/rectangle |
| `dfd_process` | Process | ellipse | 80 | 80 | #fff | #000 | [] | Process | inside | 0 | false | none | none | Circle (Yourdon notation) |
| `dfd_datastore` | Data Store | custom | 140 | 40 | #fff | #000 | [] | D1: Store | inside | 0 | false | none | none | Open-ended rectangle: two horizontal lines with left side closed, right side open |
| `dfd_flow` | Data Flow | line | 100 | 0 | none | #000 | [] | data | top | 0 | true | none | arrow | Arrow with label |

---

## 13. Context Diagram

| id | name | svgShape | w | h | fill | stroke | strokeDash | label | labelPos | compartments | isConnector | markerStart | markerEnd | notes |
|----|------|----------|---|---|------|--------|------------|-------|----------|--------------|-------------|-------------|-----------|-------|
| `ctx_process` | Central Process | ellipse | 120 | 120 | #fff | #000 | [] | System | inside | 0 | false | none | none | Single large circle in centre of diagram |
| `ctx_external` | External Entity | rect | 100 | 50 | #fff | #000 | [] | External | inside | 0 | false | none | none | Rectangle (same as DFD external) |
| `ctx_flow` | Data Flow | line | 100 | 0 | none | #000 | [] | data | top | 0 | true | none | arrow | Arrow with label |

---

## Custom Shape Drawing Instructions

Some shapes above use `svgShape: "custom"`. Here is how to draw each one:

### `class_box` / `object_box` — Compartmented Rectangle
```
Draw a rect, then draw horizontal lines inside to divide into sections.
For class_box: divide into 3 equal rows.
For object_box: divide into 2 equal rows.
```

### `usecase_actor` — Stick Figure
```
circle (head) at top center
vertical line below circle (body)
two diagonal lines from mid-body outward (arms)
two diagonal lines from bottom of body downward (legs)
label text below
```

### `deploy_node` / `deploy_device` — 3D Box
```
Front face: rect at (x, y+offset, w, h)
Top face: parallelogram — polygon from top-left of front to top-left offset, top-right offset, top-right of front
Right face: parallelogram — polygon from top-right of front, top-right offset, bottom-right offset, bottom-right of front
offset = (20, -12) typically
```

### `deploy_artifact` — Dog-ear Rectangle
```
rect with top-right corner cut: draw as polygon with 5 points
fold_size = 12
points: (x, y), (x+w-fold, y), (x+w, y+fold), (x+w, y+h), (x, y+h)
draw fold triangle: (x+w-fold, y), (x+w, y+fold), (x+w-fold, y+fold)
```

### `package_box` — Folder Shape
```
Small tab rect at top-left: (x, y, 60, 20)
Large body rect below: (x, y+20, w, h)
```

### `er_weak_entity` / `er_weak_relationship` — Double Border
```
Draw outer shape, then draw same shape inside at (x+4, y+4, w-8, h-8)
```

### `er_multivalued_attr` — Double Ellipse
```
Draw outer ellipse, then inner ellipse at (cx, cy, rx-5, ry-5)
```

### `dfd_datastore` — Open Rectangle
```
Draw only: top line, left vertical line, bottom line. Right side is open (no line).
Or use: M x y  H x+w  (top line)
        M x y  V y+h  (left side)
        M x y+h H x+w (bottom line)
```

### `seq_lifeline` — Head + Dashed Line
```
Draw rect for head at top (x, y, w, 40)
Draw dashed vertical line from (x+w/2, y+40) down to (x+w/2, y+totalHeight)
```

### `state_history` / `comm_self_link` / `provided_interface`
```
state_history: circle + text "H" centered inside
provided_interface: short line + small circle at end (lollipop)
required_interface: short line + semicircle arc at end (open half-circle)
```

---

## Connector / Arrow Marker Reference

Implement these as SVG `<marker>` definitions and reference via `marker-end` / `marker-start`:

| markerEnd value | Shape |
|---|---|
| `arrow` | Filled triangular arrowhead |
| `hollow-arrow` | Open/outline triangular arrowhead (used for inheritance) |
| `diamond` | Hollow diamond (aggregation) |
| `filled-diamond` | Filled black diamond (composition) |
| `circle` | Small circle (containment) |
| `none` | No marker |

---

## Implementation Notes

1. **Routing**: All connectors default to `sharp` routing (right-angle bends with waypoints). Also support `curved` and `straight`.
2. **Waypoints**: Every connector stores an array of `{x, y}` points. Dragging the midpoint of a segment adds a new waypoint.
3. **Snap to Grid**: Default grid size is 10px. Shapes snap on drag.
4. **Selection**: Selected shapes show blue dot handles at corners and midpoints.
5. **Labels**: Double-click any shape or connector to edit its label inline.
6. **Z-order**: Connectors render below shapes in the SVG layer order.
