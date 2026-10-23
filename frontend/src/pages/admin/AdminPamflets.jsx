import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

export default function AdminPamflets() {
  const [pamflets, setPamflets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPublished, setFilterPublished] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = () => {
    setLoading(true);
    const params = {};
    if (filterType) params.type = filterType;
    if (filterPublished !== '') params.is_published = filterPublished;
    if (keyword) params.keyword = keyword;

    api.get('/admin/pamflets', { params })
      .then((res) => setPamflets(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(() => setError('Gagal memuat data dari server.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [filterType, filterPublished, keyword]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/pamflets/${deleteTarget.id}`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus data.');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[#6B3410]">Pamflet</h2>
          <p className="text-[#414844]/80 text-sm mt-1">Kelola pamflet pengumuman, pelatihan, dan acara.</p>
        </div>
        <Link
          to="/admin/pamflet/tambah"
          className="flex items-center gap-2 bg-[#6B3410] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#55290A] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Pamflet
        </Link>
      </div>

      {error && <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3">{error}</div>}

      <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#6B3410]/15 flex flex-wrap gap-3">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari judul, deskripsi, atau penyelenggara..."
            className="flex-1 min-w-[250px] px-4 py-2 text-sm border border-[#6B3410]/30 rounded-lg focus:ring-[#6B3410] focus:border-[#6B3410]"
          />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-2 text-sm border border-[#6B3410]/30 rounded-lg focus:ring-[#6B3410] focus:border-[#6B3410]"
          >
            <option value="">Semua Tipe</option>
            <option value="announcement">Pengumuman</option>
            <option value="training">Pelatihan</option>
            <option value="seminar">Seminar</option>
            <option value="workshop">Workshop</option>
          </select>
          <select
            value={filterPublished}
            onChange={(e) => setFilterPublished(e.target.value)}
            className="px-4 py-2 text-sm border border-[#6B3410]/30 rounded-lg focus:ring-[#6B3410] focus:border-[#6B3410]"
          >
            <option value="">Semua Status</option>
            <option value="1">Dipublikasi</option>
            <option value="0">Draft</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#6B3410]/5 text-[#414844]">
                <th className="px-6 py-3">Judul</th>
                <th className="px-6 py-3">Tipe</th>
                <th className="px-6 py-3">Tanggal Acara</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6B3410]/10">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-[#414844]/70">Memuat data...</td></tr>
              ) : pamflets.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-[#414844]/70">Tidak ada data.</td></tr>
              ) : (
                pamflets.map((p) => (
                  <tr key={p.id} className="hover:bg-[#6B3410]/5">
                    <td className="px-6 py-4 font-semibold text-[#6B3410]">{p.title}</td>
                    <td className="px-6 py-4 text-[#414844]/80 capitalize">{p.type || '-'}</td>
                    <td className="px-6 py-4 text-[#414844]/80">
                      {p.event_date ? String(p.event_date).slice(0, 10) : '-'}
                    </td>
                    <td className="px-6 py-4">
                      {p.is_published ? (
                        <span className="text-xs font-bold text-[#6B3410]">Dipublikasi</span>
                      ) : (
                        <span className="text-xs font-bold text-[#414844]/50">Draft</span>
                      )}
                    </td>
                    <td className="px-6 py-4 flex gap-2">
                      <Link to={`/admin/pamflet/${p.id}/edit`} className="text-[#6B3410] hover:underline text-xs font-bold">Edit</Link>
                      <button onClick={() => setDeleteTarget(p)} className="text-[#B3261E] hover:underline text-xs font-bold">Hapus</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Yakin ingin menghapus pamflet "${deleteTarget?.title}"?`}
      />
    </div>
  );
}
