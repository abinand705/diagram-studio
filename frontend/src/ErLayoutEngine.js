/**
 * Classical ER (Chen Notation) Layout Engine v4.1
 * Direct Dimensionality for Guaranteed Visibility
 */

export const generateChenDiagramV3 = (schema) => {
  const nodes = [];
  const edges = [];
  const prefix = `chen_`; 

  const START_X = 250; 
  const SPACING_X = 350;
  const ATTR_OFFSET_X = 180;
  const ATTR_STEP_Y = 100;
  const CENTER_Y = 400;

  // 1. Entities
  schema.entities.forEach((ent, eIdx) => {
    const eId = `${prefix}ent_${eIdx}`;
    nodes.push({
      id: eId,
      type: "flowchart",
      position: { x: START_X + eIdx * SPACING_X * 2, y: CENTER_Y },
      data: { label: ent.name, shapeType: "entity", width: 140, height: 70 },
      style: { width: 140, height: 70 }
    });

    // Attributes
    (ent.attributes || []).forEach((attrName, aIdx) => {
      const aId = `${prefix}ent_${eIdx}_attr_${aIdx}`;
      const isLeft = aIdx % 2 === 0;
      const vOffset = (Math.floor(aIdx / 2) + 1) * ATTR_STEP_Y;
      
      const aX = isLeft ? START_X + eIdx * SPACING_X * 2 - ATTR_OFFSET_X : START_X + eIdx * SPACING_X * 2 + ATTR_OFFSET_X;
      const aY = isLeft ? CENTER_Y - vOffset : CENTER_Y + vOffset;

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
        style: { stroke: "#000000", strokeWidth: 2.5 },
        data: { markerEnd: "none" }
      });
    });
  });

  // 2. Relationships
  schema.relationships.forEach((rel, rIdx) => {
    const rId = `${prefix}rel_${rIdx}`;
    const sIdx = schema.entities.findIndex(e => e.name === rel.source);
    const tIdx = schema.entities.findIndex(e => e.name === rel.target);
    
    if (sIdx !== -1 && tIdx !== -1) {
      const sX = START_X + sIdx * SPACING_X * 2;
      const tX = START_X + tIdx * SPACING_X * 2;
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
        style: { stroke: "#000000", strokeWidth: 2.5 },
        data: { markerEnd: "none" }
      });
      edges.push({
        id: `${prefix}edge_rel_t_${rIdx}`,
        source: rId,
        target: `${prefix}ent_${tIdx}`,
        type: "drawio",
        style: { stroke: "#000000", strokeWidth: 2.5 },
        data: { markerEnd: "none" }
      });
    }
  });

  return { nodes, edges };
};

export const applyAdvancedErLayout = (rawNodes, rawEdges) => {
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
    const connectedEntities = rawEdges
      .filter(e => (e.source === rel.id || e.target === rel.id))
      .map(e => rawNodes.find(n => n.id === (e.source === rel.id ? e.target : e.source)))
      .filter(n => n && isEntity(n));

    if (connectedEntities.length >= 2) {
      schema.relationships.push({
        source: connectedEntities[0].data.label,
        target: connectedEntities[1].data.label,
        label: rel.data.label
      });
    }
  });

  return generateChenDiagramV3(schema);
};
