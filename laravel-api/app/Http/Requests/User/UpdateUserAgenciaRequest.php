<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserAgenciaRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && in_array($user->level, ['Admin', 'Administrador', 'Sub Gerente'], true);
    }

    public function rules(): array
    {
        $userId = $this->route('user') instanceof \App\Models\User
            ? $this->route('user')->id
            : $this->route('user');

        return [
            'first_name' => ['sometimes', 'required', 'string', 'max:30'],
            'last_name' => ['sometimes', 'required', 'string', 'max:30'],
            'email' => ['sometimes', 'required', 'email', 'max:70', Rule::unique('user', 'email')->ignore($userId)],
            'password' => ['nullable', 'string', 'min:6'],
            'level' => ['sometimes', 'required', 'string', Rule::in(['Admin', 'Administrador', 'Sub Gerente', 'Lider', 'Asesor'])],
            'status' => ['nullable', 'boolean'],
            'comisiones' => ['nullable', 'array'],
            'comisiones.hotel' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'comisiones.ferry' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'comisiones.vuelo' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'comisiones.excursion' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'comisiones.vehiculo' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'comisiones.traslado' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'comisiones.paquete' => ['nullable', 'numeric', 'min:0', 'max:100'],
            'comisiones.otro' => ['nullable', 'numeric', 'min:0', 'max:100'],
        ];
    }

    public function messages(): array
    {
        return [
            'first_name.required' => 'El nombre del usuario es obligatorio.',
            'last_name.required' => 'El apellido del usuario es obligatorio.',
            'email.required' => 'El correo electrónico es obligatorio.',
            'email.email' => 'Debe ingresar un formato de correo electrónico válido.',
            'email.unique' => 'Este correo electrónico ya se encuentra registrado por otro usuario.',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres.',
            'level.required' => 'El nivel o rol del usuario es obligatorio.',
            'level.in' => 'El nivel seleccionado no es válido.',
        ];
    }
}
