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
        Schema::create('user', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('id_freelancer')->index('fk_user_freelancer');
            $table->string('first_name', 30);
            $table->string('last_name', 30);
            $table->string('email', 70)->unique('uk_user_email');
            $table->text('password');
            $table->string('level', 100);
            $table->boolean('status')->default(true);
            $table->dateTime('date_creation')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user');
    }
};
