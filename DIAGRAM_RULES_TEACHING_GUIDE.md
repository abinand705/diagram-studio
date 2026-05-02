# 📐 Diagram Rules, Shapes & Generation Guide
# Smart Diagram Generator — Complete AI Teaching Reference

> Drop this file into your project. This teaches the AI **exactly** what shapes to use, how to draw each diagram type, and how to generate correct React Flow JSON every time.

---

## ⚠️ CRITICAL PROBLEM IDENTIFIED FROM SCREENSHOT

Your current diagram shows these errors:
- ❌ **Attributes rendered as rectangles** — they must be **ovals**
- ❌ **Relationships rendered as rectangles** — they must be **diamonds**  
- ❌ **Weak entities look like normal entities** — they need double borders
- ❌ **Key attributes not underlined** — primary keys need special marking
- ❌ **Layout is cramped** — entities need 300px+ spacing

The fix is giving the AI explicit shape rules. This file is that fix.

---

## PART 1: ER DIAGRAM — Complete Rules

### 1.1 The 6 Shapes of ER Diagrams

Every ER diagram uses EXACTLY these shapes. No exceptions.

---

#### SHAPE 1: `entity` — Rectangle
**What it looks like:** Plain rectangle with single border  
**When to use:** Any main table or object (Person, Student, Course, Hospital, Blood, Donor)  
**Color:** `#eff6ff` (light blue)  
**React Flow shape value:** `"entity"`

```
┌─────────────┐
│   Student   │   ← ENTITY
└─────────────┘
```

---

#### SHAPE 2: `weakEntity` — Double Rectangle  
**What it looks like:** Rectangle with a second border inside  
**When to use:** An entity that CANNOT exist without a parent entity (e.g., `OrderItem` needs `Order`, `Feedback` needs `User`)  
**Color:** `#eff6ff` (light blue)  
**React Flow shape value:** `"weakEntity"`

```
╔═════════════╗
║  Feedback   ║   ← WEAK ENTITY (double border)
╚═════════════╝
```

---

#### SHAPE 3: `relationship` — Diamond  
**What it looks like:** A diamond (rotated square)  
**When to use:** The VERB connecting two entities ("Takes", "Gives", "Manages", "Donates", "Enrolls")  
**Color:** `#fff7ed` (light orange)  
**React Flow shape value:** `"relationship"`

```
    ◇
   ◇ ◇
  ◇   ◇
   ◇ ◇
    ◇

   "Gives"    ← RELATIONSHIP diamond
```

---

#### SHAPE 4: `weakRelationship` — Double Diamond  
**What it looks like:** Diamond inside a diamond  
**When to use:** The relationship that IDENTIFIES a weak entity (connecting a weak entity to its owner)  
**Color:** `#fff7ed` (light orange)  
**React Flow shape value:** `"weakRelationship"`

---

#### SHAPE 5: `attribute` — Oval  
**What it looks like:** An ellipse/oval  
**When to use:** Any PROPERTY of an entity (Name, Email, Address, Date, Contact, Password, Blood_group)  
**Color:** `#f0fdf4` (light green)  
**React Flow shape value:** `"attribute"`

```
 ╭──────────╮
 │   Name   │   ← ATTRIBUTE (oval)
 ╰──────────╯
```

---

#### SHAPE 6: `keyAttribute` — Oval with underlined text  
**What it looks like:** Oval with the label text underlined (or dashed border)  
**When to use:** The PRIMARY KEY of an entity (Id, EmailId when used as PK, StudentID)  
**Color:** `#f0fdf4` (light green)  
**React Flow shape value:** `"keyAttribute"`

```
 ╭──────────╮
 │   _Id_   │   ← KEY ATTRIBUTE (underlined = primary key)
 ╰──────────╯
```

---

### 1.2 Cardinality Labels on Edges

Every edge between entity and relationship must have a cardinality label.

| Symbol | Meaning | Example |
|--------|---------|---------|
| `1` | Exactly one | One instructor per course |
| `M` | Many | Many students |
| `N` | Many (other side) | Many courses |
| `*` | Zero or more | Optional many |
| `0..1` | Zero or one | Optional single |
| `1..*` | One or more | Required many |

