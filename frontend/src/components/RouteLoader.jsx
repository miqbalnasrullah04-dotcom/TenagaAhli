import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import PageLoader from './PageLoader';
import { usePageLoading } from '../context/LoadingContext.jsx';

// 1 siklus animasi topi wisuda selesai utuh (1.8 detik)
const ANIMATION_DURATION = 1800;
// Batas maksimal mutlak: jaminan anti-ngestuck jika jaringan lambat / halaman lambat
const MAX_LOADER_TIMEOUT = 2800;

// Daftar route auth yang tidak boleh memicu RouteLoader (harus langsung tampil)
const AUTH_ROUTES = [
  '/sign-in',
  '/signin',
  '/login',
  '/daftar',
  '/lupa-password',
  '/verifikasi-email',
  '/menunggu-verifikasi',
];

// Daftar route dashboard & akun yang tidak boleh memicu RouteLoader
const DASHBOARD_USER_ROUTES = [
  '/dashboard',
  '/dashboard-surveyor',
  '/akun',
  '/profil-saya',
  '/membership',
  '/paket',
  '/pembayaran',
  '/profil-publik',
  '/pengaturan',
  '/lengkapi-profil',
  '/pilih-paket',
  '/riwayat-pembayaran',
  '/pesan',
  '/tiket',
  '/ulasan',
  '/statistik',
  '/invoice',
  '/top-up',
  '/riwayat-point',
  '/kelola-iklan',
  '/kelola-berita',
  '/tulis-berita',
  '/konsultasi',
  '/jadwal',
  '/chat',
  '/pendapatan',
  '/produk',
  '/penjualan',
  '/penjualan-produk',
  '/pesanan-saya',
];

const ADMIN_ROUTES_PREFIX = ['/admin'];

export const shouldSkipLoader = (pathname) => {
  if (!pathname) return false;
  if (AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) return true;
  if (ADMIN_ROUTES_PREFIX.some((prefix) => pathname.startsWith(prefix))) return true;
  if (pathname.startsWith('/invoice/')) return true;
  if (pathname.startsWith('/chat/')) return true;
  if (pathname.startsWith('/checkout/')) return true;
  if (DASHBOARD_USER_ROUTES.some((route) => pathname === route || pathname.startsWith(route + '/'))) return true;
  return false;
};

export default function RouteLoader({ children }) {
  const location = useLocation();
  const { dataReady, resetReady } = usePageLoading();
  const skip = shouldSkipLoader(location.pathname);
  const [visible, setVisible] = useState(!skip);
  const startedAtRef = useRef(Date.now());
  const timerRef = useRef(null);
  const safetyTimerRef = useRef(null);

  // Setiap kali rute berubah:
  useEffect(() => {
    if (shouldSkipLoader(location.pathname)) {
      setVisible(false);
      if (timerRef.current) clearTimeout(timerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
      return;
    }

    setVisible(true);
    resetReady();
    startedAtRef.current = Date.now();

    if (timerRef.current) clearTimeout(timerRef.current);
    if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);

    // Default: tunggu animasi topi wisuda selesai 1 siklus penuh (1.8s) baru transisi ke halaman
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, ANIMATION_DURATION);

    // Hard safety timer: jaminan mutlak loader tertutup jika halaman lambat (anti-ngestuck)
    safetyTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, MAX_LOADER_TIMEOUT);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (safetyTimerRef.current) clearTimeout(safetyTimerRef.current);
    };
  }, [location.pathname]);

  // Jika halaman menggunakan dataReady (lapor selesai fetch):
  // Tetap tunggu sampai siklus animasi selesai utuh (ANIMATION_DURATION) baru buka halaman
  useEffect(() => {
    if (shouldSkipLoader(location.pathname)) return;
    if (!dataReady) return;

    const elapsed = Date.now() - startedAtRef.current;
    const remaining = Math.max(ANIMATION_DURATION - elapsed, 0);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, remaining);

    return () => {
      // Biarkan timer berjalan saat cleanup
    };
  }, [dataReady, location.pathname]);

  if (skip) {
    return children;
  }

  return (
    <>
      <PageLoader visible={visible} routeKey={location.pathname} />
      {children}
    </>
  );
}
