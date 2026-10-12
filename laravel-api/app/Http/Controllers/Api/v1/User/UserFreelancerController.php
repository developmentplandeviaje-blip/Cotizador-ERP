<?php

namespace App\Http\Controllers\Api\v1\User;

use App\Http\Controllers\Controller;
use App\Http\Requests\User\StoreUserFreelancerRequest;
use App\Http\Requests\User\UpdateUserFreelancerRequest;
use App\Http\Resources\User\UserFreelancerResource;
use App\Models\User;
use App\Services\User\UserFreelancerService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UserFreelancerController extends Controller
{
    public function __construct(
        protected UserFreelancerService $userService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $this->ensureAuthorized($request);
        $perPage = (int) $request->input('per_page', 15);
        $users = $this->userService->getUsers($request->all(), $perPage);
        return UserFreelancerResource::collection($users);
    }

    public function store(StoreUserFreelancerRequest $request): JsonResponse
    {
        $user = $this->userService->createUser($request->validated());
        return (new UserFreelancerResource($user))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Request $request, User $freelancer): UserFreelancerResource
    {
        // the parameter name is $freelancer due to routes definitions 'freelancer' => 'user'
        $user = $freelancer;
        $this->ensureAuthorized($request);
        $this->ensureIsFreelancerUser($user);
        return new UserFreelancerResource($user->load(['comisiones', 'freelancer']));
    }

    public function update(UpdateUserFreelancerRequest $request, User $freelancer): UserFreelancerResource
    {
        $user = $freelancer;
        $this->ensureIsFreelancerUser($user);
        $updatedUser = $this->userService->updateUser($user, $request->validated());
        return new UserFreelancerResource($updatedUser);
    }

    public function toggleStatus(Request $request, User $freelancer): UserFreelancerResource
    {
        $user = $freelancer;
        $this->ensureAuthorized($request, true);
        $this->ensureIsFreelancerUser($user);
        $toggled = $this->userService->toggleStatus($user);
        return new UserFreelancerResource($toggled);
    }

    public function assignMetodosPago(Request $request, User $freelancer): JsonResponse
    {
        $user = $freelancer;
        $this->ensureAuthorized($request, true);
        $this->ensureIsFreelancerUser($user);

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

    public function destroy(Request $request, User $freelancer): JsonResponse
    {
        $user = $freelancer;
        $this->ensureAuthorized($request, true);
        $this->ensureIsFreelancerUser($user);
        $this->userService->deleteUser($user);
        return response()->json(['message' => 'Usuario Freelancer eliminado correctamente.']);
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

    private function ensureIsFreelancerUser(User $user): void
    {
        if ($user->level !== 'Freelancer' || $user->id_freelancer === null) {
            abort(404, 'Usuario no pertenece a los freelancers.');
        }
    }
}
