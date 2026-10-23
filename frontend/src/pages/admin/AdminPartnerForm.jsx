import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client.js';

const emptyForm = { name: '', short: '', logo: '', type: '', order: 0 };

export default function AdminPartnerForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api.get('/admin/partners')
      .then((res) => {
        const p = res.data.find((x) => String(x.id) === String(id));
        if (!p) {
          setError('Mitra tidak ditemukan.');
          return;
        }
        setForm({
          name: p.name || '',
          short: p.short || '',
          logo: p.logo || '',
          type: p.type || '',
          order: p.order || 0,
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
      if (isEdit) await api.put(`/partners/${id}`, form);
      else await api.post('/partners', form);
      navigate('/admin/mitra');
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
        <button onClick={() => navigate('/admin/mitra')} className="text-[#414844]/60 hover:text-[#6B3410]">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#6B3410]">{isEdit ? 'Edit Mitra' : 'Tambah Mitra'}</h2>
          <p className="text-[#414844]/80 text-sm mt-1">Kelola daftar mitra/partner TenagaAhli.com.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm p-6 max-w-lg">
        {error && <p className="bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">Nama *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">Nama Singkat</label>
            <input
              value={form.short}
              onChange={(e) => setForm({ ...form, short: e.target.value })}
              className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">
              Path Logo (relatif ke storage, contoh: partners/logo.png)
            </label>
            <input
              value={form.logo}
              onChange={(e) => setForm({ ...form, logo: e.target.value })}
              className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">Tipe *</label>
            <select
              required
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410] bg-white"
            >
              <option value="">-- Pilih Tipe --</option>
              <option value="mou_university">MoU Universitas</option>
              <option value="grant_research">Grant Research</option>
              <option value="moa">MoA System Dynamics Center</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">Urutan</label>
            <input
              type="number"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
              className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
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
              onClick={() => navigate('/admin/mitra')}
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