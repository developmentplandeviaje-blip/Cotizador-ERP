<?php

namespace Tests\Feature\Quote;

use App\Models\Catalog\Aerolinea;
use App\Models\Catalog\HabitacionHotel;
use App\Models\Catalog\Hotel;
use App\Models\Catalog\TarifaHabitacion;
use App\Models\Catalog\Ubicacion;
use App\Models\Quote\CotizacionRapida;
use App\Models\Quote\PersonaVenta;
use App\Models\Quote\Referido;
use App\Models\Quote\Venta;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class CotizacionTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $freelancerUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic freelancer to satisfy user table constraint if needed
        $freelancerId = DB::table('freelancer')->insertGetId([
            'nombre' => 'Freelancer Viajes',
            'rif' => 'J-99887766-1',
            'correo' => 'freelance@test.com',
            'telefono_1' => '12345678',
            'direccion' => 'Caracas',
            'color_primario' => '#3b82f6',
            'logo_url' => '',
            'hoja_membrete_config' => '{}',
        ]);


        $this->adminUser = User::create([
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin.quote@test.com',
            'password' => 'secret123',
            'level' => 'Administrador',
            'status' => 1,
        ]);

        $this->freelancerUser = User::create([
            'first_name' => 'Free',
            'last_name' => 'Lancer',
            'email' => 'free.quote@test.com',
            'password' => 'secret123',
            'level' => 'Freelancer',
            'id_freelancer' => $freelancerId,
            'status' => 1,
        ]);
    }

    public function test_catalogos_masks_net_costs_for_freelancers(): void
    {
        $ubicacion = Ubicacion::create(['ubicacion' => 'Margarita']);
        $hotel = Hotel::create([
            'nombre' => 'Hotel Playa El Agua',
            'id_ubicacion' => $ubicacion->id,
            'tipo' => 'Nacional',
            'edad_adolescentes' => '12 - 17 Años',
            'edad_ninos' => '5 - 11 Años',
            'edad_infantes' => '0 - 4 Años',
            'status' => true,
        ]);
        $habitacion = HabitacionHotel::create([
            'id_hotel' => $hotel->id,
            'habitacion' => 'Suite Matrimonial',
            'cantidad_personas' => 2,
        ]);

        TarifaHabitacion::create([
            'id_habitacion' => $habitacion->id,
            'nombre' => 'Temporada Regular',
            'desde' => '2026-01-01',
            'hasta' => '2026-12-31',
            'desde_venta' => '2026-01-01',
            'hasta_venta' => '2026-12-31',
            'costo_noche_adulto' => 50.00,
            'costo_noche_adolescente' => 40.00,
            'costo_noche_nino' => 25.00,
            'precio_noche_adulto' => 80.00,
            'precio_noche_adolescente' => 60.00,
            'precio_noche_nino' => 40.00,
            'moneda' => 'USD',
        ]);


        $response = $this->actingAs($this->freelancerUser, 'sanctum')
            ->getJson('/api/v1/cotizaciones/catalogos');

        $response->assertStatus(200)
            ->assertJsonPath('is_freelancer', true);

        $json = $response->json();
        $this->assertNotEmpty($json['hoteles']);
        $tarifa = $json['hoteles'][0]['habitaciones'][0]['tarifas'][0];

        $this->assertArrayNotHasKey('costo_noche_adulto', $tarifa);
        $this->assertArrayNotHasKey('costo_noche_adolescente', $tarifa);
        $this->assertArrayNotHasKey('costo_noche_nino', $tarifa);
        $this->assertEquals(80.00, $tarifa['precio_noche_adulto']);
    }

    public function test_validar_referido_exitoso_modo_pasivo(): void
    {
        $referido = Referido::create([
            'codigo' => 'REF-VIAJES-2026',
            'id_externo' => 'PROM-01',
            'nombre' => 'Carlos Promotor',
            'fecha_registro' => now(),
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/cotizaciones/validar-referido', [
                'codigo' => 'REF-VIAJES-2026',
            ]);

        $response->assertStatus(200)
            ->assertJson([
                'valido' => true,
                'data' => [
                    'id' => $referido->id,
                    'codigo' => 'REF-VIAJES-2026',
                    'nombre' => 'Carlos Promotor',
                ],
                'descuento_aplicado' => 0.00,
            ]);
    }

    public function test_validar_referido_invalido(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/cotizaciones/validar-referido', [
                'codigo' => 'CODIGO-INEXISTENTE',
            ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['codigo']);
    }

    public function test_buscar_cliente_por_documento_para_autocompletado(): void
    {
        $venta = Venta::create([
            'id_user' => $this->adminUser->id,
            'numero_ficha' => 1001,
            'localizador' => 'COT-TEST01',
            'estado' => 'Cotizacion',
            'tipo_pago' => 'Total',
            'checkin' => '2026-11-01',
            'checkout' => '2026-11-05',
        ]);

        PersonaVenta::create([
            'id_venta' => $venta->id,
            'nombres' => 'María Gabriela',
            'apellidos' => 'Pérez González',
            'tipo_documento' => 'V',
            'documento' => 'V-18765432',
            'edad' => 32,
            'telefono' => '+58 412 1234567',
            'correo' => 'maria.perez@example.com',
            'principal' => 1,
        ]);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/v1/cotizaciones/cliente/V-18765432');

        $response->assertStatus(200)
            ->assertJson([
                'encontrado' => true,
                'cliente' => [
                    'nombres' => 'María Gabriela',
                    'apellidos' => 'Pérez González',
                    'documento' => 'V-18765432',
                    'correo' => 'maria.perez@example.com',
                ],
            ]);
    }

    public function test_crear_cotizacion_formal_persistida_con_transaccion(): void
    {
        $ubicacion = Ubicacion::create(['ubicacion' => 'Caracas']);
        $hotel = Hotel::create([
            'nombre' => 'Hotel Humboldt',
            'id_ubicacion' => $ubicacion->id,
            'tipo' => 'Nacional',
            'edad_adolescentes' => '12 - 17 Años',
            'edad_ninos' => '5 - 11 Años',
            'edad_infantes' => '0 - 4 Años',
            'status' => true,
        ]);
        $hab = $hotel->habitaciones()->create([
            'habitacion' => 'Standard',
            'cantidad_personas' => 2,
        ]);

        $aerolinea = Aerolinea::create([
            'nombre' => 'Laser Airlines',
            'codigo' => 'QL',
        ]);
        $referido = Referido::create([
            'codigo' => 'REF-VIP',
            'nombre' => 'Promotor VIP',
            'fecha_registro' => now(),
        ]);

        $payload = [
            'cliente' => [
                'nombres' => 'Juan Alberto',
                'apellidos' => 'Mendoza',
                'tipo_documento' => 'V',
                'documento' => 'V-14555666',
                'edad' => 45,
                'telefono' => '+58 414 7778899',
                'correo' => 'juan.mendoza@example.com',
            ],
            'pasajeros' => [
                [
                    'nombres' => 'Ana Sofía',
                    'apellidos' => 'Mendoza',
                    'tipo_documento' => 'V',
                    'documento' => 'V-26111222',
                    'edad' => 17,
                    'telefono' => '',
                    'correo' => '',
                ],
            ],
            'id_referidos' => $referido->id,
            'checkin' => '2026-12-10',
            'checkout' => '2026-12-15',
            'tipo_pago' => 'Cuotas',
            'observacion' => 'Cotización con plan de cuotas y traslado opcional',
            'hoteles' => [
                [
                    'id_hotel' => $hotel->id,
                    'id_habitacion' => $hab->id,
                    'noches' => 5,

                    'adultos' => 2,
                    'adolescente' => 1,
                    'ninos' => 0,
                    'infantes' => 0,
                    'precio_noche_adulto' => 120.00,
                    'precio_noche_adolescente' => 90.00,
                    'costo_noche_adulto' => 80.00,
                    'costo_noche_adolescente' => 60.00,
                ],
            ],
            'vuelos' => [
                [
                    'id_aerolinea' => $aerolinea->id,
                    'itinerario' => 'CCS - PMV / PMV - CCS',
                    'adultos' => 2,
                    'ninos' => 0,
                    'infantes' => 0,
                    'precio_adulto' => 150.00,
                    'costo_adulto' => 110.00,
                    'fecha_vuelo' => '2026-12-10 08:00:00',
                ],
            ],
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/cotizaciones', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'cotizacion' => [
                    'id',
                    'numero_ficha',
                    'localizador',
                    'estado',
                    'personas',
                    'hoteles',
                    'vuelos',
                ],
            ]);

        $this->assertDatabaseHas('ventas', [
            'id_user' => $this->adminUser->id,
            'id_referidos' => $referido->id,
            'estado' => 'Cotizacion',
            'tipo_pago' => 'Cuotas',
        ]);

        $this->assertDatabaseHas('persona_venta', [
            'documento' => 'V-14555666',
            'principal' => 1,
        ]);

        $this->assertDatabaseHas('hotel_venta', [
            'id_hotel' => $hotel->id,
            'noches' => 5,
        ]);

        $this->assertDatabaseHas('vuelo_venta', [
            'id_aerolinea' => $aerolinea->id,
            'itinerario' => 'CCS - PMV / PMV - CCS',
        ]);
    }

    public function test_crear_cotizacion_rapida(): void
    {
        $payload = [
            'cliente' => 'Cotización Rápida Express',
            'items' => [
                ['tipo' => 'Hotel', 'nombre' => 'Hesperia', 'total' => 350.00],
            ],
            'total_estimado' => 350.00,
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/cotizaciones/rapida', $payload);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'message',
                'data' => [
                    'id',
                    'id_asesor',
                    'fecha',
                    'data',
                ],
            ]);

        $this->assertDatabaseHas('cotizaciones_rapidas', [
            'id_asesor' => $this->adminUser->id,
        ]);
    }

    public function test_crear_cotizacion_solo_requiere_nombres_y_apellidos_cliente(): void
    {
        $payload = [
            'cliente' => [
                'nombres' => 'Pedro',
                'apellidos' => 'Pérez',
                // documento, telefono, correo omitidos o nulos
            ],
            'checkin' => '2026-11-01',
            'checkout' => '2026-11-05',
            'descuento_porcentaje' => '15%',
            'descuento_monto' => 30.00,
            'hoteles' => [],
            'vuelos' => [],
        ];

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/cotizaciones', $payload);

        $response->assertStatus(201);
        $this->assertDatabaseHas('persona_venta', [
            'nombres' => 'Pedro',
            'apellidos' => 'Pérez',
            'documento' => '',
            'telefono' => '',
            'correo' => '',
            'principal' => 1,
        ]);
        $this->assertDatabaseHas('ventas', [
            'descuento_porcentaje' => '15%',
            'descuento_monto' => 30.00,
        ]);
    }

    public function test_crear_cotizacion_falla_si_falta_nombre_o_apellido(): void
    {
        // Sin apellidos
        $response1 = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/cotizaciones', [
                'cliente' => [
                    'nombres' => 'Carlos',
                ],
            ]);
        $response1->assertStatus(422)
            ->assertJsonValidationErrors(['cliente.apellidos']);

        // Sin nombres
        $response2 = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson('/api/v1/cotizaciones', [
                'cliente' => [
                    'apellidos' => 'Gómez',
                ],
            ]);
        $response2->assertStatus(422)
            ->assertJsonValidationErrors(['cliente.nombres']);
    }

    public function test_listar_cotizaciones_retorna_registro_de_guardado(): void
    {
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/v1/cotizaciones');

        $response->assertStatus(200)
            ->assertJsonIsArray();
    }
}
