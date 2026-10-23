<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class MembershipTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'reference_code',
        'package',
        'type',
        'price',
        'discount',
        'total_price',
        'started_at',
        'expires_at',
        'payment_status',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (empty($model->reference_code)) {
                // Generate unique reference code
                $attempts = 0;
                do {
                    $referenceCode = 'MBRS-' . date('Ymd') . '-' . str_pad(random_int(1, 99999), 5, '0', STR_PAD_LEFT);
                    $attempts++;
                } while (
                    self::where('reference_code', $referenceCode)->exists() &&
                    $attempts < 10
                );

                if ($attempts >= 10) {
                    throw new \Exception('Unable to generate unique reference code after 10 attempts');
                }

                $model->reference_code = $referenceCode;
            }
        });
    }

    protected $casts = [
        'price' => 'decimal:2',
        'discount' => 'decimal:2',
        'total_price' => 'decimal:2',
        'started_at' => 'datetime',
        'expires_at' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relationship ke User
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope untuk filter berdasarkan payment status
     */
    public function scopeByPaymentStatus($query, $status)
    {
        return $query->where('payment_status', $status);
    }

    /**
     * Scope untuk filter berdasarkan package
     */
    public function scopeByPackage($query, $package)
    {
        return $query->where('package', $package);
    }

    /**
     * Scope untuk filter berdasarkan type
     */
    public function scopeByType($query, $type)
    {
        return $query->where('type', $type);
    }

    /**
     * Scope untuk transaksi yang sudah dibayar
     */
    public function scopePaid($query)
    {
        return $query->where('payment_status', 'paid');
    }

    /**
     * Get formatted type
     */
    public function getFormattedTypeAttribute()
    {
        return match($this->type) {
            'upgrade' => 'Upgrade Premium',
            'renewal' => 'Perpanjangan Premium',
            default => $this->type,
        };
    }

    /**
     * Get discount amount
     */
    public function getDiscountAmountAttribute()
    {
        return $this->price * ($this->discount / 100);
    }

    /**
     * Check if transaction is active (paid and not expired)
     */
    public function getIsActiveAttribute()
    {
        return $this->payment_status === 'paid' &&
               $this->expires_at > Carbon::now();
    }

    /**
     * Get remaining days
     */
    public function getRemainingDaysAttribute()
    {
        if ($this->payment_status !== 'paid') {
            return 0;
        }

        $now = Carbon::now();
        $expiresAt = Carbon::parse($this->expires_at);

        if ($expiresAt->isPast()) {
            return 0;
        }

        return $now->diffInDays($expiresAt);
    }
}
