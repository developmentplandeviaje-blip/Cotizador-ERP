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
        Schema::create('ranking_semanal_detalle', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_ranking');
            $table->integer('id_user')->index('fk_detalle_ranking_user');
            $table->tinyInteger('posicion');
            $table->decimal('total_vendido_usd', 12)->default(0);

            $table->unique(['id_ranking', 'posicion'], 'uk_posicion_periodo');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ranking_semanal_detalle');
    }
};
