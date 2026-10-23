<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            $table->timestamp('membership_cycle_start')->nullable()->after('package_expires_at');
            $table->string('medal_tier', 30)->nullable()->after('membership_cycle_start');
            $table->unsignedInteger('medal_consultations_count')->default(0)->after('medal_tier');
            $table->string('medal_previous_tier', 30)->nullable()->after('medal_consultations_count');
            $table->string('medal_highest_tier', 30)->nullable()->after('medal_previous_tier');
            $table->timestamp('medal_last_evaluated_at')->nullable()->after('medal_highest_tier');
        });
    }

    public function down(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            $table->dropColumn([
                'membership_cycle_start',
                'medal_tier',
                'medal_consultations_count',
                'medal_previous_tier',
                'medal_highest_tier',
                'medal_last_evaluated_at',
            ]);
        });
    }
};
