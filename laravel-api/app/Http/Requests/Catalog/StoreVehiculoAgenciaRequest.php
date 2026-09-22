<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreVehiculoAgenciaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_ubicacion' => ['required', 'integer', 'exists:ubicacion,id'],
            'agencia' => ['required', 'string', 'max:200'],
            'nota' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_ubicacion.required' => 'Debe seleccionar una ubicación válida para la agencia.',
            'id_ubicacion.exists' => 'La ubicación seleccionada no existe en el catálogo.',
            'agencia.required' => 'El nombre de la agencia es obligatorio.',
            'agencia.max' => 'El nombre de la agencia no debe superar los 200 caracteres.',
        ];
    }
}
