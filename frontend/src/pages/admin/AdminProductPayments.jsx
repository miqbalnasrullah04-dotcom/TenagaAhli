import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { getMediaUrl } from '../../utils/media.js';

export default function AdminProductPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fitMode, setFitMode] = useState('fit');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const rupiah = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const loadPayments = () => {
    setLoading(true);
    api
      .get('/admin/product-purchases/pending')
      .then((res) => {
        setPayments(res.data.data || []);
        setError('');
      })
      .catch((err) => {
        setError('Gagal memuat data pembayaran produk');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleVerify = async (paymentId) => {
    if (!window.confirm('Verifikasi pembayaran ini? Uang akan ditransfer ke wallet seller.')) return;

    setActionLoading(true);
    try {
      await api.put(`/admin/product-purchases/${paymentId}/verify`);
      alert('Pembayaran berhasil diverifikasi!');
      loadPayments();
      setSelectedPayment(null);
    } catch (err) {
      alert('Gagal verifikasi: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (paymentId) => {
    if (!rejectReason.trim()) {
      alert('Masukkan alasan penolakan');
      return;
    }
    if (!window.confirm('Tolak pembayaran ini?')) return;

    setActionLoading(true);
    try {
      await api.put(`/admin/product-purchases/${paymentId}/reject`, {
        reject_reason: rejectReason,
      });
      alert('Pembayaran berhasil ditolak!');
      loadPayments();
      setSelectedPayment(null);
      setRejectReason('');
    } catch (err) {
      alert('Gagal reject: ' + (err.response?.data?.message || err.message));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFBF9]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#008A62]/30 border-t-[#008A62] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data pembayaran...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBF9] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Verifikasi Pembayaran Produk</h1>
          <p className="text-gray-600 mt-2">Menunggu verifikasi: {payments.length} pembayaran</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-red-700">
            {error}
          </div>
        )}

        {payments.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 block mb-4">check_circle</span>
            <p className="text-gray-600">Tidak ada pembayaran yang menunggu verifikasi</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedPayment(payment)}
              >
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Product Info */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Produk</p>
                    <p className="font-bold text-gray-900">{payment.product.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{rupiah(payment.product.discount_price || payment.product.price)}</p>
                  </div>

                  {/* Seller Info */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Seller</p>
                    <p className="font-bold text-gray-900">{payment.seller.name}</p>
                  </div>

                  {/* Buyer Info */}
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pembeli</p>
                    <p className="font-bold text-gray-900">{payment.buyer.name}</p>
                    <p className="text-sm text-gray-600">{payment.buyer.email}</p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 items-end">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewImage(getMediaUrl(payment.proof_image));
                      }}
                      className="flex-1 px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-sm font-bold transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px] inline mr-1">image</span>
                      Lihat
                    </button>
                  </div>
                </div>

                {/* Timestamp */}
                <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  Upload: {new Date(payment.proof_uploaded_at).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 bg-black/85 flex items-center justify-center z-50 p-2 sm:p-4 backdrop-blur-sm"
          onClick={() => {
            setPreviewImage(null);
            setIsFullscreen(false);
          }}
        >
          <div
            className={`relative bg-white shadow-2xl flex flex-col overflow-hidden border border-black/10 transition-all duration-200 ${
              isFullscreen 
                ? 'w-full h-full rounded-none' 
                : 'w-full max-w-[96vw] lg:max-w-7xl h-[92vh] max-h-[96vh] rounded-2xl'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-[#FAF7F2] shrink-0 gap-3">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8B4513]">receipt_long</span>
                Bukti Pembayaran Produk
              </h2>
              
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
                {/* Zoom Controls */}
                {!previewImage.toLowerCase().endsWith('.pdf') && (
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg p-0.5 shadow-sm">
                    <button
                      onClick={() => setZoom(z => Math.max(0.4, Number((z - 0.2).toFixed(1))))}
                      className="p-1 sm:p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                      title="Perkecil (-)"
                    >
                      <span className="material-symbols-outlined text-[18px]">zoom_out</span>
                    </button>
                    <button
                      onClick={() => {
                        setZoom(1);
                        setFitMode(fitMode === 'fit' ? 'actual' : 'fit');
                      }}
                      className="px-2 py-0.5 sm:py-1 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded transition-colors min-w-[50px] text-center"
                    >
                      {fitMode === 'fit' ? `${Math.round(zoom * 100)}%` : '100%'}
                    </button>
                    <button
                      onClick={() => setZoom(z => Math.min(3.5, Number((z + 0.2).toFixed(1))))}
                      className="p-1 sm:p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
                      title="Perbesar (+)"
                    >
                      <span className="material-symbols-outlined text-[18px]">zoom_in</span>
                    </button>
                    <button
                      onClick={() => setRotation(r => (r + 90) % 360)}
                      className="p-1 sm:p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors border-l border-gray-100"
                      title="Putar 90°"
                    >
                      <span className="material-symbols-outlined text-[18px]">rotate_right</span>
                    </button>
                    <button
                      onClick={() => {
                        setFitMode(m => m === 'fit' ? 'actual' : 'fit');
                        setZoom(1);
                      }}
                      className={`px-2 py-1 text-xs font-bold rounded transition-colors ${
                        fitMode === 'actual' ? 'bg-[#8B4513] text-white' : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {fitMode === 'actual' ? 'Fit Layar' : 'Ukuran Asli'}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => setIsFullscreen(f => !f)}
                  className="px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 transition-colors shadow-sm"
                  title="Fullscreen"
                >
                  <span className="material-symbols-outlined text-[16px]">
                    {isFullscreen ? 'fullscreen_exit' : 'fullscreen'}
                  </span>
                  <span className="hidden md:inline">{isFullscreen ? 'Kecilkan' : 'Layar Penuh'}</span>
                </button>

                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span className="hidden sm:inline">Tab Baru</span>
                </a>
                <button
                  onClick={() => {
                    setPreviewImage(null);
                    setIsFullscreen(false);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>

            <div className="relative flex-1 bg-[#1A1A1A] p-3 sm:p-6 overflow-auto flex items-center justify-center min-h-[350px]">
              {previewImage.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewImage} title="Bukti Pembayaran PDF" className="w-full h-full min-h-[75vh] rounded-lg border border-gray-700 bg-white" />
              ) : (
                <div
                  className="w-full h-full flex items-center justify-center overflow-auto p-2"
                  onDoubleClick={() => {
                    setZoom(z => (z === 1 ? 1.6 : 1));
                    setFitMode(fitMode === 'fit' ? 'actual' : 'fit');
                  }}
                >
                  <img
                    src={previewImage}
                    alt="Bukti pembayaran"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out',
                    }}
                    className={`rounded-lg shadow-2xl select-none transition-opacity duration-200 cursor-zoom-in ${
                      fitMode === 'fit'
                        ? 'max-w-full max-h-[80vh] w-auto h-auto object-contain'
                        : 'max-w-none max-h-none'
                    }`}
                  />
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between text-xs text-gray-500 gap-2 shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-gray-400">info</span>
                <span>Gunakan tombol zoom atau <strong>Double Click</strong> pada gambar untuk memperbesar detail</span>
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setZoom(1);
                    setRotation(0);
                    setFitMode('fit');
                  }}
                  className="font-medium text-gray-600 hover:text-gray-900 transition-colors"
                >
                  Reset Tampilan
                </button>
                <button
                  onClick={() => {
                    setPreviewImage(null);
                    setIsFullscreen(false);
                  }}
                  className="font-bold text-[#8B4513] hover:underline"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Detail & Action Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPayment(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-xl font-bold">Detail Pembayaran</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedPayment.reference_code}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Product Details */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Produk</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <p>
                    <span className="text-gray-600">Judul:</span> <span className="font-bold">{selectedPayment.product.title}</span>
                  </p>
                  <p>
                    <span className="text-gray-600">Harga:</span>{' '}
                    <span className="font-bold">{rupiah(selectedPayment.product.discount_price || selectedPayment.product.price)}</span>
                  </p>
                </div>
              </div>

              {/* Seller & Buyer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Penjual</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-bold text-gray-900">{selectedPayment.seller.name}</p>
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 mb-3">Pembeli</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="font-bold text-gray-900">{selectedPayment.buyer.name}</p>
                    <p className="text-sm text-gray-600">{selectedPayment.buyer.email}</p>
                  </div>
                </div>
              </div>

              {/* Payment Proof */}
              <div>
                <h3 className="font-bold text-gray-900 mb-3">Bukti Pembayaran</h3>
                {selectedPayment.proof_image ? (
                  <div className="relative group cursor-pointer" onClick={() => setPreviewImage(getMediaUrl(selectedPayment.proof_image))}>
                    <img
                      src={getMediaUrl(selectedPayment.proof_image)}
                      alt="Bukti"
                      className="w-full max-h-72 object-contain rounded-lg border border-gray-200 bg-gray-50 hover:opacity-95 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <span className="bg-white/90 text-gray-800 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm">
                        <span className="material-symbols-outlined text-[16px]">zoom_in</span> Perbesar
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">Belum ada bukti pembayaran diunggah</p>
                )}
                {selectedPayment.proof_notes && (
                  <p className="text-sm text-gray-600 mt-3 p-3 bg-gray-50 rounded-lg">{selectedPayment.proof_notes}</p>
                )}
              </div>

              {/* Action: Verify */}
              <div className="pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleVerify(selectedPayment.id)}
                  disabled={actionLoading}
                  className="w-full px-4 py-3 bg-green-50 text-green-600 border border-green-200 rounded-lg hover:bg-green-100 font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">check_circle</span>
                  {actionLoading ? 'Memproses...' : 'Verifikasi Pembayaran'}
                </button>
              </div>

              {/* Action: Reject */}
              <div className="space-y-3">
                <textarea
                  placeholder="Alasan penolakan (opsional)"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:border-[#008A62] focus:outline-none text-sm"
                  rows="3"
                />
                <button
                  onClick={() => handleReject(selectedPayment.id)}
                  disabled={actionLoading}
                  className="w-full px-4 py-3 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 font-bold transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined">cancel</span>
                  {actionLoading ? 'Memproses...' : 'Tolak Pembayaran'}
                </button>
              </div>

              <button
                onClick={() => setSelectedPayment(null)}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 font-bold transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
