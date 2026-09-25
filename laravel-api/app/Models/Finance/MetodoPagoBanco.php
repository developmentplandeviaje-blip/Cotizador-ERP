<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MetodoPagoBanco extends Model
{
    use HasFactory;

    protected $table = 'metodo_pago_banco';
    protected $primaryKey = 'id_metodo';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id_metodo',
        'titular',
        'tipo_documento',
        'documento',
        'numero_cuenta',
        'tipo_cuenta',
        'pago_movil_telefono',
    ];

    protected function casts(): array
    {
        return [
            'id_metodo' => 'integer',
        ];
    }

    public function metodoPago(): BelongsTo
    {
        return $this->belongsTo(MetodoPago::class, 'id_metodo', 'id');
    }
}
