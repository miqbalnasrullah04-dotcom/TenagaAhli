import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import NavbarBackground from '../components/NavbarBackground.jsx';
import { usePageLoading } from '../context/LoadingContext.jsx';
import { getMediaUrl, getDefaultCover, getDefaultPhoto } from '../utils/media.js';
import { createExpertMapIcon, createExpertClusterGroup, getExpertPopupHtml } from '../utils/mapMarker.js';
import { getCoordinatesFromLocation } from '../utils/indonesiaGeo.js';
import ConsultationMedalBadge, { hasActiveMedal } from '../components/ConsultationMedalBadge.jsx';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  MapPinIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  MapIcon,
  ListBulletIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

const getOrderOptions = (t) => [
  { value: 'latest', label: t('Terbaru') },
  { value: 'top_rated', label: t('Rating Tertinggi') },
  { value: 'random', label: t('Acak') },
];

const KRITERIA_SUGGESTIONS = [
  'Surveyor',
  'Tenaga Ahli',
  'Tenaga Teknis',
];

const PENDIDIKAN_SUGGESTIONS = [
  'S3 / Doktor',
  'S2 / Magister',
  'S1 / Sarjana',
  'D4 / Sarjana Terapan',
  'D3 / Diploma',
  'Profesi / Spesialis',
  'SMA / SMK',
];

const KEAHLIAN_SUGGESTIONS = [
  'Topografi',
  'GIS & Pemetaan',
  'Drone & Fotogrametri',
  'LiDAR',
  'Batimetri & Hidrografi',
  'Survey Geologi',
  'Geodesi',
  'Survey Kadastral / BPN',
  'Survey Seismik',
  'Pemetaan Lingkungan',
  'GPS Geodetik / RTK',
  'Total Station & Teodolit',
  'UAV Mapping',
  'AMDAL',
];

const LOCATION_SUGGESTIONS = [
  'Jakarta',
  'Bandung',
  'Surabaya',
  'Semarang',
  'Yogyakarta',
  'Medan',
  'Makassar',
  'Palembang',
  'Balikpapan',
  'Denpasar',
];

function getHighestEdu(expert) {
  if (expert.pendidikan_tertinggi) return expert.pendidikan_tertinggi;
  if (expert.highest_education?.jenjang) return expert.highest_education.jenjang;

  const edus = Array.isArray(expert.educations)
    ? expert.educations
    : (Array.isArray(expert.pendidikan) ? expert.pendidikan : []);

  if (edus.length > 0) {
    const getWeight = (jenjang) => {
      const j = String(jenjang || '').toLowerCase();
      if (j.includes('s3') || j.includes('doktor') || j.includes('phd') || j.includes('ph.d')) return 5;
      if (j.includes('s2') || j.includes('magister') || j.includes('master') || j.includes('spesialis')) return 4;
      if (j.includes('s1') || j.includes('sarjana') || j.includes('d4')) return 3;
      if (j.includes('d3') || j.includes('diploma') || j.includes('ahli madya')) return 2;
      if (j.includes('sma') || j.includes('smk')) return 1;
      return 0;
    };

    const sorted = [...edus].sort((a, b) => {
      const diff = getWeight(b.jenjang || b.degree) - getWeight(a.jenjang || a.degree);
      if (diff !== 0) return diff;
      return (Number(b.tahun_lulus || b.year) || 0) - (Number(a.tahun_lulus || a.year) || 0);
    });

    const top = sorted[0];
    if (top?.jenjang || top?.degree) {
      return top.jenjang || top.degree;
    }
  }

  if (typeof expert.pendidikan === 'string' && expert.pendidikan.trim()) {
    return expert.pendidikan.trim();
  }

  const name = String(expert.name || '');
  if (/\b(prof\.|dr\.|doktor|ph\.?d)/i.test(name)) return 'S3';
  if (/\b(m\.[a-z]+|magister|master|sp\.[a-z]+)/i.test(name)) return 'S2';
  if (/\b(s\.[a-z]+|sarjana|d4)/i.test(name)) return 'S1';
  if (/\b(a\.md|d3)/i.test(name)) return 'D3';

  return null;
}

function getExpYears(e) {
  if (!e) return 0;
  if (e.years_experience !== undefined && e.years_experience !== null && e.years_experience !== '') return Number(e.years_experience);
  if (e.active_since) {
    const y = parseInt(e.active_since, 10);
    if (!isNaN(y) && y > 1900) return Math.max(0, new Date().getFullYear() - y);
  }
  if (Array.isArray(e.experiences) && e.experiences.length > 0) return e.experiences.length * 2;
  return 0;
}

function parseRequestedLevel(val) {
  const s = String(val || '').toLowerCase();
  if (s.includes('s3') || s.includes('doktor')) return 7;
  if (s.includes('s2') || s.includes('magister')) return 6;
  if (s.includes('profesi') || s.includes('spesialis')) return 5;
  if (s.includes('d4') || s.includes('terapan')) return 4.5;
  if (s.includes('s1') || s.includes('sarjana')) return 4;
  if (s.includes('d3') || s.includes('diploma')) return 3;
  if (s.includes('sma') || s.includes('smk')) return 2;
  return 0;
}

function getEduLevel(exp) {
  const highest = String(getHighestEdu(exp) || '').toLowerCase();
  if (highest.includes('s3')) return 7;
  if (highest.includes('s2')) return 6;
  if (highest.includes('profesi')) return 5;
  if (highest.includes('d4')) return 4.5;
  if (highest.includes('s1')) return 4;
  if (highest.includes('d3')) return 3;
  if (highest.includes('sma') || highest.includes('smk')) return 2;
  return 0;
}

