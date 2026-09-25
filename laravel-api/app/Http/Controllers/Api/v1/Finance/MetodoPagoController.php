<?php

namespace App\Http\Controllers\Api\v1\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\StoreMetodoPagoRequest;
use App\Http\Requests\Finance\UpdateMetodoPagoRequest;
use App\Http\Resources\Finance\MetodoPagoResource;
use App\Models\Finance\MetodoPago;
use App\Services\Finance\MetodoPagoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class MetodoPagoController extends Controller
{
    public function __construct(
        protected MetodoPagoService $metodoPagoService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $perPage = (int) $request->input('per_page', 15);
        $metodos = $this->metodoPagoService->getMetodosPago($request->all(), $perPage);
        return MetodoPagoResource::collection($metodos);
    }

    public function store(StoreMetodoPagoRequest $request): JsonResponse
    {
        $metodo = $this->metodoPagoService->createMetodoPago($request->validated());
        return (new MetodoPagoResource($metodo))->response()->setStatusCode(201);
    }

    public function show(MetodoPago $metodoPago): MetodoPagoResource
    {
        return new MetodoPagoResource($metodoPago->load(['banco', 'digital', 'asesores.user']));
    }

    public function update(UpdateMetodoPagoRequest $request, MetodoPago $metodoPago): MetodoPagoResource
    {
        $updated = $this->metodoPagoService->updateMetodoPago($metodoPago, $request->validated());
        return new MetodoPagoResource($updated);
    }

    public function toggleStatus(Request $request, MetodoPago $metodoPago): MetodoPagoResource
    {
        $this->ensureAdmin($request);
        $toggled = $this->metodoPagoService->toggleStatus($metodoPago);
        return new MetodoPagoResource($toggled);
    }

    public function destroy(Request $request, MetodoPago $metodoPago): JsonResponse
    {
        $this->ensureAdmin($request);
        $this->metodoPagoService->deleteMetodoPago($metodoPago);
        return response()->json(['message' => 'Método de pago eliminado correctamente.']);
    }

    public function assignAsesores(Request $request, MetodoPago $metodoPago): MetodoPagoResource
    {
        $this->ensureAdmin($request);
        $validated = $request->validate([
            'asesores' => ['required', 'array'],
            'asesores.*' => ['integer', 'exists:user,id'],
        ]);
        $this->metodoPagoService->assignAsesores($metodoPago->id, $validated['asesores']);
        return new MetodoPagoResource($metodoPago->fresh(['banco', 'digital', 'asesores.user']));
    }

    private function ensureAdmin(Request $request): void
    {
        $user = $request->user();
        if (!$user || !in_array($user->level, ['Admin', 'Administrador', 'Sub Gerente'], true)) {
            abort(403, 'Acceso restringido a administradores.');
        }
    }
}
