import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import coinImg from '../assets/coin.png';
import { getCallingName } from '../utils/formatters.js';

// ── Mini Activity Chart (Pure SVG) ──────────────────────────────────────────
function MiniActivityChart({ data, label, color = '#8B4513' }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map(d => d.value), 1);
  const w = 280;
  const h = 80;
  const padding = 4;
  const barW = (w - padding * 2) / data.length - 2;

  return (
    <div className="w-full">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</p>
      <svg viewBox={`0 0 ${w} ${h + 20}`} className="w-full" preserveAspectRatio="xMidYMid meet">
        {data.map((item, i) => {
          const barH = Math.max((item.value / max) * (h - 8), 2);
          const x = padding + i * ((w - padding * 2) / data.length);
          return (
            <g key={i}>
              <rect
                x={x}
                y={h - barH}
                width={barW}
                height={barH}
                fill={color}
                rx="3"
                opacity={0.7 + (item.value / max) * 0.3}
              />
              {item.value > 0 && (
                <text x={x + barW / 2} y={h - barH - 3} textAnchor="middle" className="text-[8px] font-bold" fill={color}>
                  {item.value}
                </text>
              )}
              <text x={x + barW / 2} y={h + 14} textAnchor="middle" className="text-[8px]" fill="#9ca3af">
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
import DashboardLayout from '../components/DashboardLayout.jsx';
import DashboardAnalyticsCharts from '../components/DashboardAnalyticsCharts.jsx';
import MedalProgressionWidget from '../components/MedalProgressionWidget.jsx';
import { SkeletonDashboardExpert } from '../components/Skeleton.jsx';

function formatPoints(n) {
  return new Intl.NumberFormat('id-ID').format(n ?? 0);
}

// ---------------------------------------------------------------------------
// Design tokens — satu sumber warna & nuansa untuk seluruh halaman.
// ---------------------------------------------------------------------------
const TONE = {
  neutral: { fg: '#5B6660', bg: '#F5F4F0', dot: '#5B6660' },
  info: { fg: '#8B4513', bg: '#F4E8D0', dot: '#8B4513', border: '#D2B48C', text: '#654321', textSoft: '#A0522D' },
  success: { fg: '#3D3927', bg: '#EAE8DE', dot: '#3D3927', border: '#3D392733', text: '#242113', textSoft: '#3D3927' },
  warning: { fg: '#7A5900', bg: '#FFF4D6', dot: '#7A5900', border: '#FCD34D', text: '#5C4A00', textSoft: '#5C4A00' },
  danger: { fg: '#B3261E', bg: '#FFDAD6', dot: '#B3261E', border: '#FFB4AB', text: '#93000A', textSoft: '#410002' },
  amber: { fg: '#D97706', bg: '#FFF4E6', dot: '#D97706', border: '#FCD34D', text: '#92400E', textSoft: '#92400E' },
};

const BRAND_PRIMARY = '#8B4513';
const BRAND_PRIMARY_DARK = '#654321';
const BRAND_GREEN = '#3D3927';

// ---------------------------------------------------------------------------
// Sub-komponen presentasional — dipakai berulang di bawah supaya konsisten.
// ---------------------------------------------------------------------------

function StatCard({ icon, tone, label, value, dot, desc, extra }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-6 flex items-start gap-3.5 sm:gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="p-2.5 sm:p-3 rounded-xl shrink-0" style={{ backgroundColor: tone.bg, color: tone.fg }}>
        <span className="material-symbols-outlined text-[24px] sm:text-[28px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-[11px] text-on-surface-variant uppercase tracking-wider font-bold mb-1">{label}</p>
        <div className="flex items-center gap-1.5 sm:gap-2 mb-1 flex-wrap">
          {dot && <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: dot }} />}
          <p className="font-bold text-on-background text-sm truncate">{value}</p>
        </div>
        {extra}
        {desc && <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>}
      </div>
    </div>
  );
}

function AlertBanner({ tone, icon, elevated, title, badge, children, action, secondaryAction }) {
  return (
    <div
      className="rounded-2xl p-4 sm:p-6 border animate-fadeIn"
      style={{ backgroundColor: tone.bg, borderColor: tone.border }}
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          <div
            className="rounded-xl shrink-0 flex items-center justify-center"
            style={elevated
              ? { backgroundColor: 'rgba(255,255,255,0.8)', padding: '8px sm:10px' }
              : { backgroundColor: `${tone.fg}1A`, padding: '8px sm:10px' }}
          >
            <span
              className="material-symbols-outlined text-[24px] sm:text-[28px]"
              style={{ color: tone.fg }}
            >
              {icon}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="font-bold text-sm sm:text-base mb-1.5 flex items-center gap-2 flex-wrap"
              style={{ color: tone.text }}
            >
              {title}
              {badge && (
                <span className="text-[10px] sm:text-xs font-bold text-white px-2 py-0.5 rounded-full" style={{ backgroundColor: tone.fg }}>
                  {badge}
                </span>
              )}
            </h3>
            <div className="text-xs sm:text-sm leading-relaxed" style={{ color: tone.textSoft }}>
              {children}
            </div>
          </div>
        </div>
        {(action || secondaryAction) && (
          <div className="flex flex-wrap gap-2.5 sm:gap-3 w-full md:w-auto shrink-0 mt-1 md:mt-0">
            {secondaryAction}
            {action}
          </div>
        )}
      </div>
    </div>
  );
}

function ActionButton({ icon, children, onClick, tone = BRAND_PRIMARY, toneDark = BRAND_PRIMARY_DARK, pill = true, elevated = true, as: Comp = 'button', to }) {
  const commonProps = {
    className: `text-white text-xs sm:text-sm font-bold px-5 sm:px-6 py-2.5 sm:py-3 ${pill ? 'rounded-full' : 'rounded-xl'} transition-all flex items-center justify-center gap-2 w-full sm:w-auto shrink-0 hover:brightness-[0.92] ${elevated ? 'shadow-md hover:shadow-lg' : ''}`,
    style: { backgroundColor: tone },
  };
  const content = (
    <>
      <span className="material-symbols-outlined text-[16px] sm:text-[18px]">{icon}</span>
      <span>{children}</span>
    </>
  );
  if (Comp === Link) {
    return <Link to={to} {...commonProps}>{content}</Link>;
  }
  return <button type="button" onClick={onClick} {...commonProps}>{content}</button>;
}

function QuickAction({ to, icon, label }) {
  return (
    <Link
      to={to}
      className="flex flex-col items-center gap-2.5 p-4 rounded-xl border border-outline-variant/30 hover:border-[#3D3927] hover:bg-[#3D3927]/5 hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <span className="material-symbols-outlined text-[26px] text-[#3D3927] group-hover:scale-110 transition-transform">{icon}</span>
      <span className="text-xs font-semibold text-center text-on-surface-variant group-hover:text-[#3D3927]">{label}</span>
    </Link>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [expert, setExpert] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [pointBalance, setPointBalance] = useState(0);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [consultStats, setConsultStats] = useState({ total: 0, aktif: 0, selesai: 0, rating: 0 });

  useEffect(() => {
    try {
      const raw = localStorage.getItem('amdal_user');
      if (raw) {
        const u = JSON.parse(raw);
        if (u.role === 'admin') { navigate('/admin', { replace: true }); return; }
        if (u.role_type === 'surveyor') { navigate('/dashboard-surveyor', { replace: true }); return; }
        if (u.role_type === 'klien' || u.role_type === 'client' || u.role === 'klien' || u.role === 'client' || (u.role !== 'admin' && u.role_type !== 'tenaga_ahli' && u.role_type !== 'tenaga_teknis')) {
          navigate('/akun', { replace: true });
          return;
        }
      }
    } catch {}

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        const [profileRes, ordersRes, topupRes, productsRes, consultRes] = await Promise.all([
          api.get('/my/profile').catch(() => ({ data: null })),
          api.get('/orders/history').catch(() => ({ data: [] })),
          api.get('/topup/history?per_page=1').catch(() => ({ data: null })),
          api.get('/my/products').catch(() => ({ data: [] })),
          api.get('/my/expert-consultations').catch(() => null),
        ]);

        if (profileRes.data) {
          setExpert(profileRes.data);
        } else {
          setError(t('dashboard.error_load_profile', 'Gagal memuat data profil.'));
        }

        const ordersData = Array.isArray(ordersRes.data) ? ordersRes.data : (ordersRes.data?.data || []);
        setOrders(ordersData);

        // Ambil saldo point_balance dari endpoint topup
        if (topupRes.data?.summary?.point_balance !== undefined) {
          setPointBalance(topupRes.data.summary.point_balance);
        }

        // Set products
        const productsData = Array.isArray(productsRes.data) ? productsRes.data : [];
        setProducts(productsData);

        // Set consultation data & stats
        const cConsults = consultRes?.data?.consultations || [];
        setConsultations(Array.isArray(cConsults) ? cConsults : []);

        const cStats = consultRes?.data?.stats;
        if (cStats) {
          setConsultStats({
            total: cStats.total ?? 0,
            aktif: (cStats.menunggu_konfirmasi ?? 0) + (cStats.dikonfirmasi ?? 0),
            selesai: cStats.selesai ?? 0,
            rating: profileRes.data?.rating ?? 0,
          });
        }
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError(t('dashboard.error_load_dashboard', 'Gagal memuat data dashboard.'));
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [t]);

  const name = expert?.name || t('dashboard.default_user', 'Pengguna');
  const profileStatus = expert?.profile_status || 'draft';
  const rejectReason = expert?.reject_reason;

  // Status definitions
  const isApproved = profileStatus === 'aktif';
  const isRejected = profileStatus === 'ditolak';
  const isPending = profileStatus === 'menunggu_verifikasi';
  const isDraft = profileStatus === 'draft';

  // Profile completeness check
  const hasBasicInfo = expert?.name && expert?.phone && expert?.institution && expert?.field;
  const hasEducation = expert?.educations && expert?.educations.length > 0;
  const hasPhoto = !!expert?.photo;
  const profileCompleteness = [hasBasicInfo, hasEducation, hasPhoto].filter(Boolean).length;
  const isProfileComplete = profileCompleteness >= 2; // Minimum: basic info + at least one more

  const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'menunggu_pembayaran');
  const hasPendingPayment = pendingOrders.length > 0;

  // Package & publication status
  const hasPackage = !!expert?.package_id || isApproved;
  const packageName = expert?.package?.name || (isApproved ? t('dashboard.package.free', 'Free') : t('dashboard.not_selected', 'Belum Dipilih'));
  const isFreePackage = !expert?.package_id || (expert?.package?.price === 0) || (packageName === t('dashboard.package.free', 'Free'));

  // Dokumen check (is submission sent?)
  const hasPaidPackage = hasPackage && !hasPendingPayment;
  const needsDocumentUpload = hasPaidPackage && isDraft;

  const isPublished = isApproved && hasPackage;

  // ---- Derived display data for the status cards ----
  const accountStatusTone = isApproved ? TONE.success : isRejected ? TONE.danger : isPending ? TONE.warning : TONE.neutral;
  const accountStatusIcon = isApproved ? 'check_circle' : isRejected ? 'cancel' : isPending ? 'hourglass_top' : 'edit_note';
  const accountStatusLabel = isApproved ? t('dashboard.status.approved', 'Disetujui') : isRejected ? t('dashboard.status.rejected', 'Ditolak') : isPending ? t('dashboard.status.pending', 'Menunggu Verifikasi') : t('dashboard.status.draft', 'Draf');
  const accountStatusDesc = isApproved
    ? t('dashboard.status.approved_desc', 'Akun telah diverifikasi admin')
    : isRejected
    ? t('dashboard.status.rejected_desc', 'Perlu perbaikan data')
    : isPending
    ? t('dashboard.status.pending_desc', 'Sedang ditinjau admin')
    : needsDocumentUpload
    ? t('dashboard.status.need_upload_desc', 'Perlu upload dokumen')
    : hasPendingPayment
    ? t('dashboard.status.pending_payment_desc', 'Menunggu pembayaran')
    : t('dashboard.status.complete_profile_desc', 'Lengkapi profil Anda');

  const welcomeTitle = t('dashboard.welcome', 'Halo, {name}!').replace('{name}', getCallingName(name));

  // Loading state
  if (loading) {
    return (
      <DashboardLayout
        title={t('dashboard.title', 'Dashboard')}
        subtitle={expert?.role_label === 'Tenaga Teknis' ? t('dashboard.subtitle_teknis', 'Kelola profil tenaga teknis Anda dan pantau status publikasi.') : t('dashboard.subtitle', 'Kelola profil tenaga ahli Anda dan pantau status publikasi.')}
      >
        <SkeletonDashboardExpert />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={welcomeTitle}
      subtitle={expert?.role_label === 'Tenaga Teknis' ? t('dashboard.subtitle_teknis', 'Kelola profil tenaga teknis Anda dan pantau status publikasi.') : t('dashboard.subtitle', 'Kelola profil tenaga ahli Anda dan pantau status publikasi.')}
    >
      {error && (
        <div className="bg-error-container text-on-error-container text-sm rounded-xl p-4 mb-6 flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] mt-0.5 shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      <div className="flex flex-col gap-6 animate-fadeIn">

        {/* SALDO POINT -------------------------------------------------- */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg text-white" style={{ background: `linear-gradient(135deg, ${BRAND_PRIMARY}, ${BRAND_PRIMARY_DARK})` }}>
          {/* dekorasi lingkaran */}
          <div className="absolute -right-10 -top-16 w-56 h-56 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -right-6 bottom-0 w-32 h-32 rounded-full bg-white/10 pointer-events-none" />

          <div className="relative p-4 sm:p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs sm:text-sm opacity-90 mb-1">Saldo Point Anda</p>
                <div className="flex items-end gap-2">
                  <p className="text-3xl sm:text-4xl font-black tracking-tight">{formatPoints(pointBalance)}</p>
                  <p className="text-base sm:text-lg opacity-80 mb-0.5">Point</p>
                </div>
              </div>
              <div className="relative group/coin shrink-0 cursor-pointer select-none">
                {/* Aura Golden Glow di Belakang Koin */}
                <div className="absolute inset-0 rounded-2xl bg-amber-400/30 blur-md animate-coin-aura pointer-events-none" />

                {/* Box Container Koin dengan Efek Glassmorphism & Shimmer */}
                <div className="relative bg-white/20 hover:bg-white/30 p-2 sm:p-2.5 rounded-2xl backdrop-blur-sm flex items-center justify-center shadow-inner border border-white/25 overflow-hidden transition-all duration-300 group-hover/coin:scale-105">
                  {/* Kilau Cahaya (Shine Sweep) melintas di atas koin */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                    <div className="w-1/2 h-[200%] -top-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-coin-shine" />
                  </div>

                  {/* Gambar Koin Emas dengan Animasi Float & Golden Glow */}
                  <img
                    src={coinImg}
                    alt="Coin"
                    className="w-12 h-12 sm:w-14 sm:h-14 object-contain animate-coin-float transition-transform duration-300 group-hover/coin:scale-110"
                  />
                </div>
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="flex flex-wrap gap-2.5">
              <Link
                to="/top-up"
                className="flex items-center gap-2 bg-white text-[#8B4513] font-bold text-sm px-4 py-2 rounded-xl hover:bg-white/95 transition-colors shadow"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Top Up Point
              </Link>
              <Link
                to="/riwayat-point"
                className="flex items-center gap-2 bg-white/20 text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-white/30 transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                Riwayat Point
              </Link>
            </div>

            {/* Gunakan Point untuk: */}
            <div className="mt-4 pt-4 border-t border-white/20 grid grid-cols-2 gap-2">
              <Link
                to="/daftar-profil"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-3 py-2.5"
              >
                <span className="material-symbols-outlined text-[20px]">shopping_bag</span>
                <div>
                  <p className="text-xs font-bold leading-tight">Beli Produk</p>
                  <p className="text-[10px] opacity-75">Dari Tenaga Ahli Lain</p>
                </div>
              </Link>
              <Link
                to="/daftar-profil"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 transition-colors rounded-xl px-3 py-2.5"
              >
                <span className="material-symbols-outlined text-[20px]">forum</span>
                <div>
                  <p className="text-xs font-bold leading-tight">Konsultasi</p>
                  <p className="text-[10px] opacity-75">Dengan Tenaga Ahli Lain</p>
                </div>
              </Link>
            </div>
          </div>
        </div>

        {/* STATUS CARDS ------------------------------------------------- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <StatCard
            icon={accountStatusIcon}
            tone={accountStatusTone}
            dot={accountStatusTone.dot}
            label={t('dashboard.account_status', 'Status Akun')}
            value={accountStatusLabel}
            desc={accountStatusDesc}
          />

          <StatCard
            icon="public"
            tone={isPublished ? TONE.info : TONE.neutral}
            dot={isPublished ? BRAND_PRIMARY : TONE.danger.dot}
            label={t('dashboard.publication_status', 'Status Publikasi')}
            value={isPublished ? t('dashboard.published_live', 'Tayang Publik') : t('dashboard.not_published', 'Belum Tayang')}
            desc={isPublished ? t('dashboard.published_desc', 'Profil tampil di direktori') : t('dashboard.not_published_desc', 'Aktifkan akun & pilih paket')}
          />

          <StatCard
            icon="workspace_premium"
            tone={hasPackage ? TONE.amber : TONE.neutral}
            label={t('dashboard.active_package', 'Paket Aktif')}
            value={packageName}
            extra={hasPackage && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide bg-[#EAE8DE] text-[#3D3927] px-2 py-0.5 rounded-full mb-1.5">
                <span className="material-symbols-outlined text-[11px]">check_circle</span>
                {t('dashboard.your_current_package', 'Paket Anda Saat Ini')}
              </span>
            )}
            desc={
              hasPackage && isFreePackage ? (
                <Link to="/paket" className="text-xs text-[#8B4513] font-bold hover:underline inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                  {t('dashboard.upgrade_package', 'Upgrade Paket')}
                </Link>
              ) : hasPackage ? (
                <span className="text-xs text-on-surface-variant">{t('dashboard.active_subscription', 'Langganan aktif')}</span>
              ) : (
                <Link to="/paket" className="text-xs text-[#8B4513] font-bold hover:underline inline-flex items-center gap-1">
                  {t('dashboard.choose_package', 'Pilih Paket')} <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              )
            }
          />
        </div>

        {/* ALERT BANNERS -------------------------------------------------- */}

        {/* DITOLAK — Perlu Perbaikan */}
        {isRejected && (
          <AlertBanner
            tone={TONE.danger}
            icon="error"
            title={t('dashboard.rejected_title', 'Data Pendaftaran Perlu Diperbaiki')}
          >
            <div className="bg-white/50 rounded-xl p-4 mb-4 border" style={{ borderColor: `${TONE.danger.fg}33` }}>
              <p className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: TONE.danger.text }}>
                {t('dashboard.admin_note', 'Catatan dari Admin:')}
              </p>
              <p className="text-sm leading-relaxed font-medium" style={{ color: TONE.danger.textSoft }}>
                {rejectReason || t('dashboard.rejected_desc', 'Data atau dokumen yang diunggah belum memenuhi syarat. Harap periksa kembali.')}
              </p>
            </div>
            <ActionButton icon="edit" onClick={() => navigate('/profil-saya')} tone={TONE.danger.fg} toneDark={TONE.danger.text} pill={false}>
              {t('dashboard.fix_profile', 'Perbaiki Profil Sekarang')}
            </ActionButton>
          </AlertBanner>
        )}

        {/* MENUNGGU VERIFIKASI */}
        {isPending && (
          <AlertBanner tone={TONE.warning} icon="schedule" title={t('dashboard.pending_title', 'Menunggu Verifikasi Admin')}>
            <p
              className="mb-3"
              dangerouslySetInnerHTML={{ __html: t('dashboard.pending_verification_message', 'Terima kasih telah mendaftar! Data Anda sedang dalam proses verifikasi oleh tim kami. Harap bersabar, proses ini biasanya <strong>memakan waktu 1-3 hari kerja</strong>.') }}
            />
            <div className="flex items-center gap-2 text-xs">
              <span className="material-symbols-outlined text-[16px]">info</span>
              <span>{t('dashboard.check_email', 'Pastikan Anda memeriksa email secara berkala (termasuk folder spam).')}</span>
            </div>
          </AlertBanner>
        )}

        {/* DRAFT — Lengkapi Profil */}
        {!isProfileComplete && !hasPendingPayment && !needsDocumentUpload && (
          <AlertBanner
            tone={TONE.info}
            icon="edit_note"
            title={t('dashboard.complete_profile_title', 'Lengkapi Profil Anda')}
            action={
              <ActionButton icon="arrow_forward" onClick={() => navigate('/profil-saya')}>
                {t('dashboard.complete_now', 'Lengkapi Sekarang')}
              </ActionButton>
            }
          >
            <p className="mb-3" dangerouslySetInnerHTML={{ __html: t('dashboard.complete_profile_desc', { completeness: profileCompleteness }) }} />
            <div className="flex flex-wrap gap-2">
              {!hasBasicInfo && <span className="text-xs bg-white/60 px-2.5 py-1 rounded-full border" style={{ borderColor: `${BRAND_PRIMARY}4D`, color: TONE.info.text }}>{t('dashboard.req_basic_info', 'Data Pribadi')}</span>}
              {!hasEducation && <span className="text-xs bg-white/60 px-2.5 py-1 rounded-full border" style={{ borderColor: `${BRAND_PRIMARY}4D`, color: TONE.info.text }}>{t('dashboard.req_education', 'Pendidikan')}</span>}
              {!hasPhoto && <span className="text-xs bg-white/60 px-2.5 py-1 rounded-full border" style={{ borderColor: `${BRAND_PRIMARY}4D`, color: TONE.info.text }}>{t('dashboard.req_photo', 'Foto Profil')}</span>}
            </div>
          </AlertBanner>
        )}

        {/* PROFIL LENGKAP TAPI BELUM PILIH PAKET */}
        {isProfileComplete && !hasPackage && !hasPendingPayment && (
          <AlertBanner
            tone={TONE.info}
            icon="workspace_premium"
            elevated
            title={t('dashboard.choose_package_title', 'Pilih Paket Keanggotaan')}
            action={
              <ActionButton icon="arrow_forward" onClick={() => navigate('/paket')}>
                {t('dashboard.choose_package_btn', 'Pilih Paket')}
              </ActionButton>
            }
          >
            {t('dashboard.choose_package_desc', 'Profil Anda sudah lengkap! Langkah selanjutnya adalah memilih paket keanggotaan (Free atau Premium) agar Anda dapat mengunggah dokumen dan diverifikasi oleh admin.')}
          </AlertBanner>
        )}

        {/* ADA INVOICE PENDING */}
        {hasPendingPayment && (
          <AlertBanner
            tone={TONE.amber}
            icon="receipt_long"
            title={t('dashboard.pending_payment_title', 'Segera Lunasi Pembayaran Anda')}
            action={
              <ActionButton icon="payment" onClick={() => navigate(`/invoice/${pendingOrders[0].id || pendingOrders[0].reference_code}`)} tone={TONE.amber.fg} toneDark={TONE.amber.text}>
                {t('dashboard.pay_now', 'Bayar Sekarang')}
              </ActionButton>
            }
          >
            {t('dashboard.pending_payment_desc', 'Anda memiliki tagihan paket yang belum dibayar. Selesaikan pembayaran sekarang agar Anda dapat melanjutkan ke tahap verifikasi.')}
          </AlertBanner>
        )}

        {/* SUDAH LUNAS TAPI BELUM UPLOAD DOKUMEN */}
        {needsDocumentUpload && (
          <AlertBanner
            tone={TONE.info}
            icon="upload_file"
            title={t('dashboard.upload_doc_title', 'Upload Dokumen Pendukung')}
            action={
              <ActionButton icon="cloud_upload" onClick={() => navigate('/profil-saya')}>
                {t('dashboard.upload_doc_btn', 'Upload Dokumen')}
              </ActionButton>
            }
          >
            {t('dashboard.upload_doc_desc', 'Paket Anda sudah aktif! Silakan unggah dokumen pendukung seperti KTP dan sertifikat agar tim kami dapat segera melakukan verifikasi akun Anda.')}
          </AlertBanner>
        )}

        {/* APPROVED + PAKET FREE — Upgrade Prompt */}
        {isApproved && isFreePackage && (
          <AlertBanner
            tone={TONE.info}
            icon="rocket_launch"
            elevated
            title={t('dashboard.upgrade_premium_title', 'Tingkatkan ke Premium!')}
            action={
              <ActionButton icon="workspace_premium" onClick={() => navigate('/paket')}>
                {t('dashboard.upgrade_now_btn', 'Upgrade Sekarang')}
              </ActionButton>
            }
          >
            <span dangerouslySetInnerHTML={{ __html: t('dashboard.upgrade_premium_description', 'Dapatkan visibilitas lebih tinggi, badge premium, dan fitur unggulan lainnya dengan upgrade ke paket <strong>Premium</strong>.') }} />
          </AlertBanner>
        )}

        {/* PUBLISHED — Success State */}
        {isPublished && (
          <AlertBanner
            tone={TONE.success}
            icon="verified"
            elevated
            title={t('dashboard.published_title', 'Profil Anda Sedang Tayang!')}
            badge={t('dashboard.live_badge', 'LIVE')}
            action={
              <Link
                to="/profil-publik"
                className="bg-white border-2 text-sm font-bold px-5 py-2.5 rounded-xl hover:text-white transition-colors flex items-center gap-2 shrink-0"
                style={{ color: BRAND_GREEN, borderColor: BRAND_GREEN }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = BRAND_GREEN; }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'white'; }}
              >
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                {t('dashboard.view_public_profile', 'Lihat Profil Publik')}
              </Link>
            }
            secondaryAction={
              <Link
                to="/profil-saya"
                className="text-sm font-bold px-5 py-2.5 rounded-xl transition-colors flex items-center gap-2 shrink-0"
                style={{ backgroundColor: `${BRAND_GREEN}1A`, color: BRAND_GREEN }}
              >
                <span className="material-symbols-outlined text-[18px]">edit</span>
                {t('dashboard.edit_profile', 'Edit Profil')}
              </Link>
            }
          >
            {t('dashboard.published_success_desc', 'Profil tenaga ahli Anda sudah aktif dan dapat dilihat oleh publik di direktori website. Pastikan data Anda selalu up-to-date agar mendapat peluang kolaborasi lebih baik.')}
          </AlertBanner>
        )}

        {/* ── PRESTASI MEDALI KONSULTASI TAHUNAN (EKONOMIS & EKSKLUSIF) ── */}
        <MedalProgressionWidget expert={expert} />

        {/* ── GRAFIK & ANALISIS PERFORMA ────────────────────────── */}
        <DashboardAnalyticsCharts 
          consultations={consultations} 
          stats={consultStats} 
          theme="expert" 
        />

        {/* KONSULTASI ACTIVITY ──────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Konsultasi Stats */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-6">
            <h2 className="text-xs sm:text-sm font-bold text-[#1F2A22] uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#8B4513]">psychology</span>
              {t('dashboard.consultation_overview', 'Ringkasan Konsultasi')}
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: 'forum', label: 'Total', value: consultStats.total, bg: '#F4E8D0', fg: '#8B4513' },
                { icon: 'pending_actions', label: 'Aktif', value: consultStats.aktif, bg: '#FFF4D6', fg: '#7A5900' },
                { icon: 'task_alt', label: 'Selesai', value: consultStats.selesai, bg: '#EAE8DE', fg: '#3D3927' },
                { icon: 'star', label: 'Rating', value: consultStats.rating || '—', bg: '#FFF4E6', fg: '#D97706' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: s.bg + '60' }}>
                  <div className="p-2 rounded-lg" style={{ backgroundColor: s.bg }}>
                    <span className="material-symbols-outlined text-[18px]" style={{ color: s.fg }}>{s.icon}</span>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">{s.label}</p>
                    <p className="text-lg font-bold" style={{ color: s.fg }}>{s.value}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/konsultasi"
              className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#8B4513] bg-[#F4E8D0]/60 hover:bg-[#F4E8D0] px-4 py-2.5 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Lihat Semua Konsultasi
            </Link>
          </div>

          {/* Produk Overview */}
          <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-6">
            <h2 className="text-xs sm:text-sm font-bold text-[#1F2A22] uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#3D3927]">inventory</span>
              {t('dashboard.product_overview', 'Ringkasan Produk')}
            </h2>
            {products.length > 0 ? (
              <>
                <MiniActivityChart
                  label="Status Produk"
                  color="#3D3927"
                  data={[
                    { label: 'Aktif', value: products.filter(p => p.status === 'active').length },
                    { label: 'Draft', value: products.filter(p => p.status === 'draft').length },
                    { label: 'Dijeda', value: products.filter(p => p.status === 'paused').length },
                    { label: 'Habis', value: products.filter(p => p.status === 'sold_out').length },
                  ]}
                />
                <div className="mt-4 flex items-center justify-between text-xs">
                  <span className="text-gray-500">Total Produk</span>
                  <span className="font-bold text-[#3D3927]">{products.length}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <div className="w-12 h-12 mb-3 rounded-2xl bg-[#EAE8DE] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px] text-[#3D3927]">inventory_2</span>
                </div>
                <p className="text-xs text-gray-500">Belum ada produk</p>
              </div>
            )}
            <Link
              to="/produk"
              className="mt-4 flex items-center justify-center gap-2 text-xs font-bold text-[#3D3927] bg-[#EAE8DE]/60 hover:bg-[#EAE8DE] px-4 py-2.5 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
              Kelola Produk
            </Link>
          </div>
        </div>

        {/* PRODUK SAYA ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs sm:text-sm font-bold text-[#1F2A22] uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#8B4513]">inventory</span>
              {t('dashboard.my_products', 'Produk Saya')}
              {products.length > 0 && (
                <span className="text-[10px] font-bold bg-[#F4E8D0] text-[#8B4513] px-2 py-0.5 rounded-full">{products.length}</span>
              )}
            </h2>
            <Link to="/produk" className="text-xs font-bold text-[#8B4513] hover:underline flex items-center gap-1">
              {t('dashboard.manage_products', 'Kelola Produk')}
              <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {products.slice(0, 8).map((product) => {
                const CAT_CFG = {
                  book:         { label: 'Buku',           icon: 'book',        bg: '#EFF6FF', fg: '#1D4ED8' },
                  presentation: { label: 'Presentasi/PPT', icon: 'slideshow',   bg: '#F0FDF4', fg: '#15803D' },
                  article:      { label: 'Artikel/Jurnal', icon: 'article',     bg: '#F5F3FF', fg: '#7E22CE' },
                  template:     { label: 'Template',       icon: 'description', bg: '#FFF7ED', fg: '#C2410C' },
                  course:       { label: 'Kursus Online',  icon: 'school',      bg: '#FEF2F2', fg: '#B91C1C' },
                  software:     { label: 'Software/Tools', icon: 'code',        bg: '#F0F9FF', fg: '#0369A1' },
                  cv:           { label: 'CV / Resume',    icon: 'badge',       bg: '#FEF3C7', fg: '#B45309' },
                  other:        { label: 'Lainnya',        icon: 'inventory',   bg: '#F9FAFB', fg: '#374151' },
                };
                const STATUS_CFG = {
                  draft:    { label: 'Draft',  bg: '#F3F4F6', fg: '#374151' },
                  active:   { label: 'Aktif',  bg: '#F0FDF4', fg: '#15803D' },
                  paused:   { label: 'Dijeda', bg: '#FFFBEB', fg: '#B45309' },
                  sold_out: { label: 'Habis',  bg: '#FEF2F2', fg: '#B91C1C' },
                };
                const cat = CAT_CFG[product.category] || CAT_CFG.other;
                const st  = STATUS_CFG[product.status] || STATUS_CFG.draft;
                const discountPct = product.discount_price
                  ? Math.round((1 - product.discount_price / product.price) * 100) : 0;
                const rupiah = (v) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

                return (
                  <Link
                    key={product.id}
                    to="/produk"
                    className="bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden group"
                  >
                    {/* Cover image — 4:3 proporsional */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 shrink-0" style={{ backgroundColor: cat.bg }}>
                      {product.image_url || product.image ? (
                        <img src={product.image_url || product.image} alt={product.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-4 text-center">
                          <span className="material-symbols-outlined text-[36px]" style={{ color: cat.fg }}>{cat.icon}</span>
                          <span className="text-[11px] font-bold text-gray-500">{cat.label}</span>
                        </div>
                      )}

                      {/* Diagonal red ribbon — top right */}
                      {discountPct > 0 && (
                        <div className="absolute top-2.5 right-2.5 bg-[#EF4444] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider z-10">
                          -{discountPct}%
                        </div>
                      )}

                      {/* Format (Digital) badge — top left */}
                      <div className="absolute top-2.5 left-2.5 bg-emerald-700/85 backdrop-blur-sm text-white px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-bold shadow-sm z-10">
                        <span className="material-symbols-outlined text-[13px]">cloud_download</span>
                        <span>Digital</span>
                      </div>

                      {/* Status badge — bottom left */}
                      <div className="absolute bottom-2.5 left-2.5 z-10">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase shadow-sm border border-white/20 backdrop-blur-sm" style={{ backgroundColor: st.bg, color: st.fg }}>
                          {st.label}
                        </span>
                      </div>
                    </div>

                    {/* Content body */}
                    <div className="p-4 flex flex-col flex-1">
                      {/* Author / Category header */}
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="text-[10.5px] font-bold text-[#8FA0B5] uppercase tracking-wider truncate">
                          {cat.label}
                        </span>
                        {product.author && (
                          <span className="text-[11px] text-[#5B6660] truncate font-medium">
                            oleh <strong className="text-[#374151] font-semibold">{product.author}</strong>
                          </span>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-bold text-[#0F172A] leading-snug line-clamp-2 mb-2 group-hover:text-[#3D3927] transition-colors min-h-[2.5rem]">
                        {product.title}
                      </h3>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Price row */}
                      <div className="flex items-baseline gap-2 flex-wrap pt-2 border-t border-gray-100">
                        <span className="text-base font-extrabold text-[#3D3927]">
                          {rupiah(product.discount_price ?? product.price)}
                        </span>
                        {discountPct > 0 && (
                          <span className="text-xs text-[#94A3B8] line-through font-medium">
                            {rupiah(product.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#F4E8D0] flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] text-[#8B4513]">inventory_2</span>
              </div>
              <p className="text-sm font-bold text-[#1F2A22] mb-1">{t('dashboard.no_products', 'Belum Ada Produk')}</p>
              <p className="text-xs text-[#5B6660] mb-4 max-w-sm mx-auto">{t('dashboard.no_products_desc', 'Mulai jual produk buku fisik maupun materi digital di profil Anda. Untuk buku fisik, pastikan sudah terdaftar di katalog UPRESS.')}</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Link
                  to="/produk"
                  className="inline-flex items-center gap-2 text-xs font-bold text-white px-4 py-2.5 rounded-xl transition-all hover:brightness-[0.92] shadow-md"
                  style={{ backgroundColor: BRAND_PRIMARY }}
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  {t('dashboard.add_product', 'Tambah Produk')}
                </Link>
                <a
                  href="https://upress.latihan.co.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3.5 py-2.5 rounded-xl transition-colors shadow-2xs"
                  title="Pasang / daftarkan buku di katalog UPRESS"
                >
                  <span>Pasang di UPRESS</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
              </div>
            </div>
          )}
        </div>

        {/* QUICK ACTIONS ---------------------------------------------------- */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-6">
          <h2 className="text-xs sm:text-sm font-bold text-[#1F2A22] uppercase tracking-wider mb-3.5 sm:mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#3D3927]">apps</span>
            {t('dashboard.quick_access', 'Akses Cepat')}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            <QuickAction to="/profil-saya" icon="person" label={t('dashboard.my_profile', 'Profil Saya')} />
            <QuickAction to="/paket" icon="workspace_premium" label={t('dashboard.packages', 'Paket')} />
            <QuickAction to="/konsultasi" icon="psychology" label={t('Konsultasi', 'Konsultasi')} />
            <QuickAction to="/kelola-berita" icon="edit_note" label={t('Kelola Berita', 'Kelola Berita')} />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}