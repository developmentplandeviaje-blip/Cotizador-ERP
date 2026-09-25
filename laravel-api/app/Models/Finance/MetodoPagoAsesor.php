<?php

namespace App\Models\Finance;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MetodoPagoAsesor extends Model
{
    use HasFactory;

    protected $table = 'metodo_pago_asesor';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'id_metodo',
        'id_asesor',
        'asesor',
    ];

    protected function casts(): array
    {
        return [
            'id_metodo' => 'integer',
            'id_asesor' => 'integer',
        ];
    }

    public function metodoPago(): BelongsTo
    {
        return $this->belongsTo(MetodoPago::class, 'id_metodo', 'id');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_asesor', 'id');
    }
}
