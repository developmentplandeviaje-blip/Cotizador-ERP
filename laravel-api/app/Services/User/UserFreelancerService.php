<?php

namespace App\Services\User;

use App\Models\User;
use App\Models\Freelancer;
use App\Models\UserComisionConfig;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
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
    public function getUsers(array $filters = [], int $perPage = 15)
    {
        $query = User::freelancers()->with(['freelancer', 'comisiones']);

        if (!empty($filters['search'])) {
            $search = trim($filters['search']);
            $query->where(function ($q) use ($search) {
                $q->where('first_name', 'LIKE', "%{$search}%")
                  ->orWhere('last_name', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(first_name, ' ', last_name) LIKE ?", ["%{$search}%"])
                  ->orWhereHas('freelancer', function ($fq) use ($search) {
                      $fq->where('nombre', 'LIKE', "%{$search}%")
                         ->orWhere('rif', 'LIKE', "%{$search}%")
                         ->orWhere('correo', 'LIKE', "%{$search}%");
                  });
            });
        }

        if (isset($filters['status']) && $filters['status'] !== '') {
            $statusBool = filter_var($filters['status'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($statusBool !== null) {
                $query->where('status', $statusBool);
            }
        }

        $sortField = $filters['sort_by'] ?? 'id';
        $sortOrder = strtolower($filters['sort_order'] ?? 'desc') === 'asc' ? 'asc' : 'desc';
        $allowedSorts = ['id', 'first_name', 'last_name', 'email', 'status', 'date_creation'];

        if (in_array($sortField, $allowedSorts, true)) {
            $query->orderBy($sortField, $sortOrder);
        } else {
            $query->orderBy('id', 'desc');
        }

        if ($perPage <= 0) {
            return $query->get();
        }

        return $query->paginate($perPage);
    }

    /**
     * Create a new Freelancer User and associated Freelancer entity.
     */
    public function createUser(array $data): User
    {
        return DB::transaction(function () use ($data) {
            // 1. Create or resolve Freelancer entity
            $freelancer = Freelancer::create([
                'nombre' => $data['nombre_empresa'] ?? trim("{$data['first_name']} {$data['last_name']}"),
                'rif' => $data['rif'] ?? null,
                'correo' => $data['correo_empresa'] ?? $data['email'],
                'telefono_1' => $data['telefono_1'] ?? null,
                'telefono_2' => $data['telefono_2'] ?? null,
                'direccion' => $data['direccion'] ?? null,
                'color_primario' => $data['color_primario'] ?? '#E87217',
                'logo_url' => $data['logo_url'] ?? null,
                'hoja_membrete_config' => $data['hoja_membrete_config'] ?? null,
                'status' => isset($data['status']) ? (bool)$data['status'] : true,
            ]);

            // 2. Create User record
            $user = User::create([
                'first_name' => $data['first_name'],
                'last_name' => $data['last_name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
                'level' => 'Freelancer',
                'status' => isset($data['status']) ? (bool)$data['status'] : true,
                'id_freelancer' => $freelancer->id,
            ]);

            // 3. Set commissions if provided
            if (isset($data['comisiones']) && is_array($data['comisiones'])) {
                $this->syncComisiones($user, $data['comisiones']);
            }

            return $user->load(['freelancer', 'comisiones']);
        });
    }

    /**
     * Update an existing Freelancer User.
     */
    public function updateUser(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data) {
            $userPayload = [
                'first_name' => $data['first_name'] ?? $user->first_name,
                'last_name' => $data['last_name'] ?? $user->last_name,
                'email' => $data['email'] ?? $user->email,
            ];

            if (isset($data['status'])) {
                $userPayload['status'] = (bool)$data['status'];
            }

            if (!empty($data['password'])) {
                $userPayload['password'] = Hash::make($data['password']);
            }

            $user->update($userPayload);

            // Update associated Freelancer record
            if ($user->id_freelancer) {
                $freelancer = Freelancer::find($user->id_freelancer);
                if ($freelancer) {
                    $freelancerPayload = [];
                    if (isset($data['nombre_empresa'])) $freelancerPayload['nombre'] = $data['nombre_empresa'];
                    if (isset($data['rif'])) $freelancerPayload['rif'] = $data['rif'];
                    if (isset($data['correo_empresa'])) $freelancerPayload['correo'] = $data['correo_empresa'];
                    if (isset($data['telefono_1'])) $freelancerPayload['telefono_1'] = $data['telefono_1'];
                    if (isset($data['telefono_2'])) $freelancerPayload['telefono_2'] = $data['telefono_2'];
                    if (isset($data['direccion'])) $freelancerPayload['direccion'] = $data['direccion'];
                    if (isset($data['color_primario'])) $freelancerPayload['color_primario'] = $data['color_primario'];
                    if (isset($data['logo_url'])) $freelancerPayload['logo_url'] = $data['logo_url'];
                    if (isset($data['status'])) $freelancerPayload['status'] = (bool)$data['status'];

                    if (!empty($freelancerPayload)) {
                        $freelancer->update($freelancerPayload);
                    }
                }
            }

            if (isset($data['comisiones']) && is_array($data['comisiones'])) {
                $this->syncComisiones($user, $data['comisiones']);
            }

            return $user->load(['freelancer', 'comisiones']);
        });
    }

    /**
     * Toggle active/inactive status.
     */
    public function toggleStatus(User $user): User
    {
        $newStatus = !$user->status;
        $user->update(['status' => $newStatus]);
        if ($user->id_freelancer) {
            Freelancer::where('id', $user->id_freelancer)->update(['status' => $newStatus]);
        }
        return $user->load(['freelancer', 'comisiones']);
    }

    /**
     * Delete user and freelancer record if no dependencies exist.
     */
    public function deleteUser(User $user): void
    {
        if ($user->ventasCount() > 0) {
            throw ValidationException::withMessages([
                'user' => ["No se puede eliminar el usuario '{$user->first_name} {$user->last_name}' porque posee ventas asociadas en el sistema."],
            ]);
        }

        DB::transaction(function () use ($user) {
            $user->comisiones()->delete();
            $freelancerId = $user->id_freelancer;
            $user->delete();

            if ($freelancerId) {
                // If no other user uses this freelancer record, delete it
                $otherCount = User::where('id_freelancer', $freelancerId)->count();
                if ($otherCount === 0) {
                    Freelancer::where('id', $freelancerId)->delete();
                }
            }
        });
    }

    /**
     * Sync commission configurations.
     */
    private function syncComisiones(User $user, array $comisionesInput): void
    {
        foreach (self::SERVICIOS_COMISION as $servicio) {
            $percentage = isset($comisionesInput[$servicio]) ? (float)$comisionesInput[$servicio] : 0.0;
            UserComisionConfig::updateOrCreate(
                [
                    'id_user' => $user->id,
                    'tipo_servicio' => $servicio,
                ],
                [
                    'porcentaje_comision' => $percentage,
                ]
            );
        }
    }
}
