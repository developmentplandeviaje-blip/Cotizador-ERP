<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vuelo_venta', function (Blueprint $table) {
            $table->dateTime('fecha_retorno')->nullable();
        });

        Schema::table('traslado_venta', function (Blueprint $table) {
            $table->dateTime('fecha_retorno')->nullable();
        });

        Schema::table('ferry_venta', function (Blueprint $table) {
            $table->dateTime('fecha_salida')->nullable();
            $table->dateTime('fecha_retorno')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('vuelo_venta', function (Blueprint $table) {
            $table->dropColumn('fecha_retorno');
        });

        Schema::table('traslado_venta', function (Blueprint $table) {
            $table->dropColumn('fecha_retorno');
        });

        Schema::table('ferry_venta', function (Blueprint $table) {
            $table->dropColumn(['fecha_salida', 'fecha_retorno']);
        });
    }
};
