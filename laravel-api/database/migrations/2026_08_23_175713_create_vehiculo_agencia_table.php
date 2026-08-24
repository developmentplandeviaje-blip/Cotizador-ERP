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
        Schema::create('vehiculo_agencia', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_ubicacion')->index('fk_vagencia_ubicacion');
            $table->string('agencia', 200);
            $table->text('nota')->nullable();
            $table->dateTime('date_creation')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehiculo_agencia');
    }
};
