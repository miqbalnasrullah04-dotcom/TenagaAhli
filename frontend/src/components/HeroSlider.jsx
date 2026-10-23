import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTika } from '../context/TikaContext.jsx';

// Banner assets
import banner1 from '../assets/TIKA2.png';
import banner2 from '../assets/Ahli4.png';
import banner3 from '../assets/daftar.png';
import banner4 from '../assets/new produk2.png';

const BANNER_SLIDES = [
  {
    id: 'banner-1',
    image: banner1,
    title: 'TIKA Chatbot AI',
    actionType: 'tika',
  },
  {
    id: 'banner-2',
    image: banner2,
    title: 'Asistensi Tenaga Ahli',
    actionType: 'link',
    to: '/daftar-profil',
  },
  {
    id: 'banner-3',
    image: banner3,
    title: 'Daftar Tenaga Ahli',
    actionType: 'link',
    to: '/daftar',
  },
  {
    id: 'banner-4',
    image: banner4,
    title: 'Pasang Produk Anda',
    actionType: 'link',
    to: '/sign-in',
  },
];

const AUTO_INTERVAL = 7000; // 7 detik per slide

export default function HeroSlider() {
  const navigate = useNavigate();
  const { openChat } = useTika();

  const [slides] = useState(BANNER_SLIDES);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [withTransition, setWithTransition] = useState(true);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const startXRef = useRef(0);
  const isSwipingRef = useRef(false);
  const hasMovedRef = useRef(false);

  const totalSlides = slides.length;

  // Extended slides with clone for infinite smooth loop
  const extendedSlides = totalSlides > 0 ? [...slides, { ...slides[0], id: 'clone-first' }] : [];

  const nextSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setWithTransition(true);
    setCurrentIndex((prev) => prev + 1);
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    if (totalSlides <= 1) return;
    setWithTransition(true);
    setCurrentIndex((prev) => (prev === 0 ? totalSlides - 1 : prev - 1));
  }, [totalSlides]);

  const handleTransitionEnd = () => {
    if (currentIndex >= totalSlides) {
      setWithTransition(false);
      setCurrentIndex(0);
    }
  };

  // Re-enable transition smoothly after instant reset from clone back to 0
  useEffect(() => {
    if (!withTransition) {
      const raf = requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setWithTransition(true);
        });
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [withTransition]);

  // Auto scroll timer
  useEffect(() => {
    if (totalSlides <= 1 || isDragging) return;

    const timer = setInterval(() => {
      nextSlide();
    }, AUTO_INTERVAL);

    return () => clearInterval(timer);
  }, [nextSlide, totalSlides, isDragging, currentIndex]);

  const goToSlide = (index) => {
    setWithTransition(true);
    setCurrentIndex(index);
  };

  // ── Drag & Touch Handlers untuk Geser Manual ──
  const handleDragStart = (clientX) => {
    if (totalSlides <= 1) return;
    setIsDragging(true);
    isSwipingRef.current = true;
    hasMovedRef.current = false;
    startXRef.current = clientX;
    setWithTransition(false);
  };

  const handleDragMove = (clientX) => {
    if (!isSwipingRef.current) return;
    const diff = clientX - startXRef.current;
    if (Math.abs(diff) > 6) {
      hasMovedRef.current = true;
    }
    setDragOffset(diff);
  };

  const handleDragEnd = () => {
    if (!isSwipingRef.current) return;
    isSwipingRef.current = false;
    setIsDragging(false);
    setWithTransition(true);

    const threshold = 40; // Sensitivitas swipe dalam pixel
    if (dragOffset < -threshold) {
      nextSlide();
    } else if (dragOffset > threshold) {
      prevSlide();
    }
    setDragOffset(0);
  };

  // ── Action saat Banner Diklik (Smart Auth Routing) ──
  const handleSlideClick = (slide) => {
    // Jika sedang drag / swipe, abaikan click
    if (hasMovedRef.current) return;

    if (slide.actionType === 'tika') {
      openChat('tika');
      return;
    }

    // Ambil data user dari localStorage
    let user = null;
    try {
      const token = localStorage.getItem('amdal_token');
      const userRaw = localStorage.getItem('amdal_user');
      if (token && userRaw) {
        user = JSON.parse(userRaw);
      }
    } catch {
      user = null;
    }

    // Banner 4: Pasang Produk Anda
    if (slide.id === 'banner-4') {
      if (!user) {
        navigate('/sign-in');
      } else if (user.role === 'admin') {
        navigate('/admin/pembayaran-produk');
      } else if (user.role_type === 'tenaga_ahli' || user.role_type === 'surveyor') {
        // Sudah login sebagai tenaga ahli/surveyor -> langsung ke kelola produk
        navigate('/produk');
      } else {
        // Klien: arahkan ke pemilihan paket / upgrade membership
        navigate('/paket');
      }
      return;
    }

    // Banner 3: Daftar Tenaga Ahli
    if (slide.id === 'banner-3') {
      if (!user) {
        navigate('/daftar');
      } else if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role_type === 'tenaga_ahli') {
        navigate('/dashboard');
      } else if (user.role_type === 'surveyor') {
        navigate('/dashboard-surveyor');
      } else {
        // Klien yang ingin jadi tenaga ahli
        navigate('/paket');
      }
      return;
    }

    if (slide.actionType === 'link' && slide.to) {
      navigate(slide.to);
    }
  };

  const activeDotIndex = totalSlides > 0 ? currentIndex % totalSlides : 0;

  if (totalSlides === 0) return null;

  return (
    <section className="w-full px-0 sm:px-10 md:px-16 lg:px-20 xl:px-24 2xl:px-32 select-none relative group">
      {/* Container Banner - aspect ratio 3:1 sesuai proporsi banner asli */}
      <div
        className="relative w-full rounded-none sm:rounded-[24px] lg:rounded-[32px] overflow-hidden shadow-lg bg-[#150a2a] cursor-pointer touch-pan-y"
        style={{ aspectRatio: '3/1' }}
        onMouseDown={(e) => handleDragStart(e.clientX)}
        onMouseMove={(e) => handleDragMove(e.clientX)}
        onMouseUp={handleDragEnd}
        onMouseLeave={handleDragEnd}
        onTouchStart={(e) => handleDragStart(e.touches[0].clientX)}
        onTouchMove={(e) => handleDragMove(e.touches[0].clientX)}
        onTouchEnd={handleDragEnd}
      >
        {/* Track Slider */}
        <div
          className="flex h-full w-full will-change-transform transform-gpu"
          style={{
            transform: `translate3d(calc(-${currentIndex * 100}% + ${dragOffset}px), 0, 0)`,
            transition: withTransition ? 'transform 900ms cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          }}
          onTransitionEnd={handleTransitionEnd}
        >
          {extendedSlides.map((slide, idx) => (
            <div
              key={`${slide.id}-${idx}`}
              onClick={() => handleSlideClick(slide)}
              className="relative w-full min-w-full h-full shrink-0 -mr-[1px] bg-[#150a2a] overflow-hidden cursor-pointer"
            >
              <img
                src={slide.image}
                alt={slide.title || 'Banner'}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = banner1;
                }}
                className="w-full h-full object-cover select-none block pointer-events-none"
                draggable={false}
              />
            </div>
          ))}
        </div>

        {/* Tombol Panah Navigasi Kiri & Kanan (Desktop) */}
        {totalSlides > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevSlide();
              }}
              className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 border border-white/20 shadow-md cursor-pointer"
              aria-label="Previous Slide"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_left</span>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextSlide();
              }}
              className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-sm items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 active:scale-95 border border-white/20 shadow-md cursor-pointer"
              aria-label="Next Slide"
            >
              <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </button>
          </>
        )}
      </div>

      {/* Indikator Titik (Dots) Interaktif */}
      {totalSlides > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4 pb-2">
          {slides.map((slide, index) => (
            <button
              key={`${slide.id}-${index}`}
              onClick={() => goToSlide(index)}
              className={`block h-2 rounded-full transition-all duration-500 ease-in-out cursor-pointer ${
                index === activeDotIndex
                  ? 'w-8 bg-[#8B4513] shadow-sm shadow-[#8B4513]/40'
                  : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Pindah ke slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
