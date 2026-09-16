<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id('user_id'); // Primary key
            $table->string('full_name');
            $table->string('email')->unique();
            $table->string('password_hash'); // Password column
            $table->string('role')->default('assistant');
            $table->string('status')->default('active');
            $table->string('profile_image')->nullable();
            $table->rememberToken();
            $table->timestamps(); // created_at and updated_at
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
};