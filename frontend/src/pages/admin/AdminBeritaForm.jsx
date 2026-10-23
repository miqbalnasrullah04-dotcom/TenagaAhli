import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import api from '../../api/client.js';

const CATEGORY_OPTIONS = [
  { value: 'BERITA', label: 'Berita' },
  { value: 'INFORMASI PROYEK', label: 'Informasi Proyek' },
];

const DEFAULT_PREVIEW_IMG =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=800';

function getTodayDateString() {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function AdminBeritaForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('BERITA');
  const [source, setSource] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [publishedAt, setPublishedAt] = useState(getTodayDateString());

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [existingImageUrl, setExistingImageUrl] = useState('');

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || '';

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    api
      .get(`/admin/articles`)
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const item = list.find((x) => String(x.id) === String(id) || String(x.slug) === String(id));
        if (!item) {
          setError('Berita tidak ditemukan.');
          return;
        }

        setTitle(item.title || '');
        const catUpper = (item.category || '').toUpperCase();
        if (catUpper.includes('PROYEK')) {
          setCategory('INFORMASI PROYEK');
        } else {
          setCategory('BERITA');
        }

        setSource(item.source || '');
        setExcerpt(item.excerpt || '');
        setContent(item.content || '');
        setPublishedAt(item.published_at ? String(item.published_at).slice(0, 10) : getTodayDateString());

        let initialSrc = '';
        if (item.thumbnail_url) {
          initialSrc = item.thumbnail_url;
        } else if (item.thumbnail) {
          initialSrc = item.thumbnail.startsWith('http')
            ? item.thumbnail
            : `${BACKEND_URL}/storage/${item.thumbnail}`;
        }

        if (initialSrc) {
          setExistingImageUrl(initialSrc);
          setImagePreview(initialSrc);
        }
      })
      .catch(() => setError('Gagal memuat data berita dari server.'))
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

  const handleRemoveSelectedImage = () => {
    setImageFile(null);
    setImagePreview(existingImageUrl || '');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const formData = new FormData();
    formData.append('title', title);
    formData.append('category', category);
    formData.append('source', source);
    formData.append('excerpt', excerpt);
    formData.append('content', content);
    formData.append('published_at', publishedAt || getTodayDateString());

    if (imageFile) {
      formData.append('image', imageFile);
      formData.append('thumbnail', imageFile);
    }

    try {
      if (isEdit) {
        formData.append('_method', 'PUT');
        await api.post(`/admin/articles/${id}`, formData);
      } else {
        await api.post('/admin/articles', formData);
      }
      navigate('/admin/berita');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan berita.');
    } finally {
      setSaving(false);
    }
  };

  const finalCategoryDisplay = category === 'INFORMASI PROYEK' ? 'INFORMASI PROYEK' : 'BERITA';

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-500">
        <span className="material-symbols-outlined animate-spin text-[24px] text-[#8B4513] mr-2">
          progress_activity
        </span>
        <span>Memuat formulir berita...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Top Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => navigate('/admin/berita')}
          className="p-2 text-gray-500 hover:text-[#8B4513] hover:bg-gray-100 rounded-xl transition-colors"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <div>
          <h2 className="text-2xl font-bold text-[#8B4513]">
            {isEdit ? 'Edit Berita' : 'Tambah Berita Baru'}
          </h2>
          <p className="text-[#414844]/80 text-sm mt-0.5">
            Lengkapi informasi foto, kategori, judul, dan isi berita.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-[#FFDAD6] text-[#93000A] text-sm rounded-xl p-4 border border-[#93000A]/10">
          {error}
        </div>
      )}

      {/* Grid: Form on Left, Live Preview on Right */}
      <div className="grid lg:grid-cols-12 gap-8 items-start">
        {/* Left Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#8B4513]/15 shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Judul Berita */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Judul Berita <span className="text-rose-500">*</span>
              </label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Piala AFF 2026: Timnas Indonesia Siap Hadapi Laga Penentuan"
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
              />
            </div>

            {/* Kategori */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Kategori Berita / Konten <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold text-gray-800 focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all bg-white"
              >
                {CATEGORY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Pilih <strong>Berita</strong> untuk portal Berita atau <strong>Informasi Proyek</strong> untuk halaman Informasi Proyek.
              </p>
            </div>

            {/* Sumber Berita / Proyek */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Sumber Berita / Informasi Proyek
              </label>
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="Contoh: Kompas.com, Detik, KemenPUPR, atau link sumber https://..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Sebutkan media, instansi penerbit, atau URL rujukan dari mana informasi ini diperoleh.
              </p>
            </div>

            {/* Foto Upload */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Foto / Gambar Berita
                </label>
                {imageFile && (
                  <button
                    type="button"
                    onClick={handleRemoveSelectedImage}
                    className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                    Batalkan Foto Baru
                  </button>
                )}
              </div>
              <div className={`border-2 border-dashed rounded-2xl p-4 sm:p-6 text-center cursor-pointer transition-colors relative ${
                imageFile ? 'border-[#8B4513] bg-[#8B4513]/5' : 'border-gray-300 hover:border-[#8B4513] bg-gray-50/50'
              }`}>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,image/webp"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <span className={`material-symbols-outlined text-3xl mb-1 ${imageFile ? 'text-[#8B4513]' : 'text-gray-400'}`}>
                  {imageFile ? 'check_circle' : 'add_photo_alternate'}
                </span>
                <p className="text-xs font-semibold text-gray-700">
                  {imageFile ? (
                    <span className="text-[#8B4513] font-bold">Foto Baru Dipilih: {imageFile.name}</span>
                  ) : (
                    'Klik atau drag foto ke sini untuk upload'
                  )}
                </p>
                <p className="text-[11px] text-gray-400 mt-1">Format: JPG, PNG, WEBP (Maksimal 5MB)</p>
              </div>
            </div>

            {/* Tanggal (Otomatis) */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                  Tanggal Publikasi
                </label>
                <span className="text-[11px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-md">
                  Otomatis hari ini saat upload
                </span>
              </div>
              <input
                type="date"
                value={publishedAt}
                onChange={(e) => setPublishedAt(e.target.value)}
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all bg-white"
              />
            </div>

            {/* Ringkasan (Excerpt) */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Ringkasan Berita (Opsional)
              </label>
              <textarea
                rows={2}
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
                placeholder="Ringkasan singkat yang akan muncul di kartu cuplikan..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
              />
            </div>

            {/* Isi Berita */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                Isi Berita Lengkap <span className="text-rose-500">*</span>
              </label>
              <textarea
                required
                rows={9}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan isi berita lengkap di sini (bisa menggunakan paragraf biasa atau format HTML)..."
                className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all leading-relaxed"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-100">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 bg-[#8B4513] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#6B3410] disabled:opacity-60 shadow-md shadow-[#8B4513]/20 transition-all flex items-center justify-center gap-2"
              >
                {saving && (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                )}
                <span>{saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Publikasikan Berita'}</span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/admin/berita')}
                className="px-6 py-3 rounded-xl text-sm font-bold text-gray-600 border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>

        {/* Right Live Preview Card (5 Cols) */}
        <div className="lg:col-span-5 sticky top-24 space-y-4">
          <div className="bg-gradient-to-br from-amber-500/10 to-[#8B4513]/5 border border-[#8B4513]/15 rounded-2xl p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[#8B4513] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[18px]">visibility</span>
                Preview Kartu Berita
              </h3>
              <span className="text-[10px] uppercase font-bold text-gray-400">Live Preview</span>
            </div>

            {/* Simulated Card */}
            <div className="rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-md">
              <div className="relative h-48 overflow-hidden bg-gray-100">
                <img
                  src={imagePreview || DEFAULT_PREVIEW_IMG}
                  alt="Preview"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_PREVIEW_IMG;
                  }}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                {/* Date badge */}
                <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow">
                  <span className="material-symbols-outlined text-[12px] text-[#8B4513]">
                    calendar_today
                  </span>
                  <span>{publishedAt || getTodayDateString()}</span>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-2 flex items-center gap-2 flex-wrap">
                  <span
                    className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border ${
                      category === 'INFORMASI PROYEK'
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-[#F8F3EE] text-[#8B4513] border-[#E9DFD4]'
                    }`}
                  >
                    {category === 'INFORMASI PROYEK' ? 'INFORMASI PROYEK' : 'BERITA'}
                  </span>
                  {source && (
                    <span className="inline-block text-[10px] font-medium text-gray-500 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full truncate max-w-[200px]">
                      Sumber: {source}
                    </span>
                  )}
                </div>

                <h4 className="text-base font-bold text-gray-900 leading-snug line-clamp-2 mb-2">
                  {title || 'Judul Berita Akan Tampil Di Sini'}
                </h4>

                <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4">
                  {excerpt ||
                    (content ? content.slice(0, 120) + '...' : 'Ringkasan cuplikan isi berita akan tampil di bagian ini...')}
                </p>

                <div className="flex items-center justify-end pt-3 border-t border-gray-100 text-xs">
                  <span className="text-[#8B4513] font-bold text-xs">Baca artikel &rarr;</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
              Tampilan kartu ini yang akan dilihat oleh pengguna di portal <strong>/berita</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
