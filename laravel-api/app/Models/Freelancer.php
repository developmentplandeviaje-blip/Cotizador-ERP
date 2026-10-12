<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Freelancer extends Model
{
    use HasFactory;

    protected $table = 'freelancer';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
        'rif',
        'correo',
        'telefono_1',
        'telefono_2',
        'direccion',
        'color_primario',
        'logo_url',
        'hoja_membrete_config',
        'status',
    ];

    protected $casts = [
        'hoja_membrete_config' => 'array',
        'status' => 'boolean',
    ];

    public function usuarios(): HasMany
    {
        return $this->hasMany(User::class, 'id_freelancer');
    }
}
