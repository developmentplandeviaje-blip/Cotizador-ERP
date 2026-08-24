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
        Schema::create('gastos', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('gasto', 200);
            $table->string('agencia', 100);
            $table->decimal('total', 10)->default(0);
            $table->decimal('total_moneda', 10)->default(0);
            $table->decimal('tasa', 10)->default(1);
            $table->string('moneda', 10)->default('USD');
            $table->string('imagen_recibo', 200);
            $table->dateTime('fecha_gasto')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('gastos');
    }
};
