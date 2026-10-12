<?php

namespace Tests\Feature\User;

use App\Models\Aliado;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserAliadoTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private Aliado $aliado;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Admin',
            'last_name' => 'General',
            'email' => 'admin@erp.com',
            'password' => Hash::make('secret123'),
            'level' => 'Admin',
            'status' => true,
        ]);

        $this->aliado = Aliado::create([
            'razon_social' => 'World Travel Network Aliados',
            'rif' => 'J-12345678-9',
            'contacto_principal' => 'Tomas Marquez',
            'telefono' => '04141234567',
            'correo' => 'tomas@worldtravel.com',
            'status' => true,
        ]);
    }

    public function test_can_toggle_vendedor_status(): void
    {
        Sanctum::actingAs($this->adminUser);

        $vendedor = User::create([
            'id_aliado' => $this->aliado->id,
            'first_name' => 'Tomas',
            'last_name' => 'Marquez',
            'email' => 'tomas@worldtravel.com',
            'password' => Hash::make('password123'),
            'level' => 'Asesor',
            'status' => true,
        ]);

        // Toggle from active to inactive
        $response = $this->patchJson("/api/v1/users/aliados/{$this->aliado->id}/vendedores/{$vendedor->id}/toggle-status");
        $response->assertStatus(200);
        $this->assertFalse((bool) $vendedor->fresh()->status);

        // Toggle back from inactive to active
        $response = $this->patchJson("/api/v1/users/aliados/{$this->aliado->id}/vendedores/{$vendedor->id}/toggle-status");
        $response->assertStatus(200);
        $this->assertTrue((bool) $vendedor->fresh()->status);
    }

    public function test_cannot_toggle_vendedor_belonging_to_another_aliado(): void
    {
        Sanctum::actingAs($this->adminUser);

        $otroAliado = Aliado::create([
            'razon_social' => 'Otra Empresa Aliada',
            'status' => true,
        ]);

        $vendedor = User::create([
            'id_aliado' => $otroAliado->id,
            'first_name' => 'Pedro',
            'last_name' => 'Perez',
            'email' => 'pedro@otraempresa.com',
            'password' => Hash::make('password123'),
            'level' => 'Asesor',
            'status' => true,
        ]);

        // Try to toggle Pedro using $this->aliado ID
        $response = $this->patchJson("/api/v1/users/aliados/{$this->aliado->id}/vendedores/{$vendedor->id}/toggle-status");
        $response->assertStatus(403);
    }

    public function test_can_create_and_update_vendedor_with_commissions(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'first_name' => 'Alexa',
            'last_name' => 'Saen',
            'email' => 'alexa@worldtravel.com',
            'password' => 'password123',
            'status' => true,
            'comisiones' => [
                'hotel' => 12.5,
                'vuelo' => 5.0,
                'excursion' => 8.0,
            ],
        ];

        $response = $this->postJson("/api/v1/users/aliados/{$this->aliado->id}/vendedores", $payload);
        $response->assertStatus(201);
        $this->assertEquals(12.5, $response->json('data.comisiones.hotel'));
        $this->assertEquals(5.0, $response->json('data.comisiones.vuelo'));
        $this->assertEquals(0.0, $response->json('data.comisiones.ferry'));

        $vendedorId = $response->json('data.id');

        // Update commissions
        $updatePayload = [
            'first_name' => 'Alexa',
            'last_name' => 'Saen',
            'email' => 'alexa@worldtravel.com',
            'comisiones' => [
                'hotel' => 15.0,
                'ferry' => 7.5,
            ],
        ];

        $updateResponse = $this->putJson("/api/v1/users/aliados/{$this->aliado->id}/vendedores/{$vendedorId}", $updatePayload);
        $updateResponse->assertStatus(200);
        $this->assertEquals(15.0, $updateResponse->json('data.comisiones.hotel'));
        $this->assertEquals(7.5, $updateResponse->json('data.comisiones.ferry'));

        // List vendedores
        $listResponse = $this->getJson("/api/v1/users/aliados/{$this->aliado->id}/vendedores");
        $listResponse->assertStatus(200);
        $this->assertEquals(15.0, $listResponse->json('data.0.comisiones.hotel'));
    }
}
