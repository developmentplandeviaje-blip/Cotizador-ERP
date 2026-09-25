<?php

namespace Tests\Feature\Finance;

use App\Models\Finance\MetodoPago;
use App\Models\Finance\MetodoPagoAsesor;
use App\Models\Finance\MetodoPagoBanco;
use App\Models\Finance\MetodoPagoDigital;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class MetodoPagoTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $asesorUser;
    private User $freelancerUser;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Admin',
            'last_name' => 'Finance',
            'email' => 'admin@financetest.com',
            'password' => Hash::make('secret123'),
            'level' => 'Admin',
            'status' => true,
        ]);

        $this->asesorUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Pedro',
            'last_name' => 'Gomez',
            'email' => 'pedro@financetest.com',
            'password' => Hash::make('secret123'),
            'level' => 'Asesor',
            'status' => true,
        ]);

        $this->freelancerUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Free',
            'last_name' => 'Agent',
            'email' => 'freelance@financetest.com',
            'password' => Hash::make('secret123'),
            'level' => 'Freelancer',
            'status' => true,
        ]);
    }

    public function test_can_list_metodos_pago_with_filters(): void
    {
        Sanctum::actingAs($this->adminUser);

        $m1 = MetodoPago::create([
            'nombre' => 'Banesco Corriente',
            'nombre_publico' => 'Banesco Banco Universal',
            'tipo' => 'banco',
            'status' => true,
        ]);
        MetodoPagoBanco::create([
            'id_metodo' => $m1->id,
            'titular' => 'Plan de Viaje C.A.',
            'tipo_documento' => 'J',
            'documento' => '123456789',
        ]);

        $m2 = MetodoPago::create([
            'nombre' => 'Zelle Corporativo',
            'nombre_publico' => 'Zelle Pagos USD',
            'tipo' => 'digital',
            'status' => false,
        ]);
        MetodoPagoDigital::create([
            'id_metodo' => $m2->id,
            'correo_cuenta' => 'pagos@plandeviaje.com',
            'tipo_comision' => 'porcentaje',
            'comision_valor' => 0.0,
        ]);

        // Search test
        $resSearch = $this->getJson('/api/v1/finance/metodos-pago?search=Banesco');
        $resSearch->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nombre', 'Banesco Corriente');

        // Type filter test
        $resType = $this->getJson('/api/v1/finance/metodos-pago?tipo=digital');
        $resType->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nombre', 'Zelle Corporativo');

        // Status filter test
        $resStatus = $this->getJson('/api/v1/finance/metodos-pago?status=0');
        $resStatus->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.nombre', 'Zelle Corporativo');
    }

    public function test_can_create_banco_metodo_pago_with_advisors(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'nombre' => 'BNC Cuenta Corriente',
            'nombre_publico' => 'Banco Nacional de Crédito',
            'tipo' => 'banco',
            'logo' => 'LOGO-BNC.png',
            'status' => true,
            'titular' => 'Agencia de Viajes Plan C.A.',
            'tipo_documento' => 'J',
            'documento' => '501234567',
            'numero_cuenta' => '01910001000000123456',
            'tipo_cuenta' => 'Corriente',
            'pago_movil_telefono' => '04141234567',
            'asesores' => [$this->asesorUser->id],
        ];

        $response = $this->postJson('/api/v1/finance/metodos-pago', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.nombre', 'BNC Cuenta Corriente')
            ->assertJsonPath('data.banco.titular', 'Agencia de Viajes Plan C.A.')
            ->assertJsonPath('data.banco.numero_cuenta', '01910001000000123456')
            ->assertJsonCount(1, 'data.asesores');

        $this->assertDatabaseHas('metodo_pago', [
            'nombre' => 'BNC Cuenta Corriente',
            'tipo' => 'banco',
        ]);

        $created = MetodoPago::where('nombre', 'BNC Cuenta Corriente')->first();
        $this->assertDatabaseHas('metodo_pago_banco', [
            'id_metodo' => $created->id,
            'documento' => '501234567',
        ]);

        $this->assertDatabaseHas('metodo_pago_asesor', [
            'id_metodo' => $created->id,
            'id_asesor' => $this->asesorUser->id,
        ]);
    }

    public function test_can_create_digital_metodo_pago(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'nombre' => 'PayPal Internacional',
            'nombre_publico' => 'PayPal Gateway',
            'tipo' => 'digital',
            'correo_cuenta' => 'billing@plandeviaje.com',
            'tipo_comision' => 'porcentaje',
            'comision_valor' => 5.4,
            'codigo_postal' => '1010',
            'direccion_facturacion' => 'Caracas, Venezuela',
        ];

        $response = $this->postJson('/api/v1/finance/metodos-pago', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.nombre', 'PayPal Internacional')
            ->assertJsonPath('data.digital.correo_cuenta', 'billing@plandeviaje.com')
            ->assertJsonPath('data.digital.comision_valor', 5.4);

        $this->assertDatabaseHas('metodo_pago_digital', [
            'correo_cuenta' => 'billing@plandeviaje.com',
        ]);
    }

    public function test_can_create_efectivo_metodo_pago(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'nombre' => 'Efectivo Dólares',
            'nombre_publico' => 'Efectivo USD (Taquilla)',
            'tipo' => 'efectivo',
            'status' => true,
        ];

        $response = $this->postJson('/api/v1/finance/metodos-pago', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.tipo', 'efectivo')
            ->assertJsonPath('data.banco', null)
            ->assertJsonPath('data.digital', null);

        $this->assertDatabaseHas('metodo_pago', [
            'nombre' => 'Efectivo Dólares',
            'tipo' => 'efectivo',
        ]);
    }

    public function test_validation_errors_when_creating_metodo_pago(): void
    {
        Sanctum::actingAs($this->adminUser);

        $response = $this->postJson('/api/v1/finance/metodos-pago', [
            'nombre' => '',
            'tipo' => 'invalido',
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['nombre', 'nombre_publico', 'tipo']);
    }

    public function test_can_update_metodo_pago(): void
    {
        Sanctum::actingAs($this->adminUser);

        $metodo = MetodoPago::create([
            'nombre' => 'Bancaribe Original',
            'nombre_publico' => 'Bancaribe',
            'tipo' => 'banco',
            'status' => true,
        ]);
        MetodoPagoBanco::create([
            'id_metodo' => $metodo->id,
            'titular' => 'Titular Antiguo',
            'tipo_documento' => 'V',
            'documento' => '11111111',
        ]);

        $response = $this->putJson("/api/v1/finance/metodos-pago/{$metodo->id}", [
            'nombre' => 'Bancaribe Actualizado',
            'titular' => 'Titular Nuevo',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.nombre', 'Bancaribe Actualizado')
            ->assertJsonPath('data.banco.titular', 'Titular Nuevo');

        $this->assertDatabaseHas('metodo_pago', [
            'id' => $metodo->id,
            'nombre' => 'Bancaribe Actualizado',
        ]);

        $this->assertDatabaseHas('metodo_pago_banco', [
            'id_metodo' => $metodo->id,
            'titular' => 'Titular Nuevo',
        ]);
    }

    public function test_can_toggle_metodo_pago_status(): void
    {
        Sanctum::actingAs($this->adminUser);

        $metodo = MetodoPago::create([
            'nombre' => 'Zelle',
            'nombre_publico' => 'Zelle',
            'tipo' => 'digital',
            'status' => true,
        ]);

        $res1 = $this->patchJson("/api/v1/finance/metodos-pago/{$metodo->id}/toggle-status");
        $res1->assertStatus(200)
            ->assertJsonPath('data.status', false);

        $this->assertDatabaseHas('metodo_pago', [
            'id' => $metodo->id,
            'status' => 0,
        ]);

        $res2 = $this->patchJson("/api/v1/finance/metodos-pago/{$metodo->id}/toggle-status");
        $res2->assertStatus(200)
            ->assertJsonPath('data.status', true);

        $this->assertDatabaseHas('metodo_pago', [
            'id' => $metodo->id,
            'status' => 1,
        ]);
    }

    public function test_can_assign_asesores_to_metodo_pago(): void
    {
        Sanctum::actingAs($this->adminUser);

        $metodo = MetodoPago::create([
            'nombre' => 'Banesco',
            'nombre_publico' => 'Banesco',
            'tipo' => 'banco',
            'status' => true,
        ]);

        $response = $this->postJson("/api/v1/finance/metodos-pago/{$metodo->id}/asesores", [
            'asesores' => [$this->asesorUser->id],
        ]);

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data.asesores')
            ->assertJsonPath('data.asesores.0.id_asesor', $this->asesorUser->id);

        $this->assertDatabaseHas('metodo_pago_asesor', [
            'id_metodo' => $metodo->id,
            'id_asesor' => $this->asesorUser->id,
        ]);
    }

    public function test_cannot_delete_metodo_pago_with_associated_sales(): void
    {
        Sanctum::actingAs($this->adminUser);

        $metodo = MetodoPago::create([
            'nombre' => 'Banesco Ventas',
            'nombre_publico' => 'Banesco',
            'tipo' => 'banco',
            'status' => true,
        ]);

        $ventaId = DB::table('ventas')->insertGetId([
            'id_user' => $this->asesorUser->id,
            'numero_ficha' => 8888,
            'localizador' => 'LOC-PAY-TEST',
            'estado' => 'Confirmada',
            'tipo_pago' => 'Total',
            'checkin' => '2026-11-01 00:00:00',
            'checkout' => '2026-11-05 00:00:00',
            'fecha_limite_hotel' => now(),
            'fecha_limite_cliente' => now(),
            'descuento_monto' => 0.00,
            'descuento_referidos_monto' => 0.00,
            'fecha_creacion' => now(),
        ]);

        DB::table('pago_venta')->insert([
            'id_venta' => $ventaId,
            'id_metodo' => $metodo->id,
            'numero_transaccion' => 'TRX-12345678',
            'tipo_pago' => 'pago_total',
            'moneda_pago' => 'USD',
            'monto_original' => 150.00,
            'tasa_cambio' => 1.0000,
            'monto_usd' => 150.00,
            'comision_bancaria' => 0.00,
            'quien_envia' => 'Cliente Prueba',
            'fecha_pago' => now(),
        ]);

        $response = $this->deleteJson("/api/v1/finance/metodos-pago/{$metodo->id}");

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['metodo_pago']);

        $this->assertDatabaseHas('metodo_pago', [
            'id' => $metodo->id,
        ]);
    }

    public function test_can_delete_metodo_pago_without_sales(): void
    {
        Sanctum::actingAs($this->adminUser);

        $metodo = MetodoPago::create([
            'nombre' => 'Temporal Metodo',
            'nombre_publico' => 'Temporal',
            'tipo' => 'banco',
            'status' => true,
        ]);
        MetodoPagoBanco::create([
            'id_metodo' => $metodo->id,
            'titular' => 'Titular Temp',
            'tipo_documento' => 'V',
            'documento' => '22222222',
        ]);
        MetodoPagoAsesor::create([
            'id_metodo' => $metodo->id,
            'id_asesor' => $this->asesorUser->id,
            'asesor' => 'Pedro Gomez',
        ]);

        $response = $this->deleteJson("/api/v1/finance/metodos-pago/{$metodo->id}");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Método de pago eliminado correctamente.']);

        $this->assertDatabaseMissing('metodo_pago', [
            'id' => $metodo->id,
        ]);
        $this->assertDatabaseMissing('metodo_pago_banco', [
            'id_metodo' => $metodo->id,
        ]);
        $this->assertDatabaseMissing('metodo_pago_asesor', [
            'id_metodo' => $metodo->id,
        ]);
    }

    public function test_freelancer_can_read_but_cannot_mutate_metodo_pago(): void
    {
        Sanctum::actingAs($this->freelancerUser);

        $metodo = MetodoPago::create([
            'nombre' => 'Public Banesco',
            'nombre_publico' => 'Banesco Universal',
            'tipo' => 'banco',
            'status' => true,
        ]);

        // Freelancer can read
        $resIndex = $this->getJson('/api/v1/finance/metodos-pago');
        $resIndex->assertStatus(200);

        // Freelancer cannot create
        $resCreate = $this->postJson('/api/v1/finance/metodos-pago', [
            'nombre' => 'Hacker Pay',
            'nombre_publico' => 'Hacker',
            'tipo' => 'efectivo',
        ]);
        $resCreate->assertStatus(403);

        // Freelancer cannot delete
        $resDelete = $this->deleteJson("/api/v1/finance/metodos-pago/{$metodo->id}");
        $resDelete->assertStatus(403);

        // Freelancer cannot toggle
        $resToggle = $this->patchJson("/api/v1/finance/metodos-pago/{$metodo->id}/toggle-status");
        $resToggle->assertStatus(403);
    }
}
