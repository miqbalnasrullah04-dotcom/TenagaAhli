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
        Schema::create('consultations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('expert_id')->constrained('experts')->onDelete('cascade');
            $table->foreignId('user_id')->nullable()->constrained('users')->onDelete('set null');
            $table->string('client_name');
            $table->string('client_email');
            $table->string('client_phone')->nullable();
            $table->string('service_type')->default('Konsultasi Online (1 Jam)');
            $table->date('consultation_date')->nullable();
            $table->string('consultation_time')->nullable();
            $table->string('topic');
            $table->text('notes')->nullable();
            $table->string('status')->default('selesai'); // 'selesai', 'dijadwalkan', 'menunggu_konfirmasi', 'dibatalkan'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('consultations');
    }
};
