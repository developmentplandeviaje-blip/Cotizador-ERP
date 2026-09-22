<?php

namespace App\Http\Requests\Catalog;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePaqueteRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'id_ubicacion' => ['sometimes', 'integer', 'exists:ubicacion,id'],
            'paquete' => ['sometimes', 'string', 'max:200'],
            'costo_adulto' => ['sometimes', 'numeric', 'min:0'],
            'costo_nino' => ['sometimes', 'numeric', 'min:0'],
            'precio_adulto' => ['sometimes', 'numeric', 'min:0'],
            'precio_nino' => ['sometimes', 'numeric', 'min:0'],
            'porcentaje_adulto' => ['nullable', 'numeric'],
            'porcentaje_nino' => ['nullable', 'numeric'],
            'aplica_descuento_referidos' => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'id_ubicacion.exists' => 'La ubicación seleccionada no existe en el catálogo.',
            'paquete.max' => 'El nombre del paquete no debe superar los 200 caracteres.',
            'costo_adulto.min' => 'El costo para adultos no puede ser menor a 0.',
            'costo_nino.min' => 'El costo para niños no puede ser menor a 0.',
            'precio_adulto.min' => 'El precio para adultos no puede ser menor a 0.',
            'precio_nino.min' => 'El precio para niños no puede ser menor a 0.',
        ];
    }
}
