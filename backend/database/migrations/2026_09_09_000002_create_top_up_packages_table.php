<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Buat tabel top_up_packages — daftar paket Top Up Point yang tersedia.
     * Harga dalam IDR (Rupiah), points = jumlah Point yang didapat.
     * Dirancang agar mudah menambahkan payment gateway (Midtrans, dll) nanti.
     */
    public function up(): void
    {
        Schema::create('top_up_packages', function (Blueprint $table) {
            $table->id();
            $table->string('name')->comment('Nama paket, misal: "10 Point"');
            $table->unsignedInteger('points')->comment('Jumlah Point yang didapat');
            $table->unsignedBigInteger('price')->comment('Harga dalam IDR (Rupiah)');
            $table->text('description')->nullable()->comment('Deskripsi opsional');
            $table->boolean('is_active')->default(true);
            $table->boolean('is_popular')->default(false)->comment('Tandai sebagai paket terpopuler');
            $table->unsignedInteger('sort_order')->default(0)->comment('Urutan tampil');
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('top_up_packages');
    }
};
