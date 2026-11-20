<?php

namespace App\Http\Controllers\Api\v1\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserAgenciaRequest;
use App\Http\Requests\User\UpdateUserAgenciaRequest;
use App\Http\Resources\User\UserAgenciaResource;
use App\Models\User;
use App\Services\User\UserAgenciaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserAgenciaController extends Controller
{
    public function __construct(
        protected UserAgenciaService $userService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->ensureAuthorized($request);
        $perPage = (int) $request->input('per_page', 15);
        $users = $this->userService->getUsers($request->all(), $perPage, $request->user());
        return UserAgenciaResource::collection($users);
    }

    public function verificarCodigo(Request $request): JsonResponse
    {
        $request->validate(['codigo' => 'required|string']);
        $codigo = trim($request->input('codigo'));
        $currentUser = $request->user();

        // 1. Validar contra el código diario generado para la fecha actual o códigos maestros
        $codigoHoy = \App\Services\Sale\VentaService::generarCodigoDiario(now()->format('Y-m-d'));
        if ($codigo === $codigoHoy || strcasecmp($codigo, 'ADMIN2026') === 0 || strcasecmp($codigo, 'PLANDV2026') === 0) {
            return response()->json(['valid' => true, 'message' => 'Código de autorización válido.']);
        }

        // 2. Validar contra contraseñas de administradores activos
        $admins = User::whereIn('level', ['Admin', 'Administrador', 'Administracion', 'Sub Gerente'])->where('status', 1)->get();
        foreach ($admins as $admin) {
            if (\Illuminate\Support\Facades\Hash::check($codigo, $admin->password)) {
                return response()->json(['valid' => true, 'message' => 'Código de autorización válido.']);
            }
        }

        // 3. Validar si el propio usuario activo es Líder o Admin y confirma con su clave
        if ($currentUser && in_array(strtolower($currentUser->level ?? ''), ['administrador', 'admin', 'lider', 'líder'])) {
            if (\Illuminate\Support\Facades\Hash::check($codigo, $currentUser->password)) {
                return response()->json(['valid' => true, 'message' => 'Código de autorización válido.']);
            }
        }

        return response()->json(['valid' => false, 'message' => 'El código de autorización no es válido.'], 422);
    }

    public function store(StoreUserAgenciaRequest $request): JsonResponse
    {
        $currentUser = $request->user();
        $isLider = in_array(strtolower($currentUser->level ?? ''), ['lider', 'líder']);
        $data = $request->validated();

        if ($isLider) {
            $data['level'] = 'Asesor';
        }

        $user = $this->userService->createUser($data);
        return (new UserAgenciaResource($user))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, User $user): UserAgenciaResource
    {
        $this->ensureAuthorized($request);
        $this->ensureIsAgencyUser($user);
        return new UserAgenciaResource($user->load('comisiones'));
    }

    public function update(UpdateUserAgenciaRequest $request, User $user): UserAgenciaResource
    {
        $currentUser = $request->user();
        $isLider = in_array(strtolower($currentUser->level ?? ''), ['lider', 'líder']);
        $this->ensureIsAgencyUser($user);

        $data = $request->validated();
        if ($isLider) {
            if ($user->id !== $currentUser->id && strtolower($user->level ?? '') !== 'asesor') {
                abort(403, 'Un Líder solo puede editar su propio usuario o asesores.');
            }
            if ($user->id !== $currentUser->id) {
                $data['level'] = 'Asesor';
            }
        }

        $updatedUser = $this->userService->updateUser($user, $data);
        return new UserAgenciaResource($updatedUser);
    }

    public function toggleStatus(Request $request, User $user): UserAgenciaResource
    {
        $currentUser = $request->user();
        $isLider = in_array(strtolower($currentUser->level ?? ''), ['lider', 'líder']);

        if ($isLider) {
            if (strtolower($user->level ?? '') !== 'asesor') {
                abort(403, 'Un Líder solo puede cambiar el estado de usuarios con rol Asesor.');
            }
        } else {
            $this->ensureAuthorized($request, true);
        }

        $this->ensureIsAgencyUser($user);
        $toggled = $this->userService->toggleStatus($user);
        return new UserAgenciaResource($toggled);
    }


    public function assignMetodosPago(Request $request, User $user): JsonResponse
    {
        $this->ensureAuthorized($request, true);
        $this->ensureIsAgencyUser($user);

        $validated = $request->validate([
            'metodos' => 'array',
            'metodos.*' => 'integer|exists:metodo_pago,id'
        ]);

        \App\Models\Finance\MetodoPagoAsesor::where('id_asesor', $user->id)->delete();

        if (!empty($validated['metodos'])) {
            $insertData = array_map(function ($id_metodo) use ($user) {
                return [
                    'id_metodo' => $id_metodo,
                    'id_asesor' => $user->id,
                    'asesor' => $user->first_name . ' ' . $user->last_name,
                ];
            }, $validated['metodos']);

            \App\Models\Finance\MetodoPagoAsesor::insert($insertData);
        }

        return response()->json(['message' => 'Métodos de pago asignados correctamente.']);
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        $this->ensureAuthorized($request, true);
        $this->ensureIsAgencyUser($user);
        $this->userService->deleteUser($user);
        return response()->json(['message' => 'Usuario eliminado correctamente.']);
    }

    private function ensureAuthorized(Request $request, bool $adminOnly = false): void
    {
        $user = $request->user();
        if (!$user || $user->level === 'Freelancer') {
            abort(403, 'Acceso no autorizado.');
        }
        if ($adminOnly && !in_array($user->level, ['Admin', 'Administrador'], true)) {
            abort(403, 'Acceso restringido a administradores.');
        }
    }

    private function ensureIsAgencyUser(User $user): void
    {
        if ($user->level === 'Freelancer' || $user->id_freelancer !== null) {
            abort(404, 'Usuario no pertenece a la agencia.');
        }
    }
}
