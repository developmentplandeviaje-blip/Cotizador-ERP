const fs = require('fs');

function applyRefactor(file, replacementCode) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // Find where {deleteTarget && ( starts
    const startIndex = content.indexOf('{deleteTarget && (');
    if (startIndex === -1) {
       console.log("No deleteTarget block found in", file);
       return;
    }

    // Since it's always at the end before `</div>\n  );\n}`, we can just replace everything from startIndex to the end
    const lastClosingDiv = content.lastIndexOf('</div>');
    if (lastClosingDiv === -1) return;
    
    // We replace from {deleteTarget && ( to the last </div>
    const newContent = content.substring(0, startIndex) + replacementCode + '\n    </div>\n  );\n}\n';

    let finalContent = newContent;
    if (!finalContent.includes('DeleteConfirmationModal')) {
      finalContent = finalContent.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n`);
    }

    fs.writeFileSync(file, finalContent, 'utf8');
    console.log("ACTUALLY Refactored", file);
  }
}

// 1. AerolineaList
applyRefactor('react-frontend/src/components/catalog/aerolineas/AerolineaList.jsx', `      <DeleteConfirmationModal
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
      />`);

// 2. ExcursionList
applyRefactor('react-frontend/src/components/catalog/excursiones/ExcursionList.jsx', `      <DeleteConfirmationModal
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
      />`);

// 3. PaqueteList
applyRefactor('react-frontend/src/components/catalog/paquetes/PaqueteList.jsx', `      <DeleteConfirmationModal
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
      />`);

// 4. TrasladoList
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

// 5. UbicacionList
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

// 6. VehiculoList
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

// 7. MetodoPagoList
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

// 8. UserAgenciaList (Special case due to linksModalUser being below it)
let f8 = 'react-frontend/src/components/users/agencia/UserAgenciaList.jsx';
if (fs.existsSync(f8)) {
  let content = fs.readFileSync(f8, 'utf8');
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
      
  const startIndex = content.indexOf('{deleteTarget && (');
  const endIndex = content.indexOf('{linksModalUser && (');
  if (startIndex !== -1 && endIndex !== -1) {
     content = content.substring(0, startIndex) + modalCode + '\n      ' + content.substring(endIndex);
  } else {
     content = content.replace(/\{deleteTarget && \([\s\S]*?\}\)\}\s*\{linksModalUser &&/, modalCode + '\n      {linksModalUser &&');
  }
  
  if (!content.includes('DeleteConfirmationModal')) {
    content = content.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n`);
  }
  fs.writeFileSync(f8, content, 'utf8');
  console.log("ACTUALLY Refactored", f8);
}
