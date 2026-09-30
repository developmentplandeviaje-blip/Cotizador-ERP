<?php

namespace App\Http\Requests\User;

use Illuminate\Foundation\Http\FormRequest;

class UpdateUserFreelancerRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && in_array($user->level, ['Admin', 'Administrador', 'Sub Gerente'], true);
    }

    public function rules(): array
    {
        // $this->user is the route parameter, a User instance
        $userId = $this->route('user') ? $this->route('user')->id : null;

        return [
            // User rules
            'first_name' => ['nullable', 'string', 'max:30'],
            'last_name' => ['nullable', 'string', 'max:30'],
            'email' => ['nullable', 'email', 'max:70', 'unique:user,email,' . $userId],
            'password' => ['nullable', 'string', 'min:6'],
            'status' => ['nullable', 'boolean'],
            
            // Freelancer company rules
            'freelancer_nombre' => ['nullable', 'string', 'max:100'],
            'freelancer_rif' => ['nullable', 'string', 'max:20'],
            'freelancer_telefono_1' => ['nullable', 'string', 'max:20'],
            'freelancer_telefono_2' => ['nullable', 'string', 'max:20'],
            'freelancer_direccion' => ['nullable', 'string', 'max:255'],
            'freelancer_color_primario' => ['nullable', 'string', 'max:10'],

            // Commissions
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
            'email.email' => 'Debe ingresar un formato de correo electrónico válido.',
            'email.unique' => 'Este correo electrónico ya se encuentra registrado.',
            'password.min' => 'La contraseña debe tener al menos 6 caracteres.',
        ];
    }
}
