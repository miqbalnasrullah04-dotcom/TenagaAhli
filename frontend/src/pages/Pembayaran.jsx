import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';

const BACKEND_URL = 'https://tenagaahli.latihan.co.id';

const getBANKACCOUNTS = (t) => [
  { bank: 'BCA',     norek: '1234567890', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
  { bank: 'Mandiri', norek: '9876543210', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
  { bank: 'BNI',     norek: '1122334455', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
  { bank: 'BRI',     norek: '5544332211', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
];

const getEWALLETACCOUNTS = (t) => [
  { name: 'GoPay', number: '0812-3456-7890', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
  { name: 'OVO',   number: '0812-3456-7890', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
  { name: 'DANA',  number: '0812-3456-7890', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
];

const getPaymentMethods = (t) => [
  { 
    id: 'credit_card', 
    label: t('payment.methods.credit_card', 'Kartu Kredit/Debit'), 
    desc: t('payment.methods.credit_card_desc', 'Visa, Mastercard, JCB, AMEX'), 
    icon: 'credit_card',
    subMethods: [
      { id: 'visa', name: 'Visa', desc: t('payment.methods.visa_desc', 'Kartu kredit Visa') },
      { id: 'mastercard', name: 'Mastercard', desc: t('payment.methods.mastercard_desc', 'Kartu kredit Mastercard') },
      { id: 'jcb', name: 'JCB', desc: t('payment.methods.jcb_desc', 'Kartu kredit JCB') },
      { id: 'amex', name: 'American Express', desc: t('payment.methods.amex_desc', 'Kartu kredit AMEX') },
    ]
  },
  { 
    id: 'bank_transfer', 
    label: t('payment.methods.bank_transfer', 'Transfer Bank'), 
    desc: t('payment.methods.bank_transfer_desc', 'Virtual Account BCA, BNI, BRI, Mandiri, Permata'), 
    icon: 'account_balance',
    subMethods: [
      { id: 'bca_va', name: t('payment.methods.bca_va', 'BCA Virtual Account'), desc: t('payment.methods.bca_va_desc', 'No. Rekening: 1234567890'), account: '1234567890', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
      { id: 'bni_va', name: t('payment.methods.bni_va', 'BNI Virtual Account'), desc: t('payment.methods.bni_va_desc', 'No. Rekening: 9876543210'), account: '9876543210', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
      { id: 'bri_va', name: t('payment.methods.bri_va', 'BRI Virtual Account'), desc: t('payment.methods.bri_va_desc', 'No. Rekening: 5544332211'), account: '5544332211', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
      { id: 'mandiri_va', name: t('payment.methods.mandiri_va', 'Mandiri Virtual Account'), desc: t('payment.methods.mandiri_va_desc', 'No. Rekening: 1122334455'), account: '1122334455', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
      { id: 'permata_va', name: t('payment.methods.permata_va', 'Permata Virtual Account'), desc: t('payment.methods.permata_va_desc', 'No. Rekening: 6677889900'), account: '6677889900', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
    ]
  },
  { 
    id: 'e_wallet', 
    label: t('payment.methods.ewallet_qris', 'E-Wallet & QRIS'), 
    desc: t('payment.methods.ewallet_qris_desc', 'GoPay, ShopeePay, QRIS'), 
    icon: 'qr_code_2',
    subMethods: [
      { id: 'gopay', name: 'GoPay', desc: t('payment.methods.gopay_desc', 'Nomor: 0812-3456-7890'), account: '081234567890', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
      { id: 'shopeepay', name: 'ShopeePay', desc: t('payment.methods.shopeepay_desc', 'Nomor: 0812-3456-7890'), account: '081234567890', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
      { id: 'qris', name: 'QRIS', desc: t('payment.methods.qris_desc', 'Scan QR Code untuk pembayaran'), account: 'QRIS_TENAGAAHLI', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
      { id: 'ovo', name: 'OVO', desc: t('payment.methods.ovo_desc', 'Nomor: 0812-3456-7890'), account: '081234567890', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
      { id: 'dana', name: 'DANA', desc: t('payment.methods.dana_desc', 'Nomor: 0812-3456-7890'), account: '081234567890', atas_nama: t('payment.account_name', 'TenagaAhli.com') },
    ]
  },
  { 
    id: 'convenience_store', 
    label: t('payment.methods.convenience_store', 'Convenience Store'), 
    desc: t('payment.methods.convenience_store_desc', 'Indomaret, Alfamart'), 
    icon: 'store',
    subMethods: [
      { id: 'indomaret', name: 'Indomaret', desc: t('payment.methods.indomaret_desc', 'Bayar di kasir Indomaret terdekat dengan kode pembayaran') },
      { id: 'alfamart', name: 'Alfamart', desc: t('payment.methods.alfamart_desc', 'Bayar di kasir Alfamart terdekat dengan kode pembayaran') },
    ]
  },
];

function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(v ?? 0);
}

function CopyButton({ text }) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        navigator.clipboard?.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1 text-xs font-bold text-[#0EA5E9] hover:text-[#0284C7] transition-colors shrink-0"
    >
      <span className="material-symbols-outlined text-[14px]">{copied ? 'check' : 'content_copy'}</span>
      {copied ? t('payment.copied', 'Disalin!') : t('payment.copy', 'Salin')}
    </button>
  );
}

function StatusBadge({ status }) {
  const { t } = useTranslation();
  const map = {
    menunggu_pembayaran: { label: t('payment.status.waiting_payment', 'Menunggu Pembayaran'), color: '#7A5900', bg: '#FFF4D6' },
    menunggu_verifikasi: { label: t('payment.status.waiting_verification', 'Menunggu Verifikasi'), color: '#0369A1', bg: '#E0F2FE' },
    verified:            { label: t('payment.status.approved', 'Disetujui'),           color: '#166534', bg: '#DCFCE7' },
    rejected:            { label: t('payment.status.rejected', 'Ditolak'),             color: '#B3261E', bg: '#FFDAD6' },
  };
  const d = map[status] || { label: status, color: '#414844', bg: '#F5F4F0' };
  return (
    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: d.color, backgroundColor: d.bg }}>
      {d.label}
    </span>
  );
}

export default function Pembayaran() {
  const { t } = useTranslation();
  const PAYMENT_METHODS = getPaymentMethods(t);
  const navigate  = useNavigate();
  const location  = useLocation();
  const proofRef  = useRef(null);

  const [pkg,          setPkg]          = useState(location.state?.package ?? null);
  const [order,        setOrder]        = useState(null);
  const [method,       setMethod]       = useState('credit_card');
  const [proof,        setProof]        = useState(null);
  const [proofPreview, setProofPreview] = useState(null);
  const [step,         setStep]         = useState('choose');
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState('');
  const [history,      setHistory]      = useState([]);
  const [tab,          setTab]          = useState('pay');

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/my/profile').catch(() => ({ data: {} })),
      api.get('/orders/history').catch(() => ({ data: [] })),
      api.get('/orders/mine').catch(() => ({ data: {} }))
    ]).then(([profileRes, historyRes, mineRes]) => {
      
      setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
      
      let currentOrder = null;
      if (mineRes.data?.status === 'menunggu_pembayaran') {
        currentOrder = mineRes.data;
        setOrder(currentOrder);
        setStep('confirm');
      }

      if (!pkg) {
        if (profileRes.data?.package) {
          setPkg(profileRes.data.package);
        } else if (currentOrder?.package) {
          setPkg(currentOrder.package);
        } else if (currentOrder) {
          setPkg({ name: currentOrder.package_name, id: currentOrder.package_id, price: currentOrder.amount });
        }
      }

      setLoading(false);
    });
  }, []);

  const handleChooseMethod = async () => {
    if (!pkg || !method) return;
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/my/choose-package', { package_id: pkg.id });
      if (res.data?.order) {
        setOrder(res.data.order);
        // Langsung buka Midtrans Snap dengan metode yang dipilih
        if (res.data.snap_token) {
          openMidtransSnap(res.data.snap_token);
        } else {
          setStep('confirm'); // Fallback ke manual payment
        }
      } else {
        navigate('/dashboard');
      }
    } catch (e) {
      setError(e.response?.data?.message || t('payment.error_create_order', 'Gagal membuat order. Coba lagi.'));
    } finally {
      setSubmitting(false);
    }
  };

  const openMidtransSnap = (snapToken) => {
    const isProd = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true' || import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === '1';
    const snapUrl = isProd
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    const handlePayNow = () => {
      // Mapping metode pembayaran ke enabled_payments Midtrans yang benar
      let enabledPayments = [];
      if (method === 'credit_card') {
        enabledPayments = ['credit_card'];
      } else if (method === 'bank_transfer') {
        enabledPayments = ['bca_va', 'bni_va', 'bri_va', 'echannel', 'permata_va', 'other_va'];
      } else if (method === 'e_wallet') {
        enabledPayments = ['gopay', 'shopeepay', 'qris'];
      } else if (method === 'convenience_store') {
        enabledPayments = ['indomaret', 'alfamart'];
      } else {
        // Default: semua metode
        enabledPayments = ['credit_card', 'bca_va', 'bni_va', 'bri_va', 'echannel', 'permata_va', 'other_va', 'gopay', 'shopeepay', 'qris', 'indomaret', 'alfamart'];
      }

      window.snap.pay(snapToken, {
        enabledPayments: enabledPayments,
        onSuccess: function(result) {
          console.log('Payment success:', result);
          setStep('success');
          api.get('/orders/history').then(r => setHistory(Array.isArray(r.data) ? r.data : [])).catch(() => {});
        },
        onPending: function(result) {
          console.log('Payment pending:', result);
          setStep('success');
          api.get('/orders/history').then(r => setHistory(Array.isArray(r.data) ? r.data : [])).catch(() => {});
        },
        onError: function(result) {
          console.log('Payment error:', result);
          setError(t('payment.error_midtrans', 'Pembayaran gagal atau dibatalkan. Silakan coba lagi.'));
        },
        onClose: function() {
          console.log('Payment popup closed');
          setError(t('payment.cancelled', 'Pembayaran dibatalkan.'));
        }
      });
    };

    if (window.snap) {
      handlePayNow();
    } else {
      const script = document.createElement('script');
      script.src = snapUrl;
      script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || '');
      script.onload = handlePayNow;
      script.onerror = () => setError(t('payment.error_load_midtrans', 'Gagal memuat Midtrans. Periksa koneksi internet Anda.'));
      document.body.appendChild(script);
    }
  };

  const handleUploadProof = async () => {
    if (!proof || !order) return;
    setSubmitting(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('proof', proof);
      await api.post(`/orders/${order.id}/upload-proof`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setStep('success');
      api.get('/orders/history').then(r => setHistory(Array.isArray(r.data) ? r.data : [])).catch(() => {});
    } catch (e) {
      setError(e.response?.data?.message || t('payment.error_upload_proof', 'Gagal mengunggah bukti. Format JPG/PNG/PDF maks 5MB.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title={t('payment.title', 'Pembayaran')}>
        <div className="flex items-center gap-3 text-[#5B6660] p-6">
          <span className="w-5 h-5 rounded-full border-2 border-[#0EA5E9]/30 border-t-[#0EA5E9] animate-spin" />
          {t('payment.loading', 'Memuat data pembayaran...')}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title={t('payment.title', 'Pembayaran')} subtitle={t('payment.subtitle', 'Kelola pembayaran paket keanggotaan Anda.')}>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-outline-variant/20 mb-6">
        {[
          { id: 'pay',     label: t('payment.tabs.pay_now', 'Bayar Sekarang'),     icon: 'payments'     },
          { id: 'history', label: t('payment.tabs.history', 'Riwayat Pembayaran'), icon: 'receipt_long' },
        ].map(tabItem => (
          <button key={tabItem.id} onClick={() => setTab(tabItem.id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
              tab === tabItem.id ? 'border-[#0EA5E9] text-[#0EA5E9]' : 'border-transparent text-[#5B6660] hover:text-[#0EA5E9]'
            }`}>
            <span className="material-symbols-outlined text-[18px]">{tabItem.icon}</span>
            {tabItem.label}
          </button>
        ))}
      </div>

      {/* TAB: RIWAYAT */}
      {tab === 'history' && (
        <div className="w-full max-w-2xl">
          {history.length === 0 ? (
            <div className="bg-white rounded-2xl border border-black/5 p-10 text-center">
              <span className="material-symbols-outlined text-5xl text-[#5B6660]/30 block mb-3">receipt_long</span>
              <p className="text-sm text-[#5B6660]">{t('payment.no_history', 'Belum ada riwayat pembayaran.')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map(ord => (
                <div key={ord.id} className="bg-white rounded-2xl border border-black/5 p-5">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <p className="font-bold text-[#1F2A22] text-sm">{ord.package_name || t('payment.premium_package', 'Paket Premium')}</p>
                      <p className="text-xs text-[#5B6660] mt-0.5 font-mono">{ord.reference_code}</p>
                    </div>
                    <StatusBadge status={ord.status} />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-bold text-[#0EA5E9]">{formatRupiah(ord.amount)}</span>
                    <span className="text-xs text-[#5B6660]">
                      {ord.created_at ? new Date(ord.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                    </span>
                  </div>
                  {ord.reject_reason && (
                    <p className="mt-2 text-xs text-[#B3261E] bg-[#FFDAD6] rounded-lg px-3 py-2">{t('payment.rejected_reason', 'Ditolak:')} {ord.reject_reason}</p>
                  )}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <button onClick={() => navigate(`/invoice/${ord.reference_code}`)} className="text-xs text-[#0EA5E9] font-bold hover:underline flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">receipt_long</span> {t('payment.view_invoice', 'Lihat Invoice')}
                    </button>
                    {ord.proof_of_payment && (
                      <a href={`${BACKEND_URL}/storage/${ord.proof_of_payment}`} target="_blank" rel="noreferrer"
                        className="text-xs text-[#0284C7] hover:underline flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">image</span> {t('payment.transfer_proof', 'Bukti Transfer')}
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB: BAYAR */}
      {tab === 'pay' && (
        <div className="w-full max-w-2xl">
          {error && (
            <div className="bg-[#FFDAD6] text-[#93000A] text-sm rounded-xl p-4 mb-5 flex items-start gap-2">
              <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
              {error}
            </div>
          )}

          {/* SUCCESS */}
          {step === 'success' && (
            <div className="text-center py-10">
              <div className="w-20 h-20 rounded-full bg-[#DCFCE7] flex items-center justify-center mx-auto mb-5">
                <span className="material-symbols-outlined text-4xl text-[#166534]">check_circle</span>
              </div>
              <h2 className="text-2xl font-bold text-[#1F2A22] mb-2">{t('payment.success_title', 'Bukti Pembayaran Dikirim!')}</h2>
              <p className="text-sm text-[#5B6660] mb-8 max-w-sm mx-auto leading-relaxed">
                {t('payment.success_desc', 'Bukti transfer sedang diverifikasi oleh admin. Notifikasi dikirim setelah dikonfirmasi.')}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button onClick={() => setTab('history')}
                  className="bg-[#0EA5E9] text-white py-3 px-6 rounded-xl font-bold text-sm hover:bg-[#0284C7] transition-colors flex items-center justify-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">receipt_long</span>{t('payment.view_history', 'Lihat Riwayat')}
                </button>
                <button onClick={() => navigate('/dashboard')}
                  className="border border-[#0EA5E9]/40 text-[#0EA5E9] py-3 px-6 rounded-xl font-bold text-sm hover:bg-[#0EA5E9]/5 transition-colors">
                  {t('payment.to_dashboard', 'Ke Dashboard')}
                </button>
              </div>
            </div>
          )}

          {/* CHOOSE METHOD */}
          {step === 'choose' && pkg && (
            <div className="space-y-5">
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5B6660] mb-3">{t('payment.package_summary', 'Ringkasan Paket')}</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-[#1F2A22]">{t('Paket')} {pkg.name}</p>
                    <p className="text-sm text-[#5B6660]">{pkg.duration || '12 bulan'}</p>
                  </div>
                  <p className="text-xl font-bold text-[#0EA5E9]">{formatRupiah(pkg.price)}</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5B6660] mb-3">{t('payment.payment_method', 'Metode Pembayaran')}</p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.map(m => (
                    <label key={m.id}
                      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition-colors ${
                        method === m.id ? 'border-[#0EA5E9] bg-[#E0F2FE]/50' : 'border-outline-variant/30 hover:border-[#0EA5E9]/40'
                      }`}>
                      <input type="radio" name="method" checked={method === m.id} onChange={() => setMethod(m.id)} className="accent-[#0EA5E9]" />
                      <span className="material-symbols-outlined text-[22px] text-[#0EA5E9]">{m.icon}</span>
                      <div>
                        <p className="text-sm font-semibold text-[#1F2A22]">{m.label}</p>
                        <p className="text-xs text-[#5B6660]">{m.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <button type="button" onClick={handleChooseMethod} disabled={submitting}
                className="w-full bg-[#0EA5E9] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#0284C7] disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('payment.processing', 'Memproses...')}</>
                  : <><span className="material-symbols-outlined text-[18px]">arrow_forward</span>{t('payment.continue_payment', 'Lanjut ke Pembayaran')}</>}
              </button>
            </div>
          )}

          {/* CONFIRM + UPLOAD */}
          {step === 'confirm' && order && (
            <div className="space-y-5">
              <div className="bg-[#E0F2FE] rounded-2xl border border-[#0EA5E9]/30 p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#0369A1]">{t('payment.order_created', 'Order Dibuat')}</p>
                  <StatusBadge status={order.status} />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="font-mono text-sm font-bold text-[#075985]">{order.reference_code}</p>
                  <button onClick={() => navigate(`/invoice/${order.reference_code}`)} className="text-xs bg-white text-[#0369A1] px-2 py-1 rounded shadow-sm hover:bg-gray-50 flex items-center gap-1 font-semibold">
                    <span className="material-symbols-outlined text-[14px]">receipt_long</span> {t('payment.view_invoice', 'Lihat Invoice')}
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#0EA5E9]/20">
                  <span className="text-sm text-[#0369A1]">{t('payment.total_payment', 'Total Pembayaran')}</span>
                  <span className="font-bold text-[#0EA5E9] text-lg">{formatRupiah(order.amount)}</span>
                </div>
              </div>

              {/* Tombol Bayar dengan Midtrans jika ada snap_token */}
              {order.snap_token && (
                <div className="bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="material-symbols-outlined text-3xl">payment</span>
                    <div>
                      <p className="font-bold text-lg">{t('payment.online_payment', 'Pembayaran Online')}</p>
                      <p className="text-sm text-white/80">{t('payment.online_payment_desc', 'Bayar dengan berbagai metode pembayaran')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const isProd = import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === 'true' || import.meta.env.VITE_MIDTRANS_IS_PRODUCTION === '1';
                      const snapUrl = isProd
                        ? 'https://app.midtrans.com/snap/snap.js'
                        : 'https://app.sandbox.midtrans.com/snap/snap.js';

                      const handlePayNow = () => {
                        window.snap.pay(order.snap_token, {
                          onSuccess: function(result) {
                            console.log('Payment success:', result);
                            setStep('success');
                          },
                          onPending: function(result) {
                            console.log('Payment pending:', result);
                            window.location.reload();
                          },
                          onError: function(result) {
                            console.log('Payment error:', result);
                            setError(t('payment.payment_failed', 'Pembayaran gagal. Silakan coba lagi.'));
                          },
                          onClose: function() {
                            console.log('Payment popup closed');
                          }
                        });
                      };

                      if (window.snap) {
                        handlePayNow();
                      } else {
                        // Load Midtrans Snap script dynamically
                        const script = document.createElement('script');
                        script.src = snapUrl;
                        script.setAttribute('data-client-key', import.meta.env.VITE_MIDTRANS_CLIENT_KEY || 'your-client-key');
                        document.head.appendChild(script);
                        
                        script.onload = () => {
                          handlePayNow();
                        };
                      }
                    }}
                    className="w-full bg-white text-[#0284C7] py-3.5 rounded-xl font-bold text-sm hover:bg-white/95 transition-colors flex items-center justify-center gap-2 shadow-lg"
                  >
                    <span className="material-symbols-outlined text-[20px]">credit_card</span>
                    {t('payment.pay_now', 'Bayar Sekarang')}
                  </button>
                  <p className="text-xs text-white/80 mt-3 text-center">
                    {t('payment.support_methods', 'Mendukung transfer bank, e-wallet, kartu kredit, dan lainnya')}
                  </p>
                </div>
              )}

              {/* Opsi manual payment (tetap ada sebagai fallback) */}
              <div className="bg-white rounded-2xl border border-black/5 p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-[#5B6660] mb-3">
                  {t('payment.upload_manual', 'Atau Upload Bukti Transfer Manual')}
                </p>
                <p className="text-xs text-[#5B6660] mb-4">
                  {t('payment.upload_manual_desc', 'Jika Anda sudah melakukan transfer via ATM/m-banking, upload bukti transfer di sini')}
                </p>

                <input type="file" accept="image/*,.pdf" className="hidden" ref={proofRef}
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    setProof(f);
                    setProofPreview(f.type.startsWith('image/') ? URL.createObjectURL(f) : null);
                  }} />
                {proof ? (
                  <div className="flex items-center gap-4 bg-[#E0F2FE] rounded-xl px-4 py-3">
                    {proofPreview && (
                      <img src={proofPreview} alt="Bukti" className="w-16 h-16 rounded-lg object-cover border border-[#0EA5E9]/20 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#0284C7] truncate">{proof.name}</p>
                      <p className="text-xs text-[#5B6660]">{(proof.size / 1024).toFixed(0)} KB</p>
                    </div>
                    <button type="button" className="text-xs text-red-500 hover:underline shrink-0"
                      onClick={() => { setProof(null); setProofPreview(null); if (proofRef.current) proofRef.current.value = ''; }}>
                      {t('payment.delete', 'Hapus')}
                    </button>
                  </div>
                ) : (
                  <button type="button" onClick={() => proofRef.current?.click()}
                    className="w-full border-2 border-dashed border-[#0EA5E9]/30 rounded-xl py-6 flex flex-col items-center gap-2 hover:border-[#0EA5E9]/60 transition-colors">
                    <span className="material-symbols-outlined text-3xl text-[#0EA5E9]/50">upload_file</span>
                    <span className="text-sm text-[#5B6660]">{t('payment.click_to_upload', 'Klik untuk unggah screenshot bukti transfer')}</span>
                    <span className="text-xs text-[#5B6660]/60">{t('payment.format_hint', 'JPG, PNG, atau PDF — maks. 5MB')}</span>
                  </button>
                )}
              </div>

              <button type="button" onClick={handleUploadProof} disabled={!proof || submitting}
                className="w-full bg-[#0EA5E9] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-[#0284C7] disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
                {submitting
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t('payment.sending', 'Mengirim...')}</>
                  : <><span className="material-symbols-outlined text-[18px]">send</span>{t('payment.send_proof', 'Kirim Bukti Pembayaran')}</>}
              </button>

              <button type="button" onClick={() => setStep('choose')}
                className="w-full text-[#5B6660] text-sm py-2 hover:text-[#1F2A22] transition-colors flex items-center justify-center gap-1">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                {t('payment.change_method', 'Ganti Metode Pembayaran')}
              </button>
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
