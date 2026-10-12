<?php

namespace App\Services\User;

use App\Models\Aliado;
use App\Models\User;
use App\Models\UserComisionConfig;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserAliadoService
{
    /**
     * Supported service types for commissions.
     */
    public const SERVICIOS_COMISION = [
        'hotel',
        'ferry',
        'vuelo',
        'excursion',
        'vehiculo',
        'traslado',
        'paquete',
        'otro',
    ];

    /**
     * Create a new Aliado company.
     */
    public function createAliado(array $data): Aliado
    {
        return DB::transaction(function () use ($data) {
            return Aliado::create([
                'razon_social' => $data['razon_social'],
                'rif' => $data['rif'] ?? null,
                'contacto_principal' => $data['contacto_principal'] ?? null,
                'telefono' => $data['telefono'] ?? null,
                'correo' => $data['correo'] ?? null,
                'status' => $data['status'] ?? true,
            ]);
        });
    }

    /**
     * Update an Aliado company.
     */
    public function updateAliado(Aliado $aliado, array $data): Aliado
    {
        return DB::transaction(function () use ($aliado, $data) {
            $aliado->update([
                'razon_social' => $data['razon_social'],
                'rif' => $data['rif'] ?? $aliado->rif,
                'contacto_principal' => $data['contacto_principal'] ?? $aliado->contacto_principal,
                'telefono' => $data['telefono'] ?? $aliado->telefono,
                'correo' => $data['correo'] ?? $aliado->correo,
                'status' => $data['status'] ?? $aliado->status,
            ]);
            return $aliado;
        });
    }

    /**
     * Create a new seller (User) under an Aliado.
     */
    public function createVendedor(Aliado $aliado, array $data): User
    {
        return DB::transaction(function () use ($aliado, $data) {
            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'id_aliado' => $aliado->id,
                'level' => 'Asesor',
                'status' => $data['status'] ?? true,
            ]);

            if (isset($data['comisiones']) && is_array($data['comisiones'])) {
                $this->syncComisiones($user->id, $data['comisiones']);
            }

            return $user->load('comisiones');
        });
    }

    /**
     * Update a seller (User) under an Aliado.
     */
    public function updateVendedor(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $updateData = [
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'status' => $data['status'] ?? $user->status,
            ];

            if (!empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }

            $user->update($updateData);

            if (isset($data['comisiones']) && is_array($data['comisiones'])) {
                $this->syncComisiones($user->id, $data['comisiones']);
            }

            return $user->fresh('comisiones');
        });
    }

    /**
     * Delete an Aliado and its associated users.
     */
    public function deleteAliado(Aliado $aliado): void
    {
        DB::transaction(function () use ($aliado) {
            $aliado->delete();
        });
    }

    /**
     * Delete a seller.
     */
    public function deleteVendedor(User $user): void
    {
        DB::transaction(function () use ($user) {
            UserComisionConfig::where('id_user', $user->id)->delete();
            $user->delete();
        });
    }

    /**
     * Toggle status of a seller.
     */
    public function toggleStatusVendedor(User $user): User
    {
        return DB::transaction(function () use ($user) {
            $user->status = !$user->status;
            $user->save();
            return $user->load('comisiones');
        });
    }

    /**
     * Sync commission percentages for the user.
     */
    private function syncComisiones(int $userId, array $comisiones): void
    {
        foreach (self::SERVICIOS_COMISION as $servicio) {
            $porcentaje = isset($comisiones[$servicio]) ? max(0, min(100, (float) $comisiones[$servicio])) : 0.0;

            UserComisionConfig::updateOrCreate(
                [
                    'id_user' => $userId,
                    'tipo_servicio' => $servicio,
                ],
                [
                    'porcentaje_comision' => $porcentaje,
                ]
            );
        }
    }
}
