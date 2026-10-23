import { useEffect, useRef } from 'react';
import api from '../api/client';

/**
 * usePresence hook
 * Tracks user online / offline status in real time.
 * - When logged in and active on the website: sends periodic heartbeat pings (every 45s).
 * - When opening/switching back to the tab: sends an immediate ping.
 * - When closing the tab / navigating away: fires navigator.sendBeacon or keepalive fetch to mark as offline.
 */
export function usePresence() {
  const pingIntervalRef = useRef(null);
  const lastPingRef = useRef(0);
  const isPingingRef = useRef(false);

  useEffect(() => {
    const getAuthData = () => {
      const token = localStorage.getItem('amdal_token');
      const userStr = localStorage.getItem('amdal_user');
      let user = null;
      try {
        if (userStr) user = JSON.parse(userStr);
      } catch (e) {
        user = null;
      }
      return { token, user };
    };

    const sendPing = async (force = false) => {
      const { token, user } = getAuthData();
      if (!token && !user) return;

      const now = Date.now();
      // Throttle: jangan kirim ping jika baru saja dikirim dalam 30 detik terakhir
      if (!force && now - lastPingRef.current < 30000) {
        return;
      }
      if (isPingingRef.current) return;

      isPingingRef.current = true;
      lastPingRef.current = now;

      try {
        await api.post('/presence/ping', {
          email: user?.email,
          user_id: user?.id,
        });
      } catch (err) {
        // Silently catch network errors during heartbeat
      } finally {
        isPingingRef.current = false;
      }
    };

    const sendOffline = () => {
      const { token, user } = getAuthData();
      if (!token && !user) return;

      const payload = JSON.stringify({
        email: user?.email,
        user_id: user?.id,
      });

      const baseURL = import.meta.env.VITE_API_URL || 'https://tenagaahli.com/api';
      const offlineUrl = `${baseURL.replace(/\/$/, '')}/presence/offline`;

      if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
        try {
          const blob = new Blob([payload], { type: 'application/json' });
          navigator.sendBeacon(offlineUrl, blob);
          return;
        } catch (e) {
          // Fallback to fetch
        }
      }

      try {
        fetch(offlineUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: payload,
          keepalive: true,
        }).catch(() => {});
      } catch (e) {}
    };

    // 1. Initial Ping (dengan throttle check)
    sendPing(false);

    // 2. Periodic Interval (setiap 60 detik)
    pingIntervalRef.current = setInterval(() => {
      if (document.visibilityState === 'visible') {
        sendPing(false);
      }
    }, 60000);

    // 3. Tab Visibility Change (debounced 1.5 detik & throttled)
    let visTimeout = null;
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        if (visTimeout) clearTimeout(visTimeout);
        visTimeout = setTimeout(() => {
          sendPing(false);
        }, 1500);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // 4. Page Unload / Hide (offline beacon)
    window.addEventListener('pagehide', sendOffline);
    window.addEventListener('beforeunload', sendOffline);

    return () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }
      if (visTimeout) {
        clearTimeout(visTimeout);
      }
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', sendOffline);
      window.removeEventListener('beforeunload', sendOffline);
    };
  }, []);
}

export default usePresence;
