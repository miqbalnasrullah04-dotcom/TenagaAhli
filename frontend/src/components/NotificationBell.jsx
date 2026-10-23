import { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext.jsx';
import { useTranslation } from '../context/LanguageContext.jsx';

export default function NotificationBell({ className = '', darkVariant = false }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { notifications, unreadTotal, counts, markAllAsRead, markChatRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const dropdownRef = useRef(null);

  const rawUser = localStorage.getItem('amdal_user');
  let currentUser = null;
  try {
    currentUser = rawUser ? JSON.parse(rawUser) : null;
  } catch {
    currentUser = null;
  }
  const isAdmin = currentUser?.role === 'admin' || location.pathname.startsWith('/admin');

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const filteredList = notifications.filter((item) => {
    if (activeFilter === 'chat') return item.type === 'chat';
    if (activeFilter === 'product') return item.type === 'product_sale' || item.type === 'product_order';
    if (activeFilter === 'consultation') return item.type === 'consultation_request' || item.type === 'consultation_confirmed';
    if (activeFilter === 'admin') return item.type === 'admin_task';
    return true;
  });

  const handleNotificationClick = (item) => {
    if (item.type === 'chat' && item.consultation_id) {
      markChatRead(item.consultation_id);
    }
    setIsOpen(false);
    if (item.link) {
      navigate(item.link);
    }
  };

  const getIconBg = (type, color) => {
    switch (type) {
      case 'chat':
        return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'product_sale':
        return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'product_order':
        return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'consultation_request':
      case 'consultation_confirmed':
        return 'bg-purple-50 text-purple-600 border border-purple-100';
      case 'admin_task':
        return color === 'red' 
          ? 'bg-rose-50 text-rose-600 border border-rose-100' 
          : 'bg-amber-50 text-amber-700 border border-amber-100';
      case 'verification':
        return color === 'emerald'
          ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
          : 'bg-amber-50 text-amber-600 border border-amber-100';
      default:
        return 'bg-gray-50 text-gray-600 border border-gray-100';
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* ── Bell Trigger Button ── */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all duration-200 focus:outline-none flex items-center justify-center cursor-pointer ${
          darkVariant
            ? 'text-white/90 hover:text-white hover:bg-white/10 active:bg-white/20'
            : 'text-gray-700 hover:text-[#8B4513] hover:bg-gray-100/80 active:bg-gray-200'
        }`}
        aria-label="Pemberitahuan / Notifikasi"
        title="Pemberitahuan / Notifikasi"
      >
        <span className="material-symbols-outlined text-[22px]">notifications</span>

        {/* Unread Badge */}
        {unreadTotal > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] px-1 items-center justify-center rounded-full bg-red-600 text-[10px] font-black text-white shadow-sm ring-2 ring-white animate-pulse">
            {unreadTotal > 99 ? '99+' : unreadTotal}
          </span>
        )}
      </button>

      {/* ── Dropdown Notification Menu ── */}
      {isOpen && (
        <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 mt-2 top-14 sm:top-auto sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="px-4 py-3 bg-[#FAF6F0] border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[19px] text-[#8B4513]">notifications_active</span>
              <h3 className="font-bold text-sm text-gray-900 leading-none">{t('Notifikasi')}</h3>
              {unreadTotal > 0 && (
                <span className="text-[10px] font-bold bg-[#8B4513] text-white px-2 py-0.5 rounded-full">
                  {unreadTotal} {t('baru')}
                </span>
              )}
            </div>

            {unreadTotal > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-bold text-[#8B4513] hover:underline transition-colors"
              >
                {t('Tandai semua dibaca')}
              </button>
            )}
          </div>

          {/* Quick Filter Tabs */}
          <div className="px-3 pt-2 pb-1.5 flex items-center gap-1.5 border-b border-gray-100 overflow-x-auto no-scrollbar bg-white">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                activeFilter === 'all'
                  ? 'bg-[#8B4513] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Semua {notifications.length > 0 ? `(${notifications.length})` : ''}
            </button>
            
            {counts.chat > 0 && !isAdmin && (
              <button
                onClick={() => setActiveFilter('chat')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'chat'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                <span>Chat</span>
                <span className="bg-blue-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {counts.chat}
                </span>
              </button>
            )}

            {counts.consultations > 0 && (
              <button
                onClick={() => setActiveFilter('consultation')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'consultation'
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                }`}
              >
                <span>Konsultasi</span>
                <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {counts.consultations}
                </span>
              </button>
            )}

            {counts.product_sales > 0 && (
              <button
                onClick={() => setActiveFilter('product')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'product'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
              >
                <span>Penjualan</span>
                <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {counts.product_sales}
                </span>
              </button>
            )}

            {counts.admin > 0 && (
              <button
                onClick={() => setActiveFilter('admin')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1 ${
                  activeFilter === 'admin'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span>Admin</span>
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {counts.admin}
                </span>
              </button>
            )}
          </div>

          {/* Notification List Container */}
          <div className="max-h-[360px] sm:max-h-[380px] overflow-y-auto divide-y divide-gray-100">
            {filteredList.length === 0 ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mb-2.5">
                  <span className="material-symbols-outlined text-[24px]">notifications_off</span>
                </div>
                <p className="text-xs font-bold text-gray-700">Tidak ada notifikasi baru</p>
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Pemberitahuan chat, jadwal konsultasi, dan aktivitas akun akan muncul di sini.
                </p>
              </div>
            ) : (
              filteredList.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleNotificationClick(item)}
                  className={`p-3.5 hover:bg-amber-50/50 cursor-pointer transition-colors flex items-start gap-3 ${
                    !item.is_read ? 'bg-[#FAF6F0]/60' : 'bg-white'
                  }`}
                >
                  {/* Icon */}
                  <div
                    className={`w-9 h-9 rounded-xl shrink-0 flex items-center justify-center shadow-2xs ${getIconBg(
                      item.type,
                      item.color
                    )}`}
                  >
                    <span className="material-symbols-outlined text-[19px]">{item.icon || 'notifications'}</span>
                  </div>

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <h4
                        className={`text-xs truncate ${
                          !item.is_read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                        }`}
                      >
                        {item.title}
                      </h4>
                      {!item.is_read && (
                        <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-500 leading-snug line-clamp-2">
                      {item.description}
                    </p>
                    <div className="flex items-center justify-between mt-1.5 text-[10px] text-gray-400">
                      <span>{item.time}</span>
                      {item.count && item.count > 1 && (
                        <span className="font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                          {item.count} pesan
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Links */}
          <div className={`px-4 py-2.5 bg-gray-50/80 border-t border-gray-100 flex items-center text-xs ${isAdmin ? 'justify-end' : 'justify-between'}`}>
            {!isAdmin && (
              <Link
                to="/chat"
                onClick={() => setIsOpen(false)}
                className="font-bold text-[#8B4513] hover:underline inline-flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[15px]">chat</span>
                <span>Buka Chat</span>
              </Link>
            )}
            <Link
              to={isAdmin ? '/admin/konsultasi' : '/konsultasi'}
              onClick={() => setIsOpen(false)}
              className={isAdmin ? 'text-gray-600 hover:text-[#8B4513] font-semibold inline-flex items-center gap-1' : 'text-gray-500 hover:text-gray-900 font-semibold'}
            >
              <span>{isAdmin ? 'Kelola Konsultasi' : 'Jadwal Konsultasi'}</span>
              {isAdmin && <span className="material-symbols-outlined text-[14px]">arrow_forward</span>}
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
