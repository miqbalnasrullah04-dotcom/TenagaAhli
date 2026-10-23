import { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import logo from '../assets/new logo.png';
import api from '../api/client.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';
import NotificationBell from './NotificationBell.jsx';

// Brand tokens — brown colors to match the new logo
const BRAND_BROWN = '#8B4513'; // saddle brown
const BRAND_BROWN_HOVER = '#6B3410';

export const KEAHLIAN_UTAMA = [
  { name: 'GIS', query: 'GIS', icon: 'public' },
  { name: 'System Dynamics', query: 'System Dynamics', icon: 'hub' },
  { name: 'Ekonomi', query: 'Ekonomi', icon: 'trending_up' },
  { name: 'Hukum', query: 'Hukum', icon: 'gavel' },
  { name: 'Perencanaan Wilayah', query: 'Perencanaan Wilayah', icon: 'map' },
  { name: 'Lingkungan', query: 'Lingkungan', icon: 'eco' },
  { name: 'Sipil', query: 'Sipil', icon: 'engineering' },
  { name: 'Sosial', query: 'Sosial', icon: 'groups' },
  { name: 'Geologi', query: 'Geologi', icon: 'landscape' },
  { name: 'Remote Sensing', query: 'Remote Sensing', icon: 'satellite_alt' },
  { name: 'Pertambangan', query: 'Pertambangan', icon: 'hardware' },
  { name: 'Arsitek', query: 'Arsitek', icon: 'architecture' },
  { name: 'Perikanan', query: 'Perikanan', icon: 'phishing' },
  { name: 'Pertanian', query: 'Pertanian', icon: 'agriculture' },
  { name: 'Statistik', query: 'Statistik', icon: 'analytics' },
  { name: 'Meteorologi & Klimatologi', query: 'Meteorologi & Klimatologi', icon: 'partly_cloudy_day' },
];

export default function Navbar() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  // Dropdown desktop & mobile sekarang generic: simpan "key" dropdown mana
  // yang sedang terbuka, bukan boolean terpisah per dropdown. Ini supaya
  // menambah dropdown baru (mis. Berita) tidak perlu menambah state baru.
  const [openDropdown, setOpenDropdown] = useState(null);
  const [openSubmenu, setOpenSubmenu] = useState(null);
  const [mobileOpenDropdown, setMobileOpenDropdown] = useState(null);
  const [mobileOpenSubmenu, setMobileOpenSubmenu] = useState(null);
  // Mode bottom sheet mobile: key dropdown ('tenagaAhli' | 'berita') atau 'menu' (akun).
  const [sheetMode, setSheetMode] = useState('menu');
  const [userData, setUserData] = useState(null);
  const [avatarError, setAvatarError] = useState(false);

  const dropdownRef = useRef(null); // ref untuk dropdown foto profil
  const dropdownRefs = useRef({}); // ref map untuk semua dropdown nav (key -> element)
  const location = useLocation();
  const navigate = useNavigate();

  const isProfilePage = location.pathname.startsWith('/profil/');
  const isTransparent = isProfilePage;

  const getSurveyorLabel = () => {
    if (location.pathname === '/daftar-surveyor') {
      return t('Surveyor');
    }
    if (location.pathname === '/daftar-teknis' || location.pathname === '/daftar-tenaga-teknis') {
      return t('Tenaga Teknis');
    }
    return t('Tenaga Ahli');
  };

  const getBeritaLabel = () => {
    if (location.pathname.startsWith('/informasi-proyek')) {
      return t('Informasi Proyek');
    }
    return t('Berita');
  };

  const isKlien = userData?.role_type === 'klien' || userData?.role_type === 'client' || userData?.role === 'klien' || userData?.role === 'client' || (userData && userData.role !== 'admin' && userData.role_type !== 'tenaga_ahli' && userData.role_type !== 'surveyor' && userData.role_type !== 'tenaga_teknis');
  const isAdmin = userData?.role === 'admin';
  const isExpert = !isAdmin && !isKlien;

  const getDashboardPath = () => {
    if (isAdmin) return '/admin';
    if (userData?.role_type === 'surveyor') return '/dashboard-surveyor';
    if (isKlien) return '/akun';
    return '/dashboard';
  };

  const navLinks = [
    { to: '/', label: t('Beranda') },
    { to: '/peta-ahli', label: t('Peta Ahli') },
    {
      key: 'tenagaAhli',
      getLabel: getSurveyorLabel,
      sheetTitle: t('Jelajahi Ahli'),
      isDropdown: true,
      isActive: () =>
        location.pathname.startsWith('/daftar-profil') ||
        location.pathname === '/daftar-teknis' ||
        location.pathname === '/daftar-tenaga-teknis' ||
        location.pathname === '/daftar-surveyor',
      children: [
        {
          // Diarahkan ke halaman Daftar Profil (card grid, khusus seksi
          // Tenaga Ahli), BUKAN ke /tenaga-ahli (TenagaAhli.jsx / versi peta).
          to: '/daftar-profil',
          label: t('Tenaga Ahli'),
          desc: t('Cari tenaga ahli profesional'),
          hasSubmenu: true,
          submenu: KEAHLIAN_UTAMA,
        },
        {
          to: '/daftar-teknis',
          label: t('Tenaga Teknis'),
          desc: t('Temukan tenaga teknis & operasional proyek'),
        },
        {
          to: '/daftar-surveyor',
          label: t('Surveyor'),
          desc: t('Jelajahi surveyor berpengalaman'),
        },
      ],
    },
    {
      key: 'berita',
      getLabel: getBeritaLabel,
      sheetTitle: t('Berita & Informasi'),
      isDropdown: true,
      isActive: () =>
        location.pathname.startsWith('/berita') || location.pathname.startsWith('/informasi-proyek'),
      children: [
        {
          to: '/berita',
          label: t('Berita'),
          desc: t('Berita dan artikel terbaru'),
        },
        {
          to: '/informasi-proyek',
          label: t('Informasi Proyek'),
          desc: t('Info dan perkembangan proyek'),
        },
      ],
    },
    { to: '/tentang-kami', label: t('Tentang Kami') },
  ];

  // Helper untuk inisial nama
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  // Helper untuk resolve foto URL
  const getPhotoUrl = (user) => {
    if (!user) return null;

    const photoUrl = user.avatar_url || user.foto || user.photo || user.expert?.photo;
    if (!photoUrl) return null;

    // Jika sudah full URL (http/https) atau base64 data, return langsung
    if (photoUrl.startsWith('http://') || photoUrl.startsWith('https://') || photoUrl.startsWith('blob:') || photoUrl.startsWith('data:')) {
      return photoUrl;
    }

    // Gunakan file view API atau fallback storage
    const apiUrl = import.meta.env.VITE_API_URL || 'https://tenagaahli.com/api';
    const cleanPath = photoUrl.replace(/^\/+/, '').replace(/^storage\//, '').replace(/^public\//, '');
    return `${apiUrl}/files/${cleanPath}`;
  };

  const lastUserFetchRef = useRef(0);

  // Cek status login & ambil data user dari localStorage
  useEffect(() => {
    const loadUser = (forceFetch = false) => {
      const token = localStorage.getItem('amdal_token');
      const user = localStorage.getItem('amdal_user');

      setIsLoggedIn(!!token);
      let parsed = null;
      if (user) {
        try {
          parsed = JSON.parse(user);
          setUserData((prev) => ({ ...parsed, _loadedAt: Date.now() }));
        } catch (e) {
          console.error('Error parsing user data', e);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }

      const now = Date.now();
      // Selalu force fetch jika foto belum ada di local user data
      const needsPhotoFetch = token && parsed && !parsed.foto && !parsed.avatar_url && !parsed.expert?.photo;
      if (token && (forceFetch || needsPhotoFetch || now - lastUserFetchRef.current > 20000)) {
        lastUserFetchRef.current = now;
        api.get('/user').then((res) => {
          if (res.data?.user) {
            const fresh = res.data.user;
            localStorage.setItem('amdal_user', JSON.stringify(fresh));
            setUserData(fresh);
          }
        }).catch(() => {});
      }
    };

    loadUser(); // jalan saat mount & saat location berubah

    // Dengarkan event custom: dipicu manual saat profil di-update di halaman
    // lain (mis. setelah upload foto di /profil-saya) tanpa perlu reload.
    const handleUserUpdate = () => {
      console.log('📸 Navbar menerima event amdal-user-updated');
      loadUser(true);
    };

    window.addEventListener('amdal-user-updated', handleUserUpdate);
    window.addEventListener('storage', () => loadUser(true));

    return () => {
      window.removeEventListener('amdal-user-updated', handleUserUpdate);
      window.removeEventListener('storage', () => loadUser(true));
    };
  }, [location]);

  // Menutup dropdown profil & dropdown nav jika klik di luar area menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
      if (
        openDropdown &&
        dropdownRefs.current[openDropdown] &&
        !dropdownRefs.current[openDropdown].contains(event.target)
      ) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdown]);

  // Menutup menu mobile & semua dropdown otomatis saat pindah halaman
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
    setOpenDropdown(null);
    setMobileOpenDropdown(null);
  }, [location.pathname]);

  // Tandai body supaya konten halaman diberi ruang di bawah untuk bottom nav (mobile)
  useEffect(() => {
    document.body.classList.add('has-bottom-nav');
    return () => document.body.classList.remove('has-bottom-nav');
  }, []);

  // Kunci scroll halaman saat bottom sheet mobile terbuka
  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const toggleSheet = (mode) => {
    if (menuOpen && sheetMode === mode) {
      setMenuOpen(false);
      return;
    }
    setSheetMode(mode);
    setMobileOpenSubmenu(null);
    setMenuOpen(true);
  };

  const tenagaAhliLink = navLinks.find((l) => l.key === 'tenagaAhli');
  const beritaLink = navLinks.find((l) => l.key === 'berita');

  const bottomTabs = [
    { id: 'home', to: '/', icon: 'home', label: t('Beranda'), end: true },
    { id: 'peta', to: '/peta-ahli', icon: 'map', label: t('Peta Ahli') },
    {
      id: 'search',
      to: '/search',
      icon: 'search',
      label: t('Cari'),
      isActive: () => location.pathname === '/search',
    },
    { id: 'tenagaAhli', sheet: true, icon: 'groups', label: t('Ahli'), isActive: tenagaAhliLink.isActive },
    { id: 'berita', sheet: true, icon: 'newspaper', label: t('Berita'), isActive: beritaLink.isActive },
  ];

  const renderTabInner = (tab, active) => {
    if (tab.id === 'search') {
      return (
        <div className="flex flex-col items-center justify-center -mt-5">
          <div
            className={`flex items-center justify-center w-12 h-12 rounded-full shadow-lg transition-all duration-300 ${
              active
                ? 'scale-105 shadow-[#8B4513]/40 ring-4 ring-white'
                : 'shadow-[#8B4513]/25 ring-4 ring-white hover:scale-105'
            }`}
            style={{
              background: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
            }}
          >
            <span
              className="material-symbols-outlined text-[24px] text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              search
            </span>
          </div>
          <span
            className={`text-[10px] leading-none mt-1 transition-colors ${
              active ? 'font-bold text-[#8B4513]' : 'font-semibold text-gray-600'
            }`}
          >
            {tab.label}
          </span>
        </div>
      );
    }

    return (
      <>
        <span
          className={`absolute top-0 left-1/2 -translate-x-1/2 h-[3px] rounded-b-full transition-all duration-300 ${
            active ? 'w-8 opacity-100' : 'w-0 opacity-0'
          }`}
          style={{ backgroundColor: BRAND_BROWN }}
        />
        <span
          className={`flex items-center justify-center w-12 h-7 rounded-full transition-all duration-300 ${
            active ? 'bg-[#F5EBE1] scale-105' : 'scale-100'
          }`}
        >
          {tab.avatar ? (
            getPhotoUrl(userData) ? (
              <img
                src={getPhotoUrl(userData)}
                alt="Profile"
                className={`w-6 h-6 rounded-full object-cover border ${active ? 'border-[#8B4513]' : 'border-gray-200'}`}
              />
            ) : (
              <span className="w-6 h-6 rounded-full bg-[#8B4513] text-white text-[9px] font-black flex items-center justify-center">
                {getInitials(userData?.name || userData?.nama)}
              </span>
            )
          ) : (
            <span
              className="material-symbols-outlined text-[22px]"
              style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              {tab.icon}
            </span>
          )}
        </span>
        <span className={`text-[10px] leading-none truncate max-w-full px-1 ${active ? 'font-bold' : 'font-medium'}`}>
          {tab.label}
        </span>
      </>
    );
  };

  const handleLogout = async () => {
    try {
      await api.post('/logout');
    } catch {
      // Ignore — token might be expired
    }

    // Clear local state
    localStorage.removeItem('amdal_token');
    localStorage.removeItem('amdal_user');
    setIsLoggedIn(false);
    setMenuOpen(false);
    setProfileOpen(false);
    setUserData(null);

    // Force navigate to home
    navigate('/', { replace: true });
  };

  // Navbar selalu putih solid, teks gelap — tidak lagi berubah saat scroll.
  return (
    <>
    <nav
      className={`${
        isProfilePage
          ? 'absolute top-0 left-0 z-40 w-full bg-gradient-to-b from-black/80 via-black/40 to-transparent border-none'
          : 'fixed top-0 left-0 z-50 w-full bg-white border-b border-gray-100 shadow-xs'
      }`}
      style={isProfilePage ? { border: 'none', borderBottom: 'none' } : undefined}
    >
      <div className="flex items-center w-full px-margin-mobile md:px-margin-desktop py-4">
        {/* Logo + nav links dikelompokkan di kiri, seperti Upwork */}
        <div className="flex items-center gap-10 shrink-0">
          <Link to="/" className="flex items-center shrink-0">
            <img
              src={logo}
              alt="TenagaAhli.com"
              className="h-10 md:h-12 w-auto"
            />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) =>
              link.isDropdown ? (
                <div
                  key={link.key}
                  className="relative group"
                  ref={(el) => (dropdownRefs.current[link.key] = el)}
                  onMouseEnter={() => setOpenDropdown(link.key)}
                  onMouseLeave={() => setOpenDropdown((v) => (v === link.key ? null : v))}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDropdown((v) => (v === link.key ? null : link.key))}
                    className={`relative flex items-center gap-1 font-label-md text-label-md py-1.5 transition-colors ${
                      link.isActive()
                        ? (isTransparent ? 'text-white font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]' : 'text-gray-800 font-semibold')
                        : (isTransparent ? 'text-white/90 hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]' : 'text-gray-500 hover:text-gray-800')
                    }`}
                  >
                    <span>{link.getLabel ? link.getLabel() : link.label}</span>
                    <span
                      className={`material-symbols-outlined text-[18px] transition-transform duration-300 ${
                        openDropdown === link.key
                          ? (isTransparent ? 'rotate-180 text-white' : 'rotate-180 text-[#8B4513]')
                          : (isTransparent ? 'text-white/80' : 'text-gray-400')
                      }`}
                    >
                      expand_more
                    </span>
                    <span
                      className="absolute left-0 -bottom-0.5 h-[2px] rounded-full transition-all duration-300"
                      style={{
                        width: link.isActive() ? '100%' : '0%',
                        backgroundColor: isTransparent ? '#ffffff' : BRAND_BROWN,
                      }}
                    />
                  </button>

                  {/* Dropdown Menu Desktop */}
                  <div
                    className={`absolute top-full left-0 pt-2 z-50 transform origin-top transition-all duration-300 ${
                      openDropdown === link.key
                        ? 'opacity-100 scale-100 pointer-events-auto'
                        : 'opacity-0 scale-95 pointer-events-none'
                    }`}
                  >
                    <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-2 w-60 relative">
                      {link.children.map((child) =>
                        child.hasSubmenu ? (
                          <div
                            key={child.to}
                            className="relative"
                            onMouseEnter={() => setOpenSubmenu(child.label)}
                            onMouseLeave={() => setOpenSubmenu(null)}
                          >
                            <Link
                              to={child.to}
                              onClick={() => {
                                setOpenDropdown(null);
                                setOpenSubmenu(null);
                              }}
                              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-gray-700 hover:bg-[#F5EBE1]/60 hover:text-[#8B4513] transition-all group/item"
                            >
                              <div className="min-w-0 pr-2">
                                <p className="font-semibold text-sm leading-tight text-gray-800 group-hover/item:text-[#8B4513]">{child.label}</p>
                                <p className="text-[11px] text-gray-400 truncate mt-0.5">{child.desc}</p>
                              </div>
                              <span className="material-symbols-outlined text-[18px] text-gray-400 group-hover/item:text-[#8B4513] group-hover/item:translate-x-0.5 transition-all shrink-0">
                                chevron_right
                              </span>
                            </Link>

                            {/* Sub-menu Flyout 16 Keahlian Utama (Desktop) */}
                            <div
                              className={`absolute left-full top-0 pl-2 w-[420px] transform origin-top-left transition-all duration-200 ${
                                openSubmenu === child.label
                                  ? 'opacity-100 scale-100 pointer-events-auto'
                                  : 'opacity-0 scale-95 pointer-events-none'
                              }`}
                            >
                              <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-3.5">
                                <div className="flex items-center justify-between px-2 pb-2.5 mb-2 border-b border-gray-100">
                                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                    {t('16 Keahlian Utama')}
                                  </span>
                                  <Link
                                    to="/daftar-profil"
                                    onClick={() => {
                                      setOpenDropdown(null);
                                      setOpenSubmenu(null);
                                    }}
                                    className="text-[11px] font-bold text-[#8B4513] hover:underline flex items-center gap-0.5"
                                  >
                                    <span>{t('Semua Ahli')}</span>
                                    <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                                  </Link>
                                </div>
                                <div className="grid grid-cols-2 gap-1.5 max-h-[70vh] overflow-y-auto pr-1">
                                  {child.submenu.map((item) => (
                                    <Link
                                      key={item.name}
                                      to={`/daftar-profil?keahlian=${encodeURIComponent(item.query)}`}
                                      onClick={() => {
                                        setOpenDropdown(null);
                                        setOpenSubmenu(null);
                                      }}
                                      className="flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-[#F5EBE1]/70 hover:text-[#8B4513] transition-all group/skill"
                                    >
                                      <span className="material-symbols-outlined text-[17px] text-[#8B4513]/70 group-hover/skill:text-[#8B4513] group-hover/skill:scale-110 transition-transform shrink-0">
                                        {item.icon}
                                      </span>
                                      <span className="truncate">{t(item.name)}</span>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <Link
                            key={child.to}
                            to={child.to}
                            onClick={() => {
                              setOpenDropdown(null);
                              setOpenSubmenu(null);
                            }}
                            className="block px-3.5 py-3 rounded-xl text-gray-700 hover:bg-[#F5EBE1]/60 hover:text-[#8B4513] transition-all group"
                          >
                            <p className="font-semibold text-sm leading-tight text-gray-800 group-hover:text-[#8B4513]">{child.label}</p>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{child.desc}</p>
                          </Link>
                        )
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === '/'}
                  className={({ isActive }) =>
                    `relative font-label-md text-label-md py-1.5 transition-colors ${
                      isActive
                        ? (isTransparent ? 'text-white font-bold drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]' : 'text-gray-800 font-semibold')
                        : (isTransparent ? 'text-white/90 hover:text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]' : 'text-gray-500 hover:text-gray-800')
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {link.label}
                      <span
                        className="absolute left-0 -bottom-0.5 h-[2px] rounded-full transition-all duration-200"
                        style={{
                          width: isActive ? '100%' : '0%',
                          backgroundColor: isTransparent ? '#ffffff' : BRAND_BROWN,
                        }}
                      />
                    </>
                  )}
                </NavLink>
              )
            )}
          </div>
        </div>

        {/* Bahasa + akun dipin ke kanan jauh, seperti Upwork */}
        <div className={`hidden md:flex items-center gap-3 ml-auto pl-4 border-l transition-colors duration-300 ${
          isTransparent ? 'border-white/25' : 'border-gray-200'
        }`}>
          <LanguageSwitcher />

          {isLoggedIn && (
            <NotificationBell darkVariant={isTransparent} />
          )}

          {isLoggedIn ? (
            /* FOTO PROFIL DROPDOWN (DESKTOP) */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ '--tw-ring-color': BRAND_BROWN }}
              >
                {!avatarError && getPhotoUrl(userData) ? (
                  <img
                    src={getPhotoUrl(userData)}
                    alt="Profile"
                    onError={(e) => {
                      const src = e.currentTarget.src;
                      if (src.includes('/files/')) {
                        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://tenagaahli.com';
                        const clean = src.split('/files/')[1];
                        e.currentTarget.src = `${backendUrl}/storage/${clean}`;
                      } else {
                        setAvatarError(true);
                      }
                    }}
                    className={`w-10 h-10 rounded-full object-cover border-2 transition-all ${
                      isTransparent ? 'border-white shadow-md' : 'border-gray-200'
                    }`}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#8B4513] text-white text-xs font-black flex items-center justify-center border-2 border-white shadow-xs">
                    {getInitials(userData?.name || userData?.nama)}
                  </div>
                )}
              </button>

              {/* Box Dropdown — solid card, hairline border, no blur/glow */}
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl border border-gray-100 py-2 z-50 text-gray-800 shadow-lg">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="font-label-md text-sm font-semibold truncate">
                      {userData?.name || userData?.nama || 'User TenagaAhli'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{userData?.email || ''}</p>
                    <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8B4513]/10 text-[#8B4513]">
                      {isAdmin ? 'Admin' : isKlien ? 'Klien' : (userData?.role_type === 'surveyor' ? 'Surveyor' : (userData?.role_type === 'tenaga_teknis' ? 'Tenaga Teknis' : 'Tenaga Ahli'))}
                    </span>
                  </div>

                  {/* ADMIN */}
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px] text-gray-400">admin_panel_settings</span>
                      {t('Panel Admin')}
                    </Link>
                  )}

                  {/* KLIEN */}
                  {isKlien && (
                    <>
                      <Link
                        to="/akun"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-gray-400">account_circle</span>
                        {t('Akun Saya')}
                      </Link>

                      <Link
                        to="/top-up"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-gray-400">toll</span>
                        {t('Top Up Point')}
                      </Link>

                      <Link
                        to="/kelola-berita"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-gray-400">edit_note</span>
                        {t('Tulis / Kelola Berita')}
                      </Link>

                      <Link
                        to="/tiket"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-gray-400">support_agent</span>
                        {t('Tiket & Bantuan')}
                      </Link>
                    </>
                  )}

                  {/* TENAGA AHLI / SURVEYOR */}
                  {isExpert && (
                    <>
                      <Link
                        to={getDashboardPath()}
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-gray-400">dashboard</span>
                        {t('Dashboard')}
                      </Link>

                      <Link
                        to="/profil-saya"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-gray-400">person</span>
                        {t('Profil Saya')}
                      </Link>

                      <Link
                        to="/invoice"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-gray-400">receipt_long</span>
                        {t('Invoice')}
                      </Link>

                      <Link
                        to="/pembayaran"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-gray-400">payments</span>
                        {t('Pembayaran')}
                      </Link>

                      <Link
                        to="/kelola-berita"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-gray-400">edit_note</span>
                        {t('Tulis / Kelola Berita')}
                      </Link>

                      <Link
                        to="/tiket"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px] text-gray-400">support_agent</span>
                        {t('Tiket & Bantuan')}
                      </Link>
                    </>
                  )}

                  <hr className="border-gray-100 my-1" />

                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#B3261E] hover:bg-red-50 transition-colors text-left font-medium"
                  >
                    <span className="material-symbols-outlined text-[18px]">logout</span>
                    {t('Keluar')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              to="/sign-in"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-label-md text-sm text-white transition-all shadow-sm"
              style={{ backgroundColor: BRAND_BROWN }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_BROWN_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_BROWN)}
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              {t('Masuk')}
            </Link>
          )}
        </div>

        {/* Mobile top bar: Notifikasi dan Menu Akun di sebelah lonceng */}
        <div className="md:hidden ml-auto flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <NotificationBell darkVariant={isTransparent} />
              <button
                type="button"
                id="mobile-account-button"
                onClick={() => toggleSheet('menu')}
                className="flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-[#8B4513]/20 active:scale-95 transition-all focus:outline-none"
                aria-label="Menu Akun"
              >
                {!avatarError && getPhotoUrl(userData) ? (
                  <img
                    src={getPhotoUrl(userData)}
                    alt="Profile"
                    onError={(e) => {
                      const src = e.currentTarget.src;
                      if (src.includes('/files/')) {
                        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://tenagaahli.com';
                        const clean = src.split('/files/')[1];
                        e.currentTarget.src = `${backendUrl}/storage/${clean}`;
                      } else {
                        setAvatarError(true);
                      }
                    }}
                    className="w-8 h-8 rounded-full object-cover border border-[#8B4513]/30 shadow-xs ring-1 ring-white/60"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-[#8B4513] text-white text-[11px] font-black flex items-center justify-center shadow-xs ring-1 ring-white/60">
                    {getInitials(userData?.name || userData?.nama)}
                  </div>
                )}
              </button>
            </>
          ) : (
            <Link
              to="/sign-in"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-xs transition-all active:scale-95"
              style={{ backgroundColor: BRAND_BROWN }}
            >
              <span className="material-symbols-outlined text-[16px]">account_circle</span>
              <span>{t('Masuk')}</span>
            </Link>
          )}
        </div>
      </div>
    </nav>

      {/* Mobile Bottom Sheet — dibuka dari tab di bottom nav */}
      <div
        className={`md:hidden fixed inset-0 z-[55] ${menuOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}
        aria-hidden={!menuOpen}
      >
        <div
          onClick={() => setMenuOpen(false)}
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${menuOpen ? 'opacity-100' : 'opacity-0'}`}
        />
        <div
          className={`absolute inset-x-0 bottom-0 bg-white rounded-t-3xl shadow-2xl max-h-[80vh] overflow-y-auto transition-transform duration-300 ease-out ${
            menuOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
          style={{ paddingBottom: 'calc(4.75rem + env(safe-area-inset-bottom))' }}
        >
          <div className="sticky top-0 z-10 bg-white pt-3 pb-2 flex justify-center">
            <span className="w-10 h-1.5 rounded-full bg-gray-200" />
          </div>
        <div className="flex flex-col px-margin-mobile pb-2 gap-1 text-gray-800">
          {navLinks
            .filter((link) =>
              sheetMode === 'menu'
                ? !link.isDropdown && link.to !== '/' && link.to !== '/peta-ahli'
                : link.key === sheetMode
            )
            .map((link) =>
            link.isDropdown ? (
              <div key={link.key} className="py-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 px-1 pb-2">
                  {link.sheetTitle}
                </p>
                {(
                  <div className="flex flex-col gap-1">
                    {link.children.map((child) =>
                      child.hasSubmenu ? (
                        <div key={child.to} className="flex flex-col">
                          <div className="flex items-center justify-between py-3 px-3 rounded-xl text-sm text-gray-700 hover:text-[#8B4513] hover:bg-[#F5EBE1]/40">
                            <Link
                              to={child.to}
                              onClick={() => {
                                setMenuOpen(false);
                                setMobileOpenDropdown(null);
                                setMobileOpenSubmenu(null);
                              }}
                              className="flex-1 min-w-0"
                            >
                              <p className="font-semibold text-gray-800">{child.label}</p>
                              <p className="text-[11px] text-gray-400 truncate mt-0.5">{child.desc}</p>
                            </Link>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMobileOpenSubmenu((prev) => (prev === child.label ? null : child.label));
                              }}
                              className="p-1 text-gray-400 hover:text-[#8B4513]"
                            >
                              <span
                                className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${
                                  mobileOpenSubmenu === child.label ? 'rotate-180 text-[#8B4513]' : ''
                                }`}
                              >
                                expand_more
                              </span>
                            </button>
                          </div>
                          {mobileOpenSubmenu === child.label && (
                            <div className="pl-2 pr-1 py-2 grid grid-cols-2 gap-1.5 bg-gray-50/90 rounded-xl my-1 border border-gray-100">
                              {child.submenu.map((item) => (
                                <Link
                                  key={item.name}
                                  to={`/daftar-profil?keahlian=${encodeURIComponent(item.query)}`}
                                  onClick={() => {
                                    setMenuOpen(false);
                                    setMobileOpenDropdown(null);
                                    setMobileOpenSubmenu(null);
                                  }}
                                  className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-700 hover:text-[#8B4513] hover:bg-white rounded-lg transition-colors"
                                >
                                  <span className="material-symbols-outlined text-[15px] text-[#8B4513]/80 shrink-0">
                                    {item.icon}
                                  </span>
                                  <span className="truncate">{t(item.name)}</span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <Link
                          key={child.to}
                          to={child.to}
                          onClick={() => {
                            setMenuOpen(false);
                            setMobileOpenDropdown(null);
                            setMobileOpenSubmenu(null);
                          }}
                          className={`flex items-center justify-between gap-2.5 py-3 px-3 rounded-xl text-sm hover:text-[#8B4513] hover:bg-[#F5EBE1]/40 ${
                            location.pathname === child.to ? 'bg-[#F5EBE1]/60' : ''
                          }`}
                        >
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800">{child.label}</p>
                            <p className="text-[11px] text-gray-400 truncate mt-0.5">{child.desc}</p>
                          </div>
                          <span className="material-symbols-outlined text-[18px] text-gray-300 shrink-0">chevron_right</span>
                        </Link>
                      )
                    )}
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 ${isActive ? 'font-semibold' : 'text-gray-700'}`
                }
                style={({ isActive }) => (isActive ? { color: BRAND_BROWN } : undefined)}
              >
                <span className="material-symbols-outlined text-[18px] text-gray-400">info</span>
                {link.label}
              </NavLink>
            )
          )}

          {sheetMode === 'menu' && (isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 py-4 border-b border-gray-50">
                {!avatarError && getPhotoUrl(userData) ? (
                  <img
                    src={getPhotoUrl(userData)}
                    alt="Profile"
                    onError={(e) => {
                      const src = e.currentTarget.src;
                      if (src.includes('/files/')) {
                        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://tenagaahli.com';
                        const clean = src.split('/files/')[1];
                        e.currentTarget.src = `${backendUrl}/storage/${clean}`;
                      } else {
                        setAvatarError(true);
                      }
                    }}
                    className="w-11 h-11 rounded-full object-cover border border-gray-200"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-[#8B4513] text-white text-sm font-black flex items-center justify-center shrink-0 shadow-xs">
                    {getInitials(userData?.name || userData?.nama)}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-label-md text-sm font-semibold truncate">
                    {userData?.name || userData?.nama || 'User TenagaAhli'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{userData?.email || ''}</p>
                  <span className="inline-block mt-0.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#8B4513]/10 text-[#8B4513]">
                    {isAdmin ? 'Admin' : isKlien ? 'Klien' : (userData?.role_type === 'surveyor' ? 'Surveyor' : (userData?.role_type === 'tenaga_teknis' ? 'Tenaga Teknis' : 'Tenaga Ahli'))}
                  </span>
                </div>
              </div>

              {/* ADMIN */}
              {isAdmin && (
                <Link
                  to="/admin"
                  onClick={() => setMenuOpen(false)}
                  className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
                >
                  <span className="material-symbols-outlined text-[18px] text-gray-400">admin_panel_settings</span>
                  {t('Panel Admin')}
                </Link>
              )}

              {/* KLIEN */}
              {isKlien && (
                <>
                  <Link
                    to="/akun"
                    onClick={() => setMenuOpen(false)}
                    className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
                  >
                    <span className="material-symbols-outlined text-[18px] text-gray-400">account_circle</span>
                    {t('Akun Saya')}
                  </Link>
                  <Link
                    to="/top-up"
                    onClick={() => setMenuOpen(false)}
                    className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
                  >
                    <span className="material-symbols-outlined text-[18px] text-gray-400">toll</span>
                    {t('Top Up Point')}
                  </Link>
                  <Link
                    to="/kelola-berita"
                    onClick={() => setMenuOpen(false)}
                    className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
                  >
                    <span className="material-symbols-outlined text-[18px] text-gray-400">edit_note</span>
                    {t('Tulis / Kelola Berita')}
                  </Link>
                  <Link
                    to="/tiket"
                    onClick={() => setMenuOpen(false)}
                    className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
                  >
                    <span className="material-symbols-outlined text-[18px] text-gray-400">support_agent</span>
                    {t('Tiket & Bantuan')}
                  </Link>
                </>
              )}

              {/* EXPERT (TENAGA AHLI & SURVEYOR) */}
              {isExpert && (
                <>
                  <Link
                    to={getDashboardPath()}
                    onClick={() => setMenuOpen(false)}
                    className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
                  >
                    <span className="material-symbols-outlined text-[18px] text-gray-400">dashboard</span>
                    {t('Dashboard')}
                  </Link>
                  <Link
                    to="/profil-saya"
                    onClick={() => setMenuOpen(false)}
                    className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
                  >
                    <span className="material-symbols-outlined text-[18px] text-gray-400">person</span>
                    {t('Profil Saya')}
                  </Link>
                  <Link
                    to="/invoice"
                    onClick={() => setMenuOpen(false)}
                    className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
                  >
                    <span className="material-symbols-outlined text-[18px] text-gray-400">receipt_long</span>
                    {t('Invoice')}
                  </Link>
                  <Link
                    to="/pembayaran"
                    onClick={() => setMenuOpen(false)}
                    className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
                  >
                    <span className="material-symbols-outlined text-[18px] text-gray-400">payments</span>
                    {t('Pembayaran')}
                  </Link>
                  <Link
                    to="/kelola-berita"
                    onClick={() => setMenuOpen(false)}
                    className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
                  >
                    <span className="material-symbols-outlined text-[18px] text-gray-400">edit_note</span>
                    {t('Tulis / Kelola Berita')}
                  </Link>
                  <Link
                    to="/tiket"
                    onClick={() => setMenuOpen(false)}
                    className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
                  >
                    <span className="material-symbols-outlined text-[18px] text-gray-400">support_agent</span>
                    {t('Tiket & Bantuan')}
                  </Link>
                </>
              )}

              <button
                onClick={handleLogout}
                className="font-label-md text-label-md text-left text-[#B3261E] flex items-center gap-2.5 py-3 font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                {t('Keluar')}
              </button>

              {/* Language Switcher Mobile */}
              <div className="mt-4 pt-3 border-t border-gray-100">
                <LanguageSwitcher fullWidth />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 mt-2">
              <Link
                to="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg font-label-md text-sm text-white font-medium"
                style={{ backgroundColor: BRAND_BROWN }}
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                {t('Masuk')}
              </Link>

              {/* Language Switcher Mobile */}
              <LanguageSwitcher fullWidth />
            </div>
          ))}
        </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-[60] bg-white/95 backdrop-blur-md border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Navigasi bawah"
      >
        <div className="grid grid-cols-5 h-16">
          {bottomTabs.map((tab) => {
            const isCenterTab = tab.id === 'search';
            const baseCls = isCenterTab
              ? 'relative flex flex-col items-center justify-center transition-all duration-200 active:scale-95 z-10'
              : 'relative flex flex-col items-center justify-center gap-1 transition-colors duration-200 active:scale-95';
            if (tab.sheet) {
              const active = menuOpen ? sheetMode === tab.id : tab.isActive();
              return (
                <button
                  key={tab.id}
                  id={`bottom-nav-${tab.id}`}
                  type="button"
                  onClick={() => toggleSheet(tab.id)}
                  aria-expanded={menuOpen && sheetMode === tab.id}
                  className={`${baseCls} ${active ? 'text-[#8B4513]' : 'text-gray-500'}`}
                >
                  {renderTabInner(tab, active)}
                </button>
              );
            }
            return (
              <NavLink
                key={tab.id}
                id={`bottom-nav-${tab.id}`}
                to={tab.to}
                end={tab.end}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `${baseCls} ${isActive && !menuOpen ? 'text-[#8B4513]' : 'text-gray-500'}`
                }
              >
                {({ isActive }) => renderTabInner(tab, isActive && !menuOpen)}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </>
  );
}