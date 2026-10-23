<?php

namespace App\Mail;

use App\Models\RoleUpgradeRequest;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class RoleUpgradeRejected extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly RoleUpgradeRequest $upgradeReq,
        public readonly User $user,
        public readonly ?string $reason,
        public readonly string $dashboardUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Informasi Hasil Pengajuan Upgrade Peran — ' . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.role-upgrade-rejected',
        );
    }
}
