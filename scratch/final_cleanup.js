const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'App.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Identify the entire messy block between adoptAiDiagram start and handleAiParseImage start
// We want to replace everything from the first 'const adoptAiDiagram' to 'const handleAiParseImage'
const startMarker = /const adoptAiDiagram = \(diagram, origin\) => \{/;
const endMarker = /const handleAiParseImage = async \(file\) => \{/;

const startIndex = content.search(startMarker);
const endIndex = content.search(endMarker);

if (startIndex !== -1 && endIndex !== -1) {
  const newBlock = `const adoptAiDiagram = (diagram, origin) => {
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

  const handleAiGenerate = async () => {
    if (!currentUser) return setModalConfig({ type: 'alert', title: '🔐 Sign In Required', message: 'Sign in with Google to use AI diagramming features.' });
    if (!aiInputText.trim()) return;

    setIsAiProcessing(true);
    try {
      const maxX = nodes.reduce((max, n) => Math.max(max, n.position.x + (n.style?.width || 140)), 0);
      const res = await fetch("http://127.0.0.1:5000/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiInputText, type: "mixed", currentExtent: { x: maxX } })
      });
      const data = await res.json();
      if (data.success) {
        takeSnapshot();
        const { nodes: newNodes, edges: newEdges } = adoptAiDiagram(data.diagram, { x: maxX, y: 0 });
        setNodes(nds => [...nds, ...newNodes]);
        setEdges(eds => [...eds, ...newEdges]);
        setIsAiPanelOpen(false);
        setAiInputText('');
        setModalConfig({ type: 'alert', title: '✨ Diagram Generated', message: 'The AI has appended new shapes to your canvas!' });
      }
    } catch (err) {
      setModalConfig({ type: 'alert', title: '❌ AI Error', message: 'Failed to connect to the AI service. Ensure the backend is running.' });
    } finally {
      setIsAiProcessing(false);
    }
  };

  `;

  content = content.slice(0, startIndex) + newBlock + content.slice(endIndex);
}

fs.writeFileSync(filePath, content);
console.log('Successfully cleaned up App.js and resolved syntax error');
