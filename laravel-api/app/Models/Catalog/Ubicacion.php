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

    public function hoteles(): HasMany
    {
        return $this->hasMany(Hotel::class, 'id_ubicacion');
    }
}
