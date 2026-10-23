<?php

namespace Database\Seeders;

use App\Models\TopUpPackage;
use Illuminate\Database\Seeder;

class TopUpPackageSeeder extends Seeder
{
    /**
     * Paket Top Up Point yang tersedia.
     *
     * Harga dirancang dengan skala ekonomi:
     * semakin banyak Point yang dibeli, semakin murah harga per Point-nya.
     */
    public function run(): void
    {
        $packages = [
            [
                'name'        => '10 Point',
                'points'      => 10,
                'price'       => 10000,       // Rp 10.000 → 1.000/Point
                'description' => 'Cocok untuk mencoba fitur konsultasi singkat.',
                'is_active'   => true,
                'is_popular'  => false,
                'sort_order'  => 10,
            ],
            [
                'name'        => '25 Point',
                'points'      => 25,
                'price'       => 25000,       // Rp 25.000 → 1.000/Point
                'description' => 'Paket hemat 25 Point (Rp 1.000 / Point).',
                'is_active'   => true,
                'is_popular'  => false,
                'sort_order'  => 20,
            ],
            [
                'name'        => '50 Point',
                'points'      => 50,
                'price'       => 50000,       // Rp 50.000 → 1.000/Point
                'description' => 'Cukup untuk satu sesi konsultasi standar (Rp 1.000 / Point).',
                'is_active'   => true,
                'is_popular'  => false,
                'sort_order'  => 30,
            ],
            [
                'name'        => '100 Point',
                'points'      => 100,
                'price'       => 100000,      // Rp 100.000 → 1.000/Point
                'description' => 'Paket paling populer — 100 Point (Rp 1.000 / Point).',
                'is_active'   => true,
                'is_popular'  => true,        // Tandai sebagai populer
                'sort_order'  => 40,
            ],
            [
                'name'        => '250 Point',
                'points'      => 250,
                'price'       => 250000,      // Rp 250.000 → 1.000/Point
                'description' => 'Ideal untuk pengguna aktif (Rp 1.000 / Point).',
                'is_active'   => true,
                'is_popular'  => false,
                'sort_order'  => 50,
            ],
            [
                'name'        => '500 Point',
                'points'      => 500,
                'price'       => 500000,      // Rp 500.000 → 1.000/Point
                'description' => 'Paket 500 Point untuk power user (Rp 1.000 / Point).',
                'is_active'   => true,
                'is_popular'  => false,
                'sort_order'  => 60,
            ],
        ];

        foreach ($packages as $data) {
            TopUpPackage::updateOrCreate(
                ['name' => $data['name']],
                $data
            );
        }

        $this->command->info('TopUp packages seeded: ' . count($packages) . ' paket.');
    }
}
