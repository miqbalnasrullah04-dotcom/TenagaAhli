<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // role_type: klien | tenaga_ahli | surveyor
            // Berbeda dengan field `role` yang sudah ada (user | admin)
            $table->string('role_type')->default('klien')->after('role');
            // Surveyor yang sudah disetujui boleh juga mendaftar sebagai tenaga_ahli
            $table->boolean('is_also_expert')->default(false)->after('role_type');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['role_type', 'is_also_expert']);
        });
    }
};
