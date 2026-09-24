<?php

namespace App\Services\Catalog;

use App\Models\Catalog\Aerolinea;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class AerolineaService
{
    /**
     * Get list of airlines with filters, sorting, and optional pagination.
     */
    public function getAerolineas(array $filters = [], ?int $perPage = 10): LengthAwarePaginator|Collection
    {
        $query = Aerolinea::query();

        if (DB::getSchemaBuilder()->hasTable('vuelo_venta')) {
            $query->select('aerolinea.*')
                  ->selectSub(
                      DB::table('vuelo_venta')
                          ->selectRaw('count(*)')
                          ->whereColumn('vuelo_venta.id_aerolinea', 'aerolinea.id'),
                      'vuelos_count'
                  );
        }

        // Search by airline name
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where('nombre', 'like', $search);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'nombre';
        $sortDir = strtolower($filters['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['id', 'nombre', 'vuelos_count', 'date_creation'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('nombre', 'asc');
        }

        // If perPage is null or 0, return all (for dropdowns)
        if ($perPage === null || $perPage <= 0) {
            return $query->get();
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new airline.
     */
    public function createAerolinea(array $data): Aerolinea
    {
        return DB::transaction(function () use ($data) {
            return Aerolinea::create([
                'nombre' => trim($data['nombre']),
            ]);
        });
    }

    /**
     * Update an existing airline.
     */
    public function updateAerolinea(Aerolinea $aerolinea, array $data): Aerolinea
    {
        return DB::transaction(function () use ($aerolinea, $data) {
            $aerolinea->update([
                'nombre' => trim($data['nombre']),
            ]);
            return $aerolinea->fresh();
        });
    }

    /**
     * Delete an airline verifying foreign key safety with vuelo_venta.
     *
     * @throws ValidationException
     */
    public function deleteAerolinea(Aerolinea $aerolinea): bool
    {
        $vuelosCount = $aerolinea->vuelosCount();
        if ($vuelosCount > 0) {
            throw ValidationException::withMessages([
                'aerolinea' => ["No es posible eliminar la aerolínea '{$aerolinea->nombre}' porque tiene {$vuelosCount} venta(s) de vuelo asociada(s)."]
            ]);
        }

        return DB::transaction(fn() => $aerolinea->delete());
    }
}
