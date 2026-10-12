<?php

namespace App\Http\Requests\Quote;

use Illuminate\Foundation\Http\FormRequest;

class ValidarReferidoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'codigo' => ['required', 'string', 'max:50'],
        ];
    }

    public function messages(): array
    {
        return [
            'codigo.required' => 'El código de referido es obligatorio.',
        ];
    }
}
