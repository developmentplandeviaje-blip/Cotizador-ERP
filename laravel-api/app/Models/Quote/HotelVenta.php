<?php

namespace App\Models\Quote;

use App\Models\Catalog\HabitacionHotel;
use App\Models\Catalog\Hotel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelVenta extends Model
{
    protected $table = 'hotel_venta';
    public $timestamps = false;

    protected $fillable = [
        'id_venta',
        'id_hotel',
        'id_habitacion',
        'tipo',
        'noches',
        'adultos',
        'adolescente',
        'ninos',
        'infantes',
        'costo_noche_adulto',
        'costo_noche_adolescente',
        'costo_noche_nino',
        'precio_noche_adolescente',
        'precio_noche_adulto',
        'precio_noche_nino',
        'localizador',
        'fecha_checkin',
        'fecha_checkout',
        'estado',
        'fecha_limite',
        'precio_noche_adulto_descuento',
        'precio_noche_adolescente_descuento',
        'precio_noche_nino_descuento',
        'total_descuento',
        'ninos_gratis',
        'noches_gratis',
        'promocion',
    ];

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class, 'id_hotel');
    }

    public function habitacion(): BelongsTo
    {
        return $this->belongsTo(HabitacionHotel::class, 'id_habitacion');
    }
}
