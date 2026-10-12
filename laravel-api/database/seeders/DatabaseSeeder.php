<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // First create or find a default freelancer
        $freelancer = DB::table('freelancer')->where('rif', 'J-12345678-9')->first();
        if (!$freelancer) {
            $freelancerId = DB::table('freelancer')->insertGetId([
                'nombre' => 'Viajes Globales S.A.',
                'rif' => 'J-12345678-9',
                'correo' => 'contacto@viajesglobales.com',
                'telefono_1' => '+58 212-5555555',
                'direccion' => 'Caracas, Venezuela',
                'color_primario' => '#1e3a8a', // Dark blue
                'logo_url' => '/assets/logos/viajesglobales.png',
                'hoja_membrete_config' => json_encode([
                    'font_family' => 'Arial',
                    'header_height' => '50px',
                    'footer_height' => '30px'
                ]),
            ]);
        } else {
            $freelancerId = $freelancer->id;
        }

        // Seed Admin user (id_freelancer is null)
        User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'id_freelancer' => null,
                'first_name' => 'Admin',
                'last_name' => 'Cotizador',
                'password' => Hash::make('password'),
                'level' => 'Admin',
                'status' => true,
            ]
        );

        // Seed active Asesor (id_freelancer is null)
        User::firstOrCreate(
            ['email' => 'asesor@example.com'],
            [
                'id_freelancer' => null,
                'first_name' => 'Asesor',
                'last_name' => 'Activo',
                'password' => Hash::make('password'),
                'level' => 'Asesor',
                'status' => true,
            ]
        );

        // Seed blocked Asesor (id_freelancer is null)
        User::firstOrCreate(
            ['email' => 'blocked@example.com'],
            [
                'id_freelancer' => null,
                'first_name' => 'Asesor',
                'last_name' => 'Inactivo',
                'password' => Hash::make('password'),
                'level' => 'Asesor',
                'status' => false,
            ]
        );

        // Seed Freelancer user (id_freelancer is linked)
        User::firstOrCreate(
            ['email' => 'freelancer@example.com'],
            [
                'id_freelancer' => $freelancerId,
                'first_name' => 'Freelancer',
                'last_name' => 'Independiente',
                'password' => Hash::make('password'),
                'level' => 'Freelancer',
                'status' => true,
            ]
        );

        // Seed initial Catalog data (Ubicaciones, Hoteles, Habitaciones, Tarifas)
        $this->call(CatalogSeeder::class);
    }
}
