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
        Schema::create('persona_venta', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_venta')->index('fk_persona_venta');
            $table->string('nombres', 30);
            $table->string('apellidos', 30);
            $table->string('tipo_documento', 30);
            $table->string('documento', 20);
            $table->integer('edad');
            $table->string('telefono', 20);
            $table->string('correo', 70);
            $table->boolean('principal')->default(false);
            $table->dateTime('fecha_creacion')->useCurrent();
            $table->dateTime('fecha_actualizacion')->useCurrentOnUpdate()->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('persona_venta');
    }
};
