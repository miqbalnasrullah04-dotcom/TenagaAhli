<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('consultations')) {
            Schema::table('consultations', function (Blueprint $table) {
                if (!Schema::hasColumn('consultations', 'reference_code')) {
                    $table->string('reference_code')->nullable()->unique()->after('id');
                }
                if (!Schema::hasColumn('consultations', 'amount')) {
                    $table->unsignedBigInteger('amount')->default(0)->after('service_type');
                }
                if (!Schema::hasColumn('consultations', 'payment_method')) {
                    $table->string('payment_method', 50)->nullable()->default('manual')->after('amount');
                }
                if (!Schema::hasColumn('consultations', 'payment_status')) {
                    $table->string('payment_status', 50)->default('pending')->after('payment_method');
                }
                if (!Schema::hasColumn('consultations', 'payment_proof')) {
                    $table->string('payment_proof')->nullable()->after('payment_status');
                }
                if (!Schema::hasColumn('consultations', 'snap_token')) {
                    $table->string('snap_token')->nullable()->after('payment_proof');
                }
                if (!Schema::hasColumn('consultations', 'bank_name')) {
                    $table->string('bank_name', 50)->nullable()->after('snap_token');
                }
                if (!Schema::hasColumn('consultations', 'paid_at')) {
                    $table->timestamp('paid_at')->nullable()->after('bank_name');
                }
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('consultations')) {
            Schema::table('consultations', function (Blueprint $table) {
                $columns = [
                    'reference_code', 'amount', 'payment_method', 'payment_status',
                    'payment_proof', 'snap_token', 'bank_name', 'paid_at'
                ];
                foreach ($columns as $column) {
                    if (Schema::hasColumn('consultations', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }
    }
};
