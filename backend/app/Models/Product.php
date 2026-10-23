<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'expert_id',
        'user_id',
        'title',
        'author',
        'publisher',
        'publication_year',
        'isbn',
        'language',
        'pages',
        'cover_type',
        'dimensions',
        'condition',
        'specifications',
        'category',
        'price',
        'discount_price',
        'stock',
        'weight',
        'origin_id',
        'origin_city',
        'origin_province',
        'origin_subdistrict',
        'origin_label',
        'origin_address',
        'is_digital',
        'file_format',
        'file_size',
        'description',
        'terms_of_use',
        'image',
        'file_path',
        'download_url',
        'upress_url',
        'status',
        'sold_count',
        'rating',
        'reviews_count',
        'is_featured',
    ];

    protected function casts(): array
    {
        return [
            'price' => 'integer',
            'discount_price' => 'integer',
            'stock' => 'integer',
            'weight' => 'integer',
            'origin_id' => 'integer',
            'is_digital' => 'boolean',
            'is_featured' => 'boolean',
            'sold_count' => 'integer',
            'rating' => 'float',
            'reviews_count' => 'integer',
            'specifications' => 'array',
        ];
    }

    protected $appends = ['image_url', 'file_url'];

    public function expert()
    {
        return $this->belongsTo(Expert::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviews()
    {
        return $this->hasMany(ProductReview::class);
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

    public function getFileUrlAttribute(): ?string
    {
        if ($this->download_url) {
            return $this->download_url;
        }

        if (!$this->file_path) {
            return null;
        }

        if (filter_var($this->file_path, FILTER_VALIDATE_URL)) {
            return $this->file_path;
        }

        return asset('storage/' . $this->file_path);
    }
}

