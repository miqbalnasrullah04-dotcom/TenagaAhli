import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { usePageLoading } from '../context/LoadingContext.jsx';
import {
  ShieldCheckIcon,
  LockClosedIcon,
  DocumentTextIcon,
  IdentificationIcon,
  ServerIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  ArrowRightIcon,
  CalendarDaysIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const SECTIONS = [
  { id: 'pengantar', title: '1. Pengantar & Komitmen Kami', Icon: ShieldCheckIcon },
  { id: 'data-dikumpulkan', title: '2. Informasi yang Kami Kumpulkan', Icon: DocumentTextIcon },
  { id: 'penggunaan-data', title: '3. Penggunaan Informasi', Icon: IdentificationIcon },
  { id: 'kerahasiaan-nda', title: '4. Kerahasiaan Proyek & Pembagian Data', Icon: EyeSlashIcon },
  { id: 'keamanan-data', title: '5. Keamanan & Penyimpanan Data', Icon: ServerIcon },
  { id: 'hak-pengguna', title: '6. Hak Anda atas Data Pribadi', Icon: LockClosedIcon },
  { id: 'kontak-privasi', title: '7. Hubungi Petugas Privasi', Icon: EnvelopeIcon },
];

export default function PemberitahuanPrivasi() {
  const { t } = useTranslation();
  const { reportReady } = usePageLoading();
  const [activeSection, setActiveSection] = useState('pengantar');

  useEffect(() => {
    reportReady();
  }, [reportReady]);

  const scrollToSection = (id) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -100;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9] text-gray-800">
      {/* ── HERO HEADER ── */}
      <section
        className="relative overflow-hidden pt-28 md:pt-36 pb-16 md:pb-24"
        style={{
          background: 'linear-gradient(135deg, #3D1C02 0%, #6B3410 40%, #8B4513 60%, #3D1C02 100%)',
        }}
      >
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-[500px] h-[500px] rounded-full bg-amber-400/[0.06]" />
          <div className="absolute -bottom-32 -left-20 w-[400px] h-[400px] rounded-full bg-amber-300/[0.04]" />
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

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <span className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-400/25 text-amber-200 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider uppercase">
            <ShieldCheckIcon className="w-4 h-4" />
            {t('Privasi & Keamanan Data')}
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {t('Pemberitahuan Privasi')}
          </h1>

          <p className="mt-4 text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            {t(
              'Komitmen kami dalam melindungi kerahasiaan data pribadi, kredensial keahlian, dan keamanan transaksi Anda di TenagaAhli.com.'
            )}
          </p>

          <div className="flex items-center justify-center gap-4 mt-6 text-xs text-white/60">
            <span className="flex items-center gap-1.5">
              <CalendarDaysIcon className="w-3.5 h-3.5 text-amber-400" />
              {t('Berlaku Efektif: 1 Januari 2026')}
            </span>
            <span className="flex items-center gap-1.5">
              <ClockIcon className="w-3.5 h-3.5 text-amber-400" />
              {t('Terakhir Diperbarui: Agustus 2026')}
            </span>
          </div>
        </div>
      </section>

      {/* ── MAIN CONTENT (SIDEBAR + CONTENT) ── */}
      <section className="max-w-6xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12">
          {/* ── LEFT STICKY TABLE OF CONTENTS (col-span-4) ── */}
          <aside className="lg:col-span-4">
            <div className="sticky top-28 bg-white rounded-2xl border border-gray-200/80 p-5 shadow-xs">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#8B4513] mb-4 pb-2 border-b border-gray-100">
                {t('Daftar Isi Kebijakan')}
              </h3>

              <nav className="space-y-1">
                {SECTIONS.map((sec) => (
                  <button
                    key={sec.id}
                    onClick={() => scrollToSection(sec.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                      activeSection === sec.id
                        ? 'bg-[#F8F2EB] text-[#8B4513] font-bold border-l-3 border-[#8B4513]'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <sec.Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{t(sec.title)}</span>
                  </button>
                ))}
              </nav>

              {/* Quick Support Link */}
              <div className="mt-6 pt-5 border-t border-gray-100">
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/60">
                  <p className="text-xs font-semibold text-gray-800 mb-1">
                    {t('Ada Pertanyaan?')}
                  </p>
                  <p className="text-[11px] text-gray-500 mb-3">
                    {t('Tim dukungan kami siap membantu menjawab seputar privasi Anda.')}
                  </p>
                  <Link
                    to="/pusat-bantuan"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8B4513] hover:underline"
                  >
                    <span>{t('Pusat Bantuan')}</span>
                    <ArrowRightIcon className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          </aside>

          {/* ── RIGHT ARTICLE BODY (col-span-8) ── */}
          <main className="lg:col-span-8 space-y-12">
            {/* 1. Pengantar */}
            <article id="pengantar" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center font-bold text-xs">
                  01
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Pengantar &amp; Komitmen Kami
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-3 pl-11 text-justify">
                <p>
                  Selamat datang di <strong>TenagaAhli.com</strong> (selanjutnya disebut "Platform", "Kami", atau "Layanan"). Kami sangat menghargai privasi dan kepercayaan Anda sebagai Tenaga Ahli, Surveyor, Konsultan, maupun Klien Pengguna Jasa.
                </p>
                <p>
                  Pemberitahuan Privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, memproses, menyimpan, dan melindungi informasi pribadi Anda sesuai dengan Undang-Undang Perlindungan Data Pribadi (UU PDP No. 27 Tahun 2022) serta peraturan perundang-undangan terkait di Republik Indonesia.
                </p>
              </div>
            </article>

            {/* 2. Informasi yang Kami Kumpulkan */}
            <article id="data-dikumpulkan" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center font-bold text-xs">
                  02
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Informasi yang Kami Kumpulkan
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-3 pl-11 text-justify">
                <p>Kami mengumpulkan data yang Anda berikan secara langsung dan data yang diperoleh saat menggunakan platform:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Informasi Identitas Akun:</strong> Nama lengkap, gelar akademik/profesi, alamat email, nomor telepon/WhatsApp, dan kata sandi yang dienkripsi.
                  </li>
                  <li>
                    <strong>Informasi Profesional &amp; Kredensial:</strong> Riwayat pendidikan, pengalaman kerja, portofolio proyek, sertifikat keahlian (KTPA/ATPA/SKA), lisensi surveyor, serta surat tugas/kontrak terkait.
                  </li>
                  <li>
                    <strong>Informasi Transaksi &amp; Pembayaran:</strong> Rincian paket keanggotaan yang dipilih, riwayat pembayaran, bukti transfer, dan data penagihan faktur/invoice (kami tidak menyimpan nomor kartu kredit lengkap Anda).
                  </li>
                  <li>
                    <strong>Data Interaksi &amp; Komunikasi:</strong> Pesan konsultasi, ulasan pengguna, tiket dukungan, serta riwayat pencarian layanan.
                  </li>
                </ul>
              </div>
            </article>

            {/* 3. Penggunaan Informasi */}
            <article id="penggunaan-data" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center font-bold text-xs">
                  03
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Penggunaan Informasi
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-3 pl-11">
                <p>Data pribadi Anda digunakan untuk tujuan-tujuan berikut:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Memvalidasi dan memverifikasi keaslian profil tenaga ahli dan surveyor.</li>
                  <li>Menampilkan profil profesional Anda kepada klien dan instansi pencari jasa.</li>
                  <li>Memfasilitasi komunikasi kerja sama proyek dan konsultasi teknis.</li>
                  <li>Menerbitkan invoice resmi dan memproses transaksi keanggotaan.</li>
                  <li>Mengirimkan notifikasi pembaruan sistem, peluang proyek, dan berita terkait regulasi keahlian.</li>
                  <li>Mencegah penipuan serta menjaga keamanan ekosistem platform.</li>
                </ul>
              </div>
            </article>

            {/* 4. Kerahasiaan Proyek & Pembagian Data */}
            <article id="kerahasiaan-nda" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center font-bold text-xs">
                  04
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Kerahasiaan Proyek &amp; Pembagian Data
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-3 pl-11 text-justify">
                <p>
                  <strong>Prinsip Non-Disclosure Agreement (NDA):</strong> Seluruh dokumen teknis proyek (seperti dokumen AMDAL, peta topografi GIS, survei LiDAR, laporan uji laboratorium) yang dibagikan antar pengguna dilindungi kerahasiaannya.
                </p>
                <p>Kami tidak akan pernah menjual atau menyewakan data pribadi Anda kepada pihak ketiga manapun untuk tujuan pemasaran. Data hanya dibagikan kepada:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Penyedia gateway pembayaran resmi berizin Bank Indonesia untuk memproses transaksi.</li>
                  <li>Otoritas penegak hukum atau regulator resmi pemerintah jika diwajibkan oleh undang-undang.</li>
                </ul>
              </div>
            </article>

            {/* 5. Keamanan & Penyimpanan Data */}
            <article id="keamanan-data" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center font-bold text-xs">
                  05
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Keamanan &amp; Penyimpanan Data
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-3 pl-11 text-justify">
                <p>
                  Kami menggunakan protokol keamanan berstandar tinggi termasuk enkripsi SSL/TLS 256-bit untuk transmisi data, sistem firewall berlapis, dan pencadangan data otomatis di pusat data aman yang berlokasi di Indonesia.
                </p>
                <p>
                  Meskipun kami melakukan langkah pengamanan terbaik, pengguna juga bertanggung jawab untuk menjaga kerahasiaan kata sandi akun masing-masing.
                </p>
              </div>
            </article>

            {/* 6. Hak Anda atas Data Pribadi */}
            <article id="hak-pengguna" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center font-bold text-xs">
                  06
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Hak Anda atas Data Pribadi
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-3 pl-11">
                <p>Sesuai hukum yang berlaku, Anda memiliki hak penuh untuk:</p>
                <ul className="list-disc pl-5 space-y-2">
                  <li>Mengakses dan memperbarui informasi profil Anda kapan saja melalui dashboard akun.</li>
                  <li>Meminta penyesuaian data yang tidak akurat atau memperbarui sertifikat yang telah diperpanjang.</li>
                  <li>Mengajukan permohonan penonaktifan atau penghapusan permanen akun beserta data yang tersimpan.</li>
                </ul>
              </div>
            </article>

            {/* 7. Hubungi Petugas Privasi */}
            <article id="kontak-privasi" className="scroll-mt-28 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center font-bold text-xs">
                  07
                </div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Hubungi Petugas Privasi
                </h2>
              </div>
              <div className="text-xs sm:text-sm text-gray-600 leading-relaxed space-y-4 pl-11">
                <p>
                  Jika Anda memiliki pertanyaan, saran, atau keluhan terkait penerapan kebijakan privasi ini, silakan hubungi tim Data Protection Officer (DPO) kami:
                </p>

                <div className="p-5 rounded-2xl bg-white border border-[#E5DACE] space-y-2 text-xs">
                  <p className="font-bold text-gray-900">Tim Data Protection Officer — TenagaAhli.com</p>
                  <p className="text-gray-600 flex items-center gap-2">
                    <EnvelopeIcon className="w-4 h-4 text-[#8B4513]" />
                    <span>Email: privacy@tenagaahli.com / help@tenagaahli.com</span>
                  </p>
                  <p className="text-gray-600">Alamat: Jl. Saturnus No.13 Blk. F, RT.2/RW.5, Ciherang, Kec. Dramaga, Kabupaten Bogor, Jawa Barat 16680</p>
                  <p className="text-gray-600">Telepon / WhatsApp: 0811-1520-900</p>
                </div>
              </div>
            </article>
          </main>
        </div>
      </section>
    </div>
  );
}
