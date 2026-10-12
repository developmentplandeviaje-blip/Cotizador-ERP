<?php

namespace App\Models\Quote;

use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CotizacionRapida extends Model
{
    protected $table = 'cotizaciones_rapidas';
    public $timestamps = false;

    protected $fillable = [
        'id_asesor',
        'fecha',
        'data',
    ];

    public function asesor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_asesor');
    }
}
