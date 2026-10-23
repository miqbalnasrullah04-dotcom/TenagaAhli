<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            if (!Schema::hasColumn('experts', 'pengalaman_penelitian')) {
                $table->json('pengalaman_penelitian')->nullable()->after('pengalaman_proyek');
            }
        });
    }

    public function down(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            if (Schema::hasColumn('experts', 'pengalaman_penelitian')) {
                $table->dropColumn('pengalaman_penelitian');
            }
        });
    }
};
