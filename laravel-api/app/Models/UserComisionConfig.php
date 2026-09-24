<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserComisionConfig extends Model
{
    use HasFactory;

    protected $table = 'user_comision_config';
    protected $primaryKey = 'id';
    public $timestamps = false;

    protected $fillable = [
        'id_user',
        'tipo_servicio',
        'porcentaje_comision',
    ];

    protected function casts(): array
    {
        return [
            'id_user' => 'integer',
            'porcentaje_comision' => 'float',
        ];
    }

    /**
     * Relationship with User.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user');
    }
}
