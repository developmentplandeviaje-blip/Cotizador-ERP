<?php

namespace App\Models\Quote;

use App\Models\Catalog\Paquete;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PaqueteVenta extends Model
{
    protected $table = 'paquete_venta';
    public $timestamps = false;

    protected $fillable = [
        'id_venta',
        'id_paquete',
        'fecha',
        'adultos',
        'ninos',
        'infantes',
        'costo_adulto',
        'costo_nino',
        'precio_adulto',
        'precio_nino',
        'total_descuento',
    ];

    public function paquete(): BelongsTo
    {
        return $this->belongsTo(Paquete::class, 'id_paquete');
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'id_venta');
    }
}
