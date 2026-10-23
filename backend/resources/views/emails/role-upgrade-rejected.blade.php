<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Hasil Pengajuan Upgrade Peran</title>
    <style>
        body { margin: 0; padding: 0; background: #f4f7fb; font-family: 'Segoe UI', Arial, sans-serif; color: #1F2A22; }
        .wrapper { max-width: 580px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .header { background: linear-gradient(135deg, #DC2626 0%, #B91C1C 100%); padding: 36px 40px; text-align: center; }
        .header h1 { color: #ffffff; font-size: 22px; font-weight: 700; margin: 0 0 6px; }
        .header p { color: rgba(255,255,255,0.9); font-size: 14px; margin: 0; }
        .brand { color: #FECACA; font-weight: 700; }
        .body { padding: 36px 40px; }
        .greeting { font-size: 16px; font-weight: 600; margin-bottom: 12px; color: #0F172A; }
        .text { font-size: 14px; line-height: 1.7; color: #475569; margin-bottom: 20px; }
        .badge { display: inline-block; background: #FEE2E2; color: #991B1B; font-size: 13px; font-weight: 700; padding: 6px 14px; border-radius: 100px; margin-bottom: 20px; }
        .reason-box { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 12px; padding: 18px 20px; margin-bottom: 24px; }
        .reason-box h4 { margin: 0 0 8px; color: #991B1B; font-size: 14px; }
        .reason-box p { margin: 0; font-size: 13.5px; color: #7F1D1D; line-height: 1.6; }
        .cta-btn { display: block; background: linear-gradient(135deg, #0369A1 0%, #0EA5E9 100%); color: #ffffff !important; text-decoration: none; text-align: center; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 10px; margin: 26px 0; }
        .footer { padding: 20px 40px 30px; text-align: center; border-top: 1px solid #F1F5F9; }
        .footer p { font-size: 12px; color: #94A3B8; margin: 0 0 4px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <h1>Informasi Hasil Pengajuan Upgrade</h1>
            <p>Pemberitahuan dari <span class="brand">TenagaAhli.com</span></p>
        </div>

        <div class="body">
            <p class="greeting">Halo, {{ $user->name }}!</p>

            <span class="badge">Status: Perlu Penyesuaian</span>

            <p class="text">
                Terima kasih telah mengajukan peningkatan peran menjadi Tenaga Ahli. Setelah melalui proses peninjauan berkas, pengajuan Anda saat ini belum dapat disetujui.
            </p>

            @if($reason)
            <div class="reason-box">
                <h4>Catatan dari Tim Verifikator:</h4>
                <p>{{ $reason }}</p>
            </div>
            @endif

            <p class="text">
                Anda dapat melengkapi berkas pendukung atau pengalaman keahlian Anda dan mengajukan kembali melalui dashboard.
            </p>

            <a href="{{ $dashboardUrl }}" class="cta-btn">Buka Dashboard Saya</a>
        </div>

        <div class="footer">
            <p>© {{ date('Y') }} TenagaAhli.com — Platform Tenaga Ahli & Surveyor Profesional Indonesia</p>
        </div>
    </div>
</body>
</html>
