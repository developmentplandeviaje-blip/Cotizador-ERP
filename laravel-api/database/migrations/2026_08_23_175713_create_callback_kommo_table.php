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
        Schema::create('callback_kommo', function (Blueprint $table) {
            $table->integer('id', true);
            $table->dateTime('fecha')->useCurrent();
            $table->text('json');
            $table->string('method', 20);
            $table->text('ip');
            $table->text('referer');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('callback_kommo');
    }
};
