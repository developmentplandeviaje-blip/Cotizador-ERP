<?php

namespace App\Models\Quote;

use App\Models\Catalog\Excursion;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ExcursionVenta extends Model
{
    protected $table = 'excursion_venta';
    public $timestamps = false;

    protected $fillable = [
        'id_venta',
        'id_excursion',
        'fecha',
        'adultos',
        'ninos',
        'infantes',
        'costo_adulto',
        'costo_nino',
        'precio_adulto',
        'precio_nino',
        'total_descuento',
        'estado',
    ];

    public function excursion(): BelongsTo
    {
        return $this->belongsTo(Excursion::class, 'id_excursion');
    }

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'id_venta');
    }
}
