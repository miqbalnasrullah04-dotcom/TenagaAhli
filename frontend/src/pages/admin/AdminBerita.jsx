import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

const CATEGORIES = [
  'SEMUA',
  'BERITA',
  'INFORMASI PROYEK',
];

const STATUS_TABS = [
  { value: 'SEMUA', label: 'Semua Konten' },
  { value: 'menunggu_verifikasi', label: 'Menunggu Verifikasi' },
  { value: 'published', label: 'Diterbitkan / Aktif' },
  { value: 'ditolak', label: 'Ditolak' },
];

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=300';

export default function AdminBerita() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState(null);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');
  const [selectedStatus, setSelectedStatus] = useState('SEMUA');

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Verification Modal State
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [verifying, setVerifying] = useState(false);

  // Rejection Dialog State
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejecting, setRejecting] = useState(false);

  // Bukti Transfer Zoom Modal
  const [zoomProof, setZoomProof] = useState(null);

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'https://tenagaahli.com';

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = () => {
    setLoading(true);
    setError('');
    api
      .get('/admin/articles')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setArticles(data);
      })
      .catch(() => setError('Gagal memuat data berita dari server.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const pendingCount = (articles || []).filter(
    (a) => a && (a.status || 'menunggu_verifikasi') === 'menunggu_verifikasi'
  ).length;

  const filtered = (articles || []).filter((a) => {
    if (!a) return false;
    const matchKw =
      (a.title || '').toLowerCase().includes(keyword.toLowerCase()) ||
      (a.category || '').toLowerCase().includes(keyword.toLowerCase()) ||
      (a.excerpt || '').toLowerCase().includes(keyword.toLowerCase()) ||
      (a.author_name || '').toLowerCase().includes(keyword.toLowerCase()) ||
      (a.user?.name || '').toLowerCase().includes(keyword.toLowerCase());

    const catUpper = (a.category || '').toUpperCase();
    const isProyek = catUpper.includes('PROYEK');

    let matchCat = true;
    if (selectedCategory === 'BERITA') {
      matchCat = !isProyek;
    } else if (selectedCategory === 'INFORMASI PROYEK') {
      matchCat = isProyek;
    }

    let matchStatus = true;
    if (selectedStatus !== 'SEMUA') {
      if (selectedStatus === 'published') {
        matchStatus = a.status === 'published' || a.status === 'aktif';
      } else {
        matchStatus = (a.status || 'menunggu_verifikasi') === selectedStatus;
      }
    }

    return matchKw && matchCat && matchStatus;
  });

  const handleVerify = async (articleId) => {
    setVerifying(true);
    try {
      const res = await api.post(`/admin/articles/${articleId}/verify`);
      showToastMsg(res.data?.message || 'Berita berhasil diverifikasi & dipublikasikan (7 Hari).');
      setSelectedArticle(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memverifikasi berita.');
    } finally {
      setVerifying(false);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setRejecting(true);
    try {
      const res = await api.post(`/admin/articles/${rejectTarget.id}/reject`, {
        reason: rejectionReason.trim() || 'Bukti transfer tidak valid atau informasi konten belum lengkap.',
      });
      showToastMsg(res.data?.message || 'Berita telah ditolak.');
      setRejectTarget(null);
      setRejectionReason('');
      setSelectedArticle(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak berita.');
    } finally {
      setRejecting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/articles/${deleteTarget.id}`);
      setDeleteTarget(null);
      showToastMsg('Berita berhasil dihapus.');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus berita.');
    } finally {
      setDeleting(false);
    }
  };

  const getThumbnailSrc = (item) => {
    if (!item) return DEFAULT_IMAGE;
    if (item.thumbnail_url) return item.thumbnail_url;
    if (item.thumbnail) {
      if (item.thumbnail.startsWith('http://') || item.thumbnail.startsWith('https://')) {
        return item.thumbnail;
      }
      return `${BACKEND_URL}/storage/${item.thumbnail}`;
    }
    return DEFAULT_IMAGE;
  };

  const getCategoryBadgeClass = (cat) => {
    const c = (cat || '').toUpperCase();
    if (c.includes('PROYEK')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-[#8B4513] border-[#8B4513]/20';
  };

  const renderStatusBadge = (item) => {
    if (!item) return null;
    const st = item.status || 'menunggu_verifikasi';
    if (st === 'published' || st === 'aktif') {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Tayang (Aktif)
          </span>
          {item.expires_at ? (
            <span className="text-[10px] text-gray-500 pl-1">
              Hingga {String(item.expires_at).slice(0, 10)}
            </span>
          ) : (
            <span className="text-[10px] text-emerald-600 font-semibold pl-1">
              Permanen (Admin)
            </span>
          )}
        </div>
      );
    }

    if (st === 'ditolak') {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Ditolak
          </span>
          {item.rejection_reason && (
            <span className="text-[10px] text-rose-600 font-medium pl-1 line-clamp-1 max-w-[130px]" title={item.rejection_reason}>
              {item.rejection_reason}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-0.5">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-amber-50 text-amber-900 border border-amber-300 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          Menunggu Verifikasi
        </span>
        <span className="text-[10px] text-amber-800 font-semibold pl-1">
          Rp 10.000 / 1 Minggu
        </span>
      </div>
    );
  };

  return (
    <div>
      {/* ── Toast Notification ── */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[9999] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all duration-300 ${
            toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">
            {toast.type === 'error' ? 'error' : 'check_circle'}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#8B4513]">Konfirmasi &amp; Kelola Berita / Proyek</h2>
          <p className="text-[#414844]/80 text-sm mt-1">
            Verifikasi bukti transfer pembayaran (Rp 10.000 / minggu) dan kelola publikasi berita portal TenagaAhli.com.
          </p>
        </div>
        <Link
          to="/admin/berita/tambah"
          className="inline-flex items-center justify-center gap-2 bg-[#8B4513] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#6B3410] shadow-sm transition-all hover:shadow cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Berita (Admin)
        </Link>
      </div>

      {error && (
        <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-xl p-4 border border-[#93000A]/10">
          {error}
        </div>
      )}

      {/* ── Status Tabs Filter (Menunggu Verifikasi, Tayang, Ditolak, Semua) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 mb-4 no-scrollbar">
        {STATUS_TABS.map((tab) => {
          const isSelected = selectedStatus === tab.value;
          const isPendingTab = tab.value === 'menunggu_verifikasi';
          return (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isSelected
                  ? 'bg-[#8B4513] text-white shadow-sm'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-amber-50/50'
              }`}
            >
              <span>{tab.label}</span>
              {isPendingTab && pendingCount > 0 && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  isSelected ? 'bg-amber-300 text-slate-900' : 'bg-amber-500 text-white animate-pulse'
                }`}>
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Filter & Search Card */}
      <div className="bg-white rounded-2xl border border-[#8B4513]/15 shadow-sm overflow-hidden mb-6">
        <div className="p-4 sm:p-5 border-b border-[#8B4513]/10 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
              search
            </span>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Cari judul, penulis, pengirim, atau isi berita..."
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-[#8B4513] text-white shadow-sm'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#8B4513]/5 text-[#414844] text-xs uppercase tracking-wider font-bold">
                <th className="px-5 py-3.5">Foto</th>
                <th className="px-5 py-3.5">Judul &amp; Pengirim</th>
                <th className="px-5 py-3.5">Kategori</th>
                <th className="px-5 py-3.5">Status &amp; Masa Aktif</th>
                <th className="px-5 py-3.5">Bukti Transfer (10k)</th>
                <th className="px-5 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <div className="flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined animate-spin text-[22px] text-[#8B4513]">
                        progress_activity
                      </span>
                      <span>Memuat data berita...</span>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">
                      newspaper
                    </span>
                    <p className="font-semibold text-gray-700">Belum ada berita pada tab ini</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {keyword || selectedCategory !== 'SEMUA' || selectedStatus !== 'SEMUA'
                        ? 'Coba sesuaikan filter atau kata kunci pencarian.'
                        : 'Klik "Tambah Berita" untuk mulai membuat berita baru.'}
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((item) => {
                  const isPending = (item.status || 'menunggu_verifikasi') === 'menunggu_verifikasi';
                  return (
                    <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                      {/* Thumbnail Image */}
                      <td className="px-5 py-4 w-24">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-sm shrink-0">
                          <img
                            src={getThumbnailSrc(item)}
                            alt={item.title}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = DEFAULT_IMAGE;
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Title & Author */}
                      <td className="px-5 py-4 max-w-sm">
                        <p className="font-bold text-gray-900 line-clamp-1 hover:text-[#8B4513] transition-colors">
                          {item.title}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                          <span className="flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[14px] text-gray-400">person</span>
                            {item.user?.name || item.author_name || 'Kontributor'}
                          </span>
                          <span>•</span>
                          <span>{item.created_at?.slice(0, 10) || '-'}</span>
                          {item.source && (
                            <>
                              <span>•</span>
                              <span className="text-[#8B4513] font-semibold truncate max-w-[150px]">
                                Sumber: {item.source}
                              </span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Category Badge Column */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {(item.category || '').toUpperCase().includes('PROYEK') ? 'INFORMASI PROYEK' : 'BERITA'}
                        </span>
                      </td>

                      {/* Status & Expiry */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {renderStatusBadge(item)}
                      </td>

                      {/* Bukti Transfer */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        {item.payment_proof_url ? (
                          <button
                            type="button"
                            onClick={() => setZoomProof(item.payment_proof_url)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-[#8B4513] border border-amber-200 rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                          >
                            <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                            <span>Lihat Struk</span>
                          </button>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Tanpa bukti (Admin)</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Tombol Verifikasi / Detail */}
                          <button
                            type="button"
                            onClick={() => setSelectedArticle(item)}
                            className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-all cursor-pointer ${
                              isPending
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title="Verifikasi / Detail Berita"
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {isPending ? 'verified' : 'visibility'}
                            </span>
                            <span>{isPending ? 'Verifikasi' : 'Detail'}</span>
                          </button>

                          {/* Tombol Tolak jika Pending */}
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => {
                                setRejectTarget(item);
                                setRejectionReason('');
                              }}
                              className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors cursor-pointer"
                              title="Tolak Berita"
                            >
                              <span className="material-symbols-outlined text-[16px]">cancel</span>
                              <span>Tolak</span>
                            </button>
                          )}

                          <Link
                            to={`/admin/berita/${item.id}/edit`}
                            className="p-1.5 text-[#8B4513] hover:bg-[#8B4513]/10 rounded-lg transition-colors"
                            title="Edit Berita"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                          </Link>

                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Hapus Berita"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL VERIFIKASI & DETAIL BERITA ── */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl my-8 border border-gray-100">
            <div className="px-6 py-4 bg-[#FAF4EE] border-b border-[#8B4513]/15 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#8B4513] text-amber-200 flex items-center justify-center shadow-xs">
                  <span className="material-symbols-outlined text-[22px]">verified_user</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Verifikasi &amp; Detail Berita</h3>
                  <p className="text-xs text-gray-500">
                    Periksa konten dan bukti pembayaran Rp 10.000 (1 Minggu).
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-black/5 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Header Info */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryBadgeClass(selectedArticle.category)}`}>
                    {selectedArticle.category || 'BERITA'}
                  </span>
                  <div>{renderStatusBadge(selectedArticle)}</div>
                </div>

                <h4 className="text-base font-extrabold text-gray-900 leading-snug">
                  {selectedArticle.title || 'Tanpa Judul'}
                </h4>

                <div className="text-xs text-gray-600 flex flex-wrap items-center gap-3 pt-1 border-t border-gray-200">
                  <span><b>Pengirim:</b> {selectedArticle.user?.name || selectedArticle.author_name || 'Kontributor'}</span>
                  {selectedArticle.user?.email && <span><b>Email:</b> {selectedArticle.user.email}</span>}
                  {selectedArticle.source && <span><b>Sumber:</b> {selectedArticle.source}</span>}
                  <span><b>Tanggal Kirim:</b> {selectedArticle.created_at ? String(selectedArticle.created_at) : '-'}</span>
                </div>
              </div>

              {/* Bukti Transfer */}
              <div>
                <label className="block text-xs font-bold text-[#8B4513] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                  Bukti Transfer Pembayaran (Rp 10.000)
                </label>
                {selectedArticle.payment_proof_url ? (
                  <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-200 flex flex-col items-center justify-center gap-2">
                    <img
                      src={selectedArticle.payment_proof_url}
                      alt="Bukti Transfer"
                      className="max-h-64 object-contain rounded-lg border border-amber-200 shadow-sm cursor-pointer hover:opacity-95"
                      onClick={() => setZoomProof(selectedArticle.payment_proof_url)}
                    />
                    <button
                      type="button"
                      onClick={() => setZoomProof(selectedArticle.payment_proof_url)}
                      className="text-xs font-bold text-[#8B4513] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">zoom_in</span>
                      Klik untuk memperbesar struk
                    </button>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center text-xs text-gray-400">
                    Tidak ada file bukti pembayaran yang diunggah (Konten dibuat langsung oleh Admin).
                  </div>
                )}
              </div>

              {/* Isi Ringkasan & Konten */}
              {selectedArticle.excerpt && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Ringkasan (Excerpt)
                  </label>
                  <p className="text-xs text-gray-700 bg-gray-50 p-3 rounded-xl border border-gray-200 leading-relaxed">
                    {selectedArticle.excerpt}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Isi Konten Berita
                </label>
                <div className="text-xs text-gray-800 bg-gray-50 p-3.5 rounded-xl border border-gray-200 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-line">
                  {selectedArticle.content}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setRejectTarget(selectedArticle);
                    setRejectionReason('');
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 transition-colors cursor-pointer"
                >
                  Tolak Berita
                </button>

                <button
                  type="button"
                  disabled={verifying}
                  onClick={() => handleVerify(selectedArticle.id)}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {verifying ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  ) : (
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  )}
                  <span>Setujui &amp; Publikasikan (7 Hari)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL DIALOG TOLAK BERITA ── */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-100">
            <div className="flex items-center gap-3 text-rose-600">
              <span className="material-symbols-outlined text-3xl">cancel</span>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Tolak Publikasi Berita</h3>
                <p className="text-xs text-gray-500">Berikan alasan penolakan kepada pengirim</p>
              </div>
            </div>

            <p className="text-xs text-gray-700">
              Apakah Anda yakin ingin menolak berita <b>"{rejectTarget.title}"</b>?
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase mb-1">
                Alasan Penolakan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Contoh: Bukti transfer tidak jelas / belum masuk, atau isi konten melanggar ketentuan..."
                className="w-full text-xs p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={rejecting}
                onClick={handleReject}
                className="px-5 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {rejecting && <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />}
                <span>Konfirmasi Tolak</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ZOOM BUKTI TRANSFER MODAL ── */}
      {zoomProof && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 overflow-hidden shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <span className="material-symbols-outlined text-[#8B4513]">receipt_long</span>
                <span>Struk Pembayaran (Rp 10.000 / 1 Minggu)</span>
              </div>
              <button
                type="button"
                onClick={() => setZoomProof(null)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto flex items-center justify-center bg-gray-50 rounded-xl p-2 border border-gray-200">
              <img src={zoomProof} alt="Bukti Transfer" className="max-w-full max-h-[60vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Yakin ingin menghapus berita "${deleteTarget?.title}"? Tindakan ini tidak dapat dibatalkan.`}
      />
    </div>
  );
}
