import { useState } from 'react';
import api from '../../api/client.js';

const emptyForm = { posisi: '', instansi: '', tahun_mulai: '', tahun_selesai: '', deskripsi: '' };

export default function ExperienceSection({ items, onChange }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const res = await api.post('/my/experiences', form);
      onChange([...items, res.data]);
      setForm(emptyForm);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan pengalaman.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/my/experiences/${id}`);
      onChange(items.filter((i) => i.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6">
      <h2 className="font-bold text-on-background mb-4">Pengalaman</h2>

      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between bg-[#F5F4F0] rounded-lg px-4 py-2 text-sm">
              <span>
                <strong>{it.posisi}</strong> — {it.instansi} ({(() => {
                  if (it.tahun_mulai && it.tahun_selesai) {
                    return String(it.tahun_mulai) === String(it.tahun_selesai)
                      ? it.tahun_mulai
                      : `${it.tahun_mulai}–${it.tahun_selesai}`;
                  }
                  if (it.tahun_mulai) {
                    return `${it.tahun_mulai}–sekarang`;
                  }
                  return it.tahun_selesai || '?';
                })()})
              </span>
              <button onClick={() => handleDelete(it.id)} className="text-[#B3261E] text-xs font-bold hover:underline">
                Hapus
              </button>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="bg-error-container text-on-error-container text-sm rounded-lg p-3 mb-3">{error}</p>}

      <form onSubmit={handleAdd} className="grid grid-cols-2 gap-3">
        <input
          required
          placeholder="Posisi/Jabatan"
          value={form.posisi}
          onChange={(e) => setForm({ ...form, posisi: e.target.value })}
          className="col-span-2 border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B]"
        />
        <input
          required
          placeholder="Instansi"
          value={form.instansi}
          onChange={(e) => setForm({ ...form, instansi: e.target.value })}
          className="col-span-2 border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B]"
        />
        <input
          type="number"
          placeholder="Tahun mulai"
          value={form.tahun_mulai}
          onChange={(e) => setForm({ ...form, tahun_mulai: e.target.value })}
          className="border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B]"
        />
        <input
          type="number"
          placeholder="Tahun selesai (kosongkan jika masih)"
          value={form.tahun_selesai}
          onChange={(e) => setForm({ ...form, tahun_selesai: e.target.value })}
          className="border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B]"
        />
        <textarea
          rows={2}
          placeholder="Deskripsi singkat (opsional)"
          value={form.deskripsi}
          onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
          className="col-span-2 border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B]"
        />
        <button
          type="submit"
          disabled={saving}
          className="col-span-2 bg-[#2E5E3B]/10 text-[#2E5E3B] py-2 rounded-lg text-sm font-bold hover:bg-[#2E5E3B]/20 transition-colors disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : '+ Tambah Pengalaman'}
        </button>
      </form>
    </div>
  );
}