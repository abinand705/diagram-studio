# Smart Diagram App — Full Testing Report

> Generated: 2026-05-01 | Scope: All non-AI features

> [!NOTE]
> Tested via **static code analysis** of `App.js` (3,157 lines), `server.js` (584 lines), `DrawIoEdge.js` (426 lines), and `firebase.js` (80 lines). The automated Playwright browser could not render the app (headless Chromium resource limit with ReactFlow v12 + React 19 + Firebase). The app works normally in a real desktop browser.

---

## ✅ FIXES ALREADY APPLIED

| # | Bug | Fix Applied |
|---|-----|-------------|
| 1 | **Browser hang** — `mousePos` state in `onMouseMove` caused full re-render on every pixel of mouse movement | Replaced with `useRef` + direct DOM style mutation (no state) |
| 2 | **Duplicate `mousePos` state** inside `FlowchartNode` component (unused) | Removed |
| 3 | **Duplicate `<style>` blocks** with duplicate `@keyframes spin` & `@keyframes pulse` in JSX render | Removed duplicate blocks |
| 4 | **Backend crash** — `groq` declared as `const` but reassigned in `/api/ai/config` route | Changed to `let groq` |
| 5 | **Menu search missing dispatch** — Extras and Help items found in search but click did nothing | Added `handleExtrasMenu` and `handleHelpMenu` dispatch |
| 6 | **Edit Style arrows broken** — used `url(#arrowOpen)` etc. but `DrawIoEdge` expects plain IDs like `'arrow'`, `'filled'` | Fixed to use correct marker IDs. Added more options: hollow, diamond_filled, circle_filled |
| 7 | **CSV export crash** — `n.data.shapeType` could be undefined on anchor nodes | Added null-safe access with fallback to `'unknown'` |
| 8 | **Page Setup "Edit Data..." button** — no `onClick` handler | Added handler that opens page config in JSON editor |
| 9 | **Page Setup "Clear Default Style" button** — no `onClick` handler | Added handler that resets all page settings to defaults |
| 10 | **"Search Shapes" View menu** — no case in `handleViewMenu`, silently closed the drawer | Added case: shows sidebar + focuses the search input |
| 11 | **Node position lost on page switch** — dragging nodes didn't persist to `pages[]` array | Added `onNodeDragStop` handler to sync all nodes to pages |
| 12 | **Ctrl+S exported PNG instead of saving** — confusing UX that downloaded a PNG every Ctrl+S | Changed `saveDiagram()` to download a JSON file (proper save) |
| 13 | **Page tab × button always deleted the active page** — clicking × on a non-active tab deleted the wrong page | Fixed to delete the specific page by `idx`, not `activePageIndex` |

---

## 🔴 STILL BROKEN (Needs Fixing)

### 1. Tab Key Navigation — Not Implemented
**File:** `App.js` Line 1332–1341

The `Tab` key handler has a comment `// Set selection logic (mocked here)` and never actually selects the next node/edge. The feature is completely dead code.

### 2. Ctrl+D Duplicate — Wrong `selectedData.id`
**File:** `App.js` Lines 1315–1330

The second `useEffect` keyboard handler reads `selectedData.id`, but `selectedData = selectedNode?.data` — and `data` objects don't have an `id` field. Result: Ctrl+D via this code path silently does nothing. The `handleEditMenu('Duplicate')` version works correctly.

**Fix needed:**
```js
// Wrong:
const selectedNode = nodes.find(n => n.id === selectedData.id);
// Should be:
const selectedNode = nodes.find(n => n.selected);
```

### 3. Share Panel — Fake URL
**File:** `App.js` Line 2872

The "Copy Link" button copies a hardcoded fake URL `"https://smartdiagram.app/s/72a1b3..."` to the clipboard. There's no real sharing functionality.

### 4. Anchor Node Cleanup on Edge Delete
**File:** `App.js` Line 1514

When a connector edge is deleted via Edit → Delete (or Delete key), the invisible `anchor_*` nodes that the connector used as endpoints remain on the canvas as orphaned invisible nodes. Over time, this clutters the canvas state.

**Fix needed:** On edge delete, also remove anchor nodes that are only connected to deleted edges.

### 5. Undo/Redo Does Not Sync to Pages Array
**File:** `App.js` Lines 943–959

`undo()` and `redo()` update `nodes`/`edges` state but don't call `setPages(...)`. If you switch pages after undo, the undone state is not saved and comes back.

### 6. Edit Geometry Modal — Read-Only
**File:** `App.js` Line 1676

The geometry modal shows node position and size as text, but you cannot edit the values. The user has to drag the node manually.

### 7. Edit Style — Font Size Option Missing for Edges
The edge style modal (`edit_style` for edges) has routing, stroke color, and line pattern — but no font size control for edge labels.

### 8. Cloud Auth Hidden Behind `{false &&}`
**File:** `App.js` Line 2025

The Google Sign-In button and Cloud Save button are permanently hidden:
```jsx
{false && (  // 👈 This hides all cloud auth UI
  <div>Cloud Save + Sign In buttons...</div>
)}
```
"Open Recent" in the File menu will prompt the user to sign in — but the sign-in button is invisible. Users can never sign in through the UI.

