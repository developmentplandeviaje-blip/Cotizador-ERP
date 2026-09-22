<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreVehiculoRequest;
use App\Http\Requests\Catalog\UpdateVehiculoRequest;
use App\Http\Resources\Catalog\VehiculoResource;
use App\Models\Catalog\Vehiculo;
use App\Services\Catalog\VehiculoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Validation\ValidationException;

class VehiculoController extends Controller
{
    public function __construct(
        private readonly VehiculoService $vehiculoService
    ) {}

    public function index(Request $request): AnonymousResourceCollection
    {
        $filters = $request->only(['search', 'id_ubicacion', 'id_vehiculo_agencia', 'sort_by', 'sort_dir']);
        $perPage = $request->has('per_page') ? (int) $request->get('per_page') : 10;

        if ($request->boolean('all') || $perPage === 0) {
            $perPage = 0;
        }

        $vehiculos = $this->vehiculoService->getVehiculos($filters, $perPage);

        return VehiculoResource::collection($vehiculos);
    }

    public function store(StoreVehiculoRequest $request): JsonResponse
    {
        $vehiculo = $this->vehiculoService->createVehiculo($request->validated());

        return (new VehiculoResource($vehiculo))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Vehiculo $vehiculo): VehiculoResource
    {
        $vehiculo->load(['agencia.ubicacion', 'tarifas']);

        return new VehiculoResource($vehiculo);
    }

    public function update(UpdateVehiculoRequest $request, Vehiculo $vehiculo): VehiculoResource
    {
        $updated = $this->vehiculoService->updateVehiculo($vehiculo, $request->validated());

        return new VehiculoResource($updated);
    }

    public function destroy(Vehiculo $vehiculo): JsonResponse
    {
        try {
            $this->vehiculoService->deleteVehiculo($vehiculo);

            return response()->json([
                'message' => 'Vehículo eliminado exitosamente.',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'message' => $e->getMessage(),
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al eliminar el vehículo: ' . $e->getMessage(),
            ], 500);
        }
    }
}
