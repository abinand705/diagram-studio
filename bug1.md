# 📘 Diagram Shapes & Connectors Reference (Improved + Bug-Safe Version)

> Complete, structured reference for all major diagram types with built-in usage rules and bug prevention tips.

---

## ⚠️ Important: Before Using Any Diagram Tool

### 🐛 Known Tool Issues (Critical Fixes)
While working in tools like draw.io / diagrams.net, you may face:

- Ghost duplicate shapes (especially Weak Entity / double borders)
- Overlapping outlines after drag/resize
- Shapes not refreshing visually
- Accidental multi-creation on fast clicks

### ✅ Mandatory Fix Guidelines

- Use **single-click → drag slowly**
- Avoid rapid double-click placement
- After placing shapes → **zoom in/out once (forces redraw)**
- If duplicates appear:
  - Click → Delete repeatedly
  - Or press **Ctrl + Z**
- Refresh file if shapes behave abnormally

---

## 🧠 Smart Drawing Rules

### ✔️ Shape Handling Rules
- Never stack shapes exactly on top of each other
- For double-border shapes (Weak Entity, Multivalued Attribute):
  → place carefully

### ✔️ Connector Rules
- Always use **orthogonal lines**
- Avoid crossing lines unnecessarily
- Label connectors immediately

### ✔️ Layout Rules
- Maintain spacing (20–30px gap)
- Use grid/snap alignment

---

## 1. Lines & Connectors (Universal)

### Routing Types
- Straight → direct
- Orthogonal → right-angle (recommended)
- Curved → smooth flow
- Entity → ER-specific routing

### Stroke Styles
- Solid → default
- Dashed → dependency
- Dotted → weak relation

### Arrow Types
- Open → direction
- Filled → strong flow
- Hollow → inheritance
- Diamond → aggregation/composition
- Crow’s foot → ER relationships

---

## 2. Class Diagram

### Shapes
- Class → 3-section rectangle
- Abstract Class → italic title
- Interface → stereotype label
- Note → folded corner

### Connectors
- Association → simple line
- Inheritance → hollow triangle
- Dependency → dashed arrow
- Composition → filled diamond

### 💡 Fix Tip
If class boxes duplicate → delete extra outlines

---

## 3. Object Diagram

### Shapes
- Object → underlined name
- Note → annotation

### Connectors
- Link → simple line
- Directed link → arrow

---

## 4. Component Diagram

### Shapes
- Component → rectangle with tabs
- Provided Interface → circle (lollipop)
- Required Interface → socket

### Connectors
- Assembly → lollipop to socket
- Dependency → dashed arrow

---

## 5. Deployment Diagram

### Shapes
- Node → 3D box
- Database → cylinder
- Cloud → cloud shape

### Connectors
- Communication path → plain line
- Dependency → dashed

---

## 6. Package Diagram

### Shapes
- Package → folder-like box

### Connectors
- Import → dashed arrow
- Merge → hollow arrow

---

## 7. Use Case Diagram

### Shapes
- Actor → stick figure
- Use Case → ellipse
- System boundary → rectangle

### Connectors
- Include / Extend → dashed arrows
- Association → plain line

---

## 8. Sequence Diagram

### Shapes
- Lifeline → vertical dashed line
- Activation → thin rectangle
- Fragment → grouped box

### Connectors
- Sync → filled arrow
- Async → open arrow
- Return → dashed arrow

---

## 9. Activity Diagram

### Shapes
- Start → filled circle
- End → bullseye
- Action → rounded rectangle
- Decision → diamond

### Connectors
- Control flow → solid arrow
- Object flow → dashed arrow

---

## 10. State Machine Diagram

### Shapes
- State → rounded rectangle
- Initial → filled circle
- Final → double circle

### Connectors
- Transition → labeled arrow

---

## 11. Communication Diagram

### Shapes
- Object → labeled rectangle
- Actor → stick figure

### Connectors
- Message → numbered arrow

---

## 12. ER Diagram (⚠️ Most Bug-Prone)

### Shapes
- Entity → rectangle
- Weak Entity → double rectangle
- Attribute → ellipse
- Multivalued → double ellipse
- Relationship → diamond

### Connectors
- ER Line → plain
- One-to-many → crow’s foot

### 🚨 Bug Warning
Weak Entity shapes may cause:
- Duplicate outlines
- Ghost shapes
- Misalignment

### ✅ Fix
- Place slowly (no fast drag)
- Zoom once after placing
- Delete and redraw if broken
- Avoid copy-paste

---

## 13. DFD (Data Flow Diagram)

### Shapes
- Process → circle / rectangle
- Data Store → open rectangle
- External Entity → rectangle

### Connectors
- Data Flow → arrow

---

## 14. Context Diagram

### Shapes
- System → large circle
- External Entity → rectangle

### Connectors
- Data Flow → arrows

---

## 📚 Final Improvements

✔ Bug detection included  
✔ Fix methods added  
✔ Safe drawing practices  
✔ ER diagram handling  
✔ Layout + alignment rules  
✔ Tool-specific stability tips  

---

## 🎯 Final Note

This version is:
- Exam-ready
- Practical
- Tool-safe
- Error-resistant

---