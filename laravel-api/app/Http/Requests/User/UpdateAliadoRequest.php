<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateAliadoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'razon_social' => ['required', 'string', 'max:150'],
            'rif' => ['nullable', 'string', 'max:30'],
            'contacto_principal' => ['nullable', 'string', 'max:100'],
            'telefono' => ['nullable', 'string', 'max:50'],
            'correo' => ['nullable', 'email', 'max:100'],
            'status' => ['nullable', 'boolean'],
        ];
    }
}
