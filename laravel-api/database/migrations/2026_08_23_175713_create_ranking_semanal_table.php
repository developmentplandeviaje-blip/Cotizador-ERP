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
        Schema::create('ranking_semanal', function (Blueprint $table) {
            $table->integer('id', true);
            $table->date('fecha_inicio');
            $table->date('fecha_fin');
            $table->dateTime('fecha_calculo')->useCurrent();

            $table->unique(['fecha_inicio', 'fecha_fin'], 'uk_periodo_ranking');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ranking_semanal');
    }
};
