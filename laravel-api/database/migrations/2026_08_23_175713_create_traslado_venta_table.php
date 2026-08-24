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
        Schema::create('traslado_venta', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_venta')->index('fk_tventa_general');
            $table->integer('id_traslado')->index('fk_tventa_ruta');
            $table->integer('id_chofer')->nullable()->index('fk_tventa_chofer');
            $table->integer('id_vuelo')->nullable()->index('fk_tventa_vuelo');
            $table->dateTime('fecha_traslado');
            $table->integer('adultos')->default(0);
            $table->integer('ninos')->default(0);
            $table->integer('infantes')->default(0);
            $table->decimal('costo_historico', 10);
            $table->decimal('precio_historico', 10);
            $table->decimal('total_descuento', 10)->default(0);
            $table->text('observacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('traslado_venta');
    }
};
