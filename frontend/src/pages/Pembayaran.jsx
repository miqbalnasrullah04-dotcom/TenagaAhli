import { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { getMediaUrl } from '../utils/media.js';
import { OFFICIAL_BANK_ACCOUNTS, PT_COMPANY_NAME } from '../constants/bankAccounts.js';
import ManualPaymentInstruction from '../components/ManualPaymentInstruction.jsx';

function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);
}

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

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const map = {
    menunggu_pembayaran: { label: t('payment.status.waiting_payment', 'Menunggu Pembayaran'), color: '#7A5900', bg: '#FFF4D6' },
    pending:             { label: t('payment.status.waiting_payment', 'Menunggu Pembayaran'), color: '#7A5900', bg: '#FFF4D6' },
    pending_verification: { label: t('payment.status.waiting_verification', 'Menunggu Verifikasi Admin'), color: '#1E40AF', bg: '#DBEAFE' },
    menunggu_verifikasi: { label: t('payment.status.waiting_verification', 'Menunggu Verifikasi Admin'), color: '#1E40AF', bg: '#DBEAFE' },
    verified:            { label: t('payment.status.approved', 'Lunas & Aktif'),       color: '#166534', bg: '#DCFCE7' },
    paid:                { label: t('payment.status.approved', 'Lunas & Aktif'),       color: '#166534', bg: '#DCFCE7' },
    completed:           { label: t('payment.status.approved', 'Selesai / Lunas'),     color: '#166534', bg: '#DCFCE7' },
    rejected:            { label: t('payment.status.rejected', 'Ditolak / Batal'),     color: '#B3261E', bg: '#FFDAD6' },
    cancelled:           { label: t('payment.status.rejected', 'Dibatalkan'),          color: '#B3261E', bg: '#FFDAD6' },
  };
  const d = map[status] || { label: status, color: '#414844', bg: '#F5F4F0' };
  return (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider inline-flex items-center gap-1.5 shadow-2xs" style={{ color: d.color, backgroundColor: d.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
      {d.label}
    </span>
  );
}

function CategoryBadge({ category }) {
  const map = {
    package:      { label: 'Paket Membership', icon: 'workspace_premium', color: '#8B4513', bg: '#F5EBE1' },
    product:      { label: 'Produk Digital',   icon: 'shopping_bag',       color: '#1E3A8A', bg: '#DBEAFE' },
    consultation: { label: 'Konsultasi Ahli',  icon: 'psychology',         color: '#065F46', bg: '#D1FAE5' },
    topup:        { label: 'Top Up Point',     icon: 'monetization_on',    color: '#92400E', bg: '#FEF3C7' },
    berita:       { label: 'Publikasi Berita', icon: 'newspaper',          color: '#7C3AED', bg: '#F5F3FF' },
  };
  const c = map[category] || { label: 'Pembayaran', icon: 'payments', color: '#414844', bg: '#F5F4F0' };
  return (
    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-flex items-center gap-1" style={{ color: c.color, backgroundColor: c.bg }}>
      <span className="material-symbols-outlined text-[13px]">{c.icon}</span>
      {c.label}
    </span>
  );
}

