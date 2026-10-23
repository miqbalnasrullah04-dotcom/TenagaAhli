import { useState, useMemo, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { usePageLoading } from '../context/LoadingContext.jsx';
import {
  MagnifyingGlassIcon,
  ChevronDownIcon,
  UserCircleIcon,
  MagnifyingGlassCircleIcon,
  CreditCardIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  ShieldCheckIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  PhoneIcon,
  TicketIcon,
  SparklesIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  XMarkIcon,
  QuestionMarkCircleIcon,
} from '@heroicons/react/24/outline';

/* ─── Kategori Pusat Bantuan ─── */
const HELP_CATEGORIES = [
  {
    id: 'akun',
    title: 'Akun & Keanggotaan',
    desc: 'Registrasi, verifikasi email, profil ahli, dan manajemen keanggotaan.',
    Icon: UserCircleIcon,
  },
  {
    id: 'pencarian',
    title: 'Pencarian & Kontak Ahli',
    desc: 'Cara mencari tenaga ahli, surveyor, perbandingan kredensial, dan konsultasi.',
    Icon: MagnifyingGlassCircleIcon,
  },
  {
    id: 'pembayaran',
    title: 'Pembayaran & Invoice',
    desc: 'Metode pembayaran, aktivasi paket, bukti transfer, dan unduh invoice resmi.',
    Icon: CreditCardIcon,
  },
  {
    id: 'amdal',
    title: 'Layanan Kajian & AMDAL',
    desc: 'Penyusunan dokumen lingkungan hidup (AMDAL, UKL-UPL, SPPL), dan izin lingkungan.',
    Icon: DocumentTextIcon,
  },
  {
    id: 'sertifikasi',
    title: 'Sertifikasi & Publikasi',
    desc: 'Kredensial LPJP, sertifikat keahlian, artikel jurnal, dan publikasi penelitian.',
    Icon: AcademicCapIcon,
  },
  {
    id: 'keamanan',
    title: 'Keamanan & Privasi',
    desc: 'Perlindungan data pribadi, privasi akun, syarat ketentuan, dan keamanan transaksi.',
    Icon: ShieldCheckIcon,
  },
];

/* ─── Helper untuk Render Jawaban FAQ (Mendukung list 1,2,3 di-enter serta format paragraf & bullet point seperti Halodoc) ─── */
function formatFaqAnswer(answer) {
  if (!answer) return null;

  // Cek apakah jawaban berupa list bernomor (cth: 1. ... 2. ...)
  const hasNumbers = /(?:^|\n)\s*\d+[\.\)]\s+/.test(answer) || /([.!?])\s+(\d+[\.\)])\s+/.test(answer);

  if (hasNumbers) {
    // Pastikan angka list seperti " 2. " atau " 3. " yang menyatu otomatis dipisah baris (di-enter)
    const normalized = answer.replace(/([.!?])\s+(\d+[\.\)])\s+/g, '$1\n$2 ');
    const rawLines = normalized.split('\n').map((l) => l.trim()).filter(Boolean);

    return (
      <div className="space-y-2.5 pt-1">
        {rawLines.map((line, idx) => {
          const match = line.match(/^(\d+[\.\)])\s*(.*)$/);
          if (match) {
            const numberLabel = match[1].replace(/[\.\)]/g, '');
            const itemText = match[2];
            return (
              <div key={idx} className="flex items-start gap-3">
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#8B4513]/10 text-[#8B4513] text-xs font-bold shrink-0 mt-0.5">
                  {numberLabel}
                </span>
                <span className="flex-1 text-gray-700 leading-relaxed text-xs sm:text-sm">
                  {itemText}
                </span>
              </div>
            );
          }
          return (
            <p key={idx} className="text-gray-700 leading-relaxed text-xs sm:text-sm">
              {line}
            </p>
          );
        })}
      </div>
    );
  }

  // Jika jawaban berupa multi-paragraf atau ada bullet points (seperti artikel Halodoc)
  const lines = answer.split('\n').map((l) => l.trim()).filter(Boolean);

  if (lines.length <= 1) {
    return <p className="leading-relaxed text-gray-700 text-xs sm:text-sm">{answer}</p>;
  }

  return (
    <div className="space-y-3.5 pt-1 text-xs sm:text-sm text-gray-700 leading-relaxed">
      {lines.map((line, idx) => {
        if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
          const bulletText = line.replace(/^[•\-\*]\s*/, '');
          return (
            <div key={idx} className="flex items-start gap-2.5 pl-3 sm:pl-4">
              <span className="text-[#8B4513] font-bold text-sm leading-tight shrink-0">•</span>
              <span className="flex-1 text-gray-700 leading-relaxed">{bulletText}</span>
            </div>
          );
        }
        return (
          <p key={idx} className="text-gray-700 leading-relaxed">
            {line}
          </p>
        );
      })}
    </div>
  );
}

