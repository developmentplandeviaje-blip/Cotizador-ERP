<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PagoVentaDetalle extends Model
{
    protected $table = 'pago_venta_detalle';
    public $timestamps = false;

    protected $fillable = [
        'id_pago',
        'tipo_servicio',
        'monto_asignado_usd',
    ];

    protected $casts = [
        'monto_asignado_usd' => 'decimal:2',
    ];

    public function pago(): BelongsTo
    {
        return $this->belongsTo(PagoVenta::class, 'id_pago');
    }
}
