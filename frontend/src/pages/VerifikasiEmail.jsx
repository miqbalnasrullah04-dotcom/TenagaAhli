import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';

const RESEND_COOLDOWN = 60; // detik

export default function VerifikasiEmail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(RESEND_COOLDOWN);
  const inputRefs = useRef([]);

  useEffect(() => {
    const emailFromState = location.state?.email;
    if (!emailFromState) {
      navigate('/daftar');
      return;
    }
    setEmail(emailFromState);
  }, [location.state, navigate]);

  // Countdown timer untuk tombol resend
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1); // Only take last character
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    // Handle backspace
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const newOtp = pastedData.split('').concat(Array(6).fill('')).slice(0, 6);
    setOtp(newOtp);
    
    // Focus last filled input or first empty
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpCode = otp.join('');
    
    if (otpCode.length !== 6) {
      setError('Masukkan kode OTP 6 digit.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/verify-email', {
        email,
        otp_code: otpCode,
      });

      setSuccess('Email berhasil diverifikasi!');
      setTimeout(() => {
        navigate('/sign-in', {
          state: { message: 'Email Anda telah diverifikasi! Silakan login untuk melanjutkan.' }
        });
      }, 1500);
    } catch (err) {
      console.error('Verify error:', err);
      setError(err.response?.data?.message || 'Kode OTP salah atau sudah kadaluarsa.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResending(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/resend-otp', { email });
      setSuccess('Kode OTP baru telah dikirim. Cek folder Inbox dan Spam/Junk di email Anda.');
      setOtp(['', '', '', '', '', '']);
      setCountdown(RESEND_COOLDOWN);
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="font-headline-md text-xl font-bold text-[#6B3410] block mb-8 text-center">
          TenagaAhli<span className="text-[#C89368]">.com</span>
        </Link>

        <div className="bg-white rounded-2xl border border-outline-variant/30 p-8 shadow-sm">
          {/* Icon */}
          <div className="w-20 h-20 bg-[#F5EBE1] rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-5xl text-[#6B3410]">mail</span>
          </div>

          {/* Header */}
          <h1 className="text-2xl font-bold text-on-background text-center mb-2">
            {t('Verifikasi Email')}
          </h1>
          <p className="text-sm text-on-surface-variant text-center mb-6">
            {t('auth.verify_email_desc', 'Kami telah mengirim kode verifikasi 6 digit ke')}<br />
            <strong className="text-[#6B3410]">{email}</strong>
          </p>

          {/* Alert messages */}

          {error && (
            <div className="bg-error-container text-on-error-container text-sm rounded-lg px-4 py-3 mb-5 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
              {error}
            </div>
          )}

          {success && (
            <div className="bg-[#F5EBE1] text-[#55290A] text-sm rounded-lg px-4 py-3 mb-5 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">check_circle</span>
              {success}
            </div>
          )}

          {/* OTP Input Form */}
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 justify-center mb-6">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  className="w-12 h-14 text-center text-2xl font-bold border-2 border-outline-variant/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513] transition-colors"
                  autoFocus={index === 0}
                />
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || otp.join('').length !== 6}
              className="w-full bg-[#8B4513] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#6B3410] active:scale-[0.99] transition-all disabled:opacity-60 disabled:active:scale-100 mb-4"
            >
              {loading ? t('Memuat...') : t('Verifikasi')}
            </button>

            {/* Resend OTP */}
            <div className="text-center">
              <p className="text-sm text-on-surface-variant mb-2">
                {t('auth.resend_otp_question', 'Tidak menerima kode?')}
              </p>
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resending || countdown > 0}
                className="text-sm font-bold text-[#6B3410] hover:underline disabled:opacity-50 disabled:no-underline"
              >
                {resending
                  ? 'Mengirim...'
                  : countdown > 0
                  ? `Kirim ulang dalam ${countdown}d`
                  : t('auth.resend_otp', 'Kirim Ulang Kode')}
              </button>
            </div>
          </form>

          {/* Info */}
          <div className="mt-6 pt-5 border-t border-outline-variant/20 space-y-3">
            {/* Checklist panduan */}
            <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">
              Tidak menerima email?
            </p>
            {[
              { icon: 'inbox',       text: 'Cek folder <strong>Inbox</strong> di ' + email },
              { icon: 'report',      text: 'Cek folder <strong>Spam / Junk</strong>' },
              { icon: 'label',       text: 'Cek tab <strong>Promotions</strong> atau <strong>Social</strong> (Gmail)' },
              { icon: 'schedule',    text: 'Tunggu <strong>1–2 menit</strong> — email bisa sedikit telat' },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-on-surface-variant">
                <span className="material-symbols-outlined text-[15px] text-[#6B3410] shrink-0 mt-0.5">{item.icon}</span>
                <p dangerouslySetInnerHTML={{ __html: item.text }} />
              </div>
            ))}

            {/* Divider */}
            <div className="pt-2 border-t border-outline-variant/15" />

            <div className="flex items-start gap-2 text-xs text-on-surface-variant">
              <span className="material-symbols-outlined text-[15px] shrink-0 mt-0.5">timer</span>
              <p>Kode OTP berlaku selama <strong>10 menit</strong> sejak dikirim.</p>
            </div>
          </div>
        </div>

        {/* Back to register */}
        <p className="text-center text-sm text-on-surface-variant mt-6">
          Salah email?{' '}
          <Link to="/daftar" className="text-[#6B3410] font-bold hover:underline">
            Daftar ulang
          </Link>
        </p>
      </div>
    </div>
  );
}
