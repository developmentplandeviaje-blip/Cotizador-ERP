<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\Freelancer;
use App\Models\UserComisionConfig;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class UserFreelancerService
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
     * Retrieve paginated freelancer users with filters.
     */
    public function getUsers(array $filters = [], int $perPage = 15): LengthAwarePaginator
    {
        $query = User::freelancers()->with(['comisiones', 'freelancer']);

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'LIKE', "%{$search}%")
                  ->orWhere('last_name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                  ->orWhereHas('freelancer', function ($qFreelancer) use ($search) {
                      $qFreelancer->where('nombre', 'LIKE', "%{$search}%")
                                  ->orWhere('rif', 'LIKE', "%{$search}%");
                  });
            });
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $query->where('status', (bool) $filters['status']);
        }

        $sortField = $filters['sort_by'] ?? 'id';
        $sortOrder = strtolower($filters['sort_order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'first_name', 'last_name', 'email', 'status', 'date_creation'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortOrder);
        } else {
            $query->orderBy('id', 'desc');
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new freelancer user and their associated Freelancer company entity within a transaction.
     */
    public function createUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            // 1. Create the Freelancer company entity
            $freelancerData = [
                'nombre' => trim($data['freelancer_nombre']),
                'rif' => trim($data['freelancer_rif'] ?? ''),
                'correo' => strtolower(trim($data['email'])),
                'telefono_1' => trim($data['freelancer_telefono_1'] ?? ''),
                'telefono_2' => trim($data['freelancer_telefono_2'] ?? ''),
                'direccion' => trim($data['freelancer_direccion'] ?? ''),
                'color_primario' => trim($data['freelancer_color_primario'] ?? ''),
                'status' => isset($data['status']) ? (bool) $data['status'] : true,
            ];

            $freelancer = Freelancer::create($freelancerData);

            // 2. Create the User linked to the Freelancer
            $userData = [
                'first_name' => trim($data['first_name']),
                'last_name' => trim($data['last_name']),
                'email' => strtolower(trim($data['email'])),
                'password' => Hash::make($data['password']),
                'level' => 'Freelancer', // Force level to Freelancer
                'status' => isset($data['status']) ? (bool) $data['status'] : true,
                'id_freelancer' => $freelancer->id,
            ];

            $user = User::create($userData);

            // 3. Sync commissions
            if (isset($data['comisiones']) && is_array($data['comisiones'])) {
                $this->syncComisiones($user->id, $data['comisiones']);
            }

            return $user->load(['comisiones', 'freelancer']);
        });
    }

    /**
     * Update a freelancer user, their associated company, and commissions within a transaction.
     */
    public function updateUser(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            // Update User
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
            if (isset($data['status'])) {
                $updateData['status'] = (bool) $data['status'];
            }

            if (!empty($updateData)) {
                $user->update($updateData);
            }

            // Update Freelancer Company
            if ($user->freelancer) {
                $freelancerUpdateData = [];
                if (isset($data['freelancer_nombre'])) $freelancerUpdateData['nombre'] = trim($data['freelancer_nombre']);
                if (isset($data['freelancer_rif'])) $freelancerUpdateData['rif'] = trim($data['freelancer_rif']);
                if (isset($data['email'])) $freelancerUpdateData['correo'] = strtolower(trim($data['email'])); // keep email in sync
                if (isset($data['freelancer_telefono_1'])) $freelancerUpdateData['telefono_1'] = trim($data['freelancer_telefono_1']);
                if (isset($data['freelancer_telefono_2'])) $freelancerUpdateData['telefono_2'] = trim($data['freelancer_telefono_2']);
                if (isset($data['freelancer_direccion'])) $freelancerUpdateData['direccion'] = trim($data['freelancer_direccion']);
                if (isset($data['freelancer_color_primario'])) $freelancerUpdateData['color_primario'] = trim($data['freelancer_color_primario']);
                if (isset($data['status'])) $freelancerUpdateData['status'] = (bool) $data['status'];

                if (!empty($freelancerUpdateData)) {
                    $user->freelancer->update($freelancerUpdateData);
                }
            }

            // Update Commissions
            if (isset($data['comisiones']) && is_array($data['comisiones'])) {
                $this->syncComisiones($user->id, $data['comisiones']);
            }

            return $user->fresh(['comisiones', 'freelancer']);
        });
    }

    /**
     * Toggle the status of a freelancer user.
     */
    public function toggleStatus(User $user): User
    {
        return DB::transaction(function () use ($user) {
            $newStatus = !$user->status;
            
            $user->status = $newStatus;
            $user->save();

            // Also toggle the freelancer company status
            if ($user->freelancer) {
                $user->freelancer->status = $newStatus;
                $user->freelancer->save();
            }

            return $user->load(['comisiones', 'freelancer']);
        });
    }

    /**
     * Safely delete a freelancer user enforcing referential integrity.
     */
    public function deleteUser(User $user): bool
    {
        if ($user->ventasCount() > 0 || $user->cotizacionesCount() > 0 || $user->metodosPagoCount() > 0) {
            throw ValidationException::withMessages([
                'user' => 'No es posible eliminar el usuario freelancer porque posee registros operativos vinculados (ventas, cotizaciones o métodos de pago). Puede deshabilitarlo en su lugar.',
            ]);
        }

        return DB::transaction(function () use ($user) {
            $freelancerId = $user->id_freelancer;

            // Remove associated user configs & security tokens
            UserComisionConfig::where('id_user', $user->id)->delete();
            DB::table('login_logs')->where('id_user', $user->id)->delete();
            DB::table('token_device')->where('id_user', $user->id)->delete();
            $user->tokens()->delete();

            $deleted = $user->delete();

            // Check if there are no other users linked to this freelancer, then delete freelancer
            if ($freelancerId) {
                $remainingUsersCount = User::where('id_freelancer', $freelancerId)->count();
                if ($remainingUsersCount === 0) {
                    Freelancer::where('id', $freelancerId)->delete();
                }
            }

            return (bool) $deleted;
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
