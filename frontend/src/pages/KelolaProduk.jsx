import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import api from '../api/client.js';
import PhysicalBookModal, { BOOK_CATEGORY } from '../components/PhysicalBookModal.jsx';
import { SkeletonProduk } from '../components/Skeleton.jsx';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BRAND_BROWN      = '#8B4513';
const BRAND_BROWN_DARK = '#654321';
const BRAND_GREEN      = '#2E5E3B';

// ── Config ────────────────────────────────────────────────────────────────────
const CAT = {
  physical_book: { label: 'Buku Fisik',      icon: 'menu_book',   bg: '#EFF6FF', fg: '#1E40AF' },
  book:         { label: 'Buku',            icon: 'book',        bg: '#EFF6FF', fg: '#1D4ED8' },
  presentation: { label: 'Presentasi/PPT',  icon: 'slideshow',   bg: '#F0FDF4', fg: '#15803D' },
  article:      { label: 'Artikel/Jurnal',  icon: 'article',     bg: '#F5F3FF', fg: '#7E22CE' },
  template:     { label: 'Template',        icon: 'description', bg: '#FFF7ED', fg: '#C2410C' },
  course:       { label: 'Kursus Online',   icon: 'school',      bg: '#FEF2F2', fg: '#B91C1C' },
  software:     { label: 'Software/Tools',  icon: 'code',        bg: '#F0F9FF', fg: '#0369A1' },
  cv:           { label: 'CV / Resume',     icon: 'badge',       bg: '#FEF3C7', fg: '#B45309' },
  other:        { label: 'Lainnya',         icon: 'inventory',   bg: '#F9FAFB', fg: '#374151' },
};

