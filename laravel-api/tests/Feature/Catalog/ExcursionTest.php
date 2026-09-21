<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\Excursion;
use App\Models\Catalog\Ubicacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ExcursionTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $freelancerUser;
    private Ubicacion $ubicacionMargarita;
    private Ubicacion $ubicacionRoques;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@excursiontest.com',
            'password' => Hash::make('password'),
            'level' => 'Admin',
            'status' => true,
        ]);

        $this->freelancerUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Free',
            'last_name' => 'Lancer',
            'email' => 'freelancer@excursiontest.com',
            'password' => Hash::make('password'),
            'level' => 'Freelancer',
            'status' => true,
        ]);

        $this->ubicacionMargarita = Ubicacion::create(['ubicacion' => 'Isla de Margarita']);
        $this->ubicacionRoques = Ubicacion::create(['ubicacion' => 'Los Roques']);
    }

    public function test_can_list_excursiones_with_search_and_location_filter(): void
    {
        Sanctum::actingAs($this->adminUser);

        Excursion::create([
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'tipo_excursion' => 'Full Day Coche Catamarán',
            'costo_adulto' => 30,
            'costo_nino' => 15,
            'precio_adulto' => 45,
            'precio_nino' => 25,
            'porcentaje_adulto' => 50,
            'porcentaje_nino' => 66.67,
            'aplica_descuento_referidos' => true,
        ]);

        Excursion::create([
            'id_ubicacion' => $this->ubicacionRoques->id,
            'tipo_excursion' => 'Snorkeling en Cayo Francés',
            'costo_adulto' => 40,
            'costo_nino' => 20,
            'precio_adulto' => 60,
            'precio_nino' => 35,
            'porcentaje_adulto' => 50,
            'porcentaje_nino' => 75,
            'aplica_descuento_referidos' => false,
        ]);

        // Search filter
        $res1 = $this->getJson('/api/v1/catalog/excursiones?search=Catamarán');
        $res1->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tipo_excursion', 'Full Day Coche Catamarán');

        // Location filter
        $res2 = $this->getJson('/api/v1/catalog/excursiones?id_ubicacion=' . $this->ubicacionRoques->id);
        $res2->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.tipo_excursion', 'Snorkeling en Cayo Francés');
    }

    public function test_can_create_excursion_successfully(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'tipo_excursion' => 'Safari Jeep 4x4 Macanao',
            'costo_adulto' => 40.00,
            'costo_nino' => 25.00,
            'precio_adulto' => 60.00,
            'precio_nino' => 35.00,
            'porcentaje_adulto' => 50.00,
            'porcentaje_nino' => 40.00,
            'aplica_descuento_referidos' => true,
        ];

        $response = $this->postJson('/api/v1/catalog/excursiones', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.tipo_excursion', 'Safari Jeep 4x4 Macanao')
            ->assertJsonPath('data.costo_adulto', 40)
            ->assertJsonPath('data.precio_adulto', 60)
            ->assertJsonPath('data.aplica_descuento_referidos', true);

        $this->assertDatabaseHas('excursion', [
            'tipo_excursion' => 'Safari Jeep 4x4 Macanao',
            'id_ubicacion' => $this->ubicacionMargarita->id,
        ]);
    }

    public function test_cannot_create_excursion_with_invalid_location_or_missing_fields(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/catalog/excursiones', [
            'id_ubicacion' => 99999, // non-existent
            'costo_adulto' => -10, // invalid
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['id_ubicacion', 'tipo_excursion', 'costo_adulto', 'precio_adulto']);
    }

    public function test_can_update_excursion_successfully(): void
    {
        Sanctum::actingAs($this->adminUser);

        $excursion = Excursion::create([
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'tipo_excursion' => 'Tour Coche Básico',
            'costo_adulto' => 30,
            'costo_nino' => 15,
            'precio_adulto' => 45,
            'precio_nino' => 25,
            'porcentaje_adulto' => 50,
            'porcentaje_nino' => 66.67,
            'aplica_descuento_referidos' => true,
        ]);

        $response = $this->putJson("/api/v1/catalog/excursiones/{$excursion->id}", [
            'tipo_excursion' => 'Tour Coche VIP Todo Incluido',
            'precio_adulto' => 55,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.tipo_excursion', 'Tour Coche VIP Todo Incluido')
            ->assertJsonPath('data.precio_adulto', 55);

        $this->assertDatabaseHas('excursion', [
            'id' => $excursion->id,
            'tipo_excursion' => 'Tour Coche VIP Todo Incluido',
            'precio_adulto' => 55,
        ]);
    }

    public function test_can_delete_excursion_without_sales(): void
    {
        Sanctum::actingAs($this->adminUser);

        $excursion = Excursion::create([
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'tipo_excursion' => 'Excursion Temporal',
            'costo_adulto' => 20,
            'costo_nino' => 10,
            'precio_adulto' => 30,
            'precio_nino' => 15,
            'porcentaje_adulto' => 50,
            'porcentaje_nino' => 50,
            'aplica_descuento_referidos' => false,
        ]);

        $response = $this->deleteJson("/api/v1/catalog/excursiones/{$excursion->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Excursión eliminada exitosamente.']);

        $this->assertDatabaseMissing('excursion', [
            'id' => $excursion->id,
        ]);
    }

    public function test_cannot_delete_excursion_with_associated_sales(): void
    {
        Sanctum::actingAs($this->adminUser);

        $excursion = Excursion::create([
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'tipo_excursion' => 'Excursion con Ventas',
            'costo_adulto' => 20,
            'costo_nino' => 10,
            'precio_adulto' => 30,
            'precio_nino' => 15,
            'porcentaje_adulto' => 50,
            'porcentaje_nino' => 50,
            'aplica_descuento_referidos' => false,
        ]);

        // Create mock sale and excursion_venta row
        $ventaId = DB::table('ventas')->insertGetId([
            'id_user' => $this->adminUser->id,
            'numero_ficha' => 1001,
            'localizador' => 'LOC-TEST-001',
            'estado' => 'Confirmada',
            'tipo_pago' => 'Transferencia',
            'checkin' => now(),
            'checkout' => now()->addDays(2),
        ]);

        DB::table('excursion_venta')->insert([
            'id_venta' => $ventaId,
            'id_excursion' => $excursion->id,
            'fecha' => now()->toDateString(),
            'adultos' => 2,
            'ninos' => 0,
            'costo_adulto' => 20,
            'costo_nino' => 10,
            'precio_adulto' => 30,
            'precio_nino' => 15,
        ]);

        $response = $this->deleteJson("/api/v1/catalog/excursiones/{$excursion->id}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['excursion']);

        $this->assertDatabaseHas('excursion', [
            'id' => $excursion->id,
        ]);
    }

    public function test_freelancer_receives_markup_and_cannot_see_costs_or_margins(): void
    {
        Sanctum::actingAs($this->freelancerUser);

        Excursion::create([
            'id_ubicacion' => $this->ubicacionMargarita->id,
            'tipo_excursion' => 'Full Day Coche VIP',
            'costo_adulto' => 35.00,
            'costo_nino' => 20.00,
            'precio_adulto' => 50.00,
            'precio_nino' => 30.00,
            'porcentaje_adulto' => 42.86,
            'porcentaje_nino' => 50.00,
            'aplica_descuento_referidos' => true,
        ]);

        $response = $this->getJson('/api/v1/catalog/excursiones');

        $response->assertStatus(200);

        $item = $response->json('data.0');

        // US-03: Selling prices MUST have 15% markup applied (50 * 1.15 = 57.50, 30 * 1.15 = 34.50)
        $this->assertEquals(57.50, $item['precio_adulto']);
        $this->assertEquals(34.50, $item['precio_nino']);

        // US-03: Net supplier costs and margin percentages MUST be completely omitted
        $this->assertArrayNotHasKey('costo_adulto', $item);
        $this->assertArrayNotHasKey('costo_nino', $item);
        $this->assertArrayNotHasKey('porcentaje_adulto', $item);
        $this->assertArrayNotHasKey('porcentaje_nino', $item);
    }
}
