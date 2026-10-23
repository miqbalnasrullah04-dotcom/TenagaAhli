<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TopUpPackage extends Model
{
    use HasFactory;

    protected $table = 'top_up_packages';

    protected $fillable = [
        'name',
        'points',
        'price',
        'description',
        'is_active',
        'is_popular',
        'sort_order',
    ];

    protected $casts = [
        'is_active'  => 'boolean',
        'is_popular' => 'boolean',
        'points'     => 'integer',
        'price'      => 'integer',
        'sort_order' => 'integer',
    ];

    // =========================================================================
    // Relations
    // =========================================================================

    /**
     * Transaksi Top Up yang menggunakan paket ini.
     */
    public function transactions()
    {
        return $this->hasMany(PointTransaction::class, 'top_up_package_id');
    }

    // =========================================================================
    // Scopes
    // =========================================================================

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeOrdered($query)
    {
        return $query->orderBy('sort_order')->orderBy('points');
    }

    // =========================================================================
    // Accessors
    // =========================================================================

    /**
     * Format harga dalam Rupiah: "Rp 10.000"
     */
    public function getFormattedPriceAttribute(): string
    {
        return 'Rp ' . number_format($this->price, 0, ',', '.');
    }

    /**
     * Harga per Point: misalnya 1.000/Point
     */
    public function getPricePerPointAttribute(): float
    {
        if ($this->points <= 0) {
            return 0;
        }
        return $this->price / $this->points;
    }
}
