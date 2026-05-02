import React from 'react';

// ==================== SIDEBAR CATEGORIES DEFINITION ====================
export const SIDEBAR_CATEGORIES = [
  {
    title: "General",
    items: [
      { id: "gen_rect", label: "Rectangle", shapeType: "rectangle", width: 120, height: 60 },
      { id: "gen_rect_rounded", label: "Rounded Rect", shapeType: "rectangle_rounded", width: 120, height: 60 },
      { id: "gen_ellipse", label: "Ellipse", shapeType: "ellipse", width: 120, height: 60 },
      { id: "gen_diamond", label: "Diamond", shapeType: "diamond", width: 60, height: 60 },
      { id: "gen_circle", label: "Circle", shapeType: "circle", width: 60, height: 60 },
      { id: "gen_text", label: "Text", shapeType: "text", width: 100, height: 40 },
    ]
  },
  {
    title: "Lines & Connectors",
    items: [
      { id: "conn_association", label: "Association", isEdge: true, routing: "orthogonal", startArrow: "none", endArrow: "open", strokeStyle: "solid" },
      { id: "conn_directedAssoc", label: "Directed Assoc", isEdge: true, routing: "orthogonal", startArrow: "none", endArrow: "filled", strokeStyle: "solid" },
      { id: "conn_dependency", label: "Dependency", isEdge: true, routing: "orthogonal", strokeStyle: "dashed", startArrow: "none", endArrow: "open" },
      { id: "conn_realization", label: "Realization", isEdge: true, routing: "orthogonal", strokeStyle: "dashed", startArrow: "none", endArrow: "hollow" },
      { id: "conn_inheritance", label: "Inheritance", isEdge: true, routing: "orthogonal", startArrow: "none", endArrow: "hollow", strokeStyle: "solid" },
      { id: "conn_aggregation", label: "Aggregation", isEdge: true, routing: "orthogonal", startArrow: "diamond_hollow", endArrow: "none", strokeStyle: "solid" },
      { id: "conn_composition", label: "Composition", isEdge: true, routing: "orthogonal", startArrow: "diamond_filled", endArrow: "none", strokeStyle: "solid" },
      { id: "conn_bidirectional", label: "Bidirectional", isEdge: true, routing: "orthogonal", startArrow: "open", endArrow: "open", strokeStyle: "solid" },
      { id: "conn_noArrow", label: "No Arrow", isEdge: true, routing: "orthogonal", startArrow: "none", endArrow: "none", strokeStyle: "solid" },
      { id: "conn_dashedPlain", label: "Dashed Plain", isEdge: true, routing: "orthogonal", startArrow: "none", endArrow: "none", strokeStyle: "dashed" },
      { id: "conn_dotted", label: "Dotted", isEdge: true, routing: "orthogonal", startArrow: "none", endArrow: "none", strokeStyle: "dotted" },
      { id: "conn_crowsFoot", label: "Crows Foot", isEdge: true, routing: "orthogonal", startArrow: "none", endArrow: "ERone", strokeStyle: "solid" },
    ]
  },
  {
    title: "Class Diagram",
    items: [
      { id: "class_class", label: "Class", shapeType: "rectangle_3section", width: 160, height: 100 },
      { id: "class_interface", label: "Interface", shapeType: "rectangle_2section_stereotype", width: 160, height: 80, label: "«interface»\nName" },
      { id: "class_abstract", label: "Abstract Class", shapeType: "rectangle_3section_italic", width: 160, height: 100 },
      { id: "class_note", label: "Note", shapeType: "note", width: 120, height: 60 },
      { id: "class_package", label: "Package", shapeType: "package", width: 160, height: 100 },
    ]
  },
  {
      title: "Use Case Diagram",
      items: [
          { id: "uc_actor", label: "Actor", shapeType: "stick_figure", width: 40, height: 70 },
          { id: "uc_usecase", label: "Use Case", shapeType: "ellipse", width: 140, height: 60 },
          { id: "uc_boundary", label: "System Boundary", shapeType: "rectangle_label_top", width: 300, height: 200 },
      ]
  },
  {
      title: "Activity Diagram",
      items: [
          { id: "act_initial", label: "Initial Node", shapeType: "circle_filled", width: 24, height: 24 },
          { id: "act_final", label: "Final Node", shapeType: "circle_bullseye", width: 24, height: 24 },
          { id: "act_action", label: "Action", shapeType: "rectangle_rounded", width: 140, height: 50 },
          { id: "act_decision", label: "Decision", shapeType: "diamond", width: 50, height: 50 },
          { id: "act_fork", label: "Fork/Join", shapeType: "bar_horizontal", width: 120, height: 8 },
      ]
  },
  {
      title: "Sequence Diagram",
      items: [
          { id: "seq_lifeline", label: "Lifeline", shapeType: "lifeline", width: 100, height: 300 },
          { id: "seq_activation", label: "Activation", shapeType: "activation", width: 16, height: 80 },
          { id: "seq_fragment", label: "Fragment", shapeType: "fragment", width: 200, height: 120 },
      ]
  },
  {
      title: "State Machine",
      items: [
          { id: "sm_state", label: "State", shapeType: "rectangle_rounded", width: 140, height: 60 },
          { id: "sm_history", label: "History", shapeType: "circle_H", width: 30, height: 30 },
      ]
  },
  {
      title: "ER Diagram",
      items: [
          { id: "er_entity", label: "Entity", shapeType: "rectangle", width: 140, height: 60 },
          { id: "er_weak_entity", label: "Weak Entity", shapeType: "rectangle_double", width: 140, height: 60 },
          { id: "er_relationship", label: "Relationship", shapeType: "diamond", width: 100, height: 60 },
          { id: "er_attribute", label: "Attribute", shapeType: "ellipse", width: 100, height: 50 },
          { id: "er_key", label: "Key Attribute", shapeType: "ellipse_underline", width: 100, height: 50 },
      ]
  },
  {
      title: "Component & Deployment",
      items: [
          { id: "comp_component", label: "Component", shapeType: "component", width: 160, height: 80 },
          { id: "dep_node", label: "Node (Cube)", shapeType: "cube_3d", width: 120, height: 100 },
          { id: "dep_database", label: "Database", shapeType: "cylinder", width: 80, height: 90 },
          { id: "dep_cloud", label: "Cloud", shapeType: "cloud", width: 120, height: 80 },
      ]
  },
  {
      title: "DFD",
      items: [
          { id: "dfd_process", label: "Process", shapeType: "circle", width: 80, height: 80 },
          { id: "dfd_datastore", label: "Data Store", shapeType: "data_store", width: 140, height: 50 },
          { id: "dfd_external", label: "External Ent", shapeType: "rectangle", width: 120, height: 60 },
      ]
  }
];

