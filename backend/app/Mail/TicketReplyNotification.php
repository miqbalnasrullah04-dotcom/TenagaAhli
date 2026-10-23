<?php

namespace App\Mail;

use App\Models\Ticket;
use App\Models\TicketReply;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class TicketReplyNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Ticket $ticket,
        public readonly TicketReply $reply,
        public readonly User $sender,
        public readonly string $recipientRole, // 'user' or 'admin'
        public readonly string $ticketUrl,
    ) {}

    public function envelope(): Envelope
    {
        $prefix = $this->recipientRole === 'admin' ? '[Balasan Klien]' : '[Balasan Support]';
        return new Envelope(
            subject: "{$prefix} Tiket #{$this->ticket->ticket_number}: {$this->ticket->title} — " . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.ticket-reply',
        );
    }
}
