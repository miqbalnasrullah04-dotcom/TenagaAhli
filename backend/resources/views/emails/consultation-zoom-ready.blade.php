<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Zoom Sesi Konsultasi Anda Telah Siap</title>
</head>
<body style="margin:0;padding:0;background-color:#F5F4F0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1F2A22;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F5F4F0;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.06);border:1px solid #E5E2D9;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#0284C7 0%,#0369A1 100%);padding:36px 32px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:18px;line-height:56px;font-size:28px;margin-bottom:12px;">
                🎥
              </div>
              <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
                Ruang Zoom Sesi Konsultasi
              </h1>
              <p style="margin:8px 0 0;color:#E0F2FE;font-size:14px;font-weight:600;">
                Durasi Sesi: {{ $durationMinutes }} Menit
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
                Admin telah menyiapkan ruang rapat resmi <strong>Zoom Meeting</strong> untuk sesi konsultasi Anda. Berikut adalah rincian akses meeting:
              </p>

              <!-- Box Detail Zoom -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#F0F9FF;border:1.5px solid #BAE6FD;border-radius:16px;margin-bottom:24px;padding:20px;">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#0369A1;font-weight:600;">Jadwal / Waktu:</td>
                  <td style="padding:6px 0;font-size:13px;font-weight:700;color:#0C4A6E;text-align:right;">
                    {{ \Carbon\Carbon::parse($consultation->consultation_date)->translatedFormat('l, d F Y') }} • {{ $consultation->consultation_time }} WIB
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#0369A1;font-weight:600;">Durasi:</td>
                  <td style="padding:6px 0;font-size:13px;font-weight:800;color:#0284C7;text-align:right;">
                    {{ $durationMinutes }} Menit
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
                  <td style="padding:6px 0;font-size:13px;color:#0369A1;font-weight:600;">Topik:</td>
                  <td style="padding:6px 0;font-size:13px;font-weight:700;color:#0C4A6E;text-align:right;">
                    {{ $consultation->topic }}
                  </td>
                </tr>
                @if($meetingId)
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#0369A1;font-weight:600;">Meeting ID:</td>
                  <td style="padding:6px 0;font-size:13px;font-family:monospace;font-weight:700;color:#0C4A6E;text-align:right;">
                    {{ $meetingId }}
                  </td>
                </tr>
                @endif
                @if($passcode)
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#0369A1;font-weight:600;">Passcode:</td>
                  <td style="padding:6px 0;font-size:13px;font-family:monospace;font-weight:700;color:#0C4A6E;text-align:right;">
                    {{ $passcode }}
                  </td>
                </tr>
                @endif
              </table>

              <!-- CTA Button Zoom -->
              <div style="text-align:center;margin:28px 0 20px;">
                <a href="{{ $zoomLink }}" target="_blank" style="display:inline-block;background:#0284C7;color:#FFFFFF;text-decoration:none;font-size:15px;font-weight:800;padding:16px 36px;border-radius:14px;box-shadow:0 6px 20px rgba(2,132,199,0.35);">
                  🎥 Masuk ke Ruang Zoom Sekarang &rarr;
                </a>
              </div>

              <p style="margin:16px 0 0;font-size:12px;color:#718096;text-align:center;line-height:1.5;">
                Atau salin tautan berikut ke browser Anda:<br>
                <a href="{{ $zoomLink }}" style="color:#0284C7;word-break:break-all;">{{ $zoomLink }}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FAF9F6;border-top:1px solid #E5E2D9;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#A0AEC0;">
                Email resmi pemberitahuan ruang meeting dari {{ config('app.name') }}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
