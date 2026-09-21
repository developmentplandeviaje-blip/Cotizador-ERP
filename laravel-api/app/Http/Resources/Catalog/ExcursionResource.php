<?php

namespace App\Http\Resources\Catalog;

use App\Services\Catalog\PricingEngine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExcursionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $pricingEngine = app(PricingEngine::class);
        $user = $request->user();
        $isFreelancer = $pricingEngine->shouldHideNetCosts($user);

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
            'tipo_excursion' => $this->tipo_excursion,
            'aplica_descuento_referidos' => (bool) $this->aplica_descuento_referidos,
            'date_creation' => $this->date_creation
                ? (is_string($this->date_creation) ? $this->date_creation : $this->date_creation->format('Y-m-d H:i:s'))
                : null,
            'fecha_actualizacion' => $this->fecha_actualizacion
                ? (is_string($this->fecha_actualizacion) ? $this->fecha_actualizacion : $this->fecha_actualizacion->format('Y-m-d H:i:s'))
                : null,
        ];

        if ($isFreelancer) {
            // US-03: Apply markup to selling prices and hide supplier net costs and profit margins
            $data['precio_adulto'] = $pricingEngine->calculateSellingPrice((float) $this->precio_adulto);
            $data['precio_nino'] = $pricingEngine->calculateSellingPrice((float) $this->precio_nino);
        } else {
            // Agency staff: Full visibility of net costs, margins and base prices
            $data['costo_adulto'] = (float) $this->costo_adulto;
            $data['precio_adulto'] = (float) $this->precio_adulto;
            $data['porcentaje_adulto'] = $this->porcentaje_adulto !== null ? (float) $this->porcentaje_adulto : null;

            $data['costo_nino'] = (float) $this->costo_nino;
            $data['precio_nino'] = (float) $this->precio_nino;
            $data['porcentaje_nino'] = $this->porcentaje_nino !== null ? (float) $this->porcentaje_nino : null;
        }

        return $data;
    }
}
