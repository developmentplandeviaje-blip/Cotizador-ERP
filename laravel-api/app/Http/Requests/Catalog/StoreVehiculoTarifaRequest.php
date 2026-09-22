<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehiculoTarifaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'desde' => ['required', 'date'],
            'hasta' => ['required', 'date', 'after_or_equal:desde'],
            'desde_venta' => ['nullable', 'date'],
            'hasta_venta' => ['nullable', 'date'],
            'costo' => ['required', 'numeric', 'min:0'],
            'precio' => ['required', 'numeric', 'min:0'],
            'porcentaje' => ['nullable', 'numeric'],
            'promocion' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'desde.required' => 'La fecha de inicio de vigencia es obligatoria.',
            'hasta.required' => 'La fecha de fin de vigencia es obligatoria.',
            'hasta.after_or_equal' => 'La fecha de fin no puede ser anterior a la fecha de inicio.',
            'costo.required' => 'El costo diario es obligatorio.',
            'precio.required' => 'El precio de venta diario es obligatorio.',
        ];
    }
}
