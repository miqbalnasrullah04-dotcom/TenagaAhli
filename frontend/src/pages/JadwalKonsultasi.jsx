import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout.jsx';
import api from '../api/client.js';
import { OFFICIAL_BANK_ACCOUNTS, PT_COMPANY_NAME } from '../constants/bankAccounts.js';
import { loadMidtransSnap } from '../utils/midtrans.js';
import { getMediaUrl, getDefaultPhoto } from '../utils/media.js';
import ManualPaymentInstruction from '../components/ManualPaymentInstruction.jsx';

const BRAND_BROWN = '#8B4513';

const STATUS_MAP = {
  menunggu_konfirmasi: {
    label: 'Menunggu Konfirmasi',
    color: '#D97706',
    bg: '#FEF3C7',
    icon: 'hourglass_top',
    desc: 'Jadwal Anda sedang menunggu verifikasi dari Tenaga Ahli & Administrator.',
  },
  dikonfirmasi: {
    label: 'Terkonfirmasi',
    color: '#2563EB',
    bg: '#EFF6FF',
    icon: 'verified',
    desc: 'Jadwal telah dikonfirmasi. Pastikan Anda siap sebelum sesi dimulai.',
  },
  in_progress: {
    label: 'Sedang Berlangsung',
    color: '#059669',
    bg: '#ECFDF5',
    icon: 'play_circle',
    desc: 'Sesi konsultasi sedang aktif.',
  },
  selesai: {
    label: 'Selesai',
    color: '#16A34A',
    bg: '#DCFCE7',
    icon: 'check_circle',
    desc: 'Sesi konsultasi telah selesai dilaksanakan.',
  },
  dibatalkan: {
    label: 'Dibatalkan',
    color: '#DC2626',
    bg: '#FEE2E2',
    icon: 'cancel',
    desc: 'Sesi konsultasi telah dibatalkan.',
  },
};

const formatDate = (dateStr, timeStr) => {
  if (!dateStr) return 'Jadwal Fleksibel';
  try {
    const d = new Date(dateStr);
    const dateFormatted = d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    if (!timeStr) return dateFormatted;
    const cleanTime = timeStr.replace(/\s*WIB/gi, '').trim();
    return `${dateFormatted} • Pukul ${cleanTime} WIB`;
  } catch {
    return dateStr;
  }
};

