<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Permintaan Booking Konsultasi Baru</title>
    <style>
        body { margin: 0; padding: 0; background: #f4f7fb; font-family: 'Segoe UI', Arial, sans-serif; color: #1F2A22; }
        .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px; }
        .header p { color: rgba(255,255,255,0.85); font-size: 14px; margin: 0; }
        .brand { color: #BAE6FD; font-weight: 700; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0F172A; }
        .text { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 20px; }
        .badge { display: inline-block; background: #E0F2FE; color: #0369A1; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 100px; margin-bottom: 20px; }
        .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #E2E8F0; font-size: 13.5px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { color: #64748B; font-weight: 500; }
        .card-value { color: #0F172A; font-weight: 600; text-align: right; }
        .cta-btn { display: block; background: linear-gradient(135deg, #0284C7 0%, #0369A1 100%); color: #ffffff !important; text-decoration: none; text-align: center; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 10px; margin: 26px 0; }
        .footer { padding: 20px 40px 30px; text-align: center; border-top: 1px solid #F1F5F9; }
        .footer p { font-size: 12px; color: #94A3B8; margin: 0 0 4px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>🗓️ Permintaan Booking Konsultasi Baru</h1>
            <p>Pemberitahuan dari <span class="brand">TenagaAhli.com</span></p>
        </div>

        <div class="body">
            <p class="greeting">Halo, {{ $expert->name }}!</p>

            <span class="badge">Status: Menunggu Konfirmasi</span>

            <p class="text">
                Anda mendapatkan permintaan konsultasi baru dari calon klien. Silakan tinjau rincian jadwal dan topik konsultasi berikut:
            </p>

            <div class="card">
                <div class="card-row">
                    <span class="card-label">Nama Klien:</span>
                    <span class="card-value">{{ $consultation->client_name }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Email Klien:</span>
                    <span class="card-value">{{ $consultation->client_email }}</span>
                </div>
                @if($consultation->client_phone)
                <div class="card-row">
                    <span class="card-label">No. Telepon/WA:</span>
                    <span class="card-value">{{ $consultation->client_phone }}</span>
                </div>
                @endif
                <div class="card-row">
                    <span class="card-label">Layanan:</span>
                    <span class="card-value">{{ $consultation->service_type }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Tanggal Konsultasi:</span>
                    <span class="card-value">{{ \Carbon\Carbon::parse($consultation->consultation_date)->translatedFormat('l, d F Y') }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Waktu:</span>
                    <span class="card-value">{{ $consultation->consultation_time }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Topik Kebutuhan:</span>
                    <span class="card-value">{{ $consultation->topic }}</span>
                </div>
                @if($consultation->notes)
                <div class="card-row">
                    <span class="card-label">Catatan Tambahan:</span>
                    <span class="card-value">{{ $consultation->notes }}</span>
                </div>
                @endif
            </div>

            <a href="{{ $dashboardUrl }}" class="cta-btn">Kelola & Konfirmasi Konsultasi</a>

            <p class="text" style="font-size: 13px; color: #64748B;">
                Segera konfirmasi atau sesuaikan jadwal permintaan ini melalui dashboard Anda untuk memberikan pelayanan terbaik bagi klien.
            </p>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} TenagaAhli.com — Platform Tenaga Ahli & Surveyor Profesional Indonesia</p>
            <p>Email ini dikirim secara otomatis. Mohon jangan membalas langsung email ini.</p>
        </div>
    </div>
</body>
</html>
