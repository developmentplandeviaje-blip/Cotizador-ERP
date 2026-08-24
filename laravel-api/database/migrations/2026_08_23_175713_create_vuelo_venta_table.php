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
        Schema::create('vuelo_venta', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_venta')->index('fk_vuelo_v_general');
            $table->integer('id_aerolinea')->index('fk_vuelo_v_aerolinea');
            $table->text('itinerario');
            $table->string('localizador', 100);
            $table->integer('adultos')->default(0);
            $table->integer('ninos')->default(0);
            $table->integer('infantes')->default(0);
            $table->decimal('costo_adulto', 10);
            $table->decimal('costo_nino', 10);
            $table->decimal('costo_infante', 10);
            $table->decimal('precio_adulto', 10);
            $table->decimal('precio_nino', 10);
            $table->decimal('precio_infante', 10);
            $table->dateTime('fecha_vuelo');
            $table->boolean('boleto_internacional')->default(false);
            $table->decimal('comision_internacional', 10)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vuelo_venta');
    }
};
