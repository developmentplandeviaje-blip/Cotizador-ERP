<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateExcursionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_ubicacion' => ['sometimes', 'required', 'integer', 'exists:ubicacion,id'],
            'tipo_excursion' => ['sometimes', 'required', 'string', 'max:200'],
            'costo_adulto' => ['sometimes', 'required', 'numeric', 'min:0'],
            'costo_nino' => ['sometimes', 'required', 'numeric', 'min:0'],
            'precio_adulto' => ['sometimes', 'required', 'numeric', 'min:0'],
            'precio_nino' => ['sometimes', 'required', 'numeric', 'min:0'],
            'porcentaje_adulto' => ['nullable', 'numeric'],
            'porcentaje_nino' => ['nullable', 'numeric'],
            'aplica_descuento_referidos' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_ubicacion.required' => 'Debe seleccionar una ubicación válida.',
            'id_ubicacion.exists' => 'La ubicación seleccionada no existe en el catálogo.',
            'tipo_excursion.required' => 'El nombre o tipo de excursión es obligatorio.',
            'tipo_excursion.max' => 'El nombre de la excursión no debe superar los 200 caracteres.',
            'costo_adulto.required' => 'El costo para adultos es obligatorio.',
            'costo_adulto.min' => 'El costo para adultos no puede ser menor a 0.',
            'costo_nino.required' => 'El costo para niños es obligatorio.',
            'costo_nino.min' => 'El costo para niños no puede ser menor a 0.',
            'precio_adulto.required' => 'El precio de venta para adultos es obligatorio.',
            'precio_adulto.min' => 'El precio para adultos no puede ser menor a 0.',
            'precio_nino.required' => 'El precio de venta para niños es obligatorio.',
            'precio_nino.min' => 'El precio para niños no puede ser menor a 0.',
        ];
    }
}
