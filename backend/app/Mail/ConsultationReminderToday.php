<?php

namespace App\Mail;

use App\Models\Consultation;
use App\Models\Expert;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConsultationReminderToday extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Consultation $consultation,
        public readonly Expert $expert,
        public readonly string $recipientType, // 'expert' | 'client'
        public readonly string $actionUrl
    ) {}

    public function envelope(): Envelope
    {
        $time = $this->consultation->consultation_time ?: 'Sesuai Jadwal';
        return new Envelope(
            subject: "⏰ Pengingat: Anda Memiliki Jadwal Konsultasi Hari Ini pukul {$time} — " . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.consultation-reminder-today',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
