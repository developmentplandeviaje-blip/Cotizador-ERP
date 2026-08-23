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
        Schema::create('pago_venta_detalle', function (Blueprint $table) {
            $table->integer('id', true);
            $table->unsignedInteger('id_pago')->index('fk_detalle_pago_padre');
            $table->enum('tipo_servicio', ['hotel', 'ferry', 'vuelo', 'excursion', 'vehiculo', 'traslado', 'paquete', 'otro']);
            $table->decimal('monto_asignado_usd', 10);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pago_venta_detalle');
    }
};
