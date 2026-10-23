import { useState } from 'react';
import api from '../../api/client.js';

const emptyForm = { jenjang: '', institusi: '', jurusan: '', tahun_lulus: '' };

export default function EducationSection({ items, onChange }) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const formData = {
        jenjang: form.jenjang,
        institusi: form.institusi,
        jurusan: form.jurusan || null,
        tahun_lulus: form.tahun_lulus ? parseInt(form.tahun_lulus, 10) : null
      };
      const res = await api.post('/my/educations', formData);
      onChange([...items, res.data]);
      setForm(emptyForm);
    } catch (err) {
      // Check if it's a validation error with multiple messages
      if (err.response?.status === 422 && err.response?.data?.errors) {
        const errors = err.response.data.errors;
        const errorMessage = Object.values(errors).flat().join(', ');
        setError(errorMessage);
      } else {
        setError(err.response?.data?.message || 'Gagal menyimpan pendidikan.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/my/educations/${id}`);
      onChange(items.filter((i) => i.id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6">
      <h2 className="font-bold text-on-background mb-4">Pendidikan</h2>

      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between bg-[#F5F4F0] rounded-lg px-4 py-2 text-sm">
              <span>
                <strong>{it.jenjang}</strong> — {it.institusi}
                {it.jurusan && ` (${it.jurusan})`}
                {it.tahun_lulus && `, lulus ${it.tahun_lulus}`}
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
          list="section-jenjang-options"
          required
          placeholder="Jenjang (cth. S1, S2, S3, D3, Profesi)"
          value={form.jenjang}
          onChange={(e) => setForm({ ...form, jenjang: e.target.value })}
          className="col-span-1 border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B] bg-white"
        />
        <datalist id="section-jenjang-options">
          <option value="S1 · Sarjana" />
          <option value="S2 · Magister" />
          <option value="S3 · Doktor" />
          <option value="D3 · Diploma" />
          <option value="D4 · Sarjana Terapan" />
          <option value="Profesi" />
          <option value="Spesialis" />
          <option value="SMA/SMK" />
        </datalist>
        <input
          type="number"
          placeholder="Tahun lulus"
          min="1950"
          max={new Date().getFullYear() + 10}
          value={form.tahun_lulus}
          onChange={(e) => setForm({ ...form, tahun_lulus: e.target.value })}
          className="border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B]"
        />
        <input
          required
          placeholder="Institusi"
          value={form.institusi}
          onChange={(e) => setForm({ ...form, institusi: e.target.value })}
          className="border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B]"
        />
        <input
          placeholder="Jurusan"
          value={form.jurusan}
          onChange={(e) => setForm({ ...form, jurusan: e.target.value })}
          className="border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B]"
        />
        <button
          type="submit"
          disabled={saving}
          className="col-span-2 bg-[#2E5E3B]/10 text-[#2E5E3B] py-2 rounded-lg text-sm font-bold hover:bg-[#2E5E3B]/20 transition-colors disabled:opacity-60"
        >
          {saving ? 'Menyimpan...' : '+ Tambah Pendidikan'}
        </button>
      </form>
    </div>
  );
}