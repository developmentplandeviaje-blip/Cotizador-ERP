<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TarifaHabitacion extends Model
{
    use HasFactory;

    protected $table = 'tarifa_habitacion';
    public $timestamps = false;

    protected $attributes = [
        'costo_noche_adulto' => 0.00,
        'precio_noche_adulto' => 0.00,
        'porcentaje_adulto' => 0.00,
        'costo_noche_adolescente' => 0.00,
        'precio_noche_adolescente' => 0.00,
        'porcentaje_adolescente' => 0.00,
        'costo_noche_nino' => 0.00,
        'precio_noche_nino' => 0.00,
        'porcentaje_nino' => 0.00,
        'ninos_gratis' => 0,
        'noches_gratis' => 0,
        'promocion' => false,
        'suplemento' => false,
        'moneda' => 'USD',
    ];

    protected $fillable = [
        'id_habitacion',
        'desde',
        'hasta',
        'desde_venta',
        'hasta_venta',
        'costo_noche_adulto',
        'precio_noche_adulto',
        'porcentaje_adulto',
        'costo_noche_adolescente',
        'precio_noche_adolescente',
        'porcentaje_adolescente',
        'costo_noche_nino',
        'precio_noche_nino',
        'porcentaje_nino',
        'ninos_gratis',
        'noches_gratis',
        'promocion',
        'suplemento',
        'moneda',
    ];

    protected $casts = [
        'desde' => 'datetime',
        'hasta' => 'datetime',
        'desde_venta' => 'datetime',
        'hasta_venta' => 'datetime',
        'costo_noche_adulto' => 'float',
        'precio_noche_adulto' => 'float',
        'porcentaje_adulto' => 'float',
        'costo_noche_adolescente' => 'float',
        'precio_noche_adolescente' => 'float',
        'porcentaje_adolescente' => 'float',
        'costo_noche_nino' => 'float',
        'precio_noche_nino' => 'float',
        'porcentaje_nino' => 'float',
        'ninos_gratis' => 'integer',
        'noches_gratis' => 'integer',
        'promocion' => 'boolean',
        'suplemento' => 'boolean',
        'fecha_actualizacion' => 'datetime',
    ];

    public function habitacion(): BelongsTo
    {
        return $this->belongsTo(HabitacionHotel::class, 'id_habitacion');
    }
}
