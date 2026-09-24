const fs = require('fs');

let code = fs.readFileSync('react-frontend/src/components/catalog/traslados/TrasladoModal.jsx', 'utf8');

// 1. Remove validation
code = code.replace(/if \(!rutaDestino\.trim\(\)\) {[\s\S]*?return;\n\s*}/g, "");

// 2. Remove the JSX div for rutaDestino
code = code.replace(/<div>\s*<label className="erp-label">\s*Ruta \/ Punto de Destino[\s\S]*?<\/div>/g, "");

// 3. Fix grid columns from '1fr 1fr' to '1fr' for the Route section since there is only one input now
code = code.replace(/<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>(\s*<div>\s*<label className="erp-label">\s*Ruta \/ Punto de Origen)/, "<div style={{ marginBottom: '16px' }}>$1");

// 4. Change label "Ruta / Punto de Origen" to "Descripción del Traslado (Ruta)"
code = code.replace("Ruta / Punto de Origen", "Descripci\\u00f3n del Traslado (Ruta)");
code = code.replace("Ej: Aeropuerto Internacional PMV...", "Ej: Aeropuerto / Hotel 15- 20 Pax-- Hotel / Aeropuerto");

// 5. Remove '|| !rutaDestino.trim()' from the submit button disabled state
code = code.replace(/\|\| !rutaDestino\.trim\(\) /g, "");

fs.writeFileSync('react-frontend/src/components/catalog/traslados/TrasladoModal.jsx', code, 'utf8');
console.log("Fixed Modal");
