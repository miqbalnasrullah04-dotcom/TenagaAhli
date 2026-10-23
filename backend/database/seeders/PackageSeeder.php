<?php

namespace Database\Seeders;

use App\Models\Package;
use Illuminate\Database\Seeder;

class PackageSeeder extends Seeder
{
    public function run(): void
    {
        Package::updateOrCreate(
            ['slug' => 'biasa'],
            [
                'name' => 'Paket Biasa',
                'price' => 0,
                'description' => 'Profil tayang setelah diverifikasi admin, tanpa biaya.',
                'benefits' => ['Tayang di direktori pencarian', 'Verifikasi standar'],
                'is_active' => true,
                'order' => 1,
            ]
        );

        Package::updateOrCreate(
            ['slug' => 'ekonomis'],
            [
                'name' => 'Paket Ekonomis',
                'price' => 200000,
                'description' => 'Profil tayang lebih cepat dengan badge Ekonomis dan prioritas tampil di pencarian.',
                'benefits' => ['Tayang di direktori pencarian', 'Badge Ekonomis', 'Prioritas di hasil pencarian', 'Verifikasi prioritas'],
                'is_active' => true,
                'order' => 2,
            ]
        );

        Package::updateOrCreate(
            ['slug' => 'eksklusif'],
            [
                'name' => 'Paket Eksklusif',
                'price' => 500000,
                'description' => 'Tingkat tertinggi dengan badge Eksklusif, ranking teratas pencarian, dan fitur terlengkap.',
                'benefits' => ['Tayang di posisi teratas', 'Badge Eksklusif Mewah', 'Prioritas utama di hasil pencarian', 'Verifikasi instan & VIP Support'],
                'is_active' => true,
                'order' => 3,
            ]
        );
    }
}
