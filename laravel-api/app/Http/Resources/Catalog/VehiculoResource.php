<?php

namespace App\Http\Resources\Catalog;

use App\Services\Catalog\PricingEngine;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VehiculoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        $pricingEngine = app(PricingEngine::class);
        $user = $request->user();
        $isFreelancer = $pricingEngine->shouldHideNetCosts($user);

        // Find current or latest tariff
        $tarifas = $this->whenLoaded('tarifas');
        $latestTarifa = null;
        $hasPromocion = false;

        if ($this->relationLoaded('tarifas') && $this->tarifas->isNotEmpty()) {
            $latestTarifa = $this->tarifas->sortByDesc('id')->first();
            $hasPromocion = $this->tarifas->contains('promocion', true);
        }

        $tarifaActivaData = null;
        if ($latestTarifa) {
            $tarifaActivaData = [
                'id' => $latestTarifa->id,
                'desde' => $latestTarifa->desde ? (is_string($latestTarifa->desde) ? $latestTarifa->desde : $latestTarifa->desde->format('Y-m-d H:i:s')) : null,
                'hasta' => $latestTarifa->hasta ? (is_string($latestTarifa->hasta) ? $latestTarifa->hasta : $latestTarifa->hasta->format('Y-m-d H:i:s')) : null,
                'promocion' => (bool) $latestTarifa->promocion,
            ];

            if ($isFreelancer) {
                $tarifaActivaData['precio'] = $pricingEngine->calculateSellingPrice((float) $latestTarifa->precio);
            } else {
                $tarifaActivaData['costo'] = (float) $latestTarifa->costo;
                $tarifaActivaData['precio'] = (float) $latestTarifa->precio;
                $tarifaActivaData['porcentaje'] = (float) $latestTarifa->porcentaje;
            }
        }

        return [
            'id' => $this->id,
            'id_vehiculo_agencia' => (int) $this->id_vehiculo_agencia,
            'marca' => $this->marca,
            'vehiculo' => $this->vehiculo,
            'ano' => $this->ano,
            'tipo_vehiculo' => $this->tipo_vehiculo,
            'tipo_transmision' => $this->tipo_transmision,
            'nota' => $this->nota,
            'nombre_agencia' => $this->agencia?->agencia,
            'nombre_ubicacion' => $this->agencia?->ubicacion?->ubicacion,
            'id_ubicacion' => $this->agencia?->id_ubicacion,
            'agencia' => $this->whenLoaded('agencia', function () {
                return $this->agencia ? [
                    'id' => $this->agencia->id,
                    'agencia' => $this->agencia->agencia,
                    'id_ubicacion' => $this->agencia->id_ubicacion,
                    'ubicacion' => $this->agencia->ubicacion?->ubicacion,
                ] : null;
            }),
            'has_promocion' => $hasPromocion,
            'tarifa_activa' => $tarifaActivaData,
            'tarifas' => VehiculoTarifaResource::collection($this->whenLoaded('tarifas')),
        ];
    }
}
