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
        Schema::create('hotel_regla_comercial', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_hotel');
            $table->integer('id_freelancer')->index('fk_regla_freelancer');
            $table->decimal('descuento_monto', 10)->default(0);
            $table->boolean('descuento_status')->default(false);
            $table->boolean('aumento_bolivares')->default(false);
            $table->decimal('aumento_bolivares_porcentaje', 5)->default(0);
            $table->dateTime('fecha_actualizacion')->useCurrentOnUpdate()->useCurrent();

            $table->unique(['id_hotel', 'id_freelancer'], 'uk_hotel_freelancer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hotel_regla_comercial');
    }
};
