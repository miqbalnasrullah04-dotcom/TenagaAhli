import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from '../../context/LanguageContext.jsx';
import api from '../../api/client.js';
import { getMediaUrl } from '../../utils/media.js';

export default function AdminPayments() {
  const { t } = useTranslation();

  const statusLabel = {
    menunggu_pembayaran: { text: t('Menunggu Pembayaran'), color: '#414844', bg: '#F5F4F0' },
    menunggu_verifikasi: { text: t('Menunggu Verifikasi'), color: '#7A5900', bg: '#FFF4D6' },
    verified: { text: t('Terverifikasi'), color: '#8B4513', bg: '#F4E8D0' },
    rejected: { text: t('Ditolak'), color: '#B3261E', bg: '#FFDAD6' },
    pending: { text: t('Menunggu Pembayaran'), color: '#7A5900', bg: '#FFF4D6' },
    settlement: { text: t('payment.settlement', 'Lunas (Midtrans)'), color: '#166534', bg: '#DCFCE7' },
    expire: { text: t('payment.expired', 'Kedaluwarsa'), color: '#414844', bg: '#F5F4F0' },
    cancel: { text: t('payment.cancelled', 'Dibatalkan'), color: '#B3261E', bg: '#FFDAD6' },
    deny: { text: t('Ditolak'), color: '#B3261E', bg: '#FFDAD6' },
  };

  const paymentTypeLabel = {
    midtrans: { text: 'Midtrans', icon: 'credit_card', color: '#8B4513' },
    manual: { text: t('Transfer Bank'), icon: 'receipt', color: '#5B6660' },
  };

  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = searchParams.get('status') || 'all';

  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [previewOrder, setPreviewOrder] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [fitMode, setFitMode] = useState('fit'); // 'fit' or 'actual'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const loadData = () => {
    setLoading(true);
    api
      .get('/admin/orders')
      .then((res) => {
        console.log('📦 Orders data received:', res.data);
        console.log('📦 Sample order proof_url:', res.data[0]?.proof_url);
        console.log('📦 Sample order proof_of_payment:', res.data[0]?.proof_of_payment);
        setOrders(res.data);
      })
      .catch(() => setError('Gagal memuat data order.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter orders berdasarkan statusParam dan searchQuery
  useEffect(() => {
    let result = [...orders];

    if (statusParam === 'berhasil') {
      result = result.filter(o => o.status === 'verified' || o.status === 'settlement');
    } else if (statusParam === 'pending') {
      result = result.filter(o => o.status === 'menunggu_pembayaran' || o.status === 'menunggu_verifikasi' || o.status === 'pending');
    } else if (statusParam === 'gagal') {
      result = result.filter(o => o.status === 'rejected' || o.status === 'expire' || o.status === 'cancel' || o.status === 'deny');
    } else if (statusParam === 'refund') {
      result = result.filter(o => o.status === 'refund');
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((order) => {
        return (
          order.expert?.name?.toLowerCase().includes(query) ||
          order.expert?.email?.toLowerCase().includes(query) ||
          order.reference_code?.toLowerCase().includes(query) ||
          order.package?.name?.toLowerCase().includes(query)
        );
      });
    }

    setFilteredOrders(result);
  }, [searchQuery, orders, statusParam]);

  // Hitung statistik
  const stats = {
    total: orders.length,
    berhasil: orders.filter(o => o.status === 'verified' || o.status === 'settlement').length,
    pending: orders.filter(o => o.status === 'menunggu_pembayaran' || o.status === 'menunggu_verifikasi' || o.status === 'pending').length,
    gagal: orders.filter(o => o.status === 'rejected' || o.status === 'expire' || o.status === 'cancel' || o.status === 'deny').length,
    totalRevenue: orders.filter(o => o.status === 'verified' || o.status === 'settlement').reduce((sum, o) => sum + Number(o.amount), 0),
  };

  const handleVerify = async (order) => {
    if (!window.confirm(`Setujui pembayaran untuk ${order.user?.name || 'user ini'} (${order.package_name || 'Paket'})?`)) return;
    try {
      await api.post(`/admin/orders/${order.id}/verify`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memverifikasi.');
    }
  };

  const handleCheckMidtrans = async (order) => {
    try {
      const res = await api.get(`/payment/check-status/${order.reference_code}`);
      const txStatus = res.data?.transaction_status || res.data?.data?.record?.status;
      alert(`Status transaksi Midtrans: ${txStatus || 'Berhasil disinkronisasi'}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal memeriksa status Midtrans.');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await api.post(`/admin/orders/${rejectTarget.id}/reject`, { reject_reason: rejectReason });
      setRejectTarget(null);
      setRejectReason('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menolak order.');
    }
  };

  const tabs = [
    { id: 'all', label: 'Semua Transaksi' },
    { id: 'berhasil', label: 'Berhasil' },
    { id: 'pending', label: 'Pending' },
    { id: 'gagal', label: 'Gagal' },
    { id: 'refund', label: 'Refund' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#8B4513]">Verifikasi & Riwayat Pembayaran</h2>
        <p className="text-[#414844]/80 text-sm mt-1">Konfirmasi bukti pembayaran premium dan pantau riwayat keuangan pendaftaran.</p>
      </div>

      {/* Statistik Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-[#8B4513]/10 to-[#8B4513]/5 rounded-xl p-4 border border-[#8B4513]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#414844]/70">Total Transaksi</span>
            <span className="material-symbols-outlined text-[#8B4513] text-[20px]">receipt_long</span>
          </div>
          <p className="text-2xl font-bold text-[#8B4513]">{stats.total}</p>
          <p className="text-[10px] text-[#414844]/60 mt-1">Semua waktu</p>
        </div>

        <div className="bg-gradient-to-br from-[#166534]/10 to-[#166534]/5 rounded-xl p-4 border border-[#166534]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#414844]/70">Berhasil</span>
            <span className="material-symbols-outlined text-[#166534] text-[20px]">check_circle</span>
          </div>
          <p className="text-2xl font-bold text-[#166534]">{stats.berhasil}</p>
          <p className="text-[10px] text-[#414844]/60 mt-1">Rp{stats.totalRevenue.toLocaleString('id-ID')} terkumpul</p>
        </div>

        <div className="bg-gradient-to-br from-[#7A5900]/10 to-[#7A5900]/5 rounded-xl p-4 border border-[#7A5900]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#414844]/70">Pending</span>
            <span className="material-symbols-outlined text-[#7A5900] text-[20px]">schedule</span>
          </div>
          <p className="text-2xl font-bold text-[#7A5900]">{stats.pending}</p>
          <p className="text-[10px] text-[#414844]/60 mt-1">Menunggu verifikasi/pembayaran</p>
        </div>

        <div className="bg-gradient-to-br from-[#B3261E]/10 to-[#B3261E]/5 rounded-xl p-4 border border-[#B3261E]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-[#414844]/70">Gagal</span>
            <span className="material-symbols-outlined text-[#B3261E] text-[20px]">cancel</span>
          </div>
          <p className="text-2xl font-bold text-[#B3261E]">{stats.gagal}</p>
          <p className="text-[10px] text-[#414844]/60 mt-1">Ditolak/expired/dibatalkan</p>
        </div>
      </div>

      {error && <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3">{error}</div>}

      <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm overflow-hidden">
        {/* Search Bar */}
        <div className="p-5 border-b border-[#6B3410]/15">
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between mb-3">
            <h3 className="font-bold text-[#6B3410] flex items-center gap-2">
              <span className="material-symbols-outlined">list</span>
              Daftar Transaksi
            </h3>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-[#6B3410]/10 hover:bg-[#6B3410]/20 text-[#6B3410] rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[16px] ${loading ? 'animate-spin' : ''}`}>
                {loading ? 'progress_activity' : 'refresh'}
              </span>
              {loading ? 'Memuat...' : 'Refresh Data'}
            </button>
          </div>
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#414844]/40 text-[20px]">
              search
            </span>
            <input
              type="text"
              placeholder="Cari nama user, kode referensi, atau nama paket..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-[#6B3410]/20 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#6B3410]/30 focus:border-[#6B3410] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#414844]/40 hover:text-[#6B3410] transition-colors"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-xs text-[#414844]/60 mt-2">
              Menampilkan {filteredOrders.length} dari {orders.length} hasil
            </p>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="p-4 sm:p-5 border-b border-[#6B3410]/15 flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSearchParams({ status: tab.id })}
              className={`px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
                statusParam === tab.id
                  ? 'bg-[#6B3410] text-white shadow-sm'
                  : 'bg-[#6B3410]/5 text-[#414844] hover:bg-[#6B3410]/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Mobile swipe hint */}
        <div className="lg:hidden px-4 py-2 bg-amber-50/70 border-b border-amber-100/60 text-[11px] text-amber-900/80 flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[15px] text-amber-700">swipe</span>
          <span>Geser tabel ke samping untuk melihat detail transaksi</span>
        </div>

        <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
          <table className="w-full text-left text-sm min-w-[950px] lg:min-w-[1100px]">
            <thead>
              <tr className="bg-[#6B3410]/5 text-[#414844] text-xs font-semibold">
                <th className="px-4 py-3.5 whitespace-nowrap">User / Pendaftar</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Kode Ref</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Paket</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-right">Nominal</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Metode</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Bukti Transfer</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Status</th>
                <th className="px-4 py-3.5 whitespace-nowrap">Tanggal</th>
                <th className="px-4 py-3.5 whitespace-nowrap text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#6B3410]/10">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-10 w-10 border-4 border-[#6B3410]/20 border-t-[#6B3410]"></div>
                      <p className="text-sm text-[#414844]/70">Memuat data transaksi...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <span className="material-symbols-outlined text-[48px] text-[#414844]/30">receipt_long</span>
                      <p className="text-sm text-[#414844]/70 font-semibold">
                        {searchQuery ? `Tidak ditemukan hasil untuk "${searchQuery}"` : 'Tidak ada data transaksi pada filter ini.'}
                      </p>
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="mt-2 px-4 py-2 bg-[#6B3410]/10 hover:bg-[#6B3410]/20 text-[#6B3410] text-xs font-bold rounded-lg transition-all"
                        >
                          Hapus Filter Pencarian
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const s = statusLabel[o.status] || statusLabel.menunggu_pembayaran;
                  const paymentType = o.payment_type || (o.snap_token ? 'midtrans' : 'manual');
                  const pt = paymentTypeLabel[paymentType] || paymentTypeLabel.manual;
                  
                  return (
                    <tr key={o.id} className="hover:bg-[#6B3410]/5 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#6B3410]/10 flex items-center justify-center text-[#6B3410] font-bold text-xs">
                            {o.user?.name?.charAt(0).toUpperCase() || 'U'}
                          </div>
                          <div>
                            <p className="font-semibold text-[#6B3410] text-sm">{o.user?.name}</p>
                            <p className="text-xs text-[#414844]/60">{o.user?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-mono text-xs bg-[#F5F4F0] px-2 py-1 rounded">{o.reference_code}</span>
                      </td>
                      <td className="px-4 py-4">
                        <span className="font-semibold text-[#1F2A22] text-sm">{o.package_name || 'Premium'}</span>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <span className="font-bold text-[#6B3410]">Rp{Number(o.amount).toLocaleString('id-ID')}</span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${pt.color}15` }}>
                            <span className="material-symbols-outlined text-[16px]" style={{ color: pt.color }}>
                              {pt.icon}
                            </span>
                          </div>
                          <div>
                            <span className="text-xs font-semibold block" style={{ color: pt.color }}>
                              {pt.text}
                            </span>
                            {o.snap_token && (
                              <span className="text-[9px] text-[#5B6660]/60 block">
                                Token: {o.snap_token.substring(0, 15)}...
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {(o.proof_url || o.proof_of_payment) ? (
                          <button
                            onClick={() => {
                              const resolvedUrl = getMediaUrl(o.proof_url || o.proof_of_payment);
                              console.log('🖼️ Opening image preview:', resolvedUrl);
                              console.log('📄 Full order data:', o);
                              setPreviewOrder(o);
                              setPreviewImage(resolvedUrl);
                              setImageLoading(true);
                              setImageError(false);
                              setZoom(1);
                              setRotation(0);
                              setFitMode('fit');
                            }}
                            className="text-[#6B3410] hover:underline text-xs font-bold flex items-center gap-1 hover:gap-1.5 transition-all bg-[#6B3410]/10 hover:bg-[#6B3410]/20 px-2.5 py-1.5 rounded-lg"
                          >
                            <span className="material-symbols-outlined text-sm">receipt_long</span> 
                            <span>Lihat Bukti</span>
                          </button>
                        ) : paymentType === 'midtrans' ? (
                          <span className="text-xs text-[#8B4513] italic flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">payment</span>
                            Dibayar via Midtrans
                          </span>
                        ) : (
                          <span className="text-xs text-[#414844]/50 italic flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">hide_image</span>
                            Belum diunggah
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-lg inline-flex items-center gap-1" style={{ color: s.color, backgroundColor: s.bg }}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                          {s.text}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-xs text-[#414844]/75">
                          <p className="font-semibold">
                            {new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </p>
                          <p className="text-[10px] text-[#414844]/50">
                            {new Date(o.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {/* Pending / Menunggu Verifikasi / Menunggu Pembayaran */}
                        {(o.status === 'menunggu_verifikasi' || o.status === 'menunggu_pembayaran' || o.status === 'pending') && (
                          <div className="flex items-center gap-1.5 justify-center flex-wrap">
                            {paymentType === 'midtrans' && (
                              <button
                                onClick={() => handleCheckMidtrans(o)}
                                className="bg-[#1E3A8A]/10 hover:bg-[#1E3A8A]/20 text-[#1E3A8A] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                                title="Sinkronisasi status pembayaran dengan Midtrans"
                              >
                                <span className="material-symbols-outlined text-[14px]">sync</span>
                                <span className="hidden xl:inline">Cek Midtrans</span>
                              </button>
                            )}
                            <button
                              onClick={() => handleVerify(o)}
                              className="bg-[#166534]/10 hover:bg-[#166534]/20 text-[#166534] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Setujui dan Aktifkan Paket"
                            >
                              <span className="material-symbols-outlined text-[14px]">check_circle</span>
                              <span>Setujui</span>
                            </button>
                            <button
                              onClick={() => setRejectTarget(o)}
                              className="bg-[#B3261E]/10 hover:bg-[#B3261E]/20 text-[#B3261E] px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
                              title="Tolak Pembayaran"
                            >
                              <span className="material-symbols-outlined text-[14px]">cancel</span>
                              <span className="hidden xl:inline">Tolak</span>
                            </button>
                          </div>
                        )}
                        {(o.status === 'verified' || o.status === 'settlement' || o.status === 'paid') && (
                          <div className="flex justify-center">
                            <span className="text-[10px] text-[#166534] font-bold flex items-center gap-1 bg-[#DCFCE7] px-2.5 py-1 rounded-lg">
                              <span className="material-symbols-outlined text-[14px]">verified</span>
                              <span>Terverifikasi</span>
                            </span>
                          </div>
                        )}
                        {o.status === 'rejected' && (
                          <div className="flex justify-center">
                            <span className="text-[10px] text-[#B3261E] font-bold flex items-center gap-1 bg-[#FFDAD6] px-2.5 py-1 rounded-lg" title={o.reject_reason || 'Ditolak'}>
                              <span className="material-symbols-outlined text-[14px]">block</span>
                              <span>Ditolak</span>
                            </span>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {previewImage && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-2 sm:p-4 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => {
            setPreviewImage(null);
            setImageLoading(false);
            setImageError(false);
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
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-200 bg-[#FAF7F2] shrink-0 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="material-symbols-outlined text-[#8B4513] text-[26px]">receipt_long</span>
                <div className="min-w-0">
                  <h3 className="font-bold text-sm sm:text-base text-gray-900 truncate">
                    Bukti Pembayaran {previewOrder?.reference_code ? `• ${previewOrder.reference_code}` : ''}
                  </h3>
                  {previewOrder?.user?.name && (
                    <p className="text-xs text-gray-500 truncate">
                      {previewOrder.user.name} • {previewOrder.package_name || 'Paket Premium'} • Rp{Number(previewOrder.amount || 0).toLocaleString('id-ID')}
                    </p>
                  )}
                </div>
              </div>

              {/* Toolbar Controls */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 flex-wrap">
                {/* Zoom & Fit Controls (Only for images) */}
                {!previewImage?.toLowerCase()?.endsWith('.pdf') && !imageError && (
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
                      title="Klik untuk ubah mode (Fit / 100%)"
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
                      title="Toggle Ukuran Penuh / Fit Layar"
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
                  className="px-2.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold text-gray-700 flex items-center gap-1 transition-colors shadow-sm"
                  title="Buka gambar penuh di tab baru"
                >
                  <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                  <span className="hidden sm:inline">Tab Baru</span>
                </a>
                <a
                  href={previewImage}
                  download={`bukti-${previewOrder?.reference_code || 'transfer'}`}
                  className="px-2.5 py-1.5 bg-[#8B4513] hover:bg-[#6B3410] rounded-lg text-xs font-bold text-white flex items-center gap-1 transition-colors shadow-sm"
                  title="Unduh file bukti"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  <span className="hidden sm:inline">Unduh</span>
                </a>
                <button
                  onClick={() => {
                    setPreviewImage(null);
                    setImageLoading(false);
                    setImageError(false);
                    setIsFullscreen(false);
                  }}
                  className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <span className="material-symbols-outlined text-[22px]">close</span>
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="relative flex-1 bg-[#1A1A1A] p-3 sm:p-6 overflow-auto flex items-center justify-center min-h-[350px]">
              {imageLoading && !imageError && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#1A1A1A]/80 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-amber-500/20 border-t-amber-500"></div>
                    <p className="text-xs text-gray-300 font-medium">Memuat bukti pembayaran...</p>
                  </div>
                </div>
              )}

              {imageError ? (
                <div className="flex flex-col items-center gap-3 p-8 text-center max-w-md bg-white rounded-xl shadow-lg">
                  <span className="material-symbols-outlined text-[56px] text-red-500">broken_image</span>
                  <p className="text-sm font-bold text-red-700">Gagal Menampilkan Gambar</p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    File bukti pembayaran tidak dapat dimuat secara langsung di modal. Anda dapat mencoba membukanya langsung di tab baru.
                  </p>
                  <div className="flex gap-2 mt-2">
                    <a
                      href={previewImage}
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2 bg-[#8B4513] text-white text-xs font-bold rounded-lg hover:bg-[#6B3410] transition-colors flex items-center gap-1.5"
                    >
                      <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      Buka di Tab Baru
                    </a>
                  </div>
                </div>
              ) : previewImage?.toLowerCase()?.endsWith('.pdf') ? (
                <div className="w-full h-full min-h-[75vh] flex flex-col items-center justify-center">
                  <iframe src={previewImage} title="Bukti Transfer PDF" className="w-full h-full rounded-lg border border-gray-700 bg-white" />
                </div>
              ) : (
                <div 
                  className={`w-full h-full flex items-center justify-center overflow-auto p-2`}
                  onDoubleClick={() => {
                    setZoom(z => (z === 1 ? 1.6 : 1));
                    setFitMode(fitMode === 'fit' ? 'actual' : 'fit');
                  }}
                >
                  <img
                    src={previewImage}
                    alt="Bukti Transfer"
                    style={{
                      transform: `scale(${zoom}) rotate(${rotation}deg)`,
                      transformOrigin: 'center center',
                      transition: 'transform 0.15s ease-out',
                    }}
                    className={`rounded-lg shadow-2xl select-none transition-opacity duration-200 cursor-zoom-in ${
                      fitMode === 'fit'
                        ? 'max-w-full max-h-[80vh] w-auto h-auto object-contain'
                        : 'max-w-none max-h-none'
                    } ${imageLoading ? 'opacity-0' : 'opacity-100'}`}
                    onLoad={() => setImageLoading(false)}
                    onError={() => {
                      setImageLoading(false);
                      setImageError(true);
                    }}
                  />
                </div>
              )}
            </div>
            
            {/* Footer */}
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
                    setImageLoading(false);
                    setImageError(false);
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

      {rejectTarget && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-lg text-[#6B3410] mb-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-red-500">cancel</span>
              Tolak Pembayaran
            </h3>
            <p className="text-xs text-[#414844]/70 mb-4 leading-relaxed">
              Berikan alasan mengapa pembayaran ini ditolak agar pengguna dapat mengunggah bukti yang benar.
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Contoh: Bukti transfer tidak jelas atau nominal tidak sesuai."
              className="w-full border border-[#6B3410]/30 rounded-xl px-3 py-2 text-xs mb-4 focus:ring-2 focus:ring-[#6B3410]/30 focus:border-[#6B3410] focus:outline-none resize-none"
            />
            <div className="flex justify-end gap-3 pt-2 border-t border-black/5">
              <button
                onClick={() => {
                  setRejectTarget(null);
                  setRejectReason('');
                }}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#414844] hover:bg-[#F5F4EF] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleReject}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#B3261E] text-white hover:bg-[#93000A] shadow-md shadow-[#B3261E]/10 transition-colors"
              >
                Kirim Penolakan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}