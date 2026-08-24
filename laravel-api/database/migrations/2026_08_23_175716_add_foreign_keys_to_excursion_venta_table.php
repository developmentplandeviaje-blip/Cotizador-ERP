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
        Schema::table('excursion_venta', function (Blueprint $table) {
            $table->foreign(['id_venta'], 'fk_excursion_v_general')->references(['id'])->on('ventas')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['id_excursion'], 'fk_excursion_v_maestra')->references(['id'])->on('excursion')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('excursion_venta', function (Blueprint $table) {
            $table->dropForeign('fk_excursion_v_general');
            $table->dropForeign('fk_excursion_v_maestra');
        });
    }
};
