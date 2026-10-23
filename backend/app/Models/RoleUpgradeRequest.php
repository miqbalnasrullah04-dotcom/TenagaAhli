<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoleUpgradeRequest extends Model
{
    protected $fillable = [
        'user_id', 'from_role', 'to_role', 'status',
        'field_keahlian', 'institusi', 'motivasi',
        'dokumen_kompetensi', 'catatan_admin',
        'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
