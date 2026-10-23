import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import api from '../api/client.js';
import { SkeletonPendapatan } from '../components/Skeleton.jsx';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BRAND_BROWN      = '#8B4513';
const BRAND_BROWN_DARK = '#654321';
const BRAND_GREEN      = '#2E5E3B';

const ORDER_STATUS = {
  pending:              { label: 'Menunggu', bg: '#FFFBEB', fg: '#B45309' },
  pending_payment:      { label: 'Menunggu', bg: '#FFFBEB', fg: '#B45309' },
  pending_verification: { label: 'Verifikasi', bg: '#EFF6FF', fg: '#1D4ED8' },
  completed:            { label: 'Selesai', bg: '#F0FDF4', fg: '#15803D' },
  cancelled:            { label: 'Dibatalkan', bg: '#FEF2F2', fg: '#B91C1C' },
  payment_rejected:     { label: 'Ditolak', bg: '#FEF2F2', fg: '#B91C1C' },
  refunded:             { label: 'Refund', bg: '#F3F4F6', fg: '#374151' },
};

const RANK_STYLE = {
  1: { bg: '#FFFBEB', fg: '#92400E', icon: 'workspace_premium', label: '#1' },
  2: { bg: '#F9FAFB', fg: '#374151', icon: 'military_tech',     label: '#2' },
  3: { bg: '#FFF7ED', fg: '#9A3412', icon: 'award_star',        label: '#3' },
};

