const fs = require('fs');

// Fix DescuentoMasivoModal
let f1 = 'react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx';
let c1 = fs.readFileSync(f1, 'utf8');
c1 = c1.replace(/\} \n        \} catch \(err\) \{\n            \n            console\.error\('Error desactivando descuento masivo', err\);\n            const errMsg = err\.response\?\.data\?\.message \|\| err\.response\?\.data\?\.error \|\| err\.message;\n            showToast\('Error desactivando el descuento masivo: ' \+ errMsg, 'error'\);\n        \} finally \{\n            setIsSubmitting\(false\);\n        \n        \} finally \{\n            setConfirmAction\(false\);\n            setIsSubmitting\(false\);\n        \}/g, 
`        } catch (err) {
            console.error('Error desactivando descuento masivo', err);
            const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
            showToast('Error desactivando el descuento masivo: ' + errMsg, 'error');
        } finally {
            setConfirmAction(false);
            setIsSubmitting(false);
        }`);
fs.writeFileSync(f1, c1, 'utf8');
fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + f1, c1, 'utf8');

// Fix VehiculoTarifasModal
let f2 = 'react-frontend/src/components/catalog/vehiculos/VehiculoTarifasModal.jsx';
let c2 = fs.readFileSync(f2, 'utf8');
c2 = c2.replace(/\} \n        \} catch \(err\) \{\n            \n        console\.error\('Error eliminando tarifa:', err\);\n        showToast\(err\.response\?\.data\?\.message \|\| 'No se pudo eliminar la tarifa\.', 'error'\);\n      \n        \} finally \{\n            setIsDeleting\(false\);\n            setDeleteTarget\(null\);\n        \}/g,
`        } catch (err) {
            console.error('Error eliminando tarifa:', err);
            showToast(err.response?.data?.message || 'No se pudo eliminar la tarifa.', 'error');
        } finally {
            setIsDeleting(false);
            setDeleteTarget(null);
        }`);
fs.writeFileSync(f2, c2, 'utf8');
fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + f2, c2, 'utf8');