/* ─── Data FAQ Lengkap ─── */
const FAQ_LIST = [
  {
    category: 'pencarian',
    question: 'Bagaimana cara penggunaan platform TenagaAhli.com?',
    answer:
      'TenagaAhli.com memudahkan Anda mencari dan terhubung dengan tenaga ahli akademik, surveyor, narasumber, dan dosen peneliti di seluruh Indonesia. Gunakan bilah pencarian di Beranda untuk memfilter berdasarkan keahlian (misal: GIS, AMDAL, Sipil), kriteria, atau lokasi kota/provinsi. Anda dapat meninjau portofolio, sertifikasi, rating, dan langsung menghubungi ahli terkait.',
  },
  {
    category: 'pencarian',
    question: 'Bagaimana alur dan cara melakukan konsultasi dengan Tenaga Ahli?',
    answer:
      '1. Masuk ke halaman Daftar Profil atau gunakan fitur Pencarian untuk menemukan tenaga ahli yang sesuai dengan bidang proyek Anda.\n2. Buka halaman Profil Lengkap ahli untuk melihat pengalaman dan kredensial.\n3. Klik tombol "Hubungi Ahli" atau "Jadwalkan Konsultasi" untuk mengirimkan deskripsi kebutuhan Anda.\n4. Anda dapat berdiskusi via pesan langsung di platform atau saluran komunikasi resmi yang telah disepakati.',
  },
  {
    category: 'akun',
    question: 'Bagaimana cara daftar menjadi Klien atau Tenaga Ahli / Tenaga Teknis / Surveyor?',
    answer:
      '1. Klik tombol "Daftar" di sudut kanan atas halaman.\n2. Pilih jenis akun Anda: "Klien / Pengguna Jasa" atau "Tenaga Ahli / Tenaga Teknis / Surveyor".\n3. Lengkapi formulir pendaftaran dengan nama, email, nomor WhatsApp, kata sandi, serta bidang keahlian dan riwayat pendidikan untuk tenaga ahli.\n4. Lakukan verifikasi email dan lengkapi data profil serta sertifikasi Anda untuk mulai beraktivitas di platform.',
  },
  {
    category: 'akun',
    question: 'Bagaimana sistem Tingkatan Medali untuk Tenaga Ahli, Tenaga Teknis & Surveyor?',
    answer:
      '1. Tingkatan medali ditentukan berdasarkan akumulasi jumlah klien konsultasi atau survei yang dilayani per tahun bagi tenaga ahli, tenaga teknis, dan surveyor anggota Paket Ekonomis & Eksklusif.\n2. Terdapat 6 tingkatan medali sesuai urutan resmi: Medali White, Medali Blue, Medali Silver, Medali Gold, Medali Platinum, dan Medali Diamond.\n3. Semakin tinggi medali, profil Anda akan semakin diprioritaskan di hasil pencarian serta memperoleh kepercayaan lebih tinggi dari calon klien.\n4. Anda dapat melihat rincian kriteria, jumlah target klien, dan keuntungan tiap medali di halaman Tingkatan Medali.',
  },
  {
    category: 'akun',
    question: 'Bagaimana jika saya lupa kata sandi akun?',
    answer:
      '1. Klik tombol "Sign In" di sudut kanan atas halaman.\n2. Pilih tautan "Lupa Password?".\n3. Masukkan alamat email yang terdaftar pada akun Anda.\n4. Buka pesan dari TenagaAhli di kotak masuk email dan klik tautan untuk mengatur ulang kata sandi baru.',
  },
  {
    category: 'pencarian',
    question: 'Bagaimana cara menghubungi atau berkonsultasi dengan Tenaga Ahli?',
    answer:
      '1. Kunjungi menu Tenaga Ahli atau Tenaga Teknis / Surveyor.\n2. Gunakan filter pencarian berdasarkan spesialisasi atau lokasi kota/provinsi.\n3. Buka profil ahli yang sesuai untuk meninjau tarif dan portofolio.\n4. Klik tombol "Hubungi Ahli" atau "Jadwalkan Konsultasi" untuk memulai diskusi langsung.',
  },
  {
    category: 'pencarian',
    question: 'Apakah saya bisa mengajukan proyek kajian untuk beberapa tenaga ahli sekaligus?',
    answer:
      'Ya, melalui dashboard pengguna atau fitur tiket proyek, Anda dapat memposting kebutuhan proyek tim dan sistem kami akan merekomendasikan tenaga ahli dengan kualifikasi yang cocok.',
  },
  {
    category: 'pembayaran',
    question: 'Bagaimana cara melakukan pembayaran konsultasi?',
    answer:
      '1. Pilih sesi konsultasi atau jadwal yang Anda inginkan pada profil tenaga ahli.\n2. Lanjutkan ke halaman pembayaran dan pilih metode Transfer Bank Manual atau QRIS.\n3. Lakukan pembayaran sesuai nominal invoice yang tertera.\n4. Unggah bukti pembayaran melalui form konfirmasi yang tersedia.\n5. Admin/sistem akan memverifikasi bukti transaksi dan sesi konsultasi Anda langsung aktif.',
  },
  {
    category: 'pembayaran',
    question: 'Metode pembayaran apa saja yang didukung?',
    answer:
      '1. QRIS: Pembayaran cepat dan praktis dengan memindai kode QRIS melalui mobile banking atau e-wallet (BCA Mobile, Livin, GoPay, OVO, Dana, ShopeePay, dll).\n2. Bank Transfer: Pembayaran manual via transfer ke rekening bank resmi dan mengunggah bukti transfer untuk verifikasi.',
  },
  {
    category: 'pembayaran',
    question: 'Bagaimana cara mendapatkan invoice atau faktur pembayaran resmi?',
    answer:
      '1. Pastikan transaksi pembayaran konsultasi atau langganan Anda telah berhasil diverifikasi.\n2. Masuk ke dashboard akun Anda dan pilih menu "Invoice".\n3. Cari transaksi yang bersangkutan lalu klik tombol "Unduh PDF" untuk mengunduh faktur resmi berstempel digital.',
  },
  {
    category: 'sertifikasi',
    question: 'Bagaimana cara mempublikasikan artikel atau jurnal penelitian saya?',
    answer:
      '1. Masuk ke akun Tenaga Ahli atau Tenaga Teknis Anda di platform.\n2. Buka menu "Research & Jurnal" pada dashboard pengguna.\n3. Klik tombol "Tambah Publikasi Baru", lengkapi detail riset dan unggah naskah ilmiah Anda.\n4. Naskah akan ditinjau oleh dewan pakar kami sebelum dipublikasikan secara resmi di platform.',
  },
  {
    category: 'keamanan',
    question: 'Bagaimana TenagaAhli.com melindungi kerahasiaan data proyek saya?',
    answer:
      'TenagaAhli.com berkomitmen penuh untuk menjaga kerahasiaan, keamanan, dan integritas seluruh data proyek maupun dokumen kajian teknis yang Anda unggah ke platform kami.\n\nSetiap interaksi konsultasi dan pertukaran berkas antara klien dan tenaga profesional dilindungi oleh standar enkripsi industri SSL 256-bit (Secure Sockets Layer). Ini memastikan seluruh pesan, dokumen kajian, laporan survei, dan file teknis lainnya terenkripsi secara aman selama transmisi maupun saat tersimpan di server.\n\nSelain pengamanan sistem, seluruh interaksi proyek di TenagaAhli.com secara otomatis terikat oleh Non-Disclosure Agreement (NDA) atau Perjanjian Kerahasiaan resmi. Tenaga ahli, tenaga teknis, maupun surveyor yang Anda pekerjakan berkewajiban hukum untuk menjaga kerahasiaan informasi dan dilarang membagikan data proyek kepada pihak ketiga mana pun tanpa persetujuan Anda.\n\nDokumen dan berkas proyek Anda bersifat privat dan hanya dapat diakses oleh Anda serta tenaga profesional yang ditugaskan secara sah. Kami menerapkan kontrol hak akses otentikasi ketat untuk mencegah akses tanpa izin.\n\nJika kamu menemukan hal yang mencurigakan atau mengalami kendala terkait kerahasiaan data proyek kamu, hubungi Customer Support melalui:\n• TenagaAhli Hotline: 0811-1520-900\n• E-mail: help@tenagaahli.com\n• Atau pilih \'Kirim Tiket\' pada menu \'Pusat Bantuan\' di platform TenagaAhli.',
  },
];

