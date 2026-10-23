<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Experience extends Model
{
    protected $fillable = ['expert_id', 'posisi', 'instansi', 'tahun_mulai', 'tahun_selesai', 'deskripsi', 'is_primary'];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function expert()
    {
        return $this->belongsTo(Expert::class);
    }
}
