<?php

namespace App\Http\Resources\Catalog;

use App\Services\Catalog\PricingEngine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AerolineaResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'nombre' => $this->nombre,
            'vuelos_count' => (int) ($this->vuelos_count ?? $this->vuelosCount()),
            'date_creation' => $this->date_creation
                ? (is_string($this->date_creation) ? $this->date_creation : $this->date_creation->format('Y-m-d H:i:s'))
                : null,
        ];

        return app(PricingEngine::class)->formatAerolineaForUser($data, $request->user());
    }
}
