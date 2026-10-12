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
}
