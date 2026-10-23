<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Article extends Model
{
    protected $fillable = [
        'user_id',
        'reference_code',
        'author_name',
        'source',
        'title',
        'slug',
        'category',
        'is_top_news',
        'status',
        'price',
        'payment_proof',
        'payment_status',
        'snap_token',
        'rejection_reason',
        'thumbnail',
        'excerpt',
        'content',
        'published_at',
        'expires_at',
        'verified_at',
        'verified_by',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function verifier()
    {
        return $this->belongsTo(User::class, 'verified_by');
    }

    protected $appends = ['thumbnail_url', 'payment_proof_url', 'is_expired'];

    protected $casts = [
        'published_at' => 'datetime',
        'expires_at'   => 'datetime',
        'verified_at'  => 'datetime',
        'is_top_news'  => 'boolean',
        'price'        => 'integer',
    ];

    protected static function boot()
    {
        parent::boot();
        static::saving(function (Article $article) {
            if (empty($article->slug)) {
                $article->slug = Str::slug($article->title);
            }
            if (empty($article->published_at) && $article->status === 'published') {
                $article->published_at = now();
            }
            if (empty($article->excerpt) && !empty($article->content)) {
                $plain = strip_tags($article->content);
                $article->excerpt = Str::limit($plain, 180);
            }
        });
    }

    public function getThumbnailUrlAttribute()
    {
        if (empty($this->thumbnail)) {
            return null;
        }

        if (Str::startsWith($this->thumbnail, ['http://', 'https://', 'data:'])) {
            return $this->thumbnail;
        }

        return asset('storage/' . $this->thumbnail);
    }

    public function getPaymentProofUrlAttribute()
    {
        if (empty($this->payment_proof)) {
            return null;
        }

        if (Str::startsWith($this->payment_proof, ['http://', 'https://', 'data:'])) {
            return $this->payment_proof;
        }

        return asset('storage/' . $this->payment_proof);
    }

    public function getIsExpiredAttribute(): bool
    {
        if (empty($this->expires_at)) {
            return false;
        }

        return $this->expires_at->isPast();
    }
}
