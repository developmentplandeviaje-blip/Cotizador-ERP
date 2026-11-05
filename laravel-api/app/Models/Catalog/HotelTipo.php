<?php

namespace App\Models\Catalog;

use Illuminate\Database\Eloquent\Model;

class HotelTipo extends Model
{
    protected $table = 'hotel_tipo';

    protected $fillable = [
        'nombre',
    ];
}
