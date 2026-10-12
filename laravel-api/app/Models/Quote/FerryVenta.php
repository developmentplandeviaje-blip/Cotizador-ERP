<?php

namespace App\Models\Quote;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FerryVenta extends Model
{
    protected $table = 'ferry_venta';
    public $timestamps = false;

    protected $fillable = [
        'id_venta',
        'ruta',
        'clase',
        'adultos',
        'ninos',
        'infantes',
        'vehiculos',
        'itinerario',
        'costo_adulto',
        'costo_nino',
        'costo_infante',
        'costo_vehiculo',
        'precio_adulto',
        'precio_nino',
        'precio_infante',
        'precio_vehiculo',
    ];

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'id_venta');
    }
}
