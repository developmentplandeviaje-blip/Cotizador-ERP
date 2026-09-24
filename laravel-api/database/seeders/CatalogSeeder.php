<?php

namespace Database\Seeders;

use App\Models\Catalog\Hotel;
use App\Models\Catalog\HabitacionHotel;
use App\Models\Catalog\TarifaHabitacion;
use App\Models\Catalog\HotelReglaComercial;
use App\Models\Catalog\Ubicacion;
use App\Models\Catalog\Excursion;
use App\Models\Catalog\Vehiculo;
use App\Models\Catalog\VehiculoAgencia;
use App\Models\Catalog\VehiculoTarifa;
use App\Models\Catalog\Traslado;
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

        // 5. Seed Excursiones iniciales
        Excursion::firstOrCreate(
            [
                'tipo_excursion' => 'Full Day Coche Catamarán con Almuerzo',
                'id_ubicacion' => $margarita->id,
            ],
            [
                'costo_adulto' => 35.00,
                'costo_nino' => 20.00,
                'precio_adulto' => 50.00,
                'precio_nino' => 30.00,
                'porcentaje_adulto' => 42.86,
                'porcentaje_nino' => 50.00,
                'aplica_descuento_referidos' => true,
            ]
        );

        Excursion::firstOrCreate(
            [
                'tipo_excursion' => 'Jeep Safari 4x4 Península de Macanao',
                'id_ubicacion' => $margarita->id,
            ],
            [
                'costo_adulto' => 40.00,
                'costo_nino' => 25.00,
                'precio_adulto' => 60.00,
                'precio_nino' => 35.00,
                'porcentaje_adulto' => 50.00,
                'porcentaje_nino' => 40.00,
                'aplica_descuento_referidos' => true,
            ]
        );

        Excursion::firstOrCreate(
            [
                'tipo_excursion' => 'Tour Cayo de Agua y Snorkeling',
                'id_ubicacion' => $losRoques->id,
            ],
            [
                'costo_adulto' => 65.00,
                'costo_nino' => 45.00,
                'precio_adulto' => 90.00,
                'precio_nino' => 60.00,
                'porcentaje_adulto' => 38.46,
                'porcentaje_nino' => 33.33,
                'aplica_descuento_referidos' => false,
            ]
        );

        Excursion::firstOrCreate(
            [
                'tipo_excursion' => 'Sobrevuelo y Navegación Salto Ángel',
                'id_ubicacion' => $canaima->id,
            ],
            [
                'costo_adulto' => 120.00,
                'costo_nino' => 80.00,
                'precio_adulto' => 160.00,
                'precio_nino' => 110.00,
                'porcentaje_adulto' => 33.33,
                'porcentaje_nino' => 37.50,
                'aplica_descuento_referidos' => true,
            ]
        );

        // 6. Seed Agencias de Vehículos y Vehículos (5 Registros)
        $avisMargarita = VehiculoAgencia::firstOrCreate(
            ['agencia' => 'Avis Rent a Car Margarita', 'id_ubicacion' => $margarita->id],
            ['nota' => 'Flota moderna ubicada en Aeropuerto Internacional del Caribe y Porlamar.']
        );

        $hertzCaracas = VehiculoAgencia::firstOrCreate(
            ['agencia' => 'Hertz Venezuela - Caracas', 'id_ubicacion' => $caracas->id],
            ['nota' => 'Oficina principal Aeropuerto Internacional de Maiquetía y Las Mercedes.']
        );

        $margarita4x4 = VehiculoAgencia::firstOrCreate(
            ['agencia' => 'Margarita RentaCar & 4x4', 'id_ubicacion' => $margarita->id],
            ['nota' => 'Especialistas en vehículos rústicos y familiares.']
        );

        // 1. Toyota Corolla XEi 2024
        $v1 = Vehiculo::firstOrCreate(
            ['id_vehiculo_agencia' => $avisMargarita->id, 'marca' => 'Toyota', 'vehiculo' => 'Corolla XEi', 'ano' => '2024'],
            [
                'tipo_vehiculo' => 'Sedán',
                'tipo_transmision' => 'Automática',
                'nota' => 'Capacidad 5 pasajeros, aire acondicionado, maletero amplio, incluye seguro básico.',
            ]
        );
        VehiculoTarifa::firstOrCreate(
            ['id_vehiculo' => $v1->id, 'desde' => '2026-09-01 00:00:00', 'hasta' => '2026-12-31 23:59:59'],
            [
                'desde_venta' => '2026-08-01 00:00:00',
                'hasta_venta' => '2026-12-15 23:59:59',
                'costo' => 45.00,
                'precio' => 60.00,
                'porcentaje' => 33.33,
                'promocion' => false,
            ]
        );

        // 2. Toyota Fortuner 4x4 2023
        $v2 = Vehiculo::firstOrCreate(
            ['id_vehiculo_agencia' => $margarita4x4->id, 'marca' => 'Toyota', 'vehiculo' => 'Fortuner 4x4', 'ano' => '2023'],
            [
                'tipo_vehiculo' => 'SUV / Rústico',
                'tipo_transmision' => 'Automática',
                'nota' => 'Capacidad 7 pasajeros, tracción 4x4 ideal para recorridos en playa y montaña.',
            ]
        );
        VehiculoTarifa::firstOrCreate(
            ['id_vehiculo' => $v2->id, 'desde' => '2026-09-01 00:00:00', 'hasta' => '2026-11-30 23:59:59'],
            [
                'desde_venta' => '2026-08-15 00:00:00',
                'hasta_venta' => '2026-11-15 23:59:59',
                'costo' => 90.00,
                'precio' => 120.00,
                'porcentaje' => 33.33,
                'promocion' => true,
            ]
        );

        // 3. Hyundai Tucson GL 2024
        $v3 = Vehiculo::firstOrCreate(
            ['id_vehiculo_agencia' => $hertzCaracas->id, 'marca' => 'Hyundai', 'vehiculo' => 'Tucson GL', 'ano' => '2024'],
            [
                'tipo_vehiculo' => 'SUV',
                'tipo_transmision' => 'Automática',
                'nota' => 'Capacidad 5 pasajeros, pantalla táctil con CarPlay/Android Auto, cámara de retroceso.',
            ]
        );
        VehiculoTarifa::firstOrCreate(
            ['id_vehiculo' => $v3->id, 'desde' => '2026-09-01 00:00:00', 'hasta' => '2026-12-31 23:59:59'],
            [
                'desde_venta' => '2026-08-01 00:00:00',
                'hasta_venta' => '2026-12-20 23:59:59',
                'costo' => 65.00,
                'precio' => 85.00,
                'porcentaje' => 30.77,
                'promocion' => false,
            ]
        );

        // 4. Chevrolet Spark GT 2022
        $v4 = Vehiculo::firstOrCreate(
            ['id_vehiculo_agencia' => $avisMargarita->id, 'marca' => 'Chevrolet', 'vehiculo' => 'Spark GT', 'ano' => '2022'],
            [
                'tipo_vehiculo' => 'Hatchback',
                'tipo_transmision' => 'Sincrónica',
                'nota' => 'Económico en combustible, ideal para movilidad urbana y parejas, 4 pasajeros.',
            ]
        );
        VehiculoTarifa::firstOrCreate(
            ['id_vehiculo' => $v4->id, 'desde' => '2026-09-01 00:00:00', 'hasta' => '2026-10-31 23:59:59'],
            [
                'desde_venta' => '2026-08-01 00:00:00',
                'hasta_venta' => '2026-10-25 23:59:59',
                'costo' => 30.00,
                'precio' => 40.00,
                'porcentaje' => 33.33,
                'promocion' => true,
            ]
        );

        // 5. Ford Explorer Limited 2023
        $v5 = Vehiculo::firstOrCreate(
            ['id_vehiculo_agencia' => $hertzCaracas->id, 'marca' => 'Ford', 'vehiculo' => 'Explorer Limited', 'ano' => '2023'],
            [
                'tipo_vehiculo' => 'Camioneta VIP',
                'tipo_transmision' => 'Automática',
                'nota' => 'Gama alta, asientos de cuero, techo panorámico, capacidad 7 puestos, servicio de chofer opcional.',
            ]
        );
        VehiculoTarifa::firstOrCreate(
            ['id_vehiculo' => $v5->id, 'desde' => '2026-09-15 00:00:00', 'hasta' => '2026-12-31 23:59:59'],
            [
                'desde_venta' => '2026-09-01 00:00:00',
                'hasta_venta' => '2026-12-10 23:59:59',
                'costo' => 110.00,
                'precio' => 150.00,
                'porcentaje' => 36.36,
                'promocion' => false,
            ]
        );

        // 7. Seed Traslados (5 Registros realistas)
        // 1. Aeropuerto PMV -> Playa El Agua / Porlamar (Margarita)
        Traslado::firstOrCreate(
            [
                'id_ubicacion' => $margarita->id,
                'ruta_origen' => 'Aeropuerto Internacional Santiago Mariño (PMV)',
                'ruta_destino' => 'Zona Hotelera Playa El Agua / Porlamar',
            ],
            [
                'costo' => 25.00,
                'precio_publico' => 35.00,
                'tipo_servicio' => 'privado',
            ]
        );

        // 2. Aeropuerto CCS -> Hoteles Caracas (Caracas)
        Traslado::firstOrCreate(
            [
                'id_ubicacion' => $caracas->id,
                'ruta_origen' => 'Aeropuerto Internacional Simón Bolívar Maiquetía (CCS)',
                'ruta_destino' => 'Hoteles Caracas / Las Mercedes / Chacao',
            ],
            [
                'costo' => 30.00,
                'precio_publico' => 45.00,
                'tipo_servicio' => 'privado',
            ]
        );

        // 3. Pista Gran Roque -> Posadas (Los Roques)
        Traslado::firstOrCreate(
            [
                'id_ubicacion' => $losRoques->id,
                'ruta_origen' => 'Pista de Aterrizaje Gran Roque',
                'ruta_destino' => 'Muelle Principal y Posadas Gran Roque',
            ],
            [
                'costo' => 10.00,
                'precio_publico' => 15.00,
                'tipo_servicio' => 'compartido',
            ]
        );

        // 4. Pista Canaima -> Campamentos (Canaima)
        Traslado::firstOrCreate(
            [
                'id_ubicacion' => $canaima->id,
                'ruta_origen' => 'Pista de Aterrizaje Canaima',
                'ruta_destino' => 'Campamentos Laguna de Canaima',
            ],
            [
                'costo' => 15.00,
                'precio_publico' => 25.00,
                'tipo_servicio' => 'compartido',
            ]
        );

        // 5. Hoteles Porlamar -> Terminal de Ferry Punta de Piedras (Margarita)
        Traslado::firstOrCreate(
            [
                'id_ubicacion' => $margarita->id,
                'ruta_origen' => 'Hoteles Porlamar / Pampatar',
                'ruta_destino' => 'Terminal de Ferry Punta de Piedras',
            ],
            [
                'costo' => 20.00,
                'precio_publico' => 30.00,
                'tipo_servicio' => 'privado',
            ]
        );
    }
}
