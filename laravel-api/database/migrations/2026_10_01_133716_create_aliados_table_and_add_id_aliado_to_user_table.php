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
        Schema::create('aliado', function (Blueprint $table) {
            $table->id();
            $table->string('razon_social', 150);
            $table->string('rif', 30)->nullable();
            $table->string('contacto_principal', 100)->nullable();
            $table->string('telefono', 50)->nullable();
            $table->string('correo', 100)->nullable();
            $table->boolean('status')->default(true);
            // $table->timestamps(); // Project seems to use $timestamps = false in many places, but I'll add them if standard.
            // Looking at `freelancer`, it has no timestamps.
        });

        Schema::table('user', function (Blueprint $table) {
            $table->unsignedBigInteger('id_aliado')->nullable()->after('id_freelancer');
            $table->foreign('id_aliado')->references('id')->on('aliado')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user', function (Blueprint $table) {
            $table->dropForeign(['id_aliado']);
            $table->dropColumn('id_aliado');
        });

        Schema::dropIfExists('aliado');
    }
};
