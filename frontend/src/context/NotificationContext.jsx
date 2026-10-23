import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '../api/client.js';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [counts, setCounts] = useState({
    chat: 0,
    product_sales: 0,
    consultations: 0,
    orders: 0,
    admin: 0,
  });
  const [loading, setLoading] = useState(false);
  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const fetchNotifications = useCallback(async (force = false) => {
    const token = localStorage.getItem('amdal_token') || localStorage.getItem('token');
    if (!token) {
      setNotifications([]);
      setUnreadTotal(0);
      setCounts({ chat: 0, product_sales: 0, consultations: 0, orders: 0, admin: 0 });
      return;
    }

    const now = Date.now();
    // Throttle: jangan request lagi jika baru diambil dalam 10 detik terakhir kecuali force
    if (!force && now - lastFetchTimeRef.current < 10000) {
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      const res = await api.get('/my/notifications');
      if (res.data && res.data.success) {
        setNotifications(res.data.notifications || []);
        setUnreadTotal(res.data.unread_total || 0);
        setCounts(res.data.counts || { chat: 0, product_sales: 0, consultations: 0, orders: 0, admin: 0 });
      }
    } catch {
      // Silently catch if unauthenticated or temporary offline
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  const markAllAsRead = async () => {
    try {
      await api.post('/my/notifications/mark-all-read');
      setUnreadTotal(0);
      setCounts((prev) => ({ ...prev, chat: 0, consultations: 0, admin: 0 }));
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  };

  const markChatRead = async (consultationId) => {
    try {
      await api.post('/my/notifications/mark-chat-read', { consultation_id: consultationId });
      fetchNotifications(true);
    } catch (err) {
      console.error('Failed to mark chat as read', err);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Polling setiap 30 detik saat tab aktif
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchNotifications(false);
      }
    }, 30000);

    let visTimeout = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (visTimeout) clearTimeout(visTimeout);
        visTimeout = setTimeout(() => {
          fetchNotifications(false);
        }, 1200);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      if (visTimeout) clearTimeout(visTimeout);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadTotal,
        counts,
        loading,
        fetchNotifications,
        markAllAsRead,
        markChatRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    return {
      notifications: [],
      unreadTotal: 0,
      counts: { chat: 0, product_sales: 0, consultations: 0, orders: 0, admin: 0 },
      loading: false,
      fetchNotifications: () => {},
      markAllAsRead: () => {},
      markChatRead: () => {},
    };
  }
  return ctx;
}
