<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\User;
use App\Models\Expert;
use App\Models\Package;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class CreateSpecificExperts extends Command
{
    protected $signature = 'experts:create-the-four';
    protected $description = 'Create or update the 4 specific expert accounts';

    public function handle()
    {
        $password = '12345678q!';
        $standardPackage = Package::where('price', 0)->first();

        $expertsData = [
            [
                'name' => 'Dr. Ir. Irman Firmansyah, S.Hut, M.Si, M.Sc',
                'emails' => [
                    'dr.irman.firmansyah@tenagaahli.com',
                    'irman.firmansyah@tenagaahli.com',
                ],
                'primary_email' => 'dr.irman.firmansyah@tenagaahli.com',
                'field' => 'Kajian Lingkungan Hidup Strategis (KLHS)',
                'institution' => 'PSL - IPB University',
                'keahlian' => ['Ilmu Kehutanan', 'Ilmu Lingkungan', 'System Dynamics', 'Spasial Dynamics', 'KLHS'],
                'catatan' => 'Bekerja pada irisan antara ilmu kehutanan, lingkungan, dan pemodelan sistem dinamik untuk mendukung perencanaan pembangunan berkelanjutan.',
                'alamat_kota' => 'Kota Bogor',
                'alamat_provinsi' => 'Jawa Barat',
            ],
            [
                'name' => 'Dr. Casnan, S.Si., M.Si.',
                'emails' => [
                    'dr.casnan@tenagaahli.com',
                    'casnan@tenagaahli.com',
                ],
                'primary_email' => 'dr.casnan@tenagaahli.com',
                'field' => 'Matematika Terapan & Statistika Lingkungan',
                'institution' => 'Universitas / Lembaga Riset Terkait',
                'keahlian' => ['Statistika Lingkungan', 'Matematika Terapan', 'Analisis Data', 'Model Prediktif'],
                'catatan' => 'Pakar matematika terapan dan statistika lingkungan dengan keahlian dalam perancangan model kuantitatif dan analisis data penelitian.',
                'alamat_kota' => 'Kota Bogor',
                'alamat_provinsi' => 'Jawa Barat',
            ],
            [
                'name' => 'Naufal Nashrullah Handoko, SP, MSi',
                'emails' => [
                    'naufal.nashrullah@tenagaahli.com',
                    'naufal.handoko@tenagaahli.com',
                ],
                'primary_email' => 'naufal.nashrullah@tenagaahli.com',
                'field' => 'Pertanian Berkelanjutan & Agribisnis',
                'institution' => 'Fakultas Pertanian / Pusat Riset',
                'keahlian' => ['Agribisnis', 'Pertanian Berkelanjutan', 'Manajemen Rantai Pasok', 'Sosial Ekonomi Pertanian'],
                'catatan' => 'Tenaga ahli pada bidang pertanian berkelanjutan, pengembangan agribisnis, serta analisis sosial ekonomi masyarakat pedesaan.',
                'alamat_kota' => 'Kota Bogor',
                'alamat_provinsi' => 'Jawa Barat',
            ],
            [
                'name' => 'Yoga Hepta Gumilar S.Pd.,M.Pd',
                'emails' => [
                    'yoga.hepta.gumilar@tenagaahli.com',
                    'yoga.hepta@tenagaahli.com',
                ],
                'primary_email' => 'yoga.hepta.gumilar@tenagaahli.com',
                'field' => 'Pendidikan & Pengembangan SDM Lingkungan',
                'institution' => 'Pusat Pelatihan & Pendidikan',
                'keahlian' => ['Pendidikan Lingkungan', 'Pengembangan SDM', 'Kurikulum Pelatihan', 'Fasilitator Edukasi'],
                'catatan' => 'Praktisi pendidikan dan instruktur pelatihan di bidang edukasi lingkungan, pemberdayaan masyarakat, dan pengembangan SDM terampil.',
                'alamat_kota' => 'Kota Bogor',
                'alamat_provinsi' => 'Jawa Barat',
            ],
        ];

        foreach ($expertsData as $data) {
            $this->info("Creating / updating: {$data['name']} ({$data['primary_email']})");

            // 1. Create or update User
            $user = User::updateOrCreate(
                ['email' => $data['primary_email']],
                [
                    'name' => $data['name'],
                    'password' => Hash::make($password),
                    'role' => 'user',
                    'role_type' => 'tenaga_ahli',
                    'email_verified_at' => now(),
                    'is_also_expert' => false,
                    'point_balance' => 100,
                ]
            );

            // Also create secondary email user alias if wanted, or ensure they exist
            foreach ($data['emails'] as $altEmail) {
                if ($altEmail !== $data['primary_email']) {
                    User::updateOrCreate(
                        ['email' => $altEmail],
                        [
                            'name' => $data['name'],
                            'password' => Hash::make($password),
                            'role' => 'user',
                            'role_type' => 'tenaga_ahli',
                            'email_verified_at' => now(),
                            'is_also_expert' => false,
                            'point_balance' => 100,
                        ]
                    );
                }
            }

            // 2. Create or update Expert profile
            $slug = Str::slug($data['name']);
            $existingExpert = Expert::where('user_id', $user->id)
                ->orWhere('email', $data['primary_email'])
                ->orWhere('name', $data['name'])
                ->first();

            if ($existingExpert) {
                $existingExpert->update([
                    'user_id' => $user->id,
                    'name' => $data['name'],
                    'email' => $data['primary_email'],
                    'field' => $data['field'],
                    'institution' => $data['institution'],
                    'kriteria' => 'Tenaga Ahli',
                    'kriteria_list' => ['Tenaga Ahli'],
                    'profile_status' => 'aktif',
                    'verified' => true,
                    'featured' => true,
                    'keahlian' => $data['keahlian'],
                    'catatan' => $data['catatan'],
                    'alamat_kota' => $data['alamat_kota'],
                    'alamat_provinsi' => $data['alamat_provinsi'],
                    'package_id' => $standardPackage ? $standardPackage->id : 1,
                ]);
                $this->line("  ✓ Expert profile updated (ID: {$existingExpert->id})");
            } else {
                $expert = Expert::create([
                    'user_id' => $user->id,
                    'slug' => $slug . '-' . Str::random(4),
                    'name' => $data['name'],
                    'email' => $data['primary_email'],
                    'field' => $data['field'],
                    'institution' => $data['institution'],
                    'kriteria' => 'Tenaga Ahli',
                    'kriteria_list' => ['Tenaga Ahli'],
                    'profile_status' => 'aktif',
                    'verified' => true,
                    'featured' => true,
                    'keahlian' => $data['keahlian'],
                    'catatan' => $data['catatan'],
                    'alamat_kota' => $data['alamat_kota'],
                    'alamat_provinsi' => $data['alamat_provinsi'],
                    'package_id' => $standardPackage ? $standardPackage->id : 1,
                    'rating' => 5.0,
                ]);
                $this->line("  ✓ Expert profile created (ID: {$expert->id})");
            }
        }

        $this->info("\n=== TESTING AUTHENTICATION FOR ALL 4 EXPERTS ===");
        $testList = [
            'dr.irman.firmansyah@tenagaahli.com',
            'Dr. Ir. Irman Firmansyah, S.Hut, M.Si, M.Sc@tenagaahli.com',
            'dr.casnan@tenagaahli.com',
            'Dr. Casnan, S.Si., M.Si.@tenagaahli.com',
            'naufal.nashrullah@tenagaahli.com',
            'Naufal Nashrullah Handoko, SP, MSi@tenagaahli.com',
            'yoga.hepta.gumilar@tenagaahli.com',
            'Yoga Hepta Gumilar S.Pd.,M.Pd@tenagaahli.com',
        ];

        $controller = new \App\Http\Controllers\Api\AuthController();
        foreach ($testList as $testEmail) {
            $req = new \Illuminate\Http\Request([
                'email' => $testEmail,
                'password' => $password,
            ]);
            try {
                $response = $controller->login($req);
                $userData = $response->getData()->user;
                $this->info("✓ SUCCESS: {$testEmail} -> Name: {$userData->name} (Role: {$userData->role_type})");
            } catch (\Exception $e) {
                $this->error("✗ FAILED: {$testEmail} -> " . $e->getMessage());
            }
        }

        $this->info("\n=== TESTING CV UPLOAD ===");
        $testUser = User::where('role_type', 'tenaga_ahli')->first();
        if ($testUser) {
            $tmpPath = sys_get_temp_dir() . '/test_cv.pdf';
            file_put_contents($tmpPath, '%PDF-1.4 test document content');
            $uploadedFile = new \Illuminate\Http\UploadedFile($tmpPath, 'test_cv.pdf', 'application/pdf', null, true);

            $req = new \Illuminate\Http\Request();
            $req->setUserResolver(fn() => $testUser);
            $req->merge(['type' => 'cv', 'label' => 'CV / Curriculum Vitae']);
            $req->files->set('file', $uploadedFile);

            $docController = new \App\Http\Controllers\Api\DocumentController();
            try {
                $docRes = $docController->store($req);
                $this->info("✓ CV Upload SUCCESS for {$testUser->name}: " . json_encode($docRes->getData()));
            } catch (\Exception $e) {
                $this->error("✗ CV Upload FAILED: " . $e->getMessage());
            }
        }

        return 0;
    }
}
