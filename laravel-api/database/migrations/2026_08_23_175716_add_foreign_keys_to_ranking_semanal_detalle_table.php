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
        Schema::table('ranking_semanal_detalle', function (Blueprint $table) {
            $table->foreign(['id_ranking'], 'fk_detalle_ranking_padre')->references(['id'])->on('ranking_semanal')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['id_user'], 'fk_detalle_ranking_user')->references(['id'])->on('user')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ranking_semanal_detalle', function (Blueprint $table) {
            $table->dropForeign('fk_detalle_ranking_padre');
            $table->dropForeign('fk_detalle_ranking_user');
        });
    }
};
