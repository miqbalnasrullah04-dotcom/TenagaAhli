<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Carbon\Carbon;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'pending_email',
        'password',
        'role',
        'role_type',
        'is_also_expert',
        'otp_code',
        'otp_expires_at',
        'reset_token',
        'reset_token_expires_at',
        'email_verified_at',
        'avatar_url',
        'foto',
        'phone',
        'total_points',
        'package',
        'premium_started_at',
        'premium_expires_at',
        'points',
        'membership_level',
        'point_balance',
        'last_seen_at',
        'is_online',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'otp_expires_at' => 'datetime',
            'reset_token_expires_at' => 'datetime',
            'premium_started_at' => 'datetime',
            'premium_expires_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'is_online' => 'boolean',
            'password' => 'hashed',
        ];
    }

    public function isOnline(): bool
    {
        return (bool) ($this->is_online && $this->last_seen_at && $this->last_seen_at->gt(now()->subMinutes(2)));
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    public function isKlien(): bool
    {
        return $this->role_type === 'klien';
    }

    public function isTenagaAhli(): bool
    {
        return $this->role_type === 'tenaga_ahli' || $this->is_also_expert;
    }

    public function isSurveyor(): bool
    {
        return $this->role_type === 'surveyor';
    }

    public function isTenagaTeknis(): bool
    {
        return $this->role_type === 'tenaga_teknis';
    }

    public function getFotoAttribute($value)
    {
        return $this->expert?->photo ?? $value;
    }

    public function getAvatarUrlAttribute($value)
    {
        return $this->expert?->photo ?? $value;
    }

    public function getPhoneAttribute($value)
    {
        return $value ?: ($this->expert?->phone ?? null);
    }

    /**
     * Apakah user bisa mengakses dashboard (bukan klien murni)
     */
    public function hasDashboard(): bool
    {
        return in_array($this->role_type, ['tenaga_ahli', 'surveyor', 'tenaga_teknis']);
    }

    /**
     * Relasi ke PointHistory (legacy — untuk leaderboard & profil aktivitas)
     */
    public function pointsHistory()
    {
        return $this->hasMany(PointHistory::class);
    }

    /**
     * Relasi ke PointTransaction (sistem Top Up Point baru)
     */
    public function pointTransactions()
    {
        return $this->hasMany(PointTransaction::class);
    }

    /**
     * Relasi ke MembershipTransaction (legacy)
     */
    public function membershipTransactions()
    {
        return $this->hasMany(MembershipTransaction::class);
    }

    public function expert()
    {
        return $this->hasOne(Expert::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }

    public function advertisements()
    {
        return $this->hasMany(Advertisement::class);
    }

    // =========================================================================
    // SISTEM TOP UP POINT — Saldo & Transaksi
    // =========================================================================

    /**
     * Tambah saldo Point ke user.
     * HARUS dipanggil dalam DB::transaction() di sisi caller.
     * Setiap penambahan wajib punya record PointTransaction.
     */
    public function creditPoints(int $points, string $type, string $description, array $extra = []): PointTransaction
    {
        if ($points <= 0) {
            throw new \InvalidArgumentException('Jumlah point harus lebih dari 0.');
        }

        $this->increment('point_balance', $points);

        return $this->pointTransactions()->create(array_merge([
            'type'        => $type,
            'points'      => $points,
            'description' => $description,
            'status'      => 'success',
        ], $extra));
    }

    /**
     * Kurangi saldo Point dari user.
     * Melempar exception jika saldo tidak mencukupi.
     * HARUS dipanggil dalam DB::transaction() di sisi caller.
     */
    public function deductPoints(int $points, string $type, string $description, array $extra = []): PointTransaction
    {
        if ($points <= 0) {
            throw new \InvalidArgumentException('Jumlah point harus lebih dari 0.');
        }

        $fresh = $this->fresh();
        if ($fresh->point_balance < $points) {
            throw new \Exception("Point tidak mencukupi. Saldo Anda: {$fresh->point_balance} Point, dibutuhkan: {$points} Point.");
        }

        $this->decrement('point_balance', $points);

        return $this->pointTransactions()->create(array_merge([
            'type'        => $type,
            'points'      => -$points, // negatif = pengurangan
            'description' => $description,
            'status'      => 'success',
        ], $extra));
    }

    /**
     * Cek apakah saldo Point mencukupi.
     */
    public function hasEnoughPoints(int $points): bool
    {
        return $this->point_balance >= $points;
    }

    /**
     * Ambil saldo Point saat ini (fresh dari DB).
     */
    public function getPointBalance(): int
    {
        return (int) $this->fresh()->point_balance;
    }

    /**
     * Check if user is currently premium / platinum / ekonomis / eksklusif
     */
    public function isPremium(): bool
    {
        return in_array($this->package, ['premium', 'platinum', 'ekonomis', 'eksklusif', 'ekslusif', 'esklusif']) &&
               $this->premium_expires_at &&
               $this->premium_expires_at->isFuture();
    }

    /**
     * Get remaining premium days
     */
    public function getPremiumRemainingDays(): int
    {
        if (!$this->isPremium()) {
            return 0;
        }

        return Carbon::now()->diffInDays($this->premium_expires_at);
    }

    /**
     * Add points to user (untuk sistem poin aktivitas profil).
     */
    public function addPoints(int $points, string $type, string $description): void
    {
        $this->increment('points', $points);

        // Create point transaction dengan status eksplisit
        $this->pointTransactions()->create([
            'type'        => $type,
            'points'      => $points,
            'description' => $description,
            'status'      => 'success',
        ]);
    }

    /**
     * Get level badge color based on subscription package
     */
    public function getLevelBadgeColor(): string
    {
        return match($this->package) {
            'platinum', 'eksklusif', 'ekslusif', 'esklusif' => '#8B5CF6', // Purple/Platinum
            'premium', 'ekonomis'                           => '#F59E0B', // Gold/Amber
            default                                         => '#6B7280', // Gray
        };
    }

    /**
     * Get level display name based on subscription package
     */
    public function getLevelDisplayName(): string
    {
        return match($this->package) {
            'platinum', 'eksklusif', 'ekslusif', 'esklusif' => 'Paket Eksklusif',
            'premium', 'ekonomis'                           => 'Paket Ekonomis',
            default                                         => 'Paket Free',
        };
    }
}
