<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Pengajuan Upgrade Peran Disetujui</title>
    <style>
        body { margin: 0; padding: 0; background: #f4f7fb; font-family: 'Segoe UI', Arial, sans-serif; color: #1F2A22; }
        .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px; }
        .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
        .brand { color: #BAE6FD; font-weight: 700; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0F172A; }
        .text { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 20px; }
        .badge { display: inline-block; background: #DCFCE7; color: #166534; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 100px; margin-bottom: 20px; }
        .card { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
        .card-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px dashed #E2E8F0; font-size: 13.5px; }
        .card-row:last-child { border-bottom: none; }
        .card-label { color: #64748B; font-weight: 500; }
        .card-value { color: #0F172A; font-weight: 600; text-align: right; }
        .cta-btn { display: block; background: linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%); color: #ffffff !important; text-decoration: none; text-align: center; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 10px; margin: 26px 0; }
        .footer { padding: 20px 40px 30px; text-align: center; border-top: 1px solid #F1F5F9; }
        .footer p { font-size: 12px; color: #94A3B8; margin: 0 0 4px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>🎖️ Pengajuan Upgrade Peran Disetujui!</h1>
            <p>Selamat bergabung sebagai Tenaga Ahli di <span class="brand">TenagaAhli.com</span></p>
        </div>

        <div class="body">
            <p class="greeting">Halo, {{ $user->name }}!</p>

            <span class="badge">Peran Baru: Tenaga Ahli</span>

            <p class="text">
                Pengajuan peningkatan peran Anda dari <strong>Surveyor</strong> menjadi <strong>Tenaga Ahli</strong> telah <strong>disetujui</strong> oleh tim kami. Anda sekarang dapat menikmati seluruh fasilitas tenaga ahli profesional.
            </p>

            <div class="card">
                <div class="card-row">
                    <span class="card-label">Nama:</span>
                    <span class="card-value">{{ $user->name }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Bidang Keahlian:</span>
                    <span class="card-value">{{ $upgradeReq->field_keahlian }}</span>
                </div>
                <div class="card-row">
                    <span class="card-label">Institusi:</span>
                    <span class="card-value">{{ $upgradeReq->institusi ?? '-' }}</span>
                </div>
            </div>

            <a href="{{ $dashboardUrl }}" class="cta-btn">Masuk ke Dashboard Profil Tenaga Ahli</a>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} TenagaAhli.com — Platform Tenaga Ahli & Surveyor Profesional Indonesia</p>
        </div>
    </div>
</body>
</html>
