import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { useTranslation } from '../../context/LanguageContext.jsx';

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://tenagaahli.latihan.co.id';

const storageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  return `${BACKEND_URL}/storage/${path}`;
};

const statusLabel = {
  draft: { text: 'Draft', color: '#414844', bg: '#F5F4F0' },
  menunggu_verifikasi: { text: 'Menunggu Verifikasi', color: '#7A5900', bg: '#FFF4D6' },
  aktif: { text: 'Disetujui', color: '#0284C7', bg: '#E0F2FE' },
  ditolak: { text: 'Perlu Perbaikan', color: '#B3261E', bg: '#FFDAD6' },
};

export default function AdminUserVerification() {
  const [experts, setExperts] = useState([]);
  const [filteredExperts, setFilteredExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('menunggu_verifikasi');
  const [searchQuery, setSearchQuery] = useState('');
  const [detailTarget, setDetailTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionError, setActionError] = useState('');

  const loadData = () => {
    setLoading(true);
    api
      .get('/admin/experts', { params: filter ? { status: filter } : {} })
      .then((res) => {
        setExperts(res.data);
        setFilteredExperts(res.data);
      })
      .catch(() => setError('Gagal memuat data.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  // Filter experts berdasarkan search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredExperts(experts);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = experts.filter((exp) => {
      return (
        exp.name?.toLowerCase().includes(query) ||
        exp.email?.toLowerCase().includes(query) ||
        exp.user?.email?.toLowerCase().includes(query) ||
        exp.phone?.toLowerCase().includes(query) ||
        exp.field?.toLowerCase().includes(query) ||
        exp.institution?.toLowerCase().includes(query)
      );
    });

    setFilteredExperts(filtered);
  }, [searchQuery, experts]);

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

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#0284C7]">Verifikasi Data</h2>
        <p className="text-[#414844]/80 text-sm mt-1">Periksa kelengkapan berkas dan data pendaftar baru sebelum diaktifkan.</p>
      </div>

      {error && <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3">{error}</div>}

      <div className="bg-white rounded-xl border border-[#0284C7]/15 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-[#0284C7]/15">
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
                className="w-full pl-10 pr-4 py-2.5 border border-[#0284C7]/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#0284C7]/30 focus:border-[#0284C7] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#414844]/40 hover:text-[#0284C7] transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              )}
            </div>
          </div>
          {searchQuery && (
            <p className="text-xs text-[#414844]/60 mt-2">
              Menampilkan {filteredExperts.length} dari {experts.length} hasil
            </p>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="p-5 border-b border-[#0284C7]/15 flex gap-2 overflow-x-auto">
          {['menunggu_verifikasi', 'aktif', 'ditolak'].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                filter === s ? 'bg-[#0284C7] text-white shadow-sm' : 'bg-[#0284C7]/5 text-[#414844] hover:bg-[#0284C7]/10'
              }`}
            >
              {statusLabel[s].text}
            </button>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#0284C7]/5 text-[#414844]">
                <th className="px-6 py-3">Nama Lengkap</th>
                <th className="px-6 py-3">Email</th>
                <th className="px-6 py-3">No. HP</th>
                <th className="px-6 py-3">Bidang Keahlian</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0284C7]/10">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#414844]/70">
                    Memuat data...
                  </td>
                </tr>
              ) : filteredExperts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-[#414844]/70">
                    {searchQuery ? `Tidak ditemukan hasil untuk "${searchQuery}"` : 'Tidak ada pendaftar pada status ini.'}
                  </td>
                </tr>
              ) : (
                filteredExperts.map((exp) => {
                  const s = statusLabel[exp.profile_status] || statusLabel.draft;
                  return (
                    <tr key={exp.id} className="hover:bg-[#0284C7]/5 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#0284C7]">{exp.name}</td>
                      <td className="px-6 py-4 text-[#414844]/80">{exp.user?.email || exp.email}</td>
                      <td className="px-6 py-4 text-[#414844]/80">{exp.phone || '-'}</td>
                      <td className="px-6 py-4 text-[#414844]/80">{exp.field || '-'}</td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: s.color, backgroundColor: s.bg }}>
                          {s.text}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setDetailTarget(exp)}
                          className="bg-[#0284C7]/10 hover:bg-[#0284C7]/20 text-[#0284C7] px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all"
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
            <div className="flex items-center justify-between p-6 border-b border-[#0284C7]/15">
              <div>
                <h3 className="text-xl font-bold text-[#0284C7]">{detailTarget.name}</h3>
                <p className="text-xs text-[#414844]/60 mt-0.5">ID Tenaga Ahli: #{detailTarget.id}</p>
              </div>
              <button onClick={() => setDetailTarget(null)} className="text-[#414844]/60 hover:text-[#0284C7] p-1.5 rounded-full hover:bg-[#F5F4EF] transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-sm">
              {actionError && <div className="bg-[#FFDAD6] text-[#93000A] rounded-xl p-4 font-bold">{actionError}</div>}

              {/* Data Diri Grid */}
              <div>
                <h4 className="font-bold text-[#0284C7] uppercase tracking-wider text-xs border-b border-[#0284C7]/10 pb-1.5 mb-3">Data Pribadi</h4>
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
                      {detailTarget.tanggal_lahir ? new Date(detailTarget.tanggal_lahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
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
                  <h4 className="font-bold text-[#0284C7] uppercase tracking-wider text-xs border-b border-[#0284C7]/10 pb-1.5 mb-2">Catatan</h4>
                  <p className="bg-[#F5F4EF] p-4 rounded-xl text-xs text-[#414844] leading-relaxed whitespace-pre-line border border-outline-variant/30">
                    {detailTarget.catatan}
                  </p>
                </div>
              )}

              {/* Riwayat Pendidikan detail */}
              {detailTarget.educations?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#0284C7] uppercase tracking-wider text-xs border-b border-[#0284C7]/10 pb-1.5 mb-2">Pendidikan Detail</h4>
                  <ul className="space-y-1.5">
                    {detailTarget.educations.map((e) => (
                      <li key={e.id} className="text-xs bg-[#0284C7]/5 p-2 rounded-lg border border-[#0284C7]/10">
                        🎓 <strong>{e.jenjang}</strong> — {e.institusi} {e.tahun_lulus ? `(Lulus ${e.tahun_lulus})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Profil Bio */}
              {(detailTarget.tentang_saya || detailTarget.ringkasan_keahlian || detailTarget.kriteria_list?.length > 0) && (
                <div>
                  <h4 className="font-bold text-[#0284C7] uppercase tracking-wider text-xs border-b border-[#0284C7]/10 pb-1.5 mb-2">Profil Bio</h4>
                  <div className="space-y-3">
                    {detailTarget.kriteria_list?.length > 0 && (
                      <div>
                        <span className="text-xs text-[#414844]/60 block font-medium">Kriteria Profesional</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {detailTarget.kriteria_list.map((k, i) => (
                            <span key={i} className="text-[10px] bg-[#0284C7]/10 text-[#0284C7] px-2 py-0.5 rounded-full font-bold">{k}</span>
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
                  <h4 className="font-bold text-[#0284C7] uppercase tracking-wider text-xs border-b border-[#0284C7]/10 pb-1.5 mb-2">Pengalaman Kerja</h4>
                  <ul className="space-y-2">
                    {detailTarget.experiences.map((e) => (
                      <li key={e.id} className="text-xs bg-[#F5F4EF] p-2.5 rounded-lg border border-outline-variant/30">
                        <div className="font-bold text-[#1F2A22]">{e.posisi}</div>
                        <div className="text-[#414844]/80">{e.instansi} • {e.tahun_mulai} - {e.tahun_selesai || 'Sekarang'}</div>
                        {e.deskripsi && <div className="mt-1 text-[#414844]/70">{e.deskripsi}</div>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Sertifikasi */}
              {detailTarget.certificates?.length > 0 && (
                <div>
                  <h4 className="font-bold text-[#0284C7] uppercase tracking-wider text-xs border-b border-[#0284C7]/10 pb-1.5 mb-2">Sertifikasi</h4>
                  <ul className="space-y-2">
                    {detailTarget.certificates.map((c) => (
                      <li key={c.id} className="text-xs bg-[#F5F4EF] p-2.5 rounded-lg border border-outline-variant/30 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-[#1F2A22]">{c.nama_sertifikat}</div>
                          <div className="text-[#414844]/80">{c.penerbit} • {c.tahun}</div>
                        </div>
                        {c.file_path && (
                           <a href={storageUrl(c.file_path)} target="_blank" rel="noreferrer" className="text-[#0284C7] hover:underline font-bold">Lihat</a>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Link Akademik */}
              {(detailTarget.google_scholar_url || detailTarget.scopus_url || detailTarget.sinta_url || detailTarget.orcid_url) && (
                <div>
                  <h4 className="font-bold text-[#0284C7] uppercase tracking-wider text-xs border-b border-[#0284C7]/10 pb-1.5 mb-2">Link Akademik</h4>
                  <div className="flex flex-wrap gap-2">
                    {detailTarget.google_scholar_url && (
                      <a href={detailTarget.google_scholar_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#0284C7] hover:underline bg-[#0284C7]/10 px-2.5 py-1 rounded-lg font-bold">Google Scholar</a>
                    )}
                    {detailTarget.scopus_url && (
                      <a href={detailTarget.scopus_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#0284C7] hover:underline bg-[#0284C7]/10 px-2.5 py-1 rounded-lg font-bold">Scopus</a>
                    )}
                    {detailTarget.sinta_url && (
                      <a href={detailTarget.sinta_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#0284C7] hover:underline bg-[#0284C7]/10 px-2.5 py-1 rounded-lg font-bold">SINTA</a>
                    )}
                    {detailTarget.orcid_url && (
                      <a href={detailTarget.orcid_url} target="_blank" rel="noreferrer" className="text-[11px] text-[#0284C7] hover:underline bg-[#0284C7]/10 px-2.5 py-1 rounded-lg font-bold">ORCID</a>
                    )}
                  </div>
                </div>
              )}

              {/* Uploaded Documents */}
              <div>
                <h4 className="font-bold text-[#0284C7] uppercase tracking-wider text-xs border-b border-[#0284C7]/10 pb-1.5 mb-3">Dokumen Pendaftaran</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Pas Foto */}
                  <div className="bg-[#F5F4EF] rounded-xl p-3 border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-[#414844]/60 uppercase mb-2">Pas Foto</p>
                    {detailTarget.photo ? (
                      <div className="space-y-2">
                        <img
                          src={storageUrl(detailTarget.photo)}
                          alt="Foto Profil"
                          className="w-20 h-20 rounded-lg object-cover border border-[#0284C7]/20 mx-auto"
                        />
                        <a
                          href={storageUrl(detailTarget.photo)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0284C7] hover:underline text-xs font-bold block"
                        >
                          Lihat Foto
                        </a>
                      </div>
                    ) : (
                      <span className="text-xs text-[#414844]/40 font-medium">Tidak ada foto</span>
                    )}
                  </div>

                  {/* CV */}
                  <div className="bg-[#F5F4EF] rounded-xl p-3 border border-outline-variant/20 flex flex-col items-center justify-center text-center">
                    <p className="text-[10px] font-bold text-[#414844]/60 uppercase mb-2">Curriculum Vitae (CV)</p>
                    {(() => {
                      const cvPath = detailTarget.cv_path || detailTarget.documents?.find(d => d.type === 'lainnya' && d.label?.includes('CV'))?.file_path;
                      return cvPath ? (
                        <div className="space-y-2 text-center">
                          <span className="material-symbols-outlined text-[36px] text-red-500">picture_as_pdf</span>
                          <a
                            href={storageUrl(cvPath)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0284C7] hover:underline text-xs font-bold block"
                          >
                            Buka Berkas CV
                          </a>
                        </div>
                      ) : (
                        <span className="text-xs text-[#414844]/40 font-medium">Tidak ada berkas CV</span>
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
                          <span className="material-symbols-outlined text-[36px] text-[#0284C7]">verified</span>
                          <a
                            href={storageUrl(buktiPath)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#0284C7] hover:underline text-xs font-bold block"
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
              {detailTarget.profile_status === 'menunggu_verifikasi' && (
                <div className="flex gap-3 pt-4 border-t border-[#0284C7]/10">
                  <button
                    onClick={() => handleVerify(detailTarget.id)}
                    className="flex-1 bg-[#0284C7] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#0369A1] active:scale-[0.99] transition-all shadow-md shadow-[#0284C7]/10 flex items-center justify-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    Setujui & Aktifkan Akun
                  </button>
                  <button
                    onClick={() => setRejectTarget(detailTarget)}
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
            <h3 className="font-bold text-lg text-[#0284C7] mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-red-500">edit_note</span>
              Minta Perbaikan Data
            </h3>
            <p className="text-xs text-[#414844]/70 mb-4 leading-relaxed">
              Berikan catatan atau petunjuk perbaikan dokumen agar user tahu bagian mana yang harus diperbaiki.
            </p>
            <textarea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Lampiran CV belum berformat PDF, harap unggah berkas terbaru."
              className="w-full border border-[#0284C7]/30 rounded-xl px-3.5 py-3 text-xs mb-4 focus:ring-2 focus:ring-[#0284C7]/30 focus:border-[#0284C7] focus:outline-none transition-all resize-none"
            />
            <div className="flex justify-end gap-3 border-t border-black/5 pt-4">
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#414844] hover:bg-[#F5F4EF] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#B3261E] text-white hover:bg-[#93000A] shadow-md shadow-[#B3261E]/10 transition-colors"
              >
                Kirim Permintaan Perbaikan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}