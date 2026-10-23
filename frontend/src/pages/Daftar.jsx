import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import logo from '../assets/new logo.png';

/* ── Password rules ─────────────────────────────────────────────── */
const getPwRules = (t) => [
  { key: 'length', label: t('Minimal 8 karakter'), test: (v) => v.length >= 8 },
  { key: 'letter', label: t('Mengandung huruf'), test: (v) => /[a-zA-Z]/.test(v) },
  { key: 'number', label: t('Mengandung angka'), test: (v) => /[0-9]/.test(v) },
];

/* ── Shared input class ─────────────────────────────────────────── */
const INPUT_CLS =
  'w-full mt-1.5 border border-outline-variant/50 rounded-lg px-4 py-2.5 text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513] transition-colors bg-white';

export default function Daftar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role');

  // Redirect jika user sudah login
  useEffect(() => {
    const token = localStorage.getItem('amdal_token');
    const userRaw = localStorage.getItem('amdal_user');
    if (token && userRaw) {
      try {
        const user = JSON.parse(userRaw);
        if (user.role === 'admin') navigate('/admin', { replace: true });
        else if (user.role_type === 'tenaga_ahli' || user.role_type === 'tenaga_teknis') navigate('/dashboard', { replace: true });
        else if (user.role_type === 'surveyor') navigate('/dashboard-surveyor', { replace: true });
        else navigate('/akun', { replace: true });
      } catch {
        // ignore
      }
    }
  }, [navigate]);

  /* ── Form data ─────────────────────────────────────────────────── */
  const [form, setForm] = useState({
    role_type:
      initialRole === 'surveyor' || initialRole === 'tenaga_ahli' || initialRole === 'tenaga_teknis' || initialRole === 'klien'
        ? initialRole
        : '',
    name: '',
    email: '',
    password: '',
    password_confirmation: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  /* ── Helpers ───────────────────────────────────────────────────── */
  const handleChange = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
  };

  /* ── Validation ─────────────────────────────────────────────────── */
  const canSubmit = () => {
    setError('');
    if (!form.role_type) {
      setError(t('Pilih peran Anda terlebih dahulu.'));
      return false;
    }
    if (!form.name || !form.email || !form.password) {
      setError(t('Semua field wajib diisi.'));
      return false;
    }
    if (form.password.length < 8) {
      setError(t('Kata sandi minimal 8 karakter.'));
      return false;
    }
    if (form.password !== form.password_confirmation) {
      setError(t('Konfirmasi kata sandi tidak sama.'));
      return false;
    }
    return true;
  };

  /* ── Submit ────────────────────────────────────────────────────── */
  const handleSubmit = async () => {
    if (!canSubmit()) return;

    setLoading(true);
    setError('');
    try {
      const res = await api.post('/register', {
        name: form.name,
        email: form.email,
        password: form.password,
        password_confirmation: form.password_confirmation,
        role_type: form.role_type,
      });

      // Arahkan ke halaman verifikasi email
      navigate('/verifikasi-email', { 
        state: { 
          email: form.email
        } 
      });
    } catch (err) {
      console.error('Register error:', err);
      if (err.response?.status === 422) {
        const errors = err.response?.data?.errors;
        const firstError = errors ? Object.values(errors)[0]?.[0] : null;
        setError(firstError || err.response?.data?.message || t('auth.error.invalid_data', 'Data tidak valid.'));
      } else if (err.response?.status === 502 || err.response?.status === 504) {
        setError(t('auth.error.server_issue', 'Server sedang bermasalah. Coba beberapa saat lagi.'));
      } else if (!err.response) {
        setError(t('auth.error.no_connection', 'Tidak bisa terhubung ke server.'));
      } else {
        setError(err.response?.data?.message || t('auth.error.register_failed', 'Pendaftaran gagal. Periksa kembali data Anda.'));
      }
    } finally {
      setLoading(false);
    }
  };

  /* ════════════════════════════════════════════════════════════════ */
  /*  RENDER                                                        */
  /* ════════════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen flex">
      {/* ── Panel kiri — brand ─────────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[42%] relative bg-gradient-to-br from-[#55290A] via-[#8B4513] to-[#6B3410] overflow-hidden">
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
              <span style={{ color: '#ffffff' }}>Tenaga</span><span style={{ color: '#6B7280' }}>Ahli</span><span style={{ color: '#D2691E' }}>.com</span>
            </h1>
          </div>

          <div className="space-y-6">
            <h1 className="font-headline-lg text-4xl font-bold leading-tight">
              {t('auth.register_hero.title_line1', 'Promosikan')} <br />{t('auth.register_hero.title_line2', 'Keahlian Anda')}
            </h1>
            <p className="text-white/80 text-base leading-relaxed">
             {t('auth.register_hero.desc', 'Bergabunglah bersama tenaga ahli dari berbagai bidang dan tampilkan profil profesional Anda agar lebih mudah ditemukan oleh instansi, perusahaan, dan mitra yang membutuhkan keahlian Anda.')}
            </p>
            <ul className="space-y-3.5">
              {[
                {
                  icon: 'bolt',
                  text: t('auth.register_hero.feature1', 'Pendaftaran gratis dan mudah'),
                },
                {
                  icon: 'verified_user',
                  text: t('auth.register_hero.feature2', 'Profil Anda akan terverifikasi oleh tim kami'),
                },
                {
                  icon: 'travel_explore',
                  text: t('auth.register_hero.feature3', 'Dapatkan kesempatan proyek dari seluruh Indonesia'),
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

      {/* ── Panel kanan — form ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-background">
        {/* Topbar dengan logo */}
        <div className="pt-6 pb-2 text-center">
          <Link to="/" className="inline-block">
            <img src={logo} alt="TenagaAhli.com" className="h-12 sm:h-14 mx-auto w-auto object-contain" />
          </Link>
        </div>

        {/* Content area (scrollable) */}
        <div className="flex-1 overflow-y-auto px-6 pb-10 flex items-center justify-center">
          <div className="w-full max-w-md mx-auto">
            {error && (
              <p className="bg-error-container text-on-error-container text-sm rounded-lg px-4 py-3 mb-5 flex items-start gap-2">
                <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
                {error}
              </p>
            )}

            {/* Form Pendaftaran Sederhana */}
            <div className="animate-fadeIn">
              <div className="mb-8 text-center">
                <h2 className="font-headline-lg text-3xl font-bold text-on-background mb-2">
                  {t('Daftar')}
                </h2>
                <p className="text-sm text-on-surface-variant">
                  {t('auth.register_subtitle', 'Daftar sebagai tenaga ahli profesional di TenagaAhli.com')}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-outline-variant/30 p-6 sm:p-8 shadow-sm">
                <div className="flex flex-col gap-5">
                  {/* Pilih Role — card visual */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant block mb-2">
                      {t('Daftar Sebagai')} <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-1 gap-2.5">
                      {[
                        {
                          value: 'tenaga_ahli',
                          icon: 'school',
                          title: 'Tenaga Ahli',
                          desc: 'Menawarkan keahlian profesional & konsultasi',
                          color: '#8B4513',
                          bg: '#F4E8D0',
                        },
                        {
                          value: 'tenaga_teknis',
                          icon: 'badge',
                          title: 'Tenaga Teknis',
                          desc: 'Menyediakan keahlian teknis & operasional proyek',
                          color: '#0D9488',
                          bg: '#CCFBF1',
                        },
                        {
                          value: 'surveyor',
                          icon: 'explore',
                          title: 'Surveyor',
                          desc: 'Menyediakan jasa survei & pemetaan lapangan',
                          color: '#1E40AF',
                          bg: '#DBEAFE',
                        },
                        {
                          value: 'klien',
                          icon: 'person_search',
                          title: 'Klien',
                          desc: 'Mencari & menggunakan layanan tenaga ahli',
                          color: '#2E5E3B',
                          bg: '#E3F2E7',
                        },
                      ].map((opt) => {
                        const isSelected = form.role_type === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            onClick={() => setForm({ ...form, role_type: opt.value })}
                            className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                              isSelected
                                ? 'border-[#8B4513] shadow-sm'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            style={isSelected ? { backgroundColor: opt.bg, borderColor: opt.color } : {}}
                          >
                            <div
                              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: isSelected ? opt.color : '#F3F4F6', color: isSelected ? 'white' : '#6B7280' }}
                            >
                              <span className="material-symbols-outlined text-[20px]">{opt.icon}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-gray-900">{opt.title}</p>
                              <p className="text-xs text-gray-500 leading-tight">{opt.desc}</p>
                            </div>
                            {isSelected && (
                              <span
                                className="material-symbols-outlined text-[20px] ml-auto shrink-0"
                                style={{ color: opt.color }}
                              >
                                check_circle
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nama Lengkap */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t('Nama Lengkap')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      autoFocus
                      placeholder={t('auth.name_placeholder', 'Masukkan nama lengkap Anda')}
                      value={form.name}
                      onChange={handleChange('name')}
                      className={INPUT_CLS}
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t('Email')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder={t('nama@email.com')}
                      value={form.email}
                      onChange={handleChange('email')}
                      className={INPUT_CLS}
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t('Kata Sandi')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1.5">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        minLength={8}
                        placeholder={t('Minimal 8 karakter')}
                        value={form.password}
                        onChange={handleChange('password')}
                        className="w-full border border-outline-variant/50 rounded-lg px-4 py-2.5 pr-11 text-sm placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513] transition-colors bg-white"
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

                    {form.password.length > 0 && (
                      <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2">
                        {getPwRules(t).map((req) => {
                          const passed = req.test(form.password);
                          return (
                            <li
                              key={req.key}
                              className={`flex items-center gap-1 text-xs ${
                                passed ? 'text-[#6B3410]' : 'text-on-surface-variant/50'
                              }`}
                            >
                              <span className="material-symbols-outlined text-[14px]">
                                {passed ? 'check_circle' : 'radio_button_unchecked'}
                              </span>
                              {req.label}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      {t('Konfirmasi Kata Sandi')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder={t('Ketik ulang kata sandi')}
                      value={form.password_confirmation}
                      onChange={handleChange('password_confirmation')}
                      className={INPUT_CLS}
                    />
                    {form.password_confirmation.length > 0 &&
                      form.password !== form.password_confirmation && (
                        <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">error</span>
                          {t('Kata sandi tidak cocok')}
                        </p>
                      )}
                    {form.password_confirmation.length > 0 &&
                      form.password === form.password_confirmation && (
                        <p className="text-xs text-[#6B3410] mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">check_circle</span>
                          {t('Kata sandi cocok')}
                        </p>
                      )}
                  </div>

                  {/* Submit Button */}
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full bg-[#8B4513] text-white py-3 px-6 rounded-lg text-sm font-bold hover:bg-[#6B3410] active:scale-[0.99] transition-all disabled:opacity-60 disabled:active:scale-100 flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        {t('Memuat...')}
                      </>
                    ) : (
                      <>
                        {t('Daftar')}
                        <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Link ke sign in */}
              <p className="text-center text-sm text-on-surface-variant mt-6">
                {t('Sudah punya akun?')}{' '}
                <Link to="/sign-in" className="text-[#6B3410] font-bold hover:underline">
                  {t('Masuk di sini')}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}