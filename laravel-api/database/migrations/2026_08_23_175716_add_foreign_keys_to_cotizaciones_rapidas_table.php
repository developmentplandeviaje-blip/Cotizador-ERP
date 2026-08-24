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
        Schema::table('cotizaciones_rapidas', function (Blueprint $table) {
            $table->foreign(['id_asesor'], 'fk_cotizacion_asesor')->references(['id'])->on('user')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cotizaciones_rapidas', function (Blueprint $table) {
            $table->dropForeign('fk_cotizacion_asesor');
        });
    }
};
