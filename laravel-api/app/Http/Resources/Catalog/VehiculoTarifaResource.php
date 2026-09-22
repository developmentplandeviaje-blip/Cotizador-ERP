<?php

namespace App\Http\Resources\Catalog;

use App\Services\Catalog\PricingEngine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehiculoTarifaResource extends JsonResource
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
            'id_vehiculo' => (int) $this->id_vehiculo,
            'desde' => $this->desde ? (is_string($this->desde) ? $this->desde : $this->desde->format('Y-m-d H:i:s')) : null,
            'hasta' => $this->hasta ? (is_string($this->hasta) ? $this->hasta : $this->hasta->format('Y-m-d H:i:s')) : null,
            'desde_venta' => $this->desde_venta ? (is_string($this->desde_venta) ? $this->desde_venta : $this->desde_venta->format('Y-m-d H:i:s')) : null,
            'hasta_venta' => $this->hasta_venta ? (is_string($this->hasta_venta) ? $this->hasta_venta : $this->hasta_venta->format('Y-m-d H:i:s')) : null,
            'promocion' => (bool) $this->promocion,
            'fecha_actualizacion' => $this->fecha_actualizacion ? (is_string($this->fecha_actualizacion) ? $this->fecha_actualizacion : $this->fecha_actualizacion->format('Y-m-d H:i:s')) : null,
        ];

        if ($isFreelancer) {
            $data['precio'] = $pricingEngine->calculateSellingPrice((float) $this->precio);
        } else {
            $data['costo'] = (float) $this->costo;
            $data['precio'] = (float) $this->precio;
            $data['porcentaje'] = (float) $this->porcentaje;
        }

        return $data;
    }
}
