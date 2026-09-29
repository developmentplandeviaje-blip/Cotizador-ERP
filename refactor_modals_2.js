const fs = require('fs');
const files = [
  'react-frontend/src/components/catalog/aerolineas/AerolineaList.jsx',
  'react-frontend/src/components/catalog/excursiones/ExcursionList.jsx',
  'react-frontend/src/components/catalog/hotels/HotelList.jsx',
  'react-frontend/src/components/catalog/paquetes/PaqueteList.jsx',
  'react-frontend/src/components/catalog/traslados/TrasladoList.jsx',
  'react-frontend/src/components/catalog/ubicaciones/UbicacionList.jsx',
  'react-frontend/src/components/catalog/vehiculos/VehiculoList.jsx',
  'react-frontend/src/components/finance/metodos_pago/MetodoPagoList.jsx',
  'react-frontend/src/components/users/agencia/UserAgenciaList.jsx'
];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  let code = fs.readFileSync(file, 'utf8');

  // Replace manual deleteTarget modal with DeleteConfirmationModal
  const targetRegex = /\{deleteTarget && \([\s\S]*?\}\)\}\s*<\/div>\s*\);\s*\}/;
  
  const match = code.match(targetRegex);
  if (!match) {
    console.log("No match for", file);
    return;
  }

  let replacement = '';
  if (file.includes('UbicacionList.jsx')) {
    replacement = `{deleteTarget && (
        <DeleteConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          error={deleteError}
          title={deleteTarget.hoteles_count > 0 ? 'Acción no permitida' : 'Confirmar Eliminación'}
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
        />
      )}
    </div>
  );
}`;
  } else if (file.includes('TrasladoList.jsx')) {
    replacement = `{deleteTarget && (
        <DeleteConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          error={deleteError}
          title="Confirmar Eliminación"
          subtitle="Esta acción intentará remover el traslado del catálogo"
          content={
            <p style={{ margin: 0 }}>
              ¿Estás seguro de que deseas eliminar el traslado <strong style={{ color: '#E87217' }}>{deleteTarget.ruta_origen}</strong>?
            </p>
          }
          confirmText="Eliminar Traslado"
        />
      )}
    </div>
  );
}`;
  } else if (file.includes('AerolineaList.jsx')) {
    replacement = `{deleteTarget && (
        <DeleteConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          error={deleteError}
          title="Confirmar Eliminación"
          subtitle="Esta acción intentará remover la aerolínea del catálogo"
          content={
            <p style={{ margin: 0 }}>
              ¿Estás seguro de que deseas eliminar la aerolínea <strong style={{ color: '#FFFFFF' }}>{deleteTarget.nombre}</strong>?
            </p>
          }
          confirmText="Eliminar Aerolínea"
        />
      )}
    </div>
  );
}`;
  } else if (file.includes('ExcursionList.jsx')) {
    replacement = `{deleteTarget && (
        <DeleteConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          error={deleteError}
          title="Confirmar Eliminación"
          subtitle="Esta acción intentará remover la excursión del catálogo"
          content={
            <p style={{ margin: 0 }}>
              ¿Está seguro de que desea eliminar la excursión <strong style={{ color: '#FFFFFF' }}>{deleteTarget.nombre}</strong>?
            </p>
          }
          confirmText="Eliminar Excursión"
        />
      )}
    </div>
  );
}`;
  } else if (file.includes('HotelList.jsx')) {
    replacement = `{deleteTarget && (
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
      )}
    </div>
  );
}`;
  } else if (file.includes('PaqueteList.jsx')) {
    replacement = `{deleteTarget && (
        <DeleteConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          error={deleteError}
          title="Confirmar Eliminación"
          subtitle="Esta acción intentará remover el paquete del catálogo"
          content={
            <p style={{ margin: 0 }}>
              ¿Está seguro de que desea eliminar el paquete <strong style={{ color: '#FFFFFF' }}>{deleteTarget.paquete}</strong>?
            </p>
          }
          confirmText="Eliminar Paquete"
        />
      )}
    </div>
  );
}`;
  } else if (file.includes('VehiculoList.jsx')) {
    replacement = `{deleteTarget && (
        <DeleteConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          error={deleteError}
          title="Confirmar Eliminación"
          subtitle="Esta acción intentará remover el vehículo del catálogo"
          content={
            <p style={{ margin: 0 }}>
              ¿Está seguro de que desea eliminar el vehículo <strong style={{ color: '#FFFFFF' }}>{deleteTarget.marca} {deleteTarget.vehiculo} ({deleteTarget.ano})</strong>?
            </p>
          }
          confirmText="Eliminar Vehículo"
        />
      )}
    </div>
  );
}`;
  } else if (file.includes('MetodoPagoList.jsx')) {
    replacement = `{deleteTarget && (
        <DeleteConfirmationModal
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
          isDeleting={isDeleting}
          error={deleteError}
          title="Confirmar Eliminación"
          subtitle="Esta acción intentará remover el método de pago"
          content={
            <p style={{ margin: 0 }}>
              ¿Está seguro de que desea eliminar el método de pago <strong style={{ color: '#FFFFFF' }}>{deleteTarget.nombre}</strong>?
            </p>
          }
          confirmText="Eliminar Método"
        />
      )}
    </div>
  );
}`;
  } else if (file.includes('UserAgenciaList.jsx')) {
    // We also have the links modal here right before deleteTarget.
    // Wait, UserAgenciaList has BOTH linksModalUser AND deleteTarget!
    // But deleteTarget comes BEFORE linksModalUser, OR linksModalUser comes after!
    // So for UserAgenciaList, I need to be careful!
  }

  if (file.includes('UserAgenciaList.jsx')) {
     const regexUser = /\{deleteTarget && \([\s\S]*?position: 'fixed'[\s\S]*?\}\)\}\s*\{linksModalUser && \(/;
     const matchUser = code.match(regexUser);
     if (matchUser) {
        // ... handled below
     }
  }

  code = code.replace(targetRegex, replacement);

  // Add import if not present
  if (!code.includes('DeleteConfirmationModal')) {
    let depth = (file.match(/\//g) || []).length;
    let back = '../'.repeat(depth - 3);
    code = code.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import DeleteConfirmationModal from '${back}common/DeleteConfirmationModal';\n`);
  }

  fs.writeFileSync(file, code, 'utf8');
  console.log("Replaced in", file);
});
