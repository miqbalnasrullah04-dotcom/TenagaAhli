import { useState, useEffect, useRef } from 'react';

// ── Ketentuan Foto Buku ───────────────────────────────────────────────────────
// Mengikuti katalog UPRESS (https://upress.latihan.co.id/): kartu buku di katalog
// memakai container `aspect-[4/5]` + `object-cover`, dengan gambar acuan 500x625 px.
// Nilai ini HARUS sama dengan konstanta BOOK_COVER_* di ProductController (backend).
export const BOOK_CATEGORY = 'physical_book';
export const BOOK_COVER = {
  ratioW: 4,
  ratioH: 5,
  tolerance: 0.02,          // toleransi selisih rasio 2%
  minWidth: 500,
  minHeight: 625,
  maxBytes: 5 * 1024 * 1024, // 5 MB
  mimeTypes: ['image/jpeg', 'image/png'],
  extensions: ['jpg', 'jpeg', 'png'],
};
const RATIO_LABEL = `${BOOK_COVER.ratioW}:${BOOK_COVER.ratioH}`;
const UPRESS_HOST = 'upress.latihan.co.id';

const INPUT_CLS = 'w-full bg-[#F5F4EF] border border-black/10 rounded-xl px-4 py-2.5 text-sm text-[#1F2A22] placeholder:text-[#5B6660]/50 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-colors';
const LABEL_CLS = 'block text-[11px] font-bold text-gray-700 uppercase tracking-wide mb-1';

const rupiah = (v) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

/** Baca dimensi asli gambar dari file lokal. */
const readImageSize = (url) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
    img.onerror = () => reject(new Error('unreadable'));
    img.src = url;
  });

/** Validasi file foto buku. Mengembalikan pesan error (string) atau null jika valid. */
export function validateBookCover(file, { width, height }) {
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (!BOOK_COVER.mimeTypes.includes(file.type) || !BOOK_COVER.extensions.includes(ext)) {
    return 'Format foto tidak didukung. Gunakan file JPG, JPEG, atau PNG.';
  }
  if (file.size > BOOK_COVER.maxBytes) {
    return `Ukuran file ${(file.size / 1048576).toFixed(1)} MB melebihi batas maksimal 5 MB.`;
  }
  const target = BOOK_COVER.ratioW / BOOK_COVER.ratioH;
  const ratio = width / height;
  if (Math.abs(ratio - target) / target > BOOK_COVER.tolerance) {
    return `Rasio foto tidak sesuai. Foto Anda ${width}×${height} px (rasio ${ratio.toFixed(2)}), sedangkan katalog UPRESS memakai rasio ${RATIO_LABEL} potret (${target.toFixed(2)}). Potong foto menjadi ${RATIO_LABEL}, misalnya ${BOOK_COVER.minWidth}×${BOOK_COVER.minHeight} px atau 1000×1250 px, agar tidak terpotong atau gepeng.`;
  }
  if (width < BOOK_COVER.minWidth || height < BOOK_COVER.minHeight) {
    return `Resolusi foto terlalu kecil (${width}×${height} px). Minimal ${BOOK_COVER.minWidth}×${BOOK_COVER.minHeight} px agar tetap tajam di katalog.`;
  }
  return null;
}

const isUpressUrl = (value) => {
  try {
    const u = new URL(value);
    return ['http:', 'https:'].includes(u.protocol) && u.hostname.toLowerCase() === UPRESS_HOST;
  } catch {
    return false;
  }
};

const EMPTY = {
  title: '',
  description: '',
  author: '',
  publisher: '',
  isbn: '',
  price: '',
  upress_url: '',
};

