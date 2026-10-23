<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            if (!Schema::hasColumn('experts', 'pengalaman_proyek')) {
                $table->json('pengalaman_proyek')->nullable()->after('instruktur');
            }
        });
    }

    public function down(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            if (Schema::hasColumn('experts', 'pengalaman_proyek')) {
                $table->dropColumn('pengalaman_proyek');
            }
        });
    }
};
