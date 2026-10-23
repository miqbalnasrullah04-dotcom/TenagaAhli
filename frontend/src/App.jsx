import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RouteLoader from './components/RouteLoader.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Public pages
import Home from './pages/Home.jsx';
import TentangKami from './pages/TentangKami.jsx';
import Member from './pages/Member.jsx';
import PeraturanAMDAL from './pages/PeraturanAMDAL';
import Pamflet from './pages/Pamflet.jsx';
import SignIn from './pages/SignIn.jsx';
import LupaPassword from './pages/LupaPassword.jsx';
import Daftar from './pages/Daftar.jsx';
import VerifikasiEmail from './pages/VerifikasiEmail.jsx';
import MenungguVerifikasi from './pages/MenungguVerifikasi.jsx';
import LengkapiProfil from './pages/LengkapiProfil.jsx';
import NotFound from './pages/NotFound.jsx';
import Search from './pages/Search.jsx';
import PetaAhli from './pages/PetaAhli.jsx';
import Narasumber from './pages/Narasumber';
import TenagaAhli from './pages/TenagaAhli';
import TenagaTeknis from './pages/TenagaTeknis';
import Surveyor from './pages/Surveyor';
import DaftarProfil from './pages/DaftarProfil';
import DosenPeneliti from './pages/DosenPeneliti';
import PenelitiArtikelJurnal from './pages/PenelitiArtikelJurnal';
import Berita from './pages/Berita';
import BeritaDetail from './pages/BeritaDetail';
import InformasiProyek from './pages/InformasiProyek';
import PusatBantuan from './pages/PusatBantuan';
import CaraPenggunaan from './pages/CaraPenggunaan';
import TingkatanMedali from './pages/TingkatanMedali';
import PemberitahuanPrivasi from './pages/PemberitahuanPrivasi';
import ProfilAhli from './pages/ProfilAhli';
import ProdukDetail from './pages/ProdukDetail';
import CheckoutProduk from './pages/CheckoutProduk';

// Dashboard user (protected)
import Dashboard from './pages/Dashboard.jsx';
import DashboardSurveyor from './pages/DashboardSurveyor.jsx';
import ProfilSaya from './pages/ProfilSaya.jsx';
import ProfilKlien from './pages/ProfilKlien.jsx';
import Membership from './pages/Membership.jsx';
import PilihPaket from './pages/PilihPaket.jsx';
import Pembayaran from './pages/Pembayaran.jsx';
import Invoice from './pages/Invoice.jsx';
import DaftarInvoice from './pages/DaftarInvoice.jsx';
import Pesan from './pages/Pesan.jsx';
import Tiket from './pages/Tiket.jsx';
import Ulasan from './pages/Ulasan.jsx';
import ProfilPublik from './pages/ProfilPublik.jsx';
import Pengaturan from './pages/Pengaturan.jsx';
import TopUp from './pages/TopUp.jsx';
import RiwayatPoint from './pages/RiwayatPoint.jsx';

// Consultation pages
import KelolaKonsultasi from './pages/KelolaKonsultasi.jsx';
import JadwalTarif from './pages/JadwalTarif.jsx';
import ChatKonsultasi from './pages/ChatKonsultasi.jsx';
import JadwalKonsultasi from './pages/JadwalKonsultasi.jsx';
import Pendapatan from './pages/Pendapatan.jsx';

// Product pages
import KelolaProduk from './pages/KelolaProduk.jsx';
import LaporanPenjualan from './pages/LaporanPenjualan.jsx';
import PesananSaya from './pages/PesananSaya.jsx';

// Advertisement & News pages
import KelolaIklan from './pages/KelolaIklan.jsx';
import KelolaBerita from './pages/KelolaBerita.jsx';
import MyProductSales from './pages/MyProductSales.jsx';

