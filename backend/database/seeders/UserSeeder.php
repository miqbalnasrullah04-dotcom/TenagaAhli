<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        // Admin user
        User::updateOrCreate(
            ['email' => 'admin@tenagaahli.com'],
            [
                'name' => 'Administrator',
                'password' => Hash::make('admin123'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // Test regular user
        User::updateOrCreate(
            ['email' => 'user@tenagaahli.com'],
            [
                'name' => 'Test User',
                'password' => Hash::make('user123'),
                'role' => 'user',
                'email_verified_at' => now(),
            ]
        );

        // 4 Tenaga Ahli Khusus
        $expertPassword = Hash::make('12345678q!');
        $specificExperts = [
            [
                'name' => 'Dr. Ir. Irman Firmansyah, S.Hut, M.Si, M.Sc',
                'emails' => ['dr.irman.firmansyah@tenagaahli.com', 'irman.firmansyah@tenagaahli.com'],
            ],
            [
                'name' => 'Dr. Casnan, S.Si., M.Si.',
                'emails' => ['dr.casnan@tenagaahli.com', 'casnan@tenagaahli.com'],
            ],
            [
                'name' => 'Naufal Nashrullah Handoko, SP, MSi',
                'emails' => ['naufal.nashrullah@tenagaahli.com', 'naufal.handoko@tenagaahli.com'],
            ],
            [
                'name' => 'Yoga Hepta Gumilar S.Pd.,M.Pd',
                'emails' => ['yoga.hepta.gumilar@tenagaahli.com', 'yoga.hepta@tenagaahli.com'],
            ],
        ];

        foreach ($specificExperts as $exp) {
            foreach ($exp['emails'] as $email) {
                User::updateOrCreate(
                    ['email' => $email],
                    [
                        'name' => $exp['name'],
                        'password' => $expertPassword,
                        'role' => 'user',
                        'role_type' => 'tenaga_ahli',
                        'email_verified_at' => now(),
                        'point_balance' => 100,
                    ]
                );
            }
        }

        $this->command->info('✓ Users seeded (admin@tenagaahli.com / admin123 and 4 Tenaga Ahli accounts)');
    }
}
