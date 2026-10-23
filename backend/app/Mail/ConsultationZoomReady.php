<?php

namespace App\Mail;

use App\Models\Consultation;
use App\Models\Expert;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConsultationZoomReady extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Consultation $consultation,
        public readonly Expert $expert,
        public readonly string $recipientType, // 'expert' | 'client'
        public readonly string $zoomLink,
        public readonly ?string $meetingId = null,
        public readonly ?string $passcode = null,
        public readonly int $durationMinutes = 30
    ) {}

    public function envelope(): Envelope
    {
        $date = $this->consultation->consultation_date ? \Carbon\Carbon::parse($this->consultation->consultation_date)->translatedFormat('d M Y') : 'Hari Ini';
        $time = $this->consultation->consultation_time ?: '';
        return new Envelope(
            subject: "🎥 Link Zoom Sesi Konsultasi Anda Telah Siap ({$date} {$time}) — " . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.consultation-zoom-ready',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
