<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HabitacionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_hotel' => $this->id_hotel,
            'habitacion' => $this->habitacion,
            'cantidad_personas' => (int) $this->cantidad_personas,
            'minimo_noches' => (int) $this->minimo_noches,
            'posicion' => (int) $this->posicion,
            'por_defecto' => (bool) $this->por_defecto,
            'nota' => $this->nota,
            'tarifas' => TarifaHabitacionResource::collection($this->whenLoaded('tarifas')),
        ];
    }
}
