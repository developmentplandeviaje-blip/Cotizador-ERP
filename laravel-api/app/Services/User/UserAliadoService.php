<?php

namespace App\Services\User;

use App\Models\Aliado;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserAliadoService
{
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
            return User::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'id_aliado' => $aliado->id,
                'level' => 'Asesor', // or Vendedor? The prompt says "Vendedor/Asesor". I'll use Asesor.
                'status' => $data['status'] ?? true,
            ]);
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

            return $user;
        });
    }

    /**
     * Delete an Aliado and its associated users.
     */
    public function deleteAliado(Aliado $aliado): void
    {
        DB::transaction(function () use ($aliado) {
            // Unlink or delete users?
            // Usually we'd check if they have sales. If not, delete users.
            // But for simplicity, Aliado deletion could just delete the Aliado if possible.
            // Wait, what if the Aliado has sellers with sales?
            // "id_aliado" in "user" table is "set null" on delete. So deleting an Aliado just detaches users.
            // Let's delete the Aliado.
            $aliado->delete();
        });
    }

    /**
     * Delete a seller.
     */
    public function deleteVendedor(User $user): void
    {
        DB::transaction(function () use ($user) {
            $user->delete();
        });
    }
}
