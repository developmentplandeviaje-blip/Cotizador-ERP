<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\Hotel;
use App\Models\Catalog\HabitacionHotel;
use App\Models\Catalog\TarifaHabitacion;
use App\Models\Catalog\Ubicacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class HotelCatalogTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $freelancerUser;
    private Ubicacion $ubicacion;
    private int $freelancerId;

    protected function setUp(): void
    {
        parent::setUp();

        $this->freelancerId = DB::table('freelancer')->insertGetId([
            'nombre' => 'Viajes Test',
            'rif' => 'J-99999999-1',
            'correo' => 'freelance@test.com',
            'telefono_1' => '123456',
            'direccion' => 'Caracas',
            'color_primario' => '#E87217',
            'logo_url' => 'logo.png',
            'hoja_membrete_config' => '{}',
        ]);

        $this->adminUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@catalogtest.com',
            'password' => Hash::make('password'),
            'level' => 'Admin',
            'status' => true,
        ]);

        $this->freelancerUser = User::create([
            'id_freelancer' => $this->freelancerId,
            'first_name' => 'Freelance',
            'last_name' => 'User',
            'email' => 'freelance@catalogtest.com',
            'password' => Hash::make('password'),
            'level' => 'Freelancer',
            'status' => true,
        ]);

        $this->ubicacion = Ubicacion::create([
            'ubicacion' => 'Isla de Margarita',
        ]);
    }

    /**
     * Test hotel listing for Admin shows net costs and prices.
     */
    public function test_admin_can_view_hotels_with_net_costs(): void
    {
        Sanctum::actingAs($this->adminUser);

        $hotel = Hotel::create([
            'id_ubicacion' => $this->ubicacion->id,
            'nombre' => 'Hotel Playa Linda',
            'tipo' => 'Todo Incluido',
            'edad_adolescentes' => '12 - 17 Años',
            'edad_ninos' => '5 - 11 Años',
            'edad_infantes' => '0 - 4 Años',
            'status' => true,
        ]);

        $hab = $hotel->habitaciones()->create([
            'habitacion' => 'Doble',
            'cantidad_personas' => 2,
        ]);

        $hab->tarifas()->create([
            'desde' => '2026-09-01',
            'hasta' => '2026-09-30',
            'desde_venta' => '2026-08-01',
            'hasta_venta' => '2026-09-15',
            'costo_noche_adulto' => 50.00,
            'precio_noche_adulto' => 70.00,
            'costo_noche_adolescente' => 35.00,
            'precio_noche_adolescente' => 50.00,
            'costo_noche_nino' => 20.00,
            'precio_noche_nino' => 30.00,
            'moneda' => 'USD',
        ]);

        $response = $this->getJson("/api/v1/catalog/hoteles/{$hotel->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Hotel Playa Linda')
            ->assertJsonPath('data.habitaciones.0.tarifas.0.costo_noche_adulto', 50)
            ->assertJsonPath('data.habitaciones.0.tarifas.0.precio_noche_adulto', 70);
    }

    /**
     * Test US-03: Freelancer CANNOT see net costs and prices have markup applied.
     */
    public function test_freelancer_cannot_view_supplier_net_costs_and_receives_markup(): void
    {
        Sanctum::actingAs($this->freelancerUser);

        $hotel = Hotel::create([
            'id_ubicacion' => $this->ubicacion->id,
            'nombre' => 'Hotel Playa Linda',
            'tipo' => 'Todo Incluido',
            'edad_adolescentes' => '12 - 17 Años',
            'edad_ninos' => '5 - 11 Años',
            'edad_infantes' => '0 - 4 Años',
            'status' => true,
        ]);

        $hab = $hotel->habitaciones()->create([
            'habitacion' => 'Doble',
            'cantidad_personas' => 2,
        ]);

        $hab->tarifas()->create([
            'desde' => '2026-09-01',
            'hasta' => '2026-09-30',
            'desde_venta' => '2026-08-01',
            'hasta_venta' => '2026-09-15',
            'costo_noche_adulto' => 50.00,
            'precio_noche_adulto' => 100.00, // Base price
            'costo_noche_adolescente' => 35.00,
            'precio_noche_adolescente' => 80.00,
            'costo_noche_nino' => 20.00,
            'precio_noche_nino' => 50.00,
            'moneda' => 'USD',
        ]);

        $response = $this->getJson("/api/v1/catalog/hoteles/{$hotel->id}");

        $response->assertStatus(200);

        // US-03: Strictly ensure cost fields are missing from the payload
        $tarifa = $response->json('data.habitaciones.0.tarifas.0');
        $this->assertArrayNotHasKey('costo_noche_adulto', $tarifa);
        $this->assertArrayNotHasKey('costo_noche_adolescente', $tarifa);
        $this->assertArrayNotHasKey('costo_noche_nino', $tarifa);

        // US-03: 15% markup applied to base price (100 + 15% = 115)
        $this->assertEquals(115.00, $tarifa['precio_noche_adulto']);
        $this->assertEquals(92.00, $tarifa['precio_noche_adolescente']); // 80 + 15% = 92
        $this->assertEquals(57.50, $tarifa['precio_noche_nino']); // 50 + 15% = 57.5
    }

    /**
     * Test creating a hotel with nested rooms and rates atomically.
     */
    public function test_can_create_hotel_with_rooms_and_rates(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'id_ubicacion' => $this->ubicacion->id,
            'nombre' => 'Coche Paradise',
            'tipo' => 'Todo Incluido',
            'edad_adolescentes' => '12 - 17 Años',
            'edad_ninos' => '5 - 11 Años',
            'edad_infantes' => '0 - 4 Años',
            'status' => true,
            'habitaciones' => [
                [
                    'habitacion' => 'Cabaña Estándar',
                    'cantidad_personas' => 2,
                    'minimo_noches' => 2,
                    'posicion' => 1,
                    'tarifas' => [
                        [
                            'desde' => '2026-10-01',
                            'hasta' => '2026-10-31',
                            'desde_venta' => '2026-09-01',
                            'hasta_venta' => '2026-10-15',
                            'costo_noche_adulto' => 60.00,
                            'precio_noche_adulto' => 80.00,
                            'costo_noche_adolescente' => 40.00,
                            'precio_noche_adolescente' => 60.00,
                            'costo_noche_nino' => 20.00,
                            'precio_noche_nino' => 30.00,
                            'moneda' => 'USD',
                        ]
                    ]
                ]
            ]
        ];

        $response = $this->postJson('/api/v1/catalog/hoteles', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.nombre', 'Coche Paradise');

        $this->assertDatabaseHas('hotel', ['nombre' => 'Coche Paradise']);
        $this->assertDatabaseHas('habitacion_hotel', ['habitacion' => 'Cabaña Estándar']);
        $this->assertDatabaseHas('tarifa_habitacion', ['precio_noche_adulto' => 80.00]);
    }

    /**
     * Test toggling hotel status.
     */
    public function test_can_toggle_hotel_status(): void
    {
        Sanctum::actingAs($this->adminUser);

        $hotel = Hotel::create([
            'id_ubicacion' => $this->ubicacion->id,
            'nombre' => 'Hotel Status Test',
            'tipo' => 'Solo Desayuno',
            'edad_adolescentes' => '12 - 17',
            'edad_ninos' => '5 - 11',
            'edad_infantes' => '0 - 4',
            'status' => true,
        ]);

        $response = $this->patchJson("/api/v1/catalog/hoteles/{$hotel->id}/toggle-status");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', false)
            ->assertJsonPath('data.estado_label', 'Deshabilitado');

        $this->assertDatabaseHas('hotel', ['id' => $hotel->id, 'status' => false]);
    }
}
