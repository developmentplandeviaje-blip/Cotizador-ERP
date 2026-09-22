<?php

namespace Tests\Feature\Catalog;

use App\Models\Catalog\Paquete;
use App\Models\Catalog\Ubicacion;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PaqueteTest extends TestCase
{
    use RefreshDatabase;

    private User $adminUser;
    private User $freelancerUser;
    private Ubicacion $ubicacionCanaima;
    private Ubicacion $ubicacionRoques;

    protected function setUp(): void
    {
        parent::setUp();

        $this->adminUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Admin',
            'last_name' => 'User',
            'email' => 'admin@paquetetest.com',
            'password' => Hash::make('password'),
            'level' => 'Admin',
            'status' => true,
        ]);

        $this->freelancerUser = User::create([
            'id_freelancer' => null,
            'first_name' => 'Free',
            'last_name' => 'Lancer',
            'email' => 'freelancer@paquetetest.com',
            'password' => Hash::make('password'),
            'level' => 'Freelancer',
            'status' => true,
        ]);

        $this->ubicacionCanaima = Ubicacion::create(['ubicacion' => 'Canaima']);
        $this->ubicacionRoques = Ubicacion::create(['ubicacion' => 'Los Roques']);
    }

    public function test_can_list_paquetes_with_search_and_location_filter(): void
    {
        Sanctum::actingAs($this->adminUser);

        Paquete::create([
            'id_ubicacion' => $this->ubicacionCanaima->id,
            'paquete' => 'Expedición Salto Ángel 3D/2N',
            'costo_adulto' => 350.00,
            'costo_nino' => 200.00,
            'precio_adulto' => 450.00,
            'precio_nino' => 280.00,
            'porcentaje_adulto' => 28.57,
            'porcentaje_nino' => 40.00,
            'aplica_descuento_referidos' => true,
        ]);

        Paquete::create([
            'id_ubicacion' => $this->ubicacionRoques->id,
            'paquete' => 'Escape VIP Los Roques 4D/3N',
            'costo_adulto' => 500.00,
            'costo_nino' => 300.00,
            'precio_adulto' => 650.00,
            'precio_nino' => 420.00,
            'porcentaje_adulto' => 30.00,
            'porcentaje_nino' => 40.00,
            'aplica_descuento_referidos' => false,
        ]);

        // Search filter
        $res1 = $this->getJson('/api/v1/catalog/paquetes?search=Salto Ángel');
        $res1->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.paquete', 'Expedición Salto Ángel 3D/2N');

        // Location filter
        $res2 = $this->getJson('/api/v1/catalog/paquetes?id_ubicacion=' . $this->ubicacionRoques->id);
        $res2->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.paquete', 'Escape VIP Los Roques 4D/3N');
    }

    public function test_can_create_paquete_successfully(): void
    {
        Sanctum::actingAs($this->adminUser);

        $payload = [
            'id_ubicacion' => $this->ubicacionCanaima->id,
            'paquete' => 'Gran Sabana Extrema 5D/4N',
            'costo_adulto' => 400.00,
            'costo_nino' => 250.00,
            'precio_adulto' => 550.00,
            'precio_nino' => 350.00,
            'porcentaje_adulto' => 37.5,
            'porcentaje_nino' => 40.0,
            'aplica_descuento_referidos' => true,
        ];

        $res = $this->postJson('/api/v1/catalog/paquetes', $payload);

        $res->assertStatus(201)
            ->assertJsonPath('data.paquete', 'Gran Sabana Extrema 5D/4N')
            ->assertJsonPath('data.id_ubicacion', $this->ubicacionCanaima->id)
            ->assertJsonPath('data.nombre_ubicacion', 'Canaima')
            ->assertJsonPath('data.aplica_descuento_referidos', true);

        $this->assertDatabaseHas('paquete', [
            'paquete' => 'Gran Sabana Extrema 5D/4N',
            'costo_adulto' => 400.00,
            'precio_adulto' => 550.00,
        ]);
    }

    public function test_create_paquete_validates_required_fields(): void
    {
        Sanctum::actingAs($this->adminUser);

        $res = $this->postJson('/api/v1/catalog/paquetes', []);

        $res->assertStatus(422)
            ->assertJsonValidationErrors([
                'id_ubicacion',
                'paquete',
                'costo_adulto',
                'costo_nino',
                'precio_adulto',
                'precio_nino',
            ]);
    }

    public function test_can_update_paquete_successfully(): void
    {
        Sanctum::actingAs($this->adminUser);

        $paquete = Paquete::create([
            'id_ubicacion' => $this->ubicacionCanaima->id,
            'paquete' => 'Paquete Base 3D/2N',
            'costo_adulto' => 300.00,
            'costo_nino' => 150.00,
            'precio_adulto' => 400.00,
            'precio_nino' => 220.00,
            'porcentaje_adulto' => 33.33,
            'porcentaje_nino' => 46.67,
            'aplica_descuento_referidos' => false,
        ]);

        $updatePayload = [
            'paquete' => 'Paquete Renovado 4D/3N',
            'precio_adulto' => 480.00,
            'aplica_descuento_referidos' => true,
        ];

        $res = $this->putJson("/api/v1/catalog/paquetes/{$paquete->id}", $updatePayload);

        $res->assertStatus(200)
            ->assertJsonPath('data.paquete', 'Paquete Renovado 4D/3N')
            ->assertJsonPath('data.precio_adulto', 480)
            ->assertJsonPath('data.aplica_descuento_referidos', true);

        $this->assertDatabaseHas('paquete', [
            'id' => $paquete->id,
            'paquete' => 'Paquete Renovado 4D/3N',
            'precio_adulto' => 480.00,
        ]);
    }

    public function test_can_delete_paquete_without_sales(): void
    {
        Sanctum::actingAs($this->adminUser);

        $paquete = Paquete::create([
            'id_ubicacion' => $this->ubicacionCanaima->id,
            'paquete' => 'Paquete Temporal a Eliminar',
            'costo_adulto' => 100.00,
            'costo_nino' => 50.00,
            'precio_adulto' => 150.00,
            'precio_nino' => 80.00,
        ]);

        $res = $this->deleteJson("/api/v1/catalog/paquetes/{$paquete->id}");

        $res->assertStatus(200)
            ->assertJsonPath('message', 'Paquete eliminado exitosamente.');

        $this->assertDatabaseMissing('paquete', [
            'id' => $paquete->id,
        ]);
    }

    public function test_cannot_delete_paquete_with_associated_sales(): void
    {
        Sanctum::actingAs($this->adminUser);

        $paquete = Paquete::create([
            'id_ubicacion' => $this->ubicacionCanaima->id,
            'paquete' => 'Paquete Vendido',
            'costo_adulto' => 200.00,
            'costo_nino' => 100.00,
            'precio_adulto' => 300.00,
            'precio_nino' => 150.00,
        ]);

        // Create a dummy sale and paquete_venta record
        $ventaId = DB::table('ventas')->insertGetId([
            'id_user' => $this->adminUser->id,
            'numero_ficha' => 2001,
            'localizador' => 'LOC-PAQ-001',
            'estado' => 'Confirmada',
            'tipo_pago' => 'Transferencia',
            'checkin' => now(),
            'checkout' => now()->addDays(2),
        ]);

        DB::table('paquete_venta')->insert([
            'id_venta' => $ventaId,
            'id_paquete' => $paquete->id,
            'fecha' => '2026-10-15',
            'adultos' => 2,
            'ninos' => 0,
            'infantes' => 0,
            'costo_adulto' => 200.00,
            'costo_nino' => 0.00,
            'precio_adulto' => 300.00,
            'precio_nino' => 0.00,
        ]);

        $res = $this->deleteJson("/api/v1/catalog/paquetes/{$paquete->id}");

        $res->assertStatus(422)
            ->assertJsonValidationErrors(['paquete']);

        $this->assertDatabaseHas('paquete', [
            'id' => $paquete->id,
        ]);
    }

    public function test_freelancer_sees_selling_price_with_markup_and_hidden_costs(): void
    {
        $paquete = Paquete::create([
            'id_ubicacion' => $this->ubicacionCanaima->id,
            'paquete' => 'Paquete Canaima Para Freelancer',
            'costo_adulto' => 100.00,
            'costo_nino' => 50.00,
            'precio_adulto' => 200.00,
            'precio_nino' => 100.00,
            'porcentaje_adulto' => 100.00,
            'porcentaje_nino' => 100.00,
            'aplica_descuento_referidos' => true,
        ]);

        // When accessed by Freelancer
        Sanctum::actingAs($this->freelancerUser);
        $res = $this->getJson("/api/v1/catalog/paquetes/{$paquete->id}");

        $res->assertStatus(200);
        $data = $res->json('data');

        // Net costs and margins MUST be hidden
        $this->assertArrayNotHasKey('costo_adulto', $data);
        $this->assertArrayNotHasKey('costo_nino', $data);
        $this->assertArrayNotHasKey('porcentaje_adulto', $data);
        $this->assertArrayNotHasKey('porcentaje_nino', $data);

        // Prices MUST include 15% markup:
        // Adult: 200 + 15% = 230.00
        // Child: 100 + 15% = 115.00
        $this->assertEquals(230.00, $data['precio_adulto']);
        $this->assertEquals(115.00, $data['precio_nino']);

        // When accessed by Admin
        Sanctum::actingAs($this->adminUser);
        $resAdmin = $this->getJson("/api/v1/catalog/paquetes/{$paquete->id}");

        $resAdmin->assertStatus(200);
        $dataAdmin = $resAdmin->json('data');

        // Admin has full visibility of net costs and base prices
        $this->assertArrayHasKey('costo_adulto', $dataAdmin);
        $this->assertArrayHasKey('costo_nino', $dataAdmin);
        $this->assertEquals(100.00, $dataAdmin['costo_adulto']);
        $this->assertEquals(200.00, $dataAdmin['precio_adulto']);
    }
}
