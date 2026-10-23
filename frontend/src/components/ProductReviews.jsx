import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';
import { getMediaUrl } from '../utils/media.js';

const STAR_GOLD = '#F59E0B';

// Star rating component
function StarRow({ rating = 0, size = 16, onRate, onHover, onLeave }) {
  return (
    <div className={`flex items-center gap-0.5 ${onRate ? 'select-none' : ''}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={() => onRate && onRate(n)}
          onMouseEnter={() => onHover && onHover(n)}
          onMouseLeave={() => onLeave && onLeave()}
          className={`material-symbols-outlined ${onRate ? 'cursor-pointer transition-transform hover:scale-110' : ''}`}
          style={{
            fontSize: size,
            fontVariationSettings: n <= rating ? "'FILL' 1" : "'FILL' 0",
            color: n <= rating ? STAR_GOLD : '#D1D5DB',
          }}
        >
          star
        </span>
      ))}
    </div>
  );
}

// Review card component
function ReviewCard({ review }) {
  const MAX_CHARS = 200;
  const isLong = (review.comment || '').length > MAX_CHARS;
  const [expanded, setExpanded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const displayText = expanded ? review.comment : review.comment?.substring(0, MAX_CHARS);

  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  };

  const userName = review.user?.name || 'Pengguna Terverifikasi';

  return (
    <div className="border-b border-gray-100 py-5 last:border-b-0 last:pb-0 first:pt-2">
      <div className="flex items-start gap-3.5 mb-3">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-gray-200 bg-[#E6F7F0] flex items-center justify-center">
          {review.user?.photo && !imgError ? (
            <img
              src={getMediaUrl(review.user.photo)}
              alt={userName}
              onError={() => setImgError(true)}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-[#008A62]">
              {getInitials(userName)}
            </span>
          )}
        </div>

        {/* User Info & Rating */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 flex-wrap mb-1">
            <h5 className="font-bold text-gray-900 text-sm truncate">{userName}</h5>
            <span className="text-xs text-gray-400">
              {new Date(review.created_at).toLocaleDateString('id-ID', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StarRow rating={review.rating} size={15} />
            <span className="text-xs font-bold text-gray-700">{review.rating}.0</span>
            <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-[#008A62] bg-[#E6F7F0] px-1.5 py-0.5 rounded">
              <span className="material-symbols-outlined text-[12px]">verified</span>
              Pembeli
            </span>
          </div>
        </div>
      </div>

      <p className="text-sm text-gray-600 leading-relaxed pl-[54px] sm:pl-[54px] whitespace-pre-line">
        {displayText}
        {isLong && !expanded && '...'}
      </p>

      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-bold text-[#008A62] hover:underline ml-[54px] mt-2 block"
        >
          {expanded ? 'Sembunyikan' : 'Baca selengkapnya'}
        </button>
      )}
    </div>
  );
}

// Review form component
function ReviewForm({ onSubmit, onCancel, submitting = false }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Silakan pilih rating bintang terlebih dahulu.');
      return;
    }

    if (!comment.trim() || comment.trim().length < 10) {
      setError('Ulasan minimal 10 karakter.');
      return;
    }

    setError('');
    const res = await onSubmit({ rating, comment: comment.trim() });
    if (!res?.error) {
      setComment('');
      setRating(0);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#FAFBF9] border border-gray-200/90 rounded-2xl p-5 mb-6 flex flex-col gap-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-gray-100 pb-3">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#008A62] text-[20px]">rate_review</span>
          <h4 className="text-base font-bold text-gray-900">Tulis Ulasan Produk</h4>
        </div>
        <button
          type="button"
          onClick={onCancel}
          className="w-7 h-7 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 flex items-center justify-center transition-colors"
          aria-label="Tutup form ulasan"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      {error && (
        <div className="text-xs text-red-700 bg-red-50 border border-red-200 px-3.5 py-2.5 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-[16px] text-red-500 shrink-0">error</span>
          <span>{error}</span>
        </div>
      )}

      {/* Rating input */}
      <div>
        <label className="text-xs font-bold text-gray-700 block mb-1.5">Rating Kepuasan</label>
        <div className="flex items-center gap-2" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              type="button"
              key={n}
              onMouseEnter={() => setHoverRating(n)}
              onClick={() => setRating(n)}
              className="p-1 rounded-lg hover:bg-amber-50 transition-colors cursor-pointer"
            >
              <span
                className="material-symbols-outlined text-[28px] transition-all"
                style={{
                  fontVariationSettings: n <= (hoverRating || rating) ? "'FILL' 1" : "'FILL' 0",
                  color: n <= (hoverRating || rating) ? STAR_GOLD : '#D1D5DB',
                }}
              >
                star
              </span>
            </button>
          ))}
          <span className="text-xs font-bold text-amber-600 ml-1">
            {(hoverRating || rating) > 0 ? `${hoverRating || rating} dari 5 Bintang` : 'Pilih Bintang'}
          </span>
        </div>
      </div>

      {/* Comment input */}
      <div>
        <label className="text-xs font-bold text-gray-700 block mb-1.5">Ulasan Anda</label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Ceritakan pengalaman Anda terkait materi, manfaat, atau kualitas produk ini..."
          rows="3"
          className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:border-[#008A62] focus:ring-2 focus:ring-[#008A62]/20 focus:outline-none text-sm resize-none bg-white transition-all placeholder:text-gray-400"
        />
        <div className="flex justify-between items-center text-xs text-gray-400 mt-1">
          <span>Minimal 10 karakter</span>
          <span>{comment.length}/1000</span>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={submitting || rating === 0 || comment.length < 10}
          className="flex-1 inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-[#008A62] hover:bg-[#00704F] disabled:bg-gray-300 disabled:cursor-not-allowed px-5 py-3 rounded-xl transition-all shadow-sm active:scale-95"
        >
          {submitting ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Mengirim Ulasan...</span>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[18px]">send</span>
              <span>Kirim Ulasan</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-3 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors"
        >
          Batal
        </button>
      </div>
    </form>
  );
}

export default function ProductReviews({ productId, onReviewAdded }) {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [hasReviewed, setHasReviewed] = useState(false);

  const loadReviews = () => {
    setLoading(true);
    setError('');
    api
      .get(`/products/${productId}/reviews`)
      .then((res) => {
        const data = res.data;
        setReviews(data.data || []);
        setAvgRating(data.avg_rating || 0);
        setHasPurchased(Boolean(data.has_purchased));
        setHasReviewed(Boolean(data.has_reviewed));
        setShowAllReviews(false);
      })
      .catch((err) => {
        console.error('Failed to load reviews:', err);
        setError('Gagal memuat ulasan produk.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();

    const userRaw = localStorage.getItem('amdal_user');
    if (userRaw) {
      try {
        setUser(JSON.parse(userRaw));
      } catch {
        setUser(null);
      }
    }
  }, [productId]);

  const handleAddReview = async ({ rating, comment }) => {
    try {
      if (!user) {
        navigate('/signin?redirect=' + encodeURIComponent(window.location.pathname));
        return { error: 'Silakan login terlebih dahulu' };
      }

      setSubmitting(true);
      const res = await api.post(`/products/${productId}/reviews`, {
        rating,
        comment,
      });

      setShowForm(false);
      setHasReviewed(true);
      loadReviews();

      if (onReviewAdded && res.data.product) {
        onReviewAdded(res.data.product);
      }

      return { success: true };
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal menyimpan ulasan.';
      alert(msg);
      return { success: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="py-4 space-y-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ulasan Produk</h2>
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-full border-3 border-[#008A62]/30 border-t-[#008A62] animate-spin" />
          <p className="text-xs sm:text-sm text-gray-500 font-medium">Memuat ulasan produk...</p>
        </div>
      </div>
    );
  }

  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 4);

  return (
    <div className="space-y-6">
      {/* Header & Rating Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Ulasan Produk</h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            Ulasan asli dan terverifikasi dari pembeli produk ini.
          </p>
        </div>

        {reviews.length > 0 && (
          <div className="flex items-center gap-3 bg-[#FAFBF9] border border-gray-200/80 px-4 py-2.5 rounded-2xl">
            <div className="text-2xl font-black text-gray-900">{avgRating.toFixed(1)}</div>
            <div className="flex flex-col">
              <StarRow rating={Math.round(avgRating)} size={16} />
              <span className="text-[11px] font-semibold text-gray-500 mt-0.5">
                {reviews.length} {reviews.length === 1 ? 'ulasan' : 'ulasan'}
              </span>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 text-red-700 text-xs sm:text-sm flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-red-500 shrink-0">warning</span>
          <span>{error}</span>
        </div>
      )}

      {/* Review Form or Eligibility Notice */}
      {!showForm ? (
        <div>
          {!user ? (
            <div className="bg-[#FAFBF9] border border-gray-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[20px]">lock</span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-gray-900">Ingin memberikan ulasan?</h4>
                  <p className="text-xs text-gray-500">Silakan login dan pastikan Anda telah membeli produk ini.</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/signin?redirect=' + encodeURIComponent(window.location.pathname))}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#008A62] hover:bg-[#00704F] text-white font-bold text-xs sm:text-sm transition-all shadow-sm shrink-0"
              >
                <span className="material-symbols-outlined text-[18px]">login</span>
                Masuk Sekarang
              </button>
            </div>
          ) : hasReviewed ? (
            <div className="bg-[#E6F7F0] border border-[#008A62]/20 rounded-2xl p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-[#008A62] text-[22px] shrink-0">check_circle</span>
              <p className="text-xs sm:text-sm font-bold text-[#008A62]">
                Anda telah memberikan ulasan untuk produk ini. Terima kasih atas partisipasi Anda!
              </p>
            </div>
          ) : !hasPurchased ? (
            <div className="bg-[#FAFBF9] border border-gray-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-500 text-[22px] shrink-0 mt-0.5">info</span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-gray-900">Ulasan Khusus Pembeli</h4>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                  Hanya pengguna yang telah membeli produk ini yang dapat memberikan ulasan dan rating.
                </p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="w-full px-6 py-3.5 bg-[#008A62] hover:bg-[#00704F] text-white font-bold text-sm rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
            >
              <span className="material-symbols-outlined text-[20px]">rate_review</span>
              Tulis Ulasan Produk
            </button>
          )}
        </div>
      ) : (
        <ReviewForm
          onSubmit={handleAddReview}
          onCancel={() => setShowForm(false)}
          submitting={submitting}
        />
      )}

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="bg-[#FAFBF9] rounded-2xl border border-dashed border-gray-200 p-8 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
            <span className="material-symbols-outlined text-[24px]">rate_review</span>
          </div>
          <p className="text-sm font-bold text-gray-700">Belum ada ulasan untuk produk ini</p>
          <p className="text-xs text-gray-400 mt-1 max-w-sm">
            Jadilah yang pertama membeli dan memberikan ulasan setelah menyelesaikan pesanan.
          </p>
        </div>
      ) : (
        <div>
          <div className="divide-y divide-gray-100">
            {displayedReviews.map((r) => (
              <ReviewCard key={r.id} review={r} />
            ))}
          </div>

          {reviews.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllReviews((v) => !v)}
              className="text-xs sm:text-sm font-bold text-[#008A62] hover:underline mt-4 inline-flex items-center gap-1"
            >
              <span>{showAllReviews ? 'Sembunyikan sebagian ulasan' : `Lihat semua ${reviews.length} ulasan`}</span>
              <span className="material-symbols-outlined text-[16px]">
                {showAllReviews ? 'expand_less' : 'expand_more'}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
