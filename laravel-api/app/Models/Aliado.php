<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Aliado extends Model
{
    use HasFactory;

    protected $table = 'aliado';
    public $timestamps = false;

    protected $fillable = [
        'razon_social',
        'rif',
        'contacto_principal',
        'telefono',
        'correo',
        'status',
    ];

    protected $casts = [
        'status' => 'boolean',
    ];

    /**
     * Get the users (vendedores/asesores) associated with the aliado.
     */
    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class, 'id_aliado');
    }
}
