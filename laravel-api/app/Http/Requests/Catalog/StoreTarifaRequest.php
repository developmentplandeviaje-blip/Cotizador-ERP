<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreTarifaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_habitacion' => ['required', 'integer', 'exists:habitacion_hotel,id'],
            'desde' => ['required', 'date'],
            'hasta' => ['required', 'date', 'after_or_equal:desde'],
            'desde_venta' => ['nullable', 'date'],
            'hasta_venta' => ['nullable', 'date'],
            'costo_noche_adulto' => ['nullable', 'numeric', 'min:0'],
            'precio_noche_adulto' => ['required', 'numeric', 'min:0'],
            'porcentaje_adulto' => ['nullable', 'numeric', 'min:0'],
            'costo_noche_adolescente' => ['nullable', 'numeric', 'min:0'],
            'precio_noche_adolescente' => ['nullable', 'numeric', 'min:0'],
            'porcentaje_adolescente' => ['nullable', 'numeric', 'min:0'],
            'costo_noche_nino' => ['nullable', 'numeric', 'min:0'],
            'precio_noche_nino' => ['nullable', 'numeric', 'min:0'],
            'porcentaje_nino' => ['nullable', 'numeric', 'min:0'],
            'ninos_gratis' => ['nullable', 'integer', 'min:0'],
            'noches_gratis' => ['nullable', 'integer', 'min:0'],
            'promocion' => ['nullable', 'boolean'],
            'suplemento' => ['nullable', 'boolean'],
            'moneda' => ['nullable', 'string', 'max:10'],
        ];
    }
}
