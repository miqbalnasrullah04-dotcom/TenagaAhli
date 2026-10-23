import { useEffect, useState, useRef, useCallback } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { useNotifications } from '../context/NotificationContext.jsx';
import logo from "../assets/new logo.png";
import api from '../api/client.js';
import TikaChatbot from './TikaChatbot.jsx';
import { TikaProvider } from '../context/TikaContext.jsx';
import NotificationBell from './NotificationBell.jsx';

function getPhotoUrl(u) {
  if (!u) return null;
  const p = u.avatar_url || u.foto || u.photo || u.expert?.photo;
  if (!p) return null;
  if (p.startsWith('http') || p.startsWith('data:') || p.startsWith('blob:')) return p;
  const apiUrl = import.meta.env.VITE_API_URL || 'https://tenagaahli.com/api';
  const cleanPath = p.replace(/^\/+/, '').replace(/^storage\//, '').replace(/^public\//, '');
  return `${apiUrl}/files/${cleanPath}`;
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function SidebarContent({ user, onNavigate, onLogout, isExpanded, onToggle, onClose, isMobile }) {
  const { t } = useTranslation();
  const { counts } = useNotifications();
  const location = useLocation();
  
  const userRaw = localStorage.getItem('amdal_user');
  let roleType = 'tenaga_ahli';
  let isPremium = false;
  let isClient = false;
  try {
    const u = user || JSON.parse(userRaw || '{}');
    roleType = u.role_type || 'tenaga_ahli';
    isClient = roleType === 'klien' || roleType === 'client' || u.role === 'klien' || u.role === 'client' || (u.role !== 'admin' && roleType !== 'tenaga_ahli' && roleType !== 'surveyor' && roleType !== 'tenaga_teknis');
    if (u.role === 'admin' || u.is_premium === true) {
      isPremium = true;
    } else {
      const pkg = u.package;
      const pkgName = typeof pkg === 'string' ? pkg.toLowerCase() : (pkg?.name || pkg?.slug || '').toLowerCase();
      const isPaidTier = pkgName.includes('premium') || pkgName.includes('platinum') || (typeof pkg === 'object' && pkg?.price > 0) || (u.package_id && Number(u.package_id) > 1);
      const expiry = u.premium_expires_at || u.package_expires_at;
      isPremium = isPaidTier && (!expiry || new Date(expiry) > new Date());
    }
  } catch {}
  
  const dashboardPath = roleType === 'surveyor' ? '/dashboard-surveyor' : '/dashboard';

  const NAV_SECTIONS = isClient
    ? [
        {
          title: t('Akun & Layanan'),
          items: [
            { to: '/akun',          label: t('Akun Saya'),             icon: 'account_circle' },
            { to: '/invoice',       label: t('Invoice'),               icon: 'receipt_long' },
            { to: '/pesanan-saya',  label: t('Pesanan Saya'),          icon: 'shopping_bag' },
            { to: '/top-up',        label: t('Top Up Point'),          icon: 'toll' },
            { to: '/riwayat-point', label: t('Riwayat Point'),         icon: 'history' },
          ]
        },
        {
          title: t('Konsultasi'),
          items: [
            { to: '/jadwal-konsultasi',   label: t('Jadwal & Link Zoom'),   icon: 'videocam' },
            { to: '/chat',                label: t('Chat Konsultasi'),      icon: 'chat' },
          ]
        },
        {
          title: t('Publikasi & Konten'),
          items: [
            { to: '/kelola-berita', label: t('Tulis / Kelola Berita'), icon: 'edit_note' },
          ]
        },
        {
          title: t('Bantuan & Pengaturan'),
          items: [
            { to: '/tiket',         label: t('Tiket & Bantuan'),      icon: 'support_agent' },
            { to: '/pengaturan',    label: t('Pengaturan'),           icon: 'settings' },
          ]
        }
      ]
    : [
        {
          title: t('Menu Utama'),
          items: [
            { to: dashboardPath,   label: t('Dashboard'),          icon: 'space_dashboard' },
            { to: '/profil-saya',  label: t('Profil Saya'),        icon: 'person' },
            { to: '/paket',        label: t('Paket Membership'),   icon: 'workspace_premium' },
            { to: '/invoice',      label: t('Invoice'),            icon: 'receipt_long' },
            { to: '/pembayaran',   label: t('Pembayaran'),         icon: 'payments' },
          ]
        },
        {
          title: t('Konsultasi'),
          items: [
            { to: '/konsultasi',   label: t('Kelola Konsultasi & Zoom'),  icon: 'psychology' },
            { to: '/jadwal',       label: t('Jadwal & Tarif'),     icon: 'schedule' },
            { to: '/chat',         label: t('Chat Konsultasi'),    icon: 'chat' },
            { to: '/pendapatan',   label: t('Pendapatan'),         icon: 'account_balance_wallet' },
          ]
        },
        {
          title: t('Marketplace & Buku'),
          items: [
            { to: '/produk',        label: t('Kelola Produk (Jual)'), icon: 'inventory',    locked: !isPremium },
            { to: '/penjualan',     label: t('Laporan Penjualan'),    icon: 'trending_up',  locked: !isPremium },
            { to: '/pesanan-saya',  label: t('Pesanan Saya (Beli)'),  icon: 'shopping_bag' },
          ]
        },
        {
          title: t('Publikasi & Berita'),
          items: [
            { to: '/kelola-berita', label: t('Tulis / Kelola Berita'), icon: 'edit_note' },
          ]
        },
        {
          title: t('Lainnya'),
          items: [
            { to: '/tiket',        label: t('Tiket Bantuan'),      icon: 'support_agent' },
            { to: '/ulasan',       label: t('Ulasan'),             icon: 'star' },
            { to: '/pengaturan',   label: t('Pengaturan'),         icon: 'settings' },
          ]
        }
      ];

  const getItemBadge = (to) => {
    if (to === '/chat' || to === '/konsultasi') {
      return counts.chat || 0;
    }
    if (to === '/penjualan' || to === '/produk') {
      return counts.product_sales || 0;
    }
    if (to === '/pesanan-saya') {
      return counts.orders || 0;
    }
    return 0;
  };

  const isItemActive = (to) => {
    const [toPath, toQuery] = to.split('?');
    if (toPath === '/jadwal-konsultasi') {
      if (['/jadwal-konsultasi', '/link-zoom', '/konsultasi-saya'].includes(location.pathname)) return true;
      if (location.pathname === '/akun' && new URLSearchParams(location.search).get('tab') === 'konsultasi') return true;
      return false;
    }

    if (location.pathname === '/akun') {
      const currentParams = new URLSearchParams(location.search);
      const currentTab = currentParams.get('tab') || 'akun';
      if (currentTab === 'konsultasi') {
        return toPath === '/jadwal-konsultasi';
      }
      return toPath === '/akun';
    }

    if (toQuery) {
      if (location.pathname !== toPath) return false;
      const currentParams = new URLSearchParams(location.search);
      const toParams = new URLSearchParams(toQuery);
      for (const [k, v] of toParams.entries()) {
        if (currentParams.get(k) !== v) return false;
      }
      return true;
    }

    if (location.pathname === toPath) return true;
    if (toPath !== '/' && location.pathname.startsWith(toPath + '/')) return true;
    return false;
  };

  const roleLabel = isClient ? 'Klien' : (roleType === 'surveyor' ? 'Surveyor' : (roleType === 'tenaga_teknis' ? t('Tenaga Teknis') : t('Tenaga Ahli')));

  const navRef = useRef(null);
  const [scrollRatio, setScrollRatio] = useState({
    thumbHeight: 30,
    thumbTop: 0,
    isScrollable: false,
    canScrollUp: false,
    canScrollDown: false,
  });

  const updateScrollIndicator = useCallback(() => {
    const el = navRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 4) {
      setScrollRatio({
        thumbHeight: 0,
        thumbTop: 0,
        isScrollable: false,
        canScrollUp: false,
        canScrollDown: false,
      });
      return;
    }

    const trackHeight = clientHeight - 20;
    const calculatedThumbHeight = Math.max(28, (clientHeight / scrollHeight) * trackHeight);
    const maxScrollTop = scrollHeight - clientHeight;
    const maxThumbTop = trackHeight - calculatedThumbHeight;
    const thumbTop = maxScrollTop > 0 ? (scrollTop / maxScrollTop) * maxThumbTop : 0;
    const canScrollUp = scrollTop > 10;
    const canScrollDown = scrollTop + clientHeight < scrollHeight - 10;

    setScrollRatio((prev) => {
      if (
        prev.isScrollable === true &&
        prev.canScrollUp === canScrollUp &&
        prev.canScrollDown === canScrollDown &&
        Math.abs(prev.thumbTop - thumbTop) < 1.5 &&
        Math.abs(prev.thumbHeight - calculatedThumbHeight) < 1.5
      ) {
        return prev;
      }
      return {
        thumbHeight: calculatedThumbHeight,
        thumbTop,
        isScrollable: true,
        canScrollUp,
        canScrollDown,
      };
    });
  }, []);

  useEffect(() => {
    updateScrollIndicator();
    const t1 = setTimeout(updateScrollIndicator, 150);
    window.addEventListener('resize', updateScrollIndicator);
    return () => {
      clearTimeout(t1);
      window.removeEventListener('resize', updateScrollIndicator);
    };
  }, [updateScrollIndicator, isExpanded, isMobile]);

  // Scroll otomatis menu yang aktif ke viewport jika tersembunyi
  useEffect(() => {
    const timer = setTimeout(() => {
      if (navRef.current) {
        const activeEl = navRef.current.querySelector('.sidebar-item-active');
        if (activeEl) {
          activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }
      updateScrollIndicator();
    }, 200);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search, updateScrollIndicator]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header Sidebar */}
      {isMobile ? (
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 min-h-[60px] shrink-0 bg-[#8B4513]">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={logo} alt="TenagaAhli.com" className="h-8 w-auto object-contain drop-shadow-sm shrink-0" />
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/15 text-white border border-white/20 truncate">
              {roleLabel}
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup menu"
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20 transition-colors shrink-0"
          >
            <span className="material-symbols-outlined text-[22px]">close</span>
          </button>
        </div>
      ) : (
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 min-h-[76px] shrink-0 bg-[#8B4513]">
          {isExpanded ? (
            <>
              <div className="flex flex-col items-start gap-1 overflow-hidden transition-all duration-200">
                <img src={logo} alt="TenagaAhli.com" className="h-12 md:h-14 max-w-[170px] w-auto shrink-0 object-contain drop-shadow-sm" />
                <span className="font-extrabold text-[10px] tracking-widest uppercase text-white/70 ml-0.5">
                  {roleLabel}
                </span>
              </div>
              <button onClick={onToggle} className="text-white/85 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[22px]">menu</span>
              </button>
            </>
          ) : (
            <button onClick={onToggle} className="text-white/85 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors mx-auto">
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
          )}
        </div>
      )}

      {/* Navigasi Utama Container */}
      <div className="relative flex-1 min-h-0 flex flex-col overflow-hidden">
        <nav
          ref={navRef}
          onScroll={updateScrollIndicator}
          className="flex-1 pl-3 pr-4 py-3 sm:py-4 flex flex-col gap-3 overflow-y-auto overflow-x-hidden sidebar-custom-scrollbar overscroll-contain"
        >
          {NAV_SECTIONS.map((section, secIdx) => (
            <div key={`section-${secIdx}`} className="flex flex-col gap-1">
              {/* Section Header */}
              {section.title && isExpanded && (
                <div className="px-3 pt-2 pb-1 text-[10px] font-extrabold text-white/50 uppercase tracking-wider flex items-center gap-2">
                  <span>{section.title}</span>
                  <span className="flex-1 h-[1px] bg-white/10" />
                </div>
              )}

              {section.items.map((item) => {
                const badge = getItemBadge(item.to);
                const active = isItemActive(item.to);

                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onNavigate}
                    title={!isExpanded ? (item.locked ? `${item.label} (Premium)` : item.label) : undefined}
                    className={
                      `relative flex items-center gap-3 px-3 py-2.5 sm:py-2.5 rounded-xl text-xs font-bold tracking-wide transition-all duration-150 ${
                        item.locked
                          ? 'text-white/40 cursor-pointer hover:bg-white/5'
                          : active
                          ? 'sidebar-item-active bg-black/20 text-white font-extrabold border-l-4 border-white shadow-sm'
                          : 'text-white/75 hover:bg-white/10 hover:text-white'
                      } ${!isExpanded ? 'justify-center px-0 border-l-0' : ''}`
                    }
                  >
                    <div className="relative flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                      {/* Badge angka jika sidebar collapsed */}
                      {badge > 0 && !isExpanded && (
                        <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-black flex items-center justify-center border-2 border-[#8B4513] shadow-sm">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </div>

                    {isExpanded && (
                      <span className="truncate flex-1 text-left">{item.label}</span>
                    )}

                    {/* Gembok kecil di ujung kanan jika terkunci */}
                    {item.locked && isExpanded && (
                      <span className="material-symbols-outlined text-[14px] text-yellow-400 shrink-0">lock</span>
                    )}
                    {item.locked && !isExpanded && (
                      <span className="absolute -top-0.5 -right-0.5 material-symbols-outlined text-[10px] text-yellow-400">lock</span>
                    )}

                    {/* Badge Counter jika sidebar terbuka */}
                    {badge > 0 && isExpanded && (
                      <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-red-600 text-white min-w-[20px] text-center shrink-0 shadow-sm tracking-normal">
                        {badge > 99 ? '99+' : badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Tanda Scrollbar Kustom di Tepi Kanan (Selalu Muncul di Desktop & Mobile saat ada scroll) */}
        {scrollRatio.isScrollable && (
          <div className="absolute right-1 top-3 bottom-3 w-1.5 bg-black/25 rounded-full pointer-events-none z-10 transition-opacity duration-200">
            <div
              className="w-full bg-white/75 rounded-full shadow-xs transition-transform duration-75"
              style={{
                height: `${scrollRatio.thumbHeight}px`,
                transform: `translateY(${scrollRatio.thumbTop}px)`,
              }}
            />
          </div>
        )}

        {/* Indikator Gradien Halus di Ujung Atas & Bawah saat masih ada menu */}
        {scrollRatio.canScrollUp && (
          <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-[#8B4513]/90 to-transparent pointer-events-none z-10" />
        )}
        {scrollRatio.canScrollDown && (
          <div className="absolute bottom-0 left-0 right-0 h-5 bg-gradient-to-t from-[#8B4513]/90 to-transparent pointer-events-none z-10 flex items-center justify-center">
            <span className="material-symbols-outlined text-[13px] text-white/70 animate-bounce -mb-1">
              keyboard_arrow_down
            </span>
          </div>
        )}
      </div>

      {/* Bagian Bawah User & Aksi Keluar */}
      <div className="p-3 border-t border-white/10 flex flex-col gap-1.5 shrink-0 bg-black/10">
        {isExpanded && (
          <div className="flex items-center gap-3 px-3 py-2 mb-1 overflow-hidden bg-white/5 rounded-xl border border-white/10">
            {getPhotoUrl(user) ? (
              <img
                src={getPhotoUrl(user)}
                alt="Profile"
                className="w-8 h-8 rounded-full object-cover border border-white/25 shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold shrink-0">
                {getInitials(user?.name)}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold truncate">{user?.name || 'Pengguna'}</p>
              <p className="text-[10px] text-white/60 truncate">{user?.email || ''}</p>
            </div>
          </div>
        )}

        {/* Tombol Menuju Web Utama Publik */}
        <Link
          to="/"
          onClick={onNavigate}
          title={t('Lihat Web Utama')}
          className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide text-white/75 hover:bg-white/10 hover:text-white transition-colors ${!isExpanded ? 'justify-center px-0' : ''}`}
        >
          <span className="material-symbols-outlined text-[19px] shrink-0">language</span>
          {isExpanded && <span>{t('Web Utama')}</span>}
        </Link>

        {/* Tombol Aksi Logout */}
        <button
          onClick={onLogout}
          title={t('Logout')}
          className={`flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-bold tracking-wide text-[#FFB4AB] hover:bg-[#FFB4AB]/10 transition-colors ${!isExpanded ? 'justify-center px-0' : ''}`}
        >
          <span className="material-symbols-outlined text-[19px] shrink-0">logout</span>
          {isExpanded && <span>{t('Logout')}</span>}
        </button>
      </div>
    </div>
  );
}

export default function DashboardLayout({ title, subtitle, headerRight, children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('amdal_user');
      if (raw) setUser(JSON.parse(raw));
    } catch {
      /* ignore malformed cache */
    }

    // Fetch fresh profile to sync verified & package status in background
    api.get('/my/profile')
      .then((res) => {
        if (res.data) {
          setUser(prev => {
            const updated = { ...(prev || {}), ...res.data };
            localStorage.setItem('amdal_user', JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch(() => {});
  }, []);

  const roleType = user?.role_type || 'tenaga_ahli';
  const isClient = roleType === 'klien' || roleType === 'client' || user?.role === 'klien' || user?.role === 'client' || (user && user.role !== 'admin' && roleType !== 'tenaga_ahli' && roleType !== 'surveyor' && roleType !== 'tenaga_teknis');
  const roleLabel = isClient ? 'Klien' : (roleType === 'surveyor' ? 'Surveyor' : (roleType === 'tenaga_teknis' ? 'Tenaga Teknis' : 'Tenaga Ahli'));

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch {
      /* ignore — proceed to clear session locally regardless */
    } finally {
      localStorage.removeItem('amdal_token');
      localStorage.removeItem('amdal_user');
      navigate('/sign-in');
    }
  };

  return (
    <TikaProvider>
      <div className="min-h-screen bg-[#F5F4EF] flex w-full max-w-full">
        <style>{`
          .no-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
          .sidebar-custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: rgba(255, 255, 255, 0.45) rgba(0, 0, 0, 0.12);
          }
          .sidebar-custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .sidebar-custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.12);
            border-radius: 9999px;
            margin: 6px 0;
          }
          .sidebar-custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.45);
            border-radius: 9999px;
            border: 1px solid rgba(255, 255, 255, 0.15);
          }
          .sidebar-custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.8);
          }
        `}</style>

        {/* Sidebar — desktop */}
        <aside className={`hidden lg:flex lg:flex-col lg:shrink-0 lg:sticky lg:top-0 lg:h-screen bg-gradient-to-b from-[#8B4513] to-[#654321] text-white transition-all duration-300 no-scrollbar ${isExpanded ? 'lg:w-64' : 'lg:w-20'}`}>
          <SidebarContent 
            user={user} 
            onLogout={handleLogout} 
            isExpanded={isExpanded} 
            onToggle={() => setIsExpanded(!isExpanded)} 
          />
        </aside>

        {/* Topbar — mobile */}
        <div className="lg:hidden fixed top-0 left-0 w-full z-40 bg-[#8B4513] text-white flex items-center justify-between px-3.5 sm:px-4 h-16 shadow-md backdrop-blur-md bg-opacity-95">
          <Link
            to={isClient ? '/akun' : (roleType === 'surveyor' ? '/dashboard-surveyor' : '/dashboard')}
            className="flex items-center gap-2 min-w-0"
          >
            <img src={logo} alt="TenagaAhli.com" className="h-8 sm:h-9 w-auto object-contain drop-shadow-sm shrink-0" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/15 text-white border border-white/20 truncate">
              {roleLabel}
            </span>
          </Link>
          <div className="flex items-center gap-1.5 shrink-0">
            <NotificationBell darkVariant={true} />
            <button
              onClick={() => setDrawerOpen(true)}
              aria-label="Buka menu"
              className="p-2 rounded-xl text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20 transition-all flex items-center justify-center shrink-0"
            >
              <span className="material-symbols-outlined text-[24px]">menu</span>
            </button>
          </div>
        </div>

        {/* Drawer — mobile dengan animasi slide-in */}
        <div
          className={`lg:hidden fixed inset-0 z-50 transition-all duration-300 ${
            drawerOpen ? 'visible opacity-100' : 'invisible opacity-0 pointer-events-none'
          }`}
        >
          {/* Backdrop gelap */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Drawer sidebar */}
          <aside
            className={`relative w-[280px] sm:w-72 max-w-[85vw] h-full bg-gradient-to-b from-[#8B4513] to-[#654321] text-white flex flex-col shadow-2xl transition-transform duration-300 ease-out transform z-10 ${
              drawerOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent 
              user={user} 
              onNavigate={() => setDrawerOpen(false)} 
              onLogout={handleLogout} 
              isExpanded={true}
              onClose={() => setDrawerOpen(false)}
              isMobile={true}
            />
          </aside>
        </div>

        {/* Konten utama */}
        <main className="flex-1 min-w-0 pt-16 lg:pt-0 max-w-full">
          {/* Topbar — desktop */}
          <div className="hidden lg:flex items-center justify-end px-6 md:px-10 py-3 bg-white/90 backdrop-blur-md border-b border-gray-200/70 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <NotificationBell />
              <div className="h-5 w-[1px] bg-gray-200" />
              <div className="flex items-center gap-2.5 pl-1">
                {getPhotoUrl(user) ? (
                  <img
                    src={getPhotoUrl(user)}
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border border-gray-200 shadow-2xs"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#8B4513] text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                    {getInitials(user?.name)}
                  </div>
                )}
                <div className="text-left hidden xl:block">
                  <p className="text-xs font-bold text-gray-800 leading-tight truncate max-w-[140px]">{user?.name || 'Pengguna'}</p>
                  <p className="text-[10px] text-gray-400 leading-tight truncate max-w-[140px]">{user?.email || ''}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-3.5 sm:px-6 md:px-10 py-5 sm:py-8 md:py-12">
            {(title || headerRight) && (
              <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-5 sm:mb-8">
                <div className="min-w-0 flex-1">
                  {title && (
                    <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#1F2A22] tracking-tight truncate sm:whitespace-normal">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="text-xs sm:text-sm text-[#5B6660] mt-0.5 sm:mt-1 leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>
                {headerRight && (
                  <div className="shrink-0 flex items-center gap-2 self-start sm:self-center">
                    {headerRight}
                  </div>
                )}
              </header>
            )}
            {children}
          </div>
        </main>
        
        {/* TIKA Chatbot */}
        <TikaChatbot />
      </div>
    </TikaProvider>
  );
}
