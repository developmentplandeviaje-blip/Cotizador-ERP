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
        Schema::create('token_device', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_user')->index('fk_token_user');
            $table->text('token');
            $table->text('device');
            $table->dateTime('date')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('token_device');
    }
};
