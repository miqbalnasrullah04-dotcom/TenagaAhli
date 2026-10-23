import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import coinImg from '../../assets/coin.png';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function formatPoints(n)  { return new Intl.NumberFormat('id-ID').format(Math.abs(n ?? 0)); }
function formatRupiah(v)  { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v ?? 0); }
function formatDate(iso)  {
  if (!iso) return '-';
  return new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Konstanta ────────────────────────────────────────────────────────────────
const STATUS_MAP = {
  pending:   { label: 'Menunggu',   color: '#7A5900', bg: '#FFF4D6' },
  success:   { label: 'Berhasil',   color: '#166534', bg: '#DCFCE7' },
  cancelled: { label: 'Dibatalkan', color: '#B3261E', bg: '#FFDAD6' },
  refunded:  { label: 'Direfund',   color: '#075985', bg: '#E0F2FE' },
};

const TYPE_LABELS = {
  topup:            'Top Up',
  product_purchase: 'Beli Produk',
  consultation:     'Konsultasi',
  refund:           'Refund',
  upgrade_premium:  'Upgrade Premium',
  renewal_premium:  'Renewal Premium',
};

const TABS = [
  { id: 'pending',      label: 'Top Up Pending',  icon: 'hourglass_top'  },
  { id: 'all',          label: 'Semua Transaksi',  icon: 'receipt_long'   },
  { id: 'packages',     label: 'Paket Top Up',     icon: 'inventory_2'    },
  { id: 'stats',        label: 'Statistik',        icon: 'bar_chart'      },
];

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

function StatCard({ icon, label, value, color = '#8B4513', bg = '#FFF8F4' }) {
  return (
    <div className="bg-white rounded-2xl border border-black/5 p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
        <span className="material-symbols-outlined text-[22px]" style={{ color }}>{icon}</span>
      </div>
      <div>
        <p className="text-xs text-gray-500 font-semibold">{label}</p>
        <p className="font-bold text-gray-900 text-lg leading-tight">{value}</p>
      </div>
    </div>
  );
}

// ─── Modal Konfirmasi ─────────────────────────────────────────────────────────
function ConfirmModal({ tx, onClose, onDone }) {
  const [notes,       setNotes]       = useState('');
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState('');

  const handleConfirm = async () => {
    setError('');
    setSubmitting(true);
    try {
      await api.post(`/admin/topup/${tx.reference_code}/confirm`, { notes });
      onDone('confirmed');
    } catch (e) {
      setError(e.response?.data?.message ?? 'Gagal mengkonfirmasi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">Konfirmasi Top Up</h3>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3 flex gap-2">
              <span className="material-symbols-outlined text-[16px] mt-0.5">error</span>
              {error}
            </div>
          )}
          <div className="bg-amber-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">User</span>
              <span className="font-bold">{tx.user?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Jumlah Point</span>
              <span className="font-bold text-green-700">+{formatPoints(tx.absolute_points)} Point</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Nilai Transfer</span>
              <span className="font-bold">{formatRupiah(tx.amount_idr)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Kode Ref</span>
              <span className="font-mono text-xs">{tx.reference_code}</span>
            </div>
          </div>

          {tx.proof_url && (
            <div>
              <p className="text-xs font-semibold text-gray-600 mb-2">Bukti Pembayaran</p>
              {tx.proof_url.endsWith('.pdf') ? (
                <a href={tx.proof_url} target="_blank" rel="noreferrer"
                  className="flex items-center gap-2 text-sm text-blue-600 hover:underline">
                  <span className="material-symbols-outlined text-[18px]">picture_as_pdf</span>
                  Lihat PDF Bukti
                </a>
              ) : (
                <img src={tx.proof_url} alt="Bukti" className="w-full max-h-48 object-contain rounded-xl border border-gray-200" />
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">Catatan Admin (opsional)</label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              placeholder="Misal: Transfer dikonfirmasi sesuai"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513] resize-none"
            />
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
            Batal
          </button>
          <button type="button" onClick={handleConfirm} disabled={submitting}
            className="flex-1 bg-green-600 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {submitting
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses…</>
              : <><span className="material-symbols-outlined text-[18px]">check_circle</span>Konfirmasi Top Up</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Batalkan / Refund ──────────────────────────────────────────────────
function ActionModal({ tx, action, onClose, onDone }) {
  const [reason,     setReason]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error,      setError]      = useState('');

  const isCancel = action === 'cancel';
  const isRefund = action === 'refund';

  const handleSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      const endpoint = isCancel
        ? `/admin/topup/${tx.reference_code}/cancel`
        : `/admin/topup/${tx.reference_code}/refund`;
      await api.post(endpoint, { reason, notes: reason });
      onDone(action);
    } catch (e) {
      setError(e.response?.data?.message ?? 'Gagal memproses.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-lg">
            {isCancel ? 'Batalkan Transaksi' : 'Refund Point'}
          </h3>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 text-red-700 text-sm rounded-xl p-3">{error}</div>
          )}
          <div className={`rounded-xl p-4 space-y-2 ${isCancel ? 'bg-red-50' : 'bg-purple-50'}`}>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">User</span>
              <span className="font-bold">{tx.user?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Point</span>
              <span className={`font-bold ${isRefund ? 'text-purple-700' : 'text-red-700'}`}>
                {isRefund ? '+' : ''}{formatPoints(tx.absolute_points)} Point
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Ref</span>
              <span className="font-mono text-xs">{tx.reference_code}</span>
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-600 mb-1.5 block">
              {isCancel ? 'Alasan Pembatalan' : 'Alasan Refund'} (opsional)
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={2}
              placeholder={isCancel ? 'Misal: Bukti tidak valid' : 'Misal: Pembelian dibatalkan'}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513] resize-none"
            />
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
            Batal
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting}
            className={`flex-1 text-white py-2.5 rounded-xl font-bold text-sm disabled:opacity-50 flex items-center justify-center gap-2 ${
              isCancel ? 'bg-red-600 hover:bg-red-700' : 'bg-purple-600 hover:bg-purple-700'
            }`}>
            {submitting
              ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Memproses…</>
              : isCancel
              ? <><span className="material-symbols-outlined text-[18px]">cancel</span>Batalkan</>
              : <><span className="material-symbols-outlined text-[18px]">undo</span>Refund Point</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────
export default function AdminTopUp() {
  const [tab,          setTab]          = useState('pending');
  const [transactions, setTransactions] = useState([]);
  const [stats,        setStats]        = useState(null);
  const [packages,     setPackages]     = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [pagination,   setPagination]   = useState(null);
  const [page,         setPage]         = useState(1);
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal,        setModal]        = useState(null); // { type: 'confirm'|'cancel'|'refund', tx }
  const [toast,        setToast]        = useState(null);

  // ── Package form ────────────────────────────────────────────────────────────
  const [pkgForm,      setPkgForm]      = useState(null);
  const [pkgSubmitting,setPkgSubmitting]= useState(false);

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const fetchData = async (tabId = tab, pageNum = 1) => {
    setLoading(true);
    try {
      if (tabId === 'stats') {
        const res = await api.get('/admin/topup/stats');
        setStats(res.data?.data ?? null);
        return;
      }
      if (tabId === 'packages') {
        const res = await api.get('/admin/topup/packages');
        setPackages(res.data?.data ?? []);
        return;
      }

      const params = new URLSearchParams({ page: pageNum, per_page: 20 });
      if (search)       params.append('search', search);
      if (typeFilter)   params.append('type', typeFilter);
      if (statusFilter) params.append('status', statusFilter);

      const endpoint = tabId === 'pending'
        ? `/admin/topup/pending?${params}`
        : `/admin/topup/transactions?${params}`;

      const res = await api.get(endpoint);
      setTransactions(res.data?.data?.data ?? res.data?.data ?? []);
      setPagination(res.data?.data ?? null);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(tab, 1); setPage(1); }, [tab]);
  useEffect(() => {
    if (tab !== 'stats' && tab !== 'packages') {
      const timer = setTimeout(() => { fetchData(tab, 1); setPage(1); }, 400);
      return () => clearTimeout(timer);
    }
  }, [search, typeFilter, statusFilter, tab]);

  // ── Toast ──────────────────────────────────────────────────────────────────
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Modal done ─────────────────────────────────────────────────────────────
  const handleModalDone = (action) => {
    setModal(null);
    const msgs = {
      confirmed: 'Top Up berhasil dikonfirmasi. Saldo Point user bertambah.',
      cancel: 'Transaksi berhasil dibatalkan.',
      refund: 'Refund Point berhasil dilakukan.',
    };
    showToast(msgs[action] ?? 'Aksi berhasil.');
    fetchData(tab, page);
  };

  // ── Package CRUD ───────────────────────────────────────────────────────────
  const handleSavePackage = async (e) => {
    e.preventDefault();
    setPkgSubmitting(true);
    try {
      if (pkgForm.id) {
        await api.put(`/admin/topup/packages/${pkgForm.id}`, pkgForm);
        showToast('Paket berhasil diperbarui.');
      } else {
        await api.post('/admin/topup/packages', pkgForm);
        showToast('Paket baru berhasil dibuat.');
      }
      setPkgForm(null);
      fetchData('packages');
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Gagal menyimpan paket.', 'error');
    } finally {
      setPkgSubmitting(false);
    }
  };

  const handleDeletePackage = async (pkg) => {
    if (!window.confirm(`Hapus/nonaktifkan paket "${pkg.name}"?`)) return;
    try {
      await api.delete(`/admin/topup/packages/${pkg.id}`);
      showToast('Paket berhasil dihapus/dinonaktifkan.');
      fetchData('packages');
    } catch (e) {
      showToast(e.response?.data?.message ?? 'Gagal menghapus paket.', 'error');
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 rounded-xl px-4 py-3 text-sm font-bold shadow-lg flex items-center gap-2 animate-fadeIn ${
          toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
        }`}>
          <span className="material-symbols-outlined text-[18px]">{toast.type === 'error' ? 'error' : 'check_circle'}</span>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-gray-900">Manajemen Top Up Point</h1>
          <p className="text-sm text-gray-500 mt-0.5">Konfirmasi Top Up, kelola transaksi Point, dan atur paket.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 overflow-x-auto no-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
              tab === t.id ? 'border-[#8B4513] text-[#8B4513]' : 'border-transparent text-gray-500 hover:text-[#8B4513]'
            }`}>
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-gray-500 py-10 justify-center">
          <span className="w-6 h-6 border-2 border-[#8B4513]/30 border-t-[#8B4513] rounded-full animate-spin" />
          Memuat data…
        </div>
      )}

      {/* ═══ TAB: STATISTIK ═══ */}
      {!loading && tab === 'stats' && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon="hourglass_top"   label="Top Up Pending"         value={stats.total_pending}                          color="#7A5900" bg="#FFF4D6" />
          <StatCard icon="check_circle"    label="Konfirmasi Hari Ini"    value={stats.total_success_today}                    color="#166534" bg="#DCFCE7" />
          <StatCard icon="payments"        label="Revenue Hari Ini"       value={formatRupiah(stats.total_revenue_today)}      color="#8B4513" bg="#FFF8F4" />
          <StatCard icon="calendar_month"  label="Revenue Bulan Ini"      value={formatRupiah(stats.total_revenue_month)}      color="#075985" bg="#E0F2FE" />
          <StatCard icon="toll"            label="Total Point Diterbitkan" value={`${formatPoints(stats.total_points_issued)} Pt`} color="#6B21A8" bg="#F3E8FF" />
          <StatCard icon="receipt_long"    label="Total Transaksi"        value={stats.total_transactions}                     color="#374151" bg="#F5F4F0" />
          <StatCard icon="shopping_bag"    label="Pembelian Produk"       value={stats.product_purchase_count}                 color="#8B4513" bg="#FFF8F4" />
          <StatCard icon="forum"           label="Konsultasi Berbayar"    value={stats.consultation_count}                     color="#2E5E3B" bg="#E3F2E7" />
        </div>
      )}

      {/* ═══ TAB: PAKET TOP UP ═══ */}
      {!loading && tab === 'packages' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setPkgForm({ name: '', points: '', price: '', description: '', is_active: true, is_popular: false, sort_order: 0 })}
              className="bg-[#8B4513] text-white px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-[#6B3410] flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Tambah Paket
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {packages.map(pkg => (
              <div key={pkg.id} className={`bg-white rounded-2xl border-2 p-5 ${pkg.is_active ? 'border-gray-100' : 'border-dashed border-gray-200 opacity-60'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <img src={coinImg} alt="Coin" className="w-9 h-9 object-contain drop-shadow-xs shrink-0" />
                    <div>
                      <p className="font-black text-gray-900 text-xl">{formatPoints(pkg.points)} <span className="text-sm font-semibold text-gray-500">Point</span></p>
                      <p className="font-bold text-[#8B4513]">{formatRupiah(pkg.price)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {pkg.is_popular && (
                      <span className="text-[10px] font-bold bg-[#8B4513] text-white px-2 py-0.5 rounded-full">Populer</span>
                    )}
                    {!pkg.is_active && (
                      <span className="text-[10px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-full">Nonaktif</span>
                    )}
                  </div>
                </div>
                {pkg.description && <p className="text-xs text-gray-500 mb-3 leading-relaxed">{pkg.description}</p>}
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  <button onClick={() => setPkgForm({ ...pkg })}
                    className="flex-1 text-xs font-semibold border border-gray-200 rounded-lg py-1.5 hover:bg-gray-50 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">edit</span> Edit
                  </button>
                  <button onClick={() => handleDeletePackage(pkg)}
                    className="flex-1 text-xs font-semibold border border-red-200 text-red-600 rounded-lg py-1.5 hover:bg-red-50 flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">delete</span>
                    {pkg.is_active ? 'Nonaktifkan' : 'Hapus'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Form tambah/edit paket */}
          {pkgForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
                <div className="p-5 border-b border-gray-100">
                  <h3 className="font-bold text-gray-900">{pkgForm.id ? 'Edit Paket' : 'Tambah Paket Top Up'}</h3>
                </div>
                <form onSubmit={handleSavePackage} className="p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Nama Paket *</label>
                      <input required value={pkgForm.name} onChange={e => setPkgForm(p => ({ ...p, name: e.target.value }))}
                        placeholder="100 Point" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Sort Order</label>
                      <input type="number" min="0" value={pkgForm.sort_order} onChange={e => setPkgForm(p => ({ ...p, sort_order: +e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Jumlah Point *</label>
                      <input required type="number" min="1" value={pkgForm.points} onChange={e => {
                        const pts = +e.target.value;
                        setPkgForm(p => ({
                          ...p,
                          points: pts,
                          price: !p.price || p.price === (p.points * 1000) ? pts * 1000 : p.price,
                        }));
                      }}
                        placeholder="100" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513]" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-600 mb-1 block">Harga (IDR) *</label>
                      <input required type="number" min="0" value={pkgForm.price} onChange={e => setPkgForm(p => ({ ...p, price: +e.target.value }))}
                        placeholder="100000" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513]" />
                      <p className="text-[10px] text-gray-400 mt-1">Standar: 1 Point = Rp 1.000</p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1 block">Deskripsi</label>
                    <textarea value={pkgForm.description ?? ''} onChange={e => setPkgForm(p => ({ ...p, description: e.target.value }))}
                      rows={2} placeholder="Deskripsi singkat paket..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#8B4513] resize-none" />
                  </div>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={pkgForm.is_active} onChange={e => setPkgForm(p => ({ ...p, is_active: e.target.checked }))} className="accent-[#8B4513] w-4 h-4" />
                      <span className="font-semibold text-gray-700">Aktif</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={pkgForm.is_popular} onChange={e => setPkgForm(p => ({ ...p, is_popular: e.target.checked }))} className="accent-[#8B4513] w-4 h-4" />
                      <span className="font-semibold text-gray-700">Tandai Populer</span>
                    </label>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setPkgForm(null)}
                      className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">Batal</button>
                    <button type="submit" disabled={pkgSubmitting}
                      className="flex-1 bg-[#8B4513] text-white py-2.5 rounded-xl font-bold text-sm hover:bg-[#6B3410] disabled:opacity-50">
                      {pkgSubmitting ? 'Menyimpan…' : 'Simpan Paket'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB: PENDING / ALL ═══ */}
      {!loading && (tab === 'pending' || tab === 'all') && (
        <div className="space-y-4">

          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Cari referensi, nama, email…"
              className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-[#8B4513]"
            />
            {tab === 'all' && (
              <>
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#8B4513] bg-white">
                  <option value="">Semua Tipe</option>
                  {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                  className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#8B4513] bg-white">
                  <option value="">Semua Status</option>
                  {Object.entries(STATUS_MAP).map(([v, d]) => <option key={v} value={v}>{d.label}</option>)}
                </select>
              </>
            )}
          </div>

          {/* Tabel */}
          {transactions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-gray-300 block mb-3">receipt_long</span>
              <p className="text-gray-500 text-sm">
                {tab === 'pending' ? 'Tidak ada Top Up yang menunggu konfirmasi.' : 'Tidak ada transaksi.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Referensi</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">User</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Tipe</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Point</th>
                      <th className="text-right px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">IDR</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Tanggal</th>
                      <th className="text-center px-4 py-3 text-xs font-bold text-gray-600 uppercase tracking-wide">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {transactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div>
                            <p className="font-mono text-xs text-blue-700 font-bold">{tx.reference_code}</p>
                            {tx.proof_url && (
                              <a href={tx.proof_url} target="_blank" rel="noreferrer"
                                className="text-[11px] text-green-600 flex items-center gap-0.5 mt-0.5 hover:underline">
                                <span className="material-symbols-outlined text-[12px]">attachment</span>Bukti
                              </a>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <p className="font-semibold text-gray-900 text-xs">{tx.user?.name ?? '-'}</p>
                          <p className="text-[11px] text-gray-500 truncate max-w-[140px]">{tx.user?.email ?? ''}</p>
                          {tx.user && <p className="text-[10px] text-[#8B4513] font-bold">{formatPoints(tx.user.point_balance)} Pt</p>}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-semibold text-gray-700">{TYPE_LABELS[tx.type] ?? tx.type}</span>
                          {tx.description && <p className="text-[11px] text-gray-400 truncate max-w-[120px]">{tx.description}</p>}
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <span className={`font-black ${tx.is_credit ? 'text-green-700' : 'text-red-600'}`}>
                            {tx.is_credit ? '+' : '-'}{formatPoints(tx.absolute_points)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          {tx.amount_idr > 0 ? (
                            <span className="font-semibold text-gray-700 text-xs">{formatRupiah(tx.amount_idr)}</span>
                          ) : <span className="text-gray-400">—</span>}
                        </td>
                        <td className="px-4 py-3.5"><StatusBadge status={tx.status} /></td>
                        <td className="px-4 py-3.5">
                          <p className="text-xs text-gray-600 whitespace-nowrap">{formatDate(tx.created_at)}</p>
                          {tx.verified_by && (
                            <p className="text-[10px] text-gray-400">oleh {tx.verified_by}</p>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Konfirmasi — hanya untuk Top Up pending */}
                            {tx.type === 'topup' && tx.status === 'pending' && (
                              <button
                                onClick={() => setModal({ type: 'confirm', tx })}
                                className="p-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors"
                                title="Konfirmasi Top Up"
                              >
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                              </button>
                            )}
                            {/* Batalkan — hanya pending */}
                            {tx.status === 'pending' && (
                              <button
                                onClick={() => setModal({ type: 'cancel', tx })}
                                className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                                title="Batalkan"
                              >
                                <span className="material-symbols-outlined text-[16px]">cancel</span>
                              </button>
                            )}
                            {/* Refund — hanya sukses */}
                            {tx.status === 'success' && (
                              <button
                                onClick={() => setModal({ type: 'refund', tx })}
                                className="p-1.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 transition-colors"
                                title="Refund Point"
                              >
                                <span className="material-symbols-outlined text-[16px]">undo</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination && pagination.last_page > 1 && (
                <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    Halaman {pagination.current_page} dari {pagination.last_page} ({pagination.total} data)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { const p = page - 1; setPage(p); fetchData(tab, p); }}
                      disabled={page <= 1}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                    >‹ Prev</button>
                    <button
                      onClick={() => { const p = page + 1; setPage(p); fetchData(tab, p); }}
                      disabled={page >= pagination.last_page}
                      className="px-3 py-1.5 text-xs font-semibold border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40"
                    >Next ›</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {modal?.type === 'confirm' && (
        <ConfirmModal tx={modal.tx} onClose={() => setModal(null)} onDone={handleModalDone} />
      )}
      {(modal?.type === 'cancel' || modal?.type === 'refund') && (
        <ActionModal tx={modal.tx} action={modal.type} onClose={() => setModal(null)} onDone={handleModalDone} />
      )}
    </div>
  );
}
