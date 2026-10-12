<?php

namespace App\Models\Quote;

use App\Models\Catalog\Traslado;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrasladoVenta extends Model
{
    protected $table = 'traslado_venta';
    public $timestamps = false;

    protected $fillable = [
        'id_venta',
        'id_traslado',
        'id_chofer',
        'id_vuelo',
        'fecha_traslado',
        'adultos',
        'ninos',
        'infantes',
        'costo_historico',
        'precio_historico',
        'total_descuento',
        'observacion',
    ];

    public function traslado(): BelongsTo
    {
        return $this->belongsTo(Traslado::class, 'id_traslado');
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'id_venta');
    }
}
