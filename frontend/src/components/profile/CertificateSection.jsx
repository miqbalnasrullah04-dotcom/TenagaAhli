import { useState } from 'react';
import api from '../../api/client.js';

const emptyForm = { nama_sertifikat: '', penerbit: '', tahun: '' };

export default function CertificateSection({ items, onChange }) {
  const [form, setForm] = useState(emptyForm);
  const [file, setFile] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      if (file) formData.append('file', file);

      if (editingId) {
        const res = await api.post(`/my/certificates/${editingId}`, formData, {
          headers: { 'Content-Type': undefined },
        });
        onChange(items.map((i) => (i.id === editingId ? res.data : i)));
        setEditingId(null);
      } else {
        const res = await api.post('/my/certificates', formData, {
          headers: { 'Content-Type': undefined },
        });
        onChange([...items, res.data]);
      }
      setForm(emptyForm);
      setFile(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan sertifikat.');
    } finally {
      setSaving(false);
    }
  };

  const handleStartEdit = (it) => {
    setEditingId(it.id);
    setForm({
      nama_sertifikat: it.nama_sertifikat || '',
      penerbit: it.penerbit || '',
      tahun: it.tahun || '',
    });
    setFile(null);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
  };

  const handleDelete = async (id) => {
    if (!confirm('Hapus sertifikat ini?')) return;
    try {
      await api.delete(`/my/certificates/${id}`);
      onChange(items.filter((i) => i.id !== id));
      if (editingId === id) handleCancelEdit();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus.');
    }
  };

  return (
    <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6">
      <h2 className="font-bold text-on-background mb-4">Sertifikat</h2>

      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-center justify-between bg-[#F5F4F0] rounded-lg px-4 py-2.5 text-sm">
              <span>
                <strong>{it.nama_sertifikat}</strong>
                {it.penerbit && ` — ${it.penerbit}`}
                {it.tahun && ` (${it.tahun})`}
              </span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleStartEdit(it)}
                  className="text-[#2E5E3B] text-xs font-bold hover:underline"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(it.id)}
                  className="text-[#B3261E] text-xs font-bold hover:underline"
                >
                  Hapus
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {error && <p className="bg-error-container text-on-error-container text-sm rounded-lg p-3 mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
        <input
          required
          placeholder="Nama Sertifikat *"
          value={form.nama_sertifikat}
          onChange={(e) => setForm({ ...form, nama_sertifikat: e.target.value })}
          className="col-span-2 border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B]"
        />
        <input
          placeholder="Penerbit"
          value={form.penerbit}
          onChange={(e) => setForm({ ...form, penerbit: e.target.value })}
          className="border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B]"
        />
        <input
          type="number"
          placeholder="Tahun"
          value={form.tahun}
          onChange={(e) => setForm({ ...form, tahun: e.target.value })}
          className="border border-outline-variant/40 rounded-lg px-3 py-2 text-sm focus:ring-[#2E5E3B] focus:border-[#2E5E3B]"
        />
        <input
          type="file"
          accept="image/*,.pdf"
          onChange={(e) => setFile(e.target.files[0])}
          className="col-span-2 text-sm"
        />
        <div className="col-span-2 flex items-center gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-[#2E5E3B]/10 text-[#2E5E3B] py-2 rounded-lg text-sm font-bold hover:bg-[#2E5E3B]/20 transition-colors disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : editingId ? 'Simpan Perubahan Sertifikat' : '+ Tambah Sertifikat'}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={handleCancelEdit}
              className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
            >
              Batal
            </button>
          )}
        </div>
      </form>
    </div>
  );
}