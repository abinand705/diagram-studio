# Diagram Shapes & Connectors Reference

> Complete shape and connector library for all 13 diagram types.
> Each connector includes: `id`, `label`, `lineStyle`, `startArrow`, `endArrow`, `strokeStyle`, `description`.

---

## Table of Contents

1. [Lines & Connectors (Universal)](#1-lines--connectors-universal)
2. [Class Diagram](#2-class-diagram)
3. [Object Diagram](#3-object-diagram)
4. [Component Diagram](#4-component-diagram)
5. [Deployment Diagram](#5-deployment-diagram)
6. [Package Diagram](#6-package-diagram)
7. [Use Case Diagram](#7-use-case-diagram)
8. [Sequence Diagram](#8-sequence-diagram)
9. [Activity Diagram](#9-activity-diagram)
10. [State Machine Diagram](#10-state-machine-diagram)
11. [Communication Diagram](#11-communication-diagram)
12. [ER Diagram](#12-er-diagram-entity-relationship)
13. [DFD (Data Flow Diagram)](#13-dfd-data-flow-diagram)
14. [Context Diagram](#14-context-diagram)

---

## 1. Lines & Connectors (Universal)

> These connectors are used across all diagram types. Each has routing style, stroke style, and arrow head configurations.

### 1.1 Line Routing Styles

| id | label | routing | description |
|----|-------|---------|-------------|
| `line_straight` | Straight | `straight` | Direct point-to-point line, no bends |
| `line_orthogonal` | Orthogonal / Elbow | `orthogonal` | Right-angle bends only (horizontal/vertical segments) |
| `line_curved` | Curved | `curved` | Smooth bezier curve between two points |
| `line_entity` | Entity | `entity` | Right-angle routing optimised for ER diagrams |
| `line_isometric` | Isometric | `isometric` | 30-degree angled segments |

### 1.2 Stroke Styles

| id | label | dashArray | description |
|----|-------|-----------|-------------|
| `stroke_solid` | Solid | `none` | Unbroken solid line |
| `stroke_dashed` | Dashed | `8 4` | Regular dashes |
| `stroke_dotted` | Dotted | `2 4` | Closely spaced dots |
| `stroke_long_dash` | Long Dash | `16 4` | Longer dash segments |
| `stroke_dash_dot` | Dash-Dot | `8 4 2 4` | Alternating dash and dot |

### 1.3 Arrowhead Types (Start / End)

| id | label | svgMarker | description |
|----|-------|-----------|-------------|
| `arrow_none` | None | `none` | No arrowhead — plain line end |
| `arrow_open` | Open Arrow | `open` | Simple open V-shaped arrowhead |
| `arrow_filled` | Filled Arrow | `block` | Solid filled triangular arrowhead |
| `arrow_hollow` | Hollow Arrow | `openThin` | Open triangle (inheritance/generalisation) |
| `arrow_diamond_filled` | Filled Diamond | `diamondFilled` | Solid diamond (composition) |
| `arrow_diamond_hollow` | Hollow Diamond | `diamond` | Open diamond (aggregation) |
| `arrow_circle` | Circle | `circle` | Small filled circle (found message) |
| `arrow_circle_hollow` | Hollow Circle | `circleOpen` | Open circle (interface provided) |
| `arrow_half_circle` | Half Circle | `halfCircle` | Socket shape (interface required) |
| `arrow_cross` | Cross / X | `cross` | Cross marker (flow final node) |
| `arrow_erOne` | ER One | `ERone` | Single vertical bar — cardinality 1 |
| `arrow_erMany` | ER Many | `ERmany` | Crow's foot — cardinality many |
| `arrow_erOneMany` | ER One-or-Many | `ERoneToMany` | Bar + crow's foot |
| `arrow_erZeroOne` | ER Zero-or-One | `ERzeroToOne` | Circle + bar |
| `arrow_erZeroMany` | ER Zero-or-Many | `ERzeroToMany` | Circle + crow's foot |

### 1.4 Complete Connector Presets

| id | label | routing | stroke | startArrow | endArrow | usedIn |
|----|-------|---------|--------|------------|----------|--------|
| `conn_association` | Association | `orthogonal` | `solid` | `none` | `open` | Class, Object, Use Case |
| `conn_directed_association` | Directed Association | `orthogonal` | `solid` | `none` | `filled` | Class, Communication |
| `conn_dependency` | Dependency | `orthogonal` | `dashed` | `none` | `open` | Class, Component, Package, Deployment |
| `conn_realization` | Realization | `orthogonal` | `dashed` | `none` | `hollow` | Class, Component |
| `conn_inheritance` | Inheritance / Generalization | `orthogonal` | `solid` | `none` | `hollow` | Class, Use Case, State |
| `conn_aggregation` | Aggregation | `orthogonal` | `solid` | `diamond_hollow` | `none` | Class |
| `conn_composition` | Composition | `orthogonal` | `solid` | `diamond_filled` | `none` | Class |
| `conn_link` | Link | `straight` | `solid` | `none` | `none` | Object, Communication |
| `conn_include` | «include» | `orthogonal` | `dashed` | `none` | `open` | Use Case |
| `conn_extend` | «extend» | `orthogonal` | `dashed` | `none` | `open` | Use Case |
| `conn_sync_message` | Synchronous Message | `straight` | `solid` | `none` | `filled` | Sequence |
| `conn_async_message` | Asynchronous Message | `straight` | `solid` | `none` | `open` | Sequence |
| `conn_return_message` | Return Message | `straight` | `dashed` | `none` | `open` | Sequence |
| `conn_self_message` | Self Message | `orthogonal` | `solid` | `none` | `filled` | Sequence |
| `conn_found_message` | Found Message | `straight` | `solid` | `circle` | `filled` | Sequence |
| `conn_lost_message` | Lost Message | `straight` | `solid` | `none` | `circle` | Sequence |
| `conn_create_message` | Create Message | `straight` | `dashed` | `none` | `open` | Sequence |
| `conn_destroy_message` | Destroy Message | `straight` | `solid` | `none` | `cross` | Sequence |
| `conn_transition` | Transition | `curved` | `solid` | `none` | `filled` | State Machine, Activity |
| `conn_control_flow` | Control Flow | `orthogonal` | `solid` | `none` | `filled` | Activity |
| `conn_object_flow` | Object Flow | `orthogonal` | `dashed` | `none` | `filled` | Activity |
| `conn_communication_path` | Communication Path | `straight` | `solid` | `none` | `none` | Deployment |
| `conn_data_flow` | Data Flow | `straight` | `solid` | `none` | `open` | DFD, Context |
| `conn_er_line` | ER Line | `orthogonal` | `solid` | `erOne` | `erMany` | ER Diagram |
| `conn_import` | «import» | `orthogonal` | `dashed` | `none` | `hollow` | Package |
| `conn_merge` | «merge» | `orthogonal` | `dashed` | `none` | `hollow` | Package |
| `conn_numbered_message` | Numbered Message | `straight` | `solid` | `none` | `open` | Communication |

---

## 2. Class Diagram

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `class_association` | Association | `orthogonal` | `solid` | `none` | `none` | Structural relationship — plain line |
| `class_directed_assoc` | Directed Association | `orthogonal` | `solid` | `none` | `open` | Association with direction |
| `class_inheritance` | Inheritance | `orthogonal` | `solid` | `none` | `hollow` | Solid line, hollow triangle at parent |
| `class_realization` | Realization | `orthogonal` | `dashed` | `none` | `hollow` | Dashed line, hollow triangle |
| `class_dependency` | Dependency | `orthogonal` | `dashed` | `none` | `open` | Dashed arrow |
| `class_aggregation` | Aggregation | `orthogonal` | `solid` | `diamond_hollow` | `none` | Hollow diamond at whole end |
| `class_composition` | Composition | `orthogonal` | `solid` | `diamond_filled` | `none` | Filled diamond at whole end |

---

## 3. Object Diagram

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `obj_link` | Link | `straight` | `solid` | `none` | `none` | Plain line — instance-level association |
| `obj_directed_link` | Directed Link | `straight` | `solid` | `none` | `open` | Link with direction arrow |
| `obj_dependency` | Dependency | `straight` | `dashed` | `none` | `open` | Dashed dependency arrow |

---

## 4. Component Diagram

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `comp_usage` | Usage / Dependency | `orthogonal` | `dashed` | `none` | `open` | Dashed arrow — component uses another |
| `comp_realization` | Realization | `orthogonal` | `dashed` | `none` | `hollow` | Component implements interface |
| `comp_assembly` | Assembly Connector | `straight` | `solid` | `halfCircle` | `circle_hollow` | Lollipop-to-socket — provided meets required |
| `comp_delegation` | Delegation | `orthogonal` | `dashed` | `none` | `open` | Port to internal component |

---

## 5. Deployment Diagram

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `dep_communication_path` | Communication Path | `straight` | `solid` | `none` | `none` | Bidirectional line between nodes |
| `dep_dependency` | Dependency | `orthogonal` | `dashed` | `none` | `open` | Dashed arrow between artifacts/nodes |
| `dep_manifest` | Manifestation | `orthogonal` | `dashed` | `none` | `open` | «manifest» — artifact realises component |

---

## 6. Package Diagram

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `pkg_dependency` | Dependency | `orthogonal` | `dashed` | `none` | `open` | General dependency between packages |
| `pkg_import` | «import» | `orthogonal` | `dashed` | `none` | `open` | Public import — namespace merged |
| `pkg_access` | «access» | `orthogonal` | `dashed` | `none` | `open` | Private import — no namespace merge |
| `pkg_merge` | «merge» | `orthogonal` | `dashed` | `none` | `hollow` | Package extension/merge |
| `pkg_nesting` | Nesting | `straight` | `solid` | `circle_hollow` | `none` | Shows package containment |

---

## 7. Use Case Diagram

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `uc_association` | Association | `straight` | `solid` | `none` | `none` | Actor to use case — basic participation |
| `uc_directed_assoc` | Directed Association | `straight` | `solid` | `none` | `open` | Association with direction |
| `uc_include` | «include» | `orthogonal` | `dashed` | `none` | `open` | Mandatory inclusion of another use case |
| `uc_extend` | «extend» | `orthogonal` | `dashed` | `none` | `open` | Optional extension of a use case |
| `uc_generalization` | Generalization | `orthogonal` | `solid` | `none` | `hollow` | Actor or use case inheritance |

---

## 8. Sequence Diagram

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `seq_sync` | Synchronous Message | `straight` | `solid` | `none` | `filled` | Solid arrow — caller waits for response |
| `seq_async` | Asynchronous Message | `straight` | `solid` | `none` | `open` | Open arrow — fire and forget |
| `seq_return` | Return Message | `straight` | `dashed` | `none` | `open` | Dashed arrow — response to synchronous call |
| `seq_create` | Create Message | `straight` | `dashed` | `none` | `open` | Dashed arrow pointing to new lifeline head |
| `seq_destroy` | Destroy Message | `straight` | `solid` | `none` | `cross` | Arrow ending in × at lifeline termination |
| `seq_found` | Found Message | `straight` | `solid` | `circle_filled` | `filled` | Filled circle origin — unknown sender |
| `seq_lost` | Lost Message | `straight` | `solid` | `none` | `circle_filled` | Filled circle at end — unknown receiver |
| `seq_self` | Self Message | `orthogonal` | `solid` | `none` | `filled` | Loops back to same lifeline |

---

## 9. Activity Diagram

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `act_control_flow` | Control Flow | `orthogonal` | `solid` | `none` | `filled` | Flow of control between actions |
| `act_object_flow` | Object Flow | `orthogonal` | `dashed` | `none` | `filled` | Flow of data/objects between nodes |
| `act_exception_flow` | Exception Flow | `orthogonal` | `dashed` | `none` | `open` | Exception/error path |

---

## 10. State Machine Diagram

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `sm_transition` | Transition | `curved` | `solid` | `none` | `filled` | Labeled: event [guard] / action |
| `sm_internal_transition` | Internal Transition | `none` | `none` | `none` | `none` | Listed inside the state box, not a visual connector |
| `sm_self_transition` | Self-Transition | `curved` | `solid` | `none` | `filled` | Loops back to same state |

---

## 11. Communication Diagram

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `comm_link` | Link | `straight` | `solid` | `none` | `none` | Structural link between objects |
| `comm_message_fwd` | Forward Message | `straight` | `solid` | `none` | `open` | Numbered arrow — e.g. `1: doSomething()` |
| `comm_message_ret` | Return Message | `straight` | `dashed` | `none` | `open` | Numbered dashed arrow for return |
| `comm_self_link` | Self Link | `curved` | `solid` | `none` | `open` | Object sending message to itself |

---

## 12. ER Diagram (Entity-Relationship)

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `er_line` | ER Line | `orthogonal` | `solid` | `none` | `none` | Plain line — entity to relationship |
| `er_one_to_one` | One to One | `orthogonal` | `solid` | `erOne` | `erOne` | 1:1 cardinality |
| `er_one_to_many` | One to Many | `orthogonal` | `solid` | `erOne` | `erMany` | 1:N cardinality (crow's foot) |
| `er_many_to_many` | Many to Many | `orthogonal` | `solid` | `erMany` | `erMany` | M:N cardinality |
| `er_zero_one` | Zero or One | `orthogonal` | `solid` | `erZeroToOne` | `erOne` | Optional one |
| `er_zero_many` | Zero or Many | `orthogonal` | `solid` | `erZeroToMany` | `erOne` | Optional many |
| `er_one_or_many` | One or Many | `orthogonal` | `solid` | `erOne` | `erOneToMany` | Mandatory many |
| `er_attr_link` | Attribute Link | `straight` | `solid` | `none` | `none` | Entity/relationship to attribute |
| `er_total_participation` | Total Participation | `orthogonal` | `solid_double` | `none` | `none` | Double line — every entity must participate |

---

## 13. DFD (Data Flow Diagram)

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `dfd_data_flow` | Data Flow | `straight` | `solid` | `none` | `open` | Named arrow showing data movement |
| `dfd_bidirectional_flow` | Bidirectional Flow | `straight` | `solid` | `open` | `open` | Data flows in both directions |

---

## 14. Context Diagram

> A Level-0 DFD showing the entire system as a single process.

### Connectors

| id | label | routing | stroke | startArrow | endArrow | description |
|----|-------|---------|--------|------------|----------|-------------|
| `ctx_data_flow_in` | Data Flow (In) | `straight` | `solid` | `none` | `open` | External entity → system |
| `ctx_data_flow_out` | Data Flow (Out) | `straight` | `solid` | `none` | `open` | System → external entity |
| `ctx_data_flow_bi` | Bidirectional Flow | `straight` | `solid` | `open` | `open` | Data flows both directions |

---

*End of reference. All connector configurations are ready for direct integration into your diagramming software.*
