<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreAerolineaRequest;
use App\Http\Requests\Catalog\UpdateAerolineaRequest;
use App\Http\Resources\Catalog\AerolineaResource;
use App\Models\Catalog\Aerolinea;
use App\Services\Catalog\AerolineaService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class AerolineaController extends Controller
{
    public function __construct(
        private readonly AerolineaService $aerolineaService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->only(['search', 'sort_by', 'sort_dir']);
        $perPage = $request->has('per_page') ? (int) $request->get('per_page') : 10;

        if ($request->boolean('all') || $perPage === 0) {
            $perPage = 0;
        }

        $aerolineas = $this->aerolineaService->getAerolineas($filters, $perPage);

        return AerolineaResource::collection($aerolineas);
    }

    public function store(StoreAerolineaRequest $request): JsonResponse
    {
        $aerolinea = $this->aerolineaService->createAerolinea($request->validated());

        return (new AerolineaResource($aerolinea))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Aerolinea $aerolinea): AerolineaResource
    {
        return new AerolineaResource($aerolinea);
    }

    public function update(UpdateAerolineaRequest $request, Aerolinea $aerolinea): AerolineaResource
    {
        $updated = $this->aerolineaService->updateAerolinea($aerolinea, $request->validated());

        return new AerolineaResource($updated);
    }

    public function destroy(Aerolinea $aerolinea): JsonResponse
    {
        try {
            $this->aerolineaService->deleteAerolinea($aerolinea);

            return response()->json([
                'message' => 'Aerolínea eliminada exitosamente.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la aerolínea: ' . $e->getMessage(),
            ], 500);
        }
    }
}
