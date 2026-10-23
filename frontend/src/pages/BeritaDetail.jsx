import { useEffect, useState } from 'react';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import { usePageLoading } from '../context/LoadingContext.jsx';
import {
  CalendarDaysIcon,
  ClockIcon,
  UserCircleIcon,
  ShareIcon,
  BookOpenIcon,
  ArrowLeftIcon,
  CheckIcon,
  LinkIcon,
} from '@heroicons/react/24/outline';

const DEFAULT_IMAGE =
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80&w=1200';

/* ─── Helpers ─── */
function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function estimateReadTime(text) {
  if (!text) return '2 menit baca';
  const words = text.replace(/<[^>]*>/g, ' ').split(/\s+/).length;
  const mins = Math.max(2, Math.ceil(words / 150));
  return `${mins} menit baca`;
}

function calculateTimeAgo(dateStr) {
  if (!dateStr) return '3 minggu lalu';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days <= 1) return 'Hari ini';
  if (days < 7) return `${days} hari lalu`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} minggu lalu`;
  const months = Math.floor(days / 30);
  return `${months} bulan lalu`;
}

function formatArticleContent(content) {
  if (!content) return '';

  const trimmed = String(content).trim();
  if (!trimmed) return '';

  // Check if content already contains HTML block tags (<p>, <div>, <h1-6>, <ul>, <ol>, <br>, etc.)
  const hasHtmlBlocks = /<\/?(p|div|h[1-6]|ul|ol|li|blockquote|br)\b[^>]*>/i.test(trimmed);

  if (!hasHtmlBlocks) {
    // Split by newlines (double newlines or single newlines) into individual paragraphs
    const paragraphs = trimmed
      .split(/\r?\n\s*\r?\n/)
      .map((para) => para.trim())
      .filter(Boolean);

    if (paragraphs.length > 0) {
      return paragraphs
        .map((para) => {
          const withBr = para.replace(/\r?\n/g, '<br />');
          return `<p>${withBr}</p>`;
        })
        .join('');
    }
  }

  return trimmed;
}

export default function BeritaDetail() {
  const { t } = useTranslation();
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { reportReady } = usePageLoading();

  const [article, setArticle] = useState(null);
  const [sidebarArticles, setSidebarArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const isInformasiProyek =
    location.pathname.startsWith('/informasi-proyek') ||
    (article?.category || '').toUpperCase().includes('PROYEK');

  useEffect(() => {
    if (!slug) return;
    setLoading(true);

    const BACKEND_URL =
      import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL?.replace(/\/api\/?$/, '') || '';

    api
      .get(`/articles/${slug}`)
      .then((res) => {
        const item = res.data;
        if (item) {
          let thumb = DEFAULT_IMAGE;
          if (item.thumbnail_url) {
            thumb = item.thumbnail_url;
          } else if (item.thumbnail) {
            thumb = item.thumbnail.startsWith('http')
              ? item.thumbnail
              : `${BACKEND_URL}/storage/${item.thumbnail}`;
          }

          setArticle({
            ...item,
            thumbnail: thumb,
            category: item.category || (isInformasiProyek ? 'INFORMASI PROYEK' : 'BERITA'),
            author: item.author || 'Admin Redaksi',
            content: item.content || `<p>${item.excerpt || ''}</p>`,
          });
        } else {
          setArticle(null);
        }
      })
      .catch(() => {
        setArticle(null);
      })
      .finally(() => {
        setLoading(false);
        reportReady();
      });

    // Fetch sidebar articles matching context
    const sidebarCat = location.pathname.startsWith('/informasi-proyek')
      ? 'INFORMASI PROYEK'
      : 'BERITA';

    api
      .get('/articles', { params: { limit: 6, category: sidebarCat } })
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        const filtered = data.filter((a) => a.slug !== slug).slice(0, 5);
        setSidebarArticles(filtered);
      })
      .catch(() => {
        setSidebarArticles([]);
      });
  }, [slug, reportReady, location.pathname, isInformasiProyek]);

  // Scroll to top on navigation
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [slug]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: article?.title, url });
      } catch {
        /* user cancelled */
      }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // 404 / Not Found State
  if (!loading && !article) {
    return (
      <div className="min-h-screen bg-[#FDFBF9] flex flex-col items-center justify-center text-center px-6 pt-24 pb-16">
        <div className="w-20 h-20 rounded-full bg-amber-50 flex items-center justify-center text-[#8B4513] mb-5">
          <BookOpenIcon className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-gray-900">
          {t(isInformasiProyek ? 'Informasi Proyek Tidak Ditemukan' : 'Artikel Berita Tidak Ditemukan')}
        </h2>
        <p className="text-sm text-gray-500 max-w-md mt-2 mb-6">
          {t('Halaman atau informasi yang Anda cari mungkin telah dipindahkan atau belum dipublikasikan.')}
        </p>
        <button
          onClick={() => navigate(isInformasiProyek ? '/informasi-proyek' : '/berita')}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B4513] text-white rounded-xl text-sm font-semibold hover:bg-[#6B3410] transition-colors shadow-sm"
        >
          <ArrowLeftIcon className="w-4 h-4" />
          <span>{t(isInformasiProyek ? 'Kembali ke Informasi Proyek' : 'Kembali ke Semua Berita')}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800">
      {/* Back button header bar */}
      <div className="max-w-5xl mx-auto px-6 pt-24 md:pt-28 pb-4">
        <button
          onClick={() => navigate(isInformasiProyek ? '/informasi-proyek' : '/berita')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-[#8B4513] transition-colors py-1.5 px-3 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeftIcon className="w-3.5 h-3.5" />
          <span>{t(isInformasiProyek ? 'Kembali ke Informasi Proyek' : 'Kembali ke Semua Berita')}</span>
        </button>
      </div>

      {/* ── HEADER / TITLE SECTION (CENTERED) ── */}
      <header className="max-w-4xl mx-auto px-6 text-center pt-2 pb-8">
        {/* Category Badge Pill above Title */}
        <div className="mb-4">
          <span className="inline-block bg-[#F8F3EE] text-[#8B4513] text-[11px] font-bold tracking-wider px-3.5 py-1 rounded-full uppercase border border-[#E9DFD4]">
            {article?.category || (isInformasiProyek ? 'INFORMASI PROYEK' : 'BERITA')}
          </span>
        </div>

        {/* Article Title */}
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 leading-tight md:leading-[1.25] tracking-tight">
          {article?.title || (loading ? 'Memuat artikel...' : 'Judul Artikel')}
        </h1>

        {/* Metadata Bar (Author, Date) */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 flex-wrap mt-6 text-xs sm:text-sm text-gray-500">
          <div className="flex items-center gap-1.5">
            <UserCircleIcon className="w-4 h-4 text-[#8B4513]" />
            <span>
              Oleh <strong className="text-gray-800 font-semibold">{article?.author || 'TenagaAhli.com'}</strong>
            </span>
          </div>

          {article?.published_at && (
            <div className="flex items-center gap-1.5">
              <CalendarDaysIcon className="w-4 h-4 text-[#8B4513]" />
              <span>{formatDate(article?.published_at)}</span>
            </div>
          )}

          {article?.source && (
            <div className="flex items-center gap-1.5">
              <LinkIcon className="w-4 h-4 text-[#8B4513]" />
              <span>
                Sumber:{' '}
                {article.source.startsWith('http://') || article.source.startsWith('https://') ? (
                  <a
                    href={article.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B4513] font-semibold hover:underline"
                  >
                    {article.source.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]}
                  </a>
                ) : (
                  <strong className="text-gray-800 font-semibold">{article.source}</strong>
                )}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* ── HERO IMAGE (CENTERED FULL WIDTH IN CONTAINER) ── */}
      <section className="max-w-5xl mx-auto px-6 mb-8">
        <div className="rounded-2xl sm:rounded-3xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
          <img
            src={article?.thumbnail || DEFAULT_IMAGE}
            alt={article?.title || 'Gambar Berita'}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = DEFAULT_IMAGE;
            }}
            className="w-full h-72 sm:h-[420px] md:h-[480px] object-cover"
          />
        </div>
      </section>

      {/* ── TWO COLUMNS: ARTICLE CONTENT + SIDEBAR "BACA JUGA" ── */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <div className={`grid grid-cols-1 ${sidebarArticles.length > 0 ? 'lg:grid-cols-12' : ''} gap-10 lg:gap-12`}>
          {/* LEFT COLUMN: ARTICLE CONTENT */}
          <main className={sidebarArticles.length > 0 ? 'lg:col-span-8' : 'max-w-3xl mx-auto w-full'}>
            {/* Top action/tag bar */}
            <div className="flex items-center justify-between pb-5 mb-6 border-b border-gray-100 text-xs text-gray-500">
              <div className="flex items-center gap-2 text-[#8B4513] font-medium">
                <BookOpenIcon className="w-4 h-4 shrink-0" />
                <span>{isInformasiProyek ? 'Informasi Proyek TenagaAhli.com' : 'Artikel TenagaAhli.com'}</span>
              </div>

              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 hover:text-[#8B4513] transition-colors font-medium cursor-pointer"
              >
                {copied ? (
                  <>
                    <CheckIcon className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-600">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <ShareIcon className="w-4 h-4" />
                    <span>Bagikan</span>
                  </>
                )}
              </button>
            </div>

            {/* Paragraphs content */}
            {loading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-11/12" />
                <div className="h-4 bg-gray-200 rounded w-4/5" />
                <div className="h-20 bg-gray-100 rounded my-4" />
                <div className="h-4 bg-gray-200 rounded w-full" />
                <div className="h-4 bg-gray-200 rounded w-5/6" />
              </div>
            ) : (
              <article
                className="text-gray-800 text-[15px] sm:text-base md:text-[17px] space-y-6 sm:space-y-7
                  [&>p]:leading-[1.85] [&>p]:text-gray-700
                  [&>h2]:text-xl sm:[&>h2]:text-2xl [&>h2]:font-bold [&>h2]:text-gray-900 [&>h2]:mt-8 [&>h2]:mb-3
                  [&>h3]:text-lg sm:[&>h3]:text-xl [&>h3]:font-bold [&>h3]:text-gray-900 [&>h3]:mt-6 [&>h3]:mb-2
                  [&>ul]:list-disc [&>ul]:pl-6 [&>ul]:space-y-2 [&>ul]:my-4
                  [&>ol]:list-decimal [&>ol]:pl-6 [&>ol]:space-y-2 [&>ol]:my-4
                  [&>blockquote]:border-l-4 [&>blockquote]:border-[#8B4513] [&>blockquote]:pl-4 [&>blockquote]:italic [&>blockquote]:my-6 [&>blockquote]:text-gray-600
                  [&>strong]:font-semibold [&>strong]:text-gray-900
                  [&>a]:text-[#8B4513] [&>a]:font-semibold [&>a]:underline hover:[&>a]:text-[#6B3410]"
                dangerouslySetInnerHTML={{
                  __html:
                    formatArticleContent(article?.content) ||
                    `<p>${article?.excerpt || 'Konten sedang disiapkan.'}</p>`,
                }}
              />
            )}

            {/* Sumber Berita / Proyek Citation Box */}
            {article?.source && (
              <div className="mt-8 pt-4 pb-2 border-t border-gray-100 flex items-center gap-2 text-xs sm:text-sm text-gray-600 flex-wrap">
                <span className="font-bold text-[#8B4513] flex items-center gap-1.5">
                  <LinkIcon className="w-4 h-4" />
                  Sumber Referensi:
                </span>
                {article.source.startsWith('http://') || article.source.startsWith('https://') ? (
                  <a
                    href={article.source}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#8B4513] hover:underline font-semibold break-all"
                  >
                    {article.source}
                  </a>
                ) : (
                  <span className="font-medium text-gray-800">{article.source}</span>
                )}
              </div>
            )}
          </main>

          {/* RIGHT COLUMN: SIDEBAR "BACA JUGA" (only if articles exist) */}
          {sidebarArticles.length > 0 && (
            <aside className="lg:col-span-4">
              <div className="sticky top-28 space-y-6">
                {/* Heading with Brown underline bar */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 pb-2">
                    {t(isInformasiProyek ? 'Proyek Terkait' : 'Baca Juga')}
                  </h3>
                  <div className="w-12 h-[3px] bg-[#8B4513] rounded-full" />
                </div>

                {/* Sidebar Article List */}
                <div className="divide-y divide-gray-100 space-y-4 pt-1">
                  {sidebarArticles.map((item) => (
                    <div key={item.slug} className="pt-4 first:pt-0">
                      <Link
                        to={isInformasiProyek ? `/informasi-proyek/${item.slug}` : `/berita/${item.slug}`}
                        className="group block"
                      >
                        <h4 className="text-sm font-bold text-gray-800 leading-snug group-hover:text-[#8B4513] transition-colors line-clamp-3">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-gray-400 mt-1.5">
                          {item.timeAgo || calculateTimeAgo(item.published_at)}
                        </p>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            </aside>
          )}
        </div>
      </section>
    </div>
  );
}