/* ─── Saluran Bantuan Cepat ─── */
const CONTACT_CHANNELS = [
  {
    title: 'Chat Layanan WhatsApp',
    desc: 'Respon instan dari tim customer care kami.',
    actionText: 'Chat Sekarang',
    href: 'https://wa.me/628111520900',
    Icon: ChatBubbleLeftRightIcon,
    badge: 'Respon Cepat',
  },
  {
    title: 'Kirim Email Bantuan',
    desc: 'help@tenagaahli.com (Respon dalam 1x24 jam).',
    actionText: 'Kirim Email',
    href: 'mailto:help@tenagaahli.com',
    Icon: EnvelopeIcon,
    badge: 'Email Resmi',
  },
  {
    title: 'Layanan Telepon Kantor',
    desc: '0811-1520-900 (Senin - Jumat 08:30 - 17:00 WIB).',
    actionText: 'Hubungi Kami',
    href: 'tel:08111520900',
    Icon: PhoneIcon,
    badge: 'Hotline',
  },
  {
    title: 'Kirim Tiket Bantuan',
    desc: 'Buka tiket pengaduan teknis atau konsultasi khusus.',
    actionText: 'Buka Tiket',
    href: '/tiket',
    Icon: TicketIcon,
    badge: 'Dashboard',
  },
];

