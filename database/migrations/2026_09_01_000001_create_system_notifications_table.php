<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Named system_notifications (not "notifications") so it can never
        // collide with Laravel's built-in notifications table that the
        // Notifiable trait on User expects.
        Schema::create('system_notifications', function (Blueprint $table) {
            $table->id('notification_id');

            $table->foreignId('user_id')
                ->constrained('users', 'user_id')
                ->cascadeOnDelete();

            $table->string('type', 30);          // out_of_stock | low_stock | expiring | expired
            $table->string('title', 150);
            $table->text('message');
            $table->string('link', 255)->nullable();
            $table->string('dedupe_key', 100);   // e.g. low_stock:12 — one row per user per alert
            $table->timestamp('read_at')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['user_id', 'dedupe_key']);
            $table->index(['user_id', 'read_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('system_notifications');
    }
};
