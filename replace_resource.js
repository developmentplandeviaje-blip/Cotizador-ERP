const fs = require('fs');

let code = fs.readFileSync('laravel-api/app/Http/Resources/Catalog/ExcursionResource.php', 'utf8');

code = code.replace(
    "'aplica_descuento_referidos' => (bool) $this->aplica_descuento_referidos,",
    "'aplica_descuento_referidos' => (bool) $this->aplica_descuento_referidos,\n            'tasa_portuaria_status' => (bool) $this->tasa_portuaria_status,\n            'tasa_portuaria_monto' => $this->tasa_portuaria_monto !== null ? (float) $this->tasa_portuaria_monto : null,"
);

fs.writeFileSync('laravel-api/app/Http/Resources/Catalog/ExcursionResource.php', code, 'utf8');
console.log("Done");
