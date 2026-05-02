const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'frontend', 'src', 'App.js');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Identify the adoptAiDiagram block
const blockPattern = /const adoptAiDiagram = \(diagram, origin\) => \{[\s\S]*?\};/g;
const matches = content.match(blockPattern);

if (matches && matches.length > 0) {
  const block = matches[0];
  // Remove it from its current position
  content = content.replace(block, '');
  
  // Inject it before the first handler (handleAiGenerate)
  content = content.replace('const handleAiGenerate = async () => {', block + '\n\n  const handleAiGenerate = async () => {');
}

fs.writeFileSync(filePath, content);
console.log('Successfully moved adoptAiDiagram to correct scope');
