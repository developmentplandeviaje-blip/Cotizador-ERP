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
        Schema::table('excursion', function (Blueprint $table) {
            $table->foreign(['id_ubicacion'], 'fk_excursion_ubicacion')->references(['id'])->on('ubicacion')->onUpdate('cascade')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('excursion', function (Blueprint $table) {
            $table->dropForeign('fk_excursion_ubicacion');
        });
    }
};
