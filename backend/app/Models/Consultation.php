<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Consultation extends Model
{
    use HasFactory;

    protected $fillable = [
        'expert_id',
        'user_id',
        'reference_code',
        'client_name',
        'client_email',
        'client_phone',
        'service_type',
        'amount',
        'payment_method',
        'payment_status',
        'payment_proof',
        'snap_token',
        'bank_name',
        'paid_at',
        'consultation_date',
        'consultation_time',
        'topic',
        'notes',
        'status',
        'requester_role',
        'reminder_today_sent_at',
        'reminder_1h_sent_at',
        'reminder_10m_sent_at',
        'zoom_link',
        'zoom_meeting_id',
        'zoom_passcode',
        'duration_minutes',
        'zoom_set_by_admin',
        'zoom_set_at',
    ];

    protected $casts = [
        'amount' => 'integer',
        'paid_at' => 'datetime',
        'consultation_date' => 'date:Y-m-d',
        'reminder_today_sent_at' => 'datetime',
        'reminder_1h_sent_at' => 'datetime',
        'reminder_10m_sent_at' => 'datetime',
        'zoom_set_at' => 'datetime',
        'duration_minutes' => 'integer',
    ];

    protected $appends = [
        'payment_proof_url',
    ];

    public function getPaymentProofUrlAttribute(): ?string
    {
        if (!$this->payment_proof) return null;
        if (str_starts_with($this->payment_proof, 'http://') || str_starts_with($this->payment_proof, 'https://')) {
            return $this->payment_proof;
        }
        return asset('storage/' . $this->payment_proof);
    }

    public function expert()
    {
        return $this->belongsTo(Expert::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
