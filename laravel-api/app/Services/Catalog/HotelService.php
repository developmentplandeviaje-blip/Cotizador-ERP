<?php

namespace App\Services\Catalog;

use App\Models\Catalog\Hotel;
use App\Models\Catalog\HabitacionHotel;
use App\Models\Catalog\TarifaHabitacion;
use App\Models\Catalog\HotelReglaComercial;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;

class HotelService
{
    /**
     * Get paginated hotels with search and filter parameters.
     */
    public function getHotels(array $filters = [], int $perPage = 10): LengthAwarePaginator
    {
        $query = Hotel::with(['ubicacion', 'habitaciones.tarifas', 'reglasComerciales'])
            ->orderBy('nombre', 'asc');

        if (!empty($filters['search'])) {
            $search = '%' . $filters['search'] . '%';
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'like', $search)
                    ->orWhere('tipo', 'like', $search)
                    ->orWhereHas('ubicacion', function ($uq) use ($search) {
                        $uq->where('ubicacion', 'like', $search);
                    });
            });
        }

        if (isset($filters['id_ubicacion']) && $filters['id_ubicacion'] !== '') {
            $query->where('id_ubicacion', $filters['id_ubicacion']);
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (bool) $filters['status']);
        }

        return $query->paginate($perPage);
    }

    /**
     * Get hotel by ID with all relations.
     */
    public function getHotelById(int $id): Hotel
    {
        return Hotel::with(['ubicacion', 'habitaciones.tarifas', 'reglasComerciales'])->findOrFail($id);
    }

    /**
     * Create hotel within a database transaction, optionally with rooms and tariffs.
     */
    public function createHotel(array $data): Hotel
    {
        return DB::transaction(function () use ($data) {
            $hotel = Hotel::create([
                'id_ubicacion' => $data['id_ubicacion'],
                'nombre' => $data['nombre'],
                'tipo' => $data['tipo'],
                'edad_adolescentes' => $data['edad_adolescentes'] ?? '12-17',
                'edad_ninos' => $data['edad_ninos'] ?? '5-11',
                'edad_infantes' => $data['edad_infantes'] ?? '0-4',
                'nota' => $data['nota'] ?? null,
                'status' => $data['status'] ?? true,
            ]);

            // If discount commercial rules are provided (Paso 1)
            if (!empty($data['reglas'])) {
                foreach ($data['reglas'] as $regla) {
                    $hotel->reglasComerciales()->create([
                        'id_freelancer' => $regla['id_freelancer'] ?? 1,
                        'descuento_monto' => $regla['descuento_monto'] ?? 0,
                        'descuento_status' => $regla['descuento_status'] ?? false,
                        'aumento_bolivares' => $regla['aumento_bolivares'] ?? false,
                        'aumento_bolivares_porcentaje' => $regla['aumento_bolivares_porcentaje'] ?? 0,
                    ]);
                }
            }

            // If rooms and rates are provided (Paso 2)
            if (!empty($data['habitaciones'])) {
                foreach ($data['habitaciones'] as $habData) {
                    $habitacion = $hotel->habitaciones()->create([
                        'habitacion' => $habData['habitacion'],
                        'cantidad_personas' => $habData['cantidad_personas'] ?? 2,
                        'minimo_noches' => $habData['minimo_noches'] ?? 1,
                        'posicion' => $habData['posicion'] ?? 0,
                        'por_defecto' => $habData['por_defecto'] ?? false,
                        'nota' => $habData['nota'] ?? null,
                    ]);

                    if (!empty($habData['tarifas'])) {
                        foreach ($habData['tarifas'] as $tarifaData) {
                            if (isset($tarifaData['desde_venta']) && $tarifaData['desde_venta'] === '') {
                                $tarifaData['desde_venta'] = null;
                            }
                            if (isset($tarifaData['hasta_venta']) && $tarifaData['hasta_venta'] === '') {
                                $tarifaData['hasta_venta'] = null;
                            }

                            // If they are strictly required in the DB, default to the validity dates
                            if (empty($tarifaData['desde_venta'])) {
                                $tarifaData['desde_venta'] = $tarifaData['desde'] ?? null;
                            }
                            if (empty($tarifaData['hasta_venta'])) {
                                $tarifaData['hasta_venta'] = $tarifaData['hasta'] ?? null;
                            }

                            $habitacion->tarifas()->create($tarifaData);
                        }
                    }
                }
            }

            return $hotel->load(['ubicacion', 'habitaciones.tarifas', 'reglasComerciales']);
        });
    }

    /**
     * Update hotel attributes.
     */
    public function updateHotel(Hotel $hotel, array $data): Hotel
    {
        return DB::transaction(function () use ($hotel, $data) {
            $hotel->update(array_filter([
                'id_ubicacion' => $data['id_ubicacion'] ?? $hotel->id_ubicacion,
                'nombre' => $data['nombre'] ?? $hotel->nombre,
                'tipo' => $data['tipo'] ?? $hotel->tipo,
                'edad_adolescentes' => $data['edad_adolescentes'] ?? $hotel->edad_adolescentes,
                'edad_ninos' => $data['edad_ninos'] ?? $hotel->edad_ninos,
                'edad_infantes' => $data['edad_infantes'] ?? $hotel->edad_infantes,
                'nota' => array_key_exists('nota', $data) ? $data['nota'] : $hotel->nota,
                'status' => array_key_exists('status', $data) ? (bool) $data['status'] : $hotel->status,
            ], fn($val) => $val !== null));

            return $hotel->fresh(['ubicacion', 'habitaciones.tarifas', 'reglasComerciales']);
        });
    }

    /**
     * Toggle status between active and inactive.
     */
    public function toggleStatus(Hotel $hotel): Hotel
    {
        $hotel->status = !$hotel->status;
        $hotel->save();
        return $hotel;
    }

    /**
     * Delete hotel (foreign keys will cascade to rooms and rates).
     */
    public function deleteHotel(Hotel $hotel): bool
    {
        return DB::transaction(fn() => $hotel->delete());
    }
}
