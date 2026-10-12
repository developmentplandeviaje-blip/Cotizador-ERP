<?php

namespace App\Http\Resources\Catalog;

use App\Services\Catalog\PricingEngine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TarifaHabitacionResource extends JsonResource
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
            'id_habitacion' => $this->id_habitacion,
            'desde' => $this->desde ? $this->desde->format('Y-m-d') : null,
            'hasta' => $this->hasta ? $this->hasta->format('Y-m-d') : null,
            'desde_venta' => $this->desde_venta ? $this->desde_venta->format('Y-m-d') : null,
            'hasta_venta' => $this->hasta_venta ? $this->hasta_venta->format('Y-m-d') : null,
            'ninos_gratis' => (int) $this->ninos_gratis,
            'noches_gratis' => (int) $this->noches_gratis,
            'promocion' => (bool) $this->promocion,
            'suplemento' => (bool) $this->suplemento,
            'moneda' => $this->moneda ?? 'USD',
        ];

        if ($isFreelancer) {
            // US-03: Apply markup to selling prices and hide supplier net costs
            $data['precio_noche_adulto'] = $pricingEngine->calculateSellingPrice((float) $this->precio_noche_adulto);
            $data['precio_noche_adolescente'] = $pricingEngine->calculateSellingPrice((float) $this->precio_noche_adolescente);
            $data['precio_noche_nino'] = $pricingEngine->calculateSellingPrice((float) $this->precio_noche_nino);
        } else {
            // Admin / Líder / Asesor: Full visibility of net costs and public prices
            $data['costo_noche_adulto'] = (float) $this->costo_noche_adulto;
            $data['precio_noche_adulto'] = (float) $this->precio_noche_adulto;
            $data['porcentaje_adulto'] = (float) $this->porcentaje_adulto;

            $data['costo_noche_adolescente'] = (float) $this->costo_noche_adolescente;
            $data['precio_noche_adolescente'] = (float) $this->precio_noche_adolescente;
            $data['porcentaje_adolescente'] = (float) $this->porcentaje_adolescente;

            $data['costo_noche_nino'] = (float) $this->costo_noche_nino;
            $data['precio_noche_nino'] = (float) $this->precio_noche_nino;
            $data['porcentaje_nino'] = (float) $this->porcentaje_nino;
        }

        return $data;
    }
}
