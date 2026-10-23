import { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import logo from "../assets/new logo.png";
import api from '../api/client.js';

export default function MembershipLayout({ children }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);

  // Tentukan link dashboard berdasarkan role_type user
  const [dashboardPath, setDashboardPath] = useState('/dashboard');

  const NAV_ITEMS = [
    { to: dashboardPath,   label: t('Dashboard'),       icon: 'space_dashboard' },
    { to: '/profil-saya',  label: t('Profil Saya'),     icon: 'person' },
    { to: '/membership',   label: t('Membership'),      icon: 'stars' },
    { to: '/paket',        label: t('Paket'),            icon: 'workspace_premium' },
    { to: '/invoice',      label: t('Invoice'),          icon: 'receipt_long' },
    { to: '/pembayaran',   label: t('Pembayaran'),       icon: 'payments' },
    { to: '/tiket',        label: t('Tiket'),            icon: 'support_agent' },
    { to: '/ulasan',       label: t('Ulasan'),           icon: 'star' },
    { to: '/pengaturan',   label: t('Pengaturan'),       icon: 'settings' },
  ];

  useEffect(() => {
    try {
      const raw = localStorage.getItem('amdal_user');
      if (raw) {
        const u = JSON.parse(raw);
        setUser(u);
        // Tentukan path dashboard sesuai role_type
        if (u.role_type === 'surveyor') {
          setDashboardPath('/dashboard-surveyor');
        } else {
          setDashboardPath('/dashboard');
        }
      }
    } catch {
      /* ignore malformed cache */
    }
  }, []);

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
    <div className="min-h-screen bg-[#F5F4EF] flex">
      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none !important;
        }
        .no-scrollbar {
          -ms-overflow-style: none !important;
          scrollbar-width: none !important;
        }
      `}</style>

      {/* Sidebar only - no topbar */}
      <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[#8B4513] to-[#654321] text-white flex flex-col transition-all duration-300 z-50 no-scrollbar ${isExpanded ? 'w-64' : 'w-20'}`}>
        {/* Header Sidebar */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-white/10 min-h-[76px] shrink-0">
          {isExpanded ? (
            <>
              <div className="flex flex-col items-start gap-1 overflow-hidden transition-all duration-200">
                <img src={logo} alt="TenagaAhli.com" className="h-12 md:h-14 max-w-[170px] w-auto shrink-0 object-contain drop-shadow-sm" />
                <span className="font-extrabold text-[10px] tracking-widest uppercase text-white/70 ml-0.5">
                  {user?.role_type === 'surveyor' ? 'Surveyor' : (user?.role_type === 'klien' ? 'Klien' : 'Tenaga Ahli')}
                </span>
              </div>
              <button onClick={() => setIsExpanded(!isExpanded)} className="text-white/85 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors">
                <span className="material-symbols-outlined text-[22px]">menu</span>
              </button>
            </>
          ) : (
            <button onClick={() => setIsExpanded(!isExpanded)} className="text-white/85 hover:text-white p-1.5 hover:bg-white/10 rounded-lg transition-colors mx-auto">
              <span className="material-symbols-outlined text-[22px]">menu</span>
            </button>
          )}
        </div>

        {/* Navigasi Utama */}
        <nav className="flex-1 px-3 py-6 flex flex-col gap-1.5 overflow-y-auto overflow-x-hidden no-scrollbar">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              title={!isExpanded ? item.label : undefined}
              className={({ isActive }) =>
                `flex items-center gap-4 px-3.5 py-3 rounded-lg text-xs font-bold tracking-wider uppercase transition-all duration-200 ${
                  isActive 
                    ? 'bg-black/10 text-white border-l-4 border-white' 
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                } ${!isExpanded ? 'justify-center px-0 border-l-0' : ''}`
              }
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              {isExpanded && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User Info & Logout */}
        <div className="p-3 border-t border-white/10 flex flex-col gap-1.5 shrink-0">
          {isExpanded && (
            <div className="flex items-center gap-3 px-3 py-2 mb-2 overflow-hidden bg-white/5 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-xs font-bold shrink-0">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold truncate">{user?.name || 'Pengguna'}</p>
                <p className="text-[10px] text-white/55 truncate">{user?.email || ''}</p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title={!isExpanded ? t('Keluar') : undefined}
            className={`flex items-center gap-3 px-3.5 py-3 rounded-lg text-xs font-bold tracking-wider uppercase text-[#FFB4AB] hover:bg-[#FFB4AB]/10 transition-colors ${!isExpanded ? 'justify-center px-0' : ''}`}
          >
            <span className="material-symbols-outlined text-[20px]">logout</span>
            {isExpanded && <span>{t('Keluar')}</span>}
          </button>
        </div>
      </aside>

      {/* Main Content - No navbar, no footer, just content */}
      <main className={`flex-1 transition-all duration-300 ${isExpanded ? 'ml-64' : 'ml-20'}`}>
        <div className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}