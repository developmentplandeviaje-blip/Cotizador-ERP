<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class HabitacionHotel extends Model
{
    use HasFactory;

    protected $table = 'habitacion_hotel';
    public $timestamps = false;

    protected $fillable = [
        'id_hotel',
        'habitacion',
        'cantidad_personas',
        'minimo_noches',
        'posicion',
        'por_defecto',
        'nota',
    ];

    protected $casts = [
        'por_defecto' => 'boolean',
        'cantidad_personas' => 'integer',
        'minimo_noches' => 'integer',
        'posicion' => 'integer',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class, 'id_hotel');
    }

    public function tarifas(): HasMany
    {
        return $this->hasMany(TarifaHabitacion::class, 'id_habitacion')->orderBy('desde');
    }
}
