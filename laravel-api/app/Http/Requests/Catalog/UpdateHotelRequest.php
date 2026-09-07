<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateHotelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_ubicacion' => ['sometimes', 'integer', 'exists:ubicacion,id'],
            'nombre' => ['sometimes', 'string', 'max:200'],
            'tipo' => ['sometimes', 'string', 'max:300'],
            'edad_adolescentes' => ['nullable', 'string', 'max:50'],
            'edad_ninos' => ['nullable', 'string', 'max:50'],
            'edad_infantes' => ['nullable', 'string', 'max:50'],
            'nota' => ['nullable', 'string'],
            'status' => ['nullable', 'boolean'],
        ];
    }
}
