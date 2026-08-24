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
        Schema::create('excursion_venta', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_venta')->index('fk_excursion_v_general');
            $table->integer('id_excursion')->index('fk_excursion_v_maestra');
            $table->string('fecha', 50);
            $table->integer('adultos')->default(0);
            $table->integer('ninos')->default(0);
            $table->integer('infantes')->default(0);
            $table->decimal('costo_adulto', 10);
            $table->decimal('costo_nino', 10);
            $table->decimal('precio_adulto', 10);
            $table->decimal('precio_nino', 10);
            $table->decimal('total_descuento', 10)->nullable()->default(0);
            $table->string('estado', 20)->default('Pendiente');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('excursion_venta');
    }
};
