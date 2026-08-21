<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Document extends Model
{
    protected $fillable = ['expert_id', 'type', 'label', 'file_path'];

    public function expert()
    {
        return $this->belongsTo(Expert::class);
    }

    public function getFileUrlAttribute()
    {
        if (!$this->file_path) {
            return null;
        }

        // Jika sudah URL lengkap, return as is
        if (filter_var($this->file_path, FILTER_VALIDATE_URL)) {
            return $this->file_path;
        }

        // Buat URL yang benar menggunakan route file view
        return url("/api/files/{$this->file_path}");
    }
}
