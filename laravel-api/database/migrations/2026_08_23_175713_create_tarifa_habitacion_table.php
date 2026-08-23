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
        Schema::create('tarifa_habitacion', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_habitacion');
            $table->dateTime('desde');
            $table->dateTime('hasta');
            $table->dateTime('desde_venta');
            $table->dateTime('hasta_venta');
            $table->decimal('costo_noche_adulto', 10);
            $table->decimal('precio_noche_adulto', 10);
            $table->decimal('porcentaje_adulto', 5)->default(0);
            $table->decimal('costo_noche_adolescente', 10);
            $table->decimal('precio_noche_adolescente', 10);
            $table->decimal('porcentaje_adolescente', 5)->default(0);
            $table->decimal('costo_noche_nino', 10);
            $table->decimal('precio_noche_nino', 10);
            $table->decimal('porcentaje_nino', 5)->default(0);
            $table->integer('ninos_gratis')->default(0);
            $table->integer('noches_gratis')->default(0);
            $table->boolean('promocion')->default(false);
            $table->boolean('suplemento')->default(false);
            $table->string('moneda', 10)->default('USD');
            $table->dateTime('fecha_actualizacion')->useCurrentOnUpdate()->useCurrent();

            $table->index(['id_habitacion', 'desde', 'hasta'], 'idx_busqueda_tarifa');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tarifa_habitacion');
    }
};
