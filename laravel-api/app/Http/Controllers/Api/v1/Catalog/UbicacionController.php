<?php

namespace App\Http\Controllers\Api\v1\Catalog;

use App\Http\Controllers\Controller;
use App\Http\Resources\Catalog\UbicacionResource;
use App\Models\Catalog\Ubicacion;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class UbicacionController extends Controller
{
    public function index(): AnonymousResourceCollection
    {
        $ubicaciones = Ubicacion::withCount('hoteles')
            ->orderBy('ubicacion', 'asc')
            ->get();

        return UbicacionResource::collection($ubicaciones);
    }
}
