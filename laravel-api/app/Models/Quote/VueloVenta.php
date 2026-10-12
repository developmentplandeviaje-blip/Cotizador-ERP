<?php

namespace App\Models\Quote;

use App\Models\Catalog\Aerolinea;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VueloVenta extends Model
{
    protected $table = 'vuelo_venta';
    public $timestamps = false;

    protected $fillable = [
        'id_venta',
        'id_aerolinea',
        'itinerario',
        'localizador',
        'adultos',
        'ninos',
        'infantes',
        'costo_adulto',
        'costo_nino',
        'costo_infante',
        'precio_adulto',
        'precio_nino',
        'precio_infante',
        'fecha_vuelo',
        'boleto_internacional',
        'comision_internacional',
    ];

    public function aerolinea(): BelongsTo
    {
        return $this->belongsTo(Aerolinea::class, 'id_aerolinea');
    }
}
