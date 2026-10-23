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
        Schema::table('consultations', function (Blueprint $table) {
            if (!Schema::hasColumn('consultations', 'reminder_today_sent_at')) {
                $table->timestamp('reminder_today_sent_at')->nullable()->after('status');
            }
            if (!Schema::hasColumn('consultations', 'reminder_1h_sent_at')) {
                $table->timestamp('reminder_1h_sent_at')->nullable()->after('reminder_today_sent_at');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            if (Schema::hasColumn('consultations', 'reminder_today_sent_at')) {
                $table->dropColumn('reminder_today_sent_at');
            }
            if (Schema::hasColumn('consultations', 'reminder_1h_sent_at')) {
                $table->dropColumn('reminder_1h_sent_at');
            }
        });
    }
};
