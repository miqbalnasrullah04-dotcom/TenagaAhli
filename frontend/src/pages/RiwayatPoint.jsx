import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import coinImg from '../assets/coin.png';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatPoints(n) {
  return new Intl.NumberFormat('id-ID').format(Math.abs(n ?? 0));
}
function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v ?? 0);
}
function formatDate(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Konstanta ────────────────────────────────────────────────────────────────
const TYPE_FILTERS = [
  { value: '',                   label: 'Semua'     },
  { value: 'topup',              label: 'Top Up'    },
  { value: 'product_purchase',   label: 'Produk'    },
  { value: 'consultation',       label: 'Konsultasi'},
  { value: 'refund',             label: 'Refund'    },
];

const STATUS_MAP = {
  pending:   { label: 'Menunggu',   color: '#7A5900', bg: '#FFF4D6' },
  success:   { label: 'Berhasil',   color: '#166534', bg: '#DCFCE7' },
  cancelled: { label: 'Dibatalkan', color: '#B3261E', bg: '#FFDAD6' },
  refunded:  { label: 'Direfund',   color: '#075985', bg: '#E0F2FE' },
};

// ─── Sub-komponen ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const d = STATUS_MAP[status] ?? { label: status, color: '#414844', bg: '#F5F4F0' };
  return (
    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full whitespace-nowrap"
      style={{ color: d.color, backgroundColor: d.bg }}>
      {d.label}
    </span>
  );
}

function TypeIcon({ type }) {
  const map = {
    topup:            { icon: 'add_circle',   color: '#166534', bg: '#DCFCE7' },
    product_purchase: { icon: 'shopping_bag', color: '#8B4513', bg: '#FFF8F4' },
    consultation:     { icon: 'forum',        color: '#075985', bg: '#E0F2FE' },
    refund:           { icon: 'undo',         color: '#6B21A8', bg: '#F3E8FF' },
    upgrade_premium:  { icon: 'star',         color: '#D97706', bg: '#FFF4E6' },
    renewal_premium:  { icon: 'autorenew',    color: '#D97706', bg: '#FFF4E6' },
  };
  const d = map[type] ?? { icon: 'toll', color: '#5B6660', bg: '#F5F4F0' };
  return (
    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: d.bg }}>
      <span className="material-symbols-outlined text-[20px]" style={{ color: d.color }}>{d.icon}</span>
    </div>
  );
}

