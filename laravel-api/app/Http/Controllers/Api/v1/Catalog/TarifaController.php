<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreTarifaRequest;
use App\Http\Resources\Catalog\TarifaHabitacionResource;
use App\Models\Catalog\TarifaHabitacion;
use App\Models\Catalog\HabitacionHotel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class TarifaController extends Controller
{
    public function index(HabitacionHotel $habitacion): AnonymousResourceCollection
    {
        $tarifas = $habitacion->tarifas()->orderBy('desde', 'asc')->get();

        return TarifaHabitacionResource::collection($tarifas);
    }

    public function store(StoreTarifaRequest $request): JsonResponse
    {
        $data = $request->validated();

        if (empty($data['desde_venta'])) {
            $data['desde_venta'] = $data['desde'] ?? null;
        }
        if (empty($data['hasta_venta'])) {
            $data['hasta_venta'] = $data['hasta'] ?? null;
        }

        $tarifa = TarifaHabitacion::create($data);

        return (new TarifaHabitacionResource($tarifa))
            ->response()
            ->setStatusCode(201);
    }

    public function show(TarifaHabitacion $tarifa): TarifaHabitacionResource
    {
        return new TarifaHabitacionResource($tarifa);
    }

    public function destroy(TarifaHabitacion $tarifa): JsonResponse
    {
        $tarifa->delete();

        return response()->json(['message' => 'Tarifa eliminada exitosamente.']);
    }
}
