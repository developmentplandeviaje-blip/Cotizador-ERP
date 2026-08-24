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
        Schema::create('login_logs', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_user')->index('fk_login_user');
            $table->string('email', 200);
            $table->text('ip');
            $table->text('data');
            $table->string('method', 50);
            $table->string('status', 50);
            $table->dateTime('date')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('login_logs');
    }
};