function SummaryCard({ icon, label, value, bg, fg }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <span className="material-symbols-outlined text-[22px]" style={{ color: fg }}>{icon}</span>
      </div>
      <div>
        <p className="text-[11px] text-[#5B6660] font-semibold">{label}</p>
        <p className="font-bold text-[#1F2A22] text-base leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────
export default function RiwayatPoint() {
  const [transactions, setTransactions]   = useState([]);
  const [summary,      setSummary]        = useState(null);
  const [loading,      setLoading]        = useState(true);
  const [loadingMore,  setLoadingMore]    = useState(false);
  const [pagination,   setPagination]     = useState(null);
  const [typeFilter,   setTypeFilter]     = useState('');
  const [page,         setPage]           = useState(1);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const fetchHistory = async (pageNum = 1, type = '', append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    try {
      const params = new URLSearchParams({ per_page: 20, page: pageNum });
      if (type) params.append('type', type);
      const res = await api.get(`/topup/history?${params}`);
      const newTx = res.data?.data?.data ?? [];
      if (append) {
        setTransactions(prev => [...prev, ...newTx]);
      } else {
        setTransactions(newTx);
        setSummary(res.data?.summary ?? null);
      }
      setPagination(res.data?.data ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => { fetchHistory(1, typeFilter); setPage(1); }, [typeFilter]);

  const handleLoadMore = async () => {
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchHistory(nextPage, typeFilter, true);
  };

  const hasMore = pagination && pagination.current_page < pagination.last_page;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout title="Riwayat Point" subtitle="Semua aktivitas saldo Point Anda.">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#8B4513]/20 border-t-[#8B4513] rounded-full animate-spin mb-3" />
          <p className="text-sm text-[#5B6660]">Memuat riwayat Point…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Riwayat Point"
      subtitle="Semua aktivitas saldo Point Anda — Top Up, pembelian, konsultasi, dan refund."
    >
      <div className="w-full max-w-2xl mx-auto space-y-5">

        {/* Saldo Point + Ringkasan */}
        {summary && (
          <>
            {/* Hero saldo */}
            <div className="relative overflow-hidden rounded-2xl text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #8B4513, #654321)' }}>
              <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
              <div className="relative p-5 flex items-center justify-between">
                <div>
                  <p className="text-xs opacity-80 mb-1">Saldo Point Anda</p>
                  <div className="flex items-end gap-2 mb-4">
                    <p className="text-4xl font-black">{formatPoints(summary.point_balance)}</p>
                    <p className="text-lg opacity-80 mb-0.5">Point</p>
                  </div>
                  <Link
                    to="/top-up"
                    className="inline-flex items-center gap-2 bg-white text-[#8B4513] px-4 py-2 rounded-xl font-bold text-sm hover:bg-white/95 transition-colors shadow"
                  >
                    <span className="material-symbols-outlined text-[18px]">add_circle</span>
                    Top Up Point
                  </Link>
                </div>
                <div className="relative group/coin shrink-0 hidden xs:flex items-center justify-center cursor-pointer select-none">
                  <div className="absolute inset-0 rounded-2xl bg-amber-400/30 blur-md animate-coin-aura pointer-events-none" />
                  <div className="relative bg-white/20 hover:bg-white/30 p-3 rounded-2xl backdrop-blur-sm shadow-inner border border-white/25 overflow-hidden transition-all duration-300 group-hover/coin:scale-105">
                    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                      <div className="w-1/2 h-[200%] -top-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-coin-shine" />
                    </div>
                    <img src={coinImg} alt="Coin" className="w-16 h-16 object-contain animate-coin-float transition-transform duration-300 group-hover/coin:scale-110" />
                  </div>
                </div>
              </div>
            </div>

            {/* Stats ringkasan */}
            <div className="grid grid-cols-2 gap-3">
              <SummaryCard
                icon="add_circle"
                label="Total Top Up"
                value={`+${formatPoints(summary.total_top_up)} Pt`}
                bg="#DCFCE7"
                fg="#166534"
              />
              <SummaryCard
                icon="remove_circle"
                label="Total Terpakai"
                value={`-${formatPoints(summary.total_spent)} Pt`}
                bg="#FFF4D6"
                fg="#7A5900"
              />
              <SummaryCard
                icon="undo"
                label="Total Refund"
                value={`+${formatPoints(summary.total_refund)} Pt`}
                bg="#F3E8FF"
                fg="#6B21A8"
              />
              <SummaryCard
                icon="hourglass_top"
                label="Top Up Pending"
                value={`${summary.pending_top_up} transaksi`}
                bg="#E0F2FE"
                fg="#075985"
              />
            </div>
          </>
        )}

        {/* Filter Tipe */}
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              type="button"
              onClick={() => setTypeFilter(f.value)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
                typeFilter === f.value
                  ? 'bg-[#8B4513] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-[#5B6660] hover:border-[#8B4513]/40 hover:text-[#8B4513]'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Daftar Transaksi */}
        {transactions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-black/5 p-10 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 block mb-3">receipt_long</span>
            <p className="text-sm text-[#5B6660] mb-1 font-semibold">Belum ada transaksi</p>
            <p className="text-xs text-[#5B6660] mb-5">
              {typeFilter ? 'Tidak ada transaksi dengan filter ini.' : 'Mulai dengan melakukan Top Up Point.'}
            </p>
            <Link
              to="/top-up"
              className="inline-flex items-center gap-2 bg-[#8B4513] text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-[#6B3410] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Top Up Sekarang
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {transactions.map(tx => (
              <div key={tx.id} className="bg-white rounded-2xl border border-black/5 p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-start gap-3">
                  <TypeIcon type={tx.type} />
                  <div className="flex-1 min-w-0">
                    {/* Baris atas: label tipe + jumlah point */}
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-bold text-[#1F2A22] text-sm leading-tight">{tx.type_label}</p>
                      <p className={`font-black text-base shrink-0 ${tx.is_credit ? 'text-[#166534]' : 'text-[#B3261E]'}`}>
                        {tx.is_credit ? '+' : '-'}{formatPoints(tx.absolute_points)}
                        <span className="text-xs font-semibold ml-0.5">Pt</span>
                      </p>
                    </div>

                    {/* Deskripsi */}
                    {tx.description && (
                      <p className="text-xs text-[#5B6660] mt-0.5 truncate">{tx.description}</p>
                    )}

                    {/* Baris bawah: status + tanggal */}
                    <div className="flex items-center justify-between mt-2 gap-2">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={tx.status} />
                        {tx.amount_idr > 0 && (
                          <span className="text-[11px] text-[#5B6660] font-mono">{formatRupiah(tx.amount_idr)}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#5B6660] shrink-0">{formatDate(tx.created_at)}</p>
                    </div>

                    {/* Kode referensi */}
                    <p className="text-[10px] text-[#5B6660]/70 font-mono mt-1">{tx.reference_code}</p>

                    {/* Jika Top Up pending dan sudah upload bukti → info */}
                    {tx.type === 'topup' && tx.status === 'pending' && (
                      <div className="mt-2 bg-[#FFF4D6] rounded-lg px-3 py-2 flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-[#7A5900]">hourglass_top</span>
                        <p className="text-xs text-[#7A5900]">Menunggu konfirmasi admin</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Load More */}
            {hasMore && (
              <button
                type="button"
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="w-full py-3 border border-gray-200 rounded-xl text-sm text-[#5B6660] font-semibold hover:border-[#8B4513]/40 hover:text-[#8B4513] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loadingMore
                  ? <><span className="w-4 h-4 border-2 border-[#8B4513]/30 border-t-[#8B4513] rounded-full animate-spin" /> Memuat…</>
                  : <><span className="material-symbols-outlined text-[18px]">expand_more</span> Muat Lebih Banyak</>}
              </button>
            )}
          </div>
        )}

        {/* CTA Top Up */}
        {transactions.length > 0 && (
          <div className="pt-2 pb-4 text-center">
            <Link
              to="/top-up"
              className="inline-flex items-center gap-2 bg-[#8B4513] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#6B3410] transition-colors shadow-md"
            >
              <span className="material-symbols-outlined text-[18px]">add_circle</span>
              Top Up Point
            </Link>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
