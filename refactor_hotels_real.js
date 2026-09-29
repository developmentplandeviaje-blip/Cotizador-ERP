const fs = require('fs');
let code;
let f4 = 'react-frontend/src/components/catalog/hotels/HotelList.jsx';
if(fs.existsSync(f4)){
  code = fs.readFileSync(f4, 'utf8');

  // 1. imports
  if(!code.includes('DeleteConfirmationModal')) code = code.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n`);

  // 2. state
  if(!code.includes('deleteTarget')) {
    code = code.replace(/const \[successBanner, setSuccessBanner\] = useState\(''\);/,
      `const [successBanner, setSuccessBanner] = useState('');\n  const [deleteTarget, setDeleteTarget] = useState(null);\n  const [isDeleting, setIsDeleting] = useState(false);\n  const [deleteError, setDeleteError] = useState('');`);
  }

  // 3. handlers
  const oldDelete = `  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de que desea eliminar este hotel?')) {
      try {
        await axios.delete(\`/v1/catalog/hoteles/\${id}\`);
        setSuccessBanner('Hotel eliminado exitosamente.');
        setTimeout(() => setSuccessBanner(''), 4000);
        fetchHotels();
      } catch (err) {
        console.error('Error al eliminar hotel:', err);
      }
    }
  };`;

  const newDelete = `  const handleDelete = (hotel) => {
    setDeleteTarget(hotel);
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setDeleteError('');
    try {
      await axios.delete(\`/v1/catalog/hoteles/\${deleteTarget.id}\`);
      setDeleteTarget(null);
      setSuccessBanner('Hotel eliminado exitosamente.');
      setTimeout(() => setSuccessBanner(''), 4000);
      fetchHotels();
    } catch (err) {
      console.error('Error al eliminar hotel:', err);
      setDeleteError('No se pudo eliminar el hotel.');
    } finally {
      setIsDeleting(false);
    }
  };`;
  code = code.replace(oldDelete, newDelete);
  
  // replace button onClick
  code = code.replace(/onClick=\{\(\) => handleDelete\(item\.id\)\}/g, "onClick={() => handleDelete(item)}");

  // 4. Modal
  code = code.replace(/<\/div>\s*\);\s*\}/,
    `
      {/* Modal de Confirmación de Eliminación Segura */}
      <DeleteConfirmationModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        error={deleteError}
        title="Confirmar Eliminación"
        subtitle="Esta acción no se puede deshacer."
        content={
          <>¿Está seguro de que desea eliminar el hotel <strong style={{ color: '#E87217' }}>{deleteTarget?.nombre}</strong>?</>
        }
        confirmText="Sí, Eliminar"
      />
    </div>
  );
}`);

  fs.writeFileSync(f4, code, 'utf8');
}
console.log("Done refactor hotels");
