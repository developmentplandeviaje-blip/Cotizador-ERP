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
        Schema::table('tarifa_habitacion', function (Blueprint $table) {
            $table->foreign(['id_habitacion'], 'fk_tarifa_habitacion')->references(['id'])->on('habitacion_hotel')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tarifa_habitacion', function (Blueprint $table) {
            $table->dropForeign('fk_tarifa_habitacion');
        });
    }
};
