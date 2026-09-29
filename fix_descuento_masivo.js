const fs = require('fs');

// FILE 1
const file1 = 'react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx';
let code1 = fs.readFileSync(file1, 'utf8');
code1 = code1.replace(/import Modal from '..\/..\/common\/Modal';\n/, "import Modal from '../../common/Modal';\nimport DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n");
code1 = code1.replace(/const \[isSubmitting, setIsSubmitting\] = useState\(false\);/, "const [isSubmitting, setIsSubmitting] = useState(false);\n    const [confirmAction, setConfirmAction] = useState(false);");
code1 = code1.replace(/if \(!window\.confirm\('Estǭ seguro que desea desactivar todos los descuentos para esta ubicacin\?'\)\) \{\n\s*return;\n\s*\}/, "if (true) { setConfirmAction(true); return; }");
code1 = code1.replace(/const handleDeactivate = async \(\) => {/, "const handleDeactivate = async () => {\n        if(confirmAction) return executeDeactivate();");
code1 = code1.replace(/const executeDeactivate = async \(\) => {/, "");
code1 = code1.replace(/if \(true\) \{ setConfirmAction\(true\); return; \}/, "setConfirmAction(true);\n        return;\n    };\n\n    const executeDeactivate = async () => {");
code1 = code1.replace(/\} finally \{\n\s*setIsSubmitting\(false\);\n\s*\}/, "} finally {\n            setIsSubmitting(false);\n            setConfirmAction(false);\n        }");
code1 = code1.replace(/(<\/div>\s*<\/Modal>\s*\);\s*\})/, `
        <DeleteConfirmationModal
            isOpen={confirmAction}
            onClose={() => setConfirmAction(false)}
            onCancel={() => setConfirmAction(false)}
            onConfirm={executeDeactivate}
            isDeleting={isSubmitting}
            title="Confirmar Desactivación"
            subtitle="Esta acción desactivará los descuentos para la ubicación seleccionada."
            content={
                <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                    ¿Está seguro que desea desactivar todos los descuentos para esta ubicación?
                </p>
            }
            confirmText="Desactivar"
        />
        $1`);
fs.writeFileSync(file1, code1, 'utf8');
fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + file1, code1, 'utf8');

// FILE 2
const file2 = 'react-frontend/src/components/catalog/vehiculos/VehiculoAgenciaModal.jsx';
let code2 = fs.readFileSync(file2, 'utf8');
code2 = code2.replace(/import Modal from '..\/..\/common\/Modal';\n/, "import Modal from '../../common/Modal';\nimport DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n");
code2 = code2.replace(/const \[isSubmitting, setIsSubmitting\] = useState\(false\);/, "const [isSubmitting, setIsSubmitting] = useState(false);\n    const [deleteTarget, setDeleteTarget] = useState(null);\n    const [isDeleting, setIsDeleting] = useState(false);");
code2 = code2.replace(/const handleDeleteAgencia = async \(id, name\) => {\n\s*if \(!window\.confirm\(`Estǭ seguro de eliminar la agencia "\$\{name\}"\?`\)\) return;\n\s*try {/, 
`const handleDeleteAgencia = (id, name) => {
    setDeleteTarget({id, name});
  };

  const confirmDeleteAgencia = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const { id, name } = deleteTarget;
    try {`);
code2 = code2.replace(/\} catch \(err\) \{\n\s*console\.error\('Error eliminando agencia:', err\);\n\s*showToast\(err\.response\?\.data\?\.message \|\| 'No se pudo eliminar la agencia\.', 'error'\);\n\s*\}/, 
`} catch (err) {
      console.error('Error eliminando agencia:', err);
      showToast(err.response?.data?.message || 'No se pudo eliminar la agencia.', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }`);
code2 = code2.replace(/(<\/div>\s*<\/Modal>\s*\);\s*\})/, `
        <DeleteConfirmationModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={confirmDeleteAgencia}
            isDeleting={isDeleting}
            title="Confirmar Eliminación"
            subtitle="Esta acción intentará remover la agencia del sistema."
            content={
                <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                    ¿Está seguro de eliminar la agencia <strong style={{ color: '#FFFFFF' }}>{deleteTarget?.name}</strong>?
                </p>
            }
            confirmText="Eliminar Agencia"
        />
        $1`);
fs.writeFileSync(file2, code2, 'utf8');
fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + file2, code2, 'utf8');


// FILE 3
const file3 = 'react-frontend/src/components/catalog/vehiculos/VehiculoTarifasModal.jsx';
let code3 = fs.readFileSync(file3, 'utf8');
code3 = code3.replace(/import Modal from '..\/..\/common\/Modal';\n/, "import Modal from '../../common/Modal';\nimport DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n");
code3 = code3.replace(/const \[isSubmitting, setIsSubmitting\] = useState\(false\);/, "const [isSubmitting, setIsSubmitting] = useState(false);\n    const [deleteTarget, setDeleteTarget] = useState(null);\n    const [isDeleting, setIsDeleting] = useState(false);");
code3 = code3.replace(/const handleDeleteTarifa = async \(tarifaId\) => {\n\s*if \(!window\.confirm\('Desea eliminar esta tarifa\?'\)\) return;\n\s*try {/, 
`const handleDeleteTarifa = (tarifaId) => {
    setDeleteTarget(tarifaId);
  };

  const confirmDeleteTarifa = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const tarifaId = deleteTarget;
    try {`);
code3 = code3.replace(/\} catch \(err\) \{\n\s*console\.error\('Error eliminando tarifa:', err\);\n\s*showToast\(err\.response\?\.data\?\.message \|\| 'No se pudo eliminar la tarifa\.', 'error'\);\n\s*\}/, 
`} catch (err) {
      console.error('Error eliminando tarifa:', err);
      showToast(err.response?.data?.message || 'No se pudo eliminar la tarifa.', 'error');
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }`);
code3 = code3.replace(/(<\/div>\s*<\/Modal>\s*\);\s*\})/, `
        <DeleteConfirmationModal
            isOpen={!!deleteTarget}
            onClose={() => setDeleteTarget(null)}
            onCancel={() => setDeleteTarget(null)}
            onConfirm={confirmDeleteTarifa}
            isDeleting={isDeleting}
            title="Confirmar Eliminación"
            subtitle="Esta acción intentará remover la tarifa."
            content={
                <p style={{ color: '#F8FAFC', fontSize: '0.875rem', lineHeight: '1.5', margin: 0 }}>
                    ¿Desea eliminar esta tarifa de forma permanente?
                </p>
            }
            confirmText="Eliminar Tarifa"
        />
        $1`);
fs.writeFileSync(file3, code3, 'utf8');
fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + file3, code3, 'utf8');

console.log("Fixed all!");
