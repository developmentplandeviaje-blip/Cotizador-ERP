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
        Schema::table('hotel_venta', function (Blueprint $table) {
            $table->foreign(['id_venta'], 'fk_hventa_general')->references(['id'])->on('ventas')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['id_habitacion'], 'fk_hventa_habitacion')->references(['id'])->on('habitacion_hotel')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['id_hotel'], 'fk_hventa_hotel')->references(['id'])->on('hotel')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hotel_venta', function (Blueprint $table) {
            $table->dropForeign('fk_hventa_general');
            $table->dropForeign('fk_hventa_habitacion');
            $table->dropForeign('fk_hventa_hotel');
        });
    }
};
