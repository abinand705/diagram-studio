const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'App.js');
let content = fs.readFileSync(filePath, 'utf8');

// Pattern 1: getNodePositionWithOrigin
const pattern1 = /const getNodePositionWithOrigin = \(node, origin\) => \(\{[\s\S]*?\}\);/g;
const replacement1 = `const getNodePositionWithOrigin = (node, origin) => ({
          x: (node?.position?.x || 0) + (origin?.x || 0),
          y: (node?.position?.y || 0) + (origin?.y || 0)
        });`;

// Pattern 2: adoptUserNodes
const pattern2 = /const adoptedNodes = nodes\.map\(n => \(\{[\s\S]*?\}\)\);/g;
const replacement2 = `const adoptedNodes = (nodes || []).filter(n => n && typeof n === 'object').map(n => ({
            ...n,
            id: \`ai_\${timestamp}_\${n.id}\`,
            position: getNodePositionWithOrigin(n, origin)
          }));`;

content = content.replace(pattern1, replacement1);
content = content.replace(pattern2, replacement2);

fs.writeFileSync(filePath, content);
console.log('Successfully patched App.js');