// Admin
import AdminLayout from './layouts/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminExperts from './pages/admin/AdminExperts.jsx';
import AdminTenagaTeknis from './pages/admin/AdminTenagaTeknis.jsx';
import AdminSurveyors from './pages/admin/AdminSurveyors.jsx';
import AdminPayments from './pages/admin/AdminPayments.jsx';
import AdminTickets from './pages/admin/AdminTickets.jsx';
import AdminUserVerification from './pages/admin/AdminUserVerification.jsx';
import AdminPackages from './pages/admin/AdminPackages.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminExpertForm from './pages/admin/AdminExpertForm.jsx';
import AdminPackageForm from './pages/admin/AdminPackageForm.jsx';
import AdminInvoices from './pages/admin/AdminInvoices.jsx';
import AdminPublicProfile from './pages/admin/AdminPublicProfile.jsx';
import AdminUsers from './pages/admin/AdminUsers.jsx';
import AdminBerita from './pages/admin/AdminBerita.jsx';
import AdminBeritaForm from './pages/admin/AdminBeritaForm.jsx';
import AdminTopUp from './pages/admin/AdminTopUp.jsx';
import AdminProductPayments from './pages/admin/AdminProductPayments.jsx';
import AdminWithdrawals from './pages/admin/AdminWithdrawals.jsx';
import AdminConsultations from './pages/admin/AdminConsultations.jsx';
import { usePresence } from './hooks/usePresence.js';

