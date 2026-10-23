import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import logo from '../assets/new logo.png';
import NotificationBell from '../components/NotificationBell.jsx';

const menuSections = [
  {
    title: 'Utama',
    items: [
      { to: '/admin', label: 'Dashboard', icon: 'dashboard', end: true },
    ]
  },
  {
    title: 'Layanan & Verifikasi',
    items: [
      { to: '/admin/verifikasi', label: 'Verifikasi', icon: 'verified_user' },
      { to: '/admin/konsultasi', label: 'Konsultasi (Zoom)', icon: 'videocam' },
      { to: '/admin/tiket', label: 'Tiket Bantuan', icon: 'support_agent' },
    ]
  },
  {
    title: 'Keuangan & Transaksi',
    items: [
      { to: '/admin/pembayaran', label: 'Pembayaran', icon: 'payments' },
      { to: '/admin/penarikan', label: 'Tarik Dana', icon: 'account_balance_wallet' },
      { to: '/admin/top-up', label: 'Top Up Point', icon: 'toll' },
    ]
  },
  {
    title: 'Manajemen Pengguna',
    items: [
      { to: '/admin/tenaga-ahli', label: 'Tenaga Ahli', icon: 'people' },
      { to: '/admin/tenaga-teknis', label: 'Tenaga Teknis', icon: 'engineering' },
      { to: '/admin/surveyor', label: 'Surveyor', icon: 'map' },
    ]
  },
  {
    title: 'Pengaturan & Konten',
    items: [
      { to: '/admin/paket', label: 'Paket Membership', icon: 'workspace_premium' },
      { to: '/admin/berita', label: 'Berita & Artikel', icon: 'newspaper' },
      { to: '/admin/laporan', label: 'Laporan & Statistik', icon: 'bar_chart' },
      { to: '/admin/pengaturan', label: 'Pengaturan Sistem', icon: 'settings' },
    ]
  }
];

