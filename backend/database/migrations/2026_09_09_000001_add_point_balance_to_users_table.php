<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Tambah kolom point_balance ke tabel users.
     * point_balance = saldo Point yang bisa di-TopUp dan digunakan untuk
     * membeli produk / konsultasi.
     *
     * Kolom points (lama) tetap ada untuk backward-compat membership level.
     * Kolom ini BARU dan terpisah dari kolom "points" lama.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedBigInteger('point_balance')->default(0)->after('points')
                ->comment('Saldo Point untuk Top Up / beli produk / konsultasi');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('point_balance');
        });
    }
};
