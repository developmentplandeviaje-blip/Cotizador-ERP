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
        Schema::create('paquete', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_ubicacion')->index('fk_paquete_ubicacion');
            $table->string('paquete', 200);
            $table->decimal('costo_adulto', 10);
            $table->decimal('costo_nino', 10);
            $table->decimal('precio_adulto', 10);
            $table->decimal('precio_nino', 10);
            $table->dateTime('date_creation')->useCurrent();
            $table->dateTime('fecha_actualizacion')->useCurrentOnUpdate()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paquete');
    }
};
