import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import { usePageLoading } from '../context/LoadingContext.jsx';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';
import {
  MagnifyingGlassIcon,
  MapPinIcon,
  StarIcon,
  ArrowPathIcon,
  XMarkIcon,
  FunnelIcon,
  UserGroupIcon,
  MapIcon,
  IdentificationIcon,
} from '@heroicons/react/24/outline';
import heroTenagaAhli from '../assets/ahli.png';
import heroSurveyor from '../assets/surveyor.jpg';
import heroTenagaTeknis from '../assets/tenaga-teknis.jpg';
import { getMediaUrl, getDefaultCover, getDefaultPhoto } from '../utils/media.js';
import ExpertCard from '../components/ExpertCard.jsx';

/* ─── Fallback data (dikosongkan agar hanya data asli dari database yang tampil) ─── */
const FALLBACK_TENAGA_AHLI = [];
const FALLBACK_SURVEYOR = [];
const FALLBACK_TENAGA_TEKNIS = [];

/* ─── Konfigurasi per role ─── */
const ROLE_CONFIG = {
  'tenaga-ahli': {
    title: 'Tenaga Ahli',
    subtitle: 'Temukan tenaga ahli profesional yang berpengalaman di berbagai bidang.',
    Icon: UserGroupIcon,
    kriteria: 'Tenaga Ahli',
    fallback: FALLBACK_TENAGA_AHLI,
    gradientFrom: '#55290A',
    gradientTo: '#8B4513',
    heroImage: heroTenagaAhli,
  },
  'tenaga-teknis': {
    title: 'Tenaga Teknis',
    subtitle: 'Temukan tenaga teknis terampil dan berpengalaman untuk mendukung operasional proyek, survei teknis, dan pekerjaan lapangan Anda.',
    Icon: IdentificationIcon,
    kriteria: 'Tenaga Teknis',
    fallback: FALLBACK_TENAGA_TEKNIS,
    gradientFrom: '#042f2e',
    gradientTo: '#0d9488',
    heroImage: heroTenagaTeknis,
  },
  surveyor: {
    title: 'Surveyor',
    subtitle: 'Jelajahi surveyor berpengalaman dalam pemetaan, topografi, GIS, LiDAR, dan berbagai keahlian survei profesional lainnya.',
    Icon: MapIcon,
    kriteria: 'Surveyor',
    fallback: FALLBACK_SURVEYOR,
    gradientFrom: '#1a365d',
    gradientTo: '#2b6cb0',
    heroImage: heroSurveyor,
  },
};

/* ─── Status filter ─── */
const STATUS_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'eksklusif', label: 'Eksklusif' },
  { key: 'ekonomis', label: 'Ekonomis' },
  { key: 'free', label: 'Umum' },
];
  
