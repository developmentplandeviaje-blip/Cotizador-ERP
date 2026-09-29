const fs = require('fs');
let c = fs.readFileSync('react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx', 'utf8');
c = c.replace(/showToast\(\`.*?res\.data\.message \|\| 'Descuentos actualizados correctamente'\}\`, 'success'\);/g, "showToast(`Éxito: ${res.data.message || 'Descuentos actualizados correctamente'}`, 'success');");
c = c.replace(/showToast\(\`.*?res\.data\.message \|\| 'Descuentos desactivados correctamente'\}\`, 'success'\);/g, "showToast(`Éxito: ${res.data.message || 'Descuentos desactivados correctamente'}`, 'success');");
c = c.replace(/showToast\('Seleccione una ubicaci.*?n v.*?lida'/g, "showToast('Seleccione una ubicación válida'");
fs.writeFileSync('react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx', c);