export default function AdminLayout({ title, subtitle, children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState({ experts: [], articles: [], partners: [] });
  const [searchLoading, setSearchLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDashboardPage = location.pathname === '/admin';

  // Auto-close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const raw = localStorage.getItem('amdal_user');
    if (raw) {
      try {
        setUser(JSON.parse(raw));
      } catch {
        setUser(null);
      }
    }
  }, []);

  // Fetch count of pending new registrants + profile updates
  const [pendingVerifCount, setPendingVerifCount] = useState(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const [resNew, resUpdate] = await Promise.all([
          api.get('/admin/experts', { params: { status: 'menunggu_verifikasi' } }),
          api.get('/admin/experts', { params: { status: 'pembaruan_profil' } }),
        ]);
        const cNew = Array.isArray(resNew.data) ? resNew.data.length : 0;
        const cUp = Array.isArray(resUpdate.data) ? resUpdate.data.length : 0;
        setPendingVerifCount(cNew + cUp);
      } catch {
        // ignore
      }
    };
    fetchPending();
    const interval = setInterval(fetchPending, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  // Search functionality - only on main dashboard
  useEffect(() => {
    if (!isDashboardPage) return;
    
    if (!searchQuery.trim()) {
      setSearchResults({ experts: [], articles: [], partners: [] });
      setShowResults(false);
      return;
    }

    const delaySearch = setTimeout(async () => {
      setSearchLoading(true);
      try {
        // Search experts/tenaga ahli
        const expertsRes = await api.get('/admin/experts', { 
          params: { search: searchQuery, limit: 5 } 
        });
        const experts = expertsRes.data?.data || expertsRes.data || [];

        setSearchResults({ 
          experts: experts.slice(0, 5), 
          articles: [], 
          partners: [] 
        });
        setShowResults(true);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults({ experts: [], articles: [], partners: [] });
        setShowResults(true);
      } finally {
        setSearchLoading(false);
      }
    }, 300); // Debounce 300ms

    return () => clearTimeout(delaySearch);
  }, [searchQuery, isDashboardPage]);

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('amdal_token');
      localStorage.removeItem('amdal_user');
      navigate('/');
    }
  };

  const handleSearchSelect = (type, id) => {
    setSearchQuery('');
    setShowResults(false);
    
    if (type === 'expert') {
      navigate(`/admin/tenaga-ahli/${id}/edit`);
    } else if (type === 'article') {
      navigate(`/admin/artikel/${id}/edit`);
    } else if (type === 'partner') {
      navigate(`/admin/mitra/${id}/edit`);
    }
  };

  const initials = (user?.name || 'A')
    .split(' ')
    .map((s) => s[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#F5F4F0] text-[#1B1C1A]">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside
        className={`h-screen fixed left-0 top-0 bg-gradient-to-b from-[#8B4513] to-[#654321] text-white border-r border-[#8B4513]/15 flex flex-col py-4 px-3.5 z-50 overflow-y-auto no-scrollbar overscroll-contain transition-all duration-300 shadow-2xl lg:shadow-none ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0 ${isExpanded ? 'lg:w-64 w-[280px] sm:w-72' : 'lg:w-20 w-[280px] sm:w-72'}`}
      >
        {/* Header Sidebar */}
        <div className="mb-4 flex items-center justify-between px-2 min-h-[52px] shrink-0 border-b border-white/10 pb-3">
          <div className="flex flex-col items-start gap-0.5 overflow-hidden transition-all duration-200">
            <img src={logo} alt="TenagaAhli.com" className="h-8 sm:h-10 w-auto object-contain shrink-0 drop-shadow-sm" />
            <span className="font-extrabold text-[10px] tracking-widest uppercase text-white/70 ml-0.5">Admin Control Panel</span>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors shrink-0"
            title="Tutup Menu"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>

          {/* Collapse button on desktop */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="hidden lg:block text-white/80 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors"
            title={isExpanded ? 'Kecilkan Sidebar' : 'Lebarkan Sidebar'}
          >
            <span className="material-symbols-outlined text-[20px]">menu</span>
          </button>
        </div>

        {/* Navigation with Category Sections */}
        <nav className="flex-1 space-y-3 overflow-x-hidden no-scrollbar pb-6">
          {menuSections.map((section, secIdx) => (
            <div key={`admin-sec-${secIdx}`} className="space-y-1">
              {section.title && isExpanded && (
                <div className="px-3 pt-1.5 pb-1 text-[10px] font-extrabold text-white/50 uppercase tracking-wider flex items-center gap-2">
                  <span>{t(section.title)}</span>
                  <span className="flex-1 h-[1px] bg-white/10" />
                </div>
              )}

              {section.items.map((item) => (
                <NavLink
                  key={item.label}
                  to={item.to}
                  end={item.end}
                  onClick={() => setMobileMenuOpen(false)}
                  title={!isExpanded ? item.label : undefined}
                  className={({ isActive }) =>
                    `flex items-center gap-3 py-2 px-3 rounded-xl text-xs font-bold tracking-wide transition-all ${
                      isActive
                        ? 'bg-black/20 text-white font-extrabold border-l-4 border-white shadow-sm'
                        : 'text-white/75 hover:bg-white/10 hover:text-white'
                    } ${!isExpanded ? 'lg:justify-center lg:px-0 lg:border-l-0' : ''}`
                  }
                >
                  <span className="material-symbols-outlined text-[20px] shrink-0">{item.icon}</span>
                  <span className={!isExpanded ? 'lg:hidden' : ''}>{t(item.label)}</span>
                  {item.to === '/admin/verifikasi' && pendingVerifCount > 0 && (
                    <span className={`ml-auto px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-black shadow-xs ${!isExpanded ? 'lg:hidden' : ''}`}>
                      {pendingVerifCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Bottom Actions (Kembali ke Web & Sign Out) */}
        <div className="mt-auto pt-3 border-t border-white/10 shrink-0 space-y-1.5">
          <Link
            to="/"
            title="Kembali ke Website Utama"
            className={`w-full flex items-center justify-start lg:justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold tracking-wide text-white/90 hover:text-white bg-white/10 hover:bg-white/20 transition-all ${
              !isExpanded ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">arrow_back</span>
            <span className={!isExpanded ? 'lg:hidden' : ''}>Kembali ke Web</span>
          </Link>

          <button
            onClick={handleLogout}
            title="Sign Out"
            className={`w-full flex items-center justify-start lg:justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold tracking-wide uppercase text-[#FFB4AB] hover:bg-[#FFB4AB]/10 transition-colors ${
              !isExpanded ? 'lg:justify-center lg:px-0' : ''
            }`}
          >
            <span className="material-symbols-outlined text-[20px] shrink-0">logout</span>
            <span className={!isExpanded ? 'lg:hidden' : ''}>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`min-h-screen transition-all duration-300 ml-0 ${isExpanded ? 'lg:ml-64' : 'lg:ml-20'}`}>
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-3 sm:px-6 lg:px-8 bg-white border-b border-[#8B4513]/15 sticky top-0 z-30 gap-3">
          {/* Left section: Hamburger & Title or Search */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-1 text-gray-700 hover:text-[#8B4513] hover:bg-gray-100 rounded-xl transition-colors shrink-0 flex items-center justify-center"
              title="Buka Menu Navigasi"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>

            {/* Page Title */}
            {title ? (
              <div className="min-w-0">
                <h1 className="text-base sm:text-xl font-bold text-[#1F2A22] truncate">{title}</h1>
                {subtitle && <p className="text-xs text-[#414844]/60 truncate hidden sm:block">{subtitle}</p>}
              </div>
            ) : isDashboardPage ? (
              <div className="relative w-full max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#414844]/50 text-[18px]">
                  search
                </span>
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery && setShowResults(true)}
                  onBlur={() => setTimeout(() => setShowResults(false), 200)}
                  placeholder="Cari tenaga ahli, artikel..."
                  className="w-full pl-9 pr-8 py-1.5 sm:py-2 bg-[#F5F4F0] border-none rounded-full text-xs sm:text-sm focus:ring-2 focus:ring-[#8B4513]/40"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setShowResults(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#414844]/40 hover:text-[#8B4513] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">close</span>
                  </button>
                )}

                {/* Search Results Dropdown */}
                {showResults && searchQuery && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-white rounded-xl shadow-xl border border-[#8B4513]/15 max-h-96 overflow-y-auto z-50">
                    {searchLoading ? (
                      <div className="p-6 text-center text-[#414844]/70 text-sm">
                        <span className="material-symbols-outlined animate-spin text-[24px]">progress_activity</span>
                        <p className="mt-2">Mencari...</p>
                      </div>
                    ) : (
                      <div className="py-2">
                        <div className="px-4 py-2 border-b border-[#8B4513]/10">
                          <p className="text-xs text-[#414844]/60 font-semibold">Hasil pencarian untuk "{searchQuery}"</p>
                        </div>
                        
                        {searchResults.experts.length > 0 && (
                          <div>
                            <div className="px-4 py-2 bg-[#8B4513]/5">
                              <p className="text-xs font-bold text-[#8B4513] uppercase tracking-wider">Tenaga Ahli</p>
                            </div>
                            {searchResults.experts.map((expert) => (
                              <button
                                key={expert.id}
                                onClick={() => handleSearchSelect('expert', expert.id)}
                                className="w-full px-4 py-3 text-left hover:bg-[#F5F4F0] transition-colors border-b border-[#6B3410]/5 last:border-b-0"
                              >
                                <p className="font-semibold text-[#1F2A22] text-sm">{expert.name}</p>
                                <p className="text-xs text-[#414844]/70">{expert.field || expert.institution}</p>
                              </button>
                            ))}
                          </div>
                        )}

                        {searchResults.experts.length === 0 && (
                          <div className="px-4 py-6 text-center">
                            <span className="material-symbols-outlined text-[#414844]/40 text-[24px]">search_off</span>
                            <p className="text-sm font-semibold text-[#1F2A22] mt-1">Tidak ada hasil</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Action Tools & User Profile Badge */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <Link
              to="/"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-[#8B4513] hover:text-white bg-[#8B4513]/10 hover:bg-[#8B4513] transition-all border border-[#8B4513]/20 shadow-xs"
              title="Kembali ke Beranda Website"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              <span className="hidden xs:inline sm:inline">Kembali ke Web</span>
            </Link>

            <NotificationBell />

            <div className="flex items-center gap-2 sm:gap-2.5 p-1 sm:px-3 sm:py-1.5 bg-[#F5F4F0] rounded-full border border-black/5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#8B4513] flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-sm shrink-0">
                {initials}
              </div>
              <div className="text-left hidden sm:block pr-1">
                <p className="font-bold text-[#1F2A22] text-xs leading-tight truncate max-w-[110px]">{user?.name || 'Admin'}</p>
                <p className="text-[10px] text-[#414844]/60 leading-tight">Administrator</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-3 sm:p-5 lg:p-8 max-w-full overflow-x-hidden">
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}