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
        if (!Schema::hasColumn('ventas', 'desbloqueado_hasta')) {
            Schema::table('ventas', function (Blueprint $table) {
                $table->dateTime('desbloqueado_hasta')->nullable()->after('fecha_confirmacion');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasColumn('ventas', 'desbloqueado_hasta')) {
            Schema::table('ventas', function (Blueprint $table) {
                $table->dropColumn('desbloqueado_hasta');
            });
        }
    }
};