function getCriteriaBadges(expert) {
  let list = [];
  if (Array.isArray(expert.kriteria_list) && expert.kriteria_list.length > 0) {
    list = expert.kriteria_list.filter(Boolean).map(String);
  } else if (typeof expert.kriteria === 'string' && expert.kriteria.trim()) {
    list = expert.kriteria.split(/[,/|]+/).map((s) => s.trim()).filter(Boolean);
  }

  // Canonical whitelist: HANYA 3 kriteria profesional
  const canonical = new Set();

  for (const item of list) {
    const s = String(item).toLowerCase().trim();
    if (s.includes('tenaga ahli') || s === 'ahli') {
      canonical.add('Tenaga Ahli');
    } else if (s.includes('tenaga teknis') || s === 'teknisi') {
      canonical.add('Tenaga Teknis');
    } else if (s.includes('surveyor')) {
      canonical.add('Surveyor');
    }
  }

  const hasTenagaAhli = Boolean(
    expert.role_type === 'tenaga_ahli' ||
    expert.user?.role_type === 'tenaga_ahli' ||
    expert.is_also_expert === 1 ||
    expert.user?.is_also_expert === 1 ||
    expert.is_tenaga_ahli
  );
  const hasTeknis = Boolean(
    expert.is_tenaga_teknis === true ||
    expert.role_type === 'tenaga_teknis' ||
    expert.user?.role_type === 'tenaga_teknis' ||
    String(expert.field || '').toLowerCase().includes('tenaga teknis')
  );
  const hasSurveyor = Boolean(
    expert.is_surveyor === true ||
    expert.role_type === 'surveyor' ||
    expert.user?.role_type === 'surveyor' ||
    String(expert.field || '').toLowerCase().includes('surveyor')
  );

  if (hasTenagaAhli) canonical.add('Tenaga Ahli');
  if (hasTeknis) canonical.add('Tenaga Teknis');
  if (hasSurveyor) canonical.add('Surveyor');

  if (canonical.size === 0) {
    canonical.add('Surveyor');
  }

  // Urutan resmi: 1. Tenaga Ahli, 2. Tenaga Teknis, 3. Surveyor
  const order = ['Tenaga Ahli', 'Tenaga Teknis', 'Surveyor'];
  return order.filter((c) => canonical.has(c));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function useClickOutside(ref, onOutside) {
  useEffect(() => {
    function handle(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        onOutside();
      }
    }
    document.addEventListener('mousedown', handle);
    document.addEventListener('touchstart', handle);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('touchstart', handle);
    };
  }, [ref, onOutside]);
}

