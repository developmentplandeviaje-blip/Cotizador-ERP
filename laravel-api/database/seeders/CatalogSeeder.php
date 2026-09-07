<?php

namespace Database\Seeders;

use App\Models\Catalog\Hotel;
use App\Models\Catalog\HabitacionHotel;
use App\Models\Catalog\TarifaHabitacion;
use App\Models\Catalog\HotelReglaComercial;
use App\Models\Catalog\Ubicacion;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CatalogSeeder extends Seeder
{
    public function run(): void
    {
        // 0. Fetch existing freelancer dynamically (never hardcode IDs)
        $freelancerId = DB::table('freelancer')->value('id');

        // 1. Seed Ubicaciones
        $margarita = Ubicacion::firstOrCreate(['ubicacion' => 'Isla de Margarita']);
        $losRoques = Ubicacion::firstOrCreate(['ubicacion' => 'Los Roques']);
        $canaima = Ubicacion::firstOrCreate(['ubicacion' => 'Canaima']);
        $caracas = Ubicacion::firstOrCreate(['ubicacion' => 'Caracas']);

        // 2. Seed Hotel: Sunsol Isla Caribe
        $hotel1 = Hotel::firstOrCreate(
            ['nombre' => 'Sunsol Isla Caribe'],
            [
                'id_ubicacion' => $margarita->id,
                'tipo' => 'Todo Incluido',
                'edad_adolescentes' => '12 - 17 Años',
                'edad_ninos' => '5 - 11 Años',
                'edad_infantes' => '0 - 4 Años',
                'nota' => 'Hotel de playa familiar en Playa El Agua.',
                'status' => true,
            ]
        );

        // Regla comercial de descuento si existe freelancer
        if ($freelancerId) {
            HotelReglaComercial::firstOrCreate(
                ['id_hotel' => $hotel1->id, 'id_freelancer' => $freelancerId],
                [
                    'descuento_monto' => 0.00,
                    'descuento_status' => false,
                    'aumento_bolivares' => true,
                    'aumento_bolivares_porcentaje' => 10.00,
                ]
            );
        }

        // Habitaciones Sunsol
        $habDoble = HabitacionHotel::firstOrCreate(
            ['id_hotel' => $hotel1->id, 'habitacion' => 'Doble'],
            [
                'cantidad_personas' => 2,
                'minimo_noches' => 2,
                'posicion' => 1,
                'por_defecto' => true,
                'nota' => 'Habitación estándar con vista al jardín.',
            ]
        );

        $habTriple = HabitacionHotel::firstOrCreate(
            ['id_hotel' => $hotel1->id, 'habitacion' => 'Triple'],
            [
                'cantidad_personas' => 3,
                'minimo_noches' => 2,
                'posicion' => 2,
                'por_defecto' => false,
                'nota' => 'Habitación familiar espaciosa.',
            ]
        );

        // Tarifas para Habitación Doble (Páginas 11-15 y 21)
        TarifaHabitacion::firstOrCreate(
            [
                'id_habitacion' => $habDoble->id,
                'desde' => '2026-09-01 00:00:00',
                'hasta' => '2026-10-31 23:59:59',
            ],
            [
                'desde_venta' => '2026-08-01 00:00:00',
                'hasta_venta' => '2026-10-15 23:59:59',
                'costo_noche_adulto' => 65.00,
                'precio_noche_adulto' => 85.00,
                'porcentaje_adulto' => 30.77,
                'costo_noche_adolescente' => 45.00,
                'precio_noche_adolescente' => 60.00,
                'porcentaje_adolescente' => 33.33,
                'costo_noche_nino' => 30.00,
                'precio_noche_nino' => 40.00,
                'porcentaje_nino' => 33.33,
                'ninos_gratis' => 1,
                'noches_gratis' => 0,
                'promocion' => true,
                'suplemento' => false,
                'moneda' => 'USD',
            ]
        );

        TarifaHabitacion::firstOrCreate(
            [
                'id_habitacion' => $habDoble->id,
                'desde' => '2026-11-01 00:00:00',
                'hasta' => '2026-12-15 23:59:59',
            ],
            [
                'desde_venta' => '2026-09-01 00:00:00',
                'hasta_venta' => '2026-11-30 23:59:59',
                'costo_noche_adulto' => 75.00,
                'precio_noche_adulto' => 95.00,
                'porcentaje_adulto' => 26.67,
                'costo_noche_adolescente' => 50.00,
                'precio_noche_adolescente' => 70.00,
                'porcentaje_adolescente' => 40.00,
                'costo_noche_nino' => 35.00,
                'precio_noche_nino' => 45.00,
                'porcentaje_nino' => 28.57,
                'ninos_gratis' => 0,
                'noches_gratis' => 0,
                'promocion' => false,
                'suplemento' => true,
                'moneda' => 'USD',
            ]
        );

        // 3. Seed Hotel: Posada Macanao Lodge
        $hotel2 = Hotel::firstOrCreate(
            ['nombre' => 'Posada Macanao Lodge'],
            [
                'id_ubicacion' => $losRoques->id,
                'tipo' => 'Pensión Completa',
                'edad_adolescentes' => '12 - 17 Años',
                'edad_ninos' => '5 - 11 Años',
                'edad_infantes' => '0 - 4 Años',
                'nota' => 'Exclusiva posada frente al mar en Gran Roque.',
                'status' => true,
            ]
        );

        if ($freelancerId) {
            HotelReglaComercial::firstOrCreate(
                ['id_hotel' => $hotel2->id, 'id_freelancer' => $freelancerId],
                [
                    'descuento_monto' => 10.00,
                    'descuento_status' => true,
                    'aumento_bolivares' => false,
                    'aumento_bolivares_porcentaje' => 0.00,
                ]
            );
        }

        // 4. Seed Hotel Deshabilitado para pruebas de estados (Página 3)
        Hotel::firstOrCreate(
            ['nombre' => 'Hesperia Playa El Agua'],
            [
                'id_ubicacion' => $margarita->id,
                'tipo' => 'Todo Incluido',
                'edad_adolescentes' => '12 - 17 Años',
                'edad_ninos' => '5 - 11 Años',
                'edad_infantes' => '0 - 4 Años',
                'nota' => 'En remodelación de áreas comunes.',
                'status' => false, // Deshabilitado
            ]
        );
    }
}
