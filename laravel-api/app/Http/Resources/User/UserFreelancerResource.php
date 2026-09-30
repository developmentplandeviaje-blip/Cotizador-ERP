<?php

namespace App\Http\Resources\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserFreelancerResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => trim("{$this->first_name} {$this->last_name}"),
            'email' => $this->email,
            'level' => $this->level,
            'status' => (bool) $this->status,
            'date_creation' => $this->date_creation,
            
            // Freelancer Company Data
            'freelancer' => $this->whenLoaded('freelancer', function () {
                return [
                    'id' => $this->freelancer->id,
                    'nombre' => $this->freelancer->nombre,
                    'rif' => $this->freelancer->rif,
                    'telefono_1' => $this->freelancer->telefono_1,
                    'telefono_2' => $this->freelancer->telefono_2,
                    'direccion' => $this->freelancer->direccion,
                    'color_primario' => $this->freelancer->color_primario,
                    'status' => (bool) $this->freelancer->status,
                ];
            }),

            'comisiones' => $this->getComisionesMap(),
            'ventas_count' => $this->ventasCount(),
            'cotizaciones_count' => $this->cotizacionesCount(),
        ];
    }
}
