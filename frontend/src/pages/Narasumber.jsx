import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import Navbar from '../components/Navbar.jsx';
import NavbarBackground from '../components/NavbarBackground.jsx';
import { usePageLoading } from '../context/LoadingContext.jsx';
import { getMediaUrl, getDefaultCover, getDefaultPhoto } from '../utils/media.js';
import { createExpertMapIcon, createExpertClusterGroup, getExpertPopupHtml } from '../utils/mapMarker.js';
import { getCoordinatesFromLocation } from '../utils/indonesiaGeo.js';
import { formatCompactLocation } from '../utils/formatters.js';
import ConsultationMedalBadge, { hasActiveMedal } from '../components/ConsultationMedalBadge.jsx';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import {
  MagnifyingGlassIcon,
  ArrowPathIcon,
  BoltIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  PlusIcon,
  MinusIcon,
  ArrowsPointingOutIcon,
  MapPinIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  MapIcon,
  ListBulletIcon,
  MicrophoneIcon,
} from '@heroicons/react/24/outline';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

const getOrderOptions = (t) => [
  { value: 'latest', label: t('Terbaru') },
  { value: 'top_rated', label: t('Rating Tertinggi') },
  { value: 'random', label: t('Acak') },
];

const KRITERIA_SUGGESTIONS = [
  'Narasumber/Pembicara',
  'Tenaga Ahli',
  'Tenaga Teknis',
  'Surveyor',
  'Peneliti Artikel/Jurnal',
];

// Category meta used for the mobile search bar (icon + placeholder text)
const CATEGORY_LABEL = 'Narasumber';
const CATEGORY_ICON = MicrophoneIcon;
const ACCENT = '#8B4513';

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

const FALLBACK_EXPERTS = [];


