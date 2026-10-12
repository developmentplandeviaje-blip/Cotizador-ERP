<?php

namespace App\Models\Quote;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OtroVenta extends Model
{
    protected $table = 'otro_venta';
    public $timestamps = false;

    protected $fillable = [
        'id_venta',
        'fecha',
        'descripcion',
        'adultos',
        'ninos',
        'infantes',
        'costo',
        'precio',
        'estado',
    ];

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'id_venta');
    }
}
