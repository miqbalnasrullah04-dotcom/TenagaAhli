<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class ProductPurchase extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'product_id',
        'expert_id',
        'reference_code',
        'payment_method',
        'points_spent',
        'amount_idr',
        'snap_token',
        'product_title',
        'recipient_name',
        'recipient_phone',
        'destination_id',
        'destination_label',
        'shipping_address',
        'courier_name',
        'courier_service',
        'shipping_cost',
        'tracking_number',
        'status',
        'download_token',
        'notes',
        'proof_image',
        'proof_notes',
        'proof_uploaded_at',
        'seller_amount',
        'admin_amount',
        'verified_at',
        'verified_by_admin',
    ];

    protected static function boot()
    {
        parent::boot();

        static::creating(function ($model) {
            if (!$model->reference_code) {
                $model->reference_code = 'PP-' . strtoupper(Str::random(8)) . '-' . date('YmdHis');
            }
        });
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function expert()
    {
        return $this->belongsTo(Expert::class);
    }
}
