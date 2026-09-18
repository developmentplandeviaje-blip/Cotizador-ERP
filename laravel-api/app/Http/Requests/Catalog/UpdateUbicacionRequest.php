<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUbicacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $ubicacionId = $this->route('ubicacion');
        if (is_object($ubicacionId)) {
            $ubicacionId = $ubicacionId->id;
        }

        return [
            'ubicacion' => [
                'required',
                'string',
                'max:200',
                Rule::unique('ubicacion', 'ubicacion')->ignore($ubicacionId),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'ubicacion.required' => 'El nombre de la ubicación es obligatorio.',
            'ubicacion.max' => 'El nombre de la ubicación no debe exceder los 200 caracteres.',
            'ubicacion.unique' => 'Ya existe otra ubicación registrada con este nombre.',
        ];
    }
}
