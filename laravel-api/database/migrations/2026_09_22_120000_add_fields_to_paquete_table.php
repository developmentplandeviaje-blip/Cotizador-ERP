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
        Schema::table('paquete', function (Blueprint $table) {
            if (!Schema::hasColumn('paquete', 'porcentaje_adulto')) {
                $table->decimal('porcentaje_adulto', 5, 2)->nullable()->after('precio_nino');
            }
            if (!Schema::hasColumn('paquete', 'porcentaje_nino')) {
                $table->decimal('porcentaje_nino', 5, 2)->nullable()->after('porcentaje_adulto');
            }
            if (!Schema::hasColumn('paquete', 'aplica_descuento_referidos')) {
                $table->boolean('aplica_descuento_referidos')->default(false)->after('porcentaje_nino');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('paquete', function (Blueprint $table) {
            $columns = [];
            if (Schema::hasColumn('paquete', 'porcentaje_adulto')) {
                $columns[] = 'porcentaje_adulto';
            }
            if (Schema::hasColumn('paquete', 'porcentaje_nino')) {
                $columns[] = 'porcentaje_nino';
            }
            if (Schema::hasColumn('paquete', 'aplica_descuento_referidos')) {
                $columns[] = 'aplica_descuento_referidos';
            }
            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};
