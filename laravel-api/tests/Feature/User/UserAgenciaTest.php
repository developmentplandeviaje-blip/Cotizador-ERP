<?php

namespace Tests\Feature\User;

use App\Models\User;
use App\Models\UserComisionConfig;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class UserAgenciaTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $freelancerUser;
    private User $asesorUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Admin',
            'last_name' => 'Principal',
            'email' => 'admin@agenciatest.com',
            'password' => Hash::make('secret123'),
            'level' => 'Admin',
            'status' => true,
        ]);

        $this->asesorUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Carlos',
            'last_name' => 'Perez',
            'email' => 'carlos@agenciatest.com',
            'password' => Hash::make('secret123'),
            'level' => 'Asesor',
            'status' => true,
        ]);

        $this->freelancerUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Freelance',
            'last_name' => 'User',
            'email' => 'freelance@agenciatest.com',
            'password' => Hash::make('secret123'),
            'level' => 'Freelancer',
            'status' => true,
        ]);
    }

    public function test_admin_can_list_agency_users_with_search_and_filters(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Additional agency user
        User::create([
            'first_name' => 'Mariana',
            'last_name' => 'Gomez',
            'email' => 'mariana@agenciatest.com',
            'password' => Hash::make('password'),
            'level' => 'Sub Gerente',
            'status' => false,
        ]);

        // Search test
        $res1 = $this->getJson('/api/v1/users/agencia?search=Carlos');
        $res1->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'carlos@agenciatest.com');

        // Level filter test
        $res2 = $this->getJson('/api/v1/users/agencia?level=Sub Gerente');
        $res2->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.first_name', 'Mariana');

        // Status filter test
        $res3 = $this->getJson('/api/v1/users/agencia?status=0');
        $res3->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.email', 'mariana@agenciatest.com');

        // Verify freelancers are NOT included in agency list
        $resAll = $this->getJson('/api/v1/users/agencia');
        $resAll->assertStatus(200);
        $emails = collect($resAll->json('data'))->pluck('email');
        $this->assertNotContains('freelance@agenciatest.com', $emails);
    }

    public function test_freelancer_cannot_access_agency_users(): void
    {
        Sanctum::actingAs($this->freelancerUser);

        $resIndex = $this->getJson('/api/v1/users/agencia');
        $resIndex->assertStatus(403);

        $resStore = $this->postJson('/api/v1/users/agencia', [
            'first_name' => 'Hacker',
            'last_name' => 'Test',
            'email' => 'hacker@test.com',
            'password' => 'secret123',
            'level' => 'Asesor',
        ]);
        $resStore->assertStatus(403);
    }

    public function test_admin_can_create_agency_user_with_commissions(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'first_name' => 'Elena',
            'last_name' => 'Rojas',
            'email' => 'elena@agenciatest.com',
            'password' => 'password123',
            'level' => 'Lider',
            'status' => true,
            'comisiones' => [
                'hotel' => 12.5,
                'ferry' => 8.0,
                'vuelo' => 5.0,
                'excursion' => 15.0,
                'vehiculo' => 10.0,
                'traslado' => 7.5,
                'paquete' => 11.0,
                'otro' => 6.0,
            ],
        ];

        $response = $this->postJson('/api/v1/users/agencia', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.first_name', 'Elena')
            ->assertJsonPath('data.last_name', 'Rojas')
            ->assertJsonPath('data.email', 'elena@agenciatest.com')
            ->assertJsonPath('data.level', 'Lider')
            ->assertJsonPath('data.status', true)
            ->assertJsonPath('data.comisiones.hotel', 12.5)
            ->assertJsonPath('data.comisiones.ferry', 8);

        $this->assertDatabaseHas('user', [
            'email' => 'elena@agenciatest.com',
            'level' => 'Lider',
        ]);

        $createdUser = User::where('email', 'elena@agenciatest.com')->first();
        $this->assertTrue(Hash::check('password123', $createdUser->password));

        $this->assertDatabaseHas('user_comision_config', [
            'id_user' => $createdUser->id,
            'tipo_servicio' => 'hotel',
            'porcentaje_comision' => 12.5,
        ]);
    }

    public function test_validation_errors_when_creating_user(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/users/agencia', [
            'first_name' => '',
            'last_name' => '',
            'email' => 'invalid-email',
            'password' => '123', // too short
            'level' => 'InvalidLevel',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['first_name', 'last_name', 'email', 'password', 'level']);
    }

    public function test_cannot_create_user_with_duplicate_email(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/users/agencia', [
            'first_name' => 'Duplicado',
            'last_name' => 'Test',
            'email' => 'carlos@agenciatest.com', // already exists
            'password' => 'password123',
            'level' => 'Asesor',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['email']);
    }

    public function test_admin_can_update_agency_user_and_commissions(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'first_name' => 'Carlos Alberto',
            'level' => 'Sub Gerente',
            'comisiones' => [
                'hotel' => 18.0,
                'vuelo' => 9.5,
            ],
        ];

        $response = $this->putJson("/api/v1/users/agencia/{$this->asesorUser->id}", $payload);

        $response->assertStatus(200)
            ->assertJsonPath('data.first_name', 'Carlos Alberto')
            ->assertJsonPath('data.level', 'Sub Gerente')
            ->assertJsonPath('data.comisiones.hotel', 18)
            ->assertJsonPath('data.comisiones.vuelo', 9.5);

        $this->assertDatabaseHas('user', [
            'id' => $this->asesorUser->id,
            'first_name' => 'Carlos Alberto',
            'level' => 'Sub Gerente',
        ]);
    }

    public function test_admin_can_toggle_user_status(): void
    {
        Sanctum::actingAs($this->adminUser);

        $this->assertTrue((bool) $this->asesorUser->status);

        // Toggle to disabled
        $res1 = $this->patchJson("/api/v1/users/agencia/{$this->asesorUser->id}/toggle-status");
        $res1->assertStatus(200)
            ->assertJsonPath('data.status', false);

        $this->assertDatabaseHas('user', [
            'id' => $this->asesorUser->id,
            'status' => 0,
        ]);

        // Toggle back to enabled
        $res2 = $this->patchJson("/api/v1/users/agencia/{$this->asesorUser->id}/toggle-status");
        $res2->assertStatus(200)
            ->assertJsonPath('data.status', true);

        $this->assertDatabaseHas('user', [
            'id' => $this->asesorUser->id,
            'status' => 1,
        ]);
    }

    public function test_cannot_delete_user_with_associated_sales(): void
    {
        Sanctum::actingAs($this->adminUser);

        // Associate a sale with this user
        DB::table('ventas')->insert([
            'id_user' => $this->asesorUser->id,
            'numero_ficha' => 5001,
            'localizador' => 'LOC-9999',
            'estado' => 'Cotizacion',
            'tipo_pago' => 'Total',
            'checkin' => '2026-10-01 00:00:00',
            'checkout' => '2026-10-05 00:00:00',
            'fecha_limite_hotel' => now(),
            'fecha_limite_cliente' => now(),
            'descuento_monto' => 0.00,
            'descuento_referidos_monto' => 0.00,
            'fecha_creacion' => now(),
        ]);

        $response = $this->deleteJson("/api/v1/users/agencia/{$this->asesorUser->id}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['user']);

        $this->assertDatabaseHas('user', [
            'id' => $this->asesorUser->id,
        ]);
    }

    public function test_can_delete_user_without_operational_records(): void
    {
        Sanctum::actingAs($this->adminUser);

        $userToDelete = User::create([
            'first_name' => 'Temporal',
            'last_name' => 'User',
            'email' => 'temporal@agenciatest.com',
            'password' => Hash::make('password'),
            'level' => 'Asesor',
            'status' => true,
        ]);

        UserComisionConfig::create([
            'id_user' => $userToDelete->id,
            'tipo_servicio' => 'hotel',
            'porcentaje_comision' => 10.0,
        ]);

        $response = $this->deleteJson("/api/v1/users/agencia/{$userToDelete->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Usuario eliminado correctamente.']);

        $this->assertDatabaseMissing('user', [
            'id' => $userToDelete->id,
        ]);

        $this->assertDatabaseMissing('user_comision_config', [
            'id_user' => $userToDelete->id,
        ]);
    }
}
