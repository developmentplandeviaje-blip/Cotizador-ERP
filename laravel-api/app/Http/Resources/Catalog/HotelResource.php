<?php

namespace App\Http\Resources\Catalog;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HotelResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        // Extract commercial discount info
        $regla = $this->reglasComerciales->first();
        $descContado = ($regla && $regla->descuento_status && $regla->descuento_monto > 0)
            ? ((float) $regla->descuento_monto . '% Aplicado')
            : 'Inactivo';

        $descDivisas = ($regla && $regla->aumento_bolivares && $regla->aumento_bolivares_porcentaje > 0)
            ? ((float) $regla->aumento_bolivares_porcentaje . '% Aplicado')
            : 'Inactivo';

        return [
            'id' => $this->id,
            'id_ubicacion' => $this->id_ubicacion,
            'ubicacion_nombre' => $this->ubicacion ? $this->ubicacion->ubicacion : 'N/A',
            'nombre' => $this->nombre,
            'tipo' => $this->tipo,
            'edad_adolescentes' => $this->edad_adolescentes ?? '12 - 17',
            'edad_ninos' => $this->edad_ninos ?? '5 - 11',
            'edad_infantes' => $this->edad_infantes ?? '0 - 4',
            'nota' => $this->nota,
            'status' => (bool) $this->status,
            'estado_label' => $this->status ? 'Habilitado' : 'Deshabilitado',
            'desc_contado' => $descContado,
            'desc_divisas' => $descDivisas,
            'habitaciones_count' => $this->habitaciones ? $this->habitaciones->count() : 0,
            'habitaciones' => HabitacionResource::collection($this->whenLoaded('habitaciones')),
            'date_creation' => $this->date_creation ? $this->date_creation->format('Y-m-d H:i') : null,
        ];
    }
}