export default function Surveyor() {
  const { t } = useTranslation();
  const orderOptions = getOrderOptions(t);
  const [searchParams, setSearchParams] = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [keahlian, setKeahlian] = useState(searchParams.get('keahlian') || '');
  const [pendidikan, setPendidikan] = useState(searchParams.get('pendidikan') || '');
  const [experience, setExperience] = useState(searchParams.get('experience') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [kriteria, setKriteria] = useState(
    searchParams.get('kriteria') || searchParams.get('kategori') || 'Surveyor'
  );
  const [order, setOrder] = useState(searchParams.get('order') || 'latest');

  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { reportReady } = usePageLoading();
  const [activeId, setActiveId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [map, setMap] = useState(null);
  const clusterGroupRef = useRef(null);
  const markerMapRef = useRef({});
  const prevActiveIdRef = useRef(null);
  const [orderOpen, setOrderOpen] = useState(false);
  const [keahlianOpen, setKeahlianOpen] = useState(false);
  const [pendidikanOpen, setPendidikanOpen] = useState(false);
  const [kriteriaOpen, setKriteriaOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [searchAsMove, setSearchAsMove] = useState(false);
  const [visibleBounds, setVisibleBounds] = useState(null);

  // Responsive state
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== 'undefined' ? window.innerWidth >= 1024 : true
  );
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const mapWrapperRef = useRef(null);
  const cardRefs = useRef({});
  const keahlianBoxRef = useRef(null);
  const pendidikanBoxRef = useRef(null);
  const locationBoxRef = useRef(null);
  const kriteriaBoxRef = useRef(null);
  const orderBoxRef = useRef(null);

  useClickOutside(keahlianBoxRef, () => setKeahlianOpen(false));
  useClickOutside(pendidikanBoxRef, () => setPendidikanOpen(false));
  useClickOutside(locationBoxRef, () => setLocationOpen(false));
  useClickOutside(kriteriaBoxRef, () => setKriteriaOpen(false));
  useClickOutside(orderBoxRef, () => setOrderOpen(false));

  const keahlianMatches = useMemo(
    () =>
      KEAHLIAN_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(keahlian.trim().toLowerCase())
      ),
    [keahlian]
  );

  const pendidikanMatches = useMemo(
    () =>
      PENDIDIKAN_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(pendidikan.trim().toLowerCase())
      ),
    [pendidikan]
  );

  const locationMatches = useMemo(
    () =>
      LOCATION_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(location.trim().toLowerCase())
      ),
    [location]
  );

  const kriteriaMatches = useMemo(
    () =>
      KRITERIA_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(kriteria.trim().toLowerCase())
      ),
    [kriteria]
  );

  useEffect(() => {
    setLoading(true);
    api
      .get('/experts', {
        params: {
          role_type: 'surveyor',
          keyword: searchParams.get('keyword') || '',
          keahlian: searchParams.get('keahlian') || '',
          pendidikan: searchParams.get('pendidikan') || '',
          experience: searchParams.get('experience') || '',
          location: searchParams.get('location') || '',
          kriteria: searchParams.get('kriteria') || searchParams.get('kategori') || 'Surveyor',
          order: searchParams.get('order') || 'latest',
        },
      })
      .then((res) => {
        const raw = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const mapped = raw.map((exp, idx) => {
          let lat = exp.lat !== undefined && exp.lat !== null && exp.lat !== '' ? parseFloat(exp.lat) : null;
          let lng = exp.lng !== undefined && exp.lng !== null && exp.lng !== '' ? parseFloat(exp.lng) : null;
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
            const locString = [exp.location, exp.alamat_kota, exp.alamat_provinsi, exp.alamat_lengkap]
              .filter(Boolean)
              .join(', ');
            const resolved = getCoordinatesFromLocation(locString, idx);
            if (resolved) {
              lat = resolved.lat;
              lng = resolved.lng;
            }
          }
          return {
            ...exp,
            lat,
            lng,
          };
        });
        setExperts(mapped);
      })
      .catch(() => setExperts([]))
      .finally(() => {
        setLoading(false);
        reportReady();
      });
  }, [searchParams, reportReady]);

  useEffect(() => {
    const instance = L.map('surveyor-map', { zoomControl: false }).setView([-6.9, 107.2], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: t('map.attribution', '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'),
    }).addTo(instance);
    setMap(instance);
    return () => instance.remove();
  }, [t]);

  const filteredExperts = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const keah = keahlian.trim().toLowerCase();
    const loc = location.trim().toLowerCase();
    const krit = kriteria.trim().toLowerCase();
    const pend = pendidikan.trim().toLowerCase();
    const expNum = experience !== '' ? parseFloat(experience) : null;
    const normalizedKrit = krit.replace(/\//g, ' ');

    const collectExpertText = (e) => {
      const arr = [
        e.name,
        e.field,
        e.ringkasan_keahlian,
        e.catatan,
        e.tentang_saya,
        e.institution,
        Array.isArray(e.keahlian) ? e.keahlian.join(' ') : e.keahlian,
        Array.isArray(e.spesialisasi) ? e.spesialisasi.join(' ') : e.spesialisasi,
        Array.isArray(e.kompetensi) ? e.kompetensi.join(' ') : e.kompetensi,
        Array.isArray(e.kriteria_list) ? e.kriteria_list.join(' ') : e.kriteria_list,
      ];
      return arr.filter(Boolean).join(' ').toLowerCase();
    };

    return experts.filter((e) => {
      const expertText = collectExpertText(e);
      const matchKeyword = !kw || expertText.includes(kw);
      const matchKeahlian = !keah || expertText.includes(keah);
      const matchLocation = !loc || (e.location || e.alamat_kota || e.alamat_provinsi || e.lokasi_label || '').toLowerCase().includes(loc);
      const matchKriteria =
        !krit ||
        e.kriteria?.toLowerCase().includes(krit) ||
        (normalizedKrit !== krit && e.kriteria?.toLowerCase().includes(normalizedKrit)) ||
        (Array.isArray(e.kriteria_list) && e.kriteria_list.some((k) => k.toLowerCase().includes(krit) || (normalizedKrit !== krit && k.toLowerCase().includes(normalizedKrit))));

      let matchPendidikan = true;
      if (pend) {
        const reqLvl = parseRequestedLevel(pend);
        if (reqLvl > 0) {
          const actualLvl = getEduLevel(e);
          matchPendidikan = actualLvl >= reqLvl;
        } else {
          const eduStr = [
            e.pendidikan,
            ...(Array.isArray(e.educations) ? e.educations.map(ed => `${ed.degree || ''} ${ed.level || ''} ${ed.field_of_study || ''}`) : [])
          ].join(' ').toLowerCase();
          matchPendidikan = eduStr.includes(pend);
        }
      }

      let matchExp = true;
      if (expNum !== null && !isNaN(expNum) && expNum > 0) {
        const actualYears = getExpYears(e);
        matchExp = actualYears >= expNum;
      }

      const matchBounds = !searchAsMove || !visibleBounds || (e.lat && e.lng && visibleBounds.contains([e.lat, e.lng]));
      return matchKeyword && matchKeahlian && matchLocation && matchKriteria && matchPendidikan && matchExp && matchBounds;
    });
  }, [experts, keyword, keahlian, location, kriteria, pendidikan, experience, searchAsMove, visibleBounds]);

  const sortedExperts = useMemo(() => {
    const getWeight = (e) => {
      const pkg = String(e.package_name || e.package?.name || e.package?.slug || '').toLowerCase();
      const mem = String(e.membership_level || '').toLowerCase();
      if (e.is_platinum || pkg.includes('platinum') || pkg.includes('eksklusif') || pkg.includes('ekslusif') || mem.includes('platinum') || mem.includes('eksklusif') || mem.includes('ekslusif')) return 2;
      if (e.is_premium || (e.package_id && Number(e.package_id) > 1) || (e.package && e.package.price > 0) || e.featured) return 1;
      return 0;
    };

    if (order === 'top_rated') return [...filteredExperts].sort((a, b) => ((b.rating || 0) - (a.rating || 0)) || ((Number(a.id) || 0) - (Number(b.id) || 0)));
    if (order === 'random') return shuffle(filteredExperts);
    return [...filteredExperts].sort((a, b) => {
      const diff = getWeight(b) - getWeight(a);
      if (diff !== 0) return diff;
      return (Number(a.id) || 0) - (Number(b.id) || 0);
    });
  }, [filteredExperts, order]);

  useEffect(() => {
    setActiveIndex(0);
    setCurrentPage(1);
  }, [sortedExperts.length]);

  const totalPages = Math.ceil(sortedExperts.length / ITEMS_PER_PAGE) || 1;
  const paginatedExperts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedExperts.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedExperts, currentPage]);

  useEffect(() => {
    if (!map) return;
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = createExpertClusterGroup();
      map.addLayer(clusterGroupRef.current);
    }
    const clusterGroup = clusterGroupRef.current;
    clusterGroup.clearLayers();

    markerMapRef.current = {};
    const withCoords = sortedExperts.filter((e) => e.lat && e.lng);
    const next = withCoords.map((e) => {
      const isSelected = activeId === e.id;
      const icon = createExpertMapIcon(e, isSelected);
      const popupContent = getExpertPopupHtml(e, t);
      const pkg = String(e.package_name || '').toLowerCase();
      const mem = String(e.membership_level || '').toLowerCase();
      const isPlat = Boolean(e.is_platinum || pkg.includes('platinum') || pkg.includes('eksklusif') || pkg.includes('ekslusif') || pkg.includes('esklusif') || mem.includes('platinum') || mem.includes('eksklusif') || mem.includes('ekslusif'));
      const isPrem = Boolean(isPlat || e.is_premium || pkg.includes('premium') || pkg.includes('ekonomis') || mem.includes('premium') || mem.includes('ekonomis'));

      const marker = L.marker([e.lat, e.lng], {
        icon,
        isPlatinum: isPlat,
        isPremium: isPrem,
      }).bindPopup(popupContent);

      marker.on('click', () => {
        setActiveId(e.id);
        const idx = sortedExperts.findIndex((x) => x.id === e.id);
        if (idx >= 0) {
          setActiveIndex(idx);
          const page = Math.floor(idx / ITEMS_PER_PAGE) + 1;
          setCurrentPage(page);
        }
        cardRefs.current[e.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });

      markerMapRef.current[e.id] = marker;
      return marker;
    });

    if (next.length > 0) {
      clusterGroup.addLayers(next);
      if (!searchAsMove) {
        const bounds = L.featureGroup(next).getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      }
    }
  }, [map, sortedExperts, searchAsMove, t, activeId]);

  useEffect(() => {
    if (!map) return;
    const handleMoveEnd = () => {
      if (searchAsMove) setVisibleBounds(map.getBounds());
    };
    map.on('moveend', handleMoveEnd);
    if (searchAsMove) setVisibleBounds(map.getBounds());
    return () => map.off('moveend', handleMoveEnd);
  }, [map, searchAsMove]);

  useEffect(() => {
    if (mobileMapOpen && map) {
      const timer = setTimeout(() => map.invalidateSize(), 150);
      return () => clearTimeout(timer);
    }
  }, [mobileMapOpen, map]);

  const handleSearch = (e) => {
    e.preventDefault();
    setKeahlianOpen(false);
    setPendidikanOpen(false);
    setKriteriaOpen(false);
    setLocationOpen(false);
    setOrderOpen(false);
    setMobileFiltersOpen(false);
    const params = {};
    if (keyword.trim()) params.keyword = keyword.trim();
    if (keahlian.trim()) params.keahlian = keahlian.trim();
    if (pendidikan.trim()) params.pendidikan = pendidikan.trim();
    if (experience.trim()) params.experience = experience.trim();
    if (location.trim()) params.location = location.trim();
    if (kriteria.trim()) params.kriteria = kriteria.trim();
    if (order && order !== 'latest') params.order = order;
    setSearchParams(params);
  };

  const handleReset = () => {
    setKeyword('');
    setKeahlian('');
    setPendidikan('');
    setExperience('');
    setLocation('');
    setKriteria('Surveyor');
    setOrder('latest');
    setSearchAsMove(false);
    setMobileFiltersOpen(false);
    setSearchParams({});
  };

  const focusExpert = (expert, index) => {
    setActiveId(expert.id);
    setActiveIndex(index);
    cardRefs.current[expert.id]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (map && typeof expert.lat === 'number' && typeof expert.lng === 'number') {
      const targetZoom = 15;
      const marker = markerMapRef.current[expert.id];
      if (marker && clusterGroupRef.current) {
        clusterGroupRef.current.zoomToShowLayer(marker, () => {
          map.panTo([expert.lat, expert.lng], { animate: true, duration: 0.5 });
          marker.openPopup();
        });
      } else {
        map.flyTo([expert.lat, expert.lng], targetZoom, { duration: 0.8, easeLinearity: 0.25 });
        map.once('moveend', () => {
          if (marker) marker.openPopup();
        });
      }
    }
  };

  const handleFullscreen = () => {
    if (!mapWrapperRef.current) return;
    if (!document.fullscreenElement) {
      mapWrapperRef.current.requestFullscreen?.().then(() => setTimeout(() => map?.invalidateSize(), 200));
    } else {
      document.exitFullscreen?.().then(() => setTimeout(() => map?.invalidateSize(), 200));
    }
  };

  const handleLocate = () => {
    if (!map || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => map.setView([pos.coords.latitude, pos.coords.longitude], 13),
      () => alert(t('map.location_error', 'Tidak bisa mengambil lokasi kamu. Pastikan izin lokasi aktif.'))
    );
  };

  // Form filter persis Search.jsx
  const filterForm = (
    <form onSubmit={handleSearch} className="flex flex-col gap-5">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-gray-500">
          {t('search.search_keyword', 'Masukan Kata Kunci')}
        </label>
        <div className="flex items-center gap-2 border-b-2 border-outline-variant/40 focus-within:border-[#8B4513] px-1 py-2 transition-colors">
          <MagnifyingGlassIcon className="w-[18px] h-[18px] text-[#8B4513]" />
          <input
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface placeholder:text-surface-dim outline-none"
            placeholder={t('search.search_keyword_placeholder', 'Nama, instansi, atau topik')}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 relative" ref={keahlianBoxRef}>
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-gray-500">
          {t('Keahlian Utama')}
        </label>
        <div className="flex items-center gap-2 border-b-2 border-outline-variant/40 focus-within:border-[#8B4513] px-1 py-2 transition-colors">
          <BriefcaseIcon className="w-[18px] h-[18px] text-[#8B4513]" />
          <input
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface placeholder:text-surface-dim outline-none"
            placeholder={t('Pilih atau ketik keahlian (Topografi, GIS, LiDAR, dll)...')}
            value={keahlian}
            onChange={(e) => setKeahlian(e.target.value)}
            onFocus={() => setKeahlianOpen(true)}
          />
          {keahlian && (
            <button
              type="button"
              onClick={() => setKeahlian('')}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {keahlianOpen && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border-b-2 border-[#8B4513] rounded-t-lg shadow-lg z-20 max-h-56 overflow-y-auto">
            {keahlianMatches.length > 0 ? (
              keahlianMatches.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setKeahlian(s);
                    setKeahlianOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${i !== keahlianMatches.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                >
                  <span className="font-semibold text-gray-800">{s}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-gray-400">{t('Tekan Cari untuk filter')} "{keahlian}"</div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 relative" ref={pendidikanBoxRef}>
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-gray-500">
          {t('Pendidikan')}
        </label>
        <div className="flex items-center gap-2 border-b-2 border-outline-variant/40 focus-within:border-[#8B4513] px-1 py-2 transition-colors">
          <AcademicCapIcon className="w-[18px] h-[18px] text-[#8B4513]" />
          <input
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface placeholder:text-surface-dim outline-none"
            placeholder={t('Pilih jenjang pendidikan')}
            value={pendidikan}
            onChange={(e) => setPendidikan(e.target.value)}
            onFocus={() => setPendidikanOpen(true)}
          />
          {pendidikan ? (
            <button
              type="button"
              onClick={() => setPendidikan('')}
              className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setPendidikanOpen((v) => !v)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <ChevronDownIcon
                className={`w-[18px] h-[18px] text-gray-400 transition-transform ${pendidikanOpen ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {pendidikanOpen && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border-b-2 border-[#8B4513] rounded-t-lg shadow-lg z-20 max-h-56 overflow-y-auto">
            {pendidikanMatches.length > 0 ? (
              pendidikanMatches.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setPendidikan(s);
                    setPendidikanOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${i !== pendidikanMatches.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                >
                  <span className="font-semibold text-gray-800">{s}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-gray-400">{t('Tidak ada hasil')}</div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-gray-500">
          {t('Pengalaman (Tahun)')}
        </label>
        <div className="flex items-center gap-2 border-b-2 border-outline-variant/40 focus-within:border-[#8B4513] px-1 py-2 transition-colors">
          <ClockIcon className="w-[18px] h-[18px] text-[#8B4513]" />
          <input
            type="number"
            min="0"
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface placeholder:text-surface-dim outline-none"
            placeholder={t('Contoh: 3, 5, 10')}
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
          />
          {experience && (
            <button
              type="button"
              onClick={() => setExperience('')}
              className="text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1 relative" ref={locationBoxRef}>
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-gray-500">
          {t('search.filter_location', 'Lokasi')}
        </label>
        <div className="flex items-center gap-2 border-b-2 border-outline-variant/40 focus-within:border-[#8B4513] px-1 py-2 transition-colors">
          <MapPinIcon className="w-[18px] h-[18px] text-[#8B4513]" />
          <input
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface placeholder:text-surface-dim outline-none"
            placeholder={t('search.filter_location_placeholder', 'Kota atau Provinsi')}
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            onFocus={() => setLocationOpen(true)}
          />
          {location && (
            <button
              type="button"
              onClick={() => setLocation('')}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        {locationOpen && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border-b-2 border-[#8B4513] rounded-t-lg shadow-lg z-20 max-h-56 overflow-y-auto">
            {locationMatches.length > 0 ? (
              locationMatches.map((s, i) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setLocation(s);
                    setLocationOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${i !== locationMatches.length - 1 ? 'border-b border-gray-100' : ''
                    }`}
                >
                  <span className="font-semibold text-gray-800">{s}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-xs text-gray-400">{t('Tidak ada hasil')}</div>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 relative" ref={kriteriaBoxRef}>
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-gray-500">
          {t('search.filter_criteria', 'Kriteria')}
        </label>
        <div className="flex items-center gap-2 border-b-2 border-outline-variant/40 focus-within:border-[#8B4513] px-1 py-2 transition-colors">
          <input
            className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-on-surface placeholder:text-surface-dim outline-none"
            placeholder={t('search.filter_criteria_placeholder', 'Pilih kriteria')}
            value={kriteria}
            onChange={(e) => setKriteria(e.target.value)}
            onFocus={() => setKriteriaOpen(true)}
          />
          {kriteria ? (
            <button
              type="button"
              onClick={() => setKriteria('')}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setKriteriaOpen((v) => !v)}
              className="text-gray-400 hover:text-gray-600 p-0.5"
            >
              <ChevronDownIcon
                className={`w-[18px] h-[18px] text-gray-400 transition-transform ${kriteriaOpen ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>

        {kriteriaOpen && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border-b-2 border-[#8B4513] rounded-t-lg shadow-lg z-20 max-h-56 overflow-y-auto">
            {kriteriaMatches.map((s, i) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setKriteria(s);
                  setKriteriaOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${i !== kriteriaMatches.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
              >
                <span className="font-semibold text-gray-800">{s}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1 relative" ref={orderBoxRef}>
        <label className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant text-gray-500">
          {t('search.sort_by', 'Urutkan Berdasarkan')}
        </label>
        <button
          type="button"
          onClick={() => setOrderOpen((v) => !v)}
          className="flex items-center justify-between border-b-2 border-outline-variant/40 focus:border-[#8B4513] px-1 py-2 text-sm text-gray-800 text-left transition-colors"
        >
          <span className="font-semibold text-gray-800">
            {orderOptions.find((o) => o.value === order)?.label || t('Terbaru')}
          </span>
          <ChevronDownIcon
            className={`w-[18px] h-[18px] text-gray-400 transition-transform ${orderOpen ? 'rotate-180' : ''}`}
          />
        </button>

        {orderOpen && (
          <div className="absolute top-full mt-1 left-0 right-0 bg-white border-b-2 border-[#8B4513] rounded-t-lg shadow-lg z-20">
            {orderOptions.map((opt, i) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setOrder(opt.value);
                  setOrderOpen(false);
                }}
                className={`w-full flex items-center justify-between px-4 py-3 text-sm text-left hover:bg-gray-50 transition-colors ${i !== orderOptions.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
              >
                <span
                  className={order === opt.value ? 'font-bold text-[#8B4513]' : 'text-gray-800'}
                >
                  {opt.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2.5 pt-2">
        <button
          type="submit"
          className="w-full py-3 px-4 bg-[#8B4513] hover:bg-[#6B3410] active:scale-[0.99] text-white font-semibold text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          <MagnifyingGlassIcon className="w-4 h-4 text-white" />
          <span>{t('Cari')}</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="text-gray-500 text-xs underline flex items-center gap-1 justify-center cursor-pointer hover:text-gray-800 py-1 transition-colors"
        >
          <ArrowPathIcon className="w-3.5 h-3.5" />
          {t('Reset Filter')}
        </button>
      </div>
    </form>
  );

  return (
    <div className="relative flex flex-col min-h-screen pt-[72px] md:pt-20">
      <NavbarBackground />
      <Navbar />

      {/* ---------- MOBILE TOP BAR: search + tombol Filters ---------- */}
      {!isDesktop && (
        <div
          className={
            mobileMapOpen
              ? 'fixed top-[72px] md:top-20 inset-x-0 z-[10000] bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3'
              : 'sticky top-[72px] z-[10000] bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3'
          }
        >
          <form
            onSubmit={handleSearch}
            className="flex-1 flex items-center gap-2 border border-gray-300 rounded-full px-3 py-2"
          >
            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 shrink-0" />
            <input
              className="w-full min-w-0 bg-transparent border-none p-0 focus:ring-0 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
              placeholder={t('Kata Kunci')}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </form>
          <button
            type="button"
            onClick={() => setMobileFiltersOpen(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 shrink-0"
          >
            {t('Filter')}
            <AdjustmentsHorizontalIcon className="w-5 h-5 text-[#8B4513]" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_1.3fr] flex-1">
        {/* ---------- FILTERS (desktop only — di mobile jadi bottom-sheet) ---------- */}
        {isDesktop && (
          <aside className="border-r border-gray-200 bg-white p-6 overflow-y-auto">
            <h2 className="font-label-md uppercase tracking-widest text-on-surface-variant mb-5 font-bold text-xs text-gray-500">
              {t('search.title_surveyor', 'Cari Surveyor')}
            </h2>
            {filterForm}
          </aside>
        )}

        {/* ---------- RESULTS ---------- */}
        <section className="border-r border-gray-200 lg:overflow-y-auto lg:max-h-[calc(100vh-80px)]">
          <div className="flex items-center justify-between px-6 py-4 sticky top-[124px] lg:top-0 bg-white z-30 border-b border-gray-100 shadow-xs">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-full hover:bg-amber-50 text-gray-700 hover:text-[#8B4513] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
              disabled={currentPage <= 1 || !sortedExperts.length}
              title={t('Halaman Sebelumnya')}
            >
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-800 font-medium">
                {t('Menampilkan')} <b className="text-[#8B4513]">{sortedExperts.length}</b> {t('surveyor')}
              </span>
              {totalPages > 1 && (
                <span className="text-[11px] text-gray-500 font-semibold mt-0.5">
                  {t('Halaman')} {currentPage} {t('dari')} {totalPages}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-full hover:bg-amber-50 text-gray-700 hover:text-[#8B4513] disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer disabled:cursor-not-allowed"
              disabled={currentPage >= totalPages || !sortedExperts.length}
              title={t('Halaman Selanjutnya')}
            >
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          {!loading && sortedExperts.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-16 px-6">
              {t('search.no_results_surveyor', 'Tidak ada surveyor yang cocok.')}
              <br />
              {t('search.try_change_keywords', 'Coba ubah kata kunci atau filter lokasi.')}
            </div>
          )}

          <div className="flex flex-col gap-4 p-6 pb-24 lg:pb-6">
            {loading ? null : (
              paginatedExperts.map((expert, index) => {
                const pkgName = String(expert.package_name || expert.package?.name || expert.package?.slug || '').toLowerCase();
                const memLevel = String(expert.membership_level || '').toLowerCase();
                const isPlatinum = Boolean(
                  expert.is_platinum ||
                  pkgName.includes('platinum') ||
                  pkgName.includes('eksklusif') ||
                  pkgName.includes('ekslusif') ||
                  pkgName.includes('esklusif') ||
                  memLevel.includes('platinum') ||
                  memLevel.includes('eksklusif') ||
                  memLevel.includes('ekslusif')
                );
                const isPremium = Boolean(
                  isPlatinum ||
                  expert.is_premium ||
                  pkgName.includes('premium') ||
                  pkgName.includes('ekonomis') ||
                  memLevel.includes('premium') ||
                  memLevel.includes('ekonomis') ||
                  memLevel.includes('gold') ||
                  (expert.package_id && Number(expert.package_id) > 1) ||
                  (expert.package && expert.package.price > 0) ||
                  expert.featured
                );
                const criteriaBadges = getCriteriaBadges(expert);
                const hasAllThreeCriteria = Boolean(
                  (Array.isArray(expert.kriteria_list) && expert.kriteria_list.length >= 3) ||
                  criteriaBadges.length >= 3 ||
                  (
                    (expert.is_tenaga_ahli || criteriaBadges.some(b => b.toLowerCase().includes('tenaga ahli') || b.toLowerCase() === 'ahli')) &&
                    (expert.is_surveyor || criteriaBadges.some(b => b.toLowerCase().includes('surveyor'))) &&
                    (expert.is_tenaga_teknis || criteriaBadges.some(b => b.toLowerCase().includes('teknis')))
                  )
                );
                const eduBadge = getHighestEdu(expert);
                const isApprovedByAdmin = Boolean(expert.verified || expert.update_status === 'disetujui' || expert.profile_status === 'aktif');
                const isVerified = Boolean(isApprovedByAdmin && isPremium);
                const hasMedal = hasActiveMedal(expert);

                const coverSrc = expert.cover_url || expert.cover || getDefaultCover(expert.id);
                const photoSrc = expert.photo_url || expert.photo || getDefaultPhoto(expert.id);

                return (
                  <div
                    key={expert.id}
                    ref={(el) => (cardRefs.current[expert.id] = el)}
                    onClick={() => focusExpert(expert, index)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${activeId === expert.id
                      ? 'border-[#0EA5E9] ring-2 ring-[#0EA5E9]/30 shadow-lg'
                      : isPlatinum
                        ? 'border-slate-400/80 shadow-md hover:border-slate-600 hover:shadow-xl'
                        : isPremium
                          ? 'border-amber-300/80 shadow-sm hover:border-amber-400 hover:shadow-lg'
                          : 'border-transparent hover:border-gray-300'
                      }`}
                  >
                    <img src={coverSrc} alt={expert.name} className="w-full h-52 sm:h-56 object-cover" />

                    {/* Top luxury accent strip */}
                    {isPlatinum ? (
                      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-slate-700 via-zinc-300 to-slate-900 z-[2]" />
                    ) : isPremium ? (
                      <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-500 to-yellow-400 z-[2]" />
                    ) : null}

                    {/* Top Header: Left Badges & Right Lihat Profil (Responsive & Anti-Overlap) */}
                    <div className="absolute top-2.5 sm:top-3 inset-x-2.5 sm:inset-x-3 flex items-start justify-between gap-2 z-[2]">
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 min-w-0 flex-1">
                        {criteriaBadges.map((badgeLabel) => {
                          const isSurv = badgeLabel.toLowerCase().includes('surveyor');
                          const isTeknis = badgeLabel.toLowerCase().includes('teknis');
                          return (
                            <div
                              key={badgeLabel}
                              className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase bg-white/95 shadow-sm border backdrop-blur-sm shrink-0 ${
                                isSurv
                                  ? 'text-sky-700 border-sky-300/60'
                                  : isTeknis
                                    ? 'text-teal-700 border-teal-300/60'
                                    : 'text-[#8B4513] border-amber-300/60'
                              }`}
                            >
                              <span>{badgeLabel}</span>
                            </div>
                          );
                        })}
                        {eduBadge && (
                          <div className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-bold bg-white/95 text-stone-800 shadow-sm border border-amber-200/60 backdrop-blur-sm shrink-0">
                            <AcademicCapIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-[#8B4513]" />
                            <span>{eduBadge}</span>
                          </div>
                        )}
                      </div>

                      {expert.slug && (
                        <Link
                          to={`/profil/${expert.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center shrink-0 bg-white/95 hover:bg-white text-[10px] sm:text-[11px] font-bold text-[#0284C7] rounded-full px-2.5 py-1 shadow-sm border border-white/60 transition-all hover:scale-105"
                        >
                          {t('search.view_profile', 'Lihat Profil')}
                        </Link>
                      )}
                    </div>

                    {/* Bottom Info: Avatar with Medal or Online Indicator & Name Info */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent p-3 sm:p-4 flex items-center gap-2.5 sm:gap-3 z-[1]">
                      <div className="relative shrink-0">
                        <img
                          src={photoSrc}
                          alt={expert.name}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 ${isPlatinum ? 'border-slate-300' : isPremium ? 'border-amber-300' : 'border-white'} object-cover shadow-sm`}
                        />
                        {hasMedal ? (
                          <ConsultationMedalBadge expert={expert} variant="avatar" />
                        ) : (
                          <span
                            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${expert.is_online ? 'bg-emerald-500' : 'bg-gray-400'}`}
                            title={expert.is_online ? t('Online — Sedang aktif') : t('Offline')}
                          >
                            {expert.is_online && (
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            )}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 sm:gap-1.5">
                          <span className="text-white font-bold text-xs sm:text-sm truncate">{expert.name}</span>
                          {isVerified && <CheckBadgeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 shrink-0" />}
                        </div>
                        <p className="text-white/85 text-[10px] sm:text-[11px] truncate flex items-center gap-1 sm:gap-1.5 mt-0.5">
                          <span>{hasAllThreeCriteria ? 'Tenaga Ahli' : (expert.field || (isPlatinum ? 'Surveyor Eksklusif' : 'Surveyor Profesional'))}</span>
                          {(expert.location || [expert.alamat_kota, expert.alamat_provinsi].filter(Boolean).join(', ')) && (
                            <span className="truncate">· {expert.location || [expert.alamat_kota, expert.alamat_provinsi].filter(Boolean).join(', ')}</span>
                          )}
                          {expert.rating && Number(expert.rating) > 0 && (expert.reviews_count === undefined || expert.reviews_count === null || Number(expert.reviews_count) > 0) ? (
                            <span className="inline-flex items-center gap-0.5 bg-black/40 px-1.5 py-0.5 rounded text-amber-300 font-bold ml-1 shrink-0">
                              ⭐ {Number(expert.rating).toFixed(1)}
                            </span>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-2 pt-4 pb-2 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-50 hover:text-[#8B4513]"
                >
                  <ChevronLeftIcon className="w-3.5 h-3.5" />
                  {t('Sebelumnya')}
                </button>

                <div className="flex items-center gap-1 overflow-x-auto">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${currentPage === pageNum
                        ? 'bg-[#8B4513] text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-amber-50'
                        }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed hover:bg-amber-50 hover:text-[#8B4513]"
                >
                  {t('Selanjutnya')}
                  <ChevronRightIcon className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ---------- MAP ---------- */}
        <div
          ref={mapWrapperRef}
          className={
            mobileMapOpen
              ? 'fixed inset-x-0 bottom-16 md:bottom-0 top-[72px] md:top-20 z-[9999] bg-white'
              : 'hidden lg:block relative isolate z-0 sticky top-[72px] md:top-20 h-[calc(100vh-72px)] md:h-[calc(100vh-80px)] overflow-hidden'
          }
        >
          <div id="surveyor-map" className="absolute inset-0" />

          {/* Bar "Cari saat peta digeser" */}
          <label
            className={
              mobileMapOpen
                ? 'absolute top-[76px] left-4 right-4 z-[1000] bg-white shadow rounded-xl px-4 py-3 flex items-center gap-2 text-sm cursor-pointer'
                : 'absolute top-4 left-4 z-[1000] bg-white shadow rounded-md px-3 py-2 flex items-center gap-2 text-sm cursor-pointer'
            }
          >
            <input
              type="checkbox"
              checked={searchAsMove}
              onChange={(e) => setSearchAsMove(e.target.checked)}
            />
            {t('Cari saat peta digeser')}
          </label>

          <div
            className={`absolute right-4 z-[1000] flex flex-col gap-2 ${mobileMapOpen ? 'top-[76px]' : 'top-4'
              }`}
          >
            <button onClick={() => map?.zoomIn()} className="bg-white shadow rounded-md w-9 h-9 flex items-center justify-center">
              <PlusIcon className="w-4 h-4" />
            </button>
            <button onClick={() => map?.zoomOut()} className="bg-white shadow rounded-md w-9 h-9 flex items-center justify-center">
              <MinusIcon className="w-4 h-4" />
            </button>
            <button onClick={handleFullscreen} className="flex bg-white shadow rounded-md w-9 h-9 items-center justify-center">
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>
            <button onClick={handleLocate} className="bg-white shadow rounded-md w-9 h-9 flex items-center justify-center">
              <MapPinIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------- MOBILE FILTER BOTTOM-SHEET ---------- */}
      {!isDesktop && mobileFiltersOpen && (
        <div className="fixed inset-0 z-[20000]">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 inset-x-0 bg-white rounded-t-2xl max-h-[85vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-label-md uppercase tracking-widest text-on-surface-variant font-bold text-gray-700">
                {t('search.title_surveyor', 'Cari Surveyor')}
              </h2>
              <button onClick={() => setMobileFiltersOpen(false)} aria-label="Tutup">
                <XMarkIcon className="w-6 h-6 text-gray-500" />
              </button>
            </div>
            {filterForm}
          </div>
        </div>
      )}

      {/* ---------- TOMBOL MENGAMBANG: toggle Map view / List view (mobile saja) ---------- */}
      {!isDesktop && (
        <button
          onClick={() => setMobileMapOpen((v) => !v)}
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[10000] bg-[#1F2A22] text-white pl-4 pr-5 py-3 rounded-full shadow-xl flex items-center gap-2 text-sm font-semibold"
        >
          {mobileMapOpen ? (
            <>
              <ListBulletIcon className="w-5 h-5" />
              {t('Lihat Daftar')}
            </>
          ) : (
            <>
              <MapIcon className="w-5 h-5" />
              {t('Lihat Peta')}
            </>
          )}
        </button>
      )}
    </div>
  );
}
