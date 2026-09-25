<?php

namespace App\Services\Finance;

use App\Models\Finance\MetodoPago;
use App\Models\Finance\MetodoPagoAsesor;
use App\Models\Finance\MetodoPagoBanco;
use App\Models\Finance\MetodoPagoDigital;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MetodoPagoService
{
    /**
     * Retrieve filtered payment methods with relationships.
     */
    public function getMetodosPago(array $filters = [], int $perPage = 15): LengthAwarePaginator|Collection
    {
        $query = MetodoPago::with(['banco', 'digital', 'asesores.user']);

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('nombre', 'LIKE', "%{$search}%")
                  ->orWhere('nombre_publico', 'LIKE', "%{$search}%")
                  ->orWhereHas('banco', function ($bq) use ($search) {
                      $bq->where('titular', 'LIKE', "%{$search}%")
                         ->orWhere('documento', 'LIKE', "%{$search}%")
                         ->orWhere('numero_cuenta', 'LIKE', "%{$search}%");
                  })
                  ->orWhereHas('digital', function ($dq) use ($search) {
                      $dq->where('correo_cuenta', 'LIKE', "%{$search}%");
                  });
            });
        }

        if (!empty($filters['tipo'])) {
            $query->where('tipo', $filters['tipo']);
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (bool) $filters['status']);
        }

        if (!empty($filters['id_asesor'])) {
            $idAsesor = (int) $filters['id_asesor'];
            $query->whereHas('asesores', function ($aq) use ($idAsesor) {
                $aq->where('id_asesor', $idAsesor);
            });
        }

        $sortField = $filters['sort_by'] ?? 'id';
        $sortOrder = strtolower($filters['sort_order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'nombre', 'nombre_publico', 'tipo', 'status'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortOrder);
        } else {
            $query->orderBy('id', 'desc');
        }

        if ($perPage === -1) {
            return $query->get();
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a payment method and its related records atomically.
     */
    public function createMetodoPago(array $data): MetodoPago
    {
        return DB::transaction(function () use ($data) {
            $metodo = MetodoPago::create([
                'nombre' => trim($data['nombre']),
                'nombre_publico' => trim($data['nombre_publico']),
                'tipo' => $data['tipo'],
                'logo' => $data['logo'] ?? null,
                'status' => isset($data['status']) ? (bool) $data['status'] : true,
            ]);

            if ($data['tipo'] === 'banco') {
                MetodoPagoBanco::create([
                    'id_metodo' => $metodo->id,
                    'titular' => trim($data['titular'] ?? ''),
                    'tipo_documento' => trim($data['tipo_documento'] ?? ''),
                    'documento' => trim($data['documento'] ?? ''),
                    'numero_cuenta' => isset($data['numero_cuenta']) ? trim($data['numero_cuenta']) : null,
                    'tipo_cuenta' => isset($data['tipo_cuenta']) ? trim($data['tipo_cuenta']) : null,
                    'pago_movil_telefono' => isset($data['pago_movil_telefono']) ? trim($data['pago_movil_telefono']) : null,
                ]);
            } elseif ($data['tipo'] === 'digital') {
                MetodoPagoDigital::create([
                    'id_metodo' => $metodo->id,
                    'correo_cuenta' => strtolower(trim($data['correo_cuenta'] ?? '')),
                    'tipo_comision' => $data['tipo_comision'] ?? 'porcentaje',
                    'comision_valor' => isset($data['comision_valor']) ? (float) $data['comision_valor'] : 0.00,
                    'codigo_postal' => isset($data['codigo_postal']) ? trim($data['codigo_postal']) : null,
                    'direccion_facturacion' => isset($data['direccion_facturacion']) ? trim($data['direccion_facturacion']) : null,
                ]);
            }

            if (isset($data['asesores']) && is_array($data['asesores'])) {
                $this->assignAsesores($metodo->id, $data['asesores']);
            }

            return $metodo->load(['banco', 'digital', 'asesores.user']);
        });
    }

    /**
     * Update a payment method and its related records atomically.
     */
    public function updateMetodoPago(MetodoPago $metodo, array $data): MetodoPago
    {
        return DB::transaction(function () use ($metodo, $data) {
            $metodo->update([
                'nombre' => isset($data['nombre']) ? trim($data['nombre']) : $metodo->nombre,
                'nombre_publico' => isset($data['nombre_publico']) ? trim($data['nombre_publico']) : $metodo->nombre_publico,
                'tipo' => $data['tipo'] ?? $metodo->tipo,
                'logo' => array_key_exists('logo', $data) ? $data['logo'] : $metodo->logo,
                'status' => isset($data['status']) ? (bool) $data['status'] : $metodo->status,
            ]);

            $currentTipo = $metodo->tipo;

            if ($currentTipo === 'banco') {
                MetodoPagoDigital::where('id_metodo', $metodo->id)->delete();

                MetodoPagoBanco::updateOrCreate(
                    ['id_metodo' => $metodo->id],
                    [
                        'titular' => trim($data['titular'] ?? ''),
                        'tipo_documento' => trim($data['tipo_documento'] ?? ''),
                        'documento' => trim($data['documento'] ?? ''),
                        'numero_cuenta' => isset($data['numero_cuenta']) ? trim($data['numero_cuenta']) : null,
                        'tipo_cuenta' => isset($data['tipo_cuenta']) ? trim($data['tipo_cuenta']) : null,
                        'pago_movil_telefono' => isset($data['pago_movil_telefono']) ? trim($data['pago_movil_telefono']) : null,
                    ]
                );
            } elseif ($currentTipo === 'digital') {
                MetodoPagoBanco::where('id_metodo', $metodo->id)->delete();

                MetodoPagoDigital::updateOrCreate(
                    ['id_metodo' => $metodo->id],
                    [
                        'correo_cuenta' => strtolower(trim($data['correo_cuenta'] ?? '')),
                        'tipo_comision' => $data['tipo_comision'] ?? 'porcentaje',
                        'comision_valor' => isset($data['comision_valor']) ? (float) $data['comision_valor'] : 0.00,
                        'codigo_postal' => isset($data['codigo_postal']) ? trim($data['codigo_postal']) : null,
                        'direccion_facturacion' => isset($data['direccion_facturacion']) ? trim($data['direccion_facturacion']) : null,
                    ]
                );
            } else { // efectivo
                MetodoPagoBanco::where('id_metodo', $metodo->id)->delete();
                MetodoPagoDigital::where('id_metodo', $metodo->id)->delete();
            }

            if (isset($data['asesores']) && is_array($data['asesores'])) {
                $this->assignAsesores($metodo->id, $data['asesores']);
            }

            return $metodo->fresh(['banco', 'digital', 'asesores.user']);
        });
    }

    /**
     * Toggle active status.
     */
    public function toggleStatus(MetodoPago $metodo): MetodoPago
    {
        return DB::transaction(function () use ($metodo) {
            $metodo->status = !$metodo->status;
            $metodo->save();
            return $metodo->load(['banco', 'digital', 'asesores.user']);
        });
    }

    /**
     * Delete payment method enforcing referential integrity.
     */
    public function deleteMetodoPago(MetodoPago $metodo): bool
    {
        if ($metodo->pagosVentaCount() > 0) {
            throw ValidationException::withMessages([
                'metodo_pago' => 'No es posible eliminar el método de pago porque posee transacciones de ventas vinculadas. Puede deshabilitarlo en su lugar.',
            ]);
        }

        return DB::transaction(function () use ($metodo) {
            return (bool) $metodo->delete();
        });
    }

    /**
     * Sync assigned advisors for the payment method.
     */
    public function assignAsesores(int $idMetodo, array $asesorIds): void
    {
        MetodoPagoAsesor::where('id_metodo', $idMetodo)->delete();

        if (empty($asesorIds)) {
            return;
        }

        $users = User::whereIn('id', $asesorIds)->get();

        foreach ($users as $user) {
            MetodoPagoAsesor::create([
                'id_metodo' => $idMetodo,
                'id_asesor' => $user->id,
                'asesor' => trim("{$user->first_name} {$user->last_name}"),
            ]);
        }
    }
}
