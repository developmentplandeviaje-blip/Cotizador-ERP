<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreVehiculoAgenciaRequest;
use App\Http\Requests\Catalog\UpdateVehiculoAgenciaRequest;
use App\Http\Resources\Catalog\VehiculoAgenciaResource;
use App\Models\Catalog\VehiculoAgencia;
use App\Services\Catalog\VehiculoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class VehiculoAgenciaController extends Controller
{
    public function __construct(
        private readonly VehiculoService $vehiculoService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $idUbicacion = $request->filled('id_ubicacion') ? (int) $request->get('id_ubicacion') : null;
        $agencias = $this->vehiculoService->getAgencias($idUbicacion);

        return VehiculoAgenciaResource::collection($agencias);
    }

    public function store(StoreVehiculoAgenciaRequest $request): JsonResponse
    {
        $agencia = $this->vehiculoService->createAgencia($request->validated());

        return (new VehiculoAgenciaResource($agencia))
            ->response()
            ->setStatusCode(201);
    }

    public function show(VehiculoAgencia $agencia): VehiculoAgenciaResource
    {
        $agencia->load('ubicacion');

        return new VehiculoAgenciaResource($agencia);
    }

    public function update(UpdateVehiculoAgenciaRequest $request, VehiculoAgencia $agencia): VehiculoAgenciaResource
    {
        $updated = $this->vehiculoService->updateAgencia($agencia, $request->validated());

        return new VehiculoAgenciaResource($updated);
    }

    public function destroy(VehiculoAgencia $agencia): JsonResponse
    {
        try {
            $this->vehiculoService->deleteAgencia($agencia);

            return response()->json([
                'message' => 'Agencia de alquiler eliminada exitosamente.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar la agencia: ' . $e->getMessage(),
            ], 500);
        }
    }
}
