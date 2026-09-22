<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\DB;

class Vehiculo extends Model
{
    use HasFactory;

    protected $table = 'vehiculo';
    public $timestamps = false;

    protected $fillable = [
        'id_vehiculo_agencia',
        'marca',
        'vehiculo',
        'ano',
        'tipo_vehiculo',
        'tipo_transmision',
        'nota',
    ];

    protected $casts = [
        'id_vehiculo_agencia' => 'integer',
    ];

    public function agencia(): BelongsTo
    {
        return $this->belongsTo(VehiculoAgencia::class, 'id_vehiculo_agencia');
    }

    public function tarifas(): HasMany
    {
        return $this->hasMany(VehiculoTarifa::class, 'id_vehiculo');
    }

    public function ventasCount(): int
    {
        if (!DB::getSchemaBuilder()->hasTable('vehiculo_venta')) {
            return 0;
        }

        return DB::table('vehiculo_venta')
            ->where('id_vehiculo', $this->id)
            ->count();
    }
}
