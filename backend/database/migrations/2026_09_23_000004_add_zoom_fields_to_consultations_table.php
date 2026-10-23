<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->string('zoom_link')->nullable()->after('notes');
            $table->string('zoom_meeting_id')->nullable()->after('zoom_link');
            $table->string('zoom_passcode')->nullable()->after('zoom_meeting_id');
            $table->integer('duration_minutes')->default(30)->after('zoom_passcode');
            $table->foreignId('zoom_set_by_admin')->nullable()->constrained('users')->onDelete('set null')->after('duration_minutes');
            $table->timestamp('zoom_set_at')->nullable()->after('zoom_set_by_admin');
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropForeign(['zoom_set_by_admin']);
            $table->dropColumn([
                'zoom_link',
                'zoom_meeting_id',
                'zoom_passcode',
                'duration_minutes',
                'zoom_set_by_admin',
                'zoom_set_at',
            ]);
        });
    }
};
