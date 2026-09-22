<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVehiculoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_vehiculo_agencia' => ['sometimes', 'integer', 'exists:vehiculo_agencia,id'],
            'marca' => ['sometimes', 'string', 'max:200'],
            'vehiculo' => ['sometimes', 'string', 'max:200'],
            'ano' => ['sometimes', 'string', 'max:200'],
            'tipo_vehiculo' => ['sometimes', 'string', 'max:200'],
            'tipo_transmision' => ['sometimes', 'string', 'max:200'],
            'nota' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_vehiculo_agencia.exists' => 'La agencia seleccionada no existe en el sistema.',
            'marca.max' => 'La marca no debe superar los 200 caracteres.',
            'vehiculo.max' => 'El nombre no debe superar los 200 caracteres.',
        ];
    }
}
