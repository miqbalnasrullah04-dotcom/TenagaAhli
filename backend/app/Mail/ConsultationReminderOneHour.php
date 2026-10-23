<?php

namespace App\Mail;

use App\Models\Consultation;
use App\Models\Expert;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConsultationReminderOneHour extends Mailable
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
        $time = $this->consultation->consultation_time ?: '1 Jam Lagi';
        return new Envelope(
            subject: "🚨 Peringatan: 1 Jam Lagi Sesi Konsultasi Dimulai ({$time}) — " . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.consultation-reminder-1hour',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