export default function Narasumber() {
  const { t } = useTranslation();
  const orderOptions = getOrderOptions(t);
  const [searchParams, setSearchParams] = useSearchParams();
  const { reportReady } = usePageLoading();

  const [keyword, setKeyword] = useState(searchParams.get('keyword') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [kriteria, setKriteria] = useState(
    searchParams.get('kategori') || searchParams.get('kriteria') || 'Narasumber/Pembicara'
  );
  const [kriteriaInput, setKriteriaInput] = useState('');
  const [order, setOrder] = useState(searchParams.get('order') || 'latest');

  const [experts, setExperts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 6;

  const [map, setMap] = useState(null);
  const clusterGroupRef = useRef(null);
  const markerMapRef = useRef({});
  const prevActiveIdRef = useRef(null);
  const [markers, setMarkers] = useState([]);
  const [orderOpen, setOrderOpen] = useState(false);
  const [kriteriaOpen, setKriteriaOpen] = useState(false);
  const [searchAsMove, setSearchAsMove] = useState(false);
  const [visibleBounds, setVisibleBounds] = useState(null);

  // Mobile-only UI state: which panel is visible ('list' | 'map') and whether
  // the bottom-sheet filter drawer is open.
  const [mobileView, setMobileView] = useState('list');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const mapWrapperRef = useRef(null);
  const cardRefs = useRef({});
  const kriteriaBoxRef = useRef(null);
  const orderBoxRef = useRef(null);

  useClickOutside(kriteriaBoxRef, () => setKriteriaOpen(false));
  useClickOutside(orderBoxRef, () => setOrderOpen(false));

  const kriteriaMatches = useMemo(
    () =>
      KRITERIA_SUGGESTIONS.filter((s) =>
        s.toLowerCase().includes(kriteriaInput.trim().toLowerCase())
      ),
    [kriteriaInput]
  );

  useEffect(() => {
    setLoading(true);
    api
      .get('/experts', {
        params: {
          keyword: searchParams.get('keyword') || '',
          location: searchParams.get('location') || '',
          kriteria: searchParams.get('kategori') || searchParams.get('kriteria') || 'Narasumber/Pembicara',
          order: searchParams.get('order') || 'latest',
        },
      })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const mapped = data.map((exp, idx) => {
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
      .finally(() => { setLoading(false); reportReady(); });
  }, [searchParams, reportReady]);

  useEffect(() => {
    const instance = L.map('narasumber-map', { zoomControl: false }).setView([-6.9, 107.2], 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: t('map.attribution', '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'),
    }).addTo(instance);
    setMap(instance);
    return () => instance.remove();
  }, []);

  const filteredExperts = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    const loc = location.trim().toLowerCase();
    const krit = kriteria.trim().toLowerCase();

    return experts.filter((e) => {
      const matchKeyword =
        !kw || String(e.name || '').toLowerCase().includes(kw) || String(e.field || '').toLowerCase().includes(kw);
      const matchLocation = !loc || String(e.location || '').toLowerCase().includes(loc);
      const matchKriteria =
        !krit ||
        String(e.kriteria || '').toLowerCase().includes(krit) ||
        (Array.isArray(e.kriteria_list) && e.kriteria_list.some((k) => String(k || '').toLowerCase().includes(krit)));
      const matchBounds =
        !searchAsMove || !visibleBounds || (e.lat && e.lng && visibleBounds.contains([e.lat, e.lng]));
      return matchKeyword && matchLocation && matchKriteria && matchBounds;
    });
  }, [experts, keyword, location, kriteria, searchAsMove, visibleBounds]);

  const sortedExperts = useMemo(() => {
    const getWeight = (e) => {
      const pkg = String(e.package_name || e.package?.name || e.package?.slug || '').toLowerCase();
      const mem = String(e.membership_level || '').toLowerCase();
      if (e.is_platinum || pkg.includes('platinum') || pkg.includes('eksklusif') || pkg.includes('ekslusif') || pkg.includes('esklusif') || mem.includes('platinum') || mem.includes('eksklusif') || mem.includes('ekslusif')) return 2;
      if (e.is_premium || pkg.includes('premium') || pkg.includes('ekonomis') || mem.includes('premium') || mem.includes('ekonomis') || (e.package_id && Number(e.package_id) > 1) || (e.package && e.package.price > 0) || e.featured) return 1;
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
      const isPrem = Boolean(e.is_premium || pkg.includes('premium') || pkg.includes('ekonomis') || mem.includes('premium') || mem.includes('ekonomis'));

      const marker = L.marker([e.lat, e.lng], {
        icon,
        isPlatinum: isPlat,
        isPremium: isPrem,
      }).bindPopup(popupContent);

      marker.on('click', () => {
        setActiveId(e.id);
        setActiveIndex(sortedExperts.findIndex((x) => x.id === e.id));
      });
      markerMapRef.current[e.id] = marker;
      clusterGroup.addLayer(marker);
      return marker;
    });
    setMarkers(next);

    if (withCoords.length && !searchAsMove) {
      map.fitBounds(L.latLngBounds(withCoords.map((e) => [e.lat, e.lng])), {
        padding: [40, 40],
        maxZoom: 9,
      });
    }
  }, [sortedExperts, map]);

  // Update marker icon appearance when activeId changes without rebuilding layers
  useEffect(() => {
    if (prevActiveIdRef.current && prevActiveIdRef.current !== activeId) {
      const prevMarker = markerMapRef.current[prevActiveIdRef.current];
      const prevExp = sortedExperts.find((e) => e.id === prevActiveIdRef.current);
      if (prevMarker && prevExp) {
        prevMarker.setIcon(createExpertMapIcon(prevExp, false));
      }
    }
    if (activeId) {
      const activeMarker = markerMapRef.current[activeId];
      const activeExp = sortedExperts.find((e) => e.id === activeId);
      if (activeMarker && activeExp) {
        activeMarker.setIcon(createExpertMapIcon(activeExp, true));
      }
    }
    prevActiveIdRef.current = activeId;
  }, [activeId, sortedExperts]);

  useEffect(() => {
    if (!map) return;
    const handleMoveEnd = () => {
      if (searchAsMove) setVisibleBounds(map.getBounds());
    };
    map.on('moveend', handleMoveEnd);
    if (searchAsMove) setVisibleBounds(map.getBounds());
    return () => map.off('moveend', handleMoveEnd);
  }, [map, searchAsMove]);

  const handleSearch = (e) => {
    e.preventDefault();
    setKriteriaOpen(false);
    setOrderOpen(false);
    setFilterDrawerOpen(false);
    setSearchParams({ keyword, location, kriteria, order });
  };

  const handleReset = () => {
    setKeyword('');
    setLocation('');
    setKriteria('Narasumber/Pembicara');
    setOrder('latest');
    setSearchAsMove(false);
    setFilterDrawerOpen(false);
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

  const goPrev = () => {
    if (!sortedExperts.length) return;
    const nextIndex = (activeIndex - 1 + sortedExperts.length) % sortedExperts.length;
    focusExpert(sortedExperts[nextIndex], nextIndex);
  };

  const goNext = () => {
    if (!sortedExperts.length) return;
    const nextIndex = (activeIndex + 1) % sortedExperts.length;
    focusExpert(sortedExperts[nextIndex], nextIndex);
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

  return (
    <div className="min-h-screen bg-white pt-[72px] md:pt-20">
      <NavbarBackground />


      <Navbar />

      {/* ---------- MOBILE CATEGORY BAR ---------- */}
      {/* Ini BUKAN input pencarian kata kunci — hanya menampilkan kategori halaman
          ini (kriteria) beserta ikonnya. Pencarian kata kunci tetap ada di dalam
          drawer filter. Tap di mana saja pada bar ini membuka drawer filter. */}
      <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-gray-200 bg-white">
        <button
          type="button"
          onClick={() => setFilterDrawerOpen(true)}
          className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full pl-3 pr-4 py-2 text-sm text-left text-gray-700"
        >
          <CATEGORY_ICON className="w-4 h-4 text-gray-400 shrink-0" />
          <span className="truncate">{kriteria || t(CATEGORY_LABEL)}</span>
        </button>
        <button
          type="button"
          onClick={() => setFilterDrawerOpen(true)}
          className="flex items-center gap-1 text-sm font-semibold text-gray-700 shrink-0"
        >
          {t('Filter')}
          <AdjustmentsHorizontalIcon className="w-5 h-5" style={{ color: ACCENT }} />
        </button>
      </div>

      {filterDrawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/40 z-[1999]"
          onClick={() => setFilterDrawerOpen(false)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr_1.3fr]">
        {/* ---------- FILTERS ---------- */}
        <aside
          className={`fixed inset-x-0 bottom-0 z-[2000] bg-white rounded-t-2xl shadow-2xl max-h-[85vh] overflow-y-auto p-6 transition-transform duration-300 lg:static lg:z-auto lg:max-h-none lg:overflow-visible lg:rounded-none lg:shadow-none lg:translate-y-0 lg:border-r lg:border-gray-200 ${
            filterDrawerOpen ? 'translate-y-0' : 'translate-y-full'
          }`}
        >
          <div className="flex items-center justify-between mb-4 lg:hidden">
            <h2 className="font-bold text-lg">{t('Filter')}</h2>
            <button type="button" onClick={() => setFilterDrawerOpen(false)} className="p-1" aria-label={t('Tutup')}>
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleSearch} className="flex flex-col gap-6">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500">{t('experts.search_keyword', 'Masukan Kata Kunci')}</label>
              <div className="flex items-center gap-2 border-b border-gray-300 focus-within:border-[#8B4513] py-2 transition-colors">
                <MagnifyingGlassIcon className="w-[18px] h-[18px] text-[#8B4513] shrink-0" />
                <input
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                  placeholder={t("experts.search_keyword_placeholder", "Ahli Kehutanan, Tata Ruang")}
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-gray-500">{t('experts.search_location', 'Kota/Kabupaten/Provinsi')}</label>
              <div className="flex items-center gap-2 border-b border-gray-300 focus-within:border-[#8B4513] py-2 transition-colors">
                <MapPinIcon className="w-[18px] h-[18px] text-[#8B4513] shrink-0" />
                <input
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-gray-800 placeholder:text-gray-400 outline-none"
                  placeholder={t("experts.search_location_placeholder", "Pilih Lokasi")}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
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
            </div>

            <div className="flex flex-col gap-1 relative" ref={kriteriaBoxRef}>
              <label className="text-sm text-gray-500">{t('experts.membership_criteria', 'Kriteria Keanggotaan')}</label>

              {kriteria ? (
                <div className="flex items-center justify-between bg-gray-100 rounded-md px-3 py-2 text-sm">
                  <span>{kriteria}</span>
                  <button
                    type="button"
                    onClick={() => setKriteria('')}
                    className="text-gray-500 hover:text-black"
                    aria-label={t("experts.remove_criteria", "Hapus kriteria")}
                  >
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <input
                  className="border-b border-gray-300 focus:border-[#8B4513] outline-none py-2 text-sm bg-transparent"
                  placeholder={t("experts.criteria_placeholder", "Ketik untuk mencari kriteria...")}
                  value={kriteriaInput}
                  onChange={(e) => setKriteriaInput(e.target.value)}
                  onFocus={() => setKriteriaOpen(true)}
                />
              )}

              {kriteriaOpen && !kriteria && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-md z-10 overflow-hidden">
                  {kriteriaMatches.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => {
                        setKriteria(s);
                        setKriteriaInput('');
                        setKriteriaOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50"
                    >
                      {s}
                    </button>
                  ))}
                  {kriteriaMatches.length === 0 && (
                    <div className="px-4 py-2 text-xs text-gray-400">{t('experts.no_suggestions', 'Tidak ada saran')}</div>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1 relative" ref={orderBoxRef}>
              <label className="text-sm text-gray-500">{t('Urutkan Berdasarkan')}</label>
              <button
                type="button"
                onClick={() => setOrderOpen((v) => !v)}
                className="flex items-center justify-between border-b border-gray-300 py-2 text-sm font-semibold"
              >
                {orderOptions.find((o) => o.value === order)?.label}
                <ChevronDownIcon
                  className={`w-4 h-4 transition-transform ${orderOpen ? 'rotate-180' : ''}`}
                />
              </button>
              {orderOpen && (
                <div className="absolute top-full mt-1 left-0 right-0 bg-white border border-gray-200 rounded-md z-10 overflow-hidden">
                  {orderOptions.map((o) => (
                    <button
                      key={o.value}
                      type="button"
                      onClick={() => {
                        setOrder(o.value);
                        setOrderOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 ${
                        order === o.value ? 'font-semibold' : 'text-gray-600'
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              type="submit"
              className="bg-[#8B4513] hover:bg-[#6B3410] text-white py-3 rounded-full font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />{t('Cari')}</button>
            <button type="button" onClick={handleReset} className="text-gray-500 text-sm underline flex items-center gap-1 justify-center hover:text-gray-800">
              <ArrowPathIcon className="w-4 h-4" />{t('Reset Filter')}</button>
          </form>
        </aside>

        {/* ---------- RESULTS ---------- */}
        <section
          className={`border-r border-gray-200 overflow-y-auto max-h-[calc(100vh-72px)] md:max-h-[calc(100vh-80px)] ${
            mobileView === 'map' ? 'hidden' : 'block'
          } lg:block`}
        >
          <div className="flex items-center justify-between px-6 py-4 sticky top-0 bg-white z-30 border-b border-gray-100 shadow-xs">
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
              <span className="text-sm font-medium text-gray-800">
                {t('Menampilkan')} <b className="text-[#8B4513]">{sortedExperts.length}</b> {t('hasil')}
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
              {t('experts.no_results', 'Tidak ada tenaga ahli yang cocok.')}
              <br />
              {t('experts.try_change_keywords', 'Coba ubah kata kunci atau filter lokasi.')}
            </div>
          )}

          <div className="flex flex-col gap-4 p-6">
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
                const isSurveyor = Boolean(
                  expert.is_surveyor === true ||
                  expert.role_type === 'surveyor' ||
                  expert.user?.role_type === 'surveyor' ||
                  String(expert.kriteria || '').trim().toLowerCase().includes('surveyor') ||
                  (Array.isArray(expert.kriteria_list) && expert.kriteria_list.some((k) => String(k).toLowerCase().includes('surveyor'))) ||
                  String(expert.field || '').trim().toLowerCase().includes('surveyor')
                );
                const roleBadgeLabel = expert.kriteria || (isSurveyor ? 'Surveyor' : 'Tenaga Ahli');
                const isApprovedByAdmin = Boolean(expert.verified || expert.update_status === 'disetujui' || expert.profile_status === 'aktif');
                const isVerified = Boolean(isApprovedByAdmin && isPremium);

                const coverSrc = expert.cover_url || expert.cover || getDefaultCover(expert.id);
                const photoSrc = expert.photo_url || expert.photo || getDefaultPhoto(expert.id);
                const hasMedal = hasActiveMedal(expert);

                return (
                  <div
                    key={expert.id}
                    ref={(el) => (cardRefs.current[expert.id] = el)}
                    onClick={() => focusExpert(expert, index)}
                    className={`relative rounded-xl overflow-hidden cursor-pointer border-2 transition-all duration-300 ${
                      activeId === expert.id
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
                        <div
                          className={`inline-flex items-center px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase bg-white/95 shadow-sm border backdrop-blur-sm shrink-0 ${
                            isSurveyor
                              ? 'text-sky-700 border-sky-300/60'
                              : 'text-[#8B4513] border-amber-300/60'
                          }`}
                        >
                          <span>{roleBadgeLabel}</span>
                        </div>
                      </div>

                      {expert.slug && (
                        <Link
                          to={`/profil/${expert.slug}`}
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center justify-center shrink-0 bg-white/95 hover:bg-white text-[10px] sm:text-[11px] font-bold text-[#0284C7] rounded-full px-2.5 py-1 shadow-sm border border-white/60 transition-all hover:scale-105"
                        >
                          {t('Lihat Profil')}
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
                          {isVerified && <CheckBadgeIcon className="w-5 h-5 text-sky-400 flex-none" />}
                        </div>
                        <p className="text-white/85 text-[10px] sm:text-[11px] truncate flex items-center gap-1 sm:gap-1.5 mt-0.5">
                          <span>{expert.field || (isPlatinum ? 'Narasumber Eksklusif' : 'Narasumber')}</span>
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
              <div className="flex items-center justify-between gap-2 pt-4 pb-2 border-t border-outline-variant/20 mt-2">
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
                      className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${
                        currentPage === pageNum
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
          className={`relative isolate z-0 overflow-hidden ${
            mobileView === 'map' ? 'block h-[calc(100vh-128px)]' : 'hidden'
          } lg:block lg:sticky lg:top-[72px] md:lg:top-20 lg:h-[calc(100vh-72px)] md:lg:h-[calc(100vh-80px)]`}
        >
          <div id="narasumber-map" className="absolute inset-0" />

          <label className="absolute top-4 left-4 z-[1000] bg-white rounded-md px-3 py-2 flex items-center gap-2 text-sm cursor-pointer select-none">
            <input
              type="checkbox"
              className="accent-[#8B4513]"
              checked={searchAsMove}
              onChange={(e) => setSearchAsMove(e.target.checked)}
            />
            {t('Cari saat peta digeser')}
          </label>

          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button onClick={() => map?.zoomIn()} className="bg-white hover:bg-gray-50 rounded-md w-9 h-9 flex items-center justify-center transition-colors">
              <PlusIcon className="w-4 h-4" />
            </button>
            <button onClick={() => map?.zoomOut()} className="bg-white hover:bg-gray-50 rounded-md w-9 h-9 flex items-center justify-center transition-colors">
              <MinusIcon className="w-4 h-4" />
            </button>
            <button onClick={handleFullscreen} className="bg-white hover:bg-gray-50 rounded-md w-9 h-9 flex items-center justify-center transition-colors">
              <ArrowsPointingOutIcon className="w-4 h-4" />
            </button>
            <button onClick={handleLocate} className="bg-white hover:bg-gray-50 shadow rounded-md w-9 h-9 flex items-center justify-center transition-colors">
              <MapPinIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ---------- MOBILE LIST/MAP TOGGLE ---------- */}
      <button
        type="button"
        onClick={() => setMobileView((v) => (v === 'list' ? 'map' : 'list'))}
        className="lg:hidden fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[1500] bg-[#1F2A22] text-white pl-4 pr-5 py-3 rounded-full shadow-2xl flex items-center gap-2 text-sm font-semibold"
      >
        {mobileView === 'list' ? (
          <>
            <MapIcon className="w-4 h-4" />
            {t('Lihat Peta')}
          </>
        ) : (
          <>
            <ListBulletIcon className="w-4 h-4" />
            {t('Lihat Daftar')}
          </>
        )}
      </button>
    </div>
  );
}