<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreUbicacionRequest;
use App\Http\Requests\Catalog\UpdateUbicacionRequest;
use App\Http\Resources\Catalog\UbicacionResource;
use App\Models\Catalog\Ubicacion;
use App\Services\Catalog\UbicacionService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class UbicacionController extends Controller
{
    public function __construct(
        private readonly UbicacionService $ubicacionService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->only(['search', 'sort_by', 'sort_dir']);
        $perPage = $request->has('per_page') ? (int) $request->get('per_page') : 10;

        if ($request->boolean('all') || $perPage === 0) {
            $perPage = 0;
        }

        $ubicaciones = $this->ubicacionService->getUbicaciones($filters, $perPage);

        return UbicacionResource::collection($ubicaciones);
    }

    public function store(StoreUbicacionRequest $request): JsonResponse
    {
        $ubicacion = $this->ubicacionService->createUbicacion($request->validated());

        return (new UbicacionResource($ubicacion))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Ubicacion $ubicacion): UbicacionResource
    {
        $ubicacion->loadCount('hoteles');

        return new UbicacionResource($ubicacion);
    }

    public function update(UpdateUbicacionRequest $request, Ubicacion $ubicacion): UbicacionResource
    {
        $updated = $this->ubicacionService->updateUbicacion($ubicacion, $request->validated());

        return new UbicacionResource($updated);
    }

    public function destroy(Ubicacion $ubicacion): JsonResponse
    {
        try {
            $this->ubicacionService->deleteUbicacion($ubicacion);

            return response()->json([
                'message' => 'Ubicación eliminada exitosamente.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la ubicación: ' . $e->getMessage(),
            ], 500);
        }
    }
}
