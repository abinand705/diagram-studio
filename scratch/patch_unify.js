const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'App.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Unified Diagram Processor Function
const unifiedProcessor = `
        const adoptAiDiagram = (diagram, origin) => {
          if (!diagram || !diagram.nodes) return { nodes: [], edges: [] };
          const timestamp = Date.now();
          
          const validNodes = diagram.nodes.filter(n => n && typeof n === 'object');
          const validEdges = (diagram.edges || []).filter(e => e && e.source && e.target);

          const adoptedNodes = validNodes.map(n => ({
            ...n,
            id: \`ai_\${timestamp}_\${Math.random().toString(36).substr(2, 5)}_\${n.id}\`,
            position: {
              x: (n.position?.x || 0) + (origin?.x || 0),
              y: (n.position?.y || 0) + (origin?.y || 0)
            }
          }));

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

// Inject before handleAiGenerate or replace getNodePositionWithOrigin
// We'll replace the existing getNodePositionWithOrigin block from previous patch
const helperPattern = /const getNodePositionWithOrigin = [\s\S]*?const adoptUserNodes = [\s\S]*?\}\);/g;
// Wait, my previous patch used slightly different naming in the script vs file.
// Let's look for the pattern in handleAiParseImage which I know exists.

// 2. Update handleAiGenerate to use adoptAiDiagram
const generatePattern = /const newNodes = data\.diagram\.nodes\.map\(n => \(\{ \.\.\.n, id: `ai_\$\{Date\.now\(\)\}_\$\{Math\.random\(\)\}` \}\)\);[\s\S]*?setEdges\(eds => \[\.\.\.eds, \.\.\.newEdges\]\);/g;
const generateReplacement = `const { nodes: newNodes, edges: newEdges } = adoptAiDiagram(data.diagram, { x: maxX, y: 0 });
        setNodes(nds => [...nds, ...newNodes]);
        setEdges(eds => [...eds, ...newEdges]);`;

// 3. Update handleAiParseImage to use adoptAiDiagram
const parsePattern = /const newNodes = data\.diagram\.nodes\.map\(n => \(\{[\s\S]*?\}\)\);[\s\S]*?setEdges\(eds => \[\.\.\.eds, \.\.\.newEdges\]\);/g;
const parseReplacement = `const { nodes: newNodes, edges: newEdges } = adoptAiDiagram(data.diagram, null);
        setNodes(nds => [...nds, ...newNodes]);
        setEdges(eds => [...eds, ...newEdges]);`;

// 4. Inject Animation CSS
const cssPattern = /\/\* CANVAS \*\//g;
const cssReplacement = `/* ANIMATIONS */
      <style>{\`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .anim-spin { animation: spin 1s linear infinite; }
        @keyframes pulse { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.02); opacity: 0.9; } 100% { transform: scale(1); opacity: 1; } }
        .anim-pulse { animation: pulse 2s ease-in-out infinite; }
      \`}</style>
      /* CANVAS */`;

content = content.replace(generatePattern, generateReplacement);
content = content.replace(parsePattern, parseReplacement);
content = content.replace(cssPattern, cssReplacement);

// We need to make sure adoptAiDiagram is defined before it's used.
// We'll inject it at the top of handleAiGenerate for simplicity, or in the component scope.
content = content.replace('const handleAiGenerate = async () => {', 'const handleAiGenerate = async () => {\n' + unifiedProcessor);

fs.writeFileSync(filePath, content);
console.log('Successfully unified AI processing in App.js');
