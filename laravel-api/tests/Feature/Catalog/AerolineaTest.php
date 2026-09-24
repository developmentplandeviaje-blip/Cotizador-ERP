<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\Aerolinea;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AerolineaTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $freelancerUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@aerolineatest.com',
            'password' => Hash::make('password'),
            'level' => 'Admin',
            'status' => true,
        ]);

        $this->freelancerUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Free',
            'last_name' => 'Lancer',
            'email' => 'freelancer@aerolineatest.com',
            'password' => Hash::make('password'),
            'level' => 'Freelancer',
            'status' => true,
        ]);
    }

    public function test_can_list_aerolineas_with_search_and_pagination(): void
    {
        Sanctum::actingAs($this->adminUser);

        Aerolinea::create(['nombre' => 'Laser Airlines']);
        Aerolinea::create(['nombre' => 'Rutaca Airlines']);
        Aerolinea::create(['nombre' => 'Avior Airlines']);

        $response = $this->getJson('/api/v1/catalog/aerolineas?search=Laser');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nombre', 'Laser Airlines');
    }

    public function test_can_get_all_aerolineas_without_pagination(): void
    {
        Sanctum::actingAs($this->adminUser);

        Aerolinea::create(['nombre' => 'Laser Airlines']);
        Aerolinea::create(['nombre' => 'Rutaca Airlines']);

        $response = $this->getJson('/api/v1/catalog/aerolineas?all=1');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_create_aerolinea_successfully(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'nombre' => 'Conviasa',
        ];

        $response = $this->postJson('/api/v1/catalog/aerolineas', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.nombre', 'Conviasa');

        $this->assertDatabaseHas('aerolinea', [
            'nombre' => 'Conviasa',
        ]);
    }

    public function test_cannot_create_duplicate_aerolinea(): void
    {
        Sanctum::actingAs($this->adminUser);

        Aerolinea::create(['nombre' => 'Laser Airlines']);

        $response = $this->postJson('/api/v1/catalog/aerolineas', [
            'nombre' => 'Laser Airlines',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nombre']);
    }

    public function test_cannot_create_aerolinea_with_missing_name(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/catalog/aerolineas', [
            'nombre' => '',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nombre']);
    }

    public function test_can_update_aerolinea(): void
    {
        Sanctum::actingAs($this->adminUser);

        $aerolinea = Aerolinea::create(['nombre' => 'Laser']);

        $response = $this->putJson("/api/v1/catalog/aerolineas/{$aerolinea->id}", [
            'nombre' => 'Laser Airlines C.A.',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Laser Airlines C.A.');

        $this->assertDatabaseHas('aerolinea', [
            'id' => $aerolinea->id,
            'nombre' => 'Laser Airlines C.A.',
        ]);
    }

    public function test_can_delete_unused_aerolinea(): void
    {
        Sanctum::actingAs($this->adminUser);

        $aerolinea = Aerolinea::create(['nombre' => 'Aerolinea Temporal']);

        $response = $this->deleteJson("/api/v1/catalog/aerolineas/{$aerolinea->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Aerolínea eliminada exitosamente.']);

        $this->assertDatabaseMissing('aerolinea', [
            'id' => $aerolinea->id,
        ]);
    }

    public function test_cannot_delete_aerolinea_with_associated_vuelo_ventas(): void
    {
        Sanctum::actingAs($this->adminUser);

        $aerolinea = Aerolinea::create(['nombre' => 'Avior Airlines']);

        $ventaId = DB::table('ventas')->insertGetId([
            'id_user' => $this->adminUser->id,
            'numero_ficha' => 5001,
            'localizador' => 'LOC-VUE-001',
            'estado' => 'Confirmada',
            'tipo_pago' => 'Transferencia',
            'checkin' => now(),
            'checkout' => now()->addDays(2),
        ]);

        DB::table('vuelo_venta')->insert([
            'id_venta' => $ventaId,
            'id_aerolinea' => $aerolinea->id,
            'itinerario' => 'CCS - PMV - CCS',
            'localizador' => 'LOC-AV-100',
            'adultos' => 2,
            'ninos' => 0,
            'infantes' => 0,
            'costo_adulto' => 80.00,
            'costo_nino' => 0.00,
            'costo_infante' => 0.00,
            'precio_adulto' => 110.00,
            'precio_nino' => 0.00,
            'precio_infante' => 0.00,
            'fecha_vuelo' => now()->addDays(7),
            'boleto_internacional' => 0,
            'comision_internacional' => 0.00,
        ]);

        $response = $this->deleteJson("/api/v1/catalog/aerolineas/{$aerolinea->id}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['aerolinea']);

        $this->assertDatabaseHas('aerolinea', [
            'id' => $aerolinea->id,
        ]);
    }

    public function test_freelancer_can_read_aerolineas_catalog(): void
    {
        Sanctum::actingAs($this->freelancerUser);

        Aerolinea::create(['nombre' => 'Laser Airlines']);

        $response = $this->getJson('/api/v1/catalog/aerolineas');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nombre', 'Laser Airlines');
    }
}
