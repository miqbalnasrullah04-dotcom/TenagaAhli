<?php

namespace App\Mail;

use App\Models\Expert;
use App\Models\Product;
use App\Models\ProductPurchase;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProductOrderPaymentVerified extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly ProductPurchase $purchase,
        public readonly Product $product,
        public readonly ?Expert $expert,
        public readonly User $buyer,
        public readonly string $myPurchasesUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Pembayaran Terverifikasi: {$this->product->title} — " . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.product-payment-verified',
        );
    }
}
