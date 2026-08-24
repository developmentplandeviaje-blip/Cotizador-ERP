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
        Schema::create('freelancer', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('nombre', 100);
            $table->string('rif', 100)->unique('uk_freelancer_rif');
            $table->string('correo', 100);
            $table->string('telefono_1', 100);
            $table->string('telefono_2', 100)->nullable();
            $table->string('direccion');
            $table->string('color_primario', 100);
            $table->string('logo_url', 100);
            $table->text('hoja_membrete_config');
            $table->text('notify_link')->nullable();
            $table->dateTime('date_creation')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('freelancer');
    }
};
