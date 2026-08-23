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
        Schema::table('metodo_pago_asesor', function (Blueprint $table) {
            $table->foreign(['id_asesor'], 'fk_mpago_asesor')->references(['id'])->on('user')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['id_metodo'], 'fk_mpago_maestro')->references(['id'])->on('metodo_pago')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('metodo_pago_asesor', function (Blueprint $table) {
            $table->dropForeign('fk_mpago_asesor');
            $table->dropForeign('fk_mpago_maestro');
        });
    }
};
