import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import coinImg from '../assets/coin.png';
import { OFFICIAL_BANK_ACCOUNTS, PT_COMPANY_NAME } from '../constants/bankAccounts.js';
import ManualPaymentInstruction from '../components/ManualPaymentInstruction.jsx';

// ─── Helpers ────────────────────────────────────────────────────────────────
function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);
}

function formatPoints(n) {
  return new Intl.NumberFormat('id-ID').format(n ?? 0);
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

function PackageCard({ pkg, selected, onSelect }) {
  const isSelected = selected;
  const ratePerPoint = pkg.points > 0 ? pkg.price / pkg.points : 1000;

  return (
    <button
      type="button"
      onClick={() => onSelect(pkg)}
      className={`relative text-left w-full rounded-2xl border-2 p-4 sm:p-5 transition-all duration-200 cursor-pointer active:scale-[0.98] ${
        isSelected
          ? 'border-[#8B4513] bg-gradient-to-br from-[#FFF9F5] to-[#FFF2E8] shadow-md ring-2 ring-[#8B4513]/20'
          : 'border-gray-200/90 bg-white hover:border-[#8B4513]/50 hover:shadow-xs'
      }`}
    >
      {/* Badge Terpopuler */}
      {pkg.is_popular && (
        <div className="absolute -top-2.5 left-3 sm:left-4 z-10">
          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-gradient-to-r from-[#8B4513] to-[#B85D1B] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
            <span className="text-[11px] leading-none">★</span>
            Terpopuler
          </span>
        </div>
      )}

      {/* Checkmark jika terpilih */}
      {isSelected && (
        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#8B4513] text-white flex items-center justify-center shadow-xs">
          <span className="material-symbols-outlined text-[14px]">check</span>
        </span>
      )}

      {/* Konten Kartu Paket */}
      <div className="flex items-center gap-3">
        {/* Ikon Koin */}
        <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform ${
          isSelected ? 'bg-amber-100/70 scale-105' : 'bg-[#FAF5F0]'
        }`}>
          <img
            src={coinImg}
            alt="Coin"
            className="w-8 h-8 sm:w-9 sm:h-9 object-contain drop-shadow-xs"
          />
        </div>

        {/* Info Point & Harga */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="font-black text-[#1F2A22] text-lg sm:text-xl leading-none">
              {formatPoints(pkg.points)}
            </span>
            <span className="text-xs font-bold text-[#8B4513]">Point</span>
          </div>

          <div className="flex items-baseline gap-2 mt-1">
            <span className="font-extrabold text-[#8B4513] text-sm sm:text-base leading-tight">
              {formatRupiah(pkg.price)}
            </span>
            <span className="text-[10px] sm:text-[11px] text-[#5B6660]/80">
              ({formatRupiah(ratePerPoint)}/pt)
            </span>
          </div>
        </div>
      </div>

      {pkg.description && (
        <p className="text-[11px] sm:text-xs text-[#5B6660] mt-2 pt-2 border-t border-gray-100/80 leading-relaxed line-clamp-2">
          {pkg.description}
        </p>
      )}
    </button>
  );
}

// ─── Halaman Utama ────────────────────────────────────────────────────────────
export default function TopUp() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [step,          setStep]          = useState('choose'); // choose | pending_pay | pending_manual | proof_submitted | success
  const [packages,      setPackages]      = useState([]);
  const [selected,      setSelected]      = useState(null);
  const [transaction,   setTransaction]   = useState(null);
  const [balance,       setBalance]       = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState('');
  const [successMsg,    setSuccessMsg]    = useState('');

  // Payment method: 'manual' (rekomendasi) | 'midtrans'
  const [paymentMethod, setPaymentMethod] = useState('manual');
  const [selectedBankId, setSelectedBankId] = useState('qris');
  const [proofFile,     setProofFile]     = useState(null);
  const [proofPreview,  setProofPreview]  = useState(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [copiedField,   setCopiedField]   = useState('');

  const copyToClipboard = (text, fieldKey) => {
    if (!text) return;
    navigator.clipboard.writeText(String(text));
    setCopiedField(fieldKey);
    setTimeout(() => setCopiedField(''), 2500);
  };

  const selectedBank = OFFICIAL_BANK_ACCOUNTS.find((b) => b.id === selectedBankId) || OFFICIAL_BANK_ACCOUNTS[0];

  const fetchUserData = () => {
    Promise.all([
      api.get('/topup/packages').catch(() => ({ data: { data: [] } })),
      api.get('/topup/history?per_page=1').catch(() => ({ data: { summary: { point_balance: 0 } } })),
    ]).then(([pkgRes, histRes]) => {
      const pkgs = pkgRes.data?.data ?? pkgRes.data ?? [];
      setPackages(Array.isArray(pkgs) ? pkgs : []);
      setBalance(histRes.data?.summary?.point_balance ?? 0);
    }).finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  const triggerSnapPayment = async (snapToken, txData) => {
    await loadMidtransSnap();
    if (!window.snap) {
      setError('Gagal memuat sistem pembayaran Midtrans. Pastikan koneksi internet stabil.');
      return;
    }

    window.snap.pay(snapToken, {
      onSuccess: async function (result) {
        console.log('TopUp Midtrans success:', result);
        try {
          if (txData?.reference_code) {
            await api.get(`/payment/check-status/${txData.reference_code}`);
          }
        } catch (e) {
          console.error('Topup sync error:', e);
        }
        setStep('success');
        fetchUserData();
      },
      onPending: async function (result) {
        console.log('TopUp Midtrans pending:', result);
        try {
          if (txData?.reference_code) {
            await api.get(`/payment/check-status/${txData.reference_code}`);
          }
        } catch (e) {
          console.error('Topup sync error:', e);
        }
        setTransaction(txData);
        setStep('pending_pay');
        fetchUserData();
      },
      onError: function (result) {
        console.error('TopUp Midtrans error:', result);
        setError('Pembayaran gagal atau dibatalkan.');
      },
      onClose: function () {
        console.log('TopUp Midtrans popup closed');
        setTransaction(txData);
        setStep('pending_pay');
      }
    });
  };

  // ── Step 1: Eksekusi Pembayaran Sesuai Metode Terpilih ──────────────
  const handleProceedPayment = async () => {
    if (!selected) return;
    setError('');
    setSuccessMsg('');
    setSubmitting(true);

    try {
      const notes = paymentMethod === 'manual'
        ? `Transfer Bank Manual (${selectedBank.shortName} - ${selectedBank.accountNumber})`
        : 'Payment Gateway Midtrans';

      const res = await api.post('/topup', {
        top_up_package_id: selected.id,
        notes: notes,
      });
      const tx = res.data.data;
      setTransaction(tx);

      if (paymentMethod === 'manual') {
        setStep('pending_manual');
        setSuccessMsg('Pesanan Top Up berhasil dibuat! Silakan transfer ke rekening resmi di bawah dan upload bukti transfer.');
      } else {
        if (tx?.snap_token) {
          await triggerSnapPayment(tx.snap_token, tx);
        } else {
          setStep('pending_pay');
        }
      }
    } catch (e) {
      setError(e.response?.data?.message ?? 'Gagal memproses transaksi top up. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Handle Upload Bukti Transfer Manual ──────────────
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

  const handleUploadProof = async () => {
    if (!transaction?.id) {
      setError('Data transaksi tidak ditemukan.');
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
      const res = await api.post(`/topup/${transaction.id}/upload-proof`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (res.data?.data) {
        setTransaction(res.data.data);
      }
      setStep('proof_submitted');
      setSuccessMsg('Bukti transfer berhasil diunggah! Admin akan segera memverifikasi dan menambahkan saldo Point Anda.');
      fetchUserData();
    } catch (err) {
      console.error('Error uploading top up proof:', err);
      setError(err.response?.data?.message || 'Gagal mengunggah bukti transfer. Pastikan format file sesuai (JPG, PNG, atau PDF).');
    } finally {
      setUploadingProof(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <DashboardLayout title="Top Up Point" subtitle="Isi saldo Point Anda untuk konsultasi dan pembelian produk.">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="w-10 h-10 border-4 border-[#8B4513]/20 border-t-[#8B4513] rounded-full animate-spin mb-3" />
          <p className="text-sm text-[#5B6660]">Memuat paket Top Up…</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      title="Top Up Point"
      subtitle="Isi saldo Point Anda secara instan (Midtrans) atau melalui Transfer Bank Manual resmi."
    >
      <div className="w-full max-w-2xl mx-auto pb-24 sm:pb-8">

        {/* Saldo Point saat ini */}
        <div
          className="relative overflow-hidden rounded-2xl sm:rounded-3xl shadow-lg text-white mb-5 sm:mb-6"
          style={{ background: 'linear-gradient(135deg, #8B4513 0%, #6F370F 60%, #4D260A 100%)' }}
        >
          <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute right-6 bottom-0 w-28 h-28 rounded-full bg-amber-400/10 pointer-events-none" />

          <div className="relative p-5 sm:p-6 flex items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[11px] sm:text-xs uppercase tracking-wider font-bold text-amber-200/90">
                  Saldo Point Anda
                </span>
                <span className="text-[10px] font-extrabold bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-sm">
                  Aktif
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl sm:text-4xl font-black tracking-tight leading-none text-white">
                  {formatPoints(balance)}
                </p>
                <p className="text-sm sm:text-base font-bold text-amber-100">Point</p>
              </div>
              <Link
                to="/riwayat-point"
                className="inline-flex items-center gap-1.5 text-xs text-amber-200 hover:text-white mt-3 font-semibold transition-colors"
              >
                <span>Lihat Riwayat Transaksi</span>
                <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </Link>
            </div>

            {/* Koin 3D dengan Efek Kilau */}
            <div className="relative group/coin shrink-0 flex items-center justify-center cursor-pointer select-none">
              <div className="absolute inset-0 rounded-2xl bg-amber-400/35 blur-md animate-coin-aura pointer-events-none" />
              <div className="relative bg-white/20 hover:bg-white/30 p-2 sm:p-2.5 rounded-2xl backdrop-blur-sm shadow-inner border border-white/25 overflow-hidden transition-all duration-300 group-hover/coin:scale-105">
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
                  <div className="w-1/2 h-[200%] -top-1/2 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-coin-shine" />
                </div>
                <img
                  src={coinImg}
                  alt="Coin"
                  className="w-12 h-12 sm:w-16 sm:h-16 object-contain animate-coin-float transition-transform duration-300 group-hover/coin:scale-110"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-[#FFDAD6] text-[#93000A] text-sm rounded-xl p-4 mb-5 flex items-start gap-2 shadow-xs">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            <span className="flex-1 font-medium">{error}</span>
            <button type="button" onClick={() => setError('')} className="text-[#93000A]/60 hover:text-[#93000A]">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}

        {/* Success */}
        {successMsg && (
          <div className="bg-[#DCFCE7] text-[#166534] text-sm rounded-xl p-4 mb-5 flex items-start gap-2 shadow-xs">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">check_circle</span>
            <span className="flex-1 font-medium">{successMsg}</span>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 1 — Pilih Paket Top Up & Metode Pembayaran
        ═══════════════════════════════════════════════════════════ */}
        {step === 'choose' && (
          <div className="space-y-6">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <h2 className="text-sm sm:text-base font-extrabold text-[#1F2A22] flex items-center gap-2">
                  <img src={coinImg} alt="" className="w-5 h-5 object-contain" />
                  1. Pilih Jumlah Top Up
                </h2>
                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold text-[#8B4513] bg-[#8B4513]/10 border border-[#8B4513]/20 px-3 py-1 rounded-full shadow-xs">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  1 Point = Rp 1.000
                </span>
              </div>

              {packages.length === 0 ? (
                <div className="bg-white rounded-2xl border border-black/5 p-8 text-center flex flex-col items-center justify-center">
                  <img src={coinImg} alt="Coin" className="w-14 h-14 object-contain opacity-40 mb-2 grayscale" />
                  <p className="text-sm text-[#5B6660]">Belum ada paket Top Up tersedia.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {packages.map(pkg => (
                    <PackageCard
                      key={pkg.id}
                      pkg={pkg}
                      selected={selected?.id === pkg.id}
                      onSelect={setSelected}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Pilihan Metode Pembayaran: Midtrans vs Transfer Bank Manual */}
            {selected && (
              <div className="space-y-4 pt-2">
                <h2 className="text-sm sm:text-base font-extrabold text-[#1F2A22] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#8B4513]">account_balance_wallet</span>
                  2. Pilih Metode Pembayaran
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Opsi 1: Transfer Bank Manual & QRIS (Direkomendasikan) */}
                  <div
                    onClick={() => setPaymentMethod('manual')}
                    className={`relative p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'manual'
                        ? 'border-[#8B4513] bg-[#FFF8F4] ring-2 ring-[#8B4513]/20 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="absolute -top-2.5 right-4 z-10">
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-[#8B4513] text-white px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                        ★ Direkomendasikan
                      </span>
                    </div>

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">account_balance</span>
                        </div>
                        <div>
                          <p className="font-extrabold text-xs sm:text-sm text-[#1F2A22]">Transfer Manual & QRIS</p>
                          <span className="text-[10px] text-[#8B4513] font-bold">Mandiri • BCA • BNI • QRIS Resmi</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="topup_payment_method"
                        checked={paymentMethod === 'manual'}
                        onChange={() => setPaymentMethod('manual')}
                        className="accent-[#8B4513] w-4 h-4 cursor-pointer mt-1"
                      />
                    </div>
                    <p className="text-[11px] text-[#5B6660] leading-relaxed mb-3">
                      Transfer manual via bank atau scan QRIS Gopay Merchant resmi. Tanpa potongan biaya gateway.
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-[#8B4513]">
                      <span className="bg-white border border-amber-200 px-2 py-0.5 rounded">Mandiri</span>
                      <span className="bg-white border border-amber-200 px-2 py-0.5 rounded">BCA</span>
                      <span className="bg-white border border-amber-200 px-2 py-0.5 rounded">BNI</span>
                      <span className="bg-emerald-50 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-extrabold">QRIS (Scan Bebas Admin)</span>
                    </div>
                  </div>

                  {/* Opsi 2: Midtrans */}
                  <div
                    onClick={() => setPaymentMethod('midtrans')}
                    className={`relative p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                      paymentMethod === 'midtrans'
                        ? 'border-[#8B4513] bg-[#FFF8F4] ring-2 ring-[#8B4513]/20 shadow-sm'
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[20px]">credit_card</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className="font-extrabold text-xs sm:text-sm text-[#1F2A22]">Payment Gateway (Midtrans)</p>
                            <span className="text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 px-1.5 py-0.5 rounded">Dalam Pengembangan</span>
                          </div>
                          <span className="text-[10px] text-gray-500 font-bold">Instan Otomatis</span>
                        </div>
                      </div>
                      <input
                        type="radio"
                        name="topup_payment_method"
                        checked={paymentMethod === 'midtrans'}
                        onChange={() => setPaymentMethod('midtrans')}
                        className="accent-[#8B4513] w-4 h-4 cursor-pointer mt-1"
                      />
                    </div>
                    <p className="text-[11px] text-[#5B6660] leading-relaxed mb-2">
                      Virtual Account otomatis & E-Wallet dengan verifikasi sistem langsung.
                    </p>
                    <p className="text-[10px] text-amber-700 font-semibold mb-2 flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px] shrink-0 text-amber-600">warning</span>
                      <span>Fitur pembayaran ini sedang dalam proses pengembangan, jadi direkomendasikan transfer manual dulu.</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5 text-[10px] font-bold text-gray-600">
                      <span className="bg-white border border-gray-200 px-2 py-0.5 rounded">VA BCA/BNI/BRI</span>
                      <span className="bg-white border border-gray-200 px-2 py-0.5 rounded">GoPay</span>
                      <span className="bg-white border border-gray-200 px-2 py-0.5 rounded">ShopeePay</span>
                    </div>
                  </div>
                </div>

                {/* Jika memilih Transfer Manual: Tampilkan Pilihan Bank / QRIS */}
                {paymentMethod === 'manual' && (
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs animate-fadeIn">
                    <ManualPaymentInstruction
                      selectedBankId={selectedBankId}
                      onSelectBank={setSelectedBankId}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Desktop Selected Bar */}
            {selected && (
              <>
                <div className="hidden sm:flex bg-[#FFF8F4] rounded-2xl border border-[#8B4513]/25 p-4 items-center justify-between shadow-xs mt-4">
                  <div className="flex items-center gap-3">
                    <img src={coinImg} alt="Coin" className="w-10 h-10 object-contain drop-shadow-xs" />
                    <div>
                      <p className="text-[11px] font-semibold text-[#5B6660] uppercase tracking-wider">
                        Paket Dipilih ({paymentMethod === 'manual' ? 'Transfer Manual' : 'Midtrans'})
                      </p>
                      <p className="font-extrabold text-[#1F2A22] text-base leading-tight">
                        {formatPoints(selected.points)} Point
                      </p>
                      <p className="text-sm font-bold text-[#8B4513]">{formatRupiah(selected.price)}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <button
                      type="button"
                      onClick={handleProceedPayment}
                      disabled={submitting}
                      className="bg-[#8B4513] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#6B3410] disabled:opacity-50 transition-colors flex items-center gap-2 cursor-pointer shadow-md active:scale-95"
                    >
                      {submitting ? (
                        <>
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Memproses…
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">
                            {paymentMethod === 'manual' ? 'receipt_long' : 'payments'}
                          </span>
                          {paymentMethod === 'manual' ? 'Lanjut Transfer Manual' : 'Bayar Sekarang (Midtrans)'}
                        </>
                      )}
                    </button>
                    {paymentMethod === 'midtrans' && (
                      <p className="text-[10px] text-amber-700 font-medium text-right max-w-xs">
                        ⚠️ Fitur pembayaran ini sedang dalam proses pengembangan, jadi direkomendasikan transfer manual dulu.
                      </p>
                    )}
                  </div>
                </div>

                {/* Mobile Sticky Bottom Bar */}
                <div className="sm:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-gray-200/90 shadow-[0_-4px_25px_rgba(0,0,0,0.12)] p-3.5 animate-fadeIn">
                  <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                          Total ({paymentMethod === 'manual' ? 'Manual' : 'Midtrans'})
                        </p>
                        <p className="text-base font-black text-[#8B4513] leading-tight truncate">
                          {formatRupiah(selected.price)}
                        </p>
                        <p className="text-[11px] font-semibold text-[#1F2A22] truncate">
                          +{formatPoints(selected.points)} Point
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={handleProceedPayment}
                        disabled={submitting}
                        className="shrink-0 bg-[#8B4513] text-white px-5 py-3 rounded-xl font-bold text-xs hover:bg-[#6B3410] disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md active:scale-95"
                      >
                        {submitting ? (
                          <>
                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Proses…</span>
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">
                              {paymentMethod === 'manual' ? 'receipt_long' : 'payments'}
                            </span>
                            <span>{paymentMethod === 'manual' ? 'Lanjut Transfer' : 'Bayar Sekarang'}</span>
                          </>
                        )}
                      </button>
                    </div>
                    {paymentMethod === 'midtrans' && (
                      <p className="text-[10px] text-amber-700 font-medium mt-1 text-center">
                        ⚠️ Fitur pembayaran ini sedang dalam proses pengembangan, jadi direkomendasikan transfer manual dulu.
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 2A — Pembayaran Transfer Manual & Unggah Bukti
        ═══════════════════════════════════════════════════════════ */}
        {step === 'pending_manual' && transaction && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
                <div className="w-12 h-12 rounded-2xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">account_balance</span>
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-extrabold text-[#1F2A22]">
                    Instruksi Pembayaran Transfer Manual
                  </h2>
                  <p className="text-xs text-[#5B6660]">
                    Selesaikan transfer dan unggah bukti struk agar saldo Point segera diverifikasi.
                  </p>
                </div>
              </div>

              {/* Rincian Transaksi */}
              <div className="bg-[#FAF6F0] rounded-xl p-4 border border-[#8B4513]/20 my-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Kode Transaksi:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[#075985] text-sm">{transaction.reference_code}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transaction.reference_code, 'ref')}
                      className="px-2 py-0.5 rounded bg-white border border-gray-300 text-[10px] font-bold text-gray-700"
                    >
                      {copiedField === 'ref' ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Paket Point:</span>
                  <span className="font-bold text-gray-900">+{formatPoints(transaction.absolute_points)} Point</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-[#8B4513]/15">
                  <span className="font-bold text-gray-800 text-sm">Total Transfer:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-[#8B4513] text-base">{formatRupiah(transaction.amount_idr)}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(transaction.amount_idr, 'amount')}
                      className="px-2 py-0.5 rounded bg-white border border-gray-300 text-[10px] font-bold text-gray-700"
                    >
                      {copiedField === 'amount' ? 'Tersalin' : 'Salin'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Rekening Tujuan / QRIS */}
              <ManualPaymentInstruction
                selectedBankId={selectedBankId}
                onSelectBank={setSelectedBankId}
                className="mb-5"
              />

              {/* Form Upload Bukti Transfer */}
              <div className="space-y-3 pt-2 border-t border-gray-100">
                <label className="block text-xs font-bold text-gray-800">
                  Unggah Bukti Transfer (Struk ATM / Screenshot M-Banking):
                </label>

                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#8B4513]/40 rounded-xl p-5 text-center cursor-pointer hover:bg-amber-50/40 transition-colors"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
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
                      <p className="text-xs font-semibold">Klik untuk memilih file bukti pembayaran</p>
                      <p className="text-[10px] text-gray-400">Format JPG, PNG, atau PDF (maks. 5MB)</p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleUploadProof}
                    disabled={uploadingProof || !proofFile}
                    className="flex-1 bg-[#8B4513] text-white py-3 px-5 rounded-xl font-bold text-sm hover:bg-[#6B3410] disabled:opacity-50 transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
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

                  {transaction.snap_token && (
                    <button
                      type="button"
                      onClick={() => triggerSnapPayment(transaction.snap_token, transaction)}
                      className="border border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513]/5 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">credit_card</span>
                      Bayar via Midtrans Saja
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 2B — Menunggu / Lanjutkan Pembayaran Midtrans
        ═══════════════════════════════════════════════════════════ */}
        {step === 'pending_pay' && transaction && (
          <div className="space-y-5 animate-fadeIn">
            <div className="bg-[#FFF8F4] rounded-2xl border border-[#8B4513]/30 p-6 text-center">
              <div className="w-14 h-14 rounded-2xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-3xl">hourglass_top</span>
              </div>
              <h2 className="text-lg font-bold text-[#1F2A22] mb-1">Menunggu Pembayaran</h2>
              <p className="text-xs text-[#5B6660] max-w-md mx-auto mb-4">
                Selesaikan pembayaran Midtrans atau beralih ke Transfer Bank Manual di bawah ini.
              </p>

              <div className="bg-white rounded-xl border border-[#8B4513]/20 p-4 max-w-sm mx-auto mb-5 text-left space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Kode Referensi:</span>
                  <span className="font-mono font-bold text-[#075985]">{transaction.reference_code}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Jumlah Point:</span>
                  <span className="font-bold text-gray-900">+{formatPoints(transaction.absolute_points)} Point</span>
                </div>
                <div className="flex justify-between text-xs pt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-700">Total Pembayaran:</span>
                  <span className="font-black text-[#8B4513] text-base">{formatRupiah(transaction.amount_idr)}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-md mx-auto">
                {transaction.snap_token && (
                  <button
                    type="button"
                    onClick={() => triggerSnapPayment(transaction.snap_token, transaction)}
                    className="flex-1 bg-[#8B4513] hover:bg-[#6B3410] text-white py-3 px-6 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md"
                  >
                    <span className="material-symbols-outlined text-[18px]">credit_card</span>
                    Buka Popup Midtrans
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setStep('pending_manual')}
                  className="bg-white border border-[#8B4513] text-[#8B4513] hover:bg-[#8B4513]/5 py-3 px-5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-1.5"
                >
                  <span className="material-symbols-outlined text-[18px]">account_balance</span>
                  Transfer Manual
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 3 — Bukti Transfer Manual Terkirim (Menunggu Admin)
        ═══════════════════════════════════════════════════════════ */}
        {step === 'proof_submitted' && (
          <div className="text-center py-8 bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-sm animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <span className="material-symbols-outlined text-4xl">hourglass_top</span>
            </div>
            <h2 className="text-2xl font-bold text-[#1F2A22] mb-2">Bukti Transfer Berhasil Dikirim!</h2>
            <p className="text-sm text-[#5B6660] mb-3 max-w-md mx-auto leading-relaxed">
              Terima kasih! Bukti transfer pembayaran Top Up Point Anda telah kami terima dan sedang dalam antrean verifikasi oleh Tim Admin kami (maks. 1x24 jam kerja).
            </p>
            {transaction && (
              <p className="font-mono text-xs text-[#075985] bg-blue-50 px-3 py-1.5 rounded-full inline-block mb-6">
                Kode Transaksi: {transaction.reference_code}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate('/riwayat-point')}
                className="bg-[#8B4513] text-white py-3 px-6 rounded-xl font-bold text-sm hover:bg-[#6B3410] transition-colors flex items-center justify-center gap-2 shadow-md"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                Lihat Riwayat Transaksi Point
              </button>
              <button
                type="button"
                onClick={() => { setStep('choose'); setTransaction(null); setProofFile(null); setProofPreview(null); }}
                className="border border-gray-300 hover:bg-gray-50 text-gray-700 py-3 px-5 rounded-xl font-bold text-sm transition-colors"
              >
                Top Up Lagi
              </button>
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════
            STEP 4 — Berhasil Lunas (Midtrans Instan)
        ═══════════════════════════════════════════════════════════ */}
        {step === 'success' && (
          <div className="text-center py-8 bg-white rounded-3xl p-6 sm:p-8 border border-black/5 shadow-sm animate-fadeIn">
            <div className="w-20 h-20 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto mb-5 shadow-inner">
              <span className="material-symbols-outlined text-4xl text-[#166534]">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-[#1F2A22] mb-2">Top Up Berhasil!</h2>
            <p className="text-sm text-[#5B6660] mb-2 max-w-sm mx-auto leading-relaxed">
              Pembayaran Anda telah diverifikasi oleh Midtrans. Saldo Point telah otomatis ditambahkan ke akun Anda.
            </p>
            {transaction && (
              <p className="font-mono text-xs text-[#075985] bg-blue-50 px-3 py-1.5 rounded-full inline-block mb-6">
                Ref: {transaction.reference_code}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => navigate('/riwayat-point')}
                className="bg-[#8B4513] text-white py-3 px-6 rounded-xl font-bold text-sm hover:bg-[#6B3410] transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                Lihat Riwayat Point
              </button>
              <button
                type="button"
                onClick={() => {
                  try {
                    const u = JSON.parse(localStorage.getItem('amdal_user') || '{}');
                    if (u.role_type === 'surveyor') navigate('/dashboard-surveyor');
                    else if (u.role_type === 'tenaga_ahli') navigate('/dashboard');
                    else navigate('/akun');
                  } catch {
                    navigate('/akun');
                  }
                }}
                className="border border-[#8B4513]/40 text-[#8B4513] py-3 px-6 rounded-xl font-bold text-sm hover:bg-[#8B4513]/5 transition-colors"
              >
                Ke Dashboard
              </button>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  );
}
