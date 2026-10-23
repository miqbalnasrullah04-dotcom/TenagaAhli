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
            $table->json('gallery')->nullable()->after('catatan');
            $table->string('video_url')->nullable()->after('gallery');
            $table->string('video_title')->nullable()->after('video_url');
            $table->text('video_description')->nullable()->after('video_title');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            $table->dropColumn(['gallery', 'video_url', 'video_title', 'video_description']);
        });
    }
};
