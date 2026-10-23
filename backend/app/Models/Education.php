<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Education extends Model
{
    protected $table = 'educations';

    protected $fillable = ['expert_id', 'jenjang', 'institusi', 'jurusan', 'tahun_lulus', 'ijazah_path'];

    protected $appends = ['ijazah_url'];

    public function getIjazahUrlAttribute()
    {
        return $this->ijazah_path ? asset('storage/' . $this->ijazah_path) : null;
    }

    public function expert()
    {
        return $this->belongsTo(Expert::class);
    }
}
