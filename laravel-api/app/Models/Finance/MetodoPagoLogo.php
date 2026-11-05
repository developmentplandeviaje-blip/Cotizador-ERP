<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Model;

class MetodoPagoLogo extends Model
{
    protected $table = 'metodo_pago_logo';

    protected $fillable = [
        'nombre',
        'ruta',
    ];
}
