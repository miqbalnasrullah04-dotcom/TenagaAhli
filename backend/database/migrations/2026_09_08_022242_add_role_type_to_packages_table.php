<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            // all = berlaku untuk semua role, tenaga_ahli = khusus TA, surveyor = khusus surveyor
            $table->string('role_type')->default('all')->after('order');
        });

        // Set semua paket lama ke 'all' agar tidak break
        \DB::table('packages')->update(['role_type' => 'all']);
    }

    public function down(): void
    {
        Schema::table('packages', function (Blueprint $table) {
            $table->dropColumn('role_type');
        });
    }
};