/* ─── Sort ─── */
const SORT_OPTIONS = [
  { key: 'latest', label: 'Terbaru' },
  { key: 'top_rated', label: 'Rating Tertinggi' },
  { key: 'random', label: 'Acak' },
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ═══════════════════════════════════════════════════════════ */

/* ─── 16 Keahlian Utama ─── */
const MAIN_SKILLS = [
  { name: 'GIS', query: 'GIS', icon: 'public' },
  { name: 'Sistem Dinamik', query: 'Sistem Dinamik', icon: 'hub' },
  { name: 'Ekonomi', query: 'Ekonomi', icon: 'trending_up' },
  { name: 'Hukum', query: 'Hukum', icon: 'gavel' },
  { name: 'Perencanaan Wilayah', query: 'Perencanaan Wilayah', icon: 'map' },
  { name: 'Lingkungan', query: 'Lingkungan', icon: 'eco' },
  { name: 'Sipil', query: 'Sipil', icon: 'engineering' },
  { name: 'Sosial', query: 'Sosial', icon: 'groups' },
  { name: 'Geologi', query: 'Geologi', icon: 'landscape' },
  { name: 'Remote Sensing', query: 'Remote Sensing', icon: 'satellite_alt' },
  { name: 'Pertambangan', query: 'Pertambangan', icon: 'hardware' },
  { name: 'Arsitek', query: 'Arsitek', icon: 'architecture' },
  { name: 'Perikanan', query: 'Perikanan', icon: 'phishing' },
  { name: 'Pertanian', query: 'Pertanian', icon: 'agriculture' },
  { name: 'Statistik', query: 'Statistik', icon: 'analytics' },
  { name: 'Meteorologi & Klimatologi', query: 'Meteorologi & Klimatologi', icon: 'partly_cloudy_day' },
];

/* ═══════════════════════════════════════════════════════════ */
export default function DaftarProfil() {
  const { t } = useTranslation();
  const loc = useLocation();
  const { reportReady } = usePageLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  // Deteksi role dari pathname atau query param
  const role = loc.pathname.includes('surveyor')
    ? 'surveyor'
    : (loc.pathname.includes('daftar-teknis') || loc.pathname.includes('daftar-tenaga-teknis') || loc.pathname.includes('tenaga-teknis') || searchParams.get('role') === 'tenaga_teknis' || searchParams.get('role') === 'tenaga-teknis' || searchParams.get('kriteria') === 'Tenaga Teknis')
    ? 'tenaga-teknis'
    : 'tenaga-ahli';
  const config = ROLE_CONFIG[role] || ROLE_CONFIG['tenaga-ahli'];

  // State
  const initialKeahlian = searchParams.get('keahlian') || searchParams.get('bidang') || '';
  const initialKeyword = searchParams.get('keyword') || '';

  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(initialKeyword);
  const [selectedKeahlian, setSelectedKeahlian] = useState(initialKeahlian);
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sort, setSort] = useState(searchParams.get('order') || 'latest');

  // Fetch data
  useEffect(() => {
    setLoading(true);

    const params = {
      kriteria: config.kriteria,
      role_type: role === 'tenaga-ahli' ? 'tenaga_ahli' : (role === 'tenaga-teknis' ? 'tenaga_teknis' : 'surveyor'),
    };
    const kw = searchParams.get('keyword');
    const k = searchParams.get('keahlian') || searchParams.get('bidang');
    if (kw) params.keyword = kw;
    if (k) params.keahlian = k;
    if (searchParams.get('pendidikan')) params.pendidikan = searchParams.get('pendidikan');
    if (searchParams.get('experience')) params.experience = searchParams.get('experience');
    if (searchParams.get('order')) params.order = searchParams.get('order');

    api
      .get('/experts', { params })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        setExperts(data);
      })
      .catch(() => setExperts([]))
      .finally(() => {
        setLoading(false);
        reportReady();
      });
  }, [searchParams, config.kriteria, role, reportReady]);

  // Reset state when role or searchParams change
  useEffect(() => {
    const k = searchParams.get('keahlian') || searchParams.get('bidang') || '';
    const kw = searchParams.get('keyword') || '';
    setKeyword(kw);
    setSelectedKeahlian(k);
    setStatusFilter(searchParams.get('status') || 'all');
    setSort(searchParams.get('order') || 'latest');
  }, [role, searchParams]);

  // Client-side filtering
  const filteredExperts = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const kFilter = selectedKeahlian.trim().toLowerCase();

    return experts.filter((e) => {
      const keahlianStr = Array.isArray(e.keahlian)
        ? e.keahlian.join(' ')
        : (typeof e.keahlian === 'string' ? e.keahlian : '');

      const hashtagStr = Array.isArray(e.hashtags)
        ? e.hashtags.map(h => `#${h} ${h}`).join(' ')
        : (typeof e.hashtags === 'string' ? e.hashtags : '');

      const allSkillsStr = [
        e.field || '',
        keahlianStr,
        hashtagStr,
        Array.isArray(e.skills) ? e.skills.join(' ') : '',
        Array.isArray(e.keahlian_list) ? e.keahlian_list.join(' ') : '',
        e.bidang || '',
        Array.isArray(e.bidang_keahlian) ? e.bidang_keahlian.join(' ') : '',
        Array.isArray(e.sub_keahlian) ? e.sub_keahlian.join(' ') : '',
      ].join(' ').toLowerCase();

      const matchKw =
        !kw ||
        String(e.name || '').toLowerCase().includes(kw) ||
        String(e.field || '').toLowerCase().includes(kw) ||
        keahlianStr.toLowerCase().includes(kw) ||
        hashtagStr.toLowerCase().includes(kw) ||
        allSkillsStr.includes(kw) ||
        String(e.location || '').toLowerCase().includes(kw);

      const matchKeahlian =
        !kFilter ||
        allSkillsStr.includes(kFilter) ||
        String(e.field || '').toLowerCase().includes(kFilter) ||
        keahlianStr.toLowerCase().includes(kFilter) ||
        String(e.name || '').toLowerCase().includes(kFilter) ||
        (kFilter.includes('dinamik') && (allSkillsStr.includes('dinamik') || allSkillsStr.includes('dynamics'))) ||
        (kFilter.includes('perencanaan wilayah') && (allSkillsStr.includes('perencanaan wilayah') || allSkillsStr.includes('perancangan wilayah') || allSkillsStr.includes('tata ruang') || allSkillsStr.includes('pwk') || allSkillsStr.includes('planologi'))) ||
        (kFilter.includes('remote sensing') && (allSkillsStr.includes('remote sensing') || allSkillsStr.includes('penginderaan jauh'))) ||
        (kFilter.includes('meteorologi') && (allSkillsStr.includes('meteorologi') || allSkillsStr.includes('klimatologi') || allSkillsStr.includes('iklim')));

      const pkgName = String(e.package_name || e.package?.name || e.package?.slug || '').toLowerCase();
      const memLevel = String(e.membership_level || '').toLowerCase();
      const isPlat = Boolean(e.is_platinum || pkgName.includes('platinum') || pkgName.includes('eksklusif') || pkgName.includes('ekslusif') || pkgName.includes('esklusif') || memLevel.includes('platinum') || memLevel.includes('eksklusif') || memLevel.includes('ekslusif'));
      const isPrem = Boolean(isPlat || e.is_premium || pkgName.includes('premium') || pkgName.includes('ekonomis') || memLevel.includes('premium') || memLevel.includes('ekonomis') || (e.package_id && Number(e.package_id) > 1) || (e.package && e.package.price > 0) || e.featured);

      let matchStatus = true;
      if (statusFilter === 'platinum' || statusFilter === 'eksklusif' || statusFilter === 'ekslusif' || statusFilter === 'esklusif') {
        matchStatus = isPlat;
      } else if (statusFilter === 'ekonomis' || statusFilter === 'premium' || statusFilter === 'verified') {
        matchStatus = !isPlat && isPrem;
      } else if (statusFilter === 'free' || statusFilter === 'umum') {
        matchStatus = !isPlat && !isPrem;
      }

      return matchKw && matchKeahlian && matchStatus;
    });
  }, [experts, keyword, selectedKeahlian, statusFilter]);

  // Sorting: Prioritize Eksklusif > Ekonomis > Free on latest
  const sortedExperts = useMemo(() => {
    const getWeight = (e) => {
      const pkg = String(e.package_name || e.package?.name || e.package?.slug || '').toLowerCase();
      const mem = String(e.membership_level || '').toLowerCase();
      if (e.is_platinum || pkg.includes('platinum') || pkg.includes('eksklusif') || pkg.includes('ekslusif') || pkg.includes('esklusif') || mem.includes('platinum') || mem.includes('eksklusif') || mem.includes('ekslusif')) return 2;
      if (e.is_premium || pkg.includes('premium') || pkg.includes('ekonomis') || mem.includes('premium') || mem.includes('ekonomis') || (e.package_id && Number(e.package_id) > 1) || (e.package && e.package.price > 0) || e.featured) return 1;
      return 0;
    };

    if (sort === 'top_rated') return [...filteredExperts].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    if (sort === 'random') return shuffle(filteredExperts);
    return [...filteredExperts].sort((a, b) => getWeight(b) - getWeight(a));
  }, [filteredExperts, sort]);

  // Handlers
  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (keyword.trim()) params.keyword = keyword.trim();
    if (selectedKeahlian) params.keahlian = selectedKeahlian;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (sort !== 'latest') params.order = sort;
    setSearchParams(params);
  };

  const handleKeahlianClick = (query) => {
    const next = selectedKeahlian.toLowerCase() === query.toLowerCase() ? '' : query;
    setSelectedKeahlian(next);
    const params = {};
    if (keyword.trim()) params.keyword = keyword.trim();
    if (next) params.keahlian = next;
    if (statusFilter !== 'all') params.status = statusFilter;
    if (sort !== 'latest') params.order = sort;
    setSearchParams(params);
  };

  const handleReset = () => {
    setKeyword('');
    setSelectedKeahlian('');
    setStatusFilter('all');
    setSort('latest');
    setSearchParams({});
  };

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#FDFBF9]">
      {/* ── HERO HEADER ─────────────────────────────────────── */}
      <section className="relative overflow-hidden pt-28 md:pt-36 pb-16 md:pb-24">
        {/* Foto background */}
        <div className="absolute inset-0">
          <img
            src={config.heroImage}
            alt=""
            className="w-full h-full object-cover"
          />
          {/* Overlay gradient warna brand di atas foto, supaya teks tetap kontras & sesuai identitas */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(135deg, ${config.gradientFrom}CC 0%, ${config.gradientTo}99 50%, ${config.gradientFrom}CC 100%)`,
            }}
          />
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] rounded-full opacity-[0.07] bg-white" />
          <div className="absolute -bottom-1/3 -left-1/4 w-[500px] h-[500px] rounded-full opacity-[0.05] bg-white" />
          <svg className="absolute bottom-0 left-0 w-full text-[#FDFBF9]" viewBox="0 0 1440 100" fill="currentColor" preserveAspectRatio="none">
            <path d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,64C960,53,1056,43,1152,42.7C1248,43,1344,53,1392,58.7L1440,64L1440,100L0,100Z" />
          </svg>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-12 text-center">
          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            {t(config.title)}
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            {t(config.subtitle)}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t(`Cari nama, keahlian, atau lokasi ${config.title.toLowerCase()}...`)}
                className="w-full pl-11 pr-24 py-3.5 sm:py-4 rounded-2xl bg-white/95 backdrop-blur-sm text-sm text-gray-800 placeholder-gray-400 shadow-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-white/40 transition-all"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="absolute right-16 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#8B4513] hover:bg-[#6B3410] text-white px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-colors"
              >
                {t('Cari')}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* ── FILTERS & GRID ─────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-3.5 sm:px-6 md:px-12 -mt-4 relative z-20">
        {/* Filter Bar Card (Status + 16 Keahlian Utama) */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-3.5 sm:p-5 flex flex-col gap-3.5 w-full min-w-0 overflow-hidden">
          {/* Baris 1: Status Filter & Sort */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 w-full min-w-0">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 w-full sm:w-auto min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <FunnelIcon className="w-4 h-4 text-[#8B4513]" />
                <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t('Status')}:</span>
              </div>
              <div className="flex items-center gap-1 sm:gap-1.5 bg-gray-50 p-1 rounded-xl w-full sm:w-auto min-w-0 overflow-x-auto no-scrollbar max-w-full">
                {STATUS_FILTERS.map((f) => (
                  <button
                    key={f.key}
                    type="button"
                    onClick={() => setStatusFilter(f.key)}
                    className={`flex-1 sm:flex-initial text-center px-2.5 sm:px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                      statusFilter === f.key
                        ? 'bg-[#8B4513] text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    {t(f.label)}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-between sm:justify-end pt-1 sm:pt-0">
              {/* Sort dropdown */}
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="flex-1 sm:flex-initial text-xs bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513] cursor-pointer"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.key} value={o.key}>
                    {t(o.label)}
                  </option>
                ))}
              </select>

              {(keyword || selectedKeahlian || statusFilter !== 'all' || sort !== 'latest') && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-[#8B4513] hover:underline font-semibold flex items-center gap-1 cursor-pointer shrink-0"
                >
                  <ArrowPathIcon className="w-3.5 h-3.5" />
                  {t('Reset')}
                </button>
              )}
            </div>
          </div>

          {/* Garis Pemisah Halus */}
          <div className="h-px bg-gray-100 w-full" />

          {/* Baris 2: 16 Keahlian Utama Chip Ribbon */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3.5 w-full min-w-0">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="material-symbols-outlined text-[17px] text-[#8B4513]">workspace_premium</span>
              <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">{t('Keahlian')}:</span>
            </div>

            {/* Scrollable Chip Ribbon */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-1 w-full min-w-0 scroll-smooth">
              {/* Tombol Semua Keahlian */}
              <button
                type="button"
                onClick={() => handleKeahlianClick('')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                  !selectedKeahlian
                    ? 'bg-[#8B4513] text-white shadow-xs ring-2 ring-[#8B4513]/20'
                    : 'bg-gray-50 text-gray-600 hover:bg-[#F5EBE1]/70 hover:text-[#8B4513] border border-gray-200/70'
                }`}
              >
                <span className="material-symbols-outlined text-[15px]">apps</span>
                <span>{t('Semua Keahlian')}</span>
              </button>

              {/* 16 Chips Keahlian */}
              {MAIN_SKILLS.map((skill) => {
                const isSelected =
                  selectedKeahlian.toLowerCase() === skill.query.toLowerCase() ||
                  selectedKeahlian.toLowerCase() === skill.name.toLowerCase();
                return (
                  <button
                    key={skill.name}
                    type="button"
                    onClick={() => handleKeahlianClick(skill.query)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-[#8B4513] text-white shadow-xs ring-2 ring-[#8B4513]/25'
                        : 'bg-gray-50 text-gray-700 hover:bg-[#F5EBE1]/70 hover:text-[#8B4513] border border-gray-200/70'
                    }`}
                  >
                    <span
                      className={`material-symbols-outlined text-[16px] shrink-0 transition-transform duration-200 ${
                        isSelected ? 'text-white scale-110' : 'text-[#8B4513]/70 group-hover:scale-110'
                      }`}
                    >
                      {skill.icon}
                    </span>
                    <span>{t(skill.name)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Result Count & Active Filter Tags */}
        <div className="mt-6 mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <p className="text-sm text-gray-600">
              {t('Menampilkan')}{' '}
              <b className="text-gray-900">{sortedExperts.length}</b>{' '}
              {t('profil')} {t(config.title.toLowerCase())}
            </p>
            {selectedKeahlian && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[#8B4513]/10 text-[#8B4513] border border-[#8B4513]/20 shadow-2xs animate-fadeIn">
                <span>{t('Keahlian')}: {selectedKeahlian}</span>
                <button
                  type="button"
                  onClick={() => handleKeahlianClick(selectedKeahlian)}
                  className="hover:text-red-600 transition-colors cursor-pointer flex items-center"
                  title={t('Hapus filter keahlian')}
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
            {keyword && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs animate-fadeIn">
                <span>{t('Kata Kunci')}: &quot;{keyword}&quot;</span>
                <button
                  type="button"
                  onClick={() => {
                    setKeyword('');
                    const params = {};
                    if (selectedKeahlian) params.keahlian = selectedKeahlian;
                    if (statusFilter !== 'all') params.status = statusFilter;
                    if (sort !== 'latest') params.order = sort;
                    setSearchParams(params);
                  }}
                  className="hover:text-red-600 transition-colors cursor-pointer flex items-center"
                  title={t('Hapus kata kunci')}
                >
                  <XMarkIcon className="w-3.5 h-3.5" />
                </button>
              </span>
            )}
          </div>
        </div>

        {/* ── LOADING SKELETON ──────────────────────────── */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="rounded-2xl border border-gray-100 bg-white overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-200" />
                <div className="p-5">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── EMPTY STATE ───────────────────────────────── */}
        {!loading && sortedExperts.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-gray-300 mb-5">
              <MagnifyingGlassIcon className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              {t(`Tidak ada ${config.title.toLowerCase()} yang ditemukan`)}
            </h3>
            <p className="text-sm text-gray-500 max-w-md mt-2 mb-6">
              {t('Coba ubah kata kunci pencarian atau filter status Anda.')}
            </p>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-[#8B4513] text-white rounded-xl text-sm font-semibold hover:bg-[#6B3410] transition-colors"
            >
              {t('Reset Filter')}
            </button>
          </div>
        )}

        {/* ── PROFILE GRID ──────────────────────────────── */}
        {!loading && sortedExperts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
            {sortedExperts.map((expert) => (
              <ExpertCard
                key={expert.id}
                expert={expert}
                variant="grid"
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}