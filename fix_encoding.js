const fs = require('fs');
const file = 'react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx';
let code = fs.readFileSync(file, 'utf8');
code = code.replace(/%xito:/g, "Éxito:");
code = code.replace(/xito:/g, "Éxito:");
fs.writeFileSync(file, code, 'utf8');
