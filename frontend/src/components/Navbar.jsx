import { useEffect, useState, useRef } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import logo from '../assets/tenaga ahli 2.png';
import api from '../api/client.js';
import LanguageSwitcher from './LanguageSwitcher.jsx';

// Brand tokens — same blue used across the rest of the site.
const BRAND_BLUE = '#1479D6';
const BRAND_BLUE_HOVER = '#0F63B0';

export default function Navbar() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [userData, setUserData] = useState(null);

  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  const navLinks = [
    { to: '/', label: t('Beranda') },
    { to: '/tentang-kami', label: t('Tentang Kami') },
    { to: '/member', label: t('Anggota') },
    { to: '/peraturan-amdal', label: t('Syarat') },
    { to: '/pamflet', label: t('Pamflet') },
  ];

  // Helper untuk resolve foto URL (sama seperti di ProfilSaya)
  const getPhotoUrl = (user) => {
    if (!user) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';

    const photoUrl = user.avatar_url || user.foto;
    if (!photoUrl) return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80';

    // Jika sudah full URL (http/https), return dengan cache buster
    if (photoUrl.startsWith('http')) {
      // Tambahkan timestamp untuk cache-busting jika belum ada
      return photoUrl.includes('?') ? photoUrl : `${photoUrl}?t=${Date.now()}`;
    }

    // Jika masih path relatif, resolve dengan backend URL + cache buster
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://tenagaahli.latihan.co.id';
    return `${baseUrl}/storage/${photoUrl}?t=${Date.now()}`;
  };

  // Cek status login & ambil data user dari localStorage
  useEffect(() => {
    const loadUser = () => {
      const token = localStorage.getItem('amdal_token');
      const user = localStorage.getItem('amdal_user');

      setIsLoggedIn(!!token);
      if (user) {
        try {
          const parsedUser = JSON.parse(user);
          console.log('📸 Navbar load user data:', parsedUser);

          // Force update dengan timestamp baru untuk memaksa re-render
          setUserData({ ...parsedUser, _loadedAt: Date.now() });
        } catch (e) {
          console.error('Error parsing user data', e);
          setUserData(null);
        }
      } else {
        setUserData(null);
      }
    };

    loadUser(); // jalan saat mount & saat location berubah

    // Dengarkan event custom: dipicu manual saat profil di-update di halaman
    // lain (mis. setelah upload foto di /profil-saya) tanpa perlu reload.
    const handleUserUpdate = () => {
      console.log('📸 Navbar menerima event amdal-user-updated');
      loadUser();
    };

    window.addEventListener('amdal-user-updated', handleUserUpdate);
    // Dengarkan storage event bawaan browser: berguna kalau ada tab lain
    // yang mengubah localStorage (native, tapi tidak jalan di tab yang sama).
    window.addEventListener('storage', loadUser);

    return () => {
      window.removeEventListener('amdal-user-updated', handleUserUpdate);
      window.removeEventListener('storage', loadUser);
    };
  }, [location]);

  // Menutup dropdown profil jika klik di luar area menu
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Menutup menu mobile otomatis saat pindah halaman
  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

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
    <nav className="fixed top-0 left-0 z-50 w-full bg-white border-b border-gray-100">
      <div className="flex items-center w-full px-margin-mobile md:px-margin-desktop py-3">
        {/* Logo + nav links dikelompokkan di kiri, seperti Upwork */}
        <div className="flex items-center gap-10 shrink-0">
          <Link to="/" className="flex items-center shrink-0">
            <img src={logo} alt="TenagaAhli.com" className="h-7 md:h-8 w-auto" />
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                className={({ isActive }) =>
                  `relative font-label-md text-label-md py-1.5 transition-colors ${
                    isActive ? 'text-gray-800 font-semibold' : 'text-gray-500 hover:text-gray-800'
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
                        backgroundColor: BRAND_BLUE,
                      }}
                    />
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Bahasa + akun dipin ke kanan jauh, seperti Upwork */}
        <div className="hidden md:flex items-center gap-3 ml-auto pl-4 border-l border-gray-200">
          <LanguageSwitcher />

          {isLoggedIn ? (
            /* FOTO PROFIL DROPDOWN (DESKTOP) */
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                style={{ '--tw-ring-color': BRAND_BLUE }}
              >
                <img
                  src={getPhotoUrl(userData)}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover border-2 border-gray-200"
                />
              </button>

              {/* Box Dropdown — solid card, hairline border, no blur/glow */}
              {profileOpen && (
                <div className="absolute right-0 mt-3 w-56 bg-white rounded-xl border border-gray-100 py-2 z-50 text-gray-800">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="font-label-md text-sm font-semibold truncate">
                      {userData?.name || userData?.nama || 'User TenagaAhli'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{userData?.email || ''}</p>
                  </div>

                  <Link
                    to="/dashboard"
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
            /* Tombol "Login" — mengarah ke halaman login */
            <Link
              to="/sign-in"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg font-label-md text-label-md text-white transition-colors"
              style={{ backgroundColor: BRAND_BLUE }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = BRAND_BLUE_HOVER)}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = BRAND_BLUE)}
            >
              <span className="material-symbols-outlined text-[18px]">login</span>
              {t('Masuk')}
            </Link>
          )}
        </div>

        {/* Mobile Toggle Button */}
        <button
          className="md:hidden ml-auto text-gray-800 w-9 h-9 flex items-center justify-center rounded-lg"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Buka menu"
          aria-expanded={menuOpen}
        >
          <span className="material-symbols-outlined">{menuOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {/* Mobile Menu — solid panel, no blur/glow */}
      {menuOpen && (
        <div className="md:hidden w-full bg-white border-t border-gray-100 flex flex-col px-margin-mobile py-5 gap-1 text-gray-800">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `font-label-md text-label-md py-3 border-b border-gray-50 ${isActive ? 'font-semibold' : 'text-gray-600'}`
              }
              style={({ isActive }) => (isActive ? { color: BRAND_BLUE } : undefined)}
            >
              {link.label}
            </NavLink>
          ))}

          {isLoggedIn ? (
            <>
              <div className="flex items-center gap-3 py-4">
                <img
                  src={getPhotoUrl(userData)}
                  alt="Profile"
                  className="w-11 h-11 rounded-full object-cover border border-gray-200"
                />
                <div className="min-w-0">
                  <p className="font-label-md text-sm font-semibold truncate">
                    {userData?.name || userData?.nama || 'User TenagaAhli'}
                  </p>
                  <p className="text-xs text-gray-400 truncate">{userData?.email || ''}</p>
                </div>
              </div>
              <Link
                to="/dashboard"
                onClick={() => setMenuOpen(false)}
                className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
              >
                <span className="material-symbols-outlined text-[18px] text-gray-400">dashboard</span>
                Dashboard
              </Link>
              <Link
                to="/profil-saya"
                onClick={() => setMenuOpen(false)}
                className="font-label-md text-label-md flex items-center gap-2.5 py-3 border-b border-gray-50 text-gray-700"
              >
                <span className="material-symbols-outlined text-[18px] text-gray-400">person</span>
                Profil Saya
              </Link>
              <button
                onClick={handleLogout}
                className="font-label-md text-label-md text-left text-[#B3261E] flex items-center gap-2.5 py-3 font-medium"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>

              {/* Language Switcher Mobile */}
              <div className="mt-3">
                <LanguageSwitcher />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-3 pt-4">
              {/* Tombol "Login" — mengarah ke halaman login */}
              <Link
                to="/sign-in"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-lg font-label-md text-label-md text-white"
                style={{ backgroundColor: BRAND_BLUE }}
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                {t('Masuk')}
              </Link>

              {/* Language Switcher Mobile */}
              <LanguageSwitcher />
            </div>
          )}
        </div>
      )}
    </nav>
  );
}