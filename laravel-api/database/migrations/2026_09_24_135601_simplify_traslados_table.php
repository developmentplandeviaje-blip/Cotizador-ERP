<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE traslado MODIFY ruta_destino VARCHAR(255) NULL");
        DB::statement("ALTER TABLE traslado MODIFY tipo_servicio VARCHAR(50) NOT NULL DEFAULT 'Solo Ida'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE traslado MODIFY ruta_destino VARCHAR(255) NOT NULL");
        DB::statement("ALTER TABLE traslado MODIFY tipo_servicio ENUM('privado', 'compartido') NOT NULL DEFAULT 'privado'");
    }
};