export default function App() {
  usePresence();

  return (
    <RouteLoader>
      <Routes>
      {/* ── ADMIN ── */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="verifikasi" element={<AdminUserVerification />} />
        <Route path="konsultasi" element={<AdminConsultations />} />
        <Route path="pembayaran" element={<AdminPayments />} />
        <Route path="pembayaran-produk" element={<AdminProductPayments />} />
        <Route path="penarikan" element={<AdminWithdrawals />} />
        <Route path="membership" element={<Navigate to="/admin/paket" replace />} />
        <Route path="tiket" element={<AdminTickets />} />
        <Route path="paket" element={<AdminPackages />} />
        <Route path="paket/harga" element={<AdminPackages />} />
        <Route path="paket/tambah" element={<AdminPackageForm />} />
        <Route path="paket/:id/edit" element={<AdminPackageForm />} />
        <Route path="berita" element={<AdminBerita />} />
        <Route path="berita/tambah" element={<AdminBeritaForm />} />
        <Route path="berita/:id/edit" element={<AdminBeritaForm />} />
        <Route path="artikel" element={<AdminBerita />} />
        <Route path="artikel/tambah" element={<AdminBeritaForm />} />
        <Route path="artikel/:id/edit" element={<AdminBeritaForm />} />
        <Route path="pamflet" element={<AdminBerita />} />
        <Route path="pamflet/tambah" element={<AdminBeritaForm />} />
        <Route path="pamflet/:id/edit" element={<AdminBeritaForm />} />
        <Route path="tenaga-ahli" element={<AdminExperts />} />
        <Route path="tenaga-ahli/tambah" element={<AdminExpertForm />} />
        <Route path="tenaga-ahli/:id/edit" element={<AdminExpertForm />} />
        <Route path="tenaga-teknis" element={<AdminTenagaTeknis />} />
        <Route path="tenaga-teknis/tambah" element={<AdminExpertForm defaultRole="tenaga_teknis" />} />
        <Route path="tenaga-teknis/:id/edit" element={<AdminExpertForm defaultRole="tenaga_teknis" />} />
        <Route path="surveyor" element={<AdminSurveyors />} />
        <Route path="invoice" element={<AdminInvoices />} />
        <Route path="profil-publik" element={<AdminPublicProfile />} />
        <Route path="pengguna" element={<AdminUsers />} />
        <Route path="laporan" element={<AdminReports />} />
        <Route path="pengaturan" element={<AdminSettings />} />
        <Route path="top-up" element={<AdminTopUp />} />
      </Route>

      {/* ── AUTH PAGES (No Navbar/Footer) ── */}
      <Route path="/login" element={<Navigate to="/sign-in" replace />} />
      <Route path="/signin" element={<Navigate to="/sign-in" replace />} />
      <Route path="/sign-in" element={<SignIn />} />
      <Route path="/lupa-password" element={<LupaPassword />} />
      <Route path="/daftar" element={<Daftar />} />
      <Route path="/verifikasi-email" element={<VerifikasiEmail />} />
      <Route path="/menunggu-verifikasi" element={<MenungguVerifikasi />} />
      <Route path="/lengkapi-profil" element={<ProtectedRoute requiredRole="expert_any"><LengkapiProfil /></ProtectedRoute>} />

      {/* ── USER MEMBERSHIP & DASHBOARD (No Navbar/Footer, No RouteLoader) ── */}
      {/* Klien — halaman akun sederhana, tanpa dashboard */}
      <Route path="/akun" element={<ProtectedRoute requiredRole="klien"><ProfilKlien /></ProtectedRoute>} />

      {/* Tenaga Ahli & Surveyor — punya dashboard penuh */}
      <Route path="/membership" element={<Navigate to="/paket" replace />} />
      <Route path="/dashboard" element={<ProtectedRoute requiredRole="tenaga_ahli"><Dashboard /></ProtectedRoute>} />
      <Route path="/dashboard-surveyor" element={<ProtectedRoute requiredRole="surveyor"><DashboardSurveyor /></ProtectedRoute>} />
      <Route path="/profil-saya" element={<ProtectedRoute requiredRole="expert_any"><ProfilSaya /></ProtectedRoute>} />
      <Route path="/paket" element={<ProtectedRoute requiredRole="expert_any"><PilihPaket /></ProtectedRoute>} />
      <Route path="/pembayaran" element={<ProtectedRoute requiredRole="expert_any"><Pembayaran /></ProtectedRoute>} />
      <Route path="/invoice" element={<ProtectedRoute requiredRole="user"><DaftarInvoice /></ProtectedRoute>} />
      <Route path="/invoice/:id" element={<ProtectedRoute requiredRole="user"><Invoice /></ProtectedRoute>} />
      <Route path="/pesan" element={<ProtectedRoute requiredRole="expert_any"><Pesan /></ProtectedRoute>} />
      <Route path="/tiket" element={<ProtectedRoute requiredRole="user"><Tiket /></ProtectedRoute>} />
      <Route path="/ulasan" element={<ProtectedRoute requiredRole="expert_any"><Ulasan /></ProtectedRoute>} />
      <Route path="/profil-publik" element={<ProtectedRoute requiredRole="expert_any"><ProfilPublik /></ProtectedRoute>} />
      <Route path="/pengaturan" element={<ProtectedRoute requiredRole="user"><Pengaturan /></ProtectedRoute>} />

      {/* ── TOP UP POINT ── */}
      <Route path="/top-up" element={<ProtectedRoute requiredRole="user"><TopUp /></ProtectedRoute>} />
      <Route path="/riwayat-point" element={<ProtectedRoute requiredRole="user"><RiwayatPoint /></ProtectedRoute>} />

      {/* ── KELOLA IKLAN & BERITA (Klien & Pengguna) ── */}
      <Route path="/kelola-iklan" element={<ProtectedRoute requiredRole="user"><KelolaIklan /></ProtectedRoute>} />
      <Route path="/kelola-berita" element={<ProtectedRoute requiredRole="user"><KelolaBerita /></ProtectedRoute>} />
      <Route path="/tulis-berita" element={<ProtectedRoute requiredRole="user"><KelolaBerita /></ProtectedRoute>} />
      
      {/* ── CONSULTATION & MARKETPLACE (Tenaga Ahli & Surveyor) ── */}
      <Route path="/konsultasi" element={<ProtectedRoute requiredRole="expert_any"><KelolaKonsultasi /></ProtectedRoute>} />
      <Route path="/jadwal" element={<ProtectedRoute requiredRole="expert_any"><JadwalTarif /></ProtectedRoute>} />
      <Route path="/jadwal-konsultasi" element={<ProtectedRoute requiredRole="user"><JadwalKonsultasi /></ProtectedRoute>} />
      <Route path="/link-zoom" element={<ProtectedRoute requiredRole="user"><JadwalKonsultasi /></ProtectedRoute>} />
      <Route path="/konsultasi-saya" element={<ProtectedRoute requiredRole="user"><JadwalKonsultasi /></ProtectedRoute>} />
      <Route path="/chat" element={<ProtectedRoute requiredRole="user"><ChatKonsultasi /></ProtectedRoute>} />
      <Route path="/chat/:id" element={<ProtectedRoute requiredRole="user"><ChatKonsultasi /></ProtectedRoute>} />
      <Route path="/chat-konsultasi" element={<ProtectedRoute requiredRole="user"><ChatKonsultasi /></ProtectedRoute>} />
      <Route path="/pendapatan" element={<ProtectedRoute requiredRole="expert_any"><Pendapatan /></ProtectedRoute>} />
      <Route path="/produk" element={<ProtectedRoute requiredRole="expert_any"><KelolaProduk /></ProtectedRoute>} />
      <Route path="/penjualan" element={<ProtectedRoute requiredRole="expert_any"><LaporanPenjualan /></ProtectedRoute>} />
      <Route path="/penjualan-produk" element={<ProtectedRoute requiredRole="expert_any"><MyProductSales /></ProtectedRoute>} />
      <Route path="/pesanan-saya" element={<ProtectedRoute requiredRole="user"><PesananSaya /></ProtectedRoute>} />

      {/* ── EXPERT PROFILE & PRODUCT DETAIL (Has Navbar/Footer, No RouteLoader) ── */}
      <Route path="/profil/:slug" element={<Layout><ProfilAhli /></Layout>} />
      <Route path="/produk/:id" element={<Layout><ProdukDetail /></Layout>} />
      <Route path="/checkout/:id" element={<ProtectedRoute requiredRole="user"><CheckoutProduk /></ProtectedRoute>} />

      {/* ── PUBLIC + USER ── */}
      <Route
        path="/*"
        element={
          <Layout>
            <Routes>
              {/* Public */}
              <Route path="/" element={<Home />} />
              <Route path="/tentang-kami" element={<TentangKami />} />
              <Route path="/member" element={<Member />} />
              <Route path="/peraturan-amdal" element={<PeraturanAMDAL />} />
              <Route path="/pamflet" element={<Pamflet />} />
              <Route path="/search" element={<Search />} />
              <Route path="/peta-ahli" element={<PetaAhli />} />
              <Route path="/narasumber" element={<Narasumber />} />
              <Route path="/tenaga-ahli" element={<TenagaAhli />} />
              <Route path="/daftar-profil" element={<DaftarProfil />} />
              <Route path="/daftar-teknis" element={<DaftarProfil />} />
              <Route path="/daftar-tenaga-teknis" element={<DaftarProfil />} />
              <Route path="/daftar-surveyor" element={<DaftarProfil />} />
              <Route path="/tenaga-teknis" element={<TenagaTeknis />} />
              <Route path="/surveyor" element={<Surveyor />} />
              <Route path="/dosen-peneliti" element={<DosenPeneliti />} />
              <Route path="/instruktur-pengajar" element={<DosenPeneliti />} />
              <Route path="/peneliti-artikel-jurnal" element={<PenelitiArtikelJurnal />} />
              <Route path="/berita" element={<Berita />} />
              <Route path="/berita/:slug" element={<BeritaDetail />} />
              <Route path="/informasi-proyek" element={<InformasiProyek />} />
              <Route path="/informasi-proyek/:slug" element={<BeritaDetail />} />
              <Route path="/pusat-bantuan" element={<PusatBantuan />} />
              <Route path="/cara-penggunaan" element={<CaraPenggunaan />} />
              <Route path="/tingkatan-medali" element={<TingkatanMedali />} />
              <Route path="/pemberitahuan-privasi" element={<PemberitahuanPrivasi />} />
              <Route path="/kebijakan-privasi" element={<PemberitahuanPrivasi />} />
              <Route path="/pemberitahuan privasi" element={<PemberitahuanPrivasi />} />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        }
      />
    </Routes>
  </RouteLoader>
  );
}
