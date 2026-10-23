<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Advertisement extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'company_name',
        'description',
        'image',
        'target_url',
        'placement',
        'start_date',
        'end_date',
        'status',
        'views_count',
        'clicks_count',
    ];

    protected function casts(): array
    {
        return [
            'start_date'   => 'date:Y-m-d',
            'end_date'     => 'date:Y-m-d',
            'views_count'  => 'integer',
            'clicks_count' => 'integer',
        ];
    }

    protected $appends = ['image_url'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function getImageUrlAttribute(): ?string
    {
        if (!$this->image) {
            return null;
        }

        if (filter_var($this->image, FILTER_VALIDATE_URL)) {
            return $this->image;
        }

        return asset('storage/' . $this->image);
    }

    /**
     * Scope for currently active advertisements
     */
    public function scopeActive($query)
    {
        $today = now()->toDateString();
        return $query->where('status', 'active')
            ->where(function ($q) use ($today) {
                $q->whereNull('start_date')->orWhere('start_date', '<=', $today);
            })
            ->where(function ($q) use ($today) {
                $q->whereNull('end_date')->orWhere('end_date', '>=', $today);
            });
    }
}
