<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Update Status Konsultasi</title>
    <style>
        body { margin: 0; padding: 0; background: #f4f7fb; font-family: 'Segoe UI', Arial, sans-serif; color: #1F2A22; }
        .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px; }
        .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
        .brand { color: #C7D2FE; font-weight: 700; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0F172A; }
        .text { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 20px; }
        .badge { display: inline-block; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 100px; margin-bottom: 20px; }
        .badge-confirmed { background: #ECFDF5; color: #065F46; }
        .badge-completed { background: #EEF2FF; color: #3730A3; }
        .badge-cancelled { background: #FEF2F2; color: #991B1B; }
        .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #E2E8F0; font-size: 13.5px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { color: #64748B; font-weight: 500; }
        .card-value { color: #0F172A; font-weight: 600; text-align: right; }
        .cta-btn { display: block; background: linear-gradient(135deg, #4F46E5 0%, #6366F1 100%); color: #ffffff !important; text-decoration: none; text-align: center; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 10px; margin: 26px 0; }
        .footer { padding: 20px 40px 30px; text-align: center; border-top: 1px solid #F1F5F9; }
        .footer p { font-size: 12px; color: #94A3B8; margin: 0 0 4px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>🔔 Status Konsultasi Diperbarui</h1>
            <p>Pemberitahuan dari <span class="brand">TenagaAhli.com</span></p>
        </div>

        <div class="body">
            <p class="greeting">Halo, {{ $consultation->client_name }}!</p>

            @if($consultation->status === 'dikonfirmasi')
                <span class="badge badge-confirmed">✓ Status: Dikonfirmasi</span>
                <p class="text">
                    Kabar baik! Konsultasi Anda dengan <strong>{{ $expert->name }}</strong> telah <strong>dikonfirmasi</strong>. Silakan hadir tepat waktu sesuai jadwal berikut:
                </p>
            @elseif($consultation->status === 'selesai')
                <span class="badge badge-completed">✓ Status: Selesai</span>
                <p class="text">
                    Sesi konsultasi Anda dengan <strong>{{ $expert->name }}</strong> telah ditandai <strong>selesai</strong>. Terima kasih telah mempercayakan kebutuhan Anda di TenagaAhli.com!
                </p>
            @else
                <span class="badge badge-cancelled">✕ Status: Dibatalkan / Ditolak</span>
                <p class="text">
                    Konsultasi Anda dengan <strong>{{ $expert->name }}</strong> telah dibatalkan atau jadwal tidak tersedia. Anda dapat menjadwalkan ulang di waktu lain.
                </p>
            @endif

            <div class="card">
                <div class="card-row">
                    <span class="card-label">Tenaga Ahli:</span>
                    <span class="card-value">{{ $expert->name }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Layanan:</span>
                    <span class="card-value">{{ $consultation->service_type }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Tanggal:</span>
                    <span class="card-value">{{ \Carbon\Carbon::parse($consultation->consultation_date)->translatedFormat('l, d F Y') }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Waktu:</span>
                    <span class="card-value">{{ $consultation->consultation_time }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Topik:</span>
                    <span class="card-value">{{ $consultation->topic }}</span>
                </div>
            </div>

            <a href="{{ $myConsultationUrl }}" class="cta-btn">Buka Halaman Konsultasi Saya</a>

            @if($consultation->status === 'selesai')
            <p class="text" style="font-size: 13px; color: #4338CA; text-align: center; font-weight: 600;">
                ⭐ Jangan lupa berikan ulasan dan rating pada profil tenaga ahli untuk membantu pengguna lainnya!
            </p>
            @endif
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} TenagaAhli.com — Platform Tenaga Ahli & Surveyor Profesional Indonesia</p>
            <p>Email ini dikirim secara otomatis. Mohon jangan membalas langsung email ini.</p>
        </div>
    </div>
</body>
</html>
