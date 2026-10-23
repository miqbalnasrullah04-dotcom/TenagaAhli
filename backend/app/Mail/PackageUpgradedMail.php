<?php

namespace App\Mail;

use App\Models\User;
use App\Models\Package;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PackageUpgradedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly User $user,
        public readonly string $packageName,
        public readonly ?string $expiresAt,
        public readonly string $dashboardUrl,
        public readonly array $benefits = []
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Selamat! Paket Anda Berhasil Ditingkatkan ke {$this->packageName} — " . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.package-upgraded',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
