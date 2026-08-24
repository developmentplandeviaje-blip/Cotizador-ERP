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
        Schema::create('otro_venta', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_venta')->index('fk_otro_v_general');
            $table->string('fecha', 50);
            $table->text('descripcion');
            $table->integer('adultos')->default(0);
            $table->integer('ninos')->default(0);
            $table->integer('infantes')->default(0);
            $table->decimal('costo', 10);
            $table->decimal('precio', 10);
            $table->string('estado', 20)->default('Pendiente');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('otro_venta');
    }
};
