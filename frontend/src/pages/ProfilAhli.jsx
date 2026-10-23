import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import LevelBadge from '../components/LevelBadge.jsx';
import ConsultationMedalBadge from '../components/ConsultationMedalBadge.jsx';
import medalWhiteImg from '../assets/medals/medal-white.png';
import medalBlueImg from '../assets/medals/medal-blue.png';
import medalSilverImg from '../assets/medals/medal-silver.png';
import medalGoldImg from '../assets/medals/medal-gold.png';
import medalPlatinumImg from '../assets/medals/medal-platinum.png';
import medalDiamondImg from '../assets/medals/medal-diamond.png';
import GraduationCapLoader from '../components/GraduationCapLoader.jsx';
import { usePageLoading } from '../context/LoadingContext.jsx';

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCoordinatesFromLocation } from '../utils/indonesiaGeo.js';
import { getVideoEmbedInfo } from '../utils/media.js';
import { calculateConsultationSplit, getConsultationRates } from '../utils/packageCommission.js';
import PublicBookingCalendar from '../components/PublicBookingCalendar.jsx';
import { OFFICIAL_BANK_ACCOUNTS, PT_COMPANY_NAME } from '../constants/bankAccounts.js';
import ManualPaymentInstruction from '../components/ManualPaymentInstruction.jsx';
import { loadMidtransSnap } from '../utils/midtrans.js';

// ---------------------------------------------------------------------------
// TenagaAhli.com Brand Colors - Matching the website's design system
// Updated from AMDAL.id to TenagaAhli.com branding
// ---------------------------------------------------------------------------
const BRAND_BROWN = '#8B4513';     // Primary brown to match new logo
const NAVY_DARK = '#654321';      // Deep brown for contrast  
const ACCENT_BROWN = '#A0522D';     // Darker brown for verification badges
const ACCENT_SKY = '#A0522D';       // Backward compatibility alias
const STAR_GOLD = '#F59E0B';      // Rating star color

// Demo data used only if /api/experts/:slug is unreachable.
const FALLBACK_PROFILE = {
  slug: 'dr-irman-firmansyah-s-hut-m-si',
  name: 'Dr. Irman Firmansyah, S.Hut, M.Si',
  gelar: 'Dr., S.Hut, M.Si',
  profesi: 'Peneliti & Konsultan Lingkungan',
  institution: 'PSL - IPB University',
  verified: true,
  activeSince: 2011,
  photo: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200',
  cover: 'https://images.unsplash.com/photo-1562774053-701939374585?auto=format&fit=crop&q=80&w=1400',
  email: 'irmanf@gmail.com',
  is_premium: true,
  ketersediaan: { status: 'tersedia', label: 'Tersedia untuk kerja sama baru' },

  // ---- Profil Bio -----------------------------------------------------
  tentangSaya:
    'Bekerja pada irisan antara ilmu kehutanan, lingkungan, dan pemodelan sistem dinamik untuk mendukung perencanaan pembangunan yang berkelanjutan. Selama lebih dari satu dekade terlibat dalam penyusunan KLHS, kajian daya dukung lingkungan, dan pendampingan kebijakan tata ruang di berbagai daerah di Indonesia.',
  ringkasanKeahlian:
    'Pemodelan sistem dinamik dan analisis spasial untuk kajian lingkungan hidup strategis serta perencanaan tata ruang berbasis daya dukung.',
  bidangUtama: ['Kajian Lingkungan Hidup Strategis (KLHS)', 'Perencanaan Tata Ruang', 'Pemodelan Sistem Dinamik'],
  pengalaman:
    'Lebih dari 10 tahun sebagai peneliti, konsultan, dan tenaga ahli pendamping kebijakan pada berbagai kajian lingkungan hidup strategis dan tata ruang di lebih dari 15 kabupaten/kota di Indonesia.',

  // ---- Kategori Profesional --------------------------------------------
  kategoriProfesional: ['Tenaga Ahli / Konsultan', 'Peneliti', 'Narasumber', 'Akademisi'],

  // ---- Bidang Keahlian ---------------------------------------------------
  keahlian: ['Ilmu Kehutanan', 'Ilmu Lingkungan', 'System Dynamics', 'Spasial Dynamics'],
  kompetensi: ['Powersim / Vensim', 'GIS & Penginderaan Jauh', 'Fasilitasi Multi-pihak'],

  // ---- Pengalaman Kerja ---------------------------------------------------
  pengalamanKerja: [
    {
      jabatan: 'Peneliti & Dosen',
      institusi: 'Pusat Studi Lingkungan (PSL), IPB University',
      periode: '2011 — Sekarang',
      deskripsi:
        'Mengampu riset dan pengajaran pada bidang perencanaan lingkungan, dengan fokus pemodelan sistem dinamik untuk kajian daya dukung wilayah.',
    },
    {
      jabatan: 'Konsultan Lingkungan Independen',
      institusi: 'Freelance / Berbagai Pemerintah Daerah',
      periode: '2013 — Sekarang',
      deskripsi:
        'Menyusun dan memfasilitasi Kajian Lingkungan Hidup Strategis (KLHS) untuk RTRW, RDTR, dan RPJMD di lebih dari 15 kabupaten/kota.',
    },
    {
      jabatan: 'Tenaga Ahli Pendamping',
      institusi: 'Kementerian Lingkungan Hidup dan Kehutanan',
      periode: '2016 — 2020',
      deskripsi: 'Mendampingi penyusunan pedoman teknis integrasi KLHS ke dalam dokumen rencana tata ruang daerah.',
    },
  ],

  // ---- Pengalaman Proyek ---------------------------------------------------
  pengalamanProyek: [
    {
      nama: 'Kajian Sistem Dinamik untuk KLHS RPJMD Kota Manado',
      peran: 'Ketua Tim Ahli',
      tahun: '2021',
      lokasi: 'Manado',
      deskripsi: 'Membangun model sistem dinamik untuk memproyeksikan dampak skenario pembangunan terhadap daya dukung lingkungan kota.',
    },
    {
      nama: 'KLHS RDTR Kecamatan Selaawi–Banyuresmi',
      peran: 'Tenaga Ahli Lingkungan',
      tahun: '2022',
      lokasi: 'Garut',
      deskripsi: 'Mengidentifikasi materi kebijakan, rencana, dan program (KRP) serta merumuskan isu pembangunan berkelanjutan paling strategis.',
    },
    {
      nama: 'Analisis Daya Dukung DAS Cimanuk Hulu',
      peran: 'Anggota Tim Peneliti',
      tahun: '2019',
      lokasi: 'Garut',
      deskripsi: 'Menghitung daya tampung dan daya dukung lingkungan sub-DAS untuk mendukung rekomendasi tata guna lahan.',
    },
  ],

  // ---- Sertifikasi Keahlian ---------------------------------------------------
  sertifikasi: [
    {
      nama: 'Ahli Kajian Lingkungan Hidup Strategis (KLHS)',
      lembaga: 'Kementerian Lingkungan Hidup dan Kehutanan',
      nomor: 'KLHS-2019-00871',
      tahun: '2019',
      berlakuHingga: '2027',
      dokumen: '#',
    },
    {
      nama: 'Fasilitator Pemodelan Sistem Dinamik',
      lembaga: 'System Dynamics Society Indonesia',
      nomor: 'SDI-0456',
      tahun: '2020',
      berlakuHingga: '2026',
      dokumen: '#',
    },
    {
      nama: 'Ahli Madya Perencanaan Wilayah dan Kota',
      lembaga: 'Lembaga Pengembangan Jasa Konstruksi (LPJK)',
      nomor: 'AMPWK-33812',
      tahun: '2021',
      berlakuHingga: '2027',
      dokumen: '#',
    },
  ],

  // ---- Riwayat Pendidikan ---------------------------------------------------
  pendidikan: [
    { jenjang: 'S3 · Doktor', institusi: 'IPB University', prodi: 'Ilmu Pengetahuan Kehutanan', gelar: 'Dr.', tahun: '2018' },
    { jenjang: 'S2 · Magister', institusi: 'IPB University', prodi: 'Ilmu Lingkungan', gelar: 'M.Si', tahun: '2010' },
    { jenjang: 'S1 · Sarjana', institusi: 'IPB University', prodi: 'Kehutanan', gelar: 'S.Hut', tahun: '2006' },
  ],

  // ---- Organisasi ---------------------------------------------------
  organisasi: [
    { nama: 'Ikatan Ahli Perencanaan Indonesia (IAP)', jabatan: 'Anggota', periode: '2015 — Sekarang', kontribusi: 'Kontributor diskusi kebijakan tata ruang berkelanjutan.' },
    { nama: 'Masyarakat Ekonomi Lingkungan Indonesia (MELI)', jabatan: 'Pengurus Bidang Riset', periode: '2019 — Sekarang', kontribusi: 'Mengoordinasikan kajian valuasi ekonomi lingkungan.' },
  ],

  // ---- Profil Akademik (Old format - fallback) ---------------------------------------------------
  profilAkademik: {
    scopus: { url: 'https://www.scopus.com', label: 'Scopus', metrik: 'H-index 8 · 24 dokumen' },
    googleScholar: { url: 'https://scholar.google.com', label: 'Google Scholar', metrik: '312 sitasi' },
    sinta: { url: 'https://sinta.kemdikbud.go.id', label: 'SINTA', metrik: 'Skor SINTA 3 · S3' },
    orcid: { url: 'https://orcid.org', label: 'ORCID', metrik: '0000-0002-XXXX-XXXX' },
    researchGate: { url: 'https://www.researchgate.net', label: 'ResearchGate', metrik: 'RG Score 18.4' },
  },

  // ---- Link Akademik (New format dari database) ---------------------------------------------------
  scopus_url: 'https://www.scopus.com/authid/detail.uri?authorId=57220867183',
  scopus_metrics: 'H-index 8 · 24 dokumen',
  google_scholar_url: 'https://scholar.google.com/citations?user=aBcDeFgHiJk',
  google_scholar_metrics: '312 sitasi',
  sinta_url: 'https://sinta.kemdikbud.go.id/authors/profile/6008450',
  sinta_metrics: 'Skor SINTA 3 · S3',
  orcid_url: 'https://orcid.org/0000-0002-1234-5678',
  orcid_metrics: '0000-0002-1234-5678',
  researchgate_url: 'https://www.researchgate.net/profile/Irman-Firmansyah',
  researchgate_metrics: 'RG Score 18.4',

  // ---- Reviewer Jurnal ---------------------------------------------------
  reviewerJurnal: [
    { nama: 'Jurnal Ilmu Lingkungan Indonesia', institusi: 'Universitas Diponegoro', bidang: 'Perencanaan Lingkungan', periode: '2020 — Sekarang' },
    { nama: 'Journal of Regional and City Planning', institusi: 'Institut Teknologi Bandung', bidang: 'Tata Ruang & Sistem Dinamik', periode: '2021 — Sekarang' },
  ],

  // ---- Publikasi ---------------------------------------------------
  publikasi: [
    { jenis: 'Jurnal', judul: 'Model Sistem Dinamik untuk Proyeksi Daya Dukung Lingkungan Perkotaan', penerbit: 'Jurnal Ilmu Lingkungan Indonesia', tahun: '2022', link: '#' },
    { jenis: 'Prosiding', judul: 'Integrasi KLHS dalam Penyusunan RDTR: Studi Kasus Kabupaten Garut', penerbit: 'Seminar Nasional Perencanaan Wilayah', tahun: '2021', link: '#' },
    { jenis: 'Buku', judul: 'Dasar-Dasar Pemodelan Sistem Dinamik untuk Kebijakan Lingkungan', penerbit: 'IPB Press', tahun: '2019', link: '#' },
  ],

  // ---- Narasumber ---------------------------------------------------
  narasumber: [
    { title: 'Identifikasi materi KRP & analisis pengaruh KLHS RDTR Kec. Selaawi–Banyuresmi', penyelenggara: 'Dinas Lingkungan Hidup Kab. Garut', tempat: 'Garut', tanggal: '15 Nov 2022' },
    { title: 'Penyepakatan isu pembangunan berkelanjutan strategis KLHS RDTR Kec. Selaawi–Banyuresmi', penyelenggara: 'Dinas Lingkungan Hidup Kab. Garut', tempat: 'Garut', tanggal: '21 Sep 2022' },
    { title: 'Perumusan isu pembangunan berkelanjutan paling strategis KLHS RDTR Kec. Selaawi–Banyuresmi', penyelenggara: 'Dinas Lingkungan Hidup Kab. Garut', tempat: 'Garut', tanggal: '13 Sep 2022' },
  ],

  // ---- Instruktur / Trainer ---------------------------------------------------
  instruktur: [
    { nama: 'Pelatihan Penyusunan KLHS bagi Aparatur Daerah', materi: 'Metode Pemodelan Sistem Dinamik', penyelenggara: 'BPSDM Provinsi Jawa Barat', peran: 'Instruktur Utama', tahun: '2022' },
    { nama: 'Workshop Analisis Daya Dukung Lingkungan', materi: 'Perhitungan Daya Tampung Lahan', penyelenggara: 'PSL IPB University', peran: 'Fasilitator', tahun: '2020' },
  ],

  // ---- Portofolio ---------------------------------------------------
  portofolio: {
    cv: '#',
    sertifikat: ['Sertifikat Ahli KLHS.pdf', 'Sertifikat Fasilitator Sistem Dinamik.pdf'],
    dokumentasi: ['Dokumentasi KLHS Kota Manado.pdf', 'Dokumentasi Workshop BPSDM Jabar.pdf'],
    dokumenProyek: ['Laporan Akhir KLHS RDTR Garut.pdf'],
  },

  // ---- Ulasan / Reviews ---------------------------------------------------
  // Data awal (demo). Ulasan baru yang dikirim pengguna akan ditambahkan
  // di atas daftar ini secara lokal, dan (jika API tersedia) disimpan ke server.
  ulasan: [
    {
      nama: 'Ahmad Fauzi',
      rating: 5,
      komentar:
        'Sangat membantu dalam penyusunan KLHS RDTR di daerah kami. Penjelasannya detail dan mudah dipahami, baik oleh tim teknis maupun pemangku kepentingan non-teknis. Rekomendasi terbaik untuk kajian lingkungan hidup strategis.',
      tanggal: '2 minggu lalu',
    },
    {
      nama: 'Siti Rahmawati',
      rating: 5,
      komentar: 'Profesional dan responsif sejak konsultasi awal. Hasil pemodelan sistem dinamiknya sangat membantu pengambilan keputusan di daerah kami.',
      tanggal: '1 bulan lalu',
    },
    {
      nama: 'Budi Santoso',
      rating: 4,
      komentar: 'Kompeten di bidangnya dan komunikasi lancar selama proyek berjalan. Hanya perlu sedikit penyesuaian jadwal di tahap awal.',
      tanggal: '2 bulan lalu',
    },
    {
      nama: 'Dewi Lestari',
      rating: 5,
      komentar:
        'Narasumber yang sangat menguasai materi KLHS dan mampu menjelaskan konsep yang cukup rumit dengan bahasa yang sederhana dan mudah diikuti peserta pelatihan.',
      tanggal: '3 bulan lalu',
    },
  ],

  alamat: {
    lengkap: 'Komplek IPB 2, Blok C No. 4 Sindang Barang, Bogor 16117',
    kota: 'Kota Bogor',
    provinsi: 'Jawa Barat',
  },
  lokasi: {
    label: 'Jl. Mercurius No.4, RW.5, Ciherang, Kec. Dramaga, Kabupaten Bogor, Jawa Barat 16680',
    lat: -6.5622,
    lng: 106.7297,
  },

  // ---- Konsultasi -------------------------------------------------------
  consultation_rates: {
    chat: 150000,      // Rp 150,000 per sesi (60 menit)
    email: 100000,     // Rp 100,000 per pertanyaan
    zoom: 250000,      // Rp 250,000 per sesi (60 menit)
  },
  available_schedules: [
    { id: 1, date: '2024-12-15', time: '09:00 - 10:00 WIB', available: true },
    { id: 2, date: '2024-12-15', time: '14:00 - 15:00 WIB', available: true },
    { id: 3, date: '2024-12-16', time: '10:00 - 11:00 WIB', available: true },
    { id: 4, date: '2024-12-16', time: '15:00 - 16:00 WIB', available: true },
    { id: 5, date: '2024-12-17', time: '09:00 - 10:00 WIB', available: true },
    { id: 6, date: '2024-12-17', time: '13:00 - 14:00 WIB', available: true },
    { id: 7, date: '2024-12-18', time: '08:00 - 09:00 WIB', available: true },
    { id: 8, date: '2024-12-18', time: '16:00 - 17:00 WIB', available: true },
  ],

  // ---- Produk Marketplace -----------------------------------------------
  products: [
    {
      id: 1,
      title: 'Panduan Lengkap AMDAL untuk Proyek Konstruksi',
      category: 'book',
      price: 250000,
      discount_price: 200000,
      rating: 4.8,
      reviews_count: 12,
      sold_count: 25,
      description: 'Buku panduan lengkap untuk memahami proses AMDAL dalam proyek konstruksi. Dilengkapi dengan studi kasus nyata dan template dokumen.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300',
      is_digital: true,
      is_featured: true
    },
    {
      id: 2,
      title: 'Template Laporan Analisis Dampak Lingkungan',
      category: 'template',
      price: 150000,
      rating: 4.9,
      reviews_count: 20,
      sold_count: 45,
      description: 'Template Microsoft Word siap pakai untuk laporan AMDAL. Menghemat waktu penyusunan laporan hingga 70%.',
      image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&q=80&w=300',
      is_digital: true,
      is_featured: true
    },
    {
      id: 3,
      title: 'Kursus Online: Sistem Dinamik untuk Analisis Lingkungan',
      category: 'course',
      price: 500000,
      discount_price: 350000,
      rating: 4.7,
      reviews_count: 8,
      sold_count: 15,
      description: 'Kursus online 4 minggu tentang penggunaan sistem dinamik dalam analisis lingkungan. Termasuk software dan sertifikat.',
      image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=300',
      is_digital: true,
      is_featured: false
    },
    {
      id: 4,
      title: 'Presentasi Best Practices Environmental Management',
      category: 'presentation',
      price: 300000,
      rating: 4.6,
      reviews_count: 7,
      sold_count: 18,
      description: 'Presentasi PowerPoint profesional tentang best practices manajemen lingkungan. 50+ slide dengan infografis menarik.',
      image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=300',
      is_digital: true,
      is_featured: false
    }
  ],

  sosial: [
    { label: 'Instagram', type: 'instagram', url: 'https://www.instagram.com/dr.irman/' },
    { label: 'Facebook', type: 'facebook', url: 'https://www.facebook.com/wearecase27/' },
    { label: 'YouTube', type: 'youtube', url: 'https://www.youtube.com/channel/UCva2ULajnzEhorlabr_yDpA' },
    { label: 'Twitter', type: 'twitter', url: 'https://twitter.com/collective27' },
  ],
  kriteria: [
    { label: 'Narasumber/Pembicara', to: '/narasumber' },
    { label: 'Dosen/Peneliti', to: '/dosen-peneliti' },
  ],
};

// ---------------------------------------------------------------------------
// Small building blocks
// ---------------------------------------------------------------------------

function SocialIcon({ type }) {
  if (type === 'instagram') {
    return (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    );
  }
  if (type === 'facebook') {
    return (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    );
  }
  if (type === 'youtube') {
    return (
      <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
      </svg>
    );
  }
  if (type === 'twitter') {
    return (
      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    );
  }
  return null;
}

// Section shell: eyebrow label + heading + optional description, consistent
// spacing/rhythm reused across every block on the page.
function SectionHeading({ eyebrow, title, id }) {
  return (
    <div className="mb-5 flex items-baseline gap-3">
      <h2 className="font-headline-lg text-lg md:text-xl font-bold text-gray-900">{title}</h2>
      {eyebrow && <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{eyebrow}</span>}
    </div>
  );
}

function Chip({ children, tone = 'blue' }) {
  const tones = {
    blue: 'bg-[#8B4513]/10 text-[#8B4513]',
    sky: 'bg-[#8B4513]/10 text-[#8B4513]',
    gray: 'bg-gray-100 text-gray-600',
  };
  return <span className={`inline-flex items-center text-sm font-medium px-3.5 py-1.5 rounded-full ${tones[tone]}`}>{children}</span>;
}

