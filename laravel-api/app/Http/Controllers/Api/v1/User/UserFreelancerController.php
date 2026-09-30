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

    public function show(User $user): UserFreelancerResource
    {
        return new UserFreelancerResource($user->load(['freelancer', 'comisiones']));
    }

    public function update(UpdateUserFreelancerRequest $request, User $user): UserFreelancerResource
    {
        $updatedUser = $this->userService->updateUser($user, $request->validated());
        return new UserFreelancerResource($updatedUser);
    }

    public function toggleStatus(User $user): UserFreelancerResource
    {
        $toggled = $this->userService->toggleStatus($user);
        return new UserFreelancerResource($toggled);
    }

    public function destroy(User $user): JsonResponse
    {
        $this->userService->deleteUser($user);
        return response()->json([
            'message' => 'Usuario freelancer eliminado exitosamente.',
        ]);
    }
}
