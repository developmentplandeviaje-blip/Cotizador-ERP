const fs = require('fs');
let file_path = 'react-frontend/src/components/catalog/traslados/TrasladoList.jsx';
let content = fs.readFileSync(file_path, 'utf-8');

// Replace dropdown options
content = content.replace(/value="privado"/g, "value=\"Solo Ida\"");
content = content.replace(/>\s*Privado\s*<\/option>/g, ">\n                Solo Ida\n              </option>");
content = content.replace(/value="compartido"/g, "value=\"Ida y Vuelta\"");
content = content.replace(/>\s*Compartido\s*<\/option>/g, ">\n                Ida y Vuelta\n              </option>");

// Replace Badge variant logic
content = content.replace(/item\.tipo_servicio === 'privado'/g, "item.tipo_servicio === 'Solo Ida'");

fs.writeFileSync(file_path, content, 'utf-8');
console.log("List fixed");
