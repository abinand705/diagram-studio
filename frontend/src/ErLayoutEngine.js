import dagre from "dagre";

/**
 * Universal Layout Engine v5.0
 * Supports specialized layouts for ER, Flowchart, Sequence, and general Graph types.
 */

// ─── ER (Chen) Specialized Layout ───────────────────────────────────────────

export const generateChenDiagramV3 = (schema) => {
  const nodes = [];
  const edges = [];
  const prefix = `chen_`; 

  const START_X = 250; 
  const SPACING_X = 400;
  const ATTR_RADIUS = 180;
  const CENTER_Y = 400;

  schema.entities.forEach((ent, eIdx) => {
    const eId = `${prefix}ent_${eIdx}`;
    const eX = START_X + eIdx * SPACING_X * 1.5;
    const eY = CENTER_Y;

    nodes.push({
      id: eId,
      type: "flowchart",
      position: { x: eX, y: eY },
      data: { label: ent.name, shapeType: "entity", width: 140, height: 70 },
      style: { width: 140, height: 70 }
    });

    (ent.attributes || []).forEach((attrName, aIdx) => {
      const aId = `${prefix}ent_${eIdx}_attr_${aIdx}`;
      const angle = (2 * Math.PI * aIdx) / Math.max((ent.attributes.length), 1);
      
      const aX = eX + ATTR_RADIUS * Math.cos(angle);
      const aY = eY + ATTR_RADIUS * Math.sin(angle);

      nodes.push({
        id: aId,
        type: "flowchart",
        position: { x: aX, y: aY },
        data: { label: attrName, shapeType: "attribute", width: 110, height: 50 },
        style: { width: 110, height: 50 }
      });

      edges.push({
        id: `${prefix}edge_attr_${eIdx}_${aIdx}`,
        source: eId,
        target: aId,
        type: "drawio",
        style: { stroke: "#555555", strokeWidth: 1.5 },
        data: { markerEnd: "none" }
      });
    });
  });

  schema.relationships.forEach((rel, rIdx) => {
    const rId = `${prefix}rel_${rIdx}`;
    const sIdx = schema.entities.findIndex(e => e.name === rel.source);
    const tIdx = schema.entities.findIndex(e => e.name === rel.target);
    
    if (sIdx !== -1 && tIdx !== -1) {
      const sX = START_X + sIdx * SPACING_X * 1.5;
      const tX = START_X + tIdx * SPACING_X * 1.5;
      const rX = (sX + tX) / 2;

      nodes.push({
        id: rId,
        type: "flowchart",
        position: { x: rX, y: CENTER_Y },
        data: { label: rel.label, shapeType: "relationship", width: 120, height: 90 },
        style: { width: 120, height: 90 }
      });

      edges.push({
        id: `${prefix}edge_rel_s_${rIdx}`,
        source: `${prefix}ent_${sIdx}`,
        target: rId,
        type: "drawio",
        style: { stroke: "#555555", strokeWidth: 1.5 },
        data: { markerEnd: "none", label: rel.sourceCardinality || "" }
      });
      edges.push({
        id: `${prefix}edge_rel_t_${rIdx}`,
        source: rId,
        target: `${prefix}ent_${tIdx}`,
        type: "drawio",
        style: { stroke: "#555555", strokeWidth: 1.5 },
        data: { markerEnd: "none", label: rel.targetCardinality || "" }
      });
    }
  });

  return { nodes, edges };
};

// ─── General Graph (Dagre) Layout ────────────────────────────────────────────

const layoutDagre = (nodes, edges, direction = 'TB') => {
  const g = new dagre.graphlib.Graph();
  g.setGraph({ rankdir: direction, nodesep: 100, ranksep: 120 });
  g.setDefaultEdgeLabel(() => ({}));

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 150, height: 80 });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = g.node(node.id);
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - 75,
        y: nodeWithPosition.y - 40,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
};

// ─── Main Interface ──────────────────────────────────────────────────────────

export const applyAdvancedErLayout = (rawNodes, rawEdges, diagramType = "") => {
  if (!rawNodes || rawNodes.length === 0) return { nodes: [], edges: [] };

  const type = (diagramType || "").toLowerCase();

  // If it's an ER diagram, use the specialized Chen layout
  if (type.includes("er") || type.includes("entity")) {
    const schema = { entities: [], relationships: [] };
    const isEntity = (n) => ['entity', 'rectangle', 'weak_entity'].includes(n.data?.shapeType);
    const isAttr = (n) => ['attribute', 'key_attribute', 'foreign_key_attribute', 'ellipse'].includes(n.data?.shapeType);
    const isRelationship = (n) => ['relationship', 'diamond'].includes(n.data?.shapeType);

    const entities = rawNodes.filter(isEntity);
    const relationships = rawNodes.filter(isRelationship);

    entities.forEach(ent => {
      const connectedAttrs = rawEdges
        .filter(e => (e.source === ent.id || e.target === ent.id))
        .map(e => rawNodes.find(n => n.id === (e.source === ent.id ? e.target : e.source)))
        .filter(n => n && isAttr(n))
        .map(n => n.data.label);

      schema.entities.push({
        name: ent.data.label,
        attributes: [...new Set(connectedAttrs)]
      });
    });

    relationships.forEach(rel => {
      const relEdges = rawEdges.filter(e => (e.source === rel.id || e.target === rel.id));
      const connectedEntities = relEdges
        .map(e => rawNodes.find(n => n.id === (e.source === rel.id ? e.target : e.source)))
        .filter(n => n && isEntity(n));

      if (connectedEntities.length >= 2) {
        schema.relationships.push({
          source: connectedEntities[0].data.label,
          target: connectedEntities[1].data.label,
          label: rel.data.label,
          sourceCardinality: relEdges.find(e => e.source === connectedEntities[0].id || e.target === connectedEntities[0].id)?.label || "",
          targetCardinality: relEdges.find(e => e.source === connectedEntities[1].id || e.target === connectedEntities[1].id)?.label || ""
        });
      }
    });

    if (schema.entities.length > 0) {
      return generateChenDiagramV3(schema);
    }
  }

  // For everything else (Flowchart, Sequence, etc.), use Dagre
  return layoutDagre(rawNodes, rawEdges, type.includes("sequence") ? "LR" : "TB");
};
