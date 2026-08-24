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
        Schema::create('vehiculo_venta', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_venta')->index('fk_vehiculo_v_general');
            $table->integer('id_vehiculo')->index('fk_vehiculo_v_maestro');
            $table->dateTime('desde');
            $table->dateTime('hasta');
            $table->integer('dias');
            $table->decimal('costo', 10);
            $table->decimal('precio_unitario', 10);
            $table->text('observacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehiculo_venta');
    }
};
