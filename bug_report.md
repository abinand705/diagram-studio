# Bug Report: Accordion/Collapsible Section State Not Persisting

## Bug Definition

**Issue:** The "Lines & Connectors" section in the shape panel is expanded in the initial state (frames 1-3), but when the user scrolls down to interact with other sections like "ER Diagram," the "Lines & Connectors" section unexpectedly collapses (visible in frame 4), and then when scrolling back or continuing, a rectangle element appears below the collapsed "ER Diagram" section (frame 5).

**Root Cause:** The collapsible section state is not being properly maintained when the component re-renders or when other UI elements are interacted with. The accordion/collapsible component is likely losing its state reference or the state management is being reset during re-renders.

**Observed Behavior:**
- Frame 1-3: "Lines & Connectors" section is expanded (chevron pointing down)
- Frame 4: After expanding "ER Diagram", "Lines & Connectors" has unexpectedly collapsed (chevron should still be down but appears up)
- Frame 5: A stray filled rectangle shape element appears below ER Diagram section, indicating potential state/rendering issues

**Expected Behavior:**
- Once a section is expanded, it should remain expanded until explicitly clicked to collapse
- Interacting with other sections should not affect the state of previously expanded sections
- No ghost/orphaned UI elements should appear during state transitions

---

## Prompt to Fix the Bug

```
The accordion/collapsible sections in the left sidebar shape panel have a state management issue. 

PROBLEM:
When a user expands a section (like "Lines & Connectors"), scrolls down to interact with another section (like "ER Diagram"), the previously expanded section unexpectedly collapses. Additionally, ghost UI elements (rectangles) appear in the panel.

SYMPTOMS:
1. Expanded sections collapse when they shouldn't
2. State is not persisting across component re-renders
3. Stray/orphaned shape elements appear in the DOM

ROOT CAUSE ANALYSIS NEEDED:
- Check if the expanded/collapsed state is stored in local component state (useState) or if it's being reset
- Verify that the collapse/expand handlers are using proper state immutability
- Ensure that when one section is expanded, it properly maintains all other sections' states
- Check for any unintended re-renders or state flushes during scroll events or sibling component interactions

FIX APPROACH:
1. Use a state object or Map to track the expanded/collapsed state of ALL sections simultaneously
   - Example: const [expandedSections, setExpandedSections] = useState({ general: true, linesConnectors: true, classDiagram: false, ... })

2. Create a toggle handler that only updates the specific section without affecting others:
   ```javascript
   const toggleSection = (sectionName) => {
     setExpandedSections(prev => ({
       ...prev,
       [sectionName]: !prev[sectionName]
     }));
   };
   ```

3. Ensure the state is not being cleared or reset during:
   - Scroll events
   - Parent component re-renders
   - Sibling section interactions

4. Clean up any stray DOM elements that might be created during state transitions

5. Test that:
   - Expanding Section A then Section B keeps both expanded
   - Collapsing a section only collapses that specific section
   - Scrolling within the panel doesn't affect section states
   - No orphaned UI elements appear
```

---

## Test Cases for Verification

1. **Test: Expand multiple sections sequentially**
   - Action: Expand "Lines & Connectors", then expand "ER Diagram"
   - Expected: Both sections remain expanded
   - Actual: ❌ "Lines & Connectors" collapses unexpectedly

2. **Test: Scroll and verify state persistence**
   - Action: Expand a section, scroll down, scroll back up
   - Expected: Expanded section remains expanded
   - Actual: ❌ State is lost

3. **Test: No orphaned elements**
   - Action: Expand/collapse sections multiple times
   - Expected: No stray shapes or elements appear
   - Actual: ❌ Orphaned rectangle element appears

---

## Files Likely Involved
- Component handling accordion/collapsible sections
- State management for shape panel visibility
- Sidebar/panel component that houses the shape categories
