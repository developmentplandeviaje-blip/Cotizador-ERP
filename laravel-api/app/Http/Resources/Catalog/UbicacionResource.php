<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UbicacionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'ubicacion' => $this->ubicacion,
            'hoteles_count' => $this->hoteles_count ?? ($this->relationLoaded('hoteles') ? $this->hoteles->count() : 0),
            'date_creation' => $this->date_creation ? (is_string($this->date_creation) ? $this->date_creation : $this->date_creation->format('Y-m-d H:i:s')) : null,
        ];
    }
}
