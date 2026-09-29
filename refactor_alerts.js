const fs = require('fs');
const path = require('path');

const files = [
  'react-frontend/src/components/catalog/hotels/DescuentoMasivoModal.jsx',
  'react-frontend/src/components/catalog/hotels/HabitacionDetail.jsx',
  'react-frontend/src/components/catalog/hotels/HotelModal.jsx',
  'react-frontend/src/components/catalog/hotels/TarifaModal.jsx',
  'react-frontend/src/components/catalog/vehiculos/VehiculoAgenciaModal.jsx',
  'react-frontend/src/components/catalog/vehiculos/VehiculoTarifasModal.jsx'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    let code = fs.readFileSync(file, 'utf8');
    
    // Check if we need to add the import
    if (code.includes('alert(') && !code.includes('showToast')) {
      // Find relative path to utils/toast
      const depth = file.split('/').length - 3; // react-frontend/src = 2 levels.
      let relativePath = '../../';
      if (file.includes('vehiculos')) relativePath = '../../';
      if (file.includes('hotels')) relativePath = '../../';
      // actually, from catalog/hotels to utils/toast:
      // catalog/hotels is 2 levels deep from components. components is 1 level from src.
      // src/components/catalog/hotels -> src/utils/toast
      // ../../../utils/toast
      relativePath = '../../../utils/toast';
      
      code = code.replace(/(import React.*?;\n|import \{.*?\}.*?;\n)/, `$1import { showToast } from '${relativePath}';\n`);
    }

    // Replace alert(`...`) and alert('...')
    // We can use a regex that matches alert(...)
    let match;
    const regex = /alert\((.*?)\)/g;
    
    code = code.replace(regex, (fullMatch, p1) => {
      // Try to determine type
      let type = 'warning';
      const lower = p1.toLowerCase();
      if (lower.includes('éxito') || lower.includes('exito') || lower.includes('correctamente') || lower.includes('exitosa')) {
        type = 'success';
      } else if (lower.includes('error') || lower.includes('no se pudo')) {
        type = 'error';
      }
      
      return `showToast(${p1}, '${type}')`;
    });

    fs.writeFileSync(file, code, 'utf8');
    console.log("Refactored alerts in", file);
  }
});