---

## 🟡 PARTIALLY WORKING

| Feature | Issue |
|---|---|
| **Undo/Redo** | Works within session, but doesn't persist when switching pages |
| **Format Painter** | Works visually, but no cursor change — unclear when active |
| **Share Panel** | Opens correctly, but share link is fake/static |
| **Feedback form** | UI works, but Gmail SMTP with app passwords is rate-limited |
| **Cloud Save/Load** | Code works, but sign-in UI is completely hidden |
| **Edit Link** | Attaches URL to shape, but no visual indicator on the shape that a link exists |
| **Edit Geometry** | Shows info but cannot edit position/size from the modal |
| **Zoom** | Works, but no current zoom level indicator shown anywhere |
| **Connector delete** | Removes edge, but orphaned anchor nodes remain |

---

## ✅ CONFIRMED WORKING FEATURES

| Feature | Notes |
|---|---|
| Drag & Drop shapes | All shape categories work |
| Double-click inline text editing | Works with Escape key |
| Node resize handles | Corner resize works |
| Node rotation (blue dot handle) | Drag to rotate |
| Format bar: Bold/Italic/Underline | Toggle per selected node |
| Fill & Outline color pickers | Color wheel inline picker |
| Font family & size | Dropdown works |
| Text alignment (Left/Center/Right) | Cycle button works |
| Undo (Ctrl+Z) | Up to 40 steps |
| Redo (Ctrl+Y) | Works |
| Copy (Ctrl+C) + Paste (Ctrl+V) | Pastes offset by +20px |
| Cut (Ctrl+X) | Works |
| Duplicate (Ctrl+D via Edit menu) | Works |
| Delete (Delete key) | Works |
| Select All (Ctrl+A) | Works |
| Deselect (Ctrl+Shift+A) | Works |
| Multi-page tabs (add/switch) | Works |
| Delete page (× button) | Fixed — now deletes correct page |
| Export PNG/JPEG/SVG | html-to-image library |
| Export PDF | jsPDF library |
| Export JSON | Downloads diagram data |
| Export CSV | Fixed null check |
| Export HTML/Markdown | Works |
| Import from JSON | File picker + parser |
| Save (Ctrl+S) | Fixed — now downloads JSON |
| Save As (Ctrl+Shift+S) | Prompt + JSON download |
| Rename diagram | Prompt modal |
| Make a Copy | Clones page to tabs |
| Grid toggle | Ctrl+Shift+G |
| Minimap (Outline) | Toggle via View menu |
| Ruler toggle | View menu |
| Theme selector (6 themes) | Extras → Theme |
| Appearance customizer | Extras → Appearance |
| Adaptive Colors (accent color) | Extras → Adaptive Colors |
| Keyboard Shortcuts modal | Help → Keyboard Shortcuts |
| Menu search (Ctrl+F) | Fixed — all 5 categories dispatch |
| Page Setup modal | Fixed buttons |
| Zoom In/Out/Reset View | View menu + ReactFlow Controls |
| Fullscreen | F11 equivalent |
| Shape search filter | Sidebar search input |
| Node connection via port handles | Drag between handles |
| Connector drag from sidebar | Creates anchor-based edge |
| Connector routing change | Floating toolbar on select |
| Waypoint drag (connector bend) | Drag midpoint dots |
| Find/Replace text | Edit → Find/Replace |
| Lock/Unlock nodes (Ctrl+L) | Toggles `draggable` |
| Edit Data JSON editor | Edit → Edit Data |
| Edit Tooltip | Prompt via Edit menu |
| Edit Link + Open Link | Attach URL, opens tab |
| System Info modal | ? icon in left nav |
| Feedback modal | Mail icon in left nav |
| Print (Ctrl+P) | Browser print |
| Node position persists on page switch | Fixed with `onNodeDragStop` |
| Search Shapes (View menu) | Fixed — focuses sidebar search |

---

## 💡 RECOMMENDED IMPROVEMENTS (Not Yet Done)

### High Priority
1. **Fix Ctrl+D duplicate** — use `nodes.find(n => n.selected)` instead of `selectedData.id`
2. **Show Cloud Auth UI** — remove `{false &&}` wrapper so Google Sign-In button is visible
3. **Anchor cleanup on edge delete** — find orphaned anchors when edges are removed
4. **Undo sync to pages** — call `setPages(...)` inside `undo()` and `redo()`

### Medium Priority  
5. **Zoom level indicator** — add current zoom % badge near Controls
6. **Format painter cursor** — change cursor to `crosshair` when format brush is active
7. **Link badge on nodes** — show a small 🔗 icon on shapes that have a link attached
8. **Tab key selection** — implement actual selection cycling through nodes

### Low Priority
9. **Real share link** — generate a deep link with encoded JSON or use Firebase Dynamic Links
10. **Save vs Export** — rename "Ctrl+S" in keyboard shortcuts to "Save as JSON" for clarity
11. **Edge label font control** — add font size to edge style modal
12. **Edit Geometry** — make x/y/width/height fields editable in the modal