**Rule:** ALWAYS put cardinality on BOTH sides of a relationship diamond.

```
Student ──M── (Enrolls) ──N── Course
```

---

### 1.3 ER Diagram Layout Rules

```
RULE 1: Entities are the "backbone" — place them first in a grid
RULE 2: Relationships (diamonds) sit BETWEEN their connected entities
RULE 3: Attributes (ovals) surround their entity like satellites
RULE 4: Key attributes go ABOVE their entity
RULE 5: Minimum 300px between entities
RULE 6: Attributes 100–120px from their entity
RULE 7: Never let edges cross if possible
```

**Grid layout for 4 entities:**
```
Entity_A (x=100)    Entity_B (x=400)

Entity_C (x=100)    Entity_D (x=400)
          y=300              y=300
```

---

### 1.4 ER Diagram — Your Blood Bank Example (Correct JSON)

Based on your screenshot, here is the correctly structured JSON for the Blood Bank ER diagram:

```json
{
  "nodes": [
    // === ENTITIES ===
    {"id":"user","type":"flowchart","position":{"x":400,"y":300},"data":{"label":"User","shape":"entity","fillColor":"#eff6ff"}},
    {"id":"donor","type":"flowchart","position":{"x":900,"y":300},"data":{"label":"Donor","shape":"entity","fillColor":"#eff6ff"}},
    {"id":"request","type":"flowchart","position":{"x":900,"y":600},"data":{"label":"Request","shape":"entity","fillColor":"#eff6ff"}},
    {"id":"employee","type":"flowchart","position":{"x":400,"y":700},"data":{"label":"Employee","shape":"entity","fillColor":"#eff6ff"}},
    {"id":"admin","type":"flowchart","position":{"x":700,"y":900},"data":{"label":"Admin","shape":"entity","fillColor":"#eff6ff"}},
    {"id":"feedback","type":"flowchart","position":{"x":400,"y":550},"data":{"label":"Feedback","shape":"weakEntity","fillColor":"#eff6ff"}},

    // === RELATIONSHIPS (DIAMONDS) ===
    {"id":"gives","type":"flowchart","position":{"x":650,"y":300},"data":{"label":"Gives","shape":"relationship","fillColor":"#fff7ed"}},
    {"id":"manages","type":"flowchart","position":{"x":700,"y":750},"data":{"label":"Manages","shape":"relationship","fillColor":"#fff7ed"}},
    {"id":"makes_request","type":"flowchart","position":{"x":650,"y":450},"data":{"label":"Making a request","shape":"weakRelationship","fillColor":"#fff7ed"}},

    // === KEY ATTRIBUTES (ovals with PK) ===
    {"id":"user_id","type":"flowchart","position":{"x":350,"y":180},"data":{"label":"Id","shape":"keyAttribute","fillColor":"#f0fdf4"}},
    {"id":"donor_id","type":"flowchart","position":{"x":850,"y":180},"data":{"label":"Id","shape":"keyAttribute","fillColor":"#f0fdf4"}},

    // === ATTRIBUTES (ovals) ===
    {"id":"user_name","type":"flowchart","position":{"x":250,"y":230},"data":{"label":"Name","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"user_email","type":"flowchart","position":{"x":500,"y":180},"data":{"label":"EmailId","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"user_contact","type":"flowchart","position":{"x":250,"y":350},"data":{"label":"Contact","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"user_blood","type":"flowchart","position":{"x":500,"y":350},"data":{"label":"Blood_group","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"donor_name","type":"flowchart","position":{"x":750,"y":230},"data":{"label":"Name","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"donor_email","type":"flowchart","position":{"x":1000,"y":230},"data":{"label":"EmailId","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"donor_contact","type":"flowchart","position":{"x":1050,"y":330},"data":{"label":"Contact","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"donor_blood","type":"flowchart","position":{"x":1050,"y":430},"data":{"label":"Blood_grp","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"req_units","type":"flowchart","position":{"x":800,"y":550},"data":{"label":"units","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"req_date","type":"flowchart","position":{"x":900,"y":480},"data":{"label":"Date","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"req_blood","type":"flowchart","position":{"x":1000,"y":560},"data":{"label":"Blood_group","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"req_hospital","type":"flowchart","position":{"x":900,"y":700},"data":{"label":"Hospital","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"req_branch","type":"flowchart","position":{"x":1050,"y":650},"data":{"label":"Branch","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"emp_id","type":"flowchart","position":{"x":300,"y":620},"data":{"label":"Id","shape":"keyAttribute","fillColor":"#f0fdf4"}},
    {"id":"emp_name","type":"flowchart","position":{"x":300,"y":720},"data":{"label":"Name","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"emp_email","type":"flowchart","position":{"x":400,"y":800},"data":{"label":"EmailId","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"emp_contact","type":"flowchart","position":{"x":500,"y":720},"data":{"label":"contact","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"fb_satisfied","type":"flowchart","position":{"x":280,"y":480},"data":{"label":"How_satisfied_was_the_service","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"fb_delivered","type":"flowchart","position":{"x":280,"y":570},"data":{"label":"Was_the_blood_delivered_ontime","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"fb_email","type":"flowchart","position":{"x":430,"y":620},"data":{"label":"EmailId","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"admin_email","type":"flowchart","position":{"x":600,"y":960},"data":{"label":"EmailId","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"admin_password","type":"flowchart","position":{"x":700,"y":980},"data":{"label":"Password","shape":"attribute","fillColor":"#f0fdf4"}},
    {"id":"admin_salary","type":"flowchart","position":{"x":800,"y":960},"data":{"label":"Salary","shape":"attribute","fillColor":"#f0fdf4"}}
  ],
  "edges": [
    // User ↔ Gives ↔ Donor
    {"id":"e1","source":"user","target":"gives","label":"1"},
    {"id":"e2","source":"gives","target":"donor","label":"M"},
    // User → attributes
    {"id":"e3","source":"user","target":"user_id"},
    {"id":"e4","source":"user","target":"user_name"},
    {"id":"e5","source":"user","target":"user_email"},
    {"id":"e6","source":"user","target":"user_contact"},
    {"id":"e7","source":"user","target":"user_blood"},
    // Donor → attributes
    {"id":"e8","source":"donor","target":"donor_id"},
    {"id":"e9","source":"donor","target":"donor_name"},
    {"id":"e10","source":"donor","target":"donor_email"},
    {"id":"e11","source":"donor","target":"donor_contact"},
    {"id":"e12","source":"donor","target":"donor_blood"},
    // Request → attributes
    {"id":"e13","source":"request","target":"req_units"},
    {"id":"e14","source":"request","target":"req_date"},
    {"id":"e15","source":"request","target":"req_blood"},
    {"id":"e16","source":"request","target":"req_hospital"},
    {"id":"e17","source":"request","target":"req_branch"},
    // User ↔ Making a request ↔ Request
    {"id":"e18","source":"user","target":"makes_request","label":"1"},
    {"id":"e19","source":"makes_request","target":"request","label":"M"},
    // Feedback (weak) → attributes
    {"id":"e20","source":"feedback","target":"fb_satisfied"},
    {"id":"e21","source":"feedback","target":"fb_delivered"},
    {"id":"e22","source":"feedback","target":"fb_email"},
    // Employee → attributes
    {"id":"e23","source":"employee","target":"emp_id"},
    {"id":"e24","source":"employee","target":"emp_name"},
    {"id":"e25","source":"employee","target":"emp_email"},
    {"id":"e26","source":"employee","target":"emp_contact"},
    // Employee ↔ Manages ↔ Admin
    {"id":"e27","source":"employee","target":"manages","label":"M"},
    {"id":"e28","source":"manages","target":"admin","label":"1"},
    // Admin → attributes
    {"id":"e29","source":"admin","target":"admin_email"},
    {"id":"e30","source":"admin","target":"admin_password"},
    {"id":"e31","source":"admin","target":"admin_salary"}
  ]
}
```

---

## PART 2: FLOWCHART — Complete Rules

### 2.1 The Flowchart Shapes

| Shape | Visual | `shape` value | Color | Used For |
|-------|--------|--------------|-------|----------|
| Terminal | Rounded rectangle | `terminal` | `#fef9c3` | START / END / STOP |
| Process | Rectangle | `process` | `#f1f5f9` | Any action or step |
| Decision | Diamond ◇ | `decision` | `#fdf2f2` | Yes/No question |
| Input/Output | Parallelogram | `io` | `#f0fdf4` | User input / Screen output |
| Database | Cylinder | `database` | `#fef3c7` | Read/write to DB |
| Document | Wavy-bottom rect | `document` | `#f1f5f9` | Generated document |
| Subroutine | Rect + side bars | `predefinedProcess` | `#f1f5f9` | Call to function |
| Connector | Circle ○ | `connector` | `#ffffff` | Loop back point |
| Preparation | Hexagon ⬡ | `preparation` | `#f1f5f9` | Initialize / Setup |

### 2.2 Flowchart Layout Rules

```
RULE 1: Start at top center, flow downward
RULE 2: y increases by 100–150px per step
RULE 3: Decision diamonds branch LEFT (No) and RIGHT (Yes)
RULE 4: Branch paths rejoin below with a connector
RULE 5: Always start with terminal "Start", end with terminal "End"
RULE 6: Decision edges MUST have labels ("Yes"/"No" or "Valid"/"Invalid")
```

