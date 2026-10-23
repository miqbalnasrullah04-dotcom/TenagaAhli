<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\RegistrationApproved;
use App\Mail\RegistrationRejected;
use App\Models\Consultation;
use App\Models\Expert;
use App\Models\Order;
use App\Models\Package;
use App\Models\User;
use App\Services\PointService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ExpertController extends Controller
{
    // ================== PUBLIK ==================

    public function index(Request $request)
    {
        $query = Expert::where('profile_status', 'aktif');

        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('name', 'like', "%{$keyword}%")
                    ->orWhere('field', 'like', "%{$keyword}%")
                    ->orWhere('keahlian', 'like', "%{$keyword}%")
                    ->orWhere('spesialisasi', 'like', "%{$keyword}%")
                    ->orWhere('kompetensi', 'like', "%{$keyword}%")
                    ->orWhere('hashtags', 'like', "%{$keyword}%")
                    ->orWhere('ringkasan_keahlian', 'like', "%{$keyword}%")
                    ->orWhere('pendidikan', 'like', "%{$keyword}%")
                    ->orWhereHas('educations', function ($eq) use ($keyword) {
                        $eq->where('jenjang', 'like', "%{$keyword}%")
                           ->orWhere('jurusan', 'like', "%{$keyword}%")
                           ->orWhere('institusi', 'like', "%{$keyword}%");
                    });
            });
        }



        if ($request->filled('keahlian')) {
            $keahlian = trim($request->keahlian);
            
            $synonymMap = [
                'gis' => ['gis', 'geospasial', 'sistem informasi geografis', 'pemetaan', 'spasial', 'spatial'],
                'system dynamics' => ['system dynamics', 'sistem dinamik', 'dinamika sistem', 'pemodelan sistem', 'spatial dynamics'],
                'ekonomi' => ['ekonomi', 'agribisnis', 'valuasi ekonomi', 'finansial', 'green economy', 'manajemen keuangan'],
                'hukum' => ['hukum', 'regulasi', 'perundang-undangan', 'advokasi', 'hukum lingkungan', 'kebijakan'],
                'perancangan wilayah' => ['perancangan wilayah', 'perencanaan wilayah', 'tata ruang', 'pwk', 'spasial', 'spatial dynamics', 'penggunaan lahan', 'klhs', 'rdtr', 'rtrw'],
                'lingkungan' => ['lingkungan', 'amdal', 'klhs', 'kehutanan', 'konservasi', 'manajemen lingkungan', 'pengelolaan limbah', 'kualitas air'],
                'sipil' => ['sipil', 'teknik sipil', 'struktur', 'konstruksi', 'geoteknik', 'infrastruktur', 'autocad'],
                'sosial' => ['sosial', 'sosiologi', 'masyarakat', 'pemberdayaan', 'pendidikan', 'pengembangan sdm', 'sosial ekonomi'],
                'geologi' => ['geologi', 'kebumian', 'geofisika', 'ftg', 'vulkanologi', 'sedimentologi', 'surveyor geologi'],
                'remote censing' => ['remote censing', 'remote sensing', 'penginderaan jauh', 'inderaja', 'citra satelit', 'satelit', 'spasial'],
                'remote sensing' => ['remote sensing', 'remote censing', 'penginderaan jauh', 'inderaja', 'citra satelit', 'satelit', 'spasial'],
                'pertambangan' => ['pertambangan', 'tambang', 'mineral', 'batubara', 'eksplorasi', 'reklamasi tambang'],
                'arsitek' => ['arsitek', 'arsitektur', 'desain bangunan', 'lansekap', 'perancangan kota', 'urban design'],
                'perikanan' => ['perikanan', 'kelautan', 'akuakultur', 'oseanografi', 'sumberdaya perairan', 'pesisir'],
                'pertanian' => ['pertanian', 'agribisnis', 'agronomi', 'agroteknologi', 'sosial ekonomi pertanian', 'ilmu tanah'],
                'statistik' => ['statistik', 'statistika', 'analisis data', 'matematika terapan', 'model prediktif', 'ekonometrika', 'olah data'],
                'meteorologi' => ['meteorologi', 'klimatologi', 'krimatologi', 'iklim', 'cuaca', 'hidrologi', 'atmosfer'],
                'meteorologi & krimatologi' => ['meteorologi', 'klimatologi', 'krimatologi', 'iklim', 'cuaca', 'hidrologi', 'atmosfer'],
                'meteorologi & klimatologi' => ['meteorologi', 'klimatologi', 'krimatologi', 'iklim', 'cuaca', 'hidrologi', 'atmosfer'],
            ];

            $lookupKey = strtolower($keahlian);
            $searchTerms = $synonymMap[$lookupKey] ?? [$keahlian];

            $query->where(function ($q) use ($searchTerms) {
                foreach ($searchTerms as $term) {
                    $q->orWhere('keahlian', 'like', "%{$term}%")
                      ->orWhere('field', 'like', "%{$term}%")
                      ->orWhere('spesialisasi', 'like', "%{$term}%")
                      ->orWhere('kompetensi', 'like', "%{$term}%")
                      ->orWhere('hashtags', 'like', "%{$term}%")
                      ->orWhere('ringkasan_keahlian', 'like', "%{$term}%")
                      ->orWhere('catatan', 'like', "%{$term}%")
                      ->orWhere('tentang_saya', 'like', "%{$term}%");
                }
            });
        }

        if ($request->filled('location')) {
            $query->where('location', 'like', '%'.$request->location.'%');
        }

        if ($request->filled('pendidikan')) {
            $pendidikan = trim($request->pendidikan);
            $query->where(function ($q) use ($pendidikan) {
                $q->where('pendidikan', 'like', "%{$pendidikan}%")
                  ->orWhereHas('educations', function ($eq) use ($pendidikan) {
                      $eq->where('jenjang', 'like', "%{$pendidikan}%")
                         ->orWhere('jurusan', 'like', "%{$pendidikan}%")
                         ->orWhere('institusi', 'like', "%{$pendidikan}%");
                  });
            });
        }

        if ($request->filled('experience')) {
            $exp = (int) $request->experience;
            if ($exp > 0) {
                $maxYear = (int) date('Y') - $exp;
                $query->where(function ($q) use ($maxYear) {
                    $q->where(function ($sq) use ($maxYear) {
                        $sq->whereNotNull('active_since')
                           ->where('active_since', '>', 1900)
                           ->where('active_since', '<=', $maxYear);
                    })->orWhereHas('experiences');
                });
            }
        }

        if ($request->filled('kriteria')) {
            $kriteria = $request->kriteria;
            $kriteriaAlt = str_replace('/', ' ', $kriteria);
            $query->where(function ($q) use ($kriteria, $kriteriaAlt) {
                $q->where('kriteria', 'like', '%'.$kriteria.'%')
                  ->orWhere('kriteria_list', 'like', '%'.$kriteria.'%');
                if ($kriteriaAlt !== $kriteria) {
                    $q->orWhere('kriteria', 'like', '%'.$kriteriaAlt.'%')
                      ->orWhere('kriteria_list', 'like', '%'.$kriteriaAlt.'%');
                }
                if (stripos($kriteria, 'surveyor') !== false) {
                    $q->orWhereHas('user', function ($uq) {
                        $uq->where('role_type', 'surveyor');
                    })->orWhere('field', 'like', '%Surveyor%');
                }
                if (stripos($kriteria, 'tenaga teknis') !== false) {
                    $q->orWhereHas('user', function ($uq) {
                        $uq->where('role_type', 'tenaga_teknis');
                    })->orWhere('field', 'like', '%Tenaga Teknis%');
                }
            });
        }

        if ($request->filled('role_type')) {
            $roleType = $request->role_type;
            if ($roleType === 'tenaga_ahli') {
                $query->where(function ($q) {
                    $q->where('kriteria', 'LIKE', '%Tenaga Ahli%')
                      ->orWhere('kriteria_list', 'LIKE', '%Tenaga Ahli%')
                      ->orWhere(function ($sub) {
                          $sub->where(function ($uq) {
                              $uq->whereHas('user', function ($u) {
                                  $u->whereNotIn('role_type', ['surveyor', 'tenaga_teknis']);
                              })->orWhereDoesntHave('user');
                          })
                          ->where(function ($kSub) {
                              $kSub->whereNull('kriteria_list')
                                   ->orWhere('kriteria_list', '[]')
                                   ->orWhere(function ($notSub) {
                                       $notSub->where('kriteria_list', 'NOT LIKE', '%Surveyor%')
                                              ->where('kriteria_list', 'NOT LIKE', '%Tenaga Teknis%');
                                   });
                          });
                      });
                });
            } elseif ($roleType === 'surveyor') {
                $query->where(function ($q) {
                    $q->whereHas('user', function ($uq) {
                        $uq->where('role_type', 'surveyor');
                    })
                    ->orWhere('kriteria', 'LIKE', '%Surveyor%')
                    ->orWhere('kriteria_list', 'LIKE', '%Surveyor%')
                    ->orWhere('field', 'LIKE', '%Surveyor%');
                });
            } elseif ($roleType === 'tenaga_teknis') {
                $query->where(function ($q) {
                    $q->whereHas('user', function ($uq) {
                        $uq->where('role_type', 'tenaga_teknis');
                    })
                    ->orWhere('kriteria', 'LIKE', '%Tenaga Teknis%')
                    ->orWhere('kriteria_list', 'LIKE', '%Tenaga Teknis%')
                    ->orWhere('field', 'LIKE', '%Tenaga Teknis%');
                });
            }
        }

        if ($request->boolean('exclude_surveyor')) {
            $query->where(function ($q) {
                $q->where(function ($sq) {
                    $sq->whereNull('kriteria')
                       ->orWhere('kriteria', 'NOT LIKE', '%Surveyor%');
                })
                ->where(function ($sq) {
                    $sq->whereNull('kriteria_list')
                       ->orWhere('kriteria_list', 'NOT LIKE', '%Surveyor%');
                })
                ->where(function ($sq) {
                    $sq->whereNull('field')
                       ->orWhere('field', 'NOT LIKE', '%Surveyor%');
                })
                ->where(function ($sq) {
                    $sq->whereHas('user', function ($uq) {
                        $uq->where('role_type', '!=', 'surveyor');
                    })->orWhereDoesntHave('user');
                });
            });
        }

        if ($request->boolean('eksklusif_only') || in_array($request->input('tier'), ['platinum', 'eksklusif', 'ekslusif'])) {
            // Khusus Paket Eksklusif / Platinum saja
            $query->where(function ($q) {
                $q->whereHas('package', function ($pq) {
                    $pq->where('name', 'LIKE', '%Platinum%')
                       ->orWhere('name', 'LIKE', '%Eksklusif%')
                       ->orWhere('name', 'LIKE', '%Ekslusif%')
                       ->orWhere('slug', 'LIKE', '%platinum%')
                       ->orWhere('slug', 'LIKE', '%eksklusif%')
                       ->orWhere('slug', 'LIKE', '%ekslusif%');
                })
                ->orWhereHas('user', function ($uq) {
                    $uq->whereIn('package', ['platinum', 'eksklusif', 'esklusif', 'ekslusif'])
                       ->where('premium_expires_at', '>', now());
                });
            });
        } elseif ($request->boolean('featured') || $request->boolean('premium_only') || $request->input('tier') === 'premium_platinum') {
            // Featured / Ekonomis / Eksklusif: yang punya package berbayar, user package ekonomis/eksklusif/premium/platinum, atau di-mark featured
            $query->where(function ($q) {
                $q->whereHas('package', function ($pq) {
                    $pq->where('price', '>', 0)
                       ->orWhere('name', 'LIKE', '%Premium%')
                       ->orWhere('name', 'LIKE', '%Platinum%')
                       ->orWhere('name', 'LIKE', '%Ekonomis%')
                       ->orWhere('name', 'LIKE', '%Eksklusif%')
                       ->orWhere('slug', 'LIKE', '%premium%')
                       ->orWhere('slug', 'LIKE', '%platinum%')
                       ->orWhere('slug', 'LIKE', '%ekonomis%')
                       ->orWhere('slug', 'LIKE', '%eksklusif%');
                })
                ->orWhereHas('user', function ($uq) {
                    $uq->whereIn('package', ['premium', 'platinum', 'ekonomis', 'eksklusif', 'esklusif'])
                       ->where('premium_expires_at', '>', now());
                })
                ->orWhere('featured', true);
            });
        }

        match ($request->input('order', 'latest')) {
            'top_rated' => $query->orderByDesc('rating'),
            'random' => $query->inRandomOrder(),
            default => $query->latest(),
        };

        $experts = $query->with(['package', 'user', 'educations', 'experiences', 'certificates'])->withCount('reviews')->withAvg('reviews', 'rating')->get([
            'id', 'slug', 'name', 'field', 'kriteria', 'kriteria_list', 'location',
            'alamat_kota', 'alamat_provinsi', 'alamat_lengkap', 'lokasi_label',
            'lat', 'lng', 'rating', 'photo', 'cover', 'verified', 'featured', 'package_id', 'user_id',
            'active_since', 'keahlian', 'spesialisasi', 'kompetensi', 'hashtags', 'ringkasan_keahlian', 'catatan', 'tentang_saya',
            'total_proyek', 'profile_status', 'update_status', 'ktp_path', 'pendidikan',
        ])->map(function ($expert) {
            $photoUrl = null;
            if ($expert->photo) {
                $photoUrl = filter_var($expert->photo, FILTER_VALIDATE_URL)
                    ? $expert->photo
                    : asset('storage/' . $expert->photo);
            }

            $coverUrl = null;
            if ($expert->cover) {
                $coverUrl = filter_var($expert->cover, FILTER_VALIDATE_URL)
                    ? $expert->cover
                    : asset('storage/' . $expert->cover);
            }

            $pkgName = optional($expert->package)->name ?? '';
            $pkgSlug = optional($expert->package)->slug ?? '';
            $userPkg = optional($expert->user)->package ?? '';

            $isPlatinum = str_contains(strtolower($pkgName), 'platinum')
                || str_contains(strtolower($pkgSlug), 'platinum')
                || str_contains(strtolower($userPkg), 'platinum')
                || str_contains(strtolower($pkgName), 'eksklusif')
                || str_contains(strtolower($pkgSlug), 'eksklusif')
                || str_contains(strtolower($userPkg), 'eksklusif')
                || str_contains(strtolower($pkgName), 'esklusif')
                || str_contains(strtolower($pkgSlug), 'esklusif')
                || str_contains(strtolower($pkgName), 'ekslusif')
                || str_contains(strtolower($pkgSlug), 'ekslusif')
                || str_contains(strtolower($userPkg), 'ekslusif');

            $isPremium = $isPlatinum
                || ($expert->package_id && optional($expert->package)->price > 0)
                || (bool)optional($expert->user)->isPremium()
                || (bool)$expert->featured
                || str_contains(strtolower($pkgName), 'premium')
                || str_contains(strtolower($pkgSlug), 'premium')
                || str_contains(strtolower($userPkg), 'premium')
                || str_contains(strtolower($pkgName), 'ekonomis')
                || str_contains(strtolower($pkgSlug), 'ekonomis')
                || str_contains(strtolower($userPkg), 'ekonomis');

            $userMemLevel = optional($expert->user)->membership_level ?? ($isPlatinum ? 'platinum' : ($isPremium ? 'premium' : 'free'));

            // Formulate human-readable location (avoid raw "Lat: ..., Lng: ..." coordinates)
            $locationName = null;
            if ($expert->alamat_kota || $expert->alamat_provinsi) {
                $locationName = trim(($expert->alamat_kota ? $expert->alamat_kota : '') . ($expert->alamat_provinsi ? ($expert->alamat_kota ? ', ' : '') . $expert->alamat_provinsi : ''));
            } elseif ($expert->lokasi_label && !str_starts_with($expert->lokasi_label, 'Lat:')) {
                $locationName = $expert->lokasi_label;
            } elseif ($expert->alamat_lengkap) {
                $locationName = $expert->alamat_lengkap;
            } elseif ($expert->location && !str_starts_with($expert->location, 'Lat:')) {
                $locationName = $expert->location;
            } else {
                $locationName = 'Indonesia';
            }

            $revCount = (int) ($expert->reviews_count ?? 0);
            $calculatedRating = $expert->reviews_avg_rating !== null
                ? round((float) $expert->reviews_avg_rating, 1)
                : ($expert->rating > 0 ? (float) $expert->rating : null);

            // Cari jenjang pendidikan tertinggi
            $highestEdu = null;
            if ($expert->relationLoaded('educations') && $expert->educations->isNotEmpty()) {
                $jenjangWeight = function ($jenjang) {
                    $j = strtolower(trim((string)$jenjang));
                    if (str_contains($j, 's3') || str_contains($j, 'doktor') || str_contains($j, 'phd') || str_contains($j, 'ph.d')) return 5;
                    if (str_contains($j, 's2') || str_contains($j, 'magister') || str_contains($j, 'master') || str_contains($j, 'spesialis')) return 4;
                    if (str_contains($j, 's1') || str_contains($j, 'sarjana') || str_contains($j, 'd4')) return 3;
                    if (str_contains($j, 'd3') || str_contains($j, 'diploma') || str_contains($j, 'ahli madya')) return 2;
                    if (str_contains($j, 'sma') || str_contains($j, 'smk')) return 1;
                    return 0;
                };

                $highestEduModel = $expert->educations->sortByDesc(function ($edu) use ($jenjangWeight) {
                    return [$jenjangWeight($edu->jenjang), (int)($edu->tahun_lulus ?? 0)];
                })->first();

                if ($highestEduModel) {
                    $highestEdu = $highestEduModel->jenjang;
                }
            } elseif (!empty($expert->pendidikan) && is_string($expert->pendidikan)) {
                $highestEdu = $expert->pendidikan;
            }

            // Cari sertifikat primary
            $primaryCert = null;
            if ($expert->relationLoaded('certificates') && $expert->certificates->isNotEmpty()) {
                $primaryCertModel = $expert->certificates->firstWhere('is_primary', true);
                $primaryCert = $primaryCertModel ? $primaryCertModel->nama_sertifikat : null;
            }

            // Cari pekerjaan primary
            $primaryExp = null;
            if ($expert->relationLoaded('experiences') && $expert->experiences->isNotEmpty()) {
                $primaryExpModel = $expert->experiences->firstWhere('is_primary', true) ?: $expert->experiences->first();
                $primaryExp = $primaryExpModel ? $primaryExpModel->posisi : null;
            }

            return [
                'id' => $expert->id,
                'slug' => $expert->slug,
                'name' => $expert->name,
                'field' => $expert->field,
                'kriteria' => $expert->kriteria,
                'kriteria_list' => $expert->kriteria_list,
                'location' => $locationName,
                'alamat_kota' => $expert->alamat_kota,
                'alamat_provinsi' => $expert->alamat_provinsi,
                'alamat_lengkap' => $expert->alamat_lengkap,
                'lokasi_label' => $expert->lokasi_label,
                'lat' => $expert->lat,
                'lng' => $expert->lng,
                'rating' => $calculatedRating,
                'reviews_count' => $revCount,
                'photo' => $photoUrl,
                'cover' => $coverUrl,
                'profile_status' => $expert->profile_status,
                'update_status' => $expert->update_status,
                'verified' => (bool)$expert->verified,
                'featured' => (bool)$expert->featured,
                'package_id' => $expert->package_id,
                'has_ktp' => !empty($expert->ktp_path),
                'ktp_path' => $expert->ktp_path,
                'is_premium' => $isPremium,
                'is_platinum' => $isPlatinum,
                'is_surveyor' => (bool)$expert->is_surveyor,
                'role_label' => $expert->role_label,
                'role_type' => optional($expert->user)->role_type ?? ($expert->is_surveyor ? 'surveyor' : 'tenaga_ahli'),
                'package_name' => $pkgName ?: ($isPlatinum ? 'Paket Eksklusif' : ($isPremium ? 'Paket Ekonomis' : 'Paket Biasa')),
                'membership_level' => $userMemLevel,
                'active_since' => $expert->active_since,
                'is_online' => (bool)$expert->isOnline(),
                'keahlian' => $expert->keahlian,
                'spesialisasi' => $expert->spesialisasi,
                'kompetensi' => $expert->kompetensi,
                'hashtags' => $expert->hashtags ?? [],
                'ringkasan_keahlian' => $expert->ringkasan_keahlian,
                'catatan' => $expert->catatan,
                'tentang_saya' => $expert->tentang_saya,
                'total_proyek' => $expert->total_proyek,
                'total_jurnal' => $expert->total_jurnal,
                'consultation_medal' => $expert->consultation_medal,
                'pendidikan_tertinggi' => $highestEdu,
                'primary_certificate' => $primaryCert,
                'primary_experience' => $primaryExp,
                'certificates' => $expert->relationLoaded('certificates') ? $expert->certificates->map(fn($c) => [
                    'id' => $c->id,
                    'nama_sertifikat' => $c->nama_sertifikat,
                    'is_primary' => (bool)$c->is_primary,
                ]) : [],
                'experiences' => $expert->relationLoaded('experiences') ? $expert->experiences->map(fn($exp) => [
                    'id' => $exp->id,
                    'posisi' => $exp->posisi,
                    'instansi' => $exp->instansi,
                    'tahun_mulai' => $exp->tahun_mulai,
                    'tahun_selesai' => $exp->tahun_selesai,
                    'is_primary' => (bool)$exp->is_primary,
                ]) : [],
                'educations' => $expert->relationLoaded('educations') ? $expert->educations->map(fn($e) => [
                    'jenjang' => $e->jenjang,
                    'institusi' => $e->institusi,
                    'jurusan' => $e->jurusan,
                    'tahun_lulus' => $e->tahun_lulus,
                ]) : [],
            ];
        });

        if ($request->filled('pendidikan')) {
            $pReq = trim($request->pendidikan);
            $pLower = strtolower($pReq);

            $targetLevel = null;
            if ($pLower === 's3' || str_contains($pLower, 'doktor') || str_contains($pLower, 'phd') || str_contains($pLower, 's3 / doktor')) {
                $targetLevel = 's3';
            } elseif ($pLower === 's2' || str_contains($pLower, 'magister') || str_contains($pLower, 'master') || str_contains($pLower, 's2 / magister')) {
                $targetLevel = 's2';
            } elseif ($pLower === 's1' || str_contains($pLower, 'sarjana') || str_contains($pLower, 's1 / sarjana')) {
                $targetLevel = 's1';
            } elseif ($pLower === 'd4' || str_contains($pLower, 'sarjana terapan') || str_contains($pLower, 'd4 / sarjana terapan')) {
                $targetLevel = 'd4';
            } elseif ($pLower === 'd3' || str_contains($pLower, 'diploma') || str_contains($pLower, 'd3 / diploma')) {
                $targetLevel = 'd3';
            } elseif (str_contains($pLower, 'profesi') || str_contains($pLower, 'spesialis')) {
                $targetLevel = 'profesi';
            } elseif (str_contains($pLower, 'sma') || str_contains($pLower, 'smk') || str_contains($pLower, 'sma / smk')) {
                $targetLevel = 'sma';
            }

            $experts = $experts->filter(function ($e) use ($targetLevel, $pLower) {
                $highest = strtolower(trim((string)($e['pendidikan_tertinggi'] ?? '')));
                if ($targetLevel) {
                    return match ($targetLevel) {
                        's3' => str_contains($highest, 's3') || str_contains($highest, 'doktor') || str_contains($highest, 'phd') || str_contains($highest, 'ph.d'),
                        's2' => str_contains($highest, 's2') || str_contains($highest, 'magister') || str_contains($highest, 'master'),
                        's1' => str_contains($highest, 's1') || str_contains($highest, 'sarjana'),
                        'd4' => str_contains($highest, 'd4') || str_contains($highest, 'sarjana terapan'),
                        'd3' => str_contains($highest, 'd3') || str_contains($highest, 'diploma'),
                        'profesi' => str_contains($highest, 'profesi') || str_contains($highest, 'spesialis'),
                        'sma' => str_contains($highest, 'sma') || str_contains($highest, 'smk'),
                        default => false,
                    };
                }

                // Generic search across educations (jurusan, institusi, etc.)
                $eduText = strtolower(trim(($e['pendidikan_tertinggi'] ?? '') . ' ' . json_encode($e['educations'] ?? [])));
                return str_contains($eduText, $pLower);
            });
        }

        if ($request->filled('experience')) {
            $expReq = (int) $request->experience;
            if ($expReq > 0) {
                $experts = $experts->filter(function ($e) use ($expReq) {
                    $years = 0;
                    if (!empty($e['active_since'])) {
                        $y = (int) $e['active_since'];
                        if ($y > 1900) {
                            $years = max(0, (int) date('Y') - $y);
                        }
                    } elseif (!empty($e['experiences']) && is_array($e['experiences'])) {
                        $years = count($e['experiences']) * 2;
                    }
                    return $years >= $expReq;
                });
            }
        }

        $sortedExperts = $experts->sort(function ($a, $b) use ($request) {
            if ($request->input('order') === 'random') return 0;
            if ($request->input('order') === 'top_rated') {
                $ratingDiff = ($b['rating'] ?? 0) <=> ($a['rating'] ?? 0);
                if ($ratingDiff !== 0) return $ratingDiff;
                return ($a['id'] ?? 0) <=> ($b['id'] ?? 0);
            }
            $weightA = !empty($a['is_platinum']) ? 2 : (!empty($a['is_premium']) ? 1 : 0);
            $weightB = !empty($b['is_platinum']) ? 2 : (!empty($b['is_premium']) ? 1 : 0);
            if ($weightA !== $weightB) {
                return $weightB <=> $weightA;
            }
            // Dalam tier yang sama: yang daftar paling pertama (id ASC) di paling atas
            return ($a['id'] ?? 0) <=> ($b['id'] ?? 0);
        })->values();

        return response()->json($sortedExperts);
    }

    public function show(string $slug)
    {
        try {
            $expert = Expert::with(['educations', 'experiences', 'certificates', 'reviews', 'package', 'user', 'products'])
                ->where('slug', $slug)
                ->where('profile_status', 'aktif')
                ->firstOrFail();

            $routeMap = Expert::kriteriaRouteMap();
            $kriteriaList = $expert->kriteria_list ?: [$expert->kriteria];

            // Calculate years of experience
            $yearsActive = $expert->active_since ? now()->year - $expert->active_since : 0;

            $pkgName = optional($expert->package)->name ?? '';
            $pkgSlug = optional($expert->package)->slug ?? '';
            $userPkg = optional($expert->user)->package ?? '';
            $isPlatinum = str_contains(strtolower($pkgName), 'platinum')
                || str_contains(strtolower($pkgSlug), 'platinum')
                || str_contains(strtolower($userPkg), 'platinum')
                || str_contains(strtolower($pkgName), 'eksklusif')
                || str_contains(strtolower($pkgSlug), 'eksklusif')
                || str_contains(strtolower($userPkg), 'eksklusif')
                || str_contains(strtolower($pkgName), 'esklusif')
                || str_contains(strtolower($pkgSlug), 'esklusif')
                || str_contains(strtolower($pkgName), 'ekslusif')
                || str_contains(strtolower($pkgSlug), 'ekslusif')
                || str_contains(strtolower($userPkg), 'ekslusif');
            $isPremium = $isPlatinum
                || ($expert->package_id && optional($expert->package)->price > 0)
                || (bool)optional($expert->user)->isPremium()
                || (bool)$expert->featured
                || str_contains(strtolower($pkgName), 'premium')
                || str_contains(strtolower($pkgSlug), 'premium')
                || str_contains(strtolower($userPkg), 'premium')
                || str_contains(strtolower($pkgName), 'ekonomis')
                || str_contains(strtolower($pkgSlug), 'ekonomis')
                || str_contains(strtolower($userPkg), 'ekonomis');

            $isOnline = (bool)$expert->isOnline();
            $medalData = app(\App\Services\MembershipMedalService::class)->evaluateAndSync($expert);

            $profile = [
            'id' => $expert->id,
            'slug' => $expert->slug,
            'name' => $expert->name,
            'gelar' => $expert->field ? "Ahli {$expert->field}" : '',
            'profesi' => $expert->field ?? 'Tenaga Ahli',
            'institution' => $expert->institution,
            'profile_status' => $expert->profile_status,
            'update_status' => $expert->update_status,
            'verified' => (bool)$expert->verified,
            'has_ktp' => !empty($expert->ktp_path),
            'ktp_path' => $expert->ktp_path,
            'activeSince' => $expert->active_since,
            'photo' => $expert->photo ? (filter_var($expert->photo, FILTER_VALIDATE_URL) ? $expert->photo : asset('storage/' . $expert->photo)) : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
            'cover' => $expert->cover ? (filter_var($expert->cover, FILTER_VALIDATE_URL) ? $expert->cover : asset('storage/' . $expert->cover)) : 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1400',
            'email' => $expert->email ?: optional($expert->user)->email,
            'is_online' => $isOnline,
            'ketersediaan' => [
                'status' => $isOnline ? 'tersedia' : 'tidak_tersedia',
                'label' => $isOnline ? 'Online — Sedang aktif di web' : 'Offline — Sedang tidak aktif'
            ],

            // Bio dan keahlian
            'tentangSaya' => $expert->tentang_saya ?? $expert->catatan ?? 'Tenaga ahli berpengalaman dengan dedikasi tinggi dalam bidang keahliannya.',
            'ringkasanKeahlian' => $expert->ringkasan_keahlian ?? "Spesialis {$expert->field} dengan pengalaman lebih dari {$yearsActive} tahun.",
            'bidangUtama' => $expert->bidang_utama ?? $expert->keahlian ?? [$expert->field ?? 'Konsultasi Profesional'],
            'keahlian' => $expert->keahlian ?? [$expert->field ?? 'Keahlian Profesional'],
            'spesialisasi' => $expert->spesialisasi ?? [],
            'kompetensi' => $expert->kompetensi ?? [],
            'hashtags' => $expert->hashtags ?? [],
            'kategoriProfesional' => $kriteriaList,

            // Lokasi dan alamat
            'alamat' => [
                'lengkap' => $expert->alamat_lengkap,
                'kota' => $expert->alamat_kota,
                'provinsi' => $expert->alamat_provinsi,
            ],
            'lokasi' => [
                'label' => $expert->lokasi_label ?: ($expert->alamat_lengkap ?: ($expert->alamat_kota ? "{$expert->alamat_kota}, {$expert->alamat_provinsi}" : ($expert->location ?: 'Indonesia'))),
                'lat' => $expert->lat ?: -6.5622,
                'lng' => $expert->lng ?: 106.7297,
            ],
            'alamat_lengkap' => $expert->alamat_lengkap,
            'alamat_kota' => $expert->alamat_kota,
            'alamat_provinsi' => $expert->alamat_provinsi,
            'location' => $expert->location,
            'lat' => $expert->lat,
            'lng' => $expert->lng,

            // Data dari relasi
            'pendidikan' => $expert->educations->map(function ($edu) {
                return [
                    'jenjang' => $edu->jenjang,
                    'institusi' => $edu->institusi,
                    'prodi' => $edu->jurusan,
                    'gelar' => $edu->jenjang,
                    'tahun' => $edu->tahun_lulus,
                ];
            }),
            'pengalamanKerja' => $expert->experiences->map(function ($exp) {
                $startYear = $exp->tahun_mulai;
                $endYear = $exp->tahun_selesai ?: 'Sekarang';
                return [
                    'jabatan' => $exp->posisi,
                    'institusi' => $exp->instansi,
                    'periode' => "{$startYear} — {$endYear}",
                    'deskripsi' => $exp->deskripsi,
                ];
            }),
            'sertifikasi' => $expert->certificates->map(function ($cert) {
                return [
                    'nama' => $cert->nama_sertifikat,
                    'lembaga' => $cert->penerbit,
                    'nomor' => '-',
                    'tahun' => $cert->tahun,
                    'berlakuHingga' => 'Seumur hidup',
                ];
            }),

            // Sosial media dan kriteria
            'sosial' => $expert->sosial ?? [],
            'kriteria' => collect($kriteriaList)->map(fn ($label) => [
                'label' => $label,
                'to' => $routeMap[$label] ?? '/',
            ])->values(),

            // Riwayat kegiatan
            'narasumber' => $expert->narasumber_riwayat ?? $expert->narasumber ?? [],
            'narasumber_riwayat' => $expert->narasumber_riwayat ?? $expert->narasumber ?? [],
            'kajian' => $expert->kajian_riwayat ?? $expert->kajian ?? [],
            'kajian_riwayat' => $expert->kajian_riwayat ?? $expert->kajian ?? [],

            // Ulasan dari database
            'ulasan' => $expert->reviews->map(fn ($r) => [
                'id'         => $r->id,
                'nama'       => $r->reviewer_name,
                'rating'     => $r->rating,
                'komentar'   => $r->komentar,
                'balasan'    => $r->balasan,
                'replied_at' => $r->replied_at?->toISOString(),
                'tanggal'    => $r->created_at ? $r->created_at->format('d M Y') : '',
            ]),
            'rating' => $expert->reviews->count()
                ? round((float)$expert->reviews->avg('rating'), 1)
                : ($expert->rating > 0 ? (float)$expert->rating : null),
            'reviews_count' => $expert->reviews->count(),

            // Status Membership & Premium
            'verified' => (bool)$expert->verified,
            'has_ktp' => !empty($expert->ktp_path),
            'ktp_path' => $expert->ktp_path,
            'is_premium' => (bool)$isPremium,
            'is_platinum' => (bool)$isPlatinum,
            'package_name' => $pkgName ?: ($isPlatinum ? 'Paket Eksklusif' : ($isPremium ? 'Paket Ekonomis' : 'Paket Biasa')),
            'membership_level' => optional($expert->user)->membership_level ?? ($isPlatinum ? 'platinum' : ($isPremium ? 'premium' : 'free')),
            'package' => $expert->package,
            'consultation_medal' => $medalData,

            // Link Akademik
            'scopus_url' => $expert->scopus_url,
            'scopus_metrics' => $expert->scopus_metrics,
            'google_scholar_url' => $expert->google_scholar_url,
            'google_scholar_metrics' => $expert->google_scholar_metrics,
            'sinta_url' => $expert->sinta_url,
            'sinta_metrics' => $expert->sinta_metrics,
            'orcid_url' => $expert->orcid_url,
            'orcid_metrics' => $expert->orcid_metrics,
            'researchgate_url' => $expert->researchgate_url,
            'researchgate_metrics' => $expert->researchgate_metrics,

            // Data tambahan untuk template
            'total_proyek' => $expert->total_proyek,
            'total_jurnal' => $expert->total_jurnal,
            'pengalamanProyek' => $expert->pengalaman_proyek ?? $expert->kajian_riwayat ?? [],
            'pengalamanPenelitian' => $expert->pengalaman_penelitian ?? [],
            'pengalaman_penelitian' => $expert->pengalaman_penelitian ?? [],
            'organisasi' => $expert->organisasi ?? [],
            'publikasi' => $expert->publikasi ?? [],
            'reviewer_jurnal' => $expert->reviewer_jurnal ?? [],
            'reviewerJurnal' => $expert->reviewer_jurnal ?? [],
            'instruktur' => $expert->instruktur ?? [],
            'profilAkademik' => null,
            // Portofolio
            'portofolio' => [
                'cv' => $expert->cv_path,
                'sertifikat' => [],
                'dokumenProyek' => [],
            ],
            // Jadwal & Tarif Konsultasi (Real from Database)
            'schedule' => $expert->schedule ?? null,
            'pricing' => $expert->pricing ?? null,
            'consultation_rates' => [
                'chat'  => (int) ($expert->pricing['chat']['price'] ?? 150000),
                'email' => (int) ($expert->pricing['email']['price'] ?? 100000),
                'zoom'  => (int) ($expert->pricing['zoom']['price'] ?? 250000),
            ],
            // Produk marketplace yang diunggah ahli/surveyor
            'products' => collect($expert->products)
                ->filter(fn($p) => $p->status === 'active')
                ->map(function ($p) use ($expert) {
                    try {
                        $imageUrl = null;
                        if ($p->image) {
                            $imageUrl = filter_var($p->image, FILTER_VALIDATE_URL) ? $p->image : asset('storage/' . $p->image);
                        }
                        return [
                            'id'             => $p->id,
                            'title'          => $p->title ?? '',
                            'author'         => $p->author ?: $expert->name,
                            'publisher'      => $p->publisher ?: ($expert->institution ?? 'Penerbit Mandiri'),
                            'isbn'           => $p->isbn ?? '-',
                            'language'       => $p->language ?: 'Indonesia',
                            'pages'          => $p->pages ?? '-',
                            'specifications' => $p->specifications ?? [],
                            'category'       => $p->category ?? 'other',
                            'price'          => (int) ($p->price ?? 0),
                            'discount_price' => $p->discount_price ? (int) $p->discount_price : null,
                            'is_digital'     => (bool) ($p->is_digital ?? true),
                            'stock'          => $p->stock ?? 0,
                            'description'    => $p->description ?? '',
                            'image'          => $imageUrl,
                            'image_url'      => $imageUrl,
                            'status'         => $p->status ?? 'active',
                            'sold_count'     => (int) ($p->sold_count ?? 0),
                            'rating'         => (float) ($p->rating ?? 0),
                            'reviews_count'  => (int) ($p->reviews_count ?? 0),
                            'is_featured'    => (bool) ($p->is_featured ?? false),
                            'created_at'     => $p->created_at?->toDateString(),
                        ];
                    } catch (\Exception $e) {
                        \Log::error('Error mapping product: ' . $e->getMessage(), ['product_id' => $p->id ?? 'unknown']);
                        return null;
                    }
                })
                ->filter()
                ->values(),

            // Galeri Foto & Video Portofolio
            'gallery'           => $expert->gallery ?? [],
            'galeri'            => $expert->gallery ?? [],
            'video_url'         => $expert->video_url,
            'video_title'       => $expert->video_title,
            'video_description' => $expert->video_description,
        ];

        return response()->json($profile);
        } catch (\Exception $e) {
            \Log::error('Error loading expert profile: ' . $e->getMessage(), [
                'slug' => $slug,
                'trace' => $e->getTraceAsString()
            ]);
            return response()->json([
                'message' => 'Failed to load expert profile',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // ================== USER (dashboard & lengkapi profil) ==================

    public function myProfile(Request $request)
    {
        $user = $request->user();

        $query = Expert::with(['educations', 'experiences', 'certificates', 'documents', 'package'])
            ->where('user_id', $user->id);

        if ($request->filled('role_type')) {
            $kriteria = $request->role_type === 'surveyor' ? 'Surveyor' : ($request->role_type === 'tenaga_teknis' ? 'Tenaga Teknis' : 'Tenaga Ahli');
            $query->where('kriteria', $kriteria);
        } elseif ($user->role_type === 'surveyor') {
            $query->where('kriteria', 'Surveyor');
        } elseif ($user->role_type === 'tenaga_teknis') {
            $query->where('kriteria', 'Tenaga Teknis');
        }

        $expert = $query->first() ?? Expert::with(['educations', 'experiences', 'certificates', 'documents', 'package'])
            ->where('user_id', $user->id)
            ->first();

        // Check if premium package has expired
        if ($expert && $expert->package_expires_at && now()->greaterThan($expert->package_expires_at)) {
            $freePackage = Package::where('price', 0)->first();
            $expert->update([
                'package_id' => $freePackage ? $freePackage->id : null,
                'package_expires_at' => null
            ]);
            $expert->load('package');
        }

        if (!$expert) {
            $expert = Expert::create([
                'user_id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'slug' => Str::slug($user->name).'-'.Str::random(5),
                'kriteria' => ($user->role_type === 'surveyor' ? 'Surveyor' : ($user->role_type === 'tenaga_teknis' ? 'Tenaga Teknis' : 'Tenaga Ahli')),
                'profile_status' => 'draft',
            ]);
            $expert->load(['educations', 'experiences', 'certificates', 'documents', 'package']);
        }

        if ($expert) {
            try {
                app(\App\Services\MembershipMedalService::class)->evaluateAndSync($expert);
            } catch (\Throwable $e) {
                // Jangan gagalkan profil jika ada issue non-kritis
            }
        }

        return response()->json($expert);
    }

    public function saveProfile(Request $request)
    {
        $user = $request->user('sanctum') ?? $request->user() ?? \Illuminate\Support\Facades\Auth::user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }
        $expert = Expert::where('user_id', $user->id)->firstOrFail();

        // Jika hanya update package_id (dari halaman PilihPaket)
        if ($request->has('package_id') && count($request->all()) === 1) {
            $expert->update(['package_id' => $request->package_id]);
            return response()->json($expert);
        }

        $validator = Validator::make($request->all(), [
            'name'            => ['sometimes', 'required', 'string', 'max:255'],
            'institution'     => ['nullable', 'string', 'max:255'],
            'field'           => ['nullable', 'string', 'max:255'],
            'phone'           => ['nullable', 'string', 'max:20'],
            'kriteria'        => ['nullable', 'string', 'max:255'],
            'kriteria_list'   => ['nullable', 'array'],
            'alamat_lengkap'  => ['nullable', 'string'],
            'alamat_kota'     => ['nullable', 'string', 'max:255'],
            'alamat_provinsi' => ['nullable', 'string', 'max:255'],
            'location'        => ['nullable', 'string', 'max:255'],
            'lat'             => ['nullable', 'numeric', 'between:-90,90'],
            'lng'             => ['nullable', 'numeric', 'between:-180,180'],
            'tempat_lahir'    => ['nullable', 'string', 'max:255'],
            'tanggal_lahir'   => ['nullable', 'date'],
            'active_since'    => ['nullable', 'integer', 'min:1970', 'max:' . date('Y')],
            'catatan'         => ['nullable', 'string'],
            'tentang_saya'    => ['nullable', 'string'],
            'ringkasan_keahlian' => ['nullable', 'string'],
            'bidang_utama'    => ['nullable', 'array'],
            'keahlian'        => ['nullable', 'array'],
            'spesialisasi'    => ['nullable', 'array'],
            'kompetensi'      => ['nullable', 'array'],
            'hashtags'        => ['nullable'],
            'sosial'          => ['nullable', 'array'],
            'sosial.*.type'   => ['nullable', 'string', 'max:50'],
            'sosial.*.label'  => ['nullable', 'string', 'max:100'],
            'sosial.*.url'    => ['nullable', 'string', 'max:500'],
            'scopus_url'      => ['nullable', 'string', 'max:500'],
            'scopus_metrics'  => ['nullable', 'string', 'max:255'],
            'google_scholar_url' => ['nullable', 'string', 'max:500'],
            'google_scholar_metrics' => ['nullable', 'string', 'max:255'],
            'sinta_url'       => ['nullable', 'string', 'max:500'],
            'sinta_metrics'   => ['nullable', 'string', 'max:255'],
            'orcid_url'       => ['nullable', 'string', 'max:500'],
            'orcid_metrics'   => ['nullable', 'string', 'max:255'],
            'researchgate_url' => ['nullable', 'string', 'max:500'],
            'researchgate_metrics' => ['nullable', 'string', 'max:255'],
            'package_id'      => ['nullable', 'exists:packages,id'],
            'photo'           => ['nullable', 'image', 'max:5120'], // 5MB max
            'cover'           => ['nullable', 'image', 'max:5120'], // 5MB max
            // Rekening Bank
            'bank_name'         => ['nullable', 'string', 'max:100'],
            'bank_account'      => ['nullable', 'string', 'max:50'],
            'bank_account_name' => ['nullable', 'string', 'max:255'],
            // Pengalaman Proyek, Jurnal & Penelitian
            'total_proyek'          => ['nullable', 'integer', 'min:0'],
            'total_jurnal'          => ['nullable', 'integer', 'min:0'],
            'pengalaman_proyek'     => ['nullable', 'array'],
            'pengalaman_penelitian' => ['nullable', 'array'],
            // Galeri & Video
            'gallery'           => ['nullable', 'array'],
            'gallery.*.image'   => ['nullable', 'string'],
            'gallery.*.caption' => ['nullable', 'string', 'max:255'],
            'gallery.*.album'   => ['nullable', 'string', 'max:100'],
            'gallery_albums'    => ['nullable', 'array'],
            'gallery_albums.*'  => ['nullable', 'string', 'max:100'],
            'video_url'         => ['nullable', 'string', 'max:500'],
            'video_title'       => ['nullable', 'string', 'max:255'],
            'video_description' => ['nullable', 'string', 'max:1000'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();

        if ($request->has('pengalaman_proyek')) {
            $data['pengalaman_proyek'] = $request->input('pengalaman_proyek', []);
        }
        if ($request->has('pengalaman_penelitian')) {
            $data['pengalaman_penelitian'] = $request->input('pengalaman_penelitian', []);
        }

        // Pastikan galeri tersimpan dengan validasi paket
        if ($request->has('gallery')) {
            $galleryInput = $request->input('gallery', []);
            $pkg = $expert->package;
            $pkgName = strtolower($pkg ? ($pkg->slug . ' ' . $pkg->name) : 'free');

            $maxPhotos = 3;
            $allowAlbums = false;
            if (str_contains($pkgName, 'ekslusif') || str_contains($pkgName, 'exclusive')) {
                $maxPhotos = 50;
                $allowAlbums = true;
            } elseif (str_contains($pkgName, 'ekonomis')) {
                $maxPhotos = 20;
                $allowAlbums = false;
            }

            if (count($galleryInput) > $maxPhotos) {
                return response()->json([
                    'message' => "Jumlah foto melebihi batas paket ({$maxPhotos} foto). Silakan sesuaikan atau upgrade paket Anda."
                ], 422);
            }

            if (!$allowAlbums) {
                foreach ($galleryInput as &$gItem) {
                    if (is_array($gItem)) {
                        unset($gItem['album']);
                    }
                }
                $data['gallery_albums'] = [];
            }

            $data['gallery'] = $galleryInput;
        }

        if ($request->has('gallery_albums')) {
            $pkg = $expert->package;
            $pkgName = strtolower($pkg ? ($pkg->slug . ' ' . $pkg->name) : 'free');
            if (str_contains($pkgName, 'ekslusif') || str_contains($pkgName, 'exclusive')) {
                $data['gallery_albums'] = array_values(array_unique(array_filter($request->input('gallery_albums', []))));
            } else {
                $data['gallery_albums'] = [];
            }
        }

        // Pastikan video tersimpan
        if ($request->has('video_url')) {
            $data['video_url'] = $request->input('video_url');
        }
        if ($request->has('video_title')) {
            $data['video_title'] = $request->input('video_title');
        }
        if ($request->has('video_description')) {
            $data['video_description'] = $request->input('video_description');
        }

        // Pastikan sosial media tersimpan — ambil langsung dari request
        // karena validated() kadang tidak menyertakan nested array objects
        if ($request->has('sosial')) {
            $data['sosial'] = $request->input('sosial', []);
        }

        // Simpan hashtags
        if ($request->has('hashtags')) {
            $rawHashtags = $request->input('hashtags');
            if (is_string($rawHashtags)) {
                $data['hashtags'] = array_values(array_filter(array_map(function ($t) {
                    return ltrim(trim($t), '#');
                }, preg_split('/[\s,]+/', $rawHashtags))));
            } elseif (is_array($rawHashtags)) {
                $data['hashtags'] = array_values(array_filter(array_map(function ($t) {
                    return ltrim(trim($t), '#');
                }, $rawHashtags)));
            } else {
                $data['hashtags'] = [];
            }
        }

        // Handle photo upload (LANGSUNG LIVE - tidak perlu verifikasi admin)
        if ($request->hasFile('photo')) {
            if ($expert->photo && \Storage::disk('public')->exists($expert->photo)) {
                \Storage::disk('public')->delete($expert->photo);
            }
            $photoPath = $request->file('photo')->store('experts/photos', 'public');
            $expert->photo = $photoPath;
            $expert->save();

            if ($expert->user) {
                $expert->user->update([
                    'foto'       => $photoPath,
                    'avatar_url' => $photoPath,
                ]);
            }

            if (is_array($expert->pending_changes) && isset($expert->pending_changes['photo'])) {
                $cp = $expert->pending_changes;
                if ($cp['photo'] && \Storage::disk('public')->exists($cp['photo'])) {
                    \Storage::disk('public')->delete($cp['photo']);
                }
                unset($cp['photo']);
                $expert->pending_changes = empty($cp) ? null : $cp;
                if (empty($cp) && $expert->update_status === 'menunggu_verifikasi') {
                    $expert->update_status = null;
                    $expert->update_reject_reason = null;
                }
                $expert->save();
            }
            unset($data['photo']);
        } elseif ($request->has('delete_photo') || ($request->has('photo') && $request->input('photo') === null)) {
            if ($expert->photo && \Storage::disk('public')->exists($expert->photo)) {
                \Storage::disk('public')->delete($expert->photo);
            }
            $expert->photo = null;
            $expert->save();

            if ($expert->user) {
                $expert->user->update([
                    'foto'       => null,
                    'avatar_url' => null,
                ]);
            }

            if (is_array($expert->pending_changes) && isset($expert->pending_changes['photo'])) {
                $cp = $expert->pending_changes;
                unset($cp['photo']);
                $expert->pending_changes = empty($cp) ? null : $cp;
                if (empty($cp) && $expert->update_status === 'menunggu_verifikasi') {
                    $expert->update_status = null;
                    $expert->update_reject_reason = null;
                }
                $expert->save();
            }
            unset($data['photo']);
        }

        // Handle cover upload (LANGSUNG LIVE - tidak perlu verifikasi admin)
        if ($request->hasFile('cover')) {
            if ($expert->cover && \Storage::disk('public')->exists($expert->cover)) {
                \Storage::disk('public')->delete($expert->cover);
            }
            $coverPath = $request->file('cover')->store('experts/covers', 'public');
            $expert->cover = $coverPath;
            $expert->save();

            if (is_array($expert->pending_changes) && isset($expert->pending_changes['cover'])) {
                $cp = $expert->pending_changes;
                if ($cp['cover'] && \Storage::disk('public')->exists($cp['cover'])) {
                    \Storage::disk('public')->delete($cp['cover']);
                }
                unset($cp['cover']);
                $expert->pending_changes = empty($cp) ? null : $cp;
                if (empty($cp) && $expert->update_status === 'menunggu_verifikasi') {
                    $expert->update_status = null;
                    $expert->update_reject_reason = null;
                }
                $expert->save();
            }
            unset($data['cover']);
        } elseif ($request->has('delete_cover') || ($request->has('cover') && $request->input('cover') === null)) {
            if ($expert->cover && \Storage::disk('public')->exists($expert->cover)) {
                \Storage::disk('public')->delete($expert->cover);
            }
            $expert->cover = null;
            $expert->save();

            if (is_array($expert->pending_changes) && isset($expert->pending_changes['cover'])) {
                $cp = $expert->pending_changes;
                unset($cp['cover']);
                $expert->pending_changes = empty($cp) ? null : $cp;
                if (empty($cp) && $expert->update_status === 'menunggu_verifikasi') {
                    $expert->update_status = null;
                    $expert->update_reject_reason = null;
                }
                $expert->save();
            }
            unset($data['cover']);
        }
        // Normalize location: only compute if address/location fields were submitted
        if ($request->hasAny(['alamat_kota', 'alamat_provinsi', 'alamat_lengkap', 'location'])) {
            $city = $data['alamat_kota'] ?? $expert->alamat_kota;
            $prov = $data['alamat_provinsi'] ?? $expert->alamat_provinsi;
            $addr = $data['alamat_lengkap'] ?? $expert->alamat_lengkap;
            $rawLoc = $data['location'] ?? $expert->location;

            if ($city || $prov) {
                $data['location'] = trim(($city ? $city : '') . ($prov ? ($city ? ', ' : '') . $prov : ''));
            } elseif ($addr) {
                $data['location'] = $addr;
            } elseif ($rawLoc && !str_starts_with($rawLoc, 'Lat:')) {
                $data['location'] = $rawLoc;
            }
        }

        // JIKA PROFIL SUDAH AKTIF:
        // Cek apakah user saat ini sudah aktif sebagai Tenaga Ahli
        $isCurrentlyTenagaAhli = $expert->is_tenaga_ahli ||
            $expert->kriteria === 'Tenaga Ahli' ||
            (is_array($expert->kriteria_list) && in_array('Tenaga Ahli', $expert->kriteria_list)) ||
            ($expert->user && $expert->user->role_type === 'tenaga_ahli');

        // Jika user adalah Tenaga Ahli yang sudah aktif:
        // Menambahkan / mencentang Surveyor atau Tenaga Teknis langsung diterapkan
        // agar user langsung muncul di hasil pencarian Tenaga Ahli dan Surveyor/Tenaga Teknis!
        if ($expert->profile_status === 'aktif' && $isCurrentlyTenagaAhli && isset($data['kriteria_list'])) {
            $allowedCriteria = ['Tenaga Ahli', 'Tenaga Teknis', 'Surveyor'];
            $submittedList = array_values(array_intersect(array_values(array_unique(array_filter((array)$data['kriteria_list']))), $allowedCriteria));
            // Pastikan Tenaga Ahli tetap ada di list
            if (!in_array('Tenaga Ahli', $submittedList)) {
                $submittedList[] = 'Tenaga Ahli';
            }
            $expert->kriteria_list = $submittedList;
            $expert->save();
            unset($data['kriteria_list']);
        }

        // Sinkronkan nomor WhatsApp / phone & name langsung ke user akun
        if ($expert->user) {
            $userSync = [];
            if (isset($data['phone']) && $data['phone']) {
                $userSync['phone'] = $data['phone'];
            }
            if (isset($data['name']) && $data['name']) {
                $userSync['name'] = $data['name'];
            }
            if (!empty($userSync)) {
                $expert->user->update($userSync);
            }
        }

        // Simpan perubahan lain ke buffer pending_changes
        // Profil publik tetap menggunakan data lama hingga disetujui admin
        if ($expert->profile_status === 'aktif') {
            $currentPending = is_array($expert->pending_changes) ? $expert->pending_changes : [];

            // Bersihkan file pending lama jika di-replace
            if (isset($data['photo']) && isset($currentPending['photo']) && $currentPending['photo'] !== $data['photo']) {
                if ($currentPending['photo'] && \Storage::disk('public')->exists($currentPending['photo'])) {
                    \Storage::disk('public')->delete($currentPending['photo']);
                }
            }
            if (isset($data['cover']) && isset($currentPending['cover']) && $currentPending['cover'] !== $data['cover']) {
                if ($currentPending['cover'] && \Storage::disk('public')->exists($currentPending['cover'])) {
                    \Storage::disk('public')->delete($currentPending['cover']);
                }
            }

            // Filter data: HANYA simpan field yang benar-benar berbeda dari data aktif saat ini!
            $diffData = [];
            foreach ($data as $k => $v) {
                $currentVal = $expert->{$k} ?? null;
                $isSame = false;
                if (is_array($v) || is_array($currentVal)) {
                    $isSame = (json_encode($v) === json_encode($currentVal));
                } elseif (is_numeric($v) && is_numeric($currentVal)) {
                    $isSame = ((float)$v === (float)$currentVal);
                } else {
                    $isSame = (trim((string)($v ?? '')) === trim((string)($currentVal ?? '')));
                }

                if (!$isSame) {
                    $diffData[$k] = $v;
                } else {
                    // Jika di pending lama ada key ini tapi sekarang nilainya sama dengan data aktif, buang dari pending
                    unset($currentPending[$k]);
                }
            }

            $mergedPending = array_merge($currentPending, $diffData);

            if (empty($mergedPending)) {
                $expert->update([
                    'pending_changes'      => null,
                    'update_status'        => null,
                    'update_reject_reason' => null,
                ]);
            } else {
                $expert->update([
                    'pending_changes'      => $mergedPending,
                    'update_status'        => 'menunggu_verifikasi',
                    'update_reject_reason' => null,
                    'update_submitted_at'  => now(),
                ]);
            }

            $expert->refresh();
            return response()->json($expert);
        }

        $expert->update($data);

        if ($expert->profile_status === 'ditolak') {
            $expert->update(['profile_status' => 'draft', 'reject_reason' => null]);
        }

        // Check apakah profil sudah lengkap 100% dan award poin
        $pointService = new PointService();
        if (PointService::isProfileComplete($expert)) {
            $pointService->awardPoints($expert->user_id, 'complete_profile', 'Melengkapi profil 100%');
        }

        // Refresh dari DB agar response mengembalikan data terbaru
        $expert->refresh();

        return response()->json($expert);
    }

    /**
     * Upload foto galeri dokumentasi (Maksimal 2MB)
     */
    public function uploadGalleryPhoto(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'photo' => ['required', 'file', 'image', 'mimes:jpeg,png,jpg,webp', 'max:2048'], // 2048 KB = 2MB
        ], [
            'photo.required' => 'File foto wajib dipilih.',
            'photo.image'    => 'File harus berupa gambar.',
            'photo.mimes'    => 'Format gambar harus JPG, JPEG, PNG, atau WebP.',
            'photo.max'      => 'Ukuran foto maksimal 2MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $path = $request->file('photo')->store('experts/gallery', 'public');
        $url = asset('storage/' . $path);

        return response()->json([
            'path'    => $path,
            'url'     => $url,
            'message' => 'Foto galeri berhasil diunggah.',
        ]);
    }

    public function cancelUpdate(Request $request)
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->firstOrFail();

        if ($expert->update_status !== 'menunggu_verifikasi') {
            return response()->json(['message' => 'Tidak ada pengajuan pembaruan yang sedang menunggu verifikasi.'], 400);
        }

        if (!empty($expert->pending_changes)) {
            $pending = $expert->pending_changes;
            if (!empty($pending['photo']) && \Storage::disk('public')->exists($pending['photo'])) {
                \Storage::disk('public')->delete($pending['photo']);
            }
            if (!empty($pending['cover']) && \Storage::disk('public')->exists($pending['cover'])) {
                \Storage::disk('public')->delete($pending['cover']);
            }
        }

        $expert->update([
            'pending_changes'      => null,
            'update_status'        => null,
            'update_reject_reason' => null,
            'update_submitted_at'  => null,
        ]);

        $expert->refresh();

        return response()->json([
            'message' => 'Pengajuan pembaruan profil berhasil dibatalkan.',
            'expert'  => $expert,
        ]);
    }

    public function submitForVerification(Request $request)
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->firstOrFail();

        $missing = $this->checkCompleteness($expert);
        if (!empty($missing)) {
            return response()->json([
                'message' => 'Profil belum lengkap.',
                'missing' => $missing,
            ], 422);
        }

        if (!$expert->package_id) {
            return response()->json(['message' => 'Silakan pilih paket terlebih dahulu.'], 422);
        }

        $package = Package::find($expert->package_id);
        if ($package && $package->price > 0) {
            $order = Order::where('user_id', $user->id)
                ->where('package_id', $package->id)
                ->latest()
                ->first();

            if (!$order || !in_array($order->status, ['menunggu_verifikasi', 'verified', 'paid'])) {
                return response()->json(['message' => 'Silakan selesaikan pembayaran terlebih dahulu.'], 422);
            }
        }

        $expert->update(['profile_status' => 'menunggu_verifikasi']);

        return response()->json($expert);
    }

    private function checkCompleteness(Expert $expert): array
    {
        $missing = [];
        if (!$expert->name) $missing[] = 'Nama';
        if (!$expert->institution) $missing[] = 'Instansi';
        if (!$expert->field) $missing[] = 'Bidang Keahlian';
        if (!$expert->alamat_kota) $missing[] = 'Kota';
        if ($expert->educations()->count() === 0) $missing[] = 'Pendidikan (minimal 1)';

        return $missing;
    }

    // ================== ADMIN CRUD ==================

    public function adminIndex(Request $request)
    {
        $query = Expert::with(['user:id,name,email,role,role_type,membership_level,package', 'educations', 'experiences', 'certificates', 'documents'])
            ->orderByDesc('created_at');

        // Filter Role: Tenaga Teknis vs Tenaga Ahli vs Surveyor vs All Roles
        if ($request->boolean('all_roles') || $request->input('role_type') === 'all' || $request->input('scope') === 'verification') {
            // Halaman Verifikasi: tampilkan SEMUA pendaftar (Tenaga Ahli, Tenaga Teknis, dan Surveyor)
        } elseif ($request->input('role_type') === 'surveyor' || $request->boolean('only_surveyor')) {
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
            // Menu Manajemen Tenaga Ahli: sertakan semua Tenaga Ahli (termasuk yang juga surveyor/tenaga teknis)
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
            // Default: jika status verifikasi disediakan, jangan kecualikan role apapun
            if ($request->filled('status') && in_array($request->status, ['menunggu_verifikasi', 'pembaruan_profil', 'aktif', 'ditolak'])) {
                // Biarkan semua masuk ke dalam antrean verifikasi
            } else {
                // Menu Tenaga Ahli: sertakan jika memiliki kriteria Tenaga Ahli, atau kecualikan surveyor murni
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
        }

        if ($request->filled('status')) {
            if ($request->status === 'pembaruan_profil') {
                $query->where('update_status', 'menunggu_verifikasi');
            } else {
                $query->where('profile_status', $request->status);
            }
        }

        if ($request->filled('update_status')) {
            $query->where('update_status', $request->update_status);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'institution' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'field' => ['nullable', 'string', 'max:255'],
            'kriteria' => ['nullable', 'string', 'max:255'],
            'alamat_kota' => ['nullable', 'string', 'max:255'],
            'alamat_provinsi' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'string'],
            'verified' => ['nullable', 'boolean'],
            'featured' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $data = $validator->validated();
        $data['slug'] = Str::slug($request->name).'-'.Str::random(5);
        $data['profile_status'] = 'aktif';

        $expert = Expert::create($data);

        return response()->json($expert, 201);
    }

    public function update(Request $request, $id)
    {
        $expert = Expert::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'max:255'],
            'institution' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'field' => ['nullable', 'string', 'max:255'],
            'kriteria' => ['nullable', 'string', 'max:255'],
            'alamat_kota' => ['nullable', 'string', 'max:255'],
            'alamat_provinsi' => ['nullable', 'string', 'max:255'],
            'photo' => ['nullable', 'string'],
            'verified' => ['nullable', 'boolean'],
            'featured' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $expert->update($validator->validated());

        return response()->json($expert);
    }

    public function destroy($id)
    {
        Expert::findOrFail($id)->delete();

        return response()->json(['message' => 'Tenaga ahli berhasil dihapus']);
    }

    // ================== ADMIN VERIFIKASI PROFIL ==================

    public function verifyProfile(Request $request, $id)
    {
        $expert = Expert::with('user')->findOrFail($id);

        $missing = $this->checkCompleteness($expert);
        if (!empty($missing)) {
            return response()->json(['message' => 'Profil belum lengkap, tidak bisa disetujui.', 'missing' => $missing], 422);
        }

        $expert->update(['profile_status' => 'aktif', 'verified' => true, 'reject_reason' => null]);

        // Jika pendaftar memiliki kriteria Tenaga Ahli, pastikan role_type user adalah tenaga_ahli
        if (
            (is_array($expert->kriteria_list) && in_array('Tenaga Ahli', $expert->kriteria_list)) ||
            $expert->kriteria === 'Tenaga Ahli'
        ) {
            if ($expert->user && $expert->user->role_type !== 'tenaga_ahli') {
                $expert->user->update([
                    'role_type'      => 'tenaga_ahli',
                    'is_also_expert' => true,
                ]);
            }
        }

        // Auto-assign paket Free jika user belum punya paket
        if (!$expert->package_id) {
            $freePackage = Package::where('price', 0)->first();
            if ($freePackage) {
                $expert->update(['package_id' => $freePackage->id]);
            }
        }

        // Kirim email notifikasi ke user
        $recipientEmail = $expert->user?->email ?? $expert->email;
        if ($recipientEmail) {
            $loginUrl = rtrim(config('app.frontend_url', config('app.url')), '/') . '/sign-in';
            try {
                Mail::to($recipientEmail)->send(new RegistrationApproved($expert, $loginUrl));
            } catch (\Throwable $e) {
                // Gagal kirim email tidak boleh membatalkan verifikasi
                \Log::warning('Gagal kirim email RegistrationApproved: ' . $e->getMessage());
            }
        }

        return response()->json($expert);
    }

    public function rejectProfile(Request $request, $id)
    {
        $expert = Expert::with('user')->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'reject_reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $reason = $request->reject_reason ?? '';

        $expert->update([
            'profile_status' => 'ditolak',
            'reject_reason'  => $reason,
        ]);

        // Kirim email notifikasi ke user
        $recipientEmail = $expert->user?->email ?? $expert->email;
        if ($recipientEmail) {
            $loginUrl = rtrim(config('app.frontend_url', config('app.url')), '/') . '/sign-in';
            try {
                Mail::to($recipientEmail)->send(new RegistrationRejected($expert, $reason, $loginUrl));
            } catch (\Throwable $e) {
                \Log::warning('Gagal kirim email RegistrationRejected: ' . $e->getMessage());
            }
        }

        return response()->json($expert);
    }

    public function approveUpdate(Request $request, $id)
    {
        $expert = Expert::findOrFail($id);

        if ($expert->update_status !== 'menunggu_verifikasi' || empty($expert->pending_changes)) {
            return response()->json(['message' => 'Tidak ada pembaruan profil yang menunggu persetujuan.'], 400);
        }

        $pending = $expert->pending_changes;

        // Cek apakah pengajuan ini meng-upgrade peran menjadi Tenaga Ahli
        $wasTenagaAhli = $expert->is_tenaga_ahli ||
            $expert->kriteria === 'Tenaga Ahli' ||
            (is_array($expert->kriteria_list) && in_array('Tenaga Ahli', $expert->kriteria_list)) ||
            ($expert->user && $expert->user->role_type === 'tenaga_ahli');

        $newKriteriaList = $pending['kriteria_list'] ?? $expert->kriteria_list;
        $newKriteria = $pending['kriteria'] ?? $expert->kriteria;

        $nowTenagaAhli = (is_array($newKriteriaList) && in_array('Tenaga Ahli', $newKriteriaList)) ||
            $newKriteria === 'Tenaga Ahli';

        $isUpgradingToTenagaAhli = (!$wasTenagaAhli && $nowTenagaAhli);

        if ($isUpgradingToTenagaAhli) {
            // 1. Update user role_type ke tenaga_ahli
            if ($expert->user) {
                $expert->user->update([
                    'role_type'      => 'tenaga_ahli',
                    'is_also_expert' => true,
                ]);
            }
            if (empty($expert->kriteria) || $expert->kriteria !== 'Tenaga Ahli') {
                $expert->kriteria = 'Tenaga Ahli';
            }

            // 2. Jika user sebelumnya memiliki paket berbayar (surveyor / tenaga teknis):
            // Sesuai aturan: paket sebelumnya hilang dan harus bayar lagi dengan harga tenaga ahli
            $currentPackage = $expert->package;
            if (($currentPackage && $currentPackage->price > 0) || ($expert->package_id && $expert->package_id > 1)) {
                $freePackage = Package::where('price', 0)->first();
                $expert->package_id = $freePackage?->id ?? 1;
                $expert->package_expires_at = null;

                if ($expert->user) {
                    $expert->user->update([
                        'package'            => 'free',
                        'premium_expires_at' => null,
                    ]);
                }

                // Invalidate / expire transaksi order lama
                \App\Models\Order::where('user_id', $expert->user_id)
                    ->whereIn('status', ['menunggu_pembayaran', 'menunggu_verifikasi', 'verified'])
                    ->update([
                        'status' => 'rejected',
                        'reject_reason' => 'Paket sebelumnya dibatalkan karena upgrade kriteria ke Tenaga Ahli. Silakan pilih dan bayar paket Tenaga Ahli.',
                    ]);
            }

            // Hapus package_id dari pending_changes jika ada agar tidak menimpa paket
            unset($pending['package_id']);
        }

        // Foto baru
        if (array_key_exists('photo', $pending)) {
            $newPhoto = $pending['photo'];
            if ($newPhoto === null) {
                if ($expert->photo && \Storage::disk('public')->exists($expert->photo)) {
                    \Storage::disk('public')->delete($expert->photo);
                }
                $expert->photo = null;
            } elseif ($newPhoto) {
                if ($expert->photo && \Storage::disk('public')->exists($expert->photo)) {
                    \Storage::disk('public')->delete($expert->photo);
                }
                $expert->photo = $newPhoto;
            }
            unset($pending['photo']);
        }

        // Cover baru
        if (array_key_exists('cover', $pending)) {
            $newCover = $pending['cover'];
            if ($newCover === null) {
                if ($expert->cover && \Storage::disk('public')->exists($expert->cover)) {
                    \Storage::disk('public')->delete($expert->cover);
                }
                $expert->cover = null;
            } elseif ($newCover) {
                if ($expert->cover && \Storage::disk('public')->exists($expert->cover)) {
                    \Storage::disk('public')->delete($expert->cover);
                }
                $expert->cover = $newCover;
            }
            unset($pending['cover']);
        }

        // KTP baru
        if (array_key_exists('ktp_path', $pending)) {
            $newKtp = $pending['ktp_path'];
            if ($newKtp) {
                if ($expert->ktp_path && $expert->ktp_path !== $newKtp && \Storage::disk('public')->exists($expert->ktp_path)) {
                    \Storage::disk('public')->delete($expert->ktp_path);
                }
                $expert->ktp_path = $newKtp;
            }
            unset($pending['ktp_path']);
        }

        if (isset($pending['kriteria_list']) && is_array($pending['kriteria_list'])) {
            $allowedCriteria = ['Tenaga Ahli', 'Tenaga Teknis', 'Surveyor'];
            $pending['kriteria_list'] = array_values(array_intersect($pending['kriteria_list'], $allowedCriteria));
            if (empty($pending['kriteria_list'])) {
                $pending['kriteria_list'] = ['Tenaga Ahli'];
            }
        }

        // Terapkan semua field pending ke data profil utama
        foreach ($pending as $key => $value) {
            $expert->{$key} = $value;
        }

        // Ketika admin menyetujui pembaruan profil / KTP -> tandai akun terverifikasi
        $expert->verified = true;

        $expert->pending_changes = null;
        $expert->update_status = 'disetujui';
        $expert->update_reject_reason = null;
        $expert->save();

        $expert->refresh();

        return response()->json([
            'message' => 'Pembaruan profil berhasil disetujui dan diterapkan.',
            'expert'  => $expert
        ]);
    }

    public function rejectUpdate(Request $request, $id)
    {
        $expert = Expert::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'reject_reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $reason = $request->input('reject_reason', 'Perubahan profil tidak disetujui oleh admin.');

        // Hapus file pending yang tidak disetujui agar tidak menjadi sampah
        if (!empty($expert->pending_changes)) {
            $pending = $expert->pending_changes;
            if (!empty($pending['photo']) && \Storage::disk('public')->exists($pending['photo'])) {
                \Storage::disk('public')->delete($pending['photo']);
            }
            if (!empty($pending['cover']) && \Storage::disk('public')->exists($pending['cover'])) {
                \Storage::disk('public')->delete($pending['cover']);
            }
            if (!empty($pending['ktp_path']) && \Storage::disk('public')->exists($pending['ktp_path'])) {
                \Storage::disk('public')->delete($pending['ktp_path']);
            }
        }

        $expert->update([
            'pending_changes'      => null,
            'update_status'        => 'ditolak',
            'update_reject_reason' => $reason,
        ]);

        $expert->refresh();

        return response()->json([
            'message' => 'Pembaruan profil telah ditolak.',
            'expert'  => $expert
        ]);
    }

    // ================== ADMIN NONAKTIFKAN / AKTIFKAN AKUN ==================

    public function deactivateProfile(Request $request, $id)
    {
        $expert = Expert::findOrFail($id);

        // Toggle: jika sudah nonaktif, aktifkan kembali; jika aktif, nonaktifkan
        if ($expert->profile_status === 'nonaktif') {
            $expert->update(['profile_status' => 'aktif']);
        } else {
            $expert->update(['profile_status' => 'nonaktif']);
        }

        return response()->json($expert);
    }

    // ================== ADMIN DASHBOARD STATS ==================

    public function dashboardStats()
    {
        $totalPendaftar = Expert::count();

        // Total Surveyor: kriteria mengandung Surveyor atau role_type user adalah surveyor
        $totalSurveyor = Expert::where(function ($q) {
            $q->where('kriteria', 'LIKE', '%Surveyor%')
              ->orWhere('kriteria_list', 'LIKE', '%Surveyor%');
        })->orWhereHas('user', function ($q) {
            $q->where('role_type', 'surveyor');
        })->count();

        // Total Tenaga Ahli (aktif) - kecualikan surveyor dan tenaga teknis
        $totalTenagaAhli = Expert::where('profile_status', 'aktif')
            ->where(function ($q) {
                $q->where('kriteria', 'NOT LIKE', '%Surveyor%')
                  ->orWhereNull('kriteria');
            })
            ->where(function ($q) {
                $q->where('kriteria', 'NOT LIKE', '%Tenaga Teknis%')
                  ->orWhereNull('kriteria');
            })
            ->where(function ($q) {
                $q->whereHas('user', function ($uq) {
                    $uq->whereNotIn('role_type', ['surveyor', 'tenaga_teknis']);
                })->orWhereDoesntHave('user');
            })
            ->count();

        // Total Tenaga Teknis (aktif)
        $totalTenagaTeknis = Expert::where('profile_status', 'aktif')
            ->where(function ($q) {
                $q->where('kriteria', 'LIKE', '%Tenaga Teknis%')
                  ->orWhere('kriteria_list', 'LIKE', '%Tenaga Teknis%')
                  ->orWhere('field', 'LIKE', '%Tenaga Teknis%')
                  ->orWhereHas('user', function ($uq) {
                      $uq->where('role_type', 'tenaga_teknis');
                  });
            })
            ->count();

        $pendingVerifikasi = Expert::where('profile_status', 'menunggu_verifikasi')->count();

        // Pengguna free: expert yang punya paket gratis (price=0) atau tanpa paket
        $freePackageIds = Package::where('price', 0)->pluck('id')->toArray();
        $penggunaFree = Expert::where(function ($q) use ($freePackageIds) {
            $q->whereNull('package_id')
              ->orWhereIn('package_id', $freePackageIds);
        })->count();

        // Pengguna premium: expert yang punya order verified (paket berbayar)
        $penggunaPremium = Order::where('status', 'verified')
            ->distinct('user_id')
            ->count('user_id');

        // Pengguna platinum/ekslusif: package platinum/ekslusif atau order paket ekslusif
        $penggunaPlatinum = User::whereIn('package', ['platinum', 'eksklusif', 'ekslusif', 'esklusif'])->count();
        $platinumPackageIds = Package::where('name', 'LIKE', '%platinum%')
            ->orWhere('slug', 'LIKE', '%platinum%')
            ->orWhere('name', 'LIKE', '%eksklusif%')
            ->orWhere('slug', 'LIKE', '%eksklusif%')
            ->orWhere('name', 'LIKE', '%ekslusif%')
            ->orWhere('slug', 'LIKE', '%ekslusif%')
            ->pluck('id')
            ->toArray();
        if (!empty($platinumPackageIds)) {
            $orderPlatinumCount = Order::where('status', 'verified')
                ->whereIn('package_id', $platinumPackageIds)
                ->distinct('user_id')
                ->count('user_id');
            $penggunaPlatinum = max($penggunaPlatinum, $orderPlatinumCount);
        }

        // Tren pendaftaran 6 bulan terakhir untuk grafik
        $monthlyTrends = [];
        for ($i = 5; $i >= 0; $i--) {
            $monthDate = now()->subMonths($i);
            $monthLabel = $monthDate->translatedFormat('M Y');
            
            $pendaftarCount = Expert::whereYear('created_at', $monthDate->year)
                ->whereMonth('created_at', $monthDate->month)
                ->count();

            $surveyorCount = Expert::where(function ($q) {
                $q->where('kriteria', 'LIKE', '%Surveyor%')
                  ->orWhere('kriteria_list', 'LIKE', '%Surveyor%');
            })->whereYear('created_at', $monthDate->year)
              ->whereMonth('created_at', $monthDate->month)
              ->count();

            $tenagaTeknisCount = Expert::where(function ($q) {
                $q->where('kriteria', 'LIKE', '%Tenaga Teknis%')
                  ->orWhere('kriteria_list', 'LIKE', '%Tenaga Teknis%')
                  ->orWhereHas('user', function ($uq) {
                      $uq->where('role_type', 'tenaga_teknis');
                  });
            })->whereYear('created_at', $monthDate->year)
              ->whereMonth('created_at', $monthDate->month)
              ->count();

            $monthlyTrends[] = [
                'month' => $monthLabel,
                'pendaftar' => $pendaftarCount,
                'surveyor' => $surveyorCount,
                'tenaga_teknis' => $tenagaTeknisCount,
                'tenaga_ahli' => max(0, $pendaftarCount - $surveyorCount - $tenagaTeknisCount),
            ];
        }

        return response()->json([
            'total_pendaftar' => $totalPendaftar,
            'total_tenaga_ahli' => $totalTenagaAhli,
            'total_tenaga_teknis' => $totalTenagaTeknis,
            'total_surveyor' => $totalSurveyor,
            'pending_verifikasi' => $pendingVerifikasi,
            'pengguna_free' => $penggunaFree,
            'pengguna_premium' => $penggunaPremium,
            'pengguna_platinum' => $penggunaPlatinum,
            'monthly_trends' => $monthlyTrends,
        ]);
    }

    // ================== JADWAL & TARIF KONSULTASI ==================

    /**
     * GET /api/my/expert-schedule
     * Mengambil jadwal & tarif ahli yang sedang login beserta slot yang sudah dibooking.
     */
    public function getMySchedule(Request $request)
    {
        $user = $request->user();
        $query = Expert::where('user_id', $user->id);
        if ($request->filled('role_type')) {
            $kriteria = $request->role_type === 'surveyor' ? 'Surveyor' : ($request->role_type === 'tenaga_teknis' ? 'Tenaga Teknis' : 'Tenaga Ahli');
            $query->where('kriteria', $kriteria);
        } elseif ($user->role_type === 'surveyor') {
            $query->where('kriteria', 'Surveyor');
        } elseif ($user->role_type === 'tenaga_teknis') {
            $query->where('kriteria', 'Tenaga Teknis');
        }
        $expert = $query->first() ?? Expert::where('user_id', $user->id)->first();

        if (!$expert) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Profil tenaga ahli/surveyor tidak ditemukan.',
            ], 404);
        }

        $defaultSchedule = [
            'senin'  => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'selasa' => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'rabu'   => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'kamis'  => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'jumat'  => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'sabtu'  => [],
            'minggu' => [],
        ];

        $defaultPricing = [
            'chat'  => ['enabled' => true, 'price' => 150000],
            'email' => ['enabled' => true, 'price' => 100000],
            'zoom'  => ['enabled' => true, 'price' => 250000, 'zoomLink' => ''],
        ];

        // Ambil booking aktif dari hari ini ke depan (mendukung multi-slot jam booking)
        $consultations = Consultation::where('expert_id', $expert->id)
            ->whereDate('consultation_date', '>=', now()->toDateString())
            ->whereNotIn('status', ['dibatalkan', 'ditolak'])
            ->get(['id', 'consultation_date', 'consultation_time', 'client_name', 'service_type', 'status']);

        $bookedSlots = [];
        foreach ($consultations as $c) {
            $rawTime = (string) $c->consultation_time;
            $times = preg_split('/[,;\n]+/', $rawTime);
            foreach ($times as $t) {
                $timeClean = trim(str_replace(['WIB', 'wib', '(30 menit)', '(15 menit)', '(30 mnt)', '(15 mnt)'], '', $t));
                if (str_contains($timeClean, '-')) {
                    $timeClean = trim(explode('-', $timeClean)[0]);
                }
                if ($timeClean !== '') {
                    $bookedSlots[] = [
                        'id'       => $c->id,
                        'date'     => Carbon::parse($c->consultation_date)->toDateString(),
                        'time'     => $timeClean,
                        'raw_time' => $c->consultation_time,
                        'client'   => $c->client_name,
                        'service'  => strtolower($c->service_type),
                        'status'   => $c->status,
                    ];
                }
            }
        }

        $pkgName = optional($expert->package)->name ?? '';
        $pkgSlug = optional($expert->package)->slug ?? '';
        $userPkg = optional($expert->user)->package ?? '';
        $isPlatinum = str_contains(strtolower($pkgName), 'platinum')
            || str_contains(strtolower($pkgSlug), 'platinum')
            || str_contains(strtolower($userPkg), 'platinum')
            || str_contains(strtolower($pkgName), 'eksklusif')
            || str_contains(strtolower($pkgSlug), 'eksklusif')
            || str_contains(strtolower($userPkg), 'eksklusif')
            || str_contains(strtolower($pkgName), 'esklusif')
            || str_contains(strtolower($pkgSlug), 'esklusif')
            || str_contains(strtolower($pkgName), 'ekslusif')
            || str_contains(strtolower($pkgSlug), 'ekslusif')
            || str_contains(strtolower($userPkg), 'ekslusif');
        $isPremium = $isPlatinum
            || ($expert->package_id && optional($expert->package)->price > 0)
            || (bool)optional($expert->user)->isPremium()
            || (bool)$expert->featured
            || str_contains(strtolower($pkgName), 'premium')
            || str_contains(strtolower($pkgSlug), 'premium')
            || str_contains(strtolower($userPkg), 'premium')
            || str_contains(strtolower($pkgName), 'ekonomis')
            || str_contains(strtolower($pkgSlug), 'ekonomis')
            || str_contains(strtolower($userPkg), 'ekonomis');

        return response()->json([
            'status'       => 'success',
            'schedule'     => $expert->schedule ?: $defaultSchedule,
            'pricing'      => $expert->pricing ?: $defaultPricing,
            'booked_slots' => $bookedSlots,
            'expert'       => [
                'id'               => $expert->id,
                'package'          => $expert->package,
                'package_name'     => $pkgName ?: ($isPlatinum ? 'Paket Eksklusif' : ($isPremium ? 'Paket Ekonomis' : 'Paket Biasa')),
                'is_platinum'      => $isPlatinum,
                'is_premium'       => $isPremium,
                'membership_level' => optional($expert->user)->membership_level ?? ($isPlatinum ? 'platinum' : ($isPremium ? 'premium' : 'free')),
            ],
        ]);
    }

    /**
     * POST /api/my/expert-schedule
     * Menyimpan jadwal & tarif ahli ke database.
     */
    public function saveMySchedule(Request $request)
    {
        $user = $request->user();
        $query = Expert::where('user_id', $user->id);
        if ($request->filled('role_type')) {
            $kriteria = $request->role_type === 'surveyor' ? 'Surveyor' : ($request->role_type === 'tenaga_teknis' ? 'Tenaga Teknis' : 'Tenaga Ahli');
            $query->where('kriteria', $kriteria);
        } elseif ($user->role_type === 'surveyor') {
            $query->where('kriteria', 'Surveyor');
        } elseif ($user->role_type === 'tenaga_teknis') {
            $query->where('kriteria', 'Tenaga Teknis');
        }
        $expert = $query->first() ?? Expert::where('user_id', $user->id)->first();

        if (!$expert) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Profil tenaga ahli/surveyor tidak ditemukan.',
            ], 404);
        }

        $validator = Validator::make($request->all(), [
            'schedule' => ['required', 'array'],
            'pricing'  => ['nullable', 'array'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $expert->schedule = $request->schedule;
        if ($request->has('pricing')) {
            $expert->pricing = $request->pricing;
        }
        $expert->save();

        return response()->json([
            'status'   => 'success',
            'message'  => 'Pengaturan jadwal dan tarif berhasil disimpan.',
            'schedule' => $expert->schedule,
            'pricing'  => $expert->pricing,
        ]);
    }

    /**
     * GET /api/experts/{slug}/schedule
     * Endpoint publik untuk melihat jadwal & ketersediaan slot ahli.
     */
    public function getPublicSchedule(string $slug)
    {
        $expert = Expert::where('slug', $slug)
            ->where('profile_status', 'aktif')
            ->firstOrFail();

        $defaultSchedule = [
            'senin'  => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'selasa' => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'rabu'   => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'kamis'  => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'jumat'  => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'sabtu'  => [],
            'minggu' => [],
        ];

        // Ambil booking dari besok ke depan (mendukung multi-slot jam booking)
        $consultations = Consultation::where('expert_id', $expert->id)
            ->whereDate('consultation_date', '>=', Carbon::now('Asia/Jakarta')->addDay()->toDateString())
            ->whereNotIn('status', ['dibatalkan', 'ditolak'])
            ->get(['consultation_date', 'consultation_time']);

        $bookedSlots = [];
        foreach ($consultations as $c) {
            $rawTime = (string) $c->consultation_time;
            $times = preg_split('/[,;\n]+/', $rawTime);
            foreach ($times as $t) {
                $timeClean = trim(str_replace(['WIB', 'wib', '(30 menit)', '(15 menit)', '(30 mnt)', '(15 mnt)'], '', $t));
                if (str_contains($timeClean, '-')) {
                    $timeClean = trim(explode('-', $timeClean)[0]);
                }
                if ($timeClean !== '') {
                    $bookedSlots[] = [
                        'date' => Carbon::parse($c->consultation_date)->toDateString(),
                        'time' => $timeClean,
                    ];
                }
            }
        }

        return response()->json([
            'status'       => 'success',
            'schedule'     => $expert->schedule ?: $defaultSchedule,
            'pricing'      => $expert->pricing,
            'booked_slots' => $bookedSlots,
        ]);
    }
}