function StatBlock({ icon, value, label }) {
  return (
    <div className="flex flex-col items-start gap-1 bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <span className="material-symbols-outlined text-[20px] text-[#8B4513]">{icon}</span>
      <span className="text-xl font-bold text-gray-900 leading-none">{value}</span>
      <span className="text-xs text-gray-500">{label}</span>
    </div>
  );
}

// A vertical rail timeline item — used for real chronological data only
// (work history, projects, education) where order genuinely carries meaning.
function TimelineItem({ isLast, period, title, subtitle, description, tag }) {
  return (
    <div className="relative pl-8">
      <span className="absolute left-0 top-1 w-3 h-3 rounded-full bg-[#8B4513] ring-4 ring-[#8B4513]/15" />
      {!isLast && <span className="absolute left-[5px] top-4 bottom-[-1.5rem] w-px bg-gray-200" />}
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="text-xs font-semibold text-[#8B4513] tracking-wide">{period}</span>
        {tag && <Chip tone="gray">{tag}</Chip>}
      </div>
      <h4 className="text-sm font-bold text-gray-900">{title}</h4>
      {subtitle && <p className="text-sm text-gray-600 mb-1">{subtitle}</p>}
      {description && <ExpandableText text={description} maxLines={2} className="text-sm text-gray-500 leading-relaxed mt-1" />}
    </div>
  );
}

// Specialized timeline item for education history with graduation cap & degree badges




function ProjectExperienceTimelineItem({ isLast, period, title, role, location, description, t }) {
  return (
    <div className="relative pl-12 pb-5 group">
      {/* Icon Badge */}
      <div className="absolute left-0 top-0.5 w-9 h-9 rounded-xl border border-blue-200 bg-blue-50 text-blue-800 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
        <span className="material-symbols-outlined text-[20px]">assignment</span>
      </div>

      {/* Connecting Vertical Line */}
      {!isLast && (
        <span className="absolute left-[18px] top-10 bottom-0 w-0.5 bg-gradient-to-b from-blue-400/30 via-gray-200 to-gray-200" />
      )}

      {/* Card Content */}
      <div className="bg-white rounded-2xl border border-gray-200/90 hover:border-[#8B4513]/40 p-4 sm:p-5 transition-all shadow-2xs hover:shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
          <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
            {t(title)}
          </h4>
          {period && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200/60">
              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
              {t(period)}
            </span>
          )}
        </div>

        {(role || location) && (
          <div className="flex flex-wrap items-center gap-2 mt-1">
            {role && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                <span className="material-symbols-outlined text-[13px]">badge</span>
                <span>{t(role)}</span>
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1 text-xs text-gray-600 font-medium">
                <span className="material-symbols-outlined text-[14px] text-gray-400">location_on</span>
                <span>{t(location)}</span>
              </span>
            )}
          </div>
        )}

        {description && (
          <div className="mt-2.5 pt-2 border-t border-gray-100">
            <ExpandableText text={description} maxLines={3} className="text-xs sm:text-sm text-gray-500 leading-relaxed" />
          </div>
        )}
      </div>
    </div>
  );
}

// Academic Platform Logos & Themes
export function ScopusLogo() {
  return (
    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#FFF5EC] to-[#FFE2CC] border border-[#FF6C00]/30 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#FF6C00" />
        <path d="M8.5 14.2C9.1 15.3 10.3 16 11.8 16C13.8 16 15.5 14.6 15.5 12.6C15.5 10.6 13.9 9.9 12.3 9.3C10.9 8.8 10 8.3 10 7.4C10 6.6 10.8 6 11.9 6C13 6 13.9 6.5 14.5 7.2" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <circle cx="16.5" cy="7.2" r="1.3" fill="white" />
      </svg>
    </div>
  );
}

export function GoogleScholarLogo() {
  return (
    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#EEF4FE] to-[#DDEBFE] border border-[#4285F4]/30 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 4L3 9L12 14L21 9L12 4Z" fill="#4285F4" />
        <path d="M6.5 11.5V15.5C6.5 17.5 9 19.2 12 19.2C15 19.2 17.5 17.5 17.5 15.5V11.5L12 14.8L6.5 11.5Z" fill="#2A6BD4" />
        <path d="M20 10.2V16C19.7 16.5 19 16.5 18.7 16V11L20 10.2Z" fill="#EA4335" />
        <circle cx="18.7" cy="16.5" r="0.9" fill="#FBBC05" />
      </svg>
    </div>
  );
}

export function SintaLogo() {
  return (
    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E6F7F8] to-[#CFEFF2] border border-[#00828A]/30 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <path d="M12 3L4 6.5V12C4 16.2 7.4 19.6 12 20.8C16.6 19.6 20 16.2 20 12V6.5L12 3Z" fill="#00828A" />
        <path d="M12 6L6.5 8.5V12C6.5 15.1 8.8 17.7 12 18.6C15.2 17.7 17.5 15.1 17.5 12V8.5L12 6Z" fill="#00A896" />
        <path d="M9.5 11C9.5 9.8 10.5 9 11.8 9C13 9 14 9.8 14 10.8C14 12 12.8 12.4 11.8 12.8C10.8 13.2 10 13.6 10 14.5C10 15.5 11 16.2 12.2 16.2C13.2 16.2 14 15.7 14.5 15" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      </svg>
    </div>
  );
}

export function OrcidLogo() {
  return (
    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#F5FAE9] to-[#E5F5C8] border border-[#A6CE39]/40 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#A6CE39" />
        <path d="M8.2 8H9.7V16H8.2V8Z" fill="white" />
        <path d="M11 8H13.4C15.5 8 16.8 9.3 16.8 12C16.8 14.7 15.5 16 13.4 16H11V8ZM12.5 9.4V14.6H13.4C14.7 14.6 15.3 13.6 15.3 12C15.3 10.4 14.7 9.4 13.4 9.4H12.5Z" fill="white" />
        <circle cx="8.95" cy="6.2" r="0.9" fill="white" />
      </svg>
    </div>
  );
}

export function ResearchGateLogo() {
  return (
    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#E6FAF8] to-[#CEF5F0] border border-[#00CCBB]/30 flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" fill="#00CCBB" />
        <path d="M6.5 7H10C11.4 7 12.3 7.8 12.3 9C12.3 10 11.6 10.7 10.5 10.9L12.4 14.5H10.5L8.8 11.4H8V14.5H6.5V7ZM8 10H9.8C10.5 10 10.9 9.6 10.9 9C10.9 8.4 10.5 8.1 9.8 8.1H8V10Z" fill="white" />
        <path d="M16 11.2H17.5V13.8C17 14.4 16.2 14.7 15.2 14.7C13.3 14.7 12.1 13.3 12.1 11.5C12.1 9.6 13.4 8.2 15.3 8.2C16.3 8.2 17.1 8.6 17.6 9.2L16.4 10.2C16.1 9.8 15.7 9.6 15.2 9.6C14.2 9.6 13.5 10.4 13.5 11.5C13.5 12.6 14.2 13.3 15.1 13.3C15.6 13.3 16 13.1 16.2 12.8V12.3H15.1V11.2H16Z" fill="white" />
      </svg>
    </div>
  );
}

const PLATFORM_THEMES = {
  orange: {
    tag: 'Elsevier Author ID',
    bg: 'bg-gradient-to-b from-orange-50/70 via-white to-white',
    border: 'border-orange-200/80 hover:border-[#FF6C00]',
    shadow: 'hover:shadow-xl hover:shadow-orange-500/15',
    topBar: 'from-[#FF6C00] via-amber-500 to-[#FF6C00]',
    actionChip: 'text-[#D95B00] bg-orange-50 border-orange-200 group-hover:bg-[#FF6C00] group-hover:text-white group-hover:border-[#FF6C00]',
    description: 'Indeks sitasi & publikasi internasional Elsevier Scopus',
    accentDot: 'bg-[#FF6C00]',
  },
  blue: {
    tag: 'Google Inc.',
    bg: 'bg-gradient-to-b from-blue-50/70 via-white to-white',
    border: 'border-blue-200/80 hover:border-[#2A6BD4]',
    shadow: 'hover:shadow-xl hover:shadow-blue-500/15',
    topBar: 'from-[#4285F4] via-blue-400 to-[#2A6BD4]',
    actionChip: 'text-[#2A6BD4] bg-blue-50 border-blue-200 group-hover:bg-[#2A6BD4] group-hover:text-white group-hover:border-[#2A6BD4]',
    description: 'Metrik sitasi ilmiah, H-Index, dan i10-Index terpadu',
    accentDot: 'bg-[#2A6BD4]',
  },
  teal: {
    tag: 'Kemendikbudristek RI',
    bg: 'bg-gradient-to-b from-teal-50/70 via-white to-white',
    border: 'border-teal-200/80 hover:border-[#00828A]',
    shadow: 'hover:shadow-xl hover:shadow-teal-500/15',
    topBar: 'from-[#00828A] via-teal-400 to-[#00A896]',
    actionChip: 'text-[#00828A] bg-teal-50 border-teal-200 group-hover:bg-[#00828A] group-hover:text-white group-hover:border-[#00828A]',
    description: 'Science and Technology Index resmi Indonesia',
    accentDot: 'bg-[#00828A]',
  },
  lime: {
    tag: 'Global Researcher ID',
    bg: 'bg-gradient-to-b from-lime-50/70 via-white to-white',
    border: 'border-lime-200/90 hover:border-[#7EAA1B]',
    shadow: 'hover:shadow-xl hover:shadow-lime-500/15',
    topBar: 'from-[#A6CE39] via-lime-400 to-[#7EAA1B]',
    actionChip: 'text-[#668B14] bg-lime-50 border-lime-200 group-hover:bg-[#7EAA1B] group-hover:text-white group-hover:border-[#7EAA1B]',
    description: 'Identitas digital unik kontributor riset global',
    accentDot: 'bg-[#7EAA1B]',
  },
  mint: {
    tag: 'Academic Network',
    bg: 'bg-gradient-to-b from-cyan-50/70 via-white to-white',
    border: 'border-cyan-200/80 hover:border-[#009E91]',
    shadow: 'hover:shadow-xl hover:shadow-cyan-500/15',
    topBar: 'from-[#00CCBB] via-teal-400 to-[#009E91]',
    actionChip: 'text-[#008A7E] bg-cyan-50 border-cyan-200 group-hover:bg-[#009E91] group-hover:text-white group-hover:border-[#009E91]',
    description: 'Jejaring kolaborasi & publikasi peneliti dunia',
    accentDot: 'bg-[#009E91]',
  },
};

