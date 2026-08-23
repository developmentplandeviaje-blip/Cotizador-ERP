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
        Schema::create('hotel', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_ubicacion')->index('fk_hotel_ubicacion');
            $table->string('nombre', 200);
            $table->string('tipo', 300);
            $table->string('edad_adolescentes', 50);
            $table->string('edad_ninos', 50);
            $table->string('edad_infantes', 50);
            $table->text('nota')->nullable();
            $table->boolean('status')->default(true);
            $table->dateTime('date_creation')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('hotel');
    }
};
