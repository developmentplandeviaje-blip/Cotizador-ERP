<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreHotelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_ubicacion' => ['required', 'integer', 'exists:ubicacion,id'],
            'nombre' => ['required', 'string', 'max:200'],
            'tipo' => ['required', 'string', 'max:300'],
            'edad_adolescentes' => ['nullable', 'string', 'max:50'],
            'edad_ninos' => ['nullable', 'string', 'max:50'],
            'edad_infantes' => ['nullable', 'string', 'max:50'],
            'nota' => ['nullable', 'string'],
            'status' => ['nullable', 'boolean'],
            'reglas' => ['nullable', 'array'],
            'habitaciones' => ['nullable', 'array'],
        ];
    }
}
