<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Upgrade Paket Berhasil</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1F2A22;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F4F0;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.06);border:1px solid #E5E2D9;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#8B4513 0%,#5C2E0B 100%);padding:36px 32px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:18px;line-height:56px;font-size:28px;margin-bottom:12px;">
                ⭐
              </div>
              <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
                Selamat! Akun Anda Telah Diupgrade
              </h1>
              <p style="margin:8px 0 0;color:#FDE68A;font-size:14px;font-weight:600;">
                Paket {{ $packageName }} Aktif
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2D3748;">
                Halo <strong>{{ $user->name }}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4A5568;">
                Pembayaran Anda telah berhasil diverifikasi. Paket keanggotaan Anda di <strong>{{ config('app.name') }}</strong> kini telah resmi ditingkatkan ke <strong>{{ $packageName }}</strong>.
              </p>

              <!-- Box Ringkasan Paket -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBF5;border:1.5px solid #FDE68A;border-radius:16px;margin-bottom:24px;padding:20px;">
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#718096;">Nama Paket:</td>
                  <td style="padding:4px 0;font-size:14px;font-weight:800;color:#8B4513;text-align:right;">
                    {{ $packageName }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#718096;">Status:</td>
                  <td style="padding:4px 0;font-size:13px;font-weight:700;color:#059669;text-align:right;">
                    ✓ Aktif & Terverifikasi
                  </td>
                </tr>
                @if($expiresAt)
                <tr>
                  <td style="padding:4px 0;font-size:13px;color:#718096;">Berlaku Sampai:</td>
                  <td style="padding:4px 0;font-size:13px;font-weight:700;color:#2D3748;text-align:right;">
                    {{ $expiresAt }}
                  </td>
                </tr>
                @endif
              </table>

              <!-- Fitur & Benefit -->
              <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#8B4513;text-transform:uppercase;letter-spacing:0.5px;">
                Keuntungan Paket Anda:
              </p>
              <ul style="margin:0 0 24px;padding-left:20px;font-size:13px;color:#4A5568;line-height:1.8;">
                <li>Lencana eksklusif <strong>{{ $packageName }}</strong> pada profil pencarian & direktori peta.</li>
                <li>Prioritas tampil di urutan teratas daftar Tenaga Ahli & Surveyor Terpopuler.</li>
                <li>Kuota publikasi produk karya, dokumen, dan artikel lebih banyak.</li>
                <li>Akses fitur konsultasi langsung dan statistik ulasan profesional.</li>
              </ul>

              <!-- CTA Button -->
              <div style="text-align:center;margin:28px 0 12px;">
                <a href="{{ $dashboardUrl }}" style="display:inline-block;background:#8B4513;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:14px;box-shadow:0 4px 14px rgba(139,69,19,0.35);">
                  Buka Dashboard Profil Anda &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FAF9F6;border-top:1px solid #E5E2D9;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#A0AEC0;">
                Email ini dikirim secara otomatis oleh sistem {{ config('app.name') }}.<br>
                Jika Anda memiliki pertanyaan, silakan hubungi tim dukungan kami.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
