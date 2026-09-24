<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTrasladoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_ubicacion' => ['sometimes', 'required', 'integer', 'exists:ubicacion,id'],
            'ruta_origen' => ['sometimes', 'required', 'string', 'max:255'],
            'costo' => ['sometimes', 'required', 'numeric', 'min:0'],
            'precio_publico' => ['sometimes', 'required', 'numeric', 'min:0'],
            'tipo_servicio' => ['sometimes', 'required', 'string', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_ubicacion.required' => 'Debe seleccionar una ubicación válida.',
            'id_ubicacion.exists' => 'La ubicación seleccionada no existe en el catálogo.',
            'ruta_origen.required' => 'La descripci\u00f3n del traslado es obligatoria.',
            'ruta_origen.max' => 'El origen no debe superar los 255 caracteres.',
            'costo.required' => 'El costo del traslado es obligatorio.',
            'costo.min' => 'El costo no puede ser menor a 0.',
            'precio_publico.required' => 'El precio público del traslado es obligatorio.',
            'precio_publico.min' => 'El precio público no puede ser menor a 0.',
            'tipo_servicio.required' => 'El tipo de servicio es obligatorio.',
            'tipo_servicio.in' => 'El tipo de servicio debe ser privado o compartido.',
        ];
    }
}
