<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            // klien | tenaga_ahli | surveyor — siapa yang mengajukan konsultasi
            $table->string('requester_role')->default('klien')->after('status');
        });
    }

    public function down(): void
    {
        Schema::table('consultations', function (Blueprint $table) {
            $table->dropColumn('requester_role');
        });
    }
};
