import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/client.js';
import coinImg from '../assets/coin.png';
import { OFFICIAL_BANK_ACCOUNTS, PT_COMPANY_NAME } from '../constants/bankAccounts.js';
import ManualPaymentInstruction from '../components/ManualPaymentInstruction.jsx';

const CAT_LABEL = {
  book: 'Buku / E-Book',
  template: 'Template & Dokumen',
  course: 'Kursus Online',
  presentation: 'Presentasi PPT',
  article: 'Artikel & Riset',
  software: 'Software & Tools',
  cv: 'CV / Resume',
  other: 'Produk Digital',
};

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

export default function CheckoutProduk() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [alreadyPurchased, setAlreadyPurchased] = useState(null);

  // Payment method: 'manual' (rekomendasi) | 'midtrans' | 'points'
  const [paymentType, setPaymentType] = useState('manual');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Manual Transfer States
  const [selectedBankId, setSelectedBankId] = useState('qris');
  const [proofFile, setProofFile] = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [proofUploaded, setProofUploaded] = useState(false);
  const fileInputRef = useRef(null);

  const copyToClipboard = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const selectedBank = OFFICIAL_BANK_ACCOUNTS.find((b) => b.id === selectedBankId) || OFFICIAL_BANK_ACCOUNTS[0];

  const handleProductProofChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file bukti maksimal 5MB.');
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

  const handleUploadProductProof = async () => {
    if (!orderData?.reference_code) {
      setError('Data referensi pesanan tidak ditemukan.');
      return;
    }
    if (!proofFile) {
      setError('Silakan pilih file bukti transfer terlebih dahulu.');
      return;
    }

    setUploadingProof(true);
    setError('');

    const formData = new FormData();
    formData.append('proof', proofFile);

    try {
      await api.post(`/orders/${orderData.reference_code}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setProofUploaded(true);
      fetchPurchases();
    } catch (err) {
      console.error('Error uploading product payment proof:', err);
      setError(err.response?.data?.message || 'Gagal mengunggah bukti transfer. Pastikan format file sesuai.');
    } finally {
      setUploadingProof(false);
    }
  };

  // Stepper state: 1 = Review & Pay, 2 = Pending Midtrans, 3 = Completed
  const [currentStep, setCurrentStep] = useState(1);
  const [orderData, setOrderData] = useState(null);
  const [quantity, setQuantity] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const q = parseInt(params.get('qty'), 10);
    return q > 0 ? q : 1;
  });

  // --- Shipping State for Physical Products (RajaOngkir) ---
  const [originInfo, setOriginInfo] = useState({
    city_name: 'Bandung',
    province_name: 'Jawa Barat',
    label: 'Kota Bandung, Jawa Barat (Gudang/Penjual)',
  });
  const [recipientName, setRecipientName] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [destSearch, setDestSearch] = useState('');
  const [destOptions, setDestOptions] = useState([]);
  const [selectedDest, setSelectedDest] = useState(null);
  const [loadingDest, setLoadingDest] = useState(false);
  const [showDestDropdown, setShowDestDropdown] = useState(false);
  const [courierOptions, setCourierOptions] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState(null);
  const [calculatingOngkir, setCalculatingOngkir] = useState(false);

  const destWrapperRef = useRef(null);

  const fetchPurchases = async () => {
    try {
      const purchasesRes = await api.get('/my/purchases').catch(() => ({ data: [] }));
      if (Array.isArray(purchasesRes.data)) {
        const existing = purchasesRes.data.find(
          (p) => String(p.product_id) === String(id) || String(p.product?.id) === String(id)
        );
        if (existing) {
          setAlreadyPurchased(existing);
        }
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const userRaw = localStorage.getItem('amdal_user');
    if (!userRaw) {
      navigate('/signin?redirect=' + encodeURIComponent(`/checkout/${id}`));
      return;
    }

    try {
      const parsed = JSON.parse(userRaw);
      setUser(parsed);
      setRecipientName(parsed.name || '');
      setRecipientPhone(parsed.phone || '');
    } catch {
      navigate('/signin');
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      try {
        const prodRes = await api.get(`/products/${id}`);
        const p = prodRes.data;
        setProduct(p);

        if (p?.origin_city) {
          setOriginInfo({
            id: p.origin_id || 4816,
            city_name: p.origin_city,
            province_name: p.origin_province || '',
            subdistrict_name: p.origin_subdistrict || '',
            label: p.origin_label || `${p.origin_city}, ${p.origin_province || ''} (Gudang Penjual)`,
            address: p.origin_address || '',
          });
        }

        const params = new URLSearchParams(window.location.search);
        const q = parseInt(params.get('qty'), 10) || 1;
        if (p.stock !== null && p.stock !== undefined) {
          if (p.stock <= 0) {
            setQuantity(0);
          } else {
            setQuantity(Math.min(p.stock, Math.max(1, q)));
          }
        } else {
          setQuantity(Math.max(1, q));
        }

        const urlRef = params.get('ref') || params.get('order_id');
        const urlPayment = params.get('payment') || params.get('transaction_status');
        if (urlRef) {
          try {
            await api.get(`/payment/check-status/${urlRef}`);
          } catch (e) {
            console.error('Check payment status error:', e);
          }
          const purchaseRes = await api.get('/my/purchases').catch(() => ({ data: [] }));
          const list = Array.isArray(purchaseRes.data) ? purchaseRes.data : (purchaseRes.data?.data || []);
          setPurchases(list);
          const found = list.find((item) => item.reference_code === urlRef);
          if (found) {
            setOrderData(found);
            if (found.status === 'completed' || found.status === 'approved' || urlPayment === 'success' || urlPayment === 'settlement' || urlPayment === 'capture') {
              setCurrentStep(3);
            } else {
              setCurrentStep(2);
            }
          }
        } else {
          await fetchPurchases();
        }
        setError('');
      } catch (err) {
        console.error('Failed to load product for checkout:', err);
        setError('Produk tidak ditemukan atau tidak tersedia.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // Click outside listener for destination dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (destWrapperRef.current && !destWrapperRef.current.contains(event.target)) {
        setShowDestDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search for RajaOngkir destinations
  useEffect(() => {
    if (!destSearch || destSearch.trim().length < 2) {
      setDestOptions([]);
      return;
    }

    if (selectedDest && destSearch === selectedDest.label) {
      return;
    }

    const timer = setTimeout(async () => {
      setLoadingDest(true);
      try {
        const res = await api.get('/shipping/destinations', {
          params: { search: destSearch.trim(), limit: 8 },
        });
        setDestOptions(res.data?.data || []);
        setShowDestDropdown(true);
      } catch (e) {
        console.error('Search destination error:', e);
      } finally {
        setLoadingDest(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [destSearch, selectedDest]);

  // Calculate Ongkir when destination is selected
  const handleSelectDestination = async (dest) => {
    setSelectedDest(dest);
    setDestSearch(dest.label);
    setShowDestDropdown(false);
    setSelectedCourier(null);
    setCourierOptions([]);
    setCalculatingOngkir(true);

    try {
      const weight = (product?.weight || 1000) * quantity;
      const res = await api.post('/shipping/calculate', {
        destination_id: dest.id,
        weight: weight,
        origin_id: product?.origin_id || undefined,
        origin_city: product?.origin_city || undefined,
        origin_province: product?.origin_province || undefined,
        origin_label: product?.origin_label || undefined,
      });

      if (res.data?.origin) {
        setOriginInfo(res.data.origin);
      }

      const options = res.data?.data || [];
      setCourierOptions(options);

      // Auto select standard service if available (e.g. REG)
      if (options.length > 0) {
        const defaultSrv = options.find((c) => c.service === 'REG') || options[0];
        setSelectedCourier(defaultSrv);
      }
    } catch (e) {
      console.error('Failed to calculate shipping cost:', e);
      setError('Gagal menghitung ongkos kirim. Silakan pilih lokasi tujuan kembali.');
    } finally {
      setCalculatingOngkir(false);
    }
  };

  const formatEtd = (etd) => {
    if (!etd) return null;
    const str = String(etd).trim();
    if (str === '0' || str === '0 day' || str === '0 hari' || str === '0-0') {
      return 'Hari ini (Same Day)';
    }
    const cleaned = str.replace(/\b(days?|hari|jam|hours?)\b/gi, '').trim();
    if (!cleaned) return str;
    return `${cleaned} hari`;
  };

  const rupiah = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v || 0);

  const hasStockLimit = product?.stock !== null && product?.stock !== undefined;
  const isOutOfStock = hasStockLimit && product?.stock <= 0;
  const maxStock = hasStockLimit ? Math.max(0, product.stock) : 999;

  const finalPrice = product?.discount_price ?? product?.price ?? 0;
  const originalPrice = product?.price ?? 0;
  const discountPct =
    product?.discount_price && originalPrice > product.discount_price
      ? Math.round((1 - product.discount_price / originalPrice) * 100)
      : 0;
  const isPhysical = product && !product.is_digital;
  const totalProductPrice = finalPrice * quantity;
  const totalOriginalPrice = originalPrice * quantity;
  const shippingCost = isPhysical && selectedCourier ? selectedCourier.cost : 0;
  const totalBill = totalProductPrice + shippingCost;
  const pointsRequired = Math.ceil(totalBill / 1000);
  const catLabel = CAT_LABEL[product?.category] ?? (isPhysical ? 'Buku / Produk Fisik' : 'E-Book / Produk Digital');
  const authorName = product?.author || product?.expert?.name || 'Tenaga Ahli';

  const handleQuantityChange = async (newQty) => {
    const clamped = Math.max(1, Math.min(maxStock, newQty));
    setQuantity(clamped);

    // If destination is already selected for physical products, recalculate ongkir with updated weight
    if (isPhysical && selectedDest) {
      setCalculatingOngkir(true);
      try {
        const weight = (product?.weight || 1000) * clamped;
        const res = await api.post('/shipping/calculate', {
          destination_id: selectedDest.id,
          weight: weight,
          origin_id: product?.origin_id || undefined,
          origin_city: product?.origin_city || undefined,
          origin_province: product?.origin_province || undefined,
          origin_label: product?.origin_label || undefined,
        });

        if (res.data?.origin) {
          setOriginInfo(res.data.origin);
        }

        const options = res.data?.data || [];
        setCourierOptions(options);

        if (options.length > 0) {
          const currentService = selectedCourier?.service;
          const matched = options.find((c) => c.service === currentService) || options[0];
          setSelectedCourier(matched);
        }
      } catch (e) {
        console.error('Failed to recalculate shipping cost:', e);
      } finally {
        setCalculatingOngkir(false);
      }
    }
  };

  const triggerSnapPayment = async (snapToken, order) => {
    await loadMidtransSnap();
    if (!window.snap) {
      setError('Gagal memuat popup Midtrans. Periksa koneksi internet Anda.');
      return;
    }

    const refCode = order?.reference_code;

    window.snap.pay(snapToken, {
      onSuccess: async function (result) {
        console.log('Product purchase Midtrans success:', result);
        try {
          if (refCode) {
            await api.get(`/payment/check-status/${refCode}`);
          }
        } catch (e) {
          console.error('Product purchase sync error:', e);
        }
        setOrderData({
          ...order,
          status: 'completed',
          product_title: product?.title,
        });
        setCurrentStep(3);
        fetchPurchases();
      },
      onPending: async function (result) {
        console.log('Product purchase Midtrans pending:', result);
        try {
          if (refCode) {
            await api.get(`/payment/check-status/${refCode}`);
          }
        } catch (e) {
          console.error('Product purchase sync error:', e);
        }
        setOrderData(order);
        setCurrentStep(2);
      },
      onError: function (result) {
        console.error('Product purchase Midtrans error:', result);
        setError('Pembayaran gagal atau dibatalkan.');
      },
      onClose: function () {
        console.log('Product purchase Midtrans closed');
        setOrderData(order);
        setCurrentStep(2);
      },
    });
  };

  const handleProceedPayment = async () => {
    if (!product || !user) return;

    setError('');

    if (isOutOfStock) {
      setError('Stok produk ini telah habis. Anda tidak dapat melanjutkan pembelian.');
      return;
    }

    if (hasStockLimit && quantity > product.stock) {
      setError(`Jumlah pembelian (${quantity}) melebihi stok yang tersedia (${product.stock} stok).`);
      return;
    }

    // If Physical Product, validate shipping information
    if (isPhysical) {
      if (!recipientName.trim()) {
        setError('Mohon lengkapi Nama Penerima pengiriman.');
        return;
      }
      if (!recipientPhone.trim()) {
        setError('Mohon lengkapi Nomor Telepon / WhatsApp Penerima.');
        return;
      }
      if (!selectedDest) {
        setError('Mohon cari dan pilih Kota/Kecamatan Tujuan pengiriman (RajaOngkir).');
        return;
      }
      if (!shippingAddress.trim()) {
        setError('Mohon isi Alamat Lengkap pengiriman (Nama Jalan, No. Rumah, RT/RW).');
        return;
      }
      if (!selectedCourier) {
        setError('Mohon pilih Layanan Kurir Pengiriman.');
        return;
      }
    }

    setProcessingPayment(true);

    // If paying with points
    if (paymentType === 'points') {
      if ((user.point_balance || 0) < pointsRequired) {
        setError(
          `Point tidak mencukupi. Anda memiliki ${user.point_balance || 0} Point, diperlukan ${pointsRequired} Point.`
        );
        setProcessingPayment(false);
        return;
      }

      try {
        const pointPayload = {
          payment_method: 'points',
          quantity: quantity,
        };

        if (isPhysical) {
          pointPayload.recipient_name = recipientName;
          pointPayload.recipient_phone = recipientPhone;
          pointPayload.destination_id = selectedDest.id;
          pointPayload.destination_label = selectedDest.label;
          pointPayload.shipping_address = shippingAddress;
          pointPayload.courier_name = `${selectedCourier.name} (${selectedCourier.service})`;
          pointPayload.courier_service = selectedCourier.service;
          pointPayload.shipping_cost = shippingCost;
        }

        await api.post(`/products/${product.id}/buy`, pointPayload);
        setCurrentStep(3);
        setOrderData({
          status: 'completed',
          product_title: (quantity > 1 ? `(${quantity}x) ` : '') + product.title,
          points_spent: pointsRequired,
          recipient_name: recipientName,
          shipping_address: shippingAddress,
          courier_name: selectedCourier ? `${selectedCourier.name} (${selectedCourier.service})` : null,
          shipping_cost: shippingCost,
        });
        fetchPurchases();
      } catch (err) {
        const msg = err.response?.data?.message || 'Gagal memproses pembelian dengan Point.';
        setError(msg);
      } finally {
        setProcessingPayment(false);
      }
      return;
    }

    // Midtrans or Manual Bank Transfer Payment
    try {
      const payload = {
        product_id: product.id,
        quantity: quantity,
        payment_method: paymentType === 'manual' ? 'manual' : 'midtrans',
      };

      if (isPhysical) {
        payload.recipient_name = recipientName;
        payload.recipient_phone = recipientPhone;
        payload.destination_id = selectedDest.id;
        payload.destination_label = selectedDest.label;
        payload.shipping_address = shippingAddress;
        payload.courier_name = `${selectedCourier.name} (${selectedCourier.service})`;
        payload.courier_service = selectedCourier.service;
        payload.shipping_cost = shippingCost;
      }

      const res = await api.post('/orders', payload);
      const data = res.data;
      setOrderData(data);

      if (paymentType === 'manual') {
        setCurrentStep(2);
      } else if (data?.snap_token) {
        await triggerSnapPayment(data.snap_token, data);
      } else {
        setCurrentStep(2);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal membuat pesanan. Silakan coba lagi.';
      setError(msg);
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAFBF9] px-4 py-20">
        <div className="w-12 h-12 rounded-full border-4 border-[#8B4513]/30 border-t-[#8B4513] animate-spin mb-4" />
        <p className="text-sm font-bold text-gray-600">Menyiapkan halaman checkout produk...</p>
      </div>
    );
  }

  if (error && !product) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center bg-[#FAFBF9] px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
          <span className="material-symbols-outlined text-[36px]">error_outline</span>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Produk Tidak Ditemukan</h2>
        <p className="text-sm text-gray-500 max-w-md mb-6">{error}</p>
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[#8B4513] text-white font-bold text-sm hover:bg-[#6B3410] transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Kembali
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#FAFBF9] min-h-screen py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">

        {/* ── Breadcrumb & Back Header ──────────────────────────────── */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#8B4513] bg-white border border-gray-200 hover:border-[#8B4513]/40 px-3.5 py-2 rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </button>
          <div className="text-xs font-bold text-gray-400">
            Checkout &bull; {catLabel}
          </div>
        </div>

        {/* ── Error Banner ───────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl px-5 py-4 mb-6 flex items-start gap-3 shadow-xs">
            <span className="material-symbols-outlined text-[22px] text-red-600 mt-0.5 shrink-0">error</span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-red-800">Perhatian</p>
              <p className="text-sm text-red-700 font-medium mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* ── Already Purchased Notice ───────────────────────────────── */}
        {alreadyPurchased && currentStep === 1 && (
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-5 mb-6 shadow-xs">
            <div className="flex items-start gap-3">
              <span className="material-symbols-outlined text-[24px] text-amber-600 shrink-0">info</span>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-900">
                  {alreadyPurchased.status === 'completed' || alreadyPurchased.status === 'approved' || alreadyPurchased.status === 'paid'
                    ? 'Anda telah memiliki dan membeli produk ini!'
                    : 'Anda memiliki pesanan sebelumnya untuk produk ini!'}
                </p>
                <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                  Status pesanan sebelumnya:{' '}
                  <strong className="uppercase">{alreadyPurchased.status || 'Aktif'}</strong> (Ref: {alreadyPurchased.reference_code || `ORD-${alreadyPurchased.id}`}).
                  {alreadyPurchased.status === 'completed' || alreadyPurchased.status === 'approved' || alreadyPurchased.status === 'paid'
                    ? ' Anda dapat langsung mengunduh berkas atau melihatnya di akun Anda.'
                    : ' Silakan selesaikan pembayaran sebelumnya atau lanjutkan formulir di bawah jika ingin membuat pesanan baru.'}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3">
                  {alreadyPurchased.snap_token && (alreadyPurchased.status === 'pending_payment' || alreadyPurchased.status === 'pending' || alreadyPurchased.status === 'menunggu_pembayaran') && (
                    <button
                      type="button"
                      onClick={() => triggerSnapPayment(alreadyPurchased.snap_token, alreadyPurchased)}
                      className="inline-flex items-center gap-1 text-xs font-bold bg-[#8B4513] hover:bg-[#6B3410] text-white px-4 py-2 rounded-xl transition-colors shadow-xs"
                    >
                      <span className="material-symbols-outlined text-[15px]">payment</span>
                      <span>Bayar Pesanan Sebelumnya</span>
                    </button>
                  )}

                  <Link
                    to="/pesanan-saya"
                    className="inline-flex items-center gap-1 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-xl transition-colors shadow-xs"
                  >
                    <span className="material-symbols-outlined text-[15px]">menu_book</span>
                    <span>Buka Menu Pesanan Saya</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 1: REVIEW PRODUK, ALAMAT ONGKIR & PILIH METODE                       */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <div className="space-y-6">

            {/* 1. Ringkasan Produk */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 sm:p-7">
              <h2 className="text-xs font-bold text-[#8FA0B5] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#8B4513]">inventory_2</span>
                Ringkasan Produk
              </h2>

              <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 pb-6 border-b border-gray-100">
                <div className="w-full sm:w-32 aspect-[4/3] sm:h-28 rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 shrink-0 relative">
                  {product.image_url || product.image ? (
                    <img
                      src={product.image_url || product.image}
                      alt={product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-amber-50 text-[#8B4513]">
                      <span className="material-symbols-outlined text-[36px]">menu_book</span>
                    </div>
                  )}
                  {discountPct > 0 && (
                    <div className="absolute top-2 right-2 bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-xs uppercase">
                      -{discountPct}%
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8B4513] bg-[#8B4513]/10 px-2 py-0.5 rounded-md">
                        {catLabel}
                      </span>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <span className="material-symbols-outlined text-[12px]">
                          {product.is_digital ? 'devices' : 'local_shipping'}
                        </span>
                        {product.is_digital ? 'Format Digital (Unduh)' : 'Format Fisik (Dikirim)'}
                      </span>
                      {isPhysical && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          Berat Total: {(product.weight || 1000) * quantity} gr
                        </span>
                      )}
                      {hasStockLimit && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                          isOutOfStock 
                            ? 'bg-red-50 text-red-700 border border-red-200' 
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                          <span className="material-symbols-outlined text-[12px]">inventory_2</span>
                          {isOutOfStock ? 'Stok Habis' : `Tersedia ${product.stock} stok`}
                        </span>
                      )}
                    </div>

                    <h1 className="text-base sm:text-lg font-bold text-[#0F172A] leading-snug">
                      {product.title}
                    </h1>

                    <p className="text-xs text-gray-500 mt-1">
                      Karya: <strong className="text-gray-700 font-semibold">{authorName}</strong>
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-100">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl sm:text-2xl font-black text-[#008A62]">
                        {rupiah(finalPrice)}
                      </span>
                      {discountPct > 0 && (
                        <span className="text-xs text-gray-400 line-through font-medium">
                          {rupiah(originalPrice)}
                        </span>
                      )}
                      <span className="text-xs text-gray-500 font-medium">/ pcs</span>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-gray-600">Jumlah:</span>
                      <div className="flex items-center border border-gray-200 rounded-xl bg-gray-50 p-1 shadow-inner">
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(quantity - 1)}
                          disabled={quantity <= 1 || isOutOfStock}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={maxStock}
                          value={quantity}
                          disabled={isOutOfStock}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            if (!isNaN(val)) handleQuantityChange(val);
                          }}
                          className="w-12 text-center text-xs font-bold text-gray-900 bg-transparent focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => handleQuantityChange(quantity + 1)}
                          disabled={quantity >= maxStock || isOutOfStock}
                          className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-700 font-bold hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-sm active:scale-95"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  {hasStockLimit && quantity >= maxStock && !isOutOfStock && (
                    <p className="text-[11px] text-amber-600 font-medium mt-1 text-right">
                      Maksimal pembelian {maxStock} item (sesuai stok tersedia)
                    </p>
                  )}
                </div>
              </div>

              {/* Rincian Harga & Ongkir */}
              <div className="pt-4 space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Harga Satuan ({quantity}x)</span>
                  <span className={discountPct > 0 ? 'line-through text-gray-400' : 'font-semibold text-gray-800'}>
                    {rupiah(originalPrice * quantity)}
                  </span>
                </div>
                {discountPct > 0 && (
                  <div className="flex justify-between text-red-600 font-medium">
                    <span>Potongan Diskon ({discountPct}%)</span>
                    <span>- {rupiah((originalPrice - finalPrice) * quantity)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-700 font-medium">
                  <span>Subtotal Produk</span>
                  <span className="font-bold text-gray-900">{rupiah(totalProductPrice)}</span>
                </div>
                {isPhysical && (
                  <div className="flex justify-between text-gray-600">
                    <span className="flex items-center gap-1">
                      <span>Ongkos Kirim (RajaOngkir)</span>
                      {selectedCourier && (
                        <span className="text-[11px] font-bold text-[#8B4513]">
                          ({selectedCourier.code?.toUpperCase()} {selectedCourier.service})
                        </span>
                      )}
                    </span>
                    <span className="font-bold text-gray-800">
                      {selectedCourier ? rupiah(shippingCost) : 'Pilih Kurir di Bawah'}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Biaya Layanan Platform</span>
                  <span className="font-semibold text-green-600">GRATIS</span>
                </div>
                <div className="flex justify-between items-center pt-3 border-t border-gray-200 text-sm sm:text-base font-black text-gray-900">
                  <span>Total Tagihan</span>
                  <span className="text-xl sm:text-2xl text-[#008A62]">{rupiah(totalBill)}</span>
                </div>
              </div>
            </div>

            {/* 2. FORM PENGIRIMAN & ONGKIR (KHUSUS PRODUK FISIK) */}
            {isPhysical && (
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 sm:p-7 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h2 className="text-xs font-bold text-[#8FA0B5] uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[#8B4513]">local_shipping</span>
                    Informasi Pengiriman (RajaOngkir)
                  </h2>
                  <span className="text-[11px] font-bold bg-[#8B4513]/10 text-[#8B4513] px-2.5 py-0.5 rounded-full">
                    Otomatis 24/7
                  </span>
                </div>

                {/* Rute Pengiriman Visual: Asal -> Tujuan */}
                <div className="bg-[#FAFBF9] rounded-2xl border border-black/5 p-3.5 sm:p-4">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2.5 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px] text-[#8B4513]">route</span>
                    Rute Pengiriman & Berat Paket
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">store</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Dikirim Dari (Gudang Asal)</span>
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {product?.origin_city
                            ? `${product.origin_city}, ${product.origin_province || ''}`
                            : `${originInfo?.city_name || 'Kota Bandung'}, ${originInfo?.province_name || 'Jawa Barat'}`}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          {product?.origin_address || product?.origin_label || originInfo?.label || 'Gudang Penjual / Tenaga Ahli'}
                        </p>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-2.5 border border-gray-100 flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-[14px]">pin_drop</span>
                      </div>
                      <div className="min-w-0">
                        <span className="text-[10px] uppercase font-bold text-gray-400 block">Tujuan Pengiriman</span>
                        <p className="text-xs font-bold text-gray-800 truncate">
                          {selectedDest ? `${selectedDest.district_name || selectedDest.subdistrict_name || ''}, ${selectedDest.city_name}` : 'Pilih tujuan di form bawah'}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          Total Berat: {(((product?.weight || 1000) * quantity) / 1000).toFixed(1)} kg ({((product?.weight || 1000) * quantity).toLocaleString('id-ID')} gr)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Nama & Telepon Penerima */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                      Nama Penerima <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      placeholder="Nama lengkap penerima paket"
                      className="w-full bg-[#FAFBF9] border border-black/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                      No. Telepon / WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={recipientPhone}
                      onChange={(e) => setRecipientPhone(e.target.value)}
                      placeholder="0812xxxxxxxx"
                      className="w-full bg-[#FAFBF9] border border-black/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
                    />
                  </div>
                </div>

                {/* Autocomplete Cari Kota / Kecamatan Tujuan */}
                <div ref={destWrapperRef} className="relative">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Kota / Kecamatan Tujuan (RajaOngkir) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={destSearch}
                      onChange={(e) => {
                        setDestSearch(e.target.value);
                        setSelectedDest(null);
                      }}
                      onFocus={() => {
                        if (destOptions.length > 0) setShowDestDropdown(true);
                      }}
                      placeholder="Ketik nama Kota atau Kecamatan (contoh: Bandung Kidul, Jakarta Selatan, dll)"
                      className="w-full bg-[#FAFBF9] border border-black/10 rounded-xl pl-10 pr-10 py-2.5 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-2.5 text-[20px] text-gray-400 pointer-events-none">
                      search
                    </span>
                    {loadingDest && (
                      <span className="w-4 h-4 border-2 border-[#8B4513]/30 border-t-[#8B4513] rounded-full animate-spin absolute right-3 top-3 pointer-events-none" />
                    )}
                  </div>

                  {/* Dropdown Options */}
                  {showDestDropdown && destOptions.length > 0 && (
                    <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto divide-y divide-gray-100">
                      {destOptions.map((dest) => (
                        <div
                          key={dest.id}
                          onClick={() => handleSelectDestination(dest)}
                          className="p-3 hover:bg-[#FFF8F4] transition-colors cursor-pointer text-xs flex items-start gap-2.5"
                        >
                          <span className="material-symbols-outlined text-[18px] text-[#8B4513] mt-0.5 shrink-0">
                            location_on
                          </span>
                          <div>
                            <p className="font-bold text-gray-900 leading-snug">
                              {dest.district_name || dest.subdistrict_name}, {dest.city_name}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">{dest.label}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Alamat Lengkap */}
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">
                    Alamat Lengkap Pengiriman <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={shippingAddress}
                    onChange={(e) => setShippingAddress(e.target.value)}
                    placeholder="Nama Jalan, Nomor Rumah, RT/RW, Patokan / Detail Gedung..."
                    className="w-full bg-[#FAFBF9] border border-black/10 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
                  />
                </div>

                {/* Pilihan Kurir & Layanan RajaOngkir */}
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2 flex items-center justify-between">
                    <span>Pilihan Ekspedisi & Layanan Kurir</span>
                    {calculatingOngkir && (
                      <span className="text-[#8B4513] font-bold text-xs flex items-center gap-1">
                        <span className="w-3.5 h-3.5 border-2 border-[#8B4513]/30 border-t-[#8B4513] rounded-full animate-spin" />
                        Menghitung Ongkir...
                      </span>
                    )}
                  </label>

                  {!selectedDest ? (
                    <div className="bg-[#FAFBF9] rounded-2xl border border-dashed border-gray-300 p-4 text-center text-xs text-gray-500">
                      Pilih Kota/Kecamatan tujuan di atas untuk melihat pilihan kurir (JNE, POS, SiCepat, dll).
                    </div>
                  ) : courierOptions.length === 0 && !calculatingOngkir ? (
                    <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4 text-center text-xs text-amber-800">
                      Tidak ditemukan layanan pengiriman untuk tujuan ini.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {courierOptions.map((courier, idx) => {
                        const isSelected =
                          selectedCourier?.code === courier.code && selectedCourier?.service === courier.service;
                        return (
                          <div
                            key={idx}
                            onClick={() => setSelectedCourier(courier)}
                            className={`p-3 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-[#8B4513] bg-[#FFF8F4] ring-2 ring-[#8B4513]/10 shadow-xs'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            }`}
                          >
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-xs text-gray-900 uppercase">
                                  {courier.code} - {courier.service}
                                </span>
                                {courier.etd && (
                                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-medium">
                                    {courier.etd}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">
                                {courier.description || courier.name}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="font-black text-sm text-[#008A62]">{rupiah(courier.cost)}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Pilihan Metode Pembayaran */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-5 sm:p-7">
              <h2 className="text-xs font-bold text-[#8FA0B5] uppercase tracking-wider mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-[#8B4513]">payments</span>
                Pilih Metode Pembayaran
              </h2>

              <div className="space-y-3">
                {/* Opsi 1: Transfer Bank Manual & QRIS (Direkomendasikan) */}
                <div
                  onClick={() => setPaymentType('manual')}
                  className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    paymentType === 'manual'
                      ? 'border-[#8B4513] bg-amber-50/30 ring-2 ring-[#8B4513]/10'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="absolute -top-2.5 right-4 z-10">
                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-[#8B4513] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                      ★ Direkomendasikan
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">account_balance</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">Transfer Manual & QRIS (Mandiri, BCA, BNI, QRIS)</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          Transfer langsung ke rekening resmi atau scan QRIS Gopay Merchant resmi bebas admin.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                        paymentType === 'manual' ? 'border-[#8B4513] bg-[#8B4513]' : 'border-gray-300'
                      }`}
                    >
                      {paymentType === 'manual' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>

                  {paymentType === 'manual' && (
                    <div className="mt-4 pt-3 border-t border-amber-900/10" onClick={(e) => e.stopPropagation()}>
                      <ManualPaymentInstruction
                        selectedBankId={selectedBankId}
                        onSelectBank={setSelectedBankId}
                      />
                    </div>
                  )}
                </div>

                {/* Opsi 2: Midtrans Payment Gateway */}
                <div
                  onClick={() => setPaymentType('midtrans')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    paymentType === 'midtrans'
                      ? 'border-[#8B4513] bg-amber-50/30 ring-2 ring-[#8B4513]/10'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[22px]">credit_card</span>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Midtrans Payment Gateway (Otomatis & Instan)</p>
                        <p className="text-xs text-gray-500">
                          Virtual Account (BCA, BNI, BRI), GoPay, ShopeePay & Kartu Kredit.
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                        paymentType === 'midtrans' ? 'border-[#8B4513] bg-[#8B4513]' : 'border-gray-300'
                      }`}
                    >
                      {paymentType === 'midtrans' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>

                {/* Opsi 3: Potong Saldo Points */}
                <div
                  onClick={() => setPaymentType('points')}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    paymentType === 'points'
                      ? 'border-[#8B4513] bg-amber-50/30 ring-2 ring-[#8B4513]/10'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-amber-50/70 p-1 flex items-center justify-center shrink-0">
                        <img src={coinImg} alt="Coin" className="w-8 h-8 object-contain drop-shadow-xs" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-gray-900">Bayar dengan Saldo Point</p>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                            Saldo: {user?.point_balance ?? 0} Point
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">
                          Memerlukan <strong className="text-gray-800 font-bold">{pointsRequired} Point</strong> (1 Point =
                          Rp 1.000). Transaksi langsung lunas instan!
                        </p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                        paymentType === 'points' ? 'border-[#8B4513] bg-[#8B4513]' : 'border-gray-300'
                      }`}
                    >
                      {paymentType === 'points' && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tombol Lanjut Bayar */}
            <button
              type="button"
              onClick={handleProceedPayment}
              disabled={processingPayment || isOutOfStock}
              className="w-full flex items-center justify-center gap-2 py-4 px-6 bg-[#8B4513] hover:bg-[#6B3410] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold text-base rounded-2xl transition-all shadow-md cursor-pointer"
            >
              {isOutOfStock ? (
                <>
                  <span className="material-symbols-outlined text-[20px]">remove_shopping_cart</span>
                  Stok Produk Habis
                </>
              ) : processingPayment ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Menyiapkan Pembayaran...
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[20px]">payments</span>
                  {paymentType === 'points'
                    ? `Beli Sekarang (${pointsRequired} Point)`
                    : `Bayar Sekarang (${rupiah(totalBill)})`}
                </>
              )}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: MENUNGGU PEMBAYARAN (MIDTRANS / TRANSFER MANUAL)                  */}
        {/* ========================================================================= */}
        {currentStep === 2 && orderData && (
          <div className="space-y-6">
            {orderData.payment_method === 'manual' || paymentType === 'manual' ? (
              proofUploaded ? (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 text-center animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <span className="material-symbols-outlined text-[36px]">hourglass_top</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Bukti Pembayaran Berhasil Dikirim!</h2>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2 max-w-md mx-auto leading-relaxed">
                    Terima kasih, bukti transfer untuk pesanan Anda telah kami terima dan sedang dalam antrean verifikasi oleh Tim Admin (maks. 1x24 jam kerja).
                  </p>
                  <div className="bg-[#FAFBF9] rounded-2xl border border-gray-200 p-4 max-w-sm mx-auto my-5 text-xs text-left space-y-1.5">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Nomor Pesanan:</span>
                      <span className="font-mono font-bold text-gray-900">{orderData.reference_code}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Status:</span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">Menunggu Verifikasi</span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                    <Link
                      to="/pesanan-saya"
                      className="flex-1 bg-[#8B4513] hover:bg-[#6B3410] text-white py-3.5 px-6 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
                    >
                      <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                      Lihat Pesanan Saya
                    </Link>
                    <Link
                      to={`/invoice/${orderData.reference_code}`}
                      className="border border-gray-300 hover:bg-gray-50 text-gray-700 py-3.5 px-5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[18px]">receipt</span>
                      Lihat Invoice
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 space-y-5 animate-fadeIn">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                    <div className="w-12 h-12 rounded-2xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[26px]">account_balance</span>
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Instruksi Pembayaran Transfer Bank Manual</h2>
                      <p className="text-xs text-gray-500">
                        Transfer sejumlah nominal di bawah ini lalu unggah foto struk / bukti transfer.
                      </p>
                    </div>
                  </div>

                  {/* Ringkasan Jumlah & Kode Pesanan */}
                  <div className="bg-gradient-to-br from-[#FAFBF9] to-amber-50/40 rounded-2xl border border-amber-200/80 p-5 space-y-2.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-500 font-bold">Nomor Pesanan:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-gray-900 text-sm">{orderData.reference_code}</span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(orderData.reference_code, 'ref_checkout')}
                          className="px-2 py-0.5 rounded bg-white border border-gray-300 text-[10px] font-bold text-gray-700"
                        >
                          {copiedField === 'ref_checkout' ? 'Tersalin' : 'Salin'}
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-amber-200/60">
                      <span className="text-gray-700 font-bold text-sm">Total yang Harus Ditransfer:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-base font-black text-[#8B4513]">
                          {rupiah(orderData.amount || totalBill)}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyToClipboard(orderData.amount || totalBill, 'amount_checkout')}
                          className="px-2 py-0.5 rounded bg-white border border-gray-300 text-[10px] font-bold text-gray-700"
                        >
                          {copiedField === 'amount_checkout' ? 'Tersalin' : 'Salin'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Rekening Tujuan / QRIS */}
                  <ManualPaymentInstruction
                    selectedBankId={selectedBankId}
                    onSelectBank={setSelectedBankId}
                    className="mb-4"
                  />

                  {/* Uploader Bukti Transfer */}
                  <div className="space-y-3 pt-2 border-t border-gray-100">
                    <label className="block text-xs font-bold text-gray-800">
                      Unggah Bukti Transfer (JPG, PNG, atau PDF):
                    </label>

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-[#8B4513]/40 rounded-2xl p-5 text-center cursor-pointer hover:bg-amber-50/30 transition-colors"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,application/pdf"
                        onChange={handleProductProofChange}
                        className="hidden"
                      />
                      {proofPreview ? (
                        <div className="flex flex-col items-center gap-2">
                          <img src={proofPreview} alt="Preview Bukti" className="h-32 object-contain rounded-lg border border-gray-200 shadow-2xs" />
                          <span className="text-xs text-[#8B4513] font-bold underline">Ganti File Bukti</span>
                        </div>
                      ) : proofFile ? (
                        <div className="flex items-center justify-center gap-2 text-xs font-bold text-[#1F2A22]">
                          <span className="material-symbols-outlined text-[20px] text-emerald-600">description</span>
                          <span>{proofFile.name}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 text-gray-500">
                          <span className="material-symbols-outlined text-3xl text-[#8B4513]">cloud_upload</span>
                          <p className="text-xs font-semibold">Klik untuk memilih file bukti transfer</p>
                          <p className="text-[10px] text-gray-400">Ukuran maksimal 5MB</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        type="button"
                        onClick={handleUploadProductProof}
                        disabled={uploadingProof || !proofFile}
                        className="flex-1 bg-[#8B4513] hover:bg-[#6B3410] disabled:bg-gray-300 disabled:cursor-not-allowed text-white py-3.5 px-6 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        {uploadingProof ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Mengunggah Bukti…
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">send</span>
                            Kirim Bukti Pembayaran
                          </>
                        )}
                      </button>

                      {orderData.snap_token && (
                        <button
                          type="button"
                          onClick={() => triggerSnapPayment(orderData.snap_token, orderData)}
                          className="border border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513]/5 py-3.5 px-5 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">credit_card</span>
                          Bayar via Midtrans Saja
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            ) : (
              /* Midtrans Step */
              <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-8 text-center animate-fadeIn">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#8B4513] flex items-center justify-center mx-auto mb-3">
                  <span className="material-symbols-outlined text-[32px]">hourglass_top</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Menunggu Pembayaran</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-md mx-auto">
                  Silakan selesaikan pembayaran via popup Midtrans. Setelah pembayaran diverifikasi, pesanan Anda akan segera
                  diproses.
                </p>

                <div className="bg-gradient-to-br from-[#FAFBF9] to-amber-50/40 rounded-2xl border border-amber-200/80 p-5 my-6 max-w-md mx-auto space-y-3 text-left">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold">Kode Pesanan:</span>
                    <span className="font-mono font-bold text-gray-900">{orderData.reference_code}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-bold">Total Pembayaran:</span>
                    <span className="text-base font-black text-[#008A62]">{rupiah(orderData.amount || totalBill)}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                  {orderData.snap_token && (
                    <button
                      type="button"
                      onClick={() => triggerSnapPayment(orderData.snap_token, orderData)}
                      className="flex-1 bg-[#8B4513] hover:bg-[#6B3410] text-white py-3.5 px-6 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">credit_card</span>
                      Buka Popup Midtrans
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentStep(1);
                      setOrderData(null);
                    }}
                    className="border border-gray-300 hover:bg-gray-50 text-gray-600 py-3.5 px-5 rounded-xl font-bold text-sm transition-colors cursor-pointer"
                  >
                    Ganti Metode
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: SELESAI                                                           */}
        {/* ========================================================================= */}
        {currentStep === 3 && (
          <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 sm:p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-green-100 text-green-700 flex items-center justify-center mx-auto shadow-inner">
              <span className="material-symbols-outlined text-[44px]">check_circle</span>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-gray-900">Pembayaran Berhasil!</h2>
              <p className="text-sm text-gray-600 max-w-md mx-auto mt-2 leading-relaxed">
                {isPhysical
                  ? 'Pesanan produk fisik Anda telah diterima dan akan segera dikemas serta dikirim oleh penjual.'
                  : 'Produk digital Anda telah aktif dan siap diunduh atau diakses sekarang.'}
              </p>
            </div>

            {orderData?.reference_code && (
              <div className="bg-[#FAFBF9] rounded-2xl border border-gray-200 p-4 max-w-sm mx-auto text-xs">
                <span className="text-gray-400 font-bold uppercase text-[10px]">Nomor Referensi Pesanan</span>
                <p className="font-mono font-bold text-sm text-gray-900 mt-0.5">{orderData.reference_code}</p>
              </div>
            )}

            {!isPhysical && (
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 max-w-md mx-auto space-y-3">
                <div className="flex items-center justify-center gap-2 text-emerald-800 text-sm font-bold">
                  <span className="material-symbols-outlined text-[22px] text-emerald-600">cloud_download</span>
                  <span>Akses Materi Digital Tersedia</span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    if (product?.download_url && !product?.file_path) {
                      window.open(product.download_url, '_blank');
                      return;
                    }
                    try {
                      const res = await api.get(`/products/${id}/download`, { responseType: 'blob' });
                      const blob = new Blob([res.data]);
                      const url = window.URL.createObjectURL(blob);
                      const link = document.createElement('a');
                      link.href = url;
                      link.setAttribute('download', `${product?.title || 'produk'}`);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                      window.URL.revokeObjectURL(url);
                    } catch (err) {
                      if (product?.download_url) {
                        window.open(product.download_url, '_blank');
                      } else {
                        alert('Silakan unduh atau akses file melalui halaman detail produk atau profil.');
                      }
                    }
                  }}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#008A62] hover:bg-[#00704F] text-white font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">download</span>
                  Unduh / Buka Berkas Digital Sekarang
                </button>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link
                to="/profil-saya"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#8B4513] hover:bg-[#6B3410] text-white font-bold text-sm rounded-2xl shadow-sm transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">account_circle</span>
                Lihat di Profil Saya
              </Link>
              <Link
                to={`/produk/${id}`}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-sm rounded-2xl transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Kembali ke Halaman Produk
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
