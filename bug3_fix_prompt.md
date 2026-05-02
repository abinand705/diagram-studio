# Bug Report: Incorrect Tooltip/Label Display During Shape Dragging

## Bug Definition

**Issue:** When a user drags a shape from the sidebar panel onto the canvas, the tooltip/label displaying the shape name appears in the wrong position or is not tracking correctly with the mouse cursor/dragged element.

**Root Cause:** The tooltip positioning logic is likely using absolute positioning based on the sidebar's coordinate system rather than the viewport/canvas coordinate system. This causes the label to appear displaced or offset from the actual dragged shape.

**Observed Behavior:**
- Frame 1-4: User hovers over a Rounded Rectangle shape in the General section
- Frame 2-3: User starts dragging the shape onto the canvas - tooltip shows "Rounded Rect"
- Frame 4-5: User hovers over an Ellipse shape - tooltip shows "Ellipse" but appears offset/misaligned
- Frame 6-8: When dragging the Ellipse, the label positioning continues to be incorrect - appearing below/displaced from the cursor position
- The tooltip label should follow the cursor/dragged element but instead appears in a fixed/incorrect position

**Expected Behavior:**
- When hovering over a shape or dragging it, the tooltip should display the shape name
- The tooltip position should be relative to the viewport/cursor, not the sidebar
- The label should appear near the shape icon or cursor during drag operations
- No offset or misalignment between the visual element and its label

**Key Problem:** Tooltip/label is using incorrect coordinate space (sidebar local coordinates instead of viewport coordinates)

---

## Prompt to Fix the Bug

```
TOOLTIP POSITIONING BUG - Shape Palette Drag & Drop

PROBLEM:
When users drag shapes from the sidebar panel onto the canvas, or hover over shapes, 
the shape name tooltip/label displays with incorrect positioning. The label appears 
displaced or offset from where it should be (near the shape icon or cursor).

ISSUE DETAILS:
- Tooltip is being positioned relative to the sidebar's local coordinate system
- Should be positioned relative to the viewport/document
- During drag operations, the tooltip doesn't follow the cursor correctly
- The positioning offset appears consistent, suggesting hardcoded or inherited coordinates

SYMPTOMS OBSERVED:
1. Tooltip label appears offset/below the hovered shape
2. During drag operations, the label position doesn't update correctly
3. The tooltip uses sidebar-relative coordinates instead of viewport-relative
4. Labels like "Ellipse", "Rounded Rect" appear in wrong screen positions

ROOT CAUSE ANALYSIS:
1. Check the tooltip/label positioning function - likely using:
   - clientX/clientY or pageX/pageY incorrectly
   - Sidebar's getBoundingClientRect() without proper offset calculation
   - element.offsetTop/offsetLeft without accounting for parent scroll/position

2. Verify the positioning context:
   - Is the tooltip positioned: absolute? (if so, what's the positioned parent?)
   - Are coordinates being calculated relative to sidebar vs viewport?
   - Is there scrolling offset being ignored?

SOLUTION APPROACH:

1. **Fix Tooltip Positioning Context:**
   ```javascript
   // WRONG - sidebar-relative coordinates
   const sidebarRect = sidebarElement.getBoundingClientRect();
   tooltip.style.left = event.clientX - sidebarRect.left + 'px';
   
   // CORRECT - viewport-relative coordinates
   tooltip.style.left = event.clientX + 'px';
   tooltip.style.top = event.clientY + 'px';
   ```

2. **For Dragged Items, Update Tooltip Position on Mouse Move:**
   ```javascript
   document.addEventListener('mousemove', (event) => {
     if (isDragging) {
       tooltip.style.left = (event.clientX + 10) + 'px';  // Offset for clarity
       tooltip.style.top = (event.clientY + 10) + 'px';
     }
   });
   ```

3. **Ensure Tooltip Container Has Correct Position Context:**
   - Tooltip should be positioned: fixed or absolute within body
   - NOT nested within the sidebar (or will inherit sidebar's coordinate space)
   - Use React Portal or append to document.body if using React

4. **Account for Scroll Offset if Using Absolute Positioning:**
   ```javascript
   const tooltip = document.getElementById('tooltip');
   tooltip.style.position = 'fixed'; // Use 'fixed' not 'absolute'
   tooltip.style.left = (event.clientX + 10) + 'px';
   tooltip.style.top = (event.clientY + 10) + 'px';
   ```

5. **Handle Window Scroll (if using absolute):**
   ```javascript
   const tooltip = document.getElementById('tooltip');
   tooltip.style.position = 'absolute';
   tooltip.style.left = (event.clientX + window.scrollX + 10) + 'px';
   tooltip.style.top = (event.clientY + window.scrollY + 10) + 'px';
   ```

6. **Test the Fix:**
   - Hover over shapes in sidebar - tooltip should appear near the shape
   - Drag shapes onto canvas - tooltip should track with cursor
   - Label text should be clearly visible and not offset
   - Works correctly with different sidebar widths/positions

KEY FILES TO CHECK:
- Shape palette/sidebar component
- Tooltip/label rendering component
- Drag handler event listeners
- CSS styling for tooltip positioning
- Parent element containing the tooltip
```

---

## Technical Details

### Current Behavior (Buggy)
1. User hovers over "Ellipse" shape
2. `onMouseEnter` or hover event triggers
3. Tooltip position calculated using **sidebar-relative coordinates**
4. Result: Tooltip appears offset/displaced from the shape

### Expected Behavior (Fixed)
1. User hovers over "Ellipse" shape
2. `onMouseEnter` triggers
3. Tooltip position calculated using **viewport-relative coordinates**
4. Result: Tooltip appears next to/near the shape icon

---

## Test Cases for Verification

1. **Test: Static Hover**
   - Action: Hover over shapes in the sidebar
   - Expected: Tooltip appears directly near the shape, no offset
   - Actual: ❌ Tooltip appears offset/displaced

2. **Test: Drag Operations**
   - Action: Drag a shape from sidebar to canvas
   - Expected: Tooltip follows cursor position closely
   - Actual: ❌ Tooltip appears in wrong position, doesn't track properly

3. **Test: Multiple Shapes**
   - Action: Quickly hover over different shapes
   - Expected: Tooltip position adjusts correctly for each shape
   - Actual: ❌ Position calculations appear to use wrong reference point

4. **Test: Scroll Awareness**
   - Action: Scroll the sidebar, then hover shapes
   - Expected: Tooltip respects current scroll position
   - Actual: ❌ Tooltip positioning ignores scroll offset

---

## Implementation Priority

**HIGH** - This affects user experience during drag-and-drop operations
**SCOPE** - Tooltip positioning module only
**RISK** - Low risk if using position: fixed with viewport coordinates
**TESTING** - Can be tested manually by hovering and dragging shapes

---

## Related Code Areas

- Sidebar shape item component
- Tooltip/popup component  
- Drag & drop event handlers
- Mouse event position calculations
- CSS positioning rules for tooltip element
