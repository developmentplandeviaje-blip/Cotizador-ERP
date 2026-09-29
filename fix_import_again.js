const fs = require('fs');

const files = [
  'react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx',
  'react-frontend/src/components/catalog/vehiculos/VehiculoAgenciaModal.jsx',
  'react-frontend/src/components/catalog/vehiculos/VehiculoTarifasModal.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    if (!code.includes('DeleteConfirmationModal')) {
      code = code.replace(/import Modal from '..\/..\/common\/Modal';(\r?\n)/, "import Modal from '../../common/Modal';$1import DeleteConfirmationModal from '../../common/DeleteConfirmationModal';$1");
      fs.writeFileSync(file, code, 'utf8');
      fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + file, code, 'utf8');
      console.log("Added import to", file);
    }
  }
});
