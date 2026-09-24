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
        $users = $this->userService->getUsers($request->all(), $perPage);
        return UserAgenciaResource::collection($users);
    }

    public function store(StoreUserAgenciaRequest $request): JsonResponse
    {
        $user = $this->userService->createUser($request->validated());
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
        $this->ensureIsAgencyUser($user);
        $updatedUser = $this->userService->updateUser($user, $request->validated());
        return new UserAgenciaResource($updatedUser);
    }

    public function toggleStatus(Request $request, User $user): UserAgenciaResource
    {
        $this->ensureAuthorized($request, true);
        $this->ensureIsAgencyUser($user);
        $toggled = $this->userService->toggleStatus($user);
        return new UserAgenciaResource($toggled);
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
        if ($adminOnly && !in_array($user->level, ['Admin', 'Administrador', 'Sub Gerente'], true)) {
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
