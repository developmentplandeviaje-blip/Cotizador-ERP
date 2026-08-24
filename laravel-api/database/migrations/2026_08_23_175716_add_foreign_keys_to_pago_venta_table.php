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
        Schema::table('pago_venta', function (Blueprint $table) {
            $table->foreign(['id_venta'], 'fk_pago_venta_general')->references(['id'])->on('ventas')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['id_metodo'], 'fk_pago_venta_metodo')->references(['id'])->on('metodo_pago')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pago_venta', function (Blueprint $table) {
            $table->dropForeign('fk_pago_venta_general');
            $table->dropForeign('fk_pago_venta_metodo');
        });
    }
};
