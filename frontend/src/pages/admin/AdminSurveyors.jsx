import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

const storageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^storage\//i, '').replace(/^\/storage\//i, '').replace(/^\//, '');
  const apiUrl = import.meta.env.VITE_API_URL || 'https://tenagaahli.com/api';
  return `${apiUrl}/files/${cleanPath}`;
};

export default function AdminSurveyors() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || 'all';

  const [surveyors, setSurveyors] = useState([]);
  const [statistics, setStatistics] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal target states
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectingUpdate, setRejectingUpdate] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState({});
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/admin/surveyors/statistics');
      setStatistics(response.data.data || {});
    } catch (err) {
      console.error('Error fetching statistics:', err);
    }
  };

  const loadData = () => {
    setLoading(true);
    let apiStatus = statusParam;
    if (statusParam === 'disetujui') apiStatus = 'aktif';

    const params = {
      page: currentPage,
      per_page: 15,
      ...(keyword.trim() ? { search: keyword.trim() } : {}),
      ...(apiStatus && apiStatus !== 'all' ? { status: apiStatus } : {}),
    };

    api.get('/admin/surveyors', { params })
      .then((res) => {
        const paginated = res.data?.data;
        if (paginated && paginated.data) {
          setSurveyors(paginated.data);
          setCurrentPage(paginated.current_page || 1);
          setTotalPages(paginated.last_page || 1);
          setTotalCount(paginated.total || 0);
        } else if (Array.isArray(res.data)) {
          setSurveyors(res.data);
          setTotalCount(res.data.length);
        }
      })
      .catch(() => setError('Gagal memuat data surveyor dari server.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  useEffect(() => {
    loadData();
  }, [statusParam, currentPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    loadData();
  };

  const handleOpenDetail = async (surveyor) => {
    setDetailTarget(surveyor);
    setRejecting(false);
    setRejectReason('');

    // Fetch deep detail with relations & orders
    try {
      setLoadingDetail(true);
      const res = await api.get(`/admin/surveyors/${surveyor.id}`);
      if (res.data?.data?.surveyor) {
        setDetailTarget({
          ...surveyor,
          ...res.data.data.surveyor,
          orders: res.data.data.orders || [],
        });
      }
    } catch (err) {
      console.error('Failed to load full surveyor details:', err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleVerifySurveyor = async (id) => {
    try {
      setSubmitting((prev) => ({ ...prev, [id]: true }));
      await api.post(`/admin/surveyors/${id}/verify-profile`);
      alert('Profil surveyor berhasil disetujui.');
      setDetailTarget(null);
      loadData();
      fetchStatistics();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyetujui profil surveyor.');
    } finally {
      setSubmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleRejectSurveyor = async (id) => {
    if (!rejectReason.trim()) {
      alert('Tulis alasan penolakan/perbaikan terlebih dahulu.');
      return;
    }
    try {
      setSubmitting((prev) => ({ ...prev, [id]: true }));
      await api.post(`/admin/surveyors/${id}/reject-profile`, { reject_reason: rejectReason });
      alert('Permintaan perbaikan telah dikirim ke surveyor.');
      setDetailTarget(null);
      setRejecting(false);
      setRejectReason('');
      loadData();
      fetchStatistics();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak profil surveyor.');
    } finally {
      setSubmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleApproveUpdate = async (id) => {
    try {
      setSubmitting((prev) => ({ ...prev, [id]: true }));
      await api.post(`/admin/surveyors/${id}/approve-update`);
      alert('Pembaruan profil surveyor berhasil disetujui dan diterapkan.');
      setDetailTarget(null);
      loadData();
      fetchStatistics();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyetujui pembaruan profil.');
    } finally {
      setSubmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleRejectUpdate = async (id) => {
    if (!rejectReason.trim()) {
      alert('Tulis alasan penolakan pembaruan terlebih dahulu.');
      return;
    }
    try {
      setSubmitting((prev) => ({ ...prev, [id]: true }));
      await api.post(`/admin/surveyors/${id}/reject-update`, { reject_reason: rejectReason });
      alert('Pembaruan profil surveyor telah ditolak.');
      setDetailTarget(null);
      setRejectingUpdate(false);
      setRejectReason('');
      loadData();
      fetchStatistics();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak pembaruan profil.');
    } finally {
      setSubmitting((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleToggleDeactivate = async (surveyor) => {
    try {
      await api.post(`/admin/surveyors/${surveyor.id}/deactivate`);
      if (detailTarget && detailTarget.id === surveyor.id) {
        setDetailTarget({
          ...detailTarget,
          profile_status: detailTarget.profile_status === 'nonaktif' ? 'aktif' : 'nonaktif',
        });
      }
      loadData();
      fetchStatistics();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status akun.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/surveyors/${deleteTarget.id}`);
      setDeleteTarget(null);
      loadData();
      fetchStatistics();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus data surveyor.');
    }
  };

  const avatarPalette = ['#1E3A8A', '#065F46', '#1E40AF', '#0D9488', '#4338CA'];
  const getInitials = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  const getAvatarColor = (id) => avatarPalette[(id || 0) % avatarPalette.length];

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#6B3410]">Manajemen Surveyor</h2>
          <p className="text-[#414844]/80 text-sm mt-1">
            Kelola data profil, verifikasi sertifikasi, dan status surveyor di TenagaAhli.com.
          </p>
        </div>
      </div>

      {error && <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3">{error}</div>}

      {/* Summary Statistics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl border border-[#6B3410]/15 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-sky-100 flex items-center justify-center shrink-0 text-sky-800">
            <span className="material-symbols-outlined text-[24px]">map</span>
          </div>
          <div>
            <p className="text-xs text-[#414844]/60 font-semibold uppercase tracking-wider">Total Surveyor</p>
            <p className="text-xl font-bold text-gray-900">{statistics.total_surveyors || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#6B3410]/15 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 text-emerald-800">
            <span className="material-symbols-outlined text-[24px]">verified</span>
          </div>
          <div>
            <p className="text-xs text-[#414844]/60 font-semibold uppercase tracking-wider">Aktif / Disetujui</p>
            <p className="text-xl font-bold text-emerald-700">{statistics.active_surveyors || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#6B3410]/15 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 text-amber-800">
            <span className="material-symbols-outlined text-[24px]">edit_note</span>
          </div>
          <div>
            <p className="text-xs text-[#414844]/60 font-semibold uppercase tracking-wider">Pembaruan Profil</p>
            <p className="text-xl font-bold text-amber-700">{statistics.pending_update || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#6B3410]/15 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-orange-100 flex items-center justify-center shrink-0 text-orange-800">
            <span className="material-symbols-outlined text-[24px]">pending</span>
          </div>
          <div>
            <p className="text-xs text-[#414844]/60 font-semibold uppercase tracking-wider">Pendaftar Baru</p>
            <p className="text-xl font-bold text-orange-700">{statistics.pending_verification || 0}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-[#6B3410]/15 shadow-xs flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-lg bg-red-100 flex items-center justify-center shrink-0 text-red-800">
            <span className="material-symbols-outlined text-[24px]">cancel</span>
          </div>
          <div>
            <p className="text-xs text-[#414844]/60 font-semibold uppercase tracking-wider">Ditolak</p>
            <p className="text-xl font-bold text-red-700">{statistics.rejected_surveyors || 0}</p>
          </div>
        </div>
      </div>

      {/* Main Content Box */}
      <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm overflow-hidden">
        {/* Search and Tabs Toolbar */}
        <div className="p-5 border-b border-[#6B3410]/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#414844]/40 text-[20px]">
                search
              </span>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari nama, email, lokasi, instansi..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-[#6B3410]/20 rounded-lg focus:ring-2 focus:ring-[#6B3410]/20 focus:border-[#6B3410] focus:outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="bg-[#6B3410] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#55290A] transition-colors shrink-0"
            >
              Cari
            </button>
          </form>

          {/* Status Tabs */}
          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'pembaruan_profil', label: `Pembaruan Profil ${statistics.pending_update ? `(${statistics.pending_update})` : ''}` },
              { id: 'menunggu_verifikasi', label: 'Pendaftar Baru' },
              { id: 'disetujui', label: 'Disetujui' },
              { id: 'ditolak', label: 'Ditolak' },
              { id: 'nonaktif', label: 'Nonaktif' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentPage(1);
                  setSearchParams({ status: tab.id });
                }}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                  statusParam === tab.id
                    ? 'bg-[#6B3410] text-white shadow-sm'
                    : 'bg-[#6B3410]/5 text-[#414844] hover:bg-[#6B3410]/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {!loading && (
          <div className="px-6 pt-4 text-xs text-[#414844]/60">
            Menampilkan <span className="font-bold text-[#414844]">{surveyors.length}</span> dari {totalCount || surveyors.length} surveyor
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#6B3410]/5 text-[#414844]">
                <th className="px-6 py-3 font-bold">Surveyor</th>
                <th className="px-6 py-3 font-bold">Instansi & Lokasi</th>
                <th className="px-6 py-3 font-bold">Status Akun</th>
                <th className="px-6 py-3 font-bold">Status Profil</th>
                <th className="px-6 py-3 font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6B3410]/10">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200" />
                        <div className="space-y-1.5">
                          <div className="w-32 h-4 bg-gray-200 rounded" />
                          <div className="w-24 h-3 bg-gray-100 rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4"><div className="w-24 h-4 bg-gray-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-16 h-4 bg-gray-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
                    <td className="px-6 py-4"><div className="w-28 h-7 bg-gray-200 rounded" /></td>
                  </tr>
                ))
              ) : surveyors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-[#414844]/60">
                    <span className="material-symbols-outlined text-4xl block mb-2 text-[#414844]/30">
                      person_search
                    </span>
                    Tidak ada data surveyor yang sesuai kriteria pencarian.
                  </td>
                </tr>
              ) : (
                surveyors.map((srv) => {
                  const isPaid = (srv.package && srv.package.price > 0) || (srv.package_id && Number(srv.package_id) > 1);
                  const isPlatinum = String(srv.package?.name || '').toLowerCase().includes('platinum');

                  return (
                    <tr key={srv.id} className="hover:bg-[#6B3410]/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {srv.photo ? (
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ url: storageUrl(srv.photo), title: `Pas Foto - ${srv.name}` })}
                              className="focus:outline-none shrink-0 group relative"
                              title="Klik untuk perbesar foto"
                            >
                              <img
                                src={storageUrl(srv.photo)}
                                alt=""
                                className="w-10 h-10 rounded-full object-cover shrink-0 border border-[#6B3410]/20 shadow-xs group-hover:scale-105 transition-transform"
                              />
                            </button>
                          ) : (
                            <div
                              className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs shrink-0"
                              style={{ backgroundColor: getAvatarColor(srv.id) }}
                            >
                              {getInitials(srv.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-[#1F2A22]">{srv.name}</span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                                Surveyor
                              </span>
                              {isPaid && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  isPlatinum ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                                }`}>
                                  {isPlatinum ? 'Platinum' : 'Premium'}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-[#414844]/60 truncate">
                              ID Surveyor: #{srv.id} • {srv.email || '-'}
                            </p>
                            {srv.field && (
                              <p className="text-[11px] text-[#6B3410] font-medium truncate mt-0.5">
                                {srv.field}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-[#414844]">
                        <p className="font-medium text-xs text-gray-900">{srv.institution || '-'}</p>
                        <p className="text-[11px] text-[#414844]/60 mt-0.5">
                          {srv.alamat_kota || srv.location || '-'}
                        </p>
                      </td>

                      <td className="px-6 py-4">
                        {srv.update_status === 'menunggu_verifikasi' ? (
                          <div className="flex flex-col gap-1 items-start">
                            <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                              Pembaruan Profil
                            </span>
                            <span className="text-[10px] text-gray-400">Akun: {srv.profile_status}</span>
                          </div>
                        ) : srv.profile_status === 'nonaktif' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 bg-gray-100 px-2.5 py-1 rounded-full">
                            Nonaktif
                          </span>
                        ) : srv.profile_status === 'ditolak' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#B3261E] bg-[#FFDAD6] px-2.5 py-1 rounded-full">
                            Ditolak
                          </span>
                        ) : srv.profile_status === 'menunggu_verifikasi' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
                            Pending
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-full">
                            Aktif
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        {srv.verified ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-[#6B3410]">
                            <span className="material-symbols-outlined text-[16px]">verified</span>
                            Terverifikasi
                          </span>
                        ) : srv.profile_status === 'ditolak' ? (
                          <span className="text-xs font-medium text-[#B3261E]">Perlu Perbaikan</span>
                        ) : (
                          <span className="text-xs text-[#414844]/60">Belum Verifikasi</span>
                        )}
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Detail Button - Opens Full Detail Modal */}
                          <button
                            onClick={() => handleOpenDetail(srv)}
                            className="flex items-center gap-1 bg-[#6B3410]/10 hover:bg-[#6B3410]/20 text-[#6B3410] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                            title="Lihat Detail Surveyor"
                          >
                            <span className="material-symbols-outlined text-[16px]">visibility</span>
                            Detail
                          </button>

                          {/* Quick Verify / Reject for Pending */}
                          {srv.profile_status === 'menunggu_verifikasi' && (
                            <>
                              <button
                                onClick={() => handleVerifySurveyor(srv.id)}
                                disabled={submitting[srv.id]}
                                className="flex items-center gap-1 bg-emerald-700 hover:bg-emerald-800 text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                              >
                                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                                Setujui
                              </button>
                              <button
                                onClick={() => {
                                  setDetailTarget(srv);
                                  setRejecting(true);
                                }}
                                className="flex items-center gap-1 bg-[#B3261E] hover:bg-[#93000A] text-white px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                              >
                                <span className="material-symbols-outlined text-[16px]">cancel</span>
                                Tolak
                              </button>
                            </>
                          )}

                          {/* Toggle Active / Deactivate */}
                          <button
                            onClick={() => handleToggleDeactivate(srv)}
                            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                              srv.profile_status === 'nonaktif'
                                ? 'text-[#6B3410] bg-[#6B3410]/10 hover:bg-[#6B3410]/20'
                                : 'text-[#B3261E] bg-[#B3261E]/10 hover:bg-[#B3261E]/20'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[16px]">
                              {srv.profile_status === 'nonaktif' ? 'toggle_on' : 'toggle_off'}
                            </span>
                            {srv.profile_status === 'nonaktif' ? 'Aktifkan' : 'Nonaktifkan'}
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => setDeleteTarget(srv)}
                            title="Hapus data"
                            className="flex items-center gap-1 text-[#B3261E]/80 bg-[#B3261E]/10 hover:bg-[#B3261E]/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                          >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            Hapus
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#6B3410]/10 flex items-center justify-between text-xs text-[#414844]">
            <span>
              Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> ({totalCount} surveyor)
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg border border-[#6B3410]/20 hover:bg-[#6B3410]/5 disabled:opacity-40 disabled:hover:bg-transparent font-medium"
              >
                Sebelumnya
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
                className="px-3 py-1.5 rounded-lg border border-[#6B3410]/20 hover:bg-[#6B3410]/5 disabled:opacity-40 disabled:hover:bg-transparent font-medium"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* MODAL LIHAT DETAIL SURVEYOR                                              */}
      {/* ========================================================================= */}
      {detailTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#6B3410]/15 sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3">
                {detailTarget.photo ? (
                  <button
                    type="button"
                    onClick={() => setPreviewImage({ url: storageUrl(detailTarget.photo), title: `Pas Foto - ${detailTarget.name}` })}
                    className="focus:outline-none group relative shrink-0"
                    title="Klik untuk melihat foto lebih besar"
                  >
                    <img
                      src={storageUrl(detailTarget.photo)}
                      alt={detailTarget.name}
                      className="w-12 h-12 rounded-xl object-cover border-2 border-[#6B3410]/20 group-hover:scale-105 transition-transform shadow-xs"
                    />
                    <span className="absolute inset-0 bg-black/30 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white">
                      <span className="material-symbols-outlined text-sm">zoom_in</span>
                    </span>
                  </button>
                ) : (
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-xs"
                    style={{ backgroundColor: getAvatarColor(detailTarget.id) }}
                  >
                    {getInitials(detailTarget.name)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-[#6B3410]">{detailTarget.name}</h3>
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200">
                      Surveyor
                    </span>
                    {detailTarget.verified && (
                      <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <span className="material-symbols-outlined text-[13px]">verified</span>
                        Terverifikasi
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#414844]/60 mt-0.5 font-medium">
                    ID Surveyor: #{detailTarget.id} • Status Profil: <span className="font-bold text-[#6B3410] uppercase">{detailTarget.profile_status || 'aktif'}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setDetailTarget(null)}
                className="text-[#414844]/60 hover:text-[#6B3410] p-1.5 rounded-full hover:bg-[#F5F4EF] transition-colors"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-sm">
              {loadingDetail && (
                <div className="flex items-center justify-center py-4 text-xs text-[#6B3410] font-medium gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-[#6B3410]/30 border-t-[#6B3410] animate-spin" />
                  Memuat rincian dokumen & sertifikasi...
                </div>
              )}

              {/* Review Perubahan Profil (Pending Changes) */}
              {detailTarget.update_status === 'menunggu_verifikasi' && detailTarget.pending_changes && (
                <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm animate-fadeIn">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-2xl animate-pulse">edit_note</span>
                      <div>
                        <h4 className="font-bold text-amber-900 text-sm">Pembaruan Profil Menunggu Persetujuan Admin</h4>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Surveyor ini telah memperbarui datanya. Bandingkan data lama vs data baru yang diajukan di bawah ini:
                        </p>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-200 text-amber-900 border border-amber-300 shrink-0">
                      Pembaruan Profil
                    </span>
                  </div>

                  <div className="space-y-3 pt-1">
                    {(() => {
                      const changedEntries = Object.entries(detailTarget.pending_changes).filter(([key, newVal]) => {
                        const oldVal = detailTarget[key];
                        if (oldVal === newVal) return false;
                        if ((oldVal == null || oldVal === '') && (newVal == null || newVal === '')) return false;
                        if (typeof oldVal === 'object' && typeof newVal === 'object') {
                          return JSON.stringify(oldVal) !== JSON.stringify(newVal);
                        }
                        return String(oldVal ?? '').trim() !== String(newVal ?? '').trim();
                      });

                      if (changedEntries.length === 0) {
                        return (
                          <div className="bg-white p-3.5 rounded-xl border border-amber-200/80 text-center text-xs text-amber-800">
                            Tidak ada perbedaan data dengan profil aktif saat ini.
                          </div>
                        );
                      }

                      return changedEntries.map(([key, newVal]) => {
                      const oldVal = detailTarget[key];
                      const labelMap = {
                        name: 'Nama Lengkap & Gelar',
                        field: 'Bidang Keahlian / Survei',
                        institution: 'Institusi / Perusahaan',
                        phone: 'Nomor WhatsApp / HP',
                        alamat_kota: 'Kota / Kabupaten',
                        alamat_provinsi: 'Provinsi',
                        alamat_lengkap: 'Alamat Lengkap',
                        tempat_lahir: 'Tempat Lahir',
                        tanggal_lahir: 'Tanggal Lahir',
                        tentang_saya: 'Tentang Saya (Bio)',
                        ringkasan_keahlian: 'Ringkasan Keahlian',
                        photo: 'Foto Profil',
                        cover: 'Foto Sampul (Cover)',
                        ktp_path: 'Foto KTP (Identitas)',
                        bank_name: 'Nama Bank',
                        bank_account: 'Nomor Rekening',
                        bank_account_name: 'Atas Nama Rekening',
                        total_proyek: 'Total Portofolio Proyek',
                        video_url: 'Link Video Portofolio',
                        kriteria_list: 'Kriteria Profesional',
                        gallery: 'Galeri Foto Portofolio',
                        galeri: 'Galeri Foto Portofolio',
                        location: 'Lokasi Surveyor',
                        sosial: 'Media Sosial',
                      };
                      const label = labelMap[key] || key.replace(/_/g, ' ').toUpperCase();

                      if (key === 'photo') {
                        return (
                          <div key={key} className="bg-white p-3.5 rounded-xl border border-amber-200/80">
                            <span className="text-xs font-bold text-amber-900 block mb-2">{label}</span>
                            <div className="flex items-center justify-around gap-4">
                              <div className="text-center">
                                <span className="text-[11px] text-gray-500 block mb-1">Foto Aktif:</span>
                                {oldVal ? (
                                  <a href={storageUrl(oldVal)} target="_blank" rel="noreferrer" title="Klik untuk lihat foto asli" className="inline-block group relative">
                                    <img src={storageUrl(oldVal)} className="w-20 h-20 rounded-xl object-cover border border-gray-200 mx-auto group-hover:opacity-90" alt="Foto Lama" />
                                    <span className="text-[10px] text-blue-600 block mt-1 underline">Lihat Foto Asli</span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Tidak ada foto</span>
                                )}
                              </div>
                              <span className="material-symbols-outlined text-amber-500 text-2xl">arrow_forward</span>
                              <div className="text-center">
                                <span className="text-[11px] font-bold text-green-700 block mb-1">Foto Baru Diajukan:</span>
                                {newVal ? (
                                  <a href={storageUrl(newVal)} target="_blank" rel="noreferrer" title="Klik untuk lihat foto baru ukuran penuh" className="inline-block group relative">
                                    <img src={storageUrl(newVal)} className="w-20 h-20 rounded-xl object-cover border-2 border-green-500 ring-2 ring-green-200 mx-auto group-hover:scale-105 transition-transform" alt="Foto Baru" />
                                    <span className="text-[10px] text-green-700 font-bold block mt-1 underline flex items-center justify-center gap-0.5">
                                      <span className="material-symbols-outlined text-[13px]">zoom_in</span> Buka Ukuran Asli
                                    </span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-red-500 font-bold">Hapus Foto</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (key === 'ktp_path') {
                        return (
                          <div key={key} className="bg-white p-3.5 rounded-xl border border-amber-200/80">
                            <span className="text-xs font-bold text-amber-900 block mb-2">{label}</span>
                            <div className="flex items-center justify-around gap-4">
                              <div className="text-center">
                                <span className="text-[11px] text-gray-500 block mb-1">KTP Aktif:</span>
                                {oldVal ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage({ url: storageUrl(oldVal), title: `Foto KTP Aktif - ${detailTarget.name}` })}
                                    className="inline-block group relative focus:outline-none"
                                    title="Klik untuk lihat KTP asli"
                                  >
                                    <img src={storageUrl(oldVal)} className="w-28 h-20 rounded-lg object-cover border border-gray-200 mx-auto group-hover:scale-105 transition-transform shadow-xs" alt="KTP Lama" />
                                    <span className="text-[10px] text-blue-600 block mt-1 underline">Lihat KTP Asli</span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Belum ada KTP</span>
                                )}
                              </div>
                              <span className="material-symbols-outlined text-amber-500 text-2xl">arrow_forward</span>
                              <div className="text-center">
                                <span className="text-[11px] font-bold text-green-700 block mb-1">KTP Baru:</span>
                                {newVal ? (
                                  <button
                                    type="button"
                                    onClick={() => setPreviewImage({ url: storageUrl(newVal), title: `Foto KTP Baru Diajukan - ${detailTarget.name}` })}
                                    className="inline-block group relative focus:outline-none"
                                    title="Klik untuk lihat KTP baru ukuran penuh"
                                  >
                                    <img src={storageUrl(newVal)} className="w-28 h-20 rounded-lg object-cover border-2 border-green-500 ring-2 ring-green-200 mx-auto group-hover:scale-105 transition-transform shadow-xs" alt="KTP Baru" />
                                    <span className="text-[10px] text-green-700 font-bold block mt-1 underline flex items-center justify-center gap-0.5">
                                      <span className="material-symbols-outlined text-[13px]">zoom_in</span> Buka KTP Asli
                                    </span>
                                  </button>
                                ) : (
                                  <span className="text-xs text-red-500 font-bold">Hapus KTP</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (key === 'cover') {
                        return (
                          <div key={key} className="bg-white p-3.5 rounded-xl border border-amber-200/80">
                            <span className="text-xs font-bold text-amber-900 block mb-2">{label}</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <span className="text-[11px] text-gray-500 block mb-1">Cover Aktif:</span>
                                {oldVal ? (
                                  <a href={storageUrl(oldVal)} target="_blank" rel="noreferrer" title="Klik untuk lihat cover asli" className="block">
                                    <img src={storageUrl(oldVal)} className="w-full h-24 rounded-lg object-cover border border-gray-200 hover:opacity-90 transition-opacity" alt="Cover Lama" />
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Tidak ada cover</span>
                                )}
                              </div>
                              <div>
                                <span className="text-[11px] font-bold text-green-700 block mb-1">Cover Baru Diajukan:</span>
                                {newVal ? (
                                  <a href={storageUrl(newVal)} target="_blank" rel="noreferrer" title="Klik untuk lihat cover baru ukuran asli" className="block">
                                    <img src={storageUrl(newVal)} className="w-full h-24 rounded-lg object-cover border-2 border-green-500 hover:opacity-95 transition-opacity" alt="Cover Baru" />
                                    <span className="text-[10px] text-green-700 font-bold block mt-1 text-center underline">
                                      Buka Cover Penuh
                                    </span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-red-500 font-bold">Hapus Cover</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (key === 'gallery' || key === 'galeri') {
                        const oldList = Array.isArray(oldVal) ? oldVal : [];
                        const newList = Array.isArray(newVal) ? newVal : [];
                        return (
                          <div key={key} className="bg-white p-4 rounded-xl border border-amber-200/80 space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2 flex-wrap gap-2">
                              <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px] text-amber-600">photo_library</span>
                                {label}
                              </span>
                              <span className="text-[11px] text-gray-500 font-medium">
                                Total: <strong className="text-green-700 font-bold">{newList.length} Foto Diajukan</strong> (Sebelumnya: {oldList.length} Foto)
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Foto Lama */}
                              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <span className="text-[11px] font-bold text-gray-500 block mb-2">
                                  Foto Aktif Sebelumnya ({oldList.length}):
                                </span>
                                {oldList.length === 0 ? (
                                  <p className="text-xs text-gray-400 italic">Belum ada foto galeri sebelumnya</p>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                    {oldList.map((item, idx) => {
                                      const imgUrl = typeof item === 'string' ? item : item?.image;
                                      const cap = typeof item === 'object' ? item?.caption : '';
                                      return (
                                        <div key={idx} className="group relative rounded-lg overflow-hidden border border-gray-200 bg-white shadow-xs">
                                          <img
                                            src={storageUrl(imgUrl)}
                                            alt=""
                                            className="w-full h-20 object-cover"
                                            onError={(e) => { e.target.style.display = 'none'; }}
                                          />
                                          {cap && <p className="text-[10px] text-gray-600 px-1.5 py-0.5 truncate bg-white">{cap}</p>}
                                          <a
                                            href={storageUrl(imgUrl)}
                                            target="_blank"
                                            rel="noreferrer"
                                            title="Lihat foto penuh"
                                            className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                          >
                                            <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                                          </a>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>

                              {/* Foto Baru Diajukan */}
                              <div className="bg-green-50/70 p-3 rounded-xl border-2 border-green-400">
                                <span className="text-[11px] font-bold text-green-800 block mb-2 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[16px] text-green-600">new_releases</span>
                                  Foto Baru Diajukan ({newList.length}):
                                </span>
                                {newList.length === 0 ? (
                                  <p className="text-xs text-red-500 font-medium italic">Semua foto galeri dihapus</p>
                                ) : (
                                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                                    {newList.map((item, idx) => {
                                      const imgUrl = typeof item === 'string' ? item : item?.image;
                                      const cap = typeof item === 'object' ? item?.caption : '';
                                      return (
                                        <div key={idx} className="group relative rounded-xl overflow-hidden border-2 border-green-500 bg-white shadow-sm flex flex-col">
                                          <div className="relative w-full h-24 bg-gray-100 overflow-hidden">
                                            <img
                                              src={storageUrl(imgUrl)}
                                              alt={cap || `Foto ${idx+1}`}
                                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                            />
                                            <a
                                              href={storageUrl(imgUrl)}
                                              target="_blank"
                                              rel="noreferrer"
                                              title="Klik untuk buka foto asli di tab baru"
                                              className="absolute top-1 right-1 bg-green-700 hover:bg-green-800 text-white p-1 rounded-md shadow transition-colors flex items-center justify-center"
                                            >
                                              <span className="material-symbols-outlined text-[14px] block">open_in_new</span>
                                            </a>
                                          </div>
                                          <div className="p-1.5 bg-green-50/60 flex-1 flex flex-col justify-between">
                                            <span className="text-[9px] font-bold text-green-800 bg-green-200/80 px-1 py-0.2 rounded w-fit">
                                              Foto #{idx + 1}
                                            </span>
                                            <p className="text-[10px] text-gray-700 font-medium truncate mt-0.5" title={cap || 'Tanpa keterangan'}>
                                              {cap || <span className="text-gray-400 italic">Tanpa keterangan</span>}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }

                      const renderVal = (v) => {
                        if (v === null || v === undefined || v === '') return <span className="text-gray-400 italic">(Kosong)</span>;
                        if (typeof v === 'string' && (v.match(/\.(jpeg|jpg|png|webp|gif|svg)$/i) || v.startsWith('dokumen/') || v.startsWith('photos/'))) {
                          return (
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ url: storageUrl(v), title: 'Pratinjau Berkas Gambar' })}
                              className="inline-block group focus:outline-none"
                              title="Klik untuk memperbesar gambar"
                            >
                              <img src={storageUrl(v)} alt="" className="w-28 h-20 rounded-lg object-cover border-2 border-amber-400 group-hover:scale-105 transition-transform shadow-xs" />
                              <span className="text-[10px] text-blue-600 font-bold block mt-1 underline">Lihat Gambar</span>
                            </button>
                          );
                        }
                        if (Array.isArray(v)) {
                          if (v.length === 0) return <span className="text-gray-400 italic">(Kosong)</span>;
                          if (key === 'sosial') {
                            return (
                              <div className="space-y-0.5 text-xs">
                                {v.map((s, idx) => (
                                  <div key={idx}><strong>{s.label || s.type}:</strong> {s.url}</div>
                                ))}
                              </div>
                            );
                          }
                          if (typeof v[0] === 'object' && v[0] !== null) {
                            return (
                              <div className="space-y-1.5 text-xs">
                                {v.map((item, idx) => (
                                  <div key={idx} className="bg-white/80 p-1.5 rounded border border-gray-200">
                                    {Object.entries(item).map(([k, val]) => (
                                      <div key={k} className="text-[11px]">
                                        <strong className="text-gray-600">{k}:</strong> {String(val || '-')}
                                      </div>
                                    ))}
                                  </div>
                                ))}
                              </div>
                            );
                          }
                          return v.join(', ');
                        }
                        if (typeof v === 'object') {
                          return (
                            <div className="space-y-1 text-xs">
                              {Object.entries(v).map(([k, val]) => (
                                <div key={k}>
                                  <strong className="text-gray-600">{k}:</strong> {String(val || '-')}
                                </div>
                              ))}
                            </div>
                          );
                        }
                        return String(v);
                      };

                      return (
                        <div key={key} className="bg-white p-3.5 rounded-xl border border-amber-200/80 text-xs">
                          <span className="font-bold text-amber-900 block mb-1.5">{label}</span>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                              <span className="text-[10px] uppercase font-bold text-gray-400 block mb-1">Data Lama (Aktif)</span>
                              <div className="text-gray-700 break-words">{renderVal(oldVal)}</div>
                            </div>
                            <div className="bg-green-50/80 p-2.5 rounded-lg border border-green-300">
                              <span className="text-[10px] uppercase font-bold text-green-700 block mb-1">Data Baru Diajukan</span>
                              <div className="text-green-950 font-medium break-words">{renderVal(newVal)}</div>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                  </div>

                  {/* Tombol Tindakan Persetujuan Pembaruan */}
                  <div className="pt-2">
                    {rejectingUpdate ? (
                      <div className="space-y-2 bg-white p-3 rounded-xl border border-red-200">
                        <textarea
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Tulis alasan penolakan perubahan profil surveyor..."
                          className="w-full p-2 border border-red-300 rounded-lg text-xs focus:ring-1 focus:ring-[#B3261E] focus:outline-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleRejectUpdate(detailTarget.id)}
                            disabled={submitting[detailTarget.id]}
                            className="bg-[#B3261E] text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-[#93000A] transition-colors disabled:opacity-50"
                          >
                            {submitting[detailTarget.id] ? 'Mengirim...' : 'Kirim Penolakan Pembaruan'}
                          </button>
                          <button
                            onClick={() => { setRejectingUpdate(false); setRejectReason(''); }}
                            className="bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2.5">
                        <button
                          onClick={() => handleApproveUpdate(detailTarget.id)}
                          disabled={submitting[detailTarget.id]}
                          className="flex-1 bg-[#2E5E3B] text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-[#244B2F] transition-all shadow-sm flex items-center justify-center gap-1.5 disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          {submitting[detailTarget.id] ? 'Memproses...' : 'Setujui Pembaruan Profil'}
                        </button>
                        <button
                          onClick={() => setRejectingUpdate(true)}
                          className="bg-[#B3261E]/10 text-[#B3261E] font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-[#B3261E]/20 transition-all flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                          Tolak Pembaruan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Data Pribadi Grid */}
              <div>
                <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-3">
                  Data Pribadi & Kontak
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Email</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.email || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">No. HP / WhatsApp</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.phone || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Institusi / Perusahaan</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.institution || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Bidang Spesialisasi</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.field || 'Surveyor & Pemetaan'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Kriteria</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.kriteria || 'Surveyor'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Alamat / Lokasi</span>
                    <span className="font-semibold text-[#1F2A22]">
                      {detailTarget.alamat_lengkap || (
                        [detailTarget.alamat_kota, detailTarget.alamat_provinsi, detailTarget.location]
                          .filter(Boolean)
                          .join(', ') || '-'
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Tempat, Tanggal Lahir</span>
                    <span className="font-semibold text-[#1F2A22]">
                      {detailTarget.tempat_lahir ? `${detailTarget.tempat_lahir}, ` : ''}
                      {detailTarget.tanggal_lahir
                        ? new Date(detailTarget.tanggal_lahir.toString().slice(0, 10) + 'T00:00:00').toLocaleDateString(
                            'id-ID',
                            { day: 'numeric', month: 'long', year: 'numeric' }
                          )
                        : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Pendidikan Terakhir</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.pendidikan || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Bio / Ringkasan */}
              {(detailTarget.tentang_saya || detailTarget.ringkasan_keahlian || detailTarget.catatan) && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-2">
                    Profil Bio & Ringkasan Keahlian
                  </h4>
                  {detailTarget.ringkasan_keahlian && (
                    <div className="mb-2">
                      <span className="text-xs text-[#414844]/60 block font-medium">Ringkasan Keahlian:</span>
                      <p className="text-xs font-medium text-[#1F2A22] mt-0.5">{detailTarget.ringkasan_keahlian}</p>
                    </div>
                  )}
                  {detailTarget.tentang_saya && (
                    <div className="mb-2">
                      <span className="text-xs text-[#414844]/60 block font-medium">Tentang Saya:</span>
                      <p className="text-xs text-[#1F2A22] leading-relaxed mt-0.5">{detailTarget.tentang_saya}</p>
                    </div>
                  )}
                  {detailTarget.catatan && (
                    <div>
                      <span className="text-xs text-[#414844]/60 block font-medium">Catatan Tambahan:</span>
                      <p className="text-xs text-[#414844] leading-relaxed bg-[#F5F4EF] p-2.5 rounded-lg mt-0.5">
                        {detailTarget.catatan}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Alasan Penolakan (Jika status ditolak) */}
              {detailTarget.reject_reason && (
                <div>
                  <h4 className="font-bold text-[#B3261E] uppercase tracking-wider text-xs border-b border-[#B3261E]/20 pb-1.5 mb-2">
                    Alasan Penolakan / Catatan Perbaikan
                  </h4>
                  <p className="bg-red-50 p-3 rounded-xl text-xs text-[#93000A] leading-relaxed border border-red-200">
                    {detailTarget.reject_reason}
                  </p>
                </div>
              )}

              {/* Riwayat Pendidikan Detail */}
              {detailTarget.educations?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-2">
                    Riwayat Pendidikan ({detailTarget.educations.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {detailTarget.educations.map((e) => (
                      <li key={e.id} className="text-xs bg-[#6B3410]/5 p-2 rounded-lg border border-[#6B3410]/10 flex items-center justify-between gap-2">
                        <div className="flex items-center min-w-0">
                          <span className="material-symbols-outlined text-[16px] text-[#6B3410] shrink-0 mr-1.5">school</span>
                          <span>
                            <strong>{e.jenjang}</strong> — {e.institusi} {e.jurusan ? `(${e.jurusan})` : ''}{' '}
                            {e.tahun_lulus ? `• Lulus ${e.tahun_lulus}` : ''}
                          </span>
                        </div>
                        {e.ijazah_path && (
                          <a
                            href={storageUrl(e.ijazah_path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#2E5E3B] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2 py-0.5 rounded shrink-0 transition-colors"
                          >
                            <span className="material-symbols-outlined text-[13px]">visibility</span>
                            Lihat Ijazah
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Pengalaman Kerja */}
              {detailTarget.experiences?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-2">
                    Pengalaman Kerja ({detailTarget.experiences.length})
                  </h4>
                  <ul className="space-y-2">
                    {detailTarget.experiences.map((exp) => (
                      <li key={exp.id} className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                        <p className="font-bold text-gray-900">{exp.posisi || exp.jabatan} — {exp.perusahaan || exp.instansi}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {exp.tahun_mulai || exp.start_year || ''} - {exp.tahun_selesai || exp.end_year || 'Sekarang'}
                        </p>
                        {exp.deskripsi && <p className="text-gray-700 mt-1">{exp.deskripsi}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sertifikasi & Lisensi */}
              {detailTarget.certificates?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-2">
                    Sertifikasi & Lisensi ({detailTarget.certificates.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {detailTarget.certificates.map((cert) => (
                      <li key={cert.id} className="text-xs bg-emerald-50/50 p-2 rounded-lg border border-emerald-200 flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-emerald-700">card_membership</span>
                          <span><strong>{cert.nama_sertifikat || cert.title}</strong> • {cert.penerbit || cert.issuer || '-'}</span>
                        </div>
                        {cert.tahun && <span className="text-[11px] text-emerald-800 font-bold">{cert.tahun}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Dokumen Identitas (Pas Foto & KTP) */}
              {(detailTarget.photo || detailTarget.ktp_path) && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-3">
                    Dokumen Identitas
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Pas Foto */}
                    <div className="bg-[#F5F4EF] rounded-xl p-3 border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-bold text-[#414844]/60 uppercase mb-2">Pas Foto</p>
                      {detailTarget.photo ? (
                        <div className="space-y-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: storageUrl(detailTarget.photo), title: `Pas Foto - ${detailTarget.name}` })}
                            className="inline-block group focus:outline-none"
                            title="Klik untuk memperbesar pas foto"
                          >
                            <img
                              src={storageUrl(detailTarget.photo)}
                              alt="Foto Profil"
                              className="w-20 h-20 rounded-lg object-cover border border-[#6B3410]/20 mx-auto group-hover:scale-105 transition-transform shadow-xs"
                            />
                            <span className="text-[10px] text-[#6B3410] font-bold block mt-1.5 underline flex items-center justify-center gap-0.5">
                              <span className="material-symbols-outlined text-[13px]">zoom_in</span> Buka Ukuran Asli
                            </span>
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-[#414844]/40 font-medium">Tidak ada foto</span>
                      )}
                    </div>

                    {/* Foto KTP */}
                    <div className="bg-[#F5F4EF] rounded-xl p-3 border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                      <p className="text-[10px] font-bold text-[#414844]/60 uppercase mb-2">Foto KTP (Identitas)</p>
                      {(() => {
                        const ktpPath = detailTarget.ktp_path || detailTarget.documents?.find(d => d.type === 'ktp' || d.label?.toLowerCase().includes('ktp'))?.file_path;
                        return ktpPath ? (
                          <div className="space-y-1.5 text-center">
                            <button
                              type="button"
                              onClick={() => setPreviewImage({ url: storageUrl(ktpPath), title: `Foto KTP (Identitas) - ${detailTarget.name}` })}
                              className="inline-block group focus:outline-none"
                              title="Klik untuk memperbesar foto KTP"
                            >
                              <img
                                src={storageUrl(ktpPath)}
                                alt="Foto KTP"
                                className="w-28 h-20 rounded-lg object-cover border-2 border-blue-400 shadow-xs mx-auto group-hover:scale-105 transition-transform"
                              />
                              <span className="text-[10px] text-blue-700 font-bold block mt-1.5 underline flex items-center justify-center gap-0.5">
                                <span className="material-symbols-outlined text-[13px]">zoom_in</span> Buka Ukuran Asli
                              </span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-rose-500 font-semibold">Belum upload KTP</span>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              )}

              {/* Dokumen & Berkas Terlampir */}
              {detailTarget.documents?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-2">
                    Berkas & Dokumen Surveyor ({detailTarget.documents.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {detailTarget.documents.map((doc) => {
                      const docUrl = storageUrl(doc.file_path || doc.path);
                      return (
                        <a
                          key={doc.id}
                          href={docUrl || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-2.5 rounded-lg border border-[#6B3410]/15 bg-white hover:bg-[#6B3410]/5 transition-colors text-xs font-semibold text-[#6B3410]"
                        >
                          <span className="truncate pr-2">{doc.nama_dokumen || doc.name || 'Dokumen'}</span>
                          <span className="material-symbols-outlined text-[16px] shrink-0">open_in_new</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Area Form Penolakan (Jika tombol Tolak ditekan) */}
              {rejecting && (
                <div className="bg-red-50 p-4 rounded-xl border border-red-200 space-y-3 animate-fadeIn">
                  <h4 className="font-bold text-[#B3261E] text-xs uppercase tracking-wider">
                    Masukkan Alasan Penolakan / Permintaan Perbaikan:
                  </h4>
                  <textarea
                    rows={3}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Contoh: Lampiran KTP kurang jelas, mohon upload ulang kartu sertifikasi..."
                    className="w-full text-xs p-3 border border-red-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setRejecting(false)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 bg-white border border-gray-300 hover:bg-gray-50"
                    >
                      Batal
                    </button>
                    <button
                      onClick={() => handleRejectSurveyor(detailTarget.id)}
                      disabled={submitting[detailTarget.id]}
                      className="px-4 py-1.5 rounded-lg text-xs font-bold text-white bg-[#B3261E] hover:bg-[#93000A] shadow-sm"
                    >
                      {submitting[detailTarget.id] ? 'Memproses...' : 'Kirim Penolakan'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-6 border-t border-[#6B3410]/15 flex flex-wrap items-center justify-between gap-3 bg-[#FAF9F6] rounded-b-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => handleToggleDeactivate(detailTarget)}
                  className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${
                    detailTarget.profile_status === 'nonaktif'
                      ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {detailTarget.profile_status === 'nonaktif' ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
                </button>
                <button
                  onClick={() => {
                    const toDelete = detailTarget;
                    setDetailTarget(null);
                    setDeleteTarget(toDelete);
                  }}
                  className="px-3 py-2 rounded-lg text-xs font-bold text-[#B3261E] bg-[#FFDAD6] hover:bg-red-200 transition-colors"
                >
                  Hapus Surveyor
                </button>
              </div>

              <div className="flex items-center gap-2">
                {!rejecting && detailTarget.profile_status === 'menunggu_verifikasi' && (
                  <>
                    <button
                      onClick={() => setRejecting(true)}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-[#B3261E] bg-red-100 hover:bg-red-200 transition-colors"
                    >
                      Tolak Profil
                    </button>
                    <button
                      onClick={() => handleVerifySurveyor(detailTarget.id)}
                      disabled={submitting[detailTarget.id]}
                      className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-800 shadow-sm transition-colors"
                    >
                      {submitting[detailTarget.id] ? 'Memproses...' : 'Setujui Profil'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => setDetailTarget(null)}
                  className="px-4 py-2 rounded-lg text-xs font-bold text-[#414844] bg-white border border-gray-300 hover:bg-gray-50 transition-colors"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Hapus Surveyor"
        message={`Apakah Anda yakin ingin menghapus surveyor "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />

      {/* Lightbox / Modal Perbesar Foto */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-fadeIn"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-full flex items-center justify-between text-white pb-3 px-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-amber-400">photo_library</span>
                <h4 className="text-sm font-bold tracking-wide truncate">{previewImage.title || 'Pratinjau Foto'}</h4>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1.5 rounded-lg transition-colors font-semibold"
                >
                  <span className="material-symbols-outlined text-sm">open_in_new</span>
                  Tab Baru
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"
                >
                  <span className="material-symbols-outlined text-2xl">close</span>
                </button>
              </div>
            </div>
            <div className="bg-black/40 p-2 rounded-2xl border border-white/10 max-h-[80vh] flex items-center justify-center overflow-hidden">
              <img
                src={previewImage.url}
                alt={previewImage.title || 'Foto'}
                className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}