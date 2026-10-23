import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import ConsultationMedalBadge from './ConsultationMedalBadge.jsx';
import medalWhiteImg from '../assets/medals/medal-white.png';
import medalBlueImg from '../assets/medals/medal-blue.png';
import medalSilverImg from '../assets/medals/medal-silver.png';
import medalGoldImg from '../assets/medals/medal-gold.png';
import medalPlatinumImg from '../assets/medals/medal-platinum.png';
import medalDiamondImg from '../assets/medals/medal-diamond.png';

const TIER_IMAGES = {
  white: medalWhiteImg,
  blue: medalBlueImg,
  silver: medalSilverImg,
  gold: medalGoldImg,
  platinum: medalPlatinumImg,
  diamond: medalDiamondImg,
};

export default function MedalProgressionWidget({ expert, medal, className = '' }) {
  const medalData = medal || expert?.consultation_medal;

  if (!medalData) return null;

  const isEligible = Boolean(medalData.eligible);
  const currentTier = medalData.tier;
  const count = Number(medalData.consultations_count ?? 0);
  const nextTier = medalData.next_tier;
  const neededForNext = Number(medalData.needed_for_next ?? 0);
  const daysRemaining = medalData.days_remaining;
  const deadline = medalData.renewal_deadline;
  const allTiers = medalData.all_tiers || [
    { key: 'white', name: 'White', stage: 1, min: 1, max: 10, range_text: '1 - 10', color: '#94A3B8' },
    { key: 'blue', name: 'Blue', stage: 2, min: 11, max: 30, range_text: '11 - 30', color: '#2563EB' },
    { key: 'silver', name: 'Silver', stage: 3, min: 31, max: 50, range_text: '31 - 50', color: '#64748B' },
    { key: 'gold', name: 'Gold', stage: 4, min: 51, max: 75, range_text: '51 - 75', color: '#D97706' },
    { key: 'platinum', name: 'Platinum', stage: 5, min: 76, max: 100, range_text: '76 - 100', color: '#0891B2' },
    { key: 'diamond', name: 'Diamond', stage: 6, min: 101, max: '100+', range_text: '> 100', color: '#7C3AED' },
  ];

  // Paket standar (belum Ekonomis/Eksklusif): tampilan tetap sama seperti akun berbayar,
  // hanya saja medali terkunci & bagian progres diganti ajakan upgrade paket.

  // Persentase kemajuan menuju next tier
  let progressPercent = 0;
  if (currentTier === 'diamond') {
    progressPercent = 100;
  } else if (nextTier && nextTier.target) {
    const currentMin = medalData.min_consultations || 0;
    const target = nextTier.target;
    const range = Math.max(1, target - currentMin);
    progressPercent = Math.min(100, Math.max(0, Math.round(((count - currentMin) / range) * 100)));
  }

  return (
    <div className={`bg-white rounded-2xl border border-gray-200/90 shadow-sm overflow-hidden ${className}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-[#1E293B] to-slate-900 p-5 sm:p-6 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-inner overflow-hidden">
              {TIER_IMAGES[currentTier] ? (
                <img src={TIER_IMAGES[currentTier]} alt={medalData.tier_label || currentTier} className="w-10 h-12 object-contain drop-shadow-md" />
              ) : (
                <span className="material-symbols-outlined text-3xl text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {medalData.icon || 'military_tech'}
                </span>
              )}
            </div>
            {currentTier && (
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-slate-900" />
              </span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-extrabold text-white text-base sm:text-lg">
                Prestasi Medali Konsultasi Tahunan
              </h3>
              {!isEligible ? (
                <span className="inline-flex items-center gap-1 text-[10.5px] font-bold uppercase tracking-wider bg-amber-400/20 border border-amber-300/40 px-2 py-0.5 rounded-full text-amber-200">
                  <span className="material-symbols-outlined text-[13px]">lock</span>
                  Terkunci — Paket Standar
                </span>
              ) : currentTier ? (
                <ConsultationMedalBadge medal={medalData} variant="ribbon" />
              ) : (
                <span className="text-[10.5px] font-bold uppercase tracking-wider bg-white/15 px-2 py-0.5 rounded-full text-slate-300">
                  Belum Ada Medali (0 Konsultasi)
                </span>
              )}
            </div>
            {isEligible ? (
              <p className="text-xs text-slate-300 mt-1">
                Siklus Aktif: {medalData.cycle_start || 'Mulai'} s/d {medalData.cycle_end || '1 Tahun'}
                {daysRemaining !== null && (
                  <span className="ml-2 font-bold text-amber-300">({daysRemaining} hari tersisa)</span>
                )}
              </p>
            ) : (
              <p className="text-xs text-slate-300 mt-1">
                Aktif setelah upgrade ke <strong className="text-amber-300">Paket Ekonomis</strong> atau <strong className="text-amber-300">Eksklusif</strong>.
              </p>
            )}
          </div>
        </div>

        {/* Counter Konsultasi */}
        <div className="bg-white/10 backdrop-blur-md border border-white/15 rounded-xl px-4 py-2.5 text-center self-stretch sm:self-auto shrink-0">
          <p className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Konsultasi Tahun Ini</p>
          <p className="text-xl sm:text-2xl font-black text-amber-400">
            {count} <span className="text-xs font-semibold text-white/80">orang</span>
          </p>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 sm:p-6 space-y-6">
        {/* Paket standar: ajakan upgrade menggantikan progress bar */}
        {!isEligible && (
          <div className="bg-gradient-to-br from-amber-900/10 via-white to-amber-50 rounded-xl border border-amber-200/80 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-300 text-amber-700 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">military_tech</span>
              </div>
              <p className="text-xs text-gray-600 leading-relaxed max-w-xl">
                Tingkatkan profil Anda ke <strong>Paket Ekonomis</strong> atau <strong>Eksklusif</strong> untuk mendapatkan medali prestasi konsultasi tahunan (White, Blue, Silver, Gold, Platinum, Diamond) pada profil dan kartu direktori pencarian Anda.
              </p>
            </div>
            <Link
              to="/paket"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#8B4513] text-white text-xs font-bold shadow-md hover:bg-[#6B3410] active:scale-95 transition-all shrink-0"
            >
              <span className="material-symbols-outlined text-[16px]">workspace_premium</span>
              <span>Upgrade Paket</span>
            </Link>
          </div>
        )}

        {/* Next Tier Progress Bar */}
        {isEligible && (
        <div>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="font-bold text-gray-700">
              {currentTier ? (
                <span>
                  Status Saat Ini: <strong className="text-[#8B4513]">{medalData.tier_label}</strong>
                </span>
              ) : (
                <span>Mulai Raih Medali Pertama</span>
              )}
            </span>
            {nextTier ? (
              <span className="text-gray-500">
                Target Selanjutnya: <strong style={{ color: nextTier.color }}>{nextTier.label}</strong> ({nextTier.target} orang/thn)
              </span>
            ) : (
              <span className="font-extrabold text-purple-600">🏆 Medali Tertinggi Tercapai (Diamond)!</span>
            )}
          </div>

          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden p-0.5 border border-gray-200">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 transition-all duration-700"
              style={{ width: `${Math.max(5, progressPercent)}%` }}
            />
          </div>

          {nextTier && (
            <p className="text-xs text-gray-500 mt-2 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-[#8B4513]">trending_up</span>
              <span>
                Butuh <strong>{neededForNext} konsultasi</strong> lagi tahun ini untuk naik ke <strong>{nextTier.label}</strong>.
              </span>
            </p>
          )}
        </div>
        )}

        {/* 6 Tahapan Medali Cards Grid */}
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            6 Tahapan Medali Konsultasi
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {allTiers.map((t) => {
              const isCurrent = t.key === currentTier;
              const isAchieved = t.is_passed || isCurrent;
              return (
                <div
                  key={t.key}
                  className={`rounded-xl p-3 border text-center transition-all ${
                    isCurrent
                      ? 'border-2 border-amber-400 bg-amber-50/70 shadow-md ring-2 ring-amber-400/20 -translate-y-0.5'
                      : isAchieved
                      ? 'border-gray-300 bg-gray-50/80 text-gray-800'
                      : 'border-dashed border-gray-200 bg-white opacity-60 text-gray-400'
                  }`}
                >
                  <div
                    className="w-11 h-11 rounded-full mx-auto mb-1.5 flex items-center justify-center overflow-hidden p-0.5"
                    style={{ backgroundColor: `${t.color}20`, color: t.color }}
                  >
                    {TIER_IMAGES[t.key] ? (
                      <img src={TIER_IMAGES[t.key]} alt={t.name} className="w-[34px] h-10 object-contain drop-shadow-sm" />
                    ) : (
                      <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: isAchieved ? "'FILL' 1" : "'FILL' 0" }}>
                        {t.icon || 'military_tech'}
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-black truncate" style={{ color: isCurrent ? '#8B4513' : 'inherit' }}>
                    {t.name}
                  </p>
                  <p className="text-[10px] font-bold text-gray-500 mt-0.5 leading-tight">
                    {t.range_text}
                  </p>
                  {isCurrent && (
                    <span className="inline-block mt-1 text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-200 text-amber-900">
                      Aktif
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Aturan Retensi & Perpanjangan (Penting Sesuai Aturan Sistem) */}
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-4 text-xs text-amber-950 space-y-2">
          <div className="flex items-center gap-2 font-bold text-amber-900">
            <span className="material-symbols-outlined text-[18px]">info</span>
            <span>Aturan Retensi Medali & Masa Perpanjangan</span>
          </div>
          <ul className="list-disc list-inside space-y-1 text-gray-700 leading-relaxed">
            <li>
              <strong>Peningkatan Peringkat:</strong> Selama dalam tahun berjalan, medali otomatis naik saat jumlah konsultasi melampaui batas ambang peringkat berikutnya.
            </li>
            <li>
              <strong>Mempertahankan Medali Tahun Depan:</strong> Pada perpanjangan berikutnya, Anda harus mempertahankan jumlah konsultasi tahun ini. Jika di tahun baru perolehan konsultasi lebih rendah, medali akan menyesuaikan ke jumlah yang berhasil diraih.
            </li>
            <li>
              <strong>Pinalti Keterlambatan:</strong> Jika Anda telat melakukan perpanjangan dan <em>melewati tanggal perpanjangan ({deadline || 'akhir periode'})</em>, medali akan <strong>turun ke tahap awal (reset)</strong> dan siklus baru akan dimulai ulang pada tanggal dan bulan perpanjangan yang baru.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

MedalProgressionWidget.propTypes = {
  expert: PropTypes.object,
  medal: PropTypes.object,
  className: PropTypes.string,
};
