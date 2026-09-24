<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreTrasladoRequest;
use App\Http\Requests\Catalog\UpdateTrasladoRequest;
use App\Http\Resources\Catalog\TrasladoResource;
use App\Models\Catalog\Traslado;
use App\Services\Catalog\TrasladoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class TrasladoController extends Controller
{
    public function __construct(
        private readonly TrasladoService $trasladoService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->only(['search', 'id_ubicacion', 'tipo_servicio', 'sort_by', 'sort_dir']);
        $perPage = $request->has('per_page') ? (int) $request->get('per_page') : 10;

        if ($request->boolean('all') || $perPage === 0) {
            $perPage = 0;
        }

        $traslados = $this->trasladoService->getTraslados($filters, $perPage);

        return TrasladoResource::collection($traslados);
    }

    public function store(StoreTrasladoRequest $request): JsonResponse
    {
        $traslado = $this->trasladoService->createTraslado($request->validated());

        return (new TrasladoResource($traslado))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Traslado $traslado): TrasladoResource
    {
        $traslado->load('ubicacion');

        return new TrasladoResource($traslado);
    }

    public function update(UpdateTrasladoRequest $request, Traslado $traslado): TrasladoResource
    {
        $updated = $this->trasladoService->updateTraslado($traslado, $request->validated());

        return new TrasladoResource($updated);
    }

    public function destroy(Traslado $traslado): JsonResponse
    {
        try {
            $this->trasladoService->deleteTraslado($traslado);

            return response()->json([
                'message' => 'Traslado eliminado exitosamente.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el traslado: ' . $e->getMessage(),
            ], 500);
        }
    }
}
