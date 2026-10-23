import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import logo from '../assets/new logo.png';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BRAND_BROWN      = '#8B4513';
const BRAND_BROWN_DARK = '#654321';
const BRAND_GREEN      = '#2E5E3B';

// ── Config Penempatan Iklan ───────────────────────────────────────────────────
export const PLACEMENTS = {
  beranda_banner: {
    id: 'beranda_banner',
    label: 'Banner Beranda',
    desc: 'Tampil menonjol di halaman utama (Home)',
    icon: 'view_carousel',
    bg: '#EFF6FF',
    fg: '#1D4ED8',
    badgeBg: '#DBEAFE',
  },
  sidebar_berita: {
    id: 'sidebar_berita',
    label: 'Sidebar Berita',
    desc: 'Tampil di bilah samping halaman artikel & berita',
    icon: 'vertical_split',
    bg: '#F5F3FF',
    fg: '#7E22CE',
    badgeBg: '#EDE9FE',
  },
  footer_banner: {
    id: 'footer_banner',
    label: 'Banner Bawah / Footer',
    desc: 'Tampil di bagian bawah sebelum footer',
    icon: 'call_to_action',
    bg: '#FFF7ED',
    fg: '#C2410C',
    badgeBg: '#FFEDD5',
  },
  popup: {
    id: 'popup',
    label: 'Pop-up Promo',
    desc: 'Muncul sebagai jendela pop-up interaktif',
    icon: 'open_in_new',
    bg: '#FEF2F2',
    fg: '#B91C1C',
    badgeBg: '#FEE2E2',
  },
};

const STATUS_MAP = {
  active:  { label: 'Aktif',    bg: '#DCFCE7', fg: '#166534', dot: '#10B981' },
  paused:  { label: 'Dijeda',   bg: '#FEF3C7', fg: '#92400E', dot: '#F59E0B' },
  draft:   { label: 'Draf',     bg: '#F3F4F6', fg: '#4B5563', dot: '#9CA3AF' },
  expired: { label: 'Selesai',  bg: '#FEE2E2', fg: '#991B1B', dot: '#EF4444' },
};