**Positioning template:**
```
Start      (x=200, y=0)    terminal
Step 1     (x=200, y=120)  process
Step 2     (x=200, y=240)  process
Decision   (x=200, y=360)  decision
  No path  (x=50,  y=480)  process
  Yes path (x=350, y=480)  process
Rejoin     (x=200, y=600)  connector
End        (x=200, y=720)  terminal
```

---

## PART 3: COMPLETE SHAPE → USE-CASE MAPPING

### When to use each shape — quick lookup

```
User says "start" / "begin" / "end" / "stop"
  → shape: "terminal"   color: #fef9c3

User says "do X" / "process" / "calculate" / "send" / "save"
  → shape: "process"    color: #f1f5f9

User says "if" / "check" / "validate" / "is it" / "?"
  → shape: "decision"   color: #fdf2f2

User says "enter" / "input" / "output" / "display" / "show"
  → shape: "io"         color: #f0fdf4

User says "table" / "entity" / "object" / noun in ERD
  → shape: "entity"     color: #eff6ff

User says "has" / "takes" / "gives" / "manages" / verb in ERD
  → shape: "relationship"   color: #fff7ed

User says "attribute" / "field" / "property" / "column"
  → shape: "attribute"  color: #f0fdf4

User says "primary key" / "ID" / "unique identifier"
  → shape: "keyAttribute"   color: #f0fdf4

User says "database" / "store" / "persist"
  → shape: "database"   color: #fef3c7

User says "weak" / "dependent" / "cannot exist without"
  → shape: "weakEntity"     color: #eff6ff
```

---

## PART 4: SYSTEM PROMPT — Paste Into Your AI Call

Use this as your `systemInstruction` string inside `buildDiagramSystemPrompt()`.

