<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Produk Anda Terjual!</title>
    <style>
        body { margin: 0; padding: 0; background: #f4f7fb; font-family: 'Segoe UI', Arial, sans-serif; color: #1F2A22; }
        .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px; }
        .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
        .brand { color: #A7F3D0; font-weight: 700; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0F172A; }
        .text { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 20px; }
        .badge { display: inline-block; background: #ECFDF5; color: #065F46; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 100px; margin-bottom: 20px; }
        .income-card { background: linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%); border: 1px solid #BBF7D0; border-radius: 12px; padding: 18px 24px; margin-bottom: 24px; text-align: center; }
        .income-title { font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #166534; margin-bottom: 4px; }
        .income-val { font-size: 24px; font-weight: 800; color: #15803D; }
        .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #E2E8F0; font-size: 13.5px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { color: #64748B; font-weight: 500; }
        .card-value { color: #0F172A; font-weight: 600; text-align: right; }
        .cta-btn { display: block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff !important; text-decoration: none; text-align: center; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 10px; margin: 26px 0; }
        .footer { padding: 20px 40px 30px; text-align: center; border-top: 1px solid #F1F5F9; }
        .footer p { font-size: 12px; color: #94A3B8; margin: 0 0 4px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>🎉 Produk Anda Terjual!</h1>
            <p>Kabar gembira dari <span class="brand">TenagaAhli.com</span></p>
        </div>

        <div class="body">
            <p class="greeting">Halo, {{ $expert->name }}!</p>

            <span class="badge">Penjualan Berhasil</span>

            <p class="text">
                Selamat! Produk Anda telah dibeli oleh salah satu pengguna di TenagaAhli.com.
            </p>

            <div class="income-card">
                <div class="income-title">Pendapatan Diterima</div>
                @if($paymentType === 'points')
                    <div class="income-val">+{{ number_format($purchase->points_spent ?? 0) }} Poin</div>
                @else
                    <div class="income-val">Rp {{ number_format($purchase->seller_amount ?? (($purchase->product->discount_price ?? $purchase->product->price) * 0.9), 0, ',', '.') }}</div>
                @endif
            </div>

            <div class="card">
                <div class="card-row">
                    <span class="card-label">Judul Produk:</span>
                    <span class="card-value">{{ $product->title }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Pembeli:</span>
                    <span class="card-value">{{ $buyer->name }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Kode Transaksi:</span>
                    <span class="card-value">#{{ $purchase->reference_code ?? $purchase->id }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Metode:</span>
                    <span class="card-value">{{ $purchase->payment_method === 'points' ? 'Saldo Poin' : 'Transfer (Terverifikasi)' }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Waktu Transaksi:</span>
                    <span class="card-value">{{ now()->translatedFormat('d F Y, H:i') }} WIB</span>
                </div>
            </div>

            <a href="{{ $salesUrl }}" class="cta-btn">Lihat Laporan Penjualan & Saldo</a>

            <p class="text" style="font-size: 13px; color: #64748B;">
                Saldo pendapatan Anda telah otomatis ditambahkan ke akun Anda. Anda dapat mencairkan atau menggunakan saldo kapan saja melalui dashboard.
            </p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} TenagaAhli.com — Platform Tenaga Ahli & Surveyor Profesional Indonesia</p>
        </div>
    </div>
</body>
</html>
