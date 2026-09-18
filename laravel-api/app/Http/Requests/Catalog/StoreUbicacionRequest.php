<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreUbicacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'ubicacion' => ['required', 'string', 'max:200', 'unique:ubicacion,ubicacion'],
        ];
    }

    public function messages(): array
    {
        return [
            'ubicacion.required' => 'El nombre de la ubicación es obligatorio.',
            'ubicacion.max' => 'El nombre de la ubicación no debe exceder los 200 caracteres.',
            'ubicacion.unique' => 'Ya existe una ubicación registrada con este nombre.',
        ];
    }
}
