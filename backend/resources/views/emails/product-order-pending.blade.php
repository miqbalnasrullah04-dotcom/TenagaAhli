<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Instruksi Pembayaran Pesanan Produk</title>
    <style>
        body { margin: 0; padding: 0; background: #f4f7fb; font-family: 'Segoe UI', Arial, sans-serif; color: #1F2A22; }
        .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px; }
        .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
        .brand { color: #FEF3C7; font-weight: 700; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0F172A; }
        .text { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 20px; }
        .badge { display: inline-block; background: #FEF3C7; color: #92400E; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 100px; margin-bottom: 20px; }
        .amount-box { background: linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%); border: 2px dashed #F59E0B; border-radius: 12px; padding: 18px 24px; margin-bottom: 24px; text-align: center; }
        .amount-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #92400E; margin-bottom: 4px; }
        .amount-val { font-size: 26px; font-weight: 800; color: #B45309; }
        .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #E2E8F0; font-size: 13.5px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { color: #64748B; font-weight: 500; }
        .card-value { color: #0F172A; font-weight: 600; text-align: right; }
        .cta-btn { display: block; background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%); color: #ffffff !important; text-decoration: none; text-align: center; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 10px; margin: 26px 0; }
        .footer { padding: 20px 40px 30px; text-align: center; border-top: 1px solid #F1F5F9; }
        .footer p { font-size: 12px; color: #94A3B8; margin: 0 0 4px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>💳 Instruksi Pembayaran Pesanan</h1>
            <p>Pesanan Produk di <span class="brand">TenagaAhli.com</span></p>
        </div>

        <div class="body">
            <p class="greeting">Halo, {{ $buyer->name }}!</p>

            <span class="badge">Menunggu Pembayaran & Upload Bukti</span>

            <p class="text">
                Terima kasih telah memesan produk <strong>{{ $product->title }}</strong>. Silakan selesaikan transfer sesuai nominal tepat di bawah ini:
            </p>

            <div class="amount-box">
                <div class="amount-title">Total Nominal Transfer</div>
                <div class="amount-val">Rp {{ number_format($purchase->product->discount_price ?? $purchase->product->price, 0, ',', '.') }}</div>
            </div>

            <div class="card">
                <div class="card-row">
                    <span class="card-label">Kode Referensi:</span>
                    <span class="card-value" style="font-family: monospace; font-weight: 700;">{{ $purchase->reference_code }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Metode Pembayaran:</span>
                    <span class="card-value">{{ $paymentInstruction['payment_instruction']['type'] ?? ucfirst($purchase->payment_method) }}</span>
                </div>
                @if(isset($paymentInstruction['payment_instruction']['bank_name']))
                <div class="card-row">
                    <span class="card-label">Bank Tujuan:</span>
                    <span class="card-value">{{ $paymentInstruction['payment_instruction']['bank_name'] }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">No. Rekening:</span>
                    <span class="card-value" style="font-family: monospace; font-weight: 700;">{{ $paymentInstruction['payment_instruction']['account_number'] }}</span>
                </div>
                @elseif(isset($paymentInstruction['payment_instruction']['ewallet_number']))
                <div class="card-row">
                    <span class="card-label">No. E-Wallet:</span>
                    <span class="card-value" style="font-family: monospace; font-weight: 700;">{{ $paymentInstruction['payment_instruction']['ewallet_number'] }}</span>
                </div>
                @endif
                <div class="card-row">
                    <span class="card-label">Atas Nama:</span>
                    <span class="card-value">{{ $paymentInstruction['account_name'] ?? 'Triwala Mitra Bestari' }}</span>
                </div>
            </div>

            <a href="{{ $checkoutUrl }}" class="cta-btn">Upload Bukti Pembayaran Sekarang</a>

            <p class="text" style="font-size: 13px; color: #64748B;">
                Setelah melakukan transfer, silakan upload bukti struk/screenshot pembayaran melalui tautan di atas agar admin kami dapat segera memverifikasi pesanan Anda.
            </p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} TenagaAhli.com — Platform Tenaga Ahli & Surveyor Profesional Indonesia</p>
        </div>
    </div>
</body>
</html>
