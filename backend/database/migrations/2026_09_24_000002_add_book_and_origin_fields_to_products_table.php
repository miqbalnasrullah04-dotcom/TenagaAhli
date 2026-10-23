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
                if (!Schema::hasColumn('products', 'origin_id')) {
                    $table->unsignedBigInteger('origin_id')->nullable()->after('weight');
                }
                if (!Schema::hasColumn('products', 'origin_city')) {
                    $table->string('origin_city')->nullable()->after('origin_id');
                }
                if (!Schema::hasColumn('products', 'origin_province')) {
                    $table->string('origin_province')->nullable()->after('origin_city');
                }
                if (!Schema::hasColumn('products', 'origin_subdistrict')) {
                    $table->string('origin_subdistrict')->nullable()->after('origin_province');
                }
                if (!Schema::hasColumn('products', 'origin_label')) {
                    $table->string('origin_label')->nullable()->after('origin_subdistrict');
                }
                if (!Schema::hasColumn('products', 'origin_address')) {
                    $table->text('origin_address')->nullable()->after('origin_label');
                }
                if (!Schema::hasColumn('products', 'condition')) {
                    $table->string('condition')->nullable()->default('Baru')->after('status');
                }
                if (!Schema::hasColumn('products', 'cover_type')) {
                    $table->string('cover_type')->nullable()->after('pages');
                }
                if (!Schema::hasColumn('products', 'publication_year')) {
                    $table->string('publication_year', 10)->nullable()->after('publisher');
                }
                if (!Schema::hasColumn('products', 'dimensions')) {
                    $table->string('dimensions', 50)->nullable()->after('cover_type');
                }
                if (!Schema::hasColumn('products', 'file_format')) {
                    $table->string('file_format', 50)->nullable()->after('download_url');
                }
                if (!Schema::hasColumn('products', 'file_size')) {
                    $table->string('file_size', 50)->nullable()->after('file_format');
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
                $columns = [
                    'origin_id', 'origin_city', 'origin_province', 'origin_subdistrict',
                    'origin_label', 'origin_address', 'condition', 'cover_type',
                    'publication_year', 'dimensions', 'file_format', 'file_size'
                ];
                foreach ($columns as $col) {
                    if (Schema::hasColumn('products', $col)) {
                        $table->dropColumn($col);
                    }
                }
            });
        }
    }
};
