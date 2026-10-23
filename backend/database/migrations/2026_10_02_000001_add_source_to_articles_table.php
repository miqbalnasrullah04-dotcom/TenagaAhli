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
        if (Schema::hasTable('articles')) {
            Schema::table('articles', function (Blueprint $table) {
                if (!Schema::hasColumn('articles', 'source')) {
                    $table->string('source')->nullable()->after('author_name');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('articles')) {
            Schema::table('articles', function (Blueprint $table) {
                if (Schema::hasColumn('articles', 'source')) {
                    $table->dropColumn('source');
                }
            });
        }
    }
};
