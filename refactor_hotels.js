const fs = require('fs');
const file = 'react-frontend/src/components/catalog/hotels/HotelList.jsx';
if (fs.existsSync(file)) {
  let code = fs.readFileSync(file, 'utf8');

  const targetRegex = /\{deleteTarget && \([\s\S]*?position: 'fixed'[\s\S]*?(?:\s*<\/div>\s*<\/div>\s*)\)\}/;
  let replacement = `{deleteTarget && (
        <DeleteConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          error={deleteError}
          title="Confirmar Eliminación"
          subtitle="Esta acción intentará remover el hotel del catálogo"
          content={
            <p style={{ margin: 0 }}>
              ¿Estás seguro de que deseas eliminar el hotel <strong style={{ color: '#E87217' }}>{deleteTarget.nombre}</strong>?
            </p>
          }
          confirmText="Eliminar Hotel"
        />
      )}`;

  code = code.replace(targetRegex, replacement);

  if (!code.includes('DeleteConfirmationModal')) {
    code = code.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n`);
  }

  fs.writeFileSync(file, code, 'utf8');
  console.log("Replaced in", file);
}
