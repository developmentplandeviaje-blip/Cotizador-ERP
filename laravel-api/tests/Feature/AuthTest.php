<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\LoginLog;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    private int $freelancerId;

    protected function setUp(): void
    {
        parent::setUp();

        // Seed basic freelancer to satisfy user table constraint
        $this->freelancerId = DB::table('freelancer')->insertGetId([
            'nombre' => 'Test Agency',
            'rif' => 'J-12345678-0',
            'correo' => 'test@agency.com',
            'telefono_1' => '123456',
            'direccion' => 'Test address',
            'color_primario' => '#ffffff',
            'logo_url' => 'logo.png',
            'hoja_membrete_config' => '{}',
        ]);
    }

    /**
     * Test a successful login.
     */
    public function test_login_successful(): void
    {
        $user = User::create([
            'id_freelancer' => $this->freelancerId,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('secret123'),
            'level' => 'Asesor',
            'status' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'john@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)
                 ->assertJsonStructure([
                     'access_token',
                     'token_type',
                     'user' => [
                         'id',
                         'first_name',
                         'last_name',
                         'email',
                         'level',
                     ]
                 ]);

        // Check if DB log exists
        $this->assertDatabaseHas('login_logs', [
            'id_user' => $user->id,
            'email' => 'john@example.com',
            'status' => 'success',
        ]);
    }

    /**
     * Test login failure due to invalid credentials (wrong password).
     */
    public function test_login_failed_wrong_password(): void
    {
        $user = User::create([
            'id_freelancer' => $this->freelancerId,
            'first_name' => 'John',
            'last_name' => 'Doe',
            'email' => 'john@example.com',
            'password' => Hash::make('secret123'),
            'level' => 'Asesor',
            'status' => true,
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'john@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertStatus(422)
                 ->assertJson(['message' => 'Credenciales incorrectas o usuario no encontrado.']);

        $this->assertDatabaseHas('login_logs', [
            'id_user' => $user->id,
            'email' => 'john@example.com',
            'status' => 'failed',
        ]);
    }

    /**
     * Test login failure due to non-existent email.
     */
    public function test_login_failed_user_not_found(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'nonexistent@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(422)
                 ->assertJson(['message' => 'Credenciales incorrectas o usuario no encontrado.']);

        // Since the user doesn't exist, we don't write to DB (foreign key constraint)
        $this->assertDatabaseCount('login_logs', 0);
    }

    /**
     * Test login is blocked for inactive user.
     */
    public function test_login_blocked_inactive_user(): void
    {
        $user = User::create([
            'id_freelancer' => $this->freelancerId,
            'first_name' => 'Inactive',
            'last_name' => 'User',
            'email' => 'inactive@example.com',
            'password' => Hash::make('secret123'),
            'level' => 'Asesor',
            'status' => false, // inactive
        ]);

        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'inactive@example.com',
            'password' => 'secret123',
        ]);

        $response->assertStatus(403)
                 ->assertJson([
                     'message' => 'Cuenta inhabilitada. Contacte al administrador.'
                 ]);

        $this->assertDatabaseHas('login_logs', [
            'id_user' => $user->id,
            'email' => 'inactive@example.com',
            'status' => 'blocked',
        ]);
    }

    /**
     * Test validation checks.
     */
    public function test_login_validation_rules(): void
    {
        $response = $this->postJson('/api/v1/auth/login', [
            'email' => 'invalid-email-format',
            'password' => '',
        ]);

        $response->assertStatus(422)
                 ->assertJsonValidationErrors(['email', 'password']);
    }
}
