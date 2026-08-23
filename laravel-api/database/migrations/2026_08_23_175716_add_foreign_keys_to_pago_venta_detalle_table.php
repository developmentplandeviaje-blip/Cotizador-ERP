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
        Schema::table('pago_venta_detalle', function (Blueprint $table) {
            $table->foreign(['id_pago'], 'fk_detalle_pago_padre')->references(['id'])->on('pago_venta')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('pago_venta_detalle', function (Blueprint $table) {
            $table->dropForeign('fk_detalle_pago_padre');
        });
    }
};
