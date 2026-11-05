<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotel_tipo', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 300)->unique();
            $table->timestamps();
        });

        $now = now();
        DB::table('hotel_tipo')->insert([
            ['nombre' => 'Todo Incluido', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Pensión Completa', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Media Pensión', 'created_at' => $now, 'updated_at' => $now],
            ['nombre' => 'Solo Desayuno', 'created_at' => $now, 'updated_at' => $now],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('hotel_tipo');
    }
};
