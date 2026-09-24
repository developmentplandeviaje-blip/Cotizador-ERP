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
            'ruta_destino' => ['sometimes', 'required', 'string', 'max:255'],
            'costo' => ['sometimes', 'required', 'numeric', 'min:0'],
            'precio_publico' => ['sometimes', 'required', 'numeric', 'min:0'],
            'tipo_servicio' => ['sometimes', 'required', 'string', 'in:privado,compartido'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_ubicacion.required' => 'Debe seleccionar una ubicación válida.',
            'id_ubicacion.exists' => 'La ubicación seleccionada no existe en el catálogo.',
            'ruta_origen.required' => 'El origen del traslado es obligatorio.',
            'ruta_origen.max' => 'El origen no debe superar los 255 caracteres.',
            'ruta_destino.required' => 'El destino del traslado es obligatorio.',
            'ruta_destino.max' => 'El destino no debe superar los 255 caracteres.',
            'costo.required' => 'El costo del traslado es obligatorio.',
            'costo.min' => 'El costo no puede ser menor a 0.',
            'precio_publico.required' => 'El precio público del traslado es obligatorio.',
            'precio_publico.min' => 'El precio público no puede ser menor a 0.',
            'tipo_servicio.required' => 'El tipo de servicio es obligatorio.',
            'tipo_servicio.in' => 'El tipo de servicio debe ser privado o compartido.',
        ];
    }
}
