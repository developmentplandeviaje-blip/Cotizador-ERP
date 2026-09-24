<?php

namespace App\Services\Catalog;

use App\Models\Catalog\Traslado;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class TrasladoService
{
    /**
     * Get transfers with location relation, filters, sorting, and optional pagination.
     */
    public function getTraslados(array $filters = [], ?int $perPage = 10): LengthAwarePaginator|Collection
    {
        $query = Traslado::with('ubicacion');

        // Filter by search query (origin, destination)
        if (!empty($filters['search'])) {
            $search = '%' . trim($filters['search']) . '%';
            $query->where(function ($q) use ($search) {
                $q->where('ruta_origen', 'like', $search)
                  ->orWhere('ruta_destino', 'like', $search)
                  ->orWhereHas('ubicacion', function ($uq) use ($search) {
                      $uq->where('ubicacion', 'like', $search);
                  });
            });
        }

        // Filter by location
        if (!empty($filters['id_ubicacion'])) {
            $query->where('id_ubicacion', (int) $filters['id_ubicacion']);
        }

        // Filter by service type (privado / compartido)
        if (!empty($filters['tipo_servicio'])) {
            $query->where('tipo_servicio', trim($filters['tipo_servicio']));
        }

        // Sorting
        $sortBy = $filters['sort_by'] ?? 'ruta_origen';
        $sortDir = strtolower($filters['sort_dir'] ?? 'asc') === 'desc' ? 'desc' : 'asc';

        $allowedSorts = ['id', 'ruta_origen', 'ruta_destino', 'id_ubicacion', 'tipo_servicio', 'costo', 'precio_publico'];
        if (in_array($sortBy, $allowedSorts, true)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('ruta_origen', 'asc')->orderBy('ruta_destino', 'asc');
        }

        // Unpaginated if perPage is null or <= 0
        if ($perPage === null || $perPage <= 0) {
            return $query->get();
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new transfer.
     */
    public function createTraslado(array $data): Traslado
    {
        return DB::transaction(function () use ($data) {
            $traslado = Traslado::create([
                'id_ubicacion' => (int) $data['id_ubicacion'],
                'ruta_origen' => trim($data['ruta_origen']),
                'ruta_destino' => trim($data['ruta_destino']),
                'costo' => (float) $data['costo'],
                'precio_publico' => (float) $data['precio_publico'],
                'tipo_servicio' => trim($data['tipo_servicio'] ?? 'privado'),
            ]);

            return $traslado->load('ubicacion');
        });
    }

    /**
     * Update an existing transfer.
     */
    public function updateTraslado(Traslado $traslado, array $data): Traslado
    {
        return DB::transaction(function () use ($traslado, $data) {
            $traslado->update([
                'id_ubicacion' => isset($data['id_ubicacion']) ? (int) $data['id_ubicacion'] : $traslado->id_ubicacion,
                'ruta_origen' => isset($data['ruta_origen']) ? trim($data['ruta_origen']) : $traslado->ruta_origen,
                'ruta_destino' => isset($data['ruta_destino']) ? trim($data['ruta_destino']) : $traslado->ruta_destino,
                'costo' => isset($data['costo']) ? (float) $data['costo'] : $traslado->costo,
                'precio_publico' => isset($data['precio_publico']) ? (float) $data['precio_publico'] : $traslado->precio_publico,
                'tipo_servicio' => isset($data['tipo_servicio']) ? trim($data['tipo_servicio']) : $traslado->tipo_servicio,
            ]);

            return $traslado->fresh(['ubicacion']);
        });
    }

    /**
     * Delete a transfer verifying foreign key safety with traslado_venta.
     *
     * @throws ValidationException
     */
    public function deleteTraslado(Traslado $traslado): bool
    {
        $salesCount = $traslado->ventasCount();
        if ($salesCount > 0) {
            throw ValidationException::withMessages([
                'traslado' => ["No es posible eliminar el traslado '{$traslado->ruta_origen} - {$traslado->ruta_destino}' porque tiene {$salesCount} venta(s) asociada(s)."]
            ]);
        }

        return DB::transaction(fn() => $traslado->delete());
    }
}
