import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { usePageLoading } from '../context/LoadingContext.jsx';
import {
  TrophyIcon,
  CalendarDaysIcon,
  BoltIcon,
  SparklesIcon,
  ScaleIcon,
  ArrowTrendingUpIcon,
  CheckBadgeIcon,
  ExclamationTriangleIcon,
  QuestionMarkCircleIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

import medalWhiteImg from '../assets/medals/medal-white.png';
import medalBlueImg from '../assets/medals/medal-blue.png';
import medalSilverImg from '../assets/medals/medal-silver.png';
import medalGoldImg from '../assets/medals/medal-gold.png';
import medalPlatinumImg from '../assets/medals/medal-platinum.png';
import medalDiamondImg from '../assets/medals/medal-diamond.png';

const MEDAL_TIERS = [
  {
    stage: 1,
    key: 'white',
    name: 'Medali White',
    range: '1 – 10 orang / tahun',
    min: 1,
    max: 10,
    image: medalWhiteImg,
    ribbonColor: '#94A3B8',
    bgBadge: 'bg-slate-100 text-slate-800 border-slate-300',
    headerGradient: 'from-slate-100 via-white to-slate-200 text-slate-800',
    description: 'Pencapaian awal bagi tenaga ahli, tenaga teknis, dan surveyor berbayar yang mulai aktif melayani konsultasi.',
    highlight: 'Mulai muncul sejak klien konsultasi pertama terkonfirmasi.',
  },
  {
    stage: 2,
    key: 'blue',
    name: 'Medali Blue',
    range: '11 – 30 orang / tahun',
    min: 11,
    max: 30,
    image: medalBlueImg,
    ribbonColor: '#2563EB',
    bgBadge: 'bg-blue-50 text-blue-800 border-blue-200',
    headerGradient: 'from-blue-600 via-blue-500 to-indigo-600 text-white',
    description: 'Menandakan portofolio konsultasi yang terus berkembang dan mulai dipercaya secara rutin oleh klien.',
    highlight: 'Diperoleh setelah menyelesaikan lebih dari 10 konsultasi per tahun.',
  },
  {
    stage: 3,
    key: 'silver',
    name: 'Medali Silver',
    range: '31 – 50 orang / tahun',
    min: 31,
    max: 50,
    image: medalSilverImg,
    ribbonColor: '#64748B',
    bgBadge: 'bg-slate-100 text-slate-800 border-slate-300',
    headerGradient: 'from-slate-400 via-gray-300 to-zinc-400 text-slate-900',
    description: 'Status keahlian teruji yang telah membantu puluhan pihak dalam penyusunan kajian teknis dan AMDAL.',
    highlight: 'Memperkuat kepercayaan calon klien pada hasil pencarian.',
  },
  {
    stage: 4,
    key: 'gold',
    name: 'Medali Gold',
    range: '51 – 75 orang / tahun',
    min: 51,
    max: 75,
    image: medalGoldImg,
    ribbonColor: '#D97706',
    bgBadge: 'bg-amber-50 text-amber-900 border-amber-300',
    headerGradient: 'from-amber-500 via-yellow-400 to-amber-600 text-amber-950',
    description: 'Peringkat bergengsi untuk pakar berjam terbang tinggi dengan arus konsultasi yang sangat aktif.',
    highlight: 'Prioritas rekomendasi pada direktori keahlian.',
  },
  {
    stage: 5,
    key: 'platinum',
    name: 'Medali Platinum',
    range: '76 – 100 orang / tahun',
    min: 76,
    max: 100,
    image: medalPlatinumImg,
    ribbonColor: '#475569',
    bgBadge: 'bg-slate-100 text-slate-800 border-slate-400',
    headerGradient: 'from-slate-700 via-slate-600 to-zinc-800 text-white',
    description: 'Tingkatan elit profesional dengan reputasi nasional dan konsistensi pelayanan konsultasi prima.',
    highlight: 'Posisi teratas dengan eksposur premium di halaman pencarian.',
  },
  {
    stage: 6,
    key: 'diamond',
    name: 'Medali Diamond',
    range: 'Lebih dari 100 orang / tahun',
    min: 101,
    max: '100+',
    image: medalDiamondImg,
    ribbonColor: '#0284C7',
    bgBadge: 'bg-sky-50 text-sky-900 border-sky-300',
    headerGradient: 'from-sky-600 via-cyan-500 to-teal-600 text-white',
    description: 'Pencapaian tertinggi di platform TenagaAhli.com. Lambang dedikasi kepakaran dan kepercayaan tertinggi klien.',
    highlight: 'Prestasi puncak dengan jangkauan dan pengaruh paling luas.',
  },
];

export default function TingkatanMedali() {
  const { t } = useTranslation();
  const { reportReady } = usePageLoading();

  useEffect(() => {
    reportReady();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [reportReady]);

  return (
    <div className="min-h-screen bg-[#FDFBF9] text-gray-800 overflow-x-hidden">
      {/* ── 1. HERO HEADER SECTION ── */}
      <section
        className="relative overflow-hidden pt-24 sm:pt-28 md:pt-36 pb-12 sm:pb-20 md:pb-24 text-white"
        style={{
          background: 'linear-gradient(135deg, #2D1402 0%, #4D260D 35%, #6B3410 70%, #2D1402 100%)',
        }}
      >
        {/* Subtle Decorative Ambient Orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[280px] h-[280px] sm:w-[520px] sm:h-[520px] rounded-full bg-amber-400/[0.08] blur-2xl" />
          <div className="absolute -bottom-28 -left-20 w-[240px] h-[240px] sm:w-[420px] sm:h-[420px] rounded-full bg-orange-400/[0.06] blur-2xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 md:px-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-4 sm:mb-6">
            <TrophyIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
            <span>Sistem Prestasi Membership</span>
          </div>

          <h1 className="text-2xl sm:text-4xl md:text-5xl font-black tracking-tight leading-tight max-w-4xl mx-auto">
            Badge Medali Ahli Konsultasi Tahunan
          </h1>

          <p className="text-[13px] sm:text-base md:text-lg text-slate-200 mt-3 sm:mt-4 max-w-2xl mx-auto leading-relaxed">
            Sistem pengakuan prestasi kepakaran bagi anggota <strong>Paket Ekonomis</strong> dan <strong>Paket Eksklusif</strong> di platform TenagaAhli.com berdasarkan jumlah klien yang dilayani per tahun.
          </p>

          {/* Quick Stat Pill Highlights */}
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch sm:items-center justify-center gap-2 sm:gap-4 mt-6 sm:mt-8 text-[11px] sm:text-xs font-bold max-w-md sm:max-w-none mx-auto">
            {[
              { Icon: TrophyIcon, label: '6 Tahapan Medali' },
              { Icon: CalendarDaysIcon, label: 'Siklus 1 Tahun (365 Hari)' },
              { Icon: BoltIcon, label: 'Kenaikan Real-Time' },
              { Icon: SparklesIcon, label: 'Paket Ekonomis & Eksklusif' },
            ].map(({ Icon, label }) => (
              <div
                key={label}
                className="flex items-center justify-center sm:justify-start gap-1.5 px-3 sm:px-3.5 py-2 sm:py-1.5 rounded-xl sm:rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-left leading-tight"
              >
                <Icon className="w-4 h-4 text-amber-300 shrink-0" />
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. PENGANTAR SISTEM MEDALI ── */}
      <section className="py-8 sm:py-14 md:py-16 max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-amber-200/80 p-5 sm:p-6 md:p-10 shadow-sm">
          <div className="max-w-3xl">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8B4513]">
              Tentang Sistem Medali
            </span>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">
              Bagaimana Medali Dihitung & Ditampilkan?
            </h2>
            <p className="text-[13px] sm:text-sm md:text-base text-gray-600 mt-3 leading-relaxed">
              Medali konsultasi dirancang untuk memberikan kredibilitas nyata bagi tenaga ahli, tenaga teknis, dan surveyor profesional. Setiap kali Anda berhasil menyelesaikan konsultasi dengan klien dalam tahun berjalan, sistem akan mengakumulasikan perolehan Anda menuju tingkatan medali berikutnya.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-gray-100">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#8B4513] flex items-center justify-center shrink-0 font-black">
                1
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Hanya Paket Berbayar</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Hanya aktif untuk anggota <strong>Paket Ekonomis</strong> atau <strong>Paket Eksklusif</strong>. Paket Standar/Free belum memiliki medali.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#8B4513] flex items-center justify-center shrink-0 font-black">
                2
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Syarat Awal 1 Konsultasi</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Jika belum ada klien yang konsultasi (0 orang), medali <strong>belum muncul</strong>. Medali White akan otomatis terbit pada konsultasi pertama.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-[#8B4513] flex items-center justify-center shrink-0 font-black">
                3
              </div>
              <div>
                <h4 className="font-bold text-gray-900 text-sm">Tampil di Card & Profil</h4>
                <p className="text-xs text-gray-600 mt-1">
                  Badge medali muncul di pojok kanan atas kartu direktori pencarian (di sebelah rating) serta di header dan sidebar profil tenaga ahli atau tenaga teknis Anda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. SHOWCASE 6 TINGKATAN MEDALI RESMI ── */}
      <section className="py-4 sm:py-8 pb-10 sm:pb-16 max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
        <div className="text-center max-w-2xl mx-auto mb-6 sm:mb-10">
          <span className="text-xs font-bold uppercase tracking-wider text-[#8B4513]">
            Tahapan Peringkat
          </span>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900 mt-1">
            6 Tingkat Badge Medali Resmi
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-2">
            Perjalanan tingkat prestasi konsultasi tahunan dari tahap 1 hingga tahap 6.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {MEDAL_TIERS.map((tier) => (
            <div
              key={tier.key}
              className="bg-white rounded-2xl border border-gray-200/90 hover:border-amber-300 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden group sm:hover:-translate-y-1"
            >
              {/* Card Header with Stage */}
              <div className="px-4 py-2.5 sm:p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between gap-2">
                <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 shrink-0">
                  Tahap {tier.stage}
                </span>
                <span className="text-[11px] sm:text-xs font-bold text-amber-300 text-right truncate">
                  {tier.range}
                </span>
              </div>

              {/* Medal Display Area — horizontal di mobile, vertikal di tablet/desktop */}
              <div className="p-4 sm:p-6 flex flex-row sm:flex-col items-start sm:items-center gap-4 sm:gap-0 text-left sm:text-center flex-1">
                <div className="w-[72px] h-[88px] sm:w-24 sm:h-28 shrink-0 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-900/80 border border-white/20 shadow-md flex items-center justify-center p-2 sm:mb-4 group-hover:scale-105 transition-transform duration-300">
                  <img
                    src={tier.image}
                    alt={tier.name}
                    className="w-12 h-16 sm:w-16 sm:h-[88px] object-contain drop-shadow-[0_4px_8px_rgba(0,0,0,0.4)]"
                  />
                </div>

                <div className="flex flex-col items-start sm:items-center flex-1 min-w-0 w-full">
                  <h3 className="text-base sm:text-lg font-black text-gray-900">
                    {tier.name}
                  </h3>
                  <span className="inline-block mt-1 text-[10px] sm:text-[11px] font-extrabold text-[#8B4513] bg-amber-50 border border-amber-200/80 px-2.5 py-0.5 rounded-full">
                    Target: {tier.range}
                  </span>

                  <p className="text-xs text-gray-600 mt-2 sm:mt-3 leading-relaxed">
                    {tier.description}
                  </p>

                  <div className="mt-3 sm:mt-auto pt-3 sm:pt-4 w-full border-t border-gray-100 text-[11px] text-gray-500 font-medium flex items-start sm:justify-center gap-1.5">
                    <CheckBadgeIcon className="w-4 h-4 text-[#8B4513] shrink-0" />
                    <span>{tier.highlight}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 4. ATURAN SIKLUS TAHUNAN, RETENSI & PINALTI RESET ── */}
      <section className="py-6 sm:py-10 max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
        <div className="bg-gradient-to-br from-[#1E293B] via-[#0F172A] to-[#1E293B] rounded-2xl sm:rounded-3xl p-5 sm:p-8 md:p-12 text-white shadow-xl">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-3">
              <ScaleIcon className="w-4 h-4" />
              <span>Regulasi & Kebijakan Sistem</span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
              Aturan Siklus Tahunan, Retensi, & Reset Keterlambatan
            </h2>
            <p className="text-xs md:text-sm text-slate-300 mt-2 leading-relaxed">
              Memahami bagaimana medali dipertahankan dan apa yang terjadi jika perpanjangan terlambat melewati tanggal jatuh tempo.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
            {/* Rule 1 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-black mb-3">
                <ArrowTrendingUpIcon className="w-[22px] h-[22px]" />
              </div>
              <h4 className="font-extrabold text-white text-sm">
                1. Kenaikan Peringkat Real-Time
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Selama dalam 1 tahun berjalan (365 hari masa aktif paket), medali Anda akan <strong>otomatis naik</strong> begitu jumlah klien konsultasi Anda mencapai ambang batas peringkat berikutnya.
              </p>
            </div>

            {/* Rule 2 */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-blue-400/20 text-blue-300 flex items-center justify-center font-black mb-3">
                <ShieldCheckIcon className="w-[22px] h-[22px]" />
              </div>
              <h4 className="font-extrabold text-white text-sm">
                2. Mempertahankan Medali Tahun Depan
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Pada tahun berikutnya saat melakukan perpanjangan tepat waktu, Anda harus mempertahankan jumlah konsultasi tahun lalu. Jika di tahun baru perolehan konsultasi lebih rendah, medali akan <strong>menyesuaikan ke jumlah yang dicapai di tahun tersebut</strong>.
              </p>
            </div>

            {/* Rule 3 */}
            <div className="bg-rose-950/40 border border-rose-500/30 rounded-2xl p-4 sm:p-5 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-black mb-3">
                <ExclamationTriangleIcon className="w-[22px] h-[22px]" />
              </div>
              <h4 className="font-extrabold text-rose-300 text-sm">
                3. Pinalti Keterlambatan (Reset ke Awal)
              </h4>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                Jika Anda <strong>telat melakukan perpanjangan dan melewati tanggal jatuh tempo perpanjangan</strong>, medali Anda akan <strong>turun ke tahap awal (reset)</strong>. Siklus tahunan baru akan dimulai ulang pada tanggal dan bulan perpanjangan yang baru.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. FAQ SEPUTAR MEDALI ── */}
      <section className="py-8 sm:py-12 max-w-4xl mx-auto px-4 sm:px-6 md:px-10">
        <div className="text-center mb-6 sm:mb-10">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-900">
            Pertanyaan Umum (FAQ)
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Hal yang sering ditanyakan mengenai medali membership tenaga ahli, tenaga teknis, dan surveyor.
          </p>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-sm">
            <h4 className="font-bold text-gray-900 text-[13px] sm:text-sm flex items-start gap-2">
              <QuestionMarkCircleIcon className="w-5 h-5 text-[#8B4513] shrink-0 mt-px" />
              <span>Konsultasi apa saja yang dihitung oleh sistem?</span>
            </h4>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed pl-7">
              Sistem menghitung setiap konsultasi unik dari klien yang masuk melalui platform TenagaAhli.com dengan status terkonfirmasi atau selesai dalam kurun waktu 365 hari sejak siklus tahunan keanggotaan Anda aktif.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-sm">
            <h4 className="font-bold text-gray-900 text-[13px] sm:text-sm flex items-start gap-2">
              <QuestionMarkCircleIcon className="w-5 h-5 text-[#8B4513] shrink-0 mt-px" />
              <span>Di mana saja saya dan klien bisa melihat medali saya?</span>
            </h4>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed pl-7">
              Medali akan terlihat oleh calon klien di kartu direktori pencarian (di pojok kanan atas sebelah rating), di header halaman profil publik Anda, serta di widget progres medali pada Dashboard Tenaga Ahli, Tenaga Teknis, dan Surveyor.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-sm">
            <h4 className="font-bold text-gray-900 text-[13px] sm:text-sm flex items-start gap-2">
              <QuestionMarkCircleIcon className="w-5 h-5 text-[#8B4513] shrink-0 mt-px" />
              <span>Bagaimana jika paket saya adalah Paket Standar (Gratis)?</span>
            </h4>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed pl-7">
              Sistem medali merupakan fitur prestisius eksklusif untuk keanggotaan berbayar (Paket Ekonomis & Eksklusif). Anda dapat melakukan upgrade paket kapan saja melalui menu Paket Membership di dashboard Anda.
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200/90 p-4 sm:p-5 shadow-sm">
            <h4 className="font-bold text-gray-900 text-[13px] sm:text-sm flex items-start gap-2">
              <QuestionMarkCircleIcon className="w-5 h-5 text-[#8B4513] shrink-0 mt-px" />
              <span>Kapan batas tanggal perpanjangan saya?</span>
            </h4>
            <p className="text-xs text-gray-600 mt-2 leading-relaxed pl-7">
              Tanggal jatuh tempo perpanjangan tertera jelas pada Widget Progres Medali di Dashboard akun Anda beserta jumlah sisa hari aktif. Pastikan memperpanjang sebelum tanggal tersebut agar medali Anda tidak di-reset ke tahap awal.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. CTA SECTION ── */}
      <section className="py-8 sm:py-12 pb-14 sm:pb-20 max-w-6xl mx-auto px-4 sm:px-6 md:px-10">
        <div className="bg-gradient-to-r from-[#8B4513] via-[#6B3410] to-[#4A2207] rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-12 text-white text-center shadow-xl">
          <h2 className="text-xl sm:text-3xl md:text-4xl font-black leading-tight">
            Tingkatkan Kredibilitas & Raih Medali Tertinggi Anda
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-amber-200/90 mt-3 max-w-2xl mx-auto leading-relaxed">
            Bergabunglah dengan Paket Ekonomis atau Eksklusif untuk membuka sistem medali dan memaksimalkan kepercayaan klien pada keahlian Anda sebagai tenaga ahli, tenaga teknis, dan surveyor.
          </p>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
            <Link
              to="/paket"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white text-[#8B4513] hover:bg-amber-100 font-extrabold text-xs sm:text-sm shadow-md transition-all hover:scale-105"
            >
              <span>Lihat Paket Membership</span>
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
            <Link
              to="/daftar-profil"
              className="inline-flex items-center justify-center px-6 py-3 rounded-full bg-white/15 hover:bg-white/25 text-white border border-white/30 font-bold text-xs sm:text-sm transition-all"
            >
              Cari Tenaga Ahli & Teknis
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
