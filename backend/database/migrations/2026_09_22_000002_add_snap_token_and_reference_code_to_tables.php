<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('articles')) {
            Schema::table('articles', function (Blueprint $table) {
                if (!Schema::hasColumn('articles', 'reference_code')) {
                    $table->string('reference_code')->nullable()->unique()->after('id');
                }
                if (!Schema::hasColumn('articles', 'snap_token')) {
                    $table->string('snap_token')->nullable()->after('payment_status');
                }
            });
        }

        if (Schema::hasTable('point_transactions')) {
            Schema::table('point_transactions', function (Blueprint $table) {
                if (!Schema::hasColumn('point_transactions', 'snap_token')) {
                    $table->string('snap_token')->nullable()->after('status');
                }
            });
        }

        if (Schema::hasTable('product_purchases')) {
            Schema::table('product_purchases', function (Blueprint $table) {
                if (!Schema::hasColumn('product_purchases', 'snap_token')) {
                    $table->string('snap_token')->nullable()->after('status');
                }
                if (!Schema::hasColumn('product_purchases', 'amount_idr')) {
                    $table->unsignedBigInteger('amount_idr')->nullable()->after('points_spent');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('articles')) {
            Schema::table('articles', function (Blueprint $table) {
                if (Schema::hasColumn('articles', 'snap_token')) {
                    $table->dropColumn('snap_token');
                }
                if (Schema::hasColumn('articles', 'reference_code')) {
                    $table->dropColumn('reference_code');
                }
            });
        }

        if (Schema::hasTable('point_transactions')) {
            Schema::table('point_transactions', function (Blueprint $table) {
                if (Schema::hasColumn('point_transactions', 'snap_token')) {
                    $table->dropColumn('snap_token');
                }
            });
        }

        if (Schema::hasTable('product_purchases')) {
            Schema::table('product_purchases', function (Blueprint $table) {
                if (Schema::hasColumn('product_purchases', 'snap_token')) {
                    $table->dropColumn('snap_token');
                }
                if (Schema::hasColumn('product_purchases', 'amount_idr')) {
                    $table->dropColumn('amount_idr');
                }
            });
        }
    }
};