function AcademicPlatformCard({ name, url, metrics, logo, toneColor = 'orange', tag, description, t }) {
  const theme = PLATFORM_THEMES[toneColor] || PLATFORM_THEMES.orange;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className={`group relative rounded-3xl border ${theme.border} ${theme.bg} p-5 sm:p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 ${theme.shadow} shadow-2xs overflow-hidden`}
    >
      {/* Top Accent Strip */}
      <div className={`absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r ${theme.topBar} opacity-80 group-hover:opacity-100 transition-opacity`} />

      <div>
        {/* Top Header Row: Logo & Action Button */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="shrink-0">
            {logo}
          </div>
          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all duration-200 shadow-2xs ${theme.actionChip}`}>
            <span>Buka</span>
            <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform">
              open_in_new
            </span>
          </span>
        </div>

        {/* Platform Sub-label / Tag */}
        <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400 block mb-1">
          {tag || theme.tag}
        </span>

        {/* Platform Title */}
        <h4 className="font-bold text-gray-900 text-base sm:text-lg group-hover:text-gray-950 transition-colors leading-tight">
          {name}
        </h4>

        {/* Platform Description */}
        <p className="text-xs text-gray-500 mt-2 leading-relaxed">
          {description || theme.description}
        </p>
      </div>

      {/* Footer / Metrics Badge */}
      <div className="mt-5 pt-3.5 border-t border-gray-100/90 flex items-center justify-between text-xs">
        <span className="text-[11px] font-semibold text-gray-600 flex items-center gap-1.5 truncate">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="truncate">{metrics ? t(metrics) : t('Tautan Terverifikasi')}</span>
        </span>
        <span className="text-[11px] font-bold text-gray-400 group-hover:text-gray-800 transition-colors shrink-0">
          Lihat &rarr;
        </span>
      </div>
    </a>
  );
}

function AcademicCard({
  badgeIcon,
  badgeText,
  badgeTone = 'brown',
  period,
  title,
  subtitle,
  subtitleIcon = 'domain',
  description,
  location,
  link,
  linkText,
  t,
}) {
  const toneClasses = {
    brown: 'bg-[#8B4513]/10 text-[#8B4513] border-[#8B4513]/25',
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
    blue: 'bg-blue-50 text-blue-800 border-blue-200/80',
    purple: 'bg-purple-50 text-purple-800 border-purple-200/80',
    amber: 'bg-amber-50 text-amber-800 border-amber-200/80',
    indigo: 'bg-indigo-50 text-indigo-800 border-indigo-200/80',
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200/90 hover:border-[#8B4513]/50 p-4 sm:p-5 shadow-2xs hover:shadow-xs transition-all duration-200 flex flex-col justify-between h-full min-h-[145px] sm:min-h-[155px] group hover:-translate-y-0.5 overflow-hidden">
      <div className="min-w-0">
        {/* Top Header: Badge on Left, Date on Right */}
        <div className="flex items-center justify-between gap-2 mb-2.5 min-w-0 flex-wrap sm:flex-nowrap">
          {badgeText ? (
            <span
              title={t(badgeText)}
              className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg border min-w-0 max-w-full sm:max-w-[70%] ${toneClasses[badgeTone] || toneClasses.brown}`}
            >
              {badgeIcon && <span className="material-symbols-outlined text-[15px] shrink-0">{badgeIcon}</span>}
              <span className="truncate">{t(badgeText)}</span>
            </span>
          ) : <div />}

          {period && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-50 border border-gray-200 px-2.5 py-1 rounded-full shrink-0 ml-auto whitespace-nowrap">
              <span className="material-symbols-outlined text-[13px] text-[#8B4513] shrink-0">calendar_today</span>
              <span>{t(period)}</span>
            </span>
          )}
        </div>

        {/* Title */}
        <h4
          className="text-sm sm:text-base font-bold text-gray-900 leading-snug group-hover:text-[#8B4513] transition-colors break-words mb-1.5"
          title={t(title)}
        >
          {t(title)}
        </h4>

        {/* Subtitle / Institution / Organizer / Publisher */}
        {subtitle && (
          <div className="flex items-start gap-1.5 text-xs text-gray-600 font-medium mt-1" title={t(subtitle)}>
            <span className="material-symbols-outlined text-[15px] text-[#8B4513] shrink-0 mt-0.5">{subtitleIcon}</span>
            <span className="leading-relaxed break-words">{t(subtitle)}</span>
          </div>
        )}
      </div>

      {/* Footer Details: Description / Location / Link */}
      {(description || location || (link && link !== '#')) && (
        <div className="mt-3 pt-2.5 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2 text-xs">
          {location && (
            <span className="flex items-center gap-1 text-gray-500 font-medium">
              <span className="material-symbols-outlined text-[14px] text-gray-400">location_on</span>
              <span>{t(location)}</span>
            </span>
          )}
          {description && !location && (
            <p className="text-gray-500 leading-relaxed line-clamp-2">{t(description)}</p>
          )}
          {link && link !== '#' && (
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="text-[#8B4513] font-bold hover:underline flex items-center gap-1 ml-auto shrink-0"
            >
              <span>{linkText ? t(linkText) : t('Lihat publikasi')}</span>
              <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}

function Card({ children, className = '' }) {
  return <div className={`bg-white border border-gray-200 rounded-xl p-5 shadow-sm ${className}`}>{children}</div>;
}

// Text block with collapsible 'Show more' / 'Show less' that only renders
// the toggle button when the content actually overflows the line clamp limit.
function ExpandableText({ text, maxLines = 3, className = '' }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const [isClamped, setIsClamped] = useState(false);
  const textRef = useRef(null);

  const rawText = text || '';
  const translated = t(rawText);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;

    const checkOverflow = () => {
      if (!expanded) {
        const hasOverflow = el.scrollHeight > el.clientHeight + 2;
        setIsClamped(hasOverflow);
      }
    };

    const rafId = requestAnimationFrame(checkOverflow);
    window.addEventListener('resize', checkOverflow);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [rawText, translated, expanded]);

  if (!rawText) return null;

  return (
    <div>
      <p
        ref={textRef}
        className={`text-sm text-gray-700 leading-relaxed whitespace-pre-line ${className}`}
        style={
          !expanded
            ? {
              display: '-webkit-box',
              WebkitLineClamp: maxLines,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }
            : undefined
        }
      >
        {translated}
      </p>
      {(isClamped || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="mt-2.5 inline-flex items-center gap-1 text-xs sm:text-sm font-bold text-[#8B4513] hover:text-[#6B3410] transition-colors focus:outline-none cursor-pointer group"
        >
          <span className="group-hover:underline">
            {expanded ? t('Show less', 'Tampilkan lebih sedikit') : t('Show more', 'Tampilkan selengkapnya')}
          </span>
          <span
            className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${expanded ? 'rotate-180' : ''
              }`}
          >
            expand_more
          </span>
        </button>
      )}
    </div>
  );
}

function StaticMapPreview({ lat, lng }) {
  const mapContainerRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current || lat == null || lng == null) return;

    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (isNaN(parsedLat) || isNaN(parsedLng)) return;

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: false,
    }).setView([parsedLat, parsedLng], 14);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);

    const markerIcon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:28px;height:28px;transform:translate(-50%,-50%);">
          <div style="position:absolute;inset:0;border-radius:50%;background:#8B451330;animation:pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
          <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:14px;height:14px;border-radius:50%;background:#8B4513;border:2.5px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.35);"></div>
        </div>
      `,
      iconSize: [0, 0],
      iconAnchor: [0, 0],
    });

    L.marker([parsedLat, parsedLng], { icon: markerIcon, interactive: false }).addTo(map);

    const rafId = requestAnimationFrame(() => {
      map.invalidateSize();
      if (mapContainerRef.current) {
        mapContainerRef.current.querySelectorAll('.leaflet-tile').forEach((img) => {
          img.style.opacity = '1';
        });
      }
    });

    return () => {
      cancelAnimationFrame(rafId);
      map.remove();
    };
  }, [lat, lng]);

  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

  return (
    <div className="relative h-48 w-full overflow-hidden bg-gray-100 group cursor-pointer">
      <div ref={mapContainerRef} className="h-full w-full pointer-events-none" />
      {/* Clickable overlay to open Google Maps */}
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center z-[400]"
        title="Buka di Google Maps"
      >
        <span className="material-symbols-outlined text-white text-3xl opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md">
          open_in_new
        </span>
      </a>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Ulasan (Reviews & Ratings) building blocks
// ---------------------------------------------------------------------------

// Compact row of star glyphs. Pass `onRate` to make it an interactive picker.
function StarRow({ rating = 0, size = 16, onRate }) {
  return (
    <div className={`flex items-center gap-0.5 ${onRate ? 'select-none' : ''}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          onClick={onRate ? () => onRate(n) : undefined}
          className={`material-symbols-outlined ${onRate ? 'cursor-pointer' : ''}`}
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

// One line of the rating distribution (e.g. "5 ★ ▬▬▬▬▬ 18").
function RatingBar({ label, count, total }) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      <span className="w-3 shrink-0 text-right">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div className="h-full rounded-full bg-amber-400" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right shrink-0 tabular-nums">{count}</span>
    </div>
  );
}

// A single review — kept compact with a clamp + "read more" so long reviews
// don't blow out the page height.
function ReviewCard({ review }) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  const isLong = review.komentar.length > 160;
  const textToDisplay = expanded || !isLong ? review.komentar : `${review.komentar.slice(0, 160).trim()}…`;
  const displayText = t(textToDisplay);
  const initials = review.nama
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div className="py-4 border-b border-gray-100 last:border-b-0">
      <div className="flex items-start gap-3">
        <span className="w-9 h-9 shrink-0 rounded-full bg-[#8B4513]/10 text-[#8B4513] text-xs font-bold flex items-center justify-center">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-0.5">
            <span className="text-sm font-semibold text-gray-900">{review.nama}</span>
            <span className="text-xs text-gray-400 shrink-0">{t(review.tanggal)}</span>
          </div>
          <div className="mt-0.5 mb-1.5">
            <StarRow rating={review.rating} size={14} />
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{displayText}</p>
          {isLong && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-semibold text-[#8B4513] hover:underline mt-1"
            >
              {expanded ? t('expert_profile.review.hide', 'Sembunyikan') : t('expert_profile.review.read_more', 'Baca selengkapnya')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Inline, collapsible review form — opens in place of the "Tulis Ulasan"
// button so it never needs a modal or extra page real estate.
function ReviewForm({ onSubmit, onCancel }) {
  const { t } = useTranslation();
  const [nama, setNama] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [komentar, setKomentar] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!nama.trim() || !komentar.trim() || rating === 0) {
      setError(t('expert_profile.review.error', 'Mohon isi nama, rating, dan ulasan sebelum mengirim.'));
      return;
    }
    setError('');
    setSubmitting(true);
    const res = await onSubmit({ nama: nama.trim(), rating, komentar: komentar.trim() });
    setSubmitting(false);
    if (res && res.error) {
      setError(res.error);
    } else if (res && res.success) {
      setNama('');
      setRating(0);
      setKomentar('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#FAFBF9] border border-gray-200 rounded-xl p-4 mb-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900">{t('expert_profile.review.write', 'Tulis Ulasan')}</h4>
        <button type="button" onClick={onCancel} className="text-gray-400 hover:text-gray-600" aria-label={t('expert_profile.review.close_aria', 'Tutup form ulasan')}>
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-500">{t('expert_profile.review.your_rating', 'Rating Anda:')}</span>
        <div className="flex items-center gap-0.5" onMouseLeave={() => setHoverRating(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <span
              key={n}
              onMouseEnter={() => setHoverRating(n)}
              onClick={() => setRating(n)}
              className="material-symbols-outlined cursor-pointer"
              style={{
                fontSize: 22,
                fontVariationSettings: n <= (hoverRating || rating) ? "'FILL' 1" : "'FILL' 0",
                color: n <= (hoverRating || rating) ? STAR_GOLD : '#D1D5DB',
              }}
            >
              star
            </span>
          ))}
        </div>
      </div>

      <input
        type="text"
        value={nama}
        onChange={(e) => setNama(e.target.value)}
        placeholder={t('expert_profile.review.name_placeholder', 'Nama Anda')}
        maxLength={80}
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/40"
      />
      <textarea
        value={komentar}
        onChange={(e) => setKomentar(e.target.value)}
        placeholder={t('expert_profile.review.comment_placeholder', 'Bagikan pengalaman Anda bekerja sama dengan tenaga ahli ini...')}
        rows={3}
        maxLength={600}
        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#8B4513]/40"
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm font-semibold text-gray-500 px-4 py-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          {t('expert_profile.review.cancel', 'Batal')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="text-sm font-semibold text-white bg-[#8B4513] px-5 py-2 rounded-full hover:bg-[#6B3410] transition-colors disabled:opacity-60"
        >
          {submitting ? t('expert_profile.review.submitting', 'Mengirim...') : t('expert_profile.review.submit', 'Kirim Ulasan')}
        </button>
      </div>
    </form>
  );
}

const getNavSections = (t) => [
  { id: 'profil', label: t('Profil') },
  { id: 'pekerjaan', label: t('Pekerjaan') },
  { id: 'pendidikan_sertifikasi', label: t('Pendidikan & Sertifikasi') },
  { id: 'organisasi', label: t('Organisasi') },
  { id: 'pengalaman_proyek', label: t('Proyek') },
  { id: 'akademik', label: t('Akademik') },
  { id: 'publikasi', label: t('Publikasi') },
  { id: 'narasumber', label: t('Narasumber') },
  { id: 'produk', label: t('Produk') },
  { id: 'gallery', label: t('Gallery') },
  { id: 'ulasan', label: t('Ulasan') },
];

const getMediaUrl = (path) => {
  if (!path) return '';
  if (typeof path !== 'string') return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://tenagaahli.com';
  return `${baseUrl}/storage/${path}`;
};

export default function ProfilAhli() {
  const { t } = useTranslation();
  const { reportReady } = usePageLoading();
  const navigate = useNavigate();
  const NAV_SECTIONS = getNavSections(t);
  const { slug } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState('profil');
  const sectionRefs = useRef({});
  const navScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkNavScroll = () => {
    if (!navScrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = navScrollRef.current;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 8);
  };

  const scrollNav = (distance) => {
    if (!navScrollRef.current) return;
    navScrollRef.current.scrollBy({ left: distance, behavior: 'smooth' });
    setTimeout(checkNavScroll, 300);
  };

  // Ulasan / reviews state — separate from `profile` so a newly submitted
  // review can be reflected instantly without waiting on a refetch.
  const [reviews, setReviews] = useState([]);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showAllProducts, setShowAllProducts] = useState(false);

  // Konsultasi State & Review Eligibility
  const [hasConsulted, setHasConsulted] = useState(false);
  const [isConsultModalOpen, setIsConsultModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [consultLoading, setConsultLoading] = useState(false);
  const [consultError, setConsultError] = useState('');
  const [consultSuccessToast, setConsultSuccessToast] = useState(false);
  const [successConsultationId, setSuccessConsultationId] = useState(null);
  const [expertScheduleData, setExpertScheduleData] = useState(null);
  const [expertBookedSlots, setExpertBookedSlots] = useState([]);
  const [consultPaymentMethod, setConsultPaymentMethod] = useState('manual'); // 'manual' (rekomendasi) | 'midtrans'
  const [selectedBankId, setSelectedBankId] = useState('qris');
  const [consultProofFile, setConsultProofFile] = useState(null);
  const [consultProofPreview, setConsultProofPreview] = useState(null);
  const [copiedBankField, setCopiedBankField] = useState(null);
  const [consultSuccessModal, setConsultSuccessModal] = useState(null);

  // Gallery Showcase Viewer State
  const [activeGalleryIndex, setActiveGalleryIndex] = useState(0);
  const [isGalleryLightboxOpen, setIsGalleryLightboxOpen] = useState(false);

  const [consultForm, setConsultForm] = useState({
    client_name: '',
    client_email: '',
    client_phone: '',
    service_type: '',
    consultation_date: '',
    consultation_time: '',
    consultation_times: [],
    topic: '',
    notes: '',
  });

  // ── SINKRONISASI JADWAL & TARIF DARI DASHBOARD (JadwalTarif.jsx / Server) ───────────
  const DEFAULT_SCHEDULE = {
    senin: ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
    selasa: ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
    rabu: ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
    kamis: ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
    jumat: ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
    sabtu: [],
    minggu: [],
  };

  const getExpertSchedule = (expertSlug, expertId) => {
    if (expertScheduleData && typeof expertScheduleData === 'object') {
      return expertScheduleData;
    }
    if (profile?.schedule && typeof profile.schedule === 'object') {
      return profile.schedule;
    }
    try {
      if (expertSlug) {
        const s = localStorage.getItem(`expert_schedule_${expertSlug}`);
        if (s) return JSON.parse(s);
      }
      if (expertId) {
        const s = localStorage.getItem(`expert_schedule_${expertId}`);
        if (s) return JSON.parse(s);
      }
      const general = localStorage.getItem('expert_schedule');
      if (general) return JSON.parse(general);
    } catch (e) {
      console.error('Error parsing schedule:', e);
    }
    return DEFAULT_SCHEDULE;
  };

  const formatLocalDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getFutureLocalDate = (daysAhead = 1) => {
    const d = new Date();
    d.setDate(d.getDate() + daysAhead);
    return formatLocalDate(d);
  };

  const getSlotsForDate = (dateStr, expertSlug, expertId) => {
    if (!dateStr) return [];
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return [];
    const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
    const dayKey = dayNames[d.getDay()];
    const sched = getExpertSchedule(expertSlug, expertId);
    const rawSlots = sched[dateStr] || sched[dayKey] || [];

    // Filter slot yang sudah di-booking oleh klien lain
    return rawSlots.filter((time) => {
      const cleanSlot = time.trim();
      return !expertBookedSlots.some((b) => {
        if (b.date !== dateStr) return false;
        const bookedTime = (b.time || '').trim();
        return bookedTime === cleanSlot || bookedTime.includes(cleanSlot) || cleanSlot.includes(bookedTime);
      });
    });
  };

  const getDayLabel = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getServicePrice = (type) => {
    if (profile?.pricing && profile.pricing[type]?.price > 0) {
      return profile.pricing[type].price;
    }
    try {
      const key = slug || profile?.id;
      const saved = (key && localStorage.getItem(`expert_pricing_${key}`)) || localStorage.getItem('expert_pricing');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed[type]?.price > 0) {
          return parsed[type].price;
        }
      }
    } catch { }
    const rates = profile?.consultation_rates || {};
    return rates[type] || (type === 'zoom' ? 250000 : 150000);
  };

  const tomorrowStr = getFutureLocalDate(1);
  const tomorrowSlots = useMemo(() => {
    return getSlotsForDate(tomorrowStr, slug, profile?.id);
  }, [tomorrowStr, slug, profile, expertScheduleData, expertBookedSlots]);

  // Helper functions untuk pricing dan komisi (Berdasarkan paket: Free 70%/30%, Ekonomis 80%/20%, Eksklusif 90%/10%)
  const getCurrentPrice = () => {
    if (!consultForm.service_type) return 0;
    const basePrice = getServicePrice(consultForm.service_type);
    const sessionCount = Math.max(1, consultForm.consultation_times?.length || 1);
    return basePrice * sessionCount;
  };

  const currentSplit = useMemo(() => {
    return calculateConsultationSplit(getCurrentPrice(), profile);
  }, [consultForm.service_type, consultForm.consultation_times, profile, getServicePrice]);

  const getCurrentCommission = () => {
    return currentSplit.commissionPercent;
  };

  const getAdminFee = () => {
    return currentSplit.adminCommission;
  };

  const getExpertFee = () => {
    return currentSplit.expertEarning;
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/daftar-profil');
    }
  };

  const handleTabChange = (id) => {
    setActiveSection(id);
    const navEl = document.getElementById('expert-profile-nav');
    if (navEl) {
      const navTop = navEl.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY > navTop) {
        window.scrollTo({ top: navTop, behavior: 'smooth' });
      }
    }
  };

  useEffect(() => {
    setLoading(true);
    setProfile(null); // reset dulu agar data profil lama tidak tampil saat pindah slug
    const hash = window.location.hash?.replace('#', '');
    const validSections = ['profil', 'pekerjaan', 'pendidikan_sertifikasi', 'organisasi', 'pengalaman_proyek', 'akademik', 'publikasi', 'narasumber', 'produk', 'gallery', 'ulasan'];
    if (hash === 'video' || hash === 'gallery') {
      setActiveSection('gallery');
    } else if (hash && validSections.includes(hash)) {
      setActiveSection(hash);
    } else {
      setActiveSection('profil');
    }
    api
      .get(`/experts/${slug}`)
      .then((res) => {
        const data = res.data;
        setTimeout(checkNavScroll, 100);
        if (data && (!data.lat || !data.lng || isNaN(data.lat) || isNaN(data.lng))) {
          const locString = [data.lokasi?.label, data.alamat?.kota, data.alamat?.provinsi, data.alamat?.lengkap, data.location]
            .filter(Boolean)
            .join(', ');
          const geo = getCoordinatesFromLocation(locString);
          if (geo) {
            data.lat = geo.lat;
            data.lng = geo.lng;
            if (data.lokasi) {
              data.lokasi.lat = geo.lat;
              data.lokasi.lng = geo.lng;
            } else {
              data.lokasi = { lat: geo.lat, lng: geo.lng, label: locString };
            }
          }
        }
        setProfile(data);
      })
      .catch((error) => {
        console.error('Failed to load expert data:', error);
        setProfile(null); // tampilkan not found, bukan fallback profil lain
      })
      .finally(() => {
        setLoading(false);
        reportReady();
      });

    // Load expert schedule & booked slots from API
    api
      .get(`/experts/${slug}/schedule`)
      .then((res) => {
        if (res.data?.schedule) setExpertScheduleData(res.data.schedule);
        if (Array.isArray(res.data?.booked_slots)) setExpertBookedSlots(res.data.booked_slots);
      })
      .catch(() => { });

    // Check consultation status for the current user
    const userRaw = localStorage.getItem('amdal_user');
    let email = '';
    if (userRaw) {
      try {
        const u = JSON.parse(userRaw);
        email = u?.email || '';
        setConsultForm((prev) => ({
          ...prev,
          client_name: u?.name || prev.client_name,
          client_email: u?.email || prev.client_email,
        }));
      } catch { }
    }
    api
      .get(`/experts/${slug}/consultation-status${email ? `?email=${encodeURIComponent(email)}` : ''}`)
      .then((res) => {
        setHasConsulted(res.data?.has_consulted || false);
      })
      .catch(() => {
        setHasConsulted(false);
      });
  }, [slug]);

  // SEO Meta Keywords & Title for search engines
  useEffect(() => {
    if (!profile) return;
    const expertName = profile.name || 'Tenaga Ahli';
    const field = profile.field || '';
    document.title = `${expertName} | ${field} - TenagaAhli.com`;

    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    const tags = Array.isArray(profile.hashtags) ? profile.hashtags.join(', ') : (profile.hashtags || '');
    const skills = Array.isArray(profile.keahlian) ? profile.keahlian.join(', ') : (profile.keahlian || '');
    metaKeywords.content = [tags, skills, field, expertName].filter(Boolean).join(', ');
  }, [profile]);

  const handleOpenConsultModal = (serviceType = 'chat') => {
    const token = localStorage.getItem('amdal_token');
    const userRaw = localStorage.getItem('amdal_user');
    if (!token || !userRaw) {
      navigate('/sign-in?redirect=' + encodeURIComponent(window.location.pathname));
      return;
    }

    let uName = '';
    let uEmail = '';
    try {
      const u = JSON.parse(userRaw);
      uName = u?.name || '';
      uEmail = u?.email || '';
    } catch { }

    // Cari tanggal terdekat yang memiliki slot buka sesuai jadwal di dashboard (mulai dari besok)
    let selectedDate = getFutureLocalDate(1);
    let initialSlots = getSlotsForDate(selectedDate, slug, profile?.id);
    if (initialSlots.length === 0) {
      for (let i = 2; i <= 14; i++) {
        const nextDate = getFutureLocalDate(i);
        const testSlots = getSlotsForDate(nextDate, slug, profile?.id);
        if (testSlots.length > 0) {
          selectedDate = nextDate;
          initialSlots = testSlots;
          break;
        }
      }
    }

    const initialTime = initialSlots.length > 0 ? `${initialSlots[0]} WIB` : '';
    const normalizedService = serviceType === 'zoom' ? 'zoom' : 'chat';

    setConsultForm({
      client_name: uName,
      client_email: uEmail,
      client_phone: '',
      service_type: normalizedService,
      consultation_date: selectedDate,
      consultation_time: initialTime,
      topic: '',
      notes: '',
    });
    setConsultError('');
    setIsConsultModalOpen(true);
  };

  const handleConsultSubmit = async (e) => {
    e.preventDefault();
    if (!consultForm.client_name.trim() || !consultForm.client_email.trim() || !consultForm.topic.trim()) {
      setConsultError(t('Mohon lengkapi nama, email, dan topik konsultasi.'));
      return;
    }

    if (!consultForm.service_type) {
      setConsultError(t('Mohon pilih jenis konsultasi.'));
      return;
    }

    if (!consultForm.consultation_date) {
      setConsultError(t('Mohon pilih tanggal konsultasi.'));
      return;
    }

    const slotsOnDate = getSlotsForDate(consultForm.consultation_date, slug, profile?.id);
    if (slotsOnDate.length === 0) {
      setConsultError(t('Tidak ada slot konsultasi yang dibuka pada tanggal tersebut. Silakan pilih tanggal lain.'));
      return;
    }

    const times = consultForm.consultation_times?.length > 0
      ? consultForm.consultation_times
      : (consultForm.consultation_time ? [consultForm.consultation_time.replace(' WIB', '').trim()] : []);

    if (times.length === 0 || !consultForm.consultation_time) {
      setConsultError(t('Mohon pilih jam konsultasi yang tersedia.'));
      return;
    }

    try {
      setConsultLoading(true);
      setConsultError('');

      const selectedBank = OFFICIAL_BANK_ACCOUNTS.find(b => b.id === selectedBankId) || OFFICIAL_BANK_ACCOUNTS[0];
      const totalAmount = getCurrentPrice();

      let res;
      if (consultPaymentMethod === 'manual') {
        const formData = new FormData();
        formData.append('client_name', consultForm.client_name);
        formData.append('client_email', consultForm.client_email);
        formData.append('client_phone', consultForm.client_phone || '');
        formData.append('service_type', consultForm.service_type);
        formData.append('consultation_date', consultForm.consultation_date);
        formData.append('consultation_time', consultForm.consultation_time);
        times.forEach(t => formData.append('consultation_times[]', t));
        formData.append('topic', consultForm.topic);
        formData.append('notes', consultForm.notes || '');
        formData.append('payment_method', 'manual');
        formData.append('bank_name', selectedBank.bank);
        if (consultProofFile) {
          formData.append('payment_proof', consultProofFile);
        }

        res = await api.post(`/experts/${slug}/consultations`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        const consultationData = {
          client_name: consultForm.client_name,
          client_email: consultForm.client_email,
          client_phone: consultForm.client_phone || '',
          service_type: consultForm.service_type,
          consultation_date: consultForm.consultation_date,
          consultation_time: consultForm.consultation_time,
          consultation_times: times,
          topic: consultForm.topic,
          notes: consultForm.notes || '',
          payment_method: 'midtrans',
        };
        res = await api.post(`/experts/${slug}/consultations`, consultationData);
      }

      const resData = res.data?.data || {};
      const newConsult = resData.consultation || resData;
      const refCode = resData.reference_code || newConsult.reference_code || `KNS-${Date.now()}`;
      const snapToken = resData.snap_token || newConsult.snap_token;
      const newConsultId = newConsult.id;

      setSuccessConsultationId(newConsultId || null);

      // Refresh data booked slots dari backend
      api
        .get(`/experts/${slug}/schedule`)
        .then((sRes) => {
          if (Array.isArray(sRes.data?.booked_slots)) setExpertBookedSlots(sRes.data.booked_slots);
        })
        .catch(() => { });

      const clearForm = () => {
        setConsultForm({
          client_name: '',
          client_email: '',
          client_phone: '',
          service_type: '',
          consultation_date: '',
          consultation_time: '',
          consultation_times: [],
          topic: '',
          notes: '',
        });
        setConsultProofFile(null);
        setConsultProofPreview(null);
        setConsultPaymentMethod('midtrans');
      };

      if (consultPaymentMethod === 'midtrans' && snapToken) {
        try {
          await loadMidtransSnap();
          if (window.snap) {
            window.snap.pay(snapToken, {
              onSuccess: async () => {
                try {
                  await api.get(`/payment/check-status/${refCode}`).catch(() => {});
                } catch (_) {}
                setIsConsultModalOpen(false);
                setConsultSuccessModal({
                  reference_code: refCode,
                  amount: totalAmount,
                  payment_method: 'midtrans',
                  payment_status: 'paid',
                  title: 'Pembayaran Konsultasi Berhasil!',
                  description: 'Pembayaran Anda telah terverifikasi secara otomatis oleh Midtrans. Jadwal sesi konsultasi Anda kini telah resmi terkonfirmasi.',
                });
                clearForm();
              },
              onPending: () => {
                setIsConsultModalOpen(false);
                setConsultSuccessModal({
                  reference_code: refCode,
                  amount: totalAmount,
                  payment_method: 'midtrans',
                  payment_status: 'pending',
                  title: 'Menunggu Penyelesaian Pembayaran',
                  description: 'Pemesanan konsultasi Anda telah dicatat. Mohon selesaikan pembayaran sesuai petunjuk Midtrans sebelum waktu sesi berlangsung.',
                });
                clearForm();
              },
              onError: () => {
                setConsultError('Pembayaran melalui Midtrans tidak berhasil. Silakan coba kembali atau gunakan metode Transfer Bank Manual.');
              },
              onClose: () => {
                setIsConsultModalOpen(false);
                setConsultSuccessModal({
                  reference_code: refCode,
                  amount: totalAmount,
                  payment_method: 'midtrans',
                  payment_status: 'pending',
                  title: 'Pemesanan Konsultasi Tersimpan',
                  description: 'Pemesanan sesi konsultasi Anda telah berhasil disimpan. Anda dapat menyelesaikan pembayaran melalui menu Jadwal Konsultasi.',
                });
                clearForm();
              },
            });
            return;
          }
        } catch (snapErr) {
          console.error('Failed to trigger Midtrans snap:', snapErr);
        }
      }

      // Transfer Manual
      setIsConsultModalOpen(false);
      setConsultSuccessModal({
        reference_code: refCode,
        amount: totalAmount,
        payment_method: 'manual',
        payment_status: consultProofFile ? 'menunggu_verifikasi' : 'menunggu_pembayaran',
        bank_name: selectedBank.bank,
        account_number: selectedBank.accountNumber,
        account_name: selectedBank.accountName,
        title: 'Pengajuan Konsultasi Berhasil Dibuat!',
        description: consultProofFile
          ? 'Bukti transfer Anda telah berhasil dikirim dan akan segera diverifikasi oleh tim Admin (maksimal 1x24 jam kerja).'
          : `Silakan transfer tepat sejumlah Rp ${totalAmount.toLocaleString('id-ID')} ke rekening ${selectedBank.bank} di bawah, lalu simpan bukti pembayaran Anda.`,
      });
      clearForm();
    } catch (err) {
      console.error('Failed to submit consultation:', err);
      setConsultError(err.response?.data?.message || t('Gagal mengajukan konsultasi. Coba lagi.'));
    } finally {
      setConsultLoading(false);
    }
  };

  // Sync local reviews state whenever a (new) profile loads.
  useEffect(() => {
    setReviews(profile?.ulasan || []);
    setShowAllReviews(false);
  }, [profile]);





  const yearsActive = useMemo(() => {
    if (!profile) return null;
    return new Date().getFullYear() - (profile.activeSince || new Date().getFullYear());
  }, [profile]);

  const isPlatinum = useMemo(() => {
    if (!profile) return false;
    const pkg = String(profile.package_name || profile.package?.name || profile.package?.slug || '').toLowerCase();
    const mem = String(profile.membership_level || '').toLowerCase();
    return Boolean(
      profile.is_platinum ||
      mem === 'platinum' ||
      mem === 'eksklusif' ||
      mem === 'ekslusif' ||
      pkg.includes('platinum') ||
      pkg.includes('eksklusif') ||
      pkg.includes('ekslusif') ||
      pkg.includes('esklusif')
    );
  }, [profile]);

  const isPremium = useMemo(() => {
    if (!profile) return false;
    const pkg = String(profile.package_name || profile.package?.name || profile.package?.slug || '').toLowerCase();
    const mem = String(profile.membership_level || '').toLowerCase();
    return Boolean(
      isPlatinum ||
      profile.is_premium ||
      profile.featured ||
      mem === 'premium' ||
      mem === 'ekonomis' ||
      mem === 'gold' ||
      pkg.includes('premium') ||
      pkg.includes('ekonomis') ||
      (profile.package_id && Number(profile.package_id) > 1) ||
      (profile.package && (profile.package.price > 0 || String(profile.package.name || '').toLowerCase() !== 'free'))
    );
  }, [profile, isPlatinum]);

  const isApprovedByAdmin = useMemo(() => {
    if (!profile) return false;
    return Boolean(
      profile.verified ||
      profile.update_status === 'disetujui' ||
      profile.profile_status === 'aktif'
    );
  }, [profile]);

  const isVerified = Boolean(isApprovedByAdmin && isPremium);

  const currentMedal = useMemo(() => {
    if (!profile) return null;
    const medalData = profile.consultation_medal;
    // Hanya paket Ekonomis dan Eksklusif, dan HANYA muncul jika sudah ada yang konsultasi (has_badge === true dan tier ada)
    if (!medalData || !medalData.has_badge || !medalData.tier) {
      return null;
    }
    const tier = String(medalData.tier).toLowerCase();
    const map = {
      white: { img: medalWhiteImg, label: 'Medali White (Tahap 1)' },
      blue: { img: medalBlueImg, label: 'Medali Blue (Tahap 2)' },
      silver: { img: medalSilverImg, label: 'Medali Silver (Tahap 3)' },
      gold: { img: medalGoldImg, label: 'Medali Gold (Tahap 4)' },
      platinum: { img: medalPlatinumImg, label: 'Medali Platinum (Tahap 5)' },
      diamond: { img: medalDiamondImg, label: 'Medali Diamond (Tahap 6)' },
    };
    return map[tier] || null;
  }, [profile]);

  const maxSkills = isPremium ? 5 : 3;

  const displayedKeahlian = useMemo(() => {
    if (!profile) return [];
    const list = Array.isArray(profile.keahlian)
      ? profile.keahlian
      : (typeof profile.keahlian === 'string' ? profile.keahlian.split(',').map((s) => s.trim()).filter(Boolean) : []);
    return list.slice(0, maxSkills);
  }, [profile, maxSkills]);

  const displayedBidangUtama = useMemo(() => {
    if (!profile) return [];
    const source = profile.bidang_utama || profile.bidangUtama || [];
    const list = Array.isArray(source)
      ? source
      : (typeof source === 'string' ? source.split(',').map((s) => s.trim()).filter(Boolean) : []);
    return list.slice(0, maxSkills);
  }, [profile, maxSkills]);

  const hasAcademicLinks = useMemo(() => {
    if (!profile) return false;
    return Boolean(
      profile.scopus_url ||
      profile.google_scholar_url ||
      profile.sinta_url ||
      profile.orcid_url ||
      profile.researchgate_url ||
      (profile.profilAkademik && Object.keys(profile.profilAkademik).length > 0)
    );
  }, [profile]);

  const expertEmail = profile?.email || (profile?.slug ? `${profile.slug}@tenagaahli.com` : 'info@tenagaahli.com');

  const handleCopyEmail = () => {
    if (!expertEmail) return;
    navigator.clipboard.writeText(expertEmail);
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2500);
  };

  const emailContactUrl = useMemo(() => {
    const expertName = profile?.name || 'Tenaga Ahli';
    const subject = encodeURIComponent(`Konsultasi TenagaAhli.com - ${expertName}`);
    const body = encodeURIComponent(
      `Halo ${expertName},\n\nSaya ingin berkonsultasi dengan Anda mengenai:\n\n\nNama Saya: \nEmail Saya: \n\nTerima kasih.`
    );
    return `mailto:${expertEmail}?subject=${subject}&body=${body}`;
  }, [profile, expertEmail]);

  const gmailComposeUrl = useMemo(() => {
    const expertName = profile?.name || 'Tenaga Ahli';
    const subject = encodeURIComponent(`Konsultasi TenagaAhli.com - ${expertName}`);
    const body = encodeURIComponent(
      `Halo ${expertName},\n\nSaya ingin berkonsultasi dengan Anda mengenai:\n\n\nNama Saya: \nEmail Saya: \n\nTerima kasih.`
    );
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(expertEmail)}&su=${subject}&body=${body}`;
  }, [profile, expertEmail]);

  const parseList = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  };

  const organisasiList = useMemo(() => parseList(profile?.organisasi), [profile]);
  const publikasiList = useMemo(() => parseList(profile?.publikasi), [profile]);
  const narasumberList = useMemo(() => parseList(profile?.narasumber || profile?.narasumber_riwayat), [profile]);
  const kajianList = useMemo(() => parseList(profile?.kajian || profile?.kajian_riwayat), [profile]);
  const penelitianList = useMemo(() => parseList(profile?.pengalamanPenelitian || profile?.pengalaman_penelitian), [profile]);

  const hasAnyAcademicData = useMemo(() => {
    return (
      kajianList.length > 0 ||
      penelitianList.length > 0
    );
  }, [kajianList, penelitianList]);

  const statistik = useMemo(() => {
    if (!profile) return null;
    const projectCount = (profile.total_proyek !== undefined && profile.total_proyek !== null && profile.total_proyek !== '')
      ? Number(profile.total_proyek)
      : (profile.pengalamanProyek?.length || profile.pengalaman_proyek?.length || 0);

    const nonJournalCount = (profile.publikasi || []).filter((p) => {
      const kat = (p.kategori || p.jenis || '').toLowerCase();
      return kat && !kat.includes('jurnal');
    }).length;
    const totalJurnalNum = (profile.total_jurnal !== undefined && profile.total_jurnal !== null && profile.total_jurnal !== '')
      ? Number(profile.total_jurnal)
      : null;
    const publicationCount = totalJurnalNum !== null
      ? (totalJurnalNum + nonJournalCount)
      : (publikasiList.length || 0);

    return {
      tahunPengalaman: yearsActive ?? 0,
      jumlahProyek: projectCount,
      jumlahPublikasi: publicationCount,
      jumlahSertifikasi: profile.sertifikasi?.length || 0,
      jumlahKegiatan: narasumberList.length,
    };
  }, [profile, yearsActive, publikasiList, narasumberList]);

  // Aggregate rating summary (average + 5→1 star distribution) derived
  // straight from the current reviews list.
  const ratingStats = useMemo(() => {
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
    const avg = total ? sum / total : 0;
    const dist = [5, 4, 3, 2, 1].map((n) => ({
      label: n,
      count: reviews.filter((r) => r.rating === n).length,
    }));
    return { total, avg, dist };
  }, [reviews]);

  // Normalized gallery items list
  const galleryItems = useMemo(() => {
    const raw = profile?.gallery || profile?.galeri || [];
    if (!Array.isArray(raw)) return [];
    return raw.map((item, idx) => {
      const imgSrc = typeof item === 'string' ? getMediaUrl(item) : getMediaUrl(item.image || item.url || item.foto);
      const caption = typeof item === 'object' ? (item.title || item.keterangan || item.caption || '') : '';
      const album = typeof item === 'object' ? (item.album || '') : '';
      return { id: idx, url: imgSrc, caption, album };
    }).filter(i => !!i.url);
  }, [profile]);

  const [selectedPublicAlbum, setSelectedPublicAlbum] = useState('all');

  const publicGalleryAlbums = useMemo(() => {
    const fromProfile = Array.isArray(profile?.gallery_albums) ? profile.gallery_albums : [];
    const fromItems = galleryItems.map((i) => i.album).filter(Boolean);
    return Array.from(new Set([...fromProfile, ...fromItems]));
  }, [profile, galleryItems]);

  const activeDisplayGalleryItems = useMemo(() => {
    if (selectedPublicAlbum === 'all') return galleryItems;
    if (selectedPublicAlbum === '__unassigned') return galleryItems.filter((i) => !i.album);
    return galleryItems.filter((i) => i.album === selectedPublicAlbum);
  }, [galleryItems, selectedPublicAlbum]);

  // Gallery keyboard navigation (left/right arrows and escape for lightbox)
  useEffect(() => {
    if (activeSection !== 'gallery' || galleryItems.length <= 1) return;
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        setActiveGalleryIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
      } else if (e.key === 'ArrowRight') {
        setActiveGalleryIndex((prev) => (prev + 1) % galleryItems.length);
      } else if (e.key === 'Escape' && isGalleryLightboxOpen) {
        setIsGalleryLightboxOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeSection, galleryItems.length, isGalleryLightboxOpen]);

  // Gallery Touch Swipe & Auto-scroll Thumbnails for Mobile
  const thumbnailContainerRef = useRef(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  const handleGalleryTouchStart = (e) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0]?.clientX ?? null);
  };
  const handleGalleryTouchMove = (e) => {
    setTouchEndX(e.targetTouches[0]?.clientX ?? null);
  };
  const handleGalleryTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const minSwipeDistance = 40;
    if (distance > minSwipeDistance && galleryItems.length > 1) {
      setActiveGalleryIndex((prev) => (prev + 1) % galleryItems.length);
    } else if (distance < -minSwipeDistance && galleryItems.length > 1) {
      setActiveGalleryIndex((prev) => (prev - 1 + galleryItems.length) % galleryItems.length);
    }
    setTouchStartX(null);
    setTouchEndX(null);
  };

  useEffect(() => {
    if (!thumbnailContainerRef.current) return;
    const activeThumb = thumbnailContainerRef.current.children[activeGalleryIndex];
    if (activeThumb && typeof activeThumb.scrollIntoView === 'function') {
      activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [activeGalleryIndex]);

  const handleAddReview = async ({ nama, rating, komentar }) => {
    try {
      const userRaw = localStorage.getItem('amdal_user');
      let email = undefined;
      if (userRaw) {
        try { email = JSON.parse(userRaw)?.email; } catch { }
      }
      const res = await api.post(`/experts/${slug}/reviews`, { nama, rating, komentar, email });
      const created = res.data?.data || { nama, rating, komentar, tanggal: t('Baru saja') };
      setReviews((prev) => [created, ...prev]);
      setShowReviewForm(false);
      return { success: true };
    } catch (error) {
      console.error('Failed to save review:', error);
      const msg = error.response?.data?.message || t('Gagal mengirim ulasan.');
      return { success: false, error: msg };
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: profile?.name, url });
        return;
      }
    } catch {
      /* ignore */
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  if (loading) {
    return (
      <div className="w-full h-[100dvh] min-h-screen flex items-center justify-center bg-[#1A1512] px-4">
        <div className="flex flex-col items-center gap-4">
          <div className="block sm:hidden">
            <GraduationCapLoader size={90} duration={2} cap="#d8d4cc" shade="#a9a398" tassel="#e0a040" />
          </div>
          <div className="hidden sm:block">
            <GraduationCapLoader size={120} duration={2} cap="#d8d4cc" shade="#a9a398" tassel="#e0a040" />
          </div>
          <span className="text-[#e0d8d0]/80 text-xs sm:text-sm font-medium tracking-wider uppercase animate-pulse">
            {t('Memuat profil...')}
          </span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="pt-24 min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-red-600 text-[24px]">person_off</span>
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">{t('expert_profile.not_found.title', 'Profil Tidak Ditemukan')}</h2>
          <p className="text-gray-600 mb-4">{t('expert_profile.not_found.desc', 'Tenaga ahli yang Anda cari tidak dapat ditemukan atau belum terverifikasi.')}</p>
          <Link
            to="/"
            className="inline-flex items-center gap-2 bg-[#8B4513] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#6B3410] transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">home</span>
            {t('expert_profile.not_found.back', 'Kembali ke Beranda')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* ---------- 1. HERO / HEADER PROFIL ---------- */}
      {/* Desktop View (md and up) */}
      <div className="hidden md:block relative md:h-[26rem] w-full overflow-hidden bg-on-background">
        <img src={profile.cover} alt="" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/45 to-black/20" />


        <div className="absolute inset-x-0 bottom-0">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop pb-8 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
            <div className="flex items-end gap-5">
              <div className="relative shrink-0">
                <img
                  src={profile.photo}
                  alt={profile.name}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-full border-4 border-white object-cover shadow-2xl bg-white"
                />
                {currentMedal ? (
                  <div
                    className="absolute -bottom-3 -right-2 md:-bottom-3.5 md:-right-2.5 w-11 h-14 md:w-13 md:h-16 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 select-none z-10"
                    title={currentMedal.label}
                  >
                    <img
                      src={currentMedal.img}
                      alt={currentMedal.label}
                      className="w-full h-full object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.55)]"
                    />
                  </div>
                ) : isVerified ? (
                  <span
                    className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center border-2 border-white shadow-md"
                    style={{ backgroundColor: ACCENT_BROWN }}
                    title={t('Kredensial terverifikasi')}
                  >
                    <span className="material-symbols-outlined text-white text-[18px]">verified</span>
                  </span>
                ) : null}
              </div>
              <div className="min-w-0 pb-1 flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="font-headline-lg text-2xl md:text-3xl font-bold text-white drop-shadow-md leading-tight">
                    <span>{profile.name}</span>
                    {isVerified && (
                      <span 
                        className="material-symbols-outlined text-[#00A3FF] text-[22px] md:text-[26px] inline-block align-middle ml-2" 
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        title="Terverifikasi"
                      >
                        verified
                      </span>
                    )}
                  </h1>
                  {profile.level && (
                    <LevelBadge
                      level={profile.level}
                      size="md"
                      className="bg-white/20 backdrop-blur-md text-white border border-white/30 shadow-sm"
                    />
                  )}
                </div>
                <p className="text-white/90 text-sm md:text-base mt-1.5 font-medium drop-shadow-sm">{t(profile.profesi)}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <p className="text-white/80 text-sm drop-shadow-sm">{t(profile.institution)}</p>
                  {profile.ketersediaan && (
                    <span className={`inline-flex items-center gap-1.5 backdrop-blur-md text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-sm ${profile.ketersediaan.status === 'tersedia'
                        ? 'bg-green-500/30 border-green-400/50'
                        : 'bg-amber-500/30 border-amber-400/50'
                      }`}>
                      <span className="relative flex h-2 w-2">
                        {profile.ketersediaan.status === 'tersedia' && (
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                        )}
                        <span className={`relative inline-flex rounded-full h-2 w-2 ${profile.ketersediaan.status === 'tersedia' ? 'bg-green-400' : 'bg-amber-400'}`} />
                      </span>
                      {profile.ketersediaan.status === 'tersedia' ? t('Online') : t('Offline')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-2.5 text-white/75 text-xs md:text-sm">
                  {profile.alamat?.kota && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]">location_on</span>
                      {t(profile.alamat?.kota)}, {t(profile.alamat?.provinsi)}
                    </span>
                  )}
                  {ratingStats.total > 0 && (
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[15px]" style={{ fontVariationSettings: "'FILL' 1", color: STAR_GOLD }}>
                        star
                      </span>
                      {ratingStats.avg.toFixed(1)} ({ratingStats.total} {t('ulasan')})
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 pb-1">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(true)}
                className="bg-[#8B4513] hover:bg-[#6B3410] text-white h-10 px-6 rounded-full flex items-center gap-2 font-bold text-xs sm:text-sm transition-all whitespace-nowrap shadow-lg active:scale-95 cursor-pointer"
                title={t('Hubungi via Email (Gratis untuk Semua Paket)')}
              >
                <span className="material-symbols-outlined text-[18px]">mail</span>
                <span>{t('Hubungi')}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Profile Header (md:hidden) — Sesuai Referensi Gambar */}
      <div className="block md:hidden bg-white">
        {/* Cover Photo */}
        <div className="relative h-48 sm:h-56 w-full overflow-hidden bg-slate-900">
          <img src={profile.cover} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />


        </div>

        {/* Profile Info Card (White Background, Overlapping Avatar) */}
        <div className="px-4 pt-0 pb-4">
          {/* Overlapping Circular Avatar */}
          <div className="relative -mt-12 mb-3 flex items-end justify-between">
            <div className="relative shrink-0">
              <img
                src={profile.photo}
                alt={profile.name}
                className="w-24 h-24 rounded-full border-4 border-white object-cover shadow-md bg-white"
              />
              {currentMedal ? (
                <div
                  className="absolute -bottom-2.5 -right-1.5 w-10 h-13 sm:w-11 sm:h-14 flex items-center justify-center cursor-pointer transition-transform hover:scale-110 select-none z-10"
                  title={currentMedal.label}
                >
                  <img
                    src={currentMedal.img}
                    alt={currentMedal.label}
                    className="w-full h-full object-contain drop-shadow-[0_3px_6px_rgba(0,0,0,0.55)]"
                  />
                </div>
              ) : isVerified ? (
                <span
                  className="absolute bottom-0 right-0 w-7 h-7 rounded-full flex items-center justify-center border-2 border-white shadow-sm bg-[#8B4513]"
                  title={t('Kredensial terverifikasi')}
                >
                  <span className="material-symbols-outlined text-white text-[15px]">verified</span>
                </span>
              ) : null}
            </div>

            {profile.ketersediaan && (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border shadow-2xs ${
                profile.ketersediaan.status === 'tersedia'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${profile.ketersediaan.status === 'tersedia' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                {profile.ketersediaan.status === 'tersedia' ? t('Online') : t('Offline')}
              </span>
            )}
          </div>

          {/* Name & Blue Verified Badge */}
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">
              <span>{profile.name}</span>
              {isVerified && (
                <span 
                  className="material-symbols-outlined text-[#00A3FF] text-[20px] inline-block align-middle ml-1.5" 
                  style={{ fontVariationSettings: "'FILL' 1" }}
                  title="Terverifikasi"
                >
                  verified
                </span>
              )}

              {profile.level && (
                <LevelBadge
                  level={profile.level}
                  size="sm"
                  className="ml-1 inline-block align-middle"
                />
              )}
            </h1>

            {profile.profesi && (
              <p className="text-xs sm:text-sm font-semibold text-[#8B4513]">
                {t(profile.profesi)}
              </p>
            )}

            {profile.institution && (
              <p className="text-xs text-gray-500">
                {t(profile.institution)}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-gray-500">
              {profile.alamat?.kota && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px] text-gray-400">location_on</span>
                  {t(profile.alamat?.kota)}, {t(profile.alamat?.provinsi)}
                </span>
              )}
              {ratingStats.total > 0 && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1", color: STAR_GOLD }}>
                    star
                  </span>
                  <strong className="text-gray-800">{ratingStats.avg.toFixed(1)}</strong> ({ratingStats.total} {t('ulasan')})
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons: "Hubungi" (Email Gratis) & "Konsultasi" */}
          <div className="mt-3.5 flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => setIsEmailModalOpen(true)}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-white bg-[#8B4513] hover:bg-[#6B3410] shadow-md transition-all active:scale-95 cursor-pointer"
              title={t('Hubungi via Email (Gratis untuk Semua Paket)')}
            >
              <span className="material-symbols-outlined text-[18px]">mail</span>
              <span>{t('Hubungi')}</span>
            </button>

            <button
              type="button"
              onClick={() => handleOpenConsultModal('chat')}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm text-[#8B4513] bg-[#8B4513]/10 hover:bg-[#8B4513]/20 border border-[#8B4513]/30 shadow-xs transition-all active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">calendar_month</span>
              <span>{t('Konsultasi')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ---------- STICKY ANCHOR NAV ---------- */}
      <div id="expert-profile-nav" className="border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-md z-30 shadow-xs">
        <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop flex items-center justify-between gap-1 sm:gap-2">
          <div className="relative flex-1 min-w-0 flex items-center">
            {/* Tanda Panah Geser Kiri (Mobile) */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => scrollNav(-180)}
                className="md:hidden shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:text-[#8B4513] active:scale-95 transition-all mr-1 z-10"
                aria-label={t('Geser menu ke kiri')}
                title={t('Geser menu ke kiri')}
              >
                <span className="material-symbols-outlined text-[18px]">chevron_left</span>
              </button>
            )}

            <nav
              ref={navScrollRef}
              onScroll={checkNavScroll}
              className="flex items-center overflow-x-auto scrollbar-hide scroll-smooth no-scrollbar w-full"
            >
              {NAV_SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleTabChange(s.id)}
                  className={`font-semibold text-sm px-4 py-4 border-b-2 whitespace-nowrap transition-colors cursor-pointer shrink-0 ${activeSection === s.id
                      ? 'text-[#8B4513] border-[#8B4513] font-bold'
                      : 'text-gray-400 border-transparent hover:text-gray-600'
                    }`}
                >
                  {s.label}
                </button>
              ))}
            </nav>

            {/* Tanda Panah Geser Kanan (Mobile) */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => scrollNav(180)}
                className="md:hidden shrink-0 w-7 h-7 rounded-full bg-white border border-gray-200 shadow-sm flex items-center justify-center text-gray-700 hover:text-[#8B4513] active:scale-95 transition-all ml-1 z-10"
                aria-label={t('Geser menu ke kanan')}
                title={t('Geser menu ke kanan')}
              >
                <span className="material-symbols-outlined text-[18px]">chevron_right</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 py-2.5 pl-2 sm:pl-3 shrink-0">
            <div className="relative">
              <button
                onClick={handleShare}
                className="h-9 w-9 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition-colors"
                aria-label={t('Bagikan profil')}
              >
                <span className="material-symbols-outlined text-gray-600 text-[16px]">share</span>
              </button>
              {copied && (
                <span className="absolute top-full mt-2 right-0 z-10 bg-black text-white text-[11px] px-2 py-1 rounded whitespace-nowrap shadow-md">
                  {t('Link disalin')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- TAB CONTENT: PROFIL ---------- */}
      {activeSection === 'profil' && (
        <div className="animate-fadeIn">
          {/* ---------- STATISTIK PROFIL ---------- */}
      {statistik && (
        <div className="border-b border-gray-200 bg-white">
          <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8">
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              <StatBlock icon="military_tech" value={`${statistik.tahunPengalaman}+`} label={t('Tahun Pengalaman')} />
              <StatBlock icon="engineering" value={statistik.jumlahProyek} label={t('Proyek')} />
              <StatBlock icon="article" value={statistik.jumlahPublikasi} label={t('Publikasi')} />
              <StatBlock icon="workspace_premium" value={statistik.jumlahSertifikasi} label={t('Sertifikasi')} />
              <StatBlock icon="campaign" value={statistik.jumlahKegiatan} label={t('Kegiatan')} />
            </div>
          </div>
        </div>
      )}

      {/* ---------- 2 & 3 & 4. PROFIL: BIO, KATEGORI, KEAHLIAN ---------- */}
      <section id="profil" className="scroll-mt-16 max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-10 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
        <div className="flex flex-col min-w-0">
          {/* Tentang Saya */}
          <div className={`py-8 ${(profile.keahlian?.length > 0 || profile.kompetensi?.length > 0) ? 'border-b border-gray-200' : ''}`}>
            <SectionHeading title={t('expert_profile.about.title', 'Tentang Saya')} />

            {(profile.tentang_saya || profile.tentangSaya) ? (
              <ExpandableText text={profile.tentang_saya || profile.tentangSaya} />
            ) : (
              <p className="text-sm text-gray-400 italic">
                {t('Belum ada deskripsi profil.')}
              </p>
            )}

            {(profile.ringkasan_keahlian || profile.ringkasanKeahlian) && (
              <p className="text-sm text-gray-500 leading-relaxed italic mt-4">{t(profile.ringkasan_keahlian || profile.ringkasanKeahlian)}</p>
            )}

            {(profile.kriteria_list || profile.kategoriProfesional)?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-5">
                {(profile.kriteria_list || profile.kategoriProfesional).map((k) => (
                  <Chip key={k} tone="gray">{t(k)}</Chip>
                ))}
              </div>
            )}
          </div>

          {/* Bidang Keahlian — Cards Layout Modern */}
          {(displayedKeahlian?.length > 0 || profile.kompetensi?.length > 0) && (
            <div className="py-8 border-b border-gray-200">
              <SectionHeading title={t('expert_profile.expertise.title', 'Bidang Keahlian')} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 items-stretch">
                {/* 1. Keahlian Utama */}
                {displayedKeahlian?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs hover:shadow-sm hover:border-[#8B4513]/40 transition-all flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#8B4513]/10 text-[#8B4513] border border-[#8B4513]/20 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">workspace_premium</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">{t('Keahlian Utama')}</h4>
                          <p className="text-[10px] text-gray-500 font-medium">{t('Core Expertise')}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-[#8B4513] bg-[#8B4513]/10 px-2 py-0.5 rounded-full">
                        {displayedKeahlian.length}
                      </span>
                    </div>

                    {/* Tags List */}
                    <div className="flex flex-wrap gap-2 content-start">
                      {displayedKeahlian.map((k) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-[#FAF6F0] text-[#8B4513] border border-[#8B4513]/25 hover:bg-[#8B4513]/15 transition-colors shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-[#8B4513]" />
                          <span>{t(k)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}



                {/* 3. Kompetensi */}
                {profile.kompetensi?.length > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-200/90 p-5 shadow-2xs hover:shadow-sm hover:border-emerald-400 transition-all flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-[18px]">military_tech</span>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900">{t('Kompetensi')}</h4>
                          <p className="text-[10px] text-gray-500 font-medium">{t('Skills & Tools')}</p>
                        </div>
                      </div>
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {profile.kompetensi.length}
                      </span>
                    </div>

                    {/* Tags List */}
                    <div className="flex flex-wrap gap-2 content-start">
                      {profile.kompetensi.map((k) => (
                        <span
                          key={k}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-50/60 text-emerald-900 border border-emerald-200/70 hover:bg-emerald-100/60 transition-colors shadow-2xs"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>{t(k)}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Ringkasan Profil — Executive Overview Card */}
          <div className="py-8">
            <SectionHeading title={t('expert_profile.summary.title', 'Ringkasan Profil')} />

            <div className="bg-white rounded-2xl border border-gray-200/90 shadow-2xs overflow-hidden hover:border-[#8B4513]/40 transition-all">
              {/* Card Header with Status */}
              <div className="bg-gradient-to-r from-[#8B4513]/5 via-[#FAF6F0] to-white px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#8B4513] text-white flex items-center justify-center shrink-0 shadow-2xs">
                    <span className="material-symbols-outlined text-[18px]">badge</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-gray-900 leading-tight">{t('Kredensial & Ikhtisar Ahli')}</h4>
                    <p className="text-[11px] text-gray-500 font-medium">{t('Data terverifikasi TenagaAhli.com')}</p>
                  </div>
                </div>

                {profile.ketersediaan && (
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200/70">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>{t(profile.ketersediaan.label || 'Tersedia untuk kerja sama')}</span>
                  </span>
                )}
              </div>

              {/* Grid 2 Columns of Specs */}
              <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                {profile.name && (
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 border border-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] border border-[#8B4513]/20 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">person</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t('Nama Lengkap')}</p>
                      <p className="text-sm font-bold text-gray-900 truncate">{profile.name}</p>
                    </div>
                  </div>
                )}

                {/* Institusi / Lembaga */}
                {profile.institution && (
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 border border-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 border border-blue-200/80 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">account_balance</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t('Institusi / Lembaga')}</p>
                      <p className="text-sm font-bold text-gray-900 leading-snug">{t(profile.institution)}</p>
                    </div>
                  </div>
                )}

                {/* Profesi */}
                {profile.profesi && (
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 border border-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-800 border border-purple-200/80 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">work</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t('Profesi')}</p>
                      <p className="text-sm font-bold text-gray-900">{t(profile.profesi)}</p>
                    </div>
                  </div>
                )}

                {/* Aktif Sejak & Pengalaman */}
                {profile.activeSince && (
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 border border-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">history</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t('Masa Aktif & Pengalaman')}</p>
                      <p className="text-sm font-bold text-gray-900">
                        {t('Aktif sejak')} {profile.activeSince}
                        {yearsActive !== null && (
                          <span className="text-xs font-semibold text-[#8B4513] bg-[#8B4513]/10 px-2 py-0.5 rounded-md ml-1.5 inline-block">
                            {yearsActive}+ {t('tahun')}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                )}

                {/* Lokasi / Domisili */}
                {(profile.alamat?.lengkap || profile.alamat?.kota || profile.alamat?.provinsi || profile.lokasi?.label) && (
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 border border-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-800 border border-red-200/80 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">location_on</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t('Lokasi & Domisili')}</p>
                      <p className="text-sm font-semibold text-gray-900 leading-snug">
                        {profile.alamat?.lengkap || profile.lokasi?.label || [profile.alamat?.kota, profile.alamat?.provinsi].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {/* Kontak Email */}
                {profile.email && (
                  <div className="flex items-start gap-3.5 p-3.5 rounded-xl bg-gray-50/70 hover:bg-gray-50 border border-gray-100 transition-colors">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200/80 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[20px]">alternate_email</span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{t('Email Kontak')}</p>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                          {t('Gratis Semua Paket')}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEmailModalOpen(true)}
                        className="text-sm font-bold text-[#8B4513] hover:underline truncate block text-left cursor-pointer"
                        title={t('Klik untuk menghubungi via email')}
                      >
                        {expertEmail}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Bidang Utama Row at the Bottom */}
              {displayedBidangUtama?.length > 0 && (
                <div className="bg-[#FAFBF9] border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-[#8B4513]">workspace_premium</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-600">{t('Bidang Utama & Kepakaran')}</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {displayedBidangUtama.map((item, i) => (
                      <span
                        key={i}
                        className="text-xs font-bold bg-white text-[#8B4513] border border-[#8B4513]/25 px-3 py-1 rounded-lg shadow-2xs"
                      >
                        {t(item)}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Fallback jika semua field kosong */}
            {!profile.name && !profile.institution && !profile.activeSince &&
              !(profile.bidang_utama || profile.bidangUtama)?.length && (
                <p className="text-sm text-gray-400 italic">
                  {t('Informasi ringkasan profil belum diisi.')}
                </p>
              )}
          </div>
        </div>

        {/* SIDEBAR */}
        <aside className="flex flex-col gap-5 lg:sticky lg:top-20 self-start">
          {/* ── Prestasi Medali Konsultasi Tahunan (Ekonomis & Eksklusif) ── */}
          {profile.consultation_medal?.has_badge && (
            <Card className="overflow-hidden border-2 bg-gradient-to-br from-amber-50/80 via-white to-amber-50/40 shadow-sm animate-card-aurora transition-all duration-500">
              <div className="flex items-center gap-2 mb-3">
                <span className="material-symbols-outlined text-[20px] text-amber-600 animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                  military_tech
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
                  {t('Tahap Medali Konsultasi')}
                </h3>
              </div>
              <ConsultationMedalBadge expert={profile} variant="profile" className="w-full justify-center" />
            </Card>
          )}

          {/* KOTAK KONSULTASI CEPAT */}
          <div className="bg-gradient-to-br from-[#8B4513] to-[#6B3410] rounded-2xl p-5 text-white shadow-md">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[#A3D9B1] text-[22px]">support_agent</span>
              <h3 className="font-bold text-sm tracking-wide">{t('Konsultasi dengan Ahli')}</h3>
            </div>
            <p className="text-xs text-white/80 leading-relaxed mb-3">
              {t('Ingin menghubungi ahli atau konsultasi? Jadwalkan sesi komunikasi atau konsultasi langsung dengan ahli.')}
            </p>

            {/* Widget Status Jadwal Besok */}
            <div className="bg-white/10 border border-white/15 rounded-xl p-3 mb-4 text-xs">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-white flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-amber-300">event_available</span>
                  {t('Ketersediaan Jadwal')}:
                </span>
                {tomorrowSlots.length > 0 ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-400 text-green-950">
                    Buka ({tomorrowSlots.length} slot)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white/80">
                    Besok Tutup
                  </span>
                )}
              </div>
              <p className="text-white/75 text-[11px] leading-tight">
                {tomorrowSlots.length > 0
                  ? `Slot: ${tomorrowSlots.slice(0, 3).join(', ')} WIB${tomorrowSlots.length > 3 ? '...' : ''}`
                  : 'Tenaga ahli belum membuka slot untuk besok. Silakan pilih hari lain saat booking.'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => handleOpenConsultModal('Konsultasi Online (1 Jam)')}
              className="w-full bg-white text-[#8B4513] hover:bg-[#F5EBE1] font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
              {t('Konsultasi')}
            </button>
          </div>

          {/* STATUS ONLINE / OFFLINE */}
          {profile.ketersediaan && (
            <div className={`rounded-2xl p-5 shadow-sm border ${profile.ketersediaan.status === 'tersedia'
                ? 'bg-green-50 border-green-200/70'
                : 'bg-amber-50 border-amber-200/70'
              }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${profile.ketersediaan.status === 'tersedia'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                  }`}>
                  <span className="material-symbols-outlined text-[22px]">
                    {profile.ketersediaan.status === 'tersedia' ? 'wifi' : 'wifi_off'}
                  </span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2.5 w-2.5">
                      {profile.ketersediaan.status === 'tersedia' && (
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75" />
                      )}
                      <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${profile.ketersediaan.status === 'tersedia' ? 'bg-green-500' : 'bg-amber-500'}`} />
                    </span>
                    <span className={`text-sm font-bold ${profile.ketersediaan.status === 'tersedia' ? 'text-green-800' : 'text-amber-800'
                      }`}>
                      {profile.ketersediaan.status === 'tersedia' ? t('Online — Tersedia') : t('Offline — Tidak Tersedia')}
                    </span>
                  </div>
                  <p className={`text-xs mt-0.5 ${profile.ketersediaan.status === 'tersedia' ? 'text-green-700/80' : 'text-amber-700/80'
                    }`}>
                    {t(profile.ketersediaan.label) || (profile.ketersediaan.status === 'tersedia' ? t('Tersedia untuk kerja sama baru') : t('Sedang tidak menerima proyek baru'))}
                  </p>
                </div>
              </div>
            </div>
          )}

          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">{t('Alamat Email')}</h3>
            <a href={`mailto:${profile.email}`} className="text-[#8B4513] text-sm font-medium hover:underline break-all">
              {profile.email}
            </a>
          </Card>

          {/* ── Lokasi & Peta ─────────────────────────────────── */}
          {(profile.lokasi || profile.alamat || profile.lat) && (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* Map Preview */}
              {(profile.lokasi?.lat && profile.lokasi?.lng) || (profile.lat && profile.lng) ? (
                <StaticMapPreview
                  lat={profile.lokasi?.lat ?? profile.lat}
                  lng={profile.lokasi?.lng ?? profile.lng}
                />
              ) : null}

              <div className="p-5 space-y-4">
                {/* Heading */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#8B4513]/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[18px] text-[#8B4513]">location_on</span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900">{t('expert_profile.map.location', 'Lokasi')}</h3>
                  </div>
                  {profile.is_premium && (
                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">workspace_premium</span>
                      Premium
                    </span>
                  )}
                </div>

                {/* Full address details */}
                <div className="space-y-2">
                  {profile.alamat?.lengkap ? (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">{t('Alamat Lengkap')}</p>
                      <p className="text-sm text-gray-800 leading-relaxed font-medium">{t(profile.alamat.lengkap)}</p>
                    </div>
                  ) : profile.lokasi?.label ? (
                    <p className="text-sm text-gray-800 leading-relaxed font-medium">{t(profile.lokasi.label)}</p>
                  ) : null}

                  {profile.alamat && (profile.alamat.kota || profile.alamat.provinsi) && (
                    <div className="flex flex-wrap gap-x-2 gap-y-1 pt-1">
                      {profile.alamat.kota && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md font-medium border border-gray-200">
                          <span className="material-symbols-outlined text-[14px] text-[#8B4513]">location_city</span>
                          {t(profile.alamat.kota)}
                        </span>
                      )}
                      {profile.alamat.provinsi && (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md font-medium border border-gray-200">
                          <span className="material-symbols-outlined text-[14px] text-[#8B4513]">map</span>
                          {t(profile.alamat.provinsi)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Coordinates */}
                {((profile.lokasi?.lat && profile.lokasi?.lng) || (profile.lat && profile.lng)) && (
                  <div className="bg-gray-50 rounded-lg px-3 py-2 flex items-center justify-between border border-gray-100">
                    <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{t('Koordinat')}</span>
                    <span className="text-xs text-gray-600 font-mono tabular-nums">
                      {Number(profile.lokasi?.lat ?? profile.lat).toFixed(4)}, {Number(profile.lokasi?.lng ?? profile.lng).toFixed(4)}
                    </span>
                  </div>
                )}

                {/* Action buttons */}
                {((profile.lokasi?.lat && profile.lokasi?.lng) || (profile.lat && profile.lng)) ? (
                  <div className="flex gap-2 pt-1">
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${profile.lokasi?.lat ?? profile.lat},${profile.lokasi?.lng ?? profile.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#8B4513] hover:bg-[#6B3410] rounded-lg py-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">directions</span>
                      {t('expert_profile.map.get_directions', 'Petunjuk Arah')}
                    </a>
                    <a
                      href={`https://www.google.com/maps?q=${profile.lokasi?.lat ?? profile.lat},${profile.lokasi?.lng ?? profile.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold text-[#8B4513] bg-[#8B4513]/10 hover:bg-[#8B4513]/20 rounded-lg py-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                      {t('Buka di Maps')}
                    </a>
                  </div>
                ) : (profile.alamat?.lengkap || profile.alamat?.kota) ? (
                  <div className="pt-1">
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent([profile.alamat?.lengkap, profile.alamat?.kota, profile.alamat?.provinsi].filter(Boolean).join(', '))}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-bold text-[#8B4513] bg-[#8B4513]/10 hover:bg-[#8B4513]/20 rounded-lg py-2.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[15px]">open_in_new</span>
                      {t('Buka Alamat di Maps')}
                    </a>
                  </div>
                ) : null}
              </div>
            </div>
          )}

          {profile.sosial?.length > 0 && (
            <Card>
              <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">{t('Sosial Media')}</h3>
              <div className="flex gap-2.5">
                {profile.sosial.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    title={s.label}
                    className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center hover:bg-[#8B4513] hover:text-white text-gray-600 transition-colors"
                  >
                    <SocialIcon type={s.type} />
                  </a>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">{t('Kriteria Keanggotaan')}</h3>
            <div className="flex flex-wrap gap-2">
              {profile.kriteria?.map((k) => (
                <Link
                  key={t(k.label)}
                  to={k.to}
                  className="text-xs bg-gray-100 hover:bg-[#8B4513]/10 hover:text-[#8B4513] text-gray-600 px-3 py-1.5 rounded-full transition-colors"
                >
                  {t(k.label)}
                </Link>
              ))}
            </div>
          </Card>
        </aside>
      </section>
        </div>
      )}

      {/* ---------- TAB CONTENT: PEKERJAAN ---------- */}
      {activeSection === 'pekerjaan' && (
        <div className="animate-fadeIn">
          <section id="pekerjaan" className="bg-[#FAFBF9] border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-12">
              <SectionHeading 
                title={t('expert_profile.experience.work', 'Pekerjaan')} 
                eyebrow={`${profile.pengalamanKerja?.length || 0} ${t('expert_profile.experience.positions', 'posisi riwayat karir')}`} 
              />
              {(!profile.pengalamanKerja || profile.pengalamanKerja.length === 0) ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center my-4">
                  <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">work_off</span>
                  <p className="text-sm text-gray-500">{t('Belum ada riwayat pekerjaan yang ditambahkan.')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {[...profile.pengalamanKerja].sort((a, b) => ((b.is_primary || b.is_utama || b.utama) ? 1 : 0) - ((a.is_primary || a.is_utama || a.utama) ? 1 : 0)).map((p, i) => {
                    const periodText = p.periode || (() => {
                      if (p.tahun_mulai && p.tahun_selesai) {
                        return String(p.tahun_mulai) === String(p.tahun_selesai)
                          ? `${p.tahun_mulai}`
                          : `${p.tahun_mulai} — ${p.tahun_selesai}`;
                      }
                      if (p.tahun_mulai) {
                        return `${p.tahun_mulai} — ${t('Sekarang')}`;
                      }
                      return p.tahun_selesai ? `${p.tahun_selesai}` : '';
                    })();
                    const isPresent = !p.tahun_selesai || String(periodText).toLowerCase().includes('sekarang');

                    return (
                      <div
                        key={i}
                        className="group relative bg-white rounded-2xl border border-gray-200/90 hover:border-[#8B4513]/40 p-5 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 border border-[#8B4513]/20 text-[#8B4513] flex items-center justify-center shrink-0 group-hover:scale-105 group-hover:bg-[#8B4513] group-hover:text-white transition-all duration-200">
                              <span className="material-symbols-outlined text-[20px]">work</span>
                            </div>

                            <div className="flex items-center gap-1.5 flex-wrap justify-end">
                              {(p.is_primary || p.is_utama || p.utama) && (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs shrink-0">
                                  ★ {t('Utama')}
                                </span>
                              )}
                              {periodText && (
                                <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0 ${
                                  isPresent 
                                    ? 'bg-[#8B4513]/10 text-[#8B4513] border border-[#8B4513]/25 font-bold'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                }`}>
                                  <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                  {t(periodText)}
                                </span>
                              )}
                            </div>
                          </div>

                          <h4 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#8B4513] transition-colors leading-snug">
                            {t(p.jabatan || p.posisi || '')}
                          </h4>
                        </div>

                        {(p.institusi || p.instansi) && (
                          <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 font-medium pt-3 border-t border-gray-100">
                            <span className="material-symbols-outlined text-[18px] text-[#8B4513] shrink-0">domain</span>
                            <span className="truncate">{t(p.institusi || p.instansi)}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ---------- TAB CONTENT: PENDIDIKAN & SERTIFIKASI ---------- */}
      {activeSection === 'pendidikan_sertifikasi' && (
        <div className="animate-fadeIn">
          <section id="pendidikan_sertifikasi" className="bg-[#FAFBF9] border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-12 space-y-12">
              {/* 1. Riwayat Pendidikan (Pertama) */}
              <div className="space-y-6">
                <SectionHeading 
                  title={t('Riwayat Pendidikan')} 
                  eyebrow={`${profile.pendidikan?.length || 0} ${t('jenjang pendidikan formal')}`} 
                />

                {(!profile.pendidikan || profile.pendidikan.length === 0) ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">school</span>
                    <p className="text-sm text-gray-500">{t('Belum ada riwayat pendidikan yang ditambahkan.')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                    {profile.pendidikan.map((p, i) => {
                      const period = p.tahun || p.tahun_lulus || (p.tahun_masuk && p.tahun_lulus ? `${p.tahun_masuk} — ${p.tahun_lulus}` : null);
                      const title = p.prodi || p.jurusan ? `${t(p.jenjang)} — ${t(p.prodi || p.jurusan)}` : t(p.jenjang);

                      return (
                        <div
                          key={i}
                          className="group relative bg-white rounded-2xl border border-gray-200/90 hover:border-[#8B4513]/40 p-5 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between gap-4"
                        >
                          <div className="space-y-3">
                            <div className="flex items-start justify-between gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 border border-[#8B4513]/20 text-[#8B4513] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-[#8B4513] group-hover:text-white transition-all duration-200">
                                <span className="material-symbols-outlined text-[20px]">school</span>
                              </div>

                              {period && (
                                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#8B4513]/10 text-[#8B4513] border border-[#8B4513]/25 shrink-0 font-bold">
                                  <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                  {period}
                                </span>
                              )}
                            </div>

                            <h4 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#8B4513] transition-colors leading-snug">
                              {title}
                            </h4>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-gray-100">
                            {p.institusi && (
                              <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 font-semibold">
                                <span className="material-symbols-outlined text-[18px] text-[#8B4513] shrink-0">account_balance</span>
                                <span className="truncate">{t(p.institusi)}</span>
                              </div>
                            )}
                            {p.gelar && (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="inline-block text-[11px] bg-[#FAFBF9] border border-gray-200 text-gray-700 font-mono font-semibold px-2.5 py-0.5 rounded-md">
                                  Gelar {t(p.gelar)}
                                </span>
                              </div>
                            )}
                            {p.deskripsi && (
                              <p className="text-xs text-gray-500 leading-relaxed pt-1">
                                {t(p.deskripsi)}
                              </p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* 2. Sertifikasi Keahlian (Kedua) */}
              <div className="space-y-6 pt-6 border-t border-gray-200/80">
                <SectionHeading 
                  title={t('expert_profile.credentials.certifications', 'Sertifikasi Keahlian')} 
                  eyebrow={`${profile.sertifikasi?.length || 0} ${t('expert_profile.credentials.active', 'kredensial aktif')}`} 
                />

                {(!profile.sertifikasi || profile.sertifikasi.length === 0) ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
                    <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">workspace_premium</span>
                    <p className="text-sm text-gray-500">{t('Belum ada sertifikasi keahlian yang ditambahkan.')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                    {profile.sertifikasi.map((s, i) => (
                      <div
                        key={i}
                        className="group relative bg-white rounded-2xl border border-gray-200/90 hover:border-[#8B4513]/40 p-5 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between gap-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border border-[#8B4513]/20 group-hover:scale-105 transition-transform"
                              style={{ backgroundColor: `${BRAND_BROWN}1A` }}
                            >
                              <span className="material-symbols-outlined text-[20px]" style={{ color: BRAND_BROWN }}>
                                workspace_premium
                              </span>
                            </div>

                            {s.berlakuHingga && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                                <span className="material-symbols-outlined text-[13px] text-emerald-600">verified</span>
                                {s.berlakuHingga.toLowerCase().includes('seumur') ? t('Seumur Hidup') : `${t('s.d.')} ${s.berlakuHingga}`}
                              </span>
                            )}
                          </div>

                          <div>
                            <h4 className="text-sm sm:text-base font-bold text-gray-900 group-hover:text-[#8B4513] transition-colors leading-snug">
                              {t(s.nama || s.nama_sertifikat)}
                            </h4>
                            {(s.lembaga || s.penerbit) && (
                              <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1 flex items-center gap-1.5">
                                <span className="material-symbols-outlined text-[15px] text-[#8B4513] shrink-0">apartment</span>
                                <span className="truncate">{t(s.lembaga || s.penerbit)}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100 font-medium">
                          <span>{s.nomor && s.nomor !== '-' ? `${t('No.')} ${s.nomor}` : (s.tahun ? `${t('Tahun')} ${s.tahun}` : '')}</span>
                          {s.tahun && s.nomor && s.nomor !== '-' && (
                            <span className="text-gray-400">{t('Tahun')} {s.tahun}</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ---------- TAB CONTENT: ORGANISASI ---------- */}
      {activeSection === 'organisasi' && (
        <div className="animate-fadeIn">
          <section id="organisasi" className="bg-[#FAFBF9] border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-12">
              <SectionHeading 
                title={t('Organisasi & Asosiasi Profesi')} 
                eyebrow={`${organisasiList.length} ${t('organisasi terafiliasi')}`} 
              />
              {organisasiList.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center my-4">
                  <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">groups</span>
                  <p className="text-sm text-gray-500">{t('Belum ada riwayat organisasi yang ditambahkan.')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                  {organisasiList.map((o, i) => (
                    <div
                      key={o.id || i}
                      className="group relative bg-white rounded-2xl border border-gray-200/90 hover:border-[#8B4513]/40 p-4 sm:p-6 transition-all duration-200 shadow-xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between gap-4 overflow-hidden"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2.5 flex-wrap sm:flex-nowrap">
                          <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 border border-[#8B4513]/20 text-[#8B4513] flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 group-hover:bg-[#8B4513] group-hover:text-white transition-all duration-200">
                            <span className="material-symbols-outlined text-[20px]">groups</span>
                          </div>

                          {o.periode && (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-[#8B4513]/10 text-[#8B4513] border border-[#8B4513]/25 shrink-0 font-bold ml-auto sm:ml-0">
                              <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                              {t(o.periode)}
                            </span>
                          )}
                        </div>

                        <h4 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#8B4513] transition-colors leading-snug break-words">
                          {t(o.nama)}
                        </h4>
                      </div>

                      {o.jabatan && (
                        <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 font-medium pt-3 border-t border-gray-100">
                          <span className="material-symbols-outlined text-[18px] text-[#8B4513] shrink-0">badge</span>
                          <span className="break-words leading-relaxed">{t(o.jabatan)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ---------- TAB CONTENT: PENGALAMAN PROYEK ---------- */}
      {activeSection === 'pengalaman_proyek' && (
        <div className="animate-fadeIn">
          <section id="pengalaman_proyek" className="bg-[#FAFBF9] border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-12">
              <SectionHeading
                title={t('Proyek')}
                eyebrow={`${Math.min(profile.pengalamanProyek?.length || 0, 10)} ${t('PROYEK TERBAIK')}`}
              />
              {(!profile.pengalamanProyek || profile.pengalamanProyek.length === 0) ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center my-4">
                  <span className="material-symbols-outlined text-gray-400 text-4xl mb-2">folder_off</span>
                  <p className="text-sm text-gray-500">{t('Belum ada riwayat proyek yang ditambahkan.')}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4">
                  {profile.pengalamanProyek.slice(0, 10).map((p, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-2xl border border-gray-200/90 hover:border-[#8B4513]/40 p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between group hover:-translate-y-0.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                          {p.peran ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200/70">
                              <span className="material-symbols-outlined text-[15px]">badge</span>
                              <span className="truncate max-w-[220px]">{t(p.peran)}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-900 border border-blue-200/70">
                              <span className="material-symbols-outlined text-[15px]">assignment</span>
                              <span>{t('Proyek')}</span>
                            </span>
                          )}

                          {(p.tahun || p.periode) && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-[#8B4513] border border-amber-200">
                              <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                              <span>{t(p.tahun || p.periode)}</span>
                            </span>
                          )}
                        </div>

                        <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug group-hover:text-[#8B4513] transition-colors mb-2">
                          {t(p.nama || p.judul)}
                        </h4>
                      </div>

                      {p.lokasi && (
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium pt-2.5 border-t border-gray-100 mt-2">
                          <span className="material-symbols-outlined text-[15px] text-gray-400 shrink-0">location_on</span>
                          <span className="line-clamp-1">{t(p.lokasi)}</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* ---------- PENGALAMAN PENELITIAN ---------- */}
              {penelitianList.length > 0 && (
                <div className="mt-12 pt-10 border-t border-gray-200">
                  <SectionHeading
                    title={t('Pengalaman Penelitian')}
                    eyebrow={`${penelitianList.length} ${t('RISET & PENELITIAN')}`}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4">
                    {penelitianList.map((p, i) => (
                      <div
                        key={p.id || i}
                        className="bg-white rounded-2xl border border-gray-200/90 hover:border-[#2E5E3B]/40 p-5 transition-all shadow-2xs hover:shadow-xs flex flex-col justify-between group hover:-translate-y-0.5"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-2.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {p.peran ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200/70">
                                  <span className="material-symbols-outlined text-[15px]">science</span>
                                  <span className="truncate max-w-[200px]">{t(p.peran)}</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200/70">
                                  <span className="material-symbols-outlined text-[15px]">biotech</span>
                                  <span>{t('Penelitian')}</span>
                                </span>
                              )}
                              {p.bidang && (
                                <span className="text-[11px] font-medium text-gray-600 bg-gray-100 border border-gray-200/70 px-2 py-0.5 rounded-md">
                                  {p.bidang}
                                </span>
                              )}
                            </div>

                            {p.tahun && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-[#2E5E3B] border border-emerald-200">
                                <span className="material-symbols-outlined text-[13px]">calendar_today</span>
                                <span>{p.tahun}</span>
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug group-hover:text-[#2E5E3B] transition-colors mb-2">
                            {p.judul || p.nama}
                          </h4>

                          {p.institusi && (
                            <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-1">
                              <span className="material-symbols-outlined text-[15px] text-gray-400 shrink-0">account_balance</span>
                              <span>{p.institusi}</span>
                            </p>
                          )}

                          {p.lokasi && (
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium pt-2.5 border-t border-gray-100 mt-2">
                              <span className="material-symbols-outlined text-[15px] text-gray-400 shrink-0">location_on</span>
                              <span className="line-clamp-1">{t(p.lokasi)}</span>
                            </div>
                          )}

                          {p.deskripsi && (
                            <p className="text-xs text-gray-600 leading-relaxed mt-2 whitespace-pre-line line-clamp-3">
                              {p.deskripsi}
                            </p>
                          )}
                        </div>

                        {p.link && p.link !== '#' && (
                          <div className="pt-3 border-t border-gray-100 mt-3">
                            <a
                              href={p.link}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#2E5E3B] hover:underline inline-flex items-center gap-1 font-semibold"
                            >
                              <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                              <span>{t('Lihat Publikasi / Riset')}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ---------- TAB CONTENT: AKADEMIK ---------- */}
      {activeSection === 'akademik' && (
        <div className="animate-fadeIn">
          {/* ---------- 9, 10, 11, 12(narasumber), 13, 14. AKADEMIK ---------- */}
          <section id="akademik" className="bg-[#FAFBF9] border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-12 flex flex-col gap-10">
              {/* Profil Akademik - Link Scopus, Google Scholar, SINTA, ORCID, ResearchGate */}
              {isPremium && (
                <div>
                  {/* Modern Luxury Academic Header Banner */}
                  <div className="bg-gradient-to-r from-[#1E1B18] via-[#332219] to-[#1E1B18] text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden mb-6 border border-stone-800">
                    <div className="absolute -right-8 -bottom-8 w-44 h-44 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
                    <div className="absolute left-1/4 -top-8 w-36 h-36 rounded-full bg-[#8B4513]/25 blur-xl pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-amber-300 text-xs font-bold tracking-wide">
                          <span className="material-symbols-outlined text-[15px]">verified</span>
                          <span>{t('Indeks Ilmiah & Rekam Jejak Riset')}</span>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                          {t('Profil Akademik & Sitasi Terverifikasi')}
                        </h3>
                        <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
                          {t('Tautan langsung menuju repositori riset resmi, skor SINTA, profil sitasi Scopus, dan rekam jejak kontribusi ilmiah internasional tenaga ahli.')}
                        </p>
                      </div>

                      <div className="shrink-0 flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl self-start md:self-auto shadow-2xs">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                          <span className="material-symbols-outlined text-[22px]">school</span>
                        </div>
                        <div>
                          <div className="text-lg font-bold text-white leading-tight">
                            {[profile.scopus_url, profile.google_scholar_url, profile.sinta_url, profile.orcid_url, profile.researchgate_url].filter(Boolean).length || 5}
                          </div>
                          <div className="text-[11px] text-stone-300 font-medium">{t('Platform Terhubung')}</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Responsive High-Affordance Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-4.5">
                    {profile.scopus_url && (
                      <AcademicPlatformCard
                        name="Scopus"
                        url={profile.scopus_url}
                        metrics={profile.scopus_metrics}
                        logo={<ScopusLogo />}
                        toneColor="orange"
                        tag="Elsevier Author ID"
                        description={t('Indeks sitasi & publikasi internasional Elsevier')}
                        t={t}
                      />
                    )}
                    {profile.google_scholar_url && (
                      <AcademicPlatformCard
                        name="Google Scholar"
                        url={profile.google_scholar_url}
                        metrics={profile.google_scholar_metrics}
                        logo={<GoogleScholarLogo />}
                        toneColor="blue"
                        tag="Google Inc."
                        description={t('Metrik sitasi ilmiah, H-Index & i10-Index terpadu')}
                        t={t}
                      />
                    )}
                    {profile.sinta_url && (
                      <AcademicPlatformCard
                        name="SINTA"
                        url={profile.sinta_url}
                        metrics={profile.sinta_metrics}
                        logo={<SintaLogo />}
                        toneColor="teal"
                        tag="Kemendikbudristek"
                        description={t('Science and Technology Index resmi Indonesia')}
                        t={t}
                      />
                    )}
                    {profile.orcid_url && (
                      <AcademicPlatformCard
                        name="ORCID"
                        url={profile.orcid_url}
                        metrics={profile.orcid_metrics}
                        logo={<OrcidLogo />}
                        toneColor="lime"
                        tag="Researcher ID"
                        description={t('Identitas digital unik kontributor riset global')}
                        t={t}
                      />
                    )}
                    {profile.researchgate_url && (
                      <AcademicPlatformCard
                        name="ResearchGate"
                        url={profile.researchgate_url}
                        metrics={profile.researchgate_metrics}
                        logo={<ResearchGateLogo />}
                        toneColor="mint"
                        tag="Academic Network"
                        description={t('Jejaring kolaborasi & publikasi peneliti dunia')}
                        t={t}
                      />
                    )}

                    {/* Fallback ke profilAkademik jika ada */}
                    {profile.profilAkademik && !profile.scopus_url && Object.values(profile.profilAkademik).map((a) => (
                      <AcademicPlatformCard
                        key={a.label}
                        name={t(a.label)}
                        url={a.url}
                        metrics={a.metrik}
                        logo={
                          <div className="w-11 h-11 rounded-2xl bg-gray-100 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-[22px] text-gray-600">school</span>
                          </div>
                        }
                        toneColor="blue"
                        tag="Akademik"
                        description={t('Profil riset & publikasi ilmiah')}
                        t={t}
                      />
                    ))}

                    {/* Show message if no academic links are available */}
                    {!profile.scopus_url && !profile.google_scholar_url && !profile.sinta_url && !profile.orcid_url && !profile.researchgate_url && (!profile.profilAkademik || Object.keys(profile.profilAkademik).length === 0) && (
                      <div className="col-span-full bg-white border border-gray-200 rounded-3xl p-10 text-center shadow-2xs">
                        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center mx-auto mb-3.5 border border-amber-200">
                          <span className="material-symbols-outlined text-[26px]">link_off</span>
                        </div>
                        <h4 className="text-base font-bold text-gray-900 mb-1">{t('Belum Ada Link Akademik')}</h4>
                        <p className="text-xs text-gray-500 leading-relaxed max-w-sm mx-auto">
                          {t('Tenaga ahli ini belum menyematkan tautan profil Scopus, Scholar, SINTA, atau ORCID.')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Academic Sections: Each with clear SectionHeading and 2-column responsive grid */}
              {hasAnyAcademicData ? (
                <div className="flex flex-col gap-10">
                  {/* Riwayat Kajian */}
                  {kajianList.length > 0 && (
                    <div>
                      <SectionHeading title={t('Riwayat Kajian')} eyebrow={`${kajianList.length} ${t('kajian')}`} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4">
                        {kajianList.map((item, i) => (
                          <AcademicCard
                            key={item.id || i}
                            badgeIcon="analytics"
                            badgeText="Riwayat Kajian"
                            badgeTone="indigo"
                            period={item.tanggal || item.tahun || item.periode}
                            title={item.title || item.judul || item.nama}
                            subtitle={item.penyelenggara || item.institusi}
                            subtitleIcon="business"
                            location={item.tempat || item.lokasi}
                            t={t}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Pengalaman Penelitian */}
                  {penelitianList.length > 0 && (
                    <div>
                      <SectionHeading title={t('Pengalaman Penelitian')} eyebrow={`${penelitianList.length} ${t('penelitian')}`} />
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4">
                        {penelitianList.map((item, i) => (
                          <AcademicCard
                            key={item.id || i}
                            badgeIcon="science"
                            badgeText={item.peran || 'Peneliti'}
                            badgeTone="emerald"
                            period={item.tahun}
                            title={item.judul || item.nama}
                            subtitle={item.institusi}
                            subtitleIcon="account_balance"
                            location={item.lokasi || item.bidang}
                            description={item.deskripsi}
                            link={item.link}
                            linkText="Lihat riset"
                            t={t}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : !hasAcademicLinks && (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center max-w-lg mx-auto shadow-2xs">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <span className="material-symbols-outlined text-[24px]">school</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700">{t('Belum ada riwayat riset & kajian')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('Data tautan akademik, riwayat kajian, dan pengalaman penelitian akan ditampilkan di sini.')}</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ---------- TAB CONTENT: PUBLIKASI ---------- */}
      {activeSection === 'publikasi' && (
        <div className="animate-fadeIn">
          <section id="publikasi" className="bg-[#FAFBF9] border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-12">
              <SectionHeading
                title={t('Publikasi & Karya Ilmiah')}
                eyebrow={
                  profile?.total_jurnal
                    ? `${profile.total_jurnal} ${t('Total Jurnal')} · ${publikasiList.length} ${t('Karya Pilihan')}`
                    : `${publikasiList.length} ${t('karya terdaftar')}`
                }
              />

              {publikasiList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4">
                  {publikasiList.map((p, i) => {
                    const kat = (p.kategori || '').toLowerCase();
                    const jenis = (p.jenis || '').toLowerCase();
                    let badgeText = p.jenis || 'Publikasi';
                    let badgeTone = 'emerald';
                    let badgeIcon = 'auto_stories';

                    if (kat === 'jurnal' || jenis.includes('jurnal')) {
                      badgeText = t('Publikasi Jurnal');
                      badgeTone = 'emerald';
                      badgeIcon = 'auto_stories';
                    } else if (kat === 'buku' || jenis.includes('buku')) {
                      badgeText = t('Publikasi Buku');
                      badgeTone = 'amber';
                      badgeIcon = 'menu_book';
                    } else if (kat === 'penelitian' || jenis.includes('penelitian') || jenis.includes('riset') || jenis.includes('prosiding')) {
                      badgeText = t('Publikasi Penelitian');
                      badgeTone = 'blue';
                      badgeIcon = 'science';
                    } else if (kat === 'pendidikan' || jenis.includes('pendidikan') || jenis.includes('ajar')) {
                      badgeText = t('Publikasi Pendidikan (Disertasi)');
                      badgeTone = 'purple';
                      badgeIcon = 'school';
                    }

                    return (
                      <AcademicCard
                        key={p.id || i}
                        badgeIcon={badgeIcon}
                        badgeText={badgeText}
                        badgeTone={badgeTone}
                        period={p.tahun}
                        title={p.judul}
                        subtitle={p.penerbit}
                        subtitleIcon="account_balance"
                        link={p.link}
                        linkText={t('Lihat publikasi')}
                        t={t}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 text-center max-w-lg mx-auto shadow-2xs mt-4">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-800 flex items-center justify-center mx-auto mb-3.5 border border-emerald-200/60 shadow-2xs">
                    <span className="material-symbols-outlined text-[28px]">menu_book</span>
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mb-1">{t('Belum Ada Publikasi')}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {t('Tenaga ahli ini belum menambahkan daftar karya publikasi, buku, atau artikel ilmiah.')}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ---------- TAB CONTENT: NARASUMBER ---------- */}
      {activeSection === 'narasumber' && (
        <div className="animate-fadeIn">
          <section id="narasumber" className="bg-[#FAFBF9] border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-12">
              <SectionHeading
                title={t('Narasumber & Pembicara')}
                eyebrow={`${narasumberList.length} ${t('kegiatan / forum')}`}
              />

              {narasumberList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4">
                  {narasumberList.map((item, i) => (
                    <AcademicCard
                      key={item.id || i}
                      badgeIcon="campaign"
                      badgeText="Narasumber / Pembicara"
                      badgeTone="amber"
                      period={item.tanggal || item.tahun || item.periode}
                      title={item.title || item.judul || item.nama}
                      subtitle={item.penyelenggara || item.institusi}
                      subtitleIcon="business"
                      location={item.tempat || item.lokasi}
                      description={item.deskripsi}
                      link={item.link || item.url}
                      linkText={item.link ? t('Lihat Materi / Dokumen') : null}
                      t={t}
                    />
                  ))}
                </div>
              ) : (
                <div className="bg-white border border-gray-200 rounded-2xl p-8 sm:p-10 text-center max-w-lg mx-auto shadow-2xs mt-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-50 text-[#8B4513] flex items-center justify-center mx-auto mb-3.5 border border-amber-200/60 shadow-2xs">
                    <span className="material-symbols-outlined text-[28px]">campaign</span>
                  </div>
                  <h4 className="text-base font-bold text-gray-900 mb-1">{t('Belum Ada Riwayat Narasumber')}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {t('Tenaga ahli ini belum menambahkan riwayat kegiatan sebagai narasumber atau pembicara.')}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}

      {/* ---------- TAB CONTENT: PRODUK ---------- */}
      {activeSection === 'produk' && (
        <div className="animate-fadeIn">
          {/* ---------- PRODUK MARKETPLACE ---------- */}
          <section id="produk" className="bg-[#FAFBF9] border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-margin-mobile md:px-margin-desktop py-10 md:py-12">
              <SectionHeading title={t('Produk')} eyebrow={`${(profile.products || []).length} ${t('produk tersedia')}`} />

              {profile.products && profile.products.length > 0 ? (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5 mt-4">
                    {(showAllProducts ? profile.products : profile.products.slice(0, 10)).map((product) => {
                      const discountPct = product.discount_price
                        ? Math.round((1 - product.discount_price / product.price) * 100) : 0;
                      const CAT_LABEL = {
                        book: 'Buku', template: 'Template', course: 'Kursus',
                        presentation: 'Presentasi', article: 'Artikel', software: 'Software',
                        cv: 'CV / Resume', other: 'Produk',
                      };
                      const CAT_ICON = {
                        book: 'menu_book', template: 'description', course: 'school',
                        presentation: 'slideshow', article: 'article', software: 'code',
                        cv: 'badge', other: 'inventory',
                      };
                      const catLabel = CAT_LABEL[product.category] ?? 'Produk';
                      const catIcon = CAT_ICON[product.category] ?? 'inventory';
                      const imgSrc = product.image_url || (product.image ? getMediaUrl(product.image) : null);

                      return (
                        <Link
                          key={product.id}
                          to={`/produk/${product.id}`}
                          className="group cursor-pointer bg-white rounded-2xl border border-gray-200/90 shadow-2xs hover:shadow-md hover:border-[#8B4513]/40 transition-all duration-300 flex flex-col overflow-hidden w-full h-full hover:-translate-y-1"
                        >
                          {/* Cover image — 4:3 */}
                          <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100 shrink-0">
                            {imgSrc ? (
                              <img
                                src={imgSrc}
                                alt={product.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[#F5EBE1]">
                                <span className="material-symbols-outlined text-[40px] text-[#8B4513]/30">{catIcon}</span>
                              </div>
                            )}

                            {discountPct > 0 && (
                              <div className="absolute top-2.5 right-2.5 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm tracking-wide z-10">
                                -{discountPct}%
                              </div>
                            )}

                            <div className="absolute top-2.5 left-2.5 bg-emerald-700/85 backdrop-blur-md text-white px-2 py-0.5 rounded-lg flex items-center gap-1 text-[10px] font-semibold shadow-sm z-10">
                              <span className="material-symbols-outlined text-[13px]">cloud_download</span>
                              <span>Digital</span>
                            </div>
                          </div>

                          {/* Body */}
                          <div className="p-3 sm:p-4 flex flex-col flex-1">
                            <p className="text-[10px] sm:text-[11px] font-bold text-[#8B4513] uppercase tracking-wider truncate mb-1">
                              {catLabel}
                            </p>

                            <h3 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug line-clamp-2 mb-1 group-hover:text-[#8B4513] transition-colors min-h-[2rem] sm:min-h-[2.5rem]">
                              {product.title}
                            </h3>

                            {product.author && (
                              <p className="text-[11px] sm:text-xs text-gray-500 mb-2 truncate">
                                {t('Penulis')}: <span className="font-semibold text-gray-700">{product.author}</span>
                              </p>
                            )}

                            <div className="flex items-baseline gap-1.5 flex-wrap mt-auto pt-2.5 border-t border-gray-100">
                              <span className="text-sm sm:text-base font-extrabold text-[#8B4513]">
                                Rp {(product.discount_price ?? product.price).toLocaleString('id-ID')}
                              </span>
                              {discountPct > 0 && (
                                <span className="text-[10px] sm:text-xs text-gray-400 line-through font-normal">
                                  Rp {product.price.toLocaleString('id-ID')}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs pt-2 mt-2 border-t border-gray-50">
                              <span className="text-[11px] font-semibold text-gray-500 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px] text-emerald-600">
                                  cloud_download
                                </span>
                                <span className="text-emerald-700 font-bold">Digital</span>
                              </span>
                              <span className="text-[11px] font-bold text-[#8B4513] group-hover:text-[#6B3410] transition-colors flex items-center gap-0.5">
                                {t('Lihat Detail')}
                                <span className="material-symbols-outlined text-[13px] group-hover:translate-x-0.5 transition-transform">arrow_forward</span>
                              </span>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {profile.products.length > 10 && (
                    <div className="mt-8 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowAllProducts(prev => !prev)}
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-amber-50/50 text-[#8B4513] font-bold text-xs sm:text-sm rounded-xl border-2 border-[#8B4513]/25 hover:border-[#8B4513]/50 shadow-2xs hover:shadow-xs transition-all duration-200 group"
                      >
                        <span>
                          {showAllProducts
                            ? t('expert_profile.products.show_less', 'Tampilkan Lebih Sedikit (10 Produk)')
                            : t('expert_profile.products.show_more', `Tampilkan Semua Produk (${profile.products.length})`)
                          }
                        </span>
                        <span
                          className="material-symbols-outlined text-[18px] transition-transform duration-300 group-hover:translate-y-0.5"
                          style={{ transform: showAllProducts ? 'rotate(180deg)' : 'none' }}
                        >
                          expand_more
                        </span>
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12 bg-white rounded-2xl border border-gray-200 p-8 shadow-2xs my-4">
                  <span className="material-symbols-outlined text-gray-400 text-[48px] mb-3 block">inventory_2</span>
                  <h3 className="text-base font-bold text-gray-900 mb-1">{t('Belum Ada Produk')}</h3>
                  <p className="text-sm text-gray-500">
                    {profile.kriteria === 'Surveyor'
                      ? t('Surveyor ini belum menambahkan produk untuk dijual')
                      : t('Tenaga ahli ini belum menambahkan produk untuk dijual')}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}


      {/* ---------- TAB CONTENT: GALLERY (FOTO & VIDEO) ---------- */}
      {activeSection === 'gallery' && (
        <div className="animate-fadeIn">
          <section id="gallery" className="bg-[#FAFBF9] border-t border-gray-200 scroll-mt-20 sm:scroll-mt-24">
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-8 sm:py-12 space-y-8 sm:space-y-12">
              
              {/* 1. Video Profil & Portofolio (jika ada) */}
              {profile.video_url && (
                <div className="max-w-4xl mx-auto">
                  <SectionHeading 
                    title={t('Video Profil & Portofolio')} 
                    eyebrow={t('Dokumentasi Visual')} 
                  />
                  {(() => {
                    const embedInfo = getVideoEmbedInfo(profile.video_url);
                    return (
                      <div className="bg-white rounded-2xl sm:rounded-3xl border border-gray-200 p-3.5 sm:p-7 shadow-xs space-y-3 sm:space-y-4">
                        {profile.video_title && (
                          <div className="flex items-center gap-2 flex-wrap">
                            {embedInfo?.platform && (
                              <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-red-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-wider">
                                {embedInfo.platform}
                              </span>
                            )}
                            <h3 className="text-sm sm:text-lg font-bold text-gray-900 leading-snug">
                              {profile.video_title}
                            </h3>
                          </div>
                        )}

                        {embedInfo?.embedUrl ? (
                          <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-md border border-gray-200">
                            {embedInfo.type === 'direct' ? (
                              <video
                                src={embedInfo.embedUrl}
                                controls
                                className="w-full h-full object-contain"
                              />
                            ) : (
                              <iframe
                                src={embedInfo.embedUrl}
                                title={profile.video_title || 'Video Profil'}
                                className="w-full h-full border-0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                                allowFullScreen
                              />
                            )}
                          </div>
                        ) : (
                          <div className="p-8 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                            <p className="text-sm font-semibold text-gray-800 mb-3">
                              Tonton video profil melalui tautan eksternal:
                            </p>
                            <a
                              href={profile.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#8B4513] text-white text-xs sm:text-sm font-bold rounded-xl hover:bg-[#654321] transition-colors shadow-sm"
                            >
                              <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                              <span>Buka & Tonton Video</span>
                              <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                            </a>
                          </div>
                        )}

                        {profile.video_description && (
                          <div className="pt-3 border-t border-gray-100">
                            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                              {profile.video_description}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* 2. Galeri Foto & Dokumentasi - Showcase Viewer (Featured Image + Filmstrip) */}
              <div>
                <SectionHeading 
                  title={t('Galeri Foto & Dokumentasi')} 
                  eyebrow={`${galleryItems.length} ${t('foto dokumentasi')}`} 
                />

                {/* ── Album / Folder Filter Bar (Jika Expert Memiliki Album) ── */}
                {publicGalleryAlbums.length > 0 && galleryItems.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mb-3">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPublicAlbum('all');
                        setActiveGalleryIndex(0);
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                        selectedPublicAlbum === 'all'
                          ? 'bg-[#8B4513] text-white shadow-xs'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">photo_library</span>
                      <span>Semua Foto ({galleryItems.length})</span>
                    </button>

                    {publicGalleryAlbums.map((albumName) => {
                      const count = galleryItems.filter((i) => i.album === albumName).length;
                      const isActive = selectedPublicAlbum === albumName;
                      return (
                        <button
                          key={albumName}
                          type="button"
                          onClick={() => {
                            setSelectedPublicAlbum(albumName);
                            setActiveGalleryIndex(0);
                          }}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-[#8B4513] text-white shadow-xs'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">folder</span>
                          <span>{albumName}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {galleryItems.length > 0 ? (
                  (() => {
                    const currentItems = activeDisplayGalleryItems.length > 0 ? activeDisplayGalleryItems : galleryItems;
                    const safeIndex = (activeGalleryIndex >= 0 && activeGalleryIndex < currentItems.length) ? activeGalleryIndex : 0;
                    const activePhoto = currentItems[safeIndex];

                    const getCardStyle = (idx) => {
                      const total = currentItems.length;
                      if (total === 1) {
                        return {
                          transform: 'translate(-50%, -50%) scale(1) rotateY(0deg)',
                          zIndex: 30,
                          opacity: 1,
                          visibility: 'visible',
                          transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                        };
                      }

                      let offset = idx - safeIndex;
                      // Circular wrap-around for seamless looping
                      if (total > 2) {
                        while (offset > total / 2) offset -= total;
                        while (offset < -total / 2) offset += total;
                      }

                      const absOffset = Math.abs(offset);
                      const isVisible = absOffset <= 2;

                      // Horizontal translation in percentage
                      const translateX = offset === 0 ? 0 : (offset > 0 ? (offset === 1 ? 58 : 102) : (offset === -1 ? -58 : -102));

                      // Perspective rotation:
                      // Right cards: rotateY(-36deg), left cards: rotateY(36deg)
                      const rotateY = offset === 0 ? 0 : (offset > 0 ? (offset === 1 ? -36 : -44) : (offset === -1 ? 36 : 44));

                      // Scale down:
                      const scale = offset === 0 ? 1 : (absOffset === 1 ? 0.82 : 0.66);

                      // Z-index:
                      const zIndex = 30 - absOffset * 10;

                      // Opacity:
                      const opacity = !isVisible ? 0 : (offset === 0 ? 1 : (absOffset === 1 ? 0.88 : 0.55));

                      return {
                        transform: `translate(-50%, -50%) translateX(${translateX}%) scale(${scale}) rotateY(${rotateY}deg)`,
                        zIndex,
                        opacity,
                        visibility: isVisible ? 'visible' : 'hidden',
                        pointerEvents: isVisible ? 'auto' : 'none',
                        transition: 'all 0.5s cubic-bezier(0.25, 1, 0.5, 1)',
                      };
                    };

                    return (
                      <div className="bg-[#09090b] rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-9 border border-white/10 shadow-2xl relative mt-3 sm:mt-4 overflow-hidden select-none">
                        {/* Counter Badge */}
                        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-none flex items-center gap-2">
                          <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-semibold border border-white/15 shadow-sm">
                            {safeIndex + 1} / {currentItems.length}
                          </span>
                          {activePhoto?.album && (
                            <span className="px-2.5 py-1 rounded-full bg-purple-900/60 backdrop-blur-md text-purple-200 text-xs font-semibold border border-purple-400/30">
                              📁 {activePhoto.album}
                            </span>
                          )}
                        </div>

                        {/* ── 3D Coverflow Stage Container ── */}
                        <div
                          className="relative w-full h-[260px] sm:h-[340px] md:h-[400px] flex items-center justify-center overflow-hidden touch-pan-y"
                          style={{ perspective: '1100px', transformStyle: 'preserve-3d' }}
                          onTouchStart={handleGalleryTouchStart}
                          onTouchMove={handleGalleryTouchMove}
                          onTouchEnd={handleGalleryTouchEnd}
                        >
                          {currentItems.map((item, idx) => {
                            const isCenter = idx === safeIndex;
                            const cardStyle = getCardStyle(idx);

                            return (
                              <div
                                key={item.id ?? idx}
                                onClick={() => {
                                  if (isCenter) {
                                    setIsGalleryLightboxOpen(true);
                                  } else {
                                    setActiveGalleryIndex(idx);
                                  }
                                }}
                                style={cardStyle}
                                className={`absolute left-1/2 top-1/2 w-[260px] h-[175px] sm:w-[360px] sm:h-[245px] md:w-[460px] md:h-[305px] rounded-2xl sm:rounded-[26px] overflow-hidden shadow-2xl cursor-pointer select-none border border-white/10 ${
                                  isCenter ? 'ring-1 ring-white/20' : 'hover:opacity-95'
                                }`}
                                title={isCenter ? t('Klik untuk perbesar') : (item.caption || `Foto ${idx + 1}`)}
                              >
                                <img
                                  src={item.url}
                                  alt={item.caption || `Foto ${idx + 1}`}
                                  className="w-full h-full object-cover select-none pointer-events-none"
                                  draggable={false}
                                />
                                {/* Subtle vignette reflection */}
                                <div className={`absolute inset-0 transition-opacity pointer-events-none ${
                                  isCenter ? 'bg-gradient-to-t from-black/50 via-transparent to-black/15 opacity-40' : 'bg-black/25'
                                }`} />
                              </div>
                            );
                          })}
                        </div>

                        {/* Caption if available */}
                        {activePhoto?.caption && (
                          <div className="mt-3 text-center px-4">
                            <span className="inline-block max-w-xl text-xs sm:text-sm text-gray-300 font-medium bg-white/5 border border-white/10 px-4 py-1.5 rounded-full truncate">
                              {activePhoto.caption}
                            </span>
                          </div>
                        )}

                        {/* ── Navigation Buttons (Prev & Next) ── */}
                        <div className="flex items-center justify-center gap-4 mt-5 sm:mt-7">
                          <button
                            type="button"
                            onClick={() => setActiveGalleryIndex((prev) => (prev - 1 + currentItems.length) % currentItems.length)}
                            className="px-7 py-2.5 rounded-xl bg-[#121214] hover:bg-[#202024] active:scale-95 text-white text-sm font-semibold border border-white/20 shadow-lg transition-all cursor-pointer select-none flex items-center justify-center min-w-[90px]"
                            aria-label="Previous"
                          >
                            Prev
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveGalleryIndex((prev) => (prev + 1) % currentItems.length)}
                            className="px-7 py-2.5 rounded-xl bg-[#121214] hover:bg-[#202024] active:scale-95 text-white text-sm font-semibold border border-white/20 shadow-lg transition-all cursor-pointer select-none flex items-center justify-center min-w-[90px]"
                            aria-label="Next"
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    );
                  })()
                ) : !profile.video_url ? (
                  <div className="bg-white rounded-2xl border border-gray-200 p-8 sm:p-12 text-center my-4 max-w-xl mx-auto">
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                      <span className="material-symbols-outlined text-[28px] sm:text-[32px]">photo_library</span>
                    </div>
                    <h4 className="text-sm sm:text-base font-bold text-gray-800 mb-1">{t('Belum Ada Dokumentasi Galeri')}</h4>
                    <p className="text-xs text-gray-500">{t('Foto dokumentasi kegiatan lapangan, presentasi, atau portofolio proyek akan ditampilkan di sini.')}</p>
                  </div>
                ) : (
                  <p className="text-xs text-gray-400 italic text-center py-4">
                    {t('Belum ada foto dokumentasi tambahan.')}
                  </p>
                )}
              </div>

              {/* ── Fullscreen Lightbox Modal (dengan Touch Gesture & Responsive Viewport) ── */}
              {isGalleryLightboxOpen && (() => {
                const currentItems = activeDisplayGalleryItems.length > 0 ? activeDisplayGalleryItems : galleryItems;
                if (currentItems.length === 0) return null;
                const safeIdx = (activeGalleryIndex >= 0 && activeGalleryIndex < currentItems.length) ? activeGalleryIndex : 0;
                const activePhoto = currentItems[safeIdx];

                return (
                  <div
                    className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-2.5 sm:p-6 animate-fadeIn"
                    onClick={() => setIsGalleryLightboxOpen(false)}
                  >
                    {/* Top Bar inside Lightbox */}
                    <div
                      className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-4 flex items-center justify-between z-20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-white text-xs font-bold border border-white/20">
                          {safeIdx + 1} / {currentItems.length}
                        </span>
                        {activePhoto?.album && (
                          <span className="px-2.5 py-1 rounded-full bg-purple-900/60 backdrop-blur-md text-purple-200 text-xs font-semibold border border-purple-400/30">
                            📁 {activePhoto.album}
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsGalleryLightboxOpen(false)}
                        className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center border border-white/20 transition-transform active:scale-95 cursor-pointer shadow-lg"
                        title={t('Tutup')}
                      >
                        <span className="material-symbols-outlined text-[22px] sm:text-[24px]">close</span>
                      </button>
                    </div>

                    {/* Main Full Photo with Touch Support */}
                    <div
                      className="relative max-w-5xl max-h-[78vh] sm:max-h-[82vh] w-full flex items-center justify-center select-none"
                      onClick={(e) => e.stopPropagation()}
                      onTouchStart={handleGalleryTouchStart}
                      onTouchMove={handleGalleryTouchMove}
                      onTouchEnd={handleGalleryTouchEnd}
                    >
                      <img
                        src={activePhoto?.url}
                        alt={activePhoto?.caption || 'Foto Galeri'}
                        className="max-w-full max-h-[75vh] sm:max-h-[80vh] object-contain rounded-xl sm:rounded-2xl shadow-2xl"
                        draggable={false}
                      />

                      {/* Left / Right Nav in Lightbox */}
                      {currentItems.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={() => setActiveGalleryIndex((prev) => (prev - 1 + currentItems.length) % currentItems.length)}
                            className="absolute left-1 sm:-left-12 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/30 transition-all active:scale-90 shadow-xl cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[24px] sm:text-[30px]">chevron_left</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveGalleryIndex((prev) => (prev + 1) % currentItems.length)}
                            className="absolute right-1 sm:-right-12 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center border border-white/30 transition-all active:scale-90 shadow-xl cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[24px] sm:text-[30px]">chevron_right</span>
                          </button>
                        </>
                      )}
                    </div>

                    {/* Caption Bar in Lightbox */}
                    {activePhoto?.caption && (
                      <div
                        className="mt-3 sm:mt-4 max-w-2xl text-center bg-white/10 backdrop-blur-md px-4 py-2 sm:px-5 sm:py-2.5 rounded-lg sm:rounded-xl border border-white/20 text-white text-[11px] sm:text-sm font-medium drop-shadow"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {activePhoto.caption}
                      </div>
                    )}
                  </div>
                );
              })()}

            </div>
          </section>
        </div>
      )}

      {/* ---------- TAB CONTENT: ULASAN ---------- */}
      {activeSection === 'ulasan' && (
        <div className="animate-fadeIn">
          {/* ---------- ULASAN (RATING & REVIEWS) ---------- */}
          <section id="ulasan" className="border-t border-gray-200">
            <div className="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
              <SectionHeading title={t('Ulasan')} eyebrow={`${ratingStats.total} ${t('ulasan')}`} />
              <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
                {/* Ringkasan rating */}
                <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm lg:sticky lg:top-20 self-start">
                  <div className="flex items-end gap-2 mb-1.5">
                    <span className="text-4xl font-bold text-gray-900 leading-none">{ratingStats.avg.toFixed(1)}</span>
                    <span className="text-sm text-gray-400 mb-1">/ 5.0</span>
                  </div>
                  <StarRow rating={Math.round(ratingStats.avg)} size={18} />
                  <p className="text-xs text-gray-400 mt-1.5 mb-4">{t('Berdasarkan')} {ratingStats.total} {t('ulasan')}</p>

                  <div className="flex flex-col gap-1.5 mb-5">
                    {ratingStats.dist.map((d) => (
                      <RatingBar key={d.label} label={d.label} count={d.count} total={ratingStats.total} />
                    ))}
                  </div>

                  {hasConsulted ? (
                    !showReviewForm && (
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(true)}
                        className="w-full bg-[#8B4513] text-white text-sm font-semibold py-2.5 rounded-full hover:bg-[#6B3410] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">rate_review</span>
                        {t('Tulis Ulasan')}
                      </button>
                    )
                  ) : (
                    <div className="p-4 bg-amber-50/90 border border-amber-200/90 rounded-2xl text-center">
                      <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mx-auto mb-2">
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                      </div>
                      <p className="text-xs font-bold text-amber-900 mb-1">
                        {t('Ulasan Khusus Klien Terverifikasi')}
                      </p>
                      <p className="text-[11px] text-amber-800/90 leading-relaxed mb-3">
                        {t('Ulasan hanya dapat diberikan oleh pengguna yang telah melakukan sesi konsultasi dengan tenaga ahli / surveyor ini.')}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleOpenConsultModal('Konsultasi Online (1 Jam)')}
                        className="w-full bg-[#8B4513] text-white hover:bg-[#6B3410] font-bold text-xs py-2 px-3 rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[15px]">calendar_add_on</span>
                        {t('Konsultasi Sekarang')}
                      </button>
                    </div>
                  )}
                </div>

                {/* Daftar ulasan */}
                <div>
                  {showReviewForm && (
                    <ReviewForm onSubmit={handleAddReview} onCancel={() => setShowReviewForm(false)} />
                  )}

                  {reviews.length === 0 ? (
                    <div className="text-center py-10 text-sm text-gray-400">
                      {t('Belum ada ulasan. Jadilah yang pertama memberikan ulasan untuk tenaga ahli ini.')}
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col">
                        {(showAllReviews ? reviews : reviews.slice(0, 3)).map((r, i) => (
                          <ReviewCard key={i} review={r} />
                        ))}
                      </div>
                      {reviews.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowAllReviews((v) => !v)}
                          className="text-sm font-semibold text-[#8B4513] hover:underline mt-3"
                        >
                          {showAllReviews ? t('Sembunyikan ulasan') : `${t('Lihat semua')} ${reviews.length} ${t('ulasan')}`}
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* ── TOAST NOTIFICATION KONSULTASI ──────────────────────────── */}
      {consultSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-gray-900 text-white text-xs sm:text-sm font-semibold shadow-2xl flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fadeIn border border-white/10 max-w-lg">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[24px] text-emerald-400 shrink-0">check_circle</span>
            <span className="leading-snug">{t('Pemesanan konsultasi berhasil! Ruang chat Anda dengan tenaga ahli langsung aktif.')}</span>
          </div>
          <div className="flex items-center gap-2 pt-1 sm:pt-0 shrink-0 ml-auto">
            {successConsultationId && (
              <button
                type="button"
                onClick={() => navigate(`/chat?id=${successConsultationId}`)}
                className="px-3.5 py-1.5 bg-[#8B4513] hover:bg-[#6B3410] text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <span className="material-symbols-outlined text-[15px]">chat</span>
                <span>Buka Chat</span>
              </button>
            )}
            <button onClick={() => setConsultSuccessToast(false)} className="p-1 hover:opacity-80 text-gray-400 hover:text-white cursor-pointer">
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>
      )}

      {/* ── MODAL PENGAJUAN KONSULTASI ──────────────────────────────── */}
      {isConsultModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs overflow-y-auto p-3 sm:p-6 flex items-center justify-center"
          onClick={() => setIsConsultModalOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-scaleIn my-auto overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 sm:p-6 pb-4 border-b border-gray-100 shrink-0 bg-white">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center">
                  <span className="material-symbols-outlined text-[24px]">calendar_month</span>
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-gray-900">{t('Pilih Paket Konsultasi')}</h3>
                  <p className="text-xs text-gray-500">{t('Bersama')} {profile.name}</p>
                </div>
              </div>
              <button
                onClick={() => setIsConsultModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors"
                aria-label="Tutup modal"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="overflow-y-auto p-5 sm:p-6 flex-1 space-y-6">
              {consultError && (
                <div className="p-3 rounded-xl bg-[#FFDAD6] text-[#93000A] text-xs font-semibold flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {consultError}
                </div>
              )}

              {/* Paket Konsultasi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Chat Package */}
                <div
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${consultForm.service_type === 'chat' ? 'border-[#8B4513] bg-[#8B4513]/5' : 'border-gray-200 hover:border-[#8B4513]/50'
                    }`}
                  onClick={() => setConsultForm({ ...consultForm, service_type: 'chat' })}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">chat</span>
                    </div>
                    <h4 className="font-bold text-sm mb-2">Konsultasi Chat</h4>
                    <div className="text-2xl font-bold text-[#8B4513] mb-1">
                      Rp {getServicePrice('chat').toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Per sesi (15 menit)</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-[16px]">check_circle</span>
                        <span>Realtime chat</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-[16px]">check_circle</span>
                        <span>Share file/dokumen</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zoom Package */}
                <div
                  className={`border-2 rounded-2xl p-5 cursor-pointer transition-all ${consultForm.service_type === 'zoom' ? 'border-[#8B4513] bg-[#8B4513]/5' : 'border-gray-200 hover:border-[#8B4513]/50'
                    }`}
                  onClick={() => setConsultForm({ ...consultForm, service_type: 'zoom' })}
                >
                  <div className="text-center">
                    <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center">
                      <span className="material-symbols-outlined text-[24px]">videocam</span>
                    </div>
                    <h4 className="font-bold text-sm mb-2">Zoom</h4>
                    <div className="text-2xl font-bold text-[#8B4513] mb-1">
                      Rp {getServicePrice('zoom').toLocaleString('id-ID')}
                    </div>
                    <p className="text-xs text-gray-500 mb-3">Per sesi (30 menit)</p>
                    <div className="text-xs text-gray-600 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-[16px]">check_circle</span>
                        <span>Konsultasi via Zoom</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-green-500 text-[16px]">check_circle</span>
                        <span>Screen sharing</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Info kontak email gratis */}
              {profile.email && (
                <div className="p-3.5 rounded-xl bg-purple-50/80 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#2E1065] text-white flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-[18px]">forward_to_inbox</span>
                    </div>
                    <div>
                      <p className="font-bold text-gray-900">Hubungi Lewat Email Gratis</p>
                      <p className="text-gray-600 text-[11px]">Fitur kirim email ke tenaga ahli tersedia <strong>gratis untuk semua paket</strong> tanpa perlu reservasi berbayar.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEmailModalOpen(true)}
                    className="shrink-0 px-3.5 py-1.5 rounded-lg bg-[#2E1065] text-white font-bold hover:opacity-90 transition-opacity inline-flex items-center gap-1.5 self-start sm:self-auto shadow-xs cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">send</span>
                    <span>Kirim Email</span>
                  </button>
                </div>
              )}

              {/* Form Data Klien */}
              {consultForm.service_type && (
                <form onSubmit={handleConsultSubmit} className="space-y-4">
                  <div className="bg-gray-50 rounded-2xl p-4 mb-4">
                    <h5 className="font-bold text-sm text-gray-900 mb-3">Data Klien</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                          {t('Nama Lengkap')} *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder={t('Nama Anda')}
                          value={consultForm.client_name}
                          onChange={(e) => setConsultForm({ ...consultForm, client_name: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                          {t('Email Aktif')} *
                        </label>
                        <input
                          type="email"
                          required
                          placeholder={t('email@anda.com')}
                          value={consultForm.client_email}
                          onChange={(e) => setConsultForm({ ...consultForm, client_email: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                          {t('Nomor WhatsApp')} <span className="text-gray-400 font-normal">({t('Opsional')})</span>
                        </label>
                        <input
                          type="tel"
                          placeholder={t('081234567890 (opsional)')}
                          value={consultForm.client_phone}
                          onChange={(e) => setConsultForm({ ...consultForm, client_phone: e.target.value })}
                          className="w-full px-3.5 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513]"
                        />
                      </div>

                      {/* Kalender Interaktif Pemilihan Tanggal & Jam Konsultasi */}
                      <div className="sm:col-span-2 pt-2 border-t border-gray-200/80">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-800 mb-2 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-[#8B4513]">calendar_month</span>
                            {t('Pilih Tanggal & Jam di Kalender')} *
                          </span>
                          {consultForm.consultation_date && (
                            <span className="text-[#8B4513] font-bold text-xs normal-case">
                              {getDayLabel(consultForm.consultation_date)}
                            </span>
                          )}
                        </label>

                        <PublicBookingCalendar
                          expertSchedule={getExpertSchedule(slug, profile?.id)}
                          bookedSlots={expertBookedSlots}
                          selectedDate={consultForm.consultation_date}
                          selectedTime={consultForm.consultation_time}
                          selectedTimes={consultForm.consultation_times}
                          onSelectDateTime={(dateStr, timeStr, timesList) => {
                            setConsultForm(prev => ({
                              ...prev,
                              consultation_date: dateStr,
                              consultation_time: timeStr,
                              consultation_times: timesList || (timeStr ? [timeStr.replace(' WIB', '').trim()] : []),
                            }));
                          }}
                          minDate={getFutureLocalDate(1)}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                      {t('Topik/Pertanyaan Konsultasi')} *
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder={t('Jelaskan topik atau pertanyaan yang ingin dikonsultasikan...')}
                      value={consultForm.topic}
                      onChange={(e) => setConsultForm({ ...consultForm, topic: e.target.value })}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30 focus:border-[#8B4513]"
                    />
                  </div>

                  {/* Ringkasan Pembayaran */}
                  <div className="bg-[#8B4513]/5 border border-[#8B4513]/20 rounded-2xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="font-bold text-sm text-gray-900">Ringkasan Pembayaran</h5>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${currentSplit.badgeColor}`}>
                        {currentSplit.tierLabel}
                      </span>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span>Biaya Konsultasi ({consultForm.service_type === 'zoom' ? 'Zoom (30 mnt)' : 'Chat (15 mnt)'}):</span>
                          {(consultForm.consultation_times?.length > 1) && (
                            <span className="block text-xs text-[#8B4513] font-bold">
                              {consultForm.consultation_times.length} Sesi / Jam x Rp {getServicePrice(consultForm.service_type).toLocaleString('id-ID')}
                            </span>
                          )}
                        </div>
                        <span className="font-semibold whitespace-nowrap">Rp {getCurrentPrice().toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-gray-600">
                        <span>Biaya Platform ({currentSplit.commissionPercent}%):</span>
                        <span>-Rp {getAdminFee().toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-emerald-700 font-medium">
                        <span>Diterima Tenaga Ahli ({currentSplit.earningPercent}%):</span>
                        <span>Rp {getExpertFee().toLocaleString('id-ID')}</span>
                      </div>
                      <hr className="border-gray-300" />
                      <div className="flex justify-between font-bold text-[#8B4513]">
                        <span>Total Pembayaran:</span>
                        <span>Rp {getCurrentPrice().toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Pilihan Metode Pembayaran: Midtrans vs Transfer Manual */}
                  <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200/80 space-y-3.5">
                    <div className="flex items-center justify-between">
                      <h5 className="font-bold text-sm text-gray-900 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[18px] text-[#8B4513]">account_balance_wallet</span>
                        Metode Pembayaran Resmi
                      </h5>
                      <span className="text-[11px] font-semibold text-gray-500">Pilih salah satu</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Opsi 1: Transfer Bank Manual & QRIS (Direkomendasikan) */}
                      <div
                        onClick={() => setConsultPaymentMethod('manual')}
                        className={`relative p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          consultPaymentMethod === 'manual'
                            ? 'border-[#8B4513] bg-[#8B4513]/5 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="absolute -top-2.5 right-3 z-10">
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold bg-[#8B4513] text-white px-2 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                            ★ Direkomendasikan
                          </span>
                        </div>

                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="consultPaymentMethod"
                            checked={consultPaymentMethod === 'manual'}
                            onChange={() => setConsultPaymentMethod('manual')}
                            className="mt-0.5 text-[#8B4513] focus:ring-[#8B4513]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-extrabold text-xs text-gray-900">Transfer Manual & QRIS</p>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Mandiri, BCA, BNI & QRIS Gopay Merchant resmi
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Opsi 2: Midtrans */}
                      <div
                        onClick={() => setConsultPaymentMethod('midtrans')}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                          consultPaymentMethod === 'midtrans'
                            ? 'border-[#8B4513] bg-[#8B4513]/5 shadow-xs'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <input
                            type="radio"
                            name="consultPaymentMethod"
                            checked={consultPaymentMethod === 'midtrans'}
                            onChange={() => setConsultPaymentMethod('midtrans')}
                            className="mt-0.5 text-[#8B4513] focus:ring-[#8B4513]"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-extrabold text-xs text-gray-900">Midtrans Gateway</p>
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                Dalam Pengembangan
                              </span>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              Virtual Account & E-Wallet instan
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Detail Info untuk Midtrans */}
                    {consultPaymentMethod === 'midtrans' && (
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 text-xs text-amber-900 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-amber-800 font-bold">
                          <span className="material-symbols-outlined text-[16px] text-amber-700">warning</span>
                          <span>Peringatan Pembayaran</span>
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                          Fitur pembayaran ini sedang dalam proses pengembangan, jadi direkomendasikan untuk menggunakan transfer manual terlebih dahulu.
                        </p>
                      </div>
                    )}

                    {/* Detail Info untuk Transfer Bank Manual / QRIS */}
                    {consultPaymentMethod === 'manual' && (
                      <div className="space-y-3 pt-1">
                        <ManualPaymentInstruction
                          selectedBankId={selectedBankId}
                          onSelectBank={setSelectedBankId}
                        />

                        {/* Unggah Bukti Transfer */}
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1">
                            Unggah Bukti Transfer <span className="text-gray-400 font-normal">(Bisa sekarang atau nanti di Jadwal)</span>
                          </label>
                          <div className="flex items-center gap-3">
                            <label className="flex-1 border-2 border-dashed border-gray-300 hover:border-[#8B4513] rounded-xl p-3 text-center cursor-pointer bg-white transition-colors">
                              <input
                                type="file"
                                accept="image/*,.pdf"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    setConsultProofFile(file);
                                    if (file.type.startsWith('image/')) {
                                      setConsultProofPreview(URL.createObjectURL(file));
                                    } else {
                                      setConsultProofPreview(null);
                                    }
                                  }
                                }}
                              />
                              <div className="flex items-center justify-center gap-2 text-xs text-gray-600">
                                <span className="material-symbols-outlined text-[20px] text-[#8B4513]">upload_file</span>
                                <span className="font-semibold truncate">
                                  {consultProofFile ? consultProofFile.name : 'Pilih file bukti transfer (JPG, PNG, PDF max 5MB)'}
                                </span>
                              </div>
                            </label>
                            {consultProofFile && (
                              <button
                                type="button"
                                onClick={() => {
                                  setConsultProofFile(null);
                                  setConsultProofPreview(null);
                                }}
                                className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 border border-rose-200"
                                title="Hapus file bukti"
                              >
                                <span className="material-symbols-outlined text-[18px]">delete</span>
                              </button>
                            )}
                          </div>
                          {consultProofPreview && (
                            <div className="mt-2 relative inline-block">
                              <img
                                src={consultProofPreview}
                                alt="Preview Bukti"
                                className="h-16 w-24 object-cover rounded-lg border border-gray-200 shadow-2xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsConsultModalOpen(false)}
                      className="flex-1 py-3 px-4 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-2xl font-semibold text-sm transition-colors"
                    >
                      {t('Batal')}
                    </button>
                    <button
                      type="submit"
                      disabled={consultLoading || getSlotsForDate(consultForm.consultation_date, slug, profile?.id).length === 0}
                      className="flex-1 py-3 px-4 bg-[#8B4513] hover:bg-[#6B3410] text-white rounded-2xl font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {consultLoading ? (
                        <>
                          <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                          {t('Memproses...')}
                        </>
                      ) : consultPaymentMethod === 'midtrans' ? (
                        <>
                          <span className="material-symbols-outlined text-[18px]">payment</span>
                          {t('Bayar Sekarang via Midtrans')}
                        </>
                      ) : (
                        <>
                          <span className="material-symbols-outlined text-[18px]">receipt_long</span>
                          {t('Kirim Pengajuan & Bukti Transfer')}
                        </>
                      )}
                    </button>
                  </div>
                  {consultPaymentMethod === 'midtrans' && (
                    <p className="text-[11px] text-amber-700 text-center font-medium mt-2">
                      ⚠️ Fitur pembayaran ini sedang dalam proses pengembangan, jadi direkomendasikan transfer manual dulu.
                    </p>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL SUKSES PEMESANAN KONSULTASI ────────────────────────── */}
      {consultSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 p-6 space-y-5 animate-scaleIn">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <span className="material-symbols-outlined text-[36px]">check_circle</span>
              </div>
              <h3 className="text-lg sm:text-xl font-black text-gray-900">{consultSuccessModal.title}</h3>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                {consultSuccessModal.description}
              </p>
            </div>

            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                <span className="text-gray-500 font-semibold">Nomor Referensi:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-gray-900">
                  <span>{consultSuccessModal.reference_code}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(consultSuccessModal.reference_code);
                      setCopiedBankField('ref');
                      setTimeout(() => setCopiedBankField(null), 2000);
                    }}
                    className="text-gray-400 hover:text-[#8B4513]"
                    title="Salin referensi"
                  >
                    <span className="material-symbols-outlined text-[14px]">
                      {copiedBankField === 'ref' ? 'check' : 'content_copy'}
                    </span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold">Total Pembayaran:</span>
                <span className="font-extrabold text-sm text-[#8B4513]">
                  Rp {consultSuccessModal.amount?.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold">Metode:</span>
                <span className="font-bold text-gray-800">
                  {consultSuccessModal.payment_method === 'midtrans' ? 'Midtrans (Otomatis)' : `Transfer Manual (${consultSuccessModal.bank_name || 'Bank'})`}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-semibold">Status:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                  consultSuccessModal.payment_status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800'
                    : consultSuccessModal.payment_status === 'menunggu_verifikasi'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {consultSuccessModal.payment_status === 'paid'
                    ? 'Lunas'
                    : consultSuccessModal.payment_status === 'menunggu_verifikasi'
                    ? 'Menunggu Verifikasi Admin'
                    : 'Menunggu Pembayaran'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setConsultSuccessModal(null);
                  navigate('/jadwal-konsultasi');
                }}
                className="w-full py-2.5 px-4 bg-[#8B4513] hover:bg-[#6B3410] text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                <span>Lihat Jadwal Saya</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setConsultSuccessModal(null);
                  navigate('/invoice');
                }}
                className="w-full py-2.5 px-4 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[16px]">receipt_long</span>
                <span>Daftar Invoice</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- MODAL HUBUNGI VIA EMAIL (GRATIS) ---------- */}
      {isEmailModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-100 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#8B4513] to-[#6B3410] p-5 sm:p-6 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center text-white">
                  <span className="material-symbols-outlined text-[22px]">mail</span>
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">Hubungi via Email</h3>
                  <p className="text-xs text-white/80">Gratis untuk semua paket keanggotaan</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-gray-800 text-sm">
              {/* Info Tenaga Ahli */}
              <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200/70">
                <img
                  src={profile?.photo}
                  alt={profile?.name}
                  className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-xs shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-gray-900 truncate">{profile?.name}</p>
                  <p className="text-xs text-gray-500 truncate">{profile?.profesi || 'Tenaga Ahli'}</p>
                </div>
              </div>

              {/* Email Box & Copy Button */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Alamat Email Penerima
                </label>
                <div className="flex items-center gap-2 p-2.5 pl-3.5 bg-gray-50 border border-gray-200 rounded-xl">
                  <span className="material-symbols-outlined text-gray-400 text-[18px] shrink-0">alternate_email</span>
                  <span className="font-semibold text-gray-900 text-xs sm:text-sm flex-1 truncate select-all">
                    {expertEmail}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyEmail}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 bg-white border border-gray-200 hover:border-[#8B4513] text-gray-700 hover:text-[#8B4513] shadow-xs active:scale-95 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[15px]">
                      {copiedEmail ? 'check' : 'content_copy'}
                    </span>
                    <span>{copiedEmail ? 'Tersalin!' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Action Buttons: Gmail Web vs Mail App */}
              <div className="space-y-2.5 pt-1">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Pilih Cara Menghubungi:
                </p>

                {/* Option 1: Gmail Web (Always works!) */}
                <a
                  href={gmailComposeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full p-3.5 rounded-2xl border border-red-200 bg-red-50/50 hover:bg-red-50 text-red-900 font-bold flex items-center justify-between gap-3 transition-all group shadow-xs hover:border-red-300"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[20px]">mail</span>
                    </div>
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-red-700">Buka di Gmail Web</p>
                      <p className="text-[11px] text-gray-500 font-normal">Membuka pesan baru langsung di browser</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-red-600 text-[18px]">open_in_new</span>
                </a>

                {/* Option 2: Default Mail Client (mailto:) */}
                <a
                  href={emailContactUrl}
                  className="w-full p-3.5 rounded-2xl border border-[#8B4513]/20 bg-[#8B4513]/5 hover:bg-[#8B4513]/10 text-gray-900 font-bold flex items-center justify-between gap-3 transition-all group shadow-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[#8B4513] text-white flex items-center justify-center shrink-0 shadow-xs">
                      <span className="material-symbols-outlined text-[20px]">send</span>
                    </div>
                    <div className="text-left">
                      <p className="text-xs sm:text-sm font-bold text-gray-900 group-hover:text-[#8B4513]">Buka Aplikasi Email / Outlook</p>
                      <p className="text-[11px] text-gray-500 font-normal">Aplikasi email di komputer atau smartphone</p>
                    </div>
                  </div>
                  <span className="material-symbols-outlined text-gray-400 group-hover:text-[#8B4513] text-[18px]">arrow_forward</span>
                </a>
              </div>

              {/* Template Preview */}
              <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-100 text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-700 mb-1">Subjek & Template Otomatis:</p>
                <p className="font-mono text-[11px] text-gray-800 bg-white p-2 rounded-lg border border-gray-200 select-all">
                  Subjek: Konsultasi TenagaAhli.com - {profile?.name}
                </p>
                <p className="text-[11px] text-gray-500 pt-0.5">
                  Anda dapat langsung mengirim pertanyaan atau berkonsultasi mengenai kebutuhan proyek Anda tanpa biaya.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsEmailModalOpen(false)}
                className="px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-200 transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}