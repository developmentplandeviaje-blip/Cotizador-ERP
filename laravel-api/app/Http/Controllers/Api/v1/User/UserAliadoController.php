<?php

namespace App\Http\Controllers\Api\v1\User;

use App\Http\Controllers\Controller;
use App\Models\Aliado;
use App\Models\User;
use App\Services\User\UserAliadoService;
use App\Http\Requests\User\StoreAliadoRequest;
use App\Http\Requests\User\UpdateAliadoRequest;
use App\Http\Requests\User\StoreAliadoVendedorRequest;
use App\Http\Requests\User\UpdateAliadoVendedorRequest;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class UserAliadoController extends Controller
{
    public function __construct(private UserAliadoService $service)
    {
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

    /**
     * Display a listing of Aliados.
     */
    public function index(Request $request): JsonResponse
    {
        $this->ensureAuthorized($request);
        $query = Aliado::withCount('usuarios');

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('razon_social', 'like', "%{$s}%")
                  ->orWhere('rif', 'like', "%{$s}%")
                  ->orWhere('correo', 'like', "%{$s}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $sortField = $request->get('sort_by', 'id');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortField, $sortOrder);

        $perPage = $request->get('per_page', 10);
        $aliados = $query->paginate($perPage);

        return response()->json($aliados);
    }

    /**
     * Store a newly created Aliado.
     */
    public function store(StoreAliadoRequest $request): JsonResponse
    {
        $this->ensureAuthorized($request);
        $aliado = $this->service->createAliado($request->validated());
        return response()->json(['data' => $aliado], 201);
    }

    /**
     * Display the specified Aliado.
     */
    public function show(Request $request, Aliado $aliado): JsonResponse
    {
        $this->ensureAuthorized($request);
        $aliado->loadCount('usuarios');
        return response()->json(['data' => $aliado]);
    }

    /**
     * Update the specified Aliado.
     */
    public function update(UpdateAliadoRequest $request, Aliado $aliado): JsonResponse
    {
        $this->ensureAuthorized($request);
        $updated = $this->service->updateAliado($aliado, $request->validated());
        return response()->json(['data' => $updated]);
    }

    /**
     * Remove the specified Aliado.
     */
    public function destroy(Request $request, Aliado $aliado): JsonResponse
    {
        $this->ensureAuthorized($request, true);
        if ($aliado->usuarios()->count() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar un aliado que posee vendedores asociados.'
            ], 422);
        }

        $this->service->deleteAliado($aliado);
        return response()->json(null, 204);
    }

    /**
     * Toggle status for an Aliado.
     */
    public function toggleStatus(Request $request, Aliado $aliado): JsonResponse
    {
        $this->ensureAuthorized($request, true);
        $aliado->update(['status' => !$aliado->status]);
        return response()->json(['data' => $aliado]);
    }

    // --- Vendedores endpoints ---

    /**
     * List sellers for a specific Aliado.
     */
    public function indexVendedores(Request $request, Aliado $aliado): JsonResponse
    {
        $this->ensureAuthorized($request);
        $query = $aliado->usuarios();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(function($q) use ($s) {
                $q->where('first_name', 'like', "%{$s}%")
                  ->orWhere('last_name', 'like', "%{$s}%")
                  ->orWhere('email', 'like', "%{$s}%");
            });
        }

        $vendedores = $query->get();
        return response()->json(['data' => $vendedores]);
    }

    /**
     * Store a new seller under an Aliado.
     */
    public function storeVendedor(StoreAliadoVendedorRequest $request, Aliado $aliado): JsonResponse
    {
        $this->ensureAuthorized($request);
        $vendedor = $this->service->createVendedor($aliado, $request->validated());
        return response()->json(['data' => $vendedor], 201);
    }

    /**
     * Update a seller under an Aliado.
     */
    public function updateVendedor(UpdateAliadoVendedorRequest $request, Aliado $aliado, User $user): JsonResponse
    {
        $this->ensureAuthorized($request);
        if ($user->id_aliado !== $aliado->id) {
            return response()->json(['message' => 'El vendedor no pertenece a este aliado.'], 403);
        }

        $updated = $this->service->updateVendedor($user, $request->validated());
        return response()->json(['data' => $updated]);
    }

    /**
     * Delete a seller under an Aliado.
     */
    public function destroyVendedor(Request $request, Aliado $aliado, User $user): JsonResponse
    {
        $this->ensureAuthorized($request, true);
        if ($user->id_aliado !== $aliado->id) {
            return response()->json(['message' => 'El vendedor no pertenece a este aliado.'], 403);
        }

        if ($user->ventasCount() > 0 || $user->cotizacionesCount() > 0) {
            return response()->json([
                'message' => 'No se puede eliminar el usuario porque tiene ventas o cotizaciones asociadas.'
            ], 422);
        }

        $this->service->deleteVendedor($user);
        return response()->json(null, 204);
    }
}
