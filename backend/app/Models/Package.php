<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Package extends Model
{
    protected $fillable = ['name', 'slug', 'price', 'role_type', 'description', 'benefits', 'is_active', 'order'];

    protected $casts = [
        'benefits' => 'array',
        'is_active' => 'boolean',
    ];

    public function orders()
    {
        return $this->hasMany(Order::class);
    }
}
