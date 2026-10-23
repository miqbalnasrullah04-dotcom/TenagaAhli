import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { usePageLoading } from '../context/LoadingContext.jsx';
import {
  MagnifyingGlassIcon,
  ChatBubbleLeftRightIcon,
  UserPlusIcon,
  CheckCircleIcon,
  AcademicCapIcon,
  MapPinIcon,
  DocumentCheckIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  SparklesIcon,
  BriefcaseIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  DocumentTextIcon,
  PhoneIcon,
  EnvelopeIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon,
} from '@heroicons/react/24/outline';

export default function CaraPenggunaan() {
  const { t } = useTranslation();
  const { reportReady } = usePageLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  // Active tab: 'penggunaan' | 'konsultasi' | 'pembayaran' | 'daftar'
  const tabParam = searchParams.get('tab');
  const validTabs = ['penggunaan', 'konsultasi', 'pembayaran', 'daftar'];
  const [activeTab, setActiveTab] = useState(
    validTabs.includes(tabParam) ? tabParam : 'penggunaan'
  );

  useEffect(() => {
    if (validTabs.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  useEffect(() => {
    reportReady();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reportReady]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setSearchParams({ tab: tabKey });
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9]">
      {/* ── 1. HERO HEADER SECTION ── */}
      <section
        className="relative overflow-hidden pt-28 md:pt-36 pb-20 md:pb-24"
        style={{
          background: 'linear-gradient(135deg, #2D1402 0%, #4D260D 35%, #6B3410 70%, #2D1402 100%)',
        }}
      >
        {/* Subtle Decorative Ambient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[520px] h-[520px] rounded-full bg-amber-400/[0.08] blur-2xl" />
          <div className="absolute -bottom-28 -left-20 w-[420px] h-[420px] rounded-full bg-orange-400/[0.06] blur-2xl" />
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] rounded-full bg-amber-500/[0.03] blur-3xl" />
        </div>

        {/* Wave bottom decoration */}
        <svg
          className="absolute bottom-0 left-0 w-full text-[#FDFBF9]"
          viewBox="0 0 1440 80"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,40 C320,80 640,10 960,50 C1200,80 1360,30 1440,40 L1440,80 L0,80 Z" />
        </svg>

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-400/25 text-amber-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-wider uppercase">
            <SparklesIcon className="w-3.5 h-3.5 text-amber-300" />
            {t('Panduan Lengkap Platform')}
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {t('Cara')} <span className="text-amber-400">{t('Penggunaan')}</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            {t(
              'Panduan terpadu mengenai cara penggunaan platform, alur konsultasi ahli, hingga proses pendaftaran akun di TenagaAhli.com.'
            )}
          </p>

          {/* Quick Tab Switcher inside Hero */}
          <div className="mt-8 inline-flex items-center p-1.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl max-w-full overflow-x-auto">
            <button
              type="button"
              onClick={() => handleTabChange('penggunaan')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === 'penggunaan'
                  ? 'bg-white text-[#8B4513] shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <MagnifyingGlassIcon className="w-4 h-4" />
              <span>{t('Cara Penggunaan')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('konsultasi')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === 'konsultasi'
                  ? 'bg-white text-[#8B4513] shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <ChatBubbleLeftRightIcon className="w-4 h-4" />
              <span>{t('Cara Konsultasi')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('pembayaran')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === 'pembayaran'
                  ? 'bg-white text-[#8B4513] shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <CreditCardIcon className="w-4 h-4" />
              <span>{t('Cara Pembayaran')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleTabChange('daftar')}
              className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all duration-300 whitespace-nowrap ${
                activeTab === 'daftar'
                  ? 'bg-white text-[#8B4513] shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlusIcon className="w-4 h-4" />
              <span>{t('Cara Daftar')}</span>
            </button>
          </div>
        </div>
      </section>

      {/* ── 2. MAIN CONTENT SECTION ── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 py-12">
        {/* ═════════ TAB 1: CARA PENGGUNAAN PLATFORM ═════════ */}
        {activeTab === 'penggunaan' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#8B4513] bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 mb-2">
                Panduan Penggunaan
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {t('Alur Mudah Menggunakan TenagaAhli.com')}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                {t(
                  'Temukan tenaga ahli profesional, surveyor bersertifikat, narasumber, dan dosen peneliti dengan cepat melalui langkah-langkah praktis berikut.'
                )}
              </p>
            </div>

            {/* 4 Steps Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Step 1 */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-12 h-12 rounded-2xl bg-[#8B4513] text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                      01
                    </span>
                    <span className="text-xs font-bold text-[#8B4513] bg-amber-50 px-3 py-1 rounded-full">
                      Pencarian Cerdas
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2.5">
                    {t('Cari Tenaga Ahli & Kriteria')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Gunakan kolom pencarian di Beranda atau halaman Pencarian. Anda dapat memilih berdasarkan kategori keahlian (misal: GIS, Sipil, Lingkungan, dan lainnya), kriteria profesi (Tenaga Ahli, Tenaga Teknis, Surveyor), kriteria ke proyekan atau lokasi kota/provinsi.'
                    )}
                  </p>
                  <div className="mt-5 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs font-semibold text-[#8B4513]">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    <span>Tersedia filter keahlian & peta sebaran lokasi</span>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-12 h-12 rounded-2xl bg-[#8B4513] text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                      02
                    </span>
                    <span className="text-xs font-bold text-[#8B4513] bg-amber-50 px-3 py-1 rounded-full">
                      Verifikasi & Profil
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2.5">
                    {t('Tinjau Profil & Kredensial Ahli')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Buka halaman profil lengkap tenaga ahli untuk mengecek portofolio proyek, riwayat pendidikan, sertifikasi kompetensi (BNSP), publikasi jurnal, serta ulasan dan rating dari klien sebelumnya.'
                    )}
                  </p>
                  <div className="mt-5 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs font-semibold text-[#8B4513]">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    <span>Lencana Terverifikasi menjamin keaslian data ahli</span>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-12 h-12 rounded-2xl bg-[#8B4513] text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                      03
                    </span>
                    <span className="text-xs font-bold text-[#8B4513] bg-amber-50 px-3 py-1 rounded-full">
                      Fitur Peta Ahli
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2.5">
                    {t('Eksplorasi Peta Sebaran Tenaga Ahli')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Manfaatkan fitur Peta Ahli interaktif untuk menemukan surveyor dan pakar terdekat dari lokasi proyek Anda di seluruh pelosok Indonesia guna efisiensi mobilisasi dan survei lapangan.'
                    )}
                  </p>
                  <div className="mt-5 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs font-semibold text-[#8B4513]">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    <span>Pencarian otomatis saat peta digeser</span>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 transition-transform group-hover:scale-110" />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-12 h-12 rounded-2xl bg-[#8B4513] text-white font-extrabold text-lg flex items-center justify-center shadow-md">
                      04
                    </span>
                    <span className="text-xs font-bold text-[#8B4513] bg-amber-50 px-3 py-1 rounded-full">
                      Informasi Proyek & Berita
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2.5">
                    {t('Akses Informasi Proyek & Publikasi')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Pantau perkembangan proyek strategis, studi AMDAL, regulasi lingkungan hidup terkini, serta publikasi riset ilmiah melalui menu Informasi Proyek dan Berita Terkini.'
                    )}
                  </p>
                  <div className="mt-5 pt-4 border-t border-gray-50 flex items-center gap-2 text-xs font-semibold text-[#8B4513]">
                    <CheckCircleIcon className="w-4 h-4 text-emerald-600" />
                    <span>Katalog studi lingkungan terlengkap</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action CTA */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-[#8B4513] to-[#55290A] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xl font-extrabold">
                  {t('Siap Menemukan Tenaga Ahli Sesuai Kebutuhan Anda?')}
                </h3>
                <p className="text-xs sm:text-sm text-white/80">
                  {t('Jelajahi ribuan profil tenaga ahli profesional dari berbagai bidang ilmu.')}
                </p>
              </div>
              <Link
                to="/daftar-profil"
                className="inline-flex items-center gap-2 bg-white text-[#8B4513] hover:bg-amber-50 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md shrink-0"
              >
                <span>{t('Cari Tenaga Ahli')}</span>
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* ═════════ TAB 2: CARA KONSULTASI ═════════ */}
        {activeTab === 'konsultasi' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#8B4513] bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 mb-2">
                Panduan Konsultasi
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {t('Alur Konsultasi dengan Tenaga Ahli')}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                {t(
                  'Lakukan diskusi teknis, kajian proyek lingkungan, atau permintaan narasumber secara langsung, aman, dan profesional.'
                )}
              </p>
            </div>

            {/* Step-by-Step Flow */}
            <div className="space-y-6">
              {/* Step 1 */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#8B4513] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                  1
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    {t('Pilih Tenaga Ahli & Jenis Layanan')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Telusuri daftar pakar berdasarkan bidang keahlian (AMDAL, KLHS, Sipil, GIS, Hidrologi, dll.). Tinjau profil, sertifikat BNSP, serta pilihan layanan yang tersedia: Chat Langsung (15 menit) atau Video Call Zoom (30 menit).'
                    )}
                  </p>
                </div>
                <Link
                  to="/daftar-profil"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B4513] hover:underline shrink-0"
                >
                  <span>{t('Pilih Ahli')}</span>
                  <ArrowRightIcon className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#8B4513] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                  2
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    {t('Tentukan Tanggal & Jam di Kalender')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Pada profil ahli, pilih tanggal yang Anda inginkan dan pilih salah satu sesi jam operasional yang masih tersedia. Klik tombol "Lanjut ke Pembayaran" untuk mengunci jadwal sesi Anda.'
                    )}
                  </p>
                </div>
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full shrink-0">
                  Jadwal Otomatis Real-time
                </span>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border-2 border-amber-300 bg-amber-50/20 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#8B4513] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                  3
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      {t('Lakukan Pembayaran Sesi Konsultasi')}
                    </h3>
                    <span className="text-[10px] font-bold bg-[#8B4513] text-white px-2 py-0.5 rounded-md">
                      Penting
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Selesaikan pembayaran di halaman resmi melalui Transfer Bank Manual atau scan QRIS resmi dengan mengunggah bukti transfer, Virtual Account Bank otomatis (BCA, Mandiri, BNI, BRI), atau saldo poin akun Anda.'
                    )}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTabChange('pembayaran')}
                  className="inline-flex items-center gap-1.5 bg-[#8B4513] hover:bg-[#6f370f] text-white text-xs font-bold px-3.5 py-2 rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
                >
                  <CreditCardIcon className="w-4 h-4" />
                  <span>{t('Detail Cara Bayar')}</span>
                </button>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#8B4513] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                  4
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    {t('Masuk ke Ruang Sesi Konsultasi')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Setelah status pembayaran lunas, Anda akan mendapatkan lembar invoice resmi. Saat waktu konsultasi tiba, masuk ke ruang Chat terenkripsi atau buka tautan Zoom Meeting untuk berdiskusi dengan ahli.'
                    )}
                  </p>
                </div>
                <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-full shrink-0">
                  Chat & Zoom Terintegrasi
                </span>
              </div>

              {/* Step 5 */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-100 shadow-sm flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="w-14 h-14 rounded-2xl bg-[#8B4513] text-white flex items-center justify-center font-black text-xl shrink-0 shadow-md">
                  5
                </div>
                <div className="flex-1 space-y-1">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    {t('Selesai & Berikan Ulasan Kepuasan')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Setelah sesi konsultasi selesai, berikan penilaian bintang dan ulasan profesional untuk tenaga ahli. Ulasan Anda membantu pengguna lain menemukan pakar terbaik.'
                    )}
                  </p>
                </div>
                <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-full shrink-0">
                  Rating & Review Klien
                </span>
              </div>
            </div>

            {/* Consultation Tips Banner */}
            <div className="bg-[#F8F2EB] border border-[#E0D2C3] rounded-3xl p-8 space-y-4">
              <div className="flex items-center gap-2 text-[#8B4513]">
                <ShieldCheckIcon className="w-6 h-6" />
                <h4 className="font-bold text-base">{t('Tips Konsultasi Efektif & Aman')}</h4>
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#8B4513] shrink-0 mt-0.5" />
                  <span>Siapkan Kerangka Acuan Kerja (KAK / TOR) atau poin pertanyaan sebelum jadwal sesi.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#8B4513] shrink-0 mt-0.5" />
                  <span>Pastikan koneksi internet stabil saat berkonsultasi via Video Call Zoom.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#8B4513] shrink-0 mt-0.5" />
                  <span>Lakukan pembayaran lebih awal agar slot jadwal yang Anda pilih tidak terlewat.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircleIcon className="w-4 h-4 text-[#8B4513] shrink-0 mt-0.5" />
                  <span>Manfaatkan ruang obrolan aman platform untuk mengirimkan lampiran draft dokumen teknis.</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* ═════════ TAB 3: CARA PEMBAYARAN KONSULTASI ═════════ */}
        {activeTab === 'pembayaran' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#8B4513] bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 mb-2">
                Panduan Pembayaran Konsultasi
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {t('Cara & Alur Pembayaran Konsultasi')}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                {t(
                  'Pelajari langkah mudah menyelesaikan pembayaran sesi konsultasi dengan tenaga ahli melalui berbagai metode pembayaran resmi yang aman dan terverifikasi otomatis.'
                )}
              </p>
            </div>

            {/* 4 Langkah Pembayaran Sesi Konsultasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Step 1 */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 rounded-xl bg-[#8B4513] text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                      01
                    </span>
                    <span className="material-symbols-outlined text-[#8B4513] text-[24px]">
                      calendar_month
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {t('Pilih Sesi di Profil Ahli')}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t(
                      'Pilih layanan (Chat 15 mnt / Zoom 30 mnt), tentukan tanggal dan jam sesi yang tersedia di kalender profil ahli, lalu klik tombol "Lanjut ke Pembayaran".'
                    )}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 text-[11px] font-semibold text-[#8B4513] flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Jadwal real-time</span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 rounded-xl bg-[#8B4513] text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                      02
                    </span>
                    <span className="material-symbols-outlined text-[#8B4513] text-[24px]">
                      receipt_long
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {t('Masuk Halaman Pembayaran')}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t(
                      'Sistem secara otomatis mengarahkan Anda ke Halaman Pembayaran Terpadu dengan rincian biaya, nama tenaga ahli, dan nomor invoice pemesanan.'
                    )}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 text-[11px] font-semibold text-[#8B4513] flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Rincian transparan</span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 rounded-xl bg-[#8B4513] text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                      03
                    </span>
                    <span className="material-symbols-outlined text-[#8B4513] text-[24px]">
                      payments
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {t('Pilih Metode & Selesaikan')}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t(
                      'Pilih salah satu metode pembayaran: scan QRIS resmi atau transfer manual ke rekening bank dengan mengunggah bukti transfer, Virtual Account bank otomatis, atau potong saldo poin akun Anda.'
                    )}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 text-[11px] font-semibold text-[#8B4513] flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Multi-channel aman</span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="w-10 h-10 rounded-xl bg-[#8B4513] text-white font-extrabold text-sm flex items-center justify-center shadow-sm">
                      04
                    </span>
                    <span className="material-symbols-outlined text-[#8B4513] text-[24px]">
                      verified
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">
                    {t('Invoice Lunas & Sesi Aktif')}
                  </h3>
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {t(
                      'Setelah terverifikasi lunas, invoice resmi diterbitkan, jadwal terkunci di kalender ahli, dan tautan sesi chat atau Zoom langsung aktif.'
                    )}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-gray-50 text-[11px] font-semibold text-[#8B4513] flex items-center gap-1">
                  <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Langsung siap konsultasi</span>
                </div>
              </div>
            </div>

            {/* 4 Pilihan Metode Pembayaran Resmi */}
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {t('4 Metode Pembayaran Resmi yang Tersedia')}
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  {t('Pilih cara pembayaran yang paling nyaman bagi Anda atau perusahaan Anda.')}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Metode 1: QRIS Manual */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[26px]">qr_code_2</span>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                        Scan & Upload Bukti (Manual)
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-900">
                      {t('1. QRIS Resmi (Scan & Unggah Bukti Manual)')}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {t(
                        'Pindai barcode QRIS resmi (a.n. TRIWALA DIGITAL / Gopay Merchant) yang tampil di layar melalui m-Banking (BCA, Mandiri, BRI, BNI) atau dompet digital (GoPay, OVO, ShopeePay, DANA), lalu unggah foto struk atau screenshot bukti pembayarannya.'
                      )}
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1.5 pt-1">
                      <li className="flex items-center gap-1.5 font-medium text-emerald-800">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Mendukung seluruh m-Banking & e-Wallet berstandar QRIS nasional (bebas admin).</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-medium text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Setelah transfer berhasil, unggah bukti pembayaran agar diverifikasi manual oleh admin (5–15 menit).</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Metode 2: Virtual Account */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[26px]">account_balance</span>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                        24 Jam Realtime
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-900">
                      {t('2. Virtual Account Bank (Midtrans)')}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {t(
                        'Dapatkan nomor rekening Virtual Account unik untuk Bank BCA, Mandiri, BNI, BRI, atau Permata. Transfer dapat dilakukan melalui ATM, Mobile Banking, atau Internet Banking.'
                      )}
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1.5 pt-1">
                      <li className="flex items-center gap-1.5 font-medium text-blue-800">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Nomor unik otomatis mencatat pembayaran Anda seketika.</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-medium text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Bebas antre dan aktif 24 jam nonstop.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Metode 3: Transfer Bank Manual */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[#8B4513] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[26px]">receipt_long</span>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                        Verifikasi Admin
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-900">
                      {t('3. Transfer Bank Manual & Upload Bukti')}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {t(
                        'Transfer manual ke rekening bank resmi platform TenagaAhli. Cantumkan nama pemilik rekening pengirim dan lampirkan foto struk atau screenshot mutasi transfer di halaman pembayaran.'
                      )}
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1.5 pt-1">
                      <li className="flex items-center gap-1.5 font-medium text-amber-900">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Diverifikasi langsung oleh tim keuangan dalam 5–15 menit.</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-medium text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Sangat cocok untuk transaksi perusahaan dengan rekening giro.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Metode 4: Saldo Poin TenagaAhli */}
                <div className="bg-white rounded-3xl p-6 sm:p-7 border border-amber-200/80 shadow-xs relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-[#8B4513] flex items-center justify-center">
                        <span className="material-symbols-outlined text-[26px]">monetization_on</span>
                      </div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8B4513] bg-amber-100/70 px-3 py-1 rounded-full border border-amber-300">
                        1-Klik Instan
                      </span>
                    </div>
                    <h4 className="text-base sm:text-lg font-bold text-gray-900">
                      {t('4. Saldo Poin TenagaAhli')}
                    </h4>
                    <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                      {t(
                        'Bagi pengguna yang sudah mengisi saldo poin akun atau memiliki saldo dari transaksi sebelumnya, Anda dapat langsung membayar dalam 1-klik dengan memotong saldo poin.'
                      )}
                    </p>
                    <ul className="text-xs text-gray-600 space-y-1.5 pt-1">
                      <li className="flex items-center gap-1.5 font-medium text-[#8B4513]">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Bebas biaya administrasi gateway tambahan.</span>
                      </li>
                      <li className="flex items-center gap-1.5 font-medium text-gray-600">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Sesi konsultasi langsung terkunci seketika tanpa jeda.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 3 Jaminan Keamanan Transaksi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#E8DEC8] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">shield_with_heart</span>
                </div>
                <h4 className="font-bold text-sm text-gray-900">{t('Rekening Bersama (Escrow)')}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('Dana Anda disimpan secara aman oleh platform dan baru diteruskan ke tenaga ahli setelah sesi konsultasi berhasil diselesaikan.')}
                </p>
              </div>

              <div className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#E8DEC8] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">currency_exchange</span>
                </div>
                <h4 className="font-bold text-sm text-gray-900">{t('Garansi Refund 100%')}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('Jika tenaga ahli berhalangan hadir atau terjadi kendala sistem yang tidak terselesaikan, Anda berhak menjadwalkan ulang atau klaim refund 100%.')}
                </p>
              </div>

              <div className="bg-[#FAF6F0] rounded-2xl p-6 border border-[#E8DEC8] space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[22px]">description</span>
                </div>
                <h4 className="font-bold text-sm text-gray-900">{t('Invoice Resmi Perusahaan')}</h4>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {t('Setiap transaksi pembayaran secara otomatis menerbitkan lembar invoice digital resmi yang dapat dicetak/diunduh untuk pembukuan kantor.')}
                </p>
              </div>
            </div>

            {/* Quick Action & Bantuan CS Banner */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-[#8B4513] to-[#55290A] text-white flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-xl font-extrabold">
                  {t('Mengalami Kendala Saat Melakukan Pembayaran?')}
                </h3>
                <p className="text-xs sm:text-sm text-white/80">
                  {t('Tim Helpdesk kami siap membantu Anda 7 hari seminggu melalui WhatsApp resmi.')}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
                <a
                  href="https://wa.me/628111520900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md"
                >
                  <PhoneIcon className="w-4 h-4" />
                  <span>{t('WhatsApp CS')}</span>
                </a>
                <Link
                  to="/daftar-profil"
                  className="inline-flex items-center gap-2 bg-white text-[#8B4513] hover:bg-amber-50 px-5 py-3 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md"
                >
                  <span>{t('Mulai Konsultasi')}</span>
                  <ArrowRightIcon className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ═════════ TAB 4: CARA DAFTAR ═════════ */}
        {activeTab === 'daftar' && (
          <div className="space-y-12 animate-fadeIn">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#8B4513] bg-amber-50 px-3 py-1 rounded-full border border-amber-200/60 mb-2">
                Panduan Pendaftaran
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
                {t('Cara Mendaftar Akun di TenagaAhli.com')}
              </h2>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                {t(
                  'Bergabunglah sebagai Klien (Pengguna Jasa), Tenaga Ahli, Tenaga Teknis, atau Surveyor Profesional untuk memperluas jangkauan proyek Anda ke seluruh Indonesia.'
                )}
              </p>
            </div>

            {/* Role Options Comparison: 2x2 Grid (Tenaga Ahli, Tenaga Teknis, Surveyor, Klien) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {/* Option 1: Tenaga Ahli */}
              <div className="bg-white rounded-3xl p-8 border-2 border-[#8B4513]/30 shadow-md hover:shadow-xl transition-all relative flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-[#8B4513] text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
                    <BriefcaseIcon className="w-4 h-4" />
                    <span>Tenaga Ahli</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {t('Daftar Sebagai Tenaga Ahli')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Tampilkan profil profesional akademik, keahlian utama (AMDAL, GIS, dll), sertifikat kompetensi, dan tarif konsultasi proyek.'
                    )}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#8B4513]">
                      Langkah Pendaftaran:
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Klik <strong>Daftar</strong> dan pilih role <strong>Tenaga Ahli</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Isi nama lengkap, email, nomor WhatsApp, dan kata sandi.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Lengkapi data keahlian, riwayat pendidikan, dan unggah berkas sertifikat.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Tim kurasi memverifikasi profil untuk aktivasi lencana <strong>Verified</strong>.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                  <Link
                    to="/daftar?role=tenaga_ahli"
                    className="w-full flex items-center justify-center gap-2 bg-[#8B4513] hover:bg-[#6B3410] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md"
                  >
                    <span>{t('Daftar Sebagai Tenaga Ahli')}</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Option 2: Tenaga Teknis */}
              <div className="bg-white rounded-3xl p-8 border-2 border-amber-600/30 shadow-md hover:shadow-xl transition-all relative flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-[#B45309] text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
                    <WrenchScrewdriverIcon className="w-4 h-4 text-amber-200" />
                    <span>Tenaga Teknis</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {t('Daftar Sebagai Tenaga Teknis')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Daftarkan keahlian teknis operasional Anda dalam pendampingan kajian teknis, pemetaan GIS, uji lab lingkungan, survei lapangan, dan inspeksi teknis.'
                    )}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#B45309]">
                      Langkah Pendaftaran:
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Klik <strong>Daftar</strong> dan pilih role <strong>Tenaga Teknis</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Isi nama lengkap, bidang keahlian teknis, email, dan WhatsApp.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Lengkapi data keahlian operasional dan unggah sertifikat teknis/kejuruan.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Tim kurasi memverifikasi profil untuk aktivasi akun dan lencana <strong>Verified</strong>.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                  <Link
                    to="/daftar?role=tenaga_teknis"
                    className="w-full flex items-center justify-center gap-2 bg-[#B45309] hover:bg-[#92400E] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md"
                  >
                    <span>{t('Daftar Sebagai Tenaga Teknis')}</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Option 3: Surveyor */}
              <div className="bg-white rounded-3xl p-8 border-2 border-orange-500/30 shadow-md hover:shadow-xl transition-all relative flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-[#A0522D] text-white text-xs font-bold px-3.5 py-1.5 rounded-full">
                    <MapPinIcon className="w-4 h-4 text-orange-200" />
                    <span>Surveyor</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {t('Daftar Sebagai Surveyor')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Daftarkan diri Anda sebagai Surveyor Profesional untuk proyek pemetaan, topografi, batimetri, drone mapping, dan survei lapangan.'
                    )}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#A0522D]">
                      Langkah Pendaftaran:
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Klik <strong>Daftar</strong> dan pilih role <strong>Surveyor</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Masukkan identitas, wilayah jangkauan survei (kota/provinsi), dan kontak.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Unggah sertifikat kompetensi survei, lisensi drone, dan daftar alat survei.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Profil surveyor muncul di <strong>Peta Ahli</strong> dan direktori pencarian surveyor nasional.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                  <Link
                    to="/daftar?role=surveyor"
                    className="w-full flex items-center justify-center gap-2 bg-[#A0522D] hover:bg-[#803e1f] text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md"
                  >
                    <span>{t('Daftar Sebagai Surveyor')}</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* Option 4: Klien / Pengguna Jasa */}
              <div className="bg-white rounded-3xl p-8 border border-gray-200 shadow-sm hover:shadow-xl transition-all relative flex flex-col justify-between">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-800 text-xs font-bold px-3.5 py-1.5 rounded-full">
                    <BuildingOfficeIcon className="w-4 h-4 text-[#8B4513]" />
                    <span>Pengguna Jasa</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-gray-900">
                    {t('Daftar Sebagai Klien / Instansi')}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {t(
                      'Dapatkan akses penuh untuk menghubungi tenaga ahli dan surveyor, memposting proyek kajian, dan mengunduh invoice resmi.'
                    )}
                  </p>

                  <div className="space-y-2.5 pt-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-800">
                      Langkah Pendaftaran:
                    </div>
                    <ul className="space-y-2.5 text-xs sm:text-sm text-gray-700">
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Klik <strong>Daftar</strong> lalu pilih tipe akun <strong>Klien / Pengguna Jasa</strong>.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Masukkan nama perusahaan/instansi atau nama personal, email, dan WhatsApp.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Verifikasi tautan konfirmasi yang dikirimkan ke kotak masuk email.</span>
                      </li>
                      <li className="flex items-start gap-2.5">
                        <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Akun langsung aktif dan siap digunakan untuk konsultasi proyek.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-gray-100">
                  <Link
                    to="/daftar?role=klien"
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-md"
                  >
                    <span>{t('Daftar Sebagai Klien')}</span>
                    <ArrowRightIcon className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── 3. NEED HELP CONTACT BOX ── */}
        <div className="mt-16 bg-white rounded-3xl p-8 md:p-10 border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-xs font-bold text-[#8B4513] uppercase tracking-wider">
              {t('Butuh Bantuan Tambahan?')}
            </span>
            <h3 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {t('Tim Customer Care Siap Membantu Anda')}
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 max-w-lg">
              {t(
                'Jika Anda mengalami kendala saat menggunakan platform, pendaftaran, atau memerlukan panduan langsung, hubungi kami kapan saja.'
              )}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap justify-center shrink-0">
            <a
              href="https://wa.me/628111520900"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm"
            >
              <PhoneIcon className="w-4 h-4" />
              <span>{t('Chat WhatsApp')}</span>
            </a>

            <Link
              to="/pusat-bantuan"
              className="inline-flex items-center gap-2 bg-[#8B4513] hover:bg-[#6B3410] text-white px-5 py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm"
            >
              <span>{t('Kunjungi Pusat Bantuan')}</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
