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
        Schema::create('hotel_venta', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_venta')->index('fk_hventa_general');
            $table->integer('id_hotel')->index('fk_hventa_hotel');
            $table->integer('id_habitacion')->index('fk_hventa_habitacion');
            $table->string('tipo', 300);
            $table->integer('noches');
            $table->integer('adultos');
            $table->integer('adolescente');
            $table->integer('ninos');
            $table->integer('infantes');
            $table->decimal('costo_noche_adulto', 10);
            $table->decimal('costo_noche_adolescente', 10);
            $table->decimal('costo_noche_nino', 10);
            $table->decimal('precio_noche_adolescente', 10);
            $table->decimal('precio_noche_adulto', 10);
            $table->decimal('precio_noche_nino', 10);
            $table->string('localizador', 100);
            $table->dateTime('fecha_checkin');
            $table->dateTime('fecha_checkout');
            $table->string('estado', 50)->default('Pendiente');
            $table->dateTime('fecha_limite');
            $table->decimal('precio_noche_adulto_descuento', 10)->default(0);
            $table->decimal('precio_noche_adolescente_descuento', 10)->default(0);
            $table->decimal('precio_noche_nino_descuento', 10)->default(0);
            $table->decimal('total_descuento', 10)->default(0);
            $table->integer('ninos_gratis')->default(0);
            $table->integer('noches_gratis')->default(0);
            $table->integer('promocion')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hotel_venta');
    }
};
