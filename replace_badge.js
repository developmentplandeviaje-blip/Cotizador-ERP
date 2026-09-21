const fs = require('fs');

let code = fs.readFileSync('react-frontend/src/components/catalog/ubicaciones/UbicacionList.jsx', 'utf8');

const target = "<Badge variant={item.hoteles_count > 0 ? 'success' : 'neutral'}>";
const replacement = "<Badge variant={item.hoteles_count > 0 ? 'success' : 'neutral'} style={{ minWidth: '85px' }}>";

code = code.replace(target, replacement);

fs.writeFileSync('react-frontend/src/components/catalog/ubicaciones/UbicacionList.jsx', code, 'utf8');
console.log("Done");
