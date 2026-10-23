import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import coinImg from '../assets/coin.png';
import { getMediaUrl, getDefaultPhoto } from '../utils/media.js';

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function formatPoints(n) {
  return new Intl.NumberFormat('id-ID').format(n ?? 0);
}

const STATUS_MAP = {
  selesai:              { label: 'Selesai',            color: '#065F46', bg: '#D1FAE5', icon: 'check_circle' },
  dijadwalkan:          { label: 'Dijadwalkan',         color: '#1E40AF', bg: '#DBEAFE', icon: 'event_available' },
  menunggu_konfirmasi:  { label: 'Menunggu Konfirmasi', color: '#92400E', bg: '#FEF3C7', icon: 'schedule' },
  dibatalkan:           { label: 'Dibatalkan',          color: '#991B1B', bg: '#FEE2E2', icon: 'cancel' },
};

export default function ProfilKlien() {
  const navigate  = useNavigate();
  const [searchParams] = useSearchParams();
  const fileInputRef = useRef(null);

  const [user,    setUser]    = useState(null);
  const [konsultasi, setKonsultasi] = useState([]);
  const [pointBalance, setPointBalance] = useState(0);
  const [articlesCount, setArticlesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [tab, setTab] = useState(() => {
    return searchParams.get('tab') || 'konsultasi';
  }); // konsultasi | pesanan | topup | akun

  // Sync tab state when URL search params change
  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setTab(t);
  }, [searchParams]);

  // Edit profile info state
  const [editingName, setEditingName] = useState('');
  const [editingPhone, setEditingPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [toast, setToast] = useState(null);

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getPhotoUrl = (u) => {
    if (!u) return null;
    const p = u.avatar_url || u.foto || u.photo;
    if (!p) return null;
    if (p.startsWith('http') || p.startsWith('data:')) return p;
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://tenagaahli.com';
    return `${baseUrl}/storage/${p}?t=${Date.now()}`;
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  const handleDownloadProduct = async (p) => {
    const prodId = p.product_id || p.product?.id;
    if (p.product?.download_url && !p.product?.file_url) {
      window.open(p.product.download_url, '_blank');
      return;
    }
    setDownloadingId(p.id);
    try {
      const res = await api.get(`/products/${prodId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${p.product_title || 'produk'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToastMsg('Berkas berhasil diunduh!');
    } catch (err) {
      if (p.product?.download_url) {
        window.open(p.product.download_url, '_blank');
      } else {
        showToastMsg('Gagal mengunduh berkas. Pastikan pembayaran sudah diverifikasi.', 'error');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('amdal_user');
    if (!raw) { navigate('/sign-in'); return; }
    let u = null;
    try { u = JSON.parse(raw); } catch { u = null; }
    if (!u) { navigate('/sign-in'); return; }
    setUser(u);
    setEditingName(u.name || '');
    setEditingPhone(u.phone || '');

    // Klien non-ahli tidak boleh masuk dashboard
    if (u.role === 'admin') { navigate('/admin'); return; }
    if (u.role_type === 'tenaga_ahli') { navigate('/dashboard'); return; }
    if (u.role_type === 'surveyor')    { navigate('/dashboard-surveyor'); return; }

    // Fetch initial client data
    Promise.all([
      api.get('/my/consultations').catch(() => ({ data: [] })),
      api.get('/topup/history?per_page=1').catch(() => ({ data: { summary: { point_balance: 0 } } })),
      api.get('/my/articles').catch(() => ({ data: [] })),
      api.get('/my/purchases').catch(() => ({ data: [] })),
      api.get('/user').catch(() => ({ data: null })),
    ]).then(([consRes, topRes, artRes, purRes, userRes]) => {
      const consItems = Array.isArray(consRes.data?.data) ? consRes.data.data
                      : Array.isArray(consRes.data)        ? consRes.data
                      : [];
      setKonsultasi(consItems);

      if (topRes.data?.summary?.point_balance !== undefined) {
        setPointBalance(topRes.data.summary.point_balance);
      }

      const arts = Array.isArray(artRes.data?.data) ? artRes.data.data
                 : Array.isArray(artRes.data)        ? artRes.data
                 : [];
      setArticlesCount(arts.length);

      const purs = Array.isArray(purRes.data) ? purRes.data
                 : Array.isArray(purRes.data?.data) ? purRes.data.data
                 : [];
      setPurchases(purs);

      if (userRes.data) {
        setUser((prev) => {
          const updated = { ...(prev || {}), ...userRes.data };
          localStorage.setItem('amdal_user', JSON.stringify(updated));
          return updated;
        });
        setEditingName(userRes.data.name || '');
        setEditingPhone(userRes.data.phone || '');
      }
    }).finally(() => setLoading(false));
  }, [navigate]);

  // Handle upload avatar
  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToastMsg('Ukuran foto maksimal 5MB.', 'error');
      return;
    }

    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('avatar', file);

    try {
      const res = await api.post('/user/avatar', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const updatedUser = {
        ...user,
        ...(res.data?.user || {}),
        avatar_url: res.data?.avatar_url || res.data?.user?.avatar_url,
        foto: res.data?.avatar_url || res.data?.user?.foto,
      };

      setUser(updatedUser);
      localStorage.setItem('amdal_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('amdal-user-updated'));
      showToastMsg('Foto profil berhasil diperbarui!');
    } catch (err) {
      console.error('Error uploading avatar:', err);
      showToastMsg(err.response?.data?.message || 'Gagal mengunggah foto profil.', 'error');
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Handle save profile name & phone
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!editingName.trim()) {
      showToastMsg('Nama tidak boleh kosong.', 'error');
      return;
    }

    setSavingProfile(true);
    try {
      const res = await api.post('/user/profile', {
        name: editingName.trim(),
        phone: editingPhone.trim(),
      });

      const updatedUser = {
        ...user,
        ...(res.data?.user || {}),
        name: editingName.trim(),
        phone: editingPhone.trim(),
      };

      setUser(updatedUser);
      localStorage.setItem('amdal_user', JSON.stringify(updatedUser));
      window.dispatchEvent(new Event('amdal-user-updated'));
      showToastMsg('Informasi akun berhasil disimpan!');
    } catch (err) {
      console.error('Error saving profile:', err);
      showToastMsg(err.response?.data?.message || 'Gagal menyimpan informasi profil.', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleLogout = async () => {
    try { await api.post('/logout'); } catch {}
    localStorage.removeItem('amdal_token');
    localStorage.removeItem('amdal_user');
    navigate('/sign-in');
  };

  const activeKonsultasiCount = konsultasi.filter(k => k.status === 'dijadwalkan' || k.status === 'menunggu_konfirmasi').length;
  const photoSrc = getPhotoUrl(user);

  return (
    <DashboardLayout
      title="Akun Saya"
      subtitle="Kelola foto profil, riwayat konsultasi, saldo point, dan artikel publikasi Anda."
      headerRight={
        <div className="flex items-center gap-2">
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#8B4513] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-[#6B3410] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">search</span>
            <span className="hidden sm:inline">Cari Tenaga Ahli</span>
            <span className="sm:hidden">Cari Ahli</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* ── Toast Notification ── */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-[999] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all duration-300 ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toast.msg}</span>
          </div>
        )}

        {/* ── Hidden File Input for Avatar ── */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />

        {/* ── Top Hero Card Klien with Avatar Upload ── */}
        <div className="bg-gradient-to-r from-[#8B4513] via-[#733A10] to-[#55290A] rounded-2xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-6">
            <span className="material-symbols-outlined text-[160px]">account_circle</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
            <div className="flex items-center gap-4 min-w-0">
              {/* Avatar Circle with Upload Trigger */}
              <div className="relative group shrink-0">
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt={user?.name || 'Foto Profil'}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white/40 shadow-md"
                  />
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 border-2 border-white/30 flex items-center justify-center text-xl sm:text-2xl font-black text-white shadow-inner">
                    {getInitials(user?.name)}
                  </div>
                )}

                {/* Hover / Touch camera overlay */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  title="Ganti Foto Profil"
                  className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center text-white transition-opacity cursor-pointer disabled:opacity-50"
                >
                  {uploadingAvatar ? (
                    <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[20px]">photo_camera</span>
                      <span className="text-[9px] font-bold mt-0.5">Ubah</span>
                    </>
                  )}
                </button>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-lg sm:text-2xl font-black truncate text-white">{user?.name || 'Klien TenagaAhli'}</h1>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider bg-white/20 text-white px-2.5 py-0.5 rounded-full border border-white/20">
                    <span className="material-symbols-outlined text-[12px]">person</span>
                    Akun Klien
                  </span>
                </div>
                <p className="text-white/80 text-xs sm:text-sm truncate mt-0.5">{user?.email}</p>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="inline-flex items-center gap-1 text-[11px] font-bold bg-white/15 hover:bg-white/25 text-white px-2.5 py-1 rounded-lg border border-white/20 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[14px]">add_a_photo</span>
                    <span>{photoSrc ? 'Ganti Foto Profil' : 'Tambah Foto Profil'}</span>
                  </button>
                  <span className="text-white/60 text-[11px]">
                    Bergabung: {formatDate(user?.created_at)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              <Link
                to="/top-up"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-[#FFD700] text-[#55290A] font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow hover:bg-[#FFE44D] transition-all hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined text-[18px]">toll</span>
                <span>Top Up Point</span>
              </Link>
              <Link
                to="/kelola-berita"
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 bg-white/15 hover:bg-white/25 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl border border-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">edit_note</span>
                <span>Tulis Berita</span>
              </Link>
            </div>
          </div>
        </div>

        {/* ── 3 Quick Stat Cards (Cleaned up, without Pasang Iklan) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Stat 1: Saldo Point */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Saldo Point</span>
              <div className="w-9 h-9 rounded-xl bg-amber-50/60 p-1 flex items-center justify-center">
                <img src={coinImg} alt="Coin" className="w-7 h-7 object-contain drop-shadow-xs" />
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{formatPoints(pointBalance)}</p>
              <Link to="/top-up" className="text-xs text-[#8B4513] font-bold hover:underline inline-flex items-center gap-0.5 mt-1">
                Isi Saldo Point <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </Link>
            </div>
          </div>

          {/* Stat 2: Total Konsultasi */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Riwayat Konsultasi</span>
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">psychology</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{konsultasi.length}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">
                {activeKonsultasiCount > 0 ? `${activeKonsultasiCount} jadwal aktif` : 'Belum ada jadwal aktif'}
              </p>
            </div>
          </div>

          {/* Stat 3: Berita & Publikasi */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 sm:p-5 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] sm:text-xs font-bold text-gray-500 uppercase tracking-wider">Berita & Informasi Proyek</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">newspaper</span>
              </div>
            </div>
            <div>
              <p className="text-2xl font-black text-gray-900">{articlesCount}</p>
              <Link to="/kelola-berita" className="text-xs text-[#8B4513] font-bold hover:underline inline-flex items-center gap-0.5 mt-1">
                Kelola Berita <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
              </Link>
            </div>
          </div>
        </div>


        {/* ── Main Tab Navigation (Konsultasi, Top Up, Informasi Akun) ── */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-xs overflow-hidden">
          <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
            {[
              { id: 'konsultasi', label: 'Riwayat Konsultasi', icon: 'psychology', count: konsultasi.length },
              { id: 'pesanan',    label: 'Pesanan & Produk Saya', icon: 'menu_book', count: purchases.length },
              { id: 'topup',      label: 'Top Up & Point',     icon: 'toll' },
              { id: 'akun',       label: 'Informasi Akun & Foto', icon: 'manage_accounts' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-5 py-4 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-all ${
                  tab === t.id
                    ? 'border-[#8B4513] text-[#8B4513] bg-[#8B4513]/5'
                    : 'border-transparent text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{t.icon}</span>
                <span>{t.label}</span>
                {t.count !== undefined && t.count > 0 && (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    tab === t.id ? 'bg-[#8B4513] text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Tab Content: Konsultasi ── */}
          {tab === 'konsultasi' && (
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
                  <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-[#8B4513] animate-spin" />
                  <span className="text-sm font-medium">Memuat riwayat konsultasi...</span>
                </div>
              ) : konsultasi.length === 0 ? (
                <div className="py-12 sm:py-16 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-[#F5EBE1] text-[#8B4513] flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">psychology</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-base mb-1">Belum Ada Riwayat Konsultasi</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-5 leading-relaxed">
                    Anda belum pernah melakukan booking konsultasi dengan tenaga ahli. Cari tenaga ahli yang sesuai dengan kebutuhan AMDAL dan studi lingkungan Anda.
                  </p>
                  <Link
                    to="/search"
                    className="inline-flex items-center gap-2 bg-[#8B4513] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-[#6B3410] transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">search</span>
                    <span>Cari Tenaga Ahli Sekarang</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
                    <div className="flex items-center gap-2 text-xs text-blue-950 font-semibold">
                      <span className="material-symbols-outlined text-blue-600 text-[20px] shrink-0">videocam</span>
                      <span>Halaman khusus akses Link Zoom, Meeting ID, dan Passcode tersedia lengkap di menu Jadwal & Link Zoom.</span>
                    </div>
                    <Link
                      to="/jadwal-konsultasi"
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shrink-0 inline-flex items-center justify-center gap-1 shadow-2xs transition-all"
                    >
                      <span>Buka Halaman Zoom</span>
                      <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                    </Link>
                  </div>

                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base">Daftar Konsultasi Anda</h3>
                    <span className="text-xs text-gray-500 font-medium">Total: {konsultasi.length} jadwal</span>
                  </div>

                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {konsultasi.map((k) => {
                      const st = STATUS_MAP[k.status] || STATUS_MAP.selesai;
                      return (
                        <div
                          key={k.id}
                          className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 hover:border-[#8B4513]/30 transition-all hover:shadow-xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <div className="flex items-center gap-3">
                              {(k.expert?.photo || k.expert?.photo_url) ? (
                                <img
                                  src={getMediaUrl(k.expert.photo_url || k.expert.photo)}
                                  alt={k.expert?.name || 'Tenaga Ahli'}
                                  onError={(e) => {
                                    e.currentTarget.onerror = null;
                                    e.currentTarget.src = getDefaultPhoto(k.expert?.id);
                                  }}
                                  className="w-11 h-11 rounded-xl object-cover border border-gray-200 shrink-0"
                                />
                              ) : (
                                <div className="w-11 h-11 rounded-xl bg-[#FAF4EE] border border-[#8B4513]/15 flex items-center justify-center text-[#8B4513] shrink-0">
                                  <span className="material-symbols-outlined text-[22px]">psychology</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                                  {k.expert?.name || 'Tenaga Ahli'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {k.expert?.field || k.expert?.kriteria || 'Konsultasi Lingkungan'}
                                </p>
                              </div>
                            </div>
                            <span
                              className="self-start sm:self-center inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full shrink-0"
                              style={{ color: st.color, backgroundColor: st.bg }}
                            >
                              <span className="material-symbols-outlined text-[15px]">{st.icon}</span>
                              {st.label}
                            </span>
                          </div>

                          <div className="bg-[#FAFBF9] rounded-xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-700 border border-gray-100">
                            <div>
                              <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Topik</span>
                              <span className="font-semibold text-gray-900 line-clamp-1">{k.topic || '-'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Layanan</span>
                              <span className="font-medium text-gray-800">{k.service_type || 'Online'}</span>
                            </div>
                            <div>
                              <span className="text-gray-400 block text-[10px] uppercase font-bold tracking-wider">Tanggal & Waktu</span>
                              <span className="font-medium text-gray-800">{formatDate(k.consultation_date)}</span>
                            </div>
                          </div>

                          {/* Zoom Link Section if provided by Admin */}
                          {k.zoom_link ? (
                            <div className="mt-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
                                  <span className="material-symbols-outlined text-blue-600 text-[18px]">videocam</span>
                                  <span>Ruang Konsultasi Zoom Resmi ({k.duration_minutes || 30} Menit)</span>
                                </div>
                                <p className="text-[11px] text-blue-800">
                                  Link telah disiapkan oleh Administrator. Durasi sesi: <span className="font-semibold">{k.duration_minutes || 30} Menit</span>.
                                </p>
                                {(k.zoom_meeting_id || k.zoom_passcode) && (
                                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-700 pt-0.5">
                                    {k.zoom_meeting_id && (
                                      <span>ID: <strong className="font-mono text-gray-900">{k.zoom_meeting_id}</strong></span>
                                    )}
                                    {k.zoom_passcode && (
                                      <span>Passcode: <strong className="font-mono text-gray-900">{k.zoom_passcode}</strong></span>
                                    )}
                                  </div>
                                )}
                              </div>
                              <a
                                href={k.zoom_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all shrink-0 hover:scale-[1.02]"
                              >
                                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                <span>Masuk Zoom</span>
                              </a>
                            </div>
                          ) : (
                            <div className="mt-2 text-[11px] text-amber-700 bg-amber-50/70 border border-amber-200/60 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                              <span className="material-symbols-outlined text-[14px]">info</span>
                              <span>Link Zoom ({k.duration_minutes || 30} Menit) akan dibuat & dikirimkan oleh Admin setelah jadwal dikonfirmasi.</span>
                            </div>
                          )}

                          <div className="mt-3.5 flex items-center justify-between gap-3 pt-2 border-t border-gray-100">
                            <Link
                              to={`/chat?id=${k.id}`}
                              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 inline-flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[15px]">chat</span>
                              <span>Buka Chat</span>
                            </Link>

                            {k.expert?.slug && (
                              <Link
                                to={`/profil/${k.expert.slug}`}
                                className="text-xs font-bold text-[#8B4513] hover:text-[#6B3410] inline-flex items-center gap-1"
                              >
                                <span>Lihat Profil Ahli</span>
                                <span className="material-symbols-outlined text-[15px]">arrow_forward</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab Content: Pesanan & Produk Saya ── */}
          {tab === 'pesanan' && (
            <div className="p-4 sm:p-6">
              {loading ? (
                <div className="flex items-center justify-center py-16 gap-3 text-gray-500">
                  <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-[#8B4513] animate-spin" />
                  <span className="text-sm font-medium">Memuat daftar pesanan produk...</span>
                </div>
              ) : purchases.length === 0 ? (
                <div className="py-12 sm:py-16 text-center max-w-md mx-auto">
                  <div className="w-16 h-16 rounded-2xl bg-[#F5EBE1] text-[#8B4513] flex items-center justify-center mx-auto mb-4">
                    <span className="material-symbols-outlined text-3xl">menu_book</span>
                  </div>
                  <h3 className="font-bold text-gray-800 text-base mb-1">Belum Ada Pesanan Produk</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mb-5 leading-relaxed">
                    Anda belum memiliki pesanan buku cetak atau produk digital. Kunjungi profil tenaga ahli atau katalog karya untuk mendapatkan buku referensi AMDAL & panduan lingkungan.
                  </p>
                  <Link
                    to="/search"
                    className="inline-flex items-center gap-2 bg-[#8B4513] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-[#6B3410] transition-colors shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[18px]">menu_book</span>
                    <span>Jelajahi Produk & Buku Ahli</span>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                      Riwayat Pesanan & Koleksi Produk ({purchases.length})
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {purchases.map((p) => {
                      const isCompleted = p.status === 'completed' || p.status === 'approved' || p.status === 'paid';
                      const isPending = p.status === 'pending_payment' || p.status === 'pending' || p.status === 'menunggu_pembayaran';
                      const isDigital = p.product?.is_digital ?? !p.courier_name;

                      return (
                        <div
                          key={p.id}
                          className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 hover:border-[#8B4513]/40 transition-all shadow-2xs hover:shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-4 min-w-0 flex-1">
                            {/* Product Image / Icon */}
                            <div className="w-16 h-20 sm:w-20 sm:h-24 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                              {p.product?.image_url ? (
                                <img
                                  src={p.product.image_url}
                                  alt={p.product_title || 'Produk'}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span className="material-symbols-outlined text-gray-400 text-3xl">
                                  {isDigital ? 'description' : 'menu_book'}
                                </span>
                              )}
                            </div>

                            {/* Product Info */}
                            <div className="min-w-0 space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isDigital ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {isDigital ? 'Produk Digital' : 'Buku Fisik'}
                                </span>
                                <span className="text-[11px] text-gray-400 font-mono">
                                  {p.reference_code || `ORD-${p.id}`}
                                </span>
                              </div>

                              <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                                {p.product_title || p.product?.title || 'Produk Ahli'}
                              </h4>

                              <div className="text-xs text-gray-500 flex items-center gap-2 flex-wrap pt-0.5">
                                <span className="font-semibold text-[#8B4513]">
                                  {p.points_spent > 0
                                    ? `${formatPoints(p.points_spent)} Point`
                                    : new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(p.amount_idr || 0)
                                  }
                                </span>
                                <span>•</span>
                                <span>{formatDate(p.purchased_at || p.created_at)}</span>
                              </div>

                              {/* Status Badge */}
                              <div className="pt-1">
                                {isCompleted ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                                    Lunas / Selesai
                                  </span>
                                ) : isPending ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                                    <span className="material-symbols-outlined text-[13px]">schedule</span>
                                    Menunggu Pembayaran
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 capitalize">
                                    {p.status}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-row md:flex-col items-center md:items-end gap-2 w-full md:w-auto shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-gray-100">
                            {isCompleted && isDigital && (
                              <button
                                type="button"
                                disabled={downloadingId === p.id}
                                onClick={() => handleDownloadProduct(p)}
                                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#8B4513] hover:bg-[#6B3410] text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                              >
                                {downloadingId === p.id ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                                ) : (
                                  <span className="material-symbols-outlined text-[16px]">download</span>
                                )}
                                <span>{p.product?.download_url && !p.product?.file_url ? 'Buka Akses Karya' : 'Unduh Berkas PDF'}</span>
                              </button>
                            )}

                            {isPending && (
                              <Link
                                to={`/checkout/${p.product_id || p.product?.id || ''}`}
                                className="w-full md:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs"
                              >
                                <span className="material-symbols-outlined text-[16px]">payment</span>
                                <span>Selesaikan Pembayaran</span>
                              </Link>
                            )}

                            {p.product_id && (
                              <Link
                                to={`/produk/${p.product_id}`}
                                className="w-full md:w-auto inline-flex items-center justify-center gap-1 px-3 py-1.5 text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-semibold transition-colors"
                              >
                                <span>Detail Produk</span>
                                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                              </Link>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab Content: Top Up & Point ── */}
          {tab === 'topup' && (
            <div className="p-4 sm:p-6 space-y-5">
              {/* Saldo Wallet Banner */}
              <div
                className="relative overflow-hidden rounded-2xl sm:rounded-3xl p-5 sm:p-6 text-white shadow-md"
                style={{ background: 'linear-gradient(135deg, #8B4513 0%, #6F370F 60%, #4D260A 100%)' }}
              >
                <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute right-4 bottom-0 w-24 h-24 rounded-full bg-amber-400/10 pointer-events-none" />

                <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-amber-200">
                        Saldo Point Anda
                      </span>
                      <span className="text-[10px] font-extrabold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                        Aktif
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none">
                        {formatPoints(pointBalance)}
                      </span>
                      <span className="text-sm font-bold text-amber-200">Point</span>
                    </div>
                    <p className="text-xs text-white/80 mt-2 max-w-sm leading-relaxed">
                      1 Point = Rp 1.000. Gunakan untuk konsultasi ahli & pembelian produk digital.
                    </p>
                  </div>

                  <div className="flex items-center gap-2.5 pt-1 sm:pt-0">
                    <Link
                      to="/top-up"
                      className="w-full sm:w-auto bg-amber-400 hover:bg-amber-300 text-amber-950 px-5 py-3 rounded-xl font-extrabold text-sm transition-all inline-flex items-center justify-center gap-2 shadow-md active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">add_circle</span>
                      <span>Top Up Point Sekarang</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* Menu Aksi Cepat Point */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                <Link
                  to="/top-up"
                  className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 hover:border-[#8B4513] hover:shadow-md transition-all group flex items-center sm:flex-col sm:text-center gap-3.5 sm:gap-0 active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-[#FAF4EE] flex items-center justify-center shrink-0 sm:mb-3 group-hover:scale-110 transition-transform p-1.5 border border-amber-900/10">
                    <img src={coinImg} alt="Coin" className="w-9 h-9 object-contain drop-shadow-xs" />
                  </div>
                  <div className="min-w-0 flex-1 sm:flex-initial">
                    <h4 className="font-extrabold text-sm text-gray-900">Beli Paket Point</h4>
                    <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Pilih berbagai paket point dengan harga terbaik</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 sm:hidden">chevron_right</span>
                </Link>

                <Link
                  to="/riwayat-point"
                  className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 hover:border-[#8B4513] hover:shadow-md transition-all group flex items-center sm:flex-col sm:text-center gap-3.5 sm:gap-0 active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 sm:mb-3 group-hover:scale-110 transition-transform border border-emerald-200/60">
                    <span className="material-symbols-outlined text-[26px]">receipt_long</span>
                  </div>
                  <div className="min-w-0 flex-1 sm:flex-initial">
                    <h4 className="font-extrabold text-sm text-gray-900">Riwayat Transaksi</h4>
                    <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Pantau riwayat top up dan pemakaian point</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 sm:hidden">chevron_right</span>
                </Link>

                <Link
                  to="/daftar-profil"
                  className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 hover:border-[#8B4513] hover:shadow-md transition-all group flex items-center sm:flex-col sm:text-center gap-3.5 sm:gap-0 active:scale-[0.99]"
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 sm:mb-3 group-hover:scale-110 transition-transform border border-blue-200/60">
                    <span className="material-symbols-outlined text-[26px]">shopping_bag</span>
                  </div>
                  <div className="min-w-0 flex-1 sm:flex-initial">
                    <h4 className="font-extrabold text-sm text-gray-900">Gunakan Point</h4>
                    <p className="text-xs text-gray-500 mt-0.5 sm:mt-1">Beli produk digital dan konsultasikan proyek Anda</p>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 sm:hidden">chevron_right</span>
                </Link>
              </div>
            </div>
          )}

          {/* ── Tab Content: Informasi Akun & Foto ── */}
          {tab === 'akun' && (
            <div className="p-4 sm:p-6 space-y-6">
              {/* Foto Profil Section */}
              <div className="bg-[#FAFBF9] p-5 rounded-2xl border border-gray-200/80">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1">Foto Profil Akun</h3>
                <p className="text-xs text-gray-500 mb-4">
                  Foto profil Anda akan tampil di pojok kanan atas navbar dan dasbor. Jika belum diunggah, sistem akan menampilkan inisial nama Anda secara otomatis.
                </p>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt={user?.name || 'Foto Profil'}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-[#8B4513]/20 shadow-xs"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-2xl bg-[#8B4513] text-white flex items-center justify-center text-2xl font-black shadow-xs">
                      {getInitials(user?.name)}
                    </div>
                  )}

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8B4513] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#6B3410] transition-colors shadow-xs disabled:opacity-50"
                      >
                        {uploadingAvatar ? (
                          <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">upload</span>
                        )}
                        <span>{photoSrc ? 'Ganti Foto Baru' : 'Unggah Foto Profil'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400">
                      Mendukung format JPG, PNG, WEBP (Maksimal 5MB).
                    </p>
                  </div>
                </div>
              </div>

              {/* Edit Informasi Akun Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <h3 className="font-bold text-sm sm:text-base text-gray-900 mb-1">Informasi Identitas</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Nama Lengkap <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      placeholder="Masukkan nama lengkap..."
                      className="w-full bg-[#FAFBF9] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Alamat Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                    />
                    <span className="text-[10px] text-gray-400 mt-1 block">Email tidak dapat diubah</span>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Nomor Telepon / WhatsApp
                      </label>
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">lock</span>
                        Rahasia / Tidak Publik
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={editingPhone}
                      onChange={(e) => setEditingPhone(e.target.value)}
                      placeholder="Contoh: 08123456789"
                      className="w-full bg-[#FAFBF9] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
                    />
                    <p className="text-[10px] text-emerald-800 font-medium mt-1 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[13px] text-emerald-600 shrink-0">verified_user</span>
                      <span>Tidak ditampilkan di publik</span>
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Tipe Peran Akun
                    </label>
                    <div className="w-full bg-gray-100 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-[#8B4513] font-bold capitalize">
                      Klien Pengguna
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#8B4513] text-white rounded-xl text-xs sm:text-sm font-bold hover:bg-[#6B3410] transition-colors shadow-sm disabled:opacity-50"
                  >
                    {savingProfile && (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}
                    <span>Simpan Perubahan</span>
                  </button>
                </div>
              </form>

              {/* Password & Logout Options */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/pengaturan"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs sm:text-sm font-bold transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">lock</span>
                  <span>Ganti Kata Sandi</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs sm:text-sm font-bold transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  <span>Keluar dari Akun</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
