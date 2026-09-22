<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StorePaqueteRequest;
use App\Http\Requests\Catalog\UpdatePaqueteRequest;
use App\Http\Resources\Catalog\PaqueteResource;
use App\Models\Catalog\Paquete;
use App\Services\Catalog\PaqueteService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class PaqueteController extends Controller
{
    public function __construct(
        private readonly PaqueteService $paqueteService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->only(['search', 'id_ubicacion', 'sort_by', 'sort_dir']);
        $perPage = $request->has('per_page') ? (int) $request->get('per_page') : 10;

        if ($request->boolean('all') || $perPage === 0) {
            $perPage = 0;
        }

        $paquetes = $this->paqueteService->getPaquetes($filters, $perPage);

        return PaqueteResource::collection($paquetes);
    }

    public function store(StorePaqueteRequest $request): JsonResponse
    {
        $paquete = $this->paqueteService->createPaquete($request->validated());

        return (new PaqueteResource($paquete))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Paquete $paquete): PaqueteResource
    {
        $paquete->load('ubicacion');

        return new PaqueteResource($paquete);
    }

    public function update(UpdatePaqueteRequest $request, Paquete $paquete): PaqueteResource
    {
        $updated = $this->paqueteService->updatePaquete($paquete, $request->validated());

        return new PaqueteResource($updated);
    }

    public function destroy(Paquete $paquete): JsonResponse
    {
        try {
            $this->paqueteService->deletePaquete($paquete);

            return response()->json([
                'message' => 'Paquete eliminado exitosamente.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el paquete: ' . $e->getMessage(),
            ], 500);
        }
    }
}
