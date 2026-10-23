import { useEffect } from 'react';
import { useTranslation } from '../context/LanguageContext.jsx';
import { usePageLoading } from '../context/LoadingContext.jsx';
import { Link } from 'react-router-dom';
import NavbarBackground from '../components/NavbarBackground.jsx';
import {
  DocumentCheckIcon,
  BeakerIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  MicrophoneIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const REQUIREMENTS_LIST = [
  {
    number: '01',
    title: 'Pernah Melakukan Penelitian atau Kajian Sesuai Bidang Keahlian',
    desc: 'Memiliki riwayat atau rekam jejak pelaksanaan kajian ilmiah, studi kelayakan, atau riset terapan di bidang keahlian terkait.',
    Icon: DocumentCheckIcon,
  },
  {
    number: '02',
    title: 'Sedang Melakukan Penelitian/Riset Sesuai Bidang Keahlian dengan Melampirkan Bukti',
    desc: 'Sedang aktif dalam proyek riset/kajian berjalan yang dibuktikan dengan surat pengantar, proposal, atau dokumen resmi lainnya.',
    Icon: BeakerIcon,
  },
  {
    number: '03',
    title: 'Pernah Menjadi Tenaga Ahli/Konsultan Sesuai Bidang Keahlian dengan Bukti Surat Tugas atau Kontrak',
    desc: 'Pernah terlibat sebagai tenaga ahli atau konsultan profesional, dibuktikan dengan Surat Tugas, Kontrak Kerja, atau SPK.',
    Icon: BriefcaseIcon,
  },
  {
    number: '04',
    title: 'Memiliki Sertifikat Kompetensi, Sertifikat Keahlian, atau Sertifikat Pelatihan yang Relevan',
    desc: 'Memegang sertifikasi profesi resmi (mis. KTPA/ATPA/SKA), sertifikat pelatihan teknis, atau lisensi keahlian yang masih berlaku.',
    Icon: AcademicCapIcon,
  },
  {
    number: '05',
    title: 'Pernah Diundang sebagai Narasumber, Pembicara, Instruktur, atau Pemateri Sesuai Bidang Keahlian',
    desc: 'Memiliki pengalaman menjadi pemateri, narasumber seminar, instruktur bimtek, atau workshop ilmiah yang relevan.',
    Icon: MicrophoneIcon,
  },
];

export default function SyaratTenagaAhli() {
  const { t } = useTranslation();
  const { reportReady } = usePageLoading();

  useEffect(() => {
    reportReady();
  }, [reportReady]);

  return (
    <div className="min-h-screen bg-[#FDFBF9]">
      <NavbarBackground />

      <main className="max-w-4xl mx-auto px-6 pt-28 md:pt-36 pb-20 md:pb-24">
        {/* ── HEADER ── */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          <div className="inline-flex items-center gap-2 bg-[#F8F2EB] text-[#8B4513] border border-[#E8DED2] text-xs font-bold px-3.5 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            <ShieldCheckIcon className="w-4 h-4" />
            {t('Kualifikasi & Persyaratan')}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">
            {t('Syarat Menjadi Tenaga Ahli')}
          </h1>

          <p className="mt-3 text-sm md:text-base text-gray-600 leading-relaxed">
            {t(
              'Cukup penuhi salah satu syarat di bawah ini untuk dapat mengajukan pendaftaran dan bergabung sebagai Tenaga Ahli di platform TenagaAhli.com.'
            )}
          </p>

          <div className="inline-flex items-center gap-2 mt-4 text-xs font-semibold text-[#8B4513] bg-amber-50 border border-amber-200/80 px-4 py-2 rounded-xl">
            <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{t('Calon anggota cukup memenuhi 1 (satu) syarat saja.')}</span>
          </div>
        </div>

        {/* ── SIMPLE CLEAN REQUIREMENTS LIST ── */}
        <div className="space-y-4">
          {REQUIREMENTS_LIST.map((req, idx) => (
            <div
              key={req.number}
              className="group bg-white rounded-2xl p-5 sm:p-6 border border-gray-200/80 hover:border-[#8B4513]/40 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col sm:flex-row sm:items-start gap-4 sm:gap-5"
            >
              {/* Number + Icon badge */}
              <div className="flex items-center gap-3 sm:block shrink-0">
                <div className="w-11 h-11 rounded-xl bg-[#FAF5F0] group-hover:bg-[#8B4513] text-[#8B4513] group-hover:text-white flex items-center justify-center transition-colors duration-200">
                  <req.Icon className="w-5 h-5" />
                </div>
                <span className="sm:hidden text-xs font-bold text-gray-400">
                  Pilihan {req.number}
                </span>
              </div>

              {/* Text info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <h2 className="text-sm sm:text-base font-bold text-gray-900 leading-snug group-hover:text-[#8B4513] transition-colors">
                    {req.title}
                  </h2>
                  <span className="hidden sm:inline-block text-[11px] font-bold text-gray-400 shrink-0 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                    Opsi {req.number}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
                  {req.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── CTA BOTTOM BOX ── */}
        <div className="mt-12 text-center bg-gradient-to-r from-[#F8F2EB] to-[#FAF6F2] border border-[#EAE0D3] rounded-3xl p-8 shadow-xs">
          <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-2">
            {t('Sudah Memenuhi Salah Satu Syarat di Atas?')}
          </h3>
          <p className="text-xs sm:text-sm text-gray-600 max-w-lg mx-auto mb-6 leading-relaxed">
            {t(
              'Segera daftarkan profil Anda untuk mulai terhubung dengan ratusan instansi, perusahaan, dan klien yang membutuhkan keahlian Anda.'
            )}
          </p>

          <Link
            to="/daftar"
            className="inline-flex items-center justify-center gap-2 bg-[#8B4513] hover:bg-[#6B3410] text-white text-xs sm:text-sm font-bold px-7 py-3.5 rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            <span>{t('Daftar Sebagai Tenaga Ahli Sekarang')}</span>
            <ArrowRightIcon className="w-4 h-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}