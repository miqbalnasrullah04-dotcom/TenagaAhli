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
        Schema::create('surveys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->onDelete('cascade');
            $table->string('title');
            $table->string('location');
            $table->string('category')->default('AMDAL');
            $table->date('survey_date')->nullable();
            $table->string('status')->default('Belum Mulai'); // 'Belum Mulai', 'Dalam Proses', 'Selesai', 'Dibatalkan'
            $table->string('client_name')->nullable();
            $table->text('description')->nullable();
            $table->text('result_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('surveys');
    }
};
