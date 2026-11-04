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
            'tipo' => ['required', 'in:nacional,internacional'],
        ];
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre de la aerolínea es obligatorio.',
            'nombre.max' => 'El nombre de la aerolínea no debe exceder los 200 caracteres.',
            'nombre.unique' => 'Ya existe una aerolínea registrada con este nombre.',
            'tipo.required' => 'Debe seleccionar si la aerolínea es nacional o internacional.',
            'tipo.in' => 'El tipo de aerolínea debe ser nacional o internacional.',
        ];
    }
}
