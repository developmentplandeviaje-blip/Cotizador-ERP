<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\Traslado;
use App\Models\Catalog\Ubicacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TrasladoTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $freelancerUser;
    private Ubicacion $ubicacionMargarita;
    private Ubicacion $ubicacionCaracas;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@trasladotest.com',
            'password' => Hash::make('password'),
            'level' => 'Admin',
            'status' => true,
        ]);

        $this->freelancerUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Free',
            'last_name' => 'Lancer',
            'email' => 'freelancer@trasladotest.com',
            'password' => Hash::make('password'),
            'level' => 'Freelancer',
            'status' => true,
        ]);

        $this->ubicacionMargarita = Ubicacion::create(['ubicacion' => 'Isla de Margarita']);
        $this->ubicacionCaracas = Ubicacion::create(['ubicacion' => 'Caracas']);
    }

    public function test_can_list_traslados_with_search_and_filters(): void
    {
        Sanctum::actingAs($this->adminUser);

        Traslado::create([
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'ruta_origen' => 'Aeropuerto PMV',
            'ruta_destino' => 'Hotel Playa El Agua',
            'costo' => 20.00,
            'precio_publico' => 30.00,
            'tipo_servicio' => 'privado',
        ]);

        Traslado::create([
            'id_ubicacion' => $this->ubicacionCaracas->id,
            'ruta_origen' => 'Aeropuerto Maiquetía',
            'ruta_destino' => 'Hotel Eurobuilding',
            'costo' => 35.00,
            'precio_publico' => 50.00,
            'tipo_servicio' => 'compartido',
        ]);

        // Search query filter
        $res1 = $this->getJson('/api/v1/catalog/traslados?search=Maiquetía');
        $res1->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.ruta_origen', 'Aeropuerto Maiquetía');

        // Location filter
        $res2 = $this->getJson('/api/v1/catalog/traslados?id_ubicacion=' . $this->ubicacionMargarita->id);
        $res2->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.ruta_destino', 'Hotel Playa El Agua');

        // Service type filter
        $res3 = $this->getJson('/api/v1/catalog/traslados?tipo_servicio=compartido');
        $res3->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tipo_servicio', 'compartido');
    }

    public function test_can_create_traslado_successfully(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'ruta_origen' => 'Aeropuerto PMV',
            'ruta_destino' => 'Pampatar Centro',
            'costo' => 22.00,
            'precio_publico' => 32.00,
            'tipo_servicio' => 'privado',
        ];

        $response = $this->postJson('/api/v1/catalog/traslados', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.ruta_origen', 'Aeropuerto PMV')
            ->assertJsonPath('data.ruta_destino', 'Pampatar Centro')
            ->assertJsonPath('data.costo', 22)
            ->assertJsonPath('data.precio_publico', 32)
            ->assertJsonPath('data.tipo_servicio', 'privado');

        $this->assertDatabaseHas('traslado', [
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'ruta_origen' => 'Aeropuerto PMV',
            'ruta_destino' => 'Pampatar Centro',
        ]);
    }

    public function test_cannot_create_traslado_with_invalid_data(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/catalog/traslados', [
            'id_ubicacion' => 999999, // non-existent
            'costo' => -5, // invalid
            'tipo_servicio' => 'invalido',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['id_ubicacion', 'ruta_origen', 'ruta_destino', 'costo', 'precio_publico', 'tipo_servicio']);
    }

    public function test_can_update_traslado_successfully(): void
    {
        Sanctum::actingAs($this->adminUser);

        $traslado = Traslado::create([
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'ruta_origen' => 'Aeropuerto PMV',
            'ruta_destino' => 'Hotel Sunsol',
            'costo' => 25.00,
            'precio_publico' => 35.00,
            'tipo_servicio' => 'privado',
        ]);

        $response = $this->putJson("/api/v1/catalog/traslados/{$traslado->id}", [
            'ruta_destino' => 'Hotel Sunsol Isla Caribe',
            'precio_publico' => 40.00,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.ruta_destino', 'Hotel Sunsol Isla Caribe')
            ->assertJsonPath('data.precio_publico', 40);

        $this->assertDatabaseHas('traslado', [
            'id' => $traslado->id,
            'ruta_destino' => 'Hotel Sunsol Isla Caribe',
            'precio_publico' => 40.00,
        ]);
    }

    public function test_can_delete_traslado_without_sales(): void
    {
        Sanctum::actingAs($this->adminUser);

        $traslado = Traslado::create([
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'ruta_origen' => 'Origen Test',
            'ruta_destino' => 'Destino Test',
            'costo' => 10.00,
            'precio_publico' => 15.00,
            'tipo_servicio' => 'privado',
        ]);

        $response = $this->deleteJson("/api/v1/catalog/traslados/{$traslado->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Traslado eliminado exitosamente.']);

        $this->assertDatabaseMissing('traslado', [
            'id' => $traslado->id,
        ]);
    }

    public function test_cannot_delete_traslado_with_associated_sales(): void
    {
        Sanctum::actingAs($this->adminUser);

        $traslado = Traslado::create([
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'ruta_origen' => 'Origen con Ventas',
            'ruta_destino' => 'Destino con Ventas',
            'costo' => 20.00,
            'precio_publico' => 30.00,
            'tipo_servicio' => 'privado',
        ]);

        $ventaId = DB::table('ventas')->insertGetId([
            'id_user' => $this->adminUser->id,
            'numero_ficha' => 4001,
            'localizador' => 'LOC-TRA-001',
            'estado' => 'Confirmada',
            'tipo_pago' => 'Transferencia',
            'checkin' => now(),
            'checkout' => now()->addDays(2),
        ]);

        DB::table('traslado_venta')->insert([
            'id_venta' => $ventaId,
            'id_traslado' => $traslado->id,
            'fecha_traslado' => now(),
            'adultos' => 2,
            'ninos' => 0,
            'infantes' => 0,
            'costo_historico' => 20.00,
            'precio_historico' => 30.00,
            'total_descuento' => 0.00,
        ]);

        $response = $this->deleteJson("/api/v1/catalog/traslados/{$traslado->id}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['traslado']);

        $this->assertDatabaseHas('traslado', [
            'id' => $traslado->id,
        ]);
    }

    public function test_freelancer_receives_markup_and_cannot_see_costs_or_margins(): void
    {
        $traslado = Traslado::create([
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'ruta_origen' => 'Aeropuerto PMV',
            'ruta_destino' => 'Playa El Yaque',
            'costo' => 20.00,
            'precio_publico' => 100.00,
            'tipo_servicio' => 'privado',
        ]);

        // Freelancer request
        Sanctum::actingAs($this->freelancerUser);
        $resFreelancer = $this->getJson("/api/v1/catalog/traslados/{$traslado->id}");

        $resFreelancer->assertStatus(200);
        $dataFreelancer = $resFreelancer->json('data');

        // US-03: Selling price MUST have 15% markup: 100 * 1.15 = 115.00
        $this->assertEquals(115.00, $dataFreelancer['precio_publico']);

        // US-03: Net supplier cost and margin percentage MUST be omitted
        $this->assertArrayNotHasKey('costo', $dataFreelancer);
        $this->assertArrayNotHasKey('porcentaje', $dataFreelancer);

        // Admin request
        Sanctum::actingAs($this->adminUser);
        $resAdmin = $this->getJson("/api/v1/catalog/traslados/{$traslado->id}");

        $resAdmin->assertStatus(200);
        $dataAdmin = $resAdmin->json('data');

        // Admin sees net cost, original price, and margin percentage
        $this->assertEquals(20.00, $dataAdmin['costo']);
        $this->assertEquals(100.00, $dataAdmin['precio_publico']);
        $this->assertEquals(400.00, $dataAdmin['porcentaje']); // ((100-20)/20)*100 = 400%
    }
}
