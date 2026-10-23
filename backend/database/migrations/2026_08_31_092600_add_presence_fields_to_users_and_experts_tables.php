<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->timestamp('last_seen_at')->nullable()->after('remember_token');
            $table->boolean('is_online')->default(false)->after('last_seen_at');
        });

        Schema::table('experts', function (Blueprint $table) {
            $table->timestamp('last_seen_at')->nullable()->after('verified');
            $table->boolean('is_online')->default(false)->after('last_seen_at');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['last_seen_at', 'is_online']);
        });

        Schema::table('experts', function (Blueprint $table) {
            $table->dropColumn(['last_seen_at', 'is_online']);
        });
    }
};
