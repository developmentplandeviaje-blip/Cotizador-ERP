<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Hotel extends Model
{
    use HasFactory;

    protected $table = 'hotel';
    public $timestamps = false;

    protected $fillable = [
        'id_ubicacion',
        'nombre',
        'tipo',
        'edad_adolescentes',
        'edad_ninos',
        'edad_infantes',
        'nota',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
        'date_creation' => 'datetime',
    ];

    public function ubicacion(): BelongsTo
    {
        return $this->belongsTo(Ubicacion::class, 'id_ubicacion');
    }

    public function habitaciones(): HasMany
    {
        return $this->hasMany(HabitacionHotel::class, 'id_hotel')->orderBy('posicion');
    }

    public function reglasComerciales(): HasMany
    {
        return $this->hasMany(HotelReglaComercial::class, 'id_hotel');
    }
}
