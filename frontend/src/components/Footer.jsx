import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import logoImg from '../assets/new logo.png';
import {
  ChatBubbleLeftRightIcon,
  MapPinIcon,
  DocumentCheckIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
  EnvelopeIcon,
  ArrowUpIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

/* ── Social icons ── */
function IconFacebook() {
  return (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
      <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.8z" />
    </svg>
  );
}
function IconInstagram() {
  return (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}
function IconX() {
  return (
    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/* ── WhatsApp icon ── */
function IconWhatsapp({ className = 'w-4 h-4' }) {
  return (
    <svg className={`${className} fill-current`} viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.001 2C6.478 2 2 6.477 2 12c0 1.928.554 3.72 1.512 5.24L2 22l4.891-1.483A9.94 9.94 0 0012.001 22C17.523 22 22 17.523 22 12S17.523 2 12.001 2zm0 18.06a8.02 8.02 0 01-4.086-1.117l-.293-.174-3.05.923.94-2.98-.19-.306A8.006 8.006 0 1120 12c0 4.42-3.58 8.06-7.999 8.06z" />
    </svg>
  );
}

const SOCIALS = [
  { label: 'Facebook', href: 'https://facebook.com', icon: <IconFacebook /> },
  { label: 'Instagram', href: 'https://instagram.com', icon: <IconInstagram /> },
  { label: 'X', href: 'https://x.com', icon: <IconX /> },
];

/* ── Service Pill Buttons (Halodoc-style) ── */
const SERVICE_PILLS = [
  {
    to: '/daftar-profil',
    label: 'Konsultasi Ahli',
    Icon: ChatBubbleLeftRightIcon,
    badgeBg: 'bg-amber-100 text-[#8B4513]',
  },
  {
    to: '/surveyor',
    label: 'Cari Surveyor',
    Icon: MapPinIcon,
    badgeBg: 'bg-orange-100 text-[#A0522D]',
  },
  {
    to: '/search',
    label: 'Kajian AMDAL',
    Icon: DocumentCheckIcon,
    badgeBg: 'bg-emerald-100 text-emerald-800',
  },
  {
    to: '/dosen-peneliti',
    label: 'Dosen/Peneliti',
    Icon: AcademicCapIcon,
    badgeBg: 'bg-blue-100 text-blue-800',
  },
  {
    to: '/peneliti-artikel-jurnal',
    label: 'Riset & Jurnal',
    Icon: BuildingOffice2Icon,
    badgeBg: 'bg-purple-100 text-purple-800',
  },
];

export default function Footer() {
  const { t } = useTranslation();
  const [showScroll, setShowScroll] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowScroll(window.scrollY > 400);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <>
      <footer className="hidden md:block relative text-gray-700 mt-16">
        {/* ── HALODOC STYLE MULTI-LAYER ORGANIC WAVE / CLOUD TOP ── */}
        <div className="relative w-full overflow-hidden leading-none pointer-events-none -mb-[1px]">
          <svg
            className="w-full h-20 sm:h-28 md:h-36 block text-[#F4ECE3]"
            viewBox="0 0 1440 140"
            fill="none"
            preserveAspectRatio="none"
          >
            {/* Background Soft Shadow/Layer Wave */}
            <path
              d="M0,50 C240,15 480,5 720,38 C960,70 1200,90 1440,45 L1440,140 L0,140 Z"
              fill="#EADCCF"
              fillOpacity="0.45"
            />
            {/* Main Foreground Wave (Halodoc Cloud/Wave Curve) */}
            <path
              d="M0,72 C180,25 360,18 540,42 C720,66 900,105 1080,95 C1240,86 1360,52 1440,48 L1440,140 L0,140 Z"
              fill="#F4ECE3"
            />
          </svg>
        </div>

        {/* ── FOOTER BODY CONTAINER (WARM HALODOC CONTRAST BG) ── */}
        <div className="bg-[#F4ECE3] pt-4 md:pt-6 pb-12">
          <div className="max-w-7xl mx-auto px-6 md:px-10">
            {/* ── DESKTOP FULL COLUMNS (hidden on mobile) ── */}
            <div className="hidden md:grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 pb-12 border-b border-[#E0D2C3]">
              {/* ── LEFT COLUMN: BRAND + SERVICE PILLS + BANNER + CONTACT (col-span-6) ── */}
              <div className="lg:col-span-6 space-y-6">
                {/* Logo */}
                <Link to="/" className="inline-block">
                  <img
                    src={logoImg}
                    alt="Tenaga Ahli"
                    className="h-14 md:h-16 w-auto object-contain"
                  />
                </Link>

                {/* Description */}
                <p className="text-xs md:text-sm text-gray-600 leading-relaxed max-w-md text-justify">
                  {t('TenagaAhli.com adalah platform untuk pencarian tenaga ahli profesional akademik dari berbagai bidang ilmu. Pengguna dapat dengan mudah mencari tenaga ahli berdasarkan bidang, kompetensi, pengalaman, kebutuhan, dan lokasi.')}
                </p>

                {/* Promo / Banner Card (Halodoc Style adapted to Tenaga Ahli) */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#EAE0D3] via-[#F1E8DC] to-[#E5D7C7] border border-[#D5C4B2] p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-[#8B4513]">
                        {t('Solusi kebutuhan ahli profesional untuk kajian, penelitian, dan proyek')}
                      </p>
                      <h4 className="text-sm md:text-base font-extrabold text-gray-900 leading-snug">
                        {t('Temukan Tenaga Ahli Akademik Terpercaya!')}
                      </h4>
                      <p className="text-xs text-gray-600">
                        {t('Konsultasi cepat, aman, dan berstandar sertifikasi nasional.')}
                      </p>
                    </div>
                    <div className="shrink-0 hidden sm:flex items-center justify-center w-12 h-12 rounded-2xl bg-[#8B4513] text-white shadow-md">
                      <SparklesIcon className="w-6 h-6 text-amber-300" />
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-2.5 pt-2 text-xs md:text-sm text-gray-600 font-medium">
                  <div className="flex items-start gap-2.5 text-gray-600 leading-relaxed max-w-md">
                    <MapPinIcon className="w-4 h-4 text-[#8B4513] shrink-0 mt-0.5" />
                    <span>Jl. Saturnus No.13 Blk. F, RT.2/RW.5, Ciherang, Kec. Dramaga, Kabupaten Bogor, Jawa Barat 16680</span>
                  </div>
                  <a
                    href="mailto:help@tenagaahli.com"
                    className="flex items-center gap-2.5 hover:text-[#8B4513] transition-colors w-fit"
                  >
                    <EnvelopeIcon className="w-4 h-4 text-[#8B4513] shrink-0" />
                    <span>help@tenagaahli.com</span>
                  </a>
                  <a
                    href="https://wa.me/628111520900"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2.5 hover:text-[#8B4513] transition-colors w-fit"
                  >
                    <IconWhatsapp className="w-4 h-4 text-[#8B4513] shrink-0" />
                    <span>0811-1520-900</span>
                  </a>
                </div>
              </div>

              {/* ── MIDDLE COLUMN: BANTUAN & PANDUAN (col-span-3) ── */}
              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B4513]">
                  {t('Bantuan & Panduan')}
                </h3>
                <ul className="space-y-2.5 text-xs md:text-sm text-gray-600 font-medium">
                  <li>
                    <Link to="/cara-penggunaan" className="hover:text-[#8B4513] transition-colors">
                      {t('Cara Penggunaan')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/tingkatan-medali" className="hover:text-[#8B4513] transition-colors">
                      {t('Badge Medali Ahli')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/pusat-bantuan" className="hover:text-[#8B4513] transition-colors">
                      {t('Pusat Bantuan')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/peraturan-amdal" className="hover:text-[#8B4513] transition-colors">
                      {t('Syarat & Ketentuan')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/pemberitahuan-privasi" className="hover:text-[#8B4513] transition-colors">
                      {t('Pemberitahuan Privasi')}
                    </Link>
                  </li>
                </ul>
              </div>

              {/* ── RIGHT COLUMN: TENAGA AHLI / TENTANG (col-span-3) ── */}
              <div className="lg:col-span-3 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B4513]">
                  {t('Tenaga Ahli')}
                </h3>
                <ul className="space-y-2.5 text-xs md:text-sm text-gray-600 font-medium">
                  <li>
                    <Link to="/tentang-kami" className="hover:text-[#8B4513] transition-colors">
                      {t('Tentang Kami')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/daftar-profil" className="hover:text-[#8B4513] transition-colors">
                      {t('Tenaga Ahli')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/daftar-teknis" className="hover:text-[#8B4513] transition-colors">
                      {t('Tenaga Teknis')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/daftar-surveyor" className="hover:text-[#8B4513] transition-colors">
                      {t('Surveyor Profesional')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/berita" className="hover:text-[#8B4513] transition-colors">
                      {t('Berita Terkini')}
                    </Link>
                  </li>
                  <li>
                    <Link to="/informasi-proyek" className="hover:text-[#8B4513] transition-colors">
                      {t('Informasi Proyek')}
                    </Link>
                  </li>

                  <li>
                    <Link to="/daftar" className="hover:text-[#8B4513] transition-colors">
                      {t('Gabung Sebagai Tenaga Ahli')}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* ── MOBILE COMPACT FOOTER (md:hidden) ── */}
            <div className="md:hidden flex flex-col items-center text-center gap-4 pb-6 pt-2 border-b border-[#E0D2C3]">
              {/* Logo */}
              <Link to="/" className="inline-block">
                <img
                  src={logoImg}
                  alt="Tenaga Ahli"
                  className="h-10 w-auto object-contain mx-auto"
                />
              </Link>

              {/* Quick Contact Chips */}
              <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-semibold">
                <a
                  href="https://wa.me/628111520900"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#D5C4B2] text-gray-700 hover:text-[#8B4513] shadow-2xs"
                >
                  <IconWhatsapp className="w-3.5 h-3.5 text-[#8B4513]" />
                  <span>0811-1520-900</span>
                </a>
                <a
                  href="mailto:help@tenagaahli.com"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#D5C4B2] text-gray-700 hover:text-[#8B4513] shadow-2xs"
                >
                  <EnvelopeIcon className="w-3.5 h-3.5 text-[#8B4513]" />
                  <span>help@tenagaahli.com</span>
                </a>
              </div>

              <p className="text-[11px] text-gray-500 text-center max-w-xs mx-auto leading-relaxed flex items-center justify-center gap-1">
                <MapPinIcon className="w-3.5 h-3.5 text-[#8B4513] shrink-0" />
                <span>Jl. Saturnus No.13 Blk. F, Ciherang, Dramaga, Kab. Bogor 16680</span>
              </p>

              {/* Quick Legal Links */}
              <div className="flex items-center justify-center gap-4 text-xs text-gray-600 font-medium">
                <Link to="/pusat-bantuan" className="hover:text-[#8B4513]">
                  {t('Bantuan')}
                </Link>
                <span>•</span>
                <Link to="/pemberitahuan-privasi" className="hover:text-[#8B4513]">
                  {t('Privasi')}
                </Link>
                <span>•</span>
                <Link to="/peraturan-amdal" className="hover:text-[#8B4513]">
                  {t('Syarat')}
                </Link>
              </div>
            </div>

            {/* ── BOTTOM COPYRIGHT & SOCIALS (with safe bottom padding on mobile for bottom nav) ── */}
            <div className="pt-6 pb-20 md:pb-0 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
              <p className="text-center sm:text-left">
                © {new Date().getFullYear()} TenagaAhli.com. {t('All rights reserved.')}
              </p>

              {/* Social icons */}
              <div className="flex items-center gap-4">
                {SOCIALS.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={s.label}
                    className="w-8 h-8 rounded-full bg-white border border-[#DCCEC0] flex items-center justify-center text-gray-600 hover:text-[#8B4513] hover:border-[#8B4513] transition-all shadow-2xs"
                  >
                    {s.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── Scroll-to-top FAB ── */}
      <button
        onClick={scrollToTop}
        aria-label="Kembali ke atas"
        className={`fixed bottom-20 md:bottom-8 right-4 md:right-8 z-50 w-11 h-11 rounded-full bg-[#8B4513] text-white shadow-lg flex items-center justify-center hover:bg-[#6B3410] transition-all duration-300 ${
          showScroll ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ArrowUpIcon className="w-4 h-4" />
      </button>
    </>
  );
}