<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreVehiculoTarifaRequest;
use App\Http\Resources\Catalog\VehiculoTarifaResource;
use App\Models\Catalog\Vehiculo;
use App\Models\Catalog\VehiculoTarifa;
use App\Services\Catalog\VehiculoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class VehiculoTarifaController extends Controller
{
    public function __construct(
        private readonly VehiculoService $vehiculoService
    ) {}

    public function index(Vehiculo $vehiculo): AnonymousResourceCollection
    {
        return VehiculoTarifaResource::collection($vehiculo->tarifas()->orderBy('desde', 'desc')->get());
    }

    public function store(StoreVehiculoTarifaRequest $request, Vehiculo $vehiculo): JsonResponse
    {
        $tarifa = $this->vehiculoService->addTarifa($vehiculo, $request->validated());

        return (new VehiculoTarifaResource($tarifa))
            ->response()
            ->setStatusCode(201);
    }

    public function destroy(VehiculoTarifa $tarifa): JsonResponse
    {
        $this->vehiculoService->deleteTarifa($tarifa);

        return response()->json([
            'message' => 'Tarifa de vehículo eliminada exitosamente.',
        ]);
    }
}
