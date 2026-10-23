import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import NavbarBackground from '../components/NavbarBackground.jsx';
import { usePageLoading } from '../context/LoadingContext.jsx';

const dummyMembers = [
  { id: 1, nama: 'Dr. Irman Firmansyah, S.Hut, M.Si', instansi: 'PSL - IPB University', nomor: 'TA.001.2024' },
  { id: 2, nama: 'Prof. Dr. Ir. Ahmad Sutanto, M.Eng', instansi: 'Institut Teknologi Bandung', nomor: 'TA.002.2024' },
  { id: 3, nama: 'Dr. Ir. Siti Rahmawati, M.T', instansi: 'Universitas Gadjah Mada', nomor: 'TA.003.2024' },
  { id: 4, nama: 'Ir. Budi Santoso, S.T, M.Sc', instansi: 'Kementerian Lingkungan Hidup', nomor: 'TA.004.2024' },
  { id: 5, nama: 'Dr. Dewi Lestari, S.Si, M.Si', instansi: 'Universitas Indonesia', nomor: 'TA.005.2024' },
  { id: 6, nama: 'Ir. Muhammad Arief, M.T', instansi: 'PT. Konsultan Lingkungan Nusantara', nomor: 'TA.006.2024' },
  { id: 7, nama: 'Dr. Ir. Fitri Handayani, M.Eng', instansi: 'Institut Teknologi Sepuluh Nopember', nomor: 'TA.007.2024' },
  { id: 8, nama: 'Prof. Dr. Bambang Wijaya, S.T, M.Sc', instansi: 'Universitas Diponegoro', nomor: 'TA.008.2024' },
  { id: 9, nama: 'Dr. Ir. Rina Kartika, M.Si', instansi: 'Badan Pengelolaan Lingkungan Hidup', nomor: 'TA.009.2024' },
  { id: 10, nama: 'Ir. Agus Permana, S.T, M.T', instansi: 'Universitas Padjadjaran', nomor: 'TA.010.2024' },
  { id: 11, nama: 'Dr. Ir. Lina Sari, M.Eng', instansi: 'Politeknik Negeri Jakarta', nomor: 'TA.011.2024' },
  { id: 12, nama: 'Prof. Dr. Ir. Hendra Prasetyo, M.Sc', instansi: 'Universitas Hasanuddin', nomor: 'TA.012.2024' },
  { id: 13, nama: 'Dr. Ir. Maya Indira, S.T, M.T', instansi: 'PT. EcoConsult Indonesia', nomor: 'TA.013.2024' },
  { id: 14, nama: 'Ir. Dodi Kurniawan, M.Eng', instansi: 'Universitas Brawijaya', nomor: 'TA.014.2024' },
  { id: 15, nama: 'Dr. Ir. Ratna Sari, M.Si', instansi: 'Lembaga Ilmu Pengetahuan Indonesia', nomor: 'TA.015.2024' },
];

