import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useTranslation } from '../context/LanguageContext.jsx';
import { SkeletonPesananSaya } from '../components/Skeleton.jsx';
import { OFFICIAL_BANK_ACCOUNTS, PT_COMPANY_NAME } from '../constants/bankAccounts.js';

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatPoints(n) {
  return new Intl.NumberFormat('id-ID').format(n ?? 0);
}

function formatRupiah(n) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n ?? 0);
}

export default function PesananSaya() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const modalFileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all'); // all | completed | pending
  const [searchQuery, setSearchQuery] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [toast, setToast] = useState(null);

  // Manual Transfer Modal State
  const [proofModalOrder, setProofModalOrder] = useState(null);
  const [selectedBankId, setSelectedBankId] = useState('qris');
  const [modalProofFile, setModalProofFile] = useState(null);
  const [modalProofPreview, setModalProofPreview] = useState(null);
  const [uploadingModalProof, setUploadingModalProof] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  const copyToClipboard = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const selectedBank = OFFICIAL_BANK_ACCOUNTS.find((b) => b.id === selectedBankId) || OFFICIAL_BANK_ACCOUNTS[0];

  const openProofModal = (order) => {
    setProofModalOrder(order);
    setModalProofFile(null);
    setModalProofPreview(null);
    setSelectedBankId('bca');
  };

  const closeProofModal = () => {
    setProofModalOrder(null);
    setModalProofFile(null);
    setModalProofPreview(null);
  };

  const handleModalFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file bukti maksimal 5MB.', 'error');
      return;
    }
    setModalProofFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setModalProofPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setModalProofPreview(null);
    }
  };

  const handleUploadModalProof = async () => {
    if (!proofModalOrder?.reference_code) return;
    if (!modalProofFile) {
      showToast('Pilih file bukti transfer terlebih dahulu.', 'error');
      return;
    }

    setUploadingModalProof(true);
    const formData = new FormData();
    formData.append('proof', modalProofFile);

    try {
      await api.post(`/orders/${proofModalOrder.reference_code}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      showToast('Bukti transfer berhasil diunggah! Menunggu verifikasi admin.');
      closeProofModal();
      fetchPurchases();
    } catch (err) {
      console.error('Error uploading proof:', err);
      showToast(err.response?.data?.message || 'Gagal mengunggah bukti transfer.', 'error');
    } finally {
      setUploadingModalProof(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadMidtransSnap = () => {
    return new Promise((resolve) => {
      if (window.snap) {
        resolve(window.snap);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://app.sandbox.midtrans.com/snap/snap.js';
      script.setAttribute('data-client-key', 'SB-Mid-client-kw4OzjqRXjs0P9zQ');
      script.onload = () => resolve(window.snap);
      document.body.appendChild(script);
    });
  };

  const fetchPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.get('/my/purchases');
      const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
      setPurchases(data);
    } catch (err) {
      console.error('Failed to fetch purchases:', err);
      showToast('Gagal memuat daftar pesanan Anda.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const raw = localStorage.getItem('amdal_user');
    if (!raw) {
      navigate('/sign-in');
      return;
    }
    try {
      setUser(JSON.parse(raw));
    } catch {
      navigate('/sign-in');
      return;
    }

    fetchPurchases();
  }, [navigate]);

  const handleDownloadProduct = async (p) => {
    const prodId = p.product_id || p.product?.id;
    if (p.product?.download_url && !p.product?.file_url) {
      window.open(p.product.download_url, '_blank');
      return;
    }
    setDownloadingId(p.id);
    try {
      const res = await api.get(`/products/${prodId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${p.product_title || 'produk'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast('Berkas berhasil diunduh!');
    } catch (err) {
      if (p.product?.download_url) {
        window.open(p.product.download_url, '_blank');
      } else {
        showToast('Gagal mengunduh berkas. Pastikan pembayaran telah lunas.', 'error');
      }
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePaySnap = async (p) => {
    if (!p.snap_token) {
      navigate(`/checkout/${p.product_id || p.product?.id}`);
      return;
    }
    await loadMidtransSnap();
    if (!window.snap) {
      showToast('Gagal memuat payment gateway. Silakan muat ulang halaman.', 'error');
      return;
    }

    window.snap.pay(p.snap_token, {
      onSuccess: async () => {
        showToast('Pembayaran berhasil dikonfirmasi!');
        if (p.reference_code) {
          try {
            await api.get(`/payment/check-status/${p.reference_code}`);
          } catch {}
        }
        fetchPurchases();
      },
      onPending: async () => {
        showToast('Pembayaran sedang diproses.');
        if (p.reference_code) {
          try {
            await api.get(`/payment/check-status/${p.reference_code}`);
          } catch {}
        }
        fetchPurchases();
      },
      onError: () => {
        showToast('Pembayaran gagal atau dibatalkan.', 'error');
      },
      onClose: () => {
        console.log('Snap closed');
      },
    });
  };

  const filteredPurchases = purchases.filter((p) => {
    const isCompleted = p.status === 'completed' || p.status === 'approved' || p.status === 'paid';
    const isPending = p.status === 'pending_payment' || p.status === 'pending' || p.status === 'menunggu_pembayaran';

    if (filterStatus === 'completed' && !isCompleted) return false;
    if (filterStatus === 'pending' && !isPending) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = (p.product_title || p.product?.title || '').toLowerCase().includes(q);
      const refMatch = (p.reference_code || '').toLowerCase().includes(q);
      return titleMatch || refMatch;
    }

    return true;
  });

  const totalCompleted = purchases.filter(
    (p) => p.status === 'completed' || p.status === 'approved' || p.status === 'paid'
  ).length;

  const totalPending = purchases.filter(
    (p) => p.status === 'pending_payment' || p.status === 'pending' || p.status === 'menunggu_pembayaran'
  ).length;

  if (loading && purchases.length === 0) {
    return (
      <DashboardLayout
        title={t('Pesanan & Pembelian Produk', 'Pesanan Saya')}
        subtitle="Kelola seluruh riwayat pembelian buku cetak dan produk digital yang telah Anda pesan"
      >
        <SkeletonPesananSaya />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title={t('Pesanan & Pembelian Produk', 'Pesanan Saya')}
      subtitle="Kelola seluruh riwayat pembelian buku cetak dan produk digital yang telah Anda pesan"
      headerRight={
        <div className="flex items-center gap-2">
          <Link
            to="/search"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#8B4513] text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm hover:bg-[#6B3410] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">shopping_bag</span>
            <span>Jelajahi Produk Lain</span>
          </Link>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Toast */}
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

        {/* ── Summary Stats Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Pesanan</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{purchases.length}</p>
              <p className="text-xs text-gray-400 mt-0.5">Semua riwayat pesanan Anda</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">menu_book</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Lunas & Siap Akses</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{totalCompleted}</p>
              <p className="text-xs text-gray-400 mt-0.5">Koleksi digital & buku Anda</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">check_circle</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Menunggu Pembayaran</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{totalPending}</p>
              <p className="text-xs text-gray-400 mt-0.5">Selesaikan sebelum kadaluarsa</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">schedule</span>
            </div>
          </div>
        </div>

        {/* ── Filter & Search Bar ── */}
        <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 md:pb-0">
            {[
              { id: 'all', label: 'Semua Pesanan', count: purchases.length },
              { id: 'completed', label: 'Lunas / Selesai', count: totalCompleted },
              { id: 'pending', label: 'Menunggu Bayar', count: totalPending },
            ].map((st) => (
              <button
                key={st.id}
                type="button"
                onClick={() => setFilterStatus(st.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  filterStatus === st.id
                    ? 'bg-[#8B4513] text-white shadow-xs'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <span>{st.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                    filterStatus === st.id ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  {st.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-[18px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari judul produk atau no. ref..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] transition-all"
            />
          </div>
        </div>

        {/* ── Order List ── */}
        <div className="space-y-4">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[1, 2, 3].map((n) => (
                <div key={n} className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
                  <div className="flex items-start gap-4 sm:gap-5 flex-1">
                    <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl bg-gray-200 shrink-0"></div>
                    <div className="space-y-3 flex-1">
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                      <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-4 bg-gray-100 rounded w-1/3"></div>
                    </div>
                  </div>
                  <div className="w-full lg:w-48 h-10 bg-gray-200 rounded-xl"></div>
                </div>
              ))}
            </div>
          ) : filteredPurchases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/5 shadow-xs p-12 sm:p-16 text-center max-w-lg mx-auto">
              <div className="w-16 h-16 rounded-2xl bg-[#F5EBE1] text-[#8B4513] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl">shopping_bag</span>
              </div>
              <h3 className="font-bold text-gray-900 text-base mb-1">
                {searchQuery || filterStatus !== 'all' ? 'Pesanan Tidak Ditemukan' : 'Belum Ada Riwayat Pesanan'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mb-6 leading-relaxed">
                {searchQuery || filterStatus !== 'all'
                  ? 'Coba sesuaikan kata kunci pencarian atau ganti filter status di atas.'
                  : 'Anda belum pernah membeli buku fisik maupun karya digital. Anda dapat memesan buku dan produk karya tenaga ahli lainnya kapan saja.'}
              </p>
              <Link
                to="/search"
                className="inline-flex items-center gap-2 bg-[#8B4513] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm hover:bg-[#6B3410] transition-colors shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">search</span>
                <span>Jelajahi Produk & Buku Ahli</span>
              </Link>
            </div>
          ) : (
            filteredPurchases.map((p) => {
              const isCompleted = p.status === 'completed' || p.status === 'approved' || p.status === 'paid';
              const isPending =
                p.status === 'pending_payment' || p.status === 'pending' || p.status === 'menunggu_pembayaran';
              const isDigital = p.product?.is_digital ?? !p.courier_name;

              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-200/80 p-5 sm:p-6 hover:border-[#8B4513]/40 transition-all shadow-2xs hover:shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5"
                >
                  {/* Left Section: Cover & Info */}
                  <div className="flex items-start gap-4 sm:gap-5 min-w-0 flex-1">
                    <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center shadow-xs">
                      {p.product?.image_url ? (
                        <img
                          src={p.product.image_url}
                          alt={p.product_title || 'Produk'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="material-symbols-outlined text-gray-400 text-4xl">
                          {isDigital ? 'description' : 'menu_book'}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            isDigital ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isDigital ? 'E-Book / Digital' : 'Buku Fisik'}
                        </span>
                        <span className="text-xs text-gray-400 font-mono font-semibold">
                          {p.reference_code || `ORD-${p.id}`}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                        {p.product_title || p.product?.title || 'Produk Ahli'}
                      </h3>

                      <div className="flex items-center gap-3 text-xs text-gray-500 flex-wrap">
                        <span className="font-bold text-[#8B4513] text-sm">
                          {p.points_spent > 0
                            ? `${formatPoints(p.points_spent)} Point`
                            : formatRupiah(p.amount_idr || 0)}
                        </span>
                        <span>•</span>
                        <span>{formatDate(p.purchased_at || p.created_at)}</span>
                      </div>

                      {/* Status Indicator */}
                      <div className="pt-1 flex items-center gap-2 flex-wrap">
                        {isCompleted ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
                            <span className="material-symbols-outlined text-[15px]">check_circle</span>
                            Lunas & Berhasil
                          </span>
                        ) : p.status === 'pending_verification' || p.status === 'menunggu_verifikasi' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800">
                            <span className="material-symbols-outlined text-[15px]">hourglass_top</span>
                            Menunggu Verifikasi Admin
                          </span>
                        ) : isPending ? (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-amber-100 text-amber-800">
                            <span className="material-symbols-outlined text-[15px]">schedule</span>
                            Menunggu Pembayaran
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-gray-100 text-gray-700 capitalize">
                            {p.status}
                          </span>
                        )}

                        {p.payment_method && (
                          <span className="text-[11px] text-gray-400 uppercase font-semibold">
                            Metode: {p.payment_method === 'manual' ? 'Transfer Manual' : p.payment_method}
                          </span>
                        )}
                      </div>

                      {/* Physical shipping notes */}
                      {!isDigital && p.courier_name && (
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 mt-2 text-xs text-gray-600 space-y-0.5">
                          <p>
                            <span className="font-bold text-gray-700">Kurir:</span> {p.courier_name}
                          </p>
                          {p.shipping_address && (
                            <p className="line-clamp-1">
                              <span className="font-bold text-gray-700">Tujuan:</span> {p.shipping_address}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Section: Actions */}
                  <div className="flex flex-row lg:flex-col items-center lg:items-end gap-2.5 w-full lg:w-auto shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-100">
                    {isCompleted && isDigital && (
                      <button
                        type="button"
                        disabled={downloadingId === p.id}
                        onClick={() => handleDownloadProduct(p)}
                        className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-[#8B4513] hover:bg-[#6B3410] text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-xs"
                      >
                        {downloadingId === p.id ? (
                          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        ) : (
                          <span className="material-symbols-outlined text-[18px]">download</span>
                        )}
                        <span>
                          {p.product?.download_url && !p.product?.file_url
                            ? 'Buka Akses Karya'
                            : 'Unduh Berkas PDF'}
                        </span>
                      </button>
                    )}

                    {isPending && (
                      <div className="flex flex-col sm:flex-row lg:flex-col gap-1.5 w-full">
                        {p.snap_token && (
                          <button
                            type="button"
                            onClick={() => handlePaySnap(p)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">credit_card</span>
                            <span>Bayar Midtrans</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => openProofModal(p)}
                          className="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#8B4513] hover:bg-[#6B3410] text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">account_balance</span>
                          <span>Transfer Manual</span>
                        </button>
                      </div>
                    )}

                    {(p.status === 'pending_verification' || p.status === 'menunggu_verifikasi') && (
                      <button
                        type="button"
                        onClick={() => openProofModal(p)}
                        className="w-full lg:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[16px]">upload_file</span>
                        <span>Unggah Ulang Bukti</span>
                      </button>
                    )}

                    <div className="flex items-center gap-2 w-full lg:w-auto">
                      {p.reference_code && (
                        <Link
                          to={`/invoice/${p.reference_code}`}
                          className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1 px-3.5 py-2 text-[#8B4513] hover:bg-[#8B4513]/10 border border-[#8B4513]/30 rounded-xl text-xs font-bold transition-colors"
                        >
                          <span className="material-symbols-outlined text-[15px]">receipt_long</span>
                          <span>Invoice</span>
                        </Link>
                      )}

                      {p.product_id && (
                        <Link
                          to={`/produk/${p.product_id}`}
                          className="flex-1 lg:flex-initial inline-flex items-center justify-center gap-1 px-3.5 py-2 text-gray-700 hover:bg-gray-100 border border-gray-200 rounded-xl text-xs font-semibold transition-colors"
                        >
                          <span>Katalog</span>
                          <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Upload Bukti Transfer Manual */}
        {proofModalOrder && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 space-y-4 my-8">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
                    <span className="material-symbols-outlined text-[22px]">account_balance</span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">Pembayaran Transfer Bank</h3>
                    <p className="text-xs text-gray-500">Ref: {proofModalOrder.reference_code}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={closeProofModal}
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              <div className="bg-[#FAF6F0] rounded-2xl p-4 border border-[#8B4513]/20 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total Tagihan:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-[#8B4513] text-sm">{formatRupiah(proofModalOrder.amount_idr || 0)}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(proofModalOrder.amount_idr || 0, 'modal_amount')}
                      className="px-2 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-700"
                    >
                      {copiedField === 'modal_amount' ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-700">Pilih Rekening Tujuan:</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {OFFICIAL_BANK_ACCOUNTS.map((bank) => (
                    <button
                      key={bank.id}
                      type="button"
                      onClick={() => setSelectedBankId(bank.id)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        selectedBankId === bank.id
                          ? 'border-[#8B4513] bg-[#8B4513]/10 ring-2 ring-[#8B4513]/20'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="text-xs font-black text-gray-900 block">{bank.shortName}</span>
                      <span className="text-[10px] text-gray-500 font-mono block truncate">{bank.accountNumber}</span>
                    </button>
                  ))}
                </div>

                <div className="bg-gray-50 rounded-xl p-3 border border-gray-200 text-xs space-y-1">
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
                        onClick={() => copyToClipboard(selectedBank.accountNumber, 'modal_norek')}
                        className="px-1.5 py-0.5 bg-white border border-gray-300 rounded text-[10px] font-bold text-gray-700"
                      >
                        {copiedField === 'modal_norek' ? 'Tersalin' : 'Salin'}
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
                  onClick={() => modalFileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#8B4513]/40 rounded-xl p-4 text-center cursor-pointer hover:bg-amber-50/30 transition-colors"
                >
                  <input
                    ref={modalFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleModalFileChange}
                    className="hidden"
                  />
                  {modalProofPreview ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <img src={modalProofPreview} alt="Preview Bukti" className="h-28 object-contain rounded-lg border border-gray-200 shadow-2xs" />
                      <span className="text-xs text-[#8B4513] font-bold underline">Ganti File</span>
                    </div>
                  ) : modalProofFile ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-gray-900">
                      <span className="material-symbols-outlined text-[18px] text-emerald-600">description</span>
                      <span>{modalProofFile.name}</span>
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

              <div className="flex gap-2.5 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeProofModal}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs font-bold"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={handleUploadModalProof}
                  disabled={uploadingModalProof || !modalProofFile}
                  className="flex-1 bg-[#8B4513] hover:bg-[#6B3410] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-2.5 px-4 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
                >
                  {uploadingModalProof ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Mengunggah…</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>Kirim Bukti</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
