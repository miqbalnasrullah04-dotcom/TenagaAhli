import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { useTranslation } from '../../context/LanguageContext.jsx';

const storageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const cleanPath = path.replace(/^storage\//i, '').replace(/^\/storage\//i, '').replace(/^\//, '');
  const apiUrl = import.meta.env.VITE_API_URL || 'https://tenagaahli.com/api';
  return `${apiUrl}/files/${cleanPath}`;
};

const statusLabel = {
  draft: { text: 'Draft', color: '#414844', bg: '#F5F4F0' },
  menunggu_verifikasi: { text: 'Pendaftar Baru', color: '#7A5900', bg: '#FFF4D6' },
  pembaruan_profil: { text: 'Pembaruan Profil', color: '#1E40AF', bg: '#DBEAFE' },
  aktif: { text: 'Disetujui', color: '#6B3410', bg: '#F5EBE1' },
  ditolak: { text: 'Perlu Perbaikan', color: '#B3261E', bg: '#FFDAD6' },
};

const FIELD_LABELS = {
  name: 'Nama Lengkap',
  institution: 'Institusi / Perusahaan',
  field: 'Bidang Keahlian',
  phone: 'No. Handphone / WhatsApp',
  kriteria: 'Kriteria Utama',
  kriteria_list: 'Daftar Kriteria',
  alamat_lengkap: 'Alamat Lengkap',
  alamat_kota: 'Kota / Kabupaten',
  alamat_provinsi: 'Provinsi',
  location: 'Lokasi Tampilan',
  lat: 'Titik Latitude',
  lng: 'Titik Longitude',
  tempat_lahir: 'Tempat Lahir',
  tanggal_lahir: 'Tanggal Lahir',
  active_since: 'Aktif Sejak (Tahun)',
  tentang_saya: 'Tentang Saya (Bio)',
  ringkasan_keahlian: 'Ringkasan Keahlian',
  bidang_utama: 'Bidang Utama',
  keahlian: 'Keahlian',
  spesialisasi: 'Spesialisasi',
  kompetensi: 'Kompetensi',
  sosial: 'Media Sosial',
  bank_name: 'Nama Bank',
  bank_account: 'Nomor Rekening',
  bank_account_name: 'Nama Pemilik Rekening',
  scopus_url: 'Scopus URL',
  scopus_metrics: 'Scopus Metrics',
  google_scholar_url: 'Google Scholar URL',
  google_scholar_metrics: 'Scholar Metrics',
  sinta_url: 'SINTA URL',
  sinta_metrics: 'SINTA Metrics',
  orcid_url: 'ORCID URL',
  orcid_metrics: 'ORCID Metrics',
  researchgate_url: 'ResearchGate URL',
  researchgate_metrics: 'ResearchGate Metrics',
  photo: 'Foto Profil',
  cover: 'Foto Cover',
  ktp_path: 'Foto KTP (Identitas)',
  gallery: 'Galeri Foto Portofolio',
  galeri: 'Galeri Foto Portofolio',
  pengalaman_proyek: 'Pengalaman Proyek',
  total_proyek: 'Total Portofolio Proyek',
};

