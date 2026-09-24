<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreAerolineaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'nombre' => ['required', 'string', 'max:200', 'unique:aerolinea,nombre'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la aerolínea es obligatorio.',
            'nombre.max' => 'El nombre de la aerolínea no debe exceder los 200 caracteres.',
            'nombre.unique' => 'Ya existe una aerolínea registrada con este nombre.',
        ];
    }
}
