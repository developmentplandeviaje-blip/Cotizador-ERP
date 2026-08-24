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
        Schema::create('pago_venta', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('id_venta')->index('fk_pago_venta_general');
            $table->integer('id_metodo')->index('fk_pago_venta_metodo');
            $table->string('numero_transaccion', 100);
            $table->enum('tipo_pago', ['pago_inicial', 'abono_cuota', 'pago_total'])->default('pago_total');
            $table->string('moneda_pago', 10)->default('USD');
            $table->decimal('monto_original', 12);
            $table->decimal('tasa_cambio', 10, 4)->default(1);
            $table->decimal('monto_usd', 10);
            $table->decimal('comision_bancaria', 10)->default(0);
            $table->string('quien_envia', 200);
            $table->text('observacion')->nullable();
            $table->integer('id_credito')->nullable();
            $table->dateTime('fecha_pago')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pago_venta');
    }
};
