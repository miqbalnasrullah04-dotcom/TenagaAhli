import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import api from '../api/client.js';
import { calculateConsultationSplit } from '../utils/packageCommission.js';
import { SkeletonKonsultasi } from '../components/Skeleton.jsx';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BRAND_BROWN      = '#8B4513';
const BRAND_BROWN_DARK = '#654321';
const BRAND_GREEN      = '#2E5E3B';

const SERVICE_CONFIG = {
  chat:  { label: 'Chat (15 Menit)',  icon: 'chat',     bg: '#EFF6FF', fg: '#1D4ED8', dot: '#3B82F6' },
  email: { label: 'Email',            icon: 'email',    bg: '#F0FDF4', fg: '#15803D', dot: '#22C55E' },
  zoom:  { label: 'Zoom (30 Menit)',  icon: 'videocam', bg: '#F5F3FF', fg: '#7E22CE', dot: '#A855F7' },
};

const DEFAULT_SERVICE = {
  label: 'Konsultasi',
  icon: 'psychology',
  bg: '#EFF6FF',
  fg: '#1D4ED8',
  dot: '#3B82F6',
};

const STATUS_CONFIG = {
  menunggu_konfirmasi: { label: 'Menunggu Konfirmasi', icon: 'schedule',     bg: '#FFFBEB', fg: '#B45309' },
  dikonfirmasi:        { label: 'Dikonfirmasi',         icon: 'check_circle', bg: '#EFF6FF', fg: '#1D4ED8' },
  in_progress:         { label: 'Sedang Berlangsung',   icon: 'play_circle',  bg: '#F0FDF4', fg: '#15803D' },
  selesai:             { label: 'Selesai',              icon: 'task_alt',     bg: '#F0FDF4', fg: '#15803D' },
  dibatalkan:          { label: 'Dibatalkan',           icon: 'cancel',       bg: '#FEF2F2', fg: '#B91C1C' },
  // Compatibility fallbacks:
  pending:             { label: 'Menunggu Konfirmasi', icon: 'schedule',     bg: '#FFFBEB', fg: '#B45309' },
  confirmed:           { label: 'Dikonfirmasi',         icon: 'check_circle', bg: '#EFF6FF', fg: '#1D4ED8' },
  completed:           { label: 'Selesai',              icon: 'task_alt',     bg: '#F0FDF4', fg: '#15803D' },
  cancelled:           { label: 'Dibatalkan',           icon: 'cancel',       bg: '#FEF2F2', fg: '#B91C1C' },
};

const DEFAULT_PRICES = {
  chat:  150000,
  email: 100000,
  zoom:  250000,
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const rupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

const getScheduleDisplay = (c) => {
  if (c.consultation_date && c.consultation_time) {
    const formattedDate = new Date(c.consultation_date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `${formattedDate} • ${c.consultation_time}`;
  }
  if (c.consultation_date) {
    return new Date(c.consultation_date).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }
  if (c.scheduled_at) {
    return new Date(c.scheduled_at).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
  return 'Jadwal belum ditentukan';
};

const formatCreated = (s) => {
  if (!s) return '-';
  return new Date(s).toLocaleString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getPricing = (c, currentUser) => {
  const target = c.expert || currentUser;
  const amount = Number(c.amount) || DEFAULT_PRICES[c.service_type] || 150000;
  const split = calculateConsultationSplit(amount, target);
  const adminCommission = c.admin_commission != null ? Number(c.admin_commission) : split.adminCommission;
  const expertEarning = c.expert_earning != null ? Number(c.expert_earning) : split.expertEarning;
  return {
    amount,
    adminCommission,
    expertEarning,
    commissionPercent: split.commissionPercent,
    earningPercent: split.earningPercent,
    tierLabel: split.tierLabel,
  };
};

// ── Sub-components ────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, toneColor, toneBg }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-5 flex items-center gap-3 sm:gap-4">
      <div className="p-2.5 sm:p-3 rounded-xl shrink-0" style={{ backgroundColor: toneBg }}>
        <span className="material-symbols-outlined text-[22px] sm:text-[26px]" style={{ color: toneColor }}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-[#5B6660] font-bold uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-xl font-black text-[#1F2A22]">{value}</p>
      </div>
    </div>
  );
}

function Badge({ bg, fg, icon, label }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ backgroundColor: bg, color: fg }}
    >
      {icon && <span className="material-symbols-outlined text-[13px]">{icon}</span>}
      {label}
    </span>
  );
}

