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
        Schema::create('vehiculo_tarifa', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_vehiculo');
            $table->dateTime('desde');
            $table->dateTime('hasta');
            $table->dateTime('desde_venta');
            $table->dateTime('hasta_venta');
            $table->decimal('costo', 10);
            $table->decimal('precio', 10);
            $table->decimal('porcentaje', 5)->default(0);
            $table->integer('promocion')->default(0);
            $table->dateTime('fecha_actualizacion')->useCurrentOnUpdate()->useCurrent();

            $table->index(['id_vehiculo', 'desde', 'hasta'], 'idx_busqueda_vehiculo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehiculo_tarifa');
    }
};
