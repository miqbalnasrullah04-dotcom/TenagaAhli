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
        Schema::table('membership_transactions', function (Blueprint $table) {
            $table->string('reference_code', 50)->nullable()->unique()->after('user_id')->comment('Kode referensi unik untuk invoice');
            
            $table->index('reference_code');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('membership_transactions', function (Blueprint $table) {
            $table->dropIndex(['reference_code']);
            $table->dropColumn('reference_code');
        });
    }
};