const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  content = content.replace(/red-700/g, 'indigo-600')
                   .replace(/red-800/g, 'indigo-700')
                   .replace(/red-600/g, 'indigo-500')
                   .replace(/red-500/g, 'indigo-500')
                   .replace(/red-100/g, 'indigo-100')
                   .replace(/red-50/g, 'indigo-50')
                   .replace(/red-900/g, 'indigo-900')
                   .replace(/red-400/g, 'indigo-400');
  fs.writeFileSync(filePath, content);
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir(path.join(__dirname, 'src'));
console.log('Done replacing colors.');
