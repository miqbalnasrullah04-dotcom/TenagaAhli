import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import Background from '../assets/background5.jpeg';
import surveyorImg from '../assets/surveyor.jpg';
import tenagaAhliImg from '../assets/ahli.png';
import tenagaTeknisImg from '../assets/tenaga-teknis.jpg';
import HeroSlider from '../components/HeroSlider';
import ExpertCard from '../components/ExpertCard.jsx';
import GraduationCapLoader from '../components/GraduationCapLoader.jsx';
import { usePageLoading } from '../context/LoadingContext.jsx';

import {
  UserIcon,
  Cog6ToothIcon,
  WrenchScrewdriverIcon,
  MapPinIcon,
  MagnifyingGlassIcon,
} from '@heroicons/react/24/solid';

const categories = [
  {
    // Person avatar + Gear badge
    MainIcon: UserIcon,
    BadgeIcon: Cog6ToothIcon,
    title: 'Tenaga Ahli',
    overlay: 'bg-black/50 hover:bg-[#8B4513]/70 transition-colors duration-300',
    img: tenagaAhliImg,
    to: '/tenaga-ahli',
  },
  {
    // Person avatar + Wrench & Screwdriver badge
    MainIcon: UserIcon,
    BadgeIcon: WrenchScrewdriverIcon,
    title: 'Tenaga Teknis',
    overlay: 'bg-black/50 hover:bg-[#8B4513]/70 transition-colors duration-300',
    img: tenagaTeknisImg,
    to: '/tenaga-teknis',
  },
  {
    // Person avatar + Map Pin badge
    MainIcon: UserIcon,
    BadgeIcon: MapPinIcon,
    title: 'Surveyor',
    overlay: 'bg-black/50 hover:bg-[#8B4513]/70 transition-colors duration-300',
    img: surveyorImg,
    to: '/surveyor',
  },
];

const SEARCH_CATEGORIES = [
  { icon: Cog6ToothIcon, title: 'Tenaga Ahli' },
  { icon: WrenchScrewdriverIcon, title: 'Tenaga Teknis' },
  { icon: MapPinIcon, title: 'Surveyor' },
];

// 16 Keahlian Utama
const MAIN_SKILLS = [
  { id: 1, name: 'GIS', icon: 'public', query: 'GIS', color: 'from-blue-500/15 via-blue-400/10 to-cyan-500/20 text-blue-700 border-blue-200/80', glow: 'from-blue-400/20 to-cyan-400/20', hoverBorder: 'hover:border-blue-400', badge: 'Pemetaan' },
  { id: 2, name: 'Sistem Dinamik', icon: 'hub', query: 'Sistem Dinamik', color: 'from-indigo-500/15 via-indigo-400/10 to-purple-500/20 text-indigo-700 border-indigo-200/80', glow: 'from-indigo-400/20 to-purple-400/20', hoverBorder: 'hover:border-indigo-400', badge: 'Model' },
  { id: 3, name: 'Ekonomi', icon: 'trending_up', query: 'Ekonomi', color: 'from-emerald-500/15 via-emerald-400/10 to-teal-500/20 text-emerald-700 border-emerald-200/80', glow: 'from-emerald-400/20 to-teal-400/20', hoverBorder: 'hover:border-emerald-400', badge: 'Finansial' },
  { id: 4, name: 'Hukum', icon: 'gavel', query: 'Hukum', color: 'from-rose-500/15 via-rose-400/10 to-red-500/20 text-rose-700 border-rose-200/80', glow: 'from-rose-400/20 to-red-400/20', hoverBorder: 'hover:border-rose-400', badge: 'Regulasi' },
  { id: 5, name: 'Perencanaan Wilayah', icon: 'map', query: 'Perencanaan Wilayah', color: 'from-sky-500/15 via-sky-400/10 to-indigo-500/20 text-sky-700 border-sky-200/80', glow: 'from-sky-400/20 to-indigo-400/20', hoverBorder: 'hover:border-sky-400', badge: 'Tata Ruang' },
  { id: 6, name: 'Lingkungan', icon: 'eco', query: 'Lingkungan', color: 'from-green-500/15 via-green-400/10 to-emerald-500/20 text-green-700 border-green-200/80', glow: 'from-green-400/20 to-emerald-400/20', hoverBorder: 'hover:border-green-400', badge: 'AMDAL' },
  { id: 7, name: 'Sipil', icon: 'engineering', query: 'Sipil', color: 'from-amber-500/15 via-orange-400/10 to-orange-500/20 text-amber-800 border-amber-200/80', glow: 'from-amber-400/20 to-orange-400/20', hoverBorder: 'hover:border-amber-400', badge: 'Struktur' },
  { id: 8, name: 'Sosial', icon: 'groups', query: 'Sosial', color: 'from-pink-500/15 via-pink-400/10 to-rose-500/20 text-pink-700 border-pink-200/80', glow: 'from-pink-400/20 to-rose-400/20', hoverBorder: 'hover:border-pink-400', badge: 'Masyarakat' },
  { id: 9, name: 'Geologi', icon: 'landscape', query: 'Geologi', color: 'from-stone-500/15 via-stone-400/10 to-zinc-500/20 text-stone-700 border-stone-200/80', glow: 'from-stone-400/20 to-zinc-400/20', hoverBorder: 'hover:border-stone-400', badge: 'Kebumian' },
  { id: 10, name: 'Remote Sensing', icon: 'satellite_alt', query: 'Remote Sensing', color: 'from-teal-500/15 via-teal-400/10 to-cyan-500/20 text-teal-700 border-teal-200/80', glow: 'from-teal-400/20 to-cyan-400/20', hoverBorder: 'hover:border-teal-400', badge: 'Satelit' },
  { id: 11, name: 'Pertambangan', icon: 'hardware', query: 'Pertambangan', color: 'from-yellow-500/15 via-yellow-400/10 to-amber-500/20 text-amber-800 border-yellow-200/80', glow: 'from-yellow-400/20 to-amber-400/20', hoverBorder: 'hover:border-yellow-400', badge: 'Tambang' },
  { id: 12, name: 'Arsitek', icon: 'architecture', query: 'Arsitek', color: 'from-violet-500/15 via-purple-400/10 to-fuchsia-500/20 text-violet-700 border-violet-200/80', glow: 'from-violet-400/20 to-fuchsia-400/20', hoverBorder: 'hover:border-violet-400', badge: 'Desain' },
  { id: 13, name: 'Perikanan', icon: 'phishing', query: 'Perikanan', color: 'from-cyan-500/15 via-cyan-400/10 to-blue-500/20 text-cyan-700 border-cyan-200/80', glow: 'from-cyan-400/20 to-blue-400/20', hoverBorder: 'hover:border-cyan-400', badge: 'Kelautan' },
  { id: 14, name: 'Pertanian', icon: 'agriculture', query: 'Pertanian', color: 'from-lime-500/15 via-lime-400/10 to-green-500/20 text-lime-800 border-lime-200/80', glow: 'from-lime-400/20 to-green-400/20', hoverBorder: 'hover:border-lime-400', badge: 'Agronomi' },
  { id: 15, name: 'Statistik', icon: 'analytics', query: 'Statistik', color: 'from-purple-500/15 via-purple-400/10 to-indigo-500/20 text-purple-700 border-purple-200/80', glow: 'from-purple-400/20 to-indigo-400/20', hoverBorder: 'hover:border-purple-400', badge: 'Olah Data' },
  { id: 16, name: 'Meteorologi & Klimatologi', icon: 'partly_cloudy_day', query: 'Meteorologi & Klimatologi', color: 'from-sky-500/15 via-teal-400/10 to-teal-500/20 text-sky-700 border-sky-200/80', glow: 'from-sky-400/20 to-teal-400/20', hoverBorder: 'hover:border-sky-400', badge: 'Iklim' },
];

