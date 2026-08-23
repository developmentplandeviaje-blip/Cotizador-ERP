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
        Schema::create('metodo_pago_asesor', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_metodo')->index('fk_mpago_maestro');
            $table->integer('id_asesor')->index('fk_mpago_asesor');
            $table->string('asesor', 200);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metodo_pago_asesor');
    }
};
