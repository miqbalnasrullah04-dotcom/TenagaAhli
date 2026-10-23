<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            if (!Schema::hasColumn('articles', 'price')) {
                $table->unsignedInteger('price')->default(10000)->after('status');
            }
            if (!Schema::hasColumn('articles', 'payment_proof')) {
                $table->string('payment_proof')->nullable()->after('price');
            }
            if (!Schema::hasColumn('articles', 'payment_status')) {
                $table->string('payment_status')->default('pending')->after('payment_proof'); // pending, verified, rejected
            }
            if (!Schema::hasColumn('articles', 'rejection_reason')) {
                $table->text('rejection_reason')->nullable()->after('payment_status');
            }
            if (!Schema::hasColumn('articles', 'expires_at')) {
                $table->timestamp('expires_at')->nullable()->after('published_at');
            }
            if (!Schema::hasColumn('articles', 'verified_at')) {
                $table->timestamp('verified_at')->nullable()->after('expires_at');
            }
            if (!Schema::hasColumn('articles', 'verified_by')) {
                $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete()->after('verified_at');
            }
        });
    }

    public function down(): void
    {
        Schema::table('articles', function (Blueprint $table) {
            $cols = ['price', 'payment_proof', 'payment_status', 'rejection_reason', 'expires_at', 'verified_at'];
            foreach ($cols as $col) {
                if (Schema::hasColumn('articles', $col)) {
                    $table->dropColumn($col);
                }
            }
            if (Schema::hasColumn('articles', 'verified_by')) {
                $table->dropForeign(['verified_by']);
                $table->dropColumn('verified_by');
            }
        });
    }
};
