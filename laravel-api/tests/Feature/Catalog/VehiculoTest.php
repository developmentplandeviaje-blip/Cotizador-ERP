<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\Ubicacion;
use App\Models\Catalog\Vehiculo;
use App\Models\Catalog\VehiculoAgencia;
use App\Models\Catalog\VehiculoTarifa;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class VehiculoTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $freelancerUser;
    private Ubicacion $ubicacionMargarita;
    private Ubicacion $ubicacionCaracas;
    private VehiculoAgencia $agenciaHertz;
    private VehiculoAgencia $agenciaAlamo;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@vehiculotest.com',
            'password' => Hash::make('password'),
            'level' => 'Admin',
            'status' => true,
        ]);

        $this->freelancerUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Free',
            'last_name' => 'Lancer',
            'email' => 'freelancer@vehiculotest.com',
            'password' => Hash::make('password'),
            'level' => 'Freelancer',
            'status' => true,
        ]);

        $this->ubicacionMargarita = Ubicacion::create(['ubicacion' => 'Isla de Margarita']);
        $this->ubicacionCaracas = Ubicacion::create(['ubicacion' => 'Caracas']);

        $this->agenciaHertz = VehiculoAgencia::create([
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'agencia' => 'Hertz Margarita',
            'nota' => 'Agencia ubicada en Porlamar',
        ]);

        $this->agenciaAlamo = VehiculoAgencia::create([
            'id_ubicacion' => $this->ubicacionCaracas->id,
            'agencia' => 'Alamo Caracas',
            'nota' => 'Agencia ubicada en Aeropuerto Maiquetía',
        ]);
    }

    public function test_can_list_vehiculos_with_filters(): void
    {
        Sanctum::actingAs($this->adminUser);

        $v1 = Vehiculo::create([
            'id_vehiculo_agencia' => $this->agenciaHertz->id,
            'marca' => 'Toyota',
            'vehiculo' => 'Yaris',
            'ano' => '2024',
            'tipo_vehiculo' => 'Sedán',
            'tipo_transmision' => 'Automático',
        ]);

        $v2 = Vehiculo::create([
            'id_vehiculo_agencia' => $this->agenciaAlamo->id,
            'marca' => 'Ford',
            'vehiculo' => 'Explorer',
            'ano' => '2023',
            'tipo_vehiculo' => 'SUV / Camioneta',
            'tipo_transmision' => 'Automático',
        ]);

        // Filter by search (model)
        $res1 = $this->getJson('/api/v1/catalog/vehiculos?search=Yaris');
        $res1->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.vehiculo', 'Yaris');

        // Filter by location
        $res2 = $this->getJson('/api/v1/catalog/vehiculos?id_ubicacion=' . $this->ubicacionCaracas->id);
        $res2->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.vehiculo', 'Explorer');

        // Filter by agency
        $res3 = $this->getJson('/api/v1/catalog/vehiculos?id_vehiculo_agencia=' . $this->agenciaHertz->id);
        $res3->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.vehiculo', 'Yaris');
    }

    public function test_can_create_vehiculo_with_initial_tariff(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'id_vehiculo_agencia' => $this->agenciaHertz->id,
            'marca' => 'Chevrolet',
            'vehiculo' => 'Aveo',
            'ano' => '2023',
            'tipo_vehiculo' => 'Compacto',
            'tipo_transmision' => 'Sincrónico / Manual',
            'costo' => 30.00,
            'precio' => 45.00,
            'porcentaje' => 50.00,
            'promocion' => true,
        ];

        $res = $this->postJson('/api/v1/catalog/vehiculos', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('data.marca', 'Chevrolet')
            ->assertJsonPath('data.vehiculo', 'Aveo')
            ->assertJsonPath('data.has_promocion', true)
            ->assertJsonPath('data.tarifa_activa.precio', 45);

        $this->assertDatabaseHas('vehiculo', [
            'marca' => 'Chevrolet',
            'vehiculo' => 'Aveo',
        ]);

        $this->assertDatabaseHas('vehiculo_tarifa', [
            'costo' => 30.00,
            'precio' => 45.00,
            'promocion' => 1,
        ]);
    }

    public function test_can_create_agency_and_list_agencies(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'agencia' => 'Avis Aeropuerto',
            'nota' => 'Cerca del terminal internacional',
        ];

        $res = $this->postJson('/api/v1/catalog/vehiculo-agencias', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('data.agencia', 'Avis Aeropuerto')
            ->assertJsonPath('data.nombre_ubicacion', 'Isla de Margarita');

        $listRes = $this->getJson('/api/v1/catalog/vehiculo-agencias?id_ubicacion=' . $this->ubicacionMargarita->id);
        $listRes->assertStatus(200)
            ->assertJsonCount(2, 'data'); // Hertz Margarita + Avis Aeropuerto
    }

    public function test_can_add_tariff_to_vehicle(): void
    {
        Sanctum::actingAs($this->adminUser);

        $vehiculo = Vehiculo::create([
            'id_vehiculo_agencia' => $this->agenciaHertz->id,
            'marca' => 'Toyota',
            'vehiculo' => 'Corolla',
            'ano' => '2024',
            'tipo_vehiculo' => 'Sedán',
            'tipo_transmision' => 'Automático',
        ]);

        $tariffPayload = [
            'desde' => '2026-10-01 00:00:00',
            'hasta' => '2026-12-31 23:59:59',
            'costo' => 40.00,
            'precio' => 60.00,
            'porcentaje' => 50.00,
            'promocion' => false,
        ];

        $res = $this->postJson("/api/v1/catalog/vehiculos/{$vehiculo->id}/tarifas", $tariffPayload);

        $res->assertStatus(201)
            ->assertJsonPath('data.costo', 40)
            ->assertJsonPath('data.precio', 60);

        $this->assertDatabaseHas('vehiculo_tarifa', [
            'id_vehiculo' => $vehiculo->id,
            'costo' => 40.00,
            'precio' => 60.00,
        ]);
    }

    public function test_can_delete_vehiculo_without_sales(): void
    {
        Sanctum::actingAs($this->adminUser);

        $vehiculo = Vehiculo::create([
            'id_vehiculo_agencia' => $this->agenciaHertz->id,
            'marca' => 'Renault',
            'vehiculo' => 'Logan',
            'ano' => '2022',
            'tipo_vehiculo' => 'Sedán',
            'tipo_transmision' => 'Sincrónico',
        ]);

        $res = $this->deleteJson("/api/v1/catalog/vehiculos/{$vehiculo->id}");

        $res->assertStatus(200)
            ->assertJsonPath('message', 'Vehículo eliminado exitosamente.');

        $this->assertDatabaseMissing('vehiculo', [
            'id' => $vehiculo->id,
        ]);
    }

    public function test_cannot_delete_vehiculo_with_associated_sales(): void
    {
        Sanctum::actingAs($this->adminUser);

        $vehiculo = Vehiculo::create([
            'id_vehiculo_agencia' => $this->agenciaHertz->id,
            'marca' => 'Hyundai',
            'vehiculo' => 'Tucson',
            'ano' => '2023',
            'tipo_vehiculo' => 'SUV',
            'tipo_transmision' => 'Automático',
        ]);

        $ventaId = DB::table('ventas')->insertGetId([
            'id_user' => $this->adminUser->id,
            'numero_ficha' => 3001,
            'localizador' => 'LOC-VEH-001',
            'estado' => 'Confirmada',
            'tipo_pago' => 'Transferencia',
            'checkin' => now(),
            'checkout' => now()->addDays(3),
        ]);

        DB::table('vehiculo_venta')->insert([
            'id_venta' => $ventaId,
            'id_vehiculo' => $vehiculo->id,
            'desde' => now(),
            'hasta' => now()->addDays(3),
            'dias' => 3,
            'costo' => 150.00,
            'precio_unitario' => 60.00,
        ]);

        $res = $this->deleteJson("/api/v1/catalog/vehiculos/{$vehiculo->id}");

        $res->assertStatus(422)
            ->assertJsonValidationErrors(['vehiculo']);

        $this->assertDatabaseHas('vehiculo', [
            'id' => $vehiculo->id,
        ]);
    }

    public function test_freelancer_sees_selling_price_with_markup_and_hidden_costs(): void
    {
        $vehiculo = Vehiculo::create([
            'id_vehiculo_agencia' => $this->agenciaHertz->id,
            'marca' => 'Toyota',
            'vehiculo' => 'Fortuner',
            'ano' => '2024',
            'tipo_vehiculo' => 'Rústico / 4x4',
            'tipo_transmision' => 'Automático',
        ]);

        VehiculoTarifa::create([
            'id_vehiculo' => $vehiculo->id,
            'desde' => now(),
            'hasta' => now()->addYear(),
            'desde_venta' => now(),
            'hasta_venta' => now()->addYear(),
            'costo' => 100.00,
            'precio' => 200.00,
            'porcentaje' => 100.00,
            'promocion' => true,
        ]);

        // Freelancer request
        Sanctum::actingAs($this->freelancerUser);
        $res = $this->getJson("/api/v1/catalog/vehiculos/{$vehiculo->id}");

        $res->assertStatus(200);
        $data = $res->json('data');

        // Net costs and margins MUST be hidden in active tariff
        $this->assertNotNull($data['tarifa_activa']);
        $this->assertArrayNotHasKey('costo', $data['tarifa_activa']);
        $this->assertArrayNotHasKey('porcentaje', $data['tarifa_activa']);

        // Selling price MUST include 15% markup: 200 + 15% = 230.00
        $this->assertEquals(230.00, $data['tarifa_activa']['precio']);

        // Admin request
        Sanctum::actingAs($this->adminUser);
        $resAdmin = $this->getJson("/api/v1/catalog/vehiculos/{$vehiculo->id}");

        $resAdmin->assertStatus(200);
        $dataAdmin = $resAdmin->json('data');

        // Admin sees net cost and base price
        $this->assertArrayHasKey('costo', $dataAdmin['tarifa_activa']);
        $this->assertArrayHasKey('porcentaje', $dataAdmin['tarifa_activa']);
        $this->assertEquals(100.00, $dataAdmin['tarifa_activa']['costo']);
        $this->assertEquals(200.00, $dataAdmin['tarifa_activa']['precio']);
    }
}
