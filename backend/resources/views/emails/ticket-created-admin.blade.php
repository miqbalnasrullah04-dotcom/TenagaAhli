<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Tiket Baru Masuk</title>
    <style>
        body { margin: 0; padding: 0; background: #f4f7fb; font-family: 'Segoe UI', Arial, sans-serif; color: #1F2A22; }
        .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #DC2626 0%, #EA580C 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px; }
        .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
        .brand { color: #FED7AA; font-weight: 700; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0F172A; }
        .text { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 20px; }
        .badge { display: inline-block; background: #FEF2F2; color: #991B1B; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 100px; margin-bottom: 20px; }
        .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #E2E8F0; font-size: 13.5px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { color: #64748B; font-weight: 500; }
        .card-value { color: #0F172A; font-weight: 600; text-align: right; }
        .message-box { background: #FFF7ED; border-left: 4px solid #EA580C; padding: 14px 16px; border-radius: 6px; margin: 16px 0; font-size: 13.5px; color: #334155; line-height: 1.6; white-space: pre-line; }
        .cta-btn { display: block; background: linear-gradient(135deg, #DC2626 0%, #EA580C 100%); color: #ffffff !important; text-decoration: none; text-align: center; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 10px; margin: 26px 0; }
        .footer { padding: 20px 40px 30px; text-align: center; border-top: 1px solid #F1F5F9; }
        .footer p { font-size: 12px; color: #94A3B8; margin: 0 0 4px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>🚨 Tiket Bantuan Baru Masuk</h1>
            <p>Admin Dashboard <span class="brand">TenagaAhli.com</span></p>
        </div>

        <div class="body">
            <p class="greeting">Halo Admin / Support Team,</p>

            <span class="badge">Tiket #{{ $ticket->ticket_number }} • Prioritas: {{ ucfirst($ticket->priority) }}</span>

            <p class="text">
                Pengguna telah mengirimkan tiket bantuan baru yang memerlukan perhatian tim:
            </p>

            <div class="card">
                <div class="card-row">
                    <span class="card-label">Pengirim:</span>
                    <span class="card-value">{{ $user->name }} ({{ $user->email }})</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Nomor Tiket:</span>
                    <span class="card-value">#{{ $ticket->ticket_number }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Judul:</span>
                    <span class="card-value">{{ $ticket->title }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Kategori:</span>
                    <span class="card-value">{{ $ticket->category }}</span>
                </div>
            </div>

            <p style="font-size: 13px; font-weight: 600; color: #334155; margin-bottom: 6px;">Isi Pesan Tiket:</p>
            <div class="message-box">{{ $ticket->message }}</div>

            <a href="{{ $adminTicketUrl }}" class="cta-btn">Buka di Admin Panel & Balas Tiket</a>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} TenagaAhli.com — Internal System Notification</p>
        </div>
    </div>
</body>
</html>
