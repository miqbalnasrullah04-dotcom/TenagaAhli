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
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (!Schema::hasColumn('products', 'file_path')) {
                    $table->string('file_path')->nullable()->after('image');
                }
                if (!Schema::hasColumn('products', 'download_url')) {
                    $table->text('download_url')->nullable()->after('file_path');
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('products')) {
            Schema::table('products', function (Blueprint $table) {
                if (Schema::hasColumn('products', 'file_path')) {
                    $table->dropColumn('file_path');
                }
                if (Schema::hasColumn('products', 'download_url')) {
                    $table->dropColumn('download_url');
                }
            });
        }
    }
};