const INPUT_CLS =
  'w-full bg-[#FAFBF9] border border-black/10 rounded-xl px-4 py-2.5 text-sm text-[#1F2A22] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors';

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Modal Pasang / Edit Iklan ─────────────────────────────────────────────────
export function IklanModal({ isOpen, onClose, ad, onSave, saving }) {
  const EMPTY = {
    title: '',
    company_name: '',
    description: '',
    target_url: '',
    placement: 'beranda_banner',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    status: 'active',
  };

  const [form, setForm]                 = useState(EMPTY);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile]       = useState(null);
  const imgPreviewRef                   = useRef(null);

  useEffect(() => {
    if (imgPreviewRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(imgPreviewRef.current);
    }
    imgPreviewRef.current = null;
    setImageFile(null);

    if (ad) {
      setForm({
        title: ad.title || '',
        company_name: ad.company_name || '',
        description: ad.description || '',
        target_url: ad.target_url || '',
        placement: ad.placement || 'beranda_banner',
        start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
        end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
        status: ad.status || 'active',
      });
      setImagePreview(ad.image_url || ad.image || null);
    } else {
      setForm(EMPTY);
      setImagePreview(null);
    }
  }, [ad, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (imgPreviewRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(imgPreviewRef.current);
    }
    const url = URL.createObjectURL(file);
    imgPreviewRef.current = url;
    setImageFile(file);
    setImagePreview(url);
  };

  const clearImage = () => {
    if (imgPreviewRef.current?.startsWith('blob:')) {
      URL.revokeObjectURL(imgPreviewRef.current);
    }
    imgPreviewRef.current = null;
    setImageFile(null);
    setImagePreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: ad?.id,
      form,
      imageFile,
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full my-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <form onSubmit={handleSubmit}>
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.06] bg-gray-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">campaign</span>
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {ad ? 'Edit Iklan Promosi' : 'Pasang Iklan Baru'}
                </h3>
                <p className="text-xs text-gray-500">Isi detail materi iklan dan target penempatan</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Form Body */}
          <div className="px-6 py-5 flex flex-col gap-4.5 max-h-[75vh] overflow-y-auto">
            {/* Judul Iklan */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Judul Iklan / Kampanye *
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={INPUT_CLS}
                placeholder="Contoh: Konsultasi AMDAL Terpercaya untuk Kawasan Industri"
              />
            </div>

            {/* Nama Perusahaan / Pengiklan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Nama Perusahaan / Brand
                </label>
                <input
                  type="text"
                  value={form.company_name}
                  onChange={(e) => setForm({ ...form, company_name: e.target.value })}
                  className={INPUT_CLS}
                  placeholder="PT Mitra Alam Semesta"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Posisi Penempatan *
                </label>
                <select
                  value={form.placement}
                  onChange={(e) => setForm({ ...form, placement: e.target.value })}
                  className={INPUT_CLS}
                >
                  {Object.entries(PLACEMENTS).map(([k, p]) => (
                    <option key={k} value={k}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Target URL */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Tautan / URL Tujuan (Klik Iklan)
              </label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-2.5 text-gray-400 text-[18px]">
                  link
                </span>
                <input
                  type="url"
                  value={form.target_url}
                  onChange={(e) => setForm({ ...form, target_url: e.target.value })}
                  className={`${INPUT_CLS} pl-9`}
                  placeholder="https://perusahaan-anda.com atau https://wa.me/62812..."
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">
                Pengunjung akan diarahkan ke link ini saat mengklik banner iklan Anda.
              </p>
            </div>

            {/* Banner Image Upload */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Gambar Banner / Pamflet Iklan
              </label>

              {imagePreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-gray-200 bg-gray-50 max-h-48 group flex items-center justify-center">
                  <img
                    src={imagePreview}
                    alt="Preview Iklan"
                    className="w-full h-44 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <label className="cursor-pointer bg-white text-gray-800 text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-gray-100 shadow-sm flex items-center gap-1">
                      <span className="material-symbols-outlined text-[16px]">change_circle</span>
                      Ganti Gambar
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </label>
                    <button
                      type="button"
                      onClick={clearImage}
                      className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl hover:bg-red-700 shadow-sm flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Hapus
                    </button>
                  </div>
                </div>
              ) : (
                <label className="border-2 border-dashed border-gray-300 hover:border-[#8B4513] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer transition-colors bg-gray-50/50 hover:bg-[#F4E8D0]/20">
                  <span className="material-symbols-outlined text-4xl text-gray-400 mb-2">add_photo_alternate</span>
                  <span className="text-xs font-bold text-gray-700">Pilih atau Seret Gambar Banner</span>
                  <span className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, atau WebP (Maksimal 5MB)</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Periode Tayang: Tanggal Mulai & Tanggal Selesai */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Tanggal Mulai Tayang
                </label>
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => setForm({ ...form, start_date: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                  Tanggal Selesai Tayang
                </label>
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date || undefined}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                  className={INPUT_CLS}
                />
              </div>
            </div>

            {/* Deskripsi Iklan */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Keterangan / Deskripsi Iklan
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={INPUT_CLS}
                placeholder="Tuliskan keterangan promo atau ringkasan materi iklan..."
              />
            </div>

            {/* Status Iklan */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1.5">
                Status Iklan
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'active', label: 'Langsung Aktif', icon: 'play_arrow' },
                  { value: 'paused', label: 'Dijeda Sementara', icon: 'pause' },
                  { value: 'draft',  label: 'Simpan Draf', icon: 'draft' },
                ].map((s) => (
                  <button
                    key={s.value}
                    type="button"
                    onClick={() => setForm({ ...form, status: s.value })}
                    className={`flex-1 py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                      form.status === s.value
                        ? 'border-[#8B4513] bg-[#8B4513]/10 text-[#8B4513] font-bold'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{s.icon}</span>
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 border-t border-black/[0.06] bg-gray-50/50 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 text-xs font-bold text-gray-600 hover:bg-gray-200/60 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm transition-all flex items-center gap-2 hover:opacity-95 disabled:opacity-50"
              style={{ backgroundColor: BRAND_BROWN }}
            >
              {saving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[16px]">save</span>
                  {ad ? 'Perbarui Iklan' : 'Pasang Iklan Sekarang'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Komponen Card Iklan ───────────────────────────────────────────────────────
export function AdCard({ ad, onEdit, onDelete, onToggleStatus }) {
  const placement = PLACEMENTS[ad.placement] || PLACEMENTS.beranda_banner;
  const status = STATUS_MAP[ad.status] || STATUS_MAP.active;
  const ctr = ad.views_count > 0 ? ((ad.clicks_count / ad.views_count) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 shadow-xs hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col group">
      {/* Banner Preview */}
      <div className="relative aspect-[16/9] w-full bg-gray-100 overflow-hidden" style={{ backgroundColor: placement.bg }}>
        {ad.image_url || ad.image ? (
          <img
            src={ad.image_url || ad.image}
            alt={ad.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
            <span className="material-symbols-outlined text-4xl mb-1" style={{ color: placement.fg }}>
              {placement.icon}
            </span>
            <span className="text-[11px] font-bold text-gray-500">{placement.label}</span>
          </div>
        )}

        {/* Status Badge - Top Right */}
        <div className="absolute top-2.5 right-2.5">
          <span
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm shadow-xs"
            style={{ backgroundColor: status.bg, color: status.fg }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
            {status.label}
          </span>
        </div>

        {/* Placement Tag - Top Left */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm shadow-xs"
            style={{ backgroundColor: placement.badgeBg, color: placement.fg }}
          >
            <span className="material-symbols-outlined text-[13px]">{placement.icon}</span>
            {placement.label}
          </span>
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1">
        {ad.company_name && (
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate mb-1">
            {ad.company_name}
          </p>
        )}

        <h3 className="text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-2 group-hover:text-[#8B4513] transition-colors">
          {ad.title}
        </h3>

        {ad.description && (
          <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed mb-3">
            {ad.description}
          </p>
        )}

        {/* Periode Tayang */}
        <div className="flex items-center gap-1.5 text-[11px] text-gray-500 mb-3 bg-gray-50 px-2.5 py-1.5 rounded-lg">
          <span className="material-symbols-outlined text-[14px] text-gray-400">calendar_month</span>
          <span>
            {ad.start_date ? formatDate(ad.start_date) : 'Langsung'} — {ad.end_date ? formatDate(ad.end_date) : 'Selamanya'}
          </span>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2 py-2 border-y border-gray-100 my-auto text-center">
          <div>
            <p className="text-xs font-extrabold text-gray-900">{ad.views_count || 0}</p>
            <p className="text-[9px] font-bold uppercase text-gray-400">Dilihat</p>
          </div>
          <div>
            <p className="text-xs font-extrabold text-[#8B4513]">{ad.clicks_count || 0}</p>
            <p className="text-[9px] font-bold uppercase text-gray-400">Diklik</p>
          </div>
          <div>
            <p className="text-xs font-extrabold text-emerald-600">{ctr}%</p>
            <p className="text-[9px] font-bold uppercase text-gray-400">CTR</p>
          </div>
        </div>

        {/* Target link */}
        {ad.target_url && (
          <a
            href={ad.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline truncate mt-2.5"
          >
            <span className="material-symbols-outlined text-[13px]">open_in_new</span>
            <span className="truncate">{ad.target_url}</span>
          </a>
        )}

        {/* Card Actions */}
        <div className="flex items-center gap-1.5 pt-3 mt-3 border-t border-gray-100">
          <button
            onClick={() => onEdit(ad)}
            className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <span className="material-symbols-outlined text-[14px]">edit</span>
            Edit
          </button>
          <button
            onClick={() => onToggleStatus(ad)}
            className={`flex-1 flex items-center justify-center gap-1 py-1.5 px-2 text-xs font-bold rounded-xl transition-colors ${
              ad.status === 'active'
                ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <span className="material-symbols-outlined text-[14px]">
              {ad.status === 'active' ? 'pause' : 'play_arrow'}
            </span>
            {ad.status === 'active' ? 'Jeda' : 'Aktifkan'}
          </button>
          <button
            onClick={() => onDelete(ad)}
            className="p-1.5 text-red-500 hover:bg-red-50 border border-red-200 rounded-xl transition-colors"
            title="Hapus Iklan"
          >
            <span className="material-symbols-outlined text-[16px]">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Komponen Utama KelolaIklan (Bisa dipakai standalone ataupun embedded) ─────
export default function KelolaIklan({ embedded = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [user, setUser]                 = useState(null);
  const [ads, setAds]                   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [saving, setSaving]             = useState(false);
  const [modalOpen, setModalOpen]       = useState(false);
  const [editingAd, setEditingAd]       = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlacement, setFilterPlacement] = useState('all');
  const [search, setSearch]             = useState('');

  const fetchAds = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/ads');
      setAds(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load ads:', err);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('amdal_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      setUser(null);
    }
    fetchAds();
  }, []);

  const openAdd = () => {
    setEditingAd(null);
    setModalOpen(true);
  };

  const openEdit = (ad) => {
    setEditingAd(ad);
    setModalOpen(true);
  };

  const onDelete = async (ad) => {
    if (!confirm(`Hapus iklan "${ad.title}"? Tindakan ini tidak dapat dibatalkan.`)) return;
    try {
      await api.delete(`/my/ads/${ad.id}`);
      setAds((prev) => prev.filter((x) => x.id !== ad.id));
    } catch (err) {
      console.error('Failed to delete ad:', err);
      alert('Gagal menghapus iklan.');
    }
  };

  const onToggleStatus = async (ad) => {
    try {
      const next = ad.status === 'active' ? 'paused' : 'active';
      const res = await api.patch(`/my/ads/${ad.id}/status`, { status: next });
      setAds((prev) => prev.map((x) => (x.id === ad.id ? res.data : x)));
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Gagal mengubah status iklan.');
    }
  };

  const onSave = async ({ id, form, imageFile }) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('company_name', form.company_name || '');
      fd.append('description', form.description || '');
      fd.append('target_url', form.target_url || '');
      fd.append('placement', form.placement || 'beranda_banner');
      if (form.start_date) fd.append('start_date', form.start_date);
      if (form.end_date) fd.append('end_date', form.end_date);
      fd.append('status', form.status || 'active');

      if (imageFile) {
        fd.append('image', imageFile);
      }

      if (id) {
        const res = await api.post(`/my/ads/${id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAds((prev) => prev.map((x) => (x.id === id ? res.data : x)));
      } else {
        const res = await api.post('/my/ads', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setAds((prev) => [res.data, ...prev]);
      }
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to save ad:', err);
      alert(err.response?.data?.message || 'Gagal menyimpan iklan. Periksa kembali form.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered ads
  const filtered = ads.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false;
    if (filterPlacement !== 'all' && a.placement !== filterPlacement) return false;
    if (search.trim()) {
      const s = search.toLowerCase();
      const matchTitle = a.title?.toLowerCase().includes(s);
      const matchComp  = a.company_name?.toLowerCase().includes(s);
      const matchDesc  = a.description?.toLowerCase().includes(s);
      if (!matchTitle && !matchComp && !matchDesc) return false;
    }
    return true;
  });

  const stats = {
    total:   ads.length,
    active:  ads.filter((a) => a.status === 'active').length,
    paused:  ads.filter((a) => a.status === 'paused').length,
    views:   ads.reduce((s, a) => s + (a.views_count || 0), 0),
    clicks:  ads.reduce((s, a) => s + (a.clicks_count || 0), 0),
  };

  const backUrl = user?.role_type === 'klien' ? '/akun' : user?.role_type === 'surveyor' ? '/dashboard-surveyor' : '/dashboard';

  const content = (
    <div className="w-full">
      {/* ── Summary Stats ────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 mb-6">
        {[
          { icon: 'campaign',     label: 'Total Iklan',   value: stats.total,  toneBg: '#EFF6FF', toneFg: '#1D4ED8' },
          { icon: 'play_circle',  label: 'Iklan Aktif',   value: stats.active, toneBg: '#F0FDF4', toneFg: '#15803D' },
          { icon: 'visibility',   label: 'Total Dilihat', value: stats.views,  toneBg: '#FFFBEB', toneFg: '#B45309' },
          { icon: 'touch_app',    label: 'Total Diklik',  value: stats.clicks, toneBg: `${BRAND_BROWN}15`, toneFg: BRAND_BROWN },
        ].map(({ icon, label, value, toneBg, toneFg }) => (
          <div key={label} className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: toneBg }}>
              <span className="material-symbols-outlined text-[22px]" style={{ color: toneFg }}>{icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-base font-black text-[#1F2A22]">{value}</p>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filter & Search Bar ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 sm:p-5 mb-6">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3.5 top-2.5 text-gray-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul iklan atau perusahaan..."
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            )}
          </div>

          {/* Select filters */}
          <div className="flex flex-wrap sm:flex-nowrap gap-2.5">
            <select
              value={filterPlacement}
              onChange={(e) => setFilterPlacement(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#8B4513]"
            >
              <option value="all">Semua Posisi</option>
              {Object.entries(PLACEMENTS).map(([k, p]) => (
                <option key={k} value={k}>{p.label}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-[#8B4513]"
            >
              <option value="all">Semua Status</option>
              <option value="active">Aktif</option>
              <option value="paused">Dijeda</option>
              <option value="draft">Draf</option>
            </select>

            {(filterStatus !== 'all' || filterPlacement !== 'all' || search) && (
              <button
                onClick={() => {
                  setFilterStatus('all');
                  setFilterPlacement('all');
                  setSearch('');
                }}
                className="px-3 py-2 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
              >
                Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Ads Grid ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-16 text-center">
          <div className="flex items-center justify-center gap-3 text-gray-500">
            <span className="w-5 h-5 rounded-full border-2 border-gray-300 border-t-[#8B4513] animate-spin" />
            <span className="text-sm font-medium">Memuat materi iklan...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-14 text-center">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${BRAND_BROWN}15` }}
          >
            <span className="material-symbols-outlined text-[32px]" style={{ color: BRAND_BROWN }}>
              campaign
            </span>
          </div>
          <h3 className="font-bold text-gray-900 text-base mb-1">
            {search || filterStatus !== 'all' || filterPlacement !== 'all'
              ? 'Tidak ada iklan yang cocok'
              : 'Belum Ada Iklan Terpasang'}
          </h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto mb-6">
            {search || filterStatus !== 'all' || filterPlacement !== 'all'
              ? 'Coba ubah kata kunci pencarian atau reset filter penempatan di atas.'
              : 'Pasang materi iklan atau pamflet Anda untuk meningkatkan jangkauan bisnis Anda.'}
          </p>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white rounded-xl shadow-sm hover:opacity-90 transition-all"
            style={{ backgroundColor: BRAND_BROWN }}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Pasang Iklan Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ad) => (
            <AdCard
              key={ad.id}
              ad={ad}
              onEdit={openEdit}
              onDelete={onDelete}
              onToggleStatus={onToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      <IklanModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        ad={editingAd}
        onSave={onSave}
        saving={saving}
      />
    </div>
  );

  // Jika di-embed dalam ProfilKlien.jsx, return langsung komponen kontennya
  if (embedded) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div>
            <h2 className="text-base font-bold text-gray-900">Kelola Iklan Saya</h2>
            <p className="text-xs text-gray-500">Pasang dan pantau materi promosi digital Anda</p>
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-xl shadow-xs hover:opacity-90 transition-all shrink-0"
            style={{ backgroundColor: BRAND_BROWN }}
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            Pasang Iklan Baru
          </button>
        </div>
        {content}
      </div>
    );
  }

  // Jika dibuka sebagai halaman mandiri (/kelola-iklan)
  return (
    <div className="min-h-screen bg-[#F5F4F0] text-gray-800">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-white border-b border-black/5 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to={backUrl} className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-colors">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </Link>
            <Link to="/">
              <img src={logo} alt="TenagaAhli.com" className="h-9 w-auto object-contain" />
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={openAdd}
              className="flex items-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl shadow-sm hover:opacity-90 transition-all"
              style={{ backgroundColor: BRAND_BROWN }}
            >
              <span className="material-symbols-outlined text-[18px]">add</span>
              Pasang Iklan
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* Header Hero */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-amber-500/10 text-[#8B4513] text-xs font-bold px-3 py-1 rounded-full mb-2">
              <span className="material-symbols-outlined text-[16px]">campaign</span>
              Layanan Pemasangan Iklan Klien
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Kelola Iklan & Banner
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Pasang iklan promosi, pamflet proyek, dan materi promosi brand Anda di etalase TenagaAhli.com
            </p>
          </div>
        </div>

        {content}
      </main>
    </div>
  );
}
