const fs = require('fs');
const file = 'laravel-api/app/Http/Resources/Catalog/UbicacionResource.php';
let code = fs.readFileSync(file, 'utf8');

// find the hoteles_count line
const oldLine = "'hoteles_count' => $this->hoteles_count ?? ($this->relationLoaded('hoteles') ? $this->hoteles->count() : 0),";
const newLine = `'hoteles_count' => 
                ($this->hoteles_count ?? 0) + 
                ($this->excursiones_count ?? 0) + 
                ($this->traslados_count ?? 0) + 
                ($this->paquetes_count ?? 0) + 
                ($this->vehiculo_agencias_count ?? 0),`;

if (code.includes(oldLine)) {
  code = code.replace(oldLine, newLine);
  fs.writeFileSync(file, code, 'utf8');
  console.log("Updated UbicacionResource.php");
} else {
  console.log("Could not find oldLine in UbicacionResource");
}
