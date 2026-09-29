const fs = require('fs');
const file = 'laravel-api/app/Models/Catalog/Ubicacion.php';
let code = fs.readFileSync(file, 'utf8');

if (!code.includes('public function paquetes()')) {
    code = code.replace(/}$/, `
    public function paquetes(): HasMany
    {
        return $this->hasMany(Paquete::class, 'id_ubicacion');
    }

    public function vehiculoAgencias(): HasMany
    {
        return $this->hasMany(VehiculoAgencia::class, 'id_ubicacion');
    }
}`);
    fs.writeFileSync(file, code, 'utf8');
    console.log("Updated Ubicacion.php");
}
