<?php

namespace App\Services\Catalog;

use App\Models\Catalog\Vehiculo;
use App\Models\Catalog\VehiculoAgencia;
use App\Models\Catalog\VehiculoTarifa;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class VehiculoService
{
    /**
     * Get vehicles with relations, filters, sorting and pagination.
     */
    public function getVehiculos(array $filters = [], ?int $perPage = 10): LengthAwarePaginator|Collection
    {
        $query = Vehiculo::with(['agencia.ubicacion', 'tarifas']);

        // Filter by search (marca, modelo/vehiculo, ano, tipo_vehiculo)
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('marca', 'like', $search)
                  ->orWhere('vehiculo', 'like', $search)
                  ->orWhere('ano', 'like', $search)
                  ->orWhere('tipo_vehiculo', 'like', $search);
            });
        }

        // Filter by location (through agency)
        if (!empty($filters['id_ubicacion'])) {
            $idUbicacion = (int) $filters['id_ubicacion'];
            $query->whereHas('agencia', function ($q) use ($idUbicacion) {
                $q->where('id_ubicacion', $idUbicacion);
            });
        }

        // Filter by rental agency
        if (!empty($filters['id_vehiculo_agencia'])) {
            $query->where('id_vehiculo_agencia', (int) $filters['id_vehiculo_agencia']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'marca';
        $sortDir = strtolower($filters['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['id', 'marca', 'vehiculo', 'ano', 'tipo_vehiculo', 'tipo_transmision'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('marca', 'asc')->orderBy('vehiculo', 'asc');
        }

        if ($perPage === null || $perPage <= 0) {
            return $query->get();
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new vehicle, with optional initial tariff.
     */
    public function createVehiculo(array $data): Vehiculo
    {
        return DB::transaction(function () use ($data) {
            $vehiculo = Vehiculo::create([
                'id_vehiculo_agencia' => (int) $data['id_vehiculo_agencia'],
                'marca' => trim($data['marca']),
                'vehiculo' => trim($data['vehiculo']),
                'ano' => trim((string) $data['ano']),
                'tipo_vehiculo' => trim($data['tipo_vehiculo']),
                'tipo_transmision' => trim($data['tipo_transmision']),
                'nota' => isset($data['nota']) ? trim($data['nota']) : null,
            ]);

            // Create initial tariff if cost/price are provided
            if (isset($data['costo'], $data['precio'])) {
                $this->addTarifa($vehiculo, [
                    'desde' => $data['desde'] ?? now()->toDateTimeString(),
                    'hasta' => $data['hasta'] ?? now()->addYear()->toDateTimeString(),
                    'desde_venta' => $data['desde_venta'] ?? now()->toDateTimeString(),
                    'hasta_venta' => $data['hasta_venta'] ?? now()->addYear()->toDateTimeString(),
                    'costo' => (float) $data['costo'],
                    'precio' => (float) $data['precio'],
                    'porcentaje' => isset($data['porcentaje']) ? (float) $data['porcentaje'] : null,
                    'promocion' => isset($data['promocion']) ? (bool) $data['promocion'] : false,
                ]);
            }

            return $vehiculo->load(['agencia.ubicacion', 'tarifas']);
        });
    }

    /**
     * Update an existing vehicle.
     */
    public function updateVehiculo(Vehiculo $vehiculo, array $data): Vehiculo
    {
        return DB::transaction(function () use ($vehiculo, $data) {
            $vehiculo->update([
                'id_vehiculo_agencia' => isset($data['id_vehiculo_agencia']) ? (int) $data['id_vehiculo_agencia'] : $vehiculo->id_vehiculo_agencia,
                'marca' => isset($data['marca']) ? trim($data['marca']) : $vehiculo->marca,
                'vehiculo' => isset($data['vehiculo']) ? trim($data['vehiculo']) : $vehiculo->vehiculo,
                'ano' => isset($data['ano']) ? trim((string) $data['ano']) : $vehiculo->ano,
                'tipo_vehiculo' => isset($data['tipo_vehiculo']) ? trim($data['tipo_vehiculo']) : $vehiculo->tipo_vehiculo,
                'tipo_transmision' => isset($data['tipo_transmision']) ? trim($data['tipo_transmision']) : $vehiculo->tipo_transmision,
                'nota' => array_key_exists('nota', $data) ? ($data['nota'] !== null ? trim($data['nota']) : null) : $vehiculo->nota,
            ]);

            return $vehiculo->fresh(['agencia.ubicacion', 'tarifas']);
        });
    }

    /**
     * Delete a vehicle verifying sales integrity in vehiculo_venta.
     *
     * @throws ValidationException
     */
    public function deleteVehiculo(Vehiculo $vehiculo): bool
    {
        if (DB::getSchemaBuilder()->hasTable('vehiculo_venta')) {
            $salesCount = DB::table('vehiculo_venta')->where('id_vehiculo', $vehiculo->id)->count();
            if ($salesCount > 0) {
                throw ValidationException::withMessages([
                    'vehiculo' => ["No es posible eliminar el vehículo '{$vehiculo->marca} {$vehiculo->vehiculo}' porque tiene {$salesCount} venta(s) asociada(s)."]
                ]);
            }
        }

        return DB::transaction(fn() => $vehiculo->delete());
    }

    /**
     * List rental agencies with optional location filter.
     */
    public function getAgencias(?int $idUbicacion = null): Collection
    {
        $query = VehiculoAgencia::with('ubicacion')->orderBy('agencia', 'asc');

        if ($idUbicacion) {
            $query->where('id_ubicacion', $idUbicacion);
        }

        return $query->get();
    }

    /**
     * Create rental agency.
     */
    public function createAgencia(array $data): VehiculoAgencia
    {
        return DB::transaction(function () use ($data) {
            $agencia = VehiculoAgencia::create([
                'id_ubicacion' => (int) $data['id_ubicacion'],
                'agencia' => trim($data['agencia']),
                'nota' => isset($data['nota']) ? trim($data['nota']) : null,
            ]);

            return $agencia->load('ubicacion');
        });
    }

    /**
     * Update rental agency.
     */
    public function updateAgencia(VehiculoAgencia $agencia, array $data): VehiculoAgencia
    {
        return DB::transaction(function () use ($agencia, $data) {
            $agencia->update([
                'id_ubicacion' => isset($data['id_ubicacion']) ? (int) $data['id_ubicacion'] : $agencia->id_ubicacion,
                'agencia' => isset($data['agencia']) ? trim($data['agencia']) : $agencia->agencia,
                'nota' => array_key_exists('nota', $data) ? ($data['nota'] !== null ? trim($data['nota']) : null) : $agencia->nota,
            ]);

            return $agencia->fresh(['ubicacion']);
        });
    }

    /**
     * Delete rental agency after checking associated vehicle sales.
     *
     * @throws ValidationException
     */
    public function deleteAgencia(VehiculoAgencia $agencia): bool
    {
        if (DB::getSchemaBuilder()->hasTable('vehiculo_venta')) {
            $vehicleIds = $agencia->vehiculos()->pluck('id');
            if ($vehicleIds->isNotEmpty()) {
                $salesCount = DB::table('vehiculo_venta')->whereIn('id_vehiculo', $vehicleIds)->count();
                if ($salesCount > 0) {
                    throw ValidationException::withMessages([
                        'agencia' => ["No es posible eliminar la agencia '{$agencia->agencia}' porque sus vehículos tienen {$salesCount} venta(s) asociada(s)."]
                    ]);
                }
            }
        }

        return DB::transaction(fn() => $agencia->delete());
    }

    /**
     * Add tariff to vehicle.
     */
    public function addTarifa(Vehiculo $vehiculo, array $data): VehiculoTarifa
    {
        $cost = (float) $data['costo'];
        $price = (float) $data['precio'];
        $percentage = isset($data['porcentaje']) ? (float) $data['porcentaje'] : null;

        if ($percentage === null && $cost > 0) {
            $percentage = round((($price - $cost) / $cost) * 100, 2);
        }

        return DB::transaction(function () use ($vehiculo, $data, $cost, $price, $percentage) {
            return VehiculoTarifa::create([
                'id_vehiculo' => $vehiculo->id,
                'desde' => $data['desde'],
                'hasta' => $data['hasta'],
                'desde_venta' => $data['desde_venta'] ?? $data['desde'],
                'hasta_venta' => $data['hasta_venta'] ?? $data['hasta'],
                'costo' => $cost,
                'precio' => $price,
                'porcentaje' => $percentage ?? 0,
                'promocion' => isset($data['promocion']) ? (bool) $data['promocion'] : false,
            ]);
        });
    }

    /**
     * Delete a tariff.
     */
    public function deleteTarifa(VehiculoTarifa $tarifa): bool
    {
        return DB::transaction(fn() => $tarifa->delete());
    }
}
