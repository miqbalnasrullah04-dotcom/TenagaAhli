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
        Schema::table('experts', function (Blueprint $table) {
            if (!Schema::hasColumn('experts', 'schedule')) {
                $table->json('schedule')->nullable()->after('wallet_balance');
            }
            if (!Schema::hasColumn('experts', 'pricing')) {
                $table->json('pricing')->nullable()->after('schedule');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            if (Schema::hasColumn('experts', 'pricing')) {
                $table->dropColumn('pricing');
            }
            if (Schema::hasColumn('experts', 'schedule')) {
                $table->dropColumn('schedule');
            }
        });
    }
};
