import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/client.js';

const emptyForm = {
  title: '',
  description: '',
  type: 'announcement',
  event_date: '',
  location: '',
  organizer: '',
  is_published: false,
  order: 0,
};

export default function AdminPamfletForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [form, setForm] = useState(emptyForm);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImage, setExistingImage] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://tenagaahli.latihan.co.id';

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/admin/pamflets`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const p = data.find((x) => String(x.id) === String(id));
        if (!p) {
          setError('Pamflet tidak ditemukan.');
          return;
        }
        setForm({
          title: p.title || '',
          description: p.description || '',
          type: p.type || 'announcement',
          event_date: p.event_date ? String(p.event_date).slice(0, 10) : '',
          location: p.location || '',
          organizer: p.organizer || '',
          is_published: !!p.is_published,
          order: p.order || 0,
        });
        
        if (p.image) {
          setExistingImage(p.image);
          setImagePreview(`${BACKEND_URL}/storage/${p.image}`);
        }
      })
      .catch(() => setError('Gagal memuat data.'))
      .finally(() => setLoading(false));
  }, [id, isEdit, BACKEND_URL]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('type', form.type);
    formData.append('event_date', form.event_date);
    formData.append('location', form.location);
    formData.append('organizer', form.organizer);
    formData.append('is_published', form.is_published ? '1' : '0');
    formData.append('order', form.order);

    if (imageFile) formData.append('image', imageFile);

    try {
      if (isEdit) {
        formData.append('_method', 'PUT');
        await api.post(`/admin/pamflets/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        await api.post('/admin/pamflets', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }
      navigate('/admin/pamflet');
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
        <button onClick={() => navigate('/admin/pamflet')} className="text-[#414844]/60 hover:text-[#0284C7]">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#0284C7]">{isEdit ? 'Edit Pamflet' : 'Tambah Pamflet'}</h2>
          <p className="text-[#414844]/80 text-sm mt-1">Kelola pamflet yang ditampilkan di halaman public</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#0284C7]/15 shadow-sm overflow-hidden">
        <div className="grid lg:grid-cols-2 gap-0">
          {/* Left: Form */}
          <div className="p-6">
            {error && <p className="bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3 mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold uppercase text-[#414844]/70">Judul Pamflet *</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Sosialisasi AMDAL 2026"
                  className="w-full mt-1 border border-[#0284C7]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#0284C7] focus:border-[#0284C7]"
                />
                <p className="text-xs text-[#414844]/60 mt-1">Judul akan ditampilkan di card pamflet</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[#414844]/70">
                  Gambar Pamflet * (jpg, png, max 5MB)
                </label>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handleImageChange}
                  className="w-full mt-1 border border-[#0284C7]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#0284C7] focus:border-[#0284C7]"
                />
                <p className="text-xs text-[#414844]/60 mt-1">Gambar akan ditampilkan sebagai background card</p>
              </div>

              <div>
                <label className="text-xs font-bold uppercase text-[#414844]/70">Deskripsi (Opsional)</label>
                <textarea
                  rows={2}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Deskripsi singkat tentang pamflet ini"
                  className="w-full mt-1 border border-[#0284C7]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#0284C7] focus:border-[#0284C7]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold uppercase text-[#414844]/70">Tipe</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full mt-1 border border-[#0284C7]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#0284C7] focus:border-[#0284C7]"
                  >
                    <option value="announcement">Pengumuman</option>
                    <option value="training">Pelatihan</option>
                    <option value="seminar">Seminar</option>
                    <option value="workshop">Workshop</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase text-[#414844]/70">Urutan</label>
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
                    className="w-full mt-1 border border-[#0284C7]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#0284C7] focus:border-[#0284C7]"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 bg-[#0284C7]/5 rounded-lg">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={form.is_published}
                  onChange={(e) => setForm({ ...form, is_published: e.target.checked })}
                  className="w-4 h-4 text-[#0284C7] border-[#0284C7]/30 rounded focus:ring-[#0284C7]"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-[#414844] cursor-pointer">
                  Publikasikan pamflet (tampilkan di halaman public)
                </label>
              </div>

              <details className="border border-[#0284C7]/20 rounded-lg">
                <summary className="cursor-pointer p-3 text-sm font-medium text-[#0284C7] hover:bg-[#0284C7]/5">
                  Info Tambahan (Opsional)
                </summary>
                <div className="p-3 border-t border-[#0284C7]/10 flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase text-[#414844]/70">Tanggal Acara</label>
                    <input
                      type="date"
                      value={form.event_date}
                      onChange={(e) => setForm({ ...form, event_date: e.target.value })}
                      className="w-full mt-1 border border-[#0284C7]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#0284C7] focus:border-[#0284C7]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-[#414844]/70">Lokasi</label>
                    <input
                      value={form.location}
                      onChange={(e) => setForm({ ...form, location: e.target.value })}
                      className="w-full mt-1 border border-[#0284C7]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#0284C7] focus:border-[#0284C7]"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold uppercase text-[#414844]/70">Penyelenggara</label>
                    <input
                      value={form.organizer}
                      onChange={(e) => setForm({ ...form, organizer: e.target.value })}
                      className="w-full mt-1 border border-[#0284C7]/30 rounded-lg px-3 py-2 text-sm focus:ring-[#0284C7] focus:border-[#0284C7]"
                    />
                  </div>
                </div>
              </details>

              <div className="flex gap-3 mt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-[#0284C7] text-white py-3 rounded-lg text-sm font-bold hover:bg-[#0369A1] disabled:opacity-60 transition-colors"
                >
                  {saving ? 'Menyimpan...' : 'Simpan Pamflet'}
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/admin/pamflet')}
                  className="px-6 py-3 rounded-lg text-sm font-bold text-[#414844] border border-[#414844]/20 hover:bg-[#414844]/5 transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>

          {/* Right: Preview Card */}
          <div className="bg-gradient-to-br from-[#0EA5E9]/5 to-[#0284C7]/5 p-6 flex flex-col">
            <h3 className="text-sm font-bold text-[#0284C7] mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">visibility</span>
              Preview Card Pamflet
            </h3>
            
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-sm">
                <div
                  className="
                    relative
                    overflow-hidden
                    rounded-3xl
                    shadow-xl
                    h-[480px]
                    bg-slate-200
                  "
                >
                  {imagePreview ? (
                    <>
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-6">
                        <span className="inline-block w-fit bg-[#0EA5E9] text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
                          PAMFLET
                        </span>
                        <h2 className="text-2xl font-bold text-white leading-snug drop-shadow-lg">
                          {form.title || 'Judul Pamflet'}
                        </h2>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                      <span className="material-symbols-outlined text-[64px] mb-3">image</span>
                      <p className="text-sm">Upload gambar untuk melihat preview</p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-center text-[#414844]/60 mt-3">
                  Preview card seperti yang akan ditampilkan di halaman public
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
