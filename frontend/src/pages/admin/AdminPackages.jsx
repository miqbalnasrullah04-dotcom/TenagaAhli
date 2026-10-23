import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/client.js';
import ConfirmDialog from '../../components/admin/ConfirmDialog.jsx';

const ROLE_TABS = [
  { id: 'all',           label: 'Semua',         icon: 'grid_view' },
  { id: 'tenaga_ahli',   label: 'Tenaga Ahli',   icon: 'workspace_premium' },
  { id: 'tenaga_teknis', label: 'Tenaga Teknis', icon: 'engineering' },
  { id: 'surveyor',      label: 'Surveyor',       icon: 'map' },
];

const ROLE_BADGE = {
  tenaga_ahli:   { label: 'Tenaga Ahli',   bg: '#F4E8D0', color: '#8B4513' },
  tenaga_teknis: { label: 'Tenaga Teknis', bg: '#CCFBF1', color: '#0D9488' },
  surveyor:      { label: 'Surveyor',      bg: '#DBEAFE', color: '#1D4ED8' },
  all:           { label: 'Semua Role',    bg: '#F0FDF4', color: '#15803D' },
};

function formatRupiah(v) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(v);
}

export default function AdminPackages() {
  const [searchParams, setSearchParams] = useSearchParams();
  const roleParam  = searchParams.get('role')  || 'all';
  const priceParam = searchParams.get('price') || 'all';

  const [allPackages, setAllPackages] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [togglingId,   setTogglingId]   = useState(null);

  const loadData = () => {
    setLoading(true);
    setError('');
    api.get('/admin/packages')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : res.data?.data || [];
        setAllPackages([...data].sort((a, b) => {
          // Sort: role_type dulu (tenaga_ahli → tenaga_teknis → surveyor → all), lalu order
          const roleOrder = { tenaga_ahli: 0, tenaga_teknis: 1, surveyor: 2, all: 3 };
          const ra = roleOrder[a.role_type] ?? 4;
          const rb = roleOrder[b.role_type] ?? 4;
          if (ra !== rb) return ra - rb;
          return (a.order ?? 0) - (b.order ?? 0);
        }));
      })
      .catch(() => setError('Gagal memuat data paket dari server.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  // Filter oleh role tab + filter harga
  const packages = allPackages.filter((pkg) => {
    const matchRole  = roleParam  === 'all' || pkg.role_type === roleParam;
    const matchPrice = priceParam === 'all'
      || (priceParam === 'free'    && (!pkg.price || pkg.price === 0))
      || (priceParam === 'premium' && pkg.price > 0);
    return matchRole && matchPrice;
  });

  const setParam = (key, val) => {
    const next = new URLSearchParams(searchParams);
    if (val === 'all') next.delete(key); else next.set(key, val);
    setSearchParams(next);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.delete(`/admin/packages/${deleteTarget.id}`);
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus paket.');
    }
  };

  const handleToggleActive = async (pkg) => {
    setTogglingId(pkg.id);
    try {
      await api.put(`/admin/packages/${pkg.id}`, { ...pkg, is_active: !pkg.is_active });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal mengubah status paket.');
    } finally {
      setTogglingId(null);
    }
  };

  // Hitung statistik ringkas
  const stats = {
    total:        allPackages.length,
    tenagaAhli:   allPackages.filter(p => p.role_type === 'tenaga_ahli').length,
    tenagaTeknis: allPackages.filter(p => p.role_type === 'tenaga_teknis').length,
    surveyor:     allPackages.filter(p => p.role_type === 'surveyor').length,
    allRole:      allPackages.filter(p => p.role_type === 'all').length,
    premium:      allPackages.filter(p => p.price > 0).length,
    free:         allPackages.filter(p => !p.price || p.price === 0).length,
  };

  return (
    <div>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#8B4513]">Kelola Paket</h2>
          <p className="text-[#414844]/80 text-sm mt-1">
            Atur paket Free dan Premium untuk Tenaga Ahli, Tenaga Teknis, dan Surveyor secara terpisah.
          </p>
        </div>
        <Link
          to="/admin/paket/tambah"
          className="flex items-center justify-center gap-2 bg-[#8B4513] text-white px-4 py-2.5 rounded-lg text-sm font-bold hover:bg-[#6B3410] transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Tambah Paket
        </Link>
      </div>

      {error && <div className="mb-4 bg-[#FFDAD6] text-[#93000A] text-sm rounded-lg p-3">{error}</div>}

      {/* ── Stat cards ── */}
      {!loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'Total',        value: stats.total,       color: '#8B4513', bg: '#F4E8D0' },
            { label: 'Tenaga Ahli',  value: stats.tenagaAhli,  color: '#8B4513', bg: '#FEF3C7' },
            { label: 'Surveyor',     value: stats.surveyor,    color: '#1D4ED8', bg: '#DBEAFE' },
            { label: 'Semua Role',   value: stats.allRole,     color: '#15803D', bg: '#F0FDF4' },
            { label: 'Premium',      value: stats.premium,     color: '#6B3410', bg: '#F4E8D0' },
            { label: 'Free',         value: stats.free,        color: '#374151', bg: '#F3F4F6' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-black/5 shadow-sm p-3 text-center">
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Role Tabs ── */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {ROLE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setParam('role', tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
              roleParam === tab.id
                ? 'bg-[#8B4513] text-white shadow-sm'
                : 'bg-[#8B4513]/5 text-[#414844] hover:bg-[#8B4513]/10'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ml-0.5 ${
              roleParam === tab.id ? 'bg-white/20 text-white' : 'bg-[#8B4513]/10 text-[#8B4513]'
            }`}>
              {tab.id === 'all'
                ? allPackages.length
                : allPackages.filter(p => p.role_type === tab.id).length}
            </span>
          </button>
        ))}

        {/* Divider */}
        <span className="text-gray-300 self-center">|</span>

        {/* Price filter */}
        {[
          { id: 'all', label: 'Semua Harga' },
          { id: 'free', label: 'Free' },
          { id: 'premium', label: 'Premium' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setParam('price', tab.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-colors whitespace-nowrap ${
              priceParam === tab.id
                ? 'bg-[#414844] text-white shadow-sm'
                : 'bg-[#414844]/5 text-[#414844] hover:bg-[#414844]/10'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Package grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-[#8B4513]/10 shadow-sm p-6 h-64 animate-pulse">
              <div className="h-4 w-20 bg-[#8B4513]/10 rounded-full mb-4" />
              <div className="h-6 w-32 bg-[#8B4513]/10 rounded mb-3" />
              <div className="h-8 w-24 bg-[#6B3410]/10 rounded mb-6" />
            </div>
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#6B3410]/15 shadow-sm p-12 flex flex-col items-center justify-center text-center">
          <span className="material-symbols-outlined text-[48px] text-[#414844]/30 mb-3">workspace_premium</span>
          <p className="text-[#414844]/70 font-medium">Belum ada paket pada kategori ini.</p>
          <Link to="/admin/paket/tambah" className="text-[#6B3410] hover:underline text-sm font-bold mt-2">
            Tambah paket baru
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {packages.map((pkg) => {
            const isPremium = pkg.price > 0;
            const roleBadge = ROLE_BADGE[pkg.role_type] ?? ROLE_BADGE.all;
            return (
              <div
                key={pkg.id}
                className={`relative flex flex-col bg-white rounded-2xl shadow-sm p-6 border-2 transition-shadow hover:shadow-md ${
                  isPremium ? 'border-[#6B4F3B]/25' : 'border-[#6B3410]/10'
                } ${!pkg.is_active ? 'opacity-60' : ''}`}
              >
                {/* Order badge */}
                <span className="absolute top-4 right-4 text-[10px] font-bold text-[#414844]/40 bg-[#414844]/5 w-6 h-6 rounded-full flex items-center justify-center">
                  {pkg.order ?? '-'}
                </span>

                {/* Role + Price badges */}
                <div className="flex items-center gap-2 mb-4 flex-wrap">
                  <span
                    className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide"
                    style={{ backgroundColor: roleBadge.bg, color: roleBadge.color }}
                  >
                    {roleBadge.label}
                  </span>
                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full tracking-wide ${
                      isPremium ? 'text-[#6B4F3B] bg-[#6B4F3B]/10' : 'text-[#414844] bg-[#414844]/10'
                    }`}
                  >
                    {isPremium ? 'Premium' : 'Free'}
                  </span>
                </div>

                {/* Name + price */}
                <h3 className="text-lg font-bold text-[#1B1C1A] mb-1">{pkg.name}</h3>
                {isPremium ? (
                  <div className="mb-2">
                    <p className="text-2xl font-extrabold text-[#6B3410]">
                      {formatRupiah(Math.round(pkg.price / 12))} <span className="text-xs font-semibold text-gray-500">/ bulan</span>
                    </p>
                    <p className="text-[11px] font-semibold text-[#8B4513] mt-0.5">
                      Bayar tahunan: {formatRupiah(pkg.price)} / tahun
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-extrabold text-[#6B3410] mb-2">Gratis</p>
                )}
                {pkg.description && (
                  <p className="text-xs text-[#414844]/70 mb-4 leading-relaxed">{pkg.description}</p>
                )}

                {/* Benefits */}
                <div className="flex-1 mb-5">
                  {Array.isArray(pkg.benefits) && pkg.benefits.length > 0 ? (
                    <ul className="space-y-2">
                      {pkg.benefits.map((b, idx) => {
                        const isObj = typeof b === 'object' && b !== null;
                        const text = isObj ? b.text : b;
                        const included = isObj ? b.included !== false : true;
                        return (
                          <li key={idx} className="flex items-start gap-2.5 text-xs">
                            {included ? (
                              <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-emerald-500/20 shadow-xs">
                                <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                              </span>
                            ) : (
                              <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-rose-500/20 shadow-xs">
                                <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                              </span>
                            )}
                            <span className={`mt-0.5 leading-snug ${included ? 'text-[#374151]' : 'text-gray-400'}`}>
                              {text}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <p className="text-xs text-[#414844]/40 italic">Tidak ada fitur khusus</p>
                  )}
                </div>

                {/* Status + actions */}
                <div className="border-t border-[#6B3410]/10 pt-4 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleActive(pkg)}
                    disabled={togglingId === pkg.id}
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                      pkg.is_active
                        ? 'text-[#6B3410] bg-[#6B3410]/10 hover:bg-[#6B3410]/20'
                        : 'text-[#414844]/60 bg-[#414844]/10 hover:bg-[#414844]/20'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">
                      {pkg.is_active ? 'toggle_on' : 'toggle_off'}
                    </span>
                    {pkg.is_active ? 'Aktif' : 'Nonaktif'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <Link
                      to={`/admin/paket/${pkg.id}/edit`}
                      className="flex items-center gap-1 text-[#7A5900] bg-[#7A5900]/10 hover:bg-[#7A5900]/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit
                    </Link>
                    <button
                      onClick={() => setDeleteTarget(pkg)}
                      className="flex items-center gap-1 text-[#B3261E]/80 bg-[#B3261E]/10 hover:bg-[#B3261E]/20 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        message={`Yakin ingin menghapus paket "${deleteTarget?.name}"?`}
      />
    </div>
  );
}
