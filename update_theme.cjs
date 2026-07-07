const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace pink with sky
  content = content.replace(/pink-/g, 'sky-');
  content = content.replace(/Pink/g, 'Sky');
  
  // Replace $ with ₹ where it's used as a currency symbol
  content = content.replace(/\$([0-9\{a-zA-Z])/g, '₹$1');
  
  fs.writeFileSync(filePath, content, 'utf8');
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
      replaceInFile(fullPath);
    }
  }
}

processDir('src');
console.log('Update complete');
