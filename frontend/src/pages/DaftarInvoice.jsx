import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout';

const getSTATUSMAP = (t) => ({
  verified:            { label: t('invoice.status.paid', 'Lunas'),                     color: '#15803D', bg: '#DCFCE7', icon: 'check_circle' },
  paid:                { label: t('invoice.status.paid', 'Lunas'),                     color: '#15803D', bg: '#DCFCE7', icon: 'check_circle' },
  menunggu_verifikasi: { label: t('invoice.status.awaiting_verification', 'Menunggu Verifikasi'), color: '#B45309', bg: '#FEF3C7', icon: 'hourglass_top' },
  pending:             { label: t('invoice.status.pending', 'Belum Bayar'),           color: '#D97706', bg: '#FFFBEB', icon: 'schedule' },
  rejected:            { label: t('invoice.status.rejected', 'Ditolak / Dibatalkan'), color: '#DC2626', bg: '#FEE2E2', icon: 'cancel' },
  cancelled:           { label: t('invoice.status.rejected', 'Dibatalkan'),           color: '#DC2626', bg: '#FEE2E2', icon: 'cancel' },
  expired:             { label: t('invoice.status.expired', 'Kedaluwarsa'),           color: '#4B5563', bg: '#F3F4F6', icon: 'timer_off' },
});

const CATEGORIES = [
  { key: 'all',        label: 'Semua Transaksi',  icon: 'receipt_long' },
  { key: 'membership', label: 'Paket Membership', icon: 'workspace_premium' },
  { key: 'konsultasi', label: 'Sesi Konsultasi',  icon: 'psychology' },
  { key: 'berita',     label: 'Publikasi Berita', icon: 'newspaper' },
  { key: 'topup',      label: 'Top Up Point',     icon: 'toll' },
  { key: 'produk',     label: 'Produk Digital',   icon: 'shopping_bag' },
];

function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(v ?? 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return dateStr;
  }
}

