<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelReglaComercial extends Model
{
    use HasFactory;

    protected $table = 'hotel_regla_comercial';
    public $timestamps = false;

    protected $fillable = [
        'id_hotel',
        'id_freelancer',
        'descuento_monto',
        'descuento_status',
        'aumento_bolivares',
        'aumento_bolivares_porcentaje',
    ];

    protected $casts = [
        'descuento_monto' => 'float',
        'descuento_status' => 'boolean',
        'aumento_bolivares' => 'boolean',
        'aumento_bolivares_porcentaje' => 'float',
        'fecha_actualizacion' => 'datetime',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class, 'id_hotel');
    }
}
