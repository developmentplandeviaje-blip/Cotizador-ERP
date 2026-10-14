<?php

namespace App\Http\Requests\Quote;

use Illuminate\Foundation\Http\FormRequest;

class StoreCotizacionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cliente' => ['required', 'array'],
            'cliente.nombres' => ['required', 'string', 'max:150'],
            'cliente.apellidos' => ['required', 'string', 'max:150'],
            'cliente.tipo_documento' => ['nullable', 'string', 'max:10'],
            'cliente.documento' => ['nullable', 'string', 'max:50'],
            'cliente.edad' => ['nullable', 'integer', 'min:0', 'max:120'],
            'cliente.telefono' => ['nullable', 'string', 'max:50'],
            'cliente.correo' => ['nullable', 'string', 'max:100'],

            'pasajeros' => ['nullable', 'array'],
            'pasajeros.*.nombres' => ['required', 'string', 'max:150'],
            'pasajeros.*.apellidos' => ['nullable', 'string', 'max:150'],
            'pasajeros.*.documento' => ['nullable', 'string', 'max:50'],

            'checkin' => ['nullable', 'date'],
            'checkout' => ['nullable', 'date'],
            'tipo_pago' => ['nullable', 'string', 'max:50'],
            'id_referidos' => ['nullable', 'integer', 'exists:referidos,id'],
            'descuento_porcentaje' => ['nullable', 'string', 'max:20'],
            'descuento_monto' => ['nullable', 'numeric', 'min:0'],
            'descuento_referidos_monto' => ['nullable', 'numeric', 'min:0'],
            'observacion' => ['nullable', 'string'],

            'hoteles' => ['nullable', 'array'],
            'hoteles.*' => ['array'],
            'hoteles.*.id_hotel' => ['required', 'integer'],
            'vuelos' => ['nullable', 'array'],
            'vuelos.*' => ['array'],
            'vuelos.*.id_aerolinea' => ['required', 'integer'],
            'excursiones' => ['nullable', 'array'],
            'excursiones.*' => ['array'],
            'excursiones.*.id_excursion' => ['required', 'integer'],
            'paquetes' => ['nullable', 'array'],
            'paquetes.*' => ['array'],
            'paquetes.*.id_paquete' => ['required', 'integer'],
            'traslados' => ['nullable', 'array'],
            'traslados.*' => ['array'],
            'traslados.*.id_traslado' => ['required', 'integer'],
            'vehiculos' => ['nullable', 'array'],
            'vehiculos.*' => ['array'],
            'vehiculos.*.id_vehiculo' => ['required', 'integer'],
            'ferries' => ['nullable', 'array'],
            'ferries.*' => ['array'],
            'otros' => ['nullable', 'array'],
            'otros.*' => ['array'],

        ];
    }

    public function messages(): array
    {
        return [
            'cliente.required' => 'La información del cliente principal es obligatoria.',
            'cliente.nombres.required' => 'El nombre del cliente principal es obligatorio.',
            'cliente.apellidos.required' => 'El apellido del cliente principal es obligatorio.',
        ];
    }
}
