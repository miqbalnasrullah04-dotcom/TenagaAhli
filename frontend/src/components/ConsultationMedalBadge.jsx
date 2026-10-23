import PropTypes from 'prop-types';
import medalWhiteImg from '../assets/medals/medal-white.png';
import medalBlueImg from '../assets/medals/medal-blue.png';
import medalSilverImg from '../assets/medals/medal-silver.png';
import medalGoldImg from '../assets/medals/medal-gold.png';
import medalPlatinumImg from '../assets/medals/medal-platinum.png';
import medalDiamondImg from '../assets/medals/medal-diamond.png';

/**
 * 6 Tingkatan Medali Keanggotaan Berbayar (Ekonomis & Eksklusif):
 * 1. White   : 1 - 10 orang / tahun
 * 2. Blue    : 11 - 30 orang / tahun
 * 3. Silver  : 31 - 50 orang / tahun
 * 4. Gold    : 51 - 75 orang / tahun
 * 5. Platinum: 76 - 100 orang / tahun
 * 6. Diamond : > 100 orang / tahun
 * 
 * Aturan:
 * - Hanya muncul untuk paket Ekonomis / Eksklusif.
 * - Jika belum ada yang konsultasi (0 orang), badge TIDAK muncul.
 */
const MEDAL_CONFIG = {
  white: {
    key: 'white',
    name: 'White',
    stageLabel: 'Tahap 1',
    label: 'Medali White',
    range: '1 - 10 orang/thn',
    icon: 'military_tech',
    image: medalWhiteImg,
    ribbonColor: '#94A3B8',
    bgBadge: 'bg-gradient-to-r from-slate-100 via-white to-slate-200',
    borderBadge: 'border-slate-300 shadow-sm',
    textColor: 'text-slate-800',
    iconColor: '#64748B',
    medalGlow: 'drop-shadow-[0_2px_4px_rgba(148,163,184,0.35)]',
    description: '1–10 konsultasi per tahun',
  },
  blue: {
    key: 'blue',
    name: 'Blue',
    stageLabel: 'Tahap 2',
    label: 'Medali Blue',
    range: '11 - 30 orang/thn',
    icon: 'military_tech',
    image: medalBlueImg,
    ribbonColor: '#2563EB',
    bgBadge: 'bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 text-white',
    borderBadge: 'border-blue-400 shadow-md',
    textColor: 'text-white',
    iconColor: '#93C5FD',
    medalGlow: 'drop-shadow-[0_2px_6px_rgba(37,99,235,0.45)]',
    description: '11–30 konsultasi per tahun',
  },
  silver: {
    key: 'silver',
    name: 'Silver',
    stageLabel: 'Tahap 3',
    label: 'Medali Silver',
    range: '31 - 50 orang/thn',
    icon: 'military_tech',
    image: medalSilverImg,
    ribbonColor: '#64748B',
    bgBadge: 'bg-gradient-to-r from-slate-300 via-gray-200 to-zinc-400 text-slate-900',
    borderBadge: 'border-slate-400 shadow-md',
    textColor: 'text-slate-900',
    iconColor: '#334155',
    medalGlow: 'drop-shadow-[0_2px_6px_rgba(100,116,139,0.45)]',
    description: '31–50 konsultasi per tahun',
  },
  gold: {
    key: 'gold',
    name: 'Gold',
    stageLabel: 'Tahap 4',
    label: 'Medali Gold',
    range: '51 - 75 orang/thn',
    icon: 'workspace_premium',
    image: medalGoldImg,
    ribbonColor: '#D97706',
    bgBadge: 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-amber-950',
    borderBadge: 'border-amber-300 shadow-lg',
    textColor: 'text-amber-950',
    iconColor: '#78350F',
    medalGlow: 'drop-shadow-[0_2px_8px_rgba(217,119,6,0.55)]',
    description: '51–75 konsultasi per tahun',
  },
  platinum: {
    key: 'platinum',
    name: 'Platinum',
    stageLabel: 'Tahap 5',
    label: 'Medali Platinum',
    range: '76 - 100 orang/thn',
    icon: 'verified',
    image: medalPlatinumImg,
    ribbonColor: '#475569',
    bgBadge: 'bg-gradient-to-r from-slate-600 via-slate-500 to-zinc-700 text-white',
    borderBadge: 'border-slate-400 shadow-lg',
    textColor: 'text-white',
    iconColor: '#E2E8F0',
    medalGlow: 'drop-shadow-[0_2px_8px_rgba(71,85,105,0.55)]',
    description: '76–100 konsultasi per tahun',
  },
  diamond: {
    key: 'diamond',
    name: 'Diamond',
    stageLabel: 'Tahap 6',
    label: 'Medali Diamond',
    range: '> 100 orang/thn',
    icon: 'diamond',
    image: medalDiamondImg,
    ribbonColor: '#0284C7',
    bgBadge: 'bg-gradient-to-r from-sky-500 via-cyan-400 to-teal-500 text-white',
    borderBadge: 'border-cyan-300 shadow-xl',
    textColor: 'text-white',
    iconColor: '#E0F2FE',
    medalGlow: 'drop-shadow-[0_3px_10px_rgba(2,132,199,0.65)]',
    description: 'Lebih dari 100 konsultasi per tahun',
  },
};

