<?php

namespace App\Mail;

use App\Models\Consultation;
use App\Models\Expert;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ConsultationStatusUpdated extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Consultation $consultation,
        public readonly Expert $expert,
        public readonly string $statusLabel,
        public readonly string $myConsultationUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Update Status Konsultasi: {$this->statusLabel} — " . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.consultation-status-updated',
        );
    }
}
