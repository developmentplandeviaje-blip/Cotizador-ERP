<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;

class Aerolinea extends Model
{
    use HasFactory;

    protected $table = 'aerolinea';
    public $timestamps = false;

    protected $fillable = [
        'nombre',
    ];

    protected $casts = [
        'date_creation' => 'datetime',
    ];

    public function vuelosCount(): int
    {
        if (!DB::getSchemaBuilder()->hasTable('vuelo_venta')) {
            return 0;
        }

        return DB::table('vuelo_venta')
            ->where('id_aerolinea', $this->id)
            ->count();
    }
}
