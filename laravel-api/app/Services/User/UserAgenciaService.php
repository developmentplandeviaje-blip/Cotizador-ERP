<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\UserComisionConfig;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserAgenciaService
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
     * Retrieve paginated agency users with filters.
     */
    public function getUsers(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::agencia()->with('comisiones');

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'LIKE', "%{$search}%")
                  ->orWhere('last_name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"]);
            });
        }

        if (!empty($filters['level'])) {
            $query->where('level', $filters['level']);
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (bool) $filters['status']);
        }

        $sortField = $filters['sort_by'] ?? 'id';
        $sortOrder = strtolower($filters['sort_order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'first_name', 'last_name', 'email', 'level', 'status', 'date_creation'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortOrder);
        } else {
            $query->orderBy('id', 'desc');
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new agency user with commissions within a transaction.
     */
    public function createUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $userData = [
                'first_name' => trim($data['first_name']),
                'last_name' => trim($data['last_name']),
                'email' => strtolower(trim($data['email'])),
                'password' => Hash::make($data['password']),
                'level' => $data['level'],
                'status' => isset($data['status']) ? (bool) $data['status'] : true,
                'id_freelancer' => null,
            ];

            $user = User::create($userData);

            // Sync commissions
            if (isset($data['comisiones']) && is_array($data['comisiones'])) {
                $this->syncComisiones($user->id, $data['comisiones']);
            }

            return $user->load('comisiones');
        });
    }

    /**
     * Update an agency user and their commissions within a transaction.
     */
    public function updateUser(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $updateData = [];

            if (isset($data['first_name'])) {
                $updateData['first_name'] = trim($data['first_name']);
            }
            if (isset($data['last_name'])) {
                $updateData['last_name'] = trim($data['last_name']);
            }
            if (isset($data['email'])) {
                $updateData['email'] = strtolower(trim($data['email']));
            }
            if (!empty($data['password'])) {
                $updateData['password'] = Hash::make($data['password']);
            }
            if (isset($data['level'])) {
                $updateData['level'] = $data['level'];
            }
            if (isset($data['status'])) {
                $updateData['status'] = (bool) $data['status'];
            }

            if (!empty($updateData)) {
                $user->update($updateData);
            }

            if (isset($data['comisiones']) && is_array($data['comisiones'])) {
                $this->syncComisiones($user->id, $data['comisiones']);
            }

            return $user->fresh('comisiones');
        });
    }

    /**
     * Toggle the status of an agency user.
     */
    public function toggleStatus(User $user): User
    {
        return DB::transaction(function () use ($user) {
            $user->status = !$user->status;
            $user->save();
            return $user->load('comisiones');
        });
    }

    /**
     * Safely delete an agency user enforcing referential integrity.
     */
    public function deleteUser(User $user): bool
    {
        if ($user->ventasCount() > 0 || $user->cotizacionesCount() > 0 || $user->metodosPagoCount() > 0) {
            throw ValidationException::withMessages([
                'user' => 'No es posible eliminar el usuario porque posee registros operativos vinculados (ventas, cotizaciones o métodos de pago). Puede deshabilitarlo en su lugar.',
            ]);
        }

        return DB::transaction(function () use ($user) {
            // Remove associated user configs & security tokens
            UserComisionConfig::where('id_user', $user->id)->delete();
            DB::table('login_logs')->where('id_user', $user->id)->delete();
            DB::table('token_device')->where('id_user', $user->id)->delete();
            $user->tokens()->delete();

            return (bool) $user->delete();
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
