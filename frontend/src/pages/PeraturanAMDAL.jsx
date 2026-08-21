import { useTranslation } from '../context/LanguageContext.jsx';
import { useState, useEffect } from 'react';
import NavbarBackground from '../components/NavbarBackground.jsx';
import api from '../api/client.js';

const requirements = [
  {
    icon: 'work_history',
    title: 'Pengalaman Sebagai Tenaga Ahli',
    desc: 'Pernah menjadi tenaga ahli pada suatu proyek, dibuktikan dengan Surat Tugas atau kontrak kerja.',
  },
  {
    icon: 'workspace_premium',
    title: 'Sertifikat Kompetensi',
    desc: 'Memiliki sertifikat kompetensi atau pelatihan yang sesuai dengan bidang keahlian.',
  },
  {
    icon: 'science',
    title: 'Riset & Karya Ilmiah',
    desc: 'Memiliki pengalaman penelitian, publikasi, atau karya ilmiah sesuai bidang keahlian.',
  },
  {
    icon: 'campaign',
    title: 'Narasumber atau Instruktur',
    desc: 'Pernah menjadi narasumber, pembicara, instruktur, atau pemateri dalam seminar, pelatihan, maupun workshop.',
  },
  {
    icon: 'business_center',
    title: 'Pengalaman Profesional',
    desc: 'Memiliki pengalaman profesional atau bekerja sesuai bidang keahlian, didukung dokumen pendukung.',
  },
];

// Helper function to format price
function formatRupiah(value, t) {
  if (value === 0) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', 
    currency: 'IDR', 
    maximumFractionDigits: 0,
  }).format(value);
}

export default function PaketKeanggotaanTenagaAhli() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/packages')
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data : [];
        
        // Normalize package data
        const normalizedPackages = data.map((pkg) => ({
          ...pkg,
          features: Array.isArray(pkg.benefits)
            ? pkg.benefits
            : Array.isArray(pkg.features)
            ? pkg.features
            : (pkg.description ? pkg.description.split('\n').filter(Boolean) : []),
          duration: pkg.duration || '12 bulan',
          highlighted: pkg.is_highlighted || pkg.name?.toLowerCase() === 'premium',
          badge: pkg.badge || (pkg.name?.toLowerCase() === 'premium' ? t('membership.recommended', 'Direkomendasikan') : null),
        }));

        setPackages(normalizedPackages);
      })
      .catch((err) => {
        console.error('Error loading packages:', err);
        setError(t('membership.error.load_failed', 'Gagal memuat data paket.'));
        
        // Fallback to empty packages
        setPackages([]);
      })
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <div className="relative pt-24 md:pt-32 pb-16 md:pb-24 px-4 md:px-margin-desktop max-w-container-max mx-auto">
      <NavbarBackground />

      {/* Header */}
      <div className="mb-10 md:mb-14 max-w-2xl">
        <span className="inline-flex items-center gap-2 text-[10px] md:text-xs font-semibold tracking-wide uppercase text-[#0EA5E9] bg-[#0EA5E9]/10 px-2.5 md:px-3 py-1 rounded-full mb-3 md:mb-4">
          <span className="material-symbols-outlined text-[14px] md:text-[16px]">workspace_premium</span>
          {t('membership.badge', 'Keanggotaan Tenaga Ahli')}
        </span>
        <h1 className="text-2xl md:text-headline-lg font-headline-lg text-on-background mb-2 leading-tight">
          {t('membership.title', 'Paket Keanggotaan Tenaga Ahli')}
        </h1>
        <p className="text-sm md:text-base text-on-surface-variant leading-relaxed">
          {t(
            'membership.subtitle',
            'Pilih paket yang sesuai untuk memperluas jangkauan profil dan peluang kerja sama Anda sebagai tenaga ahli.'
          )}
        </p>
      </div>

      {/* Requirements */}
      <section className="mb-12 md:mb-20">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-2">
          <h2 className="text-xl md:text-2xl font-headline-md text-on-background">
            {t('membership.req_title', 'Syarat Menjadi Tenaga Ahli')}
          </h2>
          <span className="inline-flex items-center gap-1.5 text-[10px] md:text-xs font-semibold text-[#0284C7] bg-[#0EA5E9]/10 px-2.5 md:px-3 py-1.5 rounded-full whitespace-nowrap self-start sm:self-auto">
            <span className="material-symbols-outlined text-[14px] md:text-[16px]">rule</span>
            {t('membership.req_note', 'Cukup penuhi salah satu syarat')}
          </span>
        </div>
        <p className="text-xs md:text-sm text-on-surface-variant mb-6 md:mb-8 max-w-2xl leading-relaxed">
          {t(
            'membership.req_desc',
            'Calon anggota tidak perlu memenuhi seluruh poin di bawah ini — satu syarat saja sudah cukup untuk mengajukan pendaftaran.'
          )}
        </p>

        <div className="space-y-3 md:space-y-0 md:flex md:flex-col">
          {requirements.map((req, i) => (
            <div key={req.title}>
              <div className="group flex items-start gap-3 md:gap-5 bg-white p-4 md:p-6 rounded-xl md:rounded-2xl border border-[#0EA5E9]/15 shadow-sm hover:shadow-md hover:border-[#0EA5E9]/40 transition-all duration-300">
                <div className="shrink-0 w-10 h-10 md:w-12 md:h-12 rounded-lg md:rounded-xl flex items-center justify-center bg-[#0EA5E9]/10 group-hover:bg-[#0EA5E9] transition-colors duration-300">
                  <span className="material-symbols-outlined text-[20px] md:text-[24px] text-[#0EA5E9] group-hover:text-white transition-colors duration-300">
                    {req.icon}
                  </span>
                </div>
                <div className="flex-1 min-w-0 pt-0.5">
                  <h3 className="text-sm md:text-base font-semibold text-on-background mb-1 leading-tight">{req.title}</h3>
                  <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">{req.desc}</p>
                </div>
              </div>

              {i < requirements.length - 1 && (
                <div className="flex items-center justify-center gap-3 py-2 md:py-3" aria-hidden="true">
                  <span className="h-6 md:h-8 w-px bg-[#0EA5E9]/20" />
                  <span className="text-[9px] md:text-[11px] font-bold tracking-widest text-[#0284C7] bg-[#0EA5E9]/10 px-2 md:px-2.5 py-1 rounded-full">
                    ATAU
                  </span>
                  <span className="h-6 md:h-8 w-px bg-[#0EA5E9]/20" />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="mb-12 md:mb-20">
        <div className="mb-6 md:mb-8 max-w-2xl">
          <h2 className="text-xl md:text-2xl font-headline-md text-on-background mb-2">
            {t('membership.plans_title', 'Pilih Paket Anda')}
          </h2>
          <p className="text-xs md:text-sm text-on-surface-variant leading-relaxed">
            {t(
              'membership.plans_desc',
              'Mulai gratis, atau tingkatkan ke Premium untuk visibilitas dan kepercayaan yang lebih tinggi di mata klien.'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Free card */}
          <div className="flex flex-col bg-white rounded-2xl md:rounded-3xl border border-[#0EA5E9]/15 shadow-sm p-5 md:p-8">
            <div className="mb-4 md:mb-6">
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wide text-on-surface-variant/70">
                {t('membership.free_label', 'Free')}
              </span>
              <div className="flex items-end gap-1 mt-1 md:mt-2">
                <span className="text-2xl md:text-3xl lg:text-4xl font-headline-lg text-on-background">
                  {loading ? '...' : formatRupiah(packages.find(p => p.price === 0 || p.name?.toLowerCase() === 'free')?.price || 0, t)}
                </span>
              </div>
              <p className="text-xs md:text-sm text-on-surface-variant mt-1">
                {t('membership.free_caption', 'Selamanya, tanpa biaya')}
              </p>
            </div>

            <ul className="flex flex-col gap-2 md:gap-3 flex-1">
              {loading ? (
                <li className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-on-surface-variant">
                  <div className="w-4 h-4 md:w-[18px] md:h-[18px] rounded-full bg-gray-200 animate-pulse mt-0.5 shrink-0" />
                  <div className="h-3 md:h-4 bg-gray-200 rounded animate-pulse flex-1" />
                </li>
              ) : (
                packages.find(p => p.price === 0 || p.name?.toLowerCase() === 'free')?.features?.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px] md:text-[18px] text-[#0EA5E9] mt-0.5 shrink-0">
                      check_circle
                    </span>
                    <span className="leading-relaxed">{f}</span>
                  </li>
                )) || (
                  <li className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-on-surface-variant opacity-50">
                    <span className="material-symbols-outlined text-[16px] md:text-[18px] text-[#0EA5E9] mt-0.5 shrink-0">
                      info
                    </span>
                    <span>Tidak ada fitur gratis tersedia</span>
                  </li>
                )
              )}
            </ul>
          </div>

          {/* Premium card */}
          <div className="relative flex flex-col bg-[#0B1220] rounded-2xl md:rounded-3xl border border-[#F5B942]/30 shadow-xl p-5 md:p-8 overflow-hidden motion-safe:hover:-translate-y-1 transition-transform duration-300">
            {/* ambient glow */}
            <div
              className="pointer-events-none absolute -top-16 md:-top-24 -right-12 md:-right-16 w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#F5B942]/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -bottom-12 md:-bottom-20 -left-8 md:-left-10 w-40 h-40 md:w-56 md:h-56 rounded-full bg-[#0EA5E9]/20 blur-3xl"
              aria-hidden="true"
            />

            <span className="absolute top-4 md:top-6 right-4 md:right-6 text-[9px] md:text-[10px] font-bold tracking-widest uppercase text-[#0B1220] bg-[#F5B942] px-2 md:px-3 py-1 md:py-1.5 rounded-full">
              {t('membership.recommended', 'Direkomendasikan')}
            </span>

            <div className="relative mb-4 md:mb-6">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl bg-gradient-to-br from-[#F5B942] to-[#D97706] flex items-center justify-center shadow-lg mb-3 md:mb-5">
                <span className="material-symbols-outlined text-[24px] md:text-[28px] text-[#0B1220]">
                  workspace_premium
                </span>
              </div>
              <span className="text-[10px] md:text-xs font-semibold uppercase tracking-wide text-[#F5B942]">
                {t('membership.premium_label', 'Premium')}
              </span>
              <div className="flex items-end gap-1 md:gap-1.5 mt-1 md:mt-2">
                <span className="text-2xl md:text-3xl lg:text-4xl font-headline-lg text-white">
                  {loading ? '...' : formatRupiah(packages.find(p => p.price > 0 || p.name?.toLowerCase() === 'premium')?.price || 300000, t)}
                </span>
                <span className="text-xs md:text-sm text-white/50 mb-0.5 md:mb-1">/{t('membership.per_year', 'tahun')}</span>
              </div>
              <p className="text-xs md:text-sm text-white/50 mt-1">
                {t('membership.premium_caption', 'Berlaku 1 tahun sejak aktivasi')}
              </p>
            </div>

            <ul className="relative flex flex-col gap-2 md:gap-3 flex-1">
              {loading ? (
                <li className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-white/80">
                  <div className="w-4 h-4 md:w-[18px] md:h-[18px] rounded-full bg-white/20 animate-pulse mt-0.5 shrink-0" />
                  <div className="h-3 md:h-4 bg-white/20 rounded animate-pulse flex-1" />
                </li>
              ) : (
                packages.find(p => p.price > 0 || p.name?.toLowerCase() === 'premium')?.features?.map((f, i) => (
                  <li key={i} className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-white/80">
                    <span className="material-symbols-outlined text-[16px] md:text-[18px] text-[#F5B942] mt-0.5 shrink-0">
                      check_circle
                    </span>
                    <span className="leading-relaxed">{f}</span>
                  </li>
                )) || (
                  <li className="flex items-start gap-2 md:gap-3 text-xs md:text-sm text-white/50">
                    <span className="material-symbols-outlined text-[16px] md:text-[18px] text-[#F5B942] mt-0.5 shrink-0">
                      info
                    </span>
                    <span>Tidak ada fitur premium tersedia</span>
                  </li>
                )
              )}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}