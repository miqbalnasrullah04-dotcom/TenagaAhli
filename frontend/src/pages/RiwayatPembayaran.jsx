import { useTranslation } from '../context/LanguageContext.jsx';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import qrisImg from '../assets/qris.png';

const STATUS_INFO = {
  lunas: { text: 'Lunas', color: '#2E5E3B', bg: '#E3F2E7' },
  verified: { text: 'Berhasil', color: '#2E5E3B', bg: '#E3F2E7' },
  menunggu: { text: 'Menunggu Verifikasi', color: '#7A5900', bg: '#FFF4D6' },
  menunggu_verifikasi: { text: 'Menunggu Verifikasi', color: '#7A5900', bg: '#FFF4D6' },
  ditolak: { text: 'Ditolak', color: '#B3261E', bg: '#FFDAD6' },
  rejected: { text: 'Ditolak', color: '#B3261E', bg: '#FFDAD6' },
};

const PAYMENT_METHODS = [
  { id: 'transfer_bank', label: 'Transfer Bank', desc: 'BCA, Mandiri, BNI, BRI', icon: 'account_balance' },
  { id: 'qris', label: 'QRIS', desc: 'Scan & bayar dari e-wallet apa pun', icon: 'qr_code_2' },
  { id: 'e_wallet', label: 'E-Wallet', desc: 'GoPay, OVO, DANA', icon: 'account_balance_wallet' },
];

function formatRupiah(value) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export default function RiwayatPembayaran() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.tab || 'riwayat'); // tagihan, riwayat
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  // Tagihan State
  const [pkg, setPkg] = useState(location.state?.package || null);
  const [method, setMethod] = useState('transfer_bank');
  const [proof, setProof] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [purchases, setPurchases] = useState([]);
  const [loadingPurchases, setLoadingPurchases] = useState(false);

  useEffect(() => {
    // Muat Riwayat
    api
      .get('/my/payments')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setPayments(data);
      })
      .catch(() => setPayments([]))
      .finally(() => setLoading(false));

    // Muat Pembelian Produk
    setLoadingPurchases(true);
    api
      .get('/my/purchases')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setPurchases(data);
      })
      .catch(() => setPurchases([]))
      .finally(() => setLoadingPurchases(false));

    // Cek Tagihan
    if (!pkg) {
      api
        .get('/my/profile')
        .then((res) => {
          if (res.data?.package) setPkg(res.data.package);
        })
        .catch(() => {});
    }
  }, [pkg]);

  const handleDownloadProduct = async (p) => {
    const prodId = p.product_id || p.product?.id;
    if (p.product?.download_url && !p.product?.file_url) {
      window.open(p.product.download_url, '_blank');
      return;
    }
    try {
      const res = await api.get(`/products/${prodId}/download`, { responseType: 'blob' });
      const blob = new Blob([res.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${p.product_title || 'produk'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      if (p.product?.download_url) {
        window.open(p.product.download_url, '_blank');
      } else {
        alert('Gagal mengunduh berkas produk. Silakan coba lagi.');
      }
    }
  };

  const handleProofChange = (e) => {
    const file = e.target.files?.[0];
    if (file) setProof(file);
  };

  const handleSubmit = async () => {
    if (!pkg) return;
    setSubmitting(true);
    setError('');
    try {
      const payload = new FormData();
      payload.append('package_id', pkg.id);
      payload.append('method', method);
      if (proof) payload.append('proof', proof);

      await api.post('/payments', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess(true);
      // Reload history
      api.get('/my/payments').then(res => setPayments(Array.isArray(res.data) ? res.data : []));
    } catch {
      // Demo mode fallback
      setSuccess(true);
      setPayments([
        {
          id: Date.now(),
          package_name: pkg.name,
          amount: pkg.price,
          method: method,
          status: 'menunggu',
          date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        },
        ...payments
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout
      title="Manajemen Pembayaran & Produk"
      subtitle="Kelola tagihan langganan paket, riwayat transaksi, dan berkas produk digital Anda."
    >
      <div className="w-full max-w-3xl">
        
        {/* Tabs Menu */}
        <div className="flex border-b border-outline-variant/30 mb-6 gap-2 flex-wrap">
          <button
            onClick={() => { setActiveTab('riwayat'); setSuccess(false); }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'riwayat' ? 'border-[#2E5E3B] text-[#2E5E3B]' : 'border-transparent text-on-surface-variant hover:text-[#2E5E3B]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">receipt_long</span>
            Riwayat Pembayaran
          </button>
          <button
            onClick={() => { setActiveTab('produk'); setSuccess(false); }}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'produk' ? 'border-[#2E5E3B] text-[#2E5E3B]' : 'border-transparent text-on-surface-variant hover:text-[#2E5E3B]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">inventory_2</span>
            Produk Dibeli & Unduhan
            {purchases.length > 0 && (
              <span className="ml-1 bg-[#2E5E3B]/10 text-[#2E5E3B] text-[10px] font-bold px-2 py-0.5 rounded-full">
                {purchases.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('tagihan')}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'tagihan' ? 'border-[#2E5E3B] text-[#2E5E3B]' : 'border-transparent text-on-surface-variant hover:text-[#2E5E3B]'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">payment</span>
            Tagihan & Bayar
          </button>
        </div>

        {/* CONTENT: RIWAYAT PEMBAYARAN */}
        {activeTab === 'riwayat' && (
          <div className="animate-fadeIn">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => navigate('/top-up')}
                className="bg-[#2E5E3B] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#244B2F] transition-colors flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[18px]">add_circle</span>
                Top Up Point
              </button>
            </div>

            {loading && (
              <div className="flex items-center gap-3 text-[#5B6660] text-sm">
                <span className="w-5 h-5 rounded-full border-2 border-[#2E5E3B]/30 border-t-[#2E5E3B] animate-spin" />
                Memuat riwayat...
              </div>
            )}

            {!loading && payments.length === 0 && (
              <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block">receipt_long</span>
                <p className="text-on-surface-variant text-sm mb-4">Belum ada riwayat transaksi.</p>
                <button
                  onClick={() => navigate('/top-up')}
                  className="bg-[#2E5E3B] text-white py-2 px-5 rounded-lg font-bold text-sm hover:bg-[#244B2F] transition-colors"
                >
                  Top Up Point
                </button>
              </div>
            )}

            {!loading && payments.length > 0 && (
              <div className="flex flex-col gap-4">
                {payments.map((p) => {
                  const status = STATUS_INFO[p.status] || STATUS_INFO.menunggu;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-5 flex items-center justify-between gap-4 flex-wrap"
                    >
                      <div>
                        <p className="font-bold text-on-background">Paket {p.package_name || 'Premium'}</p>
                        <p className="text-sm text-on-surface-variant">
                          Metode: {p.method || 'Manual'} &middot; Tanggal: {p.date || new Date(p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="font-bold text-on-background">{formatRupiah(p.amount)}</p>
                        <span
                          className="text-xs font-bold px-3 py-1.5 rounded-full"
                          style={{ color: status.color, backgroundColor: status.bg }}
                        >
                          {status.text}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONTENT: PRODUK DIBELI & UNDUHAN */}
        {activeTab === 'produk' && (
          <div className="animate-fadeIn space-y-4">
            {loadingPurchases && (
              <div className="flex items-center gap-3 text-[#5B6660] text-sm">
                <span className="w-5 h-5 rounded-full border-2 border-[#2E5E3B]/30 border-t-[#2E5E3B] animate-spin" />
                Memuat daftar produk yang Anda beli...
              </div>
            )}

            {!loadingPurchases && purchases.length === 0 && (
              <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block">folder_off</span>
                <p className="text-on-surface-variant text-sm mb-4">Anda belum membeli produk apapun.</p>
                <button
                  onClick={() => navigate('/cari')}
                  className="bg-[#2E5E3B] text-white py-2 px-5 rounded-lg font-bold text-sm hover:bg-[#244B2F] transition-colors"
                >
                  Jelajahi Produk
                </button>
              </div>
            )}

            {!loadingPurchases && purchases.length > 0 && (
              <div className="flex flex-col gap-3">
                {purchases.map((p) => {
                  const isCompleted = p.status === 'completed';
                  const isDigital = p.product?.is_digital ?? true;
                  return (
                    <div
                      key={p.id}
                      className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3.5">
                        <div className="w-12 h-12 rounded-xl bg-[#008A62]/10 text-[#008A62] flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[24px]">
                            {isDigital ? 'devices' : 'local_shipping'}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-gray-100 text-gray-700">
                              {p.reference_code}
                            </span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              isCompleted ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {isCompleted ? 'Berhasil' : p.status}
                            </span>
                            <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                              {isDigital ? 'Produk Digital' : 'Produk Fisik'}
                            </span>
                          </div>
                          <h4 className="font-bold text-gray-900 text-sm sm:text-base leading-snug">
                            {p.product_title || p.product?.title}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            Dibeli pada {new Date(p.purchased_at || p.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                            {p.amount_idr ? ` • ${formatRupiah(p.amount_idr)}` : (p.points_spent ? ` • ${p.points_spent} Point` : '')}
                          </p>
                        </div>
                      </div>

                      <div className="w-full sm:w-auto flex items-center gap-2 shrink-0">
                        {isDigital && isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleDownloadProduct(p)}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#008A62] hover:bg-[#00704F] text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[16px]">download</span>
                            Unduh / Akses
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => navigate(`/produk/${p.product_id || p.product?.id}`)}
                          className="w-full sm:w-auto inline-flex items-center justify-center gap-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs rounded-xl transition-all"
                        >
                          <span>Lihat Detail</span>
                          <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* CONTENT: TAGIHAN & BAYAR */}
        {activeTab === 'tagihan' && (
          <div className="animate-fadeIn">
            {success ? (
              <div className="bg-white rounded-xl shadow-sm border border-outline-variant/30 text-center py-10 px-6">
                <div className="w-16 h-16 rounded-full bg-[#E3F2E7] flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-3xl text-[#2E5E3B]">check_circle</span>
                </div>
                <h1 className="text-2xl font-bold text-[#1F2A22] mb-2">Pembayaran Diterima</h1>
                <p className="text-[#5B6660] mb-8 text-sm">
                  Terima kasih, bukti pembayaran paket <b>{pkg?.name}</b> sudah kami terima dan sedang menunggu verifikasi admin.
                </p>
                <button
                  onClick={() => setActiveTab('riwayat')}
                  className="bg-[#2E5E3B] text-white py-2.5 px-6 rounded-lg font-bold text-sm hover:bg-[#244B2F] transition-colors"
                >
                  Lihat Riwayat Pembayaran
                </button>
              </div>
            ) : !pkg ? (
              <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-10 text-center">
                <span className="material-symbols-outlined text-4xl text-on-surface-variant/40 mb-2 block">toll</span>
                <p className="text-on-surface-variant text-sm mb-4">Anda belum memiliki saldo Point. Top Up sekarang untuk mulai.</p>
                <button
                  onClick={() => navigate('/top-up')}
                  className="bg-[#2E5E3B] text-white py-2.5 px-6 rounded-lg font-bold text-sm hover:bg-[#244B2F] transition-colors"
                >
                  Top Up Point Sekarang
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {error && <p className="bg-error-container text-on-error-container text-sm rounded-lg p-3">{error}</p>}

                {/* Ringkasan paket */}
                <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Tagihan Premium</h2>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-on-background">Paket {pkg.name}</p>
                      <p className="text-sm text-on-surface-variant">{pkg.duration || 'Durasi aktif'}</p>
                    </div>
                    <p className="text-xl font-bold text-[#2E5E3B]">{formatRupiah(pkg.price || 0)}</p>
                  </div>
                </div>

                {/* Metode pembayaran */}
                <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Metode Pembayaran</h2>
                  <div className="flex flex-col gap-3">
                    {PAYMENT_METHODS.map((m) => (
                      <label
                        key={m.id}
                        className={`flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                          method === m.id ? 'border-[#2E5E3B] bg-[#2E5E3B]/5' : 'border-outline-variant/30 hover:border-[#2E5E3B]/30'
                        }`}
                      >
                        <input
                          type="radio"
                          name="method"
                          checked={method === m.id}
                          onChange={() => setMethod(m.id)}
                          className="accent-[#2E5E3B]"
                        />
                        <span className="material-symbols-outlined text-[#2E5E3B]">{m.icon}</span>
                        <div>
                          <p className="text-sm font-semibold text-on-background">{m.label}</p>
                          <p className="text-xs text-on-surface-variant">{m.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  {method === 'transfer_bank' && (
                    <div className="mt-4 bg-[#F5F4F0] rounded-lg p-4 text-sm text-on-surface-variant">
                      Transfer ke rekening <b>BCA 0954152045 a.n. Triwala Mitra Bestari</b>, lalu unggah bukti transfer di bawah ini.
                    </div>
                  )}
                  {method === 'qris' && (
                    <div className="mt-4 bg-gradient-to-b from-[#F0F9FF] to-white border border-blue-200 rounded-2xl p-4 text-center">
                      <div className="max-w-[220px] mx-auto bg-white p-2 rounded-xl border border-blue-200 shadow-sm mb-2">
                        <img src={qrisImg} alt="QRIS Triwala Digital" className="w-full h-auto rounded-lg object-contain mx-auto" />
                      </div>
                      <p className="text-xs font-bold text-gray-900 mb-0.5">TRIWALA DIGITAL, DIGITAL & KREATIF</p>
                      <p className="text-[11px] font-mono text-blue-900 mb-2">NMID: ID1026596867808</p>
                      <div className="flex justify-center">
                        <a
                          href={qrisImg}
                          download="QRIS_TenagaAhli.png"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-xs"
                        >
                          <span className="material-symbols-outlined text-[14px]">download</span> Unduh QRIS
                        </a>
                      </div>
                    </div>
                  )}
                  {method === 'e_wallet' && (
                    <div className="mt-4 bg-[#F5F4F0] rounded-lg p-4 text-sm text-on-surface-variant">
                      Kirim pembayaran ke nomor <b>0812-3456-7890 (a.n. Triwala Mitra Bestari)</b> melalui GoPay/OVO/DANA, lalu unggah bukti transfer.
                    </div>
                  )}
                </div>

                {/* Bukti pembayaran */}
                <div className="bg-white rounded-xl border border-outline-variant/30 shadow-sm p-6">
                  <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Upload Bukti Bayar (Manual)</h2>
                  <label className="border-2 border-dashed border-outline-variant/40 rounded-xl py-6 flex flex-col items-center gap-2 cursor-pointer hover:border-[#2E5E3B]/50 transition-colors">
                    <span className="material-symbols-outlined text-2xl text-[#2E5E3B]">upload_file</span>
                    <span className="text-sm text-on-surface-variant">
                      {proof ? proof.name : 'Klik untuk unggah screenshot/bukti transfer'}
                    </span>
                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleProofChange} />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full bg-[#2E5E3B] text-white py-3 rounded-xl font-bold hover:bg-[#244B2F] transition-colors disabled:opacity-60"
                >
                  {submitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}