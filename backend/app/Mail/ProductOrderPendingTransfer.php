<?php

namespace App\Mail;

use App\Models\Product;
use App\Models\ProductPurchase;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ProductOrderPendingTransfer extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly ProductPurchase $purchase,
        public readonly Product $product,
        public readonly User $buyer,
        public readonly array $paymentInstruction,
        public readonly string $checkoutUrl,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Instruksi Pembayaran Pesanan #{$this->purchase->reference_code} — " . config('app.name'),
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.product-order-pending',
        );
    }
}
