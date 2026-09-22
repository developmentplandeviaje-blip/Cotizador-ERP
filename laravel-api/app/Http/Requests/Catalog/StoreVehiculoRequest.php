<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehiculoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_vehiculo_agencia' => ['required', 'integer', 'exists:vehiculo_agencia,id'],
            'marca' => ['required', 'string', 'max:200'],
            'vehiculo' => ['required', 'string', 'max:200'],
            'ano' => ['required', 'string', 'max:200'],
            'tipo_vehiculo' => ['required', 'string', 'max:200'],
            'tipo_transmision' => ['required', 'string', 'max:200'],
            'nota' => ['nullable', 'string'],
            // Optional initial tariff fields
            'costo' => ['nullable', 'numeric', 'min:0'],
            'precio' => ['nullable', 'numeric', 'min:0'],
            'porcentaje' => ['nullable', 'numeric'],
            'promocion' => ['nullable', 'boolean'],
            'desde' => ['nullable', 'date'],
            'hasta' => ['nullable', 'date'],
            'desde_venta' => ['nullable', 'date'],
            'hasta_venta' => ['nullable', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_vehiculo_agencia.required' => 'Debe seleccionar una agencia de alquiler válida.',
            'id_vehiculo_agencia.exists' => 'La agencia seleccionada no existe en el sistema.',
            'marca.required' => 'La marca del vehículo es obligatoria.',
            'vehiculo.required' => 'El modelo o nombre del vehículo es obligatorio.',
            'ano.required' => 'El año del vehículo es obligatorio.',
            'tipo_vehiculo.required' => 'El tipo de vehículo es obligatorio.',
            'tipo_transmision.required' => 'El tipo de transmisión es obligatorio.',
        ];
    }
}
