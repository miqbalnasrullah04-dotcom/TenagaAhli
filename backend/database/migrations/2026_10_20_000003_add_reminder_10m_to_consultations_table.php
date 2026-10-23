<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            if (!Schema::hasColumn('consultations', 'reminder_10m_sent_at')) {
                $table->timestamp('reminder_10m_sent_at')->nullable()->after('reminder_1h_sent_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            if (Schema::hasColumn('consultations', 'reminder_10m_sent_at')) {
                $table->dropColumn('reminder_10m_sent_at');
            }
        });
    }
};