// ── Modal Tambah / Edit Produk Buku Fisik ────────────────────────────────────
export default function PhysicalBookModal({ isOpen, onClose, product, onSave, saving }) {
  const [form, setForm]           = useState(EMPTY);
  const [errors, setErrors]       = useState({});
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview]     = useState(null); // { url, width, height, invalid }
  const [checking, setChecking]   = useState(false);
  const blobRef  = useRef(null);
  const inputRef = useRef(null);

  const revokeBlob = () => {
    if (blobRef.current) URL.revokeObjectURL(blobRef.current);
    blobRef.current = null;
  };

  useEffect(() => {
    if (!isOpen) return;
    revokeBlob();
    setErrors({});
    setImageFile(null);
    setForm(product ? {
      title: product.title || '',
      description: product.description || '',
      author: product.author || '',
      publisher: product.publisher || '',
      isbn: product.isbn || '',
      price: product.price ?? '',
      upress_url: product.upress_url || '',
    } : EMPTY);
    const existing = product?.image_url || null;
    setPreview(existing ? { url: existing, invalid: false } : null);
  }, [product, isOpen]);

  useEffect(() => revokeBlob, []);

  const setField = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // izinkan memilih file yang sama lagi
    if (!file) return;

    revokeBlob();
    const url = URL.createObjectURL(file);
    blobRef.current = url;
    setChecking(true);

    try {
      const size = await readImageSize(url);
      const error = validateBookCover(file, size);
      setPreview({ url, ...size, invalid: !!error, name: file.name });
      setImageFile(error ? null : file);
      setErrors((er) => ({ ...er, image: error || undefined }));
    } catch {
      setPreview(null);
      setImageFile(null);
      setErrors((er) => ({ ...er, image: 'File tidak dapat dibaca sebagai gambar. Gunakan file JPG, JPEG, atau PNG.' }));
    } finally {
      setChecking(false);
    }
  };

  const clearImage = () => {
    revokeBlob();
    setImageFile(null);
    setPreview(product?.image_url ? { url: product.image_url, invalid: false } : null);
    setErrors((er) => ({ ...er, image: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.title.trim()) er.title = 'Nama Buku wajib diisi.';
    if (form.price === '' || form.price === null) er.price = 'Harga Buku wajib diisi.';
    else if (!/^\d+$/.test(String(form.price))) er.price = 'Harga Buku harus berupa angka bulat (Rupiah) tanpa titik/koma.';
    if (form.isbn && !/^[0-9Xx\-\s]+$/.test(form.isbn)) er.isbn = 'ISBN hanya boleh berisi angka, huruf X, tanda hubung, atau spasi.';
    if (form.upress_url && !isUpressUrl(form.upress_url.trim())) {
      er.upress_url = `Link harus mengarah ke halaman buku di https://${UPRESS_HOST}/`;
    }
    if (preview?.invalid) er.image = errors.image || `Rasio foto harus ${RATIO_LABEL}.`;
    else if (!imageFile && !product?.image_url) er.image = 'Foto Buku wajib diunggah.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (checking || !validate()) return;
    onSave({
      id: product?.id,
      form: { ...form, title: form.title.trim(), upress_url: form.upress_url.trim() },
      imageFile,
    });
  };

  if (!isOpen) return null;

  const FieldError = ({ name }) =>
    errors[name] ? (
      <p className="mt-1 text-[11px] font-semibold text-red-600 flex items-start gap-1">
        <span className="material-symbols-outlined text-[14px] mt-px">error</span>
        <span>{errors[name]}</span>
      </p>
    ) : null;

  const errCls = (name) => (errors[name] ? ' !border-red-400 focus:!ring-red-200' : '');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full my-4 shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        <form id="physical-book-form" onSubmit={handleSubmit} noValidate className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#FAFBF9]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center shadow-xs">
                <span className="material-symbols-outlined text-[20px]">menu_book</span>
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                  {product ? 'Edit Produk Buku Fisik' : 'Tambah Produk Buku Fisik'}
                </p>
                <p className="text-[11px] text-gray-500">Buku cetak (hardcopy) yang dikirim ke pembeli</p>
              </div>
            </div>
            <button
              id="physical-book-close"
              type="button"
              onClick={onClose}
              disabled={saving}
              className="p-1.5 hover:bg-gray-200/60 rounded-xl transition-colors text-gray-400 hover:text-gray-700"
            >
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 overflow-y-auto flex-1 text-xs sm:text-sm">
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6">
              {/* ── Foto Buku ─────────────────────────────── */}
              <div>
                <label className={LABEL_CLS}>
                  Foto Buku <span className="text-red-500">*</span>
                </label>

                <div
                  className={`relative w-full aspect-[4/5] rounded-2xl overflow-hidden border-2 transition-colors ${
                    preview?.invalid
                      ? 'border-red-400 bg-red-50'
                      : preview
                      ? 'border-emerald-300 bg-slate-100'
                      : errors.image
                      ? 'border-dashed border-red-300 bg-red-50/40'
                      : 'border-dashed border-gray-300 bg-[#FAFBF9] hover:border-[#8B4513]/50'
                  }`}
                >
                  {preview ? (
                    <>
                      <img
                        src={preview.url}
                        alt="Preview foto buku"
                        className={`w-full h-full ${preview.invalid ? 'object-contain' : 'object-cover'}`}
                      />
                      <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow ${preview.invalid ? 'bg-red-600' : 'bg-emerald-600'}`}>
                        {preview.invalid ? 'Rasio tidak sesuai' : preview.width ? `${preview.width}×${preview.height} px` : 'Foto tersimpan'}
                      </span>
                      <button
                        id="physical-book-clear-image"
                        type="button"
                        onClick={clearImage}
                        className="absolute top-2 right-2 bg-white/90 hover:bg-white text-gray-700 p-1 rounded-full shadow transition-colors"
                        title="Batalkan foto"
                      >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => inputRef.current?.click()}
                      className="w-full h-full flex flex-col items-center justify-center gap-1.5 p-4 text-center"
                    >
                      <span className="material-symbols-outlined text-[34px] text-gray-400">add_photo_alternate</span>
                      <span className="text-[11px] font-semibold text-gray-600">Klik untuk memilih foto sampul</span>
                      <span className="text-[10px] text-gray-400">Rasio {RATIO_LABEL} (potret)</span>
                    </button>
                  )}
                  {checking && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <span className="w-6 h-6 rounded-full border-2 border-gray-300 border-t-[#8B4513] animate-spin" />
                    </div>
                  )}
                </div>

                <input
                  id="physical-book-image"
                  ref={inputRef}
                  type="file"
                  accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                  className="hidden"
                  onChange={handleFile}
                />
                <button
                  id="physical-book-pick-image"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-[#8B4513] bg-[#8B4513]/5 hover:bg-[#8B4513]/10 border border-[#8B4513]/20 rounded-xl transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">upload</span>
                  {preview ? 'Ganti Foto' : 'Unggah dari Perangkat'}
                </button>

                <FieldError name="image" />

                <ul className="mt-2.5 p-2.5 rounded-xl bg-blue-50/70 border border-blue-100 text-[10.5px] text-blue-900 space-y-0.5 leading-snug">
                  <li>• Rasio <strong>{RATIO_LABEL}</strong> potret, sesuai katalog UPRESS</li>
                  <li>• Minimal <strong>{BOOK_COVER.minWidth}×{BOOK_COVER.minHeight} px</strong> (disarankan 1000×1250 px)</li>
                  <li>• Format JPG, JPEG, atau PNG, maks. 5 MB</li>
                </ul>
              </div>

              {/* ── Data Buku ─────────────────────────────── */}
              <div className="flex flex-col gap-4">
                <div>
                  <label htmlFor="physical-book-title" className={LABEL_CLS}>
                    Nama Buku <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="physical-book-title"
                    type="text"
                    required
                    maxLength={255}
                    value={form.title}
                    onChange={setField('title')}
                    className={INPUT_CLS + errCls('title')}
                    placeholder="Contoh: Sistem Dinamik untuk Pembangunan Berkelanjutan"
                  />
                  <FieldError name="title" />
                </div>

                <div>
                  <label htmlFor="physical-book-category" className={LABEL_CLS}>Kategori Produk</label>
                  <div className="relative">
                    <input
                      id="physical-book-category"
                      type="text"
                      value="Buku Fisik"
                      readOnly
                      disabled
                      className={INPUT_CLS + ' !bg-gray-100 text-gray-600 font-semibold cursor-not-allowed pr-10'}
                    />
                    <span className="material-symbols-outlined absolute right-3 top-2.5 text-[18px] text-gray-400">lock</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="physical-book-author" className={LABEL_CLS}>Nama Penulis</label>
                    <input
                      id="physical-book-author"
                      type="text"
                      maxLength={255}
                      value={form.author}
                      onChange={setField('author')}
                      className={INPUT_CLS}
                      placeholder="Nama penulis"
                    />
                  </div>
                  <div>
                    <label htmlFor="physical-book-publisher" className={LABEL_CLS}>Penerbit</label>
                    <input
                      id="physical-book-publisher"
                      type="text"
                      maxLength={255}
                      value={form.publisher}
                      onChange={setField('publisher')}
                      className={INPUT_CLS}
                      placeholder="Nama penerbit"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="physical-book-isbn" className={LABEL_CLS}>ISBN</label>
                    <input
                      id="physical-book-isbn"
                      type="text"
                      maxLength={20}
                      value={form.isbn}
                      onChange={setField('isbn')}
                      className={INPUT_CLS + errCls('isbn')}
                      placeholder="978-602-xxxx-xx-x"
                    />
                    <FieldError name="isbn" />
                  </div>
                  <div>
                    <label htmlFor="physical-book-price" className={LABEL_CLS}>
                      Harga Buku (Rp) <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-2.5 text-xs font-bold text-gray-500">Rp</span>
                      <input
                        id="physical-book-price"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        step="1"
                        value={form.price}
                        onChange={setField('price')}
                        className={INPUT_CLS + ' pl-10 font-bold' + errCls('price')}
                        placeholder="85000"
                      />
                    </div>
                    {form.price !== '' && /^\d+$/.test(String(form.price)) && !errors.price && (
                      <p className="text-[10px] text-emerald-700 font-semibold mt-1">{rupiah(Number(form.price))}</p>
                    )}
                    <FieldError name="price" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="physical-book-upress-url" className={LABEL_CLS}>Link Produk UPRESS</label>
                    <a
                      href="https://upress.latihan.co.id/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] font-semibold text-blue-700 hover:text-blue-900 flex items-center gap-1"
                    >
                      <span>Cari di UPRESS</span>
                      <span className="material-symbols-outlined text-[13px]">open_in_new</span>
                    </a>
                  </div>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-2.5 top-2.5 text-[18px] text-gray-400">link</span>
                    <input
                      id="physical-book-upress-url"
                      type="url"
                      value={form.upress_url}
                      onChange={setField('upress_url')}
                      className={INPUT_CLS + ' pl-9 text-xs' + errCls('upress_url')}
                      placeholder={`https://${UPRESS_HOST}/products/...`}
                    />
                  </div>
                  <p className="mt-1 text-[10.5px] text-gray-500">
                    Masukkan URL halaman buku di UPRESS (misal: <code>https://upress.latihan.co.id/products/123</code>).
                  </p>
                  <FieldError name="upress_url" />
                </div>

                <div>
                  <label htmlFor="physical-book-description" className={LABEL_CLS}>Deskripsi Buku</label>
                  <textarea
                    id="physical-book-description"
                    rows={5}
                    value={form.description}
                    onChange={setField('description')}
                    className={INPUT_CLS + ' resize-y min-h-[110px]'}
                    placeholder="Tuliskan deskripsi atau sinopsis buku..."
                  />
                </div>
              </div>
            </div>

            {/* Petunjuk & Link ke Web UPRESS jika belum pasang produk buku (Di paling bawah) */}
            <div className="mt-5 p-3.5 bg-blue-50/90 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
                  <span className="material-symbols-outlined text-[18px]">menu_book</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-blue-950">Belum memasang buku di katalog UPRESS?</p>
                  <p className="text-[11px] text-blue-800 leading-snug mt-0.5">
                    Sebelum menambahkan Buku Fisik di sini, pastikan buku Anda telah dipasang dan terbit di website UPRESS untuk mendapatkan link resmi produk.
                  </p>
                </div>
              </div>
              <a
                href="https://upress.latihan.co.id/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-700 hover:bg-blue-800 rounded-xl transition-colors shadow-2xs shrink-0 self-start sm:self-center"
              >
                <span>Buka Web UPRESS</span>
                <span className="material-symbols-outlined text-[14px]">open_in_new</span>
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 px-6 py-4 border-t border-gray-100 bg-[#FAFBF9]">
            <button
              id="physical-book-cancel"
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-white transition-colors disabled:opacity-50"
            >
              Batal
            </button>
            <button
              id="physical-book-submit"
              type="submit"
              disabled={saving || checking}
              className="flex-1 px-4 py-2.5 text-sm font-bold text-white rounded-xl transition-all hover:opacity-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm bg-[#8B4513]"
            >
              {saving && <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {saving ? 'Menyimpan...' : product ? 'Simpan Perubahan' : 'Simpan Buku Fisik'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
