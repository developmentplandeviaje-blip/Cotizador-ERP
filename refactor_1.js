const fs = require('fs');
let code;

// 1. AerolineaList
let f1 = 'react-frontend/src/components/catalog/aerolineas/AerolineaList.jsx';
if(fs.existsSync(f1)){
  code = fs.readFileSync(f1, 'utf8');
  let start = code.indexOf('{deleteTarget && (');
  let end = code.lastIndexOf(')}'); // The last `)}` is likely the closing of the modal block if it's at the end.
  // Actually, better way:
  code = code.replace(/\{deleteTarget && \([\s\S]*?\}\)\}\s*<\/div>\s*\);\s*\}/,
    `{/* Modal de Confirmación de Eliminación Segura */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteTarget?.vuelos_count > 0 ? () => setDeleteTarget(null) : handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title={deleteTarget?.vuelos_count > 0 ? 'Acción no permitida' : 'Confirmar Eliminación'}
        subtitle={deleteTarget?.vuelos_count > 0 ? 'Para mantener la integridad histórica de ventas y cotizaciones, no se permite eliminar aerolíneas con registros vinculados.' : 'Esta acción eliminará el registro de forma permanente.'}
        content={
          deleteTarget?.vuelos_count > 0 
            ? <>La aerolínea <strong style={{ color: '#E87217' }}>{deleteTarget.nombre}</strong> no puede ser eliminada porque tiene <strong style={{ color: '#10B981' }}>{deleteTarget.vuelos_count} venta(s) de vuelo asociada(s)</strong>.</>
            : <>¿Estás seguro de que deseas eliminar la aerolínea <strong style={{ color: '#E87217' }}>{deleteTarget?.nombre}</strong>?</>
        }
        confirmText={deleteTarget?.vuelos_count > 0 ? 'Entendido' : 'Sí, Eliminar'}
      />
    </div>
  );
}`);
  if(!code.includes('DeleteConfirmationModal')) code = code.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n`);
  fs.writeFileSync(f1, code, 'utf8');
}

// 2. ExcursionList
let f2 = 'react-frontend/src/components/catalog/excursiones/ExcursionList.jsx';
if(fs.existsSync(f2)){
  code = fs.readFileSync(f2, 'utf8');
  code = code.replace(/\{deleteTarget && \([\s\S]*?\}\)\}\s*<\/div>\s*\);\s*\}/,
    `{/* Modal de Confirmación de Eliminación Segura */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title="Confirmar Eliminación"
        subtitle="Esta acción eliminará el registro del catálogo de forma permanente."
        content={
          <>¿Estás seguro de que deseas eliminar la excursión <strong style={{ color: '#E87217' }}>{deleteTarget?.tipo_excursion}</strong>?</>
        }
        confirmText="Sí, Eliminar"
      />
    </div>
  );
}`);
  if(!code.includes('DeleteConfirmationModal')) code = code.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n`);
  fs.writeFileSync(f2, code, 'utf8');
}

// 3. PaqueteList
let f3 = 'react-frontend/src/components/catalog/paquetes/PaqueteList.jsx';
if(fs.existsSync(f3)){
  code = fs.readFileSync(f3, 'utf8');
  code = code.replace(/\{deleteTarget && \([\s\S]*?\}\)\}\s*<\/div>\s*\);\s*\}/,
    `{/* Confirmation Modal for Delete */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title="Confirmar Eliminación"
        subtitle=""
        content={
          <>¿Está seguro de que desea eliminar el paquete <strong style={{ color: '#FFFFFF' }}>{deleteTarget?.paquete}</strong>? Esta acción no se puede deshacer.</>
        }
        confirmText="Sí, Eliminar"
      />
    </div>
  );
}`);
  if(!code.includes('DeleteConfirmationModal')) code = code.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n`);
  fs.writeFileSync(f3, code, 'utf8');
}

console.log("Done refactor 1");
