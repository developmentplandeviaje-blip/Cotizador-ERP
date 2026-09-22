<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehiculoAgenciaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'id_ubicacion' => (int) $this->id_ubicacion,
            'agencia' => $this->agencia,
            'nota' => $this->nota,
            'nombre_ubicacion' => $this->ubicacion?->ubicacion,
            'ubicacion' => $this->whenLoaded('ubicacion', function () {
                return $this->ubicacion ? [
                    'id' => $this->ubicacion->id,
                    'ubicacion' => $this->ubicacion->ubicacion,
                ] : null;
            }),
            'date_creation' => $this->date_creation ? (is_string($this->date_creation) ? $this->date_creation : $this->date_creation->format('Y-m-d H:i:s')) : null,
        ];
    }
}
