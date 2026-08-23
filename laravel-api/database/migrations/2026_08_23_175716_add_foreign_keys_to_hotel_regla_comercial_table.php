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
        Schema::table('hotel_regla_comercial', function (Blueprint $table) {
            $table->foreign(['id_freelancer'], 'fk_regla_freelancer')->references(['id'])->on('freelancer')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['id_hotel'], 'fk_regla_hotel')->references(['id'])->on('hotel')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('hotel_regla_comercial', function (Blueprint $table) {
            $table->dropForeign('fk_regla_freelancer');
            $table->dropForeign('fk_regla_hotel');
        });
    }
};
