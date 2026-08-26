import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import Background from '../assets/background5.jpeg'; // ✅ tetap dipakai sebagai poster/fallback video
import ShinyText from '../components/ShinyText';
import { usePageLoading } from '../context/LoadingContext.jsx';

import {
  UserIcon,
  Cog6ToothIcon,
  CheckIcon,
  BookOpenIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid';

// ✅ path video di folder public (root project) -> frontend/public/images/map-world.mp4
const HeroVideo = '/images/map-world.mp4';

const categories = [
  {
    // Plain person icon — no badge
    MainIcon: UserIcon,
    BadgeIcon: null,
    title: 'Narasumber/Pembicara',
    overlay: 'bg-black/50 hover:bg-[#0EA5E9]/70 transition-colors duration-300',
    img: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800',
    to: '/narasumber',
  },
  {
    // Person + gear badge
    MainIcon: UserIcon,
    BadgeIcon: Cog6ToothIcon,
    title: 'Tenaga Ahli',
    overlay: 'bg-black/50 hover:bg-[#0EA5E9]/70 transition-colors duration-300',
    img: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&q=80&w=800',
    to: '/tenaga-ahli',
  },
  {
    // Person + checkmark badge
    MainIcon: UserIcon,
    BadgeIcon: CheckIcon,
    title: 'Instruktur Pengajar',
    overlay: 'bg-black/50 hover:bg-[#0EA5E9]/70 transition-colors duration-300',
    img: 'https://images.unsplash.com/photo-1755692879703-d18a213f8691?auto=format&fit=crop&q=80&w=800',
    to: '/instruktur-pengajar',
  },
  {
    // Just the open book icon, no person
    MainIcon: BookOpenIcon,
    BadgeIcon: null,
    title: 'Peneliti Artikel/Jurnal',
    overlay: 'bg-black/50 hover:bg-[#0EA5E9]/70 transition-colors duration-300',
    img: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=800',
    to: '/peneliti-artikel-jurnal',
  },
];

const SEARCH_CATEGORIES = [
  { icon: categories.find(c => c.title === 'Tenaga Ahli').MainIcon, title: 'Tenaga Ahli' },
  ...categories.filter(c => c.title !== 'Tenaga Ahli').map(c => ({ icon: c.MainIcon, title: c.title })),
];

// Label singkat untuk tag populer di hero (mengikuti tata letak referensi),
// tetap terhubung ke nilai kriteria yang sesungguhnya untuk pencarian.
const QUICK_TAGS = [
  { label: 'Narasumber', kriteria: 'Narasumber/Pembicara' },
  { label: 'PenelitiArtikel', kriteria: 'Peneliti Artikel/Jurnal' },
  { label: 'InstrukturPengajar', kriteria: 'Instruktur Pengajar' },
  { label: 'TenagaAhli', kriteria: 'Tenaga Ahli' },
];

// Mode-mode pencarian yang bisa dipilih lewat toggle di atas kolom pencarian.
// Setiap mode punya field-nya sendiri (keyword/location/kategori) sehingga
// nilai yang sudah diketik tidak hilang saat berpindah mode.
const SEARCH_MODES = [
  { key: 'keyword', label: 'Kata Kunci', placeholder: 'Cari nama, keahlian, atau bidang...' },
  { key: 'location', label: 'Lokasi', placeholder: 'Kota, Kabupaten, atau Provinsi...' },
  { key: 'kategori', label: 'Kategori', placeholder: 'Tenaga Ahli, Narasumber, Instruktur...' },
];

const POPULAR_KEYWORDS = [
  'Ahli Kehutanan',
  'Peneliti Lingkungan',
  'Instruktur AMDAL',
  'Konsultan Tata Ruang',
  'Ahli Hidrologi'
];

const LOCATION_SUGGESTIONS = [
  'Jakarta',
  'Bogor',
  'Depok',
  'Tangerang',
  'Bekasi',
  'Bandung',
  'Surabaya',
  'Semarang',
  'Yogyakarta',
  'Medan',
];

// Data ahli unggulan cadangan (Telah Diperbarui ke Dr. Irman Firmansyah)
const FALLBACK_FEATURED_EXPERTS = [
  {
    id: 1,
    slug: 'dr-irman-firmansyah-s-hut-m-si',
    name: 'Dr. Irman Firmansyah, S.Hut, M.Si',
    photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100',
    cover: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=800',
    verified: true,
  },
];

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { reportReady } = usePageLoading();

  // Nilai masing-masing field pencarian, dijaga terpisah per mode.
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const [kategori, setKategori] = useState('');

  // Mode toggle yang sedang aktif: 'keyword' | 'location' | 'kategori'
  const [activeMode, setActiveMode] = useState('keyword');
  const [kategoriOpen, setKategoriOpen] = useState(false);
  const [keywordOpen, setKeywordOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalExperts, setTotalExperts] = useState(0);
  const [showAll, setShowAll] = useState(false);

  const displayLimit = 6;
  const displayedExperts = showAll ? experts : experts.slice(0, displayLimit);

  const kategoriBoxRef = useRef(null);
  const toggleContainerRef = useRef(null);
  const modeButtonRefs = useRef({});
  const [sliderStyle, setSliderStyle] = useState({ left: 0, width: 0 });

  const fieldValues = { keyword, location, kategori };
  const fieldSetters = { keyword: setKeyword, location: setLocation, kategori: setKategori };
  const activeModeConfig = SEARCH_MODES.find((m) => m.key === activeMode);

  useEffect(() => {
    function handleOutsideClick(e) {
      if (kategoriBoxRef.current && !kategoriBoxRef.current.contains(e.target) &&
          toggleContainerRef.current && !toggleContainerRef.current.contains(e.target)) {
        setKategoriOpen(false);
        setKeywordOpen(false);
        setLocationOpen(false);
        setIsSearchFocused(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Geser & sesuaikan lebar pill background mengikuti tombol mode yang aktif
  useLayoutEffect(() => {
    function measure() {
      const btn = modeButtonRefs.current[activeMode];
      if (btn) {
        setSliderStyle({ left: btn.offsetLeft, width: btn.offsetWidth });
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [activeMode]);

  const kategoriMatches = SEARCH_CATEGORIES.filter((c) =>
    c.title.toLowerCase().includes(kategori.trim().toLowerCase())
  );
  
  const locationMatches = LOCATION_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(location.trim().toLowerCase())
  );

  useEffect(() => {
    // Fetch tenaga ahli premium/featured
    api
      .get('/experts', { params: { featured: 1, order: 'latest' } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];

        // Filter hanya yang punya package_id (premium)
        const premiumExperts = data.filter(exp => exp.package_id || exp.featured);

        if (premiumExperts.length === 0) {
          setExperts(FALLBACK_FEATURED_EXPERTS);
          setTotalExperts(FALLBACK_FEATURED_EXPERTS.length);
        } else {
          setExperts(premiumExperts);
          setTotalExperts(premiumExperts.length);
        }
      })
      .catch(() => {
        setExperts(FALLBACK_FEATURED_EXPERTS);
        setTotalExperts(FALLBACK_FEATURED_EXPERTS.length);
      })
      .finally(() => {
        setLoading(false);
        reportReady();
      });
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    setKategoriOpen(false);
    setKeywordOpen(false);
    setLocationOpen(false);
    setIsSearchFocused(false);
    navigate(`/search?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&kriteria=${encodeURIComponent(kategori)}`);
  };

  const handleActiveFieldChange = (value) => {
    fieldSetters[activeMode](value);
  };

  const handleTagClick = (kriteriaValue) => {
    setActiveMode('kategori');
    setKategori(kriteriaValue);
    setKategoriOpen(false);
    setKeywordOpen(false);
    setLocationOpen(false);
    setIsSearchFocused(false);
    navigate(`/search?keyword=${encodeURIComponent(keyword)}&location=${encodeURIComponent(location)}&kriteria=${encodeURIComponent(kriteriaValue)}`);
  };

  return (
    <>
      {/* Hero Section */}
      <header className="px-6 sm:px-10 md:px-16 lg:px-20 xl:px-24 2xl:px-32 py-4 pt-24" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        <section
          className="relative w-full h-[600px] rounded-[32px] overflow-hidden flex flex-col justify-center px-12 lg:px-24 transition-all duration-700"
        >
          {/* ✅ Video Background — menggantikan bg-cover bg-center image sebelumnya */}
          <video
            className="absolute inset-0 w-full h-full object-cover z-0"
            autoPlay
            muted
            loop
            playsInline
            poster={Background}
          >
            <source src={HeroVideo} type="video/mp4" />
          </video>

          {/* Overlay gelap agar teks tetap terbaca di atas video */}
          <div
            className={`absolute inset-0 z-[1] transition-opacity duration-700 ${isSearchFocused ? 'opacity-100' : 'opacity-80'}`}
            style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)' }}
          />
          {/* Ekstra dark overlay saat search aktif */}
          <div className={`absolute inset-0 z-[1] bg-black/40 transition-opacity duration-700 ${isSearchFocused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

          <div className="relative z-10 max-w-3xl text-white">
            {/* Teks Judul & Deskripsi */}
            <div className={`transition-all duration-700 ease-out transform ${isSearchFocused ? '-translate-y-8 opacity-0 pointer-events-none scale-95' : 'translate-y-0 opacity-100 scale-100'}`}>
              <h1 className="text-6xl md:text-7xl font-extrabold mb-6 drop-shadow-lg leading-[0.95] tracking-tight pb-2 max-w-2xl">
                <ShinyText
                  text={t('Temukan Tenaga Ahli Terpercaya')}
                  speed={2.5}
                  delay={0.5}
                  color="#ffffff"
                  shineColor="#0EA5E9"
                  spread={120}
                  direction="left"
                  pauseOnHover={false}
                  yoyo={false}
                  className="text-6xl md:text-7xl font-extrabold leading-[0.95] tracking-tight"
                />
              </h1>
              <p className="text-xl md:text-2xl font-medium mb-10 text-gray-200 leading-relaxed max-w-xl">
                {t('Platform pencarian tenaga ahli yang memudahkan Anda menemukan profesional berdasarkan keahlian, lokasi, sertifikasi, dan pengalaman.')}
              </p>
            </div>

            {/* Container Search Bar (Naik saat fokus) */}
            <div className={`transition-all duration-700 ease-out transform w-full max-w-2xl ${isSearchFocused ? '-translate-y-48' : 'translate-y-0'}`}>
              {/* Toggle mode pencarian */}
              <div
                ref={toggleContainerRef}
                className="flex items-center mb-4 p-1 rounded-full relative w-full justify-between"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(10px)' }}
            >
              {/* ✅ Pill aktif — gaya gelembung air (bubble): gradient biru bening + sheen + titik pantulan cahaya */}
              <div
                className="absolute top-1 bottom-1 rounded-full transition-all duration-300 ease-out z-0 overflow-hidden"
                style={{
                  left: sliderStyle.left,
                  width: sliderStyle.width,
                  background: 'linear-gradient(135deg, rgba(186,230,253,0.55) 0%, rgba(14,165,233,0.25) 55%, rgba(224,242,254,0.35) 100%)',
                  backdropFilter: 'blur(16px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                  border: '1px solid rgba(224,242,254,0.6)',
                  boxShadow: '0 4px 18px rgba(14,165,233,0.25), inset 0 1px 0 rgba(255,255,255,0.65), inset 0 -2px 6px rgba(14,165,233,0.2)',
                }}
              >
                {/* highlight sheen di bagian atas, khas gelembung air */}
                <div
                  className="absolute inset-x-0 top-0 h-1/2 rounded-t-full"
                  style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0.55), transparent)' }}
                />
                {/* titik pantulan cahaya kecil, khas bubble */}
                <div
                  className="absolute rounded-full"
                  style={{
                    top: '15%',
                    left: '12%',
                    width: '18%',
                    height: '30%',
                    background: 'rgba(255,255,255,0.7)',
                    filter: 'blur(3px)',
                  }}
                />
              </div>
              {SEARCH_MODES.map((mode) => (
                <button
                  key={mode.key}
                  type="button"
                  ref={(el) => (modeButtonRefs.current[mode.key] = el)}
                  onClick={() => {
                    setActiveMode(mode.key);
                    setKategoriOpen(mode.key === 'kategori');
                    setKeywordOpen(mode.key === 'keyword');
                    setLocationOpen(mode.key === 'location');
                    setIsSearchFocused(true);
                  }}
                  className={`relative z-10 flex-1 px-6 py-2.5 rounded-full font-semibold text-sm text-center transition-colors ${
                    activeMode === mode.key ? 'text-white' : 'text-white/70 hover:bg-white/5'
                  }`}
                >
                  {t(mode.label)}
                </button>
              ))}
            </div>

            {/* Kolom pencarian tunggal — isinya berganti mengikuti mode yang aktif */}
            <form onSubmit={handleSearch} className="relative max-w-2xl mb-8" ref={kategoriBoxRef}>
              <div className="flex items-center bg-white rounded-full p-1.5 pr-1.5 shadow-xl">
                <input
                  className="w-full bg-transparent border-none focus:ring-0 text-on-background text-base px-6 py-1.5 placeholder-gray-400"
                  placeholder={t(activeModeConfig.placeholder)}
                  type="text"
                  value={fieldValues[activeMode]}
                  onChange={(e) => handleActiveFieldChange(e.target.value)}
                  onFocus={() => {
                    setKategoriOpen(activeMode === 'kategori');
                    setKeywordOpen(activeMode === 'keyword');
                    setLocationOpen(activeMode === 'location');
                    setIsSearchFocused(true);
                  }}
                />
                <button
                  type="submit"
                  className="bg-black hover:bg-gray-900 text-white flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-colors shrink-0"
                >
                  <MagnifyingGlassIcon className="w-4 h-4 text-[#0EA5E9]" />
                  <span>{t('Search')}</span>
                </button>
              </div>

              {/* Saran kategori muncul hanya saat mode Kategori aktif */}
              {activeMode === 'kategori' && kategoriOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/20 backdrop-blur-xl rounded-xl shadow-2xl z-40 overflow-hidden border border-white/20 text-white">
                  <div className="px-4 py-3 border-b border-white/10">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                      {t('Kategori')}
                    </h4>
                  </div>
                  {kategoriMatches.length > 0 ? (
                    kategoriMatches.map((c, i, arr) => (
                      <button
                        key={c.title}
                        type="button"
                        onClick={() => {
                          setKategori(c.title);
                          setKategoriOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/10 active:bg-white/10 transition-colors ${
                          i !== arr.length - 1 ? 'border-b border-white/10' : ''
                        } ${c.title === kategori ? 'font-semibold text-[#0EA5E9]' : ''}`}
                      >
                        <c.icon className="w-[18px] h-[18px] text-gray-400 shrink-0" />
                        {t(c.title)}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-400 text-center">
                      {t('Tidak ada saran untuk')} "{kategori}"
                    </div>
                  )}
                </div>
              )}

              {/* Saran lokasi muncul saat mode Lokasi aktif */}
              {activeMode === 'location' && locationOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/20 backdrop-blur-xl rounded-xl shadow-2xl z-40 overflow-hidden border border-white/20 text-white">
                  <div className="px-4 py-3 border-b border-white/10">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                      {t('Lokasi')}
                    </h4>
                  </div>
                  {locationMatches.length > 0 ? (
                    locationMatches.map((loc, i, arr) => (
                      <button
                        key={loc}
                        type="button"
                        onClick={() => {
                          setLocation(loc);
                          setLocationOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/10 active:bg-white/10 transition-colors ${
                          i !== arr.length - 1 ? 'border-b border-white/10' : ''
                        }`}
                      >
                        <MagnifyingGlassIcon className="w-[18px] h-[18px] text-gray-400 shrink-0" />
                        {loc}
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-xs text-gray-400 text-center">
                      {t('Tidak ada saran untuk')} "{location}"
                    </div>
                  )}
                </div>
              )}

              {/* Pencarian Populer muncul saat mode Kata Kunci aktif */}
              {activeMode === 'keyword' && keywordOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-black/20 backdrop-blur-xl rounded-xl shadow-2xl z-40 overflow-hidden border border-white/20 text-white">
                  <div className="px-4 py-3 border-b border-white/10">
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-300">
                      {t('Pencarian Populer')}
                    </h4>
                  </div>
                  {POPULAR_KEYWORDS.map((kw, i, arr) => (
                    <button
                      key={kw}
                      type="button"
                      onClick={() => {
                        setKeyword(kw);
                        setKeywordOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-white/10 active:bg-white/10 transition-colors ${
                        i !== arr.length - 1 ? 'border-b border-white/10' : ''
                      }`}
                    >
                      <MagnifyingGlassIcon className="w-[18px] h-[18px] text-gray-400 shrink-0" />
                      {t(kw)}
                    </button>
                  ))}
                </div>
              )}
            </form>

            {/* Tag populer */}
            <div className="flex flex-wrap items-center gap-3 max-w-2xl">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag.label}
                  type="button"
                  onClick={() => handleTagClick(tag.kriteria)}
                  className="px-5 py-2.5 rounded-full border border-white/50 bg-transparent hover:bg-[#0EA5E9] hover:border-[#0EA5E9] transition-all text-sm font-semibold text-white"
                >
                  {t(tag.label)}
                </button>
              ))}
            </div>
            </div> {/* Closing for Container Search Bar */}
          </div>
        </section>
      </header>

      {/* Kategori Section */}
      <section className="py-20 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
        <div className="text-center mb-12">
          <h2 className="font-headline-lg text-headline-lg text-on-background mb-2">{t('Jelajahi Tenaga Ahli')}</h2>
          <p className="text-on-surface-variant">{t('Kategori Keahlian')}</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <Link to={cat.to} key={cat.title} className="relative h-64 rounded-lg overflow-hidden group cursor-pointer block">
              <img src={cat.img} alt={cat.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
              <div className={`absolute inset-0 ${cat.overlay} flex flex-col items-center justify-center text-white p-6`}>
                {cat.BadgeIcon ? (
                  <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
                    <cat.MainIcon className="w-full h-full drop-shadow-lg" />
                    <div className="absolute -bottom-0.5 -right-0.5 bg-transparent">
                      <cat.BadgeIcon className="w-5 h-5 drop-shadow-lg" />
                    </div>
                  </div>
                ) : (
                  <cat.MainIcon className="w-14 h-14 mb-4 drop-shadow-lg" />
                )}
                <h3 className="font-headline-md text-xl text-center">{t(cat.title)}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Layanan Unggulan Section */}
      <section className="py-24 px-margin-mobile md:px-margin-desktop bg-white">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-headline-lg text-headline-lg text-on-background mb-2">{t('Tenaga Ahli Terverifikasi')}</h2>
            <p className="text-on-surface-variant">{t('home.verified_experts_desc', 'Telusuri tenaga ahli profesional dari berbagai bidang keahlian yang telah melalui proses verifikasi di TenagaAhli.com.')}</p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="flex items-center gap-3 text-[#5B6660]">
                <span className="w-6 h-6 rounded-full border-2 border-[#0EA5E9]/30 border-t-[#0EA5E9] animate-spin" />
                <span>{t('Memuat...')}</span>
              </div>
            </div>
          ) : displayedExperts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-[#F5F4F0] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-[#5B6660]/40">group</span>
              </div>
              <p className="text-on-surface-variant">{t('Tidak ada hasil ditemukan')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayedExperts.map((expert) => (
                  <div key={expert.id} className="relative group rounded-xl overflow-hidden shadow-lg bg-white border border-outline-variant/30 hover:shadow-xl transition-shadow">
                    <div className="relative h-64">
                      <img src={expert.cover} alt={expert.name} className="w-full h-full object-cover" />

                      {/* Premium Badge */}
                      <div className="absolute top-4 left-4 bg-gradient-to-r from-[#FFD700] to-[#FFA500] p-1.5 rounded-lg shadow-lg">
                        <span className="material-symbols-outlined text-white text-base" style={{ fontVariationSettings: '"FILL" 1' }}>workspace_premium</span>
                      </div>

                      {/* Lihat Profil Button */}
                      {expert.slug && (
                        <Link
                          to={`/profil/${expert.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute top-4 right-4 bg-[#0EA5E9] hover:bg-[#0284C7] text-xs font-semibold text-white rounded-full px-3 py-1.5 shadow-lg transition-colors"
                        >
                          {t('Lihat Profil')}
                        </Link>
                      )}

                      {/* Expert Info Overlay */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-11 h-11 rounded-full border-2 border-white overflow-hidden shrink-0 shadow-lg">
                            <img src={expert.photo} alt={expert.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 mb-0.5">
                              <span className="text-white text-sm font-bold truncate">{expert.name}</span>
                              {expert.verified && (
                                <span className="material-symbols-outlined text-sky-400 text-[16px] shrink-0" style={{ fontVariationSettings: '"FILL" 1' }}>check_circle</span>
                              )}
                            </div>
                            {expert.field && (
                              <p className="text-white/80 text-xs truncate">{expert.field}</p>
                            )}
                            {expert.location && (
                              <div className="flex items-center gap-1 mt-1">
                                <span className="material-symbols-outlined text-white/70 text-[12px]">location_on</span>
                                <span className="text-white/70 text-[10px] truncate">{expert.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Tombol Lihat Ahli Lainnya */}
              {totalExperts > displayLimit && (
                <div className="flex justify-center mt-12">
                  {!showAll ? (
                    <button
                      onClick={() => setShowAll(true)}
                      className="flex items-center gap-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold px-8 py-3.5 rounded-full shadow-lg shadow-[#0EA5E9]/20 transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">expand_more</span>
                      {t('Selengkapnya')} ({totalExperts - displayLimit})
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowAll(false);
                        window.scrollTo({ top: 800, behavior: 'smooth' });
                      }}
                      className="flex items-center gap-2 bg-white hover:bg-gray-50 text-[#0EA5E9] font-semibold px-8 py-3.5 rounded-full border-2 border-[#0EA5E9] transition-all active:scale-95"
                    >
                      <span className="material-symbols-outlined text-[20px]">expand_less</span>
                      {t('Lebih Sedikit')}
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
}