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
        Schema::create('ventas', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_user')->index('fk_ventas_asesor');
            $table->integer('id_referidos')->nullable()->index('fk_ventas_referidos');
            $table->unsignedInteger('numero_ficha');
            $table->string('localizador', 100);
            $table->string('estado', 100)->default('Cotizacion');
            $table->string('tipo_pago', 50);
            $table->dateTime('checkin');
            $table->dateTime('checkout');
            $table->timestamp('fecha_limite_hotel')->default('1970-01-01 00:00:01');
            $table->timestamp('fecha_limite_cliente')->default('1970-01-01 00:00:01');
            $table->string('descuento_porcentaje', 20)->nullable();
            $table->decimal('descuento_monto', 10)->default(0);
            $table->decimal('descuento_referidos_monto', 10)->default(0);
            $table->text('observacion')->nullable();
            $table->timestamp('fecha_creacion')->useCurrent();
            $table->dateTime('fecha_confirmacion')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ventas');
    }
};
