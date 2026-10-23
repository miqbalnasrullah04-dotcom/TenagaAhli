import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

const typeLabels = {
  mou_university: 'MoU Universitas',
  grant_research: 'Grant Research',
  moa: 'MoA System Dynamics Center',
};

export default function AdminPartners() {
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadData = () => {
    setLoading(true);
    api.get('/admin/partners')
      .then((res) => setPartners(Array.isArray(res.data) ? res.data : res.data?.data || []))
      .catch(() => setError('Gagal memuat data dari server.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const filtered = partners.filter((p) => (p.name || '').toLowerCase().includes(keyword.toLowerCase()));

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/partners/${deleteTarget.id}`);
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
          <h2 className="text-2xl font-bold text-[#6B3410]">Lembaga</h2>
          <p className="text-[#414844]/80 text-sm mt-1">Kelola daftar Lembaga TenagaAhli.com.</p>
        </div>
        <Link
          to="/admin/mitra/tambah"
          className="flex items-center gap-2 bg-[#6B3410] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#55290A] transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">handshake</span>
          Tambah Lembaga
        </Link>
      </div>

      {error && <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3">{error}</div>}

      <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-[#6B3410]/15">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari nama lembaga..."
            className="w-full max-w-sm px-4 py-2 text-sm border border-[#6B3410]/30 rounded-lg focus:ring-[#6B3410] focus:border-[#6B3410]"
          />
        </div>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-[#6B3410]/5 text-[#414844]">
              <th className="px-6 py-3">Nama</th>
              <th className="px-6 py-3">Tipe</th>
              <th className="px-6 py-3">Urutan</th>
              <th className="px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#6B3410]/10">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-[#414844]/70">Memuat data...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-[#414844]/70">{keyword ? `Tidak ditemukan hasil untuk "${keyword}"` : 'Tidak ada data.'}</td></tr>
            ) : (
              filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[#6B3410]/5">
                  <td className="px-6 py-4 font-semibold text-[#6B3410]">{p.name}</td>
                  <td className="px-6 py-4 text-[#414844]/80">{typeLabels[p.type] || p.type || '-'}</td>
                  <td className="px-6 py-4 text-[#414844]/80">{p.order}</td>
                  <td className="px-6 py-4 flex gap-2">
                    <Link to={`/admin/mitra/${p.id}/edit`} className="text-[#6B3410] hover:underline text-xs font-bold">Edit</Link>
                    <button onClick={() => setDeleteTarget(p)} className="text-[#B3261E] hover:underline text-xs font-bold">Hapus</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Yakin ingin menghapus mitra "${deleteTarget?.name}"?`}
      />
    </div>
  );
}