function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl border border-black/5 shadow-xs ${className}`}>{children}</div>;
}

export default function DaftarInvoice() {
  const { t } = useTranslation();
  const STATUS_MAP = getSTATUSMAP(t);
  const [invoices, setInvoices]       = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter]         = useState('all');
  const [stats, setStats]             = useState({
    total: 0,
    paid_count: 0,
    pending_count: 0,
    total_paid_sum: 0,
  });

  const tabsRef = useRef(null);

  const handleScrollTabs = (direction) => {
    if (!tabsRef.current) return;
    const scrollAmount = direction === 'left' ? -280 : 280;
    tabsRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  const fetchInvoices = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/invoices');
      if (res.data?.status === 'success') {
        setInvoices(res.data.data || []);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      } else {
        throw new Error('Fallback needed');
      }
    } catch (err) {
      console.warn('Fallback to legacy orders & membership history:', err);
      // Fallback: load from existing endpoints
      try {
        const [ordersRes, membershipRes] = await Promise.all([
          api.get('/orders/history').catch(() => ({ data: [] })),
          api.get('/membership/membership-history').catch(() => ({ data: [] })),
        ]);
        const regularOrders = Array.isArray(ordersRes.data) ? ordersRes.data : ordersRes.data?.data || [];
        const membershipOrders = Array.isArray(membershipRes.data) ? membershipRes.data : membershipRes.data?.data || [];

        const combined = [
          ...regularOrders.map(o => ({
            id: 'ord_' + o.id,
            reference_code: o.reference_code || `ORD-${o.id}`,
            invoice_number: `INV-${o.id}`,
            category: 'membership',
            category_label: 'Paket Membership',
            category_icon: 'workspace_premium',
            category_color: '#8B4513',
            category_bg: '#FAF4EE',
            title: o.package_name || 'Paket Membership',
            description: 'Langganan fitur & keanggotaan',
            amount: o.amount || 0,
            payment_method: o.payment_type || 'Transfer Bank',
            status: o.status === 'verified' ? 'verified' : (o.status === 'menunggu_verifikasi' ? 'menunggu_verifikasi' : 'pending'),
            created_at: o.created_at,
          })),
          ...membershipOrders.map(m => ({
            id: 'mbrs_' + m.id,
            reference_code: m.reference_code || `MBRS-${m.id}`,
            invoice_number: m.reference_code || `MBRS-${m.id}`,
            category: 'membership',
            category_label: 'Paket Membership',
            category_icon: 'workspace_premium',
            category_color: '#8B4513',
            category_bg: '#FAF4EE',
            title: m.package ? `Membership ${m.package}` : 'Upgrade Membership',
            description: 'Upgrade status keanggotaan',
            amount: m.total_price || m.price || 0,
            payment_method: 'Transfer Bank',
            status: m.payment_status === 'verified' ? 'verified' : 'pending',
            created_at: m.created_at,
          })),
        ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        setInvoices(combined);
        setStats({
          total: combined.length,
          paid_count: combined.filter(c => c.status === 'verified').length,
          pending_count: combined.filter(c => c.status !== 'verified').length,
          total_paid_sum: combined.filter(c => c.status === 'verified').reduce((s, i) => s + (i.amount || 0), 0),
        });
      } catch (fallbackErr) {
        console.error('All invoice endpoints failed:', fallbackErr);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Filtered list by category and status
  const filteredInvoices = invoices.filter((item) => {
    const matchCategory = selectedCategory === 'all' || item.category === selectedCategory;
    let matchStatus = true;
    if (statusFilter === 'verified') {
      matchStatus = item.status === 'verified' || item.status === 'paid';
    } else if (statusFilter === 'menunggu_verifikasi') {
      matchStatus = item.status === 'menunggu_verifikasi';
    } else if (statusFilter === 'pending') {
      matchStatus = item.status === 'pending';
    } else if (statusFilter === 'rejected') {
      matchStatus = item.status === 'rejected' || item.status === 'cancelled' || item.status === 'expired';
    }
    return matchCategory && matchStatus;
  });

  return (
    <DashboardLayout
      title={t('invoice.title', 'Daftar Invoice & Pembayaran')}
      subtitle="Semua riwayat tagihan dan bukti pembayaran: Paket Membership, Konsultasi, Berita, Top Up Point, dan Produk."
      headerRight={
        <button
          onClick={fetchInvoices}
          disabled={loading}
          className="p-2 sm:px-3.5 sm:py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all"
          title="Muat Ulang Data"
        >
          <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
            refresh
          </span>
          <span className="hidden sm:inline">Perbarui</span>
        </button>
      }
    >
      <div className="space-y-6 animate-fadeIn">
        {/* ── Summary Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <Card className="p-4 sm:p-5 flex items-start gap-3.5 bg-white">
            <div className="w-10 h-10 rounded-xl bg-[#F5EBE1] text-[#8B4513] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">receipt_long</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium truncate">Total Transaksi</p>
              <p className="text-xl sm:text-2xl font-black text-gray-900 mt-0.5">{stats.total || invoices.length}</p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex items-start gap-3.5 bg-gradient-to-br from-emerald-50/40 to-white border-emerald-100">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">check_circle</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-emerald-700 font-medium truncate">Lunas / Terbayar</p>
              <p className="text-xl sm:text-2xl font-black text-emerald-950 mt-0.5">{stats.paid_count || invoices.filter(i => i.status === 'verified').length}</p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex items-start gap-3.5 bg-gradient-to-br from-amber-50/40 to-white border-amber-100">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">pending</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-amber-700 font-medium truncate">Menunggu Bayar</p>
              <p className="text-xl sm:text-2xl font-black text-amber-950 mt-0.5">{stats.pending_count || invoices.filter(i => i.status !== 'verified').length}</p>
            </div>
          </Card>

          <Card className="p-4 sm:p-5 flex items-start gap-3.5 bg-gradient-to-br from-[#8B4513]/5 to-white border-[#8B4513]/10 col-span-2 lg:col-span-1">
            <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[22px]">payments</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 font-medium truncate">Total Nilai Lunas</p>
              <p className="text-lg sm:text-xl font-black text-[#8B4513] mt-0.5 truncate">{formatRupiah(stats.total_paid_sum)}</p>
            </div>
          </Card>
        </div>

        {/* ── Category Filter Tabs dengan Tombol Panah Penggeser di Bawahnya ── */}
        <div className="space-y-2">
          <div
            ref={tabsRef}
            className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1"
          >
            {CATEGORIES.map((cat) => {
              const count = cat.key === 'all'
                ? invoices.length
                : invoices.filter((i) => i.category === cat.key).length;
              const isActive = selectedCategory === cat.key;

              return (
                <button
                  key={cat.key}
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#8B4513] text-white shadow-xs'
                      : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">{cat.icon}</span>
                  <span>{cat.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ml-0.5 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Tombol Panah Penggeser di Bawah Kategori */}
          <div className="flex items-center justify-between px-1 text-xs">
            <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#8B4513]">swipe</span>
              <span>Geser untuk melihat kategori tagihan lainnya</span>
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleScrollTabs('left')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#8B4513]/10 border border-gray-200 hover:border-[#8B4513] text-gray-700 hover:text-[#8B4513] text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Geser Kiri"
                aria-label="Geser Kategori ke Kiri"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span className="text-[11px]">Kiri</span>
              </button>
              <button
                type="button"
                onClick={() => handleScrollTabs('right')}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-[#8B4513]/10 border border-gray-200 hover:border-[#8B4513] text-gray-700 hover:text-[#8B4513] text-xs font-bold shadow-2xs transition-all active:scale-95 cursor-pointer"
                title="Geser Kanan"
                aria-label="Geser Kategori ke Kanan"
              >
                <span className="text-[11px]">Kanan</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Main Table Card ── */}
        <Card className="overflow-hidden">
          {/* Status Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap bg-[#FCFDFD]">
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { key: 'all', label: 'Semua Status' },
                { key: 'verified', label: 'Lunas' },
                { key: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
                { key: 'pending', label: 'Belum Bayar' },
                { key: 'rejected', label: 'Dibatalkan' },
              ].map((st) => (
                <button
                  key={st.key}
                  onClick={() => setStatusFilter(st.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    statusFilter === st.key
                      ? 'bg-gray-900 text-white shadow-2xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200/80'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <span className="text-xs text-gray-500 font-medium">
              Menampilkan <strong>{filteredInvoices.length}</strong> transaksi
            </span>
          </div>

          {/* Loading / Empty / Content */}
          {loading ? (
            <div className="p-12 text-center text-gray-500 space-y-2">
              <span className="w-8 h-8 rounded-full border-3 border-[#8B4513] border-t-transparent animate-spin inline-block"></span>
              <p className="text-xs font-semibold">Memuat riwayat invoice...</p>
            </div>
          ) : filteredInvoices.length === 0 ? (
            <div className="p-10 sm:p-14 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
                <span className="material-symbols-outlined text-[32px]">receipt_long</span>
              </div>
              <h3 className="text-base font-bold text-gray-900">Belum Ada Invoice untuk Kategori Ini</h3>
              <p className="text-xs sm:text-sm text-gray-500 max-w-md mx-auto">
                {selectedCategory === 'all'
                  ? 'Anda belum memiliki riwayat transaksi atau pembayaran di TenagaAhli.com.'
                  : `Tidak ditemukan transaksi pembayaran untuk kategori ${selectedCategory}.`}
              </p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-gray-50/80 text-gray-500 border-b border-gray-100 font-bold text-[11px] uppercase tracking-wider">
                      <th className="px-5 py-3.5">No. Invoice & Referensi</th>
                      <th className="px-5 py-3.5">Kategori</th>
                      <th className="px-5 py-3.5">Rincian Pembayaran</th>
                      <th className="px-5 py-3.5">Total Bayar</th>
                      <th className="px-5 py-3.5">Metode</th>
                      <th className="px-5 py-3.5">Tanggal</th>
                      <th className="px-5 py-3.5">Status</th>
                      <th className="px-5 py-3.5 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredInvoices.map((inv) => {
                      const st = STATUS_MAP[inv.status] || STATUS_MAP.pending;

                      return (
                        <tr key={inv.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-5 py-4">
                            <span className="font-mono font-bold text-[#8B4513] text-xs block">
                              {inv.reference_code || `INV-${inv.raw_id || inv.id}`}
                            </span>
                            <span className="text-[10px] text-gray-400 block mt-0.5">
                              {inv.invoice_number}
                            </span>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold"
                              style={{
                                color: inv.category_color || '#8B4513',
                                backgroundColor: inv.category_bg || '#FAF4EE',
                              }}
                            >
                              <span className="material-symbols-outlined text-[13px]">{inv.category_icon || 'receipt'}</span>
                              <span>{inv.category_label || inv.category}</span>
                            </span>
                          </td>

                          <td className="px-5 py-4 max-w-xs">
                            <p className="font-bold text-gray-900 line-clamp-1 text-xs sm:text-sm">
                              {inv.title}
                            </p>
                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                              {inv.description}
                            </p>
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <span className="font-black text-gray-900 text-xs sm:text-sm">
                              {formatRupiah(inv.total_price || inv.amount)}
                            </span>
                            {inv.points_spent > 0 && (
                              <span className="block text-[10px] text-amber-700 font-semibold">
                                {inv.points_spent} Point
                              </span>
                            )}
                          </td>

                          <td className="px-5 py-4 text-gray-600 text-xs whitespace-nowrap">
                            {inv.payment_method || '-'}
                          </td>

                          <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                            {formatDate(inv.created_at)}
                          </td>

                          <td className="px-5 py-4 whitespace-nowrap">
                            <span
                              className="text-[11px] font-bold px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                              style={{ color: st.color, backgroundColor: st.bg }}
                            >
                              <span className="material-symbols-outlined text-[12px]">{st.icon}</span>
                              <span>{st.label}</span>
                            </span>
                          </td>

                          <td className="px-5 py-4 text-center whitespace-nowrap">
                            <Link
                              to={`/invoice/${inv.reference_code || inv.raw_id || inv.id}`}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#8B4513]/10 hover:bg-[#8B4513] text-[#8B4513] hover:text-white rounded-lg text-xs font-bold transition-all shadow-2xs"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              <span>Lihat</span>
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List View */}
              <div className="md:hidden divide-y divide-gray-100">
                {filteredInvoices.map((inv) => {
                  const st = STATUS_MAP[inv.status] || STATUS_MAP.pending;

                  return (
                    <div key={inv.id} className="p-4 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-bold"
                          style={{
                            color: inv.category_color || '#8B4513',
                            backgroundColor: inv.category_bg || '#FAF4EE',
                          }}
                        >
                          <span className="material-symbols-outlined text-[12px]">{inv.category_icon || 'receipt'}</span>
                          <span>{inv.category_label || inv.category}</span>
                        </span>

                        <span
                          className="text-[10px] font-bold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                          style={{ color: st.color, backgroundColor: st.bg }}
                        >
                          <span className="material-symbols-outlined text-[11px]">{st.icon}</span>
                          <span>{st.label}</span>
                        </span>
                      </div>

                      <div>
                        <p className="font-bold text-gray-900 text-xs sm:text-sm">{inv.title}</p>
                        <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">{inv.description}</p>
                        <p className="font-mono text-[10px] text-gray-400 mt-1">Ref: {inv.reference_code}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <div>
                          <span className="text-[10px] text-gray-400 block uppercase">Total Bayar</span>
                          <span className="font-black text-gray-900 text-sm">{formatRupiah(inv.total_price || inv.amount)}</span>
                        </div>

                        <Link
                          to={`/invoice/${inv.reference_code || inv.raw_id || inv.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#8B4513] text-white rounded-lg text-xs font-bold shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">visibility</span>
                          <span>Buka Invoice</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
