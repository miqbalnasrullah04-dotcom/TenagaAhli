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
            $table->string('payment_method')->nullable()->after('reference_code'); // bank_transfer, ewallet, qris
            $table->string('proof_image')->nullable()->after('payment_method'); // Path to uploaded proof
            $table->text('proof_notes')->nullable()->after('proof_image'); // User notes about transfer
            $table->timestamp('proof_uploaded_at')->nullable()->after('proof_notes'); // When proof was uploaded
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('product_purchases', function (Blueprint $table) {
            $table->dropColumn(['payment_method', 'proof_image', 'proof_notes', 'proof_uploaded_at']);
        });
    }
};
