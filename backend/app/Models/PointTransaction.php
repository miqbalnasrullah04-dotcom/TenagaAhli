<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class PointTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'points',
        'amount_idr',
        'reference_code',
        'status',
        'snap_token',
        'proof_of_payment',
        'top_up_package_id',
        'related_id',
        'related_type',
        'verified_by',
        'verified_at',
        'notes',
        'description',
    ];

    protected $casts = [
        'points'      => 'integer',
        'amount_idr'  => 'integer',
        'verified_at' => 'datetime',
        'created_at'  => 'datetime',
        'updated_at'  => 'datetime',
    ];

    // =========================================================================
    // Tipe transaksi
    // =========================================================================

    const TYPE_TOPUP                = 'topup';
    const TYPE_PRODUCT_PURCHASE     = 'product_purchase';
    const TYPE_PRODUCT_SALE         = 'product_sale';
    const TYPE_CONSULTATION         = 'consultation';
    const TYPE_CONSULTATION_INCOME  = 'consultation_income';
    const TYPE_REFUND               = 'refund';
    const TYPE_UPGRADE_PREMIUM      = 'upgrade_premium';   // legacy
    const TYPE_RENEWAL_PREMIUM      = 'renewal_premium';   // legacy

    // Tipe yang menambah saldo (positif)
    const CREDIT_TYPES = [
        self::TYPE_TOPUP,
        self::TYPE_PRODUCT_SALE,
        self::TYPE_CONSULTATION_INCOME,
        self::TYPE_REFUND,
        self::TYPE_UPGRADE_PREMIUM,
        self::TYPE_RENEWAL_PREMIUM
    ];

    // Tipe yang mengurangi saldo (negatif)
    const DEBIT_TYPES  = [self::TYPE_PRODUCT_PURCHASE, self::TYPE_CONSULTATION];

    // Status
    const STATUS_PENDING   = 'pending';
    const STATUS_SUCCESS   = 'success';
    const STATUS_CANCELLED = 'cancelled';
    const STATUS_REFUNDED  = 'refunded';

    // =========================================================================
    // Boot
    // =========================================================================

    protected static function boot(): void
    {
        parent::boot();

        // Auto-generate reference_code jika belum ada
        static::creating(function (self $model) {
            if (empty($model->reference_code)) {
                $model->reference_code = self::generateReferenceCode($model->type);
            }
        });
    }

    // =========================================================================
    // Relations
    // =========================================================================

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function topUpPackage()
    {
        return $this->belongsTo(TopUpPackage::class, 'top_up_package_id');
    }

    public function verifiedBy()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    // =========================================================================
    // Scopes
    // =========================================================================

    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopePending($query)
    {
        return $query->where('status', self::STATUS_PENDING);
    }

    public function scopeSuccess($query)
    {
        return $query->where('status', self::STATUS_SUCCESS);
    }

    public function scopeTopUps($query)
    {
        return $query->where('type', self::TYPE_TOPUP);
    }

    public function scopeForUser($query, int $userId)
    {
        return $query->where('user_id', $userId);
    }

    // =========================================================================
    // Accessors
    // =========================================================================

    /**
     * Label tampilan tipe transaksi dalam Bahasa Indonesia.
     */
    public function getTypeLabelAttribute(): string
    {
        return match($this->type) {
            self::TYPE_TOPUP                => 'Top Up Point',
            self::TYPE_PRODUCT_PURCHASE     => 'Pembelian Produk',
            self::TYPE_PRODUCT_SALE         => 'Penjualan Produk',
            self::TYPE_CONSULTATION         => 'Pembayaran Konsultasi',
            self::TYPE_CONSULTATION_INCOME  => 'Pendapatan Konsultasi',
            self::TYPE_REFUND               => 'Refund Point',
            self::TYPE_UPGRADE_PREMIUM      => 'Upgrade Premium',
            self::TYPE_RENEWAL_PREMIUM      => 'Perpanjangan Premium',
            default                         => ucfirst(str_replace('_', ' ', $this->type)),
        };
    }

    /**
     * Label status transaksi.
     */
    public function getStatusLabelAttribute(): string
    {
        return match($this->status) {
            self::STATUS_PENDING   => 'Menunggu Konfirmasi',
            self::STATUS_SUCCESS   => 'Berhasil',
            self::STATUS_CANCELLED => 'Dibatalkan',
            self::STATUS_REFUNDED  => 'Direfund',
            default                => ucfirst($this->status),
        };
    }

    /**
     * Apakah transaksi ini menambah saldo (credit).
     */
    public function getIsCreditAttribute(): bool
    {
        return in_array($this->type, self::CREDIT_TYPES) || $this->points > 0;
    }

    /**
     * Nilai absolut Point (selalu positif untuk tampilan).
     */
    public function getAbsolutePointsAttribute(): int
    {
        return abs($this->points);
    }

    /**
     * Format harga IDR: "Rp 10.000"
     */
    public function getFormattedAmountIdrAttribute(): string
    {
        return 'Rp ' . number_format($this->amount_idr, 0, ',', '.');
    }

    /**
     * Proof URL (storage)
     */
    public function getProofUrlAttribute(): ?string
    {
        return $this->proof_of_payment
            ? asset('storage/' . $this->proof_of_payment)
            : null;
    }

    /**
     * Backward-compat: formatted_description untuk kode lama.
     */
    public function getFormattedDescriptionAttribute(): string
    {
        return match($this->type) {
            self::TYPE_TOPUP            => 'Top Up Point' . ($this->description ? ' — ' . $this->description : ''),
            self::TYPE_PRODUCT_PURCHASE => 'Pembelian Produk' . ($this->description ? ': ' . $this->description : ''),
            self::TYPE_CONSULTATION     => 'Konsultasi' . ($this->description ? ' dengan ' . $this->description : ''),
            self::TYPE_REFUND           => 'Refund' . ($this->description ? ' — ' . $this->description : ''),
            self::TYPE_UPGRADE_PREMIUM  => 'Upgrade ke Premium — ' . $this->description,
            self::TYPE_RENEWAL_PREMIUM  => 'Perpanjangan Premium — ' . $this->description,
            default                     => $this->description,
        };
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    /**
     * Generate kode referensi unik berdasarkan tipe transaksi.
     * Memastikan tidak ada duplikat dengan query ke DB.
     */
    public static function generateReferenceCode(string $type): string
    {
        $prefix = match($type) {
            self::TYPE_TOPUP            => 'TU',
            self::TYPE_PRODUCT_PURCHASE => 'PP',
            self::TYPE_CONSULTATION     => 'CS',
            self::TYPE_REFUND           => 'RF',
            default                     => 'PT',
        };

        // Loop sampai kode unik ditemukan
        do {
            $code = $prefix . '-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));
        } while (static::where('reference_code', $code)->exists());

        return $code;
    }
}
