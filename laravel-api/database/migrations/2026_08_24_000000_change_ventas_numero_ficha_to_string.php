<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->string('numero_ficha', 100)->nullable()->change();
        });

        DB::table('ventas')
            ->leftJoin('user', 'user.id', '=', 'ventas.id_user')
            ->select([
                'ventas.id',
                'user.first_name',
                'user.last_name',
            ])
            ->orderBy('ventas.id')
            ->chunkById(500, function ($ventas): void {
                foreach ($ventas as $venta) {
                    $nombre = trim((string) $venta->first_name);
                    $apellido = trim((string) $venta->last_name);
                    $iniciales = mb_strtoupper(
                        mb_substr($nombre, 0, 1) . mb_substr($apellido, 0, 1)
                    );
                    $numeroFicha = ($iniciales !== '' ? $iniciales : 'US') . $venta->id;

                    DB::table('ventas')
                        ->where('id', $venta->id)
                        ->update([
                            'numero_ficha' => $numeroFicha,
                            'localizador' => $numeroFicha,
                        ]);
                }
            }, 'ventas.id', 'id');

        Schema::table('ventas', function (Blueprint $table) {
            $table->string('numero_ficha', 100)->nullable(false)->change();
        });
    }

    public function down(): void
    {
        DB::table('ventas')->update([
            'numero_ficha' => DB::raw('id'),
        ]);

        Schema::table('ventas', function (Blueprint $table) {
            $table->unsignedInteger('numero_ficha')->change();
        });
    }
};
