import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { signInWithGoogle, signOutUser, onAuthChange, saveDiagramToCloud, listUserDiagrams, loadDiagramFromCloud } from "./firebase";
import { toPng, toJpeg, toSvg } from "html-to-image";
import { jsPDF } from "jspdf";
import dagre from "dagre";
import DrawIoEdge from "./DrawIoEdge";
import { applyAdvancedErLayout as runErLayoutEngine, generateChenDiagramV3 } from "./ErLayoutEngine";
import { SIDEBAR_CATEGORIES, getCustomShapeSvg, getConnectorPreviewSvg } from "./ShapesConfig";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  useReactFlow,
  NodeResizer,
  MarkerType,
  ConnectionLineType
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Menu, Undo2, Redo2, Search, Type, PaintBucket,
  ChevronDown, Save, FileJson, Image, Plus,
  AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline,
  Wand2, Frame, Download, MoreHorizontal, Check, HelpCircle, Sparkles, FileText, Mail
} from "lucide-react";

const DottedUnderlineIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 4v6a6 6 0 0 0 12 0V4" />
    <line x1="4" y1="20" x2="6" y2="20" />
    <line x1="10" y1="20" x2="14" y2="20" />
    <line x1="18" y1="20" x2="20" y2="20" />
  </svg>
);

// Suppress harmless ResizeObserver errors in development
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    if (e.message === 'ResizeObserver loop completed with undelivered notifications.' || e.message === 'ResizeObserver loop limit exceeded') {
      const resizeObserverErrDiv = document.getElementById('webpack-dev-server-client-overlay-div');
      const resizeObserverErr = document.getElementById('webpack-dev-server-client-overlay');
      if (resizeObserverErr) resizeObserverErr.style.display = 'none';
      if (resizeObserverErrDiv) resizeObserverErrDiv.style.display = 'none';
      e.stopImmediatePropagation();
    }
  });
}


// ==================== EDGE TYPES ====================
const edgeTypes = {
  drawio: DrawIoEdge,
  smoothstep: undefined // Native React Flow
};

// ==================== MODERN LIGHT THEME NODE COMPONENTS ====================

// ==================== MODERN SVG FLOWCHART NODE ====================

const handleStyle = { 
  opacity: 1, 
  width: "8px", 
  height: "8px", 
  background: "var(--theme-color)", 
  border: "1px solid #ffffff",
  minWidth: "8px",
  minHeight: "8px",
  zIndex: 1000
};

const getShapeSvg = (shape, stroke, strokeW, fill) => {
  const custom = getCustomShapeSvg(shape, stroke, strokeW, fill, 100, 100);
  if (custom) return custom;

  switch (shape) {
    case 'rectangle_rounded':
      return <rect x="0" y="0" width="100" height="100" rx="15" fill={fill} stroke={stroke} strokeWidth={strokeW} vectorEffect="non-scaling-stroke" />;
    case 'ellipse':
    case 'attribute':
    case 'key_attribute':
    case 'foreign_key_attribute':
    case 'multi_valued_attr':
      return <ellipse cx="50" cy="50" rx="48" ry="30" fill={fill} stroke={stroke} strokeWidth={strokeW} vectorEffect="non-scaling-stroke" />;
    case 'ellipse_underline':
      return (
        <g>
          <ellipse cx="50" cy="50" rx="48" ry="32" fill={fill} stroke={stroke} strokeWidth={strokeW} vectorEffect="non-scaling-stroke" />
          <line x1="20" y1="65" x2="80" y2="65" stroke={stroke} strokeWidth={strokeW} vectorEffect="non-scaling-stroke" />
        </g>
      );
    case 'diamond':
    case 'decision':
    case 'relationship':
      return <path d="M 50 0 L 100 50 L 50 100 L 0 50 Z" fill={fill} stroke={stroke} strokeWidth={strokeW} vectorEffect="non-scaling-stroke" />;
    case 'circle':
    case 'connector':
      return <circle cx="50" cy="50" r="45" fill={fill} stroke={stroke} strokeWidth={strokeW} vectorEffect="non-scaling-stroke" />;
    case 'text':
      return (
        <g>
          <rect x="0" y="0" width="100" height="100" fill="none" stroke="none" />
          <text x="50" y="72" textAnchor="middle" fill={stroke} fontSize="64" fontFamily="serif" fontWeight="bold">T</text>
        </g>
      );
    default:
      return <rect x="0" y="0" width="100" height="100" fill={fill} stroke={stroke} strokeWidth={strokeW} vectorEffect="non-scaling-stroke" />;
  }
};

const FlowchartNode = ({ id, data, selected }) => {
  const shape = data.shapeType || data.shape || 'rectangle';
  const label = data.label || '';
  const stroke = selected ? "var(--theme-color)" : (data.strokeColor || "#000000");
  const strokeW = selected ? 2 : 1;
  const fill = data.fillColor || "#ffffff";

  const textStyle = {
    fontFamily: data.fontFamily || "'Inter', 'Segoe UI', Tahoma, sans-serif",
    fontSize: data.fontSize ? `${data.fontSize}px` : "13px",
    fontWeight: data.bold ? "bold" : "normal",
    fontStyle: data.italic ? "italic" : "normal",
    textAlign: data.textAlign || "center",
    textDecorationLine: (data.underline || data.dottedUnderline) ? "underline" : "none",
    textDecorationStyle: data.dottedUnderline ? "dotted" : "solid",
    textDecorationThickness: (data.underline || data.dottedUnderline) ? "2px" : "auto",
    textUnderlineOffset: "4px",
    color: data.color || "#000000",
  };

  const [isEditing, setIsEditing] = useState(false);
  const { setNodes } = useReactFlow();
  const nodeRef = useRef(null);

  const rotation = data.rotation || 0;
  const isLine = shape.startsWith('diagonal');

  const handleRotateStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!nodeRef.current) return;
    const rect = nodeRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const onPointerMove = (moveEvent) => {
      moveEvent.stopPropagation();
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      // angle in degrees. Adding 90 so that 'up' is rotation 0 relative to standard SVG axes
      let rad = Math.atan2(dy, dx);
      let deg = (rad * 180) / Math.PI + 90;
      const roundedDeg = Math.round(deg);
      setNodes((nds) => nds.map((n) => {
        if (n.id === id) {
          return { 
            ...n, 
            data: { ...n.data, rotation: roundedDeg }
          };
        }
        return n;
      }));
    };

    const onPointerUp = () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };

    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
  };

  const handleDoubleClick = () => setIsEditing(true);

  const handleBlur = (e) => {
    setIsEditing(false);
    const newText = e.target.value;
    setNodes((nds) => nds.map((n) => {
      if (n.id === id) {
        n.data = { ...n.data, label: newText };
      }
      return n;
    }));
  };



  const nodeWidth = data.width || 140;
  const nodeHeight = data.height || 80;

  return (
    <div className="anim-node-entrance" style={{ position: 'relative', width: nodeWidth, height: nodeHeight }}>
      {/* React Flow Handles - Using string positions for maximum reliability */}
      <Handle id="port-0" type="source" position="top" style={handleStyle} />
      <Handle id="port-0-t" type="target" position="top" style={handleStyle} />
      <Handle id="port-1" type="source" position="right" style={handleStyle} />
      <Handle id="port-1-t" type="target" position="right" style={handleStyle} />
      <Handle id="port-2" type="source" position="bottom" style={handleStyle} />
      <Handle id="port-2-t" type="target" position="bottom" style={handleStyle} />
      <Handle id="port-3" type="source" position="left" style={handleStyle} />
      <Handle id="port-3-t" type="target" position="left" style={handleStyle} />

      <Handle type="source" position="left" id="chen-left" style={{ ...handleStyle, top: '50%', background: '#ef4444', border: '1px solid white' }} />
      <Handle type="target" position="left" id="chen-left-t" style={{ ...handleStyle, top: '50%', background: '#22c55e', border: '1px solid white' }} />
      <Handle type="source" position="right" id="chen-right" style={{ ...handleStyle, top: '50%', background: '#ef4444', border: '1px solid white' }} />
      <Handle type="target" position="right" id="chen-right-t" style={{ ...handleStyle, top: '50%', background: '#22c55e', border: '1px solid white' }} />

      <NodeResizer 
        color="#3b82f6" 
        isVisible={selected} 
        minWidth={60} 
        minHeight={30} 
        handleStyle={{ width: 10, height: 10, borderRadius: '2px', background: '#ffffff', border: `2px solid #3b82f6`, zIndex: 1001 }}
        lineStyle={{ border: `1px dashed #3b82f6`, opacity: 0.8 }}
      />
      <div 
        ref={nodeRef} 
        onDoubleClick={handleDoubleClick} 
        style={{ 
          position: 'relative', 
          width: '100%',
          height: '100%',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          transform: `rotate(${rotation || 0}deg)`,
          outline: selected ? '2px solid #3b82f6' : 'none',
          outlineOffset: '2px',
          borderRadius: shape === 'rectangle_rounded' ? '12px' : '0'
        }}
      >
        
        {selected && (
          <div onPointerDown={handleRotateStart} style={{ position: 'absolute', top: -35, left: '50%', transform: 'translateX(-50%)', width: 14, height: 14, background: "#3b82f6", borderRadius: '50%', cursor: 'ew-resize', zIndex: 1100, border: '2px solid #fff', boxShadow: '0 2px 4px rgba(0,0,0,0.2)' }} />
        )}

        {/* SVG Background Layer */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible', filter: 'var(--node-shadow)' }} preserveAspectRatio="none" viewBox="0 0 100 100">
        {getShapeSvg(shape, selected ? "#3b82f6" : (data.strokeColor || "#000000"), selected ? 3 : (data.strokeWidth || 1.5), fill)}
      </svg>
      {/* Text Layer */}
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: textStyle.textAlign === 'left' ? 'flex-start' : (textStyle.textAlign === 'right' ? 'flex-end' : 'center'), width: '100%', height: '100%' }}>
        {isEditing ? (
           <textarea 
             autoFocus 
             defaultValue={label} 
             onBlur={handleBlur} 
             style={{ width: '90%', height: '80%', background: 'transparent', border: 'none', outline: 'none', resize: 'none', ...textStyle, textAlign: textStyle.textAlign }} 
             onKeyDown={(e) => { if(e.key === 'Escape') e.target.blur(); }}
           />
        ) : (
           <div style={{ pointerEvents: 'none', userSelect: 'none', maxWidth: '90%', wordWrap: 'break-word', ...textStyle }}>{label}</div>
        )}
      </div>
    </div>
    </div>
  );
};

const applyDagreLayout = (dataDiagram) => {
  if (!dataDiagram) return { nodes: [], edges: [] };
  
  // If the AI returns a structural schema (entities/relationships), use the schema generator
  if (dataDiagram.entities || dataDiagram.relationships) {
    console.log("Detected Chen Schema, generating diagram...");
    const { nodes: lNodes, edges: lEdges } = generateChenDiagramV3(dataDiagram);
    return { nodes: lNodes, edges: lEdges };
  }

  // Otherwise, assume it's a list of raw nodes/edges (for redrawing/layouting existing graphs)
  const { nodes: lNodes, edges: lEdges } = runErLayoutEngine(dataDiagram.nodes || [], dataDiagram.edges || []);
  return { nodes: lNodes, edges: lEdges };
};

