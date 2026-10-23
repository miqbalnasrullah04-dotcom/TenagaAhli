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
            $table->decimal('wallet_balance', 12, 2)->default(0)->after('is_online'); // Total wallet balance
            $table->decimal('total_earned', 12, 2)->default(0)->after('wallet_balance');  // Total lifetime earnings
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            $table->dropColumn(['wallet_balance', 'total_earned']);
        });
    }
};