export default function AdminUserVerification() {
  const [experts, setExperts] = useState([]);
  const [filteredExperts, setFilteredExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('menunggu_verifikasi');
  const [roleFilter, setRoleFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTarget, setDetailTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingUpdate, setRejectingUpdate] = useState(false);
  const [actionError, setActionError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);

  const getInitials = (name = '') =>
    name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

  // Helper akurat untuk mengekstrak semua peran/kriteria yang diajukan pendaftar
  const getRoles = (target) => {
    if (!target) return [];
    const roles = [];
    const rawKriteria = Array.isArray(target.kriteria_list)
      ? target.kriteria_list
      : (target.kriteria ? [target.kriteria] : []);
    const field = String(target.field || '').toLowerCase();
    const userRoleType = String(target.user?.role_type || target.role_type || '').toLowerCase();

    // Deteksi Surveyor
    const hasSurveyor =
      userRoleType === 'surveyor' ||
      target.is_surveyor === true ||
      target.role_label === 'Surveyor' ||
      rawKriteria.some((k) => String(k).toLowerCase().includes('surveyor')) ||
      field.includes('surveyor');

    // Deteksi Tenaga Teknis
    const hasTenagaTeknis =
      userRoleType === 'tenaga_teknis' ||
      target.is_tenaga_teknis === true ||
      target.role_label === 'Tenaga Teknis' ||
      rawKriteria.some((k) => String(k).toLowerCase().includes('tenaga teknis')) ||
      field.includes('tenaga teknis');

    // Deteksi Tenaga Ahli (default pendaftar atau eksplisit tenaga_ahli)
    const hasTenagaAhli =
      userRoleType === 'tenaga_ahli' ||
      target.is_also_expert ||
      rawKriteria.some((k) => String(k).toLowerCase().includes('tenaga ahli') || String(k).toLowerCase() === 'ahli') ||
      (!hasSurveyor && !hasTenagaTeknis);

    if (hasTenagaAhli) {
      roles.push({
        id: 'tenaga_ahli',
        label: 'Tenaga Ahli',
        badgeClass: 'bg-amber-100 text-[#8B4513] border-amber-300 font-bold',
      });
    }
    if (hasTenagaTeknis) {
      roles.push({
        id: 'tenaga_teknis',
        label: 'Tenaga Teknis',
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      });
    }
    if (hasSurveyor) {
      roles.push({
        id: 'surveyor',
        label: 'Surveyor',
        badgeClass: 'bg-sky-100 text-sky-800 border-sky-300 font-bold',
      });
    }

    if (roles.length === 0) {
      roles.push({
        id: 'tenaga_ahli',
        label: 'Tenaga Ahli',
        badgeClass: 'bg-amber-100 text-[#8B4513] border-amber-300 font-bold',
      });
    }

    return roles;
  };

  const isSurveyor = (target) => getRoles(target).some((r) => r.id === 'surveyor');
  const isTenagaTeknis = (target) => getRoles(target).some((r) => r.id === 'tenaga_teknis');
  const isTenagaAhli = (target) => getRoles(target).some((r) => r.id === 'tenaga_ahli');

  const [tabCounts, setTabCounts] = useState({
    menunggu_verifikasi: 0,
    pembaruan_profil: 0,
    aktif: 0,
    ditolak: 0,
  });

  const loadCounts = async () => {
    try {
      const [resNew, resUpdate, resAktif, resDitolak] = await Promise.all([
        api.get('/admin/experts', { params: { all_roles: true, status: 'menunggu_verifikasi' } }),
        api.get('/admin/experts', { params: { all_roles: true, status: 'pembaruan_profil' } }),
        api.get('/admin/experts', { params: { all_roles: true, status: 'aktif' } }),
        api.get('/admin/experts', { params: { all_roles: true, status: 'ditolak' } }),
      ]);
      setTabCounts({
        menunggu_verifikasi: Array.isArray(resNew.data) ? resNew.data.length : 0,
        pembaruan_profil: Array.isArray(resUpdate.data) ? resUpdate.data.length : 0,
        aktif: Array.isArray(resAktif.data) ? resAktif.data.length : 0,
        ditolak: Array.isArray(resDitolak.data) ? resDitolak.data.length : 0,
      });
    } catch {
      // ignore
    }
  };

  const loadData = () => {
    setLoading(true);
    api
      .get('/admin/experts', { params: { all_roles: true, ...(filter ? { status: filter } : {}) } })
      .then((res) => {
        setExperts(res.data);
        setFilteredExperts(res.data);
      })
      .catch(() => setError('Gagal memuat data.'))
      .finally(() => setLoading(false));
    loadCounts();
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Filter experts berdasarkan search query & role
  useEffect(() => {
    let filtered = experts;
    if (roleFilter === 'surveyor') {
      filtered = filtered.filter(isSurveyor);
    } else if (roleFilter === 'tenaga_teknis') {
      filtered = filtered.filter(isTenagaTeknis);
    } else if (roleFilter === 'tenaga_ahli') {
      filtered = filtered.filter(isTenagaAhli);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((exp) => {
        return (
          exp.name?.toLowerCase().includes(query) ||
          exp.email?.toLowerCase().includes(query) ||
          exp.user?.email?.toLowerCase().includes(query) ||
          exp.phone?.toLowerCase().includes(query) ||
          exp.field?.toLowerCase().includes(query) ||
          exp.institution?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredExperts(filtered);
  }, [searchQuery, roleFilter, experts]);

  const handleVerify = async (id) => {
    setActionError('');
    try {
      await api.post(`/admin/experts/${id}/verify-profile`);
      setDetailTarget(null);
      loadData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal memverifikasi.');
      if (err.response?.data?.missing) {
        setActionError(
          `${err.response.data.message} (${err.response.data.missing.join(', ')})`
        );
      }
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await api.post(`/admin/experts/${rejectTarget.id}/reject-profile`, { reject_reason: rejectReason });
      setRejectTarget(null);
      setRejectReason('');
      setDetailTarget(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengirim permintaan perbaikan.');
    }
  };

  const handleApproveUpdate = async (id) => {
    setActionError('');
    try {
      await api.post(`/admin/experts/${id}/approve-update`);
      setDetailTarget(null);
      loadData();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Gagal menyetujui pembaruan profil.');
    }
  };

  const handleRejectUpdate = async () => {
    if (!rejectTarget) return;
    try {
      await api.post(`/admin/experts/${rejectTarget.id}/reject-update`, { reject_reason: rejectReason });
      setRejectTarget(null);
      setRejectReason('');
      setRejectingUpdate(false);
      setDetailTarget(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak pembaruan profil.');
    }
  };

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#6B3410]">Verifikasi Data</h2>
        <p className="text-[#414844]/80 text-sm mt-1">Periksa kelengkapan berkas dan data pendaftar baru sebelum diaktifkan.</p>
      </div>

      {error && <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3">{error}</div>}

      <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm overflow-hidden">
        {/* Search Bar & Role Filter */}
        <div className="p-5 border-b border-[#6B3410]/15">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#414844]/40 text-[20px]">
                search
              </span>
              <input
                type="text"
                placeholder="Cari nama, email, nomor HP, bidang, atau institusi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-[#6B3410]/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30 focus:border-[#6B3410] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#414844]/40 hover:text-[#6B3410] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full sm:w-44 px-3 py-2 text-xs font-bold border border-[#6B3410]/20 rounded-lg bg-white text-[#414844] focus:outline-none focus:ring-2 focus:ring-[#6B3410]/20"
            >
              <option value="all">Semua Peran</option>
              <option value="tenaga_ahli">Tenaga Ahli</option>
              <option value="tenaga_teknis">Tenaga Teknis</option>
              <option value="surveyor">Surveyor</option>
            </select>
          </div>
          {searchQuery && (
            <p className="text-xs text-[#414844]/60 mt-2">
              Menampilkan {filteredExperts.length} dari {experts.length} hasil
            </p>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="p-5 border-b border-[#6B3410]/15 flex gap-2 overflow-x-auto">
          {['menunggu_verifikasi', 'pembaruan_profil', 'aktif', 'ditolak'].map((s) => {
            const count = tabCounts[s] || 0;
            return (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                  filter === s ? 'bg-[#6B3410] text-white shadow-sm' : 'bg-[#6B3410]/5 text-[#414844] hover:bg-[#6B3410]/10'
                }`}
              >
                <span>{statusLabel[s].text}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                    s === 'pembaruan_profil'
                      ? 'bg-blue-600 text-white animate-pulse'
                      : s === 'menunggu_verifikasi'
                      ? 'bg-amber-600 text-white'
                      : filter === s ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#6B3410]/5 text-[#414844]">
                <th className="px-6 py-3">Nama Lengkap</th>
                <th className="px-6 py-3">Peran / Role</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">No. HP</th>
                <th className="px-6 py-3">Bidang Keahlian</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6B3410]/10">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#414844]/70">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredExperts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-[#414844]/70">
                    {searchQuery ? `Tidak ditemukan hasil untuk "${searchQuery}"` : 'Tidak ada pendaftar pada status ini.'}
                  </td>
                </tr>
              ) : (
                filteredExperts.map((exp) => {
                  const s = statusLabel[exp.profile_status] || statusLabel.draft;
                  const expRoles = getRoles(exp);
                  return (
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
                                className="w-10 h-10 rounded-full object-cover border border-[#6B3410]/20 shadow-xs group-hover:scale-105 transition-transform"
                              />
                            </button>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-[#6B3410]/10 text-[#6B3410] font-bold flex items-center justify-center text-xs shrink-0">
                              {getInitials(exp.name)}
                            </div>
                          )}
                          <div className="min-w-0">
                            <span className="font-semibold text-[#6B3410] block">{exp.name}</span>
                            <p className="text-xs text-[#414844]/60 font-medium">ID: #{exp.id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Kolom Status Role / Peran yang Diajukan */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {expRoles.map((role) => (
                            <span
                              key={role.id}
                              className={`inline-flex items-center text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${role.badgeClass}`}
                            >
                              {role.label}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-[#414844]/80">{exp.user?.email || exp.email}</td>
                      <td className="px-6 py-4 text-[#414844]/80">{exp.phone || '-'}</td>
                      <td className="px-6 py-4 text-[#414844]/80">{exp.field || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: s.color, backgroundColor: s.bg }}>
                            {s.text}
                          </span>
                          {exp.update_status === 'menunggu_verifikasi' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
                              Ada Pembaruan
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setDetailTarget(exp)}
                          className="bg-[#6B3410]/10 hover:bg-[#6B3410]/20 text-[#6B3410] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
                        >
                          Lihat Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detail Verifikasi */}
      {detailTarget && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-fadeIn">
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
                  <div className="w-12 h-12 rounded-xl bg-[#6B3410]/10 text-[#6B3410] font-bold flex items-center justify-center text-sm shrink-0">
                    {getInitials(detailTarget.name)}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-[#6B3410]">{detailTarget.name}</h3>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getRoles(detailTarget).map((role) => (
                        <span
                          key={role.id}
                          className={`text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border shadow-2xs ${role.badgeClass}`}
                        >
                          {role.label}
                        </span>
                      ))}
                    </div>
                  </div>
                  <p className="text-xs text-[#414844]/60 mt-0.5 font-medium">
                    ID Profil: #{detailTarget.id}
                  </p>
                </div>
              </div>
              <button onClick={() => setDetailTarget(null)} className="text-[#414844]/60 hover:text-[#6B3410] p-1.5 rounded-full hover:bg-[#F5F4EF] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-sm">
              {actionError && <div className="bg-[#FFDAD6] text-[#93000A] rounded-xl p-4 font-bold">{actionError}</div>}

              {/* ── Komparasi Pembaruan Data yang Diajukan ── */}
              {detailTarget.update_status === 'menunggu_verifikasi' && detailTarget.pending_changes && Object.keys(detailTarget.pending_changes).length > 0 && (
                <div className="bg-gradient-to-br from-blue-50/90 to-indigo-50/80 border-2 border-blue-300 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-blue-200">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-blue-700 text-xl">published_with_changes</span>
                      <div>
                        <h4 className="font-bold text-blue-950 text-sm">
                          Pembaruan Profil yang Diajukan (Menunggu Konfirmasi)
                        </h4>
                        <p className="text-xs text-blue-800/80">
                          Data profil publik saat ini masih memakai versi lama. Periksa perbandingan data di bawah sebelum menyetujui:
                        </p>
                      </div>
                    </div>
                    {detailTarget.update_submitted_at && (
                      <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200 shrink-0">
                        {new Date(detailTarget.update_submitted_at).toLocaleString('id-ID')}
                      </span>
                    )}
                  </div>

                  <div className="space-y-3">
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
                          <div className="bg-white p-3.5 rounded-xl border border-blue-200/80 text-center text-xs text-blue-900">
                            Tidak ada perbedaan data dengan profil aktif saat ini.
                          </div>
                        );
                      }

                      return changedEntries.map(([key, newVal]) => {
                      const label = FIELD_LABELS[key] || key;
                      const oldVal = detailTarget[key];

                      if (key === 'photo') {
                        return (
                          <div key={key} className="bg-white p-3.5 rounded-xl border border-blue-200/80">
                            <span className="text-xs font-bold text-blue-900 block mb-2">{label}</span>
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <span className="text-[11px] text-gray-500 block mb-1">Foto Aktif Saat Ini:</span>
                                {oldVal ? (
                                  <a href={storageUrl(oldVal)} target="_blank" rel="noreferrer" title="Klik untuk lihat foto asli" className="inline-block group relative">
                                    <img src={storageUrl(oldVal)} className="w-20 h-20 rounded-xl object-cover border border-gray-200 mx-auto group-hover:opacity-90" alt="Foto Lama" />
                                    <span className="text-[10px] text-blue-600 block mt-1 underline">Lihat Foto Asli</span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Tidak ada foto</span>
                                )}
                              </div>
                              <span className="material-symbols-outlined text-blue-500 text-2xl">arrow_forward</span>
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
                          <div key={key} className="bg-white p-3.5 rounded-xl border border-blue-200/80">
                            <span className="text-xs font-bold text-blue-900 block mb-2">{label}</span>
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <span className="text-[11px] text-gray-500 block mb-1">KTP Aktif Saat Ini:</span>
                                {oldVal ? (
                                  <a href={storageUrl(oldVal)} target="_blank" rel="noreferrer" title="Klik untuk lihat KTP asli" className="inline-block group relative">
                                    <img src={storageUrl(oldVal)} className="w-24 h-16 rounded-lg object-cover border border-gray-200 mx-auto group-hover:opacity-90" alt="KTP Lama" />
                                    <span className="text-[10px] text-blue-600 block mt-1 underline">Lihat KTP Asli</span>
                                  </a>
                                ) : (
                                  <span className="text-xs text-gray-400 italic">Belum ada KTP</span>
                                )}
                              </div>
                              <span className="material-symbols-outlined text-blue-500 text-2xl">arrow_forward</span>
                              <div className="text-center">
                                <span className="text-[11px] font-bold text-green-700 block mb-1">KTP Baru Diajukan:</span>
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
                          <div key={key} className="bg-white p-3.5 rounded-xl border border-blue-200/80">
                            <span className="text-xs font-bold text-blue-900 block mb-2">{label}</span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <div>
                                <span className="text-[11px] text-gray-500 block mb-1">Cover Aktif Saat Ini:</span>
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
                          <div key={key} className="bg-white p-4 rounded-xl border border-blue-200/80 space-y-3">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-2 flex-wrap gap-2">
                              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[18px] text-blue-600">photo_library</span>
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
                              <img src={storageUrl(v)} alt="" className="w-28 h-20 rounded-lg object-cover border-2 border-blue-400 group-hover:scale-105 transition-transform shadow-xs" />
                              <span className="text-[10px] text-blue-700 font-bold block mt-1 underline">Lihat Gambar</span>
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
                        <div key={key} className="bg-white p-3.5 rounded-xl border border-blue-200/80 text-xs">
                          <span className="font-bold text-blue-900 block mb-1.5">{label}</span>
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
                </div>
              )}

              {/* Status Peran & Kriteria yang Diajukan */}
              <div className="bg-[#FAFBF9] border border-[#6B3410]/20 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
                <div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-[#6B3410]">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    <span>Status Peran / Kriteria yang Diajukan:</span>
                  </div>
                  <p className="text-xs text-[#414844]/70 mt-0.5">
                    Pendaftar mengajukan verifikasi untuk kriteria di samping. Periksa berkas dan sertifikasi yang bersangkutan.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                  {getRoles(detailTarget).map((role) => (
                    <span
                      key={role.id}
                      className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-lg border shadow-xs ${role.badgeClass}`}
                    >
                      {role.label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Data Diri Grid */}
              <div>
                <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-3">Data Pribadi</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Email</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.user?.email || detailTarget.email || '-'}</span>
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
                    <span className="text-xs text-[#414844]/60 block font-medium">Tempat, Tanggal Lahir</span>
                    <span className="font-semibold text-[#1F2A22]">
                      {detailTarget.tempat_lahir ? `${detailTarget.tempat_lahir}, ` : ''}
                      {detailTarget.tanggal_lahir ? new Date(detailTarget.tanggal_lahir.toString().slice(0, 10) + 'T00:00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-[#414844]/60 block font-medium">Kota / Kabupaten</span>
                    <span className="font-semibold text-[#1F2A22]">{detailTarget.alamat_kota || '-'}</span>
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
                <h4 className="font-bold text-[#6B3410] uppercase tracking-wider text-xs border-b border-[#6B3410]/10 pb-1.5 mb-3">Dokumen Pendaftaran</h4>
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

              {/* Status Section */}
              <div className="bg-[#F5F4EF] rounded-xl p-4 border border-outline-variant/30 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#414844]/60 block font-medium">Status Pendaftaran Saat Ini</span>
                  <span className="font-bold text-sm" style={{ color: statusLabel[detailTarget.profile_status]?.color }}>
                    {statusLabel[detailTarget.profile_status]?.text}
                  </span>
                </div>
                {detailTarget.reject_reason && (
                  <div className="text-right max-w-xs">
                    <span className="text-[#414844]/60 block font-medium">Catatan Perbaikan</span>
                    <span className="font-bold text-[#B3261E]">{detailTarget.reject_reason}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {detailTarget.update_status === 'menunggu_verifikasi' ? (
                <div className="flex gap-3 pt-4 border-t border-[#6B3410]/10">
                  <button
                    onClick={() => handleApproveUpdate(detailTarget.id)}
                    className="flex-1 bg-[#2E5E3B] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#244B2F] active:scale-[0.99] transition-all shadow-md shadow-[#2E5E3B]/10 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Setujui Pembaruan Profil
                  </button>
                  <button
                    onClick={() => {
                      setRejectTarget(detailTarget);
                      setRejectingUpdate(true);
                    }}
                    className="flex-1 bg-[#B3261E] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#93000A] active:scale-[0.99] transition-all shadow-md shadow-[#B3261E]/10 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">close</span>
                    Tolak Pembaruan
                  </button>
                </div>
              ) : detailTarget.profile_status === 'menunggu_verifikasi' && (
                <div className="flex gap-3 pt-4 border-t border-[#6B3410]/10">
                  <button
                    onClick={() => handleVerify(detailTarget.id)}
                    className="flex-1 bg-[#6B3410] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#55290A] active:scale-[0.99] transition-all shadow-md shadow-[#6B3410]/10 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Setujui & Aktifkan Akun
                  </button>
                  <button
                    onClick={() => {
                      setRejectTarget(detailTarget);
                      setRejectingUpdate(false);
                    }}
                    className="flex-1 bg-[#B3261E] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#93000A] active:scale-[0.99] transition-all shadow-md shadow-[#B3261E]/10 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">edit_note</span>
                    Minta Perbaikan Data
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal Tolak */}
      {rejectTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-fadeIn">
            <h3 className="font-bold text-lg text-[#6B3410] mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-red-500">edit_note</span>
              {rejectingUpdate ? 'Tolak Pembaruan Profil' : 'Minta Perbaikan Data'}
            </h3>
            <p className="text-xs text-[#414844]/70 mb-4 leading-relaxed">
              {rejectingUpdate
                ? 'Berikan alasan penolakan perubahan profil. Profil publik ahli akan tetap tayang dengan versi data sebelumnya.'
                : 'Berikan catatan atau petunjuk perbaikan dokumen agar user tahu bagian mana yang harus diperbaiki.'}
            </p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={rejectingUpdate ? 'Contoh: Nama tidak sesuai sertifikat kompetensi...' : 'Contoh: Lampiran CV belum berformat PDF, harap unggah berkas terbaru.'}
              className="w-full border border-[#6B3410]/30 rounded-xl px-3.5 py-3 text-xs mb-4 focus:ring-2 focus:ring-[#6B3410]/30 focus:border-[#6B3410] focus:outline-none transition-all resize-none"
            />
            <div className="flex justify-end gap-3 border-t border-black/5 pt-4">
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                  setRejectingUpdate(false);
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#414844] hover:bg-[#F5F4EF] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={rejectingUpdate ? handleRejectUpdate : handleReject}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#B3261E] text-white hover:bg-[#93000A] shadow-md shadow-[#B3261E]/10 transition-colors"
              >
                {rejectingUpdate ? 'Tolak Pembaruan' : 'Kirim Permintaan Perbaikan'}
              </button>
            </div>
          </div>
        </div>
      )}

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