import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { getMediaUrl, getDefaultCover, getDefaultPhoto } from '../utils/media.js';
import { formatCompactLocation } from '../utils/formatters.js';
import ConsultationMedalBadge from './ConsultationMedalBadge.jsx';
import medalWhiteImg from '../assets/medals/medal-white.png';
import medalBlueImg from '../assets/medals/medal-blue.png';
import medalSilverImg from '../assets/medals/medal-silver.png';
import medalGoldImg from '../assets/medals/medal-gold.png';
import medalPlatinumImg from '../assets/medals/medal-platinum.png';
import medalDiamondImg from '../assets/medals/medal-diamond.png';

export default function ExpertCard({
  expert,
  variant = 'carousel',
  className = '',
  onClick,
  active = false,
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Fallback state in case the image fails to load
  const [coverError, setCoverError] = useState(false);
  const [photoError, setPhotoError] = useState(false);
  const [showMoreJobs, setShowMoreJobs] = useState(false);

  if (!expert) return null;

  // Ekstraksi kriteria profesional (bisa lebih dari satu: Tenaga Ahli, Tenaga Teknis, Surveyor)
  const rawCriteriaList = Array.isArray(expert.kriteria_list)
    ? expert.kriteria_list
    : (expert.kriteria ? String(expert.kriteria).split(',').map(s => s.trim()) : []);

  const hasAhli = rawCriteriaList.some(k => String(k).toLowerCase().includes('tenaga ahli')) ||
    (!rawCriteriaList.some(k => String(k).toLowerCase().includes('surveyor') || String(k).toLowerCase().includes('tenaga teknis')) && !expert.is_surveyor && expert.role_type !== 'surveyor' && expert.role_type !== 'tenaga_teknis');

  const isSurveyor = Boolean(
    expert.is_surveyor === true ||
    expert.role_type === 'surveyor' ||
    expert.user?.role_type === 'surveyor' ||
    rawCriteriaList.some((k) => String(k).toLowerCase().includes('surveyor')) ||
    String(expert.field || '').trim().toLowerCase().includes('surveyor')
  );

  const isTenagaTeknis = Boolean(
    expert.role_type === 'tenaga_teknis' ||
    expert.user?.role_type === 'tenaga_teknis' ||
    rawCriteriaList.some((k) => String(k).toLowerCase().includes('tenaga teknis')) ||
    String(expert.field || '').trim().toLowerCase().includes('tenaga teknis')
  );

  const criteriaBadges = (() => {
    const list = [];
    if (hasAhli) {
      list.push({
        id: 'tenaga-ahli',
        label: 'Tenaga Ahli',
        topClass: 'text-[#8B4513] border-amber-300/80 bg-white/95',
        bottomClass: 'bg-amber-50 text-[#8B4513] border-amber-200/80',
      });
    }
    if (isTenagaTeknis) {
      list.push({
        id: 'tenaga-teknis',
        label: 'Tenaga Teknis',
        topClass: 'text-emerald-700 border-emerald-300/80 bg-white/95',
        bottomClass: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
      });
    }
    if (isSurveyor) {
      list.push({
        id: 'surveyor',
        label: 'Surveyor',
        topClass: 'text-sky-700 border-sky-300/80 bg-white/95',
        bottomClass: 'bg-sky-50 text-sky-800 border-sky-200/80',
      });
    }
    if (list.length === 0) {
      list.push({
        id: 'tenaga-ahli',
        label: 'Tenaga Ahli',
        topClass: 'text-[#8B4513] border-amber-300/80 bg-white/95',
        bottomClass: 'bg-amber-50 text-[#8B4513] border-amber-200/80',
      });
    }
    return list;
  })();

  const hasAllThreeCriteria = Boolean(
    (Array.isArray(expert.kriteria_list) && expert.kriteria_list.length >= 3) ||
    criteriaBadges.length >= 3 ||
    (hasAhli && isTenagaTeknis && isSurveyor)
  );

  // Cek status membership & paket (Eksklusif vs Ekonomis)
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

  const isApprovedByAdmin = Boolean(expert.verified || expert.update_status === 'disetujui' || expert.profile_status === 'aktif');
  const isVerified = Boolean(isApprovedByAdmin && isPremium);

  const medalData = expert.consultation_medal;
  const currentMedal = (() => {
    if (!medalData || !medalData.has_badge || !medalData.tier) {
      return null;
    }
    const tier = String(medalData.tier).toLowerCase();
    const medalMap = {
      white: { img: medalWhiteImg, label: 'Medali White (Tahap 1)' },
      blue: { img: medalBlueImg, label: 'Medali Blue (Tahap 2)' },
      silver: { img: medalSilverImg, label: 'Medali Silver (Tahap 3)' },
      gold: { img: medalGoldImg, label: 'Medali Gold (Tahap 4)' },
      platinum: { img: medalPlatinumImg, label: 'Medali Platinum (Tahap 5)' },
      diamond: { img: medalDiamondImg, label: 'Medali Diamond (Tahap 6)' },
    };
    return medalMap[tier] || null;
  })();

  // Resolusi URL cover dan foto
  const defaultCover = getDefaultCover(expert.id);
  const defaultPhoto = getDefaultPhoto(expert.id);

  const rawCover = expert.cover_url || expert.cover;
  const rawPhoto = expert.photo_url || expert.photo;

  const coverSrc = coverError || !rawCover ? defaultCover : getMediaUrl(rawCover, defaultCover);
  const photoSrc = photoError || !rawPhoto ? defaultPhoto : getMediaUrl(rawPhoto, defaultPhoto);

  // Inisial nama untuk avatar fallback
  const getInitials = (name) => {
    if (!name) return 'TA';
    const parts = name.replace(/^(dr\.|ir\.|prof\.|drs\.|apt\.)\s*/i, '').trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + (parts[1] ? parts[1][0] : '')).toUpperCase();
  };

  // Ekstraksi pendidikan tertinggi (Hanya jenjang pendidikan tertinggi yang ditampilkan di samping avatar)
  const highestEducation = (() => {
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
    if (/\b(prof\.|dr\.|doktor|ph\.?d)/i.test(name)) return 'S3 - Doktor';
    if (/\b(m\.[a-z]+|magister|master|sp\.[a-z]+)/i.test(name)) return 'S2 - Magister';
    if (/\b(s\.[a-z]+|sarjana|d4)/i.test(name)) return 'S1 - Sarjana';
    if (/\b(a\.md|d3)/i.test(name)) return 'D3';

    return null;
  })();

  const rawExperiences = Array.isArray(expert.experiences)
    ? expert.experiences
    : (Array.isArray(expert.pengalamanKerja) ? expert.pengalamanKerja : []);
  const experiencesList = [...rawExperiences].sort((a, b) => {
    const aPrimary = Boolean(a.is_primary || a.is_utama || a.utama);
    const bPrimary = Boolean(b.is_primary || b.is_utama || b.utama);
    if (aPrimary && !bPrimary) return -1;
    if (!aPrimary && bPrimary) return 1;
    return 0;
  });
  const primaryJob = experiencesList.find(e => e.is_primary || e.is_utama || e.utama) || experiencesList[0];
  const primaryJobText = expert.primary_experience || primaryJob?.posisi || primaryJob?.jabatan || expert.pekerjaan || (isSurveyor ? 'Surveyor' : 'Tenaga Ahli');
  const hasMultipleJobs = experiencesList.length > 1;

  const handleCardClick = (e) => {
    if (onClick) {
      onClick(e);
    } else if (expert.slug) {
      navigate(`/profil/${expert.slug}`);
    } else if (expert.id) {
      navigate(`/profil/${expert.id}`);
    }
  };

  const isCompact = variant === 'compact';
  const isCarousel = variant === 'carousel';
  const kriteriaLabel = expert.kriteria || (isSurveyor ? 'Surveyor' : 'Tenaga Ahli');

  return (
    <div
      onClick={handleCardClick}
      className={`group relative rounded-2xl overflow-hidden transition-all duration-300 flex flex-col cursor-pointer ${
        isPlatinum
          ? 'bg-gradient-to-b from-slate-100/60 via-white to-white border-2 border-slate-400 shadow-md hover:shadow-2xl hover:border-slate-500 hover:-translate-y-1'
          : isPremium
          ? 'bg-gradient-to-b from-amber-50/40 via-white to-white border-2 border-amber-300/90 shadow-md hover:shadow-2xl hover:border-amber-400 hover:-translate-y-1'
          : 'bg-white border border-gray-200/90 shadow-sm hover:shadow-lg hover:border-gray-300 hover:-translate-y-1'
      } ${active ? '!ring-2 !ring-[#8B4513] !border-[#8B4513]' : ''} ${className}`}
      style={isCarousel ? { width: '340px', maxWidth: '84vw' } : {}}
    >
      {/* ── Top Luxury Accent Strip for Platinum / Premium ── */}
      {isPlatinum ? (
        <div className="h-1.5 w-full bg-gradient-to-r from-slate-500 via-gray-300 to-zinc-600 shrink-0" />
      ) : isPremium ? (
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 shrink-0" />
      ) : (
        <div className="h-1 w-full bg-gray-100 shrink-0" />
      )}

      {/* ── Cover Image ── */}
      <div className={`relative ${isCompact ? 'h-36 sm:h-40' : 'h-40 sm:h-48'} w-full overflow-hidden bg-slate-900 shrink-0`}>
        {coverError ? (
          <div className="w-full h-full bg-gradient-to-br from-slate-700 via-slate-800 to-zinc-900 flex items-center justify-center">
            <span className="material-symbols-outlined text-white/20 text-5xl">image</span>
          </div>
        ) : (
          <img
            src={coverSrc}
            alt=""
            onError={() => setCoverError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
            loading="lazy"
          />
        )}

        {/* Soft bottom vignette */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent pointer-events-none" />

        {/* ── Top Badges Row (Left badges + Right rating & Unverified badge) ── */}
        <div className="absolute top-2.5 sm:top-3 inset-x-2.5 sm:inset-x-3 flex items-center justify-between gap-1.5 sm:gap-2 z-10 pointer-events-none">
          {/* Left Badges Group (Kriteria Profesional: Dipisah Masing-Masing Sesuai Urutan) */}
          <div className="flex items-center gap-1 sm:gap-1.5 min-w-0 flex-nowrap pointer-events-auto overflow-hidden">
            {criteriaBadges.map((cb) => (
              <div
                key={cb.id}
                className={`inline-flex items-center px-2.5 sm:px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-black tracking-wider uppercase shadow-md border backdrop-blur-sm shrink-0 transition-transform hover:scale-105 ${cb.topClass}`}
                title={t(cb.label)}
              >
                <span>{t(cb.label)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Avatar Overlapping Cover & Kriteria Badge Row ── */}
      <div className="relative px-4 sm:px-5 flex items-center justify-between pt-3 sm:pt-3.5 pb-1 mb-2 z-10">
        <div className="relative shrink-0 -mt-11 sm:-mt-12">
          <div className={`w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full border-4 ${
            isPlatinum ? 'border-slate-300' : isPremium ? 'border-amber-200' : 'border-white'
          } shadow-md overflow-hidden bg-[#FAFBF9]`}>
            {photoError ? (
              <div className="w-full h-full bg-gradient-to-br from-[#8B4513] to-[#5C2E0B] text-white flex items-center justify-center font-bold text-base sm:text-lg select-none">
                {getInitials(expert.name)}
              </div>
            ) : (
              <img
                src={photoSrc}
                alt=""
                onError={() => setPhotoError(true)}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            )}
          </div>

          {/* Badge di Pojok Avatar: Medali (jika ada konsultasi di paket berbayar) ATAU Tanda Online jika belum ada medali */}
          {currentMedal ? (
            <div
              className="absolute -bottom-1.5 -right-1 w-7 h-9 sm:w-8 sm:h-10 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 select-none z-10"
              title={currentMedal.label}
            >
              <img
                src={currentMedal.img}
                alt={currentMedal.label}
                className="w-full h-full object-contain drop-shadow-[0_2px_5px_rgba(0,0,0,0.5)]"
              />
            </div>
          ) : (
            <span
              className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm ${expert.is_online ? 'bg-emerald-500' : 'bg-gray-400'}`}
              title={expert.is_online ? t('Online — Sedang aktif') : t('Offline')}
            >
              {expert.is_online && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
            </span>
          )}
        </div>

        {/* Pendidikan Tertinggi di Samping Avatar */}
        {highestEducation && (
          <div className="flex items-center justify-end min-w-0 shrink-0">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-lg text-[9.5px] sm:text-[10.5px] font-bold uppercase tracking-wider bg-amber-50 text-[#8B4513] border border-amber-200/90 shadow-2xs transition-colors"
              title={`${t('Pendidikan Tertinggi')}: ${highestEducation}`}
            >
              <span className="material-symbols-outlined text-[14px] sm:text-[15px] text-[#8B4513]/80 shrink-0">
                school
              </span>
              <span className="truncate max-w-[150px] sm:max-w-[190px]">{highestEducation}</span>
            </span>
          </div>
        )}
      </div>

      {/* ── Body ── */}
      <div className="px-4 sm:px-5 pb-4 flex flex-col flex-1">
        {/* Name (Mendukung nama panjang & gelar lengkap hingga 2 baris agar tidak terpotong canggung) */}
        <div className="mb-1.5 min-h-[44px] flex items-center">
          <h3
            className={`font-bold text-[#1F2A22] leading-snug line-clamp-2 group-hover:text-[#8B4513] transition-colors ${
              (expert.name || '').length > 30 ? 'text-[13px] sm:text-[13.5px]' : 'text-sm sm:text-[14.5px]'
            }`}
            title={expert.name}
          >
            <span>{expert.name}</span>
            {isVerified && (
              <span 
                className="inline-flex items-center align-middle ml-1 text-[#00A3FF]" 
                title="Terverifikasi"
              >
                <span className="material-symbols-outlined text-[17px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
              </span>
            )}
          </h3>
        </div>

        {/* ── Info Rows Sesuai Urutan: 1. Pekerjaan, 2. Bidang Keahlian, 3. Sertifikat, 4. Lokasi ── */}
        <div className="space-y-1 mb-2.5 flex-1 flex flex-col justify-start">
          {/* 1. Pekerjaan (Ada tombol + jika lebih dari 1) */}
          <div className="flex items-center min-w-0">
            <span className="text-xs font-semibold text-[#1F2A22] truncate" title={primaryJobText}>
              {primaryJobText}
            </span>
            {hasMultipleJobs && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreJobs(!showMoreJobs);
                }}
                className="inline-flex items-center justify-center w-4 h-4 ml-1.5 shrink-0 rounded-full bg-amber-100 hover:bg-amber-200 text-[#8B4513] text-[11px] font-black leading-none transition-transform active:scale-95 shadow-2xs"
                title={`+${experiencesList.length - 1} ${t('pekerjaan lainnya')}`}
              >
                +
              </button>
            )}
          </div>

          {/* 2. Bidang Keahlian */}
          <p
            className="text-xs font-semibold text-[#8B4513] truncate"
            title={hasAllThreeCriteria ? 'Tenaga Ahli' : (expert.field || (isSurveyor ? 'Surveyor & Pemetaan' : 'Tenaga Ahli'))}
          >
            {hasAllThreeCriteria ? 'Tenaga Ahli' : (expert.field || (isSurveyor ? 'Surveyor & Pemetaan' : 'Tenaga Ahli'))}
          </p>

          {/* 3. Sertifikat (Hanya nama satu sertifikat yang diset primary) */}
          {(() => {
            const certsList = Array.isArray(expert.certificates)
              ? expert.certificates
              : (Array.isArray(expert.sertifikasi) ? expert.sertifikasi : []);
            const primaryCert = expert.primary_certificate
              || certsList.find(c => c.is_primary)?.nama_sertifikat
              || certsList.find(c => c.is_primary)?.nama
              || null;

            if (!primaryCert) return null;

            return (
              <div
                className="flex items-center gap-1.5 text-xs text-[#2E5E3B] font-medium truncate"
                title={`${t('Sertifikat')}: ${primaryCert}`}
              >
                <span className="material-symbols-outlined text-[15px] text-[#2E5E3B] shrink-0">workspace_premium</span>
                <span className="truncate">{primaryCert}</span>
              </div>
            );
          })()}

          {/* 4. Lokasi (Kota/Kab, Provinsi) */}
          <div
            className="flex items-center gap-1.5 text-xs text-[#5B6660] truncate"
            title={(() => {
              let rawLoc = 'Indonesia';
              if (expert.alamat_kota || expert.alamat_provinsi) {
                rawLoc = [expert.alamat_kota, expert.alamat_provinsi].filter(Boolean).join(', ');
              } else if (expert.lokasi_label && !expert.lokasi_label.startsWith('Lat:')) {
                rawLoc = expert.lokasi_label;
              } else if (expert.alamat_lengkap) {
                rawLoc = expert.alamat_lengkap;
              } else if (expert.location && !expert.location.startsWith('Lat:')) {
                rawLoc = expert.location;
              }
              return formatCompactLocation(rawLoc);
            })()}
          >
            <span className="material-symbols-outlined text-[14px] text-gray-400 shrink-0">location_on</span>
            <span className="truncate">
              {(() => {
                let rawLoc = 'Indonesia';
                if (expert.alamat_kota || expert.alamat_provinsi) {
                  rawLoc = [expert.alamat_kota, expert.alamat_provinsi].filter(Boolean).join(', ');
                } else if (expert.lokasi_label && !expert.lokasi_label.startsWith('Lat:')) {
                  rawLoc = expert.lokasi_label;
                } else if (expert.alamat_lengkap) {
                  rawLoc = expert.alamat_lengkap;
                } else if (expert.location && !expert.location.startsWith('Lat:')) {
                  rawLoc = expert.location;
                }
                return formatCompactLocation(rawLoc);
              })()}
            </span>
          </div>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* ── Footer Row: Pengalaman & Rating ── */}
        <div className={`pt-3 border-t flex items-center justify-between gap-2 ${
          isPremium ? 'border-amber-100' : 'border-gray-100'
        }`}>
          <div className="text-[11px] text-[#5B6660] font-medium truncate">
            {expert.active_since ? `${t('Pengalaman')} ${new Date().getFullYear() - Number(expert.active_since)} thn` : t('Tersedia')}
          </div>

          {/* Rating Badge */}
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold transition-all shrink-0 bg-amber-50 border border-amber-200/80 text-amber-900">
            <span className="material-symbols-outlined text-amber-500 text-[13px] leading-none select-none" style={{ fontVariationSettings: '"FILL" 1' }}>
              star
            </span>
            <span className="leading-none">
              {expert.rating && Number(expert.rating) > 0
                ? Number(expert.rating).toFixed(1)
                : '5.0'}
            </span>
            {expert.reviews_count ? (
              <span className="text-[10px] text-amber-700/70 font-semibold leading-none">
                ({expert.reviews_count})
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Overlay Modal: Daftar Semua Pekerjaan (Muncul jika tombol + diklik) ── */}
      {showMoreJobs && (
        <>
          <div
            className="absolute inset-0 z-30 bg-black/45 backdrop-blur-[2px] rounded-2xl animate-in fade-in"
            onClick={(e) => {
              e.stopPropagation();
              setShowMoreJobs(false);
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-2.5 bottom-2.5 top-12 bg-[#142018]/95 backdrop-blur-md text-white rounded-xl shadow-2xl z-40 p-3.5 flex flex-col border border-white/15 animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-2 border-b border-white/15 shrink-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="material-symbols-outlined text-amber-400 text-base shrink-0">work</span>
                <span className="font-bold text-xs text-white truncate">{t('Daftar Pekerjaan')}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-semibold shrink-0">
                  {experiencesList.length}
                </span>
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreJobs(false);
                }}
                className="w-6 h-6 rounded-full hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors shrink-0"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2 py-2 pr-1 min-h-0">
              {experiencesList.map((exp, idx) => {
                const isExpPrimary = Boolean(exp.is_primary || exp.is_utama || exp.utama || (primaryJob && (exp.id ? exp.id === primaryJob.id : idx === 0)));
                return (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg transition-colors ${
                      isExpPrimary
                        ? 'bg-amber-400/15 border border-amber-400/40 shadow-xs'
                        : 'bg-white/5 border border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <span className="font-semibold text-xs text-white leading-snug">{exp.posisi || exp.jabatan}</span>
                      {isExpPrimary && (
                        <span className="shrink-0 text-[9px] px-1.5 py-0.5 rounded bg-amber-400 text-slate-900 font-bold leading-none shadow-xs">
                          {t('Utama')}
                        </span>
                      )}
                    </div>
                    {(exp.instansi || exp.perusahaan) && (
                      <p className="text-[11px] text-gray-300 mt-0.5 leading-snug">{exp.instansi || exp.perusahaan}</p>
                    )}
                    {(exp.tahun_mulai || exp.tahun_selesai) && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        {exp.tahun_mulai && exp.tahun_selesai
                          ? `${exp.tahun_mulai} — ${exp.tahun_selesai}`
                          : (exp.tahun_mulai ? `${exp.tahun_mulai} — ${t('Sekarang')}` : exp.tahun_selesai)}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
