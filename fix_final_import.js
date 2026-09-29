const fs = require('fs');
const file = 'react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx';
let c = fs.readFileSync(file, 'utf8');
if (!c.includes('import DeleteConfirmationModal')) {
    c = c.replace(/import Modal from '..\/..\/common\/Modal';/, "import Modal from '../../common/Modal';\nimport DeleteConfirmationModal from '../../common/DeleteConfirmationModal';");
    fs.writeFileSync(file, c, 'utf8');
    fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + file, c, 'utf8');
    console.log('Added missing import to DescuentoMasivoModal.jsx!');
}
