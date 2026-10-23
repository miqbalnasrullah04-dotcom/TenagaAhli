import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

export default function AdminArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = () => {
    setLoading(true);
    api.get('/admin/articles')
      .then((res) => setArticles(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(() => setError('Gagal memuat data dari server.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filtered = articles.filter((a) => (a.title || '').toLowerCase().includes(keyword.toLowerCase()));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/articles/${deleteTarget.id}`);
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
          <h2 className="text-2xl font-bold text-[#8B4513]">Berita & Artikel</h2>
          <p className="text-[#414844]/80 text-sm mt-1">Kelola artikel dan publikasi TenagaAhli.com.</p>
        </div>
        <Link
          to="/admin/artikel/tambah"
          className="flex items-center gap-2 bg-[#8B4513] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#6B3410] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">edit_note</span>
          Tambah Artikel
        </Link>
      </div>

      {error && <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3">{error}</div>}

      <div className="bg-white rounded-xl border border-[#8B4513]/15 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#8B4513]/15">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari judul artikel..."
            className="w-full max-w-sm px-4 py-2 text-sm border border-[#8B4513]/30 rounded-lg focus:ring-[#8B4513] focus:border-[#8B4513]"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-[#6B3410]/5 text-[#414844]">
                <th className="px-6 py-3">Judul</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Tanggal Terbit</th>
                <th className="px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6B3410]/10">
              {loading ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-[#414844]/70">Memuat data...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={4} className="px-6 py-8 text-center text-[#414844]/70">Tidak ada data.</td></tr>
              ) : (
                filtered.map((a) => {
                  const isPublished = a.published_at && new Date(a.published_at) <= new Date();
                  return (
                    <tr key={a.id} className="hover:bg-[#6B3410]/5">
                      <td className="px-6 py-4 font-semibold text-[#6B3410]">{a.title}</td>
                      <td className="px-6 py-4">
                        {isPublished ? (
                          <span className="text-xs font-bold text-[#6B3410]">Terbit</span>
                        ) : (
                          <span className="text-xs font-bold text-[#414844]/50">Draft</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-[#414844]/80">
                        {a.published_at ? String(a.published_at).slice(0, 10) : '-'}
                      </td>
                      <td className="px-6 py-4 flex gap-2">
                        <Link to={`/admin/artikel/${a.id}/edit`} className="text-[#6B3410] hover:underline text-xs font-bold">Edit</Link>
                        <button onClick={() => setDeleteTarget(a)} className="text-[#B3261E] hover:underline text-xs font-bold">Hapus</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Yakin ingin menghapus artikel "${deleteTarget?.title}"?`}
      />
    </div>
  );
}