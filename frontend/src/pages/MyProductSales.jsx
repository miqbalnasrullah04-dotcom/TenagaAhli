import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { getMediaUrl } from '../utils/media.js';

export default function MyProductSales() {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [previewImage, setPreviewImage] = useState(null);

  const rupiah = (v) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v);

  const statusConfig = {
    pending_payment: {
      label: 'Menunggu Upload Bukti',
      color: '#7A5900',
      bg: '#FFF4D6',
      icon: 'hourglass_empty',
    },
    pending_verification: {
      label: 'Menunggu Verifikasi Admin',
      color: '#1F2937',
      bg: '#F3F4F6',
      icon: 'pending_actions',
    },
    completed: {
      label: 'Terverifikasi',
      color: '#166534',
      bg: '#DCFCE7',
      icon: 'check_circle',
    },
    payment_rejected: {
      label: 'Ditolak',
      color: '#B3261E',
      bg: '#FFDAD6',
      icon: 'cancel',
    },
  };

  const loadSales = () => {
    setLoading(true);
    api
      .get('/my/product-sales')
      .then((res) => {
        setSales(res.data.data || []);
        setError('');
      })
      .catch((err) => {
        setError('Gagal memuat data penjualan produk');
        console.error(err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadSales();
  }, []);

  const filteredSales =
    filterStatus === 'all'
      ? sales
      : sales.filter((s) => s.status === filterStatus);

  const stats = {
    total: sales.length,
    pending: sales.filter((s) => s.status === 'pending_payment' || s.status === 'pending_verification').length,
    completed: sales.filter((s) => s.status === 'completed').length,
    earning: sales
      .filter((s) => s.status === 'completed')
      .reduce((sum, s) => sum + (s.seller_amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAFBF9]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-[#008A62]/30 border-t-[#008A62] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Memuat data penjualan...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFBF9] py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Penjualan Produk</h1>
            <p className="text-gray-600 mt-1">Kelola penjualan dan pembayaran produk Anda</p>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-bold transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Kembali
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Total Penjualan</p>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Menunggu Proses</p>
            <p className="text-2xl font-bold text-[#7A5900]">{stats.pending}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Terverifikasi</p>
            <p className="text-2xl font-bold text-[#166534]">{stats.completed}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <p className="text-sm text-gray-600 mb-2">Earning</p>
            <p className="text-2xl font-bold text-[#008A62]">{rupiah(stats.earning)}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-6 text-red-700">
            {error}
          </div>
        )}

        {/* Filter */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['all', 'pending_payment', 'pending_verification', 'completed', 'payment_rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-all ${
                filterStatus === status
                  ? 'bg-[#008A62] text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {status === 'all' ? 'Semua' : statusConfig[status]?.label || status}
            </button>
          ))}
        </div>

        {/* Sales List */}
        {filteredSales.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <span className="material-symbols-outlined text-5xl text-gray-300 block mb-4">shopping_bag</span>
            <p className="text-gray-600">
              {filterStatus === 'all' ? 'Belum ada penjualan produk' : 'Tidak ada penjualan dengan status ini'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredSales.map((sale) => {
              const statusInfo = statusConfig[sale.status] || {};
              return (
                <div key={sale.id} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-start">
                    {/* Product */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Produk</p>
                      <p className="font-bold text-gray-900">{sale.product.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{rupiah(sale.product.discount_price || sale.product.price)}</p>
                    </div>

                    {/* Buyer */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pembeli</p>
                      <p className="font-bold text-gray-900">{sale.buyer.name}</p>
                      <p className="text-sm text-gray-600">{sale.buyer.email}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Status</p>
                      <div
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-lg text-sm font-bold"
                        style={{ color: statusInfo.color, backgroundColor: statusInfo.bg }}
                      >
                        <span className="material-symbols-outlined text-[16px]">{statusInfo.icon}</span>
                        {statusInfo.label}
                      </div>
                    </div>

                    {/* Amount */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                        {sale.status === 'completed' ? 'Earning (90%)' : 'Harga Jual'}
                      </p>
                      <p className="font-bold text-[#008A62]">
                        {sale.status === 'completed' ? rupiah(sale.seller_amount) : rupiah(sale.product.discount_price || sale.product.price)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2">
                      {sale.proof_image && (
                        <button
                          onClick={() => setPreviewImage(getMediaUrl(sale.proof_image))}
                          className="px-3 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 text-xs font-bold transition-colors flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">image</span>
                          Bukti
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Kode Referensi</p>
                      <p className="font-mono font-bold text-gray-900">{sale.reference_code}</p>
                    </div>
                    {sale.proof_uploaded_at && (
                      <div>
                        <p className="text-gray-600">Upload Bukti</p>
                        <p className="text-gray-900">{new Date(sale.proof_uploaded_at).toLocaleString('id-ID')}</p>
                      </div>
                    )}
                    {sale.verified_at && (
                      <div>
                        <p className="text-gray-600">Terverifikasi</p>
                        <p className="text-gray-900">{new Date(sale.verified_at).toLocaleString('id-ID')}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-3 sm:p-6 backdrop-blur-sm" onClick={() => setPreviewImage(null)}>
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-[#FAF7F2] shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8B4513]">receipt_long</span>
                Bukti Pembayaran Produk
              </h2>
              <div className="flex items-center gap-2">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 transition-colors shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span className="hidden sm:inline">Tab Baru</span>
                </a>
                <button onClick={() => setPreviewImage(null)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg">
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>
            </div>
            <div className="p-4 sm:p-6 bg-[#F9FAFB] flex items-center justify-center min-h-[300px] max-h-[80vh] overflow-auto">
              {previewImage.toLowerCase().endsWith('.pdf') ? (
                <iframe src={previewImage} title="Bukti Pembayaran PDF" className="w-full h-[70vh] rounded-lg border border-gray-200" />
              ) : (
                <img
                  src={previewImage}
                  alt="Bukti pembayaran"
                  className="max-w-full max-h-[75vh] w-auto h-auto object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
