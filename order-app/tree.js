// tree.js
const fs = require('fs');
const path = require('path');

const IGNORE_DIRS = ['node_modules', '.expo', 'dist'];
const MAX_DEPTH = 100;

function printTree(dir, prefix = '', depth = 0) {
  if (depth > MAX_DEPTH) return '';

  let tree = '';
  const items = fs.readdirSync(dir).filter(
    item => !IGNORE_DIRS.includes(item)
  );

  items.forEach((item, index) => {
    const fullPath = path.join(dir, item);
    const isLast = index === items.length - 1;
    const connector = isLast ? '└── ' : '├── ';
    tree += `${prefix}${connector}${item}\n`;

    if (fs.statSync(fullPath).isDirectory()) {
      const newPrefix = prefix + (isLast ? '    ' : '│   ');
      tree += printTree(fullPath, newPrefix, depth + 1);
    }
  });

  return tree;
}

const rootDir = process.argv[2] || '.';
const outputFile = 'tree_clean.txt';

const treeOutput = printTree(rootDir);
fs.writeFileSync(outputFile, treeOutput, { encoding: 'utf8' });

console.log(`✅ Tree structure written to ${outputFile}`);
