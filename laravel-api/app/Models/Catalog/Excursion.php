<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Excursion extends Model
{
    use HasFactory;

    protected $table = 'excursion';
    public $timestamps = false;

    protected $fillable = [
        'id_ubicacion',
        'tipo_excursion',
        'costo_adulto',
        'costo_nino',
        'precio_adulto',
        'precio_nino',
        'porcentaje_adulto',
        'porcentaje_nino',
        'aplica_descuento_referidos',
        'tasa_portuaria_status',
        'tasa_portuaria_monto',
    ];

    protected $casts = [
        'id_ubicacion' => 'integer',
        'costo_adulto' => 'decimal:2',
        'costo_nino' => 'decimal:2',
        'precio_adulto' => 'decimal:2',
        'precio_nino' => 'decimal:2',
        'porcentaje_adulto' => 'decimal:2',
        'porcentaje_nino' => 'decimal:2',
        'aplica_descuento_referidos' => 'boolean',
        'tasa_portuaria_status' => 'boolean',
        'tasa_portuaria_monto' => 'decimal:2',
        'date_creation' => 'datetime',
        'fecha_actualizacion' => 'datetime',
    ];

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'id_ubicacion');
    }

    public function ventasCount(): int
    {
        if (!DB::getSchemaBuilder()->hasTable('excursion_venta')) {
            return 0;
        }

        return DB::table('excursion_venta')
            ->where('id_excursion', $this->id)
            ->count();
    }
}
