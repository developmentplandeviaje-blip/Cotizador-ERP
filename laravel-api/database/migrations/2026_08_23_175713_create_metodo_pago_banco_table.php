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
        Schema::create('metodo_pago_banco', function (Blueprint $table) {
            $table->integer('id_metodo')->primary();
            $table->string('titular', 200);
            $table->string('tipo_documento', 10);
            $table->string('documento', 20);
            $table->string('numero_cuenta', 20)->nullable();
            $table->string('tipo_cuenta', 50)->nullable();
            $table->string('pago_movil_telefono', 50)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metodo_pago_banco');
    }
};
