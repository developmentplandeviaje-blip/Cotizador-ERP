<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MetodoPagoDigital extends Model
{
    use HasFactory;

    protected $table = 'metodo_pago_digital';
    protected $primaryKey = 'id_metodo';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id_metodo',
        'correo_cuenta',
        'tipo_comision',
        'comision_valor',
        'codigo_postal',
        'direccion_facturacion',
    ];

    protected function casts(): array
    {
        return [
            'id_metodo' => 'integer',
            'comision_valor' => 'float',
        ];
    }

    public function metodoPago(): BelongsTo
    {
        return $this->belongsTo(MetodoPago::class, 'id_metodo', 'id');
    }
}
