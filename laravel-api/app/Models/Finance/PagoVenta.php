<?php

namespace App\Models\Finance;

use App\Models\Quote\Venta;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PagoVenta extends Model
{
    protected $table = 'pago_venta';
    public $timestamps = false;

    protected $fillable = [
        'id_venta',
        'id_metodo',
        'numero_transaccion',
        'tipo_pago',
        'moneda_pago',
        'monto_original',
        'tasa_cambio',
        'monto_usd',
        'comision_bancaria',
        'quien_envia',
        'observacion',
        'id_credito',
        'fecha_pago',
    ];

    protected $casts = [
        'monto_original' => 'decimal:2',
        'tasa_cambio' => 'decimal:4',
        'monto_usd' => 'decimal:2',
        'comision_bancaria' => 'decimal:2',
        'fecha_pago' => 'datetime',
    ];

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'id_venta');
    }

    public function metodoPago(): BelongsTo
    {
        return $this->belongsTo(MetodoPago::class, 'id_metodo');
    }

    public function detalles(): HasMany
    {
        return $this->hasMany(PagoVentaDetalle::class, 'id_pago');
    }
}
