const fs = require('fs');

let file_path = 'react-frontend/src/components/catalog/traslados/TrasladoModal.jsx';
let content = fs.readFileSync(file_path, 'utf-8');

// Fix literal unicode
content = content.replace('Descripci\\u00f3n', 'Descripción');

// Replace radio buttons Privado/Compartido to Solo Ida/Ida y Vuelta
content = content.replace(/value="privado"\s+checked=\{tipoServicio === 'privado'\}/g, "value=\"Solo Ida\"\n                  checked={tipoServicio === 'Solo Ida'}");
content = content.replace(/>\s*Privado\s*<\/label>/g, ">\n                Solo Ida\n              </label>");

content = content.replace(/value="compartido"\s+checked=\{tipoServicio === 'compartido'\}/g, "value=\"Ida y Vuelta\"\n                  checked={tipoServicio === 'Ida y Vuelta'}");
content = content.replace(/>\s*Compartido\s*<\/label>/g, ">\n                Ida y Vuelta\n              </label>");

// Replace setTipoServicio default parameter if still there
content = content.replace(/setTipoServicio\(trasladoToEdit\.tipo_servicio \|\| 'privado'\);/g, "setTipoServicio(trasladoToEdit.tipo_servicio || 'Solo Ida');");

// Fix initial states
content = content.replace(/setTipoServicio\('privado'\)/g, "setTipoServicio('Solo Ida')");
content = content.replace(/useState\('privado'\)/g, "useState('Solo Ida')");

fs.writeFileSync(file_path, content, 'utf-8');
console.log("Modal fixed");