// ==================== CUSTOM SVG RENDERER ====================
export const getCustomShapeSvg = (shape, stroke, strokeW, fill, width = 100, height = 100) => {
  const s = stroke || '#000000';
  const f = fill || '#ffffff';
  const sw = strokeW || 2;

  switch (shape) {
    case 'note':
      return (
        <path d={`M 0 0 L ${width - 15} 0 L ${width} 15 L ${width} ${height} L 0 ${height} Z M ${width - 15} 0 L ${width - 15} 15 L ${width} 15`}
              fill={f} stroke={s} strokeWidth={sw} />
      );

    case 'package':
      return (
        <g>
          <path d={`M 0 0 L 60 0 L 70 15 L 0 15 Z`} fill={f} stroke={s} strokeWidth={sw} />
          <rect x="0" y="15" width={width} height={height - 15} fill={f} stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'component':
      return (
        <g>
          <rect x="10" y="0" width={width - 10} height={height} fill={f} stroke={s} strokeWidth={sw} />
          <rect x="0" y="15" width="20" height="15" fill={f} stroke={s} strokeWidth={sw} />
          <rect x="0" y="45" width="20" height="15" fill={f} stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'stick_figure':
      return (
        <g>
          <circle cx={width / 2} cy={height / 4} r={height / 8} fill={f} stroke={s} strokeWidth={sw} />
          <line x1={width / 2} y1={height * 0.375} x2={width / 2} y2={height * 0.7} stroke={s} strokeWidth={sw} />
          <line x1={width * 0.2} y1={height * 0.5} x2={width * 0.8} y2={height * 0.5} stroke={s} strokeWidth={sw} />
          <line x1={width / 2} y1={height * 0.7} x2={width * 0.2} y2={height * 0.95} stroke={s} strokeWidth={sw} />
          <line x1={width / 2} y1={height * 0.7} x2={width * 0.8} y2={height * 0.95} stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'cylinder':
      return (
        <g>
          <path d={`M 0 15 L 0 ${height - 15} A ${width / 2} 15 0 0 0 ${width} ${height - 15} L ${width} 15`} fill={f} stroke={s} strokeWidth={sw} />
          <ellipse cx={width / 2} cy={15} rx={width / 2} ry={15} fill={f} stroke={s} strokeWidth={sw} />
          <ellipse cx={width / 2} cy={height - 15} rx={width / 2} ry={15} fill="none" stroke={s} strokeWidth={sw} strokeDasharray="4 2" />
        </g>
      );

    case 'cube_3d':
      const d = 15;
      return (
        <g>
          <path d={`M 0 ${d} L ${width - d} ${d} L ${width} 0 L ${d} 0 Z`} fill={f} stroke={s} strokeWidth={sw} />
          <path d={`M ${width - d} ${d} L ${width} 0 L ${width} ${height - d} L ${width - d} ${height} Z`} fill={f} stroke={s} strokeWidth={sw} />
          <rect x="0" y={d} width={width - d} height={height - d} fill={f} stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'cloud':
      return (
        <path d={`M 25 60 A 20 20 0 0 1 20 20 A 25 25 0 0 1 70 20 A 30 30 0 0 1 95 50 A 20 20 0 0 1 80 85 L 30 85 A 25 25 0 0 1 25 60 Z`}
              transform={`scale(${width / 100}, ${height / 100})`} fill={f} stroke={s} strokeWidth={sw} />
      );

    case 'rectangle_3section':
      return (
        <g>
          <rect x="0" y="0" width={width} height={height} fill={f} stroke={s} strokeWidth={sw} />
          <line x1="0" y1={height * 0.3} x2={width} y2={height * 0.3} stroke={s} strokeWidth={sw} />
          <line x1="0" y1={height * 0.65} x2={width} y2={height * 0.65} stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'rectangle_2section_stereotype':
      return (
        <g>
          <rect x="0" y="0" width={width} height={height} fill={f} stroke={s} strokeWidth={sw} />
          <line x1="0" y1="30" x2={width} y2="30" stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'lifeline':
      return (
        <g>
          <rect x="0" y="0" width={width} height="40" fill={f} stroke={s} strokeWidth={sw} />
          <line x1={width / 2} y1="40" x2={width / 2} y2={height} stroke={s} strokeWidth={sw} strokeDasharray="5 5" />
        </g>
      );

    case 'activation':
      return <rect x="0" y="0" width={width} height={height} fill={f} stroke={s} strokeWidth={sw} />;

    case 'fragment':
      return (
        <g>
          <rect x="0" y="0" width={width} height={height} fill="none" stroke={s} strokeWidth={sw} strokeDasharray="8 4" />
          <path d="M 0 0 L 60 0 L 70 12 L 70 25 L 0 25 Z" fill={f} stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'bar_horizontal':
      return <rect x="0" y="0" width={width} height={height} fill={s} stroke="none" />;

    case 'circle_bullseye':
      return (
        <g>
          <circle cx={width / 2} cy={height / 2} r={width / 2} fill={f} stroke={s} strokeWidth={sw} />
          <circle cx={width / 2} cy={height / 2} r={width / 3} fill={s} />
        </g>
      );

    case 'circle_filled':
      return <circle cx={width / 2} cy={height / 2} r={width / 2} fill={s} />;

    case 'data_store':
      return (
        <g>
          <line x1="0" y1="0" x2={width} y2="0" stroke={s} strokeWidth={sw} />
          <line x1="0" y1={height} x2={width} y2={height} stroke={s} strokeWidth={sw} />
          <line x1="0" y1="0" x2="0" y2={height} stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'rectangle_double':
      return (
        <g>
          <rect x="0" y="0" width={width} height={height} fill={f} stroke={s} strokeWidth={sw} />
          <rect x="4" y="4" width={width - 8} height={height - 8} fill="none" stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'pentagon_right':
      return <path d={`M 0 0 L ${width - 15} 0 L ${width} ${height / 2} L ${width - 15} ${height} L 0 ${height} Z`} fill={f} stroke={s} strokeWidth={sw} />;

    case 'pentagon_left':
      return <path d={`M 15 0 L ${width} 0 L ${width} ${height} L 15 ${height} L 0 ${height / 2} Z`} fill={f} stroke={s} strokeWidth={sw} />;

    case 'hourglass':
      return <path d={`M 0 0 L ${width} 0 L 0 ${height} L ${width} ${height} Z`} fill={f} stroke={s} strokeWidth={sw} />;

    case 'socket':
      return (
        <g>
          <line x1="0" y1={height / 2} x2={width / 2} y2={height / 2} stroke={s} strokeWidth={sw} />
          <path d={`M ${width} 0 A ${width / 2} ${height / 2} 0 0 0 ${width} ${height}`} fill="none" stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'lollipop':
      return (
        <g>
          <line x1="0" y1={height / 2} x2={width - 20} y2={height / 2} stroke={s} strokeWidth={sw} />
          <circle cx={width - 10} cy={height / 2} r="10" fill={f} stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'rectangle_3section_italic':
      return (
        <g>
          <rect x="0" y="0" width={width} height={height} fill={f} stroke={s} strokeWidth={sw} />
          <line x1="0" y1={height * 0.3} x2={width} y2={height * 0.3} stroke={s} strokeWidth={sw} />
          <line x1="0" y1={height * 0.65} x2={width} y2={height * 0.65} stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'rectangle_label_top':
      return (
        <g>
          <rect x="0" y="20" width={width} height={height - 20} fill="none" stroke={s} strokeWidth={sw} strokeDasharray="8 4" />
          <text x={width / 2} y="14" textAnchor="middle" fill={s} fontSize="12" fontFamily="sans-serif">System</text>
        </g>
      );

    case 'circle_H':
      return (
        <g>
          <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 2 - 2} fill={f} stroke={s} strokeWidth={sw} />
          <text x={width / 2} y={height / 2 + 5} textAnchor="middle" fill={s} fontSize="14" fontFamily="sans-serif" fontWeight="bold">H</text>
        </g>
      );

    case 'circle_H_star':
      return (
        <g>
          <circle cx={width / 2} cy={height / 2} r={Math.min(width, height) / 2 - 2} fill={f} stroke={s} strokeWidth={sw} />
          <text x={width / 2} y={height / 2 + 5} textAnchor="middle" fill={s} fontSize="12" fontFamily="sans-serif" fontWeight="bold">H*</text>
        </g>
      );

    case 'ellipse_double':
      return (
        <g>
          <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - 1} ry={height / 2 - 1} fill={f} stroke={s} strokeWidth={sw} />
          <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - 5} ry={height / 2 - 5} fill="none" stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'ellipse_dashed':
      return (
        <ellipse cx={width / 2} cy={height / 2} rx={width / 2 - 2} ry={height / 2 - 2} fill={f} stroke={s} strokeWidth={sw} strokeDasharray="6 3" />
      );

    case 'diamond_double':
      return (
        <g>
          <path d={`M ${width/2} 0 L ${width} ${height/2} L ${width/2} ${height} L 0 ${height/2} Z`} fill={f} stroke={s} strokeWidth={sw} />
          <path d={`M ${width/2} 6 L ${width-8} ${height/2} L ${width/2} ${height-6} L 8 ${height/2} Z`} fill="none" stroke={s} strokeWidth={sw} />
        </g>
      );

    case 'x_shape':
      return (
        <path d={`M 0 0 L ${width} ${height} M ${width} 0 L 0 ${height}`} fill="none" stroke={s} strokeWidth={sw} />
      );

    case 'rectangle_rounded_divided':
      return (
        <g>
          <rect x="0" y="0" width={width} height={height} rx="10" fill={f} stroke={s} strokeWidth={sw} />
          <line x1="0" y1={height * 0.35} x2={width} y2={height * 0.35} stroke={s} strokeWidth={sw} />
        </g>
      );

    default:
      return null;
  }
};

// ==================== CONNECTOR PREVIEW RENDERER ====================
export const getConnectorPreviewSvg = (item, color = '#000000') => {
  const { strokeStyle, startArrow, endArrow } = item;
  const dash = strokeStyle === 'dashed' ? '5,5' : (strokeStyle === 'dotted' ? '2,3' : 'none');
  
  return (
    <svg viewBox="0 0 60 40" width="100%" height="100%" style={{ overflow: 'visible' }}>
      <defs>
        <marker id={`arrow-open-${item.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8" fill="none" stroke={color} strokeWidth="1.5" />
        </marker>
        <marker id={`arrow-filled-${item.id}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M 0 0 L 8 4 L 0 8 Z" fill={color} />
        </marker>
        <marker id={`arrow-hollow-${item.id}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M 0 0 L 10 5 L 0 10 Z" fill="white" stroke={color} strokeWidth="1.5" />
        </marker>
        <marker id={`diamond-hollow-${item.id}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M 0 5 L 5 0 L 10 5 L 5 10 Z" fill="white" stroke={color} strokeWidth="1.5" />
        </marker>
        <marker id={`diamond-filled-${item.id}`} markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
          <path d="M 0 5 L 5 0 L 10 5 L 5 10 Z" fill={color} />
        </marker>
        <marker id={`er-one-${item.id}`} markerWidth="10" markerHeight="10" refX="5" refY="5" orient="auto">
          <path d="M 5 0 L 5 10" fill="none" stroke={color} strokeWidth="2" />
        </marker>
      </defs>
      
      <line 
        x1="5" y1="35" x2="55" y2="5" 
        stroke={color} 
        strokeWidth="2" 
        strokeDasharray={dash} 
        markerStart={startArrow !== 'none' && startArrow !== undefined ? `url(#${getMarkerId(startArrow, item.id)})` : undefined}
        markerEnd={endArrow !== 'none' && endArrow !== undefined ? `url(#${getMarkerId(endArrow, item.id)})` : undefined}
      />
    </svg>
  );
};

const getMarkerId = (type, id) => {
  if (type === 'open') return `arrow-open-${id}`;
  if (type === 'filled') return `arrow-filled-${id}`;
  if (type === 'hollow') return `arrow-hollow-${id}`;
  if (type === 'diamond_hollow') return `diamond-hollow-${id}`;
  if (type === 'diamond_filled') return `diamond-filled-${id}`;
  if (type === 'ERone') return `er-one-${id}`;
  return '';
};
;
