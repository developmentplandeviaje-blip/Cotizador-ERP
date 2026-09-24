<?php

namespace App\Http\Resources\Catalog;

use App\Services\Catalog\PricingEngine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TrasladoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $data = [
            'id' => $this->id,
            'id_ubicacion' => (int) $this->id_ubicacion,
            'ubicacion' => $this->whenLoaded('ubicacion', function () {
                return $this->ubicacion ? [
                    'id' => $this->ubicacion->id,
                    'ubicacion' => $this->ubicacion->ubicacion,
                ] : null;
            }),
            'nombre_ubicacion' => $this->ubicacion?->ubicacion,
            'ruta_origen' => $this->ruta_origen,
            'ruta_destino' => $this->ruta_destino,
            'tipo_servicio' => $this->tipo_servicio,
            'costo' => (float) $this->costo,
            'precio_publico' => (float) $this->precio_publico,
            'porcentaje' => (float) $this->porcentaje,
        ];

        return app(PricingEngine::class)->formatTrasladoForUser($data, $request->user());
    }
}
