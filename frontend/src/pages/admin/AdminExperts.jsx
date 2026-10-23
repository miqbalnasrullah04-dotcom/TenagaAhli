import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

const storageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^storage\//i, '').replace(/^\/storage\//i, '').replace(/^\//, '');
  const apiUrl = import.meta.env.VITE_API_URL || 'https://tenagaahli.com/api';
  return `${apiUrl}/files/${cleanPath}`;
};

export default function AdminExperts() {
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || 'all';
  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [detailTarget, setDetailTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [rejecting, setRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const loadData = () => {
    setLoading(true);
    let apiStatus = statusParam;
    if (statusParam === 'disetujui') apiStatus = 'aktif';
    const params = {
      only_tenaga_ahli: 1,
      role_type: 'tenaga_ahli',
      ...(apiStatus && apiStatus !== 'all' ? { status: apiStatus } : {})
    };
    
    api.get('/admin/experts', { params })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setExperts(data);
      })
      .catch(() => setError('Gagal memuat data dari server.'))
      .finally(() => setLoading(false));
  };

  const [rejectingUpdate, setRejectingUpdate] = useState(false);

  const handleVerifyExpert = async (id) => {
    try {
      await api.post(`/admin/experts/${id}/verify-profile`);
      setDetailTarget(null);
      loadData();
      alert('Profil berhasil disetujui.');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyetujui profil.');
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('Tulis alasan penolakan/perbaikan terlebih dahulu.');
      return;
    }
    try {
      await api.post(`/admin/experts/${detailTarget.id}/reject-profile`, { reject_reason: rejectReason });
      setDetailTarget(null);
      setRejecting(false);
      setRejectReason('');
      loadData();
      alert('Permintaan perbaikan telah dikirim ke user.');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak profil.');
    }
  };

  const handleApproveUpdate = async (id) => {
    try {
      await api.post(`/admin/experts/${id}/approve-update`);
      setDetailTarget(null);
      loadData();
      alert('Pembaruan profil berhasil disetujui dan diterapkan.');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyetujui pembaruan profil.');
    }
  };

  const handleRejectUpdate = async () => {
    if (!rejectReason.trim()) {
      alert('Tulis alasan penolakan pembaruan terlebih dahulu.');
      return;
    }
    try {
      await api.post(`/admin/experts/${detailTarget.id}/reject-update`, { reject_reason: rejectReason });
      setDetailTarget(null);
      setRejectingUpdate(false);
      setRejectReason('');
      loadData();
      alert('Pembaruan profil telah ditolak.');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak pembaruan profil.');
    }
  };

  useEffect(() => { loadData(); }, [statusParam]);

  const handleToggleDeactivate = async (expert) => {
    try {
      await api.post(`/admin/experts/${expert.id}/deactivate`);
      if (detailTarget && detailTarget.id === expert.id) {
        setDetailTarget({
          ...detailTarget,
          profile_status: detailTarget.profile_status === 'nonaktif' ? 'aktif' : 'nonaktif'
        });
      }
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status akun.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/experts/${deleteTarget.id}`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus data.');
    }
  };

  const isSurveyor = (target) => {
    if (!target) return false;
    if (target.is_surveyor === true) return true;
    if (target.role_label === 'Surveyor') return true;
    if (target.user?.role_type === 'surveyor') return true;
    if (target.role_type === 'surveyor') return true;
    const kriteria = String(target.kriteria || '').toLowerCase();
    if (kriteria.includes('surveyor')) return true;
    if (Array.isArray(target.kriteria_list) && target.kriteria_list.some((k) => String(k).toLowerCase().includes('surveyor'))) return true;
    const field = String(target.field || '').toLowerCase();
    if (field.includes('surveyor')) return true;
    return false;
  };

  const isTenagaTeknis = (target) => {
    if (!target) return false;
    if (target.is_tenaga_teknis === true) return true;
    if (target.role_label === 'Tenaga Teknis') return true;
    if (target.user?.role_type === 'tenaga_teknis') return true;
    if (target.role_type === 'tenaga_teknis') return true;
    const kriteria = String(target.kriteria || '').toLowerCase();
    if (kriteria.includes('tenaga teknis')) return true;
    if (Array.isArray(target.kriteria_list) && target.kriteria_list.some((k) => String(k).toLowerCase().includes('tenaga teknis'))) return true;
    const field = String(target.field || '').toLowerCase();
    if (field.includes('tenaga teknis')) return true;
    return false;
  };

  const hasTenagaAhli = (target) => {
    if (!target) return false;
    if (target.is_tenaga_ahli === true) return true;
    if (target.role_label === 'Tenaga Ahli') return true;
    if (target.user?.role_type === 'tenaga_ahli') return true;
    if (target.role_type === 'tenaga_ahli') return true;
    const kriteria = String(target.kriteria || '').toLowerCase();
    if (kriteria.includes('tenaga ahli') || kriteria === 'ahli') return true;
    if (Array.isArray(target.kriteria_list) && target.kriteria_list.some((k) => String(k).toLowerCase().includes('tenaga ahli') || String(k).toLowerCase() === 'ahli')) return true;
    return false;
  };

  const filtered = experts.filter((e) => {
    // Menu Manajemen Tenaga Ahli: kecualikan HANYA jika murni surveyor atau tenaga teknis (bukan Tenaga Ahli)
    if (!hasTenagaAhli(e) && (isSurveyor(e) || isTenagaTeknis(e))) return false;

    const q = keyword.toLowerCase();
    const matchesSearch = (e.name || '').toLowerCase().includes(q) || 
                          (e.institution || '').toLowerCase().includes(q) || 
                          (e.email || '').toLowerCase().includes(q);
    return matchesSearch;
  });

  const avatarPalette = ['#6B3410', '#7A5900', '#6B4F3B', '#8B4513', '#414844'];
  const getInitials = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';
  const getAvatarColor = (id) => avatarPalette[(id || 0) % avatarPalette.length];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#6B3410]">Manajemen Tenaga Ahli</h2>
          <p className="text-[#414844]/80 text-sm mt-1">Kelola data, detail profil, dan status keaktifan tenaga ahli TenagaAhli.com.</p>
        </div>
        <Link
          to="/admin/tenaga-ahli/tambah"
          className="flex items-center gap-2 bg-[#6B3410] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#55290A] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Tambah Tenaga Ahli
        </Link>
      </div>

      {error && <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3">{error}</div>}

      <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#6B3410]/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-80">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#414844]/40 text-[20px]">search</span>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari nama, email, atau instansi..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-[#6B3410]/20 rounded-lg focus:ring-2 focus:ring-[#6B3410]/20 focus:border-[#6B3410] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto">
            {[
              { id: 'all', label: 'Semua Status' },
              { id: 'pembaruan_profil', label: 'Pembaruan Profil' },
              { id: 'menunggu_verifikasi', label: 'Pendaftar Baru' },
              { id: 'disetujui', label: 'Disetujui' },
              { id: 'ditolak', label: 'Ditolak' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSearchParams({ status: tab.id })}
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
            Menampilkan <span className="font-bold text-[#414844]">{filtered.length}</span> dari {experts.length} tenaga ahli
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#6B3410]/5 text-[#414844]">
                <th className="px-6 py-3">Tenaga Ahli</th>
                <th className="px-6 py-3">Instansi</th>
                <th className="px-6 py-3">Status Akun</th>
                <th className="px-6 py-3">Status Profil</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6B3410]/10">
              {loading ? (
                [1, 2, 3, 4].map((i) => (
                  <tr key={i}>
                    <td colSpan={5} className="px-6 py-4">
                      <div className="flex items-center gap-3 animate-pulse">
                        <div className="w-9 h-9 rounded-full bg-[#6B3410]/10 shrink-0" />
                        <div className="flex-1 space-y-2">
                          <div className="h-3 w-1/3 bg-[#6B3410]/10 rounded" />
                          <div className="h-2.5 w-1/4 bg-[#6B3410]/10 rounded" />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#414844]/70">
                    <span className="material-symbols-outlined text-[40px] text-[#414844]/25 block mb-2">groups</span>
                    Tidak ada data tenaga ahli yang cocok.
                  </td>
                </tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.id} className="hover:bg-[#6B3410]/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {exp.photo ? (
                          <button
                            type="button"
                            onClick={() => setPreviewImage({ url: storageUrl(exp.photo), title: `Pas Foto - ${exp.name}` })}
                            className="focus:outline-none shrink-0 group relative"
                            title="Klik untuk perbesar foto"
                          >
                            <img
                              src={storageUrl(exp.photo)}
                              alt={exp.name}
                              className="w-9 h-9 rounded-full object-cover border border-[#6B3410]/20 shadow-xs group-hover:scale-105 transition-transform"
                            />
                          </button>
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                            style={{ backgroundColor: getAvatarColor(exp.id) }}
                          >
                            {getInitials(exp.name)}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-semibold text-[#6B3410] truncate">{exp.name}</p>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSurveyor(exp)
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                            }`}>
                              {isSurveyor(exp) ? 'Surveyor' : 'Tenaga Ahli'}
                            </span>
                          </div>
                          <p className="text-xs text-[#414844]/60 truncate">
                            {isSurveyor(exp) ? 'ID Surveyor' : 'ID Tenaga Ahli'}: #{exp.id} • {exp.email || '-'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#414844]/80">{exp.institution || '-'}</td>
                    <td className="px-6 py-4">
                      {exp.update_status === 'menunggu_verifikasi' ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full animate-pulse flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                            Pembaruan Profil
                          </span>
                          <span className="text-[10px] text-gray-400">Akun: {exp.profile_status}</span>
                        </div>
                      ) : exp.profile_status === 'nonaktif' ? (
                        <span className="text-xs font-bold text-[#B3261E] bg-[#FFDAD6] px-2.5 py-1 rounded-full">Nonaktif</span>
                      ) : exp.profile_status === 'aktif' ? (
                        <span className="text-xs font-bold text-[#6B3410] bg-[#F5EBE1] px-2.5 py-1 rounded-full">Aktif</span>
                      ) : (
                        <span className="text-xs font-bold text-[#7A5900] bg-[#FFF4D6] px-2.5 py-1 rounded-full">Pending</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {exp.verified ? (
                        <span className="text-xs font-bold text-[#6B3410] flex items-center gap-1">
                          <span className="material-symbols-outlined text-base">verified</span> Terverifikasi
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-[#414844]/50">Belum Verifikasi</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          onClick={() => setDetailTarget(exp)}
                          title="Lihat detail"
                          className="flex items-center gap-1 text-[#6B3410] bg-[#6B3410]/10 hover:bg-[#6B3410]/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">visibility</span>
                          Detail
                        </button>
                        <Link
                          to={`/admin/tenaga-ahli/${exp.id}/edit`}
                          title="Edit data"
                          className="flex items-center gap-1 text-[#7A5900] bg-[#7A5900]/10 hover:bg-[#7A5900]/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          Edit
                        </Link>
                        <button
                          onClick={() => handleToggleDeactivate(exp)}
                          title={exp.profile_status === 'nonaktif' ? 'Aktifkan akun' : 'Nonaktifkan akun'}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                            exp.profile_status === 'nonaktif'
                              ? 'text-[#6B3410] bg-[#6B3410]/10 hover:bg-[#6B3410]/20'
                              : 'text-[#B3261E] bg-[#B3261E]/10 hover:bg-[#B3261E]/20'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {exp.profile_status === 'nonaktif' ? 'toggle_on' : 'toggle_off'}
                          </span>
                          {exp.profile_status === 'nonaktif' ? 'Aktifkan' : 'Nonaktifkan'}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(exp)}
                          title="Hapus data"
                          className="flex items-center gap-1 text-[#B3261E]/80 bg-[#B3261E]/10 hover:bg-[#B3261E]/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Profil */}
      {detailTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-[#6B3410]/15">
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
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-xs"
                    style={{ backgroundColor: getAvatarColor(detailTarget.id) }}
                  >
                    {getInitials(detailTarget.name)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-[#6B3410]">{detailTarget.name}</h3>
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isSurveyor(detailTarget)
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-amber-100 text-amber-800 border border-amber-200'
                    }`}>
                      {isSurveyor(detailTarget) ? 'Surveyor' : 'Tenaga Ahli'}
                    </span>
                  </div>
                  <p className="text-xs text-[#414844]/60 mt-0.5 font-medium">
                    {isSurveyor(detailTarget) ? 'ID Surveyor' : 'ID Tenaga Ahli'}: #{detailTarget.id}
                  </p>
                </div>
              </div>
              <button onClick={() => setDetailTarget(null)} className="text-[#414844]/60 hover:text-[#6B3410] p-1.5 rounded-full hover:bg-[#F5F4EF] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-sm">
              {/* Review Perubahan Profil (Pending Changes) */}
              {detailTarget.update_status === 'menunggu_verifikasi' && detailTarget.pending_changes && (
                <div className="bg-amber-50/80 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 space-y-4 shadow-sm animate-fadeIn">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-amber-600 text-2xl animate-pulse">edit_note</span>
                      <div>
                        <h4 className="font-bold text-amber-900 text-sm">Pembaruan Profil Menunggu Persetujuan Admin</h4>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Tenaga ahli ini telah memperbarui datanya. Bandingkan data lama vs data baru yang diajukan di bawah ini:
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
                        field: 'Bidang Keahlian',
                        institution: 'Institusi / Instansi',
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
                        location: 'Lokasi Tenaga Ahli',
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
                                  <a href={storageUrl(oldVal)} target="_blank" rel="noreferrer" title="Klik untuk lihat KTP asli" className="inline-block group relative">
                                    <img src={storageUrl(oldVal)} className="w-24 h-16 rounded-lg object-cover border border-gray-200 mx-auto group-hover:opacity-90" alt="KTP Lama" />
                                    <span className="text-[10px] text-blue-600 block mt-1 underline">Lihat KTP Asli</span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Belum ada KTP</span>
                                )}
                              </div>
                              <span className="material-symbols-outlined text-amber-500 text-2xl">arrow_forward</span>
                              <div className="text-center">
                                <span className="text-[11px] font-bold text-green-700 block mb-1">KTP Baru:</span>
                                {newVal ? (
                                  <a href={storageUrl(newVal)} target="_blank" rel="noreferrer" title="Klik untuk lihat KTP baru ukuran penuh" className="inline-block group relative">
                                    <img src={storageUrl(newVal)} className="w-24 h-16 rounded-lg object-cover border-2 border-green-500 ring-2 ring-green-200 mx-auto group-hover:scale-105 transition-transform" alt="KTP Baru" />
                                    <span className="text-[10px] text-green-700 font-bold block mt-1 underline flex items-center justify-center gap-0.5">
                                      <span className="material-symbols-outlined text-[13px]">zoom_in</span> Buka KTP Asli
                                    </span>
                                  </a>
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
                          placeholder="Tulis alasan penolakan perubahan profil..."
                          className="w-full p-2 border border-red-300 rounded-lg text-xs focus:ring-1 focus:ring-[#B3261E] focus:outline-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={handleRejectUpdate}
                            className="bg-[#B3261E] text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-[#93000A] transition-colors"
                          >
                            Kirim Penolakan Pembaruan
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
                          className="flex-1 bg-[#2E5E3B] text-white font-bold px-4 py-2.5 rounded-xl text-xs hover:bg-[#244B2F] transition-all shadow-sm flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[18px]">check_circle</span>
                          Setujui Pembaruan Profil
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

              {/* Data Diri Grid */}
              <div>
                <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-3">Data Pribadi</h4>
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
                    <span className="text-xs text-[#414844]/60 block font-medium">Institusi</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.institution || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Bidang Keahlian</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.field || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Kriteria</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.kriteria || '-'}</span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Alamat</span>
                    <span className="font-semibold text-[#1F2A22]">
                      {detailTarget.alamat_kota ? `${detailTarget.alamat_kota}, ` : ''}
                      {detailTarget.alamat_provinsi || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Tempat, Tanggal Lahir</span>
                    <span className="font-semibold text-[#1F2A22]">
                      {detailTarget.tempat_lahir ? `${detailTarget.tempat_lahir}, ` : ''}
                      {detailTarget.tanggal_lahir ? new Date(detailTarget.tanggal_lahir.toString().slice(0, 10) + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Pendidikan Terakhir (Form)</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.pendidikan || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Catatan */}
              {detailTarget.catatan && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-2">Catatan</h4>
                  <p className="bg-[#F5F4EF] p-4 rounded-xl text-xs text-[#414844] leading-relaxed whitespace-pre-line border border-outline-variant/30">
                    {detailTarget.catatan}
                  </p>
                </div>
              )}

              {/* Riwayat Pendidikan detail */}
              {detailTarget.educations?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-2">Pendidikan Detail</h4>
                  <ul className="space-y-1.5">
                    {detailTarget.educations.map((e) => (
                      <li key={e.id} className="text-xs bg-[#6B3410]/5 p-2 rounded-lg border border-[#6B3410]/10 flex items-center justify-between gap-2">
                        <div className="flex items-center min-w-0">
                          <span className="material-symbols-outlined text-[16px] text-[#6B3410] shrink-0 mr-1.5">school</span>
                          <span><strong>{e.jenjang}</strong> — {e.institusi} {e.jurusan ? `(${e.jurusan})` : ''} {e.tahun_lulus ? `(Lulus ${e.tahun_lulus})` : ''}</span>
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

              {/* Profil Bio */}
              {(detailTarget.tentang_saya || detailTarget.ringkasan_keahlian || detailTarget.kriteria_list?.length > 0) && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-2">Profil Bio</h4>
                  <div className="space-y-3">
                    {detailTarget.kriteria_list?.length > 0 && (
                      <div>
                        <span className="text-xs text-[#414844]/60 block font-medium">Kriteria Profesional</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {detailTarget.kriteria_list.map((k, i) => (
                            <span key={i} className="text-[10px] bg-[#6B3410]/10 text-[#6B3410] px-2 py-0.5 rounded-full font-bold">{k}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {detailTarget.tentang_saya && (
                      <div>
                        <span className="text-xs text-[#414844]/60 block font-medium">Tentang Saya</span>
                        <p className="text-xs font-semibold text-[#1F2A22] mt-0.5">{detailTarget.tentang_saya}</p>
                      </div>
                    )}
                    {detailTarget.ringkasan_keahlian && (
                      <div>
                        <span className="text-xs text-[#414844]/60 block font-medium">Ringkasan Keahlian</span>
                        <p className="text-xs font-semibold text-[#1F2A22] mt-0.5">{detailTarget.ringkasan_keahlian}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Pengalaman Kerja */}
              {detailTarget.experiences?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-2">Pekerjaan</h4>
                  <ul className="space-y-2">
                    {detailTarget.experiences.map((e) => (
                      <li key={e.id} className="text-xs bg-[#F5F4EF] p-2.5 rounded-lg border border-outline-variant/30">
                        <div className="font-bold text-[#1F2A22]">{e.posisi}</div>
                        <div className="text-[#414844]/80">{e.instansi} • {e.tahun_mulai} - {e.tahun_selesai || 'Sekarang'}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sertifikasi */}
              {detailTarget.certificates?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-2">Sertifikasi</h4>
                  <ul className="space-y-2">
                    {detailTarget.certificates.map((c) => (
                      <li key={c.id} className="text-xs bg-[#F5F4EF] p-2.5 rounded-lg border border-outline-variant/30 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#1F2A22]">{c.nama_sertifikat}</div>
                          <div className="text-[#414844]/80">{c.penerbit} • {c.tahun}</div>
                        </div>
                        {c.file_path && (
                           <a href={storageUrl(c.file_path)} target="_blank" rel="noreferrer" className="text-[#6B3410] hover:underline font-bold">Lihat</a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Link Akademik */}
              {(detailTarget.google_scholar_url || detailTarget.scopus_url || detailTarget.sinta_url || detailTarget.orcid_url) && (
                <div>
                  <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-2">Link Akademik</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailTarget.google_scholar_url && (
                      <a href={detailTarget.google_scholar_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#6B3410] hover:underline bg-[#6B3410]/10 px-2.5 py-1 rounded-lg font-bold">Google Scholar</a>
                    )}
                    {detailTarget.scopus_url && (
                      <a href={detailTarget.scopus_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#6B3410] hover:underline bg-[#6B3410]/10 px-2.5 py-1 rounded-lg font-bold">Scopus</a>
                    )}
                    {detailTarget.sinta_url && (
                      <a href={detailTarget.sinta_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#6B3410] hover:underline bg-[#6B3410]/10 px-2.5 py-1 rounded-lg font-bold">SINTA</a>
                    )}
                    {detailTarget.orcid_url && (
                      <a href={detailTarget.orcid_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#6B3410] hover:underline bg-[#6B3410]/10 px-2.5 py-1 rounded-lg font-bold">ORCID</a>
                    )}
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              <div>
                <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-3">Dokumen</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

                  {/* Bukti Kompetensi */}
                  <div className="bg-[#F5F4EF] rounded-xl p-3 border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-[#414844]/60 uppercase mb-2">Bukti Kompetensi</p>
                    {(() => {
                      const buktiPath = detailTarget.bukti_kompetensi_path || detailTarget.documents?.find(d => d.type === 'lainnya' && d.label?.includes('Bukti'))?.file_path;
                      return buktiPath ? (
                        <div className="space-y-2 text-center">
                          <span className="material-symbols-outlined text-[36px] text-[#6B3410]">verified</span>
                          <a
                            href={storageUrl(buktiPath)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#6B3410] hover:underline text-xs font-bold block"
                          >
                            Buka Bukti Berkas
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-[#414844]/40 font-medium">Tidak ada berkas bukti</span>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Verification & Status Section */}
              {detailTarget.profile_status === 'menunggu_verifikasi' ? (
                <div className="bg-[#FFF4D6] rounded-xl p-4 border border-[#FCD34D] space-y-3">
                  <div>
                    <span className="text-[#7A5900] block font-bold text-xs">
                      Verifikasi Profil {isSurveyor(detailTarget) ? 'Surveyor' : 'Tenaga Ahli'}
                    </span>
                    <span className="text-[11px] text-[#414844]/70">Tinjau kelengkapan berkas di atas lalu pilih tindakan persetujuan.</span>
                  </div>
                  
                  {rejecting ? (
                    <div className="space-y-2">
                      <textarea
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="Tulis alasan penolakan / instruksi perbaikan..."
                        className="w-full p-2 border border-red-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-[#B3261E] focus:outline-none"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleReject}
                          className="bg-[#B3261E] text-white font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-[#93000A] transition-colors"
                        >
                          Kirim Catatan Perbaikan
                        </button>
                        <button
                          onClick={() => { setRejecting(false); setRejectReason(''); }}
                          className="bg-gray-100 text-gray-700 font-bold px-3 py-1.5 rounded-lg text-xs hover:bg-gray-200 transition-colors"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVerifyExpert(detailTarget.id)}
                        className="bg-[#6B3410] text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-[#55290A] transition-colors shadow-sm"
                      >
                        Setujui & Publikasikan
                      </button>
                      <button
                        onClick={() => setRejecting(true)}
                        className="bg-[#B3261E]/10 text-[#B3261E] font-bold px-4 py-2 rounded-lg text-xs hover:bg-[#B3261E]/20 transition-colors"
                      >
                        Tolak (Perlu Perbaikan)
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-[#F5F4EF] rounded-xl p-4 border border-outline-variant/30 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[#414844]/60 block font-medium">Status Akun Saat Ini</span>
                    <span className={`font-bold text-sm ${detailTarget.profile_status === 'nonaktif' ? 'text-[#B3261E]' : 'text-[#6B3410]'}`}>
                      {detailTarget.profile_status === 'nonaktif' ? 'Nonaktif' : 'Aktif'}
                    </span>
                  </div>
                  
                  <button
                    onClick={() => handleToggleDeactivate(detailTarget)}
                    className={`px-4 py-2.5 rounded-xl font-bold transition-all text-xs text-white ${
                      detailTarget.profile_status === 'nonaktif'
                        ? 'bg-[#6B3410] hover:bg-[#55290A]'
                        : 'bg-[#B3261E] hover:bg-[#93000A]'
                    }`}
                  >
                    {detailTarget.profile_status === 'nonaktif' ? 'Aktifkan Akun' : 'Nonaktifkan Akun'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Yakin ingin menghapus "${deleteTarget?.name}"? Tindakan ini tidak bisa dibatalkan.`}
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