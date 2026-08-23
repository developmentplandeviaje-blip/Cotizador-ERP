<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('user_comision_config', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_user');
            $table->enum('tipo_servicio', ['hotel', 'ferry', 'vuelo', 'excursion', 'vehiculo', 'traslado', 'paquete', 'otro']);
            $table->decimal('porcentaje_comision', 5)->default(0);

            $table->unique(['id_user', 'tipo_servicio'], 'uk_user_servicio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_comision_config');
    }
};
