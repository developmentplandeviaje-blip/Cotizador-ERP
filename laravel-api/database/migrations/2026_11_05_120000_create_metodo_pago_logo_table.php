<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('metodo_pago_logo', function (Blueprint $table) {
            $table->id();
            $table->string('nombre', 100)->unique();
            $table->string('ruta', 255);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metodo_pago_logo');
    }
};
