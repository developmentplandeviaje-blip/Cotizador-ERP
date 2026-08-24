<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected $model = User::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        // Check if there is an existing freelancer to link to, or create one.
        $freelancerId = DB::table('freelancer')->value('id');

        if (!$freelancerId) {
            $freelancerId = DB::table('freelancer')->insertGetId([
                'nombre' => 'Freelancer Seed',
                'rif' => 'V-' . fake()->unique()->numberBetween(10000000, 99999999) . '-0',
                'correo' => fake()->unique()->safeEmail(),
                'telefono_1' => fake()->phoneNumber(),
                'direccion' => fake()->address(),
                'color_primario' => '#000000',
                'logo_url' => 'logo.png',
                'hoja_membrete_config' => '{}',
            ]);
        }

        return [
            'id_freelancer' => $freelancerId,
            'first_name' => fake()->firstName(),
            'last_name' => fake()->lastName(),
            'email' => fake()->unique()->safeEmail(),
            'password' => Hash::make('password'),
            'level' => 'Asesor', // default level
            'status' => true,
        ];
    }
}
