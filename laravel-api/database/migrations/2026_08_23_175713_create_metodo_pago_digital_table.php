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
        Schema::create('metodo_pago_digital', function (Blueprint $table) {
            $table->integer('id_metodo')->primary();
            $table->string('correo_cuenta', 200);
            $table->enum('tipo_comision', ['porcentaje', 'fijo', 'mixto'])->default('porcentaje');
            $table->decimal('comision_valor', 5)->default(0);
            $table->string('codigo_postal', 20)->nullable();
            $table->string('direccion_facturacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('metodo_pago_digital');
    }
};
