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
        Schema::create('ferry_venta', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_venta')->index('fk_ferry_v_general');
            $table->string('ruta', 100);
            $table->string('clase', 100);
            $table->integer('adultos')->default(0);
            $table->integer('ninos')->default(0);
            $table->integer('infantes')->default(0);
            $table->integer('vehiculos')->default(0);
            $table->string('itinerario', 100);
            $table->decimal('costo_adulto', 10);
            $table->decimal('costo_nino', 10);
            $table->decimal('costo_infante', 10);
            $table->decimal('costo_vehiculo', 10);
            $table->decimal('precio_adulto', 10);
            $table->decimal('precio_nino', 10);
            $table->decimal('precio_infante', 10);
            $table->decimal('precio_vehiculo', 10);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ferry_venta');
    }
};
