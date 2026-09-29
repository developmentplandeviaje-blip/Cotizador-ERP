const fs = require('fs');
const glob = require('fs').readdirSync;

function findFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(dir + '/' + file);
    if (stat.isDirectory()) {
      findFiles(dir + '/' + file, fileList);
    } else if (file.endsWith('.jsx')) {
      fileList.push(dir + '/' + file);
    }
  }
  return fileList;
}

const allFiles = findFiles('react-frontend/src/components');

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('showToast(') && !content.includes('import { showToast }')) {
    const depth = file.split('/').length - 3;
    let rel = '';
    for(let i=0; i<depth; i++) rel += '../';
    rel += 'utils/toast';
    content = content.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import { showToast } from '${rel}';\n`);
    fs.writeFileSync(file, content, 'utf8');
    
    // Also copy to XAMPP if it exists there
    const xamppPath = file.replace('react-frontend/src', 'C:\\xampp\\htdocs\\Cotizador-ERP\\react-frontend\\src');
    if (fs.existsSync(xamppPath)) {
        fs.writeFileSync(xamppPath, content, 'utf8');
    }
    
    console.log("Added showToast import to", file);
  }
});