```
=== ROLE ===
You are an expert diagram specialist for React Flow. You produce 100% accurate JSON diagrams.

=== DIAGRAM TYPE DETECTION ===
Detect the diagram type from these keywords:
  ERD / Entity-Relationship:
    Keywords: "entity", "table", "database schema", "relationship", "has many", "primary key", "attribute", "ERD", "ER diagram"
    → Use entity, weakEntity, relationship, weakRelationship, attribute, keyAttribute shapes ONLY

  FLOWCHART:
    Keywords: "flow", "process", "steps", "if...else", "validate", "workflow", "algorithm"
    → Use terminal, process, decision, io, database, connector shapes ONLY

=== ER DIAGRAM RULES (CRITICAL) ===

SHAPES — Use EXACTLY these and nothing else:

  "entity"           → Main table/object (RECTANGLE, single border)
                       Color: #eff6ff
                       Example nodes: User, Student, Donor, Course, Employee

  "weakEntity"       → Dependent entity, cannot exist without parent (DOUBLE RECTANGLE)
                       Color: #eff6ff
                       Example: Feedback (needs User), OrderItem (needs Order)

  "relationship"     → Verb connecting entities (DIAMOND shape)
                       Color: #fff7ed
                       Example: "Gives", "Enrolls", "Manages", "Teaches", "Donates"
                       RULE: ALWAYS a diamond. NEVER a rectangle.

  "weakRelationship" → Identifies a weak entity (DOUBLE DIAMOND)
                       Color: #fff7ed
                       Example: "Making a request" connecting User to Request

  "attribute"        → Property/column of an entity (OVAL / ELLIPSE)
                       Color: #f0fdf4
                       Example: Name, Email, Contact, Address, Blood_group, Date
                       RULE: ALWAYS an oval. NEVER a rectangle.

  "keyAttribute"     → Primary key of an entity (OVAL with underlined text)
                       Color: #f0fdf4
                       Example: Id, StudentID, DonorID
                       RULE: Place ABOVE the entity it belongs to.

EDGES IN ER DIAGRAMS:
  Entity ↔ Relationship: ALWAYS add cardinality label (1, M, N, *, 0..1, 1..*)
  Entity → Attribute: No label needed
  Relationship connects EXACTLY 2 entities (binary) or 3 (ternary, rare)

POSITIONING FOR ER DIAGRAMS:
  Step 1: Place all entities in a loose grid, 300px apart minimum
  Step 2: Place relationship diamonds BETWEEN their connected entities
  Step 3: Surround each entity with its attribute ovals (100–130px away)
  Step 4: Place keyAttributes directly ABOVE their entity
  Step 5: Weak entities near their parent entity

  Example layout for 3 entities:
    User     (x=100, y=300)   entity
    Donor    (x=700, y=300)   entity
    Request  (x=700, y=600)   entity
    
    Gives              (x=400, y=300)   relationship  [between User and Donor]
    Making_a_request   (x=400, y=450)   weakRelationship [between User and Request]
    
    User attributes:
      Id         (x=50,  y=180)  keyAttribute
      Name       (x=50,  y=360)  attribute
      EmailId    (x=200, y=180)  attribute
      Contact    (x=50,  y=430)  attribute

=== FLOWCHART RULES ===

SHAPES:
  "terminal"    → Rounded rectangle. START or END only. Color: #fef9c3
  "process"     → Rectangle. Any action/step. Color: #f1f5f9
  "decision"    → Diamond. Yes/No fork. Color: #fdf2f2
  "io"          → Parallelogram. Input or output. Color: #f0fdf4
  "database"    → Cylinder. Read/write storage. Color: #fef3c7
  "connector"   → Circle. Loop-back or merge point. Color: #ffffff

POSITIONING:
  Top-to-bottom flow. y += 100–150 per row.
  Decisions branch: No = x-150, Yes = x+150
  All edges from decisions MUST have "Yes"/"No" or "Valid"/"Invalid" label

=== JSON STRUCTURE (REQUIRED) ===

Node:
{
  "id": "unique_snake_case_id",
  "type": "flowchart",
  "position": { "x": NUMBER, "y": NUMBER },
  "data": {
    "label": "Short Label",
    "shape": "one_of_the_approved_shapes",
    "fillColor": "#hexcode"
  }
}

Edge:
{
  "id": "e_unique_id",
  "source": "node_id",
  "target": "node_id",
  "label": "optional_cardinality_or_condition"
}

=== VALIDATION BEFORE OUTPUT ===
☐ Every attribute/property is an OVAL (shape: "attribute" or "keyAttribute") — NEVER a rectangle
☐ Every verb/relationship in ERD is a DIAMOND (shape: "relationship") — NEVER a rectangle
☐ Every entity/table in ERD is a RECTANGLE (shape: "entity")
☐ All cardinality labels present on entity↔relationship edges
☐ All node IDs are unique
☐ All edge source/target reference real node IDs
☐ JSON has no markdown fences
☐ Positions are spread out (no overlaps)

Return ONLY valid JSON. No explanation.
```

---

## PART 5: COMMON MISTAKES TO FIX

### Mistake 1 — Using "process" for ER attributes ❌
```json
// WRONG — Name rendered as rectangle
{"data": {"label": "Name", "shape": "process"}}

// CORRECT — Name rendered as oval
{"data": {"label": "Name", "shape": "attribute"}}
```

