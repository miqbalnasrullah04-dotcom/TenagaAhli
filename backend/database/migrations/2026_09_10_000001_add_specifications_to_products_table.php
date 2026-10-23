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
        Schema::table('products', function (Blueprint $table) {
            if (!Schema::hasColumn('products', 'author')) {
                $table->string('author')->nullable()->after('title');
            }
            if (!Schema::hasColumn('products', 'publisher')) {
                $table->string('publisher')->nullable()->after('author');
            }
            if (!Schema::hasColumn('products', 'isbn')) {
                $table->string('isbn')->nullable()->after('publisher');
            }
            if (!Schema::hasColumn('products', 'language')) {
                $table->string('language')->default('Indonesia')->after('isbn');
            }
            if (!Schema::hasColumn('products', 'pages')) {
                $table->string('pages')->nullable()->after('language');
            }
            if (!Schema::hasColumn('products', 'specifications')) {
                $table->json('specifications')->nullable()->after('pages');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn(['author', 'publisher', 'isbn', 'language', 'pages', 'specifications']);
        });
    }
};