const nodeTypes = {
  flowchart: FlowchartNode,
  anchor: ({ selected }) => (
    <div style={{ width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Handle id="port-0"   type="source" position={Position.Top}    style={{ opacity: 0, width: 20, height: 20, minWidth: 20, minHeight: 20 }} connectable />
      <Handle id="port-0-t" type="target" position={Position.Top}    style={{ opacity: 0, width: 20, height: 20, minWidth: 20, minHeight: 20 }} connectable />
      <Handle id="port-1"   type="source" position={Position.Right}  style={{ opacity: 0, width: 20, height: 20, minWidth: 20, minHeight: 20 }} connectable />
      <Handle id="port-1-t" type="target" position={Position.Right}  style={{ opacity: 0, width: 20, height: 20, minWidth: 20, minHeight: 20 }} connectable />
      <Handle id="port-2"   type="source" position={Position.Bottom} style={{ opacity: 0, width: 20, height: 20, minWidth: 20, minHeight: 20 }} connectable />
      <Handle id="port-2-t" type="target" position={Position.Bottom} style={{ opacity: 0, width: 20, height: 20, minWidth: 20, minHeight: 20 }} connectable />
      <Handle id="port-3"   type="source" position={Position.Left}   style={{ opacity: 0, width: 20, height: 20, minWidth: 20, minHeight: 20 }} connectable />
      <Handle id="port-3-t" type="target" position={Position.Left}   style={{ opacity: 0, width: 20, height: 20, minWidth: 20, minHeight: 20 }} connectable />
      {/* anchor-dot removed per user request */}
    </div>
  ),
};

// ==================== MAIN APP ====================
const API_BASE = "http://" + window.location.hostname + ":5000";
const IS_MOBILE = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

function App() {
  const [pages, setPages] = useState([{ id: 1, name: "Unnamed File(1)", nodes: [], edges: [], past: [], future: [] }]);
  const [activePageIndex, setActivePageIndex] = useState(0);
  const [modalConfig, setModalConfig] = useState(null);
  const [isShaking, setIsShaking] = useState(false);
  const [isMainMenuRendered, setIsMainMenuRendered] = useState(false);
  const [isMainMenuClosing, setIsMainMenuClosing] = useState(false);
  const [openMenuSection, setOpenMenuSection] = useState(null);
  const [closingMenuSection, setClosingMenuSection] = useState(null);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [rfInstance, setRfInstance] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showAnimations, setShowAnimations] = useState(true);
  const [showConnectionPoints, setShowConnectionPoints] = useState(false);
  const [themeMode, setThemeMode] = useState('light');
  const [customAppearance, setCustomAppearance] = useState({ grid: '', shapes: '', format: '' });
  const [showRuler, setShowRuler] = useState(false);
  const [showGuides, setShowGuides] = useState(true);
  const [showMinimap, setShowMinimap] = useState(false);
  const [pageSize, setPageSize] = useState('Letter');
  const [orientation, setOrientation] = useState('portrait');
  const [gridSize, setGridSize] = useState(25);
  const [gridColor, setGridColor] = useState('#e0e0e0');
  const [showShadow, setShowShadow] = useState(false);
  const [showPageView, setShowPageView] = useState(true);
  const [showConnectionArrows, setShowConnectionArrows] = useState(true);
  const [showShapesPanel, setShowShapesPanel] = useState(true);
  const [themeColor, setThemeColor] = useState("var(--theme-color)");
  const closeModal = useCallback(() => {
    setIsModalClosing(true);
    setTimeout(() => {
      setModalConfig(null);
      setIsModalClosing(false);
    }, 200);
  }, []);

  const toggleMenuSection = useCallback((section) => {
    if (openMenuSection === section) {
      setClosingMenuSection(section);
      setTimeout(() => {
        setOpenMenuSection(null);
        setClosingMenuSection(null);
      }, 250);
    } else {
      setOpenMenuSection(section);
    }
  }, [openMenuSection]);
  

const getThemeStyles = () => {
  let base;
  switch(themeMode) {
    case 'dark': base = { '--bg': '#0f172a', '--panel-bg': '#000000', '--border': '#334155', '--text': '#e2e8f0', '--text-muted': '#94a3b8' }; break;
    case 'red': base = { '--bg': '#450a0a', '--panel-bg': '#280000', '--border': '#7f1d1d', '--text': '#fecaca', '--text-muted': '#fca5a5' }; break;
    case 'orange': base = { '--bg': '#431407', '--panel-bg': '#2a0a02', '--border': '#7c2d12', '--text': '#fed7aa', '--text-muted': '#fdba74' }; break;
    case 'blue': base = { '--bg': '#082f49', '--panel-bg': '#021a2b', '--border': '#0369a1', '--text': '#bae6fd', '--text-muted': '#7dd3fc' }; break;
    case 'green': base = { '--bg': '#052e16', '--panel-bg': '#021c0b', '--border': '#14532d', '--text': '#bbf7d0', '--text-muted': '#86efac' }; break;
    case 'light':
    default: base = { '--bg': '#F4F6F9', '--panel-bg': '#ffffff', '--border': '#e2e8f0', '--text': '#0f172a', '--text-muted': '#64748b' }; break;
  }
  
  if (customAppearance.grid) base['--bg'] = customAppearance.grid;
  if (customAppearance.shapes) base['--shapes-bg'] = customAppearance.shapes;
  else base['--shapes-bg'] = themeMode === 'light' ? '#f8fafc' : base['--panel-bg'];
  
  if (customAppearance.format) base['--format-bg'] = customAppearance.format;
  else base['--format-bg'] = base['--panel-bg'];

  return base;
};


  const clipboardRef = useRef([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [cloudDiagramId, setCloudDiagramId] = useState(null);
  const [cloudDiagrams, setCloudDiagrams] = useState([]);
  const [isSavingCloud, setIsSavingCloud] = useState(false);

  // Subscribe to Firebase auth state changes
  useEffect(() => {
    const unsub = onAuthChange((user) => {
      setCurrentUser(user || null);
      if (user) {
        listUserDiagrams(user.uid).then(setCloudDiagrams).catch(() => {});
      } else {
        setCloudDiagrams([]);
      }
    });
    return () => unsub();
  }, []);

  const openDrawer = () => { setIsMainMenuClosing(false); setIsMainMenuRendered(true); };
  const closeDrawer = () => { setIsMainMenuClosing(true); setTimeout(() => { setIsMainMenuRendered(false); setIsMainMenuClosing(false); }, 400); };

  const [diagramType] = useState("DFD");
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const fileInputRef = useRef(null);
  const [diagramName, setDiagramName] = useState("Unnamed File(1)");
  const [draggedItem, setDraggedItem] = useState(null);
  const [drawingEdgeState, setDrawingEdgeState] = useState(null);
  const [drawingEdgePoints, setDrawingEdgePoints] = useState([]);
  const [drawingPreviewPoint, setDrawingPreviewPoint] = useState(null);
  const [snappedPort, setSnappedPort] = useState(null);
  const [formatBrush, setFormatBrush] = useState(null);
  const [lastConnectorStyle, setLastConnectorStyle] = useState({ routing: 'sharp', markerEnd: 'arrow' });
  const [isAiProcessing, setIsAiProcessing] = useState(false);
  const [aiStatusMessage, setAiStatusMessage] = useState("Analyzing request...");
  const [selectedAiFile, setSelectedAiFile] = useState(null);
  const [hoveredShape, setHoveredShape] = useState(null);
  const mouseGlowRef = useRef(null);
  const reactFlowRef = useRef(null);

  // Cycle AI status messages
  useEffect(() => {
    if (!isAiProcessing) return;
    const messages = [
      "Analyzing request...",
      "Designing layout structure...",
      "Structuring nodes and attributes...",
      "Calculating optimal grid positions...",
      "Refining connector paths...",
      "Finalizing diagram aesthetics..."
    ];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % messages.length;
      setAiStatusMessage(messages[idx]);
    }, 2000);
    return () => clearInterval(interval);
  }, [isAiProcessing]);

  const displayNodes = useMemo(() => {
    const waypointNodes = drawingEdgeState && drawingEdgePoints.length > 0
      ? drawingEdgePoints.map((p, i) => ({
          id: `drawing_wp_${i}`,
          position: p,
          data: { label: '' },
          style: { width: 10, height: 10, borderRadius: '50%', background: '#0ea5e9', border: '2px solid #fff', transform: 'translate(-50%, -50%)', pointerEvents: 'none', zIndex: 1000 }
        }))
      : [];

    if (!drawingEdgeState || drawingEdgePoints.length === 0) return nodes;
    const start = drawingEdgePoints[0];
    const end = drawingPreviewPoint || drawingEdgePoints[drawingEdgePoints.length - 1];
    return [
      ...nodes,
      ...waypointNodes,
      { id: 'drawing_source', position: start, data: { label: '' }, style: { width: 1, height: 1, opacity: 0 } },
      { id: 'drawing_target', position: end, data: { label: '' }, style: { width: 1, height: 1, opacity: 0 } }
    ];
  }, [nodes, drawingEdgeState, drawingEdgePoints, drawingPreviewPoint]);

  const displayEdges = useMemo(() => {
    if (!drawingEdgeState || drawingEdgePoints.length === 0) return edges;
    return [
      ...edges,
      {
         id: 'drawing_edge', source: 'drawing_source', target: 'drawing_target', type: 'drawio',
         data: { routing: drawingEdgeState.routing || 'sharp', stroke: '#0ea5e9', strokeDash: [6,6], waypoints: drawingEdgePoints.slice(1) }
      }
    ];
  }, [edges, drawingEdgeState, drawingEdgePoints, drawingPreviewPoint]);

  const [searchQuery, setSearchQuery] = useState("");
  const [openCategories, setOpenCategories] = useState({});
  const toggleCategory = (title) => setOpenCategories(prev => prev[title] ? {} : { [title]: true });

  // History tracking
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const currentStateRef = useRef({ nodes, edges, past, future, diagramName, activePageIndex, pages, isMainMenuRendered: false });
  useEffect(() => {
    currentStateRef.current = { nodes, edges, past, future, diagramName, activePageIndex, pages, isMainMenuRendered };
  }, [nodes, edges, past, future, diagramName, activePageIndex, pages, isMainMenuRendered]);

  const exportDiagram = async (format) => {
    // Temporary deselect to avoid highlighting in export
    setNodes(nds => nds.map(n => ({ ...n, selected: false })));
    setEdges(eds => eds.map(e => ({ ...e, selected: false })));

    // Give React a moment to re-render without selection
    await new Promise(resolve => setTimeout(resolve, 100));

    const filterFn = (node) => !(
      node?.classList?.contains('react-flow__controls') || 
      node?.classList?.contains('react-flow__panel') || 
      node?.classList?.contains('react-flow__minimap') ||
      node?.classList?.contains('react-flow__node-anchor') ||
      node?.classList?.contains('react-flow__resize-control') ||
      node?.classList?.contains('react-flow__handle')
    );
    if (format === "png" || format === "jpeg" || format === "svg") {
      const flowElement = document.querySelector('.react-flow');
      if (flowElement) {
         let exportFn = toPng;
         if (format === "jpeg") exportFn = toJpeg;
         if (format === "svg") exportFn = toSvg;
         exportFn(flowElement, { filter: filterFn, backgroundColor: format === 'jpeg' ? '#ffffff' : undefined })
          .then((dataUrl) => {
            const link = document.createElement("a");
            link.href = dataUrl;
            link.download = `${diagramName}.${format === 'jpeg' ? 'jpg' : format}`;
            link.click();
          });
      } else {
         alert("Could not locate diagram container for export.");
      }
    } else if (format === "json") {
      const data = JSON.stringify({ name: diagramName, nodes, edges }, null, 2);
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([data]));
      link.download = `${diagramName}.json`;
      link.click();
    } else if (format === "pdf") {
      const flowElement = document.querySelector('.react-flow');
      if (flowElement) {
        toPng(flowElement, { filter: filterFn, backgroundColor: '#ffffff' })
          .then((dataUrl) => {
            const pdf = new jsPDF('l', 'px', [flowElement.offsetWidth, flowElement.offsetHeight]);
            pdf.addImage(dataUrl, 'PNG', 0, 0, flowElement.offsetWidth, flowElement.offsetHeight);
            pdf.save(`${diagramName}.pdf`);
          });
      }
    } else if (format === "csv") {
      let csv = "ID,Type,Label,X,Y\n";
      nodes.forEach(n => {
        csv += `"${n.id}","${n.data?.shapeType || 'unknown'}","${(n.data?.label || '').replace(/"/g, '""')}",${n.position.x},${n.position.y}\n`;
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      link.download = `${diagramName}.csv`;
      link.click();
    } else if (format === "html") {
      const flowElement = document.querySelector('.react-flow');
      toPng(flowElement, { filter: filterFn }).then(dataUrl => {
        const html = `
<!DOCTYPE html>
<html>
<head><title>${diagramName}</title><style>body{margin:0;display:flex;justify-content:center;align-items:center;height:100vh;background:#f1f5f9;}</style></head>
<body><img src="${dataUrl}" style="max-width:90%;box-shadow:0 10px 15px -3px rgba(0,0,0,0.1);"></body>
</html>`;
        const link = document.createElement("a");
        link.href = URL.createObjectURL(new Blob([html], { type: 'text/html' }));
        link.download = `${diagramName}.html`;
        link.click();
      });
    } else if (format === "md") {
      let md = `# ${diagramName}\n\n## Diagram Content\n\n`;
      nodes.forEach(n => {
        md += `- **${n.data.label || 'Unnamed'}** (${n.data.shapeType})\n`;
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(new Blob([md], { type: 'text/markdown' }));
      link.download = `${diagramName}.md`;
      link.click();
    }
  };

  const saveDiagram = async () => {
    // Default "Save" action is now PNG export as requested by user
    exportDiagram('png');
  };

  const saveAsJson = async () => {
    // Keep JSON saving for when users need to resume editing later
    const data = JSON.stringify({ name: diagramName, nodes, edges }, null, 2);
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([data], { type: 'application/json' }));
    link.download = `${diagramName}.json`;
    link.click();
  };

  const saveAsDiagram = async () => {
    const newName = window.prompt("Enter new file name for PNG export:", diagramName);
    if (newName) {
      setDiagramName(newName);
      // Give state a brief moment to update before export
      setTimeout(() => exportDiagram('png'), 100);
    }
  };

  const switchPage = useCallback((newIndex) => {
    const { nodes: cNodes, edges: cEdges, past: cPast, future: cFuture, diagramName: cName, activePageIndex: cIndex, pages: cPages } = currentStateRef.current;
    if (newIndex < 0 || newIndex > cPages.length) return;
    
    const savedPages = [...cPages];
    savedPages[cIndex] = { ...savedPages[cIndex], name: cName, nodes: cNodes, edges: cEdges, past: cPast, future: cFuture };
    
    if (newIndex === savedPages.length) {
      savedPages.push({ id: Date.now(), name: `Unnamed File(${savedPages.length + 1})`, nodes: [], edges: [], past: [], future: [] });
    }

    setPages(savedPages);
    setActivePageIndex(newIndex);
    
    const targetPage = savedPages[newIndex];
    setNodes(targetPage.nodes);
    setEdges(targetPage.edges);
    setDiagramName(targetPage.name);
    setPast(targetPage.past);
    setFuture(targetPage.future);
  }, [setNodes, setEdges]);

  const triggerErrorShake = useCallback(() => {
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 400); 
    
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(150, audioCtx.currentTime); 
      oscillator.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
      
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.1);
    } catch (err) {
      console.log("Audio limited", err);
    }
  }, []);

  const deletePage = useCallback(() => {
    const { pages: cPages, activePageIndex: cIndex } = currentStateRef.current;
    if (cPages.length <= 1) {
      triggerErrorShake();
      setModalConfig({ 
        type: 'alert', 
        title: "Action Restricted", 
        message: "You cannot delete the only remaining page in your workspace." 
      });
      return;
    }
    const newPages = cPages.filter((_, i) => i !== cIndex);
    const newActiveIndex = cIndex === cPages.length - 1 ? cIndex - 1 : cIndex;
    
    setPages(newPages);
    setActivePageIndex(newActiveIndex);
    
    const targetPage = newPages[newActiveIndex];
    setNodes(targetPage.nodes);
    setEdges(targetPage.edges);
    setDiagramName(targetPage.name);
    setPast(targetPage.past);
    setFuture(targetPage.future);
  }, [setNodes, setEdges, triggerErrorShake]);

  // AI API Handlers
  const handleGenerateDiagram = async (prompt) => {
    setIsAiProcessing(true);
    setModalConfig(null);
    try {
      const resp = await fetch(`${API_BASE}/api/ai/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, type: "auto-detect" })
      });
      const data = await resp.json();
      if (data.success) {
        takeSnapshot();
        const { nodes: lNodes, edges: lEdges } = applyDagreLayout(data.diagram);
        
        // Atomic update for all states
        setNodes(() => lNodes);
        setEdges(() => lEdges);
        setPages(prev => prev.map((p, idx) => idx === activePageIndex ? { ...p, nodes: lNodes, edges: lEdges } : p));

        setTimeout(() => {
          if (rfInstance) rfInstance.fitView({ padding: 0.2, duration: 800 });
        }, 200);

        if (data.isSimulation) {
          setModalConfig({ type: 'alert', title: 'Demo Mode', message: data.message });
        } else {
          setModalConfig({ 
            type: 'alert', 
            title: '✨ AI Generation Complete', 
            message: "Your diagram has been successfully generated and centered." 
          });
        }
      } else {
        setModalConfig({ type: 'alert', title: 'AI Error', message: data.error || "Generation failed." });
      }
    } catch (err) {
      setModalConfig({ type: 'alert', title: 'Connection Error', message: `Could not reach the AI backend at ${API_BASE}. Ensure it is running.` });
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleParseImage = async (file, description) => {
    setIsAiProcessing(true);
    setModalConfig(null);
    const formData = new FormData();
    formData.append("image", file);
    if (description) formData.append("context", description);
    try {
      const resp = await fetch(`${API_BASE}/api/ai/parse-image`, {
        method: "POST",
        body: formData
      });
      const data = await resp.json();
      if (data.success) {
        takeSnapshot();
        console.log("Parsed Image Data:", data.diagram);
        const { nodes: lNodes, edges: lEdges } = applyDagreLayout(data.diagram);
        
        console.log("Nodes from Image (with prefix):", lNodes);
        console.log("Edges from Image (with prefix):", lEdges);

        // Clear existing and set new
        setNodes(lNodes);
        setTimeout(() => {
          setEdges(lEdges);
          if (rfInstance) rfInstance.fitView({ padding: 0.2, duration: 800 });
          setPages(prev => prev.map((p, idx) => idx === activePageIndex ? { ...p, nodes: lNodes, edges: lEdges } : p));
        }, 150);

        // Build validation report
        const stats = data.stats || {};
        const validation = data.validation || {};
        const diagramType = data.diagramType || "Unknown";
        const repairs = validation.repairs || [];
        const warnings = validation.warnings || [];

        let reportLines = [`📊 Detected: ${diagramType} diagram`, `✅ ${stats.nodes || 0} nodes, ${stats.edges || 0} edges placed on canvas`];
        if (repairs.length > 0) {
          reportLines.push(`\n🔧 Auto-repaired ${repairs.length} missing connection(s):`);
          repairs.forEach(r => reportLines.push(`  • ${r}`));
        }
        if (warnings.length > 0) {
          reportLines.push(`\n⚠️ Warnings:`);
          warnings.forEach(w => reportLines.push(`  • ${w}`));
        }
        if (validation.valid) {
          reportLines.push(`\n✅ Diagram is valid — all connections verified.`);
        }

        setModalConfig({
          type: 'alert',
          title: '✨ Diagram Parsed Successfully',
          message: reportLines.join('\n') + "\n\nWe apologize if some elements are not connected properly or text is misinterpreted, as our AI vision model is still in beta."
        });
      } else {
        setModalConfig({ type: 'alert', title: 'AI Error', message: data.error || "Image parsing failed." });
      }
    } catch (err) {
      setModalConfig({ type: 'alert', title: 'Connection Error', message: "Could not reach the AI backend." });
    } finally {
      setIsAiProcessing(false);
    }
  };

  // ---- KEYBOARD SHORTCUTS ----
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in a text field
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const isAlt = e.altKey;

      if (isCtrl && !isShift) {
        switch (e.key.toLowerCase()) {
          case 's': e.preventDefault(); saveDiagram(); break;
          case 'z': e.preventDefault(); undo(); break;
          case 'y': e.preventDefault(); redo(); break;
          case 'a': e.preventDefault(); setNodes(nds => nds.map(n => ({ ...n, selected: true }))); setEdges(eds => eds.map(ee => ({ ...ee, selected: true }))); break;
          case 'c': e.preventDefault(); handleEditMenu('Copy'); break;
          case 'v': e.preventDefault(); handleEditMenu('Paste'); break;
          case 'x': e.preventDefault(); handleEditMenu('Cut'); break;
          case 'd': e.preventDefault(); handleEditMenu('Duplicate'); break;
          case 'l': e.preventDefault(); handleEditMenu('Lock/Unlock'); break;
          case 'p': e.preventDefault(); window.print(); break;
          case 'f': e.preventDefault(); setModalConfig({ type: 'menu_search', title: '🔍 Search Menu', message: '' }); break;
          default: break;
        }
      } else if (isCtrl && isShift) {
        switch (e.key.toLowerCase()) {
          case 's': e.preventDefault(); saveAsDiagram(); break;
          case 'a': e.preventDefault(); setNodes(nds => nds.map(n => ({ ...n, selected: false }))); setEdges(eds => eds.map(ee => ({ ...ee, selected: false }))); break;
          case 'g': e.preventDefault(); setShowGrid(g => !g); break;
          case 'p': e.preventDefault(); setShowPageView(p => !p); break;
          case 'l': e.preventDefault(); handleViewMenu('Layers'); break;
          case 'o': e.preventDefault(); handleViewMenu('Outline'); break;
          default: break;
        }
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!e.target.closest('.react-flow__node')) { // Only if not editing
             handleEditMenu('Delete');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nodes, edges, past, future, diagramName, activePageIndex, pages]);

  const lastSwipeTime = useRef(Date.now());
  useEffect(() => {
    document.body.style.overscrollBehavior = 'none';
    const handleWheel = (e) => {
      // Only work OUTSIDE of the grid view AND the sidebar
      if (reactFlowRef.current && reactFlowRef.current.contains(e.target)) return;
      // Also exclude the sidebar — scrolling inside it should NOT trigger page actions
      const sidebar = document.querySelector('.sidebar-shapes-panel');
      if (sidebar && sidebar.contains(e.target)) return;
      if (currentStateRef.current.isMainMenuRendered || modalConfig) return; // Disable swipe when drawer or modal is open
      
      const now = Date.now();
      if (now - lastSwipeTime.current < 600) return;
      
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        if (Math.abs(e.deltaX) > 50) {
          lastSwipeTime.current = now;
          if (e.deltaX > 0) switchPage(currentStateRef.current.activePageIndex + 1); // Save Finger Right -> Page ++
          else if (e.deltaX < 0) switchPage(currentStateRef.current.activePageIndex - 1); // Save Finger Left -> Page --
        }
      } else {
        if (Math.abs(e.deltaY) > 50) {
          lastSwipeTime.current = now;
          if (e.deltaY > 0) {
            // Swipe DOWN -> Delete
            deletePage();
          } else if (e.deltaY < 0) {
            // Swipe UP -> Save
            saveDiagram();
          }
        }
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => { window.removeEventListener('wheel', handleWheel); document.body.style.overscrollBehavior = 'auto'; };
  }, [switchPage, deletePage, saveDiagram]);

  const takeSnapshot = () => {
    setPast((p) => [...p.slice(-40), { nodes, edges }]);
    setFuture([]);
  };

  const undo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    setPast((p) => p.slice(0, -1));
    setFuture((f) => [{ nodes, edges }, ...f]);
    setNodes(previous.nodes);
    setEdges(previous.edges);
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setFuture((f) => f.slice(1));
    setPast((p) => [...p, { nodes, edges }]);
    setNodes(next.nodes);
    setEdges(next.edges);
  };

  const selectedNode = nodes.find((n) => n.selected);
  const hasSelectedNode = !!selectedNode;
  const selectedData = selectedNode?.data || {};

  const updateSelectedNodes = (updates) => {
    takeSnapshot();
    setNodes((nds) => nds.map((n) => {
      if (n.selected) {
        return { ...n, data: { ...n.data, ...updates } };
      }
      return n;
    }));
  };

  const formatBrushRef = useRef(null);

  const handleFormatBrushClick = () => {
    if (formatBrush) {
      // Second click on the button cancels the brush
      setFormatBrush(null);
      formatBrushRef.current = null;
    } else if (selectedNode) {
      // Capture all style props except label and shapeType
      const { label, shapeType, tooltip, link, ...formattingProps } = selectedData;
      setFormatBrush(formattingProps);
      formatBrushRef.current = formattingProps;
    }
  };

  // Apply brush when format painter is active and a node is clicked
  const onNodeClick = useCallback((event, node) => {
    const brush = formatBrushRef.current;
    if (brush) {
      takeSnapshot();
      setNodes((nds) => nds.map((n) => {
        if (n.id === node.id && n.type !== 'anchor') {
          return { ...n, data: { ...n.data, ...brush } };
        }
        return n;
      }));
      setFormatBrush(null);
      formatBrushRef.current = null;
    }
  }, [setNodes, takeSnapshot]);

  const applyQuickStyle = () => {
    const styles = [
      { fillColor: '#dbeafe', color: '#1e3a8a', bold: true },
      { fillColor: '#fce7f3', color: '#831843', bold: true },
      { fillColor: '#dcfce7', color: '#14532d', bold: true },
      { fillColor: '#fef08a', color: '#713f12', bold: true },
      { fillColor: '#ffffff', color: '#000000', bold: false }
    ];
    const currentColor = selectedData.fillColor || '#ffffff';
    let idx = styles.findIndex(s => s.fillColor.toLowerCase() === currentColor.toLowerCase());
    idx = (idx + 1) % styles.length;
    updateSelectedNodes(styles[idx]);
  };

  // Handle drag start
  const handleDragStart = (e, item) => {
    setDraggedItem(item);
    e.dataTransfer.effectAllowed = "move";
    const dragData = {
      type: item.isEdge ? "connector" : "shape",
      item: item,
      category: item.isEdge ? "lines" : "shape"
    };
    e.dataTransfer.setData("application/json", JSON.stringify(dragData));
  };

  const handleShapeClick = (item) => {
    if (!IS_MOBILE) return; 
    
    takeSnapshot();
    const centerPos = rfInstance 
      ? rfInstance.screenToFlowPosition({ x: window.innerWidth / 2, y: window.innerHeight / 2 })
      : { x: 300, y: 300 };

    if (item.isEdge) {
      const ts = Date.now();
      const sourceId = `anchor_${ts}_start`;
      const targetId = `anchor_${ts}_end`;
      const startPoint = { x: centerPos.x - 80, y: centerPos.y };
      const endPoint   = { x: centerPos.x + 80, y: centerPos.y };

      const anchorStyle = { width: 8, height: 8, background: '#0ea5e9', border: '2px solid #ffffff', borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', padding: 0, margin: '-4px 0 0 -4px' };
      const sourceNode = { id: sourceId, type: 'anchor', position: startPoint, style: anchorStyle, data: {}, selectable: true, draggable: true, selected: false };
      const targetNode = { id: targetId, type: 'anchor', position: endPoint, style: anchorStyle, data: {}, selectable: true, draggable: true, selected: false };

      const strokeDashArray = item.strokeStyle === 'dashed' ? [5, 5] : item.strokeStyle === 'dotted' ? [2, 3] : [];
      const newEdge = {
        id: `edge_${ts}`,
        source: sourceId,
        target: targetId,
        sourceHandle: 'port-1',
        targetHandle: 'port-3-t',
        type: 'drawio',
        data: {
          routing: item.routing || 'straight',
          stroke: '#000000',
          strokeWidth: 1.5,
          strokeDash: strokeDashArray,
          markerStart: item.startArrow || 'none',
          markerEnd: item.endArrow || 'none',
          waypoints: [],
        },
      };

      setNodes((nds) => [...nds, sourceNode, targetNode]);
      setEdges((eds) => [...eds, newEdge]);
    } else {
      const newNode = {
        id: `node_${Date.now()}`,
        type: "flowchart",
        position: centerPos,
        style: { 
          width: item.shapeType === 'relationship' || item.shapeType === 'diamond' ? 120 : (item.width || 140), 
          height: item.shapeType === 'relationship' || item.shapeType === 'diamond' ? 90 : (item.height || 80) 
        },
        data: { 
          label: item.labelText !== undefined ? item.labelText : item.label, 
          shapeType: item.shapeType,
          fillColor: item.fill || '#ffffff'
        }
      };
      setNodes((nds) => [...nds, newNode]);
    }
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();

    const reactFlowBounds = reactFlowRef.current?.getBoundingClientRect();
    if (!reactFlowBounds || !rfInstance) return;

    // Convert screen coords to flow coords
    let position = rfInstance.screenToFlowPosition({
      x: e.clientX,
      y: e.clientY
    });

    // Snap to grid removed per user request
    /*
    if (showGrid) {
      position.x = Math.round(position.x / gridSize) * gridSize;
      position.y = Math.round(position.y / gridSize) * gridSize;
    }
    */

    let dropData = null;
    try {
      const jsonData = e.dataTransfer.getData("application/json");
      if (jsonData) {
        dropData = JSON.parse(jsonData);
      }
    } catch (err) {
      // Fall through to use draggedItem
    }

    // Dedup guard: ignore a second drop within 300ms (prevents ghost shapes on fast clicks)
    const now = Date.now();
    if (now - (handleDrop._lastDropTime || 0) < 300) return;
    handleDrop._lastDropTime = now;

    const draggedItemFinal = dropData?.item || draggedItem;
    const itemType = dropData?.type || (draggedItemFinal?.isEdge ? "connector" : "shape");
    const itemCategory = dropData?.category || (draggedItemFinal?.isEdge ? "lines" : "shape");

    if (draggedItemFinal) {
      takeSnapshot();
      
      if (itemType === "connector" || itemCategory === "connector" || draggedItemFinal.isEdge) {
        const ts = Date.now();
        const sourceId = `anchor_${ts}_start`;
        const targetId = `anchor_${ts}_end`;

        // Flow-space positions: start 80px left, end 80px right of drop point (160px total line)
        const startPoint = { x: position.x - 80, y: position.y };
        const endPoint   = { x: position.x + 80, y: position.y };
        // Anchor nodes spread 160px apart so the line body is clearly visible

        // Interactive anchor nodes — small handles
        const anchorStyle = { 
          width: 8, 
          height: 8, 
          background: '#0ea5e9', 
          border: '2px solid #ffffff', 
          borderRadius: '50%',
          boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
          padding: 0,
          margin: '-4px 0 0 -4px' // Center 8px handle on coordinate
        };
        const sourceNode = {
          id: sourceId,
          type: 'anchor',
          position: startPoint,
          style: anchorStyle,
          data: {},
          selectable: true,
          draggable: true,
          selected: false,
        };
        const targetNode = {
          id: targetId,
          type: 'anchor',
          position: endPoint,
          style: anchorStyle,
          data: {},
          selectable: true,
          draggable: true,
          selected: false,
        };

        const strokeDashArray = draggedItemFinal.strokeStyle === 'dashed' ? [5, 5] :
                                draggedItemFinal.strokeStyle === 'dotted' ? [2, 3] : [];

        const newEdge = {
          id: `edge_${ts}`,
          source: sourceId,
          target: targetId,
          sourceHandle: 'port-1',
          targetHandle: 'port-3-t',
          type: 'drawio',
          animated: false,
          data: {
            routing: draggedItemFinal.routing || 'straight',
            stroke: '#000000',
            strokeWidth: 1.5,
            strokeDash: strokeDashArray,
            markerStart: draggedItemFinal.startArrow || 'none',
            markerEnd: draggedItemFinal.endArrow || 'none',
            waypoints: [],
            fallbackStartX: startPoint.x,
            fallbackStartY: startPoint.y,
            fallbackEndX: endPoint.x,
            fallbackEndY: endPoint.y,
          },
        };

        setNodes((nds) => [...nds, sourceNode, targetNode]);
        setEdges((eds) => [...eds, newEdge]);
      } else {
         const newNode = {
           id: `node_${Date.now()}`,
           type: "flowchart",
           position,
           style: { width: draggedItemFinal.width || 140, height: draggedItemFinal.height || 80 },
           data: { 
             label: draggedItemFinal.labelText !== undefined ? draggedItemFinal.labelText : draggedItemFinal.label, 
             shapeType: draggedItemFinal.shapeType,
             fillColor: draggedItemFinal.fill || '#ffffff'
           }
         };
         setNodes((nds) => [...nds, newNode]);
      }
      setDraggedItem(null);
    }
  };

  const getNearestPort = useCallback((pos) => {
    const SNAP_DIST = 15;
    let nearest = null;
    let minDist = SNAP_DIST;

    nodes.forEach(node => {
      const w = node.measured?.width || 140;
      const h = node.measured?.height || 80;
      const shape = node.data?.shapeType;

      const ports = [
        { id: node.id, port: 0, x: node.position.x + w / 2, y: node.position.y },
        { id: node.id, port: 1, x: node.position.x + w, y: node.position.y + h / 2 },
        { id: node.id, port: 2, x: node.position.x + w / 2, y: node.position.y + h },
        { id: node.id, port: 3, x: node.position.x, y: node.position.y + h / 2 },
      ];

      ports.forEach(p => {
        const d = Math.sqrt((pos.x - p.x) ** 2 + (pos.y - p.y) ** 2);
        if (d < minDist) {
          minDist = d;
          nearest = p;
        }
      });
    });
    return nearest;
  }, [nodes]);

  const finishDrawingEdge = useCallback(() => {
    if (drawingEdgePoints.length < 2) {
      setDrawingEdgeState(null);
      setDrawingEdgePoints([]);
      setDrawingPreviewPoint(null);
      return;
    }
    
    takeSnapshot();
    const lastPoint = drawingPreviewPoint || drawingEdgePoints[drawingEdgePoints.length - 1];
    const snapEnd = getNearestPort(lastPoint);
    const snapStart = getNearestPort(drawingEdgePoints[0]);

    const sourceId = snapStart ? snapStart.id : `anchor_${Date.now()}_start`;
    const targetId = snapEnd ? snapEnd.id : `anchor_${Date.now()}_end`;
    
    // Create anchors only if not snapped
    const extraNodes = [];
    if (!snapStart) {
      extraNodes.push({ id: sourceId, type: "flowchart", position: drawingEdgePoints[0], style: { width: 10, height: 10, opacity: 0.2 }, data: { label: '', shapeType: 'ellipse' }, draggable: true });
    }
    if (!snapEnd) {
      extraNodes.push({ id: targetId, type: "flowchart", position: lastPoint, style: { width: 10, height: 10, opacity: 0.2 }, data: { label: '', shapeType: 'ellipse' }, draggable: true });
    }

    // De-duplicate points (remove very close points from double-click artifacts)
    const uniquePoints = [drawingEdgePoints[0]];
    drawingEdgePoints.slice(1).forEach(p => {
      const prev = uniquePoints[uniquePoints.length - 1];
      const d = Math.sqrt((p.x - prev.x)**2 + (p.y - prev.y)**2);
      if (d > 5) uniquePoints.push(p);
    });

    const newEdge = {
      id: `edge_${Date.now()}`,
      source: sourceId,
      target: targetId,
      sourceHandle: snapStart ? `port-${snapStart.port}` : 'port-0', // Default to port-0 for anchors
      targetHandle: snapEnd ? `port-${snapEnd.port}-t` : 'port-0-t', // Default to port-0-t for anchors
      type: 'drawio',
      animated: false,
      data: {
        routing: drawingEdgeState.routing || 'sharp',
        stroke: drawingEdgeState.stroke || '#000000',
        strokeWidth: 2,
        strokeDash: drawingEdgeState.strokeDash || [],
        markerStart: drawingEdgeState.markerStart && drawingEdgeState.markerStart !== 'none' ? drawingEdgeState.markerStart : 'none',
        markerEnd: drawingEdgeState.markerEnd && drawingEdgeState.markerEnd !== 'none' && drawingEdgeState.markerEnd !== 'arrowOpen' ? drawingEdgeState.markerEnd : 'arrow',
        waypoints: uniquePoints.slice(1, -1)
      }
    };

    const finalNodes = [...nodes, ...extraNodes];
    const finalEdges = [...edges, newEdge];

    setNodes(finalNodes);
    setEdges(finalEdges);

    // PERSIST TO PAGES ARRAY
    setPages(prev => prev.map((p, idx) => idx === activePageIndex ? { ...p, nodes: finalNodes, edges: finalEdges } : p));
    
    setDrawingEdgeState(null);
    setDrawingEdgePoints([]);
    setDrawingPreviewPoint(null);
    setSnappedPort(null);
  }, [drawingEdgePoints, drawingEdgeState, drawingPreviewPoint, nodes, edges, activePageIndex, getNearestPort]);

  const onConnect = useCallback((params) => {
    takeSnapshot();
    const newEdge = {
      ...params,
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: 'drawio',
      data: {
        routing: lastConnectorStyle.routing || 'sharp',
        stroke: lastConnectorStyle.stroke || '#000000',
        strokeWidth: 2,
        markerStart: lastConnectorStyle.markerStart || 'none',
        markerEnd: lastConnectorStyle.markerEnd || 'arrow',
        waypoints: []
      }
    };
    
    setEdges((eds) => {
      const updatedEdges = [...eds, newEdge];
      setPages(prev => prev.map((p, idx) => idx === activePageIndex ? { ...p, edges: updatedEdges } : p));
      return updatedEdges;
    });
  }, [lastConnectorStyle, activePageIndex]);

  const handlePaneClick = useCallback((e) => {
    if (drawingEdgeState) {
      const bounds = reactFlowRef.current?.getBoundingClientRect();
      if (!bounds) return;
      const pos = rfInstance ? rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY }) : { x: e.clientX - bounds.left, y: e.clientY - bounds.top };
      
      const snapped = getNearestPort(pos);
      const finalPos = snapped ? { x: snapped.x, y: snapped.y } : pos;
      setDrawingEdgePoints(prev => [...prev, finalPos]);
    } else {
      setFormatBrush(null);
      setNodes((nds) => nds.map((n) => ({ ...n, selected: false })));
      setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
    }
  }, [drawingEdgeState, rfInstance, getNearestPort, setNodes, setEdges]);

  const handlePaneMouseMove = useCallback((e) => {
    if (drawingEdgeState && drawingEdgePoints.length > 0) {
      const pos = rfInstance ? rfInstance.screenToFlowPosition({ x: e.clientX, y: e.clientY }) : null;
      if (pos) {
        setDrawingPreviewPoint(pos);
        setSnappedPort(getNearestPort(pos));
      }
    }
  }, [drawingEdgeState, drawingEdgePoints, rfInstance, getNearestPort]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && drawingEdgeState) {
        setDrawingEdgeState(null);
        setDrawingEdgePoints([]);
        setDrawingPreviewPoint(null);
        setSnappedPort(null);
      }
      if (e.key === 'z' && (e.ctrlKey || e.metaKey) && drawingEdgeState && drawingEdgePoints.length > 0) {
        e.preventDefault();
        setDrawingEdgePoints(prev => prev.slice(0, -1));
      }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey) && selectedData.id) {
        e.preventDefault();
        // Duplicate selected node or edge
        // (Implementation for duplication)
        takeSnapshot();
        const selectedNode = nodes.find(n => n.id === selectedData.id);
        if (selectedNode) {
          const newNode = { ...selectedNode, id: `node_${Date.now()}`, position: { x: selectedNode.position.x + 20, y: selectedNode.position.y + 20 } };
          setNodes(nds => [...nds, newNode]);
        } else {
           const selectedEdge = edges.find(e => e.id === selectedData.id);
           if (selectedEdge) {
             const newEdge = { ...selectedEdge, id: `edge_${Date.now()}` };
             setEdges(eds => [...eds, newEdge]);
           }
        }
      }
      if (e.key === 'Tab') {
        e.preventDefault();
        // Select next node/edge
        const allItems = [...nodes, ...edges];
        const currentIdx = allItems.findIndex(i => i.id === selectedData.id);
        const nextIdx = (currentIdx + 1) % allItems.length;
        if (allItems[nextIdx]) {
           // Set selection logic (mocked here, should trigger onNodeClick/onEdgeClick etc)
        }
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        if (e.shiftKey) {
          saveAsJson();
        } else {
          saveDiagram();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [drawingEdgeState]);

  // ---- CLOUD SAVE ----
  const cloudSave = async () => {
    if (!currentUser) {
      setModalConfig({ type: 'alert', title: '🔐 Sign In Required', message: 'Please sign in with Google first to save your diagram to the cloud.' });
      return;
    }
    setIsSavingCloud(true);
    try {
      const diagram = { id: cloudDiagramId, name: diagramName, nodes, edges, type: diagramType };
      const id = await saveDiagramToCloud(currentUser.uid, diagram);
      setCloudDiagramId(id);
      listUserDiagrams(currentUser.uid).then(setCloudDiagrams);
      setModalConfig({ type: 'alert', title: '☁️ Saved to Cloud', message: `"${diagramName}" has been saved to your Firebase account.` });
    } catch (err) {
      setModalConfig({ type: 'alert', title: 'Cloud Save Failed', message: 'Could not save to Firebase. Check your connection and Firebase config.' });
    } finally {
      setIsSavingCloud(false);
    }
  };

  // ---- CLOUD LOAD (Open Recent) ----
  const cloudLoadList = async () => {
    if (!currentUser) {
      setModalConfig({ type: 'alert', title: '🔐 Sign In Required', message: 'Please sign in with Google to access your saved diagrams.' });
      return;
    }
    const diagrams = await listUserDiagrams(currentUser.uid);
    setCloudDiagrams(diagrams);
    setModalConfig({ type: 'cloud_list', title: '🗂️ Your Cloud Diagrams', message: '', diagrams });
  };

  const loadCloudDiagram = async (diagram) => {
    setNodes(diagram.nodes || []);
    setEdges(diagram.edges || []);
    setDiagramName(diagram.name || 'Untitled');
    setCloudDiagramId(diagram.id);
    setModalConfig(null);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target.result);
        if (json.nodes && json.edges) {
          setNodes(json.nodes);
          setEdges(json.edges);
          if (json.name) {
             setDiagramName(json.name);
             setPages(p => p.map((pg, i) => i === activePageIndex ? { ...pg, name: json.name } : pg));
          }
          setModalConfig({ type: 'alert', title: "Import Successful", message: "Diagram successfully imported and loaded onto the canvas." });
        }
      } catch (err) {
        setModalConfig({ type: 'alert', title: "Import Failed", message: "Failed to parse local JSON diagram. Ensure the file is valid." });
      }
    };
    reader.readAsText(file);
    e.target.value = null; // reset
  };

  const handleFileMenu = (actionLabel) => {
    switch (actionLabel) {
      case 'New...':
        switchPage(pages.length);
        closeDrawer();
        break;
      case 'Open from':
      case 'Import from':
        fileInputRef.current?.click();
        closeDrawer();
        break;
      case 'Make a Copy...':
        const newPage = {
          id: Date.now(),
          name: `${diagramName} Copy`,
          nodes: [...nodes],
          edges: [...edges],
          past: [],
          future: []
        };
        setPages(p => [...p, newPage]);
        setModalConfig({ type: 'alert', title: 'Copy Successful', message: `A clone named '${diagramName} Copy' has been added strictly to your background tabs.`});
        closeDrawer();
        break;
      case 'Save':
        saveDiagram();
        closeDrawer();
        break;
      case 'Save as...':
        saveAsJson();
        closeDrawer();
        break;
      case 'Rename...':
        setModalConfig({
          type: 'prompt',
          title: 'Rename Diagram',
          message: 'Enter a new name for this diagram:',
          defaultValue: diagramName,
          confirmLabel: 'Rename',
          onConfirm: (newName) => {
            setDiagramName(newName);
            setPages(p => p.map((pg, i) => i === activePageIndex ? { ...pg, name: newName } : pg));
          }
        });
        closeDrawer();
        break;
      case 'Export as':
        setModalConfig({ 
          type: 'export_options', 
          title: "Export Diagram As...", 
          message: "Select your preferred file format for the export download."
        });
        closeDrawer();
        break;
      case 'Print...':
      case 'Print':
        window.print();
        closeDrawer();
        break;
      case 'Close':
        deletePage();
        closeDrawer();
        break;
      case 'Open Recent':
        cloudLoadList();
        closeDrawer();
        break;
      case 'Share...':
        handleShare();
        closeDrawer();
        break;
      case 'Page Setup...':
        setModalConfig({ type: 'page_setup', title: '📄 Page Setup', message: '' });
        closeDrawer();
        break;
      default:
        closeDrawer();
        break;
    }
  };



  // ---- EDIT MENU ----
  const handleEditMenu = (label) => {
    switch (label) {
      case 'Undo': undo(); closeDrawer(); break;
      case 'Redo': redo(); closeDrawer(); break;
      case 'Delete':
        takeSnapshot();
        setNodes(nds => nds.filter(n => !n.selected));
        setEdges(eds => eds.filter(e => !e.selected));
        closeDrawer();
        break;
      case 'Cut':
        clipboardRef.current = nodes.filter(n => n.selected).map(n => ({ ...n, id: `node_${Date.now()}_${Math.random()}`, position: { x: n.position.x + 20, y: n.position.y + 20 } }));
        takeSnapshot();
        setNodes(nds => nds.filter(n => !n.selected));
        closeDrawer();
        break;
      case 'Copy':
        clipboardRef.current = nodes.filter(n => n.selected).map(n => ({ ...n, id: `node_${Date.now()}_${Math.random()}`, position: { x: n.position.x + 20, y: n.position.y + 20 } }));
        closeDrawer();
        break;
      case 'Paste':
        if (clipboardRef.current.length > 0) {
          takeSnapshot();
          const pasted = clipboardRef.current.map(n => ({ ...n, id: `node_${Date.now()}_${Math.random()}`, selected: false }));
          setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...pasted]);
          clipboardRef.current = pasted.map(n => ({ ...n, position: { x: n.position.x + 20, y: n.position.y + 20 } }));
        }
        closeDrawer();
        break;
      case 'Duplicate':
        const selected = nodes.filter(n => n.selected);
        if (selected.length > 0) {
          takeSnapshot();
          const duped = selected.map(n => ({ ...n, id: `node_${Date.now()}_${Math.random()}`, position: { x: n.position.x + 20, y: n.position.y + 20 }, selected: false }));
          setNodes(nds => [...nds.map(n => ({ ...n, selected: false })), ...duped]);
        }
        closeDrawer();
        break;
      case 'Select All':
        setNodes(nds => nds.map(n => ({ ...n, selected: true })));
        setEdges(eds => eds.map(e => ({ ...e, selected: true })));
        closeDrawer();
        break;
      case 'Select None':
        setNodes(nds => nds.map(n => ({ ...n, selected: false })));
        setEdges(eds => eds.map(e => ({ ...e, selected: false })));
        closeDrawer();
        break;
      case 'Select Vertices':
        setNodes(nds => nds.map(n => ({ ...n, selected: true })));
        setEdges(eds => eds.map(e => ({ ...e, selected: false })));
        closeDrawer();
        break;
      case 'Select Edges':
        setEdges(eds => eds.map(e => ({ ...e, selected: true })));
        setNodes(nds => nds.map(n => ({ ...n, selected: false })));
        closeDrawer();
        break;
      case 'Copy as Image':
        exportDiagram('png');
        closeDrawer();
        break;
      case 'Copy as SVG':
        exportDiagram('svg');
        closeDrawer();
        break;
      case 'Find/Replace':
        const fTerm = window.prompt('Find text in nodes:');
        if (fTerm) {
          const rTerm = window.prompt(`Replace "${fTerm}" with:`);
          if (rTerm !== null) {
            takeSnapshot();
            setNodes(nds => nds.map(n => ({ ...n, data: { ...n.data, label: n.data.label?.replaceAll(fTerm, rTerm) } })));
          }
        }
        closeDrawer();
        break;
      case 'Lock/Unlock':
        setNodes(nds => nds.map(n => n.selected ? { ...n, draggable: n.draggable === false ? true : false } : n));
        closeDrawer();
        break;
      case 'Edit':
        setModalConfig({ type: 'alert', title: 'Edit Mode', message: 'Double-click any shape on the canvas to enter inline text editing mode.' });
        closeDrawer();
        break;
      case 'Edit Style...':
        const selNodes = nodes.filter(n => n.selected);
        const selEdges = edges.filter(e => e.selected);
        if (selNodes.length === 0 && selEdges.length === 0) {
          setModalConfig({ type: 'alert', title: 'No Selection', message: 'Select a shape or a connector line first to edit its appearance.' });
        } else if (selNodes.length > 0) {
          const n = selNodes[0];
          setModalConfig({
            type: 'edit_style',
            title: '🎨 Shape Style',
            message: '',
            isEdge: false,
            nodeId: n.id,
            fillColor: n.data.fillColor || '#ffffff',
            strokeColor: n.data.strokeColor || '#60a5fa',
            fontSize: n.data.fontSize || 13
          });
        } else if (selEdges.length > 0) {
          const edge = selEdges[0];
          setModalConfig({
            type: 'edit_style',
            title: '🎨 Edge Style (Draw.io)',
            message: '',
            isEdge: true,
            edgeId: edge.id,
            routing: edge.data?.routing || 'sharp',
            strokeColor: edge.data?.stroke || '#64748b',
            strokeDash: edge.data?.strokeDash || [],
            markerStart: edge.data?.markerStart || 'none',
            markerEnd: edge.data?.markerEnd || 'none'
          });
        }
        closeDrawer();
        break;
      case 'Edit Data...':
        const dataSel = nodes.filter(n => n.selected);
        if (dataSel.length === 0) {
          setModalConfig({ type: 'alert', title: 'No Selection', message: 'Select a shape first to edit its custom data properties.' });
        } else {
          const nd = dataSel[0];
          setModalConfig({ type: 'edit_data', title: '📋 Edit Node Data', message: '', nodeId: nd.id, nodeData: JSON.stringify(nd.data, null, 2) });
        }
        closeDrawer();
        break;
      case 'Edit Tooltip...':
        const ttSel = nodes.filter(n => n.selected);
        if (ttSel.length > 0) {
          const ttVal = window.prompt('Enter tooltip text for selected shape:', ttSel[0].data.tooltip || '');
          if (ttVal !== null) {
            takeSnapshot();
            setNodes(nds => nds.map(n => n.selected ? { ...n, data: { ...n.data, tooltip: ttVal } } : n));
          }
        } else {
          setModalConfig({ type: 'alert', title: 'No Selection', message: 'Select a shape first to set its tooltip.' });
        }
        closeDrawer();
        break;
      case 'Edit Link...':
        const lkSel = nodes.filter(n => n.selected);
        if (lkSel.length > 0) {
          const linkVal = window.prompt('Enter URL to attach to selected shape (leave blank to remove):', lkSel[0].data.link || '');
          if (linkVal !== null) {
            takeSnapshot();
            setNodes(nds => nds.map(n => n.selected ? { ...n, data: { ...n.data, link: linkVal } } : n));
            setModalConfig({ type: 'alert', title: '🔗 Link Set', message: `Link attached to selected shape. Click the shape and use "Open Link" to navigate.` });
          }
        } else {
          setModalConfig({ type: 'alert', title: 'No Selection', message: 'Select a shape first to attach a link.' });
        }
        closeDrawer();
        break;
      case 'Open Link':
        const lkNode = nodes.find(n => n.selected && n.data.link);
        if (lkNode) {
          window.open(lkNode.data.link, '_blank');
        } else {
          setModalConfig({ type: 'alert', title: 'No Link', message: 'Select a shape that has an attached link. Use Edit → Edit Link... to add one.' });
        }
        closeDrawer();
        break;
      case 'Edit Geometry...':
        const geoNode = nodes.find(n => n.selected);
        if (geoNode) {
          setModalConfig({ type: 'alert', title: '📐 Geometry', message: `Position: (${Math.round(geoNode.position.x)}, ${Math.round(geoNode.position.y)})\nSize: ${geoNode.style?.width || 140} × ${geoNode.style?.height || 80}\n\nDrag the shape on the canvas to reposition it.` });
        } else {
          setModalConfig({ type: 'alert', title: 'No Selection', message: 'Select a shape to view its geometry.' });
        }
        closeDrawer();
        break;
      case 'Edit Connection Points...':
        setModalConfig({ type: 'alert', title: '🔌 Connection Points', message: 'Connection points are shown as blue dots on the edges of shapes. Drag from any dot to create a connector between shapes.' });
        closeDrawer();
        break;
      default:
        setModalConfig({ type: 'alert', title: label, message: `The '${label}' feature is available. Select a shape on the canvas and try again, or check View menu options.` });
        closeDrawer();
    }
  };

  // ---- VIEW MENU ----
  const handleViewMenu = (label) => {
    switch (label) {
      case 'Grid': setShowGrid(g => !g); closeDrawer(); break;
      case 'Animations': setShowAnimations(a => !a); closeDrawer(); break;
      case 'Page View': setShowPageView(p => !p); closeDrawer(); break;
      case 'Ruler': setShowRuler(r => !r); closeDrawer(); break;
      case 'Outline': setShowMinimap(m => !m); closeDrawer(); break;
      case 'Shapes': setShowShapesPanel(s => !s); closeDrawer(); break;
      case 'Search Shapes':
        setShowShapesPanel(true);
        closeDrawer();
        setTimeout(() => {
          const searchEl = document.querySelector('.sidebar-shapes-panel input');
          if (searchEl) searchEl.focus();
        }, 400);
        break;
      case 'Fullscreen':
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {});
        else document.exitFullscreen().catch(() => {});
        closeDrawer();
        break;
      case 'Zoom In': rfInstance?.zoomIn({ duration: 300 }); closeDrawer(); break;
      case 'Zoom Out': rfInstance?.zoomOut({ duration: 300 }); closeDrawer(); break;
      case 'Reset View': rfInstance?.fitView({ duration: 400 }); closeDrawer(); break;
      case 'Layers':
        setModalConfig({ type: 'alert', title: '🗂 Layers', message: `This diagram has 1 active layer.\n\nAll ${nodes.length} shapes and ${edges.length} connectors are on the default layer.` });
        closeDrawer();
        break;
      default:
        closeDrawer();
    }
  };

  // ---- EXTRAS MENU ----
  const handleExtrasMenu = (label) => {
    switch (label) {
      case 'Edit Diagram...':
        const raw = JSON.stringify({ nodes, edges }, null, 2);
        setModalConfig({ type: 'alert', title: 'Diagram Source (JSON)', message: raw.slice(0, 600) + (raw.length > 600 ? '\n...(truncated)' : '') });
        closeDrawer();
        break;
      case 'Show Start Screen':
        setModalConfig({ type: 'alert', title: 'Smart Diagram', message: 'Welcome to Smart Diagram! Drag shapes from the left sidebar onto the canvas to start building. Use the File menu to save or export your work.' });
        closeDrawer();
        break;
      case 'Autosave':
        if (!currentUser) {
          setModalConfig({ type: 'alert', title: '🔐 Sign In Required', message: 'Sign in with Google to enable cloud autosave.' });
        } else {
          cloudSave();
        }
        closeDrawer();
        break;
      case 'Copy on Connect':
        setModalConfig({ type: 'alert', title: 'Copy on Connect', message: 'Copy on Connect duplicates the source node style when you create a new connection. This is enabled by default.' });
        closeDrawer();
        break;
      case 'Language':
        setModalConfig({ type: 'alert', title: '🌐 Language', message: 'Current language: English (en)\n\nAdditional language packs (Hindi, Tamil, French, Arabic, etc.) can be added via the Firebase cloud config. Currently English only.' });
        closeDrawer();
        break;

      case 'Appearance':
        setModalConfig({ type: 'appearance_customizer', title: '🎨 Customize Appearance' });
        closeDrawer();
        break;
      case 'Theme':
        setModalConfig({ type: 'theme_selector', title: '🖥️ Select Background Theme' });
        closeDrawer();
        break;
      case 'Adaptive Colors':
        setModalConfig({ type: 'adaptive_colors', title: '🎨 Select Adaptive Color' });
        closeDrawer();
        break;
      case 'Mathematical Typesetting':
        setModalConfig({ type: 'alert', title: '∑ Mathematical Typesetting', message: 'LaTeX/MathJax typesetting for node labels is a cloud-deployed feature. Enable it by integrating the MathJax CDN in your public/index.html.' });
        closeDrawer();
        break;
      case 'Collapse/Expand':
        setNodes(nds => nds.map(n => n.selected ? { ...n, data: { ...n.data, collapsed: !n.data.collapsed } } : n));
        closeDrawer();
        break;
      case 'Diagram Language':
        const src = JSON.stringify({ name: diagramName, nodes, edges }, null, 2);
        setModalConfig({ type: 'alert', title: '📝 Diagram Source', message: src.slice(0, 800) + (src.length > 800 ? '\n\n...(use Export as → JSON to get full source)' : '') });
        closeDrawer();
        break;
      default:
        setModalConfig({ type: 'alert', title: label, message: `The '${label}' feature is available. Check your current selection or the relevant menu section.` });
        closeDrawer();
    }
  };

  // ---- HELP MENU ----
  const handleHelpMenu = (label) => {
    switch (label) {
      case 'Keyboard Shortcuts...':
        setModalConfig({
          type: 'shortcuts',
          title: '⌨️ Keyboard Shortcuts',
          message: '',
          shortcuts: [
            { key: 'Ctrl + Z', action: 'Undo' },
            { key: 'Ctrl + Y', action: 'Redo' },
            { key: 'Ctrl + A', action: 'Select All' },
            { key: 'Ctrl + C', action: 'Copy selected shapes' },
            { key: 'Ctrl + V', action: 'Paste shapes' },
            { key: 'Ctrl + X', action: 'Cut selected shapes' },
            { key: 'Ctrl + D', action: 'Duplicate selection' },
            { key: 'Delete', action: 'Delete selection' },
            { key: 'Ctrl + S', action: 'Save (PNG)' },
            { key: 'Ctrl + Shift + S', action: 'Save As (JSON)' },
            { key: 'Ctrl + P', action: 'Print' },
            { key: 'Ctrl + F', action: 'Menu Search' },
            { key: 'Double-click', action: 'Edit node text' },
            { key: 'Scroll (2-finger H)', action: 'Switch page' },
          ]
        });
        closeDrawer();
        break;
      case 'Quick Start Video...':
        setModalConfig({ type: 'alert', title: 'Quick Start', message: 'Drag any shape from the left panel onto the canvas.\n\nConnect shapes by dragging from the blue handle dots.\n\nDouble-click to edit text. Use the File menu to save or export.' });
        closeDrawer();
        break;
      case 'Get Desktop...':
        window.open('https://github.com/jgraph/drawio-desktop/releases', '_blank');
        closeDrawer();
        break;
      case 'Support...':
        setModalConfig({ 
          type: 'alert', 
          title: '🛠️ Support & Assistance', 
          message: 'For technical support, feature requests, or bug reports, please contact our development team at support@smartdiagram.io. \n\nOur team typically responds within 24-48 hours.' 
        });
        closeDrawer();
        break;
      default:
        closeDrawer();
    }
  };

  const handleShare = () => {
    setModalConfig({ 
      type: 'share_panel', 
      title: '📤 Share Diagram', 
      message: 'Choose a software to share your diagram in PNG format.' 
    });
  };



  const sidebarCategories = SIDEBAR_CATEGORIES;

  const fileItems = [
    { label: 'New...', hasArrow: false },
    { label: 'Open from', hasArrow: true },
    { label: 'Open Recent', hasArrow: true },
    { type: 'divider' },
    { label: 'Save', shortcut: 'Ctrl+S' },
    { label: 'Save as JSON', shortcut: 'Ctrl+Shift+S' },
    { type: 'divider' },
    { label: 'Share...' },
    { type: 'divider' },
    { label: 'Rename...' },
    { label: 'Make a Copy...' },
    { type: 'divider' },
    { label: 'Import from', hasArrow: true },
    { label: 'Export as', hasArrow: true },
    { type: 'divider' },
    { label: 'Page Setup...' },
    { label: 'Print...', shortcut: 'Ctrl+P' },
    { type: 'divider' },
    { label: 'Close' },
  ];

  const editItems = [
    { label: 'Undo', shortcut: 'Ctrl+Z' },
    { label: 'Redo', shortcut: 'Ctrl+Y' },
    { type: 'divider' },
    { label: 'Cut', shortcut: 'Ctrl+X' },
    { label: 'Copy', shortcut: 'Ctrl+C' },
    { label: 'Paste', shortcut: 'Ctrl+V' },
    { label: 'Delete', shortcut: 'Delete' },
    { type: 'divider' },
    { label: 'Duplicate', shortcut: 'Ctrl+D' },
    { type: 'divider' },
    { label: 'Select All', shortcut: 'Ctrl+A' },
    { label: 'Select None', shortcut: 'Ctrl+Shift+A' },
    { type: 'divider' },
    { label: 'Lock/Unlock', shortcut: 'Ctrl+L' },
  ];

  const viewItems = [
    { label: 'Outline', shortcut: 'Ctrl+Shift+O', hasCheck: true, isActive: showMinimap },
    { label: 'Layers', shortcut: 'Ctrl+Shift+L' },
    { type: 'divider' },
    { label: 'Search Shapes', hasCheck: true },
    { label: 'Shapes', shortcut: 'Ctrl+Shift+K', hasCheck: true, isActive: showShapesPanel },
    { type: 'divider' },
    { label: 'Page View', shortcut: 'Ctrl+Shift+P', hasCheck: true, isActive: showPageView },
    { type: 'divider' },
    { label: 'Page Tabs', hasCheck: true, isActive: true },
    { label: 'Ruler', hasCheck: true, isActive: showRuler },
    { type: 'divider' },
    { label: 'Tooltips', hasCheck: true, isActive: true },
    { label: 'Animations', hasCheck: true, isActive: showAnimations },
    { type: 'divider' },
    { label: 'Grid', shortcut: 'Ctrl+Shift+G', hasCheck: true, isActive: showGrid },
    { type: 'divider' },
    { label: 'Reset View', shortcut: 'Enter/Home' },
    { label: 'Zoom In', shortcut: 'Ctrl + / Alt+Mousewheel' },
    { label: 'Zoom Out', shortcut: 'Ctrl - / Alt+Mousewheel' },
    { type: 'divider' },
    { label: 'Fullscreen' },
  ];

  const extrasItems = [
    { label: 'Language', hasArrow: true },
    { label: 'Appearance', hasArrow: true },
    { label: 'Theme', hasArrow: true },
    { type: 'divider' },
    { label: 'Adaptive Colors', hasHelpIcon: true, hasArrow: true },
  ];

  const helpItems = [
    { label: 'Keyboard Shortcuts...' },
    { label: 'Quick Start Video...' },
    { label: 'Support...' }
  ];

  const menuSections = {
    'File': fileItems,
    'Edit': editItems,
    'View': viewItems,
    'Extras': extrasItems,
    'Help': helpItems,
  };

  return (
    <div className={`
      ${isShaking ? "anim-window-shake" : ""} 
      ${themeMode === 'dark' ? 'dark-theme' : ''} 
      ${!showAnimations || IS_MOBILE ? "disable-animations" : ""} 
      ${!showConnectionPoints ? "hide-connection-points" : ""}
      ${IS_MOBILE ? "mobile-mode" : ""}
    `.trim().replace(/\s+/g, ' ')} style={{
      '--theme-color': themeColor,
      ...getThemeStyles(),
      display: "flex",
      width: "100vw",
      height: "100vh",
      boxSizing: "border-box",
      fontFamily: "'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      background: 'var(--bg)',
    }}>

      {/* INNER APP CONTAINER */}
      <div style={{
        flex: 1,
        display: "flex",
        overflow: "hidden"
      }}>

        {/* FAR LEFT SLIM NAV */}
        <div className="no-print" style={{ width: "56px", background: 'var(--panel-bg)', borderRight: '1px solid var(--border)', display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 0", gap: "20px" }}>
          <div style={{ background: 'var(--border)', color: "var(--theme-color)", padding: "8px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Frame size={20} />
          </div>
          
          <div 
            onClick={() => setModalConfig({ type: 'alert', title: '✨ Auto-Layout', message: 'Enhance/Smooth layout feature is temporarily unavailable.' })}
            title="Enhance/Smooth Layout"
            style={{ color: "#94a3b8", cursor: "pointer", padding: "8px" }}
            onMouseOver={e => e.currentTarget.style.color = "var(--theme-color)"}
            onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}
          >
            <Wand2 size={20} />
          </div>
          
          <div 
            onClick={() => setModalConfig({ type: 'ai_prompt', title: 'Generate with AI', message: 'Describe the diagram you want to create.' })}
            title="AI Text-to-Diagram"
            style={{ color: "#94a3b8", cursor: "pointer", padding: "8px", position: 'relative' }}
            onMouseOver={e => e.currentTarget.style.color = "var(--theme-color)"}
            onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}
          >
            <FileText size={20} />
            <Sparkles size={10} style={{ position: 'absolute', top: 4, right: 4, color: "var(--theme-color)" }} />
          </div>
          
          <div 
            onClick={() => setModalConfig({ type: 'ai_image', title: 'Image to Diagram', message: 'Upload a sketch or image to convert it into a workspace.' })}
            title="AI Image-to-Diagram"
            style={{ color: "#94a3b8", cursor: "pointer", padding: "8px", position: 'relative' }}
            onMouseOver={e => e.currentTarget.style.color = "var(--theme-color)"}
            onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}
          >
            <Image size={20} />
            <Sparkles size={10} style={{ position: 'absolute', top: 4, right: 4, color: "var(--theme-color)" }} />
          </div>

          <div style={{ width: '24px', height: '1px', background: 'var(--border)' }} />

          <div style={{ flex: 1 }} /> {/* Push bottom icons down */}

          <div 
            onClick={() => setModalConfig({ type: 'system_info', title: 'System Details' })}
            title="System Details"
            style={{ color: "#94a3b8", cursor: "pointer", padding: "8px" }}
            onMouseOver={e => e.currentTarget.style.color = "var(--theme-color)"}
            onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}
          >
            <HelpCircle size={20} />
          </div>

          <div 
            onClick={() => setModalConfig({ type: 'feedback', title: 'Send Feedback' })}
            title="Send Feedback"
            style={{ color: "#94a3b8", cursor: "pointer", padding: "8px" }}
            onMouseOver={e => e.currentTarget.style.color = themeColor}
            onMouseOut={e => e.currentTarget.style.color = "#94a3b8"}
          >
            <Mail size={20} />
          </div>
        </div>

        {/* MAIN CONTENT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", position: 'relative' }}>
          


          {/* TOP HEADER */}
          <div className="no-print" style={{ background: 'var(--bg)' }}>
            {/* Row 1 */}
            <div style={{ height: "48px", display: "flex", alignItems: "center", padding: "0 16px", gap: "16px" }}>
              <Menu onClick={openDrawer} size={20} color='var(--text-muted)' style={{ cursor: "pointer" }} />
              <div style={{ display: "flex", alignItems: "center", background: 'var(--panel-bg)', padding: "4px 8px", borderRadius: "6px", gap: "8px", border: '1px solid var(--border)', boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}>
                <FileJson size={14} color="#60a5fa" />
                <input
                  value={diagramName}
                  onChange={(e) => setDiagramName(e.target.value)}
                  style={{ background: "transparent", border: "none", outline: "none", fontSize: "14px", fontWeight: "600", color: 'var(--text)', width: "130px" }}
                />
              </div>
              <div style={{ flex: 1 }} />
              {false && (
                <div style={{ display: 'flex', gap: '16px' }}>
                  {/* Cloud save button */}
                  <div
                    onClick={cloudSave}
                    title={currentUser ? "Save to Cloud" : "Sign in to save"}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", background: isSavingCloud ? "#e0f2fe" : "#eff6ff", color: "var(--theme-color)", fontSize: "12px", fontWeight: "600", cursor: "pointer", border: "1px solid #bfdbfe", transition: "all 0.15s" }}
                    onMouseOver={e => e.currentTarget.style.background = "#dbeafe"}
                    onMouseOut={e => e.currentTarget.style.background = isSavingCloud ? "#e0f2fe" : "#eff6ff"}
                  >
                    ☁️ {isSavingCloud ? "Saving…" : cloudDiagramId ? "Saved" : "Save to Cloud"}
                  </div>
                  {/* Google Auth */}
                  {currentUser ? (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <img src={currentUser.photoURL} alt="avatar" referrerPolicy="no-referrer" style={{ width: 28, height: 28, borderRadius: "50%", border: "2px solid #bfdbfe" }} />
                      <span style={{ fontSize: "12px", color: "#475569", fontWeight: 600 }}>{currentUser.displayName?.split(' ')[0]}</span>
                      <span onClick={signOutUser} style={{ fontSize: "11px", color: "#94a3b8", cursor: "pointer", textDecoration: "underline" }}>Sign out</span>
                    </div>
                  ) : (
                    <div
                      onClick={signInWithGoogle}
                      style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "6px", background: "#ffffff", border: "1px solid #e2e8f0", cursor: "pointer", fontSize: "12px", fontWeight: "600", color: "#0f172a", boxShadow: "0 1px 2px rgba(0,0,0,0.05)" }}
                      onMouseOver={e => e.currentTarget.style.background = "#f8fafc"}
                      onMouseOut={e => e.currentTarget.style.background = "#ffffff"}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                      Sign in with Google
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Row 2: Standard Format Toolbar */}
            <div style={{ height: "44px", background: 'var(--panel-bg)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', display: "flex", alignItems: "center", padding: "0 20px", gap: "24px" }}>

              <div style={{ display: "flex", gap: "12px", color: "#64748b" }}>
                <Undo2 size={16} onClick={undo} style={{ cursor: past.length > 0 ? "pointer" : "not-allowed", opacity: past.length > 0 ? 1 : 0.4 }} />
                <Redo2 size={16} onClick={redo} style={{ cursor: future.length > 0 ? "pointer" : "not-allowed", opacity: future.length > 0 ? 1 : 0.4 }} />
              </div>

              <div style={{ display: "flex", gap: "16px", color: 'var(--text-muted)', alignItems: "center", fontSize: "13px" }}>
                <select value={selectedData.fontFamily || ""} onChange={(e) => updateSelectedNodes({ fontFamily: e.target.value })} style={{ background: "transparent", border: "none", outline: "none", cursor: "pointer", color: "inherit", fontSize: "inherit", fontWeight: "600", appearance: "none" }}>
                  <option value="">Arial</option><option value="Times New Roman">Times New Roman</option><option value="Courier New">Courier New</option><option value="Georgia">Georgia</option>
                </select>
                <select value={selectedData.fontSize || ""} onChange={(e) => updateSelectedNodes({ fontSize: e.target.value })} style={{ background: "transparent", border: "none", outline: "none", cursor: "pointer", color: "inherit", fontSize: "inherit", fontWeight: "600", appearance: "none" }}>
                  <option value="">12</option><option value="14">14</option><option value="16">16</option><option value="18">18</option><option value="24">24</option><option value="32">32</option>
                </select>
              </div>

              <div style={{ display: "flex", gap: "12px", color: "#475569" }}>
                <div style={{ cursor: "pointer", background: selectedData.bold ? "#e2e8f0" : "transparent", padding: "2px", borderRadius: "4px" }} onClick={() => updateSelectedNodes({ bold: !selectedData.bold })}><Bold size={16} /></div>
                <div style={{ cursor: "pointer", background: selectedData.italic ? "#e2e8f0" : "transparent", padding: "2px", borderRadius: "4px" }} onClick={() => updateSelectedNodes({ italic: !selectedData.italic })}><Italic size={16} /></div>
                <div style={{ cursor: "pointer", background: selectedData.underline ? "#e2e8f0" : "transparent", padding: "2px", borderRadius: "4px" }} onClick={() => updateSelectedNodes({ underline: !selectedData.underline })}><Underline size={16} /></div>
                <div style={{ cursor: "pointer", padding: "2px", borderRadius: "4px" }} onClick={() => {
                  takeSnapshot();
                  setNodes((nds) => [...nds, { id: `node_${Date.now()}`, type: "flowchart", position: { x: window.innerWidth/2 - 100, y: window.innerHeight/2 - 100 }, style: { width: 140, height: 40 }, data: { label: "New Text", shapeType: "text" } }]);
                }}><Type size={16} /></div>
              </div>

              <div style={{ display: "flex", gap: "12px", color: "#475569" }}>
                <div style={{ cursor: "pointer", background: selectedData.textAlign === "left" ? "#e2e8f0" : "transparent", padding: "2px", borderRadius: "4px" }} onClick={() => updateSelectedNodes({ textAlign: "left" })}><AlignLeft size={16} /></div>
                <div style={{ cursor: "pointer", background: (!selectedData.textAlign || selectedData.textAlign === "center") ? "#e2e8f0" : "transparent", padding: "2px", borderRadius: "4px" }} onClick={() => updateSelectedNodes({ textAlign: "center" })}><AlignCenter size={16} /></div>
                <div style={{ cursor: "pointer", background: selectedData.textAlign === "right" ? "#e2e8f0" : "transparent", padding: "2px", borderRadius: "4px" }} onClick={() => updateSelectedNodes({ textAlign: "right" })}><AlignRight size={16} /></div>
              </div>

              <div style={{ flex: 1 }} />
              
              {/* Toolbar cleanup: More menu removed */}

            </div>
          </div>

          {/* WORKSPACE H-FLEX */}
          <div style={{ flex: 1, display: "flex", position: "relative" }}>

            {/* LEFT SIDEBAR */}
            {showShapesPanel && (
              <div className="no-print sidebar-shapes-panel" style={{ width: "260px", background: 'var(--shapes-bg)', borderRight: '1px solid var(--border)', display: "flex", flexDirection: "column" }}>
                <div style={{ padding: "16px" }}>
                  <div style={{ background: "#ffffff", borderRadius: "6px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", border: "1px solid #e2e8f0" }}>
                    <Search size={16} color="#94a3b8" />
                    <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search Shapes" style={{ border: "none", outline: "none", background: "transparent", fontSize: "13px", width: "100%" }} />
                  </div>
                </div>

                <div style={{ flex: 1, overflowY: "auto", padding: "0 16px" }}>
                  {sidebarCategories.map(cat => ({ ...cat, items: cat.items.filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase())) }))
                    .filter(cat => cat.items.length > 0)
                    .map((category) => (
                    <div key={category.title}>
                      <div onClick={() => toggleCategory(category.title)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0 8px", cursor: "pointer", color: "#000000", fontSize: "13px", fontWeight: "600", userSelect: "none" }}>
                        {category.title} <ChevronDown size={14} color="#64748b" style={{ transform: openCategories[category.title] ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                      </div>
                      <div style={{ display: openCategories[category.title] ? "grid" : "none", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginTop: "4px", marginBottom: "12px" }}>
                        {category.items.map((item, idx) => (
                          <div
                            key={item.id || `${category.title}-${idx}`}
                            draggable={true}
                            onDragStart={(e) => { handleDragStart(e, item); }}
                            onMouseEnter={(e) => { setHoveredShape({ label: item.label, x: e.clientX, y: e.clientY }); }}
                            onMouseMove={(e) => { setHoveredShape(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null); }}
                            onMouseLeave={() => { setHoveredShape(null); }}
                            onClick={() => handleShapeClick(item)}
                            className="hover-depth"
                            style={{
                              background: "none",
                              borderRadius: "6px",
                              height: "44px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              cursor: "grab",
                              border: item.isEdge ? "1px solid #e2e8f0" : "none",
                              padding: "4px",
                              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          >
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              {item.isEdge ? (
                                getConnectorPreviewSvg(item, "#000000")
                              ) : (
                                <svg viewBox="0 0 100 100" width="22" height="22">
                                  {getShapeSvg(item.shapeType, "#000000", "1.5", "transparent")}
                                </svg>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ANIMATIONS */}
      {/* CUSTOM TOOLTIP - viewport-relative positioning */}
      {hoveredShape && (
        <div style={{
          position: 'fixed',
          left: hoveredShape.x + 12,
          top: hoveredShape.y + 12,
          background: '#1e293b',
          color: '#fff',
          padding: '6px 10px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          pointerEvents: 'none',
          zIndex: 99999,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {hoveredShape.label}
        </div>
      )}
      {/* CANVAS */}
              <div 
                style={{ flex: 1, position: "relative", backgroundColor: "#f1f5f9", zIndex: isMainMenuRendered && !isMainMenuClosing ? 1001 : 1, overflow: 'hidden', cursor: formatBrush ? 'crosshair' : 'default' }} 
                ref={reactFlowRef} 
                onDragOver={handleDragOver} 
                onDrop={handleDrop}
                onMouseMove={(e) => {
                  if (mouseGlowRef.current) {
                    const bounds = e.currentTarget.getBoundingClientRect();
                    mouseGlowRef.current.style.left = (e.clientX - bounds.left) + 'px';
                    mouseGlowRef.current.style.top = (e.clientY - bounds.top) + 'px';
                  }
                }}
              >
                {!IS_MOBILE && <div ref={mouseGlowRef} className="canvas-mouse-glow" style={{ left: 0, top: 0 }} />}
                {isAiProcessing && (
                  <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, 
                    backgroundColor: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)',
                    zIndex: 2000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    pointerEvents: 'all'
                  }}>
                    <div className="anim-pulse" style={{ padding: '24px', background: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                      <div style={{ width: '40px', height: '40px', border: '4px solid #f3f3f3', borderTop: '4px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                      <div style={{ fontWeight: '600', color: '#1e293b' }}>AI is structuring your diagram...</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>Calculating optimal grid positions</div>
                    </div>
                  </div>
                )}


              {/* RULERS */}
              {showRuler && (
                <>
                  <div className="ruler-container ruler-top">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div key={i} style={{ flex: 1, borderLeft: '1px solid #e2e8f0', height: i % 5 === 0 ? '100%' : '40%', paddingLeft: 2 }}>{i % 5 === 0 ? i * 100 : ''}</div>
                    ))}
                  </div>
                  <div className="ruler-container ruler-left">
                    {Array.from({ length: 15 }).map((_, i) => (
                      <div key={i} style={{ flex: 1, borderTop: '1px solid #e2e8f0', width: i % 5 === 0 ? '100%' : '40%', paddingTop: 2 }}>{i % 5 === 0 ? i * 100 : ''}</div>
                    ))}
                  </div>
                </>
              )}

              {/* FLOATING FORMAT BAR */}
              {hasSelectedNode && (
                <div style={{
                  position: "absolute",
                  top: "24px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  background: "#ffffff",
                  padding: "16px 24px",
                  borderRadius: "16px",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  display: "flex",
                  gap: "24px",
                  alignItems: "center",
                  zIndex: 10,
                  border: formatBrush ? "2px solid #3b82f6" : "1px solid #e2e8f0"
                }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", gap: "12px", border: "1px solid #e2e8f0", padding: "4px 8px", borderRadius: "6px", color: "#000000", fontSize: "14px", alignItems: "center", height: "30px" }}>
                      <select 
                        value={selectedData.fontFamily || ""} 
                        onChange={(e) => updateSelectedNodes({ fontFamily: e.target.value })}
                        style={{ border: "none", outline: "none", background: "transparent", width: "70px", cursor: "pointer" }}
                      >
                        <option value="">Arial</option>
                        <option value="'Courier New', Courier, monospace">Courier</option>
                        <option value="'Times New Roman', Times, serif">Times</option>
                        <option value="'Inter', sans-serif">Inter</option>
                      </select>
                      <div style={{ width: "1px", height: "16px", background: "#e2e8f0" }} />
                      <select 
                        value={selectedData.fontSize || 13} 
                        onChange={(e) => updateSelectedNodes({ fontSize: Number(e.target.value) })}
                        style={{ border: "none", outline: "none", background: "transparent", width: "45px", cursor: "pointer" }}
                      >
                        {[10, 11, 12, 13, 14, 16, 18, 20, 24, 32].map(size => (
                          <option key={size} value={size}>{size}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div style={{ display: "flex", gap: "16px", color: "#334155", paddingLeft: "4px", alignItems: "center" }}>
                      <div title="Bold" style={{ cursor: "pointer", background: selectedData.bold ? "#e2e8f0" : "transparent", padding: "2px", borderRadius: "4px" }} onClick={() => updateSelectedNodes({ bold: !selectedData.bold })}><Bold size={16} /></div>
                      <div title="Italic" style={{ cursor: "pointer", background: selectedData.italic ? "#e2e8f0" : "transparent", padding: "2px", borderRadius: "4px" }} onClick={() => updateSelectedNodes({ italic: !selectedData.italic })}><Italic size={16} /></div>
                      {/* Underline — solid line, marks Primary Key in ER diagrams */}
                      <div
                        title="Underline (Primary Key)"
                        onClick={() => updateSelectedNodes({ underline: !selectedData.underline, dottedUnderline: false })}
                        style={{
                          cursor: "pointer",
                          padding: "2px 3px",
                          borderRadius: "4px",
                          background: selectedData.underline ? "#e2e8f0" : "transparent",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "1px",
                          lineHeight: 1,
                        }}
                      >
                        <span style={{ fontWeight: "bold", fontSize: "14px", fontStyle: "normal", textDecoration: "none" }}>U</span>
                        <div style={{ height: "2px", width: "12px", background: "#334155", borderRadius: "1px" }} />
                      </div>
                      {/* Dotted Underline — marks Foreign Key in ER diagrams */}
                      <div
                        title="Dotted Underline (Foreign Key)"
                        onClick={() => updateSelectedNodes({ dottedUnderline: !selectedData.dottedUnderline, underline: false })}
                        style={{
                          cursor: "pointer",
                          padding: "2px 3px",
                          borderRadius: "4px",
                          background: selectedData.dottedUnderline ? "#e2e8f0" : "transparent",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "1px",
                          lineHeight: 1,
                        }}
                      >
                        <span style={{ fontWeight: "bold", fontSize: "14px", fontStyle: "normal", textDecoration: "none" }}>U</span>
                        <div style={{ height: "2px", width: "12px", backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)", backgroundSize: "4px 2px", backgroundRepeat: "repeat-x" }} />
                      </div>
                      <div style={{ cursor: "pointer", padding: "2px", borderRadius: "4px" }} onClick={() => {
                        const nextAlign = selectedData.textAlign === "left" ? "center" : (selectedData.textAlign === "center" ? "right" : "left");
                        updateSelectedNodes({ textAlign: nextAlign });
                      }}>
                        {(!selectedData.textAlign || selectedData.textAlign === "center") && <AlignCenter size={16} />}
                        {selectedData.textAlign === "left" && <AlignLeft size={16} />}
                        {selectedData.textAlign === "right" && <AlignRight size={16} />}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", position: "relative", cursor: "pointer", padding: "2px", borderRadius: "4px" }}>
                         <span style={{ fontWeight: "bold", fontSize: "16px", lineHeight: "1", color: selectedData.color || "#000000" }}>A</span>
                         <input type="color" value={selectedData.color || "#000000"} onChange={(e) => updateSelectedNodes({ color: e.target.value })} style={{ position: "absolute", opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
                         <div style={{ position: "absolute", bottom: -2, height: 3, width: "100%", background: selectedData.color || "#000000" }} />
                      </div>
                    </div>
                  </div>

                  <div style={{ width: "1px", height: "40px", background: "#e2e8f0" }} />

                  <div style={{ display: "flex", gap: "24px", color: "#334155" }}>
                    <div onClick={handleFormatBrushClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", background: formatBrush ? "#e2e8f0" : "transparent", padding: "4px", borderRadius: "6px" }}>
                      <PaintBucket size={20} color={formatBrush ? "var(--theme-color)" : "currentColor"} />
                      <span style={{ fontSize: "11px", fontWeight: "600" }}>Format Painter</span>
                    </div>
                    <div onClick={applyQuickStyle} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", padding: "4px", borderRadius: "6px" }}>
                      <Wand2 size={20} />
                      <span style={{ fontSize: "11px", fontWeight: "600" }}>Style</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", position: "relative", padding: "4px", borderRadius: "6px" }}>
                      <div style={{ width: 18, height: 18, background: selectedData.fillColor || "#ffffff", border: "2px solid #334155", borderRadius: 2 }} />
                      <input type="color" value={selectedData.fillColor || "#ffffff"} onChange={(e) => updateSelectedNodes({ fillColor: e.target.value })} style={{ position: "absolute", top: 0, opacity: 0, width: 24, height: 24, cursor: "pointer" }} />
                      <span style={{ fontSize: "11px", fontWeight: "600" }}>Fill</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", cursor: "pointer", position: "relative", padding: "4px", borderRadius: "6px" }}>
                      <div style={{ width: 18, height: 18, background: "transparent", border: `3px solid ${selectedData.strokeColor || "#60a5fa"}`, borderRadius: 2 }} />
                      <input type="color" value={selectedData.strokeColor || "#60a5fa"} onChange={(e) => updateSelectedNodes({ strokeColor: e.target.value })} style={{ position: "absolute", top: 0, opacity: 0, width: 24, height: 24, cursor: "pointer" }} />
                      <span style={{ fontSize: "11px", fontWeight: "600" }}>Outline</span>
                    </div>
                  </div>

                 </div>
               )}
              
              <ReactFlow
                nodes={displayNodes}
                edges={displayEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeClick={onNodeClick}
                onEdgeClick={(evt, edge) => {
                  // Sync selection: select anchor nodes when edge is clicked
                  setNodes(nds => nds.map(n => {
                    if (n.id === edge.source || n.id === edge.target) {
                      if (n.type === 'anchor') return { ...n, selected: true };
                    }
                    return n;
                  }));
                }}
                onPaneClick={handlePaneClick}
                onPaneMouseMove={handlePaneMouseMove}
                 onDoubleClick={() => { if (drawingEdgeState) finishDrawingEdge(); }}
                onNodeDragStart={(evt, node) => {
                  // If dragging an anchor, deselect other nodes/edges to move independently
                  if (node.type === 'anchor') {
                    setNodes(nds => nds.map(n => ({ ...n, selected: n.id === node.id })));
                    setEdges(eds => eds.map(e => ({ ...e, selected: false })));
                  }
                  takeSnapshot();
                }}
                onNodeDragStop={(evt, node, allNodes) => {
                  // Persist positions to pages array after drag
                  setPages(prev => prev.map((p, idx) => idx === activePageIndex ? { ...p, nodes: allNodes } : p));
                }}
                onSelectionDragStart={() => takeSnapshot()}
                onNodesDelete={() => takeSnapshot()}
                onEdgesDelete={() => takeSnapshot()}
                nodeTypes={nodeTypes}
                edgeTypes={edgeTypes}
                onInit={setRfInstance}
                defaultEdgeOptions={{ 
                  type: 'smoothstep',
                  data: {
                    routing: 'smooth',
                    stroke: '#555555',
                    strokeWidth: 2,
                    strokeDash: [],
                    markerStart: 'none',
                    markerEnd: { type: MarkerType.ArrowClosed, color: '#555555' },
                    waypoints: []
                  }
                }}
                fitView={false}
                defaultViewport={{ x: 0, y: 0, zoom: 1.0 }}
                snapGrid={[1, 1]}
                panOnScroll={true}
                panOnScrollMode="all"
                zoomOnPinch={true}
                zoomOnScroll={false}
                selectionOnDrag={false}
                panOnDrag={[1, 2]}
              >
                {showGrid && <Background color={gridColor} variant="lines" gap={gridSize} size={1} />}
                
                {/* SVG Marker Definitions for Draw.io style edges - Inside ReactFlow for reliable export */}
                <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden', pointerEvents: 'none' }}>
                  <defs>
                    <marker id="open" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </marker>
                    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </marker>
                    <marker id="filled" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="currentColor" stroke="none" />
                    </marker>
                    <marker id="hollow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 5 L 0 10 z" fill="white" stroke="currentColor" strokeWidth="1.5" />
                    </marker>
                    <marker id="diamond" markerWidth="14" markerHeight="14" refX="12" refY="7" orient="auto-start-reverse">
                      <path d="M 0 7 L 6 0 L 12 7 L 6 14 z" fill="white" stroke="currentColor" strokeWidth="1.5" />
                    </marker>
                    <marker id="diamond_hollow" markerWidth="14" markerHeight="14" refX="12" refY="7" orient="auto-start-reverse">
                      <path d="M 0 7 L 6 0 L 12 7 L 6 14 z" fill="white" stroke="currentColor" strokeWidth="1.5" />
                    </marker>
                    <marker id="diamond-filled" markerWidth="14" markerHeight="14" refX="12" refY="7" orient="auto-start-reverse">
                      <path d="M 0 7 L 6 0 L 12 7 L 6 14 z" fill="currentColor" stroke="none" />
                    </marker>
                    <marker id="diamond_filled" markerWidth="14" markerHeight="14" refX="12" refY="7" orient="auto-start-reverse">
                      <path d="M 0 7 L 6 0 L 12 7 L 6 14 z" fill="currentColor" stroke="none" />
                    </marker>
                    <marker id="circle" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto-start-reverse">
                      <circle cx="5" cy="5" r="4" fill="white" stroke="currentColor" strokeWidth="1.5" />
                    </marker>
                    <marker id="circle-filled" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto-start-reverse">
                      <circle cx="5" cy="5" r="4" fill="currentColor" stroke="none" />
                    </marker>
                    <marker id="circle_filled" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto-start-reverse">
                      <circle cx="5" cy="5" r="4" fill="currentColor" stroke="none" />
                    </marker>
                    <marker id="cross" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto-start-reverse">
                      <path d="M 1 1 L 9 9 M 9 1 L 1 9" fill="none" stroke="currentColor" strokeWidth="2" />
                    </marker>
                    <marker id="halfCircle" markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto-start-reverse">
                      <path d="M 5 1 A 4 4 0 0 1 5 9" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </marker>
                    <marker id="ERone" markerWidth="10" markerHeight="14" refX="8" refY="7" orient="auto-start-reverse">
                      <path d="M 8 0 L 8 14" fill="none" stroke="currentColor" strokeWidth="2" />
                    </marker>
                    <marker id="ERmany" markerWidth="12" markerHeight="14" refX="10" refY="7" orient="auto-start-reverse">
                      <path d="M 0 0 L 10 7 L 0 14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </marker>
                    <marker id="ERoneToMany" markerWidth="14" markerHeight="14" refX="12" refY="7" orient="auto-start-reverse">
                      <path d="M 12 0 L 12 14" fill="none" stroke="currentColor" strokeWidth="2" />
                      <path d="M 0 0 L 10 7 L 0 14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </marker>
                    <marker id="ERzeroToOne" markerWidth="16" markerHeight="14" refX="14" refY="7" orient="auto-start-reverse">
                      <circle cx="4" cy="7" r="3" fill="white" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M 12 0 L 12 14" fill="none" stroke="currentColor" strokeWidth="2" />
                    </marker>
                    <marker id="ERzeroToMany" markerWidth="16" markerHeight="14" refX="14" refY="7" orient="auto-start-reverse">
                      <circle cx="4" cy="7" r="3" fill="white" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M 2 0 L 12 7 L 2 14" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    </marker>
                  </defs>
                </svg>
                
                {/* DRAWING TOOLTIP — removed (pixel coords hidden per user request) */}

                {/* SNAPPED PORT HIGHLIGHT */}
                {snappedPort && (
                   <div style={{ position: 'absolute', left: rfInstance?.flowToScreenPosition({ x: snappedPort.x, y: snappedPort.y }).x - 10, top: rfInstance?.flowToScreenPosition({ x: snappedPort.x, y: snappedPort.y }).y - 10, width: 20, height: 20, borderRadius: '50%', border: '4px solid #10b981', pointerEvents: 'none', zIndex: 10001, animation: 'pulse 1s infinite' }} />
                )}

                <Controls showInteractive={false} style={{ bottom: 72, right: 20, border: "none", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)", borderRadius: "8px" }} />
                {showMinimap && <MiniMap style={{ bottom: 72, left: 20, borderRadius: '8px', border: '1px solid #e2e8f0' }} nodeColor={() => '#60a5fa'} maskColor="rgba(241, 245, 249, 0.6)" />}
              </ReactFlow>

              {/* PAGE TAB BAR */}
              <div className="anim-tab-bar no-print" style={{ position: "absolute", bottom: 20, left: 20, display: "flex", background: "#ffffff", padding: "4px 8px", borderRadius: "8px", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)", zIndex: 100, gap: "6px", alignItems: "center" }}>
                {pages.map((p, idx) => (
                  <div
                    key={p.id}
                    className="anim-tab-item"
                    onClick={() => switchPage(idx)}
                    style={{ padding: "4px 10px 4px 12px", borderRadius: "4px", background: activePageIndex === idx ? "#f1f5f9" : "transparent", color: activePageIndex === idx ? "#0f172a" : "#64748b", fontSize: "13px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <span>{activePageIndex === idx ? diagramName : p.name}</span>
                    <span
                      onClick={(e) => { e.stopPropagation(); 
                        // Delete THIS specific page (by index), not always active
                        const { pages: cPages, activePageIndex: cIndex, nodes: cNodes, edges: cEdges, past: cPast, future: cFuture, diagramName: cName } = currentStateRef.current;
                        if (cPages.length <= 1) { triggerErrorShake(); setModalConfig({ type: 'alert', title: 'Action Restricted', message: 'You cannot delete the only remaining page.' }); return; }
                        const newPages = cPages.filter((_, i) => i !== idx);
                        const newActiveIndex = idx === cIndex ? Math.max(0, idx - 1) : (idx < cIndex ? cIndex - 1 : cIndex);
                        setPages(newPages);
                        setActivePageIndex(newActiveIndex);
                        const targetPage = newPages[newActiveIndex];
                        setNodes(targetPage.nodes);
                        setEdges(targetPage.edges);
                        setDiagramName(targetPage.name);
                        setPast(targetPage.past);
                        setFuture(targetPage.future);
                      }}
                      title="Close page"
                      style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "16px", height: "16px", borderRadius: "50%", fontSize: "12px", lineHeight: 1, color: activePageIndex === idx ? "#64748b" : "#94a3b8", cursor: "pointer", transition: "background 0.15s, color 0.15s" }}
                      onMouseOver={e => { e.currentTarget.style.background = "#e2e8f0"; e.currentTarget.style.color = "#0f172a"; }}
                      onMouseOut={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = activePageIndex === idx ? "#64748b" : "#94a3b8"; }}
                    >×</span>
                  </div>
                ))}
                <div className="anim-tab-item" onClick={() => switchPage(pages.length)} style={{ padding: "4px 8px", borderRadius: "4px", cursor: "pointer", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", fontWeight: "bold" }}>
                  +
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* MAIN MENU & BLUR BACKDROP */}
      {isMainMenuRendered && (
        <>
          <div 
             style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.1)', backdropFilter: 'blur(5px)', zIndex: 1000 }}
             onClick={closeDrawer}
             className={isMainMenuClosing ? "anim-modal-backdrop-out" : "anim-modal-backdrop"}
          />
          <style>{`
            .anim-modal-backdrop-out {
              animation: modalFadeOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }

            /* Hide connection points when toggled off */
            .hide-connection-points .react-flow__handle {
              opacity: 0 !important;
              pointer-events: none !important;
            }

            /* Butter smooth global transitions for UI elements */
            button, input, select, .sidebar-shapes-panel, .anim-hover-bounce, .menu-item, .react-flow__node {
              transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1) !important;
            }

            /* Subtle handles when visible */
            .react-flow__handle {
              background: #94a3b8 !important;
              border: 1px solid #ffffff !important;
              width: 6px !important;
              height: 6px !important;
              min-width: 6px !important;
              min-height: 6px !important;
              transition: opacity 0.2s ease;
            }

            .anim-node-entrance {
              animation: nodePop 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            }
            
            .anim-gradient-text {
              background: linear-gradient(90deg, #3b82f6, #8b5cf6);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
            }
          `}</style>
          <div className={isMainMenuClosing ? "anim-drawer-out" : "anim-drawer"} style={{ position: 'fixed', top: 0, left: 0, width: '316px', height: '100%', backgroundColor: '#f4f6f9', zIndex: 1002, padding: '24px 0', display: 'flex', flexDirection: 'column', boxShadow: '4px 0 20px rgba(0,0,0,0.1)', overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
            <div className="anim-gradient-text" style={{ padding: '0 24px', marginBottom: '32px', fontSize: '22px', fontWeight: '800', flexShrink: 0 }}>Smart Diagram</div>
            <div style={{ flex: 1 }}>
              {['File', 'Edit', 'View', 'Extras', 'Help'].map((item, i) => (
                <div key={item} className={isMainMenuClosing ? "" : `stagger-${i+1}`} style={{ display: 'flex', flexDirection: 'column' }}>
                  <div onClick={() => toggleMenuSection(item)} style={{ padding: '14px 24px', color: '#475569', cursor: 'pointer', fontSize: '15px', fontWeight: '500', transition: 'background-color 0.2s, color 0.2s', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#e2e8f0'; e.currentTarget.style.color = '#0f172a'; }} onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569'; }}>
                    {item}
                    {menuSections[item] && <ChevronDown size={16} style={{ transform: openMenuSection === item ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}/>}
                  </div>
                  {(openMenuSection === item || closingMenuSection === item) && (
                    <div className={closingMenuSection === item ? "anim-dropdown-out" : "anim-dropdown-in"} style={{ padding: '8px 0', backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
                      {menuSections[item].map((fi, idx) => fi.type === 'divider' ? (
                        <div key={idx} style={{ height: '1px', background: '#e2e8f0', margin: '6px 0' }} />
                      ) : (
                          <div key={idx} onClick={() => { if(!fi.isDisabled) { if (item === 'File') handleFileMenu(fi.label); else if (item === 'Edit') handleEditMenu(fi.label); else if (item === 'View') handleViewMenu(fi.label); else if (item === 'Extras') handleExtrasMenu(fi.label); else if (item === 'Help') handleHelpMenu(fi.label); } }} style={{ padding: '10px 24px', fontSize: '13px', color: fi.isDisabled ? '#cbd5e1' : '#475569', cursor: fi.isDisabled ? 'default' : 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onMouseOver={(e) => { if(!fi.isDisabled){e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#0f172a';} }} onMouseOut={(e) => { if(!fi.isDisabled){e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569';} }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <div style={{ width: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                {fi.hasCheck && fi.isActive && <Check size={14} color="#0f172a" />}
                              </div>
                              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                {fi.label}
                                {fi.hasHelpIcon && <HelpCircle size={12} color="#94a3b8" />}
                              </span>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                               {fi.shortcut && <span style={{ color: '#94a3b8', fontSize: '12px' }}>{fi.shortcut}</span>}
                               {fi.hasArrow && <span style={{ color: fi.isDisabled ? '#cbd5e1' : '#94a3b8', fontSize: '10px' }}>▶</span>}
                            </div>
                          </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* GLASS MODAL LAYER */}
      {modalConfig && (
        <div 
          className={isModalClosing ? "anim-modal-backdrop-out" : "anim-modal-backdrop"} 
          onClick={closeModal}
          style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)' }}
        >
          <div 
            className={`anim-modal-card ${isModalClosing ? "anim-modal-out" : ""} ${(modalConfig.type === 'ai_image' || modalConfig.type === 'ai_prompt') ? 'rgb-border' : ''}`}
            onClick={(e) => e.stopPropagation()}
            style={{ 
              background: 'rgba(255, 255, 255, 0.95)', 
              backdropFilter: 'blur(16px)', 
              padding: '24px', 
              borderRadius: '16px', 
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)', 
              border: (modalConfig.type === 'ai_image' || modalConfig.type === 'ai_prompt') ? 'none' : '1px solid #e2e8f0', 
              maxWidth: modalConfig.type === 'page_setup' ? '320px' : ((modalConfig.type === 'ai_image' || modalConfig.type === 'ai_prompt') ? '600px' : '400px'), 
              width: '100%', 
              textAlign: 'center' 
            }}
          >
            <h2 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#0f172a' }}>{modalConfig.title}</h2>
            {modalConfig.message && <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#475569', lineHeight: '1.4' }}>{modalConfig.message}</p>}
            {modalConfig.type === 'shortcuts' ? (
              <div style={{ textAlign: 'left' }}>
                <div style={{ maxHeight: '320px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '20px' }}>
                  {modalConfig.shortcuts.map((s, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: i % 2 === 0 ? '#f8fafc' : '#ffffff', borderRadius: '6px', fontSize: '13px' }}>
                      <span style={{ color: '#475569' }}>{s.action}</span>
                      <code style={{ background: '#e2e8f0', padding: '2px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>{s.key}</code>
                    </div>
                  ))}
                </div>
                <button className="anim-hover-bounce" onClick={() => setModalConfig(null)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Close</button>
              </div>
            ) : modalConfig.type === 'cloud_list' ? (
              <div style={{ textAlign: 'left' }}>
                {modalConfig.diagrams?.length === 0 ? (
                  <p style={{ color: '#94a3b8', textAlign: 'center', marginBottom: '16px' }}>No saved diagrams yet. Save a diagram first.</p>
                ) : (
                  <div style={{ maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                    {modalConfig.diagrams.map((d) => (
                      <div key={d.id} onClick={() => loadCloudDiagram(d)} style={{ padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', transition: 'all 0.15s' }} onMouseOver={e => e.currentTarget.style.background = '#eff6ff'} onMouseOut={e => e.currentTarget.style.background = '#f8fafc'}>
                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#0f172a' }}>{d.name}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{d.nodes?.length || 0} nodes · {d.edges?.length || 0} connectors</div>
                      </div>
                    ))}
                  </div>
                )}
                <button className="anim-hover-bounce" onClick={() => setModalConfig(null)} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Close</button>
              </div>
            ) : modalConfig.type === 'edit_style' ? (
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {modalConfig.isEdge ? (
                   <>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ fontSize: '13px', color: '#475569', width: '90px' }}>Routing</label>
                        <select defaultValue={modalConfig.routing || 'sharp'} onChange={e => { takeSnapshot(); setEdges(eds => eds.map(edge => edge.id === modalConfig.edgeId ? { ...edge, data: { ...edge.data, routing: e.target.value } } : edge)); }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', flex: 1 }}>
                          <option value="sharp">Sharp</option>
                          <option value="rounded">Rounded</option>
                          <option value="curved">Curved</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ fontSize: '13px', color: '#475569', width: '90px' }}>Stroke Color</label>
                        <input type="color" defaultValue={modalConfig.strokeColor} onChange={e => { setEdges(eds => eds.map(edge => edge.id === modalConfig.edgeId ? { ...edge, data: { ...edge.data, stroke: e.target.value } } : edge)); }} style={{ width: '40px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ fontSize: '13px', color: '#475569', width: '90px' }}>Line Pattern</label>
                        <select defaultValue={modalConfig.strokeDash?.join(',') || ''} onChange={e => { const val = e.target.value; setEdges(eds => eds.map(edge => edge.id === modalConfig.edgeId ? { ...edge, data: { ...edge.data, strokeDash: val ? val.split(',').map(Number) : [] } } : edge)); }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', flex: 1 }}>
                          <option value="">Solid</option>
                          <option value="6,6">Dashed</option>
                          <option value="2,4">Dotted</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ fontSize: '13px', color: '#475569', width: '90px' }}>Start Arrow</label>
                        <select defaultValue={modalConfig.markerStart || 'none'} onChange={e => { setEdges(eds => eds.map(edge => edge.id === modalConfig.edgeId ? { ...edge, data: { ...edge.data, markerStart: e.target.value } } : edge)); }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', flex: 1 }}>
                          <option value="none">None</option>
                          <option value="open">Open Arrow</option>
                          <option value="arrow">Standard Arrow</option>
                          <option value="filled">Solid Arrow</option>
                          <option value="hollow">Hollow Arrow</option>
                          <option value="diamond">Diamond</option>
                          <option value="diamond_filled">Solid Diamond</option>
                          <option value="circle">Circle</option>
                          <option value="circle_filled">Solid Circle</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <label style={{ fontSize: '13px', color: '#475569', width: '90px' }}>End Arrow</label>
                        <select defaultValue={modalConfig.markerEnd || 'none'} onChange={e => { setEdges(eds => eds.map(edge => edge.id === modalConfig.edgeId ? { ...edge, data: { ...edge.data, markerEnd: e.target.value } } : edge)); }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', flex: 1 }}>
                          <option value="none">None</option>
                          <option value="open">Open Arrow</option>
                          <option value="arrow">Standard Arrow</option>
                          <option value="filled">Solid Arrow</option>
                          <option value="hollow">Hollow Arrow</option>
                          <option value="diamond">Diamond</option>
                          <option value="diamond_filled">Solid Diamond</option>
                          <option value="circle">Circle</option>
                          <option value="circle_filled">Solid Circle</option>
                        </select>
                      </div>
                   </>
                ) : (
                  <>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ fontSize: '13px', color: '#475569', width: '80px' }}>Fill Color</label>
                      <input type="color" defaultValue={modalConfig.fillColor} onChange={e => { takeSnapshot(); setNodes(nds => nds.map(n => n.id === modalConfig.nodeId ? { ...n, data: { ...n.data, fillColor: e.target.value } } : n)); }} style={{ width: '40px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ fontSize: '13px', color: '#475569', width: '80px' }}>Stroke</label>
                      <input type="color" defaultValue={modalConfig.strokeColor} onChange={e => { setNodes(nds => nds.map(n => n.id === modalConfig.nodeId ? { ...n, data: { ...n.data, strokeColor: e.target.value } } : n)); }} style={{ width: '40px', height: '32px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer' }} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <label style={{ fontSize: '13px', color: '#475569', width: '80px' }}>Font Size</label>
                      <select defaultValue={modalConfig.fontSize} onChange={e => { setNodes(nds => nds.map(n => n.id === modalConfig.nodeId ? { ...n, data: { ...n.data, fontSize: Number(e.target.value) } } : n)); }} style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }}>
                        {[10,11,12,13,14,16,18,20,24,32].map(s => <option key={s} value={s}>{s}px</option>)}
                      </select>
                    </div>
                  </>
                )}
                <button className="anim-hover-bounce" onClick={() => setModalConfig(null)} style={{ marginTop: '8px', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Done</button>
              </div>
            ) : modalConfig.type === 'edit_data' ? (
              <div style={{ textAlign: 'left' }}>
                <textarea
                  defaultValue={modalConfig.nodeData}
                  onChange={e => { try { const parsed = JSON.parse(e.target.value); setNodes(nds => nds.map(n => n.id === modalConfig.nodeId ? { ...n, data: parsed } : n)); } catch(err) {} }}
                  style={{ width: '100%', minHeight: '200px', fontFamily: 'monospace', fontSize: '12px', padding: '12px', border: '1px solid #e2e8f0', borderRadius: '8px', resize: 'vertical', boxSizing: 'border-box' }}
                />
                <button className="anim-hover-bounce" onClick={() => setModalConfig(null)} style={{ marginTop: '12px', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Save & Close</button>
              </div>
            ) : modalConfig.type === 'ai_prompt' ? (
              <div style={{ textAlign: 'left' }}>
                <textarea 
                  autoFocus
                  placeholder="e.g. A library system with Books, Authors and a 'writes' relationship..."
                  id="ai-prompt-input"
                  style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none', resize: 'none' }} 
                />
                <button 
                  className="anim-hover-bounce" 
                  onClick={() => handleGenerateDiagram(document.getElementById('ai-prompt-input').value)} 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)', color: '#ffffff', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <Sparkles size={18} /> Generate Diagram
                </button>
              </div>
            ) : modalConfig.type === 'ai_image' ? (
              <div style={{ textAlign: 'center', padding: '10px 0' }}>
                <div 
                  onClick={() => document.getElementById('ai-image-upload').click()}
                  style={{ width: '100%', height: '160px', border: '2px dashed #e2e8f0', borderRadius: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: '12px', transition: 'all 0.2s', marginBottom: '16px', background: selectedAiFile ? '#f0fdf4' : 'transparent', borderColor: selectedAiFile ? '#22c55e' : '#e2e8f0' }}
                  onMouseOver={e => { if(!selectedAiFile) { e.currentTarget.style.borderColor = "var(--theme-color)"; e.currentTarget.style.background = '#f8fafc'; } }}
                  onMouseOut={e => { if(!selectedAiFile) { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'transparent'; } }}
                >
                  {selectedAiFile ? <Check size={48} color="#22c55e" /> : <Image size={48} color="#94a3b8" />}
                  <span style={{ fontSize: '14px', color: selectedAiFile ? '#166534' : '#64748b', fontWeight: '500' }}>
                    {selectedAiFile ? `Selected: ${selectedAiFile.name}` : 'Click or drop to upload diagram image'}
                  </span>
                  <input 
                    type="file" 
                    id="ai-image-upload" 
                    hidden 
                    accept="image/*" 
                    onChange={(e) => setSelectedAiFile(e.target.files[0])} 
                  />
                </div>
                
                <div style={{ textAlign: 'left', marginBottom: '20px' }}>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '6px', display: 'block' }}>Add context or special instructions (Optional)</label>
                  <textarea 
                    id="ai-image-context-input"
                    placeholder="e.g. Focus on the relationships, ignore the handwriting..."
                    style={{ width: '100%', height: '80px', padding: '12px', borderRadius: '10px', border: '1px solid #e2e8f0', fontSize: '13px', boxSizing: 'border-box', outline: 'none', resize: 'none' }}
                  />
                </div>

                <button 
                  className="anim-hover-bounce" 
                  disabled={!selectedAiFile}
                  onClick={() => {
                    const description = document.getElementById('ai-image-context-input')?.value || "";
                    handleParseImage(selectedAiFile, description);
                    setSelectedAiFile(null);
                  }} 
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', border: 'none', background: selectedAiFile ? 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)' : '#cbd5e1', color: '#ffffff', fontWeight: '600', cursor: selectedAiFile ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginBottom: '12px' }}
                >
                  <Sparkles size={18} /> Generate Diagram
                </button>

                <div style={{ fontSize: '11px', color: '#94a3b8' }}>AI will reconstruct the diagram from your image and text description.</div>
              </div>
            ) : modalConfig.type === 'prompt' ? (
              <div style={{ textAlign: 'left' }}>
                <input 
                  autoFocus
                  type="text" 
                  defaultValue={modalConfig.defaultValue} 
                  id="modal-prompt-input"
                  onKeyDown={(e) => { if(e.key === 'Enter') { modalConfig.onConfirm(document.getElementById('modal-prompt-input').value); setModalConfig(null); } }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box', outline: 'none' }} 
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="anim-hover-bounce" onClick={() => setModalConfig(null)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button className="anim-hover-bounce" onClick={() => { modalConfig.onConfirm(document.getElementById('modal-prompt-input').value); setModalConfig(null); }} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: "var(--theme-color)", color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>{modalConfig.confirmLabel || 'OK'}</button>
                </div>
              </div>
            ) : modalConfig.type === 'export_options' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <button className="anim-hover-bounce" onClick={() => { exportDiagram('png'); setModalConfig(null); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}>PNG Image</button>
                <button className="anim-hover-bounce" onClick={() => { exportDiagram('pdf'); setModalConfig(null); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}>PDF Document</button>
                <button className="anim-hover-bounce" onClick={() => { exportDiagram('jpeg'); setModalConfig(null); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}>JPG Image</button>
                <button className="anim-hover-bounce" onClick={() => { exportDiagram('svg'); setModalConfig(null); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}>SVG Vector</button>
                <button className="anim-hover-bounce" onClick={() => { exportDiagram('json'); setModalConfig(null); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}>JSON Source</button>
                <button className="anim-hover-bounce" onClick={() => { exportDiagram('csv'); setModalConfig(null); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}>CSV Data</button>
                <button className="anim-hover-bounce" onClick={() => { exportDiagram('html'); setModalConfig(null); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}>Web HTML</button>
                <button className="anim-hover-bounce" onClick={() => { exportDiagram('md'); setModalConfig(null); }} style={{ padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontWeight: '600', cursor: 'pointer' }}>Markdown</button>
                <button className="anim-hover-bounce" onClick={() => setModalConfig(null)} style={{ gridColumn: 'span 2', padding: '10px', borderRadius: '8px', border: 'none', background: 'transparent', color: '#64748b', fontWeight: '600', cursor: 'pointer', marginTop: '8px' }}>Cancel</button>
              </div>
            ) : modalConfig.type === 'page_setup' ? (
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" checked={showGrid} onChange={e => setShowGrid(e.target.checked)} /> Grid
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="number" value={gridSize} onChange={e => setGridSize(Number(e.target.value))} style={{ width: '40px', padding: '2px 4px', fontSize: '12px' }} />
                    <span style={{ fontSize: '11px', color: '#64748b' }}>pt</span>
                    <input type="color" value={gridColor} onChange={e => setGridColor(e.target.value)} style={{ width: '20px', height: '20px', padding: 0, border: 'none', background: 'transparent' }} />
                  </div>
                </div>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={showPageView} onChange={e => setShowPageView(e.target.checked)} /> Page View
                </label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                  <span style={{ fontSize: '13px', color: '#475569' }}>Background</span>
                  <span style={{ fontSize: '12px', color: "var(--theme-color)", cursor: 'pointer' }}>Change...</span>
                </div>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={true} readOnly /> Background Color
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={showShadow} onChange={e => setShowShadow(e.target.checked)} /> Shadow
                </label>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Options</div>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={showConnectionArrows} onChange={e => setShowConnectionArrows(e.target.checked)} /> Connection Arrows
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={showConnectionPoints} onChange={e => setShowConnectionPoints(e.target.checked)} /> Connection Points
                </label>
                <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input type="checkbox" checked={showGuides} onChange={e => setShowGuides(e.target.checked)} /> Guides
                </label>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase' }}>Paper Size</div>
                <select value={pageSize} onChange={e => setPageSize(e.target.value)} style={{ padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '13px', width: '100%' }}>
                  <option value="A4">A4 (210 mm x 297 mm)</option>
                  <option value="Letter">US-Letter (8.5" x 11")</option>
                  <option value="A3">A3 (297 mm x 420 mm)</option>
                  <option value="Legal">Legal (8.5" x 14")</option>
                </select>
                <div style={{ display: 'flex', gap: '16px', marginTop: '4px' }}>
                  <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="radio" checked={orientation === 'portrait'} onChange={() => setOrientation('portrait')} /> Portrait
                  </label>
                  <label style={{ fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="radio" checked={orientation === 'landscape'} onChange={() => setOrientation('landscape')} /> Landscape
                  </label>
                </div>
                <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0' }} />
                <button onClick={() => { setModalConfig(null); setTimeout(() => setModalConfig({ type: 'edit_data', title: '📋 Page Data', message: '', nodeId: null, nodeData: JSON.stringify({ pageSize, orientation, gridSize, gridColor, showGrid, showPageView, showShadow }, null, 2) }), 100); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px', cursor: 'pointer' }}>Edit Data...</button>
                <button onClick={() => { setGridSize(25); setGridColor('#e0e0e0'); setShowGrid(true); setShowPageView(true); setShowShadow(false); setShowConnectionArrows(true); setShowConnectionPoints(false); setShowGuides(true); setPageSize('Letter'); setOrientation('portrait'); }} style={{ padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', fontSize: '12px', cursor: 'pointer' }}>Clear Default Style</button>
                <button className="anim-hover-bounce" onClick={() => setModalConfig(null)} style={{ marginTop: '8px', padding: '10px', borderRadius: '8px', border: 'none', background: "var(--theme-color)", color: 'white', fontWeight: '600', cursor: 'pointer' }}>Apply & Close</button>
              </div>
            ) : modalConfig.type === 'share_panel' ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
                  {['WhatsApp', 'Email', 'Drive', 'Slack', 'Teams', 'Messages'].map(soft => (
                    <div key={soft} onClick={() => { exportDiagram('png'); setModalConfig({ type: 'alert', title: 'Shared!', message: `Your diagram has been prepared for ${soft}.` }); }} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: "var(--theme-color)" }}>
                        <Image size={24} />
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: '600', color: '#475569' }}>{soft}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input readOnly value="https://smartdiagram.app/s/72a1b3..." style={{ flex: 1, background: 'transparent', border: 'none', fontSize: '12px', color: '#64748b', outline: 'none' }} />
                  <button onClick={() => { navigator.clipboard?.writeText("https://smartdiagram.app/s/72a1b3..."); setModalConfig({ type: 'alert', title: '🔗 Link Copied!', message: 'Shareable link copied to clipboard.' }); }} style={{ padding: '4px 12px', borderRadius: '4px', background: "var(--theme-color)", color: 'white', border: 'none', fontSize: '11px', fontWeight: '600', cursor: 'pointer' }}>Copy</button>
                </div>
                <button className="anim-hover-bounce" onClick={() => setModalConfig(null)} style={{ marginTop: '20px', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : modalConfig.type === 'menu_search' ? (
              <div style={{ textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0', marginBottom: '16px' }}>
                  <Search size={18} color="#94a3b8" />
                  <input 
                    autoFocus
                    placeholder="Search actions (Save, Export, Grid...)" 
                    onChange={e => {
                      const q = e.target.value.toLowerCase();
                      const results = [];
                      ['File', 'Edit', 'View', 'Extras', 'Help'].forEach(cat => {
                        menuSections[cat].forEach(item => {
                          if (item.label && item.label.toLowerCase().includes(q)) {
                            results.push({ ...item, category: cat });
                          }
                        });
                      });
                      setModalConfig(prev => ({ ...prev, results }));
                    }}
                    style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '14px', flex: 1 }} 
                  />
                </div>
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {(modalConfig.results || []).map((res, i) => (
                    <div 
                      key={i} 
                      onClick={() => { 
                        if (res.category === 'File') handleFileMenu(res.label);
                        else if (res.category === 'Edit') handleEditMenu(res.label);
                        else if (res.category === 'View') handleViewMenu(res.label);
                        else if (res.category === 'Extras') handleExtrasMenu(res.label);
                        else if (res.category === 'Help') handleHelpMenu(res.label);
                        setModalConfig(null);
                      }}
                      style={{ padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                      onMouseOver={e => e.currentTarget.style.background = '#eff6ff'}
                      onMouseOut={e => e.currentTarget.style.background = 'transparent'}
                    >
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{res.label}</div>
                        <div style={{ fontSize: '11px', color: '#94a3b8' }}>{res.category} Menu</div>
                      </div>
                      {res.shortcut && <code style={{ fontSize: '10px', color: '#94a3b8' }}>{res.shortcut}</code>}
                    </div>
                  ))}
                  {(!modalConfig.results || modalConfig.results.length === 0) && (
                    <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px', fontSize: '13px' }}>Type to search for menu items...</p>
                  )}
                </div>
                <button className="anim-hover-bounce" onClick={() => setModalConfig(null)} style={{ marginTop: '16px', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Close Explorer</button>
              </div>
            ) : modalConfig.type === 'adaptive_colors' ? (
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Choose a primary color for the interface.</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
                  {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#6366f1', '#f97316', '#64748b'].map(color => (
                    <div 
                      key={color} 
                      onClick={() => { setThemeColor(color); setModalConfig(null); }}
                      style={{ height: '40px', borderRadius: '8px', background: color, cursor: 'pointer', border: themeColor === color ? '3px solid #0f172a' : 'none', transform: themeColor === color ? 'scale(1.1)' : 'scale(1)' }}
                      className="anim-hover-bounce"
                    />
                  ))}
                </div>
                <button className="anim-hover-bounce" onClick={closeModal} style={{ marginTop: '8px', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : modalConfig.type === 'appearance_customizer' ? (
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Override default background colors for specific panels.</p>
                
                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Canvas Grid Background</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" value={customAppearance.grid || '#f1f5f9'} onChange={e => setCustomAppearance(prev => ({ ...prev, grid: e.target.value }))} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                    <button className="anim-hover-bounce" onClick={() => setCustomAppearance(prev => ({ ...prev, grid: '' }))} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer' }}>Reset Default</button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Canvas Grid Lines/Dots Color</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" value={gridColor} onChange={e => setGridColor(e.target.value)} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                    <button className="anim-hover-bounce" onClick={() => setGridColor('#e0e0e0')} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer' }}>Reset Default</button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Shapes Panel Background (Left)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" value={customAppearance.shapes || '#f8fafc'} onChange={e => setCustomAppearance(prev => ({ ...prev, shapes: e.target.value }))} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                    <button className="anim-hover-bounce" onClick={() => setCustomAppearance(prev => ({ ...prev, shapes: '' }))} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer' }}>Reset Default</button>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '4px' }}>Format Toolbar Background (Top)</label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="color" value={customAppearance.format || '#ffffff'} onChange={e => setCustomAppearance(prev => ({ ...prev, format: e.target.value }))} style={{ width: '40px', height: '40px', padding: '0', border: 'none', borderRadius: '4px', cursor: 'pointer' }} />
                    <button className="anim-hover-bounce" onClick={() => setCustomAppearance(prev => ({ ...prev, format: '' }))} style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#64748b', cursor: 'pointer' }}>Reset Default</button>
                  </div>
                </div>
                
                <button className="anim-hover-bounce" onClick={closeModal} style={{ marginTop: '8px', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Close Customizer</button>
              </div>
            ) : modalConfig.type === 'theme_selector' ? (
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>Select your preferred background theme.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {[
                    { mode: 'light', name: 'Light', bg: '#f1f5f9', border: '#cbd5e1', text: '#0f172a' },
                    { mode: 'dark', name: 'Dark', bg: '#000000', border: '#334155', text: '#f8fafc' },
                    { mode: 'red', name: 'Crimson', bg: '#450a0a', border: '#7f1d1d', text: '#fecaca' },
                    { mode: 'orange', name: 'Sunset', bg: '#431407', border: '#7c2d12', text: '#fed7aa' },
                    { mode: 'blue', name: 'Ocean', bg: '#082f49', border: '#0369a1', text: '#bae6fd' },
                    { mode: 'green', name: 'Forest', bg: '#052e16', border: '#14532d', text: '#bbf7d0' }
                  ].map(t => (
                    <div 
                      key={t.mode}
                      onClick={() => { setThemeMode(t.mode); closeModal(); }}
                      className="anim-hover-bounce"
                      style={{ display: 'flex', alignItems: 'center', padding: '12px', borderRadius: '8px', border: themeMode === t.mode ? '2px solid var(--theme-color)' : '1px solid #e2e8f0', background: t.mode === 'light' ? '#ffffff' : t.bg, cursor: 'pointer', gap: '12px' }}
                    >
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: t.bg, border: `1px solid ${t.border}` }} />
                      <div style={{ fontWeight: '600', color: t.text }}>{t.name}</div>
                    </div>
                  ))}
                </div>
                <button className="anim-hover-bounce" onClick={closeModal} style={{ marginTop: '8px', width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
              </div>
            ) : modalConfig.type === 'feedback' ? (
              <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <textarea id="feedback-message-input" rows="4" placeholder="Describe your issue or suggestion..." style={{ padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', fontFamily: 'inherit', resize: 'vertical', fontSize: '13px' }} />
                <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <button className="anim-hover-bounce" onClick={closeModal} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                  <button className="anim-hover-bounce" onClick={async () => {
                    const msg = document.getElementById('feedback-message-input')?.value || '';
                    if (!msg.trim()) return;
                    
                    try {
                      setModalConfig({ type: 'alert', title: 'Sending...', message: 'Sending your feedback...' });
                      const response = await fetch(`${API_BASE}/api/feedback`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ message: msg })
                      });
                      
                      if (response.ok) {
                        setModalConfig({ type: 'alert', title: 'Feedback Sent', message: 'Thank you! Your feedback has been successfully sent to the developer.' });
                      } else {
                        const data = await response.json();
                        setModalConfig({ type: 'alert', title: 'Error', message: data.error || 'Failed to send feedback. Please check server logs.' });
                      }
                    } catch (err) {
                      setModalConfig({ type: 'alert', title: 'Error', message: 'Failed to connect to the backend server to send feedback.' });
                    }
                  }} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', background: '#3b82f6', color: '#ffffff', fontWeight: '600', cursor: 'pointer' }}>Send Feedback</button>
                </div>
              </div>
            ) : modalConfig.type === 'system_info' ? (
              <div style={{ textAlign: 'left', lineHeight: '1.5', fontSize: '13px', color: '#334155', maxHeight: '450px', overflowY: 'auto', paddingRight: '10px' }}>
                <div style={{ marginBottom: '16px', padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a', color: '#92400e' }}>
                  <p style={{ margin: 0, fontWeight: '700', fontSize: '14px' }}>⚠️ Beta Version</p>
                  <p style={{ margin: '4px 0 0 0' }}>This is a beta version. Some features may not work perfectly yet, but we are working to implement improvements faster. Please support us by sharing your valuable feedback!</p>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <h3 style={{ fontSize: '16px', color: '#0f172a', marginBottom: '8px' }}>Smart Diagram Workspace <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 'normal', marginLeft: '6px' }}>v1.0 Beta</span></h3>
                  <p>This system is a modern diagramming interface that supports standard drawing features as well as advanced AI-driven ER Diagram and Flowchart generation.</p>
                </div>

                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ fontSize: '14px', color: '#0f172a', margin: '0 0 8px 0' }}>Core Architecture</h4>
                  <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li><strong>AI Engine:</strong> Enabled (LLaMA 3, Groq, Whisper)</li>
                    <li><strong>Version:</strong> 1.0 Beta</li>
                    <li><strong>Layout Engine:</strong> Dagre auto-layout with Radial Attributes</li>
                    <li><strong>Canvas:</strong> React Flow (v11) with Draw.io connectors</li>
                    <li><strong>State:</strong> React useState/useRef architecture</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: '#0f172a', marginBottom: '6px' }}>Privacy & Policies</h4>
                  <p>Your diagrams are stored locally in your browser by default. Cloud synchronization is only active when signed in via Google Auth. We do not sell your diagram data. AI processing is handled via secure API tunnels to Groq/LLaMA services.</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: '#0f172a', marginBottom: '6px' }}>Terms of Use</h4>
                  <p>Smart Diagram is provided "as is". Users are responsible for backing up their diagrams via JSON export. AI-generated content should be verified for logical accuracy by the user.</p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <h4 style={{ fontSize: '14px', color: '#0f172a', marginBottom: '6px' }}>Future Updates</h4>
                  <ul style={{ paddingLeft: '20px', margin: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <li>Collaborative real-time editing (Multiplayer)</li>
                    <li>Extended shape libraries (BPMN, AWS, GCP)</li>
                    <li>Advanced AI-assisted auto-routing optimization</li>
                    <li>Plugin system for custom shape generators</li>
                  </ul>
                </div>

                <div style={{ marginBottom: '12px', padding: '12px', background: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                  <h4 style={{ fontSize: '14px', color: '#1e40af', marginBottom: '6px' }}>Contact & Support</h4>
                  <p>For enterprise inquiries or support: <strong>myprojectz.a1@gmail.com</strong></p>
                  <p style={{ marginTop: '4px' }}>Report bugs via the <strong>Feedback</strong> tool in the sidebar.</p>
                </div>

                <div style={{ marginTop: '24px', textAlign: 'center', position: 'sticky', bottom: 0, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)', padding: '10px 0' }}>
                  <button className="anim-hover-bounce" onClick={closeModal} style={{ padding: '10px 32px', borderRadius: '8px', border: 'none', background: "var(--theme-color)", color: 'white', fontWeight: '600', cursor: 'pointer' }}>Close Details</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                <button 
                  className="anim-hover-bounce"
                  onClick={closeModal} 
                  style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #cbd5e1', background: 'transparent', color: '#475569', fontWeight: '600', cursor: 'pointer' }}
                >
                  {modalConfig.type === 'confirm' ? 'Cancel' : 'Dismiss'}
                </button>
                {modalConfig.type === 'confirm' && (
                  <button 
                    className="anim-hover-bounce"
                    onClick={() => { modalConfig.onConfirm(); closeModal(); }} 
                    style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#e11d48', color: 'white', fontWeight: '600', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(225, 29, 72, 0.2)' }}
                  >
                    Delete
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* GLOBAL AI LOADING OVERLAY */}
      {isAiProcessing && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          backgroundColor: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(20px)',
          zIndex: 10000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          pointerEvents: 'all'
        }}>
          <div className="rgb-border anim-modal-card" style={{ 
            padding: '60px 40px', 
            background: 'rgba(255, 255, 255, 0.95)', 
            borderRadius: '24px', 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '32px', 
            width: '480px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ position: 'relative', width: '80px', height: '80px' }}>
              <div style={{ position: 'absolute', inset: 0, border: '4px solid #f1f5f9', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', inset: 0, border: '4px solid #3b82f6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1.5s linear infinite' }} />
              <div style={{ position: 'absolute', inset: '10px', border: '4px solid #60a5fa', borderBottomColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear reverse infinite' }} />
              <Sparkles size={32} style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: "var(--theme-color)", animation: 'pulseSubtle 2s infinite' }} />
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.02em' }}>AI is structuring your diagram...</div>
              <div key={aiStatusMessage} style={{ fontSize: '15px', color: '#64748b', fontWeight: '500', animation: 'modalFadeIn 0.5s ease-out' }}>
                {aiStatusMessage}
              </div>
            </div>

            <div style={{ width: '100%', maxWidth: '300px', height: '6px', background: '#f1f5f9', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: '100%', background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)', animation: 'loading-bar-smooth 2s infinite linear' }} />
            </div>
            
            <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>This usually takes a few seconds...</div>
          </div>
        </div>
      )}
      
      <input type="file" ref={fileInputRef} hidden accept=".json" onChange={handleFileUpload} />
    </div>
  );
}

export default App;
