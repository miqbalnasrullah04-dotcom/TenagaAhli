<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            // Nama bank (e.g. BCA, BNI, Mandiri)
            $table->string('bank_name', 100)->nullable()->after('phone');
            // Nomor rekening
            $table->string('bank_account', 50)->nullable()->after('bank_name');
            // Nama pemilik rekening
            $table->string('bank_account_name', 255)->nullable()->after('bank_account');
        });
    }

    public function down(): void
    {
        Schema::table('experts', function (Blueprint $table) {
            $table->dropColumn(['bank_name', 'bank_account', 'bank_account_name']);
        });
    }
};
