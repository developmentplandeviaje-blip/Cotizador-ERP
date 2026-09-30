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
        $freelancerData = null;
        if ($this->relationLoaded('freelancer') && $this->freelancer) {
            $freelancerData = [
                'id' => $this->freelancer->id,
                'nombre' => $this->freelancer->nombre,
                'rif' => $this->freelancer->rif,
                'correo' => $this->freelancer->correo,
                'telefono_1' => $this->freelancer->telefono_1,
                'telefono_2' => $this->freelancer->telefono_2,
                'direccion' => $this->freelancer->direccion,
                'color_primario' => $this->freelancer->color_primario,
                'logo_url' => $this->freelancer->logo_url,
                'hoja_membrete_config' => $this->freelancer->hoja_membrete_config,
                'status' => (bool) $this->freelancer->status,
            ];
        } elseif ($this->id_freelancer) {
            $f = \App\Models\Freelancer::find($this->id_freelancer);
            if ($f) {
                $freelancerData = [
                    'id' => $f->id,
                    'nombre' => $f->nombre,
                    'rif' => $f->rif,
                    'correo' => $f->correo,
                    'telefono_1' => $f->telefono_1,
                    'telefono_2' => $f->telefono_2,
                    'direccion' => $f->direccion,
                    'color_primario' => $f->color_primario,
                    'logo_url' => $f->logo_url,
                    'hoja_membrete_config' => $f->hoja_membrete_config,
                    'status' => (bool) $f->status,
                ];
            }
        }

        return [
            'id' => $this->id,
            'id_freelancer' => $this->id_freelancer,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'full_name' => trim("{$this->first_name} {$this->last_name}"),
            'email' => $this->email,
            'level' => $this->level,
            'status' => (bool) $this->status,
            'date_creation' => $this->date_creation,
            'freelancer' => $freelancerData,
            'comisiones' => $this->getComisionesMap(),
            'ventas_count' => $this->ventasCount(),
            'cotizaciones_count' => $this->cotizacionesCount(),
        ];
    }
}
