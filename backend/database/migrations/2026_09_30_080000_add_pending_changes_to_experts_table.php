<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            $table->json('pending_changes')->nullable()->after('reject_reason');
            $table->string('update_status', 50)->nullable()->after('pending_changes');
            $table->text('update_reject_reason')->nullable()->after('update_status');
            $table->timestamp('update_submitted_at')->nullable()->after('update_reject_reason');
        });
    }

    public function down(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            $table->dropColumn(['pending_changes', 'update_status', 'update_reject_reason', 'update_submitted_at']);
        });
    }
};
