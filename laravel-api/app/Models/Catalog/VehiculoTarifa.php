<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VehiculoTarifa extends Model
{
    use HasFactory;

    protected $table = 'vehiculo_tarifa';
    public $timestamps = false;

    protected $fillable = [
        'id_vehiculo',
        'desde',
        'hasta',
        'desde_venta',
        'hasta_venta',
        'costo',
        'precio',
        'porcentaje',
        'promocion',
    ];

    protected $casts = [
        'id_vehiculo' => 'integer',
        'desde' => 'datetime',
        'hasta' => 'datetime',
        'desde_venta' => 'datetime',
        'hasta_venta' => 'datetime',
        'costo' => 'decimal:2',
        'precio' => 'decimal:2',
        'porcentaje' => 'decimal:2',
        'promocion' => 'boolean',
        'fecha_actualizacion' => 'datetime',
    ];

    public function vehiculo(): BelongsTo
    {
        return $this->belongsTo(Vehiculo::class, 'id_vehiculo');
    }
}
