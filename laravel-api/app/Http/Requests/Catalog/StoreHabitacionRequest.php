<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class StoreHabitacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_hotel' => ['required', 'integer', 'exists:hotel,id'],
            'habitacion' => ['required', 'string', 'max:200'],
            'cantidad_personas' => ['required', 'integer', 'min:1'],
            'minimo_noches' => ['nullable', 'integer', 'min:1'],
            'posicion' => ['nullable', 'integer', 'min:0'],
            'por_defecto' => ['nullable', 'boolean'],
            'nota' => ['nullable', 'string'],
        ];
    }
}
