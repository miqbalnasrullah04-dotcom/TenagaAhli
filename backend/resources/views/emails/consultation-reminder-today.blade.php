<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pengingat Jadwal Konsultasi Hari Ini</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1F2A22;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F4F0;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.06);border:1px solid #E5E2D9;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0284C7 0%,#0369A1 100%);padding:36px 32px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;background:rgba(255,255,255,0.15);border-radius:18px;line-height:56px;font-size:28px;margin-bottom:12px;">
                📅
              </div>
              <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
                Jadwal Konsultasi Hari Ini
              </h1>
              <p style="margin:8px 0 0;color:#E0F2FE;font-size:14px;font-weight:600;">
                Pukul {{ $consultation->consultation_time ?? 'Sesuai Jadwal' }} WIB
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2D3748;">
                Halo <strong>{{ $recipientType === 'expert' ? $expert->name : $consultation->client_name }}</strong>,
              </p>
              <p style="margin:0 0 20px;font-size:14px;line-height:1.6;color:#4A5568;">
                Ini adalah pengingat bahwa Anda memiliki sesi konsultasi yang dijadwalkan pada <strong>hari ini</strong>:
              </p>

              <!-- Box Detail Jadwal -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;border:1.5px solid #BAE6FD;border-radius:16px;margin-bottom:24px;padding:20px;">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#0369A1;font-weight:600;">Tanggal:</td>
                  <td style="padding:6px 0;font-size:13px;font-weight:700;color:#0C4A6E;text-align:right;">
                    {{ \Carbon\Carbon::parse($consultation->consultation_date)->translatedFormat('l, d F Y') }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#0369A1;font-weight:600;">Waktu / Jam:</td>
                  <td style="padding:6px 0;font-size:14px;font-weight:800;color:#0284C7;text-align:right;">
                    {{ $consultation->consultation_time ?? '09:00' }} WIB
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#0369A1;font-weight:600;">
                    {{ $recipientType === 'expert' ? 'Klien / Pemohon:' : 'Tenaga Ahli:' }}
                  </td>
                  <td style="padding:6px 0;font-size:13px;font-weight:700;color:#0C4A6E;text-align:right;">
                    {{ $recipientType === 'expert' ? $consultation->client_name : $expert->name }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#0369A1;font-weight:600;">Topik Konsultasi:</td>
                  <td style="padding:6px 0;font-size:13px;font-weight:700;color:#0C4A6E;text-align:right;">
                    {{ $consultation->topic }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#0369A1;font-weight:600;">Kontak WhatsApp:</td>
                  <td style="padding:6px 0;font-size:13px;font-weight:700;color:#0C4A6E;text-align:right;">
                    {{ $recipientType === 'expert' ? ($consultation->client_phone ?? '-') : ($expert->whatsapp ?? $expert->phone ?? '-') }}
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:13px;color:#4A5568;line-height:1.6;">
                Harap persiapkan materi dan perangkat Anda sebelum sesi dimulai. Pastikan koneksi internet stabil agar diskusi berjalan lancar.
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:24px 0 12px;">
                <a href="{{ $actionUrl }}" style="display:inline-block;background:#0284C7;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:14px;box-shadow:0 4px 14px rgba(2,132,199,0.35);">
                  Lihat Detail Konsultasi &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FAF9F6;border-top:1px solid #E5E2D9;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#A0AEC0;">
                Email ini dikirim otomatis sebagai pengingat resmi dari {{ config('app.name') }}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
