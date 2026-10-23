<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Pamflet extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'description',
        'image',
        'type',
        'event_date',
        'location',
        'organizer',
        'is_published',
        'order',
    ];

    protected $casts = [
        'event_date' => 'date:Y-m-d',
        'is_published' => 'boolean',
        'order' => 'integer',
    ];
}
