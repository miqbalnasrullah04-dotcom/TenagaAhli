import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import { usePageLoading } from '../context/LoadingContext.jsx';
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ArrowRightIcon,
  NewspaperIcon,
  SparklesIcon,
  BookOpenIcon,
  ClockIcon,
  ArrowPathIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { ArrowLongRightIcon } from '@heroicons/react/24/solid';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200';

/* ─── Helper ─── */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function estimateReadTime(excerpt) {
  if (!excerpt) return '2 menit baca';
  const words = excerpt.split(/\s+/).length;
  const mins = Math.max(2, Math.ceil(words / 40));
  return `${mins} menit baca`;
}

/* ═══════════════════════════════════════════════════════════ */
export default function Berita() {
  const { t } = useTranslation();
  const { reportReady } = usePageLoading();
  const [searchParams, setSearchParams] = useSearchParams();

  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');

  const BACKEND_URL =
    import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || '';

  // Fetch articles
  useEffect(() => {
    setLoading(true);
    api
      .get('/articles', { params: { category: 'BERITA' } })
      .then((res) => {
        if (Array.isArray(res.data)) {
          const apiArticles = res.data.map((item) => {
            let thumb = DEFAULT_IMAGE;
            if (item.thumbnail_url) {
              thumb = item.thumbnail_url;
            } else if (item.thumbnail) {
              thumb = item.thumbnail.startsWith('http')
                ? item.thumbnail
                : `${BACKEND_URL}/storage/${item.thumbnail}`;
            }

            return {
              id: item.id,
              slug: item.slug || String(item.id),
              title: item.title,
              category: item.category || 'BERITA',
              source: item.source || '',
              is_top_news: Boolean(item.is_top_news),
              excerpt: item.excerpt || (item.content ? item.content.slice(0, 150) + '...' : ''),
              content: item.content,
              thumbnail: thumb,
              published_at: item.published_at || item.created_at?.slice(0, 10) || '',
            };
          });

          setArticles(apiArticles);
        } else {
          setArticles([]);
        }
      })
      .catch(() => setArticles([]))
      .finally(() => {
        setLoading(false);
        reportReady();
      });
  }, [reportReady, BACKEND_URL]);

  // Filtered + searched
  const filteredArticles = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return articles.filter((a) => {
      return (
        !kw ||
        a.title?.toLowerCase().includes(kw) ||
        a.excerpt?.toLowerCase().includes(kw) ||
        a.category?.toLowerCase().includes(kw)
      );
    });
  }, [articles, keyword]);

  const isSearching = Boolean(keyword.trim());

  // Featured = artikel terbaru (posisi teratas), gridArticles = artikel berikutnya
  const { featured, gridArticles } = useMemo(() => {
    if (isSearching || filteredArticles.length === 0) {
      return { featured: null, gridArticles: filteredArticles };
    }

    const latest = filteredArticles[0] || null;
    const rest = filteredArticles.slice(1);

    return { featured: latest, gridArticles: rest };
  }, [filteredArticles, isSearching]);

  // Handlers
  const handleSearch = (e) => {
    e.preventDefault();
    const params = {};
    if (keyword.trim()) params.q = keyword.trim();
    setSearchParams(params);
  };

  const handleReset = () => {
    setKeyword('');
    setSearchParams({});
  };

  /* ═══════════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen bg-[#FDFBF9]">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden pt-28 md:pt-36 pb-16 md:pb-24"
        style={{
          background: 'linear-gradient(135deg, #3D1C02 0%, #6B3410 40%, #8B4513 60%, #3D1C02 100%)',
        }}
      >
        {/* Decorative shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-amber-400/[0.06]" />
          <div className="absolute -bottom-32 -left-20 w-[400px] h-[400px] rounded-full bg-amber-300/[0.04]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-amber-500/[0.03]" />
        </div>

        {/* Wave bottom */}
        <svg
          className="absolute bottom-0 left-0 w-full text-[#FDFBF9]"
          viewBox="0 0 1440 100"
          fill="currentColor"
          preserveAspectRatio="none"
        >
          <path d="M0,64L48,58.7C96,53,192,43,288,48C384,53,480,75,576,80C672,85,768,75,864,64C960,53,1056,43,1152,42.7C1248,43,1344,53,1392,58.7L1440,64L1440,100L0,100Z" />
        </svg>

        <div className="relative z-10 max-w-5xl mx-auto px-6 md:px-12 text-center">
          {/* Badge */}
          <span className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-400/25 text-amber-200 text-xs font-bold px-4 py-1.5 rounded-full mb-5 tracking-wider uppercase">
            <SparklesIcon className="w-3.5 h-3.5" />
            Insight &amp; Knowledge
          </span>

          <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight">
            {t('Berita')} <span className="text-amber-400">{t('Terkini')}</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-white/70 max-w-2xl mx-auto leading-relaxed">
            {t(
              'Temukan informasi, wawasan, dan berita terbaru seputar olahraga, politik, teknologi, dan topik terkini.'
            )}
          </p>

          {/* Search */}
          <form onSubmit={handleSearch} className="mt-8 max-w-xl mx-auto">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder={t('Cari berita, kategori, atau topik...')}
                className="w-full pl-11 sm:pl-12 pr-24 py-3.5 sm:py-4 rounded-2xl bg-white/95 backdrop-blur-sm text-sm text-gray-800 placeholder-gray-400 shadow-xl border border-white/20 focus:outline-none focus:ring-2 focus:ring-amber-400/40 transition-all"
              />
              {keyword && (
                <button
                  type="button"
                  onClick={() => setKeyword('')}
                  className="absolute right-14 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-[#8B4513] hover:bg-[#6B3410] text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors"
              >
                {t('Cari')}
              </button>
            </div>
          </form>

          {/* Article count */}
          <p className="mt-4 text-sm text-white/50">
            {filteredArticles.length} {t('berita tersedia')}
          </p>
        </div>
      </section>

      {/* ── CONTENT ──────────────────────────────────────── */}
      <section className="max-w-6xl mx-auto px-6 md:px-12 -mt-2 relative z-20 pb-20">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <SparklesIcon className="w-4 h-4 text-[#8B4513]" />
              <span className="text-xs font-bold text-[#8B4513] uppercase tracking-wider">
                {t('Berita Terbaru')}
              </span>
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">
              {t('Temukan berita baru')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t('Bacaan pilihan untuk menambah pengetahuan dan informasi terkini.')}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              to="/kelola-berita"
              className="inline-flex items-center gap-1.5 bg-[#8B4513] hover:bg-[#6B3410] text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm transition-all"
            >
              <span className="material-symbols-outlined text-[16px]">edit_note</span>
              {t('Tulis Berita')}
            </Link>
            <span className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm">
              <NewspaperIcon className="w-3.5 h-3.5 text-[#8B4513]" />
              {filteredArticles.length} {t('berita')}
            </span>

            {keyword && (
              <button
                onClick={handleReset}
                className="text-xs text-[#8B4513] hover:underline font-semibold flex items-center gap-1"
              >
                <ArrowPathIcon className="w-3.5 h-3.5" />
                {t('Reset')}
              </button>
            )}
          </div>
        </div>

        {/* ── LOADING SKELETON ─────────────────────────── */}
        {loading && (
          <div className="space-y-8">
            <div className="rounded-3xl overflow-hidden bg-white border border-gray-100 animate-pulse">
              <div className="grid md:grid-cols-2">
                <div className="h-64 md:h-80 bg-gray-200" />
                <div className="p-8 space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-20" />
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <div key={n} className="rounded-2xl bg-white border border-gray-100 overflow-hidden animate-pulse">
                  <div className="h-48 bg-gray-200" />
                  <div className="p-5 space-y-3">
                    <div className="h-3 bg-gray-200 rounded w-16" />
                    <div className="h-5 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-full" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ─────────────────────────────── */}
        {!loading && filteredArticles.length === 0 && (
          <div className="flex flex-col items-center justify-center text-center py-24">
            <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center text-amber-300 mb-5">
              <BookOpenIcon className="w-10 h-10" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">
              {t('Tidak ada berita yang ditemukan')}
            </h3>
            <p className="text-sm text-gray-500 max-w-md mt-2 mb-6">
              {t('Coba ubah kata kunci pencarian.')}
            </p>
            <button
              onClick={handleReset}
              className="px-5 py-2.5 bg-[#8B4513] text-white rounded-xl text-sm font-semibold hover:bg-[#6B3410] transition-colors"
            >
              {t('Reset Filter')}
            </button>
          </div>
        )}

        {/* ── FEATURED ARTICLE (Hero Card) ────────────── */}
        {!loading && featured && (
          <Link
            to={`/berita/${featured.slug}`}
            className="group block rounded-3xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 mb-10 hover:-translate-y-1"
          >
            <div className="grid md:grid-cols-2">
              {/* Image with fallback */}
              <div className="relative h-64 md:h-[360px] overflow-hidden bg-gray-100">
                <img
                  src={featured.thumbnail || DEFAULT_IMAGE}
                  alt={featured.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = DEFAULT_IMAGE;
                  }}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent md:bg-gradient-to-t md:from-black/30 md:to-transparent" />

                {/* Date badge */}
                <div className="absolute top-4 left-4 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-[11px] font-semibold px-3 py-1.5 rounded-full shadow">
                  <CalendarDaysIcon className="w-3.5 h-3.5 text-[#8B4513]" />
                  {formatDate(featured.published_at)}
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col justify-center p-6 md:p-10">
                {/* Category Pill above title */}
                <div className="mb-3 flex items-center gap-2 flex-wrap">
                  <span className="inline-block text-[11px] font-bold text-[#8B4513] bg-[#F8F3EE] border border-[#E9DFD4] px-3.5 py-1 rounded-full uppercase tracking-wider">
                    {featured.category || 'BERITA'}
                  </span>
                  {featured.source && (
                    <span className="inline-block text-[11px] font-medium text-gray-500 bg-gray-50 border border-gray-200 px-3 py-1 rounded-full">
                      Sumber: <strong className="text-gray-700">{featured.source}</strong>
                    </span>
                  )}
                </div>

                <h2 className="text-xl md:text-2xl font-extrabold text-gray-900 leading-tight group-hover:text-[#6B3410] transition-colors line-clamp-3">
                  {featured.title}
                </h2>

                <p className="mt-3 text-sm text-gray-500 leading-relaxed line-clamp-3">
                  {featured.excerpt}
                </p>

                <div className="mt-6 flex items-center gap-2 text-sm font-bold text-[#8B4513] group-hover:text-[#55290A] transition-colors">
                  <span>{t('Baca selengkapnya')}</span>
                  <ArrowLongRightIcon className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* ── ARTICLE GRID ────────────────────────────── */}
        {!loading && gridArticles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridArticles.map((article) => (
              <Link
                key={article.slug}
                to={`/berita/${article.slug}`}
                className="group block rounded-2xl overflow-hidden bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:border-gray-200 transition-all duration-300 hover:-translate-y-1"
              >
                {/* Image with fallback */}
                <div className="relative h-52 overflow-hidden bg-gray-100">
                  <img
                    src={article.thumbnail || DEFAULT_IMAGE}
                    alt={article.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_IMAGE;
                    }}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

                  {/* Date badge */}
                  <div className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-semibold px-2.5 py-1 rounded-full shadow">
                    <CalendarDaysIcon className="w-3 h-3 text-[#8B4513]" />
                    {formatDate(article.published_at)}
                  </div>
                </div>

                {/* Body */}
                <div className="p-5">
                  {/* Category Pill above title */}
                  <div className="mb-2.5 flex items-center gap-2 flex-wrap">
                    <span className="inline-block text-[10px] font-bold text-[#8B4513] bg-[#F8F3EE] border border-[#E9DFD4] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {article.category || 'BERITA'}
                    </span>
                    {article.source && (
                      <span className="inline-block text-[10px] text-gray-500 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full truncate max-w-[160px]">
                        Sumber: {article.source}
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-gray-900 leading-snug group-hover:text-[#6B3410] transition-colors line-clamp-2 mb-2">
                    {article.title}
                  </h3>

                  <p className="text-xs text-gray-500 leading-relaxed line-clamp-3 mb-4">
                    {article.excerpt}
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-end pt-3 border-t border-gray-50">
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B4513] group-hover:text-[#55290A] transition-colors">
                      {t('Baca artikel')}
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 group-hover:bg-[#8B4513] group-hover:text-white transition-all">
                        <ArrowRightIcon className="w-3 h-3" />
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
