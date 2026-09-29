const fs = require('fs');
const file = 'laravel-api/app/Services/Catalog/UbicacionService.php';
let code = fs.readFileSync(file, 'utf8');

// The allowedSorts logic
const sortingLogic = `        // Sorting
        $sortBy = $filters['sort_by'] ?? 'ubicacion';
        $sortDir = strtolower($filters['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['id', 'ubicacion', 'hoteles_count', 'date_creation'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('ubicacion', 'asc');
        }`;

const newSortingLogic = `        // Sorting
        $sortBy = $filters['sort_by'] ?? 'ubicacion';
        $sortDir = strtolower($filters['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        if ($sortBy === 'hoteles_count' || $sortBy === 'servicios_count') {
            // Order by the sum of all counts
            $query->orderByRaw('(hoteles_count + excursiones_count + traslados_count + paquetes_count + vehiculo_agencias_count) ' . $sortDir);
        } else {
            $allowedSorts = ['id', 'ubicacion', 'date_creation'];
            if (in_array($sortBy, $allowedSorts, true)) {
                $query->orderBy($sortBy, $sortDir);
            } else {
                $query->orderBy('ubicacion', 'asc');
            }
        }`;

code = code.replace(sortingLogic, newSortingLogic);
fs.writeFileSync(file, code, 'utf8');
console.log("Updated UbicacionService.php sorting");
