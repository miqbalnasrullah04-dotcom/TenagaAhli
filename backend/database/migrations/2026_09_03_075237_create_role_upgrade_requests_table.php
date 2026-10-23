<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('role_upgrade_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->string('from_role');        // surveyor
            $table->string('to_role');          // tenaga_ahli
            $table->string('status')->default('pending'); // pending | approved | rejected
            // Syarat yang wajib dilengkapi surveyor sebelum apply
            $table->string('field_keahlian')->nullable();       // bidang keahlian baru
            $table->string('institusi')->nullable();
            $table->text('motivasi')->nullable();               // alasan upgrade
            $table->string('dokumen_kompetensi')->nullable();   // path file upload
            $table->text('catatan_admin')->nullable();          // feedback admin
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('role_upgrade_requests');
    }
};
