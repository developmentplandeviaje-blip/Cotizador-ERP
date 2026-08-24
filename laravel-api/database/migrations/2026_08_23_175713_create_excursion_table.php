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
        Schema::create('excursion', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_ubicacion')->index('fk_excursion_ubicacion');
            $table->string('tipo_excursion', 200);
            $table->decimal('costo_adulto', 10);
            $table->decimal('costo_nino', 10);
            $table->decimal('precio_adulto', 10);
            $table->decimal('precio_nino', 10);
            $table->decimal('porcentaje_adulto', 5)->nullable();
            $table->decimal('porcentaje_nino', 5)->nullable();
            $table->boolean('aplica_descuento_referidos')->nullable()->default(true);
            $table->dateTime('date_creation')->useCurrent();
            $table->dateTime('fecha_actualizacion')->useCurrentOnUpdate()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('excursion');
    }
};
