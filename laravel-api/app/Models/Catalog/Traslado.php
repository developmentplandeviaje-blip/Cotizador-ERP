<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\DB;

class Traslado extends Model
{
    use HasFactory;

    protected $table = 'traslado';
    public $timestamps = false;

    protected $fillable = [
        'id_ubicacion',
        'ruta_origen',
        'costo',
        'precio_publico',
        'tipo_servicio',
    ];

    protected $casts = [
        'id_ubicacion' => 'integer',
        'costo' => 'decimal:2',
        'precio_publico' => 'decimal:2',
    ];

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'id_ubicacion');
    }

    public function getPorcentajeAttribute(): float
    {
        $costo = (float) $this->costo;
        $precio = (float) $this->precio_publico;

        if ($costo > 0) {
            return round((($precio - $costo) / $costo) * 100, 2);
        }

        return 0.00;
    }

    public function ventasCount(): int
    {
        if (!DB::getSchemaBuilder()->hasTable('traslado_venta')) {
            return 0;
        }

        return DB::table('traslado_venta')
            ->where('id_traslado', $this->id)
            ->count();
    }
}
