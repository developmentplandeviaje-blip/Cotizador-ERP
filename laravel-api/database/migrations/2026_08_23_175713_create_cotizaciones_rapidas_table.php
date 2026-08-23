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
        Schema::create('cotizaciones_rapidas', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_asesor')->index('fk_cotizacion_asesor');
            $table->dateTime('fecha')->useCurrent();
            $table->text('data');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('cotizaciones_rapidas');
    }
};