const STATUS_CFG = {
  draft:    { label: 'Draft',   bg: '#F3F4F6', fg: '#374151' },
  active:   { label: 'Aktif',   bg: '#F0FDF4', fg: '#15803D' },
  paused:   { label: 'Dijeda',  bg: '#FFFBEB', fg: '#B45309' },
  sold_out: { label: 'Habis',   bg: '#FEF2F2', fg: '#B91C1C' },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
const rupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

const INPUT_CLS = 'w-full bg-[#F5F4EF] border border-black/10 rounded-xl px-4 py-2.5 text-sm text-[#1F2A22] placeholder:text-[#5B6660]/50 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors';

// ── Product card ──────────────────────────────────────────────────────────────
function ProductCard({ product, onEdit, onDelete, onToggleStatus }) {
  const cat = CAT[product.category] ?? CAT.other;
  const st  = STATUS_CFG[product.status] ?? STATUS_CFG.draft;
  const discountPct = product.discount_price
    ? Math.round((1 - product.discount_price / product.price) * 100) : 0;

  const isPhysicalBook = product.category === BOOK_CATEGORY;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col group h-full">
      {/* Cover — Buku Fisik 4:5 (sesuai katalog UPRESS), produk digital 4:3 */}
      <div className={`relative ${isPhysicalBook ? 'aspect-[4/5]' : 'aspect-[4/3]'} w-full overflow-hidden bg-gray-100 shrink-0`} style={{ backgroundColor: cat.bg }}>
        {product.image_url || product.image ? (
          <img
            src={product.image_url || product.image}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-4 text-center">
            <span className="material-symbols-outlined text-[36px] sm:text-[40px]" style={{ color: cat.fg }}>{cat.icon}</span>
            <span className="text-[11px] font-bold text-gray-500">{cat.label}</span>
          </div>
        )}

        {/* Diagonal red ribbon — top right */}
        {discountPct > 0 && (
          <div className="absolute top-2.5 right-2.5 bg-[#EF4444] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-sm uppercase tracking-wider z-10">
            -{discountPct}%
          </div>
        )}

        {/* Format Badge (Digital / Buku Fisik) — top left */}
        <div className={`absolute top-2.5 left-2.5 ${isPhysicalBook ? 'bg-blue-800/85' : 'bg-emerald-700/85'} backdrop-blur-sm text-white px-2 py-0.5 rounded-md flex items-center gap-1 text-[10px] font-bold shadow-sm z-10`}>
          <span className="material-symbols-outlined text-[13px]">{isPhysicalBook ? 'local_shipping' : 'cloud_download'}</span>
          <span>{isPhysicalBook ? 'Buku Fisik' : 'Digital'}</span>
        </div>

        {/* Status badge — bottom left */}
        <div className="absolute bottom-2.5 left-2.5 z-10">
          <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold tracking-wide uppercase shadow-sm border border-white/20 backdrop-blur-sm" style={{ backgroundColor: st.bg, color: st.fg }}>
            {st.label}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        {/* Category Header */}
        <div className="flex items-center justify-between gap-2 mb-1.5">
          <span className="text-[10.5px] font-bold text-[#8FA0B5] uppercase tracking-wider truncate">
            {cat.label}
          </span>
          {product.author && (
            <span className="text-[11px] text-[#5B6660] truncate font-medium max-w-[60%]">
              oleh <strong className="text-[#374151] font-semibold">{product.author}</strong>
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-bold text-[#0F172A] leading-snug line-clamp-2 mb-3 group-hover:text-[#008A62] transition-colors min-h-[2.5rem]">
          {product.title}
        </h3>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Price row */}
        <div className="flex items-baseline gap-2 flex-wrap pt-2.5 border-t border-gray-100 mb-3.5">
          <span className="text-base sm:text-lg font-black text-[#008A62]">
            {rupiah(product.discount_price ?? product.price)}
          </span>
          {discountPct > 0 && (
            <span className="text-xs text-[#94A3B8] line-through font-medium">
              {rupiah(product.price)}
            </span>
          )}
        </div>

        {/* Actions (CRUD) */}
        <div className="flex flex-col gap-2 pt-3 border-t border-black/[0.06] mt-auto">
          {/* Toggle status button */}
          <button
            type="button"
            onClick={() => onToggleStatus(product)}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition-all shadow-xs"
            style={
              product.status === 'active'
                ? { backgroundColor: '#FFFBEB', color: '#B45309', border: '1px solid #FDE68A' }
                : { backgroundColor: '#F0FDF4', color: '#15803D', border: '1px solid #BBF7D0' }
            }
          >
            <span className="material-symbols-outlined text-[16px]">
              {product.status === 'active' ? 'pause_circle' : 'play_circle'}
            </span>
            <span>{product.status === 'active' ? 'Jeda Penjualan' : 'Aktifkan Produk'}</span>
          </button>

          {/* Edit & Delete row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-bold text-[#1F2A22] bg-[#F5F4EF] hover:bg-[#EAE8DE] border border-black/10 rounded-xl transition-colors"
            >
              <span className="material-symbols-outlined text-[16px] text-[#5B6660]">edit</span>
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => onDelete(product)}
              className="flex items-center justify-center gap-1.5 py-2 px-2.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
              title="Hapus Produk"
            >
              <span className="material-symbols-outlined text-[16px]">delete</span>
              <span>Hapus</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Quick presets for Terms of Use / Ketentuan Penggunaan ──────────────────
const LICENSE_PRESETS = [
  { label: 'Lisensi Pribadi', text: 'Lisensi Penggunaan Pribadi (Personal Use): Hanya untuk dipelajari sendiri, dilarang disebarluaskan atau dijual kembali.' },
  { label: 'Lisensi Komersial', text: 'Lisensi Komersial: Bebas digunakan untuk referensi pengerjaan proyek komersial klien Anda.' },
  { label: 'Bebas Modifikasi', text: 'Bebas Modifikasi: Anda diperbolehkan mengedit, menyesuaikan, dan mengembangkan isi dokumen ini untuk kebutuhan pekerjaan.' },
  { label: 'Dilarang Resell', text: 'Hak Cipta Dilindungi: Dilarang keras menggandakan, membagikan gratis, atau memperjualbelikan kembali dokumen ini.' },
];

// ── Product modal (Khusus Produk Digital) ────────────────────────────────────
function ProductModal({ isOpen, onClose, product, onSave, saving, user }) {
  const EMPTY = {
    title: '',
    category: 'book',
    price: '',
    discount_price: '',
    description: '',
    download_url: '',
    file_format: 'PDF',
    file_size: '',
    terms_of_use: '',
    stock: '',
    is_digital: true,
  };

  const [form, setForm]                 = useState(EMPTY);
  const [imagePreview, setImagePreview] = useState(null); // blob URL or existing URL
  const [imageFile, setImageFile]       = useState(null);
  const [digitalFile, setDigitalFile]   = useState(null);

  const imgPreviewRef = useRef(null);

  useEffect(() => {
    // Revoke any previous blob URL to avoid memory leaks
    if (imgPreviewRef.current && imgPreviewRef.current.startsWith('blob:')) {
      URL.revokeObjectURL(imgPreviewRef.current);
    }
    imgPreviewRef.current = null;
    setImageFile(null);
    setDigitalFile(null);

    if (product) {
      setForm({
        title: product.title || '',
        category: product.category || 'book',
        price: product.price || '',
        discount_price: product.discount_price ?? '',
        description: product.description || '',
        download_url: product.download_url || '',
        file_format: product.file_format || 'PDF',
        file_size: product.file_size || '',
        terms_of_use: product.terms_of_use || '',
        stock: product.stock ?? '',
        is_digital: true,
      });
    } else {
      setForm(EMPTY);
    }

    // Show existing image when editing
    setImagePreview(product?.image_url || product?.image || null);
  }, [product, isOpen]);

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (imgPreviewRef.current?.startsWith('blob:')) URL.revokeObjectURL(imgPreviewRef.current);
    const url = URL.createObjectURL(file);
    imgPreviewRef.current = url;
    setImageFile(file);
    setImagePreview(url);
  };

  const clearImage = () => {
    if (imgPreviewRef.current?.startsWith('blob:')) URL.revokeObjectURL(imgPreviewRef.current);
    imgPreviewRef.current = null;
    setImageFile(null);
    setImagePreview(null);
  };

  const handleDigitalFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setDigitalFile(file);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      const bytes = file.size;
      const sizeStr = bytes >= 1048576 ? (bytes / 1048576).toFixed(1) + ' MB' : (bytes / 1024).toFixed(1) + ' KB';
      setForm((prev) => ({
        ...prev,
        file_format: ext,
        file_size: sizeStr,
      }));
    }
  };

  const clearDigitalFile = () => {
    setDigitalFile(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert('Silakan masukkan nama produk digital.');
      return;
    }
    if (!form.category) {
      alert('Silakan pilih kategori produk.');
      return;
    }
    if (!form.description.trim()) {
      alert('Silakan isi deskripsi produk digital.');
      return;
    }
    if (form.price === '' || parseInt(form.price) < 0) {
      alert('Silakan tentukan harga produk (minimal Rp 0).');
      return;
    }
    if (!imagePreview && !imageFile) {
      alert('Silakan unggah gambar / thumbnail sampul produk.');
      return;
    }
    if (!digitalFile && !form.download_url?.trim() && !product?.file_path) {
      alert('Silakan unggah berkas file digital atau masukkan tautan link materi.');
      return;
    }

    onSave({
      id: product?.id,
      form,
      imageFile,
      digitalFile,
    });
  };

  if (!isOpen) return null;

  const authorDisplayName = product?.author || user?.name || 'Profil Tenaga Ahli';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full my-4 shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFBF9]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">
                  {form.category === 'cv' ? 'badge' : 'cloud_download'}
                </span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                  {product ? 'Edit Produk Digital' : 'Pasang Produk Digital Baru'}
                </p>
                <p className="text-[11px] text-gray-500">
                  {form.category === 'cv'
                    ? 'Format CV / Resume Digital (Akses Unduh Langsung)'
                    : 'Format E-Book, Modul, Template, atau Dokumen Teknis'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-1.5 hover:bg-gray-200/60 rounded-xl transition-colors text-gray-400 hover:text-gray-700"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Fields Content */}
          <div className="px-6 py-5 flex flex-col gap-4 overflow-y-auto flex-1 text-xs sm:text-sm">
            {/* Banner Otomatis: Status & Tenaga Ahli (Field 9 & 10) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl">
              {/* Field 10: Nama Tenaga Ahli (Otomatis dari Profil) */}
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[17px]">verified_user</span>
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Tenaga Ahli (Otomatis)</p>
                  <p className="text-xs font-extrabold text-emerald-950 truncate" title={authorDisplayName}>
                    {authorDisplayName}
                  </p>
                </div>
              </div>

              {/* Field 9: Status Produk (Otomatis Aktif) */}
              <div className="flex items-center gap-2.5 sm:border-l sm:border-emerald-200/80 sm:pl-3">
                <div className="w-8 h-8 rounded-xl bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[17px]">bolt</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Status Produk (Otomatis)</p>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs font-extrabold text-emerald-950">
                      {product?.status === 'paused' ? 'Dijeda' : 'Aktif (Siap Dijual & Diunduh)'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Field 1: Nama Produk (Wajib) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                Nama Produk Digital <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className={INPUT_CLS}
                placeholder={
                  form.category === 'cv'
                    ? 'Contoh: Curriculum Vitae (CV) & Portofolio Proyek Ahli Lingkungan'
                    : 'Contoh: Master Template Laporan AMDAL & RKL-RPL Lengkap Format Word/Excel'
                }
              />
            </div>

            {/* Field 2: Kategori Produk (Wajib) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                Kategori Produk <span className="text-red-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className={INPUT_CLS}
              >
                <option value="book">E-Book & Modul Panduan</option>
                <option value="template">Template & Format Dokumen (Word / Excel)</option>
                <option value="presentation">Slide Presentasi & PPT</option>
                <option value="article">Artikel & Jurnal Ilmiah</option>
                <option value="software">Software, Spreadsheet & Tools Otomatis</option>
                <option value="cv">Curriculum Vitae (CV) & Portofolio Resume</option>
                <option value="course">Video Kursus & Rekaman Materi</option>
                <option value="other">Dokumen Digital Lainnya</option>
              </select>
            </div>

            {/* Peringatan Watermark jika Kategori CV */}
            {form.category === 'cv' && (
              <div className="p-3.5 bg-amber-50/95 border-2 border-amber-400 rounded-2xl flex items-start gap-3 shadow-xs">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[20px]">warning</span>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-extrabold text-amber-950">
                    Peringatan Privasi: Pasang Watermark pada Dokumen CV!
                  </p>
                  <p className="text-[11px] text-amber-900 leading-snug">
                    Beri tanda air <em>"PREVIEW / HANYA UNTUK REKRUTMEN"</em> dan sensor data sensitif (NIK, Alamat Rumah Lengkap, No. Rekening) sebelum mengunggah dokumen CV.
                  </p>
                </div>
              </div>
            )}

            {/* Field 6: Harga Produk & Harga Promo (Wajib) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Harga Produk (Rp) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-500">Rp</span>
                  <input
                    type="number"
                    required
                    min="0"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className={INPUT_CLS + ' pl-10 font-bold'}
                    placeholder="50000"
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">Isi 0 jika produk dibagikan secara gratis.</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                  Harga Diskon / Promo (Rp) <span className="text-gray-400 font-normal lowercase">(opsional)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-500">Rp</span>
                  <input
                    type="number"
                    min="0"
                    value={form.discount_price}
                    onChange={(e) => setForm({ ...form, discount_price: e.target.value })}
                    className={INPUT_CLS + ' pl-10'}
                    placeholder="Opsional (misal: 35000)"
                  />
                </div>
                {form.discount_price && form.price && parseInt(form.discount_price) < parseInt(form.price) && (
                  <p className="text-[10px] text-emerald-600 font-bold mt-1">
                    Hemat {Math.round((1 - parseInt(form.discount_price) / parseInt(form.price)) * 100)}% dari harga normal
                  </p>
                )}
              </div>
            </div>

            {/* Field 4: Gambar / Thumbnail Sampul (Wajib) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                Gambar / Thumbnail Sampul Produk <span className="text-red-500">*</span>
              </label>

              {imagePreview ? (
                <div className="relative mb-2 rounded-2xl overflow-hidden border border-gray-200 bg-[#F5F4EF] w-36 h-36">
                  <img src={imagePreview} alt="Preview Cover" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-1.5 right-1.5 bg-red-500 hover:bg-red-600 text-white p-1 rounded-full shadow transition-colors"
                    title="Hapus gambar"
                  >
                    <span className="material-symbols-outlined text-[14px]">close</span>
                  </button>
                </div>
              ) : (
                <div className="mb-2 h-24 rounded-2xl border-2 border-dashed border-gray-200 bg-[#FAFBF9] flex flex-col items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[24px] text-gray-400">add_photo_alternate</span>
                  <p className="text-[11px] text-gray-500">Pilih gambar sampul atau thumbnail</p>
                </div>
              )}

              <label className={INPUT_CLS + ' cursor-pointer flex items-center gap-2 bg-white'}>
                <span className="material-symbols-outlined text-[18px] text-emerald-700">upload</span>
                <span className="text-gray-700 truncate font-medium">
                  {imageFile ? imageFile.name : 'Pilih file thumbnail (JPG, PNG, WebP — maks. 5MB)'}
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  className="hidden"
                  onChange={handleImageChange}
                />
              </label>
            </div>

            {/* Field 5 & Field 7: Berkas File Digital (Wajib) & Format/Ukuran Otomatis */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-200 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-emerald-700">cloud_download</span>
                  <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wide">
                    File Digital Produk <span className="text-red-500">*</span>
                  </span>
                </div>

                {/* Field 7: Jenis atau Format File (Otomatis) */}
                {(form.file_format || form.file_size) && (
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-100 text-emerald-800 text-[11px] font-black tracking-wide uppercase flex items-center gap-1 border border-emerald-300 shadow-2xs">
                    <span className="material-symbols-outlined text-[13px]">check_circle</span>
                    Format: {form.file_format || 'FILE'} {form.file_size ? `• ${form.file_size}` : ''}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-emerald-800 leading-snug">
                Unggah berkas langsung (maks. 100MB) atau masukkan tautan link penyimpanan cloud (Google Drive, Dropbox, dll). Format dan ukuran file terdeteksi secara otomatis.
              </p>

              {/* Upload Berkas */}
              <div>
                <label className={INPUT_CLS + ' cursor-pointer flex items-center justify-between gap-2 bg-white border-emerald-200'}>
                  <div className="flex items-center gap-2 truncate">
                    <span className="material-symbols-outlined text-[18px] text-emerald-700">upload_file</span>
                    <span className="text-gray-800 truncate font-medium">
                      {digitalFile
                        ? digitalFile.name
                        : product?.file_path
                        ? `Berkas tersimpan: ${product.file_path.split('/').pop()}`
                        : 'Pilih berkas dari perangkat (PDF, ZIP, DOCX, PPT, XLS, dll)'}
                    </span>
                  </div>
                  {digitalFile && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        clearDigitalFile();
                      }}
                      className="text-red-500 hover:text-red-700 p-0.5"
                      title="Batalkan pilihan berkas"
                    >
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.zip,.rar,.7z,.doc,.docx,.ppt,.pptx,.epub,.txt,.xls,.xlsx,.mp4"
                    className="hidden"
                    onChange={handleDigitalFileChange}
                  />
                </label>
              </div>

              {/* ATAU Tautan Unduhan Cloud */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  Atau Masukkan Tautan / Link Cloud Storage (Google Drive / Dropbox)
                </label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-gray-400">link</span>
                  <input
                    type="url"
                    value={form.download_url}
                    onChange={(e) => setForm({ ...form, download_url: e.target.value })}
                    placeholder="https://drive.google.com/..."
                    className={INPUT_CLS + ' bg-white pl-9 text-xs'}
                  />
                </div>
              </div>
            </div>

            {/* Field 3: Deskripsi Produk (Wajib) */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1">
                Deskripsi & Silabus Materi Produk <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className={INPUT_CLS + ' resize-none'}
                placeholder="Jelaskan secara ringkas mengenai isi berkas materi, daftar isi/silabus, manfaat, serta panduan singkat bagi pembeli setelah mengunduh file ini..."
              />
            </div>

            {/* Field 8: Ketentuan Penggunaan (Opsional) */}
            <div>
              <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
                <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wide">
                  Ketentuan Penggunaan & Lisensi <span className="text-gray-400 font-normal lowercase">(opsional)</span>
                </label>
                <span className="text-[10px] text-gray-400">Klik untuk menambahkan cepat:</span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {LICENSE_PRESETS.map((lp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setForm((prev) => ({
                        ...prev,
                        terms_of_use: prev.terms_of_use
                          ? `${prev.terms_of_use}\n${lp.text}`
                          : lp.text,
                      }));
                    }}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-gray-100 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 text-gray-700 rounded-lg border border-gray-200 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[12px]">add</span>
                    {lp.label}
                  </button>
                ))}
              </div>

              <textarea
                rows={2}
                value={form.terms_of_use}
                onChange={(e) => setForm({ ...form, terms_of_use: e.target.value })}
                className={INPUT_CLS + ' resize-none text-xs'}
                placeholder="Contoh: Lisensi Penggunaan Pribadi (Personal Use) — Dilarang menjual kembali atau membagikan ulang berkas ini..."
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-[#FAFBF9]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
              style={{ backgroundColor: '#15803D' }}
            >
              {saving && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {saving ? 'Menyimpan...' : product ? 'Simpan Perubahan' : 'Terbitkan Produk Digital'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

// ── Page ──────────────────────────────────────────────────────────────────────

// Komponen konten produk — dipisah agar tidak melanggar Rules of Hooks
function ProdukContent({ t }) {
  const navigate = useNavigate();
  const [user, setUser]                   = useState(null);
  const [quota, setQuota]                 = useState(null);
  const [loadingQuota, setLoadingQuota]   = useState(true);
  const [products, setProducts]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [saving, setSaving]               = useState(false);
  const [filterCat, setFilterCat]         = useState('all');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [modalOpen, setModalOpen]         = useState(false);
  const [editing, setEditing]             = useState(null);
  const [bookModalOpen, setBookModalOpen] = useState(false);

  const fetchQuota = async () => {
    try {
      const res = await api.get('/my/products-quota');
      setQuota(res.data);
    } catch (err) {
      console.error('Failed to load product quota:', err);
    } finally {
      setLoadingQuota(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/products');
      setProducts(res.data || []);
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('amdal_user');
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {
      setUser(null);
    }
    fetchQuota();
    fetchProducts();
  }, []);

  // Akses diizinkan jika admin atau member Ekonomis / Eksklusif aktif
  const isAllowed = quota
    ? (quota.tier === 'admin' || ['platinum', 'eksklusif', 'ekslusif'].includes(quota.tier) || ['premium', 'ekonomis'].includes(quota.tier) || (quota.limit > 0 && !quota.is_expired))
    : (user?.role === 'admin' || user?.is_premium === true || ['premium', 'platinum', 'ekonomis', 'eksklusif', 'ekslusif'].includes(user?.package) || (user?.package?.price > 0 && (!user?.premium_expires_at || new Date(user?.premium_expires_at) > new Date())));

  const openAdd = (kind = 'digital') => {
    if (quota && !quota.can_add) {
      if (quota.tier === 'premium' || quota.tier === 'ekonomis') {
        if (confirm(`Batas maksimal Paket Ekonomis (10 produk) telah tercapai.\n\nApakah Anda ingin upgrade ke Paket Eksklusif untuk memasang hingga 20 produk?`)) {
          navigate('/paket');
        }
      } else {
        alert(`Batas maksimal produk untuk ${quota.package_name || 'paket Anda'} (${quota.limit} produk) telah tercapai.`);
      }
      return;
    }
    setEditing(null);
    if (kind === 'book') setBookModalOpen(true);
    else setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditing(p);
    if (p.category === BOOK_CATEGORY) setBookModalOpen(true);
    else setModalOpen(true);
  };

  const onSaveBook = async ({ id, form, imageFile }) => {
    if (!id && quota && !quota.can_add) {
      alert(`Batas kuota produk untuk ${quota.package_name} (${quota.limit} produk) telah tercapai.`);
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('category', BOOK_CATEGORY);
      fd.append('title', form.title);
      fd.append('description', form.description || '');
      fd.append('author', form.author || '');
      fd.append('publisher', form.publisher || '');
      fd.append('isbn', form.isbn || '');
      fd.append('price', String(parseInt(form.price, 10) || 0));
      fd.append('upress_url', form.upress_url || '');
      if (imageFile) fd.append('image', imageFile);

      const res = await api.post(id ? `/my/products/${id}` : '/my/products', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (id) {
        setProducts(prev => prev.map(p => p.id === id ? res.data : p));
      } else {
        setProducts(prev => [res.data, ...prev]);
        fetchQuota();
      }
      setBookModalOpen(false);
      setEditing(null);
    } catch (err) {
      console.error('Failed to save physical book:', err);
      alert(err.response?.data?.message || err.message || 'Gagal menyimpan produk buku fisik.');
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (p) => {
    if (!confirm(`Hapus "${p.title}"?`)) return;
    try {
      await api.delete(`/my/products/${p.id}`);
      setProducts(prev => prev.filter(x => x.id !== p.id));
      fetchQuota();
    } catch (err) {
      console.error('Failed to delete product:', err);
      alert('Gagal menghapus produk.');
    }
  };

  const onToggle = async (p) => {
    try {
      const nextStatus = p.status === 'active' ? 'paused' : 'active';
      const res = await api.patch(`/my/products/${p.id}/status`, { status: nextStatus });
      setProducts(prev => prev.map(x => x.id === p.id ? res.data : x));
    } catch (err) {
      console.error('Failed to toggle status:', err);
      alert('Gagal mengubah status produk.');
    }
  };

  const onSave = async ({ id, form, imageFile, digitalFile }) => {
    if (!id && quota && !quota.can_add) {
      alert(`Batas kuota produk untuk ${quota.package_name} (${quota.limit} produk) telah tercapai.`);
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('title', form.title);
      fd.append('category', form.category);
      fd.append('price', parseInt(form.price) || 0);
      if (form.discount_price !== '' && form.discount_price !== null && form.discount_price !== undefined) {
        fd.append('discount_price', parseInt(form.discount_price) || 0);
      }
      fd.append('is_digital', '1');
      if (form.download_url) {
        fd.append('download_url', form.download_url);
      }
      if (digitalFile) {
        fd.append('digital_file', digitalFile);
      }
      if (form.file_format) {
        fd.append('file_format', form.file_format);
      }
      if (form.file_size) {
        fd.append('file_size', form.file_size);
      }
      if (form.terms_of_use) {
        fd.append('terms_of_use', form.terms_of_use);
      }
      if (form.stock !== '' && form.stock !== null && form.stock !== undefined) {
        fd.append('stock', parseInt(form.stock) || 0);
      }
      fd.append('description', form.description);
      if (imageFile) {
        fd.append('image', imageFile);
      }

      if (id) {
        const res = await api.post(`/my/products/${id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setProducts(prev => prev.map(p => p.id === id ? res.data : p));
      } else {
        fd.append('status', 'active');
        const res = await api.post('/my/products', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setProducts(prev => [res.data, ...prev]);
        fetchQuota();
      }
      setModalOpen(false);
      setEditing(null);
    } catch (err) {
      console.error('Failed to save product:', err);
      const msg = err.response?.data?.message || err.message || 'Gagal menyimpan produk. Periksa kembali form.';
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  const filtered = products.filter(p => {
    if (filterCat    !== 'all' && p.category !== filterCat)    return false;
    if (filterStatus !== 'all' && p.status   !== filterStatus) return false;
    return true;
  });

  const stats = {
    total:   products.length,
    active:  products.filter(p => p.status === 'active').length,
    draft:   products.filter(p => p.status === 'draft').length,
    revenue: Math.round(products.reduce((s, p) => s + (p.sold_count || 0) * (p.discount_price ?? p.price), 0) * 0.9),
  };

  const SELECT_CLS = 'bg-white border border-black/10 rounded-xl px-3 py-2 text-sm text-[#1F2A22] focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors';

  // Loading Quota & Products state
  if (loadingQuota || (loading && products.length === 0)) {
    return (
      <DashboardLayout
        title="Kelola Produk"
        subtitle="Memuat informasi keanggotaan dan produk..."
      >
        <SkeletonProduk />
      </DashboardLayout>
    );
  }

  // Gate - show lock screen if not subscribed to Premium or Platinum
  if (!isAllowed) {
    return (
      <DashboardLayout
        title="Kelola Produk"
        subtitle="Fitur untuk member Paket Ekonomis & Eksklusif"
      >
        <div className="max-w-xl mx-auto py-6">
          <div className="bg-white rounded-3xl border border-black/5 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#8B4513] to-[#654321] px-8 py-10 text-center">
              <div className="w-20 h-20 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-[40px] text-yellow-300" style={{ fontVariationSettings: '"FILL" 1' }}>lock</span>
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Fitur Etalase Produk Digital</h2>
              <p className="text-white/80 text-sm leading-relaxed max-w-md mx-auto">
                Pasang karya buku, template dokumen, presentasi, dan materi pelatihan Anda di profil publik TenagaAhli.com.
              </p>
            </div>

            {/* Body */}
            <div className="px-8 py-7">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4 text-center">
                Pilihan Kuota Paket
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {/* Card Ekonomis */}
                <div className="p-4 rounded-2xl border-2 border-amber-200 bg-amber-50/50 flex flex-col justify-between">
                  <div>
                    <div className="inline-flex items-center gap-1 bg-amber-500 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-2">
                      Paket Ekonomis
                    </div>
                    <p className="text-xl font-black text-gray-900 mb-1">Maks. 10 Produk</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Ideal untuk memulai memasang karya unggulan dan portofolio produk.
                    </p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-gray-600 mt-3 pt-3 border-t border-amber-200/60">
                    <li className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[15px] text-amber-600">check</span>
                      Hingga 10 Produk Aktif
                    </li>
                    <li className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[15px] text-amber-600">check</span>
                      Badge Ekonomis Profil
                    </li>
                  </ul>
                </div>

                {/* Card Eksklusif */}
                <div className="p-4 rounded-2xl border-2 border-purple-300 bg-purple-50/50 flex flex-col justify-between relative overflow-hidden">
                  <div className="absolute top-2 right-2 text-[10px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Kapasitas Terbanyak
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-1 bg-purple-700 text-white text-[10px] font-black uppercase px-2 py-0.5 rounded-md mb-2">
                      Paket Eksklusif
                    </div>
                    <p className="text-xl font-black text-purple-950 mb-1">Maks. 20 Produk</p>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      Kapasitas maksimal untuk menjual aneka buku, template & modul.
                    </p>
                  </div>
                  <ul className="text-xs space-y-1.5 text-gray-600 mt-3 pt-3 border-t border-purple-200/60">
                    <li className="flex items-center gap-1.5 font-bold text-purple-900">
                      <span className="material-symbols-outlined text-[15px] text-purple-700">check_circle</span>
                      Hingga 20 Produk Aktif
                    </li>
                    <li className="flex items-center gap-1.5 font-medium">
                      <span className="material-symbols-outlined text-[15px] text-purple-700">check</span>
                      Prioritas Pencarian Utama
                    </li>
                  </ul>
                </div>
              </div>

              <Link
                to="/paket"
                className="w-full flex items-center justify-center gap-2 bg-[#8B4513] hover:bg-[#654321] text-white font-bold text-sm py-3.5 rounded-2xl transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                Pilih Paket Sekarang
              </Link>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const isLimitReached = quota && !quota.can_add;
  const quotaPercentage = quota?.limit ? Math.min(100, Math.round((quota.used / quota.limit) * 100)) : 0;

  return (
    <DashboardLayout
      title="Kelola Produk"
      subtitle="Kelola produk digital & karya Anda untuk ditampilkan di profil publik"
      headerRight={
        <div className="flex items-center gap-2.5">
          {quota && quota.limit < 999 && (
            <div className="hidden sm:flex flex-col items-end">
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                isLimitReached ? 'bg-red-100 text-red-700 border border-red-200' : 'bg-gray-100 text-gray-700'
              }`}>
                Kuota: {quota.used} / {quota.limit}
              </span>
            </div>
          )}
          <button
            id="btn-tambah-buku-fisik"
            onClick={() => openAdd('book')}
            disabled={isLimitReached}
            className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm border border-[#8B4513]/30 text-[#8B4513] bg-white hover:bg-[#8B4513]/5 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Tambah produk buku fisik"
          >
            <span className="material-symbols-outlined text-[18px]">menu_book</span>
            Tambah Buku Fisik
          </button>
          <button
            onClick={() => openAdd()}
            className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl transition-all shadow-sm ${
              isLimitReached ? 'bg-amber-600 hover:bg-amber-700' : 'hover:opacity-90'
            }`}
            style={isLimitReached ? {} : { backgroundColor: BRAND_BROWN }}
            title={isLimitReached ? `Batas ${quota?.limit} produk telah tercapai` : 'Tambah produk baru'}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isLimitReached ? (['premium', 'ekonomis'].includes(quota?.tier) ? 'upgrade' : 'block') : 'add'}
            </span>
            {isLimitReached
              ? (['premium', 'ekonomis'].includes(quota?.tier) ? 'Upgrade ke Eksklusif (20 Produk)' : 'Kuota Penuh')
              : 'Tambah Produk'
            }
          </button>
        </div>
      }
    >
      {/* ── Quota Tracker & Upgrade Alert ───────────────────────────── */}
      {quota && quota.limit < 999 && (
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-5 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <span className={`text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                ['platinum', 'eksklusif', 'ekslusif'].includes(quota.tier) ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
              }`}>
                {quota.package_name || (['platinum', 'eksklusif', 'ekslusif'].includes(quota.tier) ? 'Paket Eksklusif' : 'Paket Ekonomis')}
              </span>
              <span className="text-xs font-bold text-gray-500">
                Maksimal {quota.limit} Produk Digital
              </span>
            </div>
            <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <span>Terpakai:</span>
              <span className={`font-black ${isLimitReached ? 'text-red-600' : 'text-[#8B4513]'}`}>
                {quota.used} dari {quota.limit} produk
              </span>
              <span className="text-gray-400">({quota.remaining} tersisa)</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isLimitReached
                  ? 'bg-red-500'
                  : quotaPercentage > 75
                  ? 'bg-amber-500'
                  : 'bg-[#8B4513]'
              }`}
              style={{ width: `${quotaPercentage}%` }}
            />
          </div>

          {/* Upgrade Banner for Ekonomis tier */}
          {(quota.tier === 'premium' || quota.tier === 'ekonomis') && (
            <div className="mt-4 pt-3.5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="material-symbols-outlined text-purple-600 text-[18px]">stars</span>
                <span>
                  {isLimitReached
                    ? <strong>Batas 10 produk Paket Ekonomis tercapai.</strong>
                    : 'Ingin memasang lebih dari 10 produk?'
                  }{' '}
                  Upgrade ke <strong>Paket Eksklusif</strong> untuk memasang hingga <strong>20 produk</strong>.
                </span>
              </div>
              <Link
                to="/paket"
                className="inline-flex items-center gap-1 font-bold text-purple-700 hover:text-purple-900 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-xl transition-colors shrink-0 self-start sm:self-auto"
              >
                <span>Upgrade ke Eksklusif (20 Produk)</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        {[
          { icon: 'inventory',   label: 'Total Produk', value: stats.total,           toneColor: '#1D4ED8', toneBg: '#EFF6FF' },
          { icon: 'storefront',  label: 'Aktif Dijual', value: stats.active,          toneColor: BRAND_GREEN, toneBg: '#F0FDF4' },
          { icon: 'draft',       label: 'Draft / Jeda', value: stats.draft,           toneColor: '#B45309', toneBg: '#FFFBEB' },
          { icon: 'payments',    label: 'Pendapatan (90%)', value: rupiah(stats.revenue), toneColor: BRAND_BROWN, toneBg: `${BRAND_BROWN}15` },
        ].map(({ icon, label, value, toneColor, toneBg }) => (
          <div key={label} className="bg-white rounded-2xl border border-black/5 shadow-sm p-3.5 sm:p-4 flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 sm:p-2.5 rounded-xl shrink-0" style={{ backgroundColor: toneBg }}>
              <span className="material-symbols-outlined text-[20px] sm:text-[22px]" style={{ color: toneColor }}>{icon}</span>
            </div>
            <div className="min-w-0">
              <p className="text-sm sm:text-base font-black text-[#1F2A22] truncate">{value}</p>
              <p className="text-[9px] sm:text-[10px] text-[#5B6660] font-bold uppercase tracking-wide truncate">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-5 mb-6">
        <p className="text-[11px] font-bold text-[#5B6660] uppercase tracking-widest mb-3">Filter</p>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-end">
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold text-[#5B6660] uppercase tracking-wide">Kategori</label>
            <select value={filterCat} onChange={e => setFilterCat(e.target.value)} className={SELECT_CLS}>
              <option value="all">Semua Kategori</option>
              {Object.entries(CAT).map(([k, c]) => <option key={k} value={k}>{c.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
            <label className="text-[11px] font-bold text-[#5B6660] uppercase tracking-wide">Status</label>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={SELECT_CLS}>
              <option value="all">Semua Status</option>
              {Object.entries(STATUS_CFG).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
            </select>
          </div>
          {(filterCat !== 'all' || filterStatus !== 'all') && (
            <button
              onClick={() => { setFilterCat('all'); setFilterStatus('all'); }}
              className="px-3 py-2 text-xs font-bold text-red-500 border border-red-200 rounded-xl hover:bg-red-50 transition-colors self-start sm:self-auto"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 animate-pulse">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200 overflow-hidden flex flex-col h-full">
              <div className="aspect-[4/3] bg-gray-200 w-full"></div>
              <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                </div>
                <div className="h-8 bg-gray-100 rounded-xl"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-3xl border border-black/5 shadow-sm p-8 sm:p-12 text-center">
          {filterCat === 'physical_book' ? (
            /* Khusus Filter Buku Fisik Kosong */
            <div className="max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-blue-50 text-blue-700 border border-blue-200">
                <span className="material-symbols-outlined text-[32px]">menu_book</span>
              </div>
              <h3 className="font-black text-lg text-[#1F2A22] mb-1.5">
                Belum Ada Produk Buku Fisik
              </h3>
              <p className="text-xs sm:text-sm text-[#5B6660] leading-relaxed mb-6">
                Anda belum menambahkan produk buku fisik untuk dijual. Jika buku Anda belum terbit atau belum dipasang di katalog <strong>UPRESS</strong>, silakan daftarkan buku Anda di UPRESS terlebih dahulu untuk mendapatkan tautan resmi halaman produk.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <a
                  href="https://upress.latihan.co.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                  <span>Pasang di Web UPRESS</span>
                </a>
                <button
                  type="button"
                  onClick={() => openAdd('book')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl hover:opacity-95 transition-all shadow-sm"
                  style={{ backgroundColor: BRAND_BROWN }}
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  <span>Tambah Buku Fisik</span>
                </button>
              </div>
            </div>
          ) : filterCat !== 'all' || filterStatus !== 'all' ? (
            /* Filter Tidak Ada Hasil */
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${BRAND_BROWN}15` }}>
                <span className="material-symbols-outlined text-[32px]" style={{ color: BRAND_BROWN }}>inventory</span>
              </div>
              <p className="font-bold text-[#1F2A22] mb-1">Tidak Ada Hasil</p>
              <p className="text-sm text-[#5B6660] mb-5">Coba ubah atau reset filter kategori & status di atas.</p>
              <button
                type="button"
                onClick={() => { setFilterCat('all'); setFilterStatus('all'); }}
                className="px-5 py-2.5 text-xs sm:text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            /* Belum Ada Produk Sama Sekali (0 Produk) */
            <div className="max-w-2xl mx-auto">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${BRAND_BROWN}15` }}>
                <span className="material-symbols-outlined text-[34px]" style={{ color: BRAND_BROWN }}>storefront</span>
              </div>
              <h3 className="font-black text-lg sm:text-xl text-[#1F2A22] mb-1.5">
                Belum Ada Produk yang Dipasang
              </h3>
              <p className="text-xs sm:text-sm text-[#5B6660] leading-relaxed max-w-lg mx-auto mb-6">
                Mulai pasang karya buku fisik maupun materi digital Anda untuk ditampilkan di etalase profil publik TenagaAhli.
              </p>

              {/* Banner Panduan Pasang di UPRESS untuk Buku Fisik */}
              <div className="mb-6 p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-blue-50/90 to-sky-50/60 border border-blue-200/80 text-left flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                    <span className="material-symbols-outlined text-[22px]">menu_book</span>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-blue-950">
                      Ingin Menjual Buku Fisik?
                    </h4>
                    <p className="text-[11px] sm:text-xs text-blue-900/90 leading-relaxed mt-0.5">
                      Pastikan buku Anda telah dipasang dan terdaftar di katalog <strong>UPRESS (University Press)</strong> terlebih dahulu agar Anda memiliki tautan resmi produk untuk dicantumkan saat menambah produk buku fisik.
                    </p>
                  </div>
                </div>
                <a
                  href="https://upress.latihan.co.id/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-all shadow-2xs shrink-0 self-stretch sm:self-auto"
                >
                  <span>Pasang di UPRESS</span>
                  <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                </a>
              </div>

              {/* Pilihan Tombol Tambah Produk */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => openAdd('book')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-[#8B4513] bg-white hover:bg-[#8B4513]/5 border-2 border-[#8B4513]/30 rounded-xl transition-all shadow-xs"
                >
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                  <span>Tambah Buku Fisik</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAdd('digital')}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl hover:opacity-95 transition-all shadow-sm"
                  style={{ backgroundColor: BRAND_BROWN }}
                >
                  <span className="material-symbols-outlined text-[18px]">cloud_download</span>
                  <span>Tambah Produk Digital</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filtered.map(p => (
            <ProductCard key={p.id} product={p} onEdit={openEdit} onDelete={onDelete} onToggleStatus={onToggle} />
          ))}
        </div>
      )}

      <ProductModal isOpen={modalOpen} onClose={() => setModalOpen(false)} product={editing} onSave={onSave} saving={saving} user={user} />
      <PhysicalBookModal
        isOpen={bookModalOpen}
        onClose={() => { setBookModalOpen(false); setEditing(null); }}
        product={editing}
        onSave={onSaveBook}
        saving={saving}
      />
    </DashboardLayout>
    );
}

// ── Premium Gate + Router ──────────────────────────────────────────────────────
// -- Export -------------------------------------------------------------------
export default function KelolaProduk() {
  const { t } = useTranslation();
  return <ProdukContent t={t} />;
}
