<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Peringatan: 1 Jam Lagi Sesi Konsultasi Dimulai</title>
</head>
<body style="margin:0;padding:0;background-color:#FDF8F6;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased;color:#1F2A22;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FDF8F6;padding:36px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;background:#FFFFFF;border-radius:24px;overflow:hidden;box-shadow:0 8px 30px rgba(0,0,0,0.08);border:1px solid #FED7AA;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#EA580C 0%,#C2410C 100%);padding:36px 32px;text-align:center;">
              <div style="display:inline-block;width:56px;height:56px;background:rgba(255,255,255,0.2);border-radius:18px;line-height:56px;font-size:28px;margin-bottom:12px;">
                ⚡
              </div>
              <h1 style="margin:0;color:#FFFFFF;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
                1 Jam Lagi Konsultasi Dimulai!
              </h1>
              <p style="margin:8px 0 0;color:#FFEDD5;font-size:14px;font-weight:600;">
                Pukul {{ $consultation->consultation_time ?? 'Segera' }} WIB
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#2D3748;">
                Halo <strong>{{ $recipientType === 'expert' ? $expert->name : $consultation->client_name }}</strong>,
              </p>
              <div style="background:#FFF7ED;border-left:4px solid #EA580C;border-radius:8px;padding:14px 16px;margin-bottom:20px;">
                <p style="margin:0;font-size:14px;line-height:1.5;color:#9A3412;font-weight:600;">
                  ⚠️ Peringatan Waktu: Sesi konsultasi Anda akan dimulai dalam kurang lebih <strong>1 jam ke depan</strong>. Mohon segera bersiap!
                </p>
              </div>

              <!-- Box Detail Jadwal -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFFBEB;border:1.5px solid #FDE68A;border-radius:16px;margin-bottom:24px;padding:20px;">
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#92400E;font-weight:600;">Waktu / Jam:</td>
                  <td style="padding:6px 0;font-size:15px;font-weight:800;color:#EA580C;text-align:right;">
                    {{ $consultation->consultation_time ?? '09:00' }} WIB (Hari Ini)
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#92400E;font-weight:600;">
                    {{ $recipientType === 'expert' ? 'Klien / Pemohon:' : 'Tenaga Ahli:' }}
                  </td>
                  <td style="padding:6px 0;font-size:13px;font-weight:700;color:#78350F;text-align:right;">
                    {{ $recipientType === 'expert' ? $consultation->client_name : $expert->name }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#92400E;font-weight:600;">Topik:</td>
                  <td style="padding:6px 0;font-size:13px;font-weight:700;color:#78350F;text-align:right;">
                    {{ $consultation->topic }}
                  </td>
                </tr>
                <tr>
                  <td style="padding:6px 0;font-size:13px;color:#92400E;font-weight:600;">Kontak WhatsApp:</td>
                  <td style="padding:6px 0;font-size:13px;font-weight:700;color:#78350F;text-align:right;">
                    {{ $recipientType === 'expert' ? ($consultation->client_phone ?? '-') : ($expert->whatsapp ?? $expert->phone ?? '-') }}
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 24px;font-size:13px;color:#4A5568;line-height:1.6;">
                Silakan buka tautan detail atau hubungi pihak terkait melalui WhatsApp untuk koordinasi media meeting (Google Meet / Zoom / Chat).
              </p>

              <!-- CTA Button -->
              <div style="text-align:center;margin:24px 0 12px;">
                <a href="{{ $actionUrl }}" style="display:inline-block;background:#EA580C;color:#FFFFFF;text-decoration:none;font-size:14px;font-weight:700;padding:14px 32px;border-radius:14px;box-shadow:0 4px 14px rgba(234,88,12,0.35);">
                  Buka Detail Konsultasi Sekarang &rarr;
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#FFFBF7;border-top:1px solid #FED7AA;padding:20px 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9A3412;">
                Email pengingat prioritas dari sistem {{ config('app.name') }}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>
