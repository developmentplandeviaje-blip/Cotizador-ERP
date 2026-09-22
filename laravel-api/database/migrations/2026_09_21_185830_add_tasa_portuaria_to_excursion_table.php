<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('excursion', function (Blueprint $table) {
            $table->boolean('tasa_portuaria_status')->default(false)->after('aplica_descuento_referidos');
            $table->decimal('tasa_portuaria_monto', 10, 2)->nullable()->after('tasa_portuaria_status');
        });
    }

    public function down(): void
    {
        Schema::table('excursion', function (Blueprint $table) {
            $table->dropColumn(['tasa_portuaria_status', 'tasa_portuaria_monto']);
        });
    }
};
