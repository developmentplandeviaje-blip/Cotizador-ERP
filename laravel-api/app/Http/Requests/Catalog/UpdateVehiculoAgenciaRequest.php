<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateVehiculoAgenciaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_ubicacion' => ['sometimes', 'integer', 'exists:ubicacion,id'],
            'agencia' => ['sometimes', 'string', 'max:200'],
            'nota' => ['nullable', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_ubicacion.exists' => 'La ubicación seleccionada no existe en el catálogo.',
            'agencia.max' => 'El nombre de la agencia no debe superar los 200 caracteres.',
        ];
    }
}
