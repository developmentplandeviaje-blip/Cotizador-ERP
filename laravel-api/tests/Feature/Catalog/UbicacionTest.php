<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\Hotel;
use App\Models\Catalog\Ubicacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UbicacionTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@ubicaciontest.com',
            'password' => Hash::make('password'),
            'level' => 'Admin',
            'status' => true,
        ]);
    }

    public function test_can_list_ubicaciones_with_search_and_pagination(): void
    {
        Sanctum::actingAs($this->adminUser);

        Ubicacion::create(['ubicacion' => 'Isla de Margarita']);
        Ubicacion::create(['ubicacion' => 'Los Roques']);
        Ubicacion::create(['ubicacion' => 'Canaima']);

        $response = $this->getJson('/api/v1/catalog/ubicaciones?search=Margarita');

        $response->assertStatus(200)
            ->assertJsonPath('data.0.ubicacion', 'Isla de Margarita')
            ->assertJsonCount(1, 'data');
    }

    public function test_can_get_all_ubicaciones_without_pagination(): void
    {
        Sanctum::actingAs($this->adminUser);

        Ubicacion::create(['ubicacion' => 'Caracas']);
        Ubicacion::create(['ubicacion' => 'Mérida']);

        $response = $this->getJson('/api/v1/catalog/ubicaciones?all=1');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_can_create_ubicacion_successfully(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'ubicacion' => 'Morrocoy',
        ];

        $response = $this->postJson('/api/v1/catalog/ubicaciones', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.ubicacion', 'Morrocoy');

        $this->assertDatabaseHas('ubicacion', [
            'ubicacion' => 'Morrocoy',
        ]);
    }

    public function test_cannot_create_duplicate_ubicacion(): void
    {
        Sanctum::actingAs($this->adminUser);

        Ubicacion::create(['ubicacion' => 'Morrocoy']);

        $response = $this->postJson('/api/v1/catalog/ubicaciones', [
            'ubicacion' => 'Morrocoy',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['ubicacion']);
    }

    public function test_can_update_ubicacion(): void
    {
        Sanctum::actingAs($this->adminUser);

        $ubicacion = Ubicacion::create(['ubicacion' => 'Margarita Island']);

        $response = $this->putJson("/api/v1/catalog/ubicaciones/{$ubicacion->id}", [
            'ubicacion' => 'Isla de Margarita',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.ubicacion', 'Isla de Margarita');

        $this->assertDatabaseHas('ubicacion', [
            'id' => $ubicacion->id,
            'ubicacion' => 'Isla de Margarita',
        ]);
    }

    public function test_can_delete_unused_ubicacion(): void
    {
        Sanctum::actingAs($this->adminUser);

        $ubicacion = Ubicacion::create(['ubicacion' => 'Ubicacion Temporal']);

        $response = $this->deleteJson("/api/v1/catalog/ubicaciones/{$ubicacion->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Ubicación eliminada exitosamente.']);

        $this->assertDatabaseMissing('ubicacion', [
            'id' => $ubicacion->id,
        ]);
    }

    public function test_cannot_delete_ubicacion_with_associated_hotels(): void
    {
        Sanctum::actingAs($this->adminUser);

        $ubicacion = Ubicacion::create(['ubicacion' => 'Isla de Margarita']);

        Hotel::create([
            'id_ubicacion' => $ubicacion->id,
            'nombre' => 'Hotel Playa Paraíso',
            'tipo' => 'Todo Incluido',
            'edad_adolescentes' => '12 - 17',
            'edad_ninos' => '5 - 11',
            'edad_infantes' => '0 - 4',
            'status' => true,
        ]);

        $response = $this->deleteJson("/api/v1/catalog/ubicaciones/{$ubicacion->id}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['ubicacion']);

        $this->assertDatabaseHas('ubicacion', [
            'id' => $ubicacion->id,
        ]);
    }
}
