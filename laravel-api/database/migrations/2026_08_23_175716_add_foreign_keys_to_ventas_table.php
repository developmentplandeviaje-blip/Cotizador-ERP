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
        Schema::table('ventas', function (Blueprint $table) {
            $table->foreign(['id_user'], 'fk_ventas_asesor')->references(['id'])->on('user')->onUpdate('cascade')->onDelete('restrict');
            $table->foreign(['id_referidos'], 'fk_ventas_referidos')->references(['id'])->on('referidos')->onUpdate('cascade')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->dropForeign('fk_ventas_asesor');
            $table->dropForeign('fk_ventas_referidos');
        });
    }
};
