<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Support\Facades\DB;

class MetodoPago extends Model
{
    use HasFactory;

    protected $table = 'metodo_pago';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'nombre_publico',
        'tipo',
        'logo',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'status' => 'boolean',
        ];
    }

    /**
     * Bank account details (when tipo === 'banco').
     */
    public function banco(): HasOne
    {
        return $this->hasOne(MetodoPagoBanco::class, 'id_metodo', 'id');
    }

    /**
     * Digital account details (when tipo === 'digital').
     */
    public function digital(): HasOne
    {
        return $this->hasOne(MetodoPagoDigital::class, 'id_metodo', 'id');
    }

    /**
     * Advisors assigned to this payment method.
     */
    public function asesores(): HasMany
    {
        return $this->hasMany(MetodoPagoAsesor::class, 'id_metodo', 'id');
    }

    /**
     * Scope for active payment methods.
     */
    public function scopeActivos(Builder $query): Builder
    {
        return $query->where('status', true);
    }

    /**
     * Count sales payment transactions associated with this method.
     */
    public function pagosVentaCount(): int
    {
        return DB::table('pago_venta')->where('id_metodo', $this->id)->count();
    }
}