### Mistake 2 — Using "process" for ER relationships ❌
```json
// WRONG — "Gives" rendered as rectangle
{"data": {"label": "Gives", "shape": "process"}}

// CORRECT — "Gives" rendered as diamond
{"data": {"label": "Gives", "shape": "relationship"}}
```

### Mistake 3 — Missing cardinality ❌
```json
// WRONG — no cardinality
{"id":"e1", "source":"user", "target":"gives"}

// CORRECT — with cardinality
{"id":"e1", "source":"user", "target":"gives", "label":"1"}
{"id":"e2", "source":"gives", "target":"donor", "label":"M"}
```

### Mistake 4 — Nodes too close together ❌
```json
// WRONG — cramped
{"position": {"x": 100, "y": 100}}
{"position": {"x": 150, "y": 120}}  // too close!

// CORRECT — entities 300px apart
{"position": {"x": 100, "y": 300}}   // Entity A
{"position": {"x": 400, "y": 300}}   // Entity B  (300px gap)
{"position": {"x": 250, "y": 300}}   // Relationship (between them)
```

### Mistake 5 — Not marking primary keys ❌
```json
// WRONG — Id as plain attribute
{"data": {"label": "Id", "shape": "attribute"}}

// CORRECT — Id as key attribute
{"data": {"label": "Id", "shape": "keyAttribute"}}
```

---

## PART 6: REFERENCE — All Valid Shape Values

```
FLOWCHART shapes:
  terminal
  process
  decision
  io
  predefinedProcess
  delay
  document
  multiDocument
  database
  preparation
  connector
  annotation
  display
  manualInput

ERD shapes:
  entity
  weakEntity
  relationship
  weakRelationship
  attribute
  keyAttribute
  multivalued
  derived

ARCHITECTURE shapes:
  cloud
  internalStorage
  process
  database
```

---

## PART 7: COMPLETE COLOR REFERENCE

```javascript
const DIAGRAM_COLORS = {
  // Flowchart
  terminal:         "#fef9c3",  // warm yellow
  process:          "#f1f5f9",  // cool gray
  decision:         "#fdf2f2",  // soft red
  io:               "#f0fdf4",  // light green
  database:         "#fef3c7",  // amber
  connector:        "#ffffff",  // white
  document:         "#f1f5f9",  // gray
  predefinedProcess:"#f1f5f9",  // gray

  // ERD
  entity:           "#eff6ff",  // light blue
  weakEntity:       "#eff6ff",  // light blue
  relationship:     "#fff7ed",  // light orange
  weakRelationship: "#fff7ed",  // light orange
  attribute:        "#f0fdf4",  // light green
  keyAttribute:     "#f0fdf4",  // light green

  // Architecture
  cloud:            "#f0f9ff",  // sky blue
  internalStorage:  "#faf5ff",  // lavender
};
```

---

## PART 8: IMPLEMENTATION — Where to Add This in Your Code

### In `backend/server.js`, replace the system instruction with:

```javascript
function buildDiagramSystemPrompt(currentExtent) {
  const offsetX = currentExtent?.x + 100 || 0;
  return `
[PASTE PART 4 SYSTEM PROMPT HERE]

${offsetX > 0 ? `CANVAS OFFSET: Add ${offsetX} to all X coordinates.` : ""}
  `;
}
```

### In `frontend/src/App.js`, verify your shape renderer handles all shapes:

```javascript
// Make sure these shape values are handled in your node renderer:
const VALID_SHAPES = [
  // Flowchart
  "terminal", "process", "decision", "io", "database",
  "document", "predefinedProcess", "connector", "preparation",
  // ERD
  "entity", "weakEntity", "relationship", "weakRelationship",
  "attribute", "keyAttribute", "multivalued", "derived",
  // Architecture
  "cloud", "internalStorage"
];
```

---

## SUMMARY — The 3 Rules That Fix 80% of Issues

1. **In ERD: attributes are ALWAYS ovals** — `shape: "attribute"` or `shape: "keyAttribute"`
2. **In ERD: verbs are ALWAYS diamonds** — `shape: "relationship"` or `shape: "weakRelationship"`  
3. **Space entities 300px apart** — cramped layouts break readability

---

*Version 1.0 — April 12, 2026 — Smart Diagram Generator Teaching Reference*
