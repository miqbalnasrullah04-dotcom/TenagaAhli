<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id', 'package_id', 'package_name', 'amount', 'original_price',
        'discount_percentage', 'discount_amount', 'reference_code',
        'snap_token', 'payment_type', 'proof_of_payment', 'status', 'reject_reason',
        'verified_by', 'verified_at',
    ];

    protected $casts = [
        'verified_at' => 'datetime',
    ];

    protected $appends = ['proof_url'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function package()
    {
        return $this->belongsTo(Package::class);
    }

    public function getProofUrlAttribute()
    {
        return $this->proof_of_payment ? asset('storage/'.$this->proof_of_payment) : null;
    }
}
