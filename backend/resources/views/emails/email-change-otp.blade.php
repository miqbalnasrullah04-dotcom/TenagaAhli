<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verifikasi Perubahan Email</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 30px 15px;">
    <div style="max-width: 580px; background-color: #ffffff; padding: 35px 30px; margin: 0 auto; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);">
        <div style="text-align: center; margin-bottom: 25px;">
            <h2 style="color: #8B4513; margin: 0 0 6px; font-size: 24px;">TenagaAhli.com</h2>
            <span style="font-size: 13px; color: #64748b;">Permintaan Pembaruan Alamat Email Akun</span>
        </div>

        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
            Halo <strong>{{ $userName ?: 'Pengguna' }}</strong>,
        </p>

        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin-bottom: 20px;">
            Kami menerima permintaan untuk mengubah alamat email login akun Anda ke alamat email ini (<strong>{{ $newEmail }}</strong>). Untuk mengonfirmasi dan menyelesaikan proses perubahan, silakan masukkan kode verifikasi (OTP) berikut:
        </p>

        <div style="background: linear-gradient(135deg, #fdf8f4 0%, #fef3e7 100%); border: 2px dashed #8B4513; padding: 22px; text-align: center; margin: 25px 0; border-radius: 12px;">
            <span style="font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #8B4513; font-family: monospace;">{{ $otpCode }}</span>
        </div>

        <p style="color: #64748b; font-size: 13px; margin: 15px 0 0;">
            <em>&bull; Kode OTP ini berlaku selama <strong>10 menit</strong>.</em><br>
            <em>&bull; Demi keamanan akun Anda, jangan berikan kode ini kepada siapa pun termasuk pihak TenagaAhli.com.</em>
        </p>

        <div style="margin-top: 30px; padding: 14px 16px; background-color: #f1f5f9; border-radius: 8px; border-left: 4px solid #94a3b8;">
            <p style="color: #475569; font-size: 12px; margin: 0; line-height: 1.5;">
                Jika Anda tidak merasa mengajukan perubahan email ini, abaikan email ini atau segera ubah kata sandi akun Anda. Email lama Anda tetap aman dan aktif.
            </p>
        </div>

        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0 20px;">
        <p style="color: #94a3b8; font-size: 11px; text-align: center; margin: 0;">
            &copy; {{ date('Y') }} TenagaAhli.com. Seluruh hak cipta dilindungi.
        </p>
    </div>
</body>
</html>