function ConsultationCard({ consultation, onUpdateStatus, updatingId, currentUser }) {
  const svc    = SERVICE_CONFIG[consultation.service_type] || DEFAULT_SERVICE;
  const status = STATUS_CONFIG[consultation.status] || STATUS_CONFIG.menunggu_konfirmasi;
  const pricing = getPricing(consultation, currentUser);
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const isUpdating = updatingId === consultation.id;
  const isPending = consultation.status === 'menunggu_konfirmasi' || consultation.status === 'pending';
  const isConfirmed = consultation.status === 'dikonfirmasi' || consultation.status === 'confirmed';

  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden hover:shadow-md transition-all duration-200">
      {/* Card header */}
      <div className="flex items-start justify-between gap-4 p-5 pb-4">
        {/* Avatar + client info */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm"
            style={{ backgroundColor: svc.bg, color: svc.fg }}
          >
            {(consultation.client_name || 'K').charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-[#1F2A22] truncate">{consultation.client_name}</p>
            <p className="text-xs text-[#5B6660] truncate">{consultation.client_email}</p>
            {consultation.client_phone && (
              <p className="text-[11px] text-[#5B6660]/80 truncate">{consultation.client_phone}</p>
            )}
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 shrink-0">
          <Badge bg={svc.bg} fg={svc.fg} icon={svc.icon} label={svc.label} />
          {consultation.payment_status === 'paid' ? (
            <Badge bg="#DCFCE7" fg="#166534" icon="verified" label="Lunas" />
          ) : consultation.payment_status === 'menunggu_verifikasi' ? (
            <Badge bg="#DBEAFE" fg="#1E40AF" icon="hourglass_top" label="Verifikasi Bayar" />
          ) : (
            <Badge bg="#FFF4D6" fg="#7A5900" icon="pending" label="Belum Lunas" />
          )}
          <Badge bg={status.bg} fg={status.fg} icon={status.icon} label={status.label} />
        </div>
      </div>

      {/* Message / Topik */}
      <div className="mx-5 mb-4 bg-[#F5F4EF] rounded-xl px-4 py-3">
        <p className="text-xs font-bold text-[#5B6660] uppercase tracking-wider mb-1">Topik Konsultasi</p>
        <p className="text-sm text-[#414844] italic leading-relaxed">
          "{consultation.topic || consultation.message || 'Tidak ada keterangan topik'}"
        </p>
      </div>

      {/* Earnings strip */}
      <div className="mx-4 sm:mx-5 mb-3 sm:mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
        <div className="bg-[#F0FDF4] rounded-xl px-3 py-2 text-center flex sm:flex-col items-center justify-between sm:justify-center">
          <p className="text-[10px] text-[#5B6660] uppercase font-bold tracking-wide">Total Bayar</p>
          <p className="text-sm font-bold text-[#15803D]">{rupiah(pricing.amount)}</p>
        </div>
        <div className="bg-[#FEF2F2] rounded-xl px-3 py-2 text-center flex sm:flex-col items-center justify-between sm:justify-center">
          <p className="text-[10px] text-[#5B6660] uppercase font-bold tracking-wide">Biaya Platform ({pricing.commissionPercent}%)</p>
          <p className="text-sm font-bold text-[#B91C1C]">−{rupiah(pricing.adminCommission)}</p>
        </div>
        <div className="rounded-xl px-3 py-2 text-center flex sm:flex-col items-center justify-between sm:justify-center" style={{ backgroundColor: `${BRAND_BROWN}15` }}>
          <p className="text-[10px] text-[#5B6660] uppercase font-bold tracking-wide">Pendapatan ({pricing.earningPercent}%)</p>
          <p className="text-sm font-bold" style={{ color: BRAND_BROWN }}>{rupiah(pricing.expertEarning)}</p>
        </div>
      </div>

      {/* Jadwal */}
      <div className="mx-5 mb-4 flex items-center gap-2 text-xs text-[#5B6660]">
        <span className="material-symbols-outlined text-[16px]">calendar_month</span>
        <span className="font-medium">{getScheduleDisplay(consultation)}</span>
      </div>

      {/* Zoom meeting card (if has link or is zoom session) */}
      {consultation.zoom_link ? (
        <div className="mx-5 mb-4 rounded-xl p-3.5 bg-[#F0F9FF] border border-[#BAE6FD] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-[20px] text-[#0284C7]">videocam</span>
              <span className="text-xs font-bold text-[#0C4A6E]">
                Ruang Zoom Resmi (Durasi: {consultation.duration_minutes || 30} Menit)
              </span>
            </div>
            {(consultation.zoom_meeting_id || consultation.zoom_passcode) && (
              <p className="text-[11px] text-[#0369A1] font-mono">
                {consultation.zoom_meeting_id ? `ID: ${consultation.zoom_meeting_id} ` : ''}
                {consultation.zoom_passcode ? `| Passcode: ${consultation.zoom_passcode}` : ''}
              </p>
            )}
          </div>
          <a
            href={consultation.zoom_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#0284C7] hover:bg-[#0369A1] text-white text-xs font-bold rounded-xl shadow-sm shrink-0 transition-all"
          >
            <span className="material-symbols-outlined text-sm">videocam</span>
            Masuk Ruang Zoom ({consultation.duration_minutes || 30} Menit)
          </a>
        </div>
      ) : (
        consultation.service_type === 'zoom' && (
          <div className="mx-5 mb-4 rounded-xl p-3 bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-800">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="material-symbols-outlined text-[18px]">schedule</span>
              Link Zoom sedang disiapkan oleh Admin ({consultation.duration_minutes || 30} Menit).
            </span>
          </div>
        )
      )}

      {/* Footer actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 px-4 sm:px-5 py-3 border-t border-black/5 bg-[#FAFBF9]">
        <span className="text-[11px] text-[#5B6660]">Diterima {formatCreated(consultation.created_at)}</span>

        <div className="flex gap-2 items-center flex-wrap justify-end">
          {/* Chat in-app button */}
          <button
            onClick={() => navigate(`/chat-konsultasi?id=${consultation.id}`)}
            className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm hover:opacity-90"
            style={{ backgroundColor: BRAND_BROWN }}
            title="Buka Chat Obrolan"
          >
            <span className="material-symbols-outlined text-[14px]">chat</span>
            Diskusi / Chat
          </button>

          {/* Toggle detail */}
          <button
            onClick={() => setOpen(!open)}
            className="px-3 py-1.5 text-xs font-bold text-[#5B6660] border border-black/10 rounded-lg hover:bg-black/5 transition-colors"
          >
            {open ? 'Tutup' : 'Detail'}
          </button>

          {/* Action buttons for Menunggu Konfirmasi */}
          {isPending && (
            <>
              <button
                disabled={isUpdating}
                onClick={() => onUpdateStatus(consultation.id, 'dikonfirmasi')}
                className="px-3.5 py-1.5 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                {isUpdating ? (
                  <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[14px]">check</span>
                )}
                Terima
              </button>
              <button
                disabled={isUpdating}
                onClick={() => onUpdateStatus(consultation.id, 'dibatalkan')}
                className="px-3.5 py-1.5 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[14px]">close</span>
                Tolak
              </button>
            </>
          )}

          {/* Action buttons for Dikonfirmasi */}
          {isConfirmed && (
            <>
              {consultation.service_type === 'chat' && (
                <button
                  onClick={() => navigate(`/chat/${consultation.id}`)}
                  className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm hover:opacity-90"
                  style={{ backgroundColor: BRAND_BROWN }}
                >
                  <span className="material-symbols-outlined text-[14px]">chat</span>
                  Mulai Chat
                </button>
              )}

              <button
                disabled={isUpdating}
                onClick={() => onUpdateStatus(consultation.id, 'selesai')}
                className="px-3 py-1.5 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1 shadow-sm disabled:opacity-50"
                style={{ backgroundColor: BRAND_GREEN }}
              >
                {isUpdating ? (
                  <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                ) : (
                  <span className="material-symbols-outlined text-[14px]">task_alt</span>
                )}
                Selesaikan
              </button>

              <button
                disabled={isUpdating}
                onClick={() => onUpdateStatus(consultation.id, 'dibatalkan')}
                className="px-3 py-1.5 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
              >
                Batalkan
              </button>
            </>
          )}
        </div>
      </div>

      {/* Expanded detail panel */}
      {open && (
        <div className="px-5 pb-5 pt-3 border-t border-black/5 space-y-2.5 text-xs text-[#414844] bg-[#FDFDFD]">
          <p><span className="font-bold text-[#5B6660] uppercase tracking-wide">ID Konsultasi:</span> #{consultation.id}</p>
          <p><span className="font-bold text-[#5B6660] uppercase tracking-wide">Nama Klien:</span> {consultation.client_name}</p>
          <p><span className="font-bold text-[#5B6660] uppercase tracking-wide">Email:</span> {consultation.client_email}</p>
          {consultation.client_phone && (
            <p><span className="font-bold text-[#5B6660] uppercase tracking-wide">WhatsApp / Telp:</span> {consultation.client_phone}</p>
          )}
          {consultation.requester_role && (
            <p><span className="font-bold text-[#5B6660] uppercase tracking-wide">Role Pemohon:</span> {consultation.requester_role}</p>
          )}
          <p><span className="font-bold text-[#5B6660] uppercase tracking-wide">Topik Lengkap:</span> {consultation.topic || consultation.message || '-'}</p>
          {consultation.notes && (
            <p><span className="font-bold text-[#5B6660] uppercase tracking-wide">Catatan Tambahan:</span> {consultation.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function KelolaKonsultasi() {
  const { t } = useTranslation();
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading]             = useState(true);
  const [error, setError]                 = useState(null);
  const [updatingId, setUpdatingId]       = useState(null);
  const [notification, setNotification]   = useState(null);
  const [filterStatus,  setFilterStatus]  = useState('all');
  const [filterService, setFilterService] = useState('all');
  const [currentUser]                     = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('amdal_user') || '{}');
    } catch {
      return {};
    }
  });

  const fetchConsultations = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/my/expert-consultations');
      const items = Array.isArray(res.data?.data?.data)
        ? res.data.data.data
        : Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];
      setConsultations(items);
    } catch (err) {
      console.error('Failed to load expert consultations:', err);
      setError(err.response?.data?.message || 'Gagal memuat data konsultasi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultations();
  }, []);

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      const res = await api.patch(`/my/expert-consultations/${id}/status`, { status: newStatus });
      const updated = res.data?.data;
      setConsultations(prev =>
        prev.map(c => (c.id === id ? { ...c, ...updated, status: newStatus } : c))
      );
      setNotification({
        type: 'success',
        text: res.data?.message || 'Status konsultasi berhasil diperbarui.',
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err) {
      console.error('Failed to update consultation status:', err);
      setNotification({
        type: 'error',
        text: err.response?.data?.message || 'Gagal memperbarui status konsultasi.',
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = consultations.filter(c => {
    if (filterStatus !== 'all') {
      const isStatusMatch = c.status === filterStatus ||
        (filterStatus === 'menunggu_konfirmasi' && c.status === 'pending') ||
        (filterStatus === 'dikonfirmasi' && c.status === 'confirmed') ||
        (filterStatus === 'selesai' && c.status === 'completed') ||
        (filterStatus === 'dibatalkan' && c.status === 'cancelled');
      if (!isStatusMatch) return false;
    }
    if (filterService !== 'all' && c.service_type !== filterService) {
      return false;
    }
    return true;
  });

  const stats = {
    total: consultations.length,
    pending: consultations.filter(c => c.status === 'menunggu_konfirmasi' || c.status === 'pending').length,
    confirmed: consultations.filter(c => c.status === 'dikonfirmasi' || c.status === 'confirmed').length,
    completed: consultations.filter(c => c.status === 'selesai' || c.status === 'completed').length,
    earning: consultations
      .filter(c => c.status === 'selesai' || c.status === 'completed')
      .reduce((s, c) => s + getPricing(c, currentUser).expertEarning, 0),
  };

  const INPUT_CLS = 'bg-white border border-black/10 rounded-xl px-3 py-2 text-sm text-[#1F2A22] focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors';

  if (loading && consultations.length === 0) {
    return (
      <DashboardLayout
        title="Kelola Konsultasi"
        subtitle="Pantau dan kelola permintaan konsultasi dari klien Anda"
      >
        <SkeletonKonsultasi />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Kelola Konsultasi"
      subtitle="Pantau dan kelola permintaan konsultasi dari klien Anda"
    >
      {/* ── Notification Banner ───────────────────────────────── */}
      {notification && (
        <div
          className={`mb-6 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-sm border transition-all ${
            notification.type === 'success'
              ? 'bg-[#F0FDF4] border-green-200 text-[#15803D]'
              : 'bg-[#FEF2F2] border-red-200 text-[#B91C1C]'
          }`}
        >
          <div className="flex items-center gap-2 text-sm font-semibold">
            <span className="material-symbols-outlined text-[20px]">
              {notification.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="p-1 hover:bg-black/5 rounded-lg transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      {/* ── Stats ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
        <StatCard icon="psychology"             label="Total"        value={stats.total}              toneColor="#1D4ED8" toneBg="#EFF6FF" />
        <StatCard icon="schedule"               label="Menunggu"     value={stats.pending}            toneColor="#B45309" toneBg="#FFFBEB" />
        <StatCard icon="task_alt"               label="Selesai"      value={stats.completed}          toneColor={BRAND_GREEN} toneBg="#F0FDF4" />
        <StatCard icon="account_balance_wallet" label="Pendapatan"   value={rupiah(stats.earning)}    toneColor={BRAND_BROWN} toneBg={`${BRAND_BROWN}15`} />
      </div>

      {/* ── Filters & Refresh ─────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-5 mb-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-[#5B6660] uppercase tracking-widest">Filter</p>
          <button
            onClick={fetchConsultations}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs font-bold text-[#5B6660] hover:text-[#1F2A22] transition-colors"
          >
            <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
              refresh
            </span>
            Segarkan
          </button>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#5B6660] uppercase tracking-wide">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={INPUT_CLS}>
              <option value="all">Semua Status</option>
              <option value="menunggu_konfirmasi">Menunggu Konfirmasi</option>
              <option value="dikonfirmasi">Dikonfirmasi</option>
              <option value="selesai">Selesai</option>
              <option value="dibatalkan">Dibatalkan</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold text-[#5B6660] uppercase tracking-wide">Layanan</label>
            <select value={filterService} onChange={e => setFilterService(e.target.value)} className={INPUT_CLS}>
              <option value="all">Semua Layanan</option>
              {Object.entries(SERVICE_CONFIG).map(([key, s]) => (
                <option key={key} value={key}>{s.label}</option>
              ))}
            </select>
          </div>
          {(filterStatus !== 'all' || filterService !== 'all') && (
            <div className="flex items-end">
              <button
                onClick={() => { setFilterStatus('all'); setFilterService('all'); }}
                className="px-3 py-2 text-xs font-bold text-[#B91C1C] border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── List / States ─────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-2xl border border-black/5 p-5 space-y-4">
              <div className="flex justify-between items-center">
                <div className="h-5 w-40 bg-gray-200 rounded"></div>
                <div className="h-6 w-24 bg-gray-200 rounded-full"></div>
              </div>
              <div className="h-4 w-64 bg-gray-200 rounded"></div>
              <div className="h-10 w-full bg-gray-100 rounded-xl"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-10 text-center">
          <span className="material-symbols-outlined text-[48px] text-red-400 mb-2 block">error_outline</span>
          <h3 className="text-base font-bold text-[#1F2A22] mb-1">Gagal Memuat Data</h3>
          <p className="text-sm text-[#5B6660] mb-4">{error}</p>
          <button
            onClick={fetchConsultations}
            className="px-4 py-2 text-xs font-bold text-white rounded-xl shadow-sm transition-opacity hover:opacity-90"
            style={{ backgroundColor: BRAND_BROWN }}
          >
            Coba Lagi
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-14 text-center">
          <span className="material-symbols-outlined text-[48px] text-[#5B6660]/30 mb-3 block">psychology</span>
          <h3 className="text-base font-bold text-[#1F2A22] mb-1">
            {filterStatus !== 'all' || filterService !== 'all' ? 'Tidak Ada Hasil' : 'Belum Ada Permintaan Konsultasi'}
          </h3>
          <p className="text-sm text-[#5B6660]">
            {filterStatus !== 'all' || filterService !== 'all'
              ? 'Coba ubah atau reset filter di atas.'
              : 'Permintaan konsultasi dari klien akan tampil di sini begitu diajukan.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(c => (
            <ConsultationCard
              key={c.id}
              consultation={c}
              currentUser={currentUser}
              onUpdateStatus={handleUpdateStatus}
              updatingId={updatingId}
            />
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}

