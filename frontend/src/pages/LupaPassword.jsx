import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import logo from '../assets/new logo.png';

export default function LupaPassword() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  // Step 1: Kirim email
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/forgot-password', { email });
      setMessage(response.data.message);
      setStep(2); // Lanjut ke step OTP
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengirim kode verifikasi.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verifikasi OTP & set password baru
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== passwordConfirmation) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    if (password.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.post('/reset-password', {
        email,
        token: otp,
        password,
        password_confirmation: passwordConfirmation,
      });
      
      setMessage(response.data.message);
      setStep(3); // Success
      
      // Redirect ke login setelah 3 detik
      setTimeout(() => {
        navigate('/sign-in');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mereset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EBE1] via-white to-[#FAF5F0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <img src={logo} alt="TenagaAhli.com" className="h-12 mx-auto" />
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('Lupa Password')}</h1>
              <p className="text-sm text-gray-600 mb-6">
                {t('Masukkan email Anda untuk menerima kode verifikasi.')}
              </p>

              <form onSubmit={handleSendOTP} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                {message && (
                  <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg text-sm">
                    {message}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('Email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#8B4513] text-white py-3 rounded-lg font-semibold hover:bg-[#0F63B0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('Mengirim...') : t('Kirim Kode Verifikasi')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <Link to="/sign-in" className="text-sm text-[#8B4513] hover:underline">
                  {t('Kembali ke Login')}
                </Link>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('Verifikasi Kode')}</h1>
              <p className="text-sm text-gray-600 mb-6">
                {t('Masukkan kode 6 digit yang telah dikirim ke')} <strong>{email}</strong>
              </p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('Kode Verifikasi')}
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-widest focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('Password Baru')}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimal 8 karakter"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {t('Konfirmasi Password Baru')}
                  </label>
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Ketik ulang password"
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#8B4513] focus:border-transparent"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#8B4513] text-white py-3 rounded-lg font-semibold hover:bg-[#0F63B0] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('Memproses...') : t('Reset Password')}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-[#8B4513] hover:underline"
                >
                  {t('Kirim ulang kode')}
                </button>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-green-600 text-4xl">check_circle</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('Password Berhasil Direset')}</h1>
                <p className="text-sm text-gray-600 mb-6">
                  {t('Anda akan diarahkan ke halaman login...')}
                </p>
                <Link
                  to="/sign-in"
                  className="inline-block bg-[#8B4513] text-white px-6 py-3 rounded-lg font-semibold hover:bg-[#0F63B0] transition-colors"
                >
                  {t('Login Sekarang')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