export default function PusatBantuan() {
  const { t } = useTranslation();
  const { reportReady } = usePageLoading();
  const [searchParams] = useSearchParams();

  const [searchKeyword, setSearchKeyword] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('cat') || 'all');
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Quick form state
  const [ticketForm, setTicketForm] = useState({
    name: '',
    email: '',
    topic: 'Akun & Keanggotaan',
    message: '',
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const cat = searchParams.get('cat');
    const q = searchParams.get('q');
    if (cat) setSelectedCategory(cat);
    if (q) setSearchKeyword(q);
  }, [searchParams]);

  useEffect(() => {
    reportReady();
  }, [reportReady]);

  // Filter FAQs
  const filteredFaqs = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase();
    return FAQ_LIST.filter((item) => {
      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchKw =
        !kw ||
        item.question.toLowerCase().includes(kw) ||
        item.answer.toLowerCase().includes(kw);
      return matchCat && matchKw;
    });
  }, [searchKeyword, selectedCategory]);

  const handleSubmitInquiry = (e) => {
    e.preventDefault();
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setIsSubmitted(true);
      setTicketForm({ name: '', email: '', topic: 'Akun & Keanggotaan', message: '' });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#FDFBF9]">
      {/* ── 1. HERO SEARCH SECTION ── */}
      <section
        className="relative overflow-hidden pt-28 md:pt-36 pb-20 md:pb-28"
        style={{
          background: 'linear-gradient(135deg, #3D1C02 0%, #6B3410 40%, #8B4513 60%, #3D1C02 100%)',
        }}
      >
        {/* Decorative backdrop shapes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] rounded-full bg-amber-400/[0.06]" />
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
          {/* Badge */}
          <span className="inline-flex items-center gap-2 bg-amber-500/20 backdrop-blur-sm border border-amber-400/25 text-amber-200 text-xs font-bold px-4 py-1.5 rounded-full mb-4 tracking-wider uppercase">
            <SparklesIcon className="w-3.5 h-3.5" />
            {t('Layanan Bantuan 24/7')}
          </span>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
            {t('Pusat Bantuan')} &amp;{' '}
            <span className="text-amber-400">{t('Dukungan')}</span>
          </h1>

          <p className="mt-4 text-sm sm:text-base md:text-lg text-white/80 max-w-2xl mx-auto leading-relaxed">
            {t(
              'Temukan jawaban cepat atas pertanyaan anda seputar layanan tenaga ahli, tenaga teknis, surveyor, dan akun anda.'
            )}
          </p>

          {/* Search Box */}
          <div className="mt-8 max-w-2xl mx-auto relative">
            <div className="relative flex items-center">
              <MagnifyingGlassIcon className="absolute left-4 w-5 h-5 text-gray-400 pointer-events-none" />
              <input
                type="text"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                placeholder={t('Ketik pertanyaan atau kata kunci bantuan... (cth: verifikasi, invoice, AMDAL)')}
                className="w-full pl-12 pr-12 py-4 rounded-2xl bg-white/95 backdrop-blur-sm text-sm text-gray-800 placeholder-gray-400 shadow-xl border border-white/30 focus:outline-none focus:ring-2 focus:ring-amber-400/50 transition-all"
              />
              {searchKeyword && (
                <button
                  type="button"
                  onClick={() => setSearchKeyword('')}
                  className="absolute right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. HELP CATEGORIES GRID ── */}
      <section className="max-w-6xl mx-auto px-6 -mt-8 relative z-20">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {HELP_CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setSelectedCategory(isSelected ? 'all' : cat.id);
                  setSearchKeyword('');
                }}
                className={`text-left p-6 rounded-2xl bg-white border transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5 cursor-pointer ${
                  isSelected
                    ? 'border-[#8B4513] ring-2 ring-[#8B4513]/20 bg-[#FDF9F5]'
                    : 'border-gray-100 hover:border-[#DCCEC0]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-[#8B4513] text-white'
                        : 'bg-[#F8F2EB] text-[#8B4513]'
                    }`}
                  >
                    <cat.Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <h2 className="text-base font-bold text-gray-900 leading-snug">
                      {t(cat.title)}
                    </h2>
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                      {t(cat.desc)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {selectedCategory !== 'all' && (
          <div className="mt-4 flex items-center justify-between bg-amber-50 border border-amber-200 text-[#8B4513] px-4 py-2.5 rounded-xl text-xs">
            <span>
              Menampilkan FAQ kategori:{' '}
              <strong>{HELP_CATEGORIES.find((c) => c.id === selectedCategory)?.title}</strong>
            </span>
            <button
              onClick={() => setSelectedCategory('all')}
              className="font-bold underline hover:text-[#55290A]"
            >
              Lihat Semua Kategori
            </button>
          </div>
        )}
      </section>

      {/* ── 3. FAQ SECTION (ACCORDION) ── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-2 text-[#8B4513]">
            <QuestionMarkCircleIcon className="w-5 h-5" />
            <span className="text-xs font-bold uppercase tracking-wider">
              {t('Pertanyaan yang Sering Diajukan')}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {t('FAQ Populer')}
          </h2>
          <p className="text-sm text-gray-500 mt-2">
            {t('Jawaban lengkap untuk mempermudah pengalaman Anda di platform TenagaAhli.com.')}
          </p>
        </div>

        {/* FAQ Accordion List */}
        {filteredFaqs.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-gray-100 p-8 shadow-xs">
            <QuestionMarkCircleIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-gray-800">
              {t('Tidak ada pertanyaan yang sesuai')}
            </h3>
            <p className="text-xs text-gray-500 mt-1 mb-4">
              {t('Coba gunakan kata kunci lain atau pilih kategori yang berbeda.')}
            </p>
            <button
              onClick={() => {
                setSearchKeyword('');
                setSelectedCategory('all');
              }}
              className="px-4 py-2 bg-[#8B4513] text-white text-xs font-semibold rounded-xl hover:bg-[#6B3410] transition-colors"
            >
              {t('Reset Pencarian')}
            </button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredFaqs.map((faq, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-gray-100 shadow-2xs overflow-hidden transition-all"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 font-semibold text-gray-800 hover:text-[#8B4513] transition-colors"
                  >
                    <span className="text-sm sm:text-base leading-snug">
                      {faq.question}
                    </span>
                    <ChevronDownIcon
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180 text-[#8B4513]' : ''
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="px-6 pb-5 pt-2 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-gray-50 bg-[#FDFBF9]/60">
                      {formatFaqAnswer(faq.answer)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── 4. DIRECT CONTACT CHANNELS (HALODOC/PREMIUM STYLE) ── */}
      <section className="bg-white border-t border-gray-100 py-16">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8B4513]">
              {t('Butuh Bantuan Lebih Lanjut?')}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mt-1">
              {t('Hubungi Tim Layanan Kami')}
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto">
              {t(
                'Tim ahli dan layanan pelanggan kami siap membantu menyelesaikan pertanyaan Anda melalui berbagai saluran.'
              )}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {CONTACT_CHANNELS.map((item) => (
              <div
                key={item.title}
                className="rounded-2xl border border-[#EBE1D7] bg-[#FAF6F2] p-6 flex flex-col justify-between hover:shadow-md hover:border-[#8B4513]/40 transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-white border border-[#DFCBB5] text-[#8B4513] flex items-center justify-center shadow-2xs">
                      <item.Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-white px-2.5 py-1 rounded-full text-gray-600 border border-gray-200">
                      {item.badge}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{item.title}</h3>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>

                <div className="pt-6">
                  {item.href.startsWith('http') || item.href.startsWith('mailto') || item.href.startsWith('tel') ? (
                    <a
                      href={item.href}
                      target={item.href.startsWith('http') ? '_blank' : undefined}
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-between w-full text-xs font-bold text-[#8B4513] bg-white border border-[#DFCBB5] hover:bg-[#8B4513] hover:text-white px-4 py-2.5 rounded-xl transition-all shadow-2xs group"
                    >
                      <span>{t(item.actionText)}</span>
                      <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </a>
                  ) : (
                    <Link
                      to={item.href}
                      className="inline-flex items-center justify-between w-full text-xs font-bold text-[#8B4513] bg-white border border-[#DFCBB5] hover:bg-[#8B4513] hover:text-white px-4 py-2.5 rounded-xl transition-all shadow-2xs group"
                    >
                      <span>{t(item.actionText)}</span>
                      <ArrowRightIcon className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 5. QUICK INQUIRY FORM ── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="rounded-3xl bg-gradient-to-br from-white to-[#FAF6F2] border border-[#E8DED2] p-8 md:p-12 shadow-sm">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#8B4513]/10 text-[#8B4513] mb-3">
                <TicketIcon className="w-6 h-6" />
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {t('Kirim Pertanyaan Langsung')}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {t('Tidak menemukan jawaban yang dicari? Tuliskan pesan Anda dan kami akan membalas via email.')}
              </p>
            </div>

            {isSubmitted ? (
              <div className="text-center py-8 bg-emerald-50 border border-emerald-200 rounded-2xl p-6">
                <CheckCircleIcon className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-gray-900">
                  {t('Pesan Anda Berhasil Terkirim!')}
                </h3>
                <p className="text-xs text-gray-600 mt-1 mb-4">
                  {t('Tim dukungan kami akan merespons pertanyaan Anda ke email yang Anda cantumkan dalam 1x24 jam.')}
                </p>
                <button
                  type="button"
                  onClick={() => setIsSubmitted(false)}
                  className="px-4 py-2 bg-[#8B4513] text-white text-xs font-semibold rounded-xl hover:bg-[#6B3410] transition-colors"
                >
                  {t('Kirim Pertanyaan Lain')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitInquiry} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      {t('Nama Lengkap')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={ticketForm.name}
                      onChange={(e) => setTicketForm({ ...ticketForm, name: e.target.value })}
                      placeholder={t('Nama Anda')}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1.5">
                      {t('Alamat Email')} <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={ticketForm.email}
                      onChange={(e) => setTicketForm({ ...ticketForm, email: e.target.value })}
                      placeholder={t('email@domain.com')}
                      className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {t('Topik Pertanyaan')}
                  </label>
                  <select
                    value={ticketForm.topic}
                    onChange={(e) => setTicketForm({ ...ticketForm, topic: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
                  >
                    <option value="Akun & Keanggotaan">{t('Akun & Keanggotaan')}</option>
                    <option value="Pencarian Tenaga Ahli & Surveyor">{t('Pencarian Tenaga Ahli & Surveyor')}</option>
                    <option value="Pembayaran & Invoice">{t('Pembayaran & Invoice')}</option>
                    <option value="Kajian & Dokumen AMDAL">{t('Kajian & Dokumen AMDAL')}</option>
                    <option value="Sertifikasi & Kredensial">{t('Sertifikasi & Kredensial')}</option>
                    <option value="Lainnya">{t('Lainnya')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    {t('Detail Pertanyaan atau Kendala')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={ticketForm.message}
                    onChange={(e) => setTicketForm({ ...ticketForm, message: e.target.value })}
                    placeholder={t('Jelaskan pertanyaan atau kendala yang Anda alami secara rinci...')}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-gray-200 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 focus:border-[#8B4513]"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 bg-[#8B4513] hover:bg-[#6B3410] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {submitting ? (
                      <span>{t('Mengirim pesan...')}</span>
                    ) : (
                      <>
                        <span>{t('Kirim Pertanyaan')}</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
