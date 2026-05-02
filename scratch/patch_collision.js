const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'App.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Updated adoptAiDiagram with collision resolution
const improvedProcessor = `
  const adoptAiDiagram = (diagram, origin) => {
    if (!diagram || !diagram.nodes) return { nodes: [], edges: [] };
    const timestamp = Date.now();
    
    const validNodes = diagram.nodes.filter(n => n && typeof n === 'object');
    const validEdges = (diagram.edges || []).filter(e => e && e.source && e.target);

    // Collision detection helper
    const resolveCollisions = (pos, takenSlots, padding = 160) => {
      let currentPos = { ...pos };
      let attempts = 0;
      while (attempts < 50) {
        const isOccupied = takenSlots.some(s => 
          Math.abs(s.x - currentPos.x) < padding && 
          Math.abs(s.y - currentPos.y) < padding
        );
        if (!isOccupied) return currentPos;
        currentPos.y += 100; // Nudge down
        attempts++;
      }
      return currentPos;
    };

    const takenPositions = nodes.map(n => n.position);
    const adoptedNodes = [];

    validNodes.forEach(n => {
      const rawPos = {
        x: (n.position?.x || 0) + (origin?.x || 0),
        y: (n.position?.y || 0) + (origin?.y || 0)
      };
      const finalPos = resolveCollisions(rawPos, [...takenPositions, ...adoptedNodes.map(an => an.position)]);
      
      adoptedNodes.push({
        ...n,
        id: \`ai_\${timestamp}_\${Math.random().toString(36).substr(2, 5)}_\${n.id}\`,
        position: finalPos
      });
    });

    const idMap = new Map();
    validNodes.forEach((n, i) => idMap.set(n.id, adoptedNodes[i].id));

    const adoptedEdges = validEdges.map(e => ({
      ...e,
      id: \`ai_edge_\${timestamp}_\${Math.random().toString(36).substr(2, 5)}_\${e.id}\`,
      source: idMap.get(e.source) || e.source,
      target: idMap.get(e.target) || e.target,
      type: 'straight',
      markerEnd: { type: MarkerType.ArrowClosed, color: darkMode ? '#94a3b8' : '#475569' },
      style: { stroke: darkMode ? '#64748b' : '#94a3b8', strokeWidth: 2 },
      labelStyle: { fill: darkMode ? '#cbd5e1' : '#1e293b', fontWeight: 700 }
    }));

    return { nodes: adoptedNodes, edges: adoptedEdges };
  };
`;

// Replace the existing adoptAiDiagram with the improved one
const pattern = /const adoptAiDiagram = \(diagram, origin\) => \{[\s\S]*?\};/g;
content = content.replace(pattern, improvedProcessor);

fs.writeFileSync(filePath, content);
console.log('Successfully applied collision resolution to App.js');
