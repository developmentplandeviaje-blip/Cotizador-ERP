<?php

namespace App\Models\Quote;

use App\Models\Catalog\Vehiculo;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehiculoVenta extends Model
{
    protected $table = 'vehiculo_venta';
    public $timestamps = false;

    protected $fillable = [
        'id_venta',
        'id_vehiculo',
        'desde',
        'hasta',
        'dias',
        'costo',
        'precio_unitario',
        'observacion',
    ];

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class, 'id_vehiculo');
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'id_venta');
    }
}
