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
        Schema::create('traslado', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_ubicacion')->index('fk_traslado_master_ubicacion');
            $table->string('ruta_origen');
            $table->string('ruta_destino');
            $table->decimal('costo', 10);
            $table->decimal('precio_publico', 10);
            $table->enum('tipo_servicio', ['privado', 'compartido'])->default('privado');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('traslado');
    }
};
