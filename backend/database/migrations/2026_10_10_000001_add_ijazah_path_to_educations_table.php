<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('educations', function (Blueprint $table) {
            if (!Schema::hasColumn('educations', 'ijazah_path')) {
                $table->string('ijazah_path')->nullable()->after('tahun_lulus');
            }
        });
    }

    public function down(): void
    {
        Schema::table('educations', function (Blueprint $table) {
            if (Schema::hasColumn('educations', 'ijazah_path')) {
                $table->dropColumn('ijazah_path');
            }
        });
    }
};
