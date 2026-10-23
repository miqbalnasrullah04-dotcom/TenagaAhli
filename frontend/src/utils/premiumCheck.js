/**
 * Cek status premium user.
 * Baca dari localStorage, lalu refresh dari API /user agar tidak stale.
 * Update localStorage jika ada perubahan dari server.
 *
 * Returns: { isPremium: boolean, loading: boolean }
 */
import { useState, useEffect } from 'react';
import api from '../api/client.js';

export function usePremiumCheck() {
  const checkUserIsPremium = (u) => {
    if (!u) return false;
    if (u.role === 'admin' || u.is_premium === true || (u.is_verified === true && u.package_id > 1)) return true;
    const pkg = u.package;
    const pkgName = typeof pkg === 'string' ? pkg.toLowerCase() : (pkg?.name || pkg?.slug || '').toLowerCase();
    const memLevel = (u.membership_level || '').toLowerCase();
    const isPaidTier = pkgName.includes('premium') || pkgName.includes('platinum') || pkgName.includes('ekonomis') || pkgName.includes('eksklusif') || pkgName.includes('ekslusif') || pkgName.includes('esklusif') || memLevel.includes('premium') || memLevel.includes('platinum') || memLevel.includes('ekonomis') || memLevel.includes('eksklusif') || memLevel.includes('ekslusif') || (typeof pkg === 'object' && pkg?.price > 0) || (u.package_id && Number(u.package_id) > 1);
    if (!isPaidTier) return false;
    const expiry = u.premium_expires_at || u.package_expires_at;
    if (!expiry) return true;
    return new Date(expiry) > new Date();
  };

  // Nilai awal dari localStorage agar gate tidak blank saat pertama render
  const getLocalPremium = () => {
    try {
      const u = JSON.parse(localStorage.getItem('amdal_user') || '{}');
      return checkUserIsPremium(u);
    } catch {
      return false;
    }
  };

  const [isPremium, setIsPremium] = useState(getLocalPremium);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    // Refresh dari server untuk menghindari data stale di localStorage
    api.get('/user')
      .then((res) => {
        const serverUser = res.data;
        if (!serverUser) return;

        // Update localStorage dengan data terbaru dari server
        try {
          const stored = JSON.parse(localStorage.getItem('amdal_user') || '{}');
          const updated = { ...stored, ...serverUser };
          localStorage.setItem('amdal_user', JSON.stringify(updated));
        } catch { /* ignore */ }

        // Tentukan status premium dari data server
        setIsPremium(checkUserIsPremium(serverUser));
      })
      .catch(() => {
        // Jika API gagal, fallback ke nilai localStorage yang sudah ada
      })
      .finally(() => setLoading(false));
  }, []);

  return { isPremium, loading };
}
