<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Expert;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ExpertController extends Controller
{
    /**
     * Tampilan untuk Admin (Data Mentah JSON)
     * Mengatasi error "Gagal memuat data dari server" pada tabel frontend
     */
    public function adminIndex(Request $request)
    {
        try {
            $query = Expert::with(['user', 'educations', 'experiences', 'certificates', 'documents']);

            if ($request->input('role_type') === 'surveyor' || $request->boolean('only_surveyor')) {
                $query->where(function ($q) {
                    $q->whereHas('user', function ($uq) {
                        $uq->where('role_type', 'surveyor');
                    })
                    ->orWhere('kriteria', 'LIKE', '%Surveyor%')
                    ->orWhere('kriteria_list', 'LIKE', '%Surveyor%')
                    ->orWhere('field', 'LIKE', '%Surveyor%');
                });
            } elseif ($request->input('role_type') === 'tenaga_teknis' || $request->boolean('only_tenaga_teknis')) {
                $query->where(function ($q) {
                    $q->whereHas('user', function ($uq) {
                        $uq->where('role_type', 'tenaga_teknis');
                    })
                    ->orWhere('kriteria', 'LIKE', '%Tenaga Teknis%')
                    ->orWhere('kriteria_list', 'LIKE', '%Tenaga Teknis%')
                    ->orWhere('field', 'LIKE', '%Tenaga Teknis%');
                });
            } elseif ($request->input('role_type') === 'tenaga_ahli' || $request->boolean('only_tenaga_ahli')) {
                $query->where(function ($q) {
                    $q->whereHas('user', function ($uq) {
                        $uq->where('role_type', 'tenaga_ahli');
                    })
                    ->orWhere('kriteria', 'LIKE', '%Tenaga Ahli%')
                    ->orWhere('kriteria_list', 'LIKE', '%Tenaga Ahli%')
                    ->orWhere(function ($sub) {
                        $sub->where(function ($uq) {
                            $uq->whereHas('user', function ($u) {
                                $u->whereNotIn('role_type', ['surveyor', 'tenaga_teknis']);
                            })->orWhereDoesntHave('user');
                        })->where('kriteria', 'NOT LIKE', '%Surveyor%')
                          ->where('kriteria', 'NOT LIKE', '%Tenaga Teknis%')
                          ->where(function ($kq) {
                              $kq->whereNull('kriteria_list')
                                 ->orWhere('kriteria_list', '[]')
                                 ->orWhere(function ($nkq) {
                                     $nkq->where('kriteria_list', 'NOT LIKE', '%Surveyor%')
                                         ->where('kriteria_list', 'NOT LIKE', '%Tenaga Teknis%');
                                 });
                          });
                    });
                });
            } else {
                $query->where(function ($q) {
                    $q->where('kriteria', 'LIKE', '%Tenaga Ahli%')
                      ->orWhere('kriteria_list', 'LIKE', '%Tenaga Ahli%')
                      ->orWhereHas('user', function ($uq) {
                          $uq->where('role_type', 'tenaga_ahli');
                      })
                      ->orWhere(function ($sub) {
                          $sub->where(function ($uq) {
                              $uq->whereHas('user', function ($u) {
                                  $u->where('role_type', '!=', 'surveyor');
                              })->orWhereDoesntHave('user');
                          });
                          $sub->where('kriteria', 'NOT LIKE', '%Surveyor%')
                              ->where(function ($kq) {
                                  $kq->whereNull('kriteria_list')
                                     ->orWhere('kriteria_list', '[]')
                                     ->orWhere('kriteria_list', 'NOT LIKE', '%Surveyor%');
                              })
                              ->where('field', 'NOT LIKE', '%Surveyor%');
                      });
                });
            }

            $experts = $query->latest()->get();

            return response()->json($experts, 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal mengambil data dari database.'
            ], 500);
        }
    }

    /**
     * Tampilan untuk publik/user umum
     */
    public function index(Request $request)
    {
        $experts = Expert::query()
            ->when($request->q, fn ($q) => $q->where('name', 'like', "%{$request->q}%"))
            ->latest()
            ->paginate(10);

        return response()->json($experts, 200);
    }

    /**
     * Detail tenaga ahli berdasarkan slug
     */
    public function show($slug)
    {
        $expert = Expert::where('slug', $slug)->first();

        if (!$expert) {
            return response()->json(['message' => 'Tenaga ahli tidak ditemukan.'], 404);
        }

        return response()->json($expert, 200);
    }

    /**
     * Menyimpan data Baru (Tambah Tenaga Ahli)
     * Mengatasi masalah URL Foto agar bisa disimpan sebagai teks biasa
     */
    public function store(Request $request)
    {
        // 1. Validasi Input dari Frontend (photo diubah menjadi string|url)
        $validatedData = $request->validate([
            'name'            => 'required|string|max:255',
            'institution'     => 'nullable|string|max:255',
            'email'           => 'nullable|email|max:255',
            'field'           => 'nullable|string|max:255',
            'kriteria'        => 'required|string|max:255',
            'alamat_kota'     => 'nullable|string|max:255',
            'alamat_provinsi' => 'nullable|string|max:255',
            'photo'           => 'nullable|string|url', // Mengizinkan string URL teks biasa
            'verified'        => 'nullable|boolean',
            'featured'        => 'nullable|boolean',
        ]);

        // 2. Generate slug otomatis berdasarkan nama
        $validatedData['slug'] = $this->uniqueSlug($validatedData['name']);

        // 3. Pastikan format boolean terisi dengan benar
        $validatedData['verified'] = $request->boolean('verified');
        $validatedData['featured'] = $request->boolean('featured');

        // 4. Simpan langsung string URL dan data lainnya ke database
        $expert = Expert::create($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Tenaga ahli berhasil ditambahkan.',
            'data' => $expert
        ], 201);
    }

    /**
     * Mengubah data yang sudah ada (Edit Tenaga Ahli)
     */
    public function update(Request $request, $id)
    {
        $expert = Expert::find($id);

        if (!$expert) {
            return response()->json(['message' => 'Tenaga ahli tidak ditemukan.'], 404);
        }

        // 1. Validasi Input (photo diubah menjadi string|url)
        $validatedData = $request->validate([
            'name'            => 'required|string|max:255',
            'institution'     => 'nullable|string|max:255',
            'email'           => 'nullable|email|max:255',
            'field'           => 'nullable|string|max:255',
            'kriteria'        => 'required|string|max:255',
            'alamat_kota'     => 'nullable|string|max:255',
            'alamat_provinsi' => 'nullable|string|max:255',
            'photo'           => 'nullable|string|url', // Mengizinkan string URL teks biasa
            'verified'        => 'nullable|boolean',
            'featured'        => 'nullable|boolean',
        ]);

        // 2. Update slug jika nama berubah
        if ($expert->name !== $validatedData['name']) {
            $validatedData['slug'] = $this->uniqueSlug($validatedData['name'], $expert->id);
        }

        $validatedData['verified'] = $request->boolean('verified');
        $validatedData['featured'] = $request->boolean('featured');

        // 3. Perbarui data ke database
        $expert->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Tenaga ahli berhasil diperbarui.',
            'data' => $expert
        ], 200);
    }

    /**
     * Menghapus data Tenaga Ahli
     */
    public function destroy($id)
    {
        $expert = Expert::find($id);

        if (!$expert) {
            return response()->json(['message' => 'Tenaga ahli tidak ditemukan.'], 404);
        }

        $expert->delete();

        return response()->json([
            'success' => true,
            'message' => 'Tenaga ahli berhasil dihapus.'
        ], 200);
    }

    /**
     * Helper untuk membuat slug unik
     */
    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 2;

        while (
            Expert::where('slug', $slug)
                ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
                ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }
}