// Label singkat untuk tag populer di hero (mengikuti tata letak referensi),
// tetap terhubung ke nilai kriteria yang sesungguhnya untuk pencarian.
// Urutan: Tenaga Ahli, Tenaga Teknis, Surveyor
const QUICK_TAGS = [
  { label: 'Tenaga Ahli', kriteria: 'Tenaga Ahli' },
  { label: 'Tenaga Teknis', kriteria: 'Tenaga Teknis' },
  { label: 'Surveyor', kriteria: 'Surveyor' },
];

// Mode-mode pencarian yang bisa dipilih lewat toggle di atas kolom pencarian.
// Setiap mode punya field-nya sendiri (keyword/location) sehingga
// nilai yang sudah diketik tidak hilang saat berpindah mode.
const SEARCH_MODES = [
  { key: 'keyword', label: 'Kata Kunci', placeholder: 'Cari nama, keahlian, atau bidang...' },
  { key: 'location', label: 'Lokasi', placeholder: 'Kota, Kabupaten, atau Provinsi...' },
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

// Data ahli cadangan kosong (Hanya menampilkan data asli dari database)
const FALLBACK_EXPERTS = [];

const DEFAULT_NEWS_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200';

const FALLBACK_ARTICLES = [
  {
    id: 1,
    slug: 'panduan-lengkap-amdal-untuk-pemula',
    title: 'Panduan Lengkap Penyusunan AMDAL untuk Berbagai Sektor Industri',
    category: 'LINGKUNGAN',
    source: 'TenagaAhli Editorial',
    excerpt: 'Memahami prosedur, tahapan pengujian dampak, dan peran strategis tenaga ahli dalam penyusunan dokumen kelayakan lingkungan hidup.',
    thumbnail: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&q=80&w=800',
    published_at: '2026-03-28',
  },
  {
    id: 2,
    slug: 'peran-sistem-dinamik-dalam-perencanaan-tata-ruang',
    title: 'Implementasi Pemodelan Sistem Dinamik pada Analisis Daya Dukung Wilayah',
    category: 'TATA RUANG',
    source: 'Riset & Kebijakan',
    excerpt: 'Bagaimana pendekatan dinamika spasial membantu pengambil keputusan memproyeksikan kebutuhan lahan dan daya dukung lingkungan perkotaan.',
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&q=80&w=800',
    published_at: '2026-03-24',
  },
  {
    id: 3,
    slug: 'standarisasi-kompetensi-tenaga-ahli-dan-surveyor',
    title: 'Standarisasi Kompetensi & Sertifikasi BNSP bagi Tenaga Ahli Profesional',
    category: 'REGULASI',
    source: 'Wawasan Profesi',
    excerpt: 'Pentingnya legalitas sertifikasi keahlian, SKK, dan lisensi resmi dalam memenangkan kepercayaan mitra kerja dan proyek skala nasional.',
    thumbnail: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&q=80&w=800',
    published_at: '2026-03-20',
  },
  {
    id: 4,
    slug: 'pemanfaatan-teknologi-drone-dan-lidar-dalam-survei-topografi',
    title: 'Pemanfaatan Teknologi Drone & LiDAR untuk Efisiensi Pemetaan Topografi',
    category: 'SURVEI & PEMETAAN',
    source: 'Teknologi Geospasial',
    excerpt: 'Penerapan drone fotogrametri dan sensor LiDAR menghasilkan data kontur dan model elevasi digital dengan akurasi sentimeter.',
    thumbnail: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&q=80&w=800',
    published_at: '2026-03-16',
  },
  {
    id: 5,
    slug: 'strategi-penyusunan-klhs-untuk-rencana-detail-tata-ruang',
    title: 'Strategi Integrasi KLHS dalam Penyusunan Rencana Detail Tata Ruang',
    category: 'TATA RUANG',
    source: 'Kajian Wilayah',
    excerpt: 'Memastikan prinsip pembangunan berkelanjutan menjadi dasar utama dalam pembagian zona dan pemanfaatan ruang kabupaten/kota.',
    thumbnail: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&q=80&w=800',
    published_at: '2026-03-12',
  },
  {
    id: 6,
    slug: 'standarisasi-keselamatan-kerja-k3-eksplorasi-lapangan',
    title: 'Manajemen Risiko K3 dan Prosedur Keselamatan Kerja Proyek Lapangan',
    category: 'KESELAMATAN KERJA',
    source: 'Manajemen Lapangan',
    excerpt: 'Pentingnya penerapan standar operasional K3 untuk mitigasi kecelakaan kerja selama survei geologi dan kegiatan teknis konstruksi.',
    thumbnail: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&q=80&w=800',
    published_at: '2026-03-08',
  },
];

function formatNewsDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

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

  const [articles, setArticles] = useState([]);
  const [articlesLoading, setArticlesLoading] = useState(true);

  // --- Paginated Navigation (Bagian 1 -> Bagian 2 -> dst) ---
  const [currentPage, setCurrentPage] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(3);
  const touchStartXRef = useRef(null);

  useEffect(() => {
    const updateItemsPerPage = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 640) {
        setItemsPerPage(1);
      } else if (window.innerWidth < 1024) {
        setItemsPerPage(2);
      } else {
        setItemsPerPage(3);
      }
    };
    updateItemsPerPage();
    window.addEventListener('resize', updateItemsPerPage);
    return () => window.removeEventListener('resize', updateItemsPerPage);
  }, []);

  const pages = useMemo(() => {
    if (!experts || experts.length === 0) return [];
    const chunks = [];
    for (let i = 0; i < experts.length; i += itemsPerPage) {
      chunks.push(experts.slice(i, i + itemsPerPage));
    }
    return chunks;
  }, [experts, itemsPerPage]);

  const totalPages = pages.length;

  useEffect(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(totalPages - 1);
    }
  }, [totalPages, currentPage]);

  const nextPage = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  };

  const handleTouchStart = (e) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e) => {
    if (touchStartXRef.current === null) return;
    const diff = touchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 50 && currentPage < totalPages - 1) {
      setCurrentPage((prev) => prev + 1);
    } else if (diff < -50 && currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
    touchStartXRef.current = null;
  };

  // --- Paginated Navigation & Auto-sliding Carousel for Berita Section ---
  const [currentArticlePage, setCurrentArticlePage] = useState(0);
  const [articlesPerPage, setArticlesPerPage] = useState(3);
  const [isArticlePaused, setIsArticlePaused] = useState(false);
  const articleTouchStartXRef = useRef(null);

  useEffect(() => {
    const updateArticlesPerPage = () => {
      if (typeof window === 'undefined') return;
      if (window.innerWidth < 640) {
        setArticlesPerPage(1);
      } else if (window.innerWidth < 1024) {
        setArticlesPerPage(2);
      } else {
        setArticlesPerPage(3);
      }
    };
    updateArticlesPerPage();
    window.addEventListener('resize', updateArticlesPerPage);
    return () => window.removeEventListener('resize', updateArticlesPerPage);
  }, []);

  const articlePages = useMemo(() => {
    if (!articles || articles.length === 0) return [];
    const chunks = [];
    for (let i = 0; i < articles.length; i += articlesPerPage) {
      chunks.push(articles.slice(i, i + articlesPerPage));
    }
    return chunks;
  }, [articles, articlesPerPage]);

  const totalArticlePages = articlePages.length;

  useEffect(() => {
    if (currentArticlePage >= totalArticlePages && totalArticlePages > 0) {
      setCurrentArticlePage(totalArticlePages - 1);
    }
  }, [totalArticlePages, currentArticlePage]);

  // Auto-play sliding interval: bergeser bergantian secara otomatis setiap 5 detik (pause saat kursor di atas kartu)
  useEffect(() => {
    if (totalArticlePages <= 1 || isArticlePaused) return;

    const interval = setInterval(() => {
      setCurrentArticlePage((prev) => (prev + 1) % totalArticlePages);
    }, 5000);

    return () => clearInterval(interval);
  }, [totalArticlePages, isArticlePaused]);

  const nextArticlePage = () => {
    if (totalArticlePages > 1) {
      setCurrentArticlePage((prev) => (prev + 1) % totalArticlePages);
    }
  };

  const prevArticlePage = () => {
    if (totalArticlePages > 1) {
      setCurrentArticlePage((prev) => (prev - 1 + totalArticlePages) % totalArticlePages);
    }
  };

  const handleArticleTouchStart = (e) => {
    articleTouchStartXRef.current = e.touches[0].clientX;
  };

  const handleArticleTouchEnd = (e) => {
    if (articleTouchStartXRef.current === null) return;
    const diff = articleTouchStartXRef.current - e.changedTouches[0].clientX;
    if (diff > 50) {
      nextArticlePage();
    } else if (diff < -50) {
      prevArticlePage();
    }
    articleTouchStartXRef.current = null;
  };

  // List artikel untuk continuous infinite marquee slider (didistribusikan & diduplikasi agar seamless loop)
  const marqueeArticles = useMemo(() => {
    const source = (articles && articles.length > 0) ? articles : FALLBACK_ARTICLES;
    let base = [...source];
    while (base.length < 6) {
      base = [...base, ...source];
    }
    return [...base, ...base];
  }, [articles]);

  const kategoriBoxRef = useRef(null);
  const toggleContainerRef = useRef(null);

  // Judul dipaksa 1 baris (whitespace-nowrap) SELAMA itu masih pas dibaca.
  // Font-size dihitung presisi lewat canvas measureText: kita ukur lebar teks
  // pada font-size referensi, lalu skalakan supaya pas dengan lebar kotak
  // yang tersedia (bukan sekadar clamp() berbasis vw yang bisa meleset).
  const titleWrapRef = useRef(null);
  const titleRef = useRef(null);
  const [titleFontSize, setTitleFontSize] = useState(48);
  // FIX (mobile "koplok"): dulu ada `minCap` (batas bawah ukuran font) yang tetap
  // dipaksakan walau di HP sangat sempit hasilnya kepanjangan untuk 1 baris —
  // itu penyebab judul kepotong kiri-kanan di screenshot. Sekarang ditambah flag
  // ini: kalau ukuran ideal untuk 1 baris jatuh di bawah batas nyaman dibaca,
  // judul otomatis boleh turun ke 2 baris (bukan dipaksa 1 baris sampai overflow).
  const [titleWraps, setTitleWraps] = useState(false);
  // Lebar ASLI hasil render teks judul (bukan lebar container) — dipakai sebagai
  // acuan lebar untuk deskripsi, toggle, search bar, dan banner promo, supaya
  // ukurannya proporsional mengikuti judul, bukan cuma angka tetap yang ditebak.
  const [controlsMaxWidth, setControlsMaxWidth] = useState(672);
  const titleText = t('Temukan Tenaga Ahli Akademik Terpercaya');

  useEffect(() => {
    const wrap = titleWrapRef.current;
    const titleEl = titleRef.current;
    if (!wrap || !titleEl) return;

    let canvas = null;

    const fit = () => {
      const containerWidth = wrap.clientWidth;
      if (!containerWidth) return;
      const style = window.getComputedStyle(titleEl);
      const fontWeight = style.fontWeight || '800';
      const fontFamily = style.fontFamily || "'Inter', system-ui, sans-serif";
      if (!canvas) canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const refSize = 100;
      ctx.font = `${fontWeight} ${refSize}px ${fontFamily}`;
      const textWidthAtRef = ctx.measureText(titleText).width;
      if (!textWidthAtRef) return;

      // Batas atas/bawah ukuran font supaya tetap enak dibaca di semua ukuran layar.
      const maxCap = window.innerWidth >= 1024 ? 70 : window.innerWidth >= 640 ? 58 : 38;
      const minCap = 16;

      const idealSize = (containerWidth / textWidthAtRef) * refSize * 1.0;

      if (idealSize < minCap) {
        // FIX: di lebar ini, 1 baris pada ukuran minimum yang enak dibaca sudah
        // pasti overflow — jadi izinkan wrap ke 2 baris memakai ukuran yang wajar,
        // daripada memaksa minCap dan overflow ke luar layar.
        setTitleWraps(true);
        setTitleFontSize(Math.max(20, idealSize * 1.55));
        setControlsMaxWidth(containerWidth);
        return;
      }

      setTitleWraps(false);
      const size = Math.max(minCap, Math.min(maxCap, idealSize));
      setTitleFontSize(size);

      // Lebar asli teks judul pada font-size final ini (bukan lebar container).
      const actualTitleWidth = textWidthAtRef * (size / refSize);
      // Sedikit lebih sempit (92%) dari lebar judul supaya masih ada "napas" visual,
      // tidak mepet sama persis edge-to-edge dengan huruf pertama/terakhir judul.
      setControlsMaxWidth(actualTitleWidth * 0.92);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    window.addEventListener('resize', fit);
    // FIX (mobile "koplok"): sebelumnya fit() hanya dijalankan sekali saat mount,
    // memakai font APAPUN yang sudah siap saat itu (biasanya font fallback,
    // karena 'Inter' via Google Fonts belum selesai diunduh). Hasilnya lebar yang
    // terukur lebih sempit dari lebar asli, jadi font-size yang dipilih kegedean,
    // dan begitu font Inter benar-benar tampil, judul overflow kepotong kiri-kanan.
    // Sekarang fit() dijalankan ULANG begitu semua font selesai dimuat.
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => fit());
    }
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', fit);
    };
  }, [titleText]);

  // Efek "Piramid" (makin ke bawah makin lebar):
  // 1. Yang atas paling kecil: Toggle mode pencarian (Kata Kunci / Lokasi)
  // 2. Yang kedua sedeng: Kolom input pencarian
  // 3. Yang ketiga paling besar: Banner ajakan bergabung tenaga ahli
  const descriptionMaxWidth = controlsMaxWidth;
  const toggleMaxWidth = Math.max(Math.min(controlsMaxWidth * 0.42, 340), 260);
  const searchMaxWidth = Math.max(Math.min(controlsMaxWidth * 0.72, 640), 320);
  const bannerMaxWidth = Math.max(controlsMaxWidth * 0.95, 360);

  const [isMobile, setIsMobile] = useState(() => (typeof window !== 'undefined' ? window.innerWidth < 640 : false));

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);


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

  const kategoriMatches = SEARCH_CATEGORIES.filter((c) =>
    c.title.toLowerCase().includes(kategori.trim().toLowerCase())
  );

  const locationMatches = LOCATION_SUGGESTIONS.filter((s) =>
    s.toLowerCase().includes(location.trim().toLowerCase())
  );

  useEffect(() => {
    // Fetch tenaga ahli: HANYA Tenaga Ahli Paket Eksklusif (Platinum), bukan Surveyor & bukan Paket Ekonomis
    api
      .get('/experts', {
        params: {
          role_type: 'tenaga_ahli',
          exclude_surveyor: 1,
          eksklusif_only: 1,
        },
      })
      .then((res) => {
        const rawData = Array.isArray(res.data) ? res.data : [];

        const isEksklusif = (item) => {
          const pkg = String(item.package_name || item.package?.name || item.package?.slug || '').toLowerCase();
          const mem = String(item.membership_level || '').toLowerCase();
          return Boolean(
            item.is_platinum === true ||
            pkg.includes('platinum') ||
            pkg.includes('eksklusif') ||
            pkg.includes('ekslusif') ||
            pkg.includes('esklusif') ||
            mem.includes('platinum') ||
            mem.includes('eksklusif') ||
            mem.includes('ekslusif')
          );
        };

        const popularTenagaAhliOnly = rawData.filter((item) => {
          // Hanya tenaga ahli murni: tolak jika memiliki kriteria/role/bidang surveyor
          const isSurveyor = Boolean(
            item.is_surveyor === true ||
            item.role_type === 'surveyor' ||
            item.user?.role_type === 'surveyor' ||
            String(item.kriteria || '').toLowerCase().includes('surveyor') ||
            (Array.isArray(item.kriteria_list) && item.kriteria_list.some((k) => String(k).toLowerCase().includes('surveyor'))) ||
            String(item.field || '').toLowerCase().includes('surveyor')
          );
          if (isSurveyor) return false;

          const hasTenagaAhli = Boolean(
            item.role_type === 'tenaga_ahli' ||
            item.user?.role_type === 'tenaga_ahli' ||
            String(item.kriteria || '').toLowerCase().includes('tenaga ahli') ||
            (Array.isArray(item.kriteria_list) && item.kriteria_list.some((k) => String(k).toLowerCase().includes('tenaga ahli')))
          );
          if (!hasTenagaAhli) return false;

          // HANYA PAKET EKSKLUSIF (PLATINUM) DARI DATA ASLI DATABASE
          return isEksklusif(item);
        });

        setExperts(popularTenagaAhliOnly);
        setTotalExperts(popularTenagaAhliOnly.length);
      })
      .catch((err) => {
        console.error('Gagal mengambil data tenaga ahli:', err);
        setExperts([]);
        setTotalExperts(0);
      })
      .finally(() => {
        setLoading(false);
        reportReady();
      });
  }, []);

  // Fetch artikel/berita terbaru untuk seksi berita di halaman home
  useEffect(() => {
    setArticlesLoading(true);
    api
      .get('/articles', { params: { category: 'BERITA', limit: 12 } })
      .then((res) => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          const backendBase =
            import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || '';
          const newsOnly = res.data.filter((item) => {
            const cat = String(item.category || '').toUpperCase();
            return !cat.includes('PROYEK');
          });
          const mapped = newsOnly.slice(0, 12).map((item) => {
            let thumb = item.thumbnail || item.thumbnail_url;
            if (thumb && !thumb.startsWith('http')) {
              thumb = `${backendBase}/storage/${thumb}`;
            }
            return {
              id: item.id,
              slug: item.slug || String(item.id),
              title: item.title,
              category: item.category || 'BERITA',
              source: item.source || '',
              excerpt: item.excerpt || (item.content ? item.content.slice(0, 140) + '...' : ''),
              thumbnail: thumb || DEFAULT_NEWS_IMAGE,
              published_at: item.published_at || item.created_at?.slice(0, 10) || '',
              link: `/berita/${item.slug || item.id}`,
            };
          });
          setArticles(mapped.length > 0 ? mapped : FALLBACK_ARTICLES);
        } else {
          setArticles(FALLBACK_ARTICLES);
        }
      })
      .catch(() => {
        setArticles(FALLBACK_ARTICLES);
      })
      .finally(() => {
        setArticlesLoading(false);
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
      <header className="px-0 sm:px-10 md:px-16 lg:px-20 xl:px-24 2xl:px-32 py-0 sm:py-4 pt-16 sm:pt-28" style={{ fontFamily: "'Inter', system-ui, -apple-system, sans-serif" }}>
        <section
          className="relative w-full min-h-[100dvh] sm:min-h-[600px] sm:h-[600px] rounded-none sm:rounded-[32px] overflow-hidden flex flex-col justify-center items-center px-6 sm:px-12 lg:px-24 py-12 sm:py-0 transition-all duration-700 bg-cover bg-center"
          style={{ backgroundImage: `url(${Background})` }}
        >
          {/* Overlay gelap agar teks tetap terbaca di atas background */}
          <div
            className={`absolute inset-0 z-[1] transition-opacity duration-700 ${isSearchFocused ? 'opacity-100' : 'opacity-80'}`}
            style={{ background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.3) 100%)' }}
          />
          {/* Ekstra dark overlay saat search aktif */}
          <div className={`absolute inset-0 z-[1] bg-black/40 transition-opacity duration-700 ${isSearchFocused ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} />

          {/* Semua konten hero di-center: flex column + items-center */}
          <div className="relative z-10 w-full flex flex-col items-center text-white text-center">
            {/* Teks Judul & Deskripsi */}
            <div className={`w-full flex flex-col items-center transition-all duration-700 ease-out transform ${isSearchFocused ? '-translate-y-8 opacity-0 pointer-events-none scale-95' : 'translate-y-0 opacity-100 scale-100'}`}>
              {/* BIRU - Judul: dipaksa 1 baris selama pas, font-size dihitung presisi
                  via canvas supaya selalu sesuai lebar box (titleWrapRef). Kalau di
                  layar sangat sempit 1 baris sudah pasti kepanjangan, otomatis
                  turun ke 2 baris (titleWraps) alih-alih overflow ke luar layar. */}
              <div ref={titleWrapRef} className="w-full flex justify-center mb-8 sm:mb-6 overflow-visible py-1 px-1">
                <h1
                  ref={titleRef}
                  className={`${titleWraps ? 'whitespace-normal text-balance' : 'whitespace-nowrap'} text-center font-extrabold text-white drop-shadow-lg leading-[1.25] sm:leading-[1.2] tracking-tight overflow-visible pb-1`}
                  style={{ fontSize: `${titleFontSize}px`, color: '#ffffff' }}
                >
                  <span className="text-white" style={{ color: '#ffffff' }}>
                    {titleText}
                  </span>
                </h1>
              </div>

              {/* KUNING - Deskripsi: lebar mengikuti lebar asli judul */}
              <div className="mb-8 sm:mb-10 mx-auto w-full" style={{ maxWidth: `${descriptionMaxWidth}px` }}>
                <p className="text-[15px] leading-snug sm:text-lg md:text-xl font-medium text-gray-200 sm:leading-relaxed">
                  {t('Platform pencarian tenaga ahli akademik profesional di Indonesia.')}
                </p>
                <p
                  className="text-[13px] leading-snug sm:text-base md:text-lg font-bold sm:leading-relaxed mt-2.5 tracking-wide"
                  style={{ color: '#FFD700' }}
                >
                  {t('Konsultasikan keperluan anda di tenagaahli.com')}
                </p>
              </div>
            </div>

            {/* Container Search Bar (Naik saat fokus) */}
            <div className={`transition-all duration-700 ease-out transform w-full flex flex-col items-center ${isSearchFocused ? 'sm:-translate-y-48 -translate-y-20' : 'translate-y-0'}`}>
              {/* Di mobile: Kotak transparan (glass card) pembungkus toggle, search bar, dan banner yang sejajar rapi */}
              <div
                className={`w-full flex flex-col items-center ${
                  isMobile
                    ? 'max-w-[480px] p-3.5 rounded-3xl bg-black/40 backdrop-blur-xl border border-white/20 shadow-2xl gap-3'
                    : ''
                }`}
              >
                {/* 1. ATAS - Toggle mode pencarian */}
                <div
                  ref={toggleContainerRef}
                  className={`grid grid-cols-2 items-center p-1 rounded-full relative w-full ${!isMobile ? 'mb-7' : 'mb-0'}`}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(20px)',
                    maxWidth: !isMobile ? `${toggleMaxWidth}px` : undefined,
                  }}
                >
                  {/* ✅ Pill aktif — lebar tetap 50% (grid 2 kolom), digeser pakai transform */}
                  <div
                    className="absolute top-1 bottom-1 left-1 rounded-full transition-transform duration-300 ease-out z-0 overflow-hidden"
                    style={{
                      width: 'calc(50% - 4px)',
                      transform: `translateX(${SEARCH_MODES.findIndex((m) => m.key === activeMode) * 100}%)`,
                      background: 'rgba(0,0,0,0.85)',
                      backdropFilter: 'blur(16px) saturate(180%)',
                      WebkitBackdropFilter: 'blur(16px) saturate(180%)',
                      border: '1px solid rgba(255,255,255,0.5)',
                      boxShadow: 'none',
                    }}
                  />
                  {SEARCH_MODES.map((mode) => (
                    <button
                      key={mode.key}
                      type="button"
                      onClick={() => {
                        setActiveMode(mode.key);
                        setKategoriOpen(mode.key === 'kategori');
                        setKeywordOpen(mode.key === 'keyword');
                        setLocationOpen(mode.key === 'location');
                        setIsSearchFocused(true);
                      }}
                      className={`relative z-10 px-4 sm:px-5 py-2 sm:py-2 rounded-full font-semibold text-[11px] sm:text-xs text-center whitespace-nowrap transition-colors min-h-[36px] ${
                        activeMode === mode.key ? 'text-white' : 'text-white/70 hover:bg-white/5'
                      }`}
                    >
                      {t(mode.label)}
                    </button>
                  ))}
                </div>

                {/* 2. TENGAH - Kolom pencarian */}
                <form
                  onSubmit={handleSearch}
                  className={`relative w-full ${!isMobile ? 'mb-8' : 'mb-0'}`}
                  style={{ maxWidth: !isMobile ? `${searchMaxWidth}px` : undefined }}
                  ref={kategoriBoxRef}
                >
                  <div className="flex items-center bg-white rounded-full p-1.5 sm:p-2 pr-1.5 sm:pr-2 shadow-xl w-full">
                    <input
                      className="w-full min-w-0 bg-transparent border-none focus:ring-0 text-on-background text-sm sm:text-base px-3 sm:px-6 py-2 sm:py-2 placeholder-gray-400"
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
                      className="bg-black hover:bg-gray-900 text-white flex items-center justify-center gap-2 w-10 h-10 sm:w-auto sm:px-6 sm:py-2.5 rounded-full font-semibold text-xs sm:text-sm transition-colors shrink-0"
                    >
                      <MagnifyingGlassIcon className="w-4 h-4 text-[#8B4513]" />
                      <span className="hidden sm:inline">{t('Search')}</span>
                    </button>
                  </div>

                  {/* Saran kategori muncul hanya saat mode Kategori aktif */}
                  {activeMode === 'kategori' && kategoriOpen && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1C1A17] sm:bg-[#1C1A17]/95 sm:backdrop-blur-xl rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/20 text-white max-h-[60vh] overflow-y-auto">
                      <div className="px-4 py-3 border-b border-white/10 bg-[#141210]">
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
                            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-white/10 active:bg-white/15 transition-colors ${
                              i !== arr.length - 1 ? 'border-b border-white/10' : ''
                            } ${c.title === kategori ? 'font-semibold text-[#8B4513]' : ''}`}
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
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1C1A17] sm:bg-[#1C1A17]/95 sm:backdrop-blur-xl rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/20 text-white max-h-[60vh] overflow-y-auto">
                      <div className="px-4 py-3 border-b border-white/10 bg-[#141210]">
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
                            className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-white/10 active:bg-white/15 transition-colors ${
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
                    <div className="absolute top-full left-0 right-0 mt-2 bg-[#1C1A17] sm:bg-[#1C1A17]/95 sm:backdrop-blur-xl rounded-2xl shadow-2xl z-50 overflow-hidden border border-white/20 text-white max-h-[60vh] overflow-y-auto">
                      <div className="px-4 py-3 border-b border-white/10 bg-[#141210]">
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
                          className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-white/10 active:bg-white/15 transition-colors ${
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

                {/* 3. BAWAH - Banner ajakan bergabung */}
                <div
                  className="w-full mx-auto"
                  style={{ maxWidth: isMobile ? '100%' : `${bannerMaxWidth}px` }}
                >
                  <Link
                    to={(() => {
                      try {
                        const token = localStorage.getItem('amdal_token');
                        const userRaw = localStorage.getItem('amdal_user');
                        if (!token || !userRaw) return '/daftar';
                        const user = JSON.parse(userRaw);
                        if (user.role === 'admin') return '/admin';
                        if (user.role_type === 'tenaga_ahli') return '/dashboard';
                        if (user.role_type === 'surveyor') return '/dashboard-surveyor';
                        return '/paket';
                      } catch {
                        return '/daftar';
                      }
                    })()}
                    className="group flex items-center justify-between w-full px-4 sm:px-5 py-2.5 sm:py-2.5 rounded-2xl sm:rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 hover:border-[#FFD700] transition-all duration-300 shadow-lg hover:shadow-[#FFD700]/20 hover:scale-[1.01]"
                  >
                    <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 mr-2">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-[#8B4513] to-[#5a2a0c] border border-[#FFD700]/60 flex items-center justify-center text-[#FFD700] shrink-0 group-hover:scale-110 transition-transform shadow-sm">
                        <span className="material-symbols-outlined text-[16px] sm:text-[18px]">person_add</span>
                      </div>
                      <span className="text-[11px] sm:text-xs md:text-sm font-bold text-white group-hover:text-[#FFD700] transition-colors leading-tight sm:leading-normal">
                        {t('Ingin Bergabung Menjadi Tenaga Ahli Profesional?')}
                      </span>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] sm:text-xs font-semibold bg-[#FFD700]/20 border border-[#FFD700]/50 text-white px-3 sm:px-4 py-1.5 sm:py-1.5 rounded-full group-hover:bg-[#FFD700] group-hover:text-black transition-all shrink-0 whitespace-nowrap shadow-xs">
                      <span>{t('Daftar Sekarang')}</span>
                      <span className="inline-block transition-transform group-hover:translate-x-0.5 font-bold">→</span>
                    </span>
                  </Link>
                </div>
              </div>
            </div> {/* Closing for Container Search Bar */}
          </div>
        </section>
      </header>

      {/* Keahlian Utama Section (16 Keahlian Utama dengan Dual-Track Marquee Bergeser) */}
      <section className="relative px-0 sm:px-4 md:px-8 lg:px-12 xl:px-16 pt-10 sm:pt-14 pb-6 overflow-hidden">
        {/* Ambient background glow orbs */}
        <div className="absolute top-1/2 left-10 -translate-y-1/2 w-80 h-80 bg-[#8B4513]/5 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-1/3 right-10 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Header Judul */}
          <div className="mb-6 sm:mb-8">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight">
              {t('Keahlian Utama')}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 max-w-2xl leading-relaxed">
              {t('Temukan tenaga ahli, peneliti, dan surveyor tersertifikasi berdasarkan bidang keahlian spesifik Anda.')}
            </p>
          </div>
        </div>

        {/* Dual-Track Animated Infinite Marquee Rows */}
        <div className="relative w-full overflow-hidden mask-marquee-edges pause-marquee-on-hover py-2 space-y-2.5 sm:space-y-3">
          {/* Baris 1: Bergerak ke Kiri */}
          <div className="flex animate-marquee-left gap-2.5 sm:gap-3">
            {[...MAIN_SKILLS.slice(0, 8), ...MAIN_SKILLS.slice(0, 8), ...MAIN_SKILLS.slice(0, 8)].map((skill, idx) => (
              <Link
                key={`row1-${skill.id}-${idx}`}
                to={`/daftar-profil?keahlian=${encodeURIComponent(skill.query)}`}
                className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/85 ${skill.hoverBorder} shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] text-center w-[120px] sm:w-[138px] md:w-[148px] h-[105px] sm:h-[116px] shrink-0 overflow-hidden select-none`}
              >
                {/* Shimmer sweep effect on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent transition-transform duration-700 ease-in-out pointer-events-none z-20" />

                {/* Ambient colorful card aura on hover */}
                <div className={`absolute -inset-0.5 bg-gradient-to-br ${skill.glow} rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xs -z-10`} />

                {/* Icon badge with 3D scale and gentle rotation */}
                <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${skill.color} border flex items-center justify-center mb-1.5 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md transition-all duration-300 shadow-2xs`}>
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px] drop-shadow-xs transition-transform duration-300 group-hover:scale-110">
                    {skill.icon}
                  </span>
                </div>

                {/* Skill Name */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[11px] sm:text-[11.5px] font-bold text-gray-800 group-hover:text-[#8B4513] transition-colors leading-tight line-clamp-2">
                    {t(skill.name)}
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {/* Baris 2: Bergerak ke Kanan */}
          <div className="flex animate-marquee-right gap-2.5 sm:gap-3">
            {[...MAIN_SKILLS.slice(8, 16), ...MAIN_SKILLS.slice(8, 16), ...MAIN_SKILLS.slice(8, 16)].map((skill, idx) => (
              <Link
                key={`row2-${skill.id}-${idx}`}
                to={`/daftar-profil?keahlian=${encodeURIComponent(skill.query)}`}
                className={`group relative flex flex-col items-center justify-center p-2.5 sm:p-3 rounded-xl sm:rounded-2xl bg-white/95 backdrop-blur-md border border-gray-200/85 ${skill.hoverBorder} shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:scale-[1.03] text-center w-[120px] sm:w-[138px] md:w-[148px] h-[105px] sm:h-[116px] shrink-0 overflow-hidden select-none`}
              >
                {/* Shimmer sweep effect on hover */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent transition-transform duration-700 ease-in-out pointer-events-none z-20" />

                {/* Ambient colorful card aura on hover */}
                <div className={`absolute -inset-0.5 bg-gradient-to-br ${skill.glow} rounded-xl sm:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xs -z-10`} />

                {/* Icon badge with 3D scale and gentle rotation */}
                <div className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-gradient-to-br ${skill.color} border flex items-center justify-center mb-1.5 group-hover:scale-110 group-hover:-rotate-3 group-hover:shadow-md transition-all duration-300 shadow-2xs`}>
                  <span className="material-symbols-outlined text-[20px] sm:text-[22px] drop-shadow-xs transition-transform duration-300 group-hover:scale-110">
                    {skill.icon}
                  </span>
                </div>

                {/* Skill Name */}
                <div className="flex flex-col items-center justify-center px-1">
                  <span className="text-[11px] sm:text-[11.5px] font-bold text-gray-800 group-hover:text-[#8B4513] transition-colors leading-tight line-clamp-2">
                    {t(skill.name)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Banner Slider */}
      <section className="pt-8 pb-4">
        <HeroSlider />
      </section>

      {/* Kategori Section - Horizontal scroll di mobile, grid di desktop */}
      <section className="py-14 sm:py-20">
        <div className="max-w-container-max mx-auto">
          <div className="text-center mb-8 sm:mb-12 px-6">
            <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-background mb-2">{t('Telusuri Tenaga Ahli')}</h2>
            <p className="text-on-surface-variant text-sm sm:text-base">{t('Cari Berdasarkan Kategori Keahlian')}</p>
          </div>
          
          {/* Mobile: Horizontal scroll */}
          <div className="md:hidden overflow-x-auto scrollbar-hide -mx-0 px-6 scroll-smooth">
            <div className="flex gap-4 min-w-max pb-1">
              {categories.map((cat) => (
                <Link to={cat.to} key={cat.title} className="relative w-[260px] h-52 rounded-lg overflow-hidden group cursor-pointer block flex-shrink-0">
                  <img src={cat.img} alt={cat.title} className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                  <div className={`absolute inset-0 ${cat.overlay} flex flex-col items-center justify-center text-white p-6`}>
                    <div className="relative w-12 h-12 mb-3 flex items-center justify-center">
                      <cat.MainIcon className="w-full h-full drop-shadow-md text-white" />
                      {cat.BadgeIcon && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white text-[#8B4513] shadow-md flex items-center justify-center border border-white/90">
                          <cat.BadgeIcon className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-headline-md text-base text-center">{t(cat.title)}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Desktop: Grid layout (3 Kolom Seimbang) */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8 px-margin-desktop">
            {categories.map((cat) => (
              <Link
                to={cat.to}
                key={cat.title}
                className="relative h-64 lg:h-72 rounded-2xl overflow-hidden group cursor-pointer block shadow-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100"
              >
                <img
                  src={cat.img}
                  alt={cat.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className={`absolute inset-0 ${cat.overlay} flex flex-col items-center justify-center text-white p-6`}>
                  <div className="relative w-14 h-14 mb-4 flex items-center justify-center">
                    <cat.MainIcon className="w-full h-full drop-shadow-md text-white group-hover:scale-105 transition-transform duration-300" />
                    {cat.BadgeIcon && (
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white text-[#8B4513] shadow-lg flex items-center justify-center border-2 border-white/90">
                        <cat.BadgeIcon className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                  <h3 className="font-headline-md text-xl lg:text-2xl text-center font-bold tracking-tight">{t(cat.title)}</h3>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Layanan Unggulan Section */}
      <section className="py-16 sm:py-24 bg-white overflow-hidden">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop">
          <div className="text-center mb-10 sm:mb-16">
            <h2 className="font-headline-lg text-xl sm:text-headline-lg text-on-background mb-2">{t('Tenaga Ahli Terpopuler')}</h2>
            <p className="text-on-surface-variant text-sm sm:text-base">{t('home.verified_experts_desc', 'Lihat Lebih Detail Tentang Keahlian mereka.')}</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 gap-3">
              <div className="block sm:hidden">
                <GraduationCapLoader size={80} duration={2.2} cap="#8B4513" shade="#5C2D0C" tassel="#E0A040" />
              </div>
              <div className="hidden sm:block">
                <GraduationCapLoader size={100} duration={2.2} cap="#8B4513" shade="#5C2D0C" tassel="#E0A040" />
              </div>
              <span className="text-[#5B6660] text-xs sm:text-sm font-medium animate-pulse">{t('Memuat...')}</span>
            </div>
          ) : experts.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-full bg-[#F5F4F0] flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-3xl text-[#5B6660]/40">group</span>
              </div>
              <p className="text-on-surface-variant">{t('Tidak ada hasil ditemukan')}</p>
            </div>
          ) : (
            <>
              {/* Paginated Card Slider with Side Navigation */}
              <div className="relative">
                {/* Left Arrow */}
                {totalPages > 1 && (
                  <button
                    onClick={prevPage}
                    disabled={currentPage === 0}
                    className={`flex absolute -left-3 sm:-left-5 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-white border border-gray-200/80 items-center justify-center shadow-md transition-all duration-200 ${
                      currentPage === 0
                        ? 'opacity-30 cursor-not-allowed text-gray-300 pointer-events-none'
                        : 'hover:shadow-lg hover:scale-105 active:scale-95 text-gray-700 hover:text-[#8B4513]'
                    }`}
                    aria-label="Halaman Sebelumnya"
                  >
                    <span className="material-symbols-outlined text-xl sm:text-2xl">chevron_left</span>
                  </button>
                )}

                {/* Right Arrow */}
                {totalPages > 1 && (
                  <button
                    onClick={nextPage}
                    disabled={currentPage >= totalPages - 1}
                    className={`flex absolute -right-3 sm:-right-5 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-10 h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-white border border-gray-200/80 items-center justify-center shadow-md transition-all duration-200 ${
                      currentPage >= totalPages - 1
                        ? 'opacity-30 cursor-not-allowed text-gray-300 pointer-events-none'
                        : 'hover:shadow-lg hover:scale-105 active:scale-95 text-gray-700 hover:text-[#8B4513]'
                    }`}
                    aria-label="Halaman Berikutnya"
                  >
                    <span className="material-symbols-outlined text-xl sm:text-2xl">chevron_right</span>
                  </button>
                )}

                {/* Page Slides Track */}
                <div
                  className="overflow-hidden py-2"
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                >
                  <div
                    className="flex transition-transform duration-500 ease-in-out will-change-transform"
                    style={{
                      transform: `translateX(-${currentPage * 100}%)`,
                    }}
                  >
                    {pages.map((pageExperts, pageIdx) => (
                      <div
                        key={pageIdx}
                        className="w-full shrink-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-1"
                      >
                        {pageExperts.map((expert) => (
                          <div key={expert.id} className="w-full">
                            <ExpertCard expert={expert} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Page Controls: Numbers 1, 2, etc. */}
              {totalPages > 1 && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-8">
                  {pages.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i)}
                      className={`w-9 h-9 rounded-full text-xs font-bold transition-all duration-300 flex items-center justify-center ${
                        i === currentPage
                          ? 'bg-[#8B4513] text-white shadow-md scale-110 ring-2 ring-[#8B4513]/20'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900'
                      }`}
                      aria-label={`Halaman ${i + 1}`}
                    >
                      <span>{i + 1}</span>
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* ── BERITA & INFORMASI TERKINI SECTION (INFINITE RUNNING MARQUEE) ── */}
      <section className="relative py-16 sm:py-24 bg-[#FAF7F2] border-t border-[#EFE8DF] overflow-hidden select-none">
        {/* Ambient Decorative Light Orbs */}
        <div
          className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-400/[0.08] blur-3xl pointer-events-none animate-pulse"
          style={{ animationDuration: '6s' }}
        />
        <div
          className="absolute -bottom-24 -right-24 w-[420px] h-[420px] rounded-full bg-[#8B4513]/[0.07] blur-3xl pointer-events-none animate-pulse"
          style={{ animationDuration: '8s' }}
        />

        <div className="relative max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop mb-8 sm:mb-12">
          {/* Header */}
          <div>
            <h2 className="font-headline-lg text-2xl sm:text-headline-lg text-on-background">
              {t('Berita Terkini')}
            </h2>
            <p className="text-on-surface-variant text-sm sm:text-base mt-2 max-w-xl">
              {t('Ikuti perkembangan industri, riset kebijakan, serta berita terbaru seputar tenaga ahli akademik terpercaya.')}
            </p>
          </div>
        </div>

        {/* ── CONTINUOUS INFINITE SLIDING MARQUEE TRACK ── */}
        <div className="relative w-full overflow-hidden mask-marquee-edges pause-marquee-on-hover py-4">
          <div
            className="flex animate-marquee-left gap-6 sm:gap-7"
            style={{ animationDuration: '55s' }}
          >
            {marqueeArticles.map((item, idx) => {
              const itemLink = item.link || `/berita/${item.slug}`;
              return (
                <Link
                  key={`news-marquee-${item.id}-${idx}`}
                  to={itemLink}
                  className="group relative bg-white rounded-3xl overflow-hidden border border-stone-200/90 hover:border-[#8B4513]/50 shadow-xs hover:shadow-2xl hover:shadow-[#8B4513]/15 transition-all duration-500 ease-out flex flex-col h-full hover:-translate-y-2.5 cursor-pointer w-[310px] sm:w-[350px] md:w-[380px] shrink-0"
                >
                {/* Bottom Animated Accent Gradient Bar */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-[#8B4513] via-amber-500 to-[#8B4513] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 ease-out origin-left z-20" />

                {/* Thumbnail Image Container */}
                <div className="relative h-48 sm:h-52 w-full overflow-hidden bg-stone-100">
                  <img
                    src={item.thumbnail || DEFAULT_NEWS_IMAGE}
                    alt={item.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_NEWS_IMAGE;
                    }}
                    className="w-full h-full object-cover scale-100 group-hover:scale-110 transition-transform duration-700 ease-out"
                  />

                  {/* Glossy Reflection Light Sweep on Hover */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none z-10" />

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

                  {/* Floating Center View Icon on Hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                    <span className="w-11 h-11 rounded-full bg-white/90 backdrop-blur-md text-[#8B4513] shadow-lg flex items-center justify-center transform scale-75 group-hover:scale-100 transition-transform duration-300">
                      <span className="material-symbols-outlined text-xl">visibility</span>
                    </span>
                  </div>

                  {/* Category Floating Pill */}
                  <div className="absolute top-3.5 left-3.5 z-10">
                    <span className="inline-block text-[10px] font-bold text-white bg-gradient-to-r from-[#8B4513] to-[#A0522D] shadow-md px-3 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border border-white/20">
                      {item.category || 'BERITA'}
                    </span>
                  </div>

                  {/* Glassmorphic Date Badge */}
                  {item.published_at && (
                    <div className="absolute top-3.5 right-3.5 z-10 inline-flex items-center gap-1.5 bg-white/85 backdrop-blur-md text-stone-700 text-[11px] font-medium px-2.5 py-1 rounded-full shadow-xs border border-white/60 group-hover:bg-white transition-colors duration-300">
                      <span className="material-symbols-outlined text-[13px] text-[#8B4513]">calendar_today</span>
                      <span>{formatNewsDate(item.published_at)}</span>
                    </div>
                  )}
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 flex flex-col flex-1">
                  {item.source && (
                    <div className="text-[11px] font-medium text-stone-400 mb-2.5 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[13px] text-[#8B4513]/70">bookmark</span>
                      <span>{t('Sumber')}: <strong className="text-stone-700 font-semibold">{item.source}</strong></span>
                    </div>
                  )}

                  <h3 className="text-base sm:text-lg font-bold text-stone-900 group-hover:text-[#8B4513] transition-colors duration-300 line-clamp-2 leading-snug mb-2.5">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-stone-500 line-clamp-3 leading-relaxed mb-5 flex-1">
                    {item.excerpt}
                  </p>

                  {/* Interactive Animated Action Footer */}
                  <div className="pt-4 border-t border-stone-100 flex items-center justify-between mt-auto">
                    <span className="text-xs font-bold text-[#8B4513] inline-flex items-center gap-1.5 group-hover:gap-2.5 transition-all duration-300">
                      <span>{t('Baca Selengkapnya')}</span>
                      <span className="w-6 h-6 rounded-full bg-[#8B4513]/10 text-[#8B4513] group-hover:bg-[#8B4513] group-hover:text-white flex items-center justify-center transition-all duration-300 group-hover:translate-x-1 shadow-2xs">
                        <span className="material-symbols-outlined text-[13px]">arrow_forward</span>
                      </span>
                    </span>

                    <span className="text-[11px] text-stone-400 font-medium group-hover:text-stone-600 transition-colors">
                      3 {t('mnt baca')}
                    </span>
                  </div>
                </div>
                </Link>
              );
            })}
          </div>
        </div>

      </section>
    </>
  );
}