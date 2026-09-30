<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class StoreUserFreelancerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:100', 'unique:user,email'],
            'password' => ['required', 'string', 'min:6'],
            'status' => ['nullable', 'boolean'],
            'nombre_empresa' => ['nullable', 'string', 'max:150'],
            'rif' => ['nullable', 'string', 'max:50'],
            'correo_empresa' => ['nullable', 'email', 'max:100'],
            'telefono_1' => ['nullable', 'string', 'max:50'],
            'telefono_2' => ['nullable', 'string', 'max:50'],
            'direccion' => ['nullable', 'string', 'max:255'],
            'color_primario' => ['nullable', 'string', 'max:20'],
            'comisiones' => ['nullable', 'array'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'El nombre del usuario es obligatorio.',
            'last_name.required' => 'El apellido del usuario es obligatorio.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'Debe ingresar un correo electrónico válido.',
            'email.unique' => 'Este correo electrónico ya se encuentra registrado.',
            'password.required' => 'La contraseña es obligatoria.',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres.',
        ];
    }
}
