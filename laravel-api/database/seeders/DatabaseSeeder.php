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
        // First create a default freelancer
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

        // Seed Admin user
        User::create([
            'id_freelancer' => $freelancerId,
            'first_name' => 'Admin',
            'last_name' => 'Cotizador',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'level' => 'Admin',
            'status' => true,
        ]);

        // Seed active Asesor
        User::create([
            'id_freelancer' => $freelancerId,
            'first_name' => 'Asesor',
            'last_name' => 'Activo',
            'email' => 'asesor@example.com',
            'password' => Hash::make('password'),
            'level' => 'Asesor',
            'status' => true,
        ]);

        // Seed blocked Asesor
        User::create([
            'id_freelancer' => $freelancerId,
            'first_name' => 'Asesor',
            'last_name' => 'Inactivo',
            'email' => 'blocked@example.com',
            'password' => Hash::make('password'),
            'level' => 'Asesor',
            'status' => false,
        ]);

        // Seed Freelancer user
        User::create([
            'id_freelancer' => $freelancerId,
            'first_name' => 'Freelancer',
            'last_name' => 'Independiente',
            'email' => 'freelancer@example.com',
            'password' => Hash::make('password'),
            'level' => 'Freelancer',
            'status' => true,
        ]);
    }
}
