<?php

namespace App\Services\Catalog;

use App\Models\Catalog\Excursion;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ExcursionService
{
    /**
     * Get excursions with filters, location relation, sorting, and optional pagination.
     */
    public function getExcursiones(array $filters = [], ?int $perPage = 10): LengthAwarePaginator|Collection
    {
        $query = Excursion::with('ubicacion');

        // Filter by search query (tipo_excursion)
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where('tipo_excursion', 'like', $search);
        }

        // Filter by location
        if (!empty($filters['id_ubicacion'])) {
            $query->where('id_ubicacion', (int) $filters['id_ubicacion']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'tipo_excursion';
        $sortDir = strtolower($filters['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['id', 'tipo_excursion', 'id_ubicacion', 'precio_adulto', 'precio_nino', 'date_creation'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('tipo_excursion', 'asc');
        }

        // Unpaginated if perPage is null or <= 0
        if ($perPage === null || $perPage <= 0) {
            return $query->get();
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new excursion.
     */
    public function createExcursion(array $data): Excursion
    {
        $this->computeMarginsIfMissing($data);

        return DB::transaction(function () use ($data) {
            $excursion = Excursion::create([
                'id_ubicacion' => (int) $data['id_ubicacion'],
                'tipo_excursion' => trim($data['tipo_excursion']),
                'costo_adulto' => (float) $data['costo_adulto'],
                'costo_nino' => (float) $data['costo_nino'],
                'precio_adulto' => (float) $data['precio_adulto'],
                'precio_nino' => (float) $data['precio_nino'],
                'porcentaje_adulto' => isset($data['porcentaje_adulto']) ? (float) $data['porcentaje_adulto'] : null,
                'porcentaje_nino' => isset($data['porcentaje_nino']) ? (float) $data['porcentaje_nino'] : null,
                'aplica_descuento_referidos' => isset($data['aplica_descuento_referidos'])
                    ? (bool) $data['aplica_descuento_referidos']
                    : false,
            ]);

            return $excursion->load('ubicacion');
        });
    }

    /**
     * Update an existing excursion.
     */
    public function updateExcursion(Excursion $excursion, array $data): Excursion
    {
        $this->computeMarginsIfMissing($data);

        return DB::transaction(function () use ($excursion, $data) {
            $excursion->update([
                'id_ubicacion' => isset($data['id_ubicacion']) ? (int) $data['id_ubicacion'] : $excursion->id_ubicacion,
                'tipo_excursion' => isset($data['tipo_excursion']) ? trim($data['tipo_excursion']) : $excursion->tipo_excursion,
                'costo_adulto' => isset($data['costo_adulto']) ? (float) $data['costo_adulto'] : $excursion->costo_adulto,
                'costo_nino' => isset($data['costo_nino']) ? (float) $data['costo_nino'] : $excursion->costo_nino,
                'precio_adulto' => isset($data['precio_adulto']) ? (float) $data['precio_adulto'] : $excursion->precio_adulto,
                'precio_nino' => isset($data['precio_nino']) ? (float) $data['precio_nino'] : $excursion->precio_nino,
                'porcentaje_adulto' => array_key_exists('porcentaje_adulto', $data)
                    ? ($data['porcentaje_adulto'] !== null ? (float) $data['porcentaje_adulto'] : null)
                    : $excursion->porcentaje_adulto,
                'porcentaje_nino' => array_key_exists('porcentaje_nino', $data)
                    ? ($data['porcentaje_nino'] !== null ? (float) $data['porcentaje_nino'] : null)
                    : $excursion->porcentaje_nino,
                'aplica_descuento_referidos' => array_key_exists('aplica_descuento_referidos', $data)
                    ? (bool) $data['aplica_descuento_referidos']
                    : $excursion->aplica_descuento_referidos,
            ]);

            return $excursion->fresh(['ubicacion']);
        });
    }

    /**
     * Delete an excursion verifying foreign key safety with excursion_venta.
     *
     * @throws ValidationException
     */
    public function deleteExcursion(Excursion $excursion): bool
    {
        if (DB::getSchemaBuilder()->hasTable('excursion_venta')) {
            $salesCount = DB::table('excursion_venta')->where('id_excursion', $excursion->id)->count();
            if ($salesCount > 0) {
                throw ValidationException::withMessages([
                    'excursion' => ["No es posible eliminar la excursión '{$excursion->tipo_excursion}' porque tiene {$salesCount} venta(s) asociada(s)."]
                ]);
            }
        }

        return DB::transaction(fn() => $excursion->delete());
    }

    /**
     * Helper to compute margin percentages if cost and price are given without margin.
     */
    private function computeMarginsIfMissing(array &$data): void
    {
        if (!isset($data['porcentaje_adulto']) && isset($data['costo_adulto'], $data['precio_adulto'])) {
            $cost = (float) $data['costo_adulto'];
            $price = (float) $data['precio_adulto'];
            if ($cost > 0) {
                $data['porcentaje_adulto'] = round((($price - $cost) / $cost) * 100, 2);
            }
        }

        if (!isset($data['porcentaje_nino']) && isset($data['costo_nino'], $data['precio_nino'])) {
            $cost = (float) $data['costo_nino'];
            $price = (float) $data['precio_nino'];
            if ($cost > 0) {
                $data['porcentaje_nino'] = round((($price - $cost) / $cost) * 100, 2);
            }
        }
    }
}
