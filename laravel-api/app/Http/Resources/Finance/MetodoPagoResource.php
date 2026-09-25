<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MetodoPagoResource extends JsonResource
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
            'nombre' => $this->nombre,
            'nombre_publico' => $this->nombre_publico,
            'tipo' => $this->tipo,
            'logo' => $this->logo,
            'status' => (bool) $this->status,
            'banco' => $this->banco ? [
                'titular' => $this->banco->titular,
                'tipo_documento' => $this->banco->tipo_documento,
                'documento' => $this->banco->documento,
                'numero_cuenta' => $this->banco->numero_cuenta,
                'tipo_cuenta' => $this->banco->tipo_cuenta,
                'pago_movil_telefono' => $this->banco->pago_movil_telefono,
            ] : null,
            'digital' => $this->digital ? [
                'correo_cuenta' => $this->digital->correo_cuenta,
                'tipo_comision' => $this->digital->tipo_comision,
                'comision_valor' => (float) $this->digital->comision_valor,
                'codigo_postal' => $this->digital->codigo_postal,
                'direccion_facturacion' => $this->digital->direccion_facturacion,
            ] : null,
            'asesores' => $this->asesores->map(function ($a) {
                return [
                    'id' => $a->id,
                    'id_asesor' => $a->id_asesor,
                    'asesor' => $a->asesor,
                    'email' => $a->user?->email,
                ];
            }),
            'pagos_count' => $this->pagosVentaCount(),
        ];
    }
}
