<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tiket Bantuan Berhasil Dibuat</title>
    <style>
        body { margin: 0; padding: 0; background: #f4f7fb; font-family: 'Segoe UI', Arial, sans-serif; color: #1F2A22; }
        .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #0D9488 0%, #059669 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px; }
        .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
        .brand { color: #99F6E4; font-weight: 700; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0F172A; }
        .text { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 20px; }
        .badge { display: inline-block; background: #CCFBF1; color: #115E59; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 100px; margin-bottom: 20px; }
        .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #E2E8F0; font-size: 13.5px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { color: #64748B; font-weight: 500; }
        .card-value { color: #0F172A; font-weight: 600; text-align: right; }
        .message-box { background: #F1F5F9; border-left: 4px solid #0D9488; padding: 14px 16px; border-radius: 6px; margin: 16px 0; font-size: 13.5px; color: #334155; line-height: 1.6; white-space: pre-line; }
        .cta-btn { display: block; background: linear-gradient(135deg, #0D9488 0%, #059669 100%); color: #ffffff !important; text-decoration: none; text-align: center; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 10px; margin: 26px 0; }
        .footer { padding: 20px 40px 30px; text-align: center; border-top: 1px solid #F1F5F9; }
        .footer p { font-size: 12px; color: #94A3B8; margin: 0 0 4px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>🎫 Tiket Bantuan Diterima</h1>
            <p>Pusat Dukungan <span class="brand">TenagaAhli.com</span></p>
        </div>

        <div class="body">
            <p class="greeting">Halo, {{ $user->name }}!</p>

            <span class="badge">Tiket #{{ $ticket->ticket_number }}</span>

            <p class="text">
                Tiket bantuan Anda telah berhasil dibuat. Tim support kami akan segera meninjau dan merespons pertanyaan atau kendala Anda.
            </p>

            <div class="card">
                <div class="card-row">
                    <span class="card-label">Nomor Tiket:</span>
                    <span class="card-value">#{{ $ticket->ticket_number }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Judul Kendala:</span>
                    <span class="card-value">{{ $ticket->title }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Kategori:</span>
                    <span class="card-value">{{ $ticket->category }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Prioritas:</span>
                    <span class="card-value" style="text-transform: capitalize;">{{ $ticket->priority }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Status:</span>
                    <span class="card-value">Baru (Diproses)</span>
                </div>
            </div>

            <p style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Pesan Anda:</p>
            <div class="message-box">{{ $ticket->message }}</div>

            <a href="{{ $ticketUrl }}" class="cta-btn">Lihat & Balas Tiket</a>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} TenagaAhli.com — Layanan Bantuan & Dukungan Pengguna</p>
            <p>Email ini dikirim secara otomatis. Anda dapat membalas tiket langsung dari aplikasi.</p>
        </div>
    </div>
</body>
</html>
