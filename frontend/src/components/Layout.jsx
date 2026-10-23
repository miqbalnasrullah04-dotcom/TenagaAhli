import { useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import TikaChatbot from './TikaChatbot.jsx';
import TikaDebugPanel from './TikaDebugPanel.jsx';
import { TikaProvider } from '../context/TikaContext.jsx';

// Halaman yang tidak memakai Layout (Navbar & Footer) sama sekali —
// biasanya karena halaman itu render Navbar-nya sendiri, atau punya
// shell sendiri (mis. DashboardLayout untuk halaman member).
const FULL_PAGE_ROUTES = [
  '/tenaga-ahli',
  '/tenaga-teknis',
  '/surveyor',
  '/narasumber',
  '/dosen-peneliti',
  '/instruktur-pengajar',
  '/peneliti-artikel-jurnal',
  '/sign-in',
  '/signin',
  '/login',
  '/daftar',
  '/lupa-password',
  '/verifikasi-email',
  '/menunggu-verifikasi',
  // Halaman member/dashboard — pakai DashboardLayout (sidebar) sendiri,
  // jadi tidak boleh dobel dengan Navbar & Footer publik.
  '/dashboard',
  '/dashboard-surveyor',
  '/akun',
  '/kelola-berita',
  '/tulis-berita',
  '/profil-saya',
  '/paket',
  '/pembayaran',
  '/profil-publik',
  '/pengaturan',
  '/lengkapi-profil',
  '/pilih-paket',
  '/riwayat-pembayaran',
  '/top-up',
  '/riwayat-point',
  '/kelola-iklan',
  '/pesan',
  '/tiket',
  '/ulasan',
  '/invoice',
];

// Halaman yang tetap pakai Navbar dari Layout, tapi tidak butuh Footer
// (misalnya halaman search dengan panel map yang harus penuh satu layar).
const NO_FOOTER_ROUTES = [
  '/search',
  '/peta-ahli',
  '/surveyor',
];

export default function Layout({ children }) {
  const location = useLocation();
  const isFullPage = FULL_PAGE_ROUTES.includes(location.pathname) || 
                     location.pathname.startsWith('/invoice/');

  const hideFooter = NO_FOOTER_ROUTES.includes(location.pathname) ||
                     location.pathname.startsWith('/profil');

  if (isFullPage) {
    return <>{children}</>;
  }

  return (
    <TikaProvider>
      <div className="min-h-screen flex flex-col bg-background text-on-background font-body-md">
        <Navbar />
        <main className={`flex-1 ${!hideFooter ? 'pb-20 md:pb-0' : ''}`}>
          {children}
        </main>
        {!hideFooter && <Footer />}
        <TikaChatbot />
        <TikaDebugPanel />
      </div>
    </TikaProvider>
  );
}
