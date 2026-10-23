import { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import api from '../../api/client.js';

const emptyForm = {
  name: '', institution: '', email: '', field: '', kriteria: '',
  alamat_kota: '', alamat_provinsi: '', photo: '', verified: false, featured: false,
};

export default function AdminExpertForm({ defaultRole }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEdit = !!id;
  const isTenagaTeknis = defaultRole === 'tenaga_teknis' || location.pathname.includes('tenaga-teknis');

  const [form, setForm] = useState({
    ...emptyForm,
    kriteria: isTenagaTeknis ? 'Tenaga Teknis' : '',
  });
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    const params = isTenagaTeknis ? { only_tenaga_teknis: 1, role_type: 'tenaga_teknis' } : {};
    api.get('/admin/experts', { params })
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const exp = list.find((e) => String(e.id) === String(id));
        if (!exp) {
          setError(isTenagaTeknis ? 'Tenaga teknis tidak ditemukan.' : 'Tenaga ahli tidak ditemukan.');
          return;
        }
        setForm({
          name: exp.name || '',
          institution: exp.institution || '',
          email: exp.email || '',
          field: exp.field || '',
          kriteria: exp.kriteria || (isTenagaTeknis ? 'Tenaga Teknis' : ''),
          alamat_kota: exp.alamat_kota || '',
          alamat_provinsi: exp.alamat_provinsi || '',
          photo: exp.photo || '',
          verified: !!exp.verified,
          featured: !!exp.featured,
        });
      })
      .catch(() => setError('Gagal memuat data.'))
      .finally(() => setLoading(false));
  }, [id, isEdit, isTenagaTeknis]);

  const backUrl = isTenagaTeknis ? '/admin/tenaga-teknis' : '/admin/tenaga-ahli';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (isEdit) await api.put(`/experts/${id}`, form);
      else await api.post('/experts', form);
      navigate(backUrl);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p className="text-[#414844]/70">Memuat...</p>;

  const entityTitle = isTenagaTeknis ? 'Tenaga Teknis' : 'Tenaga Ahli';

  return (
    <div>
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(backUrl)} className="text-[#414844]/60 hover:text-[#6B3410]">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#6B3410]">{isEdit ? `Edit ${entityTitle}` : `Tambah ${entityTitle}`}</h2>
          <p className="text-[#414844]/80 text-sm mt-1">Kelola data {entityTitle.toLowerCase()} yang terdaftar di TenagaAhli.com.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm p-6 max-w-2xl">
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
            <label className="text-xs font-bold uppercase text-[#414844]/70">Instansi</label>
            <input
              value={form.institution}
              onChange={(e) => setForm({ ...form, institution: e.target.value })}
              className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">Bidang Keahlian</label>
            <input
              value={form.field}
              onChange={(e) => setForm({ ...form, field: e.target.value })}
              className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
            />
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">Kriteria</label>
            <select
              value={form.kriteria}
              onChange={(e) => setForm({ ...form, kriteria: e.target.value })}
              className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410] bg-white"
            >
              <option value="">-- Pilih Kriteria --</option>
              <option value="Tenaga Ahli">Tenaga Ahli</option>
              <option value="Tenaga Teknis">Tenaga Teknis</option>
              <option value="Surveyor">Surveyor</option>
              <option value="Narasumber/Pembicara">Narasumber/Pembicara</option>
              <option value="Dosen/Peneliti">Dosen/Peneliti</option>
              <option value="Peneliti Artikel/Jurnal">Peneliti Artikel/Jurnal</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold uppercase text-[#414844]/70">Kota</label>
              <input
                value={form.alamat_kota}
                onChange={(e) => setForm({ ...form, alamat_kota: e.target.value })}
                className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
              />
            </div>
            <div>
              <label className="text-xs font-bold uppercase text-[#414844]/70">Provinsi</label>
              <input
                value={form.alamat_provinsi}
                onChange={(e) => setForm({ ...form, alamat_provinsi: e.target.value })}
                className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold uppercase text-[#414844]/70">URL Foto</label>
            <input
              value={form.photo}
              onChange={(e) => setForm({ ...form, photo: e.target.value })}
              className="w-full mt-1 border border-[#6B3410]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#6B3410] focus:border-[#6B3410]"
            />
          </div>
          <div className="flex gap-6">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} />
              Verified
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
              Featured
            </label>
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
              onClick={() => navigate(backUrl)}
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