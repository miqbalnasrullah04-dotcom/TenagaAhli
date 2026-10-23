<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            // Disimpan sebagai JSON array, sama seperti `keahlian`
            $table->json('spesialisasi')->nullable()->after('keahlian');
            $table->json('kompetensi')->nullable()->after('spesialisasi');
        });
    }

    public function down(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            $table->dropColumn(['spesialisasi', 'kompetensi']);
        });
    }
};
