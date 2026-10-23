<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement("ALTER TABLE `documents` MODIFY COLUMN `type` VARCHAR(100) NOT NULL DEFAULT 'lainnya'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE `documents` MODIFY COLUMN `type` ENUM('foto_profil', 'ktp', 'ijazah', 'lainnya') NOT NULL DEFAULT 'lainnya'");
    }
};
