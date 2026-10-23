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
                if (!Schema::hasColumn('products', 'weight')) {
                    $table->unsignedInteger('weight')->default(1000)->after('stock');
                }
            });
        }

        if (Schema::hasTable('product_purchases')) {
            Schema::table('product_purchases', function (Blueprint $table) {
                if (!Schema::hasColumn('product_purchases', 'recipient_name')) {
                    $table->string('recipient_name')->nullable()->after('product_title');
                }
                if (!Schema::hasColumn('product_purchases', 'recipient_phone')) {
                    $table->string('recipient_phone')->nullable()->after('recipient_name');
                }
                if (!Schema::hasColumn('product_purchases', 'destination_id')) {
                    $table->unsignedBigInteger('destination_id')->nullable()->after('recipient_phone');
                }
                if (!Schema::hasColumn('product_purchases', 'destination_label')) {
                    $table->string('destination_label')->nullable()->after('destination_id');
                }
                if (!Schema::hasColumn('product_purchases', 'shipping_address')) {
                    $table->text('shipping_address')->nullable()->after('destination_label');
                }
                if (!Schema::hasColumn('product_purchases', 'courier_name')) {
                    $table->string('courier_name')->nullable()->after('shipping_address');
                }
                if (!Schema::hasColumn('product_purchases', 'courier_service')) {
                    $table->string('courier_service')->nullable()->after('courier_name');
                }
                if (!Schema::hasColumn('product_purchases', 'shipping_cost')) {
                    $table->unsignedBigInteger('shipping_cost')->default(0)->after('courier_service');
                }
                if (!Schema::hasColumn('product_purchases', 'tracking_number')) {
                    $table->string('tracking_number')->nullable()->after('shipping_cost');
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
                if (Schema::hasColumn('products', 'weight')) {
                    $table->dropColumn('weight');
                }
            });
        }

        if (Schema::hasTable('product_purchases')) {
            Schema::table('product_purchases', function (Blueprint $table) {
                $table->dropColumn([
                    'recipient_name',
                    'recipient_phone',
                    'destination_id',
                    'destination_label',
                    'shipping_address',
                    'courier_name',
                    'courier_service',
                    'shipping_cost',
                    'tracking_number',
                ]);
            });
        }
    }
};
