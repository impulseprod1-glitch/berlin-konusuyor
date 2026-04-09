import fs from 'fs';
import path from 'path';

const cssPath = path.resolve('src/style.css');
const stylesDir = path.resolve('src/styles');

if (!fs.existsSync(cssPath)) {
  console.error("style.css not found!");
  process.exit(1);
}

const cssCode = fs.readFileSync(cssPath, 'utf8');
const blocks = cssCode.split(/(?=\/\*\s*──)/);

const fileMap = {
  'variables.css': [],
  'base.css': [],
  'layout.css': [],
  'components.css': [],
  'modals.css': [],
  'utilities.css': []
};

let headerLines = [];

blocks.forEach((block, index) => {
  if (index === 0 && !block.trim().startsWith('/* ──')) {
    headerLines.push(block.trim());
    return;
  }
  
  const match = block.match(/\/\*\s*──\s*(.*?)\s*──/);
  let title = match ? match[1].toLowerCase() : 'other';
  
  // Categorize
  if (title.includes('theme') || title.includes('variables')) {
    fileMap['variables.css'].push(block.trim());
  } else if (title.includes('reset') || title.includes('base') || title.includes('scrollbar')) {
    fileMap['base.css'].push(block.trim());
  } else if (title.includes('navbar') || title.includes('hamburger') || title.includes('hero') || title.includes('section') || title.includes('footer')) {
    fileMap['layout.css'].push(block.trim());
  } else if (title.includes('modal') || title.includes('player') || title.includes('overlay')) {
    fileMap['modals.css'].push(block.trim());
  } else if (title.includes('skeleton') || title.includes('utility') || title.includes('utilities') || title.includes('animation') || title.includes('media')) {
    fileMap['utilities.css'].push(block.trim());
  } else {
    fileMap['components.css'].push(block.trim());
  }
});

const loadOrder = [
  'variables.css',
  'base.css',
  'layout.css',
  'components.css',
  'modals.css',
  'utilities.css'
];

if (!fs.existsSync(stylesDir)) {
  fs.mkdirSync(stylesDir, { recursive: true });
}

let imports = headerLines.join('\n') + '\n\n';

loadOrder.forEach(file => {
  if (fileMap[file].length > 0) {
    fs.writeFileSync(path.join(stylesDir, file), fileMap[file].join('\n\n'));
    imports += `@import './styles/${file}';\n`;
  }
});

fs.writeFileSync(cssPath, imports);
console.log('--- SUCCESS: CSS modularized ---');
