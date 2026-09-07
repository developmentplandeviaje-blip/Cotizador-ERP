<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Requests\Catalog\StoreHabitacionRequest;
use App\Http\Resources\Catalog\HabitacionResource;
use App\Models\Catalog\HabitacionHotel;
use App\Models\Catalog\Hotel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class HabitacionController extends Controller
{
    public function index(Hotel $hotel): AnonymousResourceCollection
    {
        $habitaciones = $hotel->habitaciones()->with('tarifas')->get();

        return HabitacionResource::collection($habitaciones);
    }

    public function store(StoreHabitacionRequest $request): JsonResponse
    {
        $habitacion = HabitacionHotel::create($request->validated());

        return (new HabitacionResource($habitacion->load('tarifas')))
            ->response()
            ->setStatusCode(201);
    }

    public function show(HabitacionHotel $habitacion): HabitacionResource
    {
        return new HabitacionResource($habitacion->load('tarifas'));
    }

    public function destroy(HabitacionHotel $habitacion): JsonResponse
    {
        $habitacion->delete();

        return response()->json(['message' => 'Habitación eliminada exitosamente.']);
    }
}
