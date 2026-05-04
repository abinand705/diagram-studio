import React, { useState, useMemo } from 'react';
import { BaseEdge, EdgeLabelRenderer, useReactFlow, useNodes } from '@xyflow/react';
import { getSharpPath, getRoundedPath, getCurvedPath, getStraightPath, getOrthogonalPath, getMidpoint, findSegmentIndex, getJumpsPathData } from './DrawIoEdgeUtils';

  export default function DrawIoEdge({ id, source, target, sourceX, sourceY, targetX, targetY, data, selected, style }) {
  const { setEdges, screenToFlowPosition, getEdges } = useReactFlow();
  const nodes = useNodes();
  const [labelEditing, setLabelEditing] = useState(false);
  const [isDraggingLabel, setIsDraggingLabel] = useState(false);

  const waypoints = data?.waypoints || [];
  const routing = data?.routing || 'sharp';
  const strokeColor = data?.stroke || style?.stroke || '#000000';
  const strokeWidth = data?.strokeWidth || style?.strokeWidth || 2;
  const strokeDash = data?.strokeDash || [];
  const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  const showJumps = data?.showJumps !== false && !IS_MOBILE;

  // Read marker ids from data (references to global SVG <defs> in App.js)
  const dataMarkerStart = data?.markerStart && data.markerStart !== 'none' ? data.markerStart : null;
  const dataMarkerEnd = data?.markerEnd && data.markerEnd !== 'none' ? data.markerEnd : null;

  // Hardened numeric safety check
  const toNum = (val, fallback = 0) => {
    const n = parseFloat(val);
    return Number.isNaN(n) ? fallback : n;
  };

  const isInvalid = (v) => v === undefined || v === null || Number.isNaN(v);

  let sX = sourceX, sY = sourceY, tX = targetX, tY = targetY;

  // If props are missing or invalid, fall back to node center or stored data
  if (isInvalid(sX)) {
    const node = nodes.find(n => n.id === source);
    if (node) {
      const nX = toNum(node.positionAbsolute?.x ?? node.position?.x);
      const nY = toNum(node.positionAbsolute?.y ?? node.position?.y);
      const nW = toNum(node.measured?.width, node.type === 'anchor' ? 0 : 140);
      const nH = toNum(node.measured?.height, node.type === 'anchor' ? 0 : 80);
      sX = nX + (node.type === 'anchor' ? 0 : nW / 2);
      sY = nY + (node.type === 'anchor' ? 0 : nH / 2);
    } else {
      sX = toNum(data?.fallbackStartX);
      sY = toNum(data?.fallbackStartY);
    }
  }
  
  if (isInvalid(tX)) {
    const node = nodes.find(n => n.id === target);
    if (node) {
      const nX = toNum(node.positionAbsolute?.x ?? node.position?.x);
      const nY = toNum(node.positionAbsolute?.y ?? node.position?.y);
      const nW = toNum(node.measured?.width, node.type === 'anchor' ? 0 : 140);
      const nH = toNum(node.measured?.height, node.type === 'anchor' ? 0 : 80);
      tX = nX + (node.type === 'anchor' ? 0 : nW / 2);
      tY = nY + (node.type === 'anchor' ? 0 : nH / 2);
    } else {
      tX = toNum(data?.fallbackEndX);
      tY = toNum(data?.fallbackEndY);
    }
  }

  // Ensure final values are never NaN for the path string
  sX = toNum(sX); sY = toNum(sY);
  tX = toNum(tX); tY = toNum(tY);

  // Construct total points array: Source -> ...Waypoints -> Target
  const pts = [{ x: sX, y: sY }, ...waypoints, { x: tX, y: tY }];

  let pathData = '';
  if (routing === 'rounded') {
    pathData = getRoundedPath(pts, 10);
  } else if (routing === 'curved') {
    pathData = getCurvedPath(pts, 0.25);
  } else if (routing === 'straight') {
    pathData = getStraightPath(pts);
  } else if (routing === 'orthogonal') {
    pathData = getOrthogonalPath(pts);
  } else {
    // sharp
    pathData = getSharpPath(pts);
  }

  // Apply Line Jumps if enabled
  if (showJumps) {
    const allEdges = getEdges();
    // Only jump over edges that were created BEFORE this one (lower ID/z-index sim)
    const otherEdgesPoints = allEdges
      .filter(e => e.id !== id && e.type === 'drawio' && e.id < id) 
      .map(e => {
        const sourceNode = nodes.find(n => n.id === e.source);
        const targetNode = nodes.find(n => n.id === e.target);
        if (!sourceNode || !targetNode) return null;
        
        const swp = e.data?.waypoints || [];
        // Approximate points (React Flow sourceX/Y are props for current edge, but for others we need to calculate)
        // This is a bit complex since we don't have sourceX/Y for OTHER edges easily.
        // We'll use node positions as fallback.
        return [
          { x: sourceNode.position.x + (sourceNode.measured?.width || 140)/2, y: sourceNode.position.y + (sourceNode.measured?.height || 80)/2 },
          ...swp,
          { x: targetNode.position.x + (targetNode.measured?.width || 140)/2, y: targetNode.position.y + (targetNode.measured?.height || 80)/2 }
        ];
      })
      .filter(Boolean);

    if (otherEdgesPoints.length > 0) {
      pathData = getJumpsPathData(pts, otherEdgesPoints);
    }
  }


  const labelOffsetX = data?.labelOffsetX || 0;
  const labelOffsetY = data?.labelOffsetY || 0;
  
  const labelText = data?.label || '';
  const midIndex = Math.floor((pts.length - 1) / 2);
  const labelPos = pts.length % 2 === 0
    ? getMidpoint(pts[midIndex], pts[midIndex + 1])
    : pts[midIndex];

  const handleWaypointDragStart = (e, index) => {
    e.stopPropagation();
    
    // Check if it's a double-click to remove
    if (e.detail === 2) {
      setEdges((eds) => eds.map((edge) => {
        if (edge.id === id) {
          const newWp = [...waypoints];
          newWp.splice(index, 1);
          return { ...edge, data: { ...edge.data, waypoints: newWp } };
        }
        return edge;
      }));
      return;
    }

    const onPointerMove = (moveEvt) => {
      moveEvt.preventDefault();
      moveEvt.stopPropagation();
      let newPos = screenToFlowPosition({ x: moveEvt.clientX, y: moveEvt.clientY });
      
      // Axis locking with Shift or if in Orthogonal mode
      if (moveEvt.shiftKey || routing === 'orthogonal') {
        const prevPt = index === 0 ? { x: sX, y: sY } : waypoints[index - 1];
        const nextPt = index === waypoints.length - 1 ? { x: tX, y: tY } : waypoints[index + 1];
        
        // Lock to whichever neighbor is closer to current axis, prioritizing previous
        const dxPrev = Math.abs(newPos.x - prevPt.x);
        const dyPrev = Math.abs(newPos.y - prevPt.y);
        const dxNext = Math.abs(newPos.x - nextPt.x);
        const dyNext = Math.abs(newPos.y - nextPt.y);

        if (dxPrev < 20) {
          newPos.x = prevPt.x;
        } else if (dyPrev < 20) {
          newPos.y = prevPt.y;
        } else if (dxNext < 20) {
          newPos.x = nextPt.x;
        } else if (dyNext < 20) {
          newPos.y = nextPt.y;
        }
      }

      setEdges((eds) => eds.map((edge) => {
        if (edge.id === id) {
          const newWp = [...(edge.data?.waypoints || [])];
          newWp[index] = newPos;
          return { ...edge, data: { ...edge.data, waypoints: newWp } };
        }
        return edge;
      }));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleMidpointDragStart = (e, segmentIndex) => {
    e.stopPropagation();
    
    // Initial position of the new waypoint
    const initialPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
    
    // Inject it into the edges data FIRST
    setEdges((eds) => eds.map((edge) => {
      if (edge.id === id) {
        const newWp = [...(edge.data?.waypoints || [])];
        newWp.splice(segmentIndex, 0, initialPos); 
        return { ...edge, data: { ...edge.data, waypoints: newWp } };
      }
      return edge;
    }));

    // Now start dragging it exactly like an existing waypoint, 
    // whose index is now the segmentIndex we just inserted at.
    const newWpIndex = segmentIndex;

    const onPointerMove = (moveEvt) => {
      moveEvt.preventDefault();
      moveEvt.stopPropagation();
      let newPos = screenToFlowPosition({ x: moveEvt.clientX, y: moveEvt.clientY });
      
      // Axis locking with Shift or if in Orthogonal mode
      if (moveEvt.shiftKey || routing === 'orthogonal') {
        const prevPt = segmentIndex === 0 ? { x: sX, y: sY } : waypoints[segmentIndex - 1];
        const nextPt = segmentIndex === waypoints.length ? { x: tX, y: tY } : waypoints[segmentIndex];
        
        const dxPrev = Math.abs(newPos.x - prevPt.x);
        const dyPrev = Math.abs(newPos.y - prevPt.y);
        const dxNext = Math.abs(newPos.x - nextPt.x);
        const dyNext = Math.abs(newPos.y - nextPt.y);

        if (dxPrev < 20) {
          newPos.x = prevPt.x;
        } else if (dyPrev < 20) {
          newPos.y = prevPt.y;
        } else if (dxNext < 20) {
          newPos.x = nextPt.x;
        } else if (dyNext < 20) {
          newPos.y = nextPt.y;
        }
      }

      setEdges((eds) => eds.map((edge) => {
        if (edge.id === id) {
          const newWp = [...(edge.data?.waypoints || [])];
          newWp[newWpIndex] = newPos;
          return { ...edge, data: { ...edge.data, waypoints: newWp } };
        }
        return edge;
      }));
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const interactiveAreaPadding = 15;

  return (
    <>
      {/* Line Compositing Jumps: thick background stroke simulating arc cuts over lower lines */}
      {pathData && pathData.length > 6 && showJumps && (
        <BaseEdge 
          id={id + '_jump_bg'}
          path={pathData}
          style={{ stroke: '#f1f5f9', strokeWidth: strokeWidth + 8, fill: 'none', strokeLinecap: 'round' }}
        />
      )}
      {data?.isDoubleLine ? (
        <>
          <BaseEdge 
            id={id + '_inner1'}
            path={pathData || 'M 0 0 L 0 0'}
            style={{ ...style, stroke: strokeColor, strokeWidth: 1.5, fill: 'none' }}
          />
          <BaseEdge 
            id={id + '_inner2'}
            path={pathData || 'M 0 0 L 0 0'}
            style={{ ...style, stroke: strokeColor, strokeWidth: 1.5, fill: 'none' }}
          />
        </>
      ) : (
        <BaseEdge 
          id={id}
          path={pathData || 'M 0 0 L 0 0'}
          markerStart={dataMarkerStart ? `url(#${dataMarkerStart})` : undefined}
          markerEnd={dataMarkerEnd ? `url(#${dataMarkerEnd})` : undefined}
          style={{
            ...style,
            stroke: strokeColor,
            strokeWidth: strokeWidth,
            strokeDasharray: strokeDash.length > 0 ? strokeDash.join(' ') : undefined,
            fill: 'none'
          }}
        />
      )}
      {/* Invisible interaction layer to make selecting easier */}
      <BaseEdge 
        id={id + '_interactive'}
        path={pathData}
        style={{ stroke: 'transparent', fill: 'none', strokeWidth: Math.max(20, strokeWidth + 10) }}
        onDoubleClick={(e) => {
          const clickPos = screenToFlowPosition({ x: e.clientX, y: e.clientY });
          const segmentIdx = findSegmentIndex(pts, clickPos);
          setEdges(eds => eds.map(edge => {
            if (edge.id === id) {
              const newWp = [...(edge.data?.waypoints || [])];
              // segmentIdx is relative to pts (Source, Wp1, Wp2, Target)
              // if segmentIdx is 0, it means segment between Source and Wp1 (or Target if no waypoints)
              // so new waypoint should be inserted at index segmentIdx in the waypoints array.
              newWp.splice(segmentIdx, 0, clickPos);
              return { ...edge, data: { ...edge.data, waypoints: newWp } };
            }
            return edge;
          }));
        }}
      />

      <EdgeLabelRenderer>
        {/* Edge text label or input */}
        <div style={{
          position: 'absolute',
          transform: `translate(-50%, -50%) translate(${labelPos.x}px,${labelPos.y}px)`,
          pointerEvents: 'all',
          zIndex: 2,
        }}>
          {labelEditing ? (
             <input 
               autoFocus
               defaultValue={labelText}
               onBlur={(e) => {
                 setLabelEditing(false);
                 setEdges(eds => eds.map(edge => edge.id === id ? { ...edge, data: { ...edge.data, label: e.target.value } } : edge));
               }}
               onKeyDown={(e) => { if(e.key === 'Enter' || e.key === 'Escape') e.target.blur(); }}
               style={{ fontSize: 12, padding: '2px 4px', border: '1px solid #0ea5e9', borderRadius: 4, outline: 'none' }}
             />
          ) : (
             labelText && (
               <div 
                 onDoubleClick={() => setLabelEditing(true)}
                 onPointerDown={(e) => {
                   e.stopPropagation();
                   setIsDraggingLabel(true);
                   const startX = e.clientX;
                   const startY = e.clientY;
                   const initOffX = labelOffsetX;
                   const initOffY = labelOffsetY;

                   const onMove = (moveEvt) => {
                     const dx = moveEvt.clientX - startX;
                     const dy = moveEvt.clientY - startY;
                     setEdges(eds => eds.map(edge => edge.id === id ? { ...edge, data: { ...edge.data, labelOffsetX: initOffX + dx, labelOffsetY: initOffY + dy } } : edge));
                   };

                   const onUp = () => {
                     setIsDraggingLabel(false);
                     window.removeEventListener('pointermove', onMove);
                     window.removeEventListener('pointerup', onUp);
                   };

                   window.addEventListener('pointermove', onMove);
                   window.addEventListener('pointerup', onUp);
                 }}
                 style={{ 
                   fontSize: 12, 
                   padding: '2px 6px', 
                   background: '#fff', 
                   boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                   borderRadius: 4, 
                   cursor: isDraggingLabel ? 'grabbing' : 'grab', 
                   userSelect: 'none', 
                   whiteSpace: 'nowrap',
                   transform: `translate(${labelOffsetX}px, ${labelOffsetY}px)`
                 }}
               >
                 {labelText}
               </div>
             )
          )}
          
          {/* Floating Toolbar inside EdgeLabelRenderer */}
          {selected && !labelEditing && (
            <div 
              style={{ 
                position: 'absolute', 
                bottom: '100%', 
                left: '50%', 
                transform: 'translate(-50%, -12px)', 
                background: 'rgba(255, 255, 255, 0.9)', 
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(226, 232, 240, 0.8)', 
                borderRadius: '12px', 
                display: 'flex', 
                boxShadow: '0 12px 24px -6px rgba(0,0,0,0.12)', 
                padding: '6px', 
                gap: '4px', 
                zIndex: 20,
                alignItems: 'center'
              }}
            >
              <div 
                title="Edit Label"
                onClick={(e) => { e.stopPropagation(); setLabelEditing(true); }}
                style={{ 
                  width: '28px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer', 
                  borderRadius: '8px', 
                  fontSize: '14px',
                  transition: 'background 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                <span style={{ transform: 'translateY(-1px)' }}>✎</span>
              </div>
              <div style={{ width: '1px', height: '16px', background: 'rgba(226, 232, 240, 1)' }} />
              <div 
                title={`Routing: ${routing}`}
                onClick={(e) => {
                   e.stopPropagation();
                    const routes = ['sharp', 'rounded', 'curved', 'straight', 'orthogonal'];
                    const next = routes[(routes.indexOf(routing) + 1) % routes.length];
                   setEdges(eds => eds.map(edge => edge.id === id ? { ...edge, data: { ...edge.data, routing: next } } : edge));
                }}
                style={{ 
                  padding: '4px 10px', 
                  cursor: 'pointer', 
                  borderRadius: '8px', 
                  fontSize: '11px', 
                  fontWeight: '700', 
                  color: '#475569',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex', 
                  alignItems: 'center',
                  transition: 'background 0.2s',
                  whiteSpace: 'nowrap'
                }}
                onMouseOver={e => e.currentTarget.style.background = 'rgba(59, 130, 246, 0.1)'}
                onMouseOut={e => e.currentTarget.style.background = 'none'}
              >
                {routing === 'sharp' && 'Sharp'}
                {routing === 'rounded' && 'Round'}
                {routing === 'curved' && 'Curve'}
                {routing === 'straight' && 'Straight'}
                {routing === 'orthogonal' && 'Ortho'}
              </div>
            </div>
          )}
        </div>
      </EdgeLabelRenderer>
      
      {/* Interaction Handles (Waypoints and Midpoints) */}
      {selected && (
        <>
          {waypoints.map((wp, idx) => (
            <circle
              key={`wp-${idx}`}
              cx={wp.x}
              cy={wp.y}
              r={IS_MOBILE ? 8 : 5}
              fill="#fff"
              stroke="#0ea5e9"
              strokeWidth={2}
              style={{ cursor: 'move', pointerEvents: 'all', touchAction: 'none' }}
              onPointerDown={(e) => handleWaypointDragStart(e, idx)}
            />
          ))}
          {pts.slice(0, -1).map((p1, idx) => {
            const p2 = pts[idx + 1];
            const mid = getMidpoint(p1, p2);
            return (
              <circle
                key={`mid-${idx}`}
                cx={mid.x}
                cy={mid.y}
                r={IS_MOBILE ? 6 : 4}
                fill="#fff"
                stroke="#0ea5e9"
                strokeWidth={1.5}
                strokeDasharray="2,2"
                style={{ cursor: 'crosshair', pointerEvents: 'all', opacity: 0.8, touchAction: 'none' }}
                onPointerDown={(e) => handleMidpointDragStart(e, idx)}
              />
            );
          })}
        </>
      )}
    </>
  );
}
