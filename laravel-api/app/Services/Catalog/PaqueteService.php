<?php

namespace App\Services\Catalog;

use App\Models\Catalog\Paquete;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaqueteService
{
    /**
     * Get paquetes with filters, location relation, sorting, and optional pagination.
     */
    public function getPaquetes(array $filters = [], ?int $perPage = 10): LengthAwarePaginator|Collection
    {
        $query = Paquete::with('ubicacion');

        // Filter by search query (paquete)
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where('paquete', 'like', $search);
        }

        // Filter by location
        if (!empty($filters['id_ubicacion'])) {
            $query->where('id_ubicacion', (int) $filters['id_ubicacion']);
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'paquete';
        $sortDir = strtolower($filters['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['id', 'paquete', 'id_ubicacion', 'precio_adulto', 'precio_nino', 'date_creation'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('paquete', 'asc');
        }

        // Unpaginated if perPage is null or <= 0
        if ($perPage === null || $perPage <= 0) {
            return $query->get();
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new paquete.
     */
    public function createPaquete(array $data): Paquete
    {
        $this->computeMarginsIfMissing($data);

        return DB::transaction(function () use ($data) {
            $paquete = Paquete::create([
                'id_ubicacion' => (int) $data['id_ubicacion'],
                'paquete' => trim($data['paquete']),
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

            return $paquete->load('ubicacion');
        });
    }

    /**
     * Update an existing paquete.
     */
    public function updatePaquete(Paquete $paquete, array $data): Paquete
    {
        $this->computeMarginsIfMissing($data);

        return DB::transaction(function () use ($paquete, $data) {
            $paquete->update([
                'id_ubicacion' => isset($data['id_ubicacion']) ? (int) $data['id_ubicacion'] : $paquete->id_ubicacion,
                'paquete' => isset($data['paquete']) ? trim($data['paquete']) : $paquete->paquete,
                'costo_adulto' => isset($data['costo_adulto']) ? (float) $data['costo_adulto'] : $paquete->costo_adulto,
                'costo_nino' => isset($data['costo_nino']) ? (float) $data['costo_nino'] : $paquete->costo_nino,
                'precio_adulto' => isset($data['precio_adulto']) ? (float) $data['precio_adulto'] : $paquete->precio_adulto,
                'precio_nino' => isset($data['precio_nino']) ? (float) $data['precio_nino'] : $paquete->precio_nino,
                'porcentaje_adulto' => array_key_exists('porcentaje_adulto', $data)
                    ? ($data['porcentaje_adulto'] !== null ? (float) $data['porcentaje_adulto'] : null)
                    : $paquete->porcentaje_adulto,
                'porcentaje_nino' => array_key_exists('porcentaje_nino', $data)
                    ? ($data['porcentaje_nino'] !== null ? (float) $data['porcentaje_nino'] : null)
                    : $paquete->porcentaje_nino,
                'aplica_descuento_referidos' => array_key_exists('aplica_descuento_referidos', $data)
                    ? (bool) $data['aplica_descuento_referidos']
                    : $paquete->aplica_descuento_referidos,
            ]);

            return $paquete->fresh(['ubicacion']);
        });
    }

    /**
     * Delete a paquete verifying foreign key safety with paquete_venta.
     *
     * @throws ValidationException
     */
    public function deletePaquete(Paquete $paquete): bool
    {
        if (DB::getSchemaBuilder()->hasTable('paquete_venta')) {
            $salesCount = DB::table('paquete_venta')->where('id_paquete', $paquete->id)->count();
            if ($salesCount > 0) {
                throw ValidationException::withMessages([
                    'paquete' => ["No es posible eliminar el paquete '{$paquete->paquete}' porque tiene {$salesCount} venta(s) asociada(s)."]
                ]);
            }
        }

        return DB::transaction(fn() => $paquete->delete());
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
