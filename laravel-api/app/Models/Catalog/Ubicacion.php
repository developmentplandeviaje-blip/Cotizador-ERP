<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Ubicacion extends Model
{
    use HasFactory;

    protected $table = 'ubicacion';
    public $timestamps = false;

    protected $fillable = [
        'ubicacion',
    ];

    protected $casts = [
        'date_creation' => 'datetime',
    ];

    public function hoteles(): HasMany
    {
        return $this->hasMany(Hotel::class, 'id_ubicacion');
    }

    public function excursiones(): HasMany
    {
        return $this->hasMany(Excursion::class, 'id_ubicacion');
    }

    public function traslados(): HasMany
    {
        return $this->hasMany(Traslado::class, 'id_ubicacion');
    }
}
