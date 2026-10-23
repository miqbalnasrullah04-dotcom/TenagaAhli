import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import DashboardAnalyticsCharts from '../components/DashboardAnalyticsCharts.jsx';
import MedalProgressionWidget from '../components/MedalProgressionWidget.jsx';
import { SkeletonDashboardSurveyor } from '../components/Skeleton.jsx';
import { getCallingName } from '../utils/formatters.js';

// Design tokens
const TONE = {
  info:    { fg: '#978F66', bg: '#F0EEE2' },
  warning: { fg: '#7A5900', bg: '#FFF4D6' },
  amber:   { fg: '#D97706', bg: '#FFF4E6' },
};

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

const rupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

function StatCard({ icon, bg, fg, label, value, desc }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-5 sm:p-6 flex items-start gap-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
      <div className="p-3 rounded-xl shrink-0" style={{ backgroundColor: bg, color: fg }}>
        <span className="material-symbols-outlined text-[26px] sm:text-[28px]">{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] text-gray-500 uppercase tracking-wider font-bold mb-1">{label}</p>
        <p className="font-bold text-gray-900 text-xl sm:text-2xl mb-0.5">{value}</p>
        {desc && <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>}
      </div>
    </div>
  );
}

export default function DashboardSurveyor() {
  const navigate = useNavigate();
  const [user, setUser]   = useState(null);
  const [stats, setStats] = useState({
    total_konsultasi: 0,
    konsultasi_aktif: 0,
    selesai_bulan_ini: 0,
    rating: 0,
  });
  const [products, setProducts] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('amdal_user');
      if (raw) {
        const u = JSON.parse(raw);
        setUser(u);
        if (u.role === 'admin') { navigate('/admin', { replace: true }); return; }
        if (u.role_type === 'tenaga_ahli') { navigate('/dashboard', { replace: true }); return; }
        if (u.role_type === 'klien' || u.role_type === 'client' || u.role === 'klien' || u.role === 'client' || (u.role !== 'admin' && u.role_type !== 'surveyor')) {
          navigate('/akun', { replace: true });
          return;
        }
      }
    } catch { /* ignore */ }

    // Ambil statistik dari API
    Promise.all([
      api.get('/my/profile').catch(() => null),
      api.get('/my/expert-consultations').catch(() => null),
      api.get('/my/products').catch(() => ({ data: [] })),
    ]).then(([profileRes, consultRes, productsRes]) => {
      const profile      = profileRes?.data;
      const consultData  = consultRes?.data?.stats;

      if (profile) {
        setUser((prev) => {
          const updated = { ...prev, ...profile, package: profile.package || prev?.package };
          localStorage.setItem('amdal_user', JSON.stringify(updated));
          return updated;
        });
      }

      setStats({
        total_konsultasi:  consultData?.total            ?? 0,
        konsultasi_aktif:  (consultData?.menunggu_konfirmasi ?? 0) + (consultData?.dikonfirmasi ?? 0),
        selesai_bulan_ini: consultData?.selesai           ?? 0,
        rating:            profile?.rating               ?? 0,
      });

      // Set consultations & products
      const cConsults = consultRes?.data?.consultations || [];
      setConsultations(Array.isArray(cConsults) ? cConsults : []);

      const productsData = Array.isArray(productsRes?.data) ? productsRes.data : [];
      setProducts(productsData);
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <SkeletonDashboardSurveyor />
      </DashboardLayout>
    );
  }

  const name = user?.name || 'Surveyor';

  const isPremium = (() => {
    if (!user) return false;
    if (user.role === 'admin' || user.is_premium === true || user.is_verified === true && user.package_id > 1) return true;
    const pkg = user.package;
    const pkgName = typeof pkg === 'string' ? pkg.toLowerCase() : (pkg?.name || pkg?.slug || '').toLowerCase();
    const memLevel = (user.membership_level || '').toLowerCase();
    const isPaidTier = pkgName.includes('premium') || pkgName.includes('platinum') || pkgName.includes('ekonomis') || pkgName.includes('eksklusif') || pkgName.includes('ekslusif') || pkgName.includes('esklusif') || memLevel.includes('premium') || memLevel.includes('platinum') || memLevel.includes('ekonomis') || memLevel.includes('eksklusif') || memLevel.includes('ekslusif') || (typeof pkg === 'object' && pkg?.price > 0) || (user.package_id && Number(user.package_id) > 1);
    if (!isPaidTier) return false;
    const expiry = user.premium_expires_at || user.package_expires_at;
    if (!expiry) return true;
    return new Date(expiry) > new Date();
  })();

  const isPlatinum = (() => {
    if (!user) return false;
    const pkg = user.package;
    const pkgName = typeof pkg === 'string' ? pkg.toLowerCase() : (pkg?.name || pkg?.slug || '').toLowerCase();
    const memLevel = (user.membership_level || '').toLowerCase();
    return pkgName.includes('platinum') || pkgName.includes('eksklusif') || pkgName.includes('ekslusif') || pkgName.includes('esklusif') || memLevel.includes('platinum') || memLevel.includes('eksklusif') || memLevel.includes('ekslusif') || (typeof pkg === 'object' && (pkgName.includes('platinum') || pkgName.includes('eksklusif') || pkgName.includes('ekslusif')));
  })();

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8 animate-fadeIn pb-12">

        {/* ── Top Header Banner ───────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-[#5C5640] via-[#4A4531] to-[#363222] text-white p-5 sm:p-8 rounded-3xl shadow-lg">
          <div className="flex items-start sm:items-center gap-3.5 sm:gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[28px] sm:text-[32px] text-[#E4DFC9]">explore</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg sm:text-2xl font-bold tracking-tight">Halo, {getCallingName(name)}!</h1>
                <span className="text-[10px] sm:text-[11px] font-bold bg-[#E4DFC9] text-[#4A4531] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                  Surveyor Aktif
                </span>
                <span className={`text-[10px] sm:text-[11px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isPlatinum 
                    ? 'bg-purple-200 text-purple-900 border border-purple-300'
                    : isPremium 
                    ? 'bg-amber-400 text-amber-950' 
                    : 'bg-white/15 text-white border border-white/25'
                }`}>
                  {isPlatinum ? 'Paket Eksklusif' : isPremium ? 'Paket Ekonomis' : 'Paket Free'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/85 mt-1 leading-relaxed">
                Kelola konsultasi, paket langganan, dan layanan profesional Anda dari sini.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <Link
              to="/paket"
              className="w-full sm:w-auto justify-center bg-gradient-to-r from-slate-200 via-slate-100 to-zinc-300 hover:from-white hover:to-slate-200 text-slate-900 border border-white/80 font-bold text-xs sm:text-sm pl-2.5 pr-4 sm:pr-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-2.5 shadow-md shadow-black/15 transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <span className="w-7 h-7 rounded-lg bg-slate-800/10 text-slate-800 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[18px]">diamond</span>
              </span>
              {isPremium ? (isPlatinum ? 'Paket Aktif' : 'Upgrade Eksklusif') : 'Pilih Paket'}
            </Link>
            <Link
              to="/top-up"
              className="w-full sm:w-auto justify-center bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/25 text-white font-bold text-xs sm:text-sm pl-2.5 pr-4 sm:pr-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-2.5 shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <span className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center shrink-0 text-[#E4DFC9]">
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
              </span>
              Top Up Point
            </Link>
            <Link
              to="/konsultasi"
              className="w-full sm:w-auto justify-center bg-white hover:bg-[#F5F3EA] text-[#4A4531] font-bold text-xs sm:text-sm pl-2.5 pr-4 sm:pr-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-2.5 shadow-sm transition-all hover:scale-105 active:scale-95 shrink-0"
            >
              <span className="w-7 h-7 rounded-lg bg-[#F0EEE2] flex items-center justify-center shrink-0 text-[#978F66]">
                <span className="material-symbols-outlined text-[18px]">psychology</span>
              </span>
              Kelola Konsultasi
            </Link>
          </div>
        </div>

        {/* ── Stats Grid ──────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon="psychology"
            bg={TONE.info.bg}
            fg={TONE.info.fg}
            label="Total Konsultasi"
            value={stats.total_konsultasi}
            desc="Seluruh riwayat konsultasi"
          />
          <StatCard
            icon="pending_actions"
            bg={TONE.warning.bg}
            fg={TONE.warning.fg}
            label="Aktif"
            value={stats.konsultasi_aktif}
            desc="Konsultasi berjalan"
          />
          <StatCard
            icon="task_alt"
            bg="#F0EEE2"
            fg="#978F66"
            label="Selesai Bulan Ini"
            value={stats.selesai_bulan_ini}
            desc="Bulan berjalan"
          />
          <StatCard
            icon="star"
            bg={TONE.amber.bg}
            fg={TONE.amber.fg}
            label="Rating"
            value={stats.rating || '—'}
            desc="Rata-rata ulasan"
          />
        </div>

        {/* ── Banner Paket Sesuai Status ──────────────── */}
        {!isPremium ? (
          <div className="rounded-2xl p-4 sm:p-6 border bg-[#FFF4E6] border-[#FCD34D] flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="rounded-xl shrink-0 p-2.5 bg-amber-500/15 text-amber-700">
                <span className="material-symbols-outlined text-[28px]">workspace_premium</span>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-[#92400E] mb-1 flex items-center gap-2">
                  Paket Free Aktif — Tingkatkan ke Premium!
                  <span className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full">UPGRADE</span>
                </h3>
                <p className="text-xs sm:text-sm text-[#B45309] leading-relaxed">
                  Dapatkan akses penjualan produk di marketplace, visibilitas prioritas di direktori surveyor, dan badge premium untuk meningkatkan kepercayaan klien.
                </p>
              </div>
            </div>
            <Link
              to="/paket"
              className="bg-[#8B4513] hover:bg-[#654321] text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 shrink-0 self-start md:self-center"
            >
              <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
              Pilih Paket Berbayar
            </Link>
          </div>
        ) : !isPlatinum ? (
          <div className="rounded-2xl p-4 sm:p-6 border bg-gradient-to-r from-purple-50 via-indigo-50 to-amber-50 border-purple-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="rounded-xl shrink-0 p-2.5 bg-purple-700/10 text-purple-700">
                <span className="material-symbols-outlined text-[28px]">verified</span>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-purple-950 mb-1 flex items-center gap-2">
                  Paket Ekonomis Aktif (Maks. 10 Produk)
                  <span className="text-[10px] font-bold bg-purple-700 text-white px-2 py-0.5 rounded-full">EKONOMIS</span>
                </h3>
                <p className="text-xs sm:text-sm text-purple-900/80 leading-relaxed">
                  Akun Anda aktif sebagai member Ekonomis! Ingin menambah portofolio etalase hingga <strong>20 produk digital</strong>? Tingkatkan ke Paket Eksklusif sekarang.
                </p>
              </div>
            </div>
            <Link
              to="/paket"
              className="bg-purple-800 hover:bg-purple-900 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 shrink-0 self-start md:self-center"
            >
              <span className="material-symbols-outlined text-[18px]">diamond</span>
              Upgrade ke Eksklusif (20 Produk)
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl p-4 sm:p-6 border bg-gradient-to-r from-emerald-50 to-teal-50 border-emerald-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-fadeIn shadow-sm">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="rounded-xl shrink-0 p-2.5 bg-emerald-600/10 text-emerald-700">
                <span className="material-symbols-outlined text-[28px]">diamond</span>
              </div>
              <div>
                <h3 className="font-bold text-sm sm:text-base text-emerald-950 mb-1 flex items-center gap-2">
                  Paket Eksklusif Aktif (Maks. 20 Produk)
                  <span className="text-[10px] font-bold bg-emerald-700 text-white px-2 py-0.5 rounded-full">EKSKLUSIF</span>
                </h3>
                <p className="text-xs sm:text-sm text-emerald-800/80 leading-relaxed">
                  Selamat! Anda menikmati kuota maksimal hingga 20 produk digital dan prioritas utama di direktori surveyor.
                </p>
              </div>
            </div>
            <Link
              to="/produk"
              className="bg-emerald-800 hover:bg-emerald-900 text-white text-xs sm:text-sm font-bold px-5 py-2.5 rounded-xl transition-all shadow-md hover:shadow-lg flex items-center gap-2 shrink-0 self-start md:self-center"
            >
              <span className="material-symbols-outlined text-[18px]">add_box</span>
              Kelola Produk
            </Link>
          </div>
        )}

        {/* ── PRESTASI MEDALI KONSULTASI TAHUNAN (EKONOMIS & EKSKLUSIF) ── */}
        <MedalProgressionWidget expert={user} />

        {/* ── GRAFIK & ANALISIS PERFORMA ────────────────────────── */}
        <DashboardAnalyticsCharts 
          consultations={consultations} 
          stats={stats} 
          theme="surveyor" 
        />

        {/* ── Produk Saya ────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-[#8B4513]">inventory</span>
              Produk Saya
              {products.length > 0 && (
                <span className="text-[10px] font-bold bg-[#F0EEE2] text-[#8B4513] px-2 py-0.5 rounded-full">{products.length}</span>
              )}
            </h2>
            {!isPremium ? (
              <span className="text-xs font-bold text-gray-400 flex items-center gap-1 cursor-not-allowed">
                <span className="material-symbols-outlined text-[16px]">lock</span>
                Kelola Produk
              </span>
            ) : (
              <Link to="/produk" className="text-xs font-bold text-[#8B4513] hover:underline flex items-center gap-1">
                Kelola Produk
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            )}
          </div>

          {!isPremium ? (
            <div className="py-8 px-6 text-center bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200/50">
              <div className="flex justify-center mb-3">
                <span className="material-symbols-outlined text-[40px] text-amber-600">lock</span>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">Fitur Penjualan Produk</p>
              <p className="text-xs text-gray-600 mb-4 max-w-sm mx-auto">Dapatkan akses penjualan produk dengan berlangganan paket Ekonomis atau Eksklusif.</p>
              <Link
                to="/paket"
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <span className="material-symbols-outlined text-[16px]">upgrade</span>
                Pilih Paket Sekarang
              </Link>
            </div>
          ) : products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
              {products.slice(0, 8).map((product) => {
                const cat = CAT_CFG[product.category] || CAT_CFG.other;
                const st  = STATUS_CFG[product.status] || STATUS_CFG.draft;
                const discountPct = product.discount_price
                  ? Math.round((1 - product.discount_price / product.price) * 100) : 0;

                return (
                  <Link
                    key={product.id}
                    to="/produk"
                    className="bg-white rounded-2xl border border-gray-200/90 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col overflow-hidden group"
                  >
                    {/* Cover image — landscape ratio (16:10) */}
                    <div className="relative aspect-[16/10] w-full overflow-hidden bg-gray-100 shrink-0" style={{ backgroundColor: cat.bg }}>
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
                      <h3 className="text-sm font-bold text-[#0F172A] leading-snug line-clamp-2 mb-2 group-hover:text-[#6E6849] transition-colors min-h-[2.5rem]">
                        {product.title}
                      </h3>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Price row */}
                      <div className="flex items-baseline gap-2 flex-wrap pt-2 border-t border-gray-100">
                        <span className="text-base font-extrabold text-[#6E6849]">
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
            <div className="text-center py-8 bg-[#FAFBF9] rounded-2xl border border-dashed border-gray-200">
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#F0EEE2] flex items-center justify-center">
                <span className="material-symbols-outlined text-[28px] text-[#8B4513]">inventory_2</span>
              </div>
              <p className="text-sm font-bold text-gray-900 mb-1">Belum Ada Produk yang Dipasang</p>
              <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
                {isPlatinum ? 'Anda memiliki kuota hingga 20 produk aktif.' : 'Anda memiliki kuota hingga 10 produk aktif.'} Pasang template, modul GIS, atau instrumen survei sekarang.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Link
                  to="/produk"
                  className="inline-flex items-center gap-2 text-xs font-bold text-white px-4 py-2.5 rounded-xl bg-[#8B4513] hover:bg-[#654321] transition-all shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                  Tambah Produk
                </Link>
                {!isPlatinum && (
                  <Link
                    to="/paket"
                    className="inline-flex items-center gap-1.5 bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 font-bold text-xs px-4 py-2.5 rounded-xl transition-all"
                  >
                    <span className="material-symbols-outlined text-[16px]">diamond</span>
                    Upgrade Eksklusif (20 Produk)
                  </Link>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Quick Actions ───────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-6">
          <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px] text-[#978F66]">apps</span>
            Akses Cepat
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
            {[
              { to: '/profil-saya',   icon: 'person',            label: 'Profil Saya' },
              { to: '/paket',         icon: 'workspace_premium', label: 'Paket'       },
              { to: '/konsultasi',    icon: 'psychology',        label: 'Konsultasi'  },
              { to: '/jadwal',        icon: 'schedule',          label: 'Jadwal'      },
              { to: '/produk',        icon: 'inventory',         label: 'Produk',     premium: true },
              { to: '/kelola-berita', icon: 'edit_note',         label: 'Kelola Berita' },
              { to: '/profil-publik', icon: 'language',          label: 'Profil'      },
            ].map((item) => (
              <Link
                key={item.to}
                to={item.premium && !isPremium ? '#' : item.to}
                onClick={(e) => {
                  if (item.premium && !isPremium) {
                    e.preventDefault();
                  }
                }}
                className={`flex flex-col items-center gap-2 p-3 sm:p-4 rounded-2xl border transition-all duration-200 group text-center ${
                  item.premium && !isPremium
                    ? 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
                    : 'border-gray-100 hover:border-[#978F66] hover:bg-[#F0EEE2]/40 hover:-translate-y-0.5'
                }`}
              >
                <span className={`material-symbols-outlined text-[24px] transition-transform ${
                  item.premium && !isPremium ? 'text-gray-400' : 'text-[#978F66] group-hover:scale-110'
                }`}>
                  {item.icon}
                </span>
                <span className={`text-[11px] font-semibold leading-tight ${
                  item.premium && !isPremium ? 'text-gray-400' : 'text-gray-500 group-hover:text-[#978F66]'
                }`}>
                  {item.label}
                  {item.premium && !isPremium && <span className="material-symbols-outlined text-[10px] leading-none">lock</span>}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Konsultasi & Marketplace ────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          {/* Konsultasi Card */}
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                  <span className="material-symbols-outlined text-[24px]">psychology</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Konsultasi</h3>
                  <p className="text-xs text-gray-500">Kelola sesi konsultasi klien</p>
                </div>
              </div>
              <Link to="/konsultasi" className="text-xs font-bold text-[#978F66] hover:underline flex items-center gap-1">
                Lihat Semua
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Link to="/konsultasi" className="flex flex-col gap-1 p-3 rounded-xl bg-blue-50 hover:bg-blue-100 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-blue-600">inbox</span>
                <span className="text-xs font-bold text-gray-800">Permintaan Masuk</span>
                <span className="text-[11px] text-gray-500">Lihat & kelola request</span>
              </Link>
              <Link to="/jadwal" className="flex flex-col gap-1 p-3 rounded-xl bg-green-50 hover:bg-green-100 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-green-600">schedule</span>
                <span className="text-xs font-bold text-gray-800">Jadwal & Tarif</span>
                <span className="text-[11px] text-gray-500">Atur ketersediaan</span>
              </Link>
              <Link to="/chat" className="flex flex-col gap-1 p-3 rounded-xl bg-purple-50 hover:bg-purple-100 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-purple-600">chat</span>
                <span className="text-xs font-bold text-gray-800">Chat</span>
                <span className="text-[11px] text-gray-500">Pesan dengan klien</span>
              </Link>
              <Link to="/pendapatan" className="flex flex-col gap-1 p-3 rounded-xl bg-amber-50 hover:bg-amber-100 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-amber-600">account_balance_wallet</span>
                <span className="text-xs font-bold text-gray-800">Pendapatan</span>
                <span className="text-[11px] text-gray-500">Riwayat penghasilan</span>
              </Link>
            </div>
          </div>

          {/* Marketplace Card */}
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-5 sm:p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600">
                  <span className="material-symbols-outlined text-[24px]">inventory</span>
                </div>
                <div>
                  <h3 className="font-bold text-sm text-gray-900">Marketplace</h3>
                  <p className="text-xs text-gray-500">Jual produk & layanan Anda</p>
                </div>
              </div>
              {!isPremium ? (
                <span className="text-xs font-bold text-gray-400 flex items-center gap-1 cursor-not-allowed">
                  <span className="material-symbols-outlined text-[14px]">lock</span>
                </span>
              ) : (
                <Link to="/produk" className="text-xs font-bold text-[#978F66] hover:underline flex items-center gap-1">
                  Lihat Semua
                  <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {!isPremium ? (
                <>
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-orange-50 opacity-60 cursor-not-allowed relative">
                    <span className="material-symbols-outlined text-[20px] text-orange-600">inventory_2</span>
                    <span className="text-xs font-bold text-gray-800">Kelola Produk</span>
                    <span className="text-[11px] text-gray-500">Tambah & edit produk</span>
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                      <span className="material-symbols-outlined text-[24px] text-orange-600">lock</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-3 rounded-xl bg-teal-50 opacity-60 cursor-not-allowed relative">
                    <span className="material-symbols-outlined text-[20px] text-teal-600">trending_up</span>
                    <span className="text-xs font-bold text-gray-800">Laporan Penjualan</span>
                    <span className="text-[11px] text-gray-500">Statistik penjualan</span>
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl">
                      <span className="material-symbols-outlined text-[24px] text-teal-600">lock</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <Link to="/produk" className="flex flex-col gap-1 p-3 rounded-xl bg-orange-50 hover:bg-orange-100 transition-colors">
                    <span className="material-symbols-outlined text-[20px] text-orange-600">inventory_2</span>
                    <span className="text-xs font-bold text-gray-800">Kelola Produk</span>
                    <span className="text-[11px] text-gray-500">Tambah & edit produk</span>
                  </Link>
                  <Link to="/penjualan" className="flex flex-col gap-1 p-3 rounded-xl bg-teal-50 hover:bg-teal-100 transition-colors">
                    <span className="material-symbols-outlined text-[20px] text-teal-600">trending_up</span>
                    <span className="text-xs font-bold text-gray-800">Laporan Penjualan</span>
                    <span className="text-[11px] text-gray-500">Statistik penjualan</span>
                  </Link>
                </>
              )}
              <Link to="/ulasan" className="flex flex-col gap-1 p-3 rounded-xl bg-yellow-50 hover:bg-yellow-100 transition-colors">
                <span className="material-symbols-outlined text-[20px] text-yellow-600">star</span>
                <span className="text-xs font-bold text-gray-800">Ulasan</span>
                <span className="text-[11px] text-gray-500">Rating dari klien</span>
              </Link>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}