<?php

namespace App\Http\Requests\Finance;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreMetodoPagoRequest extends FormRequest
{
    public function authorize(): bool
    {
        $user = $this->user();
        return $user && in_array($user->level, ['Admin', 'Administrador', 'Sub Gerente'], true);
    }

    public function rules(): array
    {
        $tipo = $this->input('tipo');

        $rules = [
            'nombre' => ['required', 'string', 'max:100'],
            'nombre_publico' => ['required', 'string', 'max:200'],
            'tipo' => ['required', Rule::in(['banco', 'digital', 'efectivo'])],
            'logo' => ['nullable', 'string', 'max:200'],
            'status' => ['nullable', 'boolean'],
            'asesores' => ['nullable', 'array'],
            'asesores.*' => ['integer', 'exists:user,id'],
        ];

        if ($tipo === 'banco') {
            $rules['titular'] = ['required', 'string', 'max:200'];
            $rules['tipo_documento'] = ['required', 'string', 'max:10'];
            $rules['documento'] = ['required', 'string', 'max:20'];
            $rules['numero_cuenta'] = ['nullable', 'string', 'max:20'];
            $rules['tipo_cuenta'] = ['nullable', 'string', 'max:50'];
            $rules['pago_movil_telefono'] = ['nullable', 'string', 'max:50'];
        } elseif ($tipo === 'digital') {
            $rules['correo_cuenta'] = ['required', 'email', 'max:200'];
            $rules['tipo_comision'] = ['nullable', Rule::in(['porcentaje', 'fijo', 'mixto'])];
            $rules['comision_valor'] = ['nullable', 'numeric', 'min:0', 'max:100'];
            $rules['codigo_postal'] = ['nullable', 'string', 'max:20'];
            $rules['direccion_facturacion'] = ['nullable', 'string', 'max:255'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'nombre.required' => 'El nombre interno del método de pago es obligatorio.',
            'nombre_publico.required' => 'El nombre público visible para el cliente es obligatorio.',
            'tipo.required' => 'El tipo de método de pago es obligatorio.',
            'tipo.in' => 'El tipo de método debe ser banco, digital o efectivo.',
            'titular.required' => 'El nombre del titular de la cuenta bancaria es obligatorio.',
            'tipo_documento.required' => 'El tipo de documento de identidad es obligatorio.',
            'documento.required' => 'El número de documento o RIF es obligatorio.',
            'correo_cuenta.required' => 'El correo electrónico asociado a la cuenta digital es obligatorio.',
            'correo_cuenta.email' => 'Debe ingresar un formato de correo electrónico válido.',
        ];
    }
}
