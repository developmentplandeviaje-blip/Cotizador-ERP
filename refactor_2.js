const fs = require('fs');
let code;

function applyRefactor(file, replacementCode) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/\{deleteTarget && \([\s\S]*?\}\)\}\s*<\/div>\s*\);\s*\}/, replacementCode + '\n    </div>\n  );\n}');
    if (!content.includes('DeleteConfirmationModal')) {
      content = content.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n`);
    }
    fs.writeFileSync(file, content, 'utf8');
    console.log("Refactored", file);
  }
}

// 1. TrasladoList
applyRefactor('react-frontend/src/components/catalog/traslados/TrasladoList.jsx', `      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title="Confirmar Eliminación"
        subtitle="Esta acción eliminará el registro del catálogo de forma permanente."
        content={
          <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
            ¿Estás seguro de que deseas eliminar el traslado <strong style={{ color: '#E87217' }}>{deleteTarget?.ruta_origen}</strong>?
          </p>
        }
        confirmText="Sí, Eliminar"
      />`);

// 2. UbicacionList
applyRefactor('react-frontend/src/components/catalog/ubicaciones/UbicacionList.jsx', `      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={deleteTarget?.hoteles_count > 0 ? () => setDeleteTarget(null) : handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title={deleteTarget?.hoteles_count > 0 ? 'Acción no permitida' : 'Confirmar Eliminación'}
        subtitle={
          deleteTarget?.hoteles_count > 0 
            ? 'Para eliminar esta ubicación, primero debes reasignar o eliminar los hoteles que dependen de ella en el catálogo.'
            : 'Esta acción eliminará el registro de forma permanente.'
        }
        content={
          deleteTarget?.hoteles_count > 0 ? (
            <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
              La ubicación <strong style={{ color: '#E87217' }}>{deleteTarget?.ubicacion}</strong> no puede ser eliminada porque tiene <strong style={{ color: '#10B981' }}>{deleteTarget?.hoteles_count} hotel(es) asociado(s)</strong>.
            </p>
          ) : (
            <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
              ¿Estás seguro de que deseas eliminar la ubicación <strong style={{ color: '#E87217' }}>{deleteTarget?.ubicacion}</strong>?
            </p>
          )
        }
        confirmText={deleteTarget?.hoteles_count > 0 ? 'Entendido' : 'Sí, Eliminar'}
      />`);

// 3. VehiculoList
applyRefactor('react-frontend/src/components/catalog/vehiculos/VehiculoList.jsx', `      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title="Confirmar Eliminación"
        subtitle="Esta acción no se puede deshacer."
        content={
          <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
            ¿Está seguro de que desea eliminar el vehículo <strong style={{ color: '#FFFFFF' }}>{deleteTarget?.marca} {deleteTarget?.vehiculo} ({deleteTarget?.ano})</strong>?
          </p>
        }
        confirmText="Sí, Eliminar"
      />`);

// 4. MetodoPagoList
applyRefactor('react-frontend/src/components/finance/metodos_pago/MetodoPagoList.jsx', `      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title="Confirmar Eliminación"
        subtitle="Esta acción intentará remover el método de pago del sistema"
        content={
          <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
            ¿Está seguro de que desea eliminar <strong style={{ color: '#FFFFFF' }}>{deleteTarget?.nombre}</strong>?
          </p>
        }
        confirmText="Eliminar Método"
      />`);

// 5. UserAgenciaList (Special case due to linksModalUser being below it)
let f5 = 'react-frontend/src/components/users/agencia/UserAgenciaList.jsx';
if (fs.existsSync(f5)) {
  let code = fs.readFileSync(f5, 'utf8');
  const modalCode = `      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title="Confirmar Eliminación"
        subtitle="Esta acción intentará remover el usuario de la agencia"
        content={
          <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
            ¿Está seguro de que desea eliminar a <strong style={{ color: '#FFFFFF' }}>{deleteTarget?.full_name}</strong> (<span style={{ color: '#E87217' }}>{deleteTarget?.email}</span>)?
          </p>
        }
        confirmText="Eliminar Usuario"
      />`;
      
  code = code.replace(/\{deleteTarget && \([\s\S]*?\}\)\}\s*\{linksModalUser &&/, modalCode + '\n      {linksModalUser &&');
  
  if (!code.includes('DeleteConfirmationModal')) {
    code = code.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n`);
  }
  fs.writeFileSync(f5, code, 'utf8');
  console.log("Refactored", f5);
}

console.log("Done refactor 2");
