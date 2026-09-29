const fs = require('fs');
const file = 'laravel-api/app/Services/Catalog/UbicacionService.php';
let code = fs.readFileSync(file, 'utf8');

// replace withCount('hoteles') with all 5 tables
code = code.replace(/Ubicacion::withCount\('hoteles'\);/, "Ubicacion::withCount(['hoteles', 'excursiones', 'traslados', 'paquetes', 'vehiculoAgencias']);");

fs.writeFileSync(file, code, 'utf8');
console.log("Updated UbicacionService.php");
