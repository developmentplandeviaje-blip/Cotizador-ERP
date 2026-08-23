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
        Schema::create('chofer', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('nombre', 200);
            $table->string('telefono', 200);
            $table->string('vehiculo_modelo', 200);
            $table->string('vehiculo_placa', 200)->unique('uk_placa');
            $table->boolean('status')->default(true);
            $table->dateTime('date_creation')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chofer');
    }
};
