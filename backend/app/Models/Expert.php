<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Expert extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'profile_status', 'reject_reason', 'package_id', 'package_expires_at',
        'pending_changes', 'update_status', 'update_reject_reason', 'update_submitted_at',
        'slug', 'name', 'field', 'kriteria', 'kriteria_list',
        'location', 'lat', 'lng', 'rating', 'photo', 'cover', 'verified', 'featured',
        'institution', 'active_since', 'email', 'phone', 'tempat_lahir', 'tanggal_lahir',
        'pendidikan', 'catatan', 'cv_path', 'bukti_kompetensi_path', 'ktp_path', 'keahlian', 'alamat_lengkap',
        'alamat_kota', 'alamat_provinsi', 'lokasi_label', 'sosial',
        'narasumber_riwayat', 'kajian_riwayat',
        // Profil Bio
        'tentang_saya', 'ringkasan_keahlian', 'bidang_utama', 'spesialisasi', 'kompetensi', 'hashtags',
        // Link Akademik
        'scopus_url', 'scopus_metrics', 'google_scholar_url', 'google_scholar_metrics',
        'sinta_url', 'sinta_metrics', 'orcid_url', 'orcid_metrics',
        'researchgate_url', 'researchgate_metrics',
        // Reviewer, Publikasi, Organisasi, Instruktur, Pengalaman Proyek & Penelitian
        'reviewer_jurnal', 'publikasi', 'organisasi', 'instruktur', 'pengalaman_proyek', 'total_proyek', 'total_jurnal', 'pengalaman_penelitian',
        // Galeri & Video Portofolio
        'gallery', 'video_url', 'video_title', 'video_description',
        // Presence
        'last_seen_at', 'is_online',
        // Wallet
        'wallet_balance', 'total_earned',
        // Schedule & Pricing
        'schedule', 'pricing',
        // Bank / Rekening
        'bank_name', 'bank_account', 'bank_account_name',
        // Membership Medal & Annual Cycle
        'membership_cycle_start', 'medal_tier', 'medal_consultations_count',
        'medal_previous_tier', 'medal_highest_tier', 'medal_last_evaluated_at',
    ];

    protected $appends = [
        'is_surveyor',
        'is_tenaga_teknis',
        'role_label',
        'is_premium',
        'consultation_medal',
        'photo_url',
    ];

    public function getPhotoUrlAttribute(): ?string
    {
        if (!$this->photo) {
            return null;
        }
        if (filter_var($this->photo, FILTER_VALIDATE_URL)) {
            return $this->photo;
        }
        return asset('storage/' . ltrim(str_replace('\\', '/', $this->photo), '/'));
    }

    public function getConsultationMedalAttribute(): array
    {
        $service = app(\App\Services\MembershipMedalService::class);
        return $service->formatBadgeDataFromModel($this);
    }

    public function getIsPremiumAttribute(): bool
    {
        if ($this->package && $this->package->price > 0) {
            if ($this->package_expires_at && now()->greaterThan($this->package_expires_at)) {
                return false;
            }
            return true;
        }
        return false;
    }

    public function getIsSurveyorAttribute(): bool
    {
        if ($this->relationLoaded('user') && $this->user) {
            if ($this->user->role_type === 'surveyor') {
                return true;
            }
        }
        $kriteria = strtolower((string) $this->kriteria);
        if (str_contains($kriteria, 'surveyor')) {
            return true;
        }
        if (is_array($this->kriteria_list)) {
            foreach ($this->kriteria_list as $k) {
                if (str_contains(strtolower((string) $k), 'surveyor')) {
                    return true;
                }
            }
        }
        $field = strtolower((string) $this->field);
        if (str_contains($field, 'surveyor')) {
            return true;
        }
        return false;
    }

    public function getIsTenagaTeknisAttribute(): bool
    {
        if ($this->relationLoaded('user') && $this->user) {
            if ($this->user->role_type === 'tenaga_teknis') {
                return true;
            }
        }
        $kriteria = strtolower((string) $this->kriteria);
        if (str_contains($kriteria, 'tenaga teknis')) {
            return true;
        }
        if (is_array($this->kriteria_list)) {
            foreach ($this->kriteria_list as $k) {
                if (str_contains(strtolower((string) $k), 'tenaga teknis')) {
                    return true;
                }
            }
        }
        $field = strtolower((string) $this->field);
        if (str_contains($field, 'tenaga teknis')) {
            return true;
        }
        return false;
    }

    public function getIsTenagaAhliAttribute(): bool
    {
        if ($this->relationLoaded('user') && $this->user) {
            if ($this->user->role_type === 'tenaga_ahli') {
                return true;
            }
        }
        $kriteria = strtolower((string) $this->kriteria);
        if (str_contains($kriteria, 'tenaga ahli') || $kriteria === 'ahli') {
            return true;
        }
        if (is_array($this->kriteria_list)) {
            foreach ($this->kriteria_list as $k) {
                $lk = strtolower((string) $k);
                if (str_contains($lk, 'tenaga ahli') || $lk === 'ahli') {
                    return true;
                }
            }
        }
        if (!$this->is_surveyor && !$this->is_tenaga_teknis) {
            return true;
        }
        return false;
    }

    public function getRoleLabelAttribute(): string
    {
        if ($this->is_tenaga_ahli) {
            return 'Tenaga Ahli';
        }
        if ($this->relationLoaded('user') && $this->user && $this->user->role_type === 'tenaga_teknis') {
            return 'Tenaga Teknis';
        }
        if (str_contains(strtolower((string)$this->kriteria), 'tenaga teknis') || $this->is_tenaga_teknis) {
            return 'Tenaga Teknis';
        }
        return $this->is_surveyor ? 'Surveyor' : 'Tenaga Ahli';
    }

    protected function casts(): array
    {
        return [
            'lat' => 'float',
            'lng' => 'float',
            'rating' => 'float',
            'verified' => 'boolean',
            'featured' => 'boolean',
            'last_seen_at' => 'datetime',
            'package_expires_at' => 'datetime',
            'is_online' => 'boolean',
            'kriteria_list' => 'array',
            'keahlian' => 'array',
            'spesialisasi' => 'array',
            'kompetensi' => 'array',
            'hashtags' => 'array',
            'sosial' => 'array',
            'narasumber_riwayat' => 'array',
            'kajian_riwayat' => 'array',
            'tanggal_lahir' => 'date:Y-m-d',
            'bidang_utama' => 'array',
            'reviewer_jurnal' => 'array',
            'publikasi' => 'array',
            'organisasi' => 'array',
            'instruktur' => 'array',
            'total_proyek' => 'integer',
            'total_jurnal' => 'integer',
            'pengalaman_proyek' => 'array',
            'pengalaman_penelitian' => 'array',
            'gallery' => 'array',
            'gallery_albums' => 'array',
            'schedule' => 'array',
            'pricing' => 'array',
            'pending_changes' => 'array',
            'update_submitted_at' => 'datetime',
            'membership_cycle_start' => 'datetime',
            'medal_last_evaluated_at' => 'datetime',
            'medal_consultations_count' => 'integer',
        ];
    }

    public function isOnline(): bool
    {
        if ($this->relationLoaded('user') && $this->user) {
            return (bool) ($this->user->is_online && $this->user->last_seen_at && $this->user->last_seen_at->gt(now()->subMinutes(2)));
        }
        if ($this->user) {
            return (bool) ($this->user->is_online && $this->user->last_seen_at && $this->user->last_seen_at->gt(now()->subMinutes(2)));
        }
        return (bool) ($this->is_online && $this->last_seen_at && $this->last_seen_at->gt(now()->subMinutes(2)));
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function educations()
    {
        return $this->hasMany(Education::class);
    }

    public function experiences()
    {
        return $this->hasMany(Experience::class);
    }

    public function certificates()
    {
        return $this->hasMany(Certificate::class);
    }

    public function documents()
    {
        return $this->hasMany(Document::class);
    }

    public function reviews()
    {
        return $this->hasMany(Review::class)->latest();
    }

    public function products()
    {
        return $this->hasMany(Product::class)->latest();
    }

    public static function kriteriaRouteMap(): array
    {
        return [
            'Narasumber/Pembicara' => '/narasumber',
            'Tenaga Ahli' => '/tenaga-ahli',
            'Instruktur Pengajar' => '/instruktur-pengajar',
            'Peneliti Artikel/Jurnal' => '/peneliti-artikel-jurnal',
        ];
    }
}
