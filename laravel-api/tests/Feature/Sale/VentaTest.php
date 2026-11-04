<?php

namespace Tests\Feature\Sale;

use App\Models\Aliado;
use App\Models\Finance\MetodoPago;
use App\Models\Freelancer;
use App\Models\Quote\PersonaVenta;
use App\Models\Quote\Venta;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class VentaTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $agenciaUser;
    private User $freelancerUser;
    private User $aliadoUser;
    private Aliado $aliado;
    private MetodoPago $metodoPago;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'first_name' => 'Admin',
            'last_name' => 'Principal',
            'email' => 'admin.ventas@test.com',
            'password' => 'secret123',
            'level' => 'Administrador',
            'status' => 1,
        ]);

        $this->agenciaUser = User::create([
            'first_name' => 'Asesor',
            'last_name' => 'Agencia',
            'email' => 'asesor.agencia@test.com',
            'password' => 'secret123',
            'level' => 'Asesor',
            'status' => 1,
        ]);

        $fl = Freelancer::create([
            'nombre' => 'Freelance Travel',
            'rif' => 'J-12345678-0',
            'correo' => 'fl@test.com',
            'telefono_1' => '04141234567',
            'direccion' => 'Caracas',
        ]);

        $this->freelancerUser = User::create([
            'first_name' => 'Freelancer',
            'last_name' => 'Pro',
            'email' => 'freelancer.ventas@test.com',
            'password' => 'secret123',
            'level' => 'Freelancer',
            'id_freelancer' => $fl->id,
            'status' => 1,
        ]);

        $this->aliado = Aliado::create([
            'razon_social' => 'Agencia Aliada Margarita C.A.',
            'rif' => 'J-98765432-1',
            'contacto_principal' => 'Pedro Pérez',
            'telefono' => '04129876543',
            'correo' => 'aliado@margarita.com',
            'status' => 1,
        ]);

        $this->aliadoUser = User::create([
            'first_name' => 'Vendedor',
            'last_name' => 'Aliado',
            'email' => 'vendedor.aliado@test.com',
            'password' => 'secret123',
            'level' => 'Asesor',
            'id_aliado' => $this->aliado->id,
            'status' => 1,
        ]);

        $this->metodoPago = MetodoPago::create([
            'nombre' => 'Transferencia Banesco',
            'tipo' => 'Banco',
            'status' => 1,
        ]);
    }

    private function crearVenta(User $user, float $precio = 500.0, string $estado = 'Confirmada'): Venta
    {
        $venta = Venta::create([
            'id_user' => $user->id,
            'numero_ficha' => rand(1000, 9999),
            'localizador' => 'VEN-' . strtoupper(substr(uniqid(), -6)),
            'estado' => $estado,
            'tipo_pago' => 'Total',
            'checkin' => now(),
            'checkout' => now()->addDays(3),
            'descuento_monto' => 0,
            'fecha_creacion' => now(),
            'fecha_confirmacion' => $estado === 'Confirmada' ? now() : null,
        ]);

        PersonaVenta::create([
            'id_venta' => $venta->id,
            'tipo_documento' => 'V',
            'documento' => '20123456',
            'nombres' => 'Carlos',
            'apellidos' => 'Mendoza',
            'correo' => 'carlos@test.com',
            'telefono' => '04121234567',
            'principal' => 1,
        ]);

        DB::table('otro_venta')->insert([
            'id_venta' => $venta->id,
            'descripcion' => 'Servicio Turístico General',
            'fecha' => now()->toDateString(),
            'costo' => $precio * 0.7,
            'precio' => $precio,
            'estado' => 'Pendiente',
        ]);

        return $venta;
    }

    public function test_listar_ventas_agencia(): void
    {
        $this->crearVenta($this->agenciaUser, 600.0);
        $this->crearVenta($this->freelancerUser, 400.0); // No debe salir en agencia

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/v1/ventas/agencia');

        $response->assertStatus(200)
            ->assertJsonStructure(['scope', 'ventas', 'stats']);

        $data = $response->json();
        $this->assertEquals('agencia', $data['scope']);
        $this->assertCount(1, $data['ventas']);
        $this->assertEquals(600.0, $data['stats']['total_ventas_usd']);
    }

    public function test_listar_ventas_freelancer_oculta_costos_segun_us03(): void
    {
        $this->crearVenta($this->freelancerUser, 800.0);

        // Freelancer consultando sus ventas
        $response = $this->actingAs($this->freelancerUser, 'sanctum')
            ->getJson('/api/v1/ventas/freelancer');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals('freelancer', $data['scope']);
        $this->assertCount(1, $data['ventas']);
        // US-03: Costos deben ser null para freelancer
        $this->assertNull($data['ventas'][0]['items'][0]['costo']);
    }

    public function test_listar_ventas_aliados_con_resumen_consolidado(): void
    {
        $this->crearVenta($this->aliadoUser, 1200.0);

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->getJson('/api/v1/ventas/aliados');

        $response->assertStatus(200);
        $data = $response->json();
        $this->assertEquals('aliados', $data['scope']);
        $this->assertCount(1, $data['ventas']);
        $this->assertEquals('Agencia Aliada Margarita C.A.', $data['ventas'][0]['aliado']['razon_social']);
        $this->assertEquals(1, $data['stats']['empresas_aliadas_count']);
        $this->assertEquals(1200.0, $data['stats']['total_ventas_usd']);
    }

    public function test_confirmar_venta(): void
    {
        $venta = $this->crearVenta($this->agenciaUser, 350.0, 'Cotizacion');

        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->patchJson("/api/v1/ventas/{$venta->id}/confirmar");

        $response->assertStatus(200)
            ->assertJson(['message' => 'Venta confirmada exitosamente.']);

        $this->assertDatabaseHas('ventas', [
            'id' => $venta->id,
            'estado' => 'Confirmada',
        ]);
    }

    public function test_registrar_pago_multi_moneda_us_05(): void
    {
        $venta = $this->crearVenta($this->agenciaUser, 500.0, 'Cotizacion');

        // Registro de abono de 4000 VES a tasa 40 = 100 USD
        $response = $this->actingAs($this->adminUser, 'sanctum')
            ->postJson("/api/v1/ventas/{$venta->id}/pagos", [
                'id_metodo' => $this->metodoPago->id,
                'monto_original' => 4000.00,
                'moneda_pago' => 'VES',
                'tasa_cambio' => 40.0000,
                'tipo_pago' => 'abono_cuota',
                'numero_transaccion' => 'REF-BANESCO-7788',
                'quien_envia' => 'Carlos Mendoza',
                'observacion' => 'Primer abono de viaje',
            ]);

        $response->assertStatus(201)
            ->assertJsonStructure(['message', 'pago']);

        $this->assertDatabaseHas('pago_venta', [
            'id_venta' => $venta->id,
            'moneda_pago' => 'VES',
            'monto_original' => 4000.00,
            'monto_usd' => 100.00,
        ]);

        $this->assertDatabaseHas('pago_venta_detalle', [
            'monto_asignado_usd' => 100.00,
        ]);

        // La venta en 'Cotizacion' debe haberse avanzado a 'Confirmada'
        $this->assertDatabaseHas('ventas', [
            'id' => $venta->id,
            'estado' => 'Confirmada',
        ]);
    }

    public function test_asesor_no_puede_ver_ventas_ajenas(): void
    {
        $otroAsesor = User::create([
            'first_name' => 'Otro',
            'last_name' => 'Asesor',
            'email' => 'otro@test.com',
            'password' => 'secret123',
            'level' => 'Asesor',
            'status' => 1,
        ]);

        $venta = $this->crearVenta($this->agenciaUser, 200.0);

        // El otro asesor intenta ver el detalle de la venta
        $response = $this->actingAs($otroAsesor, 'sanctum')
            ->getJson("/api/v1/ventas/{$venta->id}");

        $response->assertStatus(403);
    }
}
