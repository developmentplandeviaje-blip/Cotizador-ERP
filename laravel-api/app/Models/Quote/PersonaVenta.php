<?php

namespace App\Models\Quote;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PersonaVenta extends Model
{
    protected $table = 'persona_venta';
    const CREATED_AT = 'fecha_creacion';
    const UPDATED_AT = 'fecha_actualizacion';

    protected $fillable = [
        'id_venta',
        'nombres',
        'apellidos',
        'tipo_documento',
        'documento',
        'edad',
        'telefono',
        'correo',
        'principal',
    ];

    protected $casts = [
        'principal' => 'boolean',
    ];

    public function venta(): BelongsTo
    {
        return $this->belongsTo(Venta::class, 'id_venta');
    }
}
