const fs = require('fs');
const file = 'react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx';
let c = fs.readFileSync(file, 'utf8');
if (!c.includes('import { showToast }')) {
    c = c.replace(/import Modal from '..\/..\/common\/Modal';/, "import Modal from '../../common/Modal';\nimport { showToast } from '../../../utils/toast';");
    fs.writeFileSync(file, c, 'utf8');
    fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + file, c, 'utf8');
    console.log('Added showToast import to DescuentoMasivoModal.jsx!');
}
