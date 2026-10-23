<?php

namespace App\Services;

use App\Models\Consultation;
use App\Models\Expert;
use App\Models\Package;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class MembershipMedalService
{
    /**
     * Definisi tingkatan medali berdasarkan jumlah orang yang konsultasi per tahun.
     * Tahap 1: White   (1 - 10 orang/tahun)
     * Tahap 2: Blue    (11 - 30 orang/tahun)
     * Tahap 3: Silver  (31 - 50 orang/tahun)
     * Tahap 4: Gold    (51 - 75 orang/tahun)
     * Tahap 5: Platinum (76 - 100 orang/tahun)
     * Tahap 6: Diamond (> 100 orang/tahun)
     */
    public const TIERS = [
        'white' => [
            'name'        => 'White',
            'label'       => 'Medali White',
            'stage'       => 1,
            'min'         => 1,
            'max'         => 10,
            'color'       => '#94A3B8',
            'bg_color'    => '#F8FAFC',
            'border_color'=> '#CBD5E1',
            'text_color'  => '#334155',
            'icon'        => 'military_tech',
            'badge_style' => 'bg-slate-100 text-slate-700 border-slate-300',
            'glow_color'  => 'rgba(203, 213, 225, 0.6)',
        ],
        'blue' => [
            'name'        => 'Blue',
            'label'       => 'Medali Blue',
            'stage'       => 2,
            'min'         => 11,
            'max'         => 30,
            'color'       => '#2563EB',
            'bg_color'    => '#EFF6FF',
            'border_color'=> '#93C5FD',
            'text_color'  => '#1E40AF',
            'icon'        => 'military_tech',
            'badge_style' => 'bg-blue-50 text-blue-700 border-blue-300',
            'glow_color'  => 'rgba(59, 130, 246, 0.5)',
        ],
        'silver' => [
            'name'        => 'Silver',
            'label'       => 'Medali Silver',
            'stage'       => 3,
            'min'         => 31,
            'max'         => 50,
            'color'       => '#64748B',
            'bg_color'    => '#F1F5F9',
            'border_color'=> '#94A3B8',
            'text_color'  => '#1E293B',
            'icon'        => 'military_tech',
            'badge_style' => 'bg-slate-200 text-slate-800 border-slate-400',
            'glow_color'  => 'rgba(148, 163, 184, 0.6)',
        ],
        'gold' => [
            'name'        => 'Gold',
            'label'       => 'Medali Gold',
            'stage'       => 4,
            'min'         => 51,
            'max'         => 75,
            'color'       => '#D97706',
            'bg_color'    => '#FFFBEB',
            'border_color'=> '#FCD34D',
            'text_color'  => '#92400E',
            'icon'        => 'workspace_premium',
            'badge_style' => 'bg-amber-100 text-amber-900 border-amber-400',
            'glow_color'  => 'rgba(245, 158, 11, 0.6)',
        ],
        'platinum' => [
            'name'        => 'Platinum',
            'label'       => 'Medali Platinum',
            'stage'       => 5,
            'min'         => 76,
            'max'         => 100,
            'color'       => '#0891B2',
            'bg_color'    => '#ECFEFF',
            'border_color'=> '#67E8F9',
            'text_color'  => '#155E75',
            'icon'        => 'verified',
            'badge_style' => 'bg-cyan-100 text-cyan-900 border-cyan-400',
            'glow_color'  => 'rgba(6, 182, 212, 0.6)',
        ],
        'diamond' => [
            'name'        => 'Diamond',
            'label'       => 'Medali Diamond',
            'stage'       => 6,
            'min'         => 101,
            'max'         => PHP_INT_MAX,
            'color'       => '#7C3AED',
            'bg_color'    => '#F5F3FF',
            'border_color'=> '#C4B5FD',
            'text_color'  => '#5B21B6',
            'icon'        => 'diamond',
            'badge_style' => 'bg-purple-100 text-purple-900 border-purple-400',
            'glow_color'  => 'rgba(139, 92, 246, 0.6)',
        ],
    ];

    public const STAGE_ORDER = ['white', 'blue', 'silver', 'gold', 'platinum', 'diamond'];

    /**
     * Hitung tier berdasarkan jumlah orang yang konsultasi per tahun.
     */
    public function getTierByCount(int $count): ?string
    {
        if ($count <= 0) {
            return null; // Belum ada yang konsultasi satu pun -> badge tidak muncul
        }
        if ($count <= 10) {
            return 'white';
        }
        if ($count <= 30) {
            return 'blue';
        }
        if ($count <= 50) {
            return 'silver';
        }
        if ($count <= 75) {
            return 'gold';
        }
        if ($count <= 100) {
            return 'platinum';
        }
        return 'diamond';
    }

    /**
     * Bandingkan dua tier dan kembalikan tier yang lebih tinggi.
     */
    public function getHigherTier(?string $tierA, ?string $tierB): ?string
    {
        if (!$tierA) return $tierB;
        if (!$tierB) return $tierA;

        $rankA = self::TIERS[$tierA]['stage'] ?? 0;
        $rankB = self::TIERS[$tierB]['stage'] ?? 0;

        return $rankA >= $rankB ? $tierA : $tierB;
    }

    /**
     * Cek apakah expert berhak atas sistem medali:
     * - Paket Ekonomis atau Eksklusif (paket berbayar)
     * - Masa berlaku langganan belum habis (package_expires_at >= now())
     */
    public function isEligible(Expert $expert): bool
    {
        // 1. Cek masa aktif
        if (!$expert->package_expires_at) {
            return false;
        }
        if (now()->greaterThan($expert->package_expires_at)) {
            return false;
        }

        // 2. Cek paket Ekonomis / Eksklusif / Premium / Platinum
        $package = $expert->package;
        $pkgName = strtolower(optional($package)->name ?? '');
        $pkgSlug = strtolower(optional($package)->slug ?? '');
        $userPkg = strtolower(optional($expert->user)->package ?? '');

        $isPaid = (optional($package)->price > 0)
            || str_contains($pkgName, 'ekonomis')
            || str_contains($pkgSlug, 'ekonomis')
            || str_contains($userPkg, 'ekonomis')
            || str_contains($pkgName, 'ekslusif')
            || str_contains($pkgSlug, 'ekslusif')
            || str_contains($userPkg, 'ekslusif')
            || str_contains($pkgName, 'eksklusif')
            || str_contains($pkgSlug, 'eksklusif')
            || str_contains($userPkg, 'eksklusif')
            || str_contains($pkgName, 'esklusif')
            || str_contains($pkgSlug, 'esklusif')
            || str_contains($userPkg, 'esklusif')
            || str_contains($pkgName, 'premium')
            || str_contains($pkgSlug, 'premium')
            || str_contains($userPkg, 'premium')
            || str_contains($pkgName, 'platinum')
            || str_contains($pkgSlug, 'platinum')
            || str_contains($userPkg, 'platinum');

        return $isPaid;
    }

    /**
     * Hitung jumlah orang yang konsultasi dalam siklus keanggotaan tahun ini.
     */
    public function countConsultationsThisCycle(Expert $expert): int
    {
        $cycleStart = $expert->membership_cycle_start;
        $cycleEnd   = $expert->package_expires_at;

        if (!$cycleStart) {
            if ($cycleEnd) {
                $cycleStart = Carbon::parse($cycleEnd)->subYear();
            } else {
                $cycleStart = now()->subYear();
            }
        }

        if (!$cycleEnd) {
            $cycleEnd = Carbon::parse($cycleStart)->addYear();
        }

        // Hitung unique client pemohon konsultasi dengan status diterima/selesai
        return Consultation::where('expert_id', $expert->id)
            ->whereIn('status', ['selesai', 'dikonfirmasi', 'confirmed'])
            ->whereBetween('created_at', [$cycleStart, $cycleEnd])
            ->selectRaw('COUNT(DISTINCT COALESCE(NULLIF(user_id, 0), NULLIF(client_email, ""), id)) as client_count')
            ->value('client_count') ?: 0;
    }

    /**
     * Evaluasi dan perbarui status medali expert secara real-time.
     */
    public function evaluateAndSync(Expert $expert): array
    {
        $eligible = $this->isEligible($expert);

        if (!$eligible) {
            // Jika tidak eligible (misal paket biasa / expired) -> tidak ada badge
            if ($expert->medal_tier !== null) {
                $expert->update([
                    'medal_tier' => null,
                    'medal_last_evaluated_at' => now(),
                ]);
            }
            return $this->formatBadgeData($expert, false, null, 0);
        }

        // Hitung realisasi konsultasi tahun berjalan
        $count = $this->countConsultationsThisCycle($expert);
        $earnedTier = $this->getTierByCount($count);

        // Aturan Retensi & Peningkatan Medali:
        // Jika tahun sebelumnya dia sudah punya medali tertinggi (medal_previous_tier):
        // Dia mempertahankan medali tersebut selama dalam tahun berjalan.
        // Jika dalam tahun ini konsultasinya naik melampaui medali sebelumnya, dia naik peringkat!
        $previousTier = $expert->medal_previous_tier;
        $highestTier  = $expert->medal_highest_tier;

        $activeTier = $earnedTier;
        if ($previousTier && $earnedTier) {
            $activeTier = $this->getHigherTier($earnedTier, $previousTier);
        } elseif ($previousTier && !$earnedTier) {
            // Pada awal tahun perpanjangan tepat waktu, jika belum ada konsultasi, dia tetap membawa target/status sebelumnya
            $activeTier = $previousTier;
        }

        // Catat highest tier
        $newHighest = $this->getHigherTier($highestTier, $activeTier);

        // Simpan ke database jika ada perubahan
        if (
            $expert->medal_tier !== $activeTier ||
            $expert->medal_consultations_count !== $count ||
            $expert->medal_highest_tier !== $newHighest
        ) {
            $expert->update([
                'medal_tier'                => $activeTier,
                'medal_consultations_count' => $count,
                'medal_highest_tier'        => $newHighest,
                'medal_last_evaluated_at'   => now(),
            ]);
        }

        return $this->formatBadgeData($expert, true, $activeTier, $count);
    }

    /**
     * Format data medali langsung dari kolom model tanpa query tambahan (optimal untuk index/listing).
     */
    public function formatBadgeDataFromModel(Expert $expert): array
    {
        $eligible = $this->isEligible($expert);
        $tier = $eligible ? $expert->medal_tier : null;
        $count = (int) ($expert->medal_consultations_count ?? 0);

        return $this->formatBadgeData($expert, $eligible, $tier, $count);
    }

    /**
     * Handler saat perpanjangan atau upgrade paket berhasil (Order verified / Midtrans callback):
     * - Tepat Waktu: Memperpanjang tanggal dan mencatat medali tertinggi tahun lalu sebagai target retensi.
     * - Telat Perpanjangan: Medali turun ke paling awal (reset), siklus baru dimulai pada tanggal/bulan saat ini.
     */
    public function handleRenewalOrUpgrade(Expert $expert, ?Carbon $now = null): void
    {
        $now = $now ?: now();

        $previousExpiresAt = $expert->package_expires_at;
        $isLateRenewal = empty($previousExpiresAt) || $now->greaterThan($previousExpiresAt);

        if ($isLateRenewal) {
            // TELAT PERPANJANGAN (melewati tanggal perpanjangan)
            // Aturan user:
            // "nah jika dia telat perpanjangan dan melewati tanggal perpanjangan maka mendali nya turun ke paling awal
            // dan mulai perpanjangan nya lagi di tahun depan harus di tanggal dan bulan berikut"
            $newCycleStart = $now->copy();
            $newExpiresAt  = $now->copy()->addYear();

            $expert->update([
                'membership_cycle_start'    => $newCycleStart,
                'package_expires_at'        => $newExpiresAt,
                'medal_tier'                => null, // Turun ke paling awal (belum ada konsultasi di siklus baru)
                'medal_previous_tier'       => null, // Reset status retensi
                'medal_highest_tier'        => null, // Reset riwayat tertinggi
                'medal_consultations_count' => 0,
                'medal_last_evaluated_at'   => $now,
            ]);

            Log::info("Expert #{$expert->id} ({$expert->name}) telat perpanjangan. Medali di-reset ke awal. Siklus baru: {$newCycleStart->toDateString()} s/d {$newExpiresAt->toDateString()}");
        } else {
            // PERPANJANGAN TEPAT WAKTU (sebelum masa aktif habis)
            // Aturan user:
            // "lalu jika dalam tahun itu dia naik peringkat maka tahun depan dia harus mempertahankan mendali tertingginya
            // jika kurang dari jumlah orang yang konsultasi sebelumnya maka bagde nya berubah ke jumlah yang telah diraih pada tahun itu"
            $currentCount = $this->countConsultationsThisCycle($expert);
            $tierInCycle  = $this->getTierByCount($currentCount);

            // Tentukan medali yang berhasil diraih untuk dipertahankan tahun depan
            $benchmarkTier = $tierInCycle ?: $expert->medal_tier ?: $expert->medal_previous_tier;

            // Jika dalam siklus sebelumnya jumlah konsultasi kurang dari sebelumnya, tier menyesuaikan
            if ($expert->medal_previous_tier && $tierInCycle) {
                $benchmarkTier = $tierInCycle;
            }

            $newCycleStart = Carbon::parse($previousExpiresAt);
            $newExpiresAt  = Carbon::parse($previousExpiresAt)->addYear();

            $expert->update([
                'membership_cycle_start'    => $newCycleStart,
                'package_expires_at'        => $newExpiresAt,
                'medal_tier'                => $benchmarkTier,
                'medal_previous_tier'       => $benchmarkTier,
                'medal_highest_tier'        => $this->getHigherTier($expert->medal_highest_tier, $benchmarkTier),
                'medal_consultations_count' => 0, // Reset hitungan untuk siklus tahun yang baru
                'medal_last_evaluated_at'   => $now,
            ]);

            Log::info("Expert #{$expert->id} ({$expert->name}) perpanjang tepat waktu. Medali dipertahankan: {$benchmarkTier}. Periode baru hingga: {$newExpiresAt->toDateString()}");
        }
    }

    /**
     * Format data medali untuk respon API (Card, Profil, & Dashboard).
     */
    public function formatBadgeData(Expert $expert, bool $eligible, ?string $tier, int $count): array
    {
        $tierMeta = $tier ? (self::TIERS[$tier] ?? null) : null;

        // Cari info next tier
        $nextTier = null;
        $neededForNext = 0;
        if ($tier) {
            $currentStage = $tierMeta['stage'] ?? 1;
            if ($currentStage < count(self::STAGE_ORDER)) {
                $nextTierKey = self::STAGE_ORDER[$currentStage];
                $nextMeta = self::TIERS[$nextTierKey] ?? null;
                if ($nextMeta) {
                    $nextTier = [
                        'key'         => $nextTierKey,
                        'name'        => $nextMeta['name'],
                        'label'       => $nextMeta['label'],
                        'target'      => $nextMeta['min'],
                        'color'       => $nextMeta['color'],
                        'icon'        => $nextMeta['icon'],
                    ];
                    $neededForNext = max(0, $nextMeta['min'] - $count);
                }
            }
        } elseif ($eligible) {
            // Belum ada tier (count = 0), next tier adalah White (min 1)
            $firstMeta = self::TIERS['white'];
            $nextTier = [
                'key'         => 'white',
                'name'        => $firstMeta['name'],
                'label'       => $firstMeta['label'],
                'target'      => 1,
                'color'       => $firstMeta['color'],
                'icon'        => $firstMeta['icon'],
            ];
            $neededForNext = 1;
        }

        $cycleStart = $expert->membership_cycle_start;
        $cycleEnd   = $expert->package_expires_at;

        $daysRemaining = null;
        if ($cycleEnd) {
            $daysRemaining = max(0, (int) now()->diffInDays($cycleEnd, false));
        }

        return [
            'eligible'            => $eligible,
            'has_badge'           => $eligible && !empty($tier),
            'tier'                => $tier,
            'tier_name'           => $tierMeta['name'] ?? null,
            'tier_label'          => $tierMeta['label'] ?? null,
            'stage'               => $tierMeta['stage'] ?? 0,
            'color'               => $tierMeta['color'] ?? null,
            'bg_color'            => $tierMeta['bg_color'] ?? null,
            'border_color'        => $tierMeta['border_color'] ?? null,
            'text_color'          => $tierMeta['text_color'] ?? null,
            'icon'                => $tierMeta['icon'] ?? 'military_tech',
            'badge_style'         => $tierMeta['badge_style'] ?? '',
            'glow_color'          => $tierMeta['glow_color'] ?? null,
            'consultations_count' => $count,
            'min_consultations'   => $tierMeta['min'] ?? null,
            'max_consultations'   => $tierMeta ? ($tierMeta['max'] === PHP_INT_MAX ? null : $tierMeta['max']) : null,
            'previous_tier'       => $expert->medal_previous_tier,
            'highest_tier'        => $expert->medal_highest_tier,
            'next_tier'           => $nextTier,
            'needed_for_next'     => $neededForNext,
            'cycle_start'         => $cycleStart ? Carbon::parse($cycleStart)->toDateString() : null,
            'cycle_end'           => $cycleEnd ? Carbon::parse($cycleEnd)->toDateString() : null,
            'renewal_deadline'    => $cycleEnd ? Carbon::parse($cycleEnd)->translatedFormat('d F Y') : null,
            'days_remaining'      => $daysRemaining,
            'all_tiers'           => array_map(function ($k, $t) use ($tier, $count) {
                return [
                    'key'       => $k,
                    'name'      => $t['name'],
                    'label'     => $t['label'],
                    'stage'     => $t['stage'],
                    'min'       => $t['min'],
                    'max'       => $t['max'] === PHP_INT_MAX ? '100+' : $t['max'],
                    'range_text'=> $t['max'] === PHP_INT_MAX ? '> 100 orang/thn' : "{$t['min']} - {$t['max']} orang/thn",
                    'color'     => $t['color'],
                    'icon'      => $t['icon'],
                    'is_current'=> $tier === $k,
                    'is_passed' => $t['stage'] < (self::TIERS[$tier]['stage'] ?? 0),
                ];
            }, array_keys(self::TIERS), self::TIERS),
        ];
    }
}