export default function Pembayaran() {
  const { t } = useTranslation();
  const navigate  = useNavigate();
  const location  = useLocation();
  const fileInputRef = useRef(null);

  const getDashboardPath = () => {
    try {
      const u = JSON.parse(localStorage.getItem('amdal_user') || '{}');
      return u.role_type === 'surveyor' ? '/dashboard-surveyor' : '/dashboard';
    } catch { return '/dashboard'; }
  };

  const initialOrder = location.state?.order ?? null;
  const initialCategory = location.state?.category ?? 'all';

  // Navigation tab: 'pay' (Pusat Pembayaran) | 'services' (Pilih Layanan) | 'history' (Riwayat)
  const [tab, setTab] = useState('pay');
  const [categoryFilter, setCategoryFilter] = useState(initialCategory);

  // Data collections across all 4 categories
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Packages & Package Orders
  const [packages, setPackages] = useState([]);
  const [packageOrders, setPackageOrders] = useState([]);
  const [pkg, setPkg] = useState(location.state?.package ?? null);
  const [order, setOrder] = useState(initialOrder);

  // 2. Product Orders (Marketplace)
  const [productOrders, setProductOrders] = useState([]);

  // 3. Consultation Orders
  const [consultationOrders, setConsultationOrders] = useState([]);

  // 4. Top Up Packages & Orders
  const [topupPackages, setTopupPackages] = useState([]);
  const [topupOrders, setTopupOrders] = useState([]);
  const [pointBalance, setPointBalance] = useState(0);

  // 5. Article / Berita Orders
  const [articleOrders, setArticleOrders] = useState([]);

  // Active item selected for payment / proof upload
  // Shape: { category: 'package'|'product'|'consultation'|'topup', id, reference_code, title, amount, status, raw }
  const [activeItem, setActiveItem] = useState(null);

  // Manual payment state
  const [selectedBankId, setSelectedBankId] = useState('qris');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedField, setCopiedField] = useState('');

  const copyToClipboard = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const resolvePackageId = (pkgObj, pkgList) => {
    if (pkgObj?.id && typeof pkgObj.id === 'number') return pkgObj.id;
    if (pkgObj?.id && !isNaN(Number(pkgObj.id))) return Number(pkgObj.id);
    
    const nameStr = (typeof pkgObj === 'string' ? pkgObj : pkgObj?.name || pkgObj?.slug || 'ekonomis').toLowerCase();
    const found = pkgList.find(p => 
      p.slug?.toLowerCase() === nameStr || 
      p.name?.toLowerCase().includes(nameStr) ||
      ((nameStr === 'premium' || nameStr === 'ekonomis') && p.price > 0)
    );
    if (found) return found.id;
    const paidPkg = pkgList.find(p => p.price > 0);
    return paidPkg ? paidPkg.id : 2;
  };

  // ── Fetch All Data in Parallel (Satu Pintu Pembayaran) ──────────────────────
  const loadAllPaymentsData = async () => {
    setLoading(true);
    try {
      const [
        profileRes,
        historyRes,
        mineRes,
        packagesRes,
        purchasesRes,
        consultRes,
        topupPkgsRes,
        topupHistRes,
        articlesRes
      ] = await Promise.all([
        api.get('/my/profile').catch(() => ({ data: {} })),
        api.get('/orders/history').catch(() => ({ data: [] })),
        api.get('/orders/mine').catch(() => ({ data: {} })),
        api.get('/packages').catch(() => ({ data: [] })),
        api.get('/my/purchases').catch(() => ({ data: [] })),
        api.get('/my/consultations').catch(() => ({ data: [] })),
        api.get('/topup/packages').catch(() => ({ data: { data: [] } })),
        api.get('/topup/history?per_page=20').catch(() => ({ data: { data: [], summary: { point_balance: 0 } } })),
        api.get('/my/articles').catch(() => ({ data: [] })),
      ]);

      // 1. Packages & Package Orders
      const pkgList = Array.isArray(packagesRes.data) ? packagesRes.data : [];
      setPackages(pkgList);
      const pkgOrders = Array.isArray(historyRes.data) ? historyRes.data : [];
      setPackageOrders(pkgOrders);

      // Active Package Order
      const currentPkgOrder = (mineRes.data?.status === 'menunggu_pembayaran' || mineRes.data?.status === 'pending' || mineRes.data?.status === 'menunggu_verifikasi')
        ? mineRes.data : null;
      if (currentPkgOrder && !initialOrder) {
        setOrder(currentPkgOrder);
      }

      // 2. Product Orders
      const prods = Array.isArray(purchasesRes.data)
        ? purchasesRes.data
        : purchasesRes.data?.data || [];
      setProductOrders(prods);

      // 3. Consultations
      const consults = Array.isArray(consultRes.data?.data)
        ? consultRes.data.data
        : Array.isArray(consultRes.data)
        ? consultRes.data
        : [];
      setConsultationOrders(consults);

      // 4. Top Up
      const tPkgs = topupPkgsRes.data?.data ?? topupPkgsRes.data ?? [];
      setTopupPackages(Array.isArray(tPkgs) ? tPkgs : []);
      const tOrders = topupHistRes.data?.data ?? [];
      setTopupOrders(Array.isArray(tOrders) ? tOrders : []);
      setPointBalance(topupHistRes.data?.summary?.point_balance ?? 0);

      // 5. Berita / Artikel
      const arts = Array.isArray(articlesRes.data)
        ? articlesRes.data
        : articlesRes.data?.data || [];
      setArticleOrders(arts);

      // Set initial active item if passed via location.state
      if (initialOrder) {
        setActiveItem({
          category: 'package',
          id: initialOrder.id,
          reference_code: initialOrder.reference_code,
          title: `Paket ${initialOrder.package_name || 'Membership'}`,
          amount: initialOrder.amount,
          status: initialOrder.status || 'menunggu_pembayaran',
          raw: initialOrder,
        });
      } else if (currentPkgOrder) {
        setActiveItem({
          category: 'package',
          id: currentPkgOrder.id,
          reference_code: currentPkgOrder.reference_code,
          title: `Paket ${currentPkgOrder.package_name || 'Membership'}`,
          amount: currentPkgOrder.amount,
          status: currentPkgOrder.status,
          raw: currentPkgOrder,
        });
      }
    } catch (err) {
      console.error('Error loading payments data:', err);
      setError('Gagal memuat beberapa data pembayaran.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllPaymentsData();
  }, []);

  // ── Unified Pending Items List ──────────────────────────────────────────────
  const pendingItems = [];

  // A. Package Orders Pending
  packageOrders.forEach(o => {
    if (['pending', 'menunggu_pembayaran', 'menunggu_verifikasi'].includes(o.status)) {
      pendingItems.push({
        category: 'package',
        id: o.id,
        reference_code: o.reference_code,
        title: `Paket ${o.package_name || o.package?.name || 'Membership'}`,
        description: 'Langganan Membership Akun Tenaga Ahli',
        amount: o.amount || o.price || 0,
        status: o.status,
        date: o.created_at,
        raw: o,
      });
    }
  });

  // B. Product Purchases Pending
  productOrders.forEach(p => {
    if (['pending', 'menunggu_pembayaran', 'pending_verification'].includes(p.status)) {
      pendingItems.push({
        category: 'product',
        id: p.id,
        reference_code: p.reference_code,
        title: p.product?.title || p.product_title || 'Pesanan Produk Digital',
        description: 'Pesanan Produk Digital di Marketplace TenagaAhli',
        amount: p.total_amount || p.amount || p.price || 0,
        status: p.status,
        date: p.created_at,
        raw: p,
      });
    }
  });

  // C. Consultation Orders Pending
  consultationOrders.forEach(c => {
    if (['pending', 'menunggu_pembayaran', 'waiting_verification'].includes(c.status) || (!c.is_paid && c.status !== 'cancelled' && c.status !== 'rejected')) {
      pendingItems.push({
        category: 'consultation',
        id: c.id,
        reference_code: c.reference_code || `CONS-${c.id}`,
        title: `Konsultasi: ${c.topic || c.expert?.name || 'Sesi Ahli'}`,
        description: `Jadwal: ${c.date || '-'} ${c.time ? `(${c.time})` : ''}`,
        amount: c.amount || c.price || c.fee || 0,
        status: c.status || 'menunggu_pembayaran',
        date: c.created_at || c.date,
        raw: c,
      });
    }
  });

  // D. Top Up Orders Pending
  topupOrders.forEach(t => {
    if (['pending', 'menunggu_pembayaran', 'menunggu_verifikasi'].includes(t.status)) {
      pendingItems.push({
        category: 'topup',
        id: t.id,
        reference_code: t.reference_code,
        title: `Top Up ${t.points_amount || t.amount || 0} Point`,
        description: 'Isi Saldo Point TenagaAhli',
        amount: t.price || t.amount || 0,
        status: t.status,
        date: t.created_at,
        raw: t,
      });
    }
  });

  // E. Berita / Artikel Orders Pending
  articleOrders.forEach(a => {
    const payStatus = a.payment_status || (a.status === 'aktif' || a.status === 'published' ? 'verified' : a.status);
    if (['pending', 'menunggu_pembayaran', 'menunggu_verifikasi'].includes(payStatus)) {
      pendingItems.push({
        category: 'berita',
        id: a.id,
        reference_code: a.reference_code || `BRT-${a.id}`,
        title: a.title ? `Berita: ${a.title.slice(0, 45)}${a.title.length > 45 ? '...' : ''}` : 'Publikasi Berita',
        description: 'Publikasi Berita di Portal TenagaAhli (Rp 10.000 / minggu)',
        amount: a.price || 10000,
        status: payStatus,
        date: a.created_at,
        raw: a,
      });
    }
  });

  // Filter pending items based on category pill
  const filteredPendingItems = pendingItems.filter(item => {
    if (categoryFilter === 'all') return true;
    return item.category === categoryFilter;
  });

  // ── Unified History Across All Categories ───────────────────────────────────
  const unifiedHistory = [
    ...packageOrders.map(o => ({
      category: 'package',
      id: o.id,
      reference_code: o.reference_code,
      title: `Paket ${o.package_name || o.package?.name || 'Membership'}`,
      amount: o.amount || o.price || 0,
      status: o.status,
      date: o.created_at,
      invoiceUrl: o.reference_code ? `/invoice/${o.reference_code}` : `/invoice/ord_${o.id}`,
      raw: o,
    })),
    ...productOrders.map(p => ({
      category: 'product',
      id: p.id,
      reference_code: p.reference_code,
      title: p.product?.title || 'Pesanan Produk',
      amount: p.total_amount || p.amount || 0,
      status: p.status,
      date: p.created_at,
      invoiceUrl: p.reference_code ? `/invoice/${p.reference_code}` : `/invoice/pp_${p.id}`,
      raw: p,
    })),
    ...consultationOrders.map(c => ({
      category: 'consultation',
      id: c.id,
      reference_code: c.reference_code || `CONS-${c.id}`,
      title: `Konsultasi: ${c.topic || c.expert?.name || 'Ahli'}`,
      amount: c.amount || c.price || c.fee || 0,
      status: c.status,
      date: c.created_at || c.date,
      invoiceUrl: c.reference_code ? `/invoice/${c.reference_code}` : `/invoice/cons_${c.id}`,
      raw: c,
    })),
    ...topupOrders.map(t => ({
      category: 'topup',
      id: t.id,
      reference_code: t.reference_code,
      title: `Top Up ${t.points_amount || 0} Point`,
      amount: t.price || t.amount || 0,
      status: t.status,
      date: t.created_at,
      invoiceUrl: t.reference_code ? `/invoice/${t.reference_code}` : `/invoice/tp_${t.id}`,
      raw: t,
    })),
    ...articleOrders.map(a => ({
      category: 'berita',
      id: a.id,
      reference_code: a.reference_code || `BRT-${a.id}`,
      title: a.title ? `Berita: ${a.title.slice(0, 48)}${a.title.length > 48 ? '...' : ''}` : 'Publikasi Berita',
      amount: a.price || 10000,
      status: a.payment_status || (a.status === 'aktif' || a.status === 'published' ? 'verified' : a.status),
      date: a.created_at,
      invoiceUrl: a.reference_code ? `/invoice/${a.reference_code}` : `/invoice/art_${a.id}`,
      raw: a,
    })),
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  const filteredHistory = unifiedHistory.filter(h => {
    if (categoryFilter === 'all') return true;
    return h.category === categoryFilter;
  });

  // ── Handle Select Item to Pay ───────────────────────────────────────────────
  const handleSelectItemToPay = (item) => {
    setActiveItem(item);
    setProofFile(null);
    setProofPreview(null);
    setError('');
    setSuccessMsg('');
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  // ── Handle File Change for Proof ───────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal adalah 5MB.');
      return;
    }

    setProofFile(file);
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setProofPreview(reader.result);
      reader.readAsDataURL(file);
    } else {
      setProofPreview(null);
    }
    setError('');
  };

  // ── Handle Upload Proof (Auto-Routed per Category) ──────────────────────────
  const handleUploadProof = async () => {
    if (!activeItem) {
      setError('Silakan pilih tagihan yang ingin dibayar.');
      return;
    }
    if (!proofFile) {
      setError('Silakan pilih file bukti transfer terlebih dahulu.');
      return;
    }

    setUploadingProof(true);
    setError('');
    setSuccessMsg('');

    try {
      const formData = new FormData();

      if (activeItem.category === 'package' || activeItem.category === 'product') {
        const targetId = activeItem.reference_code || activeItem.id;
        formData.append('proof', proofFile);
        await api.post(`/orders/${targetId}/upload-proof`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (activeItem.category === 'consultation') {
        const selectedBank = OFFICIAL_BANK_ACCOUNTS.find((b) => b.id === selectedBankId) || OFFICIAL_BANK_ACCOUNTS[0];
        formData.append('payment_proof', proofFile);
        formData.append('bank_name', selectedBank.bank);
        await api.post(`/consultations/${activeItem.id}/payment-proof`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (activeItem.category === 'topup') {
        formData.append('proof', proofFile);
        await api.post(`/topup/${activeItem.id}/upload-proof`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else if (activeItem.category === 'berita') {
        formData.append('proof', proofFile);
        formData.append('payment_proof', proofFile);
        await api.post(`/my/articles/${activeItem.id}/upload-proof`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      setSuccessMsg('Bukti transfer berhasil diunggah! Status telah diperbarui menjadi "Menunggu Verifikasi Admin".');
      setProofFile(null);
      setProofPreview(null);
      setActiveItem(prev => prev ? { ...prev, status: 'menunggu_verifikasi' } : null);
      await loadAllPaymentsData();
    } catch (err) {
      console.error('Error uploading proof:', err);
      setError(err.response?.data?.message || 'Gagal mengunggah bukti transfer. Pastikan format file sesuai (JPG, PNG, atau PDF).');
    } finally {
      setUploadingProof(false);
    }
  };

  // ── Handle Pay with Midtrans (Snap) ─────────────────────────────────────────
  const handlePayMidtrans = async (item) => {
    const it = item || activeItem;
    if (!it) return;

    setError('');
    setSubmitting(true);

    try {
      let snapToken = it.raw?.snap_token;

      if (!snapToken) {
        if (it.category === 'package') {
          const res = await api.post('/my/choose-package', {
            package_id: it.raw?.package_id || it.id,
            package_name: it.raw?.package_name || 'premium'
          });
          snapToken = res.data?.snap_token || res.data?.order?.snap_token;
        } else if (it.category === 'consultation') {
          const res = await api.post(`/consultations/${it.id}/snap-token`);
          snapToken = res.data?.snap_token;
        } else if (it.category === 'berita') {
          const res = await api.post(`/my/articles/${it.id}/snap-token`);
          snapToken = res.data?.snap_token;
        }
      }

      if (!snapToken) {
        setError('Gagal memuat sistem pembayaran otomatis Midtrans. Silakan gunakan Transfer Bank Manual / QRIS di atas.');
        setSubmitting(false);
        return;
      }

      await loadMidtransSnap();
      if (!window.snap) {
        setError('Sistem popup Midtrans tidak dapat dimuat. Periksa koneksi internet Anda.');
        setSubmitting(false);
        return;
      }

      window.snap.pay(snapToken, {
        onSuccess: async function () {
          setSuccessMsg('Pembayaran Midtrans berhasil diselesaikan!');
          loadAllPaymentsData();
        },
        onPending: function () {
          setSuccessMsg('Pembayaran Anda sedang diproses. Silakan selesaikan instruksi pembayaran.');
          loadAllPaymentsData();
        },
        onError: function () {
          setError('Pembayaran dibatalkan atau gagal.');
        },
        onClose: function () {
          loadAllPaymentsData();
        }
      });
    } catch (err) {
      console.error('Midtrans error:', err);
      setError(err.response?.data?.message || 'Gagal memulai pembayaran Midtrans.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading Skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout
        title="Pusat Pembayaran"
        subtitle="Satu pintu untuk seluruh pembayaran paket, pesanan produk, konsultasi, dan top up."
      >
        <div className="flex flex-col items-center justify-center py-24">
          <div className="w-12 h-12 border-4 border-[#8B4513]/20 border-t-[#8B4513] rounded-full animate-spin mb-4" />
          <p className="text-sm font-semibold text-[#5B6660]">Menghubungkan pusat pembayaran terpadu...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Pusat Pembayaran Terpadu"
      subtitle="Satu pintu untuk melihat, membayar, dan mengunggah bukti seluruh transaksi Anda di TenagaAhli."
    >
      {/* ── Ringkasan Cepat Saldo & Tagihan Menunggu ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">pending_actions</span>
          </div>
          <div>
            <p className="text-xs text-[#5B6660] font-medium">Tagihan Menunggu Bayar</p>
            <p className="text-xl font-black text-[#1F2A22]">
              {pendingItems.filter(p => ['pending', 'menunggu_pembayaran'].includes(p.status)).length} Tagihan
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">hourglass_top</span>
          </div>
          <div>
            <p className="text-xs text-[#5B6660] font-medium">Sedang Diverifikasi</p>
            <p className="text-xl font-black text-[#1F2A22]">
              {pendingItems.filter(p => ['menunggu_verifikasi', 'pending_verification'].includes(p.status)).length} Tagihan
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/5 p-4 flex items-center gap-3.5 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-700 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-[26px]">monetization_on</span>
          </div>
          <div>
            <p className="text-xs text-[#5B6660] font-medium">Saldo Point Anda</p>
            <p className="text-xl font-black text-[#1F2A22]">
              {Number(pointBalance).toLocaleString('id-ID')} Point
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Navigation Tabs ── */}
      <div className="flex gap-2 border-b border-black/10 mb-6 overflow-x-auto no-scrollbar">
        {[
          { id: 'pay',      label: 'Tagihan & Pembayaran Aktif', icon: 'payments', badge: pendingItems.length },
          { id: 'services', label: 'Pilih Layanan Pembayaran',    icon: 'grid_view' },
          { id: 'history',  label: 'Riwayat Semua Transaksi',    icon: 'receipt_long', badge: unifiedHistory.length },
        ].map(tItem => (
          <button
            key={tItem.id}
            onClick={() => setTab(tItem.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold border-b-2 whitespace-nowrap transition-colors cursor-pointer ${
              tab === tItem.id
                ? 'border-[#8B4513] text-[#8B4513]'
                : 'border-transparent text-[#5B6660] hover:text-[#8B4513]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{tItem.icon}</span>
            <span>{tItem.label}</span>
            {Boolean(tItem.badge) && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                tab === tItem.id ? 'bg-[#8B4513] text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {tItem.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Alerts Error & Success ── */}
      {error && (
        <div className="bg-[#FFDAD6] text-[#93000A] text-xs sm:text-sm rounded-2xl p-4 mb-6 flex items-start gap-2.5 shadow-xs border border-[#BA1A1A]/20">
          <span className="material-symbols-outlined text-[20px] shrink-0 text-[#BA1A1A]">error</span>
          <div className="flex-1 font-semibold">{error}</div>
        </div>
      )}

      {successMsg && (
        <div className="bg-[#DCFCE7] text-[#166534] text-xs sm:text-sm rounded-2xl p-4 mb-6 flex items-start gap-2.5 shadow-xs border border-emerald-300">
          <span className="material-symbols-outlined text-[20px] shrink-0 text-emerald-700">check_circle</span>
          <div className="flex-1 font-semibold">{successMsg}</div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 1: TAGIHAN & PEMBAYARAN AKTIF                                      */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'pay' && (
        <div className="space-y-6">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all',          label: 'Semua Kategori' },
              { id: 'package',      label: 'Paket Membership' },
              { id: 'product',      label: 'Produk Digital' },
              { id: 'consultation', label: 'Konsultasi' },
              { id: 'topup',        label: 'Top Up Point' },
              { id: 'berita',       label: 'Publikasi Berita' },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setCategoryFilter(pill.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  categoryFilter === pill.id
                    ? 'bg-[#8B4513] text-white shadow-xs'
                    : 'bg-white text-[#5B6660] border border-black/10 hover:border-[#8B4513]/40'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Pending Bills Grid / List */}
          {filteredPendingItems.length > 0 ? (
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#5B6660]">
                Tagihan Menunggu Tindakan ({filteredPendingItems.length})
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {filteredPendingItems.map(item => {
                  const isSelected = activeItem?.id === item.id && activeItem?.category === item.category;
                  return (
                    <div
                      key={`${item.category}-${item.id}`}
                      className={`bg-white rounded-2xl p-4 sm:p-5 border transition-all relative flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'border-[#8B4513] ring-2 ring-[#8B4513]/20 shadow-md bg-[#FFF9F5]'
                          : 'border-black/10 hover:border-black/20 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CategoryBadge category={item.category} />
                          <h4 className="font-extrabold text-[#1F2A22] text-sm leading-snug">
                            {item.title}
                          </h4>
                          <p className="text-[11px] text-[#5B6660] line-clamp-1">
                            {item.description}
                          </p>
                          <p className="text-[10px] text-gray-500 font-mono">
                            Ref: {item.reference_code}
                          </p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-black/5">
                        <div>
                          <span className="text-[10px] text-[#5B6660] block font-medium">Total Nominal:</span>
                          <span className="font-black text-[#8B4513] text-base">
                            {formatRupiah(item.amount)}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleSelectItemToPay(item)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? 'bg-[#8B4513] text-white shadow-xs'
                              : 'bg-white border border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513]/5'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {item.status === 'menunggu_verifikasi' || item.status === 'pending_verification' ? 'visibility' : 'payments'}
                          </span>
                          <span>{item.status === 'menunggu_verifikasi' || item.status === 'pending_verification' ? 'Lihat Bukti' : 'Bayar Sekarang'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-black/10 p-8 sm:p-12 text-center space-y-3">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <span className="material-symbols-outlined text-3xl">task_alt</span>
              </div>
              <h3 className="font-extrabold text-lg text-[#1F2A22]">
                Tidak Ada Tagihan yang Menunggu
              </h3>
              <p className="text-xs text-[#5B6660] max-w-md mx-auto leading-relaxed">
                Seluruh pembayaran Anda sudah lunas dan terverifikasi. Jika Anda ingin melakukan transaksi baru, silakan pilih layanan pembayaran di bawah ini.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setTab('services')}
                  className="px-5 py-2.5 rounded-full text-xs font-bold bg-[#8B4513] text-white hover:bg-[#6B3410] shadow-sm transition-all"
                >
                  Buka Pilihan Layanan Pembayaran
                </button>
              </div>
            </div>
          )}

          {/* ── Active Payment Action Panel (Transfer Manual / Midtrans) ── */}
          {activeItem && (
            <div className="bg-white rounded-3xl border border-black/10 p-5 sm:p-7 shadow-lg space-y-6 animate-fadeIn">
              {/* Header Tagihan Aktif */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CategoryBadge category={activeItem.category} />
                    <span className="text-[11px] font-mono text-gray-500">#{activeItem.reference_code}</span>
                  </div>
                  <h3 className="font-extrabold text-lg text-[#1F2A22]">{activeItem.title}</h3>
                </div>

                <div className="text-left sm:text-right">
                  <span className="text-[11px] text-[#5B6660] block font-medium">Nominal Tagihan:</span>
                  <div className="flex items-center gap-2 justify-start sm:justify-end">
                    <span className="font-black text-[#8B4513] text-xl sm:text-2xl">{formatRupiah(activeItem.amount)}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(String(activeItem.amount), 'amount')}
                      className="text-[10px] px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold border border-black/5 cursor-pointer"
                    >
                      {copiedField === 'amount' ? 'Disalin!' : 'Salin'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Status Jika Sedang Diverifikasi */}
              {activeItem.status === 'menunggu_verifikasi' || activeItem.status === 'pending_verification' ? (
                <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
                    <span className="material-symbols-outlined text-2xl">hourglass_top</span>
                  </div>
                  <div>
                    <h4 className="font-bold text-blue-950 text-sm">Bukti Pembayaran Sedang Diverifikasi Admin</h4>
                    <p className="text-xs text-blue-800 mt-1 max-w-md mx-auto leading-relaxed">
                      Bukti transfer untuk tagihan ini telah dikirim. Admin kami akan memverifikasi dan memperbarui status secara otomatis maksimal dalam 1x24 jam kerja.
                    </p>
                  </div>
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs text-[#8B4513] hover:underline font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">upload_file</span>
                      <span>Ingin Unggah Ulang Bukti Lain?</span>
                    </button>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*,application/pdf"
                      className="hidden"
                    />
                  </div>
                </div>
              ) : null}

              {/* Pilihan Rekening & QRIS Resmi (QRIS di Paling Kiri) */}
              <div className="space-y-4">
                <ManualPaymentInstruction
                  selectedBankId={selectedBankId}
                  onSelectBank={setSelectedBankId}
                />
              </div>

              {/* Form Upload Bukti Transfer */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-bold text-gray-800">
                  Unggah Bukti Transfer / Struk Transaksi:
                </label>
                <p className="text-[11px] text-[#5B6660]">
                  Dukung format JPG, PNG, atau PDF (Maksimal 5MB)
                </p>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-[#8B4513] rounded-2xl p-6 text-center cursor-pointer transition-colors bg-gray-50/60 hover:bg-[#8B4513]/5"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*,application/pdf"
                    className="hidden"
                  />
                  <span className="material-symbols-outlined text-4xl text-gray-400 mb-2 block">cloud_upload</span>
                  {proofFile ? (
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-[#8B4513] truncate max-w-xs mx-auto">{proofFile.name}</p>
                      <span className="text-[10px] text-gray-500">{(proofFile.size / 1024).toFixed(1)} KB • Klik untuk ganti file</span>
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-gray-700">Pilih file struk bukti transfer atau klik di sini</p>
                      <span className="text-[10px] text-gray-400">Pastikan nominal dan tanggal transfer tampak jelas</span>
                    </div>
                  )}
                </div>

                {proofPreview && (
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-200">
                    <img src={proofPreview} alt="Preview Bukti" className="w-14 h-14 object-cover rounded-lg border border-gray-300" />
                    <div className="text-xs flex-1">
                      <p className="font-bold text-gray-800">Preview Struk Bukti Transfer</p>
                      <span className="text-[11px] text-gray-500">Siap untuk dikirim ke sistem admin</span>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleUploadProof}
                  disabled={uploadingProof || !proofFile}
                  className="w-full bg-[#8B4513] text-white py-3.5 rounded-xl font-extrabold text-sm hover:bg-[#6B3410] disabled:opacity-40 transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  {uploadingProof ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mengirim Bukti Pembayaran...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">send</span>
                      <span>Kirim Bukti Pembayaran</span>
                    </>
                  )}
                </button>
              </div>

              {/* Opsi Bayar Otomatis Midtrans (jika tersedia) */}
              <div className="pt-2 border-t border-black/5">
                <button
                  type="button"
                  onClick={() => handlePayMidtrans(activeItem)}
                  disabled={submitting}
                  className="w-full bg-white hover:bg-gray-50 border-2 border-[#8B4513] text-[#8B4513] py-3.5 rounded-xl font-extrabold text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-[#8B4513]/30 border-t-[#8B4513] rounded-full animate-spin" />
                      <span>Menyiapkan Midtrans...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[19px]">payments</span>
                      <span>Atau Bayar Otomatis via Midtrans (Instan)</span>
                    </>
                  )}
                </button>
                <p className="text-[10px] text-[#5B6660] text-center mt-1.5">
                  Mendukung QRIS instan, GoPay, OVO, dan Virtual Account Bank otomatis.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 2: PILIH LAYANAN PEMBAYARAN                                        */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'services' && (
        <div className="space-y-6">
          <div className="bg-[#F5EBE1] rounded-2xl p-5 border border-[#8B4513]/20">
            <h3 className="font-extrabold text-base text-[#1F2A22]">
              Layanan Pembayaran Resmi TenagaAhli
            </h3>
            <p className="text-xs text-[#5B6660] mt-1 leading-relaxed">
              Anda tetap dapat bertransaksi langsung dari halaman masing-masing menu, atau menggunakan pusat pembayaran satu pintu ini untuk memilih transaksi yang ingin diselesaikan.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* 1. Paket Membership */}
            <div className="bg-white rounded-2xl border border-black/10 p-5 space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">workspace_premium</span>
                </div>
                <h4 className="font-extrabold text-base text-[#1F2A22]">Paket Membership Tenaga Ahli</h4>
                <p className="text-xs text-[#5B6660] leading-relaxed">
                  Tingkatkan profil ke paket Ekonomis atau Eksklusif untuk mendapatkan lencana centang biru resmi, akses kontak klien, dan direktori prioritas.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/paket')}
                  className="w-full bg-[#8B4513] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#6B3410] transition-colors"
                >
                  Pilih & Upgrade Paket
                </button>
              </div>
            </div>

            {/* 2. Pesanan Produk Digital */}
            <div className="bg-white rounded-2xl border border-black/10 p-5 space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">shopping_bag</span>
                </div>
                <h4 className="font-extrabold text-base text-[#1F2A22]">Pesanan Produk Digital</h4>
                <p className="text-xs text-[#5B6660] leading-relaxed">
                  Beli dan akses produk digital seperti e-book, template dokumen teknis, modul panduan, dan materi keahlian dari para profesional.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/pesanan-saya')}
                  className="w-full bg-blue-700 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-blue-800 transition-colors"
                >
                  Buka Pesanan Saya
                </button>
              </div>
            </div>

            {/* 3. Konsultasi Ahli */}
            <div className="bg-white rounded-2xl border border-black/10 p-5 space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">psychology</span>
                </div>
                <h4 className="font-extrabold text-base text-[#1F2A22]">Sesi Konsultasi & Zoom</h4>
                <p className="text-xs text-[#5B6660] leading-relaxed">
                  Booking sesi diskusi langsung secara 1-on-1 bersama para pakar AMDAL, UKL-UPL, dan perizinan lingkungan.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/jadwal')}
                  className="w-full bg-emerald-700 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors"
                >
                  Jadwal & Booking Konsultasi
                </button>
              </div>
            </div>

            {/* 4. Top Up Point */}
            <div className="bg-white rounded-2xl border border-black/10 p-5 space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">monetization_on</span>
                </div>
                <h4 className="font-extrabold text-base text-[#1F2A22]">Top Up Saldo Point</h4>
                <p className="text-xs text-[#5B6660] leading-relaxed">
                  Isi saldo point akun Anda untuk pembayaran konsultasi instan tanpa perlu transfer berulang kali.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/top-up')}
                  className="w-full bg-amber-600 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  Isi Saldo Point
                </button>
              </div>
            </div>

            {/* 5. Publikasi Berita */}
            <div className="bg-white rounded-2xl border border-black/10 p-5 space-y-3 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all sm:col-span-2">
              <div className="space-y-2">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-700 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[28px]">newspaper</span>
                </div>
                <h4 className="font-extrabold text-base text-[#1F2A22]">Publikasi Berita</h4>
                <p className="text-xs text-[#5B6660] leading-relaxed">
                  Pasang berita dan informasi terpercaya di portal resmi TenagaAhli dengan tarif terjangkau Rp 10.000 / minggu untuk meningkatkan eksposur dan keterbacaan publik.
                </p>
              </div>
              <div className="pt-2 flex items-center gap-2 max-w-xs">
                <button
                  type="button"
                  onClick={() => navigate('/kelola-berita')}
                  className="w-full bg-purple-700 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-purple-800 transition-colors cursor-pointer"
                >
                  Tulis & Pasang Berita
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════ */}
      {/* TAB 3: RIWAYAT SEMUA TRANSAKSI                                         */}
      {/* ══════════════════════════════════════════════════════════════════════ */}
      {tab === 'history' && (
        <div className="space-y-5">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            {[
              { id: 'all',          label: 'Semua Riwayat' },
              { id: 'package',      label: 'Paket Membership' },
              { id: 'product',      label: 'Produk Digital' },
              { id: 'consultation', label: 'Konsultasi' },
              { id: 'topup',        label: 'Top Up Point' },
              { id: 'berita',       label: 'Publikasi Berita' },
            ].map(pill => (
              <button
                key={pill.id}
                onClick={() => setCategoryFilter(pill.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  categoryFilter === pill.id
                    ? 'bg-[#8B4513] text-white shadow-xs'
                    : 'bg-white text-[#5B6660] border border-black/10 hover:border-[#8B4513]/40'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/5 p-12 text-center">
              <span className="material-symbols-outlined text-5xl text-[#5B6660]/30 block mb-3">receipt_long</span>
              <p className="text-sm font-semibold text-[#5B6660]">Belum ada riwayat transaksi pada kategori ini.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((h, idx) => (
                <div key={`${h.category}-${h.id}-${idx}`} className="bg-white rounded-2xl border border-black/10 p-4 sm:p-5 shadow-2xs hover:border-[#8B4513]/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={h.category} />
                      <span className="font-mono text-[11px] text-[#5B6660]">{h.reference_code}</span>
                    </div>
                    <p className="font-bold text-[#1F2A22] text-sm">{h.title}</p>
                    <p className="text-[11px] text-[#5B6660]">
                      {h.date ? new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-black/5">
                    <div className="text-left sm:text-right">
                      <span className="font-black text-[#8B4513] text-sm sm:text-base block">{formatRupiah(h.amount)}</span>
                      <StatusBadge status={h.status} />
                    </div>

                    {h.invoiceUrl && (
                      <button
                        type="button"
                        onClick={() => navigate(h.invoiceUrl)}
                        className="p-2 text-[#5B6660] hover:text-[#8B4513] hover:bg-black/5 rounded-xl transition-colors cursor-pointer"
                        title="Lihat Invoice"
                      >
                        <span className="material-symbols-outlined text-[20px]">receipt_long</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
