<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Starting database seeding...');
        $this->command->newLine();

        // Seed users first (admin & test users)
        $this->call(UserSeeder::class);

        // Seed categories (needed by experts)
        $this->call(CategorySeeder::class);

        // Seed packages
        $this->call(PackageSeeder::class);

        // Seed Top Up Point packages
        $this->call(TopUpPackageSeeder::class);

        // Seed experts
        $this->call(ExpertSeeder::class);

        // Seed expert relations (educations, experiences, certificates, documents)
        $this->call(ExpertRelationsSeeder::class);

        // Seed articles
        $this->call(ArticleSeeder::class);

        // Seed partners
        $this->call(PartnerSeeder::class);

        // Seed pamflets
        $this->call(PamfletSeeder::class);

        $this->command->newLine();
        $this->command->info('✅ All seeders completed successfully!');
        $this->command->info('👤 Admin: admin@tenagaahli.com / admin123');
        $this->command->info('👤 User: user@tenagaahli.com / user123');
    }
}
