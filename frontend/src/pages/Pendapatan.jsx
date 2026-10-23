import { useEffect, useState } from 'react';
import { useTranslation } from '../context/LanguageContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import api from '../api/client.js';
import { SkeletonPendapatan } from '../components/Skeleton.jsx';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BRAND_BROWN      = '#8B4513';
const BRAND_BROWN_DARK = '#654321';
const BRAND_GREEN      = '#2E5E3B';

export default function Pendapatan() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  
  // Modal Tarik Dana state
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchEarnings = async () => {
    setLoading(true);
    try {
      const [earningsRes, wdRes] = await Promise.all([
        api.get('/my/earnings'),
        api.get('/my/withdrawals'),
      ]);

      if (earningsRes.data?.success) {
        setData(earningsRes.data.data);
      }
      if (wdRes.data?.success) {
        setWithdrawals(wdRes.data.data || []);
      }
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEarnings();
  }, []);

  const handleWithdrawSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.post('/my/withdrawals', {
        amount: Number(amount),
        bank_name: bankName,
        account_number: accountNumber,
        account_holder_name: accountHolderName,
        notes: notes,
      });

      setFeedback({ type: 'success', message: res.data?.message || 'Pengajuan penarikan berhasil dikirim!' });
      setShowWithdrawModal(false);
      setAmount('');
      setAccountNumber('');
      setAccountHolderName('');
      setNotes('');
      fetchEarnings();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal mengajukan penarikan dana.' });
    } finally {
      setSubmitting(false);
    }
  };

  const rupiah = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

  const dateStr = (s) =>
    s ? new Date(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-';

  if (loading && !data) {
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
            <h1 className="text-2xl font-bold text-[#1F2A22]">Laporan Pendapatan & Saldo</h1>
            <p className="text-sm text-[#5B6660]">Pantau hasil penjualan produk, komisi platform, dan pencairan saldo dompet</p>
          </div>
          <button
            onClick={() => setShowWithdrawModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-bold text-sm shadow-md transition-all self-start hover:opacity-95"
            style={{ background: `linear-gradient(135deg, ${BRAND_BROWN}, ${BRAND_BROWN_DARK})` }}
          >
            <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
            Tarik Dana (Payout)
          </button>
        </div>

        {feedback && (
          <div
            className={`p-4 rounded-xl flex items-center justify-between gap-3 text-sm font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">
                {feedback.type === 'success' ? 'check_circle' : 'error'}
              </span>
              {feedback.message}
            </div>
            <button onClick={() => setFeedback(null)} className="opacity-70 hover:opacity-100">
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        )}

        {loading ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
              ))}
            </div>
            <div className="h-64 bg-gray-100 rounded-2xl animate-pulse"></div>
          </div>
        ) : (
          <>
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Saldo Dompet (Highlight) */}
              <div
                className="p-5 rounded-2xl text-white shadow-md flex flex-col justify-between"
                style={{ background: `linear-gradient(135deg, ${BRAND_BROWN}, ${BRAND_BROWN_DARK})` }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-white/80 uppercase tracking-wider">Saldo Siap Tarik</p>
                    <p className="text-2xl font-black mt-1">{rupiah(data?.wallet_balance)}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-white/15">
                    <span className="material-symbols-outlined text-xl">wallet</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-xs text-white/80">
                  <span>Pending Payout:</span>
                  <span className="font-bold text-white">{rupiah(data?.pending_withdrawal_amount)}</span>
                </div>
              </div>

              {/* Card 2: Total Pendapatan Bersih */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5E2D9] shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#5B6660] uppercase tracking-wider">Total Pendapatan Bersih</p>
                    <p className="text-2xl font-extrabold text-[#1F2A22] mt-1">{rupiah(data?.total_net_revenue)}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                    <span className="material-symbols-outlined text-xl">payments</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E5E2D9] flex items-center justify-between text-xs text-[#5B6660]">
                  <span>Total Penjualan:</span>
                  <span className="font-bold text-[#1F2A22]">{data?.total_sales_count || 0} Transaksi</span>
                </div>
              </div>

              {/* Card 3: Bulan Ini */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5E2D9] shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#5B6660] uppercase tracking-wider">Bulan Ini</p>
                    <p className="text-2xl font-extrabold text-emerald-700 mt-1">{rupiah(data?.current_month?.total_net)}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 text-amber-700">
                    <span className="material-symbols-outlined text-xl">calendar_today</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E5E2D9] flex items-center justify-between text-xs text-[#5B6660]">
                  <span>Bulan Lalu:</span>
                  <span className="font-bold text-[#1F2A22]">{rupiah(data?.last_month?.total_net)}</span>
                </div>
              </div>

              {/* Card 4: Sudah Dicairkan */}
              <div className="p-5 rounded-2xl bg-white border border-[#E5E2D9] shadow-sm flex flex-col justify-between">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#5B6660] uppercase tracking-wider">Total Dana Dicairkan</p>
                    <p className="text-2xl font-extrabold text-[#1F2A22] mt-1">{rupiah(data?.total_withdrawn)}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 text-blue-700">
                    <span className="material-symbols-outlined text-xl">check_circle</span>
                  </div>
                </div>
                <div className="mt-4 pt-3 border-t border-[#E5E2D9] flex items-center justify-between text-xs text-[#5B6660]">
                  <span>Bagi Hasil Penjual:</span>
                  <span className="font-bold text-emerald-600">90% Bersih</span>
                </div>
              </div>
            </div>

            {/* Riwayat Transaksi & Riwayat Penarikan */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Kolom Kiri: Riwayat Transaksi Riil */}
              <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E5E2D9] shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold text-[#1F2A22] flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg text-[#8B4513]">history</span>
                    Riwayat Transaksi & Aktivitas Keuangan
                  </h3>
                  <span className="text-xs text-[#5B6660]">20 Terakhir</span>
                </div>

                {(!data?.recent_transactions || data.recent_transactions.length === 0) ? (
                  <div className="p-8 text-center text-[#5B6660]">
                    <span className="material-symbols-outlined text-3xl mb-1 text-gray-400">receipt_long</span>
                    <p className="text-sm font-semibold">Belum ada riwayat transaksi</p>
                    <p className="text-xs text-gray-400">Penjualan karya atau pencairan dana akan dicatat otomatis di sini.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#E5E2D9] max-h-[480px] overflow-y-auto pr-1">
                    {data.recent_transactions.map((tx) => (
                      <div key={tx.id} className="py-3.5 flex items-center justify-between gap-3 hover:bg-[#FAF9F6] px-2 rounded-xl transition-colors">
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              tx.type === 'sale'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <span className="material-symbols-outlined text-lg">
                              {tx.type === 'sale' ? 'shopping_cart' : 'arrow_upward'}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-[#1F2A22] truncate">{tx.title}</p>
                            <p className="text-xs text-[#5B6660] truncate">{tx.buyer} • {dateStr(tx.date)}</p>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p
                            className={`text-sm font-extrabold ${
                              tx.net > 0 ? 'text-emerald-600' : 'text-[#1F2A22]'
                            }`}
                          >
                            {tx.net > 0 ? `+${rupiah(tx.net)}` : rupiah(tx.net)}
                          </p>
                          <span
                            className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              tx.status === 'completed' || tx.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700'
                                : tx.status === 'rejected'
                                ? 'bg-rose-50 text-rose-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Kolom Kanan: Status Penarikan Dana Saya */}
              <div className="bg-white rounded-2xl border border-[#E5E2D9] shadow-sm p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-[#1F2A22] flex items-center gap-2">
                      <span className="material-symbols-outlined text-lg text-[#8B4513]">account_balance</span>
                      Daftar Penarikan Saya
                    </h3>
                  </div>

                  {withdrawals.length === 0 ? (
                    <div className="p-8 text-center text-[#5B6660]">
                      <span className="material-symbols-outlined text-3xl mb-1 text-gray-400">hourglass_empty</span>
                      <p className="text-sm font-semibold">Belum ada pengajuan</p>
                      <p className="text-xs text-gray-400 mt-1">Gunakan tombol "Tarik Dana" di atas untuk mencairkan saldo dompet Anda.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-[#E5E2D9] space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {withdrawals.map((w) => (
                        <div key={w.id} className="pt-2 pb-2 text-xs">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-[#1F2A22]">{w.ref}</p>
                              <p className="text-[#5B6660]">{w.bank_name} - {w.account_number}</p>
                              <p className="text-[#5B6660]">a.n {w.account_holder_name}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-extrabold text-sm text-[#1F2A22]">{rupiah(w.amount)}</p>
                              <span
                                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold mt-1 ${
                                  w.status === 'approved'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : w.status === 'rejected'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {w.status === 'approved' ? '✓ Selesai' : w.status === 'rejected' ? '✕ Ditolak' : '⏳ Pending'}
                              </span>
                            </div>
                          </div>
                          {w.admin_notes && (
                            <p className="text-[11px] text-gray-500 bg-[#FAF9F6] p-2 rounded-lg mt-1.5 border border-[#E5E2D9]">
                              <strong>Catatan Admin:</strong> {w.admin_notes}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-[#E5E2D9] text-xs text-[#5B6660] bg-[#FAF9F6] p-3 rounded-xl">
                  <p className="font-semibold text-[#1F2A22] mb-1">Informasi Pencairan Dana:</p>
                  <ul className="list-disc pl-4 space-y-0.5">
                    <li>Minimal penarikan adalah <strong>Rp 50.000</strong>.</li>
                    <li>Proses transfer rekening bank memakan waktu 1x24 jam kerja.</li>
                    <li>Pastikan nama pemilik rekening sesuai dengan data identitas.</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* MODAL TARIK DANA */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E2D9]">
            <div className="flex items-center justify-between pb-3 border-b border-[#E5E2D9]">
              <h3 className="text-lg font-bold text-[#1F2A22] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8B4513]">account_balance_wallet</span>
                Ajukan Penarikan Dana
              </h3>
              <button onClick={() => setShowWithdrawModal(false)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleWithdrawSubmit} className="mt-4 space-y-4">
              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-900">
                Saldo dompet tersedia: <strong>{rupiah(data?.wallet_balance)}</strong>. Minimal tarik: <strong>Rp 50.000</strong>.
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                  Nominal Penarikan (Rp) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="50000"
                  max={data?.wallet_balance || 0}
                  step="1000"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Contoh: 150000"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                  Nama Bank <span className="text-rose-500">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                >
                  <option value="BCA">Bank BCA</option>
                  <option value="Mandiri">Bank Mandiri</option>
                  <option value="BNI">Bank BNI</option>
                  <option value="BRI">Bank BRI</option>
                  <option value="BSI">Bank Syariah Indonesia (BSI)</option>
                  <option value="CIMB Niaga">Bank CIMB Niaga</option>
                  <option value="Permata">Bank Permata</option>
                  <option value="DANA">E-Wallet DANA</option>
                  <option value="GoPay">E-Wallet GoPay</option>
                  <option value="OVO">E-Wallet OVO</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                  Nomor Rekening / No E-Wallet <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Contoh: 1234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                  Nama Pemilik Rekening <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  placeholder="Sesuai buku tabungan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Keterangan opsional"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E2D9]">
                <button
                  type="button"
                  onClick={() => setShowWithdrawModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E2D9] text-sm font-semibold text-[#5B6660] hover:bg-[#FAF9F6]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting || (Number(amount) > (data?.wallet_balance || 0))}
                  className="px-5 py-2.5 rounded-xl bg-[#8B4513] hover:bg-[#654321] text-white text-sm font-bold shadow-md transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {submitting ? 'Mengirim...' : 'Ajukan Penarikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