export function hasActiveMedal(expert, medal) {
  const medalData = medal || expert?.consultation_medal;
  if (!medalData) return false;
  const isEligible = Boolean(medalData.eligible !== false);
  const tierKey = String(medalData.tier || '').toLowerCase();
  return Boolean(isEligible && MEDAL_CONFIG[tierKey]);
}

export default function ConsultationMedalBadge({
  medal,
  expert,
  size = 'md',
  variant = 'badge', // 'badge', 'compact', 'profile', 'ribbon', 'icon-only', 'avatar'
  showLabel = true,
  className = '',
}) {
  // Ambil data medali dari props medal langsung atau dari expert.consultation_medal
  const medalData = medal || expert?.consultation_medal;

  if (!medalData) return null;

  // Cek apakah eligible dan memiliki tier medali aktif
  // Hanya muncul untuk Ekonomis & Eksklusif DAN jika jumlah konsultasi >= 1 (atau sudah punya medal aktif)
  const isEligible = Boolean(medalData.eligible !== false);
  const tierKey = String(medalData.tier || '').toLowerCase();
  const config = MEDAL_CONFIG[tierKey];

  if (!isEligible || !config) {
    return null; // Tidak muncul jika 0 konsultasi atau belum berbayar
  }

  const count = Number(medalData.consultations_count ?? 0);
  const deadline = medalData.renewal_deadline;
  const tooltipText = `${config.label} (${count > 0 ? `${count} konsultasi tahun ini` : config.range}). ${
    deadline ? `Target pertahankan hingga ${deadline}.` : ''
  }`;

  // ── VARIANT: AVATAR (Menggantikan bulatan online/offline di pojok avatar foto profil) ──
  if (variant === 'avatar') {
    return (
      <div
        className={`absolute -bottom-1 -right-1 sm:-bottom-1.5 sm:-right-1.5 w-5 h-6 sm:w-6 sm:h-7.5 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 select-none z-10 ${className}`}
        title={tooltipText}
      >
        {config.image ? (
          <img
            src={config.image}
            alt={config.label}
            className="w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
          />
        ) : (
          <span
            className="material-symbols-outlined text-[16px] drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]"
            style={{ color: config.iconColor, fontVariationSettings: "'FILL' 1" }}
          >
            {config.icon}
          </span>
        )}
      </div>
    );
  }

  // ── VARIANT: ICON-ONLY (Hanya Badge Medali Tanpa Teks & Tanpa Jumlah - Untuk Pojok Kanan Atas Card) ──
  if (variant === 'icon-only') {
    const containerSizes = {
      sm: 'w-[30px] h-[30px]',
      md: 'w-[34px] h-[34px] sm:w-9 sm:h-9',
      lg: 'w-10 h-10 sm:w-11 sm:h-11',
    };
    const imgSizes = {
      sm: 'w-5 h-6',
      md: 'w-[22px] h-[28px] sm:w-6 sm:h-8',
      lg: 'w-7 h-[38px] sm:w-[30px] sm:h-10',
    };
    const iconSizes = {
      sm: 'text-[15px]',
      md: 'text-[18px] sm:text-[20px]',
      lg: 'text-[22px]',
    };

    return (
      <div
        className={`inline-flex items-center justify-center shrink-0 transition-transform duration-200 hover:scale-110 cursor-pointer select-none ${className}`}
        title={tooltipText}
      >
        <div
          className={`${containerSizes[size] || containerSizes.md} rounded-full flex items-center justify-center bg-slate-900/50 hover:bg-slate-900/70 backdrop-blur-md border border-white/35 shadow-sm p-0.5 sm:p-1 transition-colors`}
        >
          {config.image ? (
            <img
              src={config.image}
              alt={config.label}
              className={`${imgSizes[size] || imgSizes.md} object-contain drop-shadow-[0_1px_3px_rgba(0,0,0,0.4)] shrink-0`}
            />
          ) : (
            <span
              className={`material-symbols-outlined leading-none ${iconSizes[size] || iconSizes.md}`}
              style={{ color: config.iconColor, fontVariationSettings: "'FILL' 1" }}
            >
              {config.icon}
            </span>
          )}
        </div>
      </div>
    );
  }

  // ── VARIANT: PROFILE (Tampilan Eksklusif di Halaman Profil) ──
  if (variant === 'profile') {
    return (
      <div
        className={`relative overflow-hidden inline-flex items-center gap-3 px-3.5 py-2.5 rounded-2xl border ${config.bgBadge} ${config.borderBadge} ${className} transition-all duration-500 hover:scale-[1.03] shadow-md hover:shadow-2xl group select-none [perspective:800px]`}
        title={tooltipText}
      >
        {/* Glass reflection top-sheen */}
        <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none rounded-t-2xl" />

        {/* 3D Diagonal Specular Light Beam (Mengkilap) */}
        <div className="absolute inset-0 w-2/3 h-full bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none animate-prism-sweep" />

        {/* 3D Medal container with 3D Tilt & Float */}
        <div className={`relative w-12 h-14 rounded-xl flex items-center justify-center shrink-0 bg-slate-900/65 backdrop-blur-md border border-white/50 shadow-inner p-1 [transform-style:preserve-3d] ${config.medalGlow}`}>
          {/* Sparkle flare on corner */}
          <div className="absolute -top-1.5 -right-1.5 w-4 h-4 text-amber-200 pointer-events-none animate-sparkle-flare">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-[0_0_4px_rgba(255,255,255,0.9)]">
              <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5L12 0Z" />
            </svg>
          </div>

          {config.image ? (
            <img
              src={config.image}
              alt={config.label}
              className="w-9 h-11 object-contain shrink-0 animate-medal-3d drop-shadow-lg"
            />
          ) : (
            <span
              className="material-symbols-outlined text-[24px] animate-medal-3d"
              style={{ color: config.iconColor, fontVariationSettings: "'FILL' 1" }}
            >
              {config.icon}
            </span>
          )}
        </div>

        {/* Label & Stage pill */}
        <div className="flex flex-col text-left z-10">
          <div className="flex items-center gap-1.5">
            <span className={`text-xs sm:text-sm font-black uppercase tracking-wider drop-shadow-sm ${config.textColor}`}>
              {config.label}
            </span>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-black/15 backdrop-blur-md border border-white/25 shadow-2xs">
              {config.stageLabel}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ── VARIANT: RIBBON (Sudut Card / Tampilan Mengambang Mewah) ──
  if (variant === 'ribbon') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border backdrop-blur-md ${config.bgBadge} ${config.borderBadge} ${config.textColor} ${config.medalGlow} ${className}`}
        title={tooltipText}
      >
        {config.image ? (
          <img src={config.image} alt="" className="w-3.5 h-4.5 sm:w-4 sm:h-5 object-contain -my-1 shrink-0 drop-shadow-2xs" />
        ) : (
          <span
            className="material-symbols-outlined text-[14px] shrink-0"
            style={{ color: config.iconColor, fontVariationSettings: "'FILL' 1" }}
          >
            {config.icon}
          </span>
        )}
        {showLabel && <span>{config.name}</span>}
        {count > 0 && <span className="opacity-90 font-extrabold">· {count}</span>}
      </div>
    );
  }

  // ── VARIANT: COMPACT (Ikon Medali Berkilau untuk Card) ──
  if (variant === 'compact') {
    return (
      <div
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide border shadow-sm ${config.bgBadge} ${config.borderBadge} ${config.textColor} ${className}`}
        title={tooltipText}
      >
        {config.image ? (
          <img src={config.image} alt="" className="w-3 h-4 object-contain -my-0.5 shrink-0" />
        ) : (
          <span
            className="material-symbols-outlined text-[13px] shrink-0"
            style={{ color: config.iconColor, fontVariationSettings: "'FILL' 1" }}
          >
            {config.icon}
          </span>
        )}
        {showLabel && <span>{config.name}</span>}
      </div>
    );
  }

  // ── VARIANT: BADGE (Default untuk Card & Elemen List) ──
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[9.5px]',
    md: 'px-2.5 py-1 text-[10.5px] sm:text-[11px]',
    lg: 'px-3 py-1.5 text-xs',
  };
  const iconSizes = {
    sm: 'text-[12px]',
    md: 'text-[14px]',
    lg: 'text-[16px]',
  };
  const imgSizes = {
    sm: 'w-3.5 h-4.5 -my-0.5',
    md: 'w-4 h-5.5 -my-1',
    lg: 'w-5 h-6.5 -my-1.5',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-black uppercase tracking-wider rounded-full border shadow-sm transition-transform hover:scale-105 select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${config.bgBadge} ${config.borderBadge} ${config.textColor} ${className}`}
      title={tooltipText}
    >
      {config.image ? (
        <img
          src={config.image}
          alt=""
          className={`${imgSizes[size] || imgSizes.md} object-contain shrink-0 drop-shadow-2xs`}
        />
      ) : (
        <span
          className={`material-symbols-outlined shrink-0 ${iconSizes[size] || iconSizes.md}`}
          style={{ color: config.iconColor, fontVariationSettings: "'FILL' 1" }}
        >
          {config.icon}
        </span>
      )}
      {showLabel && (
        <span className="font-extrabold truncate max-w-[130px]">
          {config.name}
        </span>
      )}
    </div>
  );
}

ConsultationMedalBadge.propTypes = {
  medal: PropTypes.object,
  expert: PropTypes.object,
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  variant: PropTypes.oneOf(['badge', 'compact', 'profile', 'ribbon', 'icon-only', 'avatar']),
  showLabel: PropTypes.bool,
  className: PropTypes.string,
};
