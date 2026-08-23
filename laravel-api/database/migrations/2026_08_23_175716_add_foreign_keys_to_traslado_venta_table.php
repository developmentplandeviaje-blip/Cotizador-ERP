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
        Schema::table('traslado_venta', function (Blueprint $table) {
            $table->foreign(['id_chofer'], 'fk_tventa_chofer')->references(['id'])->on('chofer')->onUpdate('restrict')->onDelete('set null');
            $table->foreign(['id_venta'], 'fk_tventa_general')->references(['id'])->on('ventas')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['id_traslado'], 'fk_tventa_ruta')->references(['id'])->on('traslado')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['id_vuelo'], 'fk_tventa_vuelo')->references(['id'])->on('vuelo_venta')->onUpdate('restrict')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('traslado_venta', function (Blueprint $table) {
            $table->dropForeign('fk_tventa_chofer');
            $table->dropForeign('fk_tventa_general');
            $table->dropForeign('fk_tventa_ruta');
            $table->dropForeign('fk_tventa_vuelo');
        });
    }
};
