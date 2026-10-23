import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { usePageLoading } from '../context/LoadingContext.jsx';
import api from '../api/client.js';
import ProductReviews from '../components/ProductReviews.jsx';
import { getMediaUrl } from '../utils/media.js';

const CAT_LABEL = {
  book: 'Buku / E-Book',
  template: 'Template & Dokumen',
  course: 'Kursus Online',
  presentation: 'Presentasi PPT',
  article: 'Artikel & Riset',
  software: 'Software & Tools',
  cv: 'CV / Portofolio Resume',
  other: 'Produk Profesional',
};

export default function ProdukDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { reportReady } = usePageLoading();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');
  const [user, setUser] = useState(null);
  const [buying, setBuying] = useState(false);
  const [quantity, setQuantity] = useState(1);
  // Modal pemilihan metode pembayaran (muncul setelah klik "Beli Sekarang")
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [expertPhotoError, setExpertPhotoError] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    // Load user data
    api.get('/my/profile')
      .then((res) => setUser(res.data))
      .catch(() => setUser(null));

    // Load product data
    setLoading(true);
    api
      .get(`/products/${id}`)
      .then((res) => setProduct(res.data))
      .catch((err) => {
        console.error('Failed to load product:', err);
        setError('Produk tidak ditemukan atau belum dipublikasikan.');
      })
      .finally(() => {
        setLoading(false);
        reportReady();
      });
  }, [id, reportReady]);

  const handleBuyWithPoints = async (productId) => {
    if (!user) {
      navigate('/sign-in?redirect=' + encodeURIComponent(`/checkout/${productId}?qty=${quantity}`));
      return;
    }

    const unitPrice = (product.discount_price ?? product.price);
    const totalMoney = unitPrice * quantity;
    const pointsNeeded = Math.ceil(totalMoney / 1000);

    if (user.point_balance < pointsNeeded) {
      alert(`Point tidak cukup. Anda memiliki ${user.point_balance} Point, butuh ${pointsNeeded} Point.`);
      navigate('/top-up');
      return;
    }

    setBuying(true);
    try {
      const res = await api.post(`/products/${productId}/buy`, { quantity });
      alert('Produk berhasil dibeli! Anda dapat mengunduh materi dari profil Anda.');
      api.get('/my/profile').then((res) => setUser(res.data));
      navigate('/pesanan-saya');
    } catch (err) {
      alert(err.response?.data?.message ?? 'Gagal membeli produk. Coba lagi.');
    } finally {
      setBuying(false);
    }
  };

  const handleBuyWithMoney = (productId) => {
    if (!user) {
      navigate('/sign-in?redirect=' + encodeURIComponent(`/checkout/${productId}?qty=${quantity}`));
      return;
    }
    navigate(`/checkout/${productId}?qty=${quantity}`);
  };

  // Membuka modal pilih metode pembayaran untuk digital, atau langsung checkout untuk fisik (supaya ongkir dihitung)
  const openPaymentModal = () => {
    if (!user) {
      navigate('/sign-in?redirect=' + encodeURIComponent(`/checkout/${id}?qty=${quantity}`));
      return;
    }
    navigate(`/checkout/${product.id}?qty=${quantity}`);
  };

  const handleDownload = async () => {
    if (!product) return;
    if (product.download_url && !product.file_path) {
      window.open(product.download_url, '_blank');
      return;
    }
    try {
      const res = await api.get(`/products/${id}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${product.title.replace(/[^a-zA-Z0-9-_]/g, '_')}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (product.download_url) {
        window.open(product.download_url, '_blank');
      } else {
        alert('Gagal mengunduh berkas digital. Silakan coba beberapa saat lagi.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAFBF9] px-4 py-16">
        <div className="w-12 h-12 rounded-full border-4 border-[#008A62]/30 border-t-[#008A62] animate-spin mb-4" />
        <p className="text-sm font-semibold text-gray-500">Memuat detail produk...</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAFBF9] px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[36px]">error_outline</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Produk Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 max-w-md mb-6">{error || 'Produk yang Anda cari tidak tersedia.'}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008A62] text-white font-bold text-sm hover:bg-[#00704F] transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </button>
      </div>
    );
  }

  const discountPct   = product.discount_price
    ? Math.round((1 - product.discount_price / product.price) * 100) : 0;
  const catLabel      = CAT_LABEL[product.category] ?? 'Produk';
  const expert        = product.expert;
  const authorName    = product.author || expert?.name || 'Tenaga Ahli';
  const publisherName = product.publisher || expert?.institution || 'Penerbit Mandiri';
  const unitPrice     = (product.discount_price ?? product.price);
  const totalMoney    = unitPrice * quantity;
  const pointsNeeded  = Math.ceil(totalMoney / 1000);
  const hasStockLimit = product.stock !== null && product.stock !== undefined;
  const isOutOfStock  = hasStockLimit && product.stock <= 0;
  const maxStock      = hasStockLimit ? Math.max(0, product.stock) : 999;

  const rupiah = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  return (
    <div className="bg-[#FAFBF9] min-h-screen py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Breadcrumbs & Back ──────────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8 flex-wrap">
          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
            <Link to="/" className="hover:text-[#008A62] transition-colors">Beranda</Link>
            <span>/</span>
            {expert?.slug ? (
              <Link to={`/profil/${expert.slug}`} className="hover:text-[#008A62] transition-colors truncate max-w-[160px] sm:max-w-none">
                {expert.name}
              </Link>
            ) : (
              <Link to="/daftar-profil" className="hover:text-[#008A62] transition-colors">Tenaga Ahli</Link>
            )}
            <span>/</span>
            <span className="text-gray-900 font-bold truncate max-w-[200px] sm:max-w-xs">{product.title}</span>
          </div>

          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#008A62] bg-white border border-gray-200 hover:border-[#008A62]/30 px-3.5 py-1.5 rounded-xl shadow-sm transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </button>
        </div>

        {/* ── Main Detail Card ────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm overflow-hidden p-6 sm:p-10 mb-10">
          <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] lg:grid-cols-[400px_1fr] gap-8 lg:gap-12 items-start">

            {/* Cover Image */}
            <div className="relative bg-[#F8FAFC] rounded-2xl p-6 sm:p-8 flex items-center justify-center border border-gray-100 overflow-hidden">
              <div className="relative aspect-[3/4] w-full max-w-[300px] sm:max-w-[340px] rounded-2xl overflow-hidden shadow-xl border border-black/5 bg-white">
                {product.image_url || product.image ? (
                  <img
                    src={product.image_url || product.image}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-[#F5EBE1] text-[#8B4513]/40 gap-3">
                    <span className="material-symbols-outlined text-[72px]">menu_book</span>
                    <span className="text-sm font-bold text-gray-500">{catLabel}</span>
                  </div>
                )}

                {discountPct > 0 && (
                  <div className="absolute top-0 right-0 w-28 h-28 overflow-hidden pointer-events-none z-10">
                    <div className="absolute top-5 -right-8 w-32 bg-[#EF4444] text-white text-[10px] font-black py-1 text-center rotate-45 shadow-sm uppercase tracking-wider">
                      DISKON {discountPct}%
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Info Kanan */}
            <div className="flex flex-col">
              {/* Judul */}
              <h1 className="text-2xl sm:text-4xl font-extrabold text-[#0F172A] leading-tight mb-3 tracking-tight">
                {product.title}
              </h1>

              {/* Penulis & Rating */}
              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500 mb-2 flex-wrap">
                <span>Penulis <strong className="text-gray-900 font-bold">{authorName}</strong></span>
                <span className="text-gray-300">|</span>
                <span className="flex items-center gap-1 text-amber-500 font-semibold">
                  <span className="material-symbols-outlined text-[17px] text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  {product.rating > 0 ? Number(product.rating).toFixed(1) : '0.0'} ({product.reviews_count || 0} ulasan)
                </span>
              </div>

              {/* Penerbit */}
              <div className="flex items-center gap-2.5 text-xs sm:text-sm text-gray-600 mb-5 flex-wrap">
                <span className="material-symbols-outlined text-[18px] text-gray-400">account_balance</span>
                <span className="font-semibold text-gray-700">{publisherName}</span>
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#059669] border border-[#059669]/40 bg-[#E6F7F0] px-2 py-0.5 rounded uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[13px]">verified</span>
                  TERVERIFIKASI
                </span>
              </div>

              {/* Harga */}
              <div className="flex items-baseline gap-2.5 mb-3 flex-wrap">
                <span className="text-3xl sm:text-4xl font-black text-[#008A62]">
                  {rupiah(product.discount_price ?? product.price)}
                </span>
                {product.discount_price && (
                  <>
                    <span className="text-base sm:text-lg text-gray-400 line-through font-normal ml-2">
                      {rupiah(product.price)}
                    </span>
                    <span className="bg-red-50 text-red-600 font-bold text-xs sm:text-sm px-2.5 py-0.5 rounded-md border border-red-200 ml-1">
                      -{discountPct}%
                    </span>
                  </>
                )}
              </div>

              {/* Stok & Quantity Selector */}
              <div className="mb-6 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  {hasStockLimit ? (
                    product.stock > 0 ? (
                      <span className="inline-flex items-center gap-1.5 bg-[#E6F7F0] text-[#008A62] text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full">
                        <span className="material-symbols-outlined text-[16px]">check</span>
                        Tersedia ({product.stock} stok tersisa)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 text-xs sm:text-sm font-bold px-3.5 py-1.5 rounded-full border border-red-200">
                        <span className="material-symbols-outlined text-[16px]">block</span>
                        Stok Habis
                      </span>
                    )
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-[#E6F7F0] text-[#008A62] text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full">
                      <span className="material-symbols-outlined text-[16px]">check</span>
                      {product.is_digital ? 'Tersedia — Akses Digital Langsung' : 'Tersedia'}
                    </span>
                  )}
                </div>

                {!isOutOfStock && hasStockLimit && (
                  <div className="flex items-center gap-3 pt-1">
                    <span className="text-xs font-bold text-gray-700">Jumlah:</span>
                    <div className="inline-flex items-center border border-gray-200 rounded-xl overflow-hidden bg-white shadow-xs">
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                        disabled={quantity <= 1}
                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Kurangi jumlah"
                      >
                        <span className="material-symbols-outlined text-[18px]">remove</span>
                      </button>
                      <span className="w-12 text-center text-sm font-bold text-gray-900 select-none">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setQuantity((q) => Math.min(maxStock, q + 1))}
                        disabled={quantity >= maxStock}
                        className="w-9 h-9 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Tambah jumlah"
                      >
                        <span className="material-symbols-outlined text-[18px]">add</span>
                      </button>
                    </div>
                    {quantity >= maxStock && (
                      <span className="text-[11px] text-amber-600 font-semibold">
                        Maks. {maxStock} unit sesuai stok
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* CTA — Tombol Pembelian atau Akses Unduh Langsung jika sudah dibeli */}
              <div className="flex flex-col gap-3">
                {product.is_digital && product.has_purchased ? (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-3">
                    <div className="flex items-center gap-2 text-emerald-800 text-xs sm:text-sm font-bold">
                      <span className="material-symbols-outlined text-[20px] text-emerald-600">verified</span>
                      <span>Anda telah memiliki akses resmi ke produk digital ini</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownload}
                      className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#008A62] hover:bg-[#007352] text-white font-bold text-sm sm:text-base transition-all shadow-md active:scale-95 w-full cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[22px]">cloud_download</span>
                      Unduh / Buka Berkas Digital
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={openPaymentModal}
                    disabled={product.status !== 'active' || isOutOfStock || buying}
                    className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-[#008A62] hover:bg-[#007352] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base transition-all shadow-md active:scale-95 w-full"
                  >
                    {isOutOfStock ? (
                      <>
                        <span className="material-symbols-outlined text-[22px]">remove_shopping_cart</span>
                        Stok Habis
                      </>
                    ) : buying ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Memproses...
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
                        Beli Sekarang {quantity > 1 ? `(${quantity} item)` : ''} — {rupiah(totalMoney)}
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* Spesifikasi */}
              <div className="pt-6 border-t border-gray-100 mt-6">
                <h3 className="text-xs sm:text-sm font-bold text-[#8FA0B5] uppercase tracking-wider mb-4 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[18px]">tune</span>
                  Spesifikasi & Informasi Detail
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-6">
                  {product.isbn && (
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">sell</span>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium mb-0.5">ISBN</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{product.isbn}</p>
                      </div>
                    </div>
                  )}
                  {product.publication_year && (
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">calendar_month</span>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium mb-0.5">Tahun Terbit</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{product.publication_year}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">menu_book</span>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium mb-0.5">Kategori</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">{catLabel}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">language</span>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium mb-0.5">Bahasa</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">{product.language || 'Indonesia'}</p>
                    </div>
                  </div>
                  {product.pages && (
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">description</span>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium mb-0.5">Jumlah Halaman</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{product.pages}</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start gap-2.5">
                    <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">devices</span>
                    <div>
                      <p className="text-[11px] text-gray-400 font-medium mb-0.5">Format Produk</p>
                      <p className="text-xs sm:text-sm font-bold text-gray-900">
                        {product.is_digital ? `Digital (${product.file_format || 'Akses Unduh'})` : 'Buku Fisik (Hardcopy)'}
                      </p>
                    </div>
                  </div>
                  {!product.is_digital && product.cover_type && (
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">book_2</span>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium mb-0.5">Jenis Cover</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{product.cover_type}</p>
                      </div>
                    </div>
                  )}
                  {!product.is_digital && product.condition && (
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">verified</span>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium mb-0.5">Kondisi</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{product.condition}</p>
                      </div>
                    </div>
                  )}
                  {!product.is_digital && product.dimensions && (
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">straighten</span>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium mb-0.5">Dimensi</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{product.dimensions}</p>
                      </div>
                    </div>
                  )}
                  {!product.is_digital && (
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">store</span>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium mb-0.5">Dikirim Dari (Asal)</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">
                          {product.origin_city ? `${product.origin_city}, ${product.origin_province || ''}` : 'Kota Bandung, Jawa Barat'}
                        </p>
                      </div>
                    </div>
                  )}
                  {!product.is_digital && product.weight > 0 && (
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[18px] text-gray-400 shrink-0 mt-0.5">scale</span>
                      <div>
                        <p className="text-[11px] text-gray-400 font-medium mb-0.5">Berat Paket</p>
                        <p className="text-xs sm:text-sm font-bold text-gray-900">{product.weight} gram</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Deskripsi */}
              {product.description && (
                <div className="pt-6 border-t border-gray-100 mt-6">
                  <h3 className="text-xs sm:text-sm font-bold text-[#8FA0B5] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">notes</span>
                    Deskripsi
                  </h3>
                  <div className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line bg-[#FAFBF9] rounded-2xl p-4 sm:p-5 border border-gray-100">
                    {product.description}
                  </div>
                </div>
              )}

              {/* Ketentuan Penggunaan & Lisensi */}
              {product.terms_of_use && (
                <div className="pt-6 border-t border-gray-100 mt-6">
                  <h3 className="text-xs sm:text-sm font-bold text-[#8FA0B5] uppercase tracking-wider mb-3 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[18px]">verified_user</span>
                    Ketentuan Penggunaan & Lisensi
                  </h3>
                  <div className="text-xs sm:text-sm text-emerald-950 leading-relaxed whitespace-pre-line bg-emerald-50/60 rounded-2xl p-4 sm:p-5 border border-emerald-200/80">
                    {product.terms_of_use}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Card Tenaga Ahli ────────────────────────────────────── */}
        {expert && (
          <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                {expertPhotoError || (!expert.photo && !expert.photo_url) ? (
                  <div className="w-full h-full bg-gradient-to-br from-[#008A62] to-[#005B41] text-white flex items-center justify-center font-bold text-base sm:text-lg select-none">
                    {(() => {
                      const name = expert.name || '';
                      const parts = name.replace(/^(dr\.|ir\.|prof\.|drs\.|apt\.)\s*/i, '').trim().split(/\s+/);
                      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
                      return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
                    })()}
                  </div>
                ) : (
                  <img
                    src={getMediaUrl(expert.photo || expert.photo_url)}
                    alt={expert.name}
                    onError={() => setExpertPhotoError(true)}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-[#008A62] uppercase tracking-wider mb-1">
                  {expert.kriteria || 'Tenaga Ahli'}
                </p>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-0.5">{expert.name}</h3>
                <p className="text-xs text-gray-500">{expert.institution || expert.field || 'Konsultan Profesional'}</p>
              </div>
            </div>

            <Link
              to={`/profil/${expert.slug}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008A62] hover:bg-[#00704F] text-white font-bold text-xs sm:text-sm transition-all shadow-sm shrink-0"
            >
              Lihat Profil Lengkap
              <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
            </Link>
          </div>
        )}

        {/* ── Product Reviews ────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-200/90 shadow-sm p-6 sm:p-8">
          <ProductReviews
            productId={product.id}
            onReviewAdded={(updated) => {
              setProduct((prev) => ({
                ...prev,
                rating: updated.rating,
                reviews_count: updated.reviews_count,
              }));
            }}
          />
        </div>

      </div>

      {/* ── Modal Pilih Metode Pembayaran ───────────────────────── */}
      {showPaymentModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/40 backdrop-blur-sm"
          onClick={() => setShowPaymentModal(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-xl w-full max-w-md p-6 sm:p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Pilih Metode Pembayaran</h3>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Tutup"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {/* Opsi bayar dengan Point */}
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  handleBuyWithPoints(product.id);
                }}
                disabled={!user || user.point_balance < pointsNeeded || buying}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-[#008A62] hover:bg-[#007352] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-sm sm:text-base transition-all shadow-sm active:scale-95 w-full"
              >
                <span className="material-symbols-outlined text-[22px]">shopping_cart</span>
                Bayar dengan {pointsNeeded} Point
              </button>
              {user && user.point_balance < pointsNeeded && (
                <p className="text-xs text-red-600 font-semibold -mt-1">
                  Point tidak cukup. Butuh {pointsNeeded} Point, Anda punya {user.point_balance} Point.
                </p>
              )}

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-gray-200" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">atau</span>
                <div className="h-px flex-1 bg-gray-200" />
              </div>

              {/* Opsi bayar dengan Uang */}
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  handleBuyWithMoney(product.id);
                }}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-white border-2 border-[#008A62] text-[#008A62] hover:bg-[#E6F7F0] font-bold text-sm sm:text-base transition-all shadow-sm active:scale-95 w-full"
              >
                <span className="material-symbols-outlined text-[22px]">payments</span>
                Bayar dengan Uang — {rupiah(totalMoney)}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}