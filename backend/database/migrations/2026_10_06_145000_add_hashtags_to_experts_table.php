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
            if (!Schema::hasColumn('experts', 'hashtags')) {
                $table->json('hashtags')->nullable()->after('kompetensi');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            if (Schema::hasColumn('experts', 'hashtags')) {
                $table->dropColumn('hashtags');
            }
        });
    }
};
