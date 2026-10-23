import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import ConfirmDialog from '../components/admin/ConfirmDialog.jsx';
import { SkeletonBerita } from '../components/Skeleton.jsx';
import { OFFICIAL_BANK_ACCOUNTS, PT_COMPANY_NAME } from '../constants/bankAccounts.js';

const CATEGORIES = [
  'SEMUA',
  'BERITA',
  'INFORMASI PROYEK',
];

const CATEGORY_OPTIONS = [
  { value: 'BERITA', label: 'Berita' },
  { value: 'INFORMASI PROYEK', label: 'Informasi Proyek' },
];

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=300';

function loadMidtransSnap() {
  return new Promise((resolve) => {
    if (window.snap) {
      resolve(window.snap);
      return;
    }
    const isProd =
      import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true' ||
      import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === '1';
    const clientKey = import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'Mid-client-kw4OzjqRXjs0P9zQ';
    const script = document.createElement('script');
    script.src = isProd
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';
    script.setAttribute('data-client-key', clientKey);
    script.onload = () => resolve(window.snap);
    document.body.appendChild(script);
  });
}

export default function KelolaBerita() {
  const { t } = useTranslation();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('SEMUA');
  const [user, setUser] = useState(null);

  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [payingId, setPayingId] = useState(null);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState(null);

  // Delete State
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Form Fields
  const [form, setForm] = useState({
    title: '',
    category: 'BERITA',
    author_name: '',
    source: '',
    excerpt: '',
    content: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Payment Choice & Manual Transfer Modal State
  const [payModalArticle, setPayModalArticle] = useState(null);
  const [payModalMethod, setPayModalMethod] = useState('manual'); // 'manual' | 'midtrans'
  const [selectedBankId, setSelectedBankId] = useState('bca');
  const [articleProofFile, setArticleProofFile] = useState(null);
  const [articleProofPreview, setArticleProofPreview] = useState(null);
  const [uploadingArticleProof, setUploadingArticleProof] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const proofFileInputRef = useRef(null);

  const copyToClipboard = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const selectedBank = OFFICIAL_BANK_ACCOUNTS.find((b) => b.id === selectedBankId) || OFFICIAL_BANK_ACCOUNTS[0];

  const openPayModal = (art) => {
    setPayModalArticle(art);
    setArticleProofFile(null);
    setArticleProofPreview(null);
    setPayModalMethod('manual');
    setSelectedBankId('bca');
  };

  const closePayModal = () => {
    setPayModalArticle(null);
    setArticleProofFile(null);
    setArticleProofPreview(null);
  };

  const handleArticleProofChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToastMsg('Ukuran file bukti transfer maksimal 5MB.', 'error');
      return;
    }
    setArticleProofFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setArticleProofPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setArticleProofPreview(null);
    }
  };

  const handleUploadArticleProof = async () => {
    if (!payModalArticle?.id) return;
    if (!articleProofFile) {
      showToastMsg('Silakan pilih file bukti transfer terlebih dahulu.', 'error');
      return;
    }

    setUploadingArticleProof(true);
    const formData = new FormData();
    formData.append('proof', articleProofFile);

    try {
      await api.post(`/my/articles/${payModalArticle.id}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToastMsg('Bukti transfer berhasil diunggah! Menunggu verifikasi admin.');
      closePayModal();
      fetchMyArticles();
    } catch (err) {
      console.error('Error uploading article proof:', err);
      showToastMsg(err.response?.data?.message || 'Gagal mengunggah bukti transfer.', 'error');
    } finally {
      setUploadingArticleProof(false);
    }
  };

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || 'https://tenagaahli.com';

  const showToastMsg = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const savedUser = localStorage.getItem('amdal_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        setForm((prev) => ({ ...prev, author_name: u.name || '' }));
      } catch (e) {
        console.error(e);
      }
    }
    loadMidtransSnap();
    fetchMyArticles();
  }, []);

  const fetchMyArticles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/articles');
      const items = Array.isArray(res.data?.data) ? res.data.data
                  : Array.isArray(res.data)        ? res.data
                  : [];
      setArticles(items);
    } catch (err) {
      console.error('Gagal mengambil daftar berita:', err);
      showToastMsg('Gagal memuat daftar berita Anda.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingArticle(null);
    setForm({
      title: '',
      category: 'BERITA',
      author_name: user?.name || '',
      source: '',
      excerpt: '',
      content: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setFormError('');
    setShowModal(true);
  };

  const handleOpenEdit = (art) => {
    setEditingArticle(art);
    const catUpper = (art.category || '').toUpperCase();
    const finalCat = catUpper.includes('PROYEK') ? 'INFORMASI PROYEK' : 'BERITA';

    setForm({
      title: art.title || '',
      category: finalCat,
      author_name: art.author_name || user?.name || '',
      source: art.source || '',
      excerpt: art.excerpt || '',
      content: art.content || '',
    });
    setImageFile(null);
    setImagePreview(art.thumbnail || null);
    setFormError('');
    setShowModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setFormError('Ukuran foto thumbnail maksimal 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
      setFormError('');
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const payWithSnap = async (snapToken, articleId, refCode) => {
    await loadMidtransSnap();
    if (!window.snap) {
      alert('Gagal memuat sistem pembayaran Midtrans Snap. Periksa koneksi internet Anda.');
      return;
    }

    window.snap.pay(snapToken, {
      onSuccess: async function (result) {
        console.log('Payment success:', result);
        try {
          if (refCode) {
            await api.get(`/payment/check-status/${refCode}`);
          }
        } catch (e) {
          console.error('Sync error:', e);
        }
        showToastMsg('Pembayaran berhasil! Berita Anda aktif tayang selama 7 hari.', 'success');
        setShowModal(false);
        fetchMyArticles();
      },
      onPending: async function (result) {
        console.log('Payment pending:', result);
        try {
          if (refCode) {
            await api.get(`/payment/check-status/${refCode}`);
          }
        } catch (e) {
          console.error('Sync error:', e);
        }
        showToastMsg('Menunggu penyelesaian pembayaran. Status akan aktif setelah pembayaran diterima.', 'info');
        setShowModal(false);
        fetchMyArticles();
      },
      onError: function (result) {
        console.error('Payment error:', result);
        showToastMsg('Pembayaran gagal atau dibatalkan.', 'error');
      },
      onClose: function () {
        console.log('User closed popup without finishing payment');
        showToastMsg('Popup pembayaran ditutup. Anda dapat membayar kapan saja dari daftar berita Anda.', 'info');
        setShowModal(false);
        fetchMyArticles();
      },
    });
  };

  const handlePayArticle = async (art) => {
    setPayingId(art.id);
    try {
      let token = art.snap_token;
      let refCode = art.reference_code;
      if (!token) {
        const res = await api.post(`/my/articles/${art.id}/snap-token`);
        token = res.data?.snap_token;
        refCode = res.data?.reference_code || refCode;
      }

      if (token) {
        payWithSnap(token, art.id, refCode);
      } else {
        showToastMsg('Gagal mendapatkan token pembayaran Midtrans.', 'error');
      }
    } catch (err) {
      console.error(err);
      showToastMsg(err.response?.data?.message || 'Gagal memulai pembayaran.', 'error');
    } finally {
      setPayingId(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setFormError('Judul berita / informasi proyek wajib diisi.');
      return;
    }
    if (!form.content.trim()) {
      setFormError('Isi konten berita wajib diisi.');
      return;
    }

    setSubmitting(true);
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      formData.append('category', form.category);
      formData.append('author_name', form.author_name.trim());
      formData.append('source', (form.source || '').trim());
      formData.append('excerpt', form.excerpt.trim());
      formData.append('content', form.content.trim());

      if (imageFile) {
        formData.append('image', imageFile);
        formData.append('thumbnail', imageFile);
      }

      let res;
      if (editingArticle) {
        formData.append('_method', 'PUT');
        res = await api.post(`/my/articles/${editingArticle.id}`, formData);
        showToastMsg('Berita berhasil diperbarui.');
        setShowModal(false);
        fetchMyArticles();
      } else {
        res = await api.post('/my/articles', formData);
        const createdData = res.data?.data;
        const isAdmin = user?.role === 'admin';

        if (isAdmin) {
          showToastMsg('Berita berhasil diterbitkan!');
          setShowModal(false);
          fetchMyArticles();
        } else {
          showToastMsg('Berita berhasil disimpan! Silakan selesaikan pembayaran.');
          setShowModal(false);
          fetchMyArticles();
          if (createdData) {
            openPayModal(createdData);
          }
        }
      }
    } catch (err) {
      console.error('Error saving article:', err);
      const msg = err.response?.data?.message || 'Terjadi kesalahan saat menyimpan berita.';
      setFormError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/my/articles/${deleteTarget.id}`);
      showToastMsg('Berita berhasil dihapus.');
      setDeleteTarget(null);
      fetchMyArticles();
    } catch (err) {
      console.error('Error deleting article:', err);
      showToastMsg('Gagal menghapus berita.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const getThumbnailSrc = (item) => {
    if (!item) return DEFAULT_IMAGE;
    if (item.thumbnail_url) return item.thumbnail_url;
    if (item.thumbnail) {
      if (item.thumbnail.startsWith('http://') || item.thumbnail.startsWith('https://') || item.thumbnail.startsWith('data:')) {
        return item.thumbnail;
      }
      return `${BACKEND_URL}/storage/${item.thumbnail}`;
    }
    return DEFAULT_IMAGE;
  };

  const getCategoryBadgeClass = (cat) => {
    const c = (cat || '').toUpperCase();
    if (c.includes('PROYEK')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-amber-50 text-[#8B4513] border-[#8B4513]/20';
  };

  const renderStatusBadge = (item) => {
    const status = item.status;
    const isPaid = item.payment_status === 'verified';

    if ((status === 'published' || status === 'aktif') && isPaid) {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Tayang (Aktif)
          </span>
          {item.expires_at ? (
            <span className="text-[10px] text-gray-500 font-medium pl-1">
              Hingga {String(item.expires_at).slice(0, 10)}
            </span>
          ) : (
            <span className="text-[10px] text-emerald-700 font-semibold pl-1">
              Permanen (Admin)
            </span>
          )}
        </div>
      );
    }

    if (status === 'ditolak') {
      return (
        <div className="flex flex-col gap-0.5">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            Ditolak
          </span>
          {item.rejection_reason && (
            <span className="text-[10px] text-rose-600 font-medium pl-1 line-clamp-1" title={item.rejection_reason}>
              {item.rejection_reason}
            </span>
          )}
        </div>
      );
    }

    if (item.payment_status === 'menunggu_verifikasi' || item.status === 'menunggu_verifikasi') {
      return (
        <div className="flex flex-col gap-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-50 text-blue-800 border border-blue-200 shadow-2xs">
            <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
            Verifikasi Admin
          </span>
          <button
            type="button"
            onClick={() => openPayModal(item)}
            className="px-2 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-900 text-[10px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[12px]">upload_file</span>
            <span>Unggah Ulang Bukti</span>
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
          Menunggu Pembayaran
        </span>
        <button
          type="button"
          onClick={() => openPayModal(item)}
          className="px-2.5 py-1 bg-[#8B4513] hover:bg-[#6B3410] text-white text-[10px] font-bold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[13px]">payments</span>
          <span>Bayar (Rp 10k)</span>
        </button>
      </div>
    );
  };

  const filteredArticles = articles.filter((a) => {
    if (!a) return false;
    const matchKw =
      (a.title || '').toLowerCase().includes(keyword.toLowerCase()) ||
      (a.category || '').toLowerCase().includes(keyword.toLowerCase()) ||
      (a.excerpt || '').toLowerCase().includes(keyword.toLowerCase());

    const catUpper = (a.category || '').toUpperCase();
    const isProyek = catUpper.includes('PROYEK');

    let matchCat = true;
    if (selectedCategory === 'BERITA') {
      matchCat = !isProyek;
    } else if (selectedCategory === 'INFORMASI PROYEK') {
      matchCat = isProyek;
    }

    return matchKw && matchCat;
  });

  const countProyek = articles.filter((a) => a.category?.toUpperCase().includes('PROYEK')).length;
  const countBerita = articles.filter((a) => !a.category?.toUpperCase().includes('PROYEK')).length;

  if (loading && articles.length === 0) {
    return (
      <DashboardLayout
        title="Kelola Berita & Informasi Proyek"
        subtitle="Publikasikan berita dan proyek Anda dengan tarif Rp 10.000 / minggu via Transfer Bank Manual atau Midtrans Gateway."
      >
        <SkeletonBerita />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Kelola Berita & Informasi Proyek"
      subtitle="Publikasikan berita dan proyek Anda dengan tarif Rp 10.000 / minggu via Transfer Bank Manual atau Midtrans Gateway."
      headerRight={
        <button
          type="button"
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-1.5 bg-[#8B4513] text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold hover:bg-[#6B3410] transition-colors shadow-sm cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Pasang Berita (Rp 10k)</span>
        </button>
      }
    >
      <div className="space-y-6">
        {/* ── Toast Notification ── */}
        {toast && (
          <div
            className={`fixed top-5 right-5 z-[999] flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl text-sm font-semibold transition-all duration-300 ${
              toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
            }`}
          >
            <span className="material-symbols-outlined text-[20px]">
              {toast.type === 'error' ? 'error' : 'check_circle'}
            </span>
            <span>{toast.msg}</span>
          </div>
        )}

        {/* ── Banner Info Tarif / Admin Privileges ── */}
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-300/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#8B4513] text-amber-300 flex items-center justify-center shrink-0 shadow-sm">
              <span className="material-symbols-outlined text-[24px]">
                {user?.role === 'admin' ? 'verified_user' : 'payments'}
              </span>
            </div>
            <div>
              <h4 className="text-sm sm:text-base font-extrabold text-gray-900">
                {user?.role === 'admin' ? (
                  <>Publikasi Berita & Informasi Proyek: <span className="text-emerald-700">Akses Administrator (Permanen & Tanpa Batas Waktu)</span></>
                ) : (
                  <>Tarif Publikasi Berita: <span className="text-[#8B4513]">Rp 10.000 / 1 Minggu (Transfer Manual &amp; Midtrans)</span></>
                )}
              </h4>
              <p className="text-xs text-gray-600 mt-0.5">
                {user?.role === 'admin'
                  ? 'Sebagai Admin, konten berita dan informasi proyek yang Anda terbitkan aktif secara permanen (tidak otomatis terhapus dalam 1 minggu). Anda dapat menghapusnya sendiri kapan saja.'
                  : 'Pilih metode pembayaran: Transfer Bank Manual (BCA, Mandiri, BNI) dengan unggah bukti transfer, atau Bayar Otomatis via Midtrans (QRIS, VA, GoPay). Berita aktif tayang selama 7 hari.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="shrink-0 px-4 py-2 bg-[#8B4513] hover:bg-[#6B3410] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            + Pasang Sekarang
          </button>
        </div>

        {/* ── Stat Summary Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#8B4513] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">library_books</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{t('Total Konten Saya')}</p>
              <p className="text-xl sm:text-2xl font-black text-gray-900">{articles.length}</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">engineering</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{t('Informasi Proyek')}</p>
              <p className="text-xl sm:text-2xl font-black text-gray-900">{countProyek}</p>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-black/5 shadow-xs flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-[26px]">newspaper</span>
            </div>
            <div>
              <p className="text-xs font-medium text-gray-500">{t('Berita')}</p>
              <p className="text-xl sm:text-2xl font-black text-gray-900">{countBerita}</p>
            </div>
          </div>
        </div>

        {/* ── Filter & Search Card ── */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-xs overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[20px]">
                search
              </span>
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="Cari judul, kategori, atau ringkasan..."
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all bg-[#FAFBF9]"
              />
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-[#8B4513] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat === 'SEMUA' ? `Semua (${articles.length})` : cat}
                </button>
              ))}
            </div>
          </div>

          {/* ── Table (Desktop) ── */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-[#FAF4EE] text-[#55290A] text-xs uppercase tracking-wider font-bold border-b border-gray-100">
                  <th className="px-6 py-3.5">Foto</th>
                  <th className="px-6 py-3.5">Judul Berita</th>
                  <th className="px-6 py-3.5">Kategori</th>
                  <th className="px-6 py-3.5">Status Pembayaran &amp; Tayang</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4 w-24">
                        <div className="w-16 h-12 rounded-lg bg-gray-200" />
                      </td>
                      <td className="px-6 py-4 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-5 bg-gray-200 rounded-full w-24" />
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-6 bg-gray-200 rounded-full w-28" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="h-8 bg-gray-200 rounded-lg w-20 ml-auto" />
                      </td>
                    </tr>
                  ))
                ) : filteredArticles.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">
                        newspaper
                      </span>
                      <p className="font-semibold text-gray-700">Belum ada konten ditemukan</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {keyword || selectedCategory !== 'SEMUA'
                          ? 'Coba sesuaikan filter atau kata kunci pencarian.'
                          : 'Klik "Pasang Berita" untuk mulai membuat berita baru.'}
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredArticles.map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/20 transition-colors">
                      {/* Thumbnail Image */}
                      <td className="px-6 py-4 w-24">
                        <div className="w-16 h-12 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shadow-2xs shrink-0">
                          <img
                            src={getThumbnailSrc(item)}
                            alt={item.title}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = DEFAULT_IMAGE;
                            }}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Title & Excerpt */}
                      <td className="px-6 py-4 max-w-md">
                        <p className="font-bold text-gray-900 line-clamp-1 hover:text-[#8B4513] transition-colors">
                          {item.title}
                        </p>
                        {item.excerpt && (
                          <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                            {item.excerpt}
                          </p>
                        )}
                        <span className="text-[10px] text-gray-400 font-mono mt-0.5 block">
                          Ref: {item.reference_code || `ART-${item.id}`}
                        </span>
                      </td>

                      {/* Category Badge */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-block text-[11px] font-bold px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {(item.category || '').toUpperCase().includes('PROYEK') ? 'INFORMASI PROYEK' : 'BERITA'}
                        </span>
                      </td>

                      {/* Status & Durasi */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(item)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {(!user || user.role !== 'admin') && item.status !== 'published' && (
                            <button
                              type="button"
                              onClick={() => openPayModal(item)}
                              className="px-2.5 py-1.5 bg-[#8B4513] hover:bg-[#6B3410] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                              title="Pilih Pembayaran (Transfer Manual BCA/Mandiri/BNI/BRI atau Midtrans)"
                            >
                              <span className="material-symbols-outlined text-[16px]">payments</span>
                              <span>{item.payment_proof_url ? 'Bukti / Bayar' : 'Bayar (Rp 10k)'}</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="p-1.5 text-[#8B4513] hover:bg-[#8B4513]/10 rounded-lg transition-colors font-medium text-xs flex items-center gap-1 cursor-pointer"
                            title="Edit Berita"
                          >
                            <span className="material-symbols-outlined text-[18px]">edit</span>
                            <span>Edit</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors font-medium text-xs flex items-center gap-1 cursor-pointer"
                            title="Hapus Berita"
                          >
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                            <span>Hapus</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* ── Card List (Mobile) ── */}
          <div className="md:hidden divide-y divide-gray-100">
            {loading ? (
              <div className="p-4 space-y-3 animate-pulse">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="p-4 rounded-xl border border-gray-100 space-y-3 bg-white">
                    <div className="flex gap-3">
                      <div className="w-16 h-14 rounded-lg bg-gray-200 shrink-0" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <span className="material-symbols-outlined text-4xl text-gray-300 mb-2 block">
                  newspaper
                </span>
                <p className="font-semibold text-gray-700 text-sm">Belum ada konten</p>
                <p className="text-xs text-gray-400 mt-1">
                  Klik "Pasang Berita" untuk membuat berita baru.
                </p>
              </div>
            ) : (
              filteredArticles.map((item) => (
                <div key={item.id} className="p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-16 h-14 rounded-lg overflow-hidden bg-gray-100 border border-gray-200 shrink-0 shadow-2xs">
                      <img
                        src={getThumbnailSrc(item)}
                        alt={item.title}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_IMAGE;
                        }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span
                          className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${getCategoryBadgeClass(
                            item.category
                          )}`}
                        >
                          {(item.category || '').toUpperCase().includes('PROYEK') ? 'PROYEK' : 'BERITA'}
                        </span>
                        {item.source && (
                          <span className="text-[10px] text-gray-500 font-medium truncate max-w-[140px]">
                            • {item.source}
                          </span>
                        )}
                      </div>
                      <p className="font-bold text-gray-900 text-sm line-clamp-2">{item.title}</p>
                    </div>
                  </div>

                  <div className="pt-1 text-xs">
                    {renderStatusBadge(item)}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-50 flex-wrap">
                    {(!user || user.role !== 'admin') && item.status !== 'published' && (
                      <button
                        type="button"
                        onClick={() => openPayModal(item)}
                        className="px-3 py-1.5 bg-[#8B4513] text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 shadow-2xs cursor-pointer"
                        title="Pilih Metode Pembayaran"
                      >
                        <span className="material-symbols-outlined text-[16px]">payments</span>
                        <span>{item.payment_proof_url ? 'Bukti / Bayar' : 'Bayar (Rp 10k)'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-1.5 bg-[#8B4513]/10 text-[#8B4513] rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(item)}
                      className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Hapus
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* ── Modal Form Create & Edit ── */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden animate-fadeIn my-8 border border-gray-100">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-[#FAF4EE] border-b border-[#8B4513]/15 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center shadow-xs">
                    <span className="material-symbols-outlined text-[22px]">
                      {editingArticle ? 'edit_note' : 'newspaper'}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">
                      {editingArticle ? 'Edit Konten Berita / Proyek' : 'Pasang Berita / Informasi Proyek'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Tarif penayangan <span className="font-bold text-[#8B4513]">Rp 10.000 / 1 Minggu (7 Hari)</span> • Transfer Manual atau Midtrans
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-black/5 rounded-lg transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Modal Body Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-4.5 max-h-[78vh] overflow-y-auto">
                {formError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs sm:text-sm rounded-xl p-3.5 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">error</span>
                    <span>{formError}</span>
                  </div>
                )}

                {/* ── CARD METODE PEMBAYARAN (RP 10.000) ── */}
                {(!user || user.role !== 'admin') && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-300/80 rounded-2xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-[#8B4513]">payments</span>
                        Pilihan Metode Pembayaran
                      </span>
                      <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-[#8B4513] text-amber-200 shadow-2xs">
                        Rp 10.000 / 7 Hari
                      </span>
                    </div>

                    <p className="text-xs text-gray-700 leading-relaxed">
                      Setelah menyimpan berita, Anda dapat langsung memilih di antara <b>2 metode pembayaran</b>:
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      <div className="bg-white/90 p-3 rounded-xl border border-amber-200 shadow-2xs flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-amber-100 text-[#8B4513] flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[17px]">account_balance</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-extrabold text-xs text-gray-900">Transfer Bank Manual</p>
                          <p className="text-[11px] text-gray-500 mt-0.5">BCA, Mandiri, BNI a.n. {PT_COMPANY_NAME} (Unggah Bukti Struk)</p>
                        </div>
                      </div>

                      <div className="bg-white/90 p-3 rounded-xl border border-blue-200 shadow-2xs flex items-start gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="material-symbols-outlined text-[17px]">credit_card</span>
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-extrabold text-xs text-gray-900">Otomatis (Midtrans)</p>
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded">Dalam Pengembangan</span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">QRIS, GoPay, ShopeePay, Virtual Account</p>
                          <p className="text-[10px] text-amber-700 font-semibold mt-1 flex items-start gap-1">
                            <span className="material-symbols-outlined text-[13px] shrink-0 mt-0.5 text-amber-600">warning</span>
                            <span>Fitur pembayaran ini sedang dalam proses pengembangan, jadi direkomendasikan transfer manual dulu.</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Judul Berita */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Judul Konten <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Masukkan judul berita atau proyek..."
                    className="w-full bg-[#FAFBF9] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
                    required
                  />
                </div>

                {/* Kategori */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Kategori <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full bg-[#FAFBF9] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all cursor-pointer"
                  >
                    {CATEGORY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sumber Berita / Proyek */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Sumber Berita / Informasi Proyek
                  </label>
                  <input
                    type="text"
                    value={form.source}
                    onChange={(e) => setForm({ ...form, source: e.target.value })}
                    placeholder="Contoh: Kompas.com, Detik, KemenPUPR, atau link sumber https://..."
                    className="w-full bg-[#FAFBF9] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Sebutkan media, instansi penerbit, atau tautan sumber rujukan.
                  </p>
                </div>

                {/* Ringkasan / Excerpt */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Ringkasan Singkat (Excerpt)
                  </label>
                  <textarea
                    rows={2}
                    value={form.excerpt}
                    onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
                    placeholder="Ringkasan 1-2 kalimat untuk preview card berita..."
                    className="w-full bg-[#FAFBF9] border border-gray-200 rounded-xl px-4 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
                  />
                </div>

                {/* Konten Utama */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Isi Konten / Artikel <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={6}
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    placeholder="Tuliskan isi lengkap artikel berita atau informasi proyek di sini..."
                    className="w-full bg-[#FAFBF9] border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all font-sans leading-relaxed"
                    required
                  />
                </div>

                {/* Upload Thumbnail / Gambar Utama */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Foto Utama / Thumbnail
                  </label>
                  <div className="flex items-start gap-4">
                    {imagePreview ? (
                      <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-gray-200 shadow-2xs group shrink-0">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-600 text-white rounded-full flex items-center justify-center opacity-90 hover:opacity-100 shadow cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[14px]">close</span>
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className="w-32 h-24 rounded-xl border-2 border-dashed border-gray-300 hover:border-[#8B4513] flex flex-col items-center justify-center text-gray-400 hover:text-[#8B4513] cursor-pointer transition-colors shrink-0 bg-gray-50"
                      >
                        <span className="material-symbols-outlined text-[24px]">add_photo_alternate</span>
                        <span className="text-[10px] font-bold mt-1">Upload Foto</span>
                      </div>
                    )}

                    <div className="flex-1 text-xs text-gray-500">
                      <p className="font-semibold text-gray-700 mb-1">Format Thumbnail:</p>
                      <p>JPG, PNG, WEBP maks 5MB. Ditampilkan sebagai gambar sampul berita.</p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>

                {/* Modal Footer Buttons */}
                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-[#8B4513] text-white hover:bg-[#6B3410] transition-colors shadow-sm disabled:opacity-50 inline-flex items-center gap-2 cursor-pointer"
                  >
                    {submitting && (
                      <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    )}
                    <span>{editingArticle ? 'Simpan Perubahan' : (user?.role === 'admin' ? 'Terbitkan Berita' : 'Simpan & Lanjut Pembayaran (Rp 10.000)')}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ── Modal Pilihan Pembayaran (Midtrans / Transfer Manual) ── */}
        {payModalArticle && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">payments</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Pembayaran Biaya Publikasi</h3>
                    <p className="text-xs text-gray-500">Ref: {payModalArticle.reference_code || `ART-${payModalArticle.id}`}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closePayModal}
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Rincian Biaya */}
              <div className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#8B4513]/20 space-y-1.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Judul Berita:</span>
                  <span className="font-bold text-gray-900 truncate max-w-[240px]">{payModalArticle.title}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#8B4513]/15">
                  <span className="font-bold text-gray-700 text-sm">Biaya Tayang (1 Minggu):</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-[#8B4513] text-base">Rp 10.000</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard('10000', 'article_amount')}
                      className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-700"
                    >
                      {copiedField === 'article_amount' ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Pilihan Metode: Manual vs Midtrans */}
              <div className="flex rounded-xl bg-gray-100 p-1 gap-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setPayModalMethod('manual')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    payModalMethod === 'manual'
                      ? 'bg-white text-[#8B4513] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">account_balance</span>
                  <span>Transfer Bank Manual</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPayModalMethod('midtrans')}
                  className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    payModalMethod === 'midtrans'
                      ? 'bg-white text-[#8B4513] shadow-xs'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <span className="material-symbols-outlined text-[16px]">credit_card</span>
                  <span>Otomatis (Midtrans)</span>
                </button>
              </div>

              {/* Konten Opsi Manual */}
              {payModalMethod === 'manual' && (
                <div className="space-y-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">Pilih Rekening Tujuan:</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {OFFICIAL_BANK_ACCOUNTS.map((bank) => (
                        <button
                          key={bank.id}
                          type="button"
                          onClick={() => setSelectedBankId(bank.id)}
                          className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                            selectedBankId === bank.id
                              ? 'border-[#8B4513] bg-[#8B4513]/10 ring-2 ring-[#8B4513]/20 shadow-xs'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <span className="text-xs font-black text-gray-900 block">{bank.shortName}</span>
                          <span className="text-[10px] text-gray-500 font-mono block truncate">{bank.accountNumber}</span>
                        </button>
                      ))}
                    </div>

                    <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1 mt-2">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Bank:</span>
                        <span className="font-bold text-gray-800">{selectedBank.bank}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">No. Rekening:</span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-[#8B4513]">{selectedBank.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(selectedBank.accountNumber, 'art_norek')}
                            className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-700"
                          >
                            {copiedField === 'art_norek' ? 'Tersalin' : 'Salin'}
                          </button>
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Atas Nama:</span>
                        <span className="font-bold text-gray-800">{selectedBank.accountName}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-700">Unggah Bukti Transfer (Struk ATM / Screenshot):</label>
                    <div
                      onClick={() => proofFileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#8B4513]/40 rounded-xl p-4 text-center cursor-pointer hover:bg-amber-50/30 transition-colors"
                    >
                      <input
                        ref={proofFileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleArticleProofChange}
                        className="hidden"
                      />
                      {articleProofPreview ? (
                        <div className="flex flex-col items-center gap-1.5">
                          <img src={articleProofPreview} alt="Preview Bukti" className="h-28 object-contain rounded-lg border border-gray-200 shadow-2xs" />
                          <span className="text-xs text-[#8B4513] font-bold underline">Ganti File</span>
                        </div>
                      ) : articleProofFile ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-900">
                          <span className="material-symbols-outlined text-[18px] text-emerald-600">description</span>
                          <span>{articleProofFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-gray-500">
                          <span className="material-symbols-outlined text-2xl text-[#8B4513]">cloud_upload</span>
                          <p className="text-xs font-semibold">Pilih file bukti pembayaran</p>
                          <p className="text-[10px] text-gray-400">JPG, PNG, atau PDF (maks. 5MB)</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2.5 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={closePayModal}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-bold"
                    >
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={handleUploadArticleProof}
                      disabled={uploadingArticleProof || !articleProofFile}
                      className="flex-1 bg-[#8B4513] hover:bg-[#6B3410] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {uploadingArticleProof ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                          <span>Mengunggah…</span>
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[16px]">send</span>
                          <span>Kirim Bukti Pembayaran</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Konten Opsi Midtrans */}
              {payModalMethod === 'midtrans' && (
                <div className="space-y-4 pt-1">
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-xs text-amber-950 space-y-2">
                    <p className="font-bold flex items-center gap-1.5 text-amber-900">
                      <span className="material-symbols-outlined text-[18px] text-amber-700">warning</span>
                      Peringatan: Fitur Dalam Pengembangan
                    </p>
                    <p className="text-amber-800 leading-relaxed font-medium">
                      Fitur pembayaran ini sedang dalam proses pengembangan, jadi sangat direkomendasikan untuk menggunakan <strong>Transfer Bank Manual</strong> terlebih dahulu.
                    </p>
                  </div>

                  <div className="flex gap-2.5 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={closePayModal}
                      className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-bold"
                    >
                      Tutup
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        const art = payModalArticle;
                        closePayModal();
                        await handlePayArticle(art);
                      }}
                      className="flex-1 bg-[#8B4513] hover:bg-[#6B3410] text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[16px]">credit_card</span>
                      <span>Buka Midtrans</span>
                    </button>
                  </div>

                  <p className="text-[11px] text-amber-700 text-center font-medium">
                    ⚠️ Fitur pembayaran ini sedang dalam proses pengembangan, jadi direkomendasikan transfer manual dulu.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Delete Confirmation Dialog ── */}
        <ConfirmDialog
          open={!!deleteTarget}
          loading={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
          message={`Yakin ingin menghapus berita "${deleteTarget?.title}"? Tindakan ini tidak dapat dibatalkan.`}
        />
      </div>
    </DashboardLayout>
  );
}