export default function JadwalKonsultasi() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all'); // all, zoom, waiting, completed
  const [copiedKey, setCopiedKey] = useState(null);
  const [toast, setToast] = useState(null);

  // Payment states
  const [uploadModalItem, setUploadModalItem] = useState(null);
  const [uploadProofFile, setUploadProofFile] = useState(null);
  const [uploadProofPreview, setUploadProofPreview] = useState(null);
  const [uploadBankId, setUploadBankId] = useState('qris');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [payingMidtransId, setPayingMidtransId] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleCopy = (text, keyLabel) => {
    if (!text) return;
    navigator.clipboard?.writeText(text);
    setCopiedKey(keyLabel);
    showToast(`${keyLabel} berhasil disalin ke clipboard!`);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const fetchConsultations = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/consultations');
      const items = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setConsultations(items);
    } catch (err) {
      console.error('Gagal memuat jadwal konsultasi:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePayMidtrans = async (item) => {
    try {
      setPayingMidtransId(item.id);
      const res = await api.post(`/consultations/${item.id}/snap-token`);
      const snapToken = res.data?.snap_token;
      if (!snapToken) {
        showToast('Gagal memuat token pembayaran Midtrans.');
        return;
      }
      await loadMidtransSnap();
      if (!window.snap) {
        showToast('Gagal membuka popup Midtrans. Periksa koneksi internet Anda.');
        return;
      }
      window.snap.pay(snapToken, {
        onSuccess: async () => {
          showToast('Pembayaran Midtrans berhasil terverifikasi!');
          fetchConsultations();
        },
        onPending: () => {
          showToast('Menunggu penyelesaian pembayaran.');
          fetchConsultations();
        },
        onError: () => {
          showToast('Pembayaran Midtrans gagal atau dibatalkan.');
        },
        onClose: () => {
          fetchConsultations();
        },
      });
    } catch (err) {
      console.error('Error pay midtrans:', err);
      showToast(err.response?.data?.message || 'Gagal memulai pembayaran Midtrans.');
    } finally {
      setPayingMidtransId(null);
    }
  };

  const handleUploadProof = async (e) => {
    e.preventDefault();
    if (!uploadModalItem || !uploadProofFile) {
      showToast('Pilih file bukti transfer terlebih dahulu.');
      return;
    }
    const selectedBank = OFFICIAL_BANK_ACCOUNTS.find((b) => b.id === uploadBankId) || OFFICIAL_BANK_ACCOUNTS[0];
    const formData = new FormData();
    formData.append('payment_proof', uploadProofFile);
    formData.append('bank_name', selectedBank.bank);

    try {
      setUploadingProof(true);
      await api.post(`/consultations/${uploadModalItem.id}/payment-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Bukti pembayaran berhasil diunggah! Sedang menunggu verifikasi admin.');
      setUploadModalItem(null);
      setUploadProofFile(null);
      setUploadProofPreview(null);
      fetchConsultations();
    } catch (err) {
      console.error('Upload proof error:', err);
      showToast(err.response?.data?.message || 'Gagal mengunggah bukti pembayaran.');
    } finally {
      setUploadingProof(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  // Filtered items
  const filtered = consultations.filter((item) => {
    if (activeFilter === 'zoom') {
      return Boolean(item.zoom_link);
    }
    if (activeFilter === 'waiting') {
      return item.status === 'menunggu_konfirmasi' || !item.zoom_link;
    }
    if (activeFilter === 'completed') {
      return item.status === 'selesai' || item.status === 'dibatalkan';
    }
    return true;
  });

  const countZoomReady = consultations.filter((c) => Boolean(c.zoom_link)).length;
  const countWaiting = consultations.filter((c) => c.status === 'menunggu_konfirmasi').length;
  const countCompleted = consultations.filter((c) => c.status === 'selesai').length;

  return (
    <DashboardLayout
      title="Jadwal & Link Zoom Konsultasi"
      subtitle="Ruang akses resmi Link Zoom, jadwal tatap muka daring, dan koordinasi dengan Tenaga Ahli."
      headerRight={
        <div className="flex items-center gap-2">
          <button
            onClick={fetchConsultations}
            disabled={loading}
            className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
            title="Muat Ulang"
          >
            <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            <span className="hidden sm:inline">Refresh</span>
          </button>
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8B4513] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-[#6B3410] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">add_circle</span>
            <span>Pesan Jadwal Baru</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Toast Notif */}
        {toast && (
          <div className="fixed top-5 right-5 z-[999] flex items-center gap-2 px-4 py-3 bg-gray-900 text-white rounded-xl shadow-xl text-xs sm:text-sm font-semibold animate-fade-in">
            <span className="material-symbols-outlined text-emerald-400 text-[18px]">check_circle</span>
            <span>{toast}</span>
          </div>
        )}

        {/* ── Panduan Resmi Cara Menerima Link Zoom Banner ── */}
        <div className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] text-white rounded-2xl p-5 sm:p-6 shadow-md relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-white/5 pointer-events-none">
            <span className="material-symbols-outlined text-[140px]">video_camera_front</span>
          </div>

          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400">
                <span className="material-symbols-outlined text-[20px]">videocam</span>
              </span>
              <h2 className="text-base sm:text-lg font-bold text-white">
                Cara Menerima & Masuk ke Link Zoom Konsultasi
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-3xl">
              Setelah Anda mengajukan sesi konsultasi, Tenaga Ahli dan Administrator akan mengonfirmasi ketersediaan jadwal. 
              Tautan <strong className="text-white">Ruang Zoom Resmi</strong> beserta <strong className="text-white">Meeting ID & Passcode</strong> akan diterbitkan otomatis pada kartu jadwal Anda di bawah ini dan dapat langsung Anda masuki cukup dengan menekan tombol <strong className="text-blue-300">"Masuk Ruang Zoom Sekarang"</strong>.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 text-xs text-gray-300">
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">1</span>
                <div>
                  <p className="font-semibold text-white">Pilih Jadwal Ahli</p>
                  <p className="text-[11px] text-gray-400">Pemesanan minimal H-1 sebelum sesi dimulai.</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-white">Admin Terbitkan Link</p>
                  <p className="text-[11px] text-gray-400">Link Zoom & kredensial disiapkan sebelum jam konsultasi.</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-xl p-3 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">3</span>
                <div>
                  <p className="font-semibold text-white">Klik & Masuk Zoom</p>
                  <p className="text-[11px] text-gray-400">Tekan tombol biru "Masuk Zoom" untuk langsung tatap muka.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Status Metrics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl border border-gray-200/80 p-4 shadow-xs">
            <p className="text-xs text-gray-500 font-medium">Total Konsultasi</p>
            <p className="text-2xl font-black text-gray-900 mt-1">{consultations.length}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Semua riwayat jadwal</p>
          </div>

          <div className="bg-white rounded-2xl border border-blue-200/80 p-4 shadow-xs bg-gradient-to-br from-blue-50/50 to-white">
            <p className="text-xs text-blue-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              Link Zoom Siap
            </p>
            <p className="text-2xl font-black text-blue-900 mt-1">{countZoomReady}</p>
            <p className="text-[11px] text-blue-600 mt-0.5">Siap dimasuki sekarang</p>
          </div>

          <div className="bg-white rounded-2xl border border-amber-200/80 p-4 shadow-xs bg-gradient-to-br from-amber-50/50 to-white">
            <p className="text-xs text-amber-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Menunggu Konfirmasi
            </p>
            <p className="text-2xl font-black text-amber-900 mt-1">{countWaiting}</p>
            <p className="text-[11px] text-amber-600 mt-0.5">Proses verifikasi</p>
          </div>

          <div className="bg-white rounded-2xl border border-emerald-200/80 p-4 shadow-xs bg-gradient-to-br from-emerald-50/50 to-white">
            <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Selesai Dilaksanakan
            </p>
            <p className="text-2xl font-black text-emerald-900 mt-1">{countCompleted}</p>
            <p className="text-[11px] text-emerald-600 mt-0.5">Sesi telah tuntas</p>
          </div>
        </div>

        {/* ── Filter Tabs ── */}
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-200 pb-3">
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'all'
                ? 'bg-gray-900 text-white shadow-xs'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Semua Jadwal ({consultations.length})
          </button>
          <button
            onClick={() => setActiveFilter('zoom')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeFilter === 'zoom'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-blue-700 border border-blue-200 hover:bg-blue-50'
            }`}
          >
            <span className="material-symbols-outlined text-[15px]">videocam</span>
            <span>Link Zoom Siap ({countZoomReady})</span>
          </button>
          <button
            onClick={() => setActiveFilter('waiting')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'waiting'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-white text-amber-700 border border-amber-200 hover:bg-amber-50'
            }`}
          >
            Menunggu Link / Konfirmasi ({countWaiting})
          </button>
          <button
            onClick={() => setActiveFilter('completed')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
            }`}
          >
            Selesai ({countCompleted})
          </button>
        </div>

        {/* ── Content List ── */}
        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
            <span className="w-9 h-9 rounded-full border-3 border-[#8B4513] border-t-transparent animate-spin inline-block"></span>
            <p className="text-sm font-semibold text-gray-600">Memuat jadwal & link Zoom Anda...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mx-auto">
              <span className="material-symbols-outlined text-[32px]">video_call</span>
            </div>
            <div className="max-w-md mx-auto space-y-1.5">
              <h3 className="text-base sm:text-lg font-bold text-gray-900">
                {activeFilter === 'zoom'
                  ? 'Belum Ada Link Zoom yang Aktif'
                  : 'Belum Ada Jadwal Konsultasi'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                {activeFilter === 'zoom'
                  ? 'Link Zoom resmi akan segera muncul di sini setelah jadwal Anda diverifikasi oleh Tenaga Ahli dan Administrator.'
                  : 'Anda belum memesan sesi konsultasi daring. Pilih Tenaga Ahli berpengalaman dan tentukan tanggal tatap muka Zoom sesuai kebutuhan Anda.'}
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/search"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B4513] hover:bg-[#6B3410] text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm transition-all hover:scale-[1.02]"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                <span>Cari Tenaga Ahli Sekarang</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-5">
            {filtered.map((item) => {
              const st = STATUS_MAP[item.status] || STATUS_MAP.menunggu_konfirmasi;
              const hasZoom = Boolean(item.zoom_link);

              return (
                <div
                  key={item.id}
                  className={`bg-white rounded-2xl border transition-all shadow-xs overflow-hidden ${
                    hasZoom
                      ? 'border-blue-200 ring-2 ring-blue-500/10'
                      : 'border-gray-200/90 hover:border-gray-300'
                  }`}
                >
                  {/* Top card bar with Expert info & status */}
                  <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#FCFDFD] border-b border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                      {(item.expert?.photo || item.expert?.photo_url) ? (
                        <img
                          src={getMediaUrl(item.expert.photo_url || item.expert.photo)}
                          alt={item.expert?.name || 'Tenaga Ahli'}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getDefaultPhoto(item.expert?.id);
                          }}
                          className="w-12 h-12 rounded-xl object-cover border border-gray-200 shrink-0"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-[#FAF4EE] border border-[#8B4513]/20 flex items-center justify-center text-[#8B4513] font-bold text-sm shrink-0">
                          <span className="material-symbols-outlined text-[24px]">psychology</span>
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-gray-900 text-sm sm:text-base truncate">
                            {item.expert?.name || 'Tenaga Ahli'}
                          </p>
                          {item.expert?.slug && (
                            <Link
                              to={`/profil/${item.expert.slug}`}
                              className="text-[11px] font-semibold text-[#8B4513] hover:underline inline-flex items-center gap-0.5"
                            >
                              <span>Profil Ahli</span>
                              <span className="material-symbols-outlined text-[12px]">open_in_new</span>
                            </Link>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 truncate">
                          {item.expert?.field || item.expert?.kriteria || 'Spesialis Konsultasi Lingkungan & AMDAL'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                      {/* Payment Status Badge */}
                      {item.payment_status === 'paid' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                          <span className="material-symbols-outlined text-[14px]">verified</span>
                          <span>Lunas</span>
                        </span>
                      ) : item.payment_status === 'menunggu_verifikasi' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-800">
                          <span className="material-symbols-outlined text-[14px]">hourglass_top</span>
                          <span>Verifikasi Admin</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800">
                          <span className="material-symbols-outlined text-[14px]">pending</span>
                          <span>Belum Bayar</span>
                        </span>
                      )}

                      <span
                        className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full"
                        style={{ color: st.color, backgroundColor: st.bg }}
                      >
                        <span className="material-symbols-outlined text-[15px]">{st.icon}</span>
                        <span>{st.label}</span>
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 sm:p-5 space-y-4">
                    {/* Status & Aksi Pembayaran Konsultasi */}
                    {item.payment_status !== 'paid' && (
                      <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-bold text-amber-900">
                            <span className="material-symbols-outlined text-[18px]">payments</span>
                            <span>
                              {item.payment_status === 'menunggu_verifikasi'
                                ? 'Bukti Transfer Sedang Diverifikasi Admin'
                                : 'Pembayaran Konsultasi Belum Selesai'}
                            </span>
                          </div>
                          <p className="text-amber-800 text-[11px] leading-relaxed">
                            {item.payment_status === 'menunggu_verifikasi'
                              ? `Bukti transfer (${item.bank_name || 'Bank'}) Anda telah dikirim dan dalam pengecekan admin. Setelah diverifikasi, jadwal akan aktif.`
                              : `Total Biaya: Rp ${Number(item.amount || 0).toLocaleString('id-ID')}. Anda dapat membayar otomatis via Midtrans atau transfer ke rekening resmi.`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <button
                            type="button"
                            onClick={() => {
                              setUploadModalItem(item);
                              setUploadProofFile(null);
                              setUploadProofPreview(null);
                            }}
                            className="px-3.5 py-2 bg-[#8B4513] hover:bg-[#6B3410] text-white font-bold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer hover:scale-[1.02]"
                          >
                            <span className="material-symbols-outlined text-[16px]">account_balance</span>
                            <span>{item.payment_proof ? 'Ganti Bukti Transfer' : 'Transfer Manual / QRIS (Direkomendasikan)'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePayMidtrans(item)}
                            disabled={payingMidtransId === item.id}
                            className="px-3.5 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-semibold rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                          >
                            <span className="material-symbols-outlined text-[16px]">credit_card</span>
                            <span>{payingMidtransId === item.id ? 'Memuat...' : 'Bayar via Payment Gateway'}</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Session Details Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-3 sm:p-3.5 bg-[#F8FAFC] rounded-xl border border-slate-200/60 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Topik Diskusi
                        </span>
                        <p className="font-semibold text-gray-900 line-clamp-2 mt-0.5">
                          {item.topic || 'Konsultasi Perizinan & Teknis'}
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Layanan & Durasi
                        </span>
                        <p className="font-medium text-gray-800 mt-0.5 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[15px] text-blue-600">videocam</span>
                          <span>{item.service_type || 'Zoom Meeting'} ({item.duration_minutes || 30} Menit)</span>
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                          Jadwal Sesi
                        </span>
                        <p className="font-semibold text-gray-900 mt-0.5">
                          {formatDate(item.consultation_date, item.consultation_time)}
                        </p>
                      </div>
                    </div>

                    {/* ── SEKSI KHUSUS RUANG ZOOM RESMI ── */}
                    {hasZoom ? (
                      <div className="rounded-2xl border-2 border-blue-500/40 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-blue-50 p-4 sm:p-5 shadow-xs">
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <span className="material-symbols-outlined text-[20px]">videocam</span>
                              </span>
                              <div>
                                <h4 className="text-sm sm:text-base font-extrabold text-blue-950">
                                  Ruang Zoom Konsultasi Resmi Siap Digunakan
                                </h4>
                                <p className="text-[11px] sm:text-xs text-blue-800">
                                  Link telah diverifikasi & diterbitkan oleh Administrator. Durasi sesi: <strong className="font-bold">{item.duration_minutes || 30} Menit</strong>.
                                </p>
                              </div>
                            </div>

                            {/* Meeting ID & Passcode info */}
                            <div className="flex flex-wrap items-center gap-2 sm:gap-3 pt-1">
                              {item.zoom_meeting_id && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-mono text-gray-800 shadow-2xs">
                                  <span className="text-[10px] font-sans font-bold text-gray-400 uppercase">ID:</span>
                                  <span className="font-bold text-blue-950">{item.zoom_meeting_id}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(item.zoom_meeting_id, `ID Meeting (${item.zoom_meeting_id})`)}
                                    className="ml-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Salin Meeting ID"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">
                                      {copiedKey?.includes(item.zoom_meeting_id) ? 'check' : 'content_copy'}
                                    </span>
                                  </button>
                                </div>
                              )}

                              {item.zoom_passcode && (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 rounded-lg text-xs font-mono text-gray-800 shadow-2xs">
                                  <span className="text-[10px] font-sans font-bold text-gray-400 uppercase">Passcode:</span>
                                  <span className="font-bold text-blue-950">{item.zoom_passcode}</span>
                                  <button
                                    type="button"
                                    onClick={() => handleCopy(item.zoom_passcode, `Passcode (${item.zoom_passcode})`)}
                                    className="ml-1 text-gray-400 hover:text-blue-600 transition-colors"
                                    title="Salin Passcode"
                                  >
                                    <span className="material-symbols-outlined text-[14px]">
                                      {copiedKey?.includes(item.zoom_passcode) ? 'check' : 'content_copy'}
                                    </span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Tombol Masuk Zoom Utama */}
                          <div className="shrink-0 flex items-center gap-2">
                            <a
                              href={item.zoom_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-black rounded-xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] w-full sm:w-auto"
                            >
                              <span className="material-symbols-outlined text-[20px]">videocam</span>
                              <span>Masuk Ruang Zoom Sekarang</span>
                              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-xl border border-amber-200/90 bg-amber-50/70 p-3.5 sm:p-4 flex items-start gap-3">
                        <span className="material-symbols-outlined text-amber-600 text-[22px] shrink-0 mt-0.5">
                          hourglass_empty
                        </span>
                        <div className="space-y-1">
                          <p className="text-xs sm:text-sm font-bold text-amber-900">
                            Link Zoom Sedang Disiapkan oleh Admin & Ahli
                          </p>
                          <p className="text-xs text-amber-800 leading-relaxed">
                            Jadwal Anda telah tercatat. Tautan Zoom Meeting resmi, ID, dan Passcode akan segera diterbitkan di sini sebelum jadwal konsultasi dimulai. Anda juga akan menerima notifikasi otomatis.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Actions Footer */}
                  <div className="px-4 sm:px-5 py-3 bg-[#FAFBFB] border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-[11px] text-gray-500">
                        ID: <strong className="font-mono text-gray-700">#{item.id}</strong>
                      </span>
                      {item.reference_code && (
                        <span className="text-[11px] text-gray-500 font-mono">
                          Ref: <strong className="text-gray-700">{item.reference_code}</strong>
                        </span>
                      )}
                      <Link
                        to="/invoice"
                        className="text-[11px] font-bold text-[#8B4513] hover:underline inline-flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[13px]">receipt_long</span>
                        <span>Invoice</span>
                      </Link>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <Link
                        to={`/chat?id=${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-semibold transition-all shadow-2xs hover:border-[#8B4513]/40"
                      >
                        <span className="material-symbols-outlined text-[16px] text-[#8B4513]">chat</span>
                        <span>Buka Chat Obrolan</span>
                      </Link>

                      {hasZoom && (
                        <a
                          href={item.zoom_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-2xs"
                        >
                          <span className="material-symbols-outlined text-[15px]">videocam</span>
                          <span>Buka Zoom</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── MODAL UNGGAH BUKTI TRANSFER MANUAL ── */}
      {uploadModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[92vh]">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">receipt_long</span>
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Upload Bukti Transfer Bank</h3>
                  <p className="text-xs text-gray-500">Ref: {uploadModalItem.reference_code || `#${uploadModalItem.id}`}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUploadModalItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUploadProof} className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
              {/* Total Bayar Info */}
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200/80 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-600">Total Biaya Sesi:</span>
                  <div className="text-base font-extrabold text-[#8B4513]">
                    Rp {Number(uploadModalItem.amount || 0).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 text-[10px] uppercase font-bold">Layanan:</span>
                  <div className="font-bold text-gray-800 capitalize">
                    {uploadModalItem.service_type || 'Zoom'}
                  </div>
                </div>
              </div>

              {/* Rekening Tujuan Selector & QRIS Instruction */}
              <ManualPaymentInstruction
                selectedBankId={uploadBankId}
                onSelectBank={setUploadBankId}
              />

              {/* Upload Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Pilih File Bukti Transfer *
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 border-2 border-dashed border-gray-300 hover:border-[#8B4513] rounded-xl p-3.5 text-center cursor-pointer bg-white transition-colors">
                    <input
                      type="file"
                      required
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setUploadProofFile(file);
                          if (file.type.startsWith('image/')) {
                            setUploadProofPreview(URL.createObjectURL(file));
                          } else {
                            setUploadProofPreview(null);
                          }
                        }
                      }}
                    />
                    <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                      <span className="material-symbols-outlined text-[20px] text-[#8B4513]">upload_file</span>
                      <span className="font-semibold truncate">
                        {uploadProofFile ? uploadProofFile.name : 'Pilih file (JPG, PNG, PDF max 5MB)'}
                      </span>
                    </div>
                  </label>
                  {uploadProofFile && (
                    <button
                      type="button"
                      onClick={() => {
                        setUploadProofFile(null);
                        setUploadProofPreview(null);
                      }}
                      className="p-2.5 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200"
                      title="Hapus file"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  )}
                </div>
                {uploadProofPreview && (
                  <div className="mt-2.5 relative inline-block">
                    <img
                      src={uploadProofPreview}
                      alt="Preview"
                      className="h-20 w-32 object-cover rounded-xl border border-gray-200 shadow-2xs"
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUploadModalItem(null)}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={uploadingProof || !uploadProofFile}
                  className="flex-1 py-2.5 px-4 bg-[#8B4513] hover:bg-[#6B3410] text-white font-bold rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  {uploadingProof ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin inline-block"></span>
                      <span>Mengunggah...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>Kirim Bukti Pembayaran</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
