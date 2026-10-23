import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';

export default function AdminReports() {
  const [searchParams, setSearchParams] = useSearchParams();
  const typeParam = searchParams.get('type') || 'tenaga_ahli';

  const [loading, setLoading] = useState(true);
  
  // map url type param to local tab
  const activeTab = typeParam === 'tenaga_ahli' ? 'pendaftaran' : 'pembayaran';
  
  const setActiveTab = (tab) => {
    setSearchParams({ type: tab === 'pendaftaran' ? 'tenaga_ahli' : 'pembayaran' });
  };

  const [experts, setExperts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({
    pendaftaran: { total: 0, menunggu: 0, aktif: 0, ditolak: 0 },
    pembayaran: { total: 0, amount: 0, pending: 0, pendingAmount: 0 },
  });

  const loadData = () => {
    setLoading(true);
    Promise.allSettled([
      api.get('/admin/experts'),
      api.get('/admin/orders'),
    ])
      .then(([expertsRes, ordersRes]) => {
        const expList = expertsRes.status === 'fulfilled' ? expertsRes.value.data : [];
        const ordList = ordersRes.status === 'fulfilled' ? ordersRes.value.data : [];

        const expertsList = Array.isArray(expList) ? expList : [];
        const ordersList = Array.isArray(ordList) ? ordList : [];

        setExperts(expertsList);
        setOrders(ordersList);

        const verifiedOrders = ordersList.filter(o => o.status === 'verified');
        const pendingOrders = ordersList.filter(o => o.status === 'menunggu_verifikasi');
        const revenue = verifiedOrders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);
        const pendingRev = pendingOrders.reduce((sum, o) => sum + parseFloat(o.amount || 0), 0);

        setStats({
          pendaftaran: {
            total: expertsList.length,
            menunggu: expertsList.filter(e => e.profile_status === 'menunggu_verifikasi').length,
            aktif: expertsList.filter(e => e.profile_status === 'aktif').length,
            ditolak: expertsList.filter(e => e.profile_status === 'ditolak').length,
          },
          pembayaran: {
            total: verifiedOrders.length,
            amount: revenue,
            pending: pendingOrders.length,
            pendingAmount: pendingRev,
          },
        });
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
  };

  const exportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    
    if (activeTab === 'pendaftaran') {
      csvContent += "Nama,Email,No HP,Instansi,Bidang,Status Profil,Tanggal Terdaftar\r\n";
      experts.forEach((e) => {
        const row = [
          `"${e.name || ''}"`,
          `"${e.user?.email || e.email || ''}"`,
          `"${e.phone || ''}"`,
          `"${e.institution || ''}"`,
          `"${e.field || ''}"`,
          `"${e.profile_status || ''}"`,
          `"${e.created_at ? new Date(e.created_at).toLocaleDateString('id-ID') : ''}"`
        ].join(",");
        csvContent += row + "\r\n";
      });
    } else {
      csvContent += "Ref Code,Nama User,Email,Nama Paket,Jumlah Pembayaran,Status,Tanggal Transaksi\r\n";
      orders.forEach((o) => {
        const row = [
          `"${o.reference_code || ''}"`,
          `"${o.user?.name || ''}"`,
          `"${o.user?.email || ''}"`,
          `"${o.package_name || ''}"`,
          `"${o.amount || 0}"`,
          `"${o.status || ''}"`,
          `"${o.created_at ? new Date(o.created_at).toLocaleDateString('id-ID') : ''}"`
        ].join(",");
        csvContent += row + "\r\n";
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_${activeTab === 'pendaftaran' ? 'Pendaftaran' : 'Pembayaran'}_AMDAL.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportPDF = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 text-[#5B6660] p-8">
        <span className="w-5 h-5 rounded-full border-2 border-[#6B3410]/30 border-t-[#6B3410] animate-spin" />
        Memuat laporan...
      </div>
    );
  }

  return (
    <div className="space-y-6 printable-area">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 non-printable">
        <div>
          <h2 className="text-2xl font-bold text-[#6B3410]">Laporan & Analitik</h2>
          <p className="text-[#414844]/80 text-sm mt-1">Pantau status pendaftaran, keanggotaan premium, dan transaksi masuk.</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={exportPDF}
            className="flex items-center gap-1.5 bg-white text-[#6B3410] border border-[#6B3410] px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#6B3410]/5 transition-colors"
          >
            <span className="material-symbols-outlined text-base">picture_as_pdf</span>
            Export PDF
          </button>
          <button
            onClick={exportExcel}
            className="flex items-center gap-1.5 bg-[#6B3410] text-white px-4 py-2 rounded-lg text-xs font-bold hover:bg-[#55290A] transition-colors"
          >
            <span className="material-symbols-outlined text-base">table_view</span>
            Export Excel (CSV)
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-[#6B3410]/15 flex gap-4 non-printable">
        <button
          onClick={() => setActiveTab('pendaftaran')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'pendaftaran'
              ? 'border-[#6B3410] text-[#6B3410]'
              : 'border-transparent text-[#414844]/65 hover:text-[#6B3410]'
          }`}
        >
          Laporan Pendaftaran
        </button>
        <button
          onClick={() => setActiveTab('pembayaran')}
          className={`pb-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === 'pembayaran'
              ? 'border-[#6B3410] text-[#6B3410]'
              : 'border-transparent text-[#414844]/65 hover:text-[#6B3410]'
          }`}
        >
          Laporan Pembayaran
        </button>
      </div>

      {/* Print-only Header */}
      <div className="hidden print-header-custom mb-6">
        <h1 className="text-2xl font-bold text-[#6B3410] border-b pb-2">TenagaAhli.com — LAPORAN RESMI</h1>
        <p className="text-xs text-gray-500 mt-1">Diunduh pada: {new Date().toLocaleString('id-ID')}</p>
        <h2 className="text-lg font-semibold mt-4">
          Laporan {activeTab === 'pendaftaran' ? 'Pendaftaran Tenaga Ahli' : 'Pembayaran Keanggotaan'}
        </h2>
      </div>

      {activeTab === 'pendaftaran' ? (
        <div className="space-y-6">
          {/* Registration Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-[#6B3410]/15 shadow-sm">
              <h4 className="text-xs text-[#414844]/80 font-semibold uppercase">Total Pendaftar</h4>
              <p className="text-2xl font-bold text-[#1F2A22] mt-1">{stats.pendaftaran.total}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#6B3410]/15 shadow-sm">
              <h4 className="text-xs text-[#414844]/80 font-semibold uppercase">Menunggu Verifikasi</h4>
              <p className="text-2xl font-bold text-[#7A5900] mt-1">{stats.pendaftaran.menunggu}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#6B3410]/15 shadow-sm">
              <h4 className="text-xs text-[#414844]/80 font-semibold uppercase">Aktif / Disetujui</h4>
              <p className="text-2xl font-bold text-[#6B3410] mt-1">{stats.pendaftaran.aktif}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#6B3410]/15 shadow-sm">
              <h4 className="text-xs text-[#414844]/80 font-semibold uppercase">Ditolak</h4>
              <p className="text-2xl font-bold text-[#B3261E] mt-1">{stats.pendaftaran.ditolak}</p>
            </div>
          </div>

          {/* Registration List */}
          <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#6B3410]/15">
              <h3 className="font-bold text-[#6B3410] text-sm">Daftar Pendaftar Terdaftar</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#6B3410]/5 text-[#414844]">
                    <th className="px-6 py-3">Nama</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Instansi</th>
                    <th className="px-6 py-3">Bidang</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Tanggal Terdaftar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#6B3410]/10">
                  {experts.map((e) => (
                    <tr key={e.id} className="hover:bg-[#6B3410]/5">
                      <td className="px-6 py-4 font-semibold text-[#6B3410]">{e.name}</td>
                      <td className="px-6 py-4 text-[#414844]/80">{e.user?.email || e.email}</td>
                      <td className="px-6 py-4 text-[#414844]/80">{e.institution || '-'}</td>
                      <td className="px-6 py-4 text-[#414844]/80">{e.field || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          e.profile_status === 'aktif' ? 'bg-[#F5EBE1] text-[#6B3410]' :
                          e.profile_status === 'menunggu_verifikasi' ? 'bg-[#FFF4D6] text-[#7A5900]' :
                          e.profile_status === 'ditolak' ? 'bg-[#FFDAD6] text-[#B3261E]' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {e.profile_status === 'aktif' ? 'Disetujui' :
                           e.profile_status === 'menunggu_verifikasi' ? 'Menunggu' :
                           e.profile_status === 'ditolak' ? 'Ditolak' : e.profile_status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#414844]/70">
                        {new Date(e.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Payment Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-5 rounded-xl border border-[#6B3410]/15 shadow-sm">
              <h4 className="text-xs text-[#414844]/80 font-semibold uppercase">Total Pendapatan Bersih</h4>
              <p className="text-2xl font-bold text-[#6B3410] mt-1">{formatRupiah(stats.pembayaran.amount)}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#6B3410]/15 shadow-sm">
              <h4 className="text-xs text-[#414844]/80 font-semibold uppercase">Transaksi Berhasil</h4>
              <p className="text-2xl font-bold text-[#1F2A22] mt-1">{stats.pembayaran.total}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#6B3410]/15 shadow-sm">
              <h4 className="text-xs text-[#414844]/80 font-semibold uppercase">Transaksi Tertunda</h4>
              <p className="text-2xl font-bold text-[#7A5900] mt-1">{stats.pembayaran.pending}</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-[#6B3410]/15 shadow-sm">
              <h4 className="text-xs text-[#414844]/80 font-semibold uppercase">Nominal Tertunda</h4>
              <p className="text-2xl font-bold text-[#414844]/65 mt-1">{formatRupiah(stats.pembayaran.pendingAmount)}</p>
            </div>
          </div>

          {/* Payment List */}
          <div className="bg-white rounded-xl border border-[#6B3410]/15 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-[#6B3410]/15">
              <h3 className="font-bold text-[#6B3410] text-sm">Daftar Riwayat Transaksi Premium</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-[#6B3410]/5 text-[#414844]">
                    <th className="px-6 py-3">Ref Code</th>
                    <th className="px-6 py-3">Pendaftar</th>
                    <th className="px-6 py-3">Nama Paket</th>
                    <th className="px-6 py-3">Jumlah</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Tanggal Transaksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#6B3410]/10">
                  {orders.map((o) => (
                    <tr key={o.id} className="hover:bg-[#6B3410]/5">
                      <td className="px-6 py-4 font-mono text-xs font-semibold">{o.reference_code}</td>
                      <td className="px-6 py-4">
                        <span className="font-semibold">{o.user?.name || '-'}</span>
                      </td>
                      <td className="px-6 py-4">{o.package_name || 'Premium'}</td>
                      <td className="px-6 py-4 font-bold text-[#6B3410]">{formatRupiah(o.amount)}</td>
                      <td className="px-6 py-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          o.status === 'verified' ? 'bg-[#F5EBE1] text-[#6B3410]' :
                          o.status === 'menunggu_verifikasi' ? 'bg-[#FFF4D6] text-[#7A5900]' :
                          o.status === 'rejected' ? 'bg-[#FFDAD6] text-[#B3261E]' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {o.status === 'verified' ? 'Berhasil' :
                           o.status === 'menunggu_verifikasi' ? 'Tertunda' :
                           o.status === 'rejected' ? 'Ditolak' : o.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#414844]/70">
                        {new Date(o.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      {/* Printable CSS setup */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .printable-area, .printable-area * {
            visibility: visible;
          }
          .printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .non-printable {
            display: none !important;
          }
          .print-header-custom {
            display: block !important;
          }
        }
      `}</style>
    </div>
  );
}
