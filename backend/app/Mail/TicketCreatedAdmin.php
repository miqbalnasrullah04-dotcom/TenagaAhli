<?php

namespace App\Mail;

use App\Models\Ticket;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketCreatedAdmin extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Ticket $ticket,
        public readonly User $user,
        public readonly string $adminTicketUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "[Tiket Baru #{$this->ticket->ticket_number}] {$this->ticket->title} dari {$this->user->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ticket-created-admin',
        );
    }
}