export default function Member() {
  const { t } = useTranslation();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { reportReady } = usePageLoading();
  const [keyword, setKeyword] = useState('');
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  useEffect(() => {
    setLoading(true);
    // Fetch from experts API to get real-time data
    api
      .get('/experts')
      .then((res) => {
        const raw = res.data;
        let expertData = [];
        
        if (Array.isArray(raw)) {
          expertData = raw;
        } else if (Array.isArray(raw?.data)) {
          expertData = raw.data;
        } else if (Array.isArray(raw?.experts)) {
          expertData = raw.experts;
        }

        // Transform expert data to member format
        const transformedMembers = expertData.map((expert, index) => ({
          id: expert.id || index + 1,
          nama: expert.name || expert.nama,
          instansi: expert.institution || expert.institusi || t('member.general', 'Umum'),
          nomor: expert.member_number || expert.nomor_anggota || `TA.${String(index + 1).padStart(3, '0')}.${new Date().getFullYear()}`
        }));

        setMembers(transformedMembers.length > 0 ? transformedMembers : dummyMembers);
      })
      .catch(() => setMembers(dummyMembers))
      .finally(() => { setLoading(false); reportReady(); });
  }, []);

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
    setCurrentPage(1);
  };

  const filteredMembers = useMemo(() => {
    const q = keyword.toLowerCase().trim();
    let result = Array.isArray(members) ? members : [];

    if (q) {
      result = result.filter(
        (m) =>
          (m.nama && m.nama.toLowerCase().includes(q)) ||
          (m.merge && m.merge.toLowerCase().includes(q)) ||
          (m.instansi && m.instansi.toLowerCase().includes(q)) ||
          (m.nomor && m.nomor.toLowerCase().includes(q))
      );
    }

    if (sortConfig.key) {
      result = [...result].sort((a, b) => {
        const valA = (a[sortConfig.key] || a.merge || '').toLowerCase();
        const valB = (b[sortConfig.key] || b.merge || '').toLowerCase();
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [members, keyword, sortConfig]);

  const totalEntries = filteredMembers.length;
  const totalPages = Math.max(1, Math.ceil(totalEntries / entriesPerPage));
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedMembers = filteredMembers.slice(startIndex, startIndex + entriesPerPage);
  const showingFrom = totalEntries === 0 ? 0 : startIndex + 1;
  const showingTo = Math.min(startIndex + entriesPerPage, totalEntries);

  const columns = [
    { key: 'nama', label: t('member.name', 'Nama') },
    { key: 'instansi', label: t('member.institution', 'Instansi') },
    { key: 'nomor', label: t('member.member_number', 'Nomor Member') },
  ];

  const SortIcon = ({ columnKey }) => {
    const isActive = sortConfig.key === columnKey;
    return (
      <span className="inline-flex flex-col ml-1 -space-y-1 align-middle">
        <span
          className={`material-symbols-outlined text-[14px] leading-none ${
            isActive && sortConfig.direction === 'asc' ? 'text-[#8B4513]' : 'text-on-surface-variant/40'
          }`}
        >
          arrow_drop_up
        </span>
        <span
          className={`material-symbols-outlined text-[14px] leading-none ${
            isActive && sortConfig.direction === 'desc' ? 'text-[#8B4513]' : 'text-on-surface-variant/40'
          }`}
        >
          arrow_drop_down
        </span>
      </span>
    );
  };

  return (
    <div className="relative pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <NavbarBackground />


      <h1 className="font-headline-lg text-headline-lg text-on-background mb-2">{t('member.title', 'Member')}</h1>
      <p className="text-on-surface-variant mb-8">
        {t('member.subtitle', 'Daftar tenaga ahli profesional yang telah tersertifikasi dan terdaftar di TenagaAhli.com.')}
      </p>

      <div className="bg-white rounded-xl border border-[#8B4513]/25 shadow-sm overflow-hidden">
        {/* Toolbar: entries + search */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 p-5 border-b border-[#8B4513]/20">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <span>{t('member.show', 'Tampilkan')}</span>
            <select
              value={entriesPerPage}
              onChange={(e) => {
                setEntriesPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-[#8B4513]/30 rounded-lg px-2 py-1.5 text-sm focus:ring-[#8B4513] focus:border-[#8B4513] bg-white text-on-surface-variant outline-none"
            >
              {[10, 18, 25, 50].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            <span>{t('member.entries', 'entri')}</span>
          </div>

          <div className="relative w-full md:w-72">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/60 text-[18px]">
              search
            </span>
            <input
              value={keyword}
              onChange={(e) => {
                setKeyword(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={t('member.search_placeholder', 'Cari nama, instansi, atau nomor member')}
              className="w-full pl-9 pr-4 py-2 text-sm border border-[#8B4513]/30 rounded-lg focus:ring-[#8B4513] focus:border-[#8B4513] outline-none"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <span className="w-10 h-10 rounded-full border-4 border-gray-200 border-t-[#8B4513] animate-spin block" />
                </div>
                <p className="text-gray-600 text-sm">{t('member.loading', 'Memuat data anggota...')}</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#8B4513]/5">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key)}
                      className="px-6 py-4 font-label-md text-on-background cursor-pointer select-none whitespace-nowrap"
                    >
                      <span className="inline-flex items-center">
                        {col.label}
                        <SortIcon columnKey={col.key} />
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedMembers.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="px-6 py-8 text-center text-on-surface-variant">
                      {t('member.no_data', 'Tidak ada data yang cocok.')}
                    </td>
                  </tr>
                ) : (
                  paginatedMembers.map((m, idx) => (
                    <tr
                      key={m.id}
                      className={`border-t border-[#8B4513]/10 hover:bg-[#8B4513]/5 transition-colors ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-[#8B4513]/[0.03]'
                      }`}
                    >
                      <td className="px-6 py-4 text-on-background">{m.nama || m.merge}</td>
                      <td className="px-6 py-4 text-on-surface-variant">{m.instansi}</td>
                      <td className="px-6 py-4 text-on-surface-variant font-mono text-xs">{m.nomor}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer: info + pagination */}
        {!loading && (
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-5 border-t border-[#8B4513]/20 text-sm text-on-surface-variant">
            <span>
              {t('member.showing', 'Menampilkan')} {showingFrom} {t('member.to', 'sampai')} {showingTo} {t('member.of', 'dari')} {totalEntries} {t('member.entries', 'entri')}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('member.previous', 'Sebelumnya')}
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                  .map((page, idx, arr) => {
                    const prevPage = arr[idx - 1];
                    const showEllipsis = prevPage && page - prevPage > 1;

                    return (
                      <div key={page} className="flex items-center gap-1">
                        {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                        <button
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-[#8B4513] text-white font-bold shadow-sm'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      </div>
                    );
                  })}
              </div>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {t('member.next', 'Selanjutnya')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}