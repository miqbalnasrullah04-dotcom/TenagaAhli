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
        Schema::table('product_purchases', function (Blueprint $table) {
            // Revenue tracking columns
            $table->decimal('seller_amount', 12, 2)->nullable()->after('proof_uploaded_at'); // 90% goes to seller
            $table->decimal('admin_amount', 12, 2)->nullable()->after('seller_amount');   // 10% goes to admin
            $table->timestamp('verified_at')->nullable()->after('admin_amount');         // When admin verified the payment
            $table->string('verified_by_admin')->nullable()->after('verified_at');       // Admin who verified
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_purchases', function (Blueprint $table) {
            $table->dropColumn(['seller_amount', 'admin_amount', 'verified_at', 'verified_by_admin']);
        });
    }
};
