<?php

namespace App\Models\Quote;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Venta extends Model
{
    protected $table = 'ventas';
    public $timestamps = false;

    protected $fillable = [
        'id_user',
        'id_referidos',
        'numero_ficha',
        'localizador',
        'estado',
        'tipo_pago',
        'checkin',
        'checkout',
        'fecha_limite_hotel',
        'fecha_limite_cliente',
        'descuento_porcentaje',
        'descuento_monto',
        'descuento_referidos_monto',
        'observacion',
        'fecha_creacion',
        'fecha_confirmacion',
    ];

    protected $casts = [
        'checkin' => 'datetime',
        'checkout' => 'datetime',
        'descuento_monto' => 'decimal:2',
        'descuento_referidos_monto' => 'decimal:2',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }

    public function referido(): BelongsTo
    {
        return $this->belongsTo(Referido::class, 'id_referidos');
    }

    public function personas(): HasMany
    {
        return $this->hasMany(PersonaVenta::class, 'id_venta');
    }

    public function clientePrincipal(): HasOne
    {
        return $this->hasOne(PersonaVenta::class, 'id_venta')->where('principal', 1);
    }

    public function hoteles(): HasMany
    {
        return $this->hasMany(HotelVenta::class, 'id_venta');
    }

    public function vuelos(): HasMany
    {
        return $this->hasMany(VueloVenta::class, 'id_venta');
    }

    public function excursiones(): HasMany
    {
        return $this->hasMany(ExcursionVenta::class, 'id_venta');
    }

    public function paquetes(): HasMany
    {
        return $this->hasMany(PaqueteVenta::class, 'id_venta');
    }

    public function traslados(): HasMany
    {
        return $this->hasMany(TrasladoVenta::class, 'id_venta');
    }

    public function vehiculos(): HasMany
    {
        return $this->hasMany(VehiculoVenta::class, 'id_venta');
    }

    public function ferries(): HasMany
    {
        return $this->hasMany(FerryVenta::class, 'id_venta');
    }

    public function otros(): HasMany
    {
        return $this->hasMany(OtroVenta::class, 'id_venta');
    }
}
