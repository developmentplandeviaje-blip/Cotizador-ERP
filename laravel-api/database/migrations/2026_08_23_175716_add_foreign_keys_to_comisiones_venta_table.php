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
        Schema::table('comisiones_venta', function (Blueprint $table) {
            $table->foreign(['id_venta'], 'fk_comision_venta')->references(['id'])->on('ventas')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('comisiones_venta', function (Blueprint $table) {
            $table->dropForeign('fk_comision_venta');
        });
    }
};
