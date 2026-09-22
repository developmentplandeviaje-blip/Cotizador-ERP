<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class VehiculoAgencia extends Model
{
    use HasFactory;

    protected $table = 'vehiculo_agencia';
    public $timestamps = false;

    protected $fillable = [
        'id_ubicacion',
        'agencia',
        'nota',
    ];

    protected $casts = [
        'id_ubicacion' => 'integer',
        'date_creation' => 'datetime',
    ];

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'id_ubicacion');
    }

    public function vehiculos(): HasMany
    {
        return $this->hasMany(Vehiculo::class, 'id_vehiculo_agencia');
    }
}
