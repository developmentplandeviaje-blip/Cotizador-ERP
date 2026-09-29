const fs = require('fs');

const files = [
  'react-frontend/src/components/catalog/aerolineas/AerolineaList.jsx',
  'react-frontend/src/components/catalog/excursiones/ExcursionList.jsx',
  'react-frontend/src/components/catalog/hotels/HotelList.jsx', // Note: hotels, not hoteles
  'react-frontend/src/components/catalog/paquetes/PaqueteList.jsx',
  'react-frontend/src/components/catalog/traslados/TrasladoList.jsx',
  'react-frontend/src/components/catalog/ubicaciones/UbicacionList.jsx',
  'react-frontend/src/components/catalog/vehiculos/VehiculoList.jsx',
  'react-frontend/src/components/finance/metodos_pago/MetodoPagoList.jsx',
  'react-frontend/src/components/users/agencia/UserAgenciaList.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) {
      console.log('Not found:', file);
      return;
  }
  let code = fs.readFileSync(file, 'utf8');

  // Find the `{deleteTarget && (` block
  const startIndex = code.indexOf('{deleteTarget && (');
  if (startIndex === -1) return;

  // We need to find the matching closing `)}`
  let openBraces = 0;
  let endIndex = -1;
  let inString = false;
  let stringChar = '';

  for (let i = startIndex + 17; i < code.length; i++) {
    const char = code[i];
    if (inString) {
      if (char === stringChar && code[i-1] !== '\\') inString = false;
    } else {
      if (char === '"' || char === "'" || char === "`") {
        inString = true;
        stringChar = char;
      } else if (char === '(' || char === '{') {
        openBraces++;
      } else if (char === ')' || char === '}') {
        if (openBraces === 0 && char === ')') {
            // Found the closing of `( ... )`
            if (code[i+1] === '}') {
                endIndex = i + 1;
                break;
            }
        } else {
            openBraces--;
        }
      }
    }
  }

  if (endIndex === -1) {
    console.log("Could not parse", file);
    return;
  }

  const modalBlock = code.substring(startIndex, endIndex + 1);

  // Extract parts
  let title = "Confirmar Eliminación";
  const titleMatch = modalBlock.match(/<h3[^>]*>([\s\S]*?)<\/h3>/);
  if (titleMatch) title = titleMatch[1].trim();
  else {
      // UbicacionList has conditional title
      const conditionalTitle = modalBlock.match(/<h3[^>]*>([\s\S]*?\{deleteTarget\.[^>]*?)<\/h3>/);
      if (conditionalTitle) title = conditionalTitle[1].trim();
  }

  let subtitle = "Esta acción intentará remover el elemento";
  const subtitleMatch = modalBlock.match(/<h3[^>]*>[\s\S]*?<\/h3>\s*<p[^>]*>([\s\S]*?)<\/p>/);
  if (subtitleMatch) subtitle = subtitleMatch[1].trim();
  
  // The content is the <p> after the title/subtitle block, or just the main <p> asking "Estǭ seguro..."
  let content = "";
  // Find all <p> tags
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/g;
  let match;
  while ((match = pRegex.exec(modalBlock)) !== null) {
      if (match[1].includes('deleteTarget') || match[1].includes('seguro de que')) {
          content = match[0]; // keep the whole tag or inner contents?
          break;
      }
  }

  let confirmText = "Eliminar";
  const btnRegex = /<button[^>]*onClick=\{handleConfirmDelete\}[^>]*>([\s\S]*?)<\/button>/;
  const btnMatch = modalBlock.match(btnRegex);
  if (btnMatch) confirmText = btnMatch[1].trim();

  // If we couldn't find content cleanly, fallback to a regex that grabs the main message area.
  // UbicacionList has complex conditional content.
  let isUbicacion = file.includes('UbicacionList');

  // Let's build the replacement
  let replacement = `      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
`;
  if (isUbicacion && modalBlock.includes('hoteles_count')) {
      replacement += `        title={deleteTarget.hoteles_count > 0 ? 'Acción no permitida' : 'Confirmar Eliminación'}
        subtitle="Esta acción intentará remover la ubicación del catálogo"
        content={
            deleteTarget.hoteles_count > 0 ? (
                <p style={{ margin: 0 }}>
                  La ubicación <strong style={{ color: '#E87217' }}>{deleteTarget.ubicacion}</strong> no puede ser eliminada porque tiene <strong style={{ color: '#10B981' }}>{deleteTarget.hoteles_count} hotel(es) asociado(s)</strong>.
                </p>
            ) : (
                <p style={{ margin: 0 }}>
                  ¿Estás seguro de que deseas eliminar la ubicación <strong style={{ color: '#E87217' }}>{deleteTarget.ubicacion}</strong>?
                </p>
            )
        }
        confirmText="Eliminar Ubicación"
      />`;
  } else {
      replacement += `        title={"${title.replace(/"/g, '\\"')}"}
        subtitle={"${subtitle.replace(/"/g, '\\"')}"}
        content={(
          ${content.replace(/color: '#E2E8F0'/g, "margin: 0")}
        )}
        confirmText={${confirmText.includes('{') ? confirmText : '"' + confirmText.replace(/"/g, '\\"') + '"'}}
      />`;
  }

  // Add import
  if (!code.includes('DeleteConfirmationModal')) {
    code = code.replace(/import Modal from '.*?';/, "$&\nimport DeleteConfirmationModal from '../../common/DeleteConfirmationModal';");
    if (!code.includes('DeleteConfirmationModal')) {
      code = code.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, "$1import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n");
    }
  }

  // Path fix
  let depth = (file.match(/\//g) || []).length;
  let back = '../'.repeat(depth - 3); // relative to src/components
  code = code.replace(/"\.\.\/\.\.\/common\/DeleteConfirmationModal"/, `"${back}common/DeleteConfirmationModal"`);

  code = code.substring(0, startIndex) + replacement + code.substring(endIndex + 1);
  
  fs.writeFileSync(file, code, 'utf8');
  console.log('Replaced in', file);
});
