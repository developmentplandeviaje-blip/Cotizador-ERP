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
        Schema::table('metodo_pago_digital', function (Blueprint $table) {
            $table->foreign(['id_metodo'], 'fk_ext_digital_metodo')->references(['id'])->on('metodo_pago')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('metodo_pago_digital', function (Blueprint $table) {
            $table->dropForeign('fk_ext_digital_metodo');
        });
    }
};
