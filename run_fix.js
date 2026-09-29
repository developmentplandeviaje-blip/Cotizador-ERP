const fs = require('fs'); 
const files = ['react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx', 'react-frontend/src/components/catalog/vehiculos/VehiculoAgenciaModal.jsx', 'react-frontend/src/components/catalog/vehiculos/VehiculoTarifasModal.jsx']; 
files.forEach(f => { 
  let c = fs.readFileSync(f, 'utf8'); 
  if (!c.includes('import DeleteConfirmationModal')) { 
    c = c.replace(/import Modal from '..\/..\/common\/Modal';/, "import Modal from '../../common/Modal';\nimport DeleteConfirmationModal from '../../common/DeleteConfirmationModal';"); 
    fs.writeFileSync(f, c, 'utf8'); 
    fs.writeFileSync('C:\\xampp\\htdocs\\Cotizador-ERP\\' + f, c, 'utf8'); 
    console.log('Fixed ' + f); 
  } 
});
