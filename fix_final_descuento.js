const fs = require('fs');
const file = 'react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx';
let code = fs.readFileSync(file, 'utf8');

// The file currently has:
// const handleDeactivate = async () => {
//    if(confirmAction) return executeDeactivate();
//    if (!ubicacionId) {
//        showToast('Seleccione una ubicación válida', 'warning');
//        return;
//    }
//
//    if (!window.confirm('¿Está seguro que desea desactivar todos los descuentos para esta ubicación?')) {
//        return;
//    }
//
//    setIsSubmitting(true);
//    try { ... } catch (err) { ... } finally { ... }
// };

// I will extract the logic inside handleDeactivate to executeDeactivate and make handleDeactivate just check ubicacionId and setConfirmAction(true).

const handleDeactivateBlockRegex = /const handleDeactivate = async \(\) => \{[\s\S]*?\};/;

const newLogic = `
    const handleDeactivate = () => {
        if (!ubicacionId) {
            showToast('Seleccione una ubicación válida', 'warning');
            return;
        }
        setConfirmAction(true);
    };

    const executeDeactivate = async () => {
        setIsSubmitting(true);
        try {
            const payload = {
                tipo_descuento: tipoDescuento,
                porcentaje: 0,
                ubicacion_id: ubicacionId,
            };

            const res = await axios.post('/v1/catalog/hoteles/descuento-masivo', payload);
            showToast(\`Éxito: \${res.data.message || 'Descuentos desactivados correctamente'}\`, 'success');
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Error desactivando descuento masivo', err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            showToast('Error desactivando el descuento masivo: ' + errMsg, 'error');
        } finally {
            setIsSubmitting(false);
            setConfirmAction(false);
        }
    };
`;

code = code.replace(handleDeactivateBlockRegex, newLogic.trim());

fs.writeFileSync(file, code, 'utf8');
fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + file, code, 'utf8');

console.log("Fixed finally!");
