<?php

namespace App\Models\Quote;

use Illuminate\Database\Eloquent\Model;

class Referido extends Model
{
    protected $table = 'referidos';
    public $timestamps = false;

    protected $fillable = [
        'codigo',
        'id_externo',
        'nombre',
        'fecha_registro',
    ];
}
