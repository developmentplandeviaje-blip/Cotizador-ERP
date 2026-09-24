<?php

namespace App\Http\Resources\User;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserAgenciaResource extends JsonResource
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
            'comisiones' => $this->getComisionesMap(),
            'ventas_count' => $this->ventasCount(),
            'cotizaciones_count' => $this->cotizacionesCount(),
        ];
    }
}
