const fs = require('fs');

function refactorFile(filePath, stateName, handleName, modalCode, isDelete = true) {
  if (fs.existsSync(filePath)) {
    let code = fs.readFileSync(filePath, 'utf8');
    
    if (!code.includes('DeleteConfirmationModal')) {
      const relPath = filePath.includes('hotels') ? '../../common/DeleteConfirmationModal' : '../../common/DeleteConfirmationModal';
      code = code.replace(/(import Modal .*?;\n)/, `$1import DeleteConfirmationModal from '${relPath}';\n`);
    }

    if (!code.includes(stateName)) {
      code = code.replace(/const \[isSubmitting, setIsSubmitting\] = useState\(false\);/, `const [isSubmitting, setIsSubmitting] = useState(false);\n    const [${stateName}, set${stateName.charAt(0).toUpperCase() + stateName.slice(1)}] = useState(null);\n    const [isActioning, setIsActioning] = useState(false);`);
    }
    
    // Write out back to original file and XAMPP if needed.
    // I'll do this carefully.
  }
}
