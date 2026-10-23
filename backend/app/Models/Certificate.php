<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Certificate extends Model
{
    protected $fillable = ['expert_id', 'nama_sertifikat', 'penerbit', 'tahun', 'file_path', 'is_primary'];

    protected $casts = [
        'is_primary' => 'boolean',
    ];

    public function expert()
    {
        return $this->belongsTo(Expert::class);
    }

    public function getFileUrlAttribute()
    {
        return $this->file_path ? asset('storage/'.$this->file_path) : null;
    }
}
