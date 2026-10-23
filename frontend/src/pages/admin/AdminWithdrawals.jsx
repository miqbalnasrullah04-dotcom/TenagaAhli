import { useEffect, useState } from 'react';
import { useTranslation } from '../../context/LanguageContext.jsx';
import api from '../../api/client.js';

export default function AdminWithdrawals() {
  const { t } = useTranslation();
  const [withdrawals, setWithdrawals] = useState([]);
  const [stats, setStats] = useState({
    total_requests: 0,
    pending_count: 0,
    pending_amount: 0,
    approved_count: 0,
    approved_amount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedWd, setSelectedWd] = useState(null);
  const [modalType, setModalType] = useState(null); // 'approve' | 'reject' | 'detail'
  const [proofFile, setProofFile] = useState(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/withdrawals', {
        params: filterStatus !== 'all' ? { status: filterStatus } : {},
      });
      if (res.data?.success) {
        setWithdrawals(res.data.data || []);
        if (res.data.stats) setStats(res.data.stats);
      }
    } catch (err) {
      console.error('Error loading withdrawals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [filterStatus]);

  const handleApprove = async (e) => {
    e.preventDefault();
    if (!selectedWd) return;
    setSubmitting(true);
    setFeedback(null);

    const formData = new FormData();
    if (proofFile) formData.append('proof_image', proofFile);
    if (adminNotes) formData.append('admin_notes', adminNotes);

    try {
      const res = await api.post(`/admin/withdrawals/${selectedWd.id}/approve`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFeedback({ type: 'success', message: res.data?.message || 'Penarikan dana berhasil disetujui!' });
      setModalType(null);
      setSelectedWd(null);
      setProofFile(null);
      setAdminNotes('');
      fetchWithdrawals();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal menyetujui penarikan dana.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!selectedWd) return;
    if (!adminNotes.trim()) {
      setFeedback({ type: 'error', message: 'Alasan penolakan wajib diisi.' });
      return;
    }

    setSubmitting(true);
    setFeedback(null);

    try {
      const res = await api.post(`/admin/withdrawals/${selectedWd.id}/reject`, {
        admin_notes: adminNotes,
      });
      setFeedback({ type: 'success', message: res.data?.message || 'Penarikan dana ditolak dan saldo dikembalikan.' });
      setModalType(null);
      setSelectedWd(null);
      setAdminNotes('');
      fetchWithdrawals();
    } catch (err) {
      setFeedback({ type: 'error', message: err.response?.data?.message || 'Gagal menolak penarikan dana.' });
    } finally {
      setSubmitting(false);
    }
  };

  const rupiah = (num) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num || 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1F2A22]">Verifikasi Penarikan Dana (Payout)</h1>
          <p className="text-sm text-[#5B6660]">Kelola dan setujui pencairan saldo dompet tenaga ahli ke rekening bank</p>
        </div>
        <button
          onClick={fetchWithdrawals}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-[#E5E2D9] rounded-xl text-sm font-semibold text-[#1F2A22] hover:bg-[#FAF9F6] transition-colors self-start shadow-sm"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Segarkan Data
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#E5E2D9] shadow-sm">
          <p className="text-xs font-semibold text-[#5B6660] uppercase tracking-wider mb-1">Total Permintaan</p>
          <p className="text-2xl font-bold text-[#1F2A22]">{stats.total_requests} Pengajuan</p>
        </div>
        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 shadow-sm">
          <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">Menunggu Diproses</p>
          <p className="text-2xl font-bold text-amber-900">{stats.pending_count} Pengajuan</p>
          <p className="text-xs font-medium text-amber-700 mt-1">{rupiah(stats.pending_amount)}</p>
        </div>
        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-sm">
          <p className="text-xs font-semibold text-emerald-800 uppercase tracking-wider mb-1">Berhasil Ditransfer</p>
          <p className="text-2xl font-bold text-emerald-900">{stats.approved_count} Penarikan</p>
          <p className="text-xs font-medium text-emerald-700 mt-1">{rupiah(stats.approved_amount)}</p>
        </div>
        <div className="bg-rose-50 p-5 rounded-2xl border border-rose-200 shadow-sm">
          <p className="text-xs font-semibold text-rose-800 uppercase tracking-wider mb-1">Ditolak / Batal</p>
          <p className="text-2xl font-bold text-rose-900">{stats.rejected_count || 0} Pengajuan</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#E5E2D9] pb-3">
        {[
          { id: 'all', label: 'Semua' },
          { id: 'pending', label: 'Menunggu Konfirmasi' },
          { id: 'approved', label: 'Disetujui' },
          { id: 'rejected', label: 'Ditolak' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
              filterStatus === tab.id
                ? 'bg-[#8B4513] text-white shadow-sm'
                : 'bg-white border border-[#E5E2D9] text-[#5B6660] hover:bg-[#FAF9F6]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-[#E5E2D9] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-[#5B6660]">
            <span className="material-symbols-outlined animate-spin text-3xl mb-2 text-[#8B4513]">progress_activity</span>
            <p className="text-sm">Memuat data penarikan dana...</p>
          </div>
        ) : withdrawals.length === 0 ? (
          <div className="p-12 text-center text-[#5B6660]">
            <span className="material-symbols-outlined text-4xl mb-2 text-gray-400">account_balance_wallet</span>
            <p className="text-sm font-semibold">Tidak ada data penarikan dana</p>
            <p className="text-xs text-gray-400 mt-1">Pengajuan baru dari tenaga ahli akan muncul di sini.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#FAF9F6] border-b border-[#E5E2D9] text-xs font-bold text-[#5B6660] uppercase">
                <tr>
                  <th className="px-5 py-3.5">Ref / Tanggal</th>
                  <th className="px-5 py-3.5">Tenaga Ahli</th>
                  <th className="px-5 py-3.5">Bank & Rekening Tujuan</th>
                  <th className="px-5 py-3.5 text-right">Nominal</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E2D9]">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-[#FAF9F6]/60 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#1F2A22]">{w.ref}</p>
                      <p className="text-xs text-[#5B6660]">{w.created_at}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-bold text-[#1F2A22]">{w.expert?.name || w.user?.name}</p>
                      <p className="text-xs text-[#5B6660]">{w.user?.email || w.user?.phone || '-'}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[#8B4513]">{w.bank_name}</p>
                      <p className="font-mono text-xs text-[#1F2A22] font-bold">{w.account_number}</p>
                      <p className="text-xs text-[#5B6660]">a.n {w.account_holder_name}</p>
                    </td>
                    <td className="px-5 py-4 text-right font-extrabold text-[#1F2A22]">
                      {rupiah(w.amount)}
                    </td>
                    <td className="px-5 py-4 text-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          w.status === 'approved'
                            ? 'bg-emerald-100 text-emerald-800'
                            : w.status === 'rejected'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {w.status === 'approved' ? '✓ Disetujui' : w.status === 'rejected' ? '✕ Ditolak' : '⏳ Pending'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <div className="inline-flex items-center gap-1.5">
                        {w.status === 'pending' ? (
                          <>
                            <button
                              onClick={() => {
                                setSelectedWd(w);
                                setModalType('approve');
                              }}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
                              title="Setujui & Transfer"
                            >
                              <span className="material-symbols-outlined text-sm">check</span>
                              Transfer
                            </button>
                            <button
                              onClick={() => {
                                setSelectedWd(w);
                                setModalType('reject');
                              }}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Tolak"
                            >
                              <span className="material-symbols-outlined text-sm">close</span>
                              Tolak
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedWd(w);
                              setModalType('detail');
                            }}
                            className="px-3 py-1.5 bg-white border border-[#E5E2D9] hover:bg-[#FAF9F6] text-[#1F2A22] rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-sm">visibility</span>
                            Detail
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL APPROVE */}
      {modalType === 'approve' && selectedWd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E2D9]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E2D9]">
              <h3 className="text-lg font-bold text-[#1F2A22] flex items-center gap-2">
                <span className="material-symbols-outlined text-emerald-600">verified</span>
                Konfirmasi Transfer Penarikan Dana
              </h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleApprove} className="mt-4 space-y-4">
              <div className="bg-[#FAF9F6] p-4 rounded-xl border border-[#E5E2D9] space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#5B6660]">Tenaga Ahli:</span>
                  <span className="font-bold text-[#1F2A22]">{selectedWd.expert?.name || selectedWd.user?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6660]">Rekening Tujuan:</span>
                  <span className="font-bold text-[#8B4513]">{selectedWd.bank_name} - {selectedWd.account_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#5B6660]">Nama Pemilik:</span>
                  <span className="font-bold text-[#1F2A22]">{selectedWd.account_holder_name}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#E5E2D9]">
                  <span className="text-[#5B6660] font-bold">Nominal yang Ditransfer:</span>
                  <span className="text-base font-extrabold text-emerald-600">{rupiah(selectedWd.amount)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                  Upload Bukti Transfer Bank (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setProofFile(e.target.files[0])}
                  className="w-full text-xs text-[#5B6660] file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#8B4513] file:text-white hover:file:bg-[#654321]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                  Catatan Admin
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Contoh: Transfer via BCA Berhasil No Ref 12345"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-[#8B4513]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E2D9]">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E2D9] text-sm font-semibold text-[#5B6660] hover:bg-[#FAF9F6]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  {submitting ? 'Memproses...' : 'Setujui & Selesaikan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL REJECT */}
      {modalType === 'reject' && selectedWd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E2D9]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E2D9]">
              <h3 className="text-lg font-bold text-rose-700 flex items-center gap-2">
                <span className="material-symbols-outlined">cancel</span>
                Tolak Penarikan Dana
              </h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <form onSubmit={handleReject} className="mt-4 space-y-4">
              <p className="text-sm text-[#5B6660]">
                Saldo sebesar <strong className="text-[#1F2A22]">{rupiah(selectedWd.amount)}</strong> akan otomatis dikembalikan ke dompet tenaga ahli <strong>{selectedWd.expert?.name || selectedWd.user?.name}</strong>.
              </p>

              <div>
                <label className="block text-xs font-bold text-[#1F2A22] uppercase tracking-wider mb-1">
                  Alasan Penolakan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Contoh: Nomor rekening tidak sesuai dengan nama pemilik, silakan ajukan ulang."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#E5E2D9] text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-[#E5E2D9]">
                <button
                  type="button"
                  onClick={() => setModalType(null)}
                  className="px-4 py-2.5 rounded-xl border border-[#E5E2D9] text-sm font-semibold text-[#5B6660] hover:bg-[#FAF9F6]"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-bold shadow-md transition-all"
                >
                  {submitting ? 'Memproses...' : 'Tolak & Kembalikan Saldo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DETAIL */}
      {modalType === 'detail' && selectedWd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E5E2D9]">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E2D9]">
              <h3 className="text-lg font-bold text-[#1F2A22]">Detail Penarikan {selectedWd.ref}</h3>
              <button onClick={() => setModalType(null)} className="text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-[#E5E2D9]">
                <span className="text-[#5B6660]">Status:</span>
                <span className="font-bold">{selectedWd.status}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5E2D9]">
                <span className="text-[#5B6660]">Nominal:</span>
                <span className="font-bold text-emerald-700">{rupiah(selectedWd.amount)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5E2D9]">
                <span className="text-[#5B6660]">Bank & Rekening:</span>
                <span className="font-bold text-right">{selectedWd.bank_name} - {selectedWd.account_number} ({selectedWd.account_holder_name})</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#E5E2D9]">
                <span className="text-[#5B6660]">Catatan Admin:</span>
                <span className="font-medium text-right">{selectedWd.admin_notes || '-'}</span>
              </div>
              {selectedWd.proof_image && (
                <div className="pt-2">
                  <p className="text-xs font-bold text-[#5B6660] mb-2">Bukti Transfer:</p>
                  <a href={selectedWd.proof_image} target="_blank" rel="noreferrer" className="block">
                    <img src={selectedWd.proof_image} alt="Bukti Transfer" className="max-h-48 rounded-xl border border-[#E5E2D9] object-cover" />
                  </a>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-[#E5E2D9]">
              <button
                onClick={() => setModalType(null)}
                className="px-4 py-2 rounded-xl bg-[#8B4513] text-white text-sm font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
