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
        Schema::create('habitacion_hotel', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_hotel')->index('fk_habitacion_hotel');
            $table->string('habitacion', 200);
            $table->integer('cantidad_personas');
            $table->integer('minimo_noches')->default(1);
            $table->integer('posicion')->default(0);
            $table->boolean('por_defecto')->default(false);
            $table->text('nota')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('habitacion_hotel');
    }
};
