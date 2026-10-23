<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom link produk UPRESS untuk produk Buku Fisik.
     */
    public function up(): void
    {
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'upress_url')) {
            Schema::table('products', function (Blueprint $table) {
                $table->string('upress_url', 1000)->nullable()->after('download_url');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'upress_url')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropColumn('upress_url');
            });
        }
    }
};