export default function LaporanPenjualan() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/product-sales');
      if (res.data?.success) {
        setSales(res.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching sales data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, []);

  const rupiah = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

  const dateStr = (s) =>
    s ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';

  // ── Metrics Calculation ──────────────────────────────────────────────────────
  const completedSales = sales.filter((s) => s.status === 'completed');
  const totalRevenue = completedSales.reduce((acc, s) => {
    const price = s.amount_idr || s.product?.discount_price || s.product?.price || 0;
    return acc + Number(price);
  }, 0);
  const totalNet = completedSales.reduce((acc, s) => {
    return acc + Number(s.seller_amount || (s.product?.price ? s.product.price * 0.9 : 0));
  }, 0);
  const totalCommission = totalRevenue - totalNet;
  const totalSold = completedSales.length;
  const avgOrder = totalSold > 0 ? Math.round(totalRevenue / totalSold) : 0;

  // ── Top Products Calculation ────────────────────────────────────────────────
  const productMap = {};
  completedSales.forEach((s) => {
    const pId = s.product?.id || 'unknown';
    const pTitle = s.product?.title || 'Produk';
    const price = s.amount_idr || s.product?.discount_price || s.product?.price || 0;

    if (!productMap[pId]) {
      productMap[pId] = {
        id: pId,
        name: pTitle,
        total_sold: 0,
        revenue: 0,
      };
    }
    productMap[pId].total_sold += 1;
    productMap[pId].revenue += Number(price);
  });

  const topProducts = Object.values(productMap)
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);

  // ── Filtering Orders ────────────────────────────────────────────────────────
  const filteredOrders = sales.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const pTitle = (s.product?.title || '').toLowerCase();
      const buyerName = (s.buyer?.name || '').toLowerCase();
      const ref = (s.reference_code || '').toLowerCase();
      return pTitle.includes(q) || buyerName.includes(q) || ref.includes(q);
    }
    return true;
  });

  if (loading && sales.length === 0) {
    return (
      <DashboardLayout>
        <SkeletonPendapatan />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1F2A22]">Laporan Penjualan Produk</h1>
            <p className="text-sm text-[#5B6660]">Analisis kinerja produk, konversi penjualan, dan rincian pesanan pembeli</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              to="/kelola-produk"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-[#E5E2D9] text-xs font-bold text-[#1F2A22] bg-white hover:bg-[#FAF9F6] shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-sm">inventory_2</span>
              Kelola Produk
            </Link>
            <button
              onClick={fetchSalesData}
              className="p-2.5 rounded-xl bg-white border border-[#E5E2D9] text-[#1F2A22] hover:bg-[#FAF9F6] shadow-sm"
              title="Segarkan Data"
            >
              <span className="material-symbols-outlined text-sm">refresh</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
          </div>
        ) : (
          <>
            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-2xl border border-[#E5E2D9] shadow-sm p-5">
                <p className="text-xs font-semibold text-[#5B6660] uppercase tracking-wider mb-1">Total Pendapatan Kotor</p>
                <p className="text-2xl font-black text-[#1F2A22]">{rupiah(totalRevenue)}</p>
                <p className="text-xs text-[#5B6660] mt-1">Dari {totalSold} unit produk terjual</p>
              </div>
              <div className="bg-emerald-50 rounded-2xl border border-emerald-200 shadow-sm p-5">
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Pendapatan Bersih (90%)</p>
                <p className="text-2xl font-black text-emerald-900">{rupiah(totalNet)}</p>
                <p className="text-xs text-emerald-700 mt-1">Masuk ke saldo dompet Anda</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E2D9] shadow-sm p-5">
                <p className="text-xs font-semibold text-[#5B6660] uppercase tracking-wider mb-1">Total Pesanan</p>
                <p className="text-2xl font-black text-[#1F2A22]">{sales.length} Pesanan</p>
                <p className="text-xs text-[#5B6660] mt-1">{completedSales.length} Selesai • {sales.length - completedSales.length} Pending</p>
              </div>
              <div className="bg-white rounded-2xl border border-[#E5E2D9] shadow-sm p-5">
                <p className="text-xs font-semibold text-[#5B6660] uppercase tracking-wider mb-1">Rata-rata Nilai Order</p>
                <p className="text-2xl font-black text-[#8B4513]">{rupiah(avgOrder)}</p>
                <p className="text-xs text-[#5B6660] mt-1">Per transaksi produk</p>
              </div>
            </div>

            {/* Top Products */}
            {topProducts.length > 0 && (
              <div className="bg-white rounded-2xl border border-[#E5E2D9] shadow-sm p-6">
                <h3 className="text-base font-bold text-[#1F2A22] mb-4 flex items-center gap-2">
                  <span className="material-symbols-outlined text-amber-500">emoji_events</span>
                  Produk Terlaris Anda
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {topProducts.map((p, idx) => {
                    const rank = idx + 1;
                    const style = RANK_STYLE[rank] || RANK_STYLE[3];
                    return (
                      <div key={p.id} className="p-4 rounded-xl border border-[#E5E2D9] bg-[#FAF9F6] flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold" style={{ backgroundColor: style.bg, color: style.fg }}>
                              Rank #{rank}
                            </span>
                            <span className="text-xs font-bold text-[#5B6660]">{p.total_sold} Terjual</span>
                          </div>
                          <p className="font-bold text-sm text-[#1F2A22] line-clamp-2">{p.name}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#E5E2D9] flex items-center justify-between">
                          <span className="text-xs text-[#5B6660]">Omset:</span>
                          <span className="text-sm font-extrabold text-emerald-700">{rupiah(p.revenue)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-[#E5E2D9] shadow-sm p-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <h3 className="text-base font-bold text-[#1F2A22] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B4513]">receipt_long</span>
                  Daftar Transaksi Penjualan ({filteredOrders.length})
                </h3>

                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari produk / pembeli..."
                    className="px-3.5 py-1.5 text-xs rounded-xl border border-[#E5E2D9] focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                  />
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-xl border border-[#E5E2D9] font-medium text-[#1F2A22]"
                  >
                    <option value="all">Semua Status</option>
                    <option value="completed">Selesai</option>
                    <option value="pending_verification">Verifikasi</option>
                    <option value="pending_payment">Menunggu Bayar</option>
                  </select>
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="p-10 text-center text-[#5B6660]">
                  <span className="material-symbols-outlined text-4xl mb-2 text-gray-400">shopping_bag</span>
                  <p className="text-sm font-semibold">Tidak ada transaksi yang cocok</p>
                  <p className="text-xs text-gray-400 mt-1">Pesanan produk digital atau fisik Anda akan tercatat di sini.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#FAF9F6] border-b border-[#E5E2D9] text-xs font-bold text-[#5B6660] uppercase">
                      <tr>
                        <th className="px-4 py-3">No. Ref</th>
                        <th className="px-4 py-3">Produk</th>
                        <th className="px-4 py-3">Pembeli</th>
                        <th className="px-4 py-3 text-right">Harga</th>
                        <th className="px-4 py-3 text-right">Pendapatan Anda (90%)</th>
                        <th className="px-4 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E5E2D9]">
                      {filteredOrders.map((sale) => {
                        const st = ORDER_STATUS[sale.status] || ORDER_STATUS.completed;
                        const price = sale.amount_idr || sale.product?.discount_price || sale.product?.price || 0;
                        const earned = sale.seller_amount || (price * 0.9);

                        return (
                          <tr key={sale.id} className="hover:bg-[#FAF9F6]/60 transition-colors">
                            <td className="px-4 py-3.5">
                              <p className="font-bold text-xs text-[#1F2A22]">{sale.reference_code}</p>
                              <p className="text-[10px] text-[#5B6660]">{dateStr(sale.created_at)}</p>
                            </td>
                            <td className="px-4 py-3.5 max-w-[220px]">
                              <p className="font-bold text-xs text-[#1F2A22] truncate">{sale.product?.title || 'Produk'}</p>
                              <span className="text-[10px] text-[#5B6660] uppercase">{sale.payment_method || 'Midtrans'}</span>
                            </td>
                            <td className="px-4 py-3.5">
                              <p className="font-semibold text-xs text-[#1F2A22]">{sale.buyer?.name || '-'}</p>
                              <p className="text-[10px] text-[#5B6660]">{sale.buyer?.email || '-'}</p>
                            </td>
                            <td className="px-4 py-3.5 text-right font-medium text-xs text-[#5B6660]">
                              {rupiah(price)}
                            </td>
                            <td className="px-4 py-3.5 text-right font-extrabold text-xs text-emerald-700">
                              {rupiah(earned)}
                            </td>
                            <td className="px-4 py-3.5 text-center">
                              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: st.bg, color: st.fg }}>
                                {st.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
