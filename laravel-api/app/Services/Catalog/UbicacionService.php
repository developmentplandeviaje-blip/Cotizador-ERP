<?php

namespace App\Services\Catalog;

use App\Models\Catalog\Ubicacion;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class UbicacionService
{
    /**
     * Get list of ubicaciones with filters, sorting, and optional pagination.
     */
    public function getUbicaciones(array $filters = [], ?int $perPage = 10): LengthAwarePaginator|Collection
    {
        $query = Ubicacion::withCount('hoteles');

        // Search by location name
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where('ubicacion', 'like', $search);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'ubicacion';
        $sortDir = strtolower($filters['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['id', 'ubicacion', 'hoteles_count', 'date_creation'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('ubicacion', 'asc');
        }

        // If perPage is null or 0, return all (for dropdowns)
        if ($perPage === null || $perPage <= 0) {
            return $query->get();
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new ubicacion.
     */
    public function createUbicacion(array $data): Ubicacion
    {
        return DB::transaction(function () use ($data) {
            return Ubicacion::create([
                'ubicacion' => trim($data['ubicacion']),
            ]);
        });
    }

    /**
     * Update an existing ubicacion.
     */
    public function updateUbicacion(Ubicacion $ubicacion, array $data): Ubicacion
    {
        return DB::transaction(function () use ($ubicacion, $data) {
            $ubicacion->update([
                'ubicacion' => trim($data['ubicacion']),
            ]);
            return $ubicacion->fresh(['hoteles']);
        });
    }

    /**
     * Delete an ubicacion with referential integrity verification.
     *
     * @throws ValidationException
     */
    public function deleteUbicacion(Ubicacion $ubicacion): bool
    {
        // 1. Verify associated hotels
        $hotelesCount = $ubicacion->hoteles()->count();
        if ($hotelesCount > 0) {
            throw ValidationException::withMessages([
                'ubicacion' => ["No es posible eliminar la ubicación '{$ubicacion->ubicacion}' porque tiene {$hotelesCount} hotel(es) asociado(s)."]
            ]);
        }

        // 2. Verify other entities if tables exist
        $otherTables = ['excursion', 'paquete', 'traslado', 'vehiculo_agencia'];
        foreach ($otherTables as $table) {
            if (DB::getSchemaBuilder()->hasTable($table)) {
                $count = DB::table($table)->where('id_ubicacion', $ubicacion->id)->count();
                if ($count > 0) {
                    throw ValidationException::withMessages([
                        'ubicacion' => ["No es posible eliminar la ubicación '{$ubicacion->ubicacion}' porque tiene registros asociados en {$table}."]
                    ]);
                }
            }
        }

        return DB::transaction(fn() => $ubicacion->delete());
    }
}
