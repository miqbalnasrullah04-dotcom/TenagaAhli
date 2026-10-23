import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client.js';

const emptyForm = { title: '', excerpt: '', content: '', thumbnail: '', published_at: '' };

export default function AdminArticleForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.get('/admin/articles')
      .then((res) => {
        const a = res.data.find((x) => String(x.id) === String(id));
        if (!a) {
          setError('Artikel tidak ditemukan.');
          return;
        }
        setForm({
          title: a.title || '',
          excerpt: a.excerpt || '',
          content: a.content || '',
          thumbnail: a.thumbnail || '',
          published_at: a.published_at ? String(a.published_at).slice(0, 10) : '',
        });
      })
      .catch(() => setError('Gagal memuat data.'))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) await api.put(`/articles/${id}`, form);
      else await api.post('/articles', form);
      navigate('/admin/artikel');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-[#414844]/70">Memuat...</p>;

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate('/admin/artikel')} className="text-[#414844]/60 hover:text-[#8B4513]">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#8B4513]">{isEdit ? 'Edit Artikel' : 'Tambah Artikel'}</h2>
          <p className="text-[#414844]/80 text-sm mt-1">Kelola artikel dan publikasi TenagaAhli.com.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#8B4513]/15 shadow-sm p-6 max-w-2xl">
        {error && <p className="bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">Judul *</label>
            <input
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="w-full mt-1 border border-[#8B4513]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#8B4513] focus:border-[#8B4513]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">Ringkasan</label>
            <textarea
              rows={2}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              className="w-full mt-1 border border-[#8B4513]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#8B4513] focus:border-[#8B4513]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">Konten *</label>
            <textarea
              required
              rows={8}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              className="w-full mt-1 border border-[#8B4513]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#8B4513] focus:border-[#8B4513]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">
              Path Thumbnail (relatif ke storage, contoh: articles/nama-file.jpg)
            </label>
            <input
              value={form.thumbnail}
              onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
              className="w-full mt-1 border border-[#8B4513]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#8B4513] focus:border-[#8B4513]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">
              Tanggal Terbit (kosongkan untuk simpan sebagai draft)
            </label>
            <input
              type="date"
              value={form.published_at}
              onChange={(e) => setForm({ ...form, published_at: e.target.value })}
              className="w-full mt-1 border border-[#8B4513]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#8B4513] focus:border-[#8B4513]"
            />
          </div>
          <div className="flex gap-3 mt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 bg-[#6B3410] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#55290A] disabled:opacity-60"
            >
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
            <button
              type="button"
              onClick={() => navigate('/admin/artikel')}
              className="px-6 py-3 rounded-lg text-sm font-bold text-[#414844] border border-[#414844]/20 hover:bg-[#414844]/5"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}