const fs = require('fs');
const file = 'react-frontend/src/components/catalog/vehiculos/VehiculoTarifasModal.jsx';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('DeleteConfirmationModal')) {
    code = code.replace(/import Modal from '..\/..\/common\/Modal';\n/, "import Modal from '../../common/Modal';\nimport DeleteConfirmationModal from '../../common/DeleteConfirmationModal';\n");
}

if (!code.includes('deleteTarget')) {
    code = code.replace(/const \[isSubmitting, setIsSubmitting\] = useState\(false\);/, "const [isSubmitting, setIsSubmitting] = useState(false);\n    const [deleteTarget, setDeleteTarget] = useState(null);\n    const [isDeleting, setIsDeleting] = useState(false);");

    const handleRegex = /const handleDeleteTarifa = async \(tarifaId\) => \{\s+if \(!window\.confirm\('.*?'\)\) return;\s+try \{([\s\S]*?)catch \(err\) \{([\s\S]*?)\}\s+\};\s+/;

    code = code.replace(handleRegex, `const handleDeleteTarifa = (tarifaId) => {
        setDeleteTarget(tarifaId);
    };

    const confirmDeleteTarifa = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        const tarifaId = deleteTarget;
        try {
            $1
        } catch (err) {
            $2
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }
    };
`);

    code = code.replace(/(<\/div>\s*<\/Modal>\s*\);\s*\})/, `
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

    fs.writeFileSync(file, code, 'utf8');
    fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + file, code, 'utf8');
    console.log("Fixed VehiculoTarifasModal.jsx");
}
