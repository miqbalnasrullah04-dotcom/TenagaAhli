<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Restrukturisasi tabel point_transactions agar mendukung sistem Top Up Point:
     *
     * Tipe transaksi baru:
     *   - topup              : User top up Point (saldo bertambah)
     *   - product_purchase   : Pembelian produk menggunakan Point (saldo berkurang)
     *   - consultation       : Pembayaran konsultasi menggunakan Point (saldo berkurang)
     *   - refund             : Pengembalian Point (saldo bertambah)
     *   - upgrade_premium    : Poin legacy membership (tetap ada untuk backward-compat)
     *   - renewal_premium    : Poin legacy membership (tetap ada untuk backward-compat)
     *
     * Kolom baru:
     *   - amount_idr         : Nilai IDR untuk transaksi Top Up
     *   - reference_code     : Kode unik transaksi (untuk invoice / konfirmasi)
     *   - status             : pending | success | cancelled | refunded
     *   - proof_of_payment   : Path bukti transfer (untuk Top Up manual)
     *   - top_up_package_id  : FK ke top_up_packages (nullable, hanya untuk topup)
     *   - related_id         : ID terkait (order / consultation / membership)
     *   - related_type       : Tipe related (Order / Consultation / dll)
     *   - verified_by        : Admin yang konfirmasi (untuk Top Up manual)
     *   - verified_at        : Waktu konfirmasi
     *   - notes              : Catatan admin
     */
    public function up(): void
    {
        // Langkah 1: Ubah enum type yang sudah ada ke enum baru yang lebih lengkap
        // Menggunakan raw SQL untuk ALTER ENUM karena Laravel Blueprint
        // tidak support alter enum langsung tanpa doctrine/dbal
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE point_transactions MODIFY COLUMN type ENUM(
            'topup',
            'product_purchase',
            'consultation',
            'refund',
            'upgrade_premium',
            'renewal_premium'
        ) NOT NULL");

        // Langkah 2: Tambah kolom-kolom baru
        Schema::table('point_transactions', function (Blueprint $table) {
            // Kolom untuk nilai moneter Top Up
            $table->unsignedBigInteger('amount_idr')->default(0)->after('points')
                ->comment('Nilai IDR untuk transaksi topup');

            // Kode referensi unik
            $table->string('reference_code')->nullable()->unique()->after('amount_idr')
                ->comment('Kode referensi unik untuk transaksi');

            // Status transaksi (default success agar data lama tetap valid)
            $table->enum('status', ['pending', 'success', 'cancelled', 'refunded'])
                ->default('success')
                ->after('reference_code')
                ->comment('Status transaksi');

            // Bukti pembayaran (Top Up manual)
            $table->string('proof_of_payment')->nullable()->after('status')
                ->comment('Path file bukti transfer untuk Top Up manual');

            // FK ke paket Top Up
            $table->foreignId('top_up_package_id')->nullable()->constrained('top_up_packages')->nullOnDelete()
                ->after('proof_of_payment');

            // Relasi polimorfik ke sumber transaksi
            $table->unsignedBigInteger('related_id')->nullable()->after('top_up_package_id');
            $table->string('related_type')->nullable()->after('related_id');

            // Info verifikasi (untuk Top Up manual)
            $table->foreignId('verified_by')->nullable()->constrained('users')->nullOnDelete()
                ->after('related_type');
            $table->timestamp('verified_at')->nullable()->after('verified_by');

            // Catatan admin
            $table->text('notes')->nullable()->after('verified_at');

            $table->index(['user_id', 'type', 'status', 'created_at'], 'pt_user_type_status_idx');
        });
    }

    public function down(): void
    {
        Schema::table('point_transactions', function (Blueprint $table) {
            // Drop index dulu sebelum drop FK
            $table->dropIndex('pt_user_type_status_idx');
            $table->dropForeign(['top_up_package_id']);
            $table->dropForeign(['verified_by']);
            $table->dropColumn([
                'amount_idr',
                'reference_code',
                'status',
                'proof_of_payment',
                'top_up_package_id',
                'related_id',
                'related_type',
                'verified_by',
                'verified_at',
                'notes',
            ]);
        });

        // Kembalikan ke enum lama
        \Illuminate\Support\Facades\DB::statement("ALTER TABLE point_transactions MODIFY COLUMN type ENUM('upgrade_premium', 'renewal_premium') NOT NULL");
    }
};
