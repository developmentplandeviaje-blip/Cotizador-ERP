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
        Schema::create('vehiculo', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_vehiculo_agencia')->index('fk_vehiculo_agencia');
            $table->string('marca', 200);
            $table->string('vehiculo', 200);
            $table->string('ano', 200);
            $table->string('tipo_vehiculo', 200);
            $table->string('tipo_transmision', 200);
            $table->text('nota')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehiculo');
    }
};
