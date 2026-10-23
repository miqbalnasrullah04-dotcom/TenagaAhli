import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import logo from '../assets/new logo.png';

export default function SignIn() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const justRegistered = location.state?.registered;
  const messageFromState = location.state?.message;

  // Redirect jika user sudah login
  useEffect(() => {
    const token = localStorage.getItem('amdal_token');
    const userRaw = localStorage.getItem('amdal_user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        const searchParams = new URLSearchParams(location.search);
        const targetRedirect = location.state?.redirect || searchParams.get('redirect');

        if (targetRedirect) {
          navigate(targetRedirect, { replace: true });
        } else if (user.role === 'admin') {
          navigate('/admin', { replace: true });
        } else if (user.role_type === 'tenaga_ahli' || user.role_type === 'tenaga_teknis') {
          navigate('/dashboard', { replace: true });
        } else if (user.role_type === 'surveyor') {
          navigate('/dashboard-surveyor', { replace: true });
        } else {
          navigate('/akun', { replace: true });
        }
      } catch {
        // ignore
      }
    }
  }, [navigate, location.state, location.search]);

  // Set success message from navigation state on component mount
  useEffect(() => {
    if (messageFromState) {
      setSuccessMessage(messageFromState);
      // Clear message from state after displaying
      window.history.replaceState({}, document.title);
    }
  }, [messageFromState]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/login', form);
      if (!res.data || !res.data.token || !res.data.user) {
        throw new Error('Respon login dari server tidak valid.');
      }
      localStorage.setItem('amdal_token', res.data.token);
      localStorage.setItem('amdal_user', JSON.stringify(res.data.user));

      const { role, role_type } = res.data.user;
      const searchParams = new URLSearchParams(location.search);
      const targetRedirect = location.state?.redirect || searchParams.get('redirect');

      if (targetRedirect) {
        navigate(targetRedirect);
      } else if (role === 'admin') {
        navigate('/admin');
      } else if (role_type === 'tenaga_ahli' || role_type === 'tenaga_teknis') {
        navigate('/dashboard');
      } else if (role_type === 'surveyor') {
        navigate('/dashboard-surveyor');
      } else {
        // klien — tidak punya dashboard, ke halaman profil akun
        navigate('/akun');
      }
    } catch (err) {
      console.error('Login error:', err);

      const status = err.response?.status;
      const message = err.response?.data?.message || '';

      // Handle berbagai error
      if (status === 422) {
        const errors = err.response?.data?.errors;
        const firstError = errors ? Object.values(errors)[0]?.[0] : null;
        setError(firstError || message || t('auth.error.invalid_data', 'Data tidak valid.'));
      } else if (status === 403 && !err.response?.data?.email_verified) {
        navigate('/verifikasi-email', { 
          state: { 
            email: err.response?.data?.email || form.email 
          } 
        });
      } else if (status === 401) {
        setError(t('auth.error.wrong_credentials', 'Email atau kata sandi salah.'));
      } else if (status === 502 || status === 504) {
        setError(t('auth.error.server_issue', 'Server sedang bermasalah. Coba beberapa saat lagi.'));
      } else if (!err.response) {
        setError(t('auth.error.no_connection', 'Tidak bisa terhubung ke server.'));
      } else {
        setError(message || t('auth.error.wrong_credentials', 'Email atau kata sandi salah.'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Panel kiri — brand */}
      <div className="hidden lg:flex lg:w-[42%] relative bg-gradient-to-br from-[#55290A] to-[#8B4513] overflow-hidden">
        {/* ── Animated ocean-wave background ─────────────────────────
            Each <svg> layer draws the SAME wave shape twice, back to
            back (0–600 then 600–1200 in viewBox units). Because the
            wave itself has a period of 300 units, shifting the whole
            layer left by exactly 600 units (= 50% of its own rendered
            width) lands on a pixel-identical frame — so the CSS loop
            never shows a seam. Three layers at different speeds /
            opacities / vertical offsets give it a parallax, "swell"
            feel instead of one flat scroll. */}
        <div className="absolute inset-0 overflow-hidden">
          <svg
            className="wave-layer wave-layer-back"
            viewBox="0 0 1200 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <g opacity="0.12" stroke="#EAD7C5" strokeWidth="1.5">
              <path d="M0,140 Q75,110 150,140 T300,140 T450,140 T600,140 T750,140 T900,140 T1050,140 T1200,140" />
              <path d="M0,360 Q75,330 150,360 T300,360 T450,360 T600,360 T750,360 T900,360 T1050,360 T1200,360" />
              <path d="M0,580 Q75,550 150,580 T300,580 T450,580 T600,580 T750,580 T900,580 T1050,580 T1200,580" />
              <path d="M0,800 Q75,770 150,800 T300,800 T450,800 T600,800 T750,800 T900,800 T1050,800 T1200,800" />
            </g>
          </svg>

          <svg
            className="wave-layer wave-layer-mid"
            viewBox="0 0 1200 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <g opacity="0.16" stroke="#EAD7C5" strokeWidth="1.5">
              <path d="M0,220 Q75,175 150,220 T300,220 T450,220 T600,220 T750,220 T900,220 T1050,220 T1200,220" />
              <path d="M0,440 Q75,395 150,440 T300,440 T450,440 T600,440 T750,440 T900,440 T1050,440 T1200,440" />
              <path d="M0,660 Q75,615 150,660 T300,660 T450,660 T600,660 T750,660 T900,660 T1050,660 T1200,660" />
            </g>
          </svg>

          <svg
            className="wave-layer wave-layer-front"
            viewBox="0 0 1200 900"
            preserveAspectRatio="xMidYMid slice"
            fill="none"
          >
            <g opacity="0.20" stroke="#F5EBE1" strokeWidth="1.5">
              <path d="M0,300 Q75,265 150,300 T300,300 T450,300 T600,300 T750,300 T900,300 T1050,300 T1200,300" />
              <path d="M0,520 Q75,485 150,520 T300,520 T450,520 T600,520 T750,520 T900,520 T1050,520 T1200,520" />
              <path d="M0,740 Q75,705 150,740 T300,740 T450,740 T600,740 T750,740 T900,740 T1050,740 T1200,740" />
            </g>
          </svg>
        </div>

        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          <div className="inline-block">
            <h1 className="text-3xl md:text-4xl font-bold">
              <span style={{ color: '#f5f3f3' }}>Tenaga</span><span style={{ color: '#6B7280' }}>Ahli</span><span style={{ color: '#D2691E' }}>.com</span>
            </h1>
          </div>

          <div>
            <h1 className="font-headline-lg text-4xl font-bold leading-tight mb-4">
              {t('auth.hero.title_line1', 'Platform Pencarian')}<br />{t('auth.hero.title_line2', ' TenagaAhli Akademik Profesional.')}
            </h1>
            <p className="text-white/70 text-sm max-w-sm leading-relaxed mb-6">
              {t('auth.hero.desc', 'Kelola profil profesional keahlian anda dengan berbagai peluang kajian, proyek, penelitian di seluruh indonesia.')}
            </p>
            <ul className="space-y-3.5">
              {[
                {
                  icon: 'workspace_premium',
                  text: t('auth.hero.feature1', 'Bangun reputasi profesional tenaga ahli'),
                },
                {
                  icon: 'hub',
                  text: t('auth.hero.feature2', 'Dapatkan akses ke tenaga ahli atau surveyor'),
                },
                {
                  icon: 'public',
                  text: t('auth.hero.feature3', 'Jadilah bagian dari tenaga ahli nasional'),
                },
              ].map((item) => (
                <li key={item.text} className="flex items-center gap-3 text-white/90 text-sm">
                  <div className="w-8 h-8 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="material-symbols-outlined text-[18px] text-[#F5EBE1]">
                      {item.icon}
                    </span>
                  </div>
                  <span className="font-medium">{item.text}</span>
                </li>
              ))}
            </ul>
          </div>

          <p className="text-white/50 text-xs">© 2026 TenagaAhli.com — All rights reserved.</p>
        </div>

        <style>{`
          .wave-layer {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 200%;
          }
          @keyframes wave-scroll {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
          .wave-layer-back {
            animation: wave-scroll 26s linear infinite;
          }
          .wave-layer-mid {
            animation: wave-scroll 18s linear infinite;
          }
          .wave-layer-front {
            animation: wave-scroll 12s linear infinite reverse;
          }
          @media (prefers-reduced-motion: reduce) {
            .wave-layer { animation: none; }
          }
        `}</style>
      </div>

      {/* Panel kanan — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-16 bg-background">
        <div className="w-full max-w-sm">
          {/* Topbar dengan logo */}
          <div className="mb-8 text-center">
            <Link to="/" className="inline-block">
              <img src={logo} alt="TenagaAhli.com" className="h-12 sm:h-14 mx-auto w-auto object-contain" />
            </Link>
          </div>

          <h2 className="font-headline-md text-2xl font-bold text-on-background mb-1">{t('Masuk')}</h2>
          <p className="text-sm text-on-surface-variant mb-8">{t('auth.login_subtitle', 'Kelola profil tenaga ahli Anda.')}</p>

          {(justRegistered || successMessage) && !error && (
            <p className="bg-[#F5EBE1] text-[#55290A] text-sm rounded-lg px-4 py-3 mb-5 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">check_circle</span>
              <span>{successMessage || t('auth.register_success', 'Pendaftaran berhasil. Silakan masuk dengan akun Anda.')}</span>
            </p>
          )}

          {error && (
            <p className="bg-error-container text-on-error-container text-sm rounded-lg px-4 py-3 mb-5">{error}</p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t('Email')}</label>
              <input
                type="text"
                autoComplete="username"
                required
                autoFocus
                placeholder={t('nama@email.com')}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full mt-1.5 border border-outline-variant/50 rounded-lg px-4 py-2.5 text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513] transition-colors"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{t('Kata Sandi')}</label>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full border border-outline-variant/50 rounded-lg px-4 py-2.5 pr-11 text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50 hover:text-on-surface-variant"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <div className="text-right mt-2">
                <Link to="/lupa-password" className="text-xs font-semibold text-[#8B4513] hover:underline">
                  {t('Lupa Password?')}
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 bg-[#8B4513] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#6B3410] active:scale-[0.99] transition-all disabled:opacity-60 disabled:active:scale-100"
            >
              {loading ? t('Memuat...') : t('Masuk')}
            </button>
          </form>

          <p className="text-center text-sm text-on-surface-variant mt-8">
            {t('Belum punya akun?')}{' '}
            <Link to="/daftar" className="text-[#6B3410] font-bold hover:underline">
              {t('Daftar di sini')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}