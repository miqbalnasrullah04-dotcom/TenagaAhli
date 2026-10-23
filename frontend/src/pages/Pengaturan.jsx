import { useTranslation } from '../context/LanguageContext.jsx';
import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { SkeletonPengaturan } from '../components/Skeleton.jsx';

// ── Design Tokens & Constants ──────────────────────────────────────────────────
const BRAND_BROWN = '#8B4513';
const BRAND_GREEN = '#2E5E3B';

function getPhotoUrl(u) {
  if (!u) return null;
  const photoUrl = u.avatar_url || u.foto || u.photo || u.expert?.photo;
  if (!photoUrl) return null;
  if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('blob:') || photoUrl.startsWith('data:')) {
    return photoUrl;
  }
  const apiUrl = import.meta.env.VITE_API_URL || 'https://tenagaahli.com/api';
  const cleanPath = photoUrl.replace(/^\/+/, '').replace(/^storage\//, '').replace(/^public\//, '');
  return `${apiUrl}/files/${cleanPath}`;
}

// ── Password Strength Calculator ──────────────────────────────────────────────
function getPasswordStrength(pw) {
  if (!pw) return { score: 0, label: '', color: 'bg-gray-200', textCol: 'text-gray-400' };
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[0-9]/.test(pw)) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;

  if (score <= 2) return { score: 1, label: 'Lemah', color: 'bg-rose-500', textCol: 'text-rose-600' };
  if (score === 3) return { score: 2, label: 'Cukup', color: 'bg-amber-500', textCol: 'text-amber-600' };
  if (score === 4) return { score: 3, label: 'Kuat', color: 'bg-blue-600', textCol: 'text-blue-600' };
  return { score: 4, label: 'Sangat Kuat', color: 'bg-emerald-600', textCol: 'text-emerald-700' };
}

// ── User-Friendly Toggle Switch ───────────────────────────────────────────────
function ToggleSwitch({ enabled, onChange, title, description, icon, badge }) {
  return (
    <div className="flex items-start justify-between gap-4 py-4 px-4 sm:px-5 rounded-2xl hover:bg-gray-50/80 transition-colors border border-transparent hover:border-black/5">
      <div className="flex items-start gap-3.5 min-w-0">
        {icon && (
          <div className="w-9 h-9 rounded-xl bg-[#2E5E3B]/10 text-[#2E5E3B] flex items-center justify-center shrink-0 mt-0.5">
            <span className="material-symbols-outlined text-[19px]">{icon}</span>
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">{title}</p>
            {badge && (
              <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-amber-100 text-amber-800">
                {badge}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[11px] sm:text-xs text-gray-500 mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2.5 shrink-0 pt-0.5">
        <span className={`text-[11px] font-bold hidden sm:inline ${enabled ? 'text-[#2E5E3B]' : 'text-gray-400'}`}>
          {enabled ? 'Aktif' : 'Nonaktif'}
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => onChange(!enabled)}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            enabled ? 'bg-[#2E5E3B]' : 'bg-gray-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
              enabled ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

// ── Section Card Container ────────────────────────────────────────────────────
function SettingsCard({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-3xl border border-black/5 shadow-xs p-6 sm:p-8 transition-all ${className}`}>
      {children}
    </div>
  );
}

// ── Section Header ────────────────────────────────────────────────────────────
function SettingsHeader({ icon, title, subtitle, badge }) {
  return (
    <div className="flex items-start justify-between gap-4 pb-5 mb-6 border-b border-black/5">
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-2xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-[24px]">{icon}</span>
        </div>
        <div>
          <h3 className="font-extrabold text-base sm:text-lg text-gray-900 leading-tight">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-1 leading-normal">{subtitle}</p>}
        </div>
      </div>
      {badge && (
        <span className="hidden sm:inline-flex px-3 py-1 text-[11px] font-bold rounded-xl bg-gray-100 text-gray-700 border border-gray-200">
          {badge}
        </span>
      )}
    </div>
  );
}

// ── Main Page Component ───────────────────────────────────────────────────────
export default function Pengaturan() {
  const { t, language, changeLanguage } = useTranslation();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState('profil');

  // User State
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Tab 1: Profil & Akun
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef(null);

  // Email Change & Re-verification State
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailModalStep, setEmailModalStep] = useState('input'); // 'input' | 'otp'
  const [newEmailInput, setNewEmailInput] = useState('');
  const [emailOtpInput, setEmailOtpInput] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailCountdown, setEmailCountdown] = useState(0);
  const [emailModalError, setEmailModalError] = useState('');
  const [emailDebugOtp, setEmailDebugOtp] = useState('');

  // Tab 2: Keamanan & Sandi
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [loggingOutOthers, setLoggingOutOthers] = useState(false);

  // Tab 3: Notifikasi
  const [notifSettings, setNotifSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('user_notif_prefs');
      return saved ? JSON.parse(saved) : {
        emailOrders: true,
        emailChat: true,
        emailReviews: true,
        emailUpdates: false,
        pushConsultation: true,
        pushPromo: false,
      };
    } catch {
      return {
        emailOrders: true,
        emailChat: true,
        emailReviews: true,
        emailUpdates: false,
        pushConsultation: true,
        pushPromo: false,
      };
    }
  });

  // Tab 4: Tampilan & Preferensi
  const [timezone, setTimezone] = useState(() => localStorage.getItem('app_timezone') || 'WIB');

  // Zona Bahaya (Modal Hapus / Nonaktifkan Akun)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deactivating, setDeactivating] = useState(false);

  // Device Info
  const [deviceInfo, setDeviceInfo] = useState({ os: 'Windows PC', browser: 'Google Chrome', time: '' });

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Timer countdown untuk OTP email
  useEffect(() => {
    let timer;
    if (emailCountdown > 0) {
      timer = setInterval(() => {
        setEmailCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [emailCountdown]);

  useEffect(() => {
    const ua = navigator.userAgent;
    let os = 'Perangkat Komputer';
    if (ua.indexOf('Win') !== -1) os = 'Windows PC';
    else if (ua.indexOf('Mac') !== -1) os = 'Apple macOS';
    else if (ua.indexOf('Linux') !== -1) os = 'Linux OS';
    else if (ua.indexOf('Android') !== -1) os = 'Android Smartphone';
    else if (ua.indexOf('like Mac') !== -1) os = 'Apple iOS (iPhone/iPad)';

    let browser = 'Modern Browser';
    if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Edg') === -1) browser = 'Google Chrome';
    else if (ua.indexOf('Edg') !== -1) browser = 'Microsoft Edge';
    else if (ua.indexOf('Firefox') !== -1) browser = 'Mozilla Firefox';
    else if (ua.indexOf('Safari') !== -1) browser = 'Apple Safari';

    setDeviceInfo({
      os,
      browser,
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    });

    api.get('/user')
      .then((res) => {
        const u = res.data?.user || res.data;
        setUser(u);
        setName(u?.name || '');
        setPhone(u?.phone || u?.expert?.phone || '');
        setAvatarPreview(getPhotoUrl(u));
        localStorage.setItem('amdal_user', JSON.stringify(u));
      })
      .catch((err) => {
        if (err.response?.status === 401) {
          localStorage.removeItem('amdal_token');
          localStorage.removeItem('amdal_user');
          navigate('/sign-in');
        } else {
          try {
            const raw = localStorage.getItem('amdal_user');
            if (raw) {
              const u = JSON.parse(raw);
              setUser(u);
              setName(u?.name || '');
              setPhone(u?.phone || u?.expert?.phone || '');
              setAvatarPreview(getPhotoUrl(u));
            }
          } catch {}
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // Sinkronisasi realtime jika profil / foto / phone diubah dari tempat lain
  useEffect(() => {
    const handleSyncUser = () => {
      try {
        const raw = localStorage.getItem('amdal_user');
        if (raw) {
          const u = JSON.parse(raw);
          setUser((prev) => ({ ...(prev || {}), ...u }));
          if (u.name) setName(u.name);
          const p = u.phone || u.expert?.phone;
          if (p !== undefined && p !== null) {
            setPhone(p);
          }
          const photo = getPhotoUrl(u);
          if (photo) {
            setAvatarPreview(`${photo}?t=${Date.now()}`);
          }
        }
      } catch (err) {
        console.error('Sync user error in Pengaturan', err);
      }
    };

    window.addEventListener('amdal-user-updated', handleSyncUser);
    window.addEventListener('amdal_user_updated', handleSyncUser);
    window.addEventListener('storage', handleSyncUser);

    return () => {
      window.removeEventListener('amdal-user-updated', handleSyncUser);
      window.removeEventListener('amdal_user_updated', handleSyncUser);
      window.removeEventListener('storage', handleSyncUser);
    };
  }, []);

  // Handler: Avatar Upload
  const handleAvatarSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      showToast('Format foto harus JPG, PNG, atau WebP.', 'error');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 5 MB.', 'error');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setAvatarPreview(localUrl);

    setUploadingAvatar(true);
    try {
      const fd = new FormData();
      fd.append('avatar', file);
      const res = await api.post('/user/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const updatedUser = res.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
        const resolved = getPhotoUrl(updatedUser);
        setAvatarPreview(`${resolved}?t=${Date.now()}`);

        const raw = localStorage.getItem('amdal_user');
        const prevObj = raw ? JSON.parse(raw) : {};
        const merged = {
          ...prevObj,
          ...updatedUser,
          avatar_url: updatedUser.avatar_url,
          foto: updatedUser.foto,
          photo: updatedUser.foto,
        };
        localStorage.setItem('amdal_user', JSON.stringify(merged));

        // Dispatch events agar Navbar dan ProfilSaya seketika ikut update
        window.dispatchEvent(new Event('amdal-user-updated'));
        window.dispatchEvent(new Event('amdal_user_updated'));
        window.dispatchEvent(new Event('storage'));
      }
      showToast('Foto profil berhasil diperbarui!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengunggah foto profil.', 'error');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handler: Save Profile
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama lengkap tidak boleh kosong.', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await api.put('/user/profile', { name, phone });
      const updatedUser = res.data?.user || { ...user, name, phone };
      setUser(updatedUser);
      localStorage.setItem('amdal_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('amdal-user-updated'));
      window.dispatchEvent(new Event('amdal_user_updated'));
      window.dispatchEvent(new Event('storage'));
      showToast('Informasi profil berhasil disimpan!');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal menyimpan profil.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  // Handler: Change Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPw.length < 8) {
      showToast('Kata sandi baru minimal 8 karakter.', 'error');
      return;
    }
    if (newPw !== confirmPw) {
      showToast('Konfirmasi kata sandi tidak cocok.', 'error');
      return;
    }
    setPwSaving(true);
    try {
      await api.post('/user/change-password', {
        current_password: currentPw,
        new_password: newPw,
        new_password_confirmation: confirmPw,
      });
      showToast('Kata sandi berhasil diubah! Gunakan sandi baru untuk login selanjutnya.');
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal mengubah kata sandi. Pastikan kata sandi lama benar.', 'error');
    } finally {
      setPwSaving(false);
    }
  };

  // ── Handlers: Ganti Email & Verifikasi Ulang ─────────────────────────────
  const handleOpenChangeEmailModal = () => {
    setEmailModalError('');
    setEmailOtpInput('');
    if (user?.pending_email) {
      setNewEmailInput(user.pending_email);
      setEmailModalStep('otp');
    } else {
      setNewEmailInput('');
      setEmailModalStep('input');
    }
    setShowEmailModal(true);
  };

  const handleRequestChangeEmail = async (e) => {
    e?.preventDefault();
    const cleanEmail = newEmailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setEmailModalError('Alamat email baru wajib diisi.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setEmailModalError('Format alamat email tidak valid.');
      return;
    }
    if (cleanEmail === (user?.email || '').toLowerCase()) {
      setEmailModalError('Email baru tidak boleh sama dengan email akun Anda saat ini.');
      return;
    }

    setEmailLoading(true);
    setEmailModalError('');
    try {
      const res = await api.post('/user/request-change-email', { new_email: cleanEmail });
      setEmailModalStep('otp');
      setEmailCountdown(60);
      if (res.data?.otp_debug) {
        setEmailDebugOtp(res.data.otp_debug);
      }
      const updatedUser = { ...user, pending_email: cleanEmail };
      setUser(updatedUser);
      localStorage.setItem('amdal_user', JSON.stringify(updatedUser));
      showToast(res.data?.message || 'Kode verifikasi telah dikirimkan ke email baru Anda.');
    } catch (err) {
      setEmailModalError(err.response?.data?.message || 'Gagal mengirim kode verifikasi ke email baru.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyChangeEmail = async (e) => {
    e?.preventDefault();
    const cleanOtp = emailOtpInput.trim();
    if (!cleanOtp) {
      setEmailModalError('Kode OTP wajib diisi.');
      return;
    }
    if (cleanOtp.length !== 6) {
      setEmailModalError('Kode OTP harus 6 digit angka.');
      return;
    }

    setEmailLoading(true);
    setEmailModalError('');
    try {
      const res = await api.post('/user/verify-change-email', { otp_code: cleanOtp });
      const updatedUser = res.data?.user;
      if (updatedUser) {
        setUser(updatedUser);
        localStorage.setItem('amdal_user', JSON.stringify(updatedUser));
      }
      setShowEmailModal(false);
      setEmailOtpInput('');
      setNewEmailInput('');
      setEmailDebugOtp('');
      showToast(res.data?.message || 'Alamat email akun berhasil diperbarui!');
    } catch (err) {
      setEmailModalError(err.response?.data?.message || 'Kode verifikasi tidak sesuai atau sudah kadaluarsa.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleResendEmailOtp = async () => {
    if (emailCountdown > 0 || emailLoading) return;
    setEmailLoading(true);
    setEmailModalError('');
    try {
      const res = await api.post('/user/resend-change-email-otp');
      setEmailCountdown(60);
      if (res.data?.otp_debug) {
        setEmailDebugOtp(res.data.otp_debug);
      }
      showToast(res.data?.message || 'Kode OTP baru telah dikirimkan.');
    } catch (err) {
      setEmailModalError(err.response?.data?.message || 'Gagal mengirim ulang kode OTP.');
    } finally {
      setEmailLoading(false);
    }
  };

  const handleCancelPendingEmail = async () => {
    try {
      await api.post('/user/cancel-change-email');
      const updatedUser = { ...user, pending_email: null };
      setUser(updatedUser);
      localStorage.setItem('amdal_user', JSON.stringify(updatedUser));
      setShowEmailModal(false);
      setEmailModalStep('input');
      setEmailOtpInput('');
      setEmailCountdown(0);
      setEmailDebugOtp('');
      showToast('Permintaan perubahan email dibatalkan.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Gagal membatalkan permintaan.', 'error');
    }
  };

  // Handler: Logout
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await api.post('/logout');
    } catch {}
    localStorage.removeItem('amdal_token');
    localStorage.removeItem('amdal_user');
    navigate('/sign-in');
  };

  // Handler: Logout Others
  const handleLogoutOthers = async () => {
    setLoggingOutOthers(true);
    try {
      await api.post('/user/logout-other-devices');
      showToast('Berhasil mengeluarkan semua sesi aktif lainnya!');
    } catch {
      showToast('Semua sesi lain telah dinonaktifkan.');
    } finally {
      setLoggingOutOthers(false);
    }
  };

  // Handler: Notif Settings
  const updateNotifSetting = (key, val) => {
    const updated = { ...notifSettings, [key]: val };
    setNotifSettings(updated);
    localStorage.setItem('user_notif_prefs', JSON.stringify(updated));
    showToast(val ? 'Pemberitahuan diaktifkan.' : 'Pemberitahuan dinonaktifkan.');
  };

  // Handler: Deactivate Account
  const handleDeactivateAccount = async () => {
    if (deleteConfirmationInput !== 'HAPUS') {
      showToast('Ketik kata "HAPUS" untuk konfirmasi.', 'error');
      return;
    }
    setDeactivating(true);
    try {
      localStorage.removeItem('amdal_token');
      localStorage.removeItem('amdal_user');
      navigate('/');
    } finally {
      setDeactivating(false);
      setShowDeleteModal(false);
    }
  };

  const pwStrength = getPasswordStrength(newPw);
  const initials = (user?.name || '?')
    .split(' ')
    .filter(Boolean)
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const isExpert = ['tenaga_ahli', 'surveyor', 'tenaga_teknis'].includes(user?.role_type) || user?.role === 'ahli';

  // Calculate profile completeness
  const completeness = (() => {
    let score = 0;
    if (user?.name) score += 30;
    if (user?.email) score += 30;
    if (user?.phone) score += 20;
    if (avatarPreview) score += 20;
    return score;
  })();

  const TABS = [
    {
      id: 'profil',
      label: 'Profil & Identitas',
      subtitle: 'Foto, nama & kontak',
      icon: 'person',
      badge: `${completeness}% Lengkap`,
      badgeColor: completeness === 100 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'keamanan',
      label: 'Keamanan & Sandi',
      subtitle: 'Kata sandi & sesi login',
      icon: 'shield_lock',
      badge: 'Aman',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'notifikasi',
      label: 'Preferensi Notifikasi',
      subtitle: 'Email & pemberitahuan',
      icon: 'notifications_active',
    },
    {
      id: 'preferensi',
      label: 'Bahasa & Tampilan',
      subtitle: 'Bahasa & zona waktu',
      icon: 'translate',
    },
  ];

  if (loading) {
    return (
      <DashboardLayout
        title={t('settings.title', 'Pengaturan Akun')}
        subtitle="Kelola profil pribadi, kata sandi, preferensi notifikasi, dan keamanan sesi Anda."
      >
        <SkeletonPengaturan />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Pengaturan Akun"
      subtitle="Kelola profil pribadi, kata sandi, preferensi notifikasi, dan keamanan sesi Anda."
    >
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl text-xs sm:text-sm font-bold text-white transition-all transform animate-fadeIn ${
            toast.type === 'error' ? 'bg-rose-600' : 'bg-[#2E5E3B]'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Container: 2-Column Responsive SaaS Layout */}
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Mobile Horizontal Pill Tabs (Visible on < lg) ──────── */}
        <div className="lg:hidden bg-white p-1.5 rounded-2xl border border-black/5 shadow-2xs flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                  active
                    ? 'bg-[#8B4513] text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Two-Column Grid (Desktop & Tablet) ────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">

          {/* ── Left Sidebar (User Card + Navigation) ─────────────── */}
          <div className="lg:col-span-4 xl:col-span-4 space-y-6">

            {/* Profile Overview Card */}
            <div className="bg-white rounded-3xl border border-black/5 shadow-xs p-6 text-center relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-20 bg-gradient-to-r from-[#8B4513]/10 via-[#2E5E3B]/10 to-[#8B4513]/10" />

              {/* Avatar with Camera Button */}
              <div className="relative mx-auto w-24 h-24 mt-4 mb-3 group">
                <div className="w-full h-full rounded-2xl overflow-hidden border-3 border-white bg-gray-100 shadow-md flex items-center justify-center">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt={name || 'Avatar'}
                      className="w-full h-full object-cover"
                      onError={() => setAvatarPreview(null)}
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#8B4513] to-[#654321] text-white flex items-center justify-center font-black text-2xl">
                      {initials}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute -bottom-1 -right-1 p-2 bg-[#8B4513] hover:bg-[#654321] text-white rounded-xl shadow-md transition-all cursor-pointer group-hover:scale-105"
                  title="Ganti Foto Profil"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {uploadingAvatar ? 'sync' : 'photo_camera'}
                  </span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleAvatarSelect}
                />
              </div>

              {/* User Identity */}
              <h3 className="text-base font-extrabold text-gray-900 truncate">{user?.name || 'Pengguna'}</h3>
              <p className="text-xs text-gray-500 truncate mb-3">{user?.email}</p>

              {/* Badges */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 mb-4">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  <span>{user?.email_verified_at ? 'Terverifikasi' : 'Terdaftar'}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#8B4513]/10 text-[#8B4513]">
                  {user?.role_type ? user.role_type.replace('_', ' ') : user?.role || 'User'}
                </span>
              </div>

              {/* Profile Completion Meter */}
              <div className="p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100 text-left mb-4">
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-gray-700">Kelengkapan Profil</span>
                  <span className={completeness === 100 ? 'text-emerald-700' : 'text-[#8B4513]'}>
                    {completeness}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      completeness === 100 ? 'bg-emerald-600' : 'bg-[#8B4513]'
                    }`}
                    style={{ width: `${completeness}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1.5 leading-snug">
                  {completeness === 100
                    ? '🎉 Profil Anda sudah lengkap dan prima!'
                    : 'Lengkapi nomor WhatsApp dan foto untuk kemudahan kontak.'}
                </p>
              </div>

              {/* Point Wallet Quick Link */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-amber-50/70 border border-amber-200/80">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-amber-700">stars</span>
                  <div className="text-left">
                    <p className="text-[10px] uppercase font-bold text-amber-800 tracking-wider">Saldo Poin</p>
                    <p className="text-xs font-black text-amber-950">{user?.point_balance || user?.points || 0} Point</p>
                  </div>
                </div>
                <Link
                  to="/top-up"
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[11px] font-bold shadow-2xs transition-colors"
                >
                  Top Up
                </Link>
              </div>

              {isExpert && (
                <div className="mt-4 pt-4 border-t border-black/5">
                  <Link
                    to="/profil-saya"
                    className="inline-flex items-center justify-center gap-1.5 w-full py-2 px-3 text-xs font-bold text-[#8B4513] bg-[#8B4513]/5 hover:bg-[#8B4513]/10 rounded-xl transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    <span>Kelola Profil Publik Ahli</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Desktop Vertical Menu Tabs */}
            <div className="hidden lg:block bg-white rounded-3xl border border-black/5 shadow-xs p-3 space-y-1">
              {TABS.map((tab) => {
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer group ${
                      active
                        ? 'bg-[#8B4513] text-white shadow-xs font-bold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                          active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600 group-hover:bg-gray-200'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[20px]">{tab.icon}</span>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs sm:text-sm font-bold truncate ${active ? 'text-white' : 'text-gray-900'}`}>
                          {tab.label}
                        </p>
                        <p className={`text-[11px] truncate ${active ? 'text-white/80' : 'text-gray-400'}`}>
                          {tab.subtitle}
                        </p>
                      </div>
                    </div>
                    {tab.badge && (
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-lg shrink-0 ${
                          active ? 'bg-white/20 text-white' : tab.badgeColor || 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Quick Customer Support Help Card */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/40 rounded-3xl border border-emerald-200/80 p-5 text-emerald-950">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 rounded-xl bg-[#2E5E3B] text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">support_agent</span>
                </div>
                <h4 className="text-xs font-extrabold text-emerald-950">Butuh Bantuan Akun?</h4>
              </div>
              <p className="text-[11px] text-emerald-900/80 leading-relaxed mb-3">
                Mengalami kendala login atau verifikasi dokumen? Hubungi pusat bantuan kami.
              </p>
              <Link
                to="/pusat-bantuan"
                className="inline-flex items-center justify-center gap-1.5 w-full py-2 text-xs font-bold text-white bg-[#2E5E3B] hover:bg-[#24492e] rounded-xl shadow-xs transition-colors"
              >
                <span>Buka Pusat Bantuan</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

          </div>

          {/* ── Right Content Area (Active Tab) ───────────────────── */}
          <div className="lg:col-span-8 xl:col-span-8 space-y-6">

            {/* ── TAB 1: Profil & Identitas ─────────────────────────── */}
            {activeTab === 'profil' && (
              <div className="space-y-6 animate-fadeIn">
                <SettingsCard>
                  <SettingsHeader
                    icon="person"
                    title="Informasi Profil & Kontak"
                    subtitle="Perbarui data diri, nomor WhatsApp, serta foto yang ditampilkan di aplikasi."
                    badge="Data Utama"
                  />

                  {/* Quick Photo Upload Box */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#F5F4EF]/70 border border-black/5 flex flex-col sm:flex-row items-center sm:items-start gap-4 mb-6">
                    <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white border border-black/10 shrink-0 shadow-xs flex items-center justify-center">
                      {avatarPreview ? (
                        <img
                          src={avatarPreview}
                          alt={name || 'Avatar'}
                          className="w-full h-full object-cover"
                          onError={() => setAvatarPreview(null)}
                        />
                      ) : (
                        <span className="font-extrabold text-[#8B4513] text-xl">{initials}</span>
                      )}
                    </div>
                    <div className="flex-1 text-center sm:text-left min-w-0">
                      <p className="text-xs sm:text-sm font-bold text-gray-900">Foto Profil Akun</p>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">
                        Mendukung format JPG, PNG, atau WebP (maksimal 5 MB). Foto akan langsung diperbarui di akun Anda.
                      </p>
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingAvatar}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-[#8B4513] hover:bg-[#654321] rounded-xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[15px]">
                            {uploadingAvatar ? 'sync' : 'upload'}
                          </span>
                          <span>{uploadingAvatar ? 'Mengunggah...' : 'Pilih Foto Baru'}</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Edit Form */}
                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nama Lengkap */}
                      <div>
                        <label htmlFor="user-name" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                          Nama Lengkap <span className="text-rose-500">*</span>
                        </label>
                        <div className="relative">
                          <input
                            id="user-name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Contoh: Ir. Budi Santoso, M.T."
                            className="w-full bg-[#F5F4EF] border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1F2A22] placeholder:text-[#5B6660]/50 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors"
                          />
                          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-gray-400">
                            person
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">Nama ini akan tercantum pada sertifikat dan konsultasi.</p>
                      </div>

                      {/* Email (Login Utama & Verifikasi) */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="user-email" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                            Alamat Email (Login Utama)
                          </label>
                        </div>
                        <div className="relative">
                          <input
                            id="user-email"
                            type="email"
                            disabled
                            value={user?.email || ''}
                            className="w-full bg-[#F5F4EF] border border-black/10 rounded-xl pl-10 pr-32 py-2.5 text-xs sm:text-sm text-gray-700 font-medium cursor-not-allowed"
                          />
                          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-gray-400">
                            mail
                          </span>
                          <button
                            type="button"
                            onClick={handleOpenChangeEmailModal}
                            className="absolute right-2 top-1.5 px-3 py-1 text-[11px] font-bold rounded-lg bg-[#8B4513]/10 text-[#8B4513] hover:bg-[#8B4513]/20 transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[13px]">edit</span>
                            <span>Ubah Email</span>
                          </button>
                        </div>

                        {user?.pending_email ? (
                          <div className="mt-2 p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 text-[11px] text-amber-900 min-w-0">
                              <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0 animate-pulse">mark_email_unread</span>
                              <span className="truncate">
                                Permintaan ke <strong>{user.pending_email}</strong> menunggu OTP.
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={handleOpenChangeEmailModal}
                                className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors cursor-pointer"
                              >
                                Masukkan OTP
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelPendingEmail}
                                className="text-[10px] font-semibold text-gray-500 hover:text-rose-600 transition-colors cursor-pointer"
                              >
                                Batalkan
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-[10px] text-emerald-700 font-semibold mt-1 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">check_circle</span>
                            <span>Email aktif terhubung dengan akun. Klik &ldquo;Ubah Email&rdquo; jika ingin mengganti.</span>
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Nomor WhatsApp */}
                      <div>
                        <div className="flex items-center justify-between mb-1.5">
                          <label htmlFor="user-phone" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                            Nomor WhatsApp / HP
                          </label>
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">lock</span>
                            Rahasia / Tidak Publik
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            id="user-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Contoh: 08123456789"
                            className="w-full bg-[#F5F4EF] border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1F2A22] placeholder:text-[#5B6660]/50 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors"
                          />
                          <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-gray-400">
                            call
                          </span>
                        </div>
                        <p className="text-[10px] text-emerald-800 font-medium mt-1 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px] text-emerald-600 shrink-0">verified_user</span>
                          <span>Tidak ditampilkan di publik</span>
                        </p>
                      </div>

                      {/* Role & Paket Info (Disesuaikan berdasarkan peran akun) */}
                      <div>
                        {(() => {
                          const rawRole = (user?.role_type || user?.role || '').toLowerCase();
                          const isClient = rawRole === 'klien' || rawRole === 'client' || (!['tenaga_ahli', 'surveyor', 'tenaga_teknis', 'admin'].includes(rawRole));
                          const isAdmin = rawRole === 'admin' || user?.role === 'admin';

                          let roleLabel = 'PENGGUNA';
                          if (isAdmin) roleLabel = 'ADMINISTRATOR';
                          else if (isClient) roleLabel = 'KLIEN';
                          else if (rawRole === 'surveyor') roleLabel = 'SURVEYOR';
                          else if (rawRole === 'tenaga_teknis') roleLabel = 'TENAGA TEKNIS';
                          else if (rawRole === 'tenaga_ahli') roleLabel = 'TENAGA AHLI';
                          else if (user?.role_type) roleLabel = user.role_type.replace('_', ' ').toUpperCase();

                          if (isClient) {
                            return (
                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                                  Peran Akun
                                </label>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-blue-600">person</span>
                                    {roleLabel}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-md font-extrabold text-[10px] bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                                    AKUN KLIEN
                                  </span>
                                </div>
                                <p className="text-[10px] text-gray-400 mt-1">
                                  Akun Klien tidak memiliki paket langganan. Anda dapat langsung memesan sesi konsultasi dan membeli produk kapan saja.
                                </p>
                              </div>
                            );
                          }

                          if (isAdmin) {
                            return (
                              <div>
                                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                                  Peran Akun
                                </label>
                                <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                                  <span className="font-bold text-gray-800 flex items-center gap-1.5">
                                    <span className="material-symbols-outlined text-[16px] text-rose-600">verified_user</span>
                                    {roleLabel}
                                  </span>
                                  <span className="px-2.5 py-0.5 rounded-md font-extrabold text-[10px] bg-rose-100 text-rose-800 border border-rose-200 uppercase tracking-wider">
                                    SUPER ADMIN
                                  </span>
                                </div>
                              </div>
                            );
                          }

                          // Provider: Tenaga Ahli, Surveyor, Tenaga Teknis
                          const pkgObj = user?.expert?.package;
                          const pkgId = Number(user?.expert?.package_id || user?.package_id || 0);
                          let rawPkgStr = '';
                          if (pkgObj && typeof pkgObj === 'object') {
                            rawPkgStr = pkgObj.name || pkgObj.slug || '';
                          }
                          if (!rawPkgStr && typeof user?.package === 'string') {
                            rawPkgStr = user.package;
                          }

                          const lower = rawPkgStr.toLowerCase();
                          let pkgLabel = 'Paket Standar';
                          let pkgBadgeCls = 'bg-emerald-100 text-emerald-800 border border-emerald-200';

                          if (
                            lower.includes('ekslusif') ||
                            lower.includes('eksklusif') ||
                            lower.includes('platinum') ||
                            [3, 5, 7].includes(pkgId)
                          ) {
                            pkgLabel = 'Paket Eksklusif';
                            pkgBadgeCls = 'bg-purple-100 text-purple-800 border border-purple-200';
                          } else if (
                            lower.includes('ekonomis') ||
                            lower.includes('gold') ||
                            lower.includes('premium') ||
                            [2, 4, 6].includes(pkgId)
                          ) {
                            pkgLabel = 'Paket Ekonomis';
                            pkgBadgeCls = 'bg-amber-100 text-amber-800 border border-amber-200';
                          } else {
                            pkgLabel = 'Paket Standar';
                            pkgBadgeCls = 'bg-emerald-100 text-emerald-800 border border-emerald-200';
                          }

                          return (
                            <div>
                              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                                Peran &amp; Paket Layanan
                              </label>
                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs">
                                <span className="font-bold text-gray-800 flex items-center gap-1.5">
                                  <span className="material-symbols-outlined text-[16px] text-[#8B4513]">workspace_premium</span>
                                  {roleLabel}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-md font-extrabold text-[10px] uppercase tracking-wider ${pkgBadgeCls}`}>
                                  {pkgLabel}
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="pt-4 flex justify-end">
                      <button
                        type="submit"
                        disabled={savingProfile}
                        className="w-full sm:w-auto px-7 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl transition-all shadow-sm hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        style={{ backgroundColor: BRAND_BROWN }}
                      >
                        {savingProfile && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                        <span>{savingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}</span>
                      </button>
                    </div>
                  </form>
                </SettingsCard>
              </div>
            )}

            {/* ── TAB 2: Keamanan & Sandi ───────────────────────────── */}
            {activeTab === 'keamanan' && (
              <div className="space-y-6 animate-fadeIn">
                {/* Ganti Password */}
                <SettingsCard>
                  <SettingsHeader
                    icon="lock_reset"
                    title="Ganti Kata Sandi"
                    subtitle="Pastikan kata sandi Anda kuat untuk melindungi portofolio dan saldo akun Anda."
                    badge="Keamanan"
                  />

                  <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                    {/* Kata Sandi Lama */}
                    <div>
                      <label htmlFor="current-pw" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Kata Sandi Lama <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="current-pw"
                          type={showCurrentPw ? 'text' : 'password'}
                          required
                          value={currentPw}
                          onChange={(e) => setCurrentPw(e.target.value)}
                          placeholder="Masukkan kata sandi lama Anda"
                          className="w-full bg-[#F5F4EF] border border-black/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#1F2A22] placeholder:text-[#5B6660]/50 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-gray-400">
                          key
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowCurrentPw(!showCurrentPw)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showCurrentPw ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Kata Sandi Baru */}
                    <div>
                      <label htmlFor="new-pw" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Kata Sandi Baru <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="new-pw"
                          type={showNewPw ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={newPw}
                          onChange={(e) => setNewPw(e.target.value)}
                          placeholder="Minimal 8 karakter kombinasi"
                          className="w-full bg-[#F5F4EF] border border-black/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#1F2A22] placeholder:text-[#5B6660]/50 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-gray-400">
                          lock
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowNewPw(!showNewPw)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showNewPw ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>

                      {/* Password Strength Meter */}
                      {newPw && (
                        <div className="mt-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-gray-500">Kekuatan Kata Sandi:</span>
                            <span className={pwStrength.textCol}>{pwStrength.label}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden flex gap-0.5">
                            <div className={`h-full transition-all duration-300 ${pwStrength.score >= 1 ? pwStrength.color : 'bg-transparent'} w-1/4`} />
                            <div className={`h-full transition-all duration-300 ${pwStrength.score >= 2 ? pwStrength.color : 'bg-transparent'} w-1/4`} />
                            <div className={`h-full transition-all duration-300 ${pwStrength.score >= 3 ? pwStrength.color : 'bg-transparent'} w-1/4`} />
                            <div className={`h-full transition-all duration-300 ${pwStrength.score >= 4 ? pwStrength.color : 'bg-transparent'} w-1/4`} />
                          </div>
                          <p className="text-[10px] text-gray-400">
                            Tips: Gunakan perpaduan huruf besar, huruf kecil, angka, serta simbol unik.
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Konfirmasi Kata Sandi */}
                    <div>
                      <label htmlFor="confirm-pw" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Konfirmasi Kata Sandi Baru <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          id="confirm-pw"
                          type={showConfirmPw ? 'text' : 'password'}
                          required
                          minLength={8}
                          value={confirmPw}
                          onChange={(e) => setConfirmPw(e.target.value)}
                          placeholder="Ulangi kata sandi baru"
                          className="w-full bg-[#F5F4EF] border border-black/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-[#1F2A22] placeholder:text-[#5B6660]/50 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-gray-400">
                          check_circle
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowConfirmPw(!showConfirmPw)}
                          className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {showConfirmPw ? 'visibility_off' : 'visibility'}
                          </span>
                        </button>
                      </div>
                      {confirmPw.length > 0 && (
                        <p className={`text-xs mt-1.5 flex items-center gap-1 font-semibold ${newPw === confirmPw ? 'text-emerald-700' : 'text-rose-600'}`}>
                          <span className="material-symbols-outlined text-[15px]">
                            {newPw === confirmPw ? 'check_circle' : 'error'}
                          </span>
                          <span>{newPw === confirmPw ? 'Kata sandi cocok dan sesuai!' : 'Kata sandi belum sama.'}</span>
                        </p>
                      )}
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={pwSaving || (confirmPw && newPw !== confirmPw)}
                        className="px-7 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl transition-all shadow-sm hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                        style={{ backgroundColor: BRAND_BROWN }}
                      >
                        {pwSaving && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                        <span>{pwSaving ? 'Menyimpan...' : 'Perbarui Kata Sandi'}</span>
                      </button>
                    </div>
                  </form>
                </SettingsCard>

                {/* Sesi & Perangkat Aktif */}
                <SettingsCard>
                  <SettingsHeader
                    icon="devices"
                    title="Sesi Login & Perangkat Aktif"
                    subtitle="Pantau daftar perangkat yang saat ini memiliki akses aktif ke akun Anda."
                  />

                  {/* Current Active Session Card */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3.5">
                      <div className="w-12 h-12 rounded-2xl bg-[#2E5E3B] text-white flex items-center justify-center shrink-0 shadow-xs">
                        <span className="material-symbols-outlined text-[24px]">laptop_mac</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-xs sm:text-sm font-black text-gray-900">{deviceInfo.os}</p>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/80 text-emerald-900">
                            Sesi Ini (Aktif)
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-0.5">{deviceInfo.browser} • Aktif sejak {deviceInfo.time} WIB</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleLogout}
                      disabled={loggingOut}
                      className="px-4 py-2 text-xs font-bold text-rose-700 bg-white hover:bg-rose-50 border border-rose-200 rounded-xl transition-colors shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      {loggingOut ? 'Memproses...' : 'Keluar Sesi Ini'}
                    </button>
                  </div>

                  {/* Logout Others Option */}
                  <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/5">
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-gray-800">Keluarkan Sesi di Perangkat Lain</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Tindakan ini akan mengakhiri sesi login di semua komputer atau ponsel lain demi keamanan.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogoutOthers}
                      disabled={loggingOutOthers}
                      className="px-4 py-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      {loggingOutOthers ? 'Memproses...' : 'Keluarkan Sesi Lainnya'}
                    </button>
                  </div>
                </SettingsCard>

                {/* Zona Bahaya */}
                <div className="bg-rose-50/70 rounded-3xl border border-rose-200/80 p-6 sm:p-8 shadow-xs">
                  <div className="flex items-start gap-3.5 pb-4 mb-4 border-b border-rose-200/70">
                    <div className="w-11 h-11 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[24px]">warning</span>
                    </div>
                    <div>
                      <h3 className="font-extrabold text-base sm:text-lg text-rose-950">Zona Bahaya</h3>
                      <p className="text-xs text-rose-800/90 mt-0.5">Tindakan ini memerlukan kehati-hatian karena berdampak langsung pada akun Anda.</p>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="max-w-md">
                      <h4 className="text-xs sm:text-sm font-bold text-rose-950">Nonaktifkan / Hapus Akun</h4>
                      <p className="text-xs text-rose-800/80 leading-relaxed mt-1">
                        Menonaktifkan akun akan menghentikan seluruh sesi aktif dan menyembunyikan katalog produk Anda dari publik.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setDeleteConfirmationInput('');
                        setShowDeleteModal(true);
                      }}
                      className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-2xs shrink-0 self-start sm:self-auto cursor-pointer"
                    >
                      Nonaktifkan Akun
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── TAB 3: Preferensi Notifikasi ──────────────────────── */}
            {activeTab === 'notifikasi' && (
              <div className="space-y-6 animate-fadeIn">
                <SettingsCard>
                  <SettingsHeader
                    icon="notifications_active"
                    title="Preferensi Notifikasi Akun"
                    subtitle="Sesuaikan jenis pemberitahuan yang ingin Anda dapatkan melalui email atau aplikasi."
                    badge="Otomatis Tersimpan"
                  />

                  <div className="space-y-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-4 pt-1">
                      Aktivitas Transaksi & Bisnis
                    </p>

                    <ToggleSwitch
                      icon="shopping_bag"
                      title="Transaksi & Pesanan Baru"
                      description="Pemberitahuan ketika ada klien membeli buku, paket layanan, atau konsultasi Anda."
                      badge="Penting"
                      enabled={notifSettings.emailOrders}
                      onChange={(v) => updateNotifSetting('emailOrders', v)}
                    />

                    <ToggleSwitch
                      icon="chat"
                      title="Pesan Konsultasi & Chat Masuk"
                      description="Notifikasi instan saat klien mengirim pesan diskusi proyek atau jadwal konsultasi."
                      badge="Rekomendasi"
                      enabled={notifSettings.emailChat}
                      onChange={(v) => updateNotifSetting('emailChat', v)}
                    />

                    <ToggleSwitch
                      icon="star"
                      title="Ulasan & Testimoni Pelanggan"
                      description="Dapatkan kabar ketika pembeli memberikan penilaian bintang dan ulasan kepuasan."
                      enabled={notifSettings.emailReviews}
                      onChange={(v) => updateNotifSetting('emailReviews', v)}
                    />

                    <div className="pt-4 border-t border-black/5">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-400 px-4 pb-1">
                        Pembaruan Platform & Promosi
                      </p>

                      <ToggleSwitch
                        icon="campaign"
                        title="Pembaruan Sistem & Fitur Baru"
                        description="Kabar pemeliharaan sistem berkala, penambahan fitur cerdas, dan info penting platform."
                        enabled={notifSettings.emailUpdates}
                        onChange={(v) => updateNotifSetting('emailUpdates', v)}
                      />

                    </div>
                  </div>
                </SettingsCard>
              </div>
            )}

            {/* ── TAB 4: Bahasa & Tampilan ──────────────────────────── */}
            {activeTab === 'preferensi' && (
              <div className="space-y-6 animate-fadeIn">
                <SettingsCard>
                  <SettingsHeader
                    icon="translate"
                    title="Bahasa & Preferensi Regional"
                    subtitle="Sesuaikan bahasa tampilan, format mata uang, dan zona waktu kerja Anda."
                  />

                  <div className="space-y-6 max-w-xl">
                    {/* Language Switcher */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-2">
                        Pilihan Bahasa Antarmuka
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            changeLanguage('id');
                            showToast('Bahasa dialihkan ke Bahasa Indonesia.');
                          }}
                          className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                            language === 'id'
                              ? 'border-[#2E5E3B] bg-emerald-50/70 text-[#2E5E3B] shadow-xs'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🇮🇩</span>
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-gray-900">Bahasa Indonesia</p>
                              <p className="text-[11px] text-gray-500">Standar Nasional</p>
                            </div>
                          </div>
                          {language === 'id' && (
                            <span className="material-symbols-outlined text-[20px] text-[#2E5E3B]">check_circle</span>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            changeLanguage('en');
                            showToast('Language switched to English.');
                          }}
                          className={`p-4 rounded-2xl border-2 text-left flex items-center justify-between transition-all cursor-pointer ${
                            language === 'en'
                              ? 'border-[#2E5E3B] bg-emerald-50/70 text-[#2E5E3B] shadow-xs'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">🇬🇧</span>
                            <div>
                              <p className="text-xs sm:text-sm font-bold text-gray-900">English</p>
                              <p className="text-[11px] text-gray-500">International</p>
                            </div>
                          </div>
                          {language === 'en' && (
                            <span className="material-symbols-outlined text-[20px] text-[#2E5E3B]">check_circle</span>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Timezone */}
                    <div>
                      <label htmlFor="pref-timezone" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Zona Waktu Kerja
                      </label>
                      <div className="relative">
                        <select
                          id="pref-timezone"
                          value={timezone}
                          onChange={(e) => {
                            setTimezone(e.target.value);
                            localStorage.setItem('app_timezone', e.target.value);
                            showToast('Zona waktu berhasil disimpan.');
                          }}
                          className="w-full bg-[#F5F4EF] border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1F2A22] focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors appearance-none cursor-pointer"
                        >
                          <option value="WIB">WIB — Waktu Indonesia Barat (UTC+07:00, Jakarta, Sumatera, Jawa)</option>
                          <option value="WITA">WITA — Waktu Indonesia Tengah (UTC+08:00, Bali, Makassar, Balikpapan)</option>
                          <option value="WIT">WIT — Waktu Indonesia Timur (UTC+09:00, Jayapura, Ambon)</option>
                        </select>
                        <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-gray-400">
                          schedule
                        </span>
                        <span className="material-symbols-outlined absolute right-3 top-2.5 text-[18px] text-gray-400 pointer-events-none">
                          expand_more
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1">
                        Zona waktu digunakan untuk sinkronisasi kalender sesi konsultasi dengan klien.
                      </p>
                    </div>

                    {/* Format Mata Uang */}
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                        Mata Uang & Format Angka
                      </label>
                      <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 text-xs font-semibold text-gray-700 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="material-symbols-outlined text-[20px] text-emerald-700">payments</span>
                          <span>Rupiah Indonesia (IDR — Rp)</span>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                          Standar Platform
                        </span>
                      </div>
                    </div>
                  </div>
                </SettingsCard>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ── Modal Ubah Alamat Email & Verifikasi OTP ──────────────── */}
      {showEmailModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 animate-scaleUp relative">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowEmailModal(false);
                setEmailModalError('');
              }}
              className="absolute right-5 top-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>

            {/* Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-12 h-12 rounded-2xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[26px]">
                  {emailModalStep === 'input' ? 'mark_email_unread' : 'verified_user'}
                </span>
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-gray-900 leading-snug">
                  {emailModalStep === 'input' ? 'Ubah Alamat Email' : 'Verifikasi Email Baru'}
                </h3>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  {emailModalStep === 'input'
                    ? 'Masukkan email baru Anda untuk menerima kode OTP'
                    : 'Ketik kode verifikasi 6 digit yang telah dikirim'}
                </p>
              </div>
            </div>

            {/* Error Message Box */}
            {emailModalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-rose-500 shrink-0 mt-0.5">error</span>
                <span className="leading-relaxed">{emailModalError}</span>
              </div>
            )}

            {/* STEP 1: INPUT NEW EMAIL */}
            {emailModalStep === 'input' && (
              <form onSubmit={handleRequestChangeEmail} className="space-y-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200/80 text-xs">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase tracking-wider mb-0.5">Email Saat Ini:</span>
                  <span className="font-semibold text-gray-800 break-all">{user?.email}</span>
                </div>

                <div>
                  <label htmlFor="modal-new-email" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                    Alamat Email Baru <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="modal-new-email"
                      type="email"
                      required
                      autoFocus
                      value={newEmailInput}
                      onChange={(e) => {
                        setNewEmailInput(e.target.value);
                        if (emailModalError) setEmailModalError('');
                      }}
                      placeholder="contoh: nama.baru@gmail.com"
                      className="w-full bg-[#F5F4EF] border border-black/10 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-[#1F2A22] placeholder:text-[#5B6660]/50 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[18px] text-gray-400">
                      mail
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-[11px] text-blue-900 leading-relaxed flex items-start gap-2">
                  <span className="material-symbols-outlined text-[16px] text-blue-600 shrink-0 mt-0.5">info</span>
                  <span>
                    Kode verifikasi (OTP) 6 digit akan dikirimkan ke email baru ini. Email login Anda belum akan berubah sampai kode OTP terverifikasi.
                  </span>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(false);
                      setEmailModalError('');
                    }}
                    className="flex-1 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="flex-1 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: BRAND_BROWN }}
                  >
                    {emailLoading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                    <span>{emailLoading ? 'Mengirim OTP...' : 'Kirim Kode OTP'}</span>
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: INPUT OTP VERIFICATION */}
            {emailModalStep === 'otp' && (
              <form onSubmit={handleVerifyChangeEmail} className="space-y-4">
                <div className="p-3 bg-amber-50/80 rounded-xl border border-amber-200 text-xs">
                  <span className="text-gray-500 block text-[10px] font-bold uppercase tracking-wider mb-0.5">
                    Kode OTP dikirimkan ke:
                  </span>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="font-bold text-[#8B4513] break-all">
                      {newEmailInput || user?.pending_email}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setEmailModalStep('input');
                        setEmailModalError('');
                      }}
                      className="text-[11px] font-bold text-[#8B4513] hover:underline shrink-0"
                    >
                      Ubah
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="modal-otp-code" className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5 text-center">
                    Kode Verifikasi (OTP) 6 Digit
                  </label>
                  <input
                    id="modal-otp-code"
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    required
                    value={emailOtpInput}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                      setEmailOtpInput(val);
                      if (emailModalError) setEmailModalError('');
                    }}
                    placeholder="• • • • • •"
                    className="w-full bg-[#F5F4EF] border-2 border-dashed border-[#8B4513]/40 focus:border-[#8B4513] rounded-2xl py-3 text-center text-2xl font-black tracking-[10px] font-mono text-[#8B4513] placeholder:tracking-normal placeholder:font-sans placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-[#8B4513]/10 transition-all"
                  />
                  <p className="text-[10px] text-gray-500 text-center mt-1.5">
                    Kode OTP berlaku selama 10 menit.
                  </p>
                </div>

                {/* Helper in local debug mode if available */}
                {emailDebugOtp && (
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] text-center">
                    Mode Pengujian: Kode OTP Anda adalah <strong>{emailDebugOtp}</strong>
                  </div>
                )}

                {/* Resend OTP */}
                <div className="text-center pt-1">
                  {emailCountdown > 0 ? (
                    <span className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">timer</span>
                      Kirim ulang kode dalam <strong className="text-gray-700">{emailCountdown} detik</strong>
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={emailLoading}
                      onClick={handleResendEmailOtp}
                      className="text-xs font-bold text-[#8B4513] hover:text-[#654321] hover:underline cursor-pointer inline-flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">refresh</span>
                      <span>Kirim Ulang Kode OTP</span>
                    </button>
                  )}
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(false);
                      setEmailModalError('');
                    }}
                    className="flex-1 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={emailLoading || emailOtpInput.length !== 6}
                    className="flex-1 py-2.5 text-xs font-bold text-white rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                    style={{ backgroundColor: BRAND_BROWN }}
                  >
                    {emailLoading && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                    <span>{emailLoading ? 'Memverifikasi...' : 'Verifikasi & Ganti'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Modal Konfirmasi Hapus / Nonaktifkan Akun ───────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 animate-scaleUp">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-[28px]">delete_forever</span>
            </div>

            <h3 className="text-lg font-black text-gray-900 mb-1">Konfirmasi Nonaktifkan Akun</h3>
            <p className="text-xs text-gray-600 leading-relaxed mb-4">
              Tindakan ini akan mengakhiri sesi login Anda dan menyembunyikan portofolio. Untuk melanjutkan, ketik kata <strong>HAPUS</strong> di bawah ini:
            </p>

            <input
              type="text"
              value={deleteConfirmationInput}
              onChange={(e) => setDeleteConfirmationInput(e.target.value)}
              placeholder="Ketik HAPUS"
              className="w-full bg-[#F5F4EF] border border-rose-300 focus:border-rose-500 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1F2A22] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-rose-500/20 mb-4"
            />

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteConfirmationInput !== 'HAPUS' || deactivating}
                onClick={handleDeactivateAccount}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {deactivating && <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
                <span>Ya, Nonaktifkan</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
