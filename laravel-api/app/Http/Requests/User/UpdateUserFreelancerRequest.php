<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserFreelancerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('freelancer')?->id ?? $this->route('user')?->id;

        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:100'],
            'last_name' => ['sometimes', 'required', 'string', 'max:100'],
            'email' => ['sometimes', 'required', 'email', 'max:100', Rule::unique('user', 'email')->ignore($userId)],
            'password' => ['nullable', 'string', 'min:6'],
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
}
