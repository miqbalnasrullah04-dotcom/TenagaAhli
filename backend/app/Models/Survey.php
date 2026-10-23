<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Survey extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'title',
        'location',
        'category',
        'survey_date',
        'status',
        'client_name',
        'description',
        'result_notes',
    ];

    protected $casts = [
        'survey_date' => 'date:Y-m-d',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
