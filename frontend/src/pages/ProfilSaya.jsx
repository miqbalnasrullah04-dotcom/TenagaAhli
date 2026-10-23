import { useEffect, useState, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import PhoneInput from '../components/PhoneInput.jsx';
import ImageCropper from '../components/ImageCropper.jsx';
import CoverCropper from '../components/CoverCropper.jsx';
import CameraCapture from '../components/CameraCapture.jsx';
import GraduationCapLoader from '../components/GraduationCapLoader.jsx';
import { SkeletonProfilSaya } from '../components/Skeleton.jsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { locationPinIcon } from '../utils/leafletIcons.js';
import {
  UserIcon,
  DocumentTextIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingLibraryIcon,
  TrophyIcon,
  LinkIcon,
  NewspaperIcon,
  FolderIcon,
  FolderOpenIcon,
  CheckBadgeIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  ArrowTopRightOnSquareIcon,
  ArrowUpTrayIcon,
  CloudArrowUpIcon,
  IdentificationIcon,
  MapPinIcon,
  MapIcon,
  MagnifyingGlassIcon,
  ClipboardDocumentCheckIcon,
  DocumentMagnifyingGlassIcon,
  PlusIcon,
  PlusCircleIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  UserGroupIcon,
  MegaphoneIcon,
  BookOpenIcon,
  BookmarkSquareIcon,
  CameraIcon,
  PhotoIcon,
  Squares2X2Icon,
  DocumentIcon,
  EyeIcon,
  PaperAirplaneIcon,
  InformationCircleIcon,
  ShieldCheckIcon,
  ClockIcon,
  PlayIcon,
} from '@heroicons/react/24/outline';
import { ScopusLogo, GoogleScholarLogo, SintaLogo, OrcidLogo, ResearchGateLogo } from './ProfilAhli.jsx';
import { getVideoEmbedInfo } from '../utils/media.js';

/* ─── constants ──────────────────────────────────────────────────────────── */
const getTabs = (t) => [
  { id: 'pribadi', label: t('profile.tabs.personal_data', 'Data Pribadi'), Icon: UserIcon },
  { id: 'dokumen', label: t('profile.tabs.documents', 'Dokumen Verifikasi'), Icon: FolderIcon },
  { id: 'profil-bio', label: t('profile.tabs.profile_bio', 'Profil Bio'), Icon: DocumentTextIcon },
  { id: 'pekerjaan', label: t('profile.tabs.job', 'Pekerjaan'), Icon: BriefcaseIcon },
  { id: 'narasumber', label: t('profile.tabs.speaker', 'Narasumber'), Icon: MegaphoneIcon },
  { id: 'pengalaman', label: t('profile.tabs.experience', 'Pengalaman'), Icon: ClipboardDocumentCheckIcon },
  { id: 'sertifikat', label: t('profile.tabs.certificates', 'Sertifikat'), Icon: TrophyIcon },
  { id: 'akademik', label: t('profile.tabs.academic_links', 'Link Akademik'), Icon: LinkIcon },
  { id: 'publikasi', label: t('profile.tabs.publication', 'Publikasi'), Icon: NewspaperIcon },
  { id: 'organisasi', label: t('profile.tabs.organization', 'Organisasi'), Icon: UserGroupIcon },
  { id: 'galeri', label: t('profile.tabs.gallery', 'Gallery'), Icon: PhotoIcon },
  { id: 'rekening', label: t('profile.tabs.bank_account', 'Rekening Bank'), Icon: BuildingLibraryIcon },
  { id: 'verifikasi', label: t('profile.tabs.verification', 'Kirim Verifikasi'), Icon: CheckBadgeIcon },
];

const getStatusPengajuan = (t) => ({
  menunggu_review: { label: t('profile.status.waiting_review', 'Menunggu Review'), color: 'text-amber-700 bg-amber-50 border-amber-200' },
  diproses: { label: t('profile.status.processing', 'Diproses'), color: 'text-[#8B4513] bg-[#F4E8D0] border-[#D2B48C]' },
  disetujui: { label: t('profile.status.approved', 'Disetujui'), color: 'text-green-700 bg-green-50 border-green-200' },
  ditolak: { label: t('profile.status.rejected', 'Ditolak'), color: 'text-red-700 bg-red-50 border-red-200' },
});

const INPUT = 'w-full rounded-lg border border-outline-variant/40 px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#2E5E3B]/20 focus:border-[#2E5E3B] transition-colors';
const BTN_PRIMARY = 'bg-[#2E5E3B] text-white text-sm font-bold px-5 py-2.5 rounded-xl hover:bg-[#244B2F] transition-colors disabled:opacity-50 flex items-center gap-2';
const BTN_GHOST = 'text-[#2E5E3B] text-sm font-bold px-4 py-2 rounded-xl border border-[#2E5E3B]/30 hover:bg-[#2E5E3B]/5 transition-colors flex items-center gap-1.5';
const BTN_DANGER = 'text-[#B3261E] text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-[#B3261E]/10 transition-colors flex items-center gap-1';

const KRITERIA_OPTIONS = [
  'Tenaga Ahli',
  'Tenaga Teknis',
  'Surveyor',
];

// Ikon dokumen tersimpan berdasarkan tipe.
const DOC_TYPE_ICON = {
  foto_profil: CameraIcon,
  ktp: IdentificationIcon,
  ijazah: AcademicCapIcon,
  lainnya: DocumentTextIcon,
};

const getDOCTYPELABEL = (t) => ({
  foto_profil: t('profile.doc_type.profile_photo', 'Foto Profil'),
  ktp: t('profile.doc_type.id_card', 'KTP'),
  ijazah: t('profile.doc_type.diploma', 'Ijazah'),
  lainnya: t('profile.doc_type.other', 'Dokumen Lainnya'),
});

function Spinner({ className = 'w-4 h-4 border-2 border-white/30 border-t-white' }) {
  return <span className={`inline-block rounded-full animate-spin ${className}`} />;
}
function Label({ children }) {
  return <span className="text-xs font-bold uppercase tracking-wide text-[#414844]/60 block mb-1">{children}</span>;
}
function Card({ children, className = '' }) {
  return <div className={`bg-white rounded-2xl border border-black/5 shadow-sm p-3.5 sm:p-6 ${className}`}>{children}</div>;
}
function SectionTitle({ icon: Icon, children }) {
  return (
    <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider mb-4">
      <Icon className="w-[18px] h-[18px]" strokeWidth={2} />
      {children}
    </h3>
  );
}
function Alert({ type, msg, onClose }) {
  if (!msg) return null;
  const isErr = type === 'error';
  const Icon = isErr ? ExclamationCircleIcon : CheckCircleIcon;
  return (
    <div className={`flex items-start gap-3 text-sm rounded-xl p-4 mb-4 ${isErr ? 'bg-[#FFDAD6] text-[#93000A]' : 'bg-[#E3F2E7] text-[#2E5E3B]'}`}>
      <Icon className="w-[18px] h-[18px] shrink-0 mt-0.5" strokeWidth={2} />
      <span className="flex-1">{msg}</span>
      {onClose && (
        <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
          <XMarkIcon className="w-4 h-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function ExpandableText({ text, maxLines = 2, className = '' }) {
  const [expanded, setExpanded] = useState(false);
  const rawText = text || '';
  if (!rawText) return null;

  const isLong = rawText.length > 120 || rawText.includes('\n');

  return (
    <div className="mt-1">
      <p className={`text-xs text-[#5B6660] leading-relaxed whitespace-pre-line ${className} ${!expanded && isLong ? 'line-clamp-2' : ''}`}>
        {rawText}
      </p>
      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-[#2E5E3B] hover:text-[#1F4228] transition-colors focus:outline-none cursor-pointer"
        >
          <span>{expanded ? 'Tampilkan lebih sedikit' : 'Lihat selengkapnya'}</span>
          <span className="text-[10px]">{expanded ? '▲' : '▼'}</span>
        </button>
      )}
    </div>
  );
}

// Bar navigasi "wizard" — dipakai di bawah setiap tab supaya user tahu ada
// langkah berikutnya, sekaligus bisa kembali ke tab sebelumnya.
function WizardNav({ onBack, onNext, showBack = true, showNext = true, nextLabel, backLabel, t }) {
  const defaultNextLabel = nextLabel || (t ? t('profile.wizard.next', 'Lanjut') : 'Lanjut');
  const defaultBackLabel = backLabel || (t ? t('profile.wizard.back', 'Kembali') : 'Kembali');
  
  return (
    <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-4 border-t border-gray-100 mt-2">
      {showBack ? (
        <button
          type="button"
          className={`${BTN_GHOST} justify-center w-full sm:w-auto text-xs sm:text-sm py-2.5 sm:py-2`}
          onClick={onBack}
        >
          <ArrowLeftIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
          <span>{defaultBackLabel}</span>
        </button>
      ) : <span className="hidden sm:inline" />}
      {showNext && (
        <button
          type="button"
          className={`${BTN_PRIMARY} justify-center w-full sm:w-auto text-xs sm:text-sm py-2.5 sm:py-2.5 shadow-sm`}
          onClick={onNext}
        >
          <span className="truncate">{defaultNextLabel}</span>
          <ArrowRightIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px] shrink-0" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}

function Tooltip({ text }) {
  return (
    <span className="relative group inline-flex items-center ml-1.5 cursor-help align-middle">
      <InformationCircleIcon className="w-[15px] h-[15px] text-[#5B6660]/50 group-hover:text-[#2E5E3B] transition-colors" strokeWidth={2} />
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 text-xs text-white bg-[#1F2A22]/95 rounded-xl px-3 py-2.5 shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-150 z-50 text-left leading-relaxed whitespace-normal">
        {text}
        <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#1F2A22]/95" />
      </span>
    </span>
  );
}

export default function ProfilSaya() {
  const { t } = useTranslation();
  const TABS = getTabs(t);
  const DOC_TYPE_LABEL = getDOCTYPELABEL(t);
  const STATUS_PENGAJUAN_OPTS = getStatusPengajuan(t);

  const [tab, setTab] = useState('pribadi');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  /* ── tab horizontal scroll & drag ─────────────────────────────── */
  const tabsNavRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hasOverflow, setHasOverflow] = useState(true);
  const tabsDragState = useRef({ isDown: false, startX: 0, scrollLeft: 0, hasMoved: false });
  const [isDraggingTabs, setIsDraggingTabs] = useState(false);

  const checkTabsScroll = () => {
    const el = tabsNavRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 4;
    setHasOverflow(overflow);
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 6);
  };

  const scrollTabs = (direction) => {
    const el = tabsNavRef.current;
    if (!el) return;
    const distance = Math.max(Math.round(el.clientWidth * 0.65), 260);
    const targetScroll = direction === 'left' ? el.scrollLeft - distance : el.scrollLeft + distance;
    el.scrollTo({ left: targetScroll, behavior: 'smooth' });
    setTimeout(checkTabsScroll, 80);
    setTimeout(checkTabsScroll, 220);
    setTimeout(checkTabsScroll, 420);
  };

  useEffect(() => {
    checkTabsScroll();
    const el = tabsNavRef.current;
    if (!el) return;

    const t1 = setTimeout(checkTabsScroll, 60);
    const t2 = setTimeout(checkTabsScroll, 250);
    const t3 = setTimeout(checkTabsScroll, 700);

    el.addEventListener('scroll', checkTabsScroll, { passive: true });
    window.addEventListener('resize', checkTabsScroll);

    let ro = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        checkTabsScroll();
      });
      ro.observe(el);
      if (el.parentElement) ro.observe(el.parentElement);
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      el.removeEventListener('scroll', checkTabsScroll);
      window.removeEventListener('resize', checkTabsScroll);
      if (ro) ro.disconnect();
    };
  }, []);

  useEffect(() => {
    const handleWindowScroll = () => {
      if (typeof window !== 'undefined' && window.scrollX !== 0) {
        window.scrollTo(0, window.scrollY);
      }
    };
    window.addEventListener('scroll', handleWindowScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleWindowScroll);
  }, []);

  useEffect(() => {
    const el = tabsNavRef.current;
    if (!el) return;
    const activeBtn = el.querySelector('[data-tab-active="true"]');
    if (activeBtn) {
      const btnLeft = activeBtn.offsetLeft;
      const btnWidth = activeBtn.offsetWidth;
      const containerWidth = el.clientWidth;
      const targetScrollLeft = btnLeft - (containerWidth / 2) + (btnWidth / 2);
      el.scrollTo({ left: Math.max(0, targetScrollLeft), behavior: 'smooth' });
    }
    if (typeof window !== 'undefined' && window.scrollX !== 0) {
      window.scrollTo(0, window.scrollY);
    }
    const timer = setTimeout(checkTabsScroll, 350);
    return () => clearTimeout(timer);
  }, [tab]);

  useEffect(() => {
    if (tab === 'pendidikan') {
      setTab('dokumen');
    }
  }, [tab]);

  const handleTabsMouseDown = (e) => {
    const el = tabsNavRef.current;
    if (!el) return;
    tabsDragState.current = {
      isDown: true,
      startX: e.pageX - el.offsetLeft,
      scrollLeft: el.scrollLeft,
      hasMoved: false,
    };
  };

  const handleTabsMouseMove = (e) => {
    if (!tabsDragState.current.isDown) return;
    const el = tabsNavRef.current;
    if (!el) return;
    e.preventDefault();
    const x = e.pageX - el.offsetLeft;
    const walk = x - tabsDragState.current.startX;
    if (Math.abs(walk) > 5) {
      tabsDragState.current.hasMoved = true;
      setIsDraggingTabs(true);
      el.scrollLeft = tabsDragState.current.scrollLeft - walk;
    }
  };

  const handleTabsMouseUpOrLeave = () => {
    tabsDragState.current.isDown = false;
    setTimeout(() => {
      tabsDragState.current.hasMoved = false;
      setIsDraggingTabs(false);
    }, 60);
  };
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');

  /* ── data pribadi form ────────────────────────────────────────── */
  const [form, setForm] = useState({
    name: '', institution: '', field: '', phone: '',
    active_since: '',
    total_proyek: '',
    total_jurnal: '',
    tempat_lahir: '', tanggal_lahir: '',
    alamat_lengkap: '', alamat_kota: '', alamat_provinsi: '',
    location: '', lat: '', lng: '',
    bank_name: '', bank_account: '', bank_account_name: '',
  });

  // Kriteria Profesional (3 kriteria: Tenaga Ahli, Tenaga Teknis, Surveyor)
  const [kriteriaList, setKriteriaList] = useState([]);

  const toggleKriteria = (option) => {
    setKriteriaList((prev) => prev.includes(option) ? prev.filter((k) => k !== option) : [...prev, option]);
  };

  /* ── profil bio form ──────────────────────────────────────────── */
  const [bioForm, setBioForm] = useState({
    tentang_saya: '',
    ringkasan_keahlian: '',
    keahlian: '',
    kompetensi: '',
    hashtags: '',
  });

  /* ── sosial media form ────────────────────────────────────────── */
  // Setiap platform disimpan sebagai URL string. Saat save, dikumpulkan ke
  // array [{label, type, url}] agar konsisten dengan format di ProfilAhli.
  const [sosialForm, setSosialForm] = useState({
    instagram: '',
    facebook: '',
    youtube: '',
    twitter: '',
  });

  /* ── link akademik form ────────────────────────────────────────── */
  const [akademikForm, setAkademikForm] = useState({
    scopus_url: '', scopus_metrics: '',
    google_scholar_url: '', google_scholar_metrics: '',
    sinta_url: '', sinta_metrics: '',
    orcid_url: '', orcid_metrics: '',
    researchgate_url: '', researchgate_metrics: '',
  });

  /* ── sub-resources ────────────────────────────────────────────── */
  const [educations, setEducations] = useState([]);
  const [experiences, setExperiences] = useState([]);
  const [proyek, setProyek] = useState([]);
  const [penelitian, setPenelitian] = useState([]);
  const [pengalamanSubTab, setPengalamanSubTab] = useState('semua');
  const [certificates, setCertificates] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [publikasi, setPublikasi] = useState([]);

  /* ── helper & memoized kategori publikasi ────────────────────── */
  const getPubCategory = (p) => {
    if (!p) return 'jurnal';
    if (p.kategori) return String(p.kategori).toLowerCase();
    const j = String(p.jenis || '').toLowerCase();
    if (j.includes('buku') || j.includes('book')) return 'buku';
    if (j.includes('pendidikan') || j.includes('ajar') || j.includes('modul')) return 'pendidikan';
    if (j.includes('penelitian') || j.includes('riset') || j.includes('prosiding') || j.includes('seminar')) return 'penelitian';
    return 'jurnal';
  };

  const jurnalPubList = useMemo(() => publikasi.filter(p => getPubCategory(p) === 'jurnal'), [publikasi]);
  const bukuPubList = useMemo(() => publikasi.filter(p => getPubCategory(p) === 'buku'), [publikasi]);
  const penelitianPubList = useMemo(() => publikasi.filter(p => getPubCategory(p) === 'penelitian'), [publikasi]);
  const pendidikanPubList = useMemo(() => publikasi.filter(p => getPubCategory(p) === 'pendidikan'), [publikasi]);

  const [organisasi, setOrganisasi] = useState([]);
  const [reviewerJurnal, setReviewerJurnal] = useState([]);
  const [instruktur, setInstruktur] = useState([]);
  const [narasumber, setNarasumber] = useState([]);

  /* ── galeri & video state ──────────────────────────────────────── */
  const [galleryList, setGalleryList] = useState([]);
  const [galleryAlbums, setGalleryAlbums] = useState([]);
  const [activeGalleryAlbum, setActiveGalleryAlbum] = useState('all');
  const [targetUploadAlbum, setTargetUploadAlbum] = useState('');
  const [showNewAlbumModal, setShowNewAlbumModal] = useState(false);
  const [newAlbumInput, setNewAlbumInput] = useState('');
  const [movingPhotoIndex, setMovingPhotoIndex] = useState(null);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [newGalleryCaption, setNewGalleryCaption] = useState('');
  const [selectedGalleryPhoto, setSelectedGalleryPhoto] = useState(null);
  const galleryFileRef = useRef(null);

  const [videoForm, setVideoForm] = useState({
    video_url: '',
    video_title: '',
    video_description: '',
  });

  /* ── pengajuan state ──────────────────────────────────────────── */
  const [submissions, setSubmissions] = useState([]);
  const [addingSubmission, setAddingSubmission] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newSubmission, setNewSubmission] = useState({
    judul_pengajuan: '',
    jenis_pengajuan: '',
    provinsi: '',
    kabupaten_kota: '',
    nama_pemohon: '',
    instansi: '',
    penanggung_jawab: '',
  });
  const [dokumenPdf, setDokumenPdf] = useState(null);
  const [dokumenWord, setDokumenWord] = useState(null);
  const [dokumenZip, setDokumenZip] = useState(null);
  const dokumenPdfRef = useRef();
  const dokumenWordRef = useRef();
  const dokumenZipRef = useRef();

  /* ── inline edit state ────────────────────────────────────────── */
  const [editEdu, setEditEdu] = useState(null); // { id, ...fields }
  const [editExp, setEditExp] = useState(null);
  const [editProyek, setEditProyek] = useState(null);
  const [editPenelitian, setEditPenelitian] = useState(null);
  const [editPub, setEditPub] = useState(null);
  const [editOrg, setEditOrg] = useState(null);
  const [editRev, setEditRev] = useState(null);
  const [editNara, setEditNara] = useState(null);
  const [editIns, setEditIns] = useState(null);
  const [addingEdu, setAddingEdu] = useState(false);
  const [addingExp, setAddingExp] = useState(false);
  const [addingProyek, setAddingProyek] = useState(false);
  const [addingPenelitian, setAddingPenelitian] = useState(false);
  const [addingCert, setAddingCert] = useState(false);
  const [isEditingTotalProyek, setIsEditingTotalProyek] = useState(false);
  const [isEditingTotalJurnal, setIsEditingTotalJurnal] = useState(false);
  const [publikasiSubTab, setPublikasiSubTab] = useState('pendidikan');
  const [addingPub, setAddingPub] = useState(false);
  const [addingOrg, setAddingOrg] = useState(false);
  const [addingRev, setAddingRev] = useState(false);
  const [addingIns, setAddingIns] = useState(false);
  const [addingNara, setAddingNara] = useState(false);

  const [newEdu, setNewEdu] = useState({ jenjang: '', institusi: '', jurusan: '', tahun_lulus: '' });
  const [eduIjazahFile, setEduIjazahFile] = useState(null);
  const eduIjazahRef = useRef();
  const [editEduIjazahFile, setEditEduIjazahFile] = useState(null);
  const editEduIjazahRef = useRef();
  const [newExp, setNewExp] = useState({ posisi: '', instansi: '', tahun_mulai: '', tahun_selesai: '', deskripsi: '' });
  const [newProyek, setNewProyek] = useState({ nama: '', peran: '', tahun: '', lokasi: '' });
  const [newPenelitian, setNewPenelitian] = useState({ nama: '', peran: '', tahun: '', lokasi: '' });
  const [newCert, setNewCert] = useState({ nama_sertifikat: '', penerbit: '', tahun: '' });
  const [certFile, setCertFile] = useState(null);
  const certFileRef = useRef();
  const [editCert, setEditCert] = useState(null);
  const [editCertFile, setEditCertFile] = useState(null);
  const editCertFileRef = useRef();
  const [newPub, setNewPub] = useState({ kategori: 'jurnal', jenis: '', judul: '', penerbit: '', tahun: '', link: '', deskripsi: '' });
  const [newOrg, setNewOrg] = useState({ nama: '', jabatan: '', periode: '', kontribusi: '' });
  const [newRev, setNewRev] = useState({ nama: '', institusi: '', bidang: '', periode: '' });
  const [newIns, setNewIns] = useState({ nama: '', materi: '', penyelenggara: '', peran: '', tahun: '' });
  const [newNara, setNewNara] = useState({ title: '', penyelenggara: '', tempat: '', tanggal: '' });

  /* ── upload refs ──────────────────────────────────────────────── */
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPreview] = useState(null);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState(null);
  const [cvFile, setCvFile] = useState(null);

  /* ── photo modal (WhatsApp style) ──────────────────────────────── */
  const [photoModal, setPhotoModal] = useState(false);
  const [fullPhotoView, setFullPhotoView] = useState(false);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [coverCropperOpen, setCoverCropperOpen] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  const [coverImageToCrop, setCoverImageToCrop] = useState(null);
  const [cvFileName, setCvFileName] = useState('');
  const [buktiFile, setBuktiFile] = useState(null);
  const [buktiFileName, setBuktiFileName] = useState('');
  const photoRef = useRef();
  const cameraRef = useRef(); // Ref untuk input kamera
  const coverRef = useRef(); // Ref untuk cover photo
  const cvRef = useRef();
  const buktiRef = useRef();

  /* ── map picker state ──────────────────────────────────────────── */
  const [mapPickerOpen, setMapPickerOpen] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  const [mapMarker, setMapMarker] = useState(null);
  const mapRef = useRef();
  // Snapshot lokasi sebelum modal peta dibuka, dipakai untuk "revert" saat
  // user menekan Batal / menutup modal tanpa menekan "Pilih Lokasi Ini".
  const [originalLocation, setOriginalLocation] = useState(null);
  const [mapSearchQuery, setMapSearchQuery] = useState('');
  const [mapSearchResults, setMapSearchResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const flash = (type, msg) => {
    if (type === 'ok') { setOk(msg); setErr(''); }
    else { setErr(msg); setOk(''); }
    setTimeout(() => { setOk(''); setErr(''); }, 4000);
  };

  /* ── wizard navigation ─────────────────────────────────────────── */
  const currentTabIdx = TABS.findIndex((tb) => tb.id === tab);
  
  // Auto-save data pribadi sebelum pindah tab
  const goNext = async () => {
    if (currentTabIdx < TABS.length - 1) {
      // Auto-save jika di tab pribadi
      if (tab === 'pribadi') {
        setSaving(true);
        try {
          await api.post('/my/profile', { ...form, kriteria_list: kriteriaList });
          flash('ok', 'Data pribadi berhasil disimpan.');
          await load();
        } catch (e) { 
          flash('err', e.response?.data?.message || 'Gagal menyimpan.');
          setSaving(false);
          return; // Jangan pindah tab jika gagal save
        }
        setSaving(false);
      }
      
      // Auto-save jika di tab profil-bio
      if (tab === 'profil-bio') {
        setSaving(true);
        try {
          const splitTrim = (v) => v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
          const payload = {
            tentang_saya: bioForm.tentang_saya,
            ringkasan_keahlian: bioForm.ringkasan_keahlian,
            keahlian: splitTrim(bioForm.keahlian),
            kompetensi: splitTrim(bioForm.kompetensi),
          };
          await api.post('/my/profile', payload);
          flash('ok', 'Profil bio berhasil disimpan.');
          await load();
        } catch (e) { 
          flash('err', e.response?.data?.message || 'Gagal menyimpan.');
          setSaving(false);
          return;
        }
        setSaving(false);
      }
      
      // Auto-save jika di tab link akademik
      if (tab === 'akademik') {
        setSaving(true);
        try {
          await api.post('/my/profile', akademikForm);
          flash('ok', 'Link akademik berhasil disimpan.');
          await load();
        } catch (e) { 
          flash('err', e.response?.data?.message || 'Gagal menyimpan.');
          setSaving(false);
          return;
        }
        setSaving(false);
      }
      
      // Auto-save jika di tab galeri dan ada input video
      if (tab === 'galeri' && videoForm.video_url) {
        setSaving(true);
        try {
          await api.post('/my/profile', {
            video_url: videoForm.video_url.trim(),
            video_title: videoForm.video_title.trim(),
            video_description: videoForm.video_description.trim(),
          });
          flash('ok', 'Data galeri & video berhasil disimpan.');
          await load();
        } catch (e) {
          flash('err', e.response?.data?.message || 'Gagal menyimpan video.');
          setSaving(false);
          return;
        }
        setSaving(false);
      }
      
      // Auto-save jika di tab rekening
      if (tab === 'rekening') {
        setSaving(true);
        try {
          await api.post('/my/profile', {
            bank_name: form.bank_name,
            bank_account: form.bank_account,
            bank_account_name: form.bank_account_name,
          });
          flash('ok', 'Rekening bank berhasil disimpan.');
          await load();
        } catch (e) {
          flash('err', e.response?.data?.message || 'Gagal menyimpan rekening bank.');
          setSaving(false);
          return;
        }
        setSaving(false);
      }
      
      setTab(TABS[currentTabIdx + 1].id);
      window.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    }
  };
  
  const goPrev = () => {
    if (currentTabIdx > 0) {
      setTab(TABS[currentTabIdx - 1].id);
      window.scrollTo({ left: 0, top: 0, behavior: 'smooth' });
    }
  };

  /* ── kelengkapan profil ──────────────────────────────────────────
     Dipakai sebagai syarat sebelum tombol "Kirim Pengajuan" ke admin
     bisa ditekan. Juga dipakai untuk memberi tanda centang di tab bar. */
  const profileCompleteness = {
    pribadi: !!(form.name && form.phone),
    profilBio: !!(bioForm.tentang_saya || bioForm.keahlian),
    pendidikan: educations.length > 0 && educations.every(e => !!e.ijazah_path),
    pekerjaan: experiences.length > 0,
    narasumber: narasumber.length > 0,
    pengalaman: proyek.length > 0 || penelitian.length > 0,
    fotoProfil: !!photoPreview,
    galeri: (galleryList || []).length > 0 || !!videoForm.video_url,
    rekening: !!(form.bank_name && form.bank_account && form.bank_account_name),
  };
  const missingSteps = [
    !profileCompleteness.pribadi && t('profile.missing.personal_data', 'Data Pribadi (nama & no. HP wajib diisi)'),
    !profileCompleteness.fotoProfil && t('profile.missing.profile_photo', 'Foto Profil'),
    !profileCompleteness.profilBio && t('profile.missing.profile_bio', 'Profil Bio (tentang saya / keahlian utama wajib diisi)'),
    !profileCompleteness.pendidikan && t('profile.missing.education', 'Pendidikan & Ijazah (minimal 1 data riwayat pendidikan dengan scan ijazah)'),
    (!profileCompleteness.pekerjaan && !profileCompleteness.pengalaman) && t('profile.missing.experience', 'Pengalaman Kerja / Proyek / Penelitian (minimal 1 data)'),
  ].filter(Boolean);
  const isProfileComplete = missingSteps.length === 0;

  const isTabDone = (tabId) => {
    if (tabId === 'dokumen') {
      return !!(profileCompleteness.pendidikan && profileCompleteness.fotoProfil);
    }
    const doneKey = tabId === 'profil-bio' ? 'profilBio' : tabId;
    return !!profileCompleteness[doneKey];
  };
  const completedTabsCount = TABS.filter(t => isTabDone(t.id)).length;

  // Helper untuk generate URL file yang benar.
  // PENTING: pakai VITE_BACKEND_URL (tanpa suffix /api), bukan VITE_API_URL
  // (yang isinya .../api) — kalau salah pakai VITE_API_URL, URL file jadi
  // http://localhost:8000/api/storage/... yang 404 karena ada /api nyempil.
  const getFileUrl = (filePath) => {
    if (!filePath) return '#';
    if (filePath.startsWith('http')) return filePath;
    
    // Gunakan route file view API instead of direct storage access
    const apiUrl = import.meta.env.VITE_API_URL || 'https://tenagaahli.com/api';
    return `${apiUrl}/files/${filePath}`;
  };

  // Sinkronkan data user (khususnya foto profil) yang baru saja diambil dari
  // server ke localStorage['amdal_user'], lalu beri tahu komponen lain
  // (mis. Navbar) supaya ikut refresh tanpa perlu logout/login ulang.
  const syncUserToLocalStorage = (d, resolvedPhotoUrl) => {
    try {
      const raw = localStorage.getItem('amdal_user');
      if (!raw) return; // belum login / tidak ada sesi tersimpan

      const storedUser = JSON.parse(raw);

      const effectivePhoto = resolvedPhotoUrl || d.photo || storedUser.avatar_url || storedUser.foto;
      const updatedUser = {
        ...storedUser,
        name: d.name ?? storedUser.name,
        email: d.email ?? storedUser.email,
        phone: d.phone ?? storedUser.phone,
        avatar_url: effectivePhoto,
        foto: effectivePhoto,
        photo: effectivePhoto,
        package: d.package?.slug || d.package?.name || storedUser.package,
        package_id: d.package_id || storedUser.package_id,
        expert: {
          ...(storedUser.expert || {}),
          ...d,
          photo: d.photo ?? storedUser.expert?.photo,
          cover: d.cover ?? storedUser.expert?.cover,
          phone: d.phone ?? storedUser.expert?.phone,
        }
      };

      localStorage.setItem('amdal_user', JSON.stringify(updatedUser));

      // Dispatch event supaya Navbar, Pengaturan, dan komponen lain tahu ada update
      console.log('[ProfilSaya] Foto profil diupdate di localStorage:', effectivePhoto);
      window.dispatchEvent(new Event('amdal-user-updated'));
      window.dispatchEvent(new Event('amdal_user_updated'));
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Gagal sinkronkan data user ke localStorage', e);
    }
  };

  const [cancelingUpdate, setCancelingUpdate] = useState(false);

  const getSaveSuccessMsg = (defaultMsg) => {
    if (expert?.profile_status === 'aktif') {
      return t('profile.notice.changes_submitted_for_review', 'Perubahan berhasil disimpan dan diajukan ke admin. Profil publik Anda tetap aktif dengan data versi sebelumnya hingga disetujui.');
    }
    return defaultMsg;
  };

  const handleCancelUpdate = async () => {
    if (!confirm(t('profile.confirm.cancel_update', 'Batalkan pengajuan perubahan profil ini? Data form akan dikembalikan ke data profil aktif Anda saat ini.'))) return;
    setCancelingUpdate(true);
    try {
      await api.post('/my/profile/cancel-update');
      flash('ok', t('profile.success.update_cancelled', 'Pengajuan perubahan profil berhasil dibatalkan.'));
      await load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.cancel_failed', 'Gagal membatalkan pengajuan perubahan.'));
    } finally {
      setCancelingUpdate(false);
    }
  };

  /* ── load ─────────────────────────────────────────────────────── */
  const load = async () => {
    try {
      const res = await api.get('/my/profile');
      const d = res.data || {};
      setExpert(d);

      // Jika ada perubahan profil yang sedang menunggu verifikasi admin, tampilkan data yang diajukan di form
      const pending = (d.update_status === 'menunggu_verifikasi' && d.pending_changes && typeof d.pending_changes === 'object')
        ? d.pending_changes
        : {};

      const effective = { ...d, ...pending };

      setForm({
        name: effective.name || '', institution: effective.institution || '',
        field: effective.field || '', phone: effective.phone || '',
        active_since: effective.active_since || '',
        total_proyek: effective.total_proyek !== undefined && effective.total_proyek !== null ? effective.total_proyek : '',
        total_jurnal: effective.total_jurnal !== undefined && effective.total_jurnal !== null ? effective.total_jurnal : '',
        tempat_lahir: effective.tempat_lahir || '',
        tanggal_lahir: (() => {
          if (!effective.tanggal_lahir) return '';
          const str = effective.tanggal_lahir.toString().trim();
          const matchIso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
          if (matchIso) return `${matchIso[1]}-${matchIso[2]}-${matchIso[3]}`;
          const matchSlash = str.match(/^(\d{4})\/(\d{2})\/(\d{2})/);
          if (matchSlash) return `${matchSlash[1]}-${matchSlash[2]}-${matchSlash[3]}`;
          const matchId = str.match(/^(\d{2})[-/](\d{2})[-/](\d{4})/);
          if (matchId) return `${matchId[3]}-${matchId[2]}-${matchId[1]}`;
          return str.slice(0, 10);
        })(),
        alamat_lengkap: effective.alamat_lengkap || '',
        alamat_kota: effective.alamat_kota || '',
        alamat_provinsi: effective.alamat_provinsi || '',
        location: effective.location || '',
        lat: effective.lat || '',
        lng: effective.lng || '',
        bank_name: effective.bank_name || '',
        bank_account: effective.bank_account || '',
        bank_account_name: effective.bank_account_name || '',
      });

      const rawKriteriaFromServer = Array.isArray(effective.kriteria_list) ? effective.kriteria_list : (effective.kriteria ? [effective.kriteria] : []);
      const kriteriaFromServer = rawKriteriaFromServer
        .filter((k) => KRITERIA_OPTIONS.includes(k));
      setKriteriaList(kriteriaFromServer);

      setBioForm({
        tentang_saya: effective.tentang_saya || '',
        ringkasan_keahlian: effective.ringkasan_keahlian || '',
        keahlian: Array.isArray(effective.keahlian) ? effective.keahlian.join(', ') : (effective.keahlian || ''),
        kompetensi: Array.isArray(effective.kompetensi) ? effective.kompetensi.join(', ') : (effective.kompetensi || ''),
        hashtags: Array.isArray(effective.hashtags)
          ? effective.hashtags.map(t => `#${String(t).replace(/^#+/, '')}`).join(', ')
          : (effective.hashtags || ''),
      });

      // Isi sosial dari server — sosial disimpan sebagai array [{type, url, label}]
      const sosialArr = Array.isArray(effective.sosial) ? effective.sosial : [];
      const findUrl = (type) => sosialArr.find(s => s.type === type)?.url || '';
      setSosialForm({
        instagram: findUrl('instagram'),
        facebook:  findUrl('facebook'),
        youtube:   findUrl('youtube'),
        twitter:   findUrl('twitter'),
      });

      setAkademikForm({
        scopus_url: effective.scopus_url || '',
        scopus_metrics: effective.scopus_metrics || '',
        google_scholar_url: effective.google_scholar_url || '',
        google_scholar_metrics: effective.google_scholar_metrics || '',
        sinta_url: effective.sinta_url || '',
        sinta_metrics: effective.sinta_metrics || '',
        orcid_url: effective.orcid_url || '',
        orcid_metrics: effective.orcid_metrics || '',
        researchgate_url: effective.researchgate_url || '',
        researchgate_metrics: effective.researchgate_metrics || '',
      });

      const docs = d.documents || [];

      const photoDoc = docs.find((doc) => doc.type === 'foto_profil');
      const photoSource = pending.photo || d.photo || photoDoc?.file_path || photoDoc?.file_url;

      let resolvedPhotoUrl = null;
      if (photoSource) {
        resolvedPhotoUrl = `${getFileUrl(photoSource)}?t=${Date.now()}`;
        setPreview(resolvedPhotoUrl);
      } else {
        setPreview(null);
      }

      const coverSource = pending.cover || d.cover;
      if (coverSource) {
        const resolvedCoverUrl = `${getFileUrl(coverSource)}?t=${Date.now()}`;
        setCoverPreview(resolvedCoverUrl);
      } else {
        setCoverPreview(null);
      }

      setEducations(d.educations || []);
      setExperiences(d.experiences || []);
      setProyek(d.pengalaman_proyek || d.pengalamanProyek || d.kajian_riwayat || []);
      setPenelitian(d.pengalaman_penelitian || d.pengalamanPenelitian || []);
      setCertificates(d.certificates || []);
      setDocuments(docs);
      setPublikasi(d.publikasi || []);
      setOrganisasi(d.organisasi || []);
      setReviewerJurnal(d.reviewer_jurnal || d.reviewerJurnal || []);
      setInstruktur(d.instruktur || []);
      setNarasumber(d.narasumber || d.narasumber_riwayat || []);
      setGalleryList(effective.gallery || d.gallery || []);
      setGalleryAlbums(effective.gallery_albums || d.gallery_albums || []);
      setVideoForm({
        video_url: effective.video_url || d.video_url || '',
        video_title: effective.video_title || d.video_title || '',
        video_description: effective.video_description || d.video_description || '',
      });

      syncUserToLocalStorage(d, resolvedPhotoUrl);
    } catch { setErr(t('profile.error.load_failed', 'Gagal memuat data profil.')); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  // Sinkronisasi realtime jika foto diubah dari halaman Pengaturan / tempat lain
  useEffect(() => {
    const handleExternalUserUpdate = () => {
      try {
        const raw = localStorage.getItem('amdal_user');
        if (raw) {
          const u = JSON.parse(raw);
          const p = u.avatar_url || u.foto || u.photo;
          if (p) {
            const resolved = p.startsWith('http') || p.startsWith('data:') || p.startsWith('blob:')
              ? p
              : `${import.meta.env.VITE_API_URL || 'https://tenagaahli.com/api'}/files/${p.replace(/^\/+/, '').replace(/^storage\//, '').replace(/^public\//, '')}?t=${Date.now()}`;
            setPreview(resolved);
            setPhotoPreview(resolved);
          }
        }
      } catch (err) {
        console.error('Error handling user update in ProfilSaya', err);
      }
    };

    window.addEventListener('amdal-user-updated', handleExternalUserUpdate);
    window.addEventListener('amdal_user_updated', handleExternalUserUpdate);
    return () => {
      window.removeEventListener('amdal-user-updated', handleExternalUserUpdate);
      window.removeEventListener('amdal_user_updated', handleExternalUserUpdate);
    };
  }, []);

  /* ── handlers: data pribadi ──────────────────────────────────── */
  const savePribadi = async () => {
    setSaving(true);
    try {
      await api.post('/my/profile', { ...form, kriteria_list: kriteriaList });
      flash('ok', getSaveSuccessMsg(t('profile.success.personal_data_saved', 'Data pribadi berhasil disimpan.')));
      load();
    } catch (e) { flash('err', e.response?.data?.message || t('profile.error.save_failed', 'Gagal menyimpan.')); }
    finally { setSaving(false); }
  };

  /* ── handlers: rekening bank ─────────────────────────────────── */
  const saveRekening = async () => {
    setSaving(true);
    try {
      await api.post('/my/profile', {
        bank_name: form.bank_name,
        bank_account: form.bank_account,
        bank_account_name: form.bank_account_name,
      });
      flash('ok', getSaveSuccessMsg(t('profile.success.bank_account_saved', 'Rekening bank berhasil disimpan.')));
      load();
    } catch (e) { flash('err', e.response?.data?.message || t('profile.error.save_failed', 'Gagal menyimpan.')); }
    finally { setSaving(false); }
  };

  /* ── handlers: profil bio ────────────────────────────────────── */
  const saveProfilBio = async () => {
    setSaving(true);
    try {
      const splitTrim = (v) => v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
      const payload = {
        tentang_saya: bioForm.tentang_saya,
        ringkasan_keahlian: bioForm.ringkasan_keahlian,
        keahlian: splitTrim(bioForm.keahlian),
        kompetensi: splitTrim(bioForm.kompetensi),
        hashtags: bioForm.hashtags
          ? bioForm.hashtags
              .split(/[\s,]+/)
              .map(t => t.trim().replace(/^#+/, ''))
              .filter(Boolean)
          : [],
      };
      await api.post('/my/profile', payload);
      flash('ok', getSaveSuccessMsg(t('profile.success.bio_saved', 'Profil bio berhasil disimpan.')));
      load();
    } catch (e) { flash('err', e.response?.data?.message || t('profile.error.save_failed', 'Gagal menyimpan.')); }
    finally { setSaving(false); }
  };

  /* ── handlers: link akademik ──────────────────────────────────── */
  const saveLinkAkademik = async () => {
    setSaving(true);
    try {
      await api.post('/my/profile', akademikForm);
      flash('ok', getSaveSuccessMsg(t('profile.success.academic_links_saved', 'Link akademik berhasil disimpan.')));
      load();
    } catch (e) { flash('err', e.response?.data?.message || t('profile.error.save_failed', 'Gagal menyimpan.')); }
    finally { setSaving(false); }
  };

  /* ── handlers: sosial media ───────────────────────────────────── */
  const saveSosial = async () => {
    setSaving(true);
    try {
      // Bangun array hanya dari platform yang diisi URL-nya
      const PLATFORM_LABELS = {
        instagram: 'Instagram',
        facebook:  'Facebook',
        youtube:   'YouTube',
        twitter:   'Twitter / X',
      };
      const sosialArr = Object.entries(sosialForm)
        .filter(([, url]) => url.trim() !== '')
        .map(([type, url]) => ({
          type,
          label: PLATFORM_LABELS[type] || type,
          url: url.trim(),
        }));
      await api.post('/my/profile', { sosial: sosialArr });
      flash('ok', getSaveSuccessMsg(t('Sosial media berhasil disimpan.')));
      load();
    } catch (e) { flash('err', e.response?.data?.message || t('profile.error.save_failed', 'Gagal menyimpan.')); }
    finally { setSaving(false); }
  };

  /* ── handlers: pendidikan ────────────────────────────────────── */
  const addEdu = async () => {
    if (!newEdu.jenjang || !newEdu.institusi) return flash('err', t('profile.error.education_required', 'Jenjang dan institusi wajib diisi.'));
    if (!eduIjazahFile) return flash('err', t('profile.error.ijazah_required', 'Berkas scan sertifikat ijazah wajib diunggah.'));
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('jenjang', newEdu.jenjang?.trim() || '');
      fd.append('institusi', newEdu.institusi?.trim() || '');
      if (newEdu.jurusan) fd.append('jurusan', newEdu.jurusan.trim());
      if (newEdu.tahun_lulus) fd.append('tahun_lulus', newEdu.tahun_lulus);
      if (eduIjazahFile) fd.append('ijazah', eduIjazahFile);

      await api.post('/my/educations', fd);
      flash('ok', t('profile.success.education_added', 'Riwayat pendidikan & ijazah berhasil ditambahkan.'));
      setNewEdu({ jenjang: '', institusi: '', jurusan: '', tahun_lulus: '' });
      setEduIjazahFile(null);
      if (eduIjazahRef.current) eduIjazahRef.current.value = '';
      setAddingEdu(false);
      load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.add_education_failed', 'Gagal menambah pendidikan.'));
    } finally {
      setSaving(false);
    }
  };

  const updateEdu = async (id) => {
    if (!editEdu.jenjang || !editEdu.institusi) return flash('err', t('profile.error.education_required', 'Jenjang dan institusi wajib diisi.'));
    if (!editEduIjazahFile && !editEdu.ijazah_path) return flash('err', t('profile.error.ijazah_required', 'Berkas scan sertifikat ijazah wajib diunggah.'));
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('jenjang', editEdu.jenjang?.trim() || '');
      fd.append('institusi', editEdu.institusi?.trim() || '');
      if (editEdu.jurusan) fd.append('jurusan', editEdu.jurusan.trim());
      if (editEdu.tahun_lulus) fd.append('tahun_lulus', editEdu.tahun_lulus);
      if (editEduIjazahFile) fd.append('ijazah', editEduIjazahFile);

      await api.post(`/my/educations/${id}`, fd);
      flash('ok', t('profile.success.education_updated', 'Pendidikan & ijazah berhasil diperbarui.'));
      setEditEdu(null);
      setEditEduIjazahFile(null);
      if (editEduIjazahRef.current) editEduIjazahRef.current.value = '';
      load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.update_failed', 'Gagal memperbarui.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteEdu = async (id) => {
    if (!confirm(t('profile.confirm.delete_education', 'Hapus data pendidikan ini?'))) return;
    try { await api.delete(`/my/educations/${id}`); flash('ok', t('profile.success.deleted', 'Dihapus.')); load(); }
    catch (e) { flash('err', e.response?.data?.message || t('profile.error.delete_failed', 'Gagal menghapus.')); }
  };

  /* ── handlers: pengalaman ────────────────────────────────────── */
  const addExp = async () => {
    if (!newExp.posisi || !newExp.instansi) return flash('err', t('profile.error.experience_required', 'Posisi dan instansi / pemberi kerja wajib diisi.'));
    setSaving(true);
    try {
      const payload = {
        posisi: newExp.posisi?.trim() || '',
        instansi: newExp.instansi?.trim() || '',
        tahun_mulai: newExp.tahun_mulai ? parseInt(newExp.tahun_mulai, 10) : null,
        tahun_selesai: newExp.tahun_selesai ? parseInt(newExp.tahun_selesai, 10) : null,
        deskripsi: newExp.deskripsi?.trim() || null,
      };
      await api.post('/my/experiences', payload);
      flash('ok', t('profile.success.experience_added', 'Pekerjaan ditambahkan.'));
      setNewExp({ posisi: '', instansi: '', tahun_mulai: '', tahun_selesai: '', deskripsi: '' });
      setAddingExp(false); load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.add_experience_failed', 'Gagal menambah pekerjaan.'));
    } finally {
      setSaving(false);
    }
  };

  const updateExp = async (id) => {
    if (!editExp.posisi || !editExp.instansi) return flash('err', t('profile.error.experience_required', 'Posisi dan instansi / pemberi kerja wajib diisi.'));
    setSaving(true);
    try {
      const payload = {
        posisi: editExp.posisi?.trim() || '',
        instansi: editExp.instansi?.trim() || '',
        tahun_mulai: editExp.tahun_mulai ? parseInt(editExp.tahun_mulai, 10) : null,
        tahun_selesai: editExp.tahun_selesai ? parseInt(editExp.tahun_selesai, 10) : null,
        deskripsi: editExp.deskripsi?.trim() || null,
      };
      await api.put(`/my/experiences/${id}`, payload);
      flash('ok', 'Pekerjaan diperbarui.'); setEditExp(null); load();
    } catch (e) {
      flash('err', e.response?.data?.message || 'Gagal memperbarui pekerjaan.');
    } finally {
      setSaving(false);
    }
  };

  const deleteExp = async (id) => {
    if (!confirm('Hapus data pekerjaan ini?')) return;
    try { await api.delete(`/my/experiences/${id}`); flash('ok', 'Dihapus.'); load(); }
    catch (e) { flash('err', e.response?.data?.message || 'Gagal menghapus.'); }
  };

  const togglePrimaryExp = async (id) => {
    try {
      const res = await api.post(`/my/experiences/${id}/primary`);
      flash('ok', res.data.message || 'Pekerjaan utama berhasil diatur.');
      if (res.data.experiences) {
        setExperiences(res.data.experiences);
      } else {
        load();
      }
    } catch (e) {
      flash('err', e.response?.data?.message || 'Gagal mengatur pekerjaan utama.');
    }
  };

  /* ── handlers: pengalaman proyek ────────────────────────────── */
  const addProyek = async () => {
    if (proyek.length >= 10) return flash('err', t('profile.error.max_projects', 'Maksimal 10 proyek terbaik yang dapat ditambahkan.'));
    if (!newProyek.nama) return flash('err', t('profile.error.project_name_required', 'Nama proyek/kegiatan wajib diisi.'));
    setSaving(true);
    try {
      const payload = {
        nama: newProyek.nama,
        peran: newProyek.peran || '',
        tahun: newProyek.tahun || '',
        lokasi: newProyek.lokasi || '',
      };
      await api.post('/my/proyek', payload);
      flash('ok', t('profile.success.project_added', 'Proyek terbaik berhasil ditambahkan.'));
      setNewProyek({ nama: '', peran: '', tahun: '', lokasi: '' });
      setAddingProyek(false);
      load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.add_project_failed', 'Gagal menambah proyek terbaik.'));
    } finally {
      setSaving(false);
    }
  };

  const updateProyek = async (id) => {
    if (!editProyek.nama) return flash('err', t('profile.error.project_name_required', 'Nama proyek/kegiatan wajib diisi.'));
    setSaving(true);
    try {
      const payload = {
        nama: editProyek.nama,
        peran: editProyek.peran || '',
        tahun: editProyek.tahun || '',
        lokasi: editProyek.lokasi || '',
      };
      await api.put(`/my/proyek/${id}`, payload);
      flash('ok', t('profile.success.project_updated', 'Proyek terbaik diperbarui.'));
      setEditProyek(null);
      load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.update_project_failed', 'Gagal memperbarui proyek terbaik.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteProyek = async (id) => {
    if (!confirm(t('profile.confirm.delete_project', 'Hapus data proyek terbaik ini?'))) return;
    try {
      await api.delete(`/my/proyek/${id}`);
      flash('ok', t('profile.success.project_deleted', 'Proyek terbaik dihapus.'));
      load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.delete_project_failed', 'Gagal menghapus proyek terbaik.'));
    }
  };

  const saveTotalProyek = async () => {
    setSaving(true);
    try {
      const val = form.total_proyek === '' || form.total_proyek === null ? null : parseInt(form.total_proyek, 10);
      await api.post('/my/profile', { total_proyek: val });
      flash('ok', getSaveSuccessMsg(t('Total proyek berhasil disimpan.')));
      await load();
      setIsEditingTotalProyek(false);
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.save_failed', 'Gagal menyimpan.'));
    } finally {
      setSaving(false);
    }
  };

  const saveTotalJurnal = async () => {
    setSaving(true);
    try {
      const val = form.total_jurnal === '' || form.total_jurnal === null ? null : parseInt(form.total_jurnal, 10);
      await api.post('/my/profile', { total_jurnal: val });
      flash('ok', getSaveSuccessMsg(t('Total jurnal berhasil disimpan.')));
      await load();
      setIsEditingTotalJurnal(false);
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.save_failed', 'Gagal menyimpan.'));
    } finally {
      setSaving(false);
    }
  };

  /* ── handlers: pengalaman penelitian ────────────────────────── */
  const addPenelitian = async () => {
    const namaVal = newPenelitian.nama?.trim() || newPenelitian.judul?.trim();
    if (!namaVal) return flash('err', t('profile.error.research_title_required', 'Nama penelitian/riset wajib diisi.'));
    setSaving(true);
    try {
      const payload = {
        nama: namaVal,
        judul: namaVal,
        peran: newPenelitian.peran || '',
        tahun: newPenelitian.tahun || '',
        lokasi: newPenelitian.lokasi || '',
      };
      await api.post('/my/penelitian', payload);
      flash('ok', t('profile.success.research_added', 'Pengalaman penelitian berhasil ditambahkan.'));
      setNewPenelitian({ nama: '', peran: '', tahun: '', lokasi: '' });
      setAddingPenelitian(false);
      load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.add_research_failed', 'Gagal menambah pengalaman penelitian.'));
    } finally {
      setSaving(false);
    }
  };

  const updatePenelitian = async (id) => {
    const namaVal = editPenelitian?.nama?.trim() || editPenelitian?.judul?.trim();
    if (!namaVal) return flash('err', t('profile.error.research_title_required', 'Nama penelitian/riset wajib diisi.'));
    setSaving(true);
    try {
      const payload = {
        nama: namaVal,
        judul: namaVal,
        peran: editPenelitian.peran || '',
        tahun: editPenelitian.tahun || '',
        lokasi: editPenelitian.lokasi || '',
      };
      await api.put(`/my/penelitian/${id}`, payload);
      flash('ok', t('profile.success.research_updated', 'Pengalaman penelitian diperbarui.'));
      setEditPenelitian(null);
      load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.update_research_failed', 'Gagal memperbarui pengalaman penelitian.'));
    } finally {
      setSaving(false);
    }
  };

  const deletePenelitian = async (id) => {
    if (!confirm(t('profile.confirm.delete_research', 'Hapus data pengalaman penelitian ini?'))) return;
    try {
      await api.delete(`/my/penelitian/${id}`);
      flash('ok', t('profile.success.research_deleted', 'Pengalaman penelitian dihapus.'));
      load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.delete_research_failed', 'Gagal menghapus pengalaman penelitian.'));
    }
  };

  /* ── handlers: sertifikat ────────────────────────────────────── */
  const addCert = async () => {
    if (!newCert.nama_sertifikat) return flash('err', 'Nama sertifikat wajib diisi.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nama_sertifikat', newCert.nama_sertifikat);
      if (newCert.penerbit) fd.append('penerbit', newCert.penerbit);
      if (newCert.tahun) fd.append('tahun', parseInt(newCert.tahun, 10));
      // File foto/scan dikirim langsung ke backend — disimpan admin, tidak tampil publik
      if (certFile) fd.append('file', certFile);

      await api.post('/my/certificates', fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      flash('ok', certFile ? 'Sertifikat ditambahkan dan file berhasil dikirim ke admin.' : 'Sertifikat ditambahkan.');
      setNewCert({ nama_sertifikat: '', penerbit: '', tahun: '' });
      setCertFile(null);
      if (certFileRef.current) certFileRef.current.value = '';
      setAddingCert(false);
      load();
    } catch (e) { flash('err', e.response?.data?.message || 'Gagal menambah sertifikat.'); }
    finally { setSaving(false); }
  };

  const updateCert = async (id) => {
    if (!editCert?.nama_sertifikat) return flash('err', 'Nama sertifikat wajib diisi.');
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nama_sertifikat', editCert.nama_sertifikat);
      if (editCert.penerbit) fd.append('penerbit', editCert.penerbit);
      if (editCert.tahun) fd.append('tahun', parseInt(editCert.tahun, 10));
      if (editCertFile) fd.append('file', editCertFile);

      await api.post(`/my/certificates/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });

      flash('ok', 'Sertifikat berhasil diperbarui.');
      setEditCert(null);
      setEditCertFile(null);
      if (editCertFileRef.current) editCertFileRef.current.value = '';
      load();
    } catch (e) {
      flash('err', e.response?.data?.message || 'Gagal memperbarui sertifikat.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCert = async (id) => {
    if (!confirm('Hapus sertifikat ini?')) return;
    try { await api.delete(`/my/certificates/${id}`); flash('ok', 'Dihapus.'); load(); }
    catch { flash('err', 'Gagal menghapus.'); }
  };

  const togglePrimaryCert = async (id) => {
    try {
      const res = await api.post(`/my/certificates/${id}/primary`);
      flash('ok', res.data.message || 'Sertifikat utama berhasil diatur.');
      if (res.data.certificates) {
        setCertificates(res.data.certificates);
      } else {
        load();
      }
    } catch (e) {
      flash('err', e.response?.data?.message || 'Gagal mengatur sertifikat utama.');
    }
  };

  /* ── handlers: publikasi ─────────────────────────────────────── */
  const addPub = async (forcedKat = null) => {
    if (!newPub.judul) return flash('err', t('Judul publikasi wajib diisi.'));
    const kat = forcedKat || newPub.kategori || (publikasiSubTab === 'semua' ? 'jurnal' : publikasiSubTab);

    // Validasi kuota batas
    if (kat === 'buku') {
      const currentBuku = publikasi.filter(p => getPubCategory(p) === 'buku');
      if (currentBuku.length >= 5) {
        return flash('err', t('Maksimal 5 buku terbaik. Hapus salah satu buku yang ada untuk menambahkan yang baru.'));
      }
    }
    if (kat === 'jurnal') {
      const currentJurnal = publikasi.filter(p => getPubCategory(p) === 'jurnal');
      if (currentJurnal.length >= 10) {
        return flash('err', t('Maksimal 10 jurnal terbaik. Hapus salah satu jurnal yang ada untuk menambahkan yang baru.'));
      }
    }

    setSaving(true);
    try {
      const defaultJenis = kat === 'buku' ? 'Buku' : (kat === 'jurnal' ? 'Jurnal' : (kat === 'penelitian' ? 'Penelitian' : 'Pendidikan'));
      const payload = {
        kategori: kat,
        jenis: newPub.jenis?.trim() || defaultJenis,
        judul: newPub.judul?.trim() || '',
        penerbit: newPub.penerbit?.trim() || null,
        tahun: newPub.tahun ? String(newPub.tahun).trim() : null,
        link: newPub.link?.trim() || null,
        deskripsi: newPub.deskripsi?.trim() || null,
      };
      await api.post('/my/publikasi', payload);
      flash('ok', t('Publikasi berhasil ditambahkan.'));
      setNewPub({ kategori: kat, jenis: '', judul: '', penerbit: '', tahun: '', link: '', deskripsi: '' });
      setAddingPub(false);
      await load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('Gagal menambah publikasi.'));
    } finally {
      setSaving(false);
    }
  };

  const updatePub = async (id) => {
    if (!editPub.judul) return flash('err', t('Judul publikasi wajib diisi.'));
    setSaving(true);
    try {
      const kat = editPub.kategori || getPubCategory(editPub);
      const defaultJenis = kat === 'buku' ? 'Buku' : (kat === 'jurnal' ? 'Jurnal' : (kat === 'penelitian' ? 'Penelitian' : 'Pendidikan'));
      const payload = {
        kategori: kat,
        jenis: editPub.jenis?.trim() || defaultJenis,
        judul: editPub.judul?.trim() || '',
        penerbit: editPub.penerbit?.trim() || null,
        tahun: editPub.tahun ? String(editPub.tahun).trim() : null,
        link: editPub.link?.trim() || null,
        deskripsi: editPub.deskripsi?.trim() || null,
      };
      await api.put(`/my/publikasi/${id}`, payload);
      flash('ok', t('Publikasi berhasil diperbarui.'));
      setEditPub(null);
      await load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('Gagal memperbarui publikasi.'));
    } finally {
      setSaving(false);
    }
  };

  const deletePub = async (id) => {
    if (!confirm('Hapus publikasi ini?')) return;
    try { await api.delete(`/my/publikasi/${id}`); flash('ok', 'Dihapus.'); load(); }
    catch (e) { flash('err', e.response?.data?.message || 'Gagal menghapus.'); }
  };

  /* ── handlers: organisasi ────────────────────────────────────── */
  const addOrg = async () => {
    if (!newOrg.nama) return flash('err', 'Nama organisasi wajib diisi.');
    setSaving(true);
    try {
      const payload = {
        nama: newOrg.nama?.trim() || '',
        jabatan: newOrg.jabatan?.trim() || null,
        periode: newOrg.periode?.trim() || null,
      };
      await api.post('/my/organisasi', payload);
      flash('ok', 'Organisasi ditambahkan.');
      setNewOrg({ nama: '', jabatan: '', periode: '' });
      setAddingOrg(false); load();
    } catch (e) {
      flash('err', e.response?.data?.message || 'Gagal menambah organisasi.');
    } finally {
      setSaving(false);
    }
  };
  const updateOrg = async (id) => {
    if (!editOrg.nama) return flash('err', 'Nama organisasi wajib diisi.');
    setSaving(true);
    try {
      const payload = {
        nama: editOrg.nama?.trim() || '',
        jabatan: editOrg.jabatan?.trim() || null,
        periode: editOrg.periode?.trim() || null,
      };
      await api.put(`/my/organisasi/${id}`, payload);
      flash('ok', 'Organisasi diperbarui.');
      setEditOrg(null); load();
    } catch (e) {
      flash('err', e.response?.data?.message || 'Gagal memperbarui organisasi.');
    } finally {
      setSaving(false);
    }
  };
  const deleteOrg = async (id) => {
    if (!confirm('Hapus data organisasi ini?')) return;
    try { await api.delete(`/my/organisasi/${id}`); flash('ok', 'Dihapus.'); load(); }
    catch (e) { flash('err', e.response?.data?.message || 'Gagal menghapus.'); }
  };

  /* ── handlers: reviewer jurnal ────────────────────────────────── */
  const addRev = async () => {
    if (!newRev.nama) return flash('err', 'Nama jurnal wajib diisi.');
    setSaving(true);
    try {
      const payload = {
        nama: newRev.nama?.trim() || '',
        institusi: newRev.institusi?.trim() || null,
        bidang: newRev.bidang?.trim() || null,
        periode: newRev.periode?.trim() || null,
      };
      await api.post('/my/reviewer-jurnal', payload);
      flash('ok', 'Reviewer jurnal ditambahkan.');
      setNewRev({ nama: '', institusi: '', bidang: '', periode: '' });
      setAddingRev(false); load();
    } catch (e) {
      flash('err', e.response?.data?.message || 'Gagal menambah data.');
    } finally {
      setSaving(false);
    }
  };
  const updateRev = async (id) => {
    if (!editRev.nama) return flash('err', 'Nama jurnal wajib diisi.');
    setSaving(true);
    try {
      const payload = {
        nama: editRev.nama?.trim() || '',
        institusi: editRev.institusi?.trim() || null,
        bidang: editRev.bidang?.trim() || null,
        periode: editRev.periode?.trim() || null,
      };
      await api.put(`/my/reviewer-jurnal/${id}`, payload);
      flash('ok', 'Reviewer jurnal diperbarui.');
      setEditRev(null); load();
    } catch (e) {
      flash('err', e.response?.data?.message || 'Gagal memperbarui data.');
    } finally {
      setSaving(false);
    }
  };
  const deleteRev = async (id) => {
    if (!confirm('Hapus data reviewer jurnal ini?')) return;
    try { await api.delete(`/my/reviewer-jurnal/${id}`); flash('ok', 'Dihapus.'); load(); }
    catch (e) { flash('err', e.response?.data?.message || 'Gagal menghapus.'); }
  };

  /* ── handlers: instruktur / trainer ──────────────────────────── */
  const addIns = async () => {
    if (!newIns.nama) return flash('err', 'Nama kegiatan wajib diisi.');
    setSaving(true);
    try {
      const payload = {
        nama: newIns.nama?.trim() || '',
        materi: newIns.materi?.trim() || null,
        penyelenggara: newIns.penyelenggara?.trim() || null,
        peran: newIns.peran?.trim() || null,
        tahun: newIns.tahun ? String(newIns.tahun).trim() : null,
      };
      await api.post('/my/instruktur', payload);
      flash('ok', 'Riwayat instruktur ditambahkan.');
      setNewIns({ nama: '', materi: '', penyelenggara: '', peran: '', tahun: '' });
      setAddingIns(false); load();
    } catch (e) {
      flash('err', e.response?.data?.message || 'Gagal menambah data.');
    } finally {
      setSaving(false);
    }
  };
  const updateIns = async (id) => {
    if (!editIns.nama) return flash('err', 'Nama kegiatan wajib diisi.');
    setSaving(true);
    try {
      const payload = {
        nama: editIns.nama?.trim() || '',
        materi: editIns.materi?.trim() || null,
        penyelenggara: editIns.penyelenggara?.trim() || null,
        peran: editIns.peran?.trim() || null,
        tahun: editIns.tahun ? String(editIns.tahun).trim() : null,
      };
      await api.put(`/my/instruktur/${id}`, payload);
      flash('ok', 'Riwayat instruktur diperbarui.');
      setEditIns(null); load();
    } catch (e) {
      flash('err', e.response?.data?.message || 'Gagal memperbarui data.');
    } finally {
      setSaving(false);
    }
  };
  const deleteIns = async (id) => {
    if (!confirm('Hapus data ini?')) return;
    try { await api.delete(`/my/instruktur/${id}`); flash('ok', 'Dihapus.'); load(); }
    catch (e) { flash('err', e.response?.data?.message || 'Gagal menghapus.'); }
  };

  /* ── handlers: kirim verifikasi ──────────────────────────────── */
  const submitVerification = async () => {
    if (!isProfileComplete) {
      return flash('err', t('profile.error.complete_profile_first', 'Lengkapi profil Anda terlebih dahulu (semua langkah harus centang hijau) sebelum mengirim verifikasi.'));
    }

    setSubmitting(true);
    try {
      await api.post('/my/profile/submit');
      flash('ok', t('profile.success.profile_submitted', 'Profil berhasil dikirim. Menunggu review admin.'));
      load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.submit_failed', 'Gagal mengirim verifikasi.'));
    } finally {
      setSubmitting(false);
    }
  };

  /* ── handlers: narasumber ─────────────────────────────────────── */
  const addNara = async () => {
    if (!newNara.title) return flash('err', t('profile.error.title_required', 'Judul kegiatan wajib diisi.'));
    setSaving(true);
    try {
      const payload = {
        title: newNara.title?.trim() || '',
        penyelenggara: newNara.penyelenggara?.trim() || null,
        tempat: newNara.tempat?.trim() || null,
        tanggal: newNara.tanggal?.trim() || null,
      };
      await api.post('/my/narasumber', payload);
      flash('ok', t('profile.success.speaker_added', 'Riwayat narasumber ditambahkan.'));
      setNewNara({ title: '', penyelenggara: '', tempat: '', tanggal: '' });
      setAddingNara(false); load();
    } catch (e) { flash('err', e.response?.data?.message || t('profile.error.add_data_failed', 'Gagal menambah data.')); }
    finally { setSaving(false); }
  };
  const updateNara = async (id) => {
    if (!editNara.title) return flash('err', 'Judul kegiatan wajib diisi.');
    setSaving(true);
    try {
      const payload = {
        title: editNara.title?.trim() || '',
        penyelenggara: editNara.penyelenggara?.trim() || null,
        tempat: editNara.tempat?.trim() || null,
        tanggal: editNara.tanggal?.trim() || null,
      };
      await api.put(`/my/narasumber/${id}`, payload);
      flash('ok', 'Riwayat narasumber diperbarui.');
      setEditNara(null); load();
    } catch (e) { flash('err', e.response?.data?.message || 'Gagal memperbarui data.'); }
    finally { setSaving(false); }
  };
  const deleteNara = async (id) => {
    if (!confirm(t('profile.confirm.delete_data', 'Hapus data ini?'))) return;
    try { await api.delete(`/my/narasumber/${id}`); flash('ok', t('profile.success.deleted', 'Dihapus.')); load(); }
    catch (e) { flash('err', e.response?.data?.message || t('profile.error.delete_failed', 'Gagal menghapus.')); }
  };

  /* ── handlers: map picker ──────────────────────────────────────── */
  const forceTileVisibility = () => {
    if (!mapRef.current) return;
    mapRef.current.querySelectorAll('.leaflet-tile').forEach((img) => {
      img.style.opacity = '1';
    });
  };

  const openMapPicker = () => {
    setOriginalLocation({ lat: form.lat, lng: form.lng, location: form.location });
    setMapPickerOpen(true);
  };

  useEffect(() => {
    if (!mapPickerOpen || !mapRef.current || mapInstance) return;

    const defaultLat = form.lat || -6.9;
    const defaultLng = form.lng || 107.2;

    const instance = L.map(mapRef.current, { zoomControl: true }).setView([defaultLat, defaultLng], form.lat ? 13 : 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: t('map.attribution', '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'),
    }).addTo(instance);

    instance.on('tileload', forceTileVisibility);
    instance.whenReady(forceTileVisibility);

    let marker = null;
    if (form.lat && form.lng) {
      marker = L.marker([form.lat, form.lng], { draggable: true, icon: locationPinIcon }).addTo(instance);
      setMapMarker(marker);
      marker.on('dragend', function () {
        const position = marker.getLatLng();
        updateLocationFromCoords(position.lat, position.lng);
      });
    }

    instance.on('click', function (e) {
      if (marker) {
        marker.setLatLng(e.latlng);
      } else {
        marker = L.marker(e.latlng, { draggable: true, icon: locationPinIcon }).addTo(instance);
        setMapMarker(marker);
        marker.on('dragend', function () {
          const position = marker.getLatLng();
          updateLocationFromCoords(position.lat, position.lng);
        });
      }
      updateLocationFromCoords(e.latlng.lat, e.latlng.lng);
    });

    const ro = new ResizeObserver(() => {
      instance.invalidateSize();
      forceTileVisibility();
    });
    ro.observe(mapRef.current);
    requestAnimationFrame(() => {
      instance.invalidateSize();
      forceTileVisibility();
    });

    setMapInstance(instance);

    return () => {
      ro.disconnect();
      instance.off('tileload', forceTileVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapPickerOpen]);

  const updateLocationFromCoords = (lat, lng, customLocation = null) => {
    setForm(prev => {
      const cityProv = `${prev.alamat_kota || ''}, ${prev.alamat_provinsi || ''}`.trim().replace(/^,\s*|,\s*$/, '');
      const bestLocation = customLocation || cityProv || prev.alamat_lengkap || prev.lokasi_label || 'Indonesia';
      const formattedLat = typeof lat === 'number' ? lat.toFixed(6) : (lat ? String(lat) : '');
      const formattedLng = typeof lng === 'number' ? lng.toFixed(6) : (lng ? String(lng) : '');
      return {
        ...prev,
        lat: formattedLat,
        lng: formattedLng,
        location: customLocation || prev.location || bestLocation
      };
    });
  };

  const handleManualCoordChange = (field, value) => {
    setForm(prev => {
      const cityProv = `${prev.alamat_kota || ''}, ${prev.alamat_provinsi || ''}`.trim().replace(/^,\s*|,\s*$/, '');
      const bestLocation = cityProv || prev.alamat_lengkap || prev.lokasi_label || 'Indonesia';
      return {
        ...prev,
        [field]: value,
        location: prev.location || bestLocation
      };
    });
  };

  const applyManualCoordsToMap = (latVal, lngVal) => {
    const parsedLat = parseFloat(latVal);
    const parsedLng = parseFloat(lngVal);
    if (!isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat >= -90 && parsedLat <= 90 && parsedLng >= -180 && parsedLng <= 180) {
      if (mapInstance) {
        mapInstance.setView([parsedLat, parsedLng], 14);
        if (mapMarker) {
          mapMarker.setLatLng([parsedLat, parsedLng]);
        } else {
          const newMarker = L.marker([parsedLat, parsedLng], { draggable: true, icon: locationPinIcon }).addTo(mapInstance);
          setMapMarker(newMarker);
          newMarker.on('dragend', function () {
            const position = newMarker.getLatLng();
            updateLocationFromCoords(position.lat, position.lng);
          });
        }
      }
      updateLocationFromCoords(parsedLat, parsedLng);
    }
  };

  const handleSearchLocation = async (e) => {
    if (e) e.preventDefault();
    const query = mapSearchQuery.trim();
    if (!query) return;

    setIsSearchingLocation(true);
    setShowSearchResults(true);
    try {
      const resp = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=6&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'id',
          },
        }
      );
      if (!resp.ok) throw new Error('Geocoding request failed');
      const data = await resp.json();
      setMapSearchResults(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error geocoding location:', err);
      setMapSearchResults([]);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const handleSelectLocation = (item) => {
    const parsedLat = parseFloat(item.lat);
    const parsedLng = parseFloat(item.lon);
    if (isNaN(parsedLat) || isNaN(parsedLng)) return;

    const shortLocation = item.name || (item.display_name ? item.display_name.split(',')[0].trim() : '') || 'Indonesia';

    if (mapInstance) {
      mapInstance.flyTo([parsedLat, parsedLng], 15, { duration: 1.2 });
      if (mapMarker) {
        mapMarker.setLatLng([parsedLat, parsedLng]);
      } else {
        const newMarker = L.marker([parsedLat, parsedLng], { draggable: true, icon: locationPinIcon }).addTo(mapInstance);
        setMapMarker(newMarker);
        newMarker.on('dragend', function () {
          const position = newMarker.getLatLng();
          updateLocationFromCoords(position.lat, position.lng);
        });
      }
    }

    updateLocationFromCoords(parsedLat, parsedLng, shortLocation);
    setShowSearchResults(false);
    setMapSearchQuery(shortLocation);
  };

  const closeMapPicker = () => {
    setMapPickerOpen(false);
    setMapSearchQuery('');
    setMapSearchResults([]);
    setShowSearchResults(false);
    setIsSearchingLocation(false);
    if (mapInstance) {
      mapInstance.remove();
      setMapInstance(null);
      setMapMarker(null);
    }
  };

  const cancelMapPicker = () => {
    if (originalLocation) {
      setForm(prev => ({
        ...prev,
        lat: originalLocation.lat,
        lng: originalLocation.lng,
        location: originalLocation.location,
      }));
    }
    closeMapPicker();
  };

  const saveMapLocation = () => {
    closeMapPicker();
    flash('ok', 'Lokasi berhasil dipilih. Jangan lupa klik "Simpan Data Pribadi"');
  };

  /* ── handlers: dokumen & foto ────────────────────────────────── */
  const uploadDoc = async (file, type, label, resetFn) => {
    if (!file) return;

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      flash('err', t('profile.error.file_too_large', 'Ukuran file terlalu besar. Maksimal 5MB.'));
      return;
    }

    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('type', type);
      fd.append('label', label);
      fd.append('file', file);

      const response = await api.post('/my/documents', fd);

      console.log('Upload response:', response.data);
      
      // If it's a profile photo, immediately update the preview with the new URL
      if (type === 'foto_profil' && response.data.file_path) {
        const newPhotoUrl = `${import.meta.env.VITE_API_URL || 'https://tenagaahli.com/api'}/files/${response.data.file_path}?t=${Date.now()}`;
        setPreview(newPhotoUrl);
        console.log('Setting new photo preview URL:', newPhotoUrl);
      }

      if (response.data?.cv_path) {
        setExpert(prev => prev ? { ...prev, cv_path: response.data.cv_path } : prev);
      }
      if (response.data?.ktp_path) {
        setExpert(prev => prev ? { ...prev, ktp_path: response.data.ktp_path } : prev);
      }
      if (response.data?.bukti_kompetensi_path) {
        setExpert(prev => prev ? { ...prev, bukti_kompetensi_path: response.data.bukti_kompetensi_path } : prev);
      }

      flash('ok', t('profile.success.file_uploaded', '{label} berhasil diunggah.').replace('{label}', label));

      if (typeof resetFn === 'function') {
        resetFn();
      }

      // Reload profile data to get latest info
      await load();

      window.dispatchEvent(new Event('amdal-user-updated'));
      window.dispatchEvent(new Event('amdal_user_updated'));
      window.dispatchEvent(new Event('storage'));
      console.log('[ProfilSaya] Event amdal-user-updated dispatched setelah upload');
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.upload_failed', 'Gagal mengunggah {label}.').replace('{label}', label));
    }
    finally { setSaving(false); }
  };

  const deleteDoc = async (id) => {
    if (!confirm(t('profile.confirm.delete_document', 'Hapus dokumen ini?'))) return;
    try {
      await api.delete(`/my/documents/${id}`);
      flash('ok', t('profile.success.document_deleted', 'Dokumen dihapus.'));
      load();
    }
    catch { flash('err', t('profile.error.delete_failed', 'Gagal menghapus.')); }
  };

  const deletePhoto = async () => {
    if (!confirm(t('profile.confirm.delete_photo', 'Hapus foto profil?'))) return;
    setSaving(true);
    try {
      await api.put('/my/profile', { photo: null });
      flash('ok', t('profile.success.photo_deleted', 'Foto profil dihapus.'));
      setPhotoModal(false);
      await load();
    }
    catch { flash('err', t('profile.error.delete_photo_failed', 'Gagal menghapus foto.')); }
    finally { setSaving(false); }
  };

  const triggerPhotoInput = () => {
    setPhotoModal(false);
    if (photoRef.current) photoRef.current.click();
  };

  const triggerCamera = () => {
    setPhotoModal(false);
    setCameraOpen(true);
  };

  const handleCameraCapture = (blob) => {
    const imageUrl = URL.createObjectURL(blob);
    setImageToCrop(imageUrl);
    setCameraOpen(false);
    setCropperOpen(true);
  };

  const handleCameraCancel = () => {
    setCameraOpen(false);
  };

  const viewFullPhoto = () => {
    setPhotoModal(false);
    setFullPhotoView(true);
  };

  const handlePhotoChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.type.match(/image\/(jpeg|jpg|png)/)) {
        flash('err', t('profile.error.photo_format', 'Format file harus JPG atau PNG.'));
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        flash('err', t('profile.error.photo_size', 'Ukuran foto maksimal 5MB.'));
        return;
      }

      const imageUrl = URL.createObjectURL(f);
      setImageToCrop(imageUrl);
      setCropperOpen(true);
    }
  };

  const handleCropComplete = (croppedBlob) => {
    const croppedFile = new File([croppedBlob], 'profile-photo.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    setPhotoFile(croppedFile);
    setPreview(URL.createObjectURL(croppedBlob));
    setCropperOpen(false);

    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
      setImageToCrop(null);
    }
    if (photoRef.current) {
      photoRef.current.value = '';
    }
  };

  const handleCoverCropComplete = (croppedBlob) => {
    const croppedFile = new File([croppedBlob], 'cover-photo.jpg', {
      type: 'image/jpeg',
      lastModified: Date.now()
    });

    setCoverFile(croppedFile);
    setCoverPreview(URL.createObjectURL(croppedBlob));
    setCoverCropperOpen(false);

    if (coverImageToCrop) {
      URL.revokeObjectURL(coverImageToCrop);
      setCoverImageToCrop(null);
    }
  };

  const handleCoverCropCancel = () => {
    setCoverCropperOpen(false);
    if (coverImageToCrop) {
      URL.revokeObjectURL(coverImageToCrop);
      setCoverImageToCrop(null);
    }
    if (coverRef.current) {
      coverRef.current.value = '';
    }
  };

  const handleCvChange = async (e) => {
    const f = e.target.files?.[0];
    if (f) {
      const name = f.name?.toLowerCase() || '';
      const isPdfOrDoc = f.type === 'application/pdf' || f.type.includes('pdf') || f.type.includes('word') || f.type.includes('document') || /\.(pdf|doc|docx)$/i.test(name);
      if (!isPdfOrDoc) {
        flash('err', t('profile.error.cv_format', 'Format CV harus PDF, DOC, atau DOCX.'));
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        flash('err', t('profile.error.cv_size', 'Ukuran file CV maksimal 5MB.'));
        return;
      }
      setCvFile(f);
      setCvFileName(f.name);
      await uploadDoc(f, 'cv', 'CV / Curriculum Vitae', () => {
        setCvFile(null);
        setCvFileName('');
        if (cvRef.current) cvRef.current.value = '';
      });
    }
  };

  const handleBuktiChange = async (e) => {
    const f = e.target.files?.[0];
    if (f) {
      const name = f.name?.toLowerCase() || '';
      const isPdfOrDoc = f.type.includes('pdf') || f.type.includes('word') || f.type.includes('document') || /\.(pdf|doc|docx)$/i.test(name);
      const isImage = f.type.startsWith('image/') || /\.(jpg|jpeg|png|webp)$/i.test(name);
      if (!isPdfOrDoc && !isImage) {
        flash('err', t('profile.error.bukti_format', 'Format file harus PDF, DOC, DOCX, JPG, atau PNG.'));
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        flash('err', t('profile.error.file_size_5mb', 'Ukuran file maksimal 5MB.'));
        return;
      }
      setBuktiFile(f);
      setBuktiFileName(f.name);
      await uploadDoc(f, 'bukti_kompetensi', 'Bukti Kompetensi', () => {
        setBuktiFile(null);
        setBuktiFileName('');
        if (buktiRef.current) buktiRef.current.value = '';
      });
    }
  };


  const handleCoverChange = (e) => {
    const f = e.target.files?.[0];
    if (f) {
      if (!f.type.match(/image\/(jpeg|jpg|png)/)) {
        flash('err', t('profile.error.cover_format', 'Format file harus JPG atau PNG.'));
        return;
      }
      if (f.size > 5 * 1024 * 1024) {
        flash('err', t('profile.error.cover_size', 'Ukuran foto cover maksimal 5MB.'));
        return;
      }

      // Open cover cropper instead of direct preview
      const imageUrl = URL.createObjectURL(f);
      setCoverImageToCrop(imageUrl);
      setCoverCropperOpen(true);
    }
  };

  const uploadCover = async () => {
    if (!coverFile) return;
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('cover', coverFile);

      await api.post('/my/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      flash('ok', t('profile.success.cover_uploaded', 'Foto cover berhasil diupload.'));
      setCoverFile(null);
      if (coverRef.current) coverRef.current.value = '';
      await load();
    } catch (e) {
      flash('err', e.response?.data?.message || t('profile.error.cover_upload_failed', 'Gagal mengupload foto cover.'));
    } finally {
      setSaving(false);
    }
  };

  const deleteCover = async () => {
    if (!confirm(t('profile.confirm.delete_cover', 'Hapus foto cover?'))) return;
    setSaving(true);
    try {
      await api.post('/my/profile', { cover: null });
      flash('ok', t('profile.success.cover_deleted', 'Foto cover dihapus.'));
      setCoverPreview(null);
      await load();
    } catch {
      flash('err', t('profile.error.cover_delete_failed', 'Gagal menghapus foto cover.'));
    } finally {
      setSaving(false);
    }
  };

  /* ── helper: aturan paket galeri foto ────────────────────────── */
  const getGalleryTierInfo = (exp) => {
    let pkg = exp?.package;
    let pkgName = '';
    if (typeof pkg === 'string') pkgName = pkg.toLowerCase();
    else if (pkg && typeof pkg === 'object') pkgName = (pkg.name || pkg.slug || '').toLowerCase();

    if (!pkgName) {
      try {
        const rawUser = JSON.parse(localStorage.getItem('amdal_user') || '{}');
        pkg = rawUser?.package;
        if (typeof pkg === 'string') pkgName = pkg.toLowerCase();
        else if (pkg && typeof pkg === 'object') pkgName = (pkg.name || pkg.slug || '').toLowerCase();
      } catch {}
    }

    if (pkgName.includes('ekslusif') || pkgName.includes('eksklusif') || pkgName.includes('exclusive') || pkgName.includes('platinum')) {
      return {
        tier: 'eksklusif',
        name: 'Paket Eksklusif',
        min: 0,
        max: 50,
        allowAlbums: true,
        badgeColor: 'bg-purple-100 text-purple-900 border-purple-200',
        progressColor: 'bg-purple-600',
        description: 'Maksimal 50 foto dengan fitur Album / Folder foto dokumentasi.',
      };
    }
    if (pkgName.includes('ekonomis') || pkgName.includes('economic') || pkgName.includes('gold')) {
      return {
        tier: 'ekonomis',
        name: 'Paket Ekonomis',
        min: 0,
        max: 20,
        allowAlbums: false,
        badgeColor: 'bg-amber-100 text-amber-900 border-amber-200',
        progressColor: 'bg-amber-600',
        description: 'Maksimal 20 foto dokumentasi tanpa album/folder.',
      };
    }
    return {
      tier: 'free',
      name: 'Paket Free / Standar',
      min: 2,
      max: 3,
      allowAlbums: false,
      badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-200',
      progressColor: 'bg-emerald-600',
      description: 'Minimal 2 foto dan maksimal 3 foto dokumentasi tanpa album.',
    };
  };

  /* ── handlers: galeri foto ───────────────────────────────────── */
  const handleGalleryUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const tierInfo = getGalleryTierInfo(expert);

    // Strict maximum quota enforcement
    if (galleryList.length >= tierInfo.max) {
      alert(`Batas maksimal foto untuk ${tierInfo.name} adalah ${tierInfo.max} foto. Anda dapat melakukan verifikasi data ke Admin dan meng-upgrade paket Anda untuk menambah kapasitas foto dan mengaktifkan fitur album foto.`);
      if (galleryFileRef.current) galleryFileRef.current.value = '';
      return;
    }

    // Strict 2MB check as requested
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
      alert('Ukuran foto melebihi batas maksimal 2MB. Silakan pilih foto lain atau kompres terlebih dahulu.');
      if (galleryFileRef.current) galleryFileRef.current.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('File harus berupa gambar (JPG, JPEG, PNG, atau WebP).');
      if (galleryFileRef.current) galleryFileRef.current.value = '';
      return;
    }

    setUploadingGallery(true);
    try {
      const fd = new FormData();
      fd.append('photo', file);

      const res = await api.post('/my/gallery/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const path = res.data?.path;
      if (path) {
        // Tag foto ke album jika paket eksklusif
        const albumName = tierInfo.allowAlbums
          ? (targetUploadAlbum || (activeGalleryAlbum !== 'all' ? activeGalleryAlbum : ''))
          : '';

        const newItem = {
          image: path,
          caption: newGalleryCaption.trim() || '',
          album: albumName,
          created_at: new Date().toISOString(),
        };
        const updated = [...galleryList, newItem];
        setGalleryList(updated);
        setNewGalleryCaption('');
        if (galleryFileRef.current) galleryFileRef.current.value = '';

        await api.post('/my/profile', {
          gallery: updated,
          gallery_albums: galleryAlbums,
        });
        flash('ok', 'Foto berhasil ditambahkan ke galeri.');
        await load();
      }
    } catch (err) {
      console.error('Gallery upload error:', err);
      flash('err', err.response?.data?.message || 'Gagal mengunggah foto galeri.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleDeleteGallery = async (idxToDelete) => {
    if (!confirm('Hapus foto ini dari galeri?')) return;
    setSaving(true);
    const updated = galleryList.filter((_, idx) => idx !== idxToDelete);
    setGalleryList(updated);
    try {
      await api.post('/my/profile', {
        gallery: updated,
        gallery_albums: galleryAlbums,
      });
      flash('ok', 'Foto galeri berhasil dihapus.');
      await load();
    } catch (err) {
      console.error('Delete gallery error:', err);
      flash('err', 'Gagal memperbarui galeri.');
    } finally {
      setSaving(false);
    }
  };

  /* ── handlers: album foto (Khusus Eksklusif) ──────────────────── */
  const handleCreateAlbum = async (e) => {
    if (e) e.preventDefault();
    const trimmed = newAlbumInput.trim();
    if (!trimmed) {
      alert('Masukkan nama album foto.');
      return;
    }
    if (galleryAlbums.includes(trimmed)) {
      alert('Nama album tersebut sudah ada.');
      return;
    }
    const updatedAlbums = [...galleryAlbums, trimmed];
    setGalleryAlbums(updatedAlbums);
    setNewAlbumInput('');
    setShowNewAlbumModal(false);
    setActiveGalleryAlbum(trimmed);
    setTargetUploadAlbum(trimmed);
    try {
      await api.post('/my/profile', {
        gallery: galleryList,
        gallery_albums: updatedAlbums,
      });
      flash('ok', `Album "${trimmed}" berhasil dibuat.`);
    } catch {
      flash('err', 'Gagal menyimpan album.');
    }
  };

  const handleDeleteAlbum = async (albumToDelete) => {
    if (!confirm(`Hapus album "${albumToDelete}"? Foto di dalamnya tidak akan terhapus, melainkan dipindahkan ke kategori Semua/Tanpa Album.`)) return;
    const updatedAlbums = galleryAlbums.filter(a => a !== albumToDelete);
    const updatedGallery = galleryList.map(item => {
      const curAlbum = typeof item === 'object' ? item.album : '';
      if (curAlbum === albumToDelete) {
        return { ...(typeof item === 'object' ? item : { image: item }), album: '' };
      }
      return item;
    });
    setGalleryAlbums(updatedAlbums);
    setGalleryList(updatedGallery);
    if (activeGalleryAlbum === albumToDelete) {
      setActiveGalleryAlbum('all');
    }
    if (targetUploadAlbum === albumToDelete) {
      setTargetUploadAlbum('');
    }
    try {
      await api.post('/my/profile', {
        gallery: updatedGallery,
        gallery_albums: updatedAlbums,
      });
      flash('ok', `Album "${albumToDelete}" berhasil dihapus.`);
    } catch {
      flash('err', 'Gagal memperbarui album.');
    }
  };

  const handleMovePhotoAlbum = async (photoIdx, newAlbum) => {
    const updated = galleryList.map((item, idx) => {
      if (idx === photoIdx) {
        return { ...(typeof item === 'object' ? item : { image: item }), album: newAlbum };
      }
      return item;
    });
    setGalleryList(updated);
    setMovingPhotoIndex(null);
    try {
      await api.post('/my/profile', {
        gallery: updated,
        gallery_albums: galleryAlbums,
      });
      flash('ok', 'Foto berhasil dipindahkan.');
    } catch {
      flash('err', 'Gagal memindahkan foto.');
    }
  };

  /* ── handlers: video profil ──────────────────────────────────── */
  const saveVideo = async () => {
    setSaving(true);
    try {
      await api.post('/my/profile', {
        video_url: (videoForm.video_url || '').trim(),
        video_title: (videoForm.video_title || '').trim(),
        video_description: (videoForm.video_description || '').trim(),
      });
      flash('ok', getSaveSuccessMsg('Video profil berhasil disimpan.'));
      await load();
    } catch (err) {
      console.error('Save video error:', err);
      flash('err', err.response?.data?.message || 'Gagal menyimpan video profil.');
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async () => {
    if (!confirm('Hapus link video profil?')) return;
    setSaving(true);
    try {
      await api.post('/my/profile', {
        video_url: null,
        video_title: null,
        video_description: null,
      });
      setVideoForm({ video_url: '', video_title: '', video_description: '' });
      flash('ok', 'Video profil berhasil dihapus.');
      await load();
    } catch (err) {
      console.error('Delete video error:', err);
      flash('err', 'Gagal menghapus video profil.');
    } finally {
      setSaving(false);
    }
  };

  /* ── loading ─────────────────────────────────────────────────── */
  if (loading) return (
    <DashboardLayout title={t('profile.title', 'Profil Saya')}>
      <SkeletonProfilSaya />
    </DashboardLayout>
  );

  const profileStatus = expert?.profile_status || 'draft';

  return (
    <DashboardLayout
      title={t('profile.title', 'Profil Saya')}
      subtitle={t('profile.subtitle', 'Kelola data, riwayat, dan dokumen profil tenaga ahli Anda.')}
      headerRight={
        expert?.slug && (
          <Link
            to={`/profil/${expert.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#8B4513] hover:bg-[#6f370f] text-white text-xs font-bold rounded-xl transition-all shadow-xs shrink-0"
            title="Buka profil publik Anda seperti yang dilihat oleh klien di tab baru"
          >
            <span className="material-symbols-outlined text-[16px]">visibility</span>
            <span>Lihat Profil Publik</span>
          </Link>
        )
      }
    >
      {/* ── Status Banner ─────────────────────────────────────── */}
      {profileStatus === 'ditolak' && expert?.reject_reason && (
        <div className="mb-5 bg-[#FFDAD6] border border-[#FFB4AB] rounded-xl p-4 flex items-start gap-3">
          <ExclamationCircleIcon className="text-[#B3261E] w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
          <div>
            <p className="font-bold text-[#93000A] text-sm mb-1">{t('profile.status.rejected_header', 'Profil Ditolak — Harap Diperbaiki')}</p>
            <p className="text-sm text-[#410002]">{expert.reject_reason}</p>
          </div>
        </div>
      )}
      {/* ── Status Banner Pembaruan Profil yang Sedang Ditinjau Admin ── */}
      {expert?.update_status === 'menunggu_verifikasi' && (
        <div className="mb-5 bg-gradient-to-r from-amber-50/90 to-amber-100/60 border border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                <ClockIcon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-bold text-amber-950 text-sm sm:text-base">
                    {t('Pembaruan Profil Sedang Ditinjau Admin')}
                  </h4>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200/80 text-amber-900 border border-amber-300">
                    Menunggu Verifikasi
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-amber-900/80 mt-1 max-w-2xl leading-relaxed">
                  Perubahan data profil yang Anda simpan sedang menunggu konfirmasi admin. 
                  <strong> Data profil publik Anda tetap aktif dengan versi sebelumnya</strong> sampai admin menyetujui perubahan ini.
                </p>
                {expert.update_submitted_at && (
                  <p className="text-[11px] text-amber-700/70 mt-1">
                    Diajukan pada: {new Date(expert.update_submitted_at).toLocaleString('id-ID')}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancelUpdate}
              disabled={cancelingUpdate}
              className="self-end sm:self-center px-3.5 py-2 bg-white/90 hover:bg-white border border-red-200 text-red-700 hover:text-red-800 text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              <XMarkIcon className="w-4 h-4" />
              {cancelingUpdate ? 'Membatalkan...' : 'Batalkan Pengajuan'}
            </button>
          </div>
        </div>
      )}

      {/* ── Status Banner Pembaruan Profil Ditolak ── */}
      {expert?.update_status === 'ditolak' && expert?.update_reject_reason && (
        <div className="mb-5 bg-red-50 border border-red-200 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-red-100 text-red-700 flex items-center justify-center shrink-0">
              <ExclamationCircleIcon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-red-900 text-sm sm:text-base">
                {t('Pembaruan Profil Ditolak oleh Admin')}
              </h4>
              <p className="text-xs sm:text-sm text-red-800 mt-1">
                Catatan admin: <span className="font-semibold text-red-950">"{expert.update_reject_reason}"</span>
              </p>
              <p className="text-xs text-red-700/80 mt-1">
                Profil publik Anda tetap tayang dengan data versi lama yang telah disetujui. Anda dapat memperbaiki data dan menyimpannya kembali.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setExpert(prev => ({ ...prev, update_reject_reason: null }))}
              className="text-red-400 hover:text-red-700 p-1"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {profileStatus === 'aktif' && expert?.update_status !== 'menunggu_verifikasi' && (
        <div className="mb-5 bg-[#E3F2E7] border border-[#A7D7B0] rounded-xl p-4 flex items-center gap-3">
          <CheckBadgeIcon className="text-[#2E5E3B] w-5 h-5" strokeWidth={2} />
          <p className="text-sm font-semibold text-[#1C3822]">{t('profile.status.active_notice', 'Profil aktif — setiap perubahan yang Anda lakukan akan ditinjau admin terlebih dahulu sebelum tayang ke publik.')}</p>
        </div>
      )}

      <Alert type="error" msg={err} onClose={() => setErr('')} />
      <Alert type="ok" msg={ok} onClose={() => setOk('')} />
      {/* ── Tab Navigation (Sticky Navbar di Mobile) ────────────────────── */}
      <div className="sticky top-16 z-30 -mx-3.5 sm:-mx-6 px-3.5 sm:px-6 pt-2 pb-2 bg-[#F5F4EF] border-b border-gray-300/90 shadow-sm lg:static lg:top-auto lg:z-auto lg:mx-0 lg:px-0 lg:pt-0 lg:pb-0 lg:bg-transparent lg:border-b lg:border-gray-300/80 lg:shadow-none mb-6 group/tabs transition-all">

        {/* Tab Items Container */}
        <div
          ref={tabsNavRef}
          onMouseDown={handleTabsMouseDown}
          onMouseMove={handleTabsMouseMove}
          onMouseUp={handleTabsMouseUpOrLeave}
          onMouseLeave={handleTabsMouseUpOrLeave}
          className={`relative w-full max-w-full min-w-0 flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 no-scrollbar select-none scroll-smooth ${
            isDraggingTabs ? 'cursor-grabbing' : 'cursor-grab'
          }`}
        >
          {TABS.map((tabItem) => {
            const done = isTabDone(tabItem.id);
            const TabIcon = tabItem.Icon;
            const isActive = tab === tabItem.id;
            return (
              <button
                key={tabItem.id}
                type="button"
                data-tab-active={isActive ? 'true' : undefined}
                onClick={(e) => {
                  if (tabsDragState.current.hasMoved) {
                    e.preventDefault();
                    return;
                  }
                  e.currentTarget.blur();
                  setTab(tabItem.id);
                  if (typeof window !== 'undefined' && window.scrollX !== 0) {
                    window.scrollTo(0, window.scrollY);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-[#2E5E3B] text-white font-bold shadow-xs'
                    : 'bg-white/80 sm:bg-transparent text-[#5B6660] hover:text-[#2E5E3B] hover:bg-[#2E5E3B]/10 border border-gray-200/60 sm:border-transparent'
                }`}
              >
                <TabIcon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isActive ? 'text-white' : 'text-gray-500'}`} strokeWidth={2} />
                <span>{tabItem.label}</span>
                {done && (
                  <CheckCircleIcon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-200' : 'text-[#2E5E3B]'}`} strokeWidth={2.5} />
                )}
              </button>
            );
          })}
        </div>

        {/* Kontrol Panah Geser Menu di Bawah Tab (Tampil di mobile, tablet, dan desktop) */}
        {hasOverflow && (
          <div className="flex items-center justify-between pt-2 pb-1 border-t border-gray-200/70 mt-1.5 px-0.5 select-none">
            <button
              type="button"
              onClick={() => scrollTabs('left')}
              disabled={!canScrollLeft}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                canScrollLeft
                  ? 'bg-white text-[#2E5E3B] border-gray-300 shadow-2xs hover:bg-[#2E5E3B] hover:text-white hover:border-[#2E5E3B] active:scale-95'
                  : 'bg-gray-100 text-gray-400 border-gray-200 opacity-40 cursor-not-allowed'
              }`}
              title={t('profile.scroll_left', 'Geser ke kiri')}
              aria-label={t('profile.scroll_left', 'Geser ke kiri')}
            >
              <ChevronLeftIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" strokeWidth={2.5} />
              <span className="text-[11px] font-semibold">{t('profile.scroll_left_label', 'Geser Kiri')}</span>
            </button>

            <div className="text-[10px] sm:text-[11px] font-medium text-gray-400 select-none flex items-center gap-1.5">
              <span className="text-gray-400 text-xs font-bold">↔</span>
              <span>{t('profile.swipe_menu', 'Geser Menu')}</span>
            </div>

            <button
              type="button"
              onClick={() => scrollTabs('right')}
              disabled={!canScrollRight}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3.5 py-1.5 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                canScrollRight
                  ? 'bg-white text-[#2E5E3B] border-gray-300 shadow-2xs hover:bg-[#2E5E3B] hover:text-white hover:border-[#2E5E3B] active:scale-95'
                  : 'bg-gray-100 text-gray-400 border-gray-200 opacity-40 cursor-not-allowed'
              }`}
              title={t('profile.scroll_right', 'Geser ke kanan')}
              aria-label={t('profile.scroll_right', 'Geser ke kanan')}
            >
              <span className="text-[11px] font-semibold">{t('profile.scroll_right_label', 'Geser Kanan')}</span>
              <ChevronRightIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: DATA PRIBADI                                       */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'pribadi' && (
        <div className="space-y-6 animate-fadeIn">
          <Card>
            <div className="flex items-center gap-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                <IdentificationIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                {t('profile.section.identity', 'Identitas & Profesi')}
              </h3>
              <Tooltip text="Isi data diri lengkap Anda. Nama, institusi, dan bidang keahlian akan ditampilkan di profil publik." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label>{t('profile.field.full_name', 'Nama Lengkap')} *</Label>
                <input className={INPUT} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder={t('profile.placeholder.name', 'Dr. Nama Anda, S.Hut, M.Si')} /></div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <Label>{t('profile.field.phone', 'No. Handphone')} *</Label>
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">lock</span>
                    Rahasia / Tidak Publik
                  </span>
                </div>
                <PhoneInput
                  value={form.phone}
                  onChange={(val) => setForm({ ...form, phone: val })}
                  placeholder="81234567890"
                  required
                />
                <p className="text-[10px] text-emerald-800 font-medium mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[13px] text-emerald-600 shrink-0">verified_user</span>
                  <span>Tidak ditampilkan di publik</span>
                </p>
              </div>
              <div><Label>{t('profile.field.institution', 'Institusi / Perusahaan')}</Label>
                <input className={INPUT} value={form.institution} onChange={e => setForm({ ...form, institution: e.target.value })} placeholder={t('profile.placeholder.institution', 'PSL - IPB University')} /></div>
              <div><Label>{t('profile.field.expertise', 'Bidang Keahlian')}</Label>
                <input className={INPUT} value={form.field} onChange={e => setForm({ ...form, field: e.target.value })} placeholder={t('profile.placeholder.expertise', 'Ahli Kehutanan & Tata Ruang')} /></div>
              <div><Label>{t('profile.field.active_since', 'Aktif Sejak (Tahun)')}<Tooltip text="Tahun mulai berkarir di bidang ini. Dipakai untuk menghitung Tahun Pengalaman di profil publik Anda." /></Label>
                <input type="number" min="1970" max={new Date().getFullYear()} className={INPUT} value={form.active_since} onChange={e => setForm({ ...form, active_since: e.target.value })} placeholder={`cth. ${new Date().getFullYear() - 5}`} /></div>
              <div><Label>{t('profile.field.birth_place', 'Tempat Lahir')}</Label>
                <input className={INPUT} value={form.tempat_lahir} onChange={e => setForm({ ...form, tempat_lahir: e.target.value })} placeholder={t('profile.placeholder.birth_place', 'Jakarta')} /></div>
              <div><Label>{t('profile.field.birth_date', 'Tanggal Lahir')}</Label>
                <input type="date" className={INPUT} value={form.tanggal_lahir} onChange={e => setForm({ ...form, tanggal_lahir: e.target.value })} /></div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                <MapPinIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                {t('profile.section.address', 'Alamat Kantor')}
              </h3>
              <Tooltip text="Alamat Anda bersifat privat dan tidak ditampilkan penuh di profil publik. Kota dan provinsi digunakan untuk pencarian." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><Label>{t('profile.field.full_address', 'Alamat Lengkap')}</Label>
                <textarea className={INPUT + ' min-h-[80px] resize-none'} value={form.alamat_lengkap} onChange={e => setForm({ ...form, alamat_lengkap: e.target.value })} placeholder={t('profile.placeholder.address', 'Jl. Contoh No. 4, Kecamatan...')} /></div>
              <div><Label>{t('profile.field.city', 'Kota / Kabupaten')}</Label>
                <input className={INPUT} value={form.alamat_kota} onChange={e => setForm({ ...form, alamat_kota: e.target.value })} placeholder={t('profile.placeholder.city', 'Kota Bogor')} /></div>
              <div><Label>{t('profile.field.province', 'Provinsi')}</Label>
                <input className={INPUT} value={form.alamat_provinsi} onChange={e => setForm({ ...form, alamat_provinsi: e.target.value })} placeholder={t('profile.placeholder.province', 'Jawa Barat')} /></div>

              {/* Location Picker & Coordinate Inputs (Otomatis & Manual) */}
              <div className="md:col-span-2 mt-2 pt-3 border-t border-outline-variant/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <Label>{t('profile.field.map_location', 'Titik Koordinat & Lokasi Peta (Pencarian Ahli)')}</Label>
                    <p className="text-xs text-[#5B6660]">
                      {t('Tersedia 2 cara: pilih otomatis melalui peta atau ketik angka koordinat secara manual.')}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openMapPicker}
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8B4513]/10 hover:bg-[#8B4513]/20 text-[#8B4513] text-xs font-bold rounded-lg transition-colors"
                  >
                    <MapIcon className="w-4 h-4" strokeWidth={2} />
                    {form.lat && form.lng ? t('profile.change_map_location', 'Buka / Tinjau di Peta') : t('profile.select_map_location', 'Pilih Lokasi di Peta')}
                  </button>
                </div>

                <div className="bg-[#F8F9FA] p-3.5 rounded-xl border border-outline-variant/30 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#414844]/70">Latitude (Garis Lintang)</span>
                        <span className="text-[11px] text-gray-400 font-medium">Manual / Otomatis</span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        className={INPUT}
                        value={form.lat || ''}
                        onChange={e => handleManualCoordChange('lat', e.target.value)}
                        placeholder="cth. -6.208800"
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[#414844]/70">Longitude (Garis Bujur)</span>
                        <span className="text-[11px] text-gray-400 font-medium">Manual / Otomatis</span>
                      </div>
                      <input
                        type="number"
                        step="any"
                        className={INPUT}
                        value={form.lng || ''}
                        onChange={e => handleManualCoordChange('lng', e.target.value)}
                        placeholder="cth. 106.845600"
                      />
                    </div>
                  </div>

                  {form.lat && form.lng ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200/60 text-xs text-[#2E5E3B]">
                      <div className="flex items-center gap-1.5">
                        <CheckCircleIcon className="w-4 h-4 text-[#2E5E3B] shrink-0" strokeWidth={2} />
                        <span>Titik koordinat aktif: <strong>{parseFloat(form.lat).toFixed(6)}</strong>, <strong>{parseFloat(form.lng).toFixed(6)}</strong></span>
                        {form.location && <span className="text-gray-400 hidden sm:inline">• {form.location}</span>}
                      </div>
                      <button
                        type="button"
                        onClick={() => setForm(prev => ({ ...prev, lat: '', lng: '' }))}
                        className="text-xs text-red-500 hover:text-red-700 underline font-medium"
                      >
                        Reset Koordinat
                      </button>
                    </div>
                  ) : (
                    <p className="text-[11px] text-gray-500 italic">
                      * Tips: Anda bisa mengisi angka koordinat langsung di atas atau klik tombol <strong>"Pilih Lokasi di Peta"</strong> untuk menandai titik di peta secara visual.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                <ClipboardDocumentCheckIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                {t('profile.section.professional_criteria', 'Kriteria Profesional')}
              </h3>
              <Tooltip text="Pilih satu atau lebih kriteria yang menggambarkan peran profesional Anda. Kriteria ini membantu klien menemukan Anda di direktori." />
            </div>
            <p className="text-sm text-gray-600 mb-4">{t('profile.criteria_note', 'Sama seperti yang diisi saat pendaftaran — pilih semua yang sesuai.')}</p>
            
            {(() => {
              const isCurrentlyTenagaAhli = Boolean(
                expert?.is_tenaga_ahli ||
                expert?.role_type === 'tenaga_ahli' ||
                expert?.user?.role_type === 'tenaga_ahli' ||
                expert?.kriteria === 'Tenaga Ahli' ||
                (Array.isArray(expert?.kriteria_list) && expert.kriteria_list.some(k => String(k).toLowerCase().includes('tenaga ahli')))
              );

              const isTenagaAhliPending = Boolean(
                expert?.update_status === 'menunggu_verifikasi' &&
                expert?.pending_changes?.kriteria_list &&
                Array.isArray(expert.pending_changes.kriteria_list) &&
                expert.pending_changes.kriteria_list.some(k => String(k).toLowerCase().includes('tenaga ahli')) &&
                !isCurrentlyTenagaAhli
              );

              return (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {KRITERIA_OPTIONS.map((option) => (
                      <label
                        key={option}
                        className={`flex items-center gap-3 px-4 py-3 rounded-lg border-2 cursor-pointer transition-all ${kriteriaList.includes(option)
                            ? 'border-[#2E5E3B] bg-[#2E5E3B]/5'
                            : 'border-outline-variant/40 hover:border-[#2E5E3B]/30'
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={kriteriaList.includes(option)}
                          onChange={() => toggleKriteria(option)}
                          className="accent-[#2E5E3B] w-4 h-4 shrink-0"
                        />
                        <div className="flex flex-col min-w-0">
                          <span className={`text-sm ${kriteriaList.includes(option) ? 'text-[#2E5E3B] font-semibold' : 'text-[#414844]'}`}>
                            {option}
                          </span>
                          {option === 'Tenaga Ahli' && isTenagaAhliPending && (
                            <span className="text-[10px] text-amber-700 font-bold flex items-center gap-1 mt-0.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                              Menunggu Verifikasi Admin
                            </span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>

                  {/* Banner pemberitahuan jika Surveyor / Tenaga Teknis ingin menjadi Tenaga Ahli */}
                  {!isCurrentlyTenagaAhli && kriteriaList.includes('Tenaga Ahli') && (
                    <div className="mt-3.5 p-3.5 bg-amber-50/90 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-start gap-2.5">
                      <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" strokeWidth={2} />
                      <div className="leading-relaxed space-y-1">
                        <p className="font-bold text-amber-900">
                          Pemberitahuan Perubahan ke Tenaga Ahli:
                        </p>
                        <p>
                          Mencentang <strong>Tenaga Ahli</strong> memerlukan peninjauan dan konfirmasi Admin. Setelah disetujui Admin:
                        </p>
                        <ul className="list-disc list-inside space-y-0.5 text-amber-900 font-medium pl-1">
                          <li>Peran akun Anda resmi beralih menjadi <strong>Tenaga Ahli</strong>.</li>
                          <li>Jika saat ini Anda memiliki paket berbayar (Ekonomis/Eksklusif) untuk Surveyor/Tenaga Teknis, paket sebelumnya akan direset dan Anda perlu membayar kembali dengan tarif paket Tenaga Ahli.</li>
                          <li>Harga paket membership Anda akan beralih ke tarif Tenaga Ahli.</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* Banner informasi jika Tenaga Ahli memilih Surveyor / Tenaga Teknis */}
                  {isCurrentlyTenagaAhli && (
                    <div className="mt-3.5 p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                      <InformationCircleIcon className="w-5 h-5 text-[#2E5E3B] shrink-0 mt-0.5" strokeWidth={2} />
                      <p className="leading-relaxed">
                        Sebagai <strong>Tenaga Ahli</strong>, Anda dapat memilih kriteria tambahan (misalnya Surveyor atau Tenaga Teknis). Profil Anda akan langsung muncul di mesin pencarian untuk semua kriteria yang Anda pilih, dan paket membership Anda tetap menggunakan tarif Tenaga Ahli.
                      </p>
                    </div>
                  )}

                  {!isCurrentlyTenagaAhli && !kriteriaList.includes('Tenaga Ahli') && (
                    <div className="mt-3.5 p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                      <InformationCircleIcon className="w-5 h-5 text-[#2E5E3B] shrink-0 mt-0.5" strokeWidth={2} />
                      <p className="leading-relaxed">
                        {t('Anda dapat memilih lebih dari satu kriteria (misalnya sekaligus Tenaga Ahli dan Tenaga Teknis). Dokumen sertifikasi keahlian yang Anda unggah di menu Sertifikat akan menjadi penentu kesesuaian kriteria profesional yang Anda pilih.')}
                      </p>
                    </div>
                  )}
                </>
              );
            })()}
          </Card>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
            <button 
              className={`${BTN_PRIMARY} w-full sm:w-auto justify-center py-2.5 shadow-sm`} 
              onClick={goNext}
              disabled={saving}
            >
              {saving ? (
                <>
                  <Spinner />
                  <span>{t('Menyimpan...')}</span>
                </>
              ) : (
                <>
                  <span>{t('profile.wizard.continue_to', 'Lanjut ke')} {TABS[1]?.label}</span>
                  <ArrowRightIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: DOKUMEN & FOTO                                     */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'dokumen' && (
        <div className="space-y-6 animate-fadeIn">
          {/* ── Foto Profil ─────────────────────────────────── */}
          <Card>
            <div className="flex items-center gap-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                <CameraIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                {t('Foto Profil')}
              </h3>
              <Tooltip text="Upload foto formal dengan wajah terlihat jelas. Foto ini akan ditampilkan di profil publik dan direktori pencarian." />
            </div>
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 text-center sm:text-left">
              <button
                onClick={() => setPhotoModal(true)}
                className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#2E5E3B]/20 bg-[#F5F4F0] flex items-center justify-center shrink-0 hover:opacity-80 hover:scale-105 transition-all cursor-pointer shadow-xs"
              >
                {photoPreview
                  ? <img src={photoPreview} alt="Foto profil" className="w-full h-full object-cover" />
                  : <UserIcon className="w-10 h-10 text-[#5B6660]/40" strokeWidth={1.5} />}
              </button>
              <div className="flex flex-col gap-3 flex-1 w-full">
                <div>
                  <p className="text-xs font-semibold text-[#1F2A22] mb-1">{t('Panduan Foto Profil:')}</p>
                  <ul className="text-xs text-[#5B6660] list-disc list-inside space-y-0.5 text-left max-w-md mx-auto sm:mx-0">
                    <li>{t('Format JPG atau PNG, maksimal 5MB')}</li>
                    <li>{t('Gunakan foto formal dengan latar polos')}</li>
                    <li>{t('Wajah terlihat jelas dan profesional')}</li>
                    <li><strong>{t('Klik foto')}</strong> {t('untuk mengganti, melihat, atau menghapus')}</li>
                  </ul>
                </div>
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  ref={photoRef}
                  onChange={handlePhotoChange}
                />
                {photoFile && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-xs text-[#5B6660] bg-[#F5F4F0] px-3 py-2 rounded-lg">
                      <CheckCircleIcon className="w-4 h-4" strokeWidth={2} />
                      <span className="flex-1 truncate">{t('Foto siap diupload ·')} {(photoFile.size / 1024).toFixed(0)} KB</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        className={BTN_PRIMARY}
                        disabled={saving}
                        onClick={() => uploadDoc(
                          photoFile,
                          'foto_profil',
                          'Pas Foto Formal',
                          () => {
                            setPhotoFile(null);
                            if (photoRef.current) photoRef.current.value = '';
                          }
                        )}
                      >
                        {saving ? <Spinner /> : <CloudArrowUpIcon className="w-4 h-4" strokeWidth={2} />}
                        {saving ? t('Mengunggah...') : t('Upload Foto')}
                      </button>
                      <button
                        className={BTN_DANGER}
                        onClick={() => {
                          setPhotoFile(null);
                          setPreview(expert?.photo ? getFileUrl(expert.photo) : null);
                          if (photoRef.current) photoRef.current.value = '';
                        }}
                      >
                        <XMarkIcon className="w-4 h-4" strokeWidth={2} />
                        {t('Batal')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* ── Foto Cover / Background ────────────────────── */}
          <Card>
            <div className="flex items-center gap-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                <PhotoIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                {t('Foto Cover / Background')}
              </h3>
              <Tooltip text="Foto cover ditampilkan sebagai banner di bagian atas profil publik Anda. Gunakan rasio 3.5:1 (landscape) untuk hasil terbaik." />
            </div>
            <div className="space-y-4">
              {coverPreview ? (
                <div className="relative w-full rounded-xl overflow-hidden border-2 border-[#8B4513]/20">
                  {/* Preview with same aspect ratio as ProfilAhli (3.5:1) */}
                  <div className="aspect-[3.5/1] w-full">
                    <img src={coverPreview} alt="Foto cover" className="w-full h-full object-cover" />
                  </div>
                  <button
                    onClick={deleteCover}
                    disabled={saving}
                    className="absolute top-3 right-3 bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow-lg transition-colors disabled:opacity-50"
                    title={t('Hapus foto cover')}
                  >
                    <TrashIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                  </button>
                  {/* Preview label */}
                  <div className="absolute bottom-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
                    {t('cover.preview_label', 'Preview: Rasio 3.5:1 seperti di profil ahli')}
                  </div>
                </div>
              ) : (
                /* Empty state placeholder showing aspect ratio */
                <div className="relative w-full rounded-xl border-2 border-dashed border-gray-300 bg-gray-50">
                  <div className="aspect-[3.5/1] w-full flex items-center justify-center">
                    <div className="text-center">
                      <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" strokeWidth={1.5} />
                      <p className="text-sm text-gray-600 font-medium">{t('cover.placeholder_title', 'Belum ada foto cover')}</p>
                      <p className="text-xs text-gray-500 mt-1">{t('cover.placeholder_desc', 'Rasio 3.5:1 (landscape)')}</p>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold text-[#1F2A22] mb-1">{t('cover.guide_title', 'Panduan Foto Cover:')}</p>
                <ul className="text-xs text-[#5B6660] list-disc list-inside space-y-0.5">
                  <li>{t('cover.guide_format', 'Format JPG atau PNG, maksimal 5MB')}</li>
                  <li>{t('cover.guide_dimensions', 'Rasio 3.5:1 (landscape) - akan otomatis dipotong sesuai rasio')}</li>
                  <li>{t('cover.guide_quality', 'Gunakan foto yang profesional dan relevan dengan keahlian Anda')}</li>
                  <li>{t('cover.guide_display', 'Foto ini akan ditampilkan di halaman profil ahli dengan ukuran responsif')}</li>
                  <li>{t('cover.guide_cropper', 'Setelah memilih foto, Anda dapat menyesuaikan posisi dan zoom')}</li>
                </ul>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap gap-2 items-center">
                  <label className={BTN_GHOST + ' cursor-pointer'}>
                    <ArrowUpTrayIcon className="w-4 h-4" strokeWidth={2} />
                    {coverPreview ? t('cover.change_button', 'Ganti Foto Cover') : t('cover.select_button', 'Pilih Foto Cover')}
                    <input
                      type="file"
                      accept="image/jpeg,image/jpg,image/png"
                      className="hidden"
                      ref={coverRef}
                      onChange={handleCoverChange}
                    />
                  </label>

                  {coverFile && (
                    <>
                      <button
                        className={BTN_PRIMARY}
                        disabled={saving}
                        onClick={uploadCover}
                      >
                        {saving ? <Spinner /> : <CloudArrowUpIcon className="w-4 h-4" strokeWidth={2} />}
                        {saving ? t('Mengunggah...') : t('Upload Cover')}
                      </button>
                      <button
                        className={BTN_DANGER}
                        onClick={() => {
                          setCoverFile(null);
                          setCoverPreview(expert?.cover ? getFileUrl(expert.cover) : null);
                          if (coverRef.current) coverRef.current.value = '';
                        }}
                      >
                        <XMarkIcon className="w-4 h-4" strokeWidth={2} />
                        {t('Batal')}
                      </button>
                    </>
                  )}
                </div>

                {coverFile && (
                  <div className="flex items-center gap-2 text-xs text-[#5B6660] bg-[#F5F4F0] px-3 py-2 rounded-lg">
                    <PhotoIcon className="w-4 h-4 text-[#8B4513]" strokeWidth={2} />
                    <span className="flex-1 truncate">{coverFile.name}</span>
                    <span className="font-semibold">{(coverFile.size / 1024).toFixed(0)} KB</span>
                  </div>
                )}
              </div>
            </div>
          </Card>

          {/* ── Bukti Keahlian/Ijazah & Riwayat Pendidikan ────────────────────────────── */}
          <Card>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                  <CheckBadgeIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                  {t('Bukti Keahlian/Ijazah')}
                </h3>
                <Tooltip text={t('Tambahkan riwayat pendidikan formal Anda dan lampirkan dokumen scan sertifikat ijazah untuk verifikasi keahlian.')} />
              </div>
              {!addingEdu && !editEdu && (
                <button
                  type="button"
                  className={BTN_GHOST + ' text-xs sm:text-sm py-1.5 px-3'}
                  onClick={() => {
                    setAddingEdu(true);
                    setEduIjazahFile(null);
                  }}
                >
                  <PlusCircleIcon className="w-4 h-4" strokeWidth={2} />
                  {t('Tambah Pendidikan & Ijazah')}
                </button>
              )}
            </div>

            {/* Tips Keamanan (Watermark) */}
            <div className="mb-3 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs text-amber-900">
              <ShieldCheckIcon className="w-4 h-4 text-amber-700 shrink-0" strokeWidth={2} />
              <span>{t('Tips Keamanan: Anda disarankan memberikan watermark (misal: "HANYA UNTUK VERIFIKASI TENAGAAHLI.COM") pada scan sertifikat ijazah untuk menghindari penyalahgunaan. Dokumen ini hanya untuk verifikasi, tidak kami publikasikan.')}</span>
            </div>

            <p className="text-xs text-[#5B6660] mb-3">
              {t('Tulis riwayat pendidikan formal Anda dari jenjang tertinggi (contoh: S3, S2, lalu S1) dan sertakan file scan ijazah (PDF/JPG/PNG/DOC, maksimal 5MB).')}
            </p>

            {/* Daftar Riwayat Pendidikan Tersimpan */}
            {educations.length === 0 && !addingEdu && (
              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300 text-center text-sm text-[#5B6660] mb-3">
                {t('Belum ada data riwayat pendidikan & ijazah.')}
              </div>
            )}

            <div className="space-y-3 mb-3">
              {educations.map((e) => (
                <div key={e.id} className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-2xs hover:border-[#2E5E3B]/30 transition-all">
                  {editEdu?.id === e.id ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-[#2E5E3B] uppercase tracking-wider">{t('Edit Riwayat Pendidikan & Ijazah')}</p>
                        <button
                          type="button"
                          className="text-xs text-gray-500 hover:text-gray-700"
                          onClick={() => {
                            setEditEdu(null);
                            setEditEduIjazahFile(null);
                          }}
                        >
                          ✕ {t('Batal')}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div>
                          <Label>{t('Jenjang *')}</Label>
                          <input
                            list="jenjang-options"
                            className={INPUT}
                            value={editEdu.jenjang}
                            onChange={v => setEditEdu({ ...editEdu, jenjang: v.target.value })}
                            placeholder={t('cth. S3 - Doktor, S2 - Magister, S1 - Sarjana')}
                          />
                          <p className="text-[11px] text-gray-500 mt-1">
                            {t('* Tulis pendidikan dari yang tertinggi')}
                          </p>
                        </div>
                        <div>
                          <Label>{t('Institusi *')}</Label>
                          <input
                            className={INPUT}
                            value={editEdu.institusi}
                            onChange={v => setEditEdu({ ...editEdu, institusi: v.target.value })}
                            placeholder={t('Nama Universitas / Sekolah')}
                          />
                        </div>
                        <div>
                          <Label>{t('Jurusan / Program Studi')}</Label>
                          <input
                            className={INPUT}
                            value={editEdu.jurusan || ''}
                            onChange={v => setEditEdu({ ...editEdu, jurusan: v.target.value })}
                            placeholder={t('Ilmu Lingkungan / Teknik')}
                          />
                        </div>
                        <div>
                          <Label>{t('Tahun Lulus')}</Label>
                          <input
                            type="number"
                            className={INPUT}
                            value={editEdu.tahun_lulus || ''}
                            onChange={v => setEditEdu({ ...editEdu, tahun_lulus: v.target.value })}
                            placeholder="2018"
                          />
                        </div>
                      </div>

                      {/* File Ijazah Edit */}
                      <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 space-y-2">
                        <Label>{t('Scan / File Ijazah * (Wajib, PDF/JPG/PNG/DOC, maks. 5MB)')}</Label>
                        
                        {e.ijazah_path && !editEduIjazahFile && (
                          <div className="flex items-center justify-between gap-2 p-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <CheckCircleIcon className="w-4 h-4 text-emerald-600 shrink-0" strokeWidth={2} />
                              <span className="font-semibold">{t('Ijazah tersimpan:')}</span>
                              <span className="truncate max-w-xs">{e.ijazah_path.split('/').pop()}</span>
                            </div>
                            <a
                              href={getFileUrl(e.ijazah_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-[#2E5E3B] hover:underline flex items-center gap-1 shrink-0"
                            >
                              <EyeIcon className="w-3.5 h-3.5" strokeWidth={2} />
                              {t('Lihat')}
                            </a>
                          </div>
                        )}

                        <div className="flex flex-wrap items-center gap-2">
                          <label className={BTN_GHOST + ' cursor-pointer text-xs py-1.5 px-3'}>
                            <ArrowUpTrayIcon className="w-3.5 h-3.5" strokeWidth={2} />
                            {editEduIjazahFile || e.ijazah_path ? t('Ganti File Ijazah') : t('Pilih File Ijazah')}
                            <input
                              type="file"
                              accept=".pdf,image/*,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf"
                              className="hidden"
                              ref={editEduIjazahRef}
                              onClick={(ev) => { ev.target.value = null; }}
                              onChange={(ev) => {
                                const f = ev.target.files?.[0];
                                if (f) {
                                  if (f.size > 5 * 1024 * 1024) {
                                    flash('err', t('Ukuran file maksimal 5MB.'));
                                    return;
                                  }
                                  setEditEduIjazahFile(f);
                                }
                              }}
                            />
                          </label>
                          {editEduIjazahFile && (
                            <button
                              type="button"
                              className={BTN_DANGER + ' text-xs py-1.5 px-2.5'}
                              onClick={() => {
                                setEditEduIjazahFile(null);
                                if (editEduIjazahRef.current) editEduIjazahRef.current.value = '';
                              }}
                            >
                              <XMarkIcon className="w-3.5 h-3.5" strokeWidth={2} />
                              {t('Batal Ganti')}
                            </button>
                          )}
                        </div>

                        {editEduIjazahFile && (
                          <div className="flex items-center gap-2 text-xs text-[#5B6660] bg-white px-2.5 py-1.5 rounded-lg border border-gray-200">
                            {editEduIjazahFile.type?.includes('pdf') || editEduIjazahFile.name?.toLowerCase().endsWith('.pdf')
                              ? <DocumentIcon className="w-4 h-4 text-red-600 shrink-0" strokeWidth={2} />
                              : <PhotoIcon className="w-4 h-4 text-[#2E5E3B] shrink-0" strokeWidth={2} />}
                            <span className="flex-1 truncate font-medium">{editEduIjazahFile.name}</span>
                            <span className="font-semibold">{(editEduIjazahFile.size / 1024).toFixed(0)} KB</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button className={BTN_PRIMARY} onClick={() => updateEdu(e.id)} disabled={saving}>
                          {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                          {saving ? t('Menyimpan...') : t('Simpan')}
                        </button>
                        <button
                          className={BTN_GHOST}
                          onClick={() => {
                            setEditEdu(null);
                            setEditEduIjazahFile(null);
                          }}
                        >
                          {t('Batal')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-[#1F2A22] text-sm">{e.jenjang} — {e.institusi}</span>
                          {e.tahun_lulus && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-[#5B6660] font-medium">
                              {t('Lulus')} {e.tahun_lulus}
                            </span>
                          )}
                        </div>
                        {e.jurusan && <p className="text-xs text-[#5B6660] font-medium">{e.jurusan}</p>}
                        
                        {/* Status Ijazah */}
                        {e.ijazah_path ? (
                          <div className="inline-flex items-center gap-2 mt-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                            <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-600 shrink-0" strokeWidth={2} />
                            <span className="truncate max-w-[220px] font-medium">{e.ijazah_path.split('/').pop()}</span>
                            <a
                              href={getFileUrl(e.ijazah_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 text-[#2E5E3B] font-bold hover:underline flex items-center gap-1"
                            >
                              <EyeIcon className="w-3.5 h-3.5" strokeWidth={2} />
                              {t('Lihat Ijazah')}
                            </a>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 mt-0.5 text-xs text-red-600 font-semibold bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                            <ExclamationTriangleIcon className="w-3.5 h-3.5 text-red-600 shrink-0" strokeWidth={2} />
                            {t('Scan ijazah belum diunggah (Wajib)')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                        <button
                          className={BTN_GHOST + ' !py-1 !px-2.5 text-xs'}
                          onClick={() => {
                            setEditEdu({ ...e });
                            setEditEduIjazahFile(null);
                            setAddingEdu(false);
                          }}
                        >
                          <PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          {t('Edit')}
                        </button>
                        <button
                          className={BTN_DANGER + ' !py-1 !px-2 text-xs'}
                          onClick={() => deleteEdu(e.id)}
                        >
                          <TrashIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          {t('Hapus')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Form Tambah Pendidikan & Ijazah Baru */}
            {addingEdu && (
              <div className="p-4 bg-gray-50/70 border-2 border-dashed border-[#2E5E3B]/30 rounded-xl space-y-3 mb-2">
                <div className="flex items-center gap-1.5">
                  <PlusCircleIcon className="w-4 h-4 text-[#2E5E3B]" strokeWidth={2} />
                  <p className="text-xs font-bold text-[#2E5E3B] uppercase tracking-wider">{t('Tambah Pendidikan & Ijazah Baru')}</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{t('Jenjang *')}</Label>
                    <input
                      list="jenjang-options"
                      className={INPUT}
                      value={newEdu.jenjang}
                      onChange={v => setNewEdu({ ...newEdu, jenjang: v.target.value })}
                      placeholder={t('cth. S3 - Doktor, S2 - Magister, S1 - Sarjana')}
                    />
                    <p className="text-[11px] text-gray-500 mt-1">
                      {t('* Tulis pendidikan dari yang tertinggi')}
                    </p>
                    <datalist id="jenjang-options">
                      <option value="S3 - Doktor" />
                      <option value="S2 - Magister" />
                      <option value="S1 - Sarjana" />
                      <option value="Profesi" />
                      <option value="Spesialis" />
                      <option value="D4 - Sarjana Terapan" />
                      <option value="D3 - Diploma" />
                      <option value="SMA / SMK" />
                    </datalist>
                  </div>
                  <div>
                    <Label>{t('Institusi *')}</Label>
                    <input
                      className={INPUT}
                      value={newEdu.institusi}
                      onChange={v => setNewEdu({ ...newEdu, institusi: v.target.value })}
                      placeholder={t('Nama Universitas / Sekolah')}
                    />
                  </div>
                  <div>
                    <Label>{t('Jurusan / Program Studi')}</Label>
                    <input
                      className={INPUT}
                      value={newEdu.jurusan}
                      onChange={v => setNewEdu({ ...newEdu, jurusan: v.target.value })}
                      placeholder={t('Ilmu Lingkungan / Teknik')}
                    />
                  </div>
                  <div>
                    <Label>{t('Tahun Lulus')}</Label>
                    <input
                      type="number"
                      className={INPUT}
                      value={newEdu.tahun_lulus}
                      onChange={v => setNewEdu({ ...newEdu, tahun_lulus: v.target.value })}
                      placeholder="2018"
                    />
                  </div>
                </div>

                {/* File Upload Ijazah Baru */}
                <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{t('Upload Scan Sertifikat Ijazah * (PDF/JPG/PNG/DOC, maks. 5MB)')}</Label>
                    <span className="text-[11px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                      {t('Wajib')}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className={BTN_GHOST + ' cursor-pointer text-xs py-1.5 px-3'}>
                      <ArrowUpTrayIcon className="w-3.5 h-3.5" strokeWidth={2} />
                      {eduIjazahFile ? t('Ganti File Ijazah') : t('Pilih File Ijazah')}
                      <input
                        type="file"
                        accept=".pdf,image/*,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf"
                        className="hidden"
                        ref={eduIjazahRef}
                        onClick={(ev) => { ev.target.value = null; }}
                        onChange={(ev) => {
                          const f = ev.target.files?.[0];
                          if (f) {
                            if (f.size > 5 * 1024 * 1024) {
                              flash('err', t('Ukuran file maksimal 5MB.'));
                              return;
                            }
                            setEduIjazahFile(f);
                          }
                        }}
                      />
                    </label>
                    {eduIjazahFile && (
                      <button
                        type="button"
                        className={BTN_DANGER + ' text-xs py-1.5 px-2.5'}
                        onClick={() => {
                          setEduIjazahFile(null);
                          if (eduIjazahRef.current) eduIjazahRef.current.value = '';
                        }}
                      >
                        <XMarkIcon className="w-3.5 h-3.5" strokeWidth={2} />
                        {t('Batal Pilih')}
                      </button>
                    )}
                  </div>

                  {eduIjazahFile && (
                    <div className="flex items-center gap-2 text-xs text-[#5B6660] bg-[#F5F4F0] px-2.5 py-1.5 rounded-lg border border-gray-200">
                      {eduIjazahFile.type?.includes('pdf') || eduIjazahFile.name?.toLowerCase().endsWith('.pdf')
                        ? <DocumentIcon className="w-4 h-4 text-red-600 shrink-0" strokeWidth={2} />
                        : <PhotoIcon className="w-4 h-4 text-[#2E5E3B] shrink-0" strokeWidth={2} />}
                      <span className="flex-1 truncate font-medium">{eduIjazahFile.name}</span>
                      <span className="font-semibold">{(eduIjazahFile.size / 1024).toFixed(0)} KB</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-1">
                  <button className={BTN_PRIMARY} onClick={addEdu} disabled={saving}>
                    {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                    {saving ? t('Menyimpan...') : t('Simpan Pendidikan & Ijazah')}
                  </button>
                  <button
                    className={BTN_GHOST}
                    onClick={() => {
                      setAddingEdu(false);
                      setEduIjazahFile(null);
                    }}
                  >
                    {t('Batal')}
                  </button>
                </div>
              </div>
            )}
          </Card>

           {/* ── Bukti Kompetensi ────────────────────────────── */}
          <Card>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                <CheckBadgeIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                {t('Bukti Keahlian/Kompetensi')}
              </h3>
              
              <Tooltip text="Upload sertifikat, ijazah, atau dokumen pendukung lainnya (PDF/JPG/PNG/DOC, maks. 5MB)." />
            </div>

            {/* Pemberitahuan Tidak Wajib Diisi */}
           
            <div className="mb-3 p-2.5 bg-amber-50/80 border border-amber-200/80 rounded-xl flex items-center gap-2 text-xs text-amber-900">
              <ShieldCheckIcon className="w-4 h-4 text-amber-700 shrink-0" strokeWidth={2} />
              <span>{t('Tips Keamanan: Anda disarankan memberikan watermark (misal: "HANYA UNTUK VERIFIKASI TENAGAAHLI.COM")  pada scan sertifikat kompetensi untuk menghindari penyalahgunaan. Dokumen ini hanya untuk verifikasi, tidak kami publikasikan.')}</span>
            </div>

            <p className="text-xs text-[#5B6660] mb-3">{t('Sertifikat kompetensi atau dokumen pendukung lainnya (PDF/JPG/PNG/DOC, maksimal 5MB).')}</p>
            
            {/* Existing uploaded Bukti Kompetensi */}
            {expert?.bukti_kompetensi_path && !buktiFile && (
              <div className="mb-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircleIcon className="w-5 h-5 text-emerald-600 shrink-0" strokeWidth={2} />
                  <div>
                    <p className="text-xs font-semibold text-emerald-900">{t('Bukti kompetensi tersimpan')}</p>
                    <p className="text-[11px] text-emerald-700 truncate max-w-xs">{expert.bukti_kompetensi_path.split('/').pop()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={getFileUrl(expert.bukti_kompetensi_path)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-[#2E5E3B] bg-white border border-[#2E5E3B]/30 hover:bg-[#2E5E3B]/5 transition-colors shadow-sm"
                  >
                    <EyeIcon className="w-3.5 h-3.5" strokeWidth={2} />
                    {t('Lihat Bukti')}
                  </a>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2 items-center">
                <label className={BTN_GHOST + ' cursor-pointer inline-flex items-center gap-2'}>
                  <ArrowUpTrayIcon className="w-4 h-4" strokeWidth={2} />
                  {expert?.bukti_kompetensi_path ? t('Ganti Bukti Kompetensi') : t('Pilih Bukti Kompetensi')}
                  <input
                    type="file"
                    accept=".pdf,image/*,.jpg,.jpeg,.png,.webp,.doc,.docx,application/pdf"
                    className="hidden"
                    ref={buktiRef}
                    onClick={(e) => { e.target.value = null; }}
                    onChange={handleBuktiChange}
                  />
                </label>
                {buktiFile && (
                  <>
                    <button
                      className={BTN_PRIMARY}
                      disabled={saving}
                      onClick={() => uploadDoc(
                        buktiFile,
                        'bukti_kompetensi',
                        'Bukti Kompetensi',
                        () => {
                          setBuktiFile(null);
                          setBuktiFileName('');
                          if (buktiRef.current) buktiRef.current.value = '';
                        }
                      )}
                    >
                      {saving ? <Spinner /> : <CloudArrowUpIcon className="w-4 h-4" strokeWidth={2} />}
                      {saving ? t('Mengunggah...') : t('Upload Bukti')}
                    </button>
                    <button
                      className={BTN_DANGER}
                      onClick={() => {
                        setBuktiFile(null);
                        setBuktiFileName('');
                        if (buktiRef.current) buktiRef.current.value = '';
                      }}
                    >
                      <XMarkIcon className="w-4 h-4" strokeWidth={2} />
                      {t('Batal')}
                    </button>
                  </>
                )}
              </div>
              {buktiFile && (
                <div className="flex items-center gap-2 text-xs text-[#5B6660] bg-[#F5F4F0] px-3 py-2 rounded-lg border border-neutral-200">
                  {buktiFile.type?.includes('pdf') || buktiFileName?.toLowerCase().endsWith('.pdf')
                    ? <DocumentIcon className="w-4 h-4 text-red-600" strokeWidth={2} />
                    : <PhotoIcon className="w-4 h-4 text-[#2E5E3B]" strokeWidth={2} />}
                  <span className="flex-1 truncate font-medium">{buktiFileName}</span>
                  <span className="font-semibold">{(buktiFile.size / 1024).toFixed(0)} KB</span>
                </div>
              )}
            </div>
          </Card>


          {/* ── Sosial Media ────────────────────────────────── */}
          <Card>
            <div className="flex items-center gap-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                <LinkIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                {t('Sosial Media')}
              </h3>
              <Tooltip text="Tambahkan link sosial media Anda. Akan ditampilkan sebagai ikon di profil publik." />
            </div>
            <div className="space-y-4">
              {[
                { key: 'instagram', label: 'Instagram',     placeholder: 'https://www.instagram.com/username' },
                { key: 'facebook',  label: 'Facebook',      placeholder: 'https://www.facebook.com/username' },
                { key: 'youtube',   label: 'YouTube',       placeholder: 'https://www.youtube.com/@channel' },
                { key: 'twitter',   label: 'Twitter / X',   placeholder: 'https://twitter.com/username' },
              ].map(({ key, label, placeholder }) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#2E5E3B]/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px] text-[#2E5E3B]">link</span>
                  </div>
                  <div className="flex-1">
                    <Label>{label}</Label>
                    <input
                      type="url"
                      className={INPUT}
                      value={sosialForm[key]}
                      onChange={e => setSosialForm({ ...sosialForm, [key]: e.target.value })}
                      placeholder={placeholder}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button className={BTN_PRIMARY} onClick={saveSosial} disabled={saving}>
                {saving ? <Spinner /> : null}
                {saving ? t('Menyimpan...') : t('Simpan Sosial Media')}
              </button>
            </div>
          </Card>

          {/* ── Daftar Dokumen Tersimpan ─────────────────────── */}
          {documents.length > 0 ? (
            <Card>
              <SectionTitle icon={FolderOpenIcon}>{t('Dokumen Tersimpan')} ({documents.length})</SectionTitle>
              <ul className="divide-y divide-outline-variant/20">
                {documents.map((doc) => {
                  const DocIcon = DOC_TYPE_ICON[doc.type] || DocumentTextIcon;
                  return (
                    <li key={doc.id} className="flex items-center justify-between py-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-lg bg-[#2E5E3B]/10 flex items-center justify-center shrink-0">
                          <DocIcon className="w-5 h-5 text-[#2E5E3B]" strokeWidth={2} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-sm font-semibold text-[#1F2A22] truncate">
                              {doc.label || DOC_TYPE_LABEL[doc.type] || doc.type}
                            </p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-[#5B6660] bg-[#F5F4F0] px-2 py-0.5 rounded-full shrink-0">
                              {DOC_TYPE_LABEL[doc.type] || doc.type}
                            </span>
                          </div>
                          {doc.file_path && (
                            <a
                              href={getFileUrl(doc.file_path)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-[#6B3410] hover:underline inline-flex items-center gap-1 font-medium"
                            >
                              <EyeIcon className="w-[14px] h-[14px]" strokeWidth={2} />
                              {t('Lihat & Unduh File')}
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        className={BTN_DANGER}
                        onClick={() => deleteDoc(doc.id)}
                        title={t('Hapus dokumen')}
                      >
                        <TrashIcon className="w-4 h-4" strokeWidth={2} />
                        {t('Hapus')}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Card>
          ) : (
            <Card>
              <div className="text-center py-8">
                <div className="w-16 h-16 rounded-full bg-[#F5F4F0] flex items-center justify-center mx-auto mb-3">
                  <FolderOpenIcon className="w-8 h-8 text-[#5B6660]/40" strokeWidth={1.5} />
                </div>
                <p className="text-sm text-[#5B6660] mb-1">{t('Belum ada dokumen tersimpan')}</p>
                <p className="text-xs text-[#5B6660]/70">{t('Upload foto profil atau dokumen pendukung di atas')}</p>
              </div>
            </Card>
          )}

          <WizardNav onBack={goPrev} onNext={goNext} nextLabel={`${t('profile.wizard.continue_to', 'Lanjut ke')} ${TABS[currentTabIdx + 1]?.label}`} t={t} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: PROFIL BIO                                         */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'profil-bio' && (
        <div className="space-y-6 animate-fadeIn">
          <Card>
            <div className="flex items-center gap-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                <DocumentTextIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                {t('Profil Bio')}
              </h3>
              <Tooltip text="Tulis ringkasan singkat tentang keahlian dan pengalaman Anda. Bio yang menarik meningkatkan peluang klien memilih Anda." />
            </div>
            <div className="space-y-4">
              <div>
                <Label>{t('Tentang Saya')}</Label>
                <textarea
                  className={INPUT + ' min-h-[120px] resize-none'}
                  value={bioForm.tentang_saya}
                  onChange={e => setBioForm({ ...bioForm, tentang_saya: e.target.value })}
                  placeholder={t('Ceritakan tentang diri Anda, latar belakang profesional, dan pencapaian utama...')}
                />
              </div>
              <div>
                <Label>{t('Ringkasan Keahlian')}</Label>
                <textarea
                  className={INPUT + ' min-h-[80px] resize-none'}
                  value={bioForm.ringkasan_keahlian}
                  onChange={e => setBioForm({ ...bioForm, ringkasan_keahlian: e.target.value })}
                  placeholder={t('Ringkasan singkat keahlian dan spesialisasi Anda...')}
                />
              </div>
             
              {/* ── KEAHLIAN, SPESIALISASI, KOMPETENSI ── */}
              <div>
                <Label>
                  {t('Keahlian Utama')}
                  <Tooltip text="Keahlian inti yang Anda miliki. Tampil di bagian Bidang Keahlian pada profil publik." />
                </Label>
                <input
                  className={INPUT}
                  value={bioForm.keahlian}
                  onChange={e => setBioForm({ ...bioForm, keahlian: e.target.value })}
                  placeholder={t('Contoh: AMDAL, Hidrologi, GIS, Pemodelan Spasial, KLHS')}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('Tulis keahlian utama anda, pisahkan setiap keahlian dengan koma (,). Dapat diisi hingga 3 keahlian.')}
                </p>
              </div>

              <div>
                <Label>
                  {t('Kompetensi')}
                  <Tooltip text="Kemampuan teknis atau tools yang Anda kuasai. Contoh: Software, metode, atau alat kerja." />
                </Label>
                <input
                  className={INPUT}
                  value={bioForm.kompetensi}
                  onChange={e => setBioForm({ ...bioForm, kompetensi: e.target.value })}
                  placeholder={t('Contoh: ArcGIS, SPSS, Vensim, AutoCAD')}
                />
                <p className="text-xs text-gray-500 mt-1">{t('Isi sesuai sertifikasi kompetensi (BNSP, SKKK, dan lainnya), Pisahkan setiap kompetensi dengan koma (,)')}</p>
              </div>

              {/* ── HASHTAG PENCARIAN ── */}
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Label>
                    {t('Hashtag Pencarian')}
                  </Label>
                  <Tooltip text="Hashtag ini khusus untuk memudahkan pencarian di mesin pencari (search engine). Masukkan kata kunci atau topik terkait keahlian Anda, misalnya #amdal, #lingkungan, #hidrologi." />
                </div>
                <div className="relative">
                  <input
                    className={INPUT}
                    value={bioForm.hashtags}
                    onChange={e => setBioForm({ ...bioForm, hashtags: e.target.value })}
                    placeholder={t('Contoh: #amdal, #lingkungan, #hidrologi, #tataruang, #gis, #konsultan')}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <span className="material-symbols-outlined text-[15px] text-[#2E5E3B]">search</span>
                  <span>{t('Gunakan hashtag untuk memudahkan profil Anda ditemukan di mesin pencarian. Pisahkan dengan tanda koma (,) atau spasi.')}</span>
                </p>
                {/* Preview chip hashtag */}
                {bioForm.hashtags && (
                  <div className="flex flex-wrap items-center gap-1.5 mt-2.5 pt-2 border-t border-gray-100">
                    <span className="text-[11px] font-bold text-gray-400 mr-1">{t('Preview Hashtag:')}</span>
                    {bioForm.hashtags
                      .split(/[\s,]+/)
                      .map(t => t.trim().replace(/^#+/, ''))
                      .filter(Boolean)
                      .map((tag, idx) => (
                        <span key={idx} className="inline-flex items-center text-[11px] font-semibold text-[#2E5E3B] bg-[#2E5E3B]/10 px-2.5 py-0.5 rounded-full border border-[#2E5E3B]/20">
                          #{tag}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </Card>

          <div className="flex items-center justify-between gap-3">
            <button className={BTN_GHOST} onClick={goPrev}>
              <ArrowLeftIcon className="w-[18px] h-[18px]" strokeWidth={2} />{t('Kembali')}
            </button>
            <div className="flex items-center gap-2">
              <button className={BTN_PRIMARY} onClick={saveProfilBio} disabled={saving}>
                {saving ? <Spinner /> : null}
                {saving ? t('Menyimpan...') : t('Simpan')}
              </button>
              <button className={BTN_GHOST} onClick={goNext} disabled={saving}>
                {saving ? (
                  <><Spinner />{t('Menyimpan...')}</>
                ) : (
                  <>{t('Lanjut')}<ArrowRightIcon className="w-[18px] h-[18px]" strokeWidth={2} /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}




      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: PEKERJAAN                                          */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'pekerjaan' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Tab */}
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-[#2E5E3B]">
                <BriefcaseIcon className="w-5 h-5 text-[#2E5E3B]" strokeWidth={2} />
                {t('Riwayat Pekerjaan')}
              </h3>
              <p className="text-xs text-[#5B6660] mt-0.5">
                {t('Kelola riwayat karir profesional, institusional, instansi, dan jabatan Anda untuk ditampilkan di profil publik.')}
              </p>
            </div>
            <Tooltip text="Data pekerjaan akan ditampilkan di profil publik tenaga ahli/surveyor Anda." />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#1F2A22] uppercase tracking-wider flex items-center gap-2">
                  {t('Pekerjaan')}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#2E5E3B]/10 text-[#2E5E3B]">
                    {experiences.length}
                  </span>
                </h4>
                <p className="text-[11px] text-[#5B6660] hidden sm:block">{t('Riwayat institusional, instansi, jabatan, dan karir profesional Anda.')}</p>
              </div>
              {!addingExp && (
                <button className={BTN_GHOST} onClick={() => setAddingExp(true)}>
                  <PlusCircleIcon className="w-4 h-4" strokeWidth={2} />{t('Tambah Pekerjaan')}
                </button>
              )}
            </div>

            {experiences.length === 0 && !addingExp && (
              <Card><p className="text-sm text-[#5B6660] text-center py-4">{t('Belum ada data pekerjaan.')}</p></Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...experiences].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)).map((e) => (
                <div key={e.id} className={editExp?.id === e.id ? 'md:col-span-2' : ''}>
                  <Card className="h-full">
                    {editExp?.id === e.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div><Label>{t('Posisi / Jabatan *')}</Label><input className={INPUT} value={editExp.posisi} onChange={v => setEditExp({ ...editExp, posisi: v.target.value })} /></div>
                          <div><Label>{t('Instansi atau Pemberi Kerja *')}</Label><input className={INPUT} value={editExp.instansi} onChange={v => setEditExp({ ...editExp, instansi: v.target.value })} placeholder={t('cth. PT. Enviro Mandiri / Kementerian PUPR / Nama Pemberi Kerja')} /></div>
                          <div><Label>{t('Tahun Mulai')}</Label><input type="number" className={INPUT} value={editExp.tahun_mulai || ''} onChange={v => setEditExp({ ...editExp, tahun_mulai: v.target.value })} /></div>
                          <div><Label>{t('Tahun Selesai')}</Label><input type="number" className={INPUT} value={editExp.tahun_selesai || ''} onChange={v => setEditExp({ ...editExp, tahun_selesai: v.target.value })} placeholder={t('Kosong = masih berlangsung')} /></div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button className={BTN_PRIMARY} onClick={() => updateExp(e.id)} disabled={saving}><CheckIcon className="w-4 h-4" strokeWidth={2} />{t('Simpan')}</button>
                          <button className={BTN_GHOST} onClick={() => setEditExp(null)}>{t('Batal')}</button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3 h-full flex flex-col justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-bold text-[#1F2A22] text-sm leading-snug break-words">{e.posisi}</p>
                            {e.is_primary && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs">
                                ★ {t('Tampil di Card (Primary)')}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#5B6660] font-medium mt-1">{e.instansi}</p>
                          {(e.tahun_mulai || e.tahun_selesai) && (
                            <span className="inline-block text-[11px] text-[#2E5E3B] font-semibold bg-[#2E5E3B]/10 px-2.5 py-0.5 rounded-full mt-2">
                              {(() => {
                                if (e.tahun_mulai && e.tahun_selesai) {
                                  return String(e.tahun_mulai) === String(e.tahun_selesai)
                                    ? `${e.tahun_mulai}`
                                    : `${e.tahun_mulai} — ${e.tahun_selesai}`;
                                }
                                if (e.tahun_mulai) {
                                  return `${e.tahun_mulai} — ${t('Sekarang')}`;
                                }
                                return `${e.tahun_selesai}`;
                              })()}
                            </span>
                          )}
                        </div>

                        {/* Baris Tombol Aksi */}
                        <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <button
                              type="button"
                              className={e.is_primary
                                ? "inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs cursor-pointer"
                                : `${BTN_GHOST} text-xs !py-1 !px-2.5 rounded-xl cursor-pointer`
                              }
                              onClick={() => togglePrimaryExp(e.id)}
                              title={e.is_primary ? t('Pekerjaan ini aktif tampil di Card') : t('Jadikan pekerjaan ini sebagai yang tampil di Card')}
                            >
                              <CheckBadgeIcon className="w-4 h-4" strokeWidth={2} />
                              <span>{e.is_primary ? t('Primary') : t('Set Primary')}</span>
                            </button>
                          </div>
                          <div className="flex items-center gap-1">
                            <button className={`${BTN_GHOST} text-xs !py-1 !px-2.5 rounded-xl cursor-pointer`} title={t('Edit')} onClick={() => setEditExp({ ...e })}>
                              <PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />
                              <span>{t('Edit')}</span>
                            </button>
                            <button className={`${BTN_DANGER} text-xs !py-1 !px-2.5 rounded-xl cursor-pointer`} title={t('Hapus')} onClick={() => deleteExp(e.id)}>
                              <TrashIcon className="w-3.5 h-3.5" strokeWidth={2} />
                              <span>{t('Hapus')}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>

            {addingExp && (
              <Card>
                <SectionTitle icon={PlusCircleIcon}>{t('Tambah Pekerjaan')}</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div><Label>{t('Posisi / Jabatan *')}</Label><input className={INPUT} value={newExp.posisi} onChange={v => setNewExp({ ...newExp, posisi: v.target.value })} placeholder={t('Konsultan AMDAL / Tenaga Ahli')} /></div>
                  <div><Label>{t('Instansi atau Pemberi Kerja *')}</Label><input className={INPUT} value={newExp.instansi} onChange={v => setNewExp({ ...newExp, instansi: v.target.value })} placeholder={t('cth. PT. Enviro Mandiri / Kementerian PUPR / Nama Pemberi Kerja')} /></div>
                  <div><Label>{t('Tahun Mulai')}</Label><input type="number" className={INPUT} value={newExp.tahun_mulai} onChange={v => setNewExp({ ...newExp, tahun_mulai: v.target.value })} placeholder="2020" /></div>
                  <div><Label>{t('Tahun Selesai')}</Label><input type="number" className={INPUT} value={newExp.tahun_selesai} onChange={v => setNewExp({ ...newExp, tahun_selesai: v.target.value })} placeholder={t('Kosong = masih berlangsung')} /></div>
                </div>
                <div className="flex gap-2">
                  <button className={BTN_PRIMARY} onClick={addExp} disabled={saving}>{saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}{saving ? t('Menyimpan...') : t('Simpan')}</button>
                  <button className={BTN_GHOST} onClick={() => setAddingExp(false)}>{t('Batal')}</button>
                </div>
              </Card>
            )}
          </div>

          <WizardNav onBack={goPrev} onNext={goNext} nextLabel={`${t('profile.wizard.continue_to', 'Lanjut ke')} ${TABS[currentTabIdx + 1]?.label}`} t={t} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: NARASUMBER                                          */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'narasumber' && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-[#2E5E3B]">
                <MegaphoneIcon className="w-5 h-5 text-[#2E5E3B]" strokeWidth={2} />
                {t('Riwayat Narasumber & Pembicara')}
              </h3>
              <p className="text-xs text-[#5B6660] mt-0.5">
                {t('Kelola riwayat Anda sebagai pembicara atau narasumber seminar, webinar, atau konferensi.')}
              </p>
            </div>
            <Tooltip text="Tambahkan riwayat Anda sebagai pembicara atau narasumber di seminar, webinar, atau konferensi." />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-[#1F2A22] uppercase tracking-wider flex items-center gap-2">
                  {t('Narasumber')}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#2E5E3B]/10 text-[#2E5E3B]">
                    {narasumber.length}
                  </span>
                </h4>
              </div>
              {!addingNara && (
                <button className={`${BTN_GHOST} text-xs py-1.5 px-3 self-start sm:self-auto`} onClick={() => setAddingNara(true)}>
                  <PlusCircleIcon className="w-4 h-4" strokeWidth={2} />
                  <span>{t('Tambah Riwayat Narasumber')}</span>
                </button>
              )}
            </div>

            {narasumber.length === 0 && !addingNara && (
              <Card><p className="text-sm text-[#5B6660] text-center py-4">{t('Belum ada riwayat sebagai narasumber.')}</p></Card>
            )}

            {narasumber.map((n) => (
              <Card key={n.id}>
                {editNara?.id === n.id ? (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="md:col-span-2"><Label>{t('Judul Kegiatan *')}</Label><input className={INPUT} value={editNara.title} onChange={v => setEditNara({ ...editNara, title: v.target.value })} /></div>
                      <div><Label>{t('Penyelenggara')}</Label><input className={INPUT} value={editNara.penyelenggara} onChange={v => setEditNara({ ...editNara, penyelenggara: v.target.value })} /></div>
                      <div><Label>{t('Tempat')}</Label><input className={INPUT} value={editNara.tempat} onChange={v => setEditNara({ ...editNara, tempat: v.target.value })} /></div>
                      <div><Label>{t('Tanggal')}</Label><input className={INPUT} value={editNara.tanggal} onChange={v => setEditNara({ ...editNara, tanggal: v.target.value })} placeholder="15 Nov 2022" /></div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button className={BTN_PRIMARY} onClick={() => updateNara(n.id)} disabled={saving}>{saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}{saving ? t('Menyimpan...') : t('Simpan')}</button>
                      <button className={BTN_GHOST} onClick={() => setEditNara(null)}>{t('Batal')}</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-[#1F2A22]">{n.title}</p>
                      <p className="text-sm text-[#5B6660]">{n.penyelenggara}</p>
                      {(n.tempat || n.tanggal) && <p className="text-xs text-[#5B6660] mt-1">{n.tempat}{n.tempat && n.tanggal ? ', ' : ''}{n.tanggal}</p>}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button className={BTN_GHOST + ' !px-2.5 !py-1.5'} onClick={() => setEditNara({ ...n })}><PencilIcon className="w-3.5 h-3.5" strokeWidth={2} /></button>
                      <button className={BTN_DANGER} onClick={() => deleteNara(n.id)}><TrashIcon className="w-4 h-4" strokeWidth={2} />{t('Hapus')}</button>
                    </div>
                  </div>
                )}
              </Card>
            ))}

            {addingNara ? (
              <Card>
                <SectionTitle icon={PlusCircleIcon}>{t('Tambah Riwayat Narasumber')}</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="md:col-span-2"><Label>{t('Judul Kegiatan *')}</Label><input className={INPUT} value={newNara.title} onChange={v => setNewNara({ ...newNara, title: v.target.value })} /></div>
                  <div><Label>{t('Penyelenggara')}</Label><input className={INPUT} value={newNara.penyelenggara} onChange={v => setNewNara({ ...newNara, penyelenggara: v.target.value })} /></div>
                  <div><Label>{t('Tempat')}</Label><input className={INPUT} value={newNara.tempat} onChange={v => setNewNara({ ...newNara, tempat: v.target.value })} /></div>
                  <div><Label>{t('Tanggal')}</Label><input className={INPUT} value={newNara.tanggal} onChange={v => setNewNara({ ...newNara, tanggal: v.target.value })} placeholder={t('15 Nov 2022')} /></div>
                </div>
                <div className="flex gap-2">
                  <button className={BTN_PRIMARY} onClick={addNara} disabled={saving}>{saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}{saving ? t('Menyimpan...') : t('Simpan')}</button>
                  <button className={BTN_GHOST} onClick={() => setAddingNara(false)}>{t('Batal')}</button>
                </div>
              </Card>
            ) : (
              <button className={BTN_GHOST + ' self-start'} onClick={() => setAddingNara(true)}>
                <PlusCircleIcon className="w-[18px] h-[18px]" strokeWidth={2} />{t('Tambah Riwayat Narasumber')}
              </button>
            )}
          </div>

          <WizardNav onBack={goPrev} onNext={goNext} nextLabel={`${t('profile.wizard.continue_to', 'Lanjut ke')} ${TABS[currentTabIdx + 1]?.label}`} t={t} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: PENGALAMAN (PROYEK & PENELITIAN)                    */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'pengalaman' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header Tab */}
          <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
            <div>
              <h3 className="flex items-center gap-2 text-base font-bold text-[#2E5E3B]">
                <ClipboardDocumentCheckIcon className="w-5 h-5 text-[#2E5E3B]" strokeWidth={2} />
                {t('Pengalaman & Portofolio')}
              </h3>
              <p className="text-xs text-[#5B6660] mt-0.5">
                {t('Kelola riwayat proyek, kajian, serta pengalaman penelitian dan riset yang pernah Anda kerjakan untuk ditampilkan di profil publik Anda.')}
              </p>
            </div>
            <Tooltip text="Data pengalaman proyek dan penelitian akan ditampilkan di profil publik tenaga ahli/surveyor Anda." />
          </div>

          {/* Sub-tab Navigation Pills */}
          <div className="flex items-center gap-2 pb-1 border-b border-gray-100 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setPengalamanSubTab('semua')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                pengalamanSubTab === 'semua'
                  ? 'bg-[#2E5E3B] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span>{t('Semua')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                pengalamanSubTab === 'semua' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {proyek.length + penelitian.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPengalamanSubTab('proyek')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                pengalamanSubTab === 'proyek'
                  ? 'bg-[#8B4513] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">engineering</span>
              <span>{t('Pengalaman Proyek')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                pengalamanSubTab === 'proyek' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {proyek.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setPengalamanSubTab('penelitian')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                pengalamanSubTab === 'penelitian'
                  ? 'bg-[#2E5E3B] text-white shadow-xs'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <span className="material-symbols-outlined text-[15px]">biotech</span>
              <span>{t('Pengalaman Penelitian')}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                pengalamanSubTab === 'penelitian' ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-700'
              }`}>
                {penelitian.length}
              </span>
            </button>
          </div>

          {/* 10 PROYEK TERBAIK ANDA */}
          {(pengalamanSubTab === 'semua' || pengalamanSubTab === 'proyek') && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div>
                  <h4 className="text-sm font-bold text-[#1F2A22] uppercase tracking-wider flex items-center gap-2">
                    {t('10 Proyek Terbaik Anda')}
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#8B4513]/10 text-[#8B4513]">
                      {proyek.length} / 10
                    </span>
                  </h4>
                  <p className="text-[11px] text-[#5B6660]">{t('Tulis 10 proyek atau penelitian terbaik/terbesar anda.')}</p>
                </div>
              </div>
              {!addingProyek && (
                <button
                  className={`${BTN_GHOST} text-xs py-1.5 px-3 self-start sm:self-auto ${proyek.length >= 10 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => {
                    if (proyek.length >= 10) {
                      flash('err', t('Maksimal 10 proyek terbaik yang dapat ditambahkan.'));
                      return;
                    }
                    setAddingProyek(true);
                  }}
                  disabled={proyek.length >= 10}
                  title={proyek.length >= 10 ? t('Batas maksimal 10 proyek tercapai') : ''}
                >
                  <PlusCircleIcon className="w-4 h-4" strokeWidth={2} />{t('Tambah Proyek Terbaik')}
                </button>
              )}
            </div>

            {/* Input Ringkasan Total Proyek Keseluruhan */}
            <div className="bg-gradient-to-r from-amber-50/90 via-white to-amber-50/50 p-4 sm:p-5 rounded-2xl border border-amber-200 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-[#8B4513]/10 text-[#8B4513] flex items-center justify-center shrink-0 mt-0.5 border border-[#8B4513]/15">
                    <span className="material-symbols-outlined text-[24px]">engineering</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-[#1F2A22]">{t('Total Proyek (Keseluruhan)')}</h4>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-[#8B4513] border border-amber-200">
                        {t('Statistik Profil')}
                      </span>
                      {expert?.update_status === 'menunggu_verifikasi' && expert?.pending_changes?.total_proyek !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
                          {t('Menunggu Verifikasi Admin')}
                        </span>
                      )}
                      {expert?.profile_status === 'aktif' && expert?.total_proyek !== null && expert?.total_proyek !== undefined && expert?.pending_changes?.total_proyek === undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          {t('Tersimpan')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5B6660] mt-0.5 leading-relaxed max-w-xl">
                      {t('Ketikkan angka total keseluruhan proyek yang pernah Anda tangani (10, 50, 100, 200). Angka ini akan otomatis tampil di kartu statistik profil publik Anda.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
                  <div className="relative w-36">
                    <input
                      type="number"
                      min="0"
                      disabled={!isEditingTotalProyek && Boolean((expert?.total_proyek !== null && expert?.total_proyek !== undefined && expert?.total_proyek !== '') || expert?.pending_changes?.total_proyek !== undefined)}
                      className={`w-full h-10 px-3 pr-14 py-2 border-2 rounded-xl font-bold text-base transition-colors text-center shadow-xs ${
                        !isEditingTotalProyek && Boolean((expert?.total_proyek !== null && expert?.total_proyek !== undefined && expert?.total_proyek !== '') || expert?.pending_changes?.total_proyek !== undefined)
                          ? 'bg-amber-50/70 border-amber-200 text-gray-800 cursor-not-allowed'
                          : 'bg-white border-[#8B4513] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#8B4513]/30'
                      }`}
                      value={form.total_proyek !== undefined && form.total_proyek !== null ? form.total_proyek : ''}
                      onChange={(v) => setForm({ ...form, total_proyek: v.target.value })}
                      placeholder={proyek.length > 0 ? String(proyek.length) : '0'}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400 pointer-events-none">
                      Proyek
                    </span>
                  </div>

                  {isEditingTotalProyek || (!expert?.total_proyek && expert?.total_proyek !== 0 && expert?.pending_changes?.total_proyek === undefined) ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="h-10 px-4 rounded-xl bg-[#8B4513] hover:bg-[#6B3410] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                        onClick={saveTotalProyek}
                        disabled={saving}
                      >
                        {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                        <span>{t('Simpan')}</span>
                      </button>
                      {Boolean((expert?.total_proyek !== null && expert?.total_proyek !== undefined && expert?.total_proyek !== '') || expert?.pending_changes?.total_proyek !== undefined) && (
                        <button
                          type="button"
                          className="h-10 px-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0"
                          onClick={() => {
                            setIsEditingTotalProyek(false);
                            setForm((prev) => ({
                              ...prev,
                              total_proyek: expert?.pending_changes?.total_proyek ?? expert?.total_proyek ?? '',
                            }));
                          }}
                          disabled={saving}
                        >
                          {t('Batal')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="h-10 px-4 rounded-xl bg-white hover:bg-amber-50 text-[#8B4513] border-2 border-[#8B4513] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      onClick={() => setIsEditingTotalProyek(true)}
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      <span>{t('Edit')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {proyek.length === 0 && !addingProyek && (
              <Card><p className="text-sm text-[#5B6660] text-center py-4">{t('Belum ada data proyek terbaik.')}</p></Card>
            )}

            {proyek.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {proyek.map((p) => {
                  const pId = p.id;
                  const isEditing = editProyek?.id === pId;
                  if (isEditing) {
                    return (
                      <div key={pId || p.nama} className="col-span-1 md:col-span-2 bg-white p-5 rounded-2xl border-2 border-[#8B4513]/30 shadow-sm space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div className="md:col-span-2">
                            <Label>{t('Nama Proyek / Kajian *')}</Label>
                            <input className={INPUT} value={editProyek.nama} onChange={v => setEditProyek({ ...editProyek, nama: v.target.value })} />
                          </div>
                          <div>
                            <Label>{t('Peran dalam Proyek')}</Label>
                            <input className={INPUT} value={editProyek.peran || ''} onChange={v => setEditProyek({ ...editProyek, peran: v.target.value })} placeholder={t('cth. Ketua Tim Ahli / Surveyor')} />
                          </div>
                          <div>
                            <Label>{t('Tahun Proyek')}</Label>
                            <input className={INPUT} value={editProyek.tahun || ''} onChange={v => setEditProyek({ ...editProyek, tahun: v.target.value })} placeholder="cth. 2023" />
                          </div>
                          <div className="md:col-span-2">
                            <Label>{t('Lokasi Proyek')}</Label>
                            <input className={INPUT} value={editProyek.lokasi || ''} onChange={v => setEditProyek({ ...editProyek, lokasi: v.target.value })} placeholder="cth. Manado, Sulawesi Utara" />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button className={BTN_PRIMARY} onClick={() => updateProyek(pId)} disabled={saving}><CheckIcon className="w-4 h-4" strokeWidth={2} />{t('Simpan')}</button>
                          <button className={BTN_GHOST} onClick={() => setEditProyek(null)}>{t('Batal')}</button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={pId || p.nama} className="bg-white p-4 rounded-xl border border-gray-200/90 hover:border-[#8B4513]/40 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                          {p.peran ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-900 bg-blue-50 border border-blue-200/60 px-2 py-0.5 rounded-md">
                              <span className="material-symbols-outlined text-[13px]">badge</span>
                              <span className="truncate max-w-[200px]">{p.peran}</span>
                            </span>
                          ) : <span />}
                          {p.tahun && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-[#8B4513] border border-amber-200">
                              <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                              <span>{p.tahun}</span>
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[#1F2A22] text-sm leading-snug line-clamp-2">{p.nama || p.judul}</p>
                        {p.lokasi && (
                          <p className="text-xs text-[#5B6660] mt-1.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px] text-gray-400 shrink-0">location_on</span>
                            <span className="line-clamp-1">{p.lokasi}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex gap-1.5 justify-end pt-2 border-t border-gray-100">
                        <button className={BTN_GHOST + " !py-1 !px-2.5 text-xs"} onClick={() => setEditProyek({ ...p })}><PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />{t('Edit')}</button>
                        <button className={BTN_DANGER + " !py-1 !px-2.5 text-xs"} onClick={() => deleteProyek(pId)}><TrashIcon className="w-3.5 h-3.5" strokeWidth={2} />{t('Hapus')}</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {addingProyek && (
              <Card>
                <SectionTitle icon={PlusCircleIcon}>{t('Tambah Proyek Terbaik')}</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  <div className="md:col-span-2">
                    <Label>{t('Nama Proyek / Kajian / Survei *')}</Label>
                    <input className={INPUT} value={newProyek.nama} onChange={v => setNewProyek({ ...newProyek, nama: v.target.value })} placeholder={t('cth. Kajian Sistem Dinamik untuk KLHS RPJMD Kota Manado')} />
                  </div>
                  <div>
                    <Label>{t('Peran dalam Proyek')}</Label>
                    <input className={INPUT} value={newProyek.peran} onChange={v => setNewProyek({ ...newProyek, peran: v.target.value })} placeholder={t('cth. Ketua Tim Ahli / Tenaga Ahli Pemetaan')} />
                  </div>
                  <div>
                    <Label>{t('Tahun Proyek')}</Label>
                    <input className={INPUT} value={newProyek.tahun} onChange={v => setNewProyek({ ...newProyek, tahun: v.target.value })} placeholder="2023" />
                  </div>
                  <div className="md:col-span-2">
                    <Label>{t('Lokasi Proyek')}</Label>
                    <input className={INPUT} value={newProyek.lokasi} onChange={v => setNewProyek({ ...newProyek, lokasi: v.target.value })} placeholder={t('cth. Kota Manado, Sulawesi Utara')} />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={BTN_PRIMARY} onClick={addProyek} disabled={saving}>{saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}{saving ? t('Menyimpan...') : t('Simpan')}</button>
                  <button className={BTN_GHOST} onClick={() => setAddingProyek(false)}>{t('Batal')}</button>
                </div>
              </Card>
            )}
          </div>
          )}

          {/* ════════════════════════════════════════════════════════ */}
          {/* PENGALAMAN PENELITIAN & RISET                            */}
          {/* ════════════════════════════════════════════════════════ */}
          {(pengalamanSubTab === 'semua' || pengalamanSubTab === 'penelitian') && (
            <div className="space-y-4 pt-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div>
                    <h4 className="text-sm font-bold text-[#1F2A22] uppercase tracking-wider flex items-center gap-2">
                      <span className="material-symbols-outlined text-[18px] text-[#2E5E3B]">biotech</span>
                      {t('Pengalaman Penelitian & Riset')}
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#2E5E3B]/10 text-[#2E5E3B]">
                        {penelitian.length}
                      </span>
                    </h4>
                    <p className="text-[11px] text-[#5B6660]">
                      {t('Kelola riwayat penelitian, riset lapangan, kajian studi, atau penelitian institusional/mandiri.')}
                    </p>
                  </div>
                </div>
                {!addingPenelitian && (
                  <button
                    className={`${BTN_GHOST} text-xs py-1.5 px-3 self-start sm:self-auto`}
                    onClick={() => setAddingPenelitian(true)}
                  >
                    <PlusCircleIcon className="w-4 h-4" strokeWidth={2} />{t('Tambah Pengalaman Penelitian')}
                  </button>
                )}
              </div>

              {penelitian.length === 0 && !addingPenelitian && (
                <Card>
                  <div className="text-center py-6">
                    <div className="w-12 h-12 rounded-2xl bg-[#2E5E3B]/10 text-[#2E5E3B] flex items-center justify-center mx-auto mb-2.5">
                      <span className="material-symbols-outlined text-[26px]">biotech</span>
                    </div>
                    <p className="text-sm font-semibold text-[#1F2A22]">{t('Belum ada data pengalaman penelitian.')}</p>
                    <p className="text-xs text-[#5B6660] max-w-md mx-auto mt-1">
                      {t('Tambahkan rekam jejak penelitian atau riset Anda untuk memperkuat portofolio keahlian.')}
                    </p>
                    <button
                      type="button"
                      onClick={() => setAddingPenelitian(true)}
                      className={`${BTN_PRIMARY} mx-auto mt-3.5 !py-2 !px-4 text-xs`}
                    >
                      <PlusIcon className="w-4 h-4" strokeWidth={2} />
                      {t('Tambah Penelitian Sekarang')}
                    </button>
                  </div>
                </Card>
              )}

              {penelitian.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {penelitian.map((p) => {
                    const pId = p.id;
                    const isEditing = editPenelitian?.id === pId;
                    if (isEditing) {
                      return (
                        <div key={pId || p.nama || p.judul} className="col-span-1 md:col-span-2 bg-white p-5 rounded-2xl border-2 border-[#2E5E3B]/30 shadow-sm space-y-3">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="md:col-span-2">
                              <Label>{t('Nama Penelitian / Riset *')}</Label>
                              <input
                                className={INPUT}
                                value={editPenelitian.nama !== undefined ? editPenelitian.nama : (editPenelitian.judul || '')}
                                onChange={v => setEditPenelitian({ ...editPenelitian, nama: v.target.value, judul: v.target.value })}
                                placeholder={t('cth. Analisis Daya Dukung Lingkungan Hidup Berbasis Sistem Dinamik')}
                              />
                            </div>
                            <div>
                              <Label>{t('Peran dalam Penelitian')}</Label>
                              <input
                                className={INPUT}
                                value={editPenelitian.peran || ''}
                                onChange={v => setEditPenelitian({ ...editPenelitian, peran: v.target.value })}
                                placeholder={t('cth. Ketua Tim Peneliti / Anggota Peneliti')}
                              />
                            </div>
                            <div>
                              <Label>{t('Tahun Penelitian')}</Label>
                              <input
                                className={INPUT}
                                value={editPenelitian.tahun || ''}
                                onChange={v => setEditPenelitian({ ...editPenelitian, tahun: v.target.value })}
                                placeholder="cth. 2023"
                              />
                            </div>
                            <div className="md:col-span-2">
                              <Label>{t('Lokasi Penelitian')}</Label>
                              <input
                                className={INPUT}
                                value={editPenelitian.lokasi || ''}
                                onChange={v => setEditPenelitian({ ...editPenelitian, lokasi: v.target.value })}
                                placeholder={t('cth. Kota Manado, Sulawesi Utara')}
                              />
                            </div>
                          </div>
                          <div className="flex gap-2 pt-1">
                            <button className={BTN_PRIMARY} onClick={() => updatePenelitian(pId)} disabled={saving}>
                              {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                              {t('Simpan')}
                            </button>
                            <button className={BTN_GHOST} onClick={() => setEditPenelitian(null)}>{t('Batal')}</button>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={pId || p.nama || p.judul}
                        className="bg-white p-4 rounded-xl border border-gray-200/90 hover:border-[#2E5E3B]/40 transition-all flex flex-col justify-between shadow-2xs hover:shadow-xs gap-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                            {p.peran ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200/70 px-2 py-0.5 rounded-md">
                                <span className="material-symbols-outlined text-[13px]">badge</span>
                                <span className="truncate max-w-[200px]">{p.peran}</span>
                              </span>
                            ) : <span />}
                            {p.tahun && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-[#2E5E3B] border border-emerald-200">
                                <span className="material-symbols-outlined text-[12px]">calendar_today</span>
                                <span>{p.tahun}</span>
                              </span>
                            )}
                          </div>
                          <p className="font-bold text-[#1F2A22] text-sm leading-snug line-clamp-2">{p.nama || p.judul}</p>
                          {p.lokasi && (
                            <p className="text-xs text-[#5B6660] mt-1.5 flex items-center gap-1">
                              <span className="material-symbols-outlined text-[14px] text-gray-400 shrink-0">location_on</span>
                              <span className="line-clamp-1">{p.lokasi}</span>
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1.5 justify-end pt-2 border-t border-gray-100">
                          <button
                            className={BTN_GHOST + " !py-1 !px-2.5 text-xs"}
                            onClick={() => setEditPenelitian({ ...p, nama: p.nama || p.judul || '', lokasi: p.lokasi || '' })}
                          >
                            <PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />{t('Edit')}
                          </button>
                          <button
                            className={BTN_DANGER + " !py-1 !px-2.5 text-xs"}
                            onClick={() => deletePenelitian(pId)}
                          >
                            <TrashIcon className="w-3.5 h-3.5" strokeWidth={2} />{t('Hapus')}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {addingPenelitian && (
                <Card>
                  <SectionTitle icon={PlusCircleIcon}>{t('Tambah Pengalaman Penelitian')}</SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="md:col-span-2">
                      <Label>{t('Nama Penelitian / Riset *')}</Label>
                      <input
                        className={INPUT}
                        value={newPenelitian.nama}
                        onChange={v => setNewPenelitian({ ...newPenelitian, nama: v.target.value, judul: v.target.value })}
                        placeholder={t('cth. Analisis Daya Dukung Lingkungan Hidup Berbasis Sistem Dinamik')}
                      />
                    </div>
                    <div>
                      <Label>{t('Peran dalam Penelitian')}</Label>
                      <input
                        className={INPUT}
                        value={newPenelitian.peran}
                        onChange={v => setNewPenelitian({ ...newPenelitian, peran: v.target.value })}
                        placeholder={t('cth. Ketua Tim Peneliti / Anggota Peneliti')}
                      />
                    </div>
                    <div>
                      <Label>{t('Tahun Penelitian')}</Label>
                      <input
                        className={INPUT}
                        value={newPenelitian.tahun}
                        onChange={v => setNewPenelitian({ ...newPenelitian, tahun: v.target.value })}
                        placeholder="2023"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t('Lokasi Penelitian')}</Label>
                      <input
                        className={INPUT}
                        value={newPenelitian.lokasi}
                        onChange={v => setNewPenelitian({ ...newPenelitian, lokasi: v.target.value })}
                        placeholder={t('cth. Kota Manado, Sulawesi Utara')}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className={BTN_PRIMARY} onClick={addPenelitian} disabled={saving}>
                      {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                      {saving ? t('Menyimpan...') : t('Simpan')}
                    </button>
                    <button className={BTN_GHOST} onClick={() => setAddingPenelitian(false)}>{t('Batal')}</button>
                  </div>
                </Card>
              )}
            </div>
          )}

          <WizardNav onBack={goPrev} onNext={goNext} nextLabel={`${t('profile.wizard.continue_to', 'Lanjut ke')} ${TABS[currentTabIdx + 1]?.label}`} t={t} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: SERTIFIKAT                                         */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'sertifikat' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header Tab */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-outline-variant/20">
            <div className="flex items-center gap-2">
              <h3 className="flex items-center gap-2 text-base font-bold text-[#2E5E3B]">
                <TrophyIcon className="w-5 h-5 text-[#2E5E3B]" strokeWidth={2} />
                <span>{t('Sertifikat & Kompetensi')}</span>
              </h3>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#2E5E3B]/10 text-[#2E5E3B]">
                {certificates.length}
              </span>
              <Tooltip text="Tambahkan sertifikat profesi, keahlian, atau pelatihan yang Anda miliki. Lengkapi dengan file sertifikat agar dapat diverifikasi admin." />
            </div>
            {!addingCert && (
              <button
                type="button"
                className={`${BTN_GHOST} text-xs py-1.5 px-3 self-start sm:self-auto`}
                onClick={() => setAddingCert(true)}
              >
                <PlusCircleIcon className="w-4 h-4" strokeWidth={2} />
                <span>{t('Tambah Sertifikat')}</span>
              </button>
            )}
          </div>

          {/* Banner Himbauan Keamanan: Watermark Sertifikat */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-amber-50 to-orange-50/70 border border-amber-200/90 rounded-2xl flex items-start gap-3 text-xs text-amber-950 leading-relaxed shadow-2xs">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-500/15 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 border border-amber-300/60">
              <ShieldCheckIcon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-bold text-amber-950 text-xs sm:text-sm">
                {t('Keterangan Keamanan: Berikan Watermark pada Dokumen Sertifikat')}
              </p>
              <p className="text-amber-900/90 text-[11px] sm:text-xs">
                {t('Demi menjaga keamanan privasi data dan mencegah penyalahgunaan dokumen oleh pihak lain, Anda sangat dianjurkan untuk memberikan ')}
                <span className="font-bold underline decoration-amber-400">{t('watermark tulisan')}</span>
                {t(' pada file scan atau foto sertifikat sebelum diunggah (misalnya: ')}
                <code className="bg-amber-100/90 text-amber-950 px-1 py-0.2 rounded font-mono text-[10px] sm:text-[11px] font-semibold break-all">"{t('HANYA UNTUK VERIFIKASI TENAGAAHLI.COM')}"</code>
                {t('). File hanya digunakan admin untuk verifikasi.')}
              </p>
            </div>
          </div>

          {/* Banner Persyaratan: Sertifikasi Menentukan Kriteria Profesional */}
          <div className="p-3.5 sm:p-4 bg-gradient-to-r from-emerald-50 to-teal-50/70 border border-emerald-300/90 rounded-2xl flex items-start gap-3 text-xs text-emerald-950 leading-relaxed shadow-2xs">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-600/15 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-300/80">
              <CheckBadgeIcon className="w-4 h-4 sm:w-5 sm:h-5" strokeWidth={2} />
            </div>
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-bold text-emerald-950 text-xs sm:text-sm">
                {t('Sertifikasi Menentukan Kriteria Profesional Anda')}
              </p>
              <p className="text-emerald-900/90 text-[11px] sm:text-xs">
                {t('Sertifikasi yang Anda unggah menentukan kriteria profesional Anda atau kriteria yang cocok untuk Anda. Melalui bukti sertifikat keahlian yang sah, Anda dapat diverifikasi memegang lebih dari satu kriteria sekaligus — misalnya menjadi ')}
                <strong className="font-semibold text-emerald-950">{t('Tenaga Ahli sekaligus Tenaga Teknis')}</strong>
                {t(', maupun kombinasi peran lainnya (kecuali Klien).')}
              </p>
            </div>
          </div>

          {certificates.length === 0 && !addingCert && (
            <Card><p className="text-sm text-[#5B6660] text-center py-4">{t('Belum ada data sertifikat.')}</p></Card>
          )}
          {[...certificates].sort((a, b) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0)).map((c) => {
            const isEditing = editCert?.id === c.id;
            return (
              <Card key={c.id}>
                {isEditing ? (
                  <div className="space-y-3">
                    <SectionTitle icon={PencilIcon}>{t('Edit Sertifikat')}</SectionTitle>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                      <div className="md:col-span-2">
                        <Label>{t('Nama Sertifikat *')}</Label>
                        <input
                          className={INPUT}
                          value={editCert.nama_sertifikat}
                          onChange={v => setEditCert({ ...editCert, nama_sertifikat: v.target.value })}
                          placeholder={t('Sertifikat AMDAL A')}
                        />
                      </div>
                      <div>
                        <Label>{t('Tahun')}</Label>
                        <input
                          type="number"
                          className={INPUT}
                          value={editCert.tahun || ''}
                          onChange={v => setEditCert({ ...editCert, tahun: v.target.value })}
                          placeholder="2022"
                        />
                      </div>
                      <div className="md:col-span-3">
                        <Label>{t('Penerbit / Lembaga')}</Label>
                        <input
                          className={INPUT}
                          value={editCert.penerbit || ''}
                          onChange={v => setEditCert({ ...editCert, penerbit: v.target.value })}
                          placeholder={t('KLHK / BPLHD / Instansi Penerbit')}
                        />
                      </div>
                    </div>

                    {/* File upload edit */}
                    <div className="border-t border-outline-variant/20 pt-3 mb-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#5B6660]">
                          {t('File Sertifikat (Opsional ganti file baru)')}
                        </p>
                        <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                          <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-700" strokeWidth={2} />
                          {t('Dianjurkan diberi watermark')}
                        </span>
                      </div>
                      <p className="text-xs text-[#5B6660] mb-2 leading-relaxed">
                        {t('Disarankan membubuhkan watermark (misal: "Hanya untuk Verifikasi TenagaAhli.com") pada dokumen sebelum diunggah.')}
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <label className={BTN_GHOST + ' cursor-pointer text-xs py-1.5 px-3'}>
                          <ArrowUpTrayIcon className="w-4 h-4" strokeWidth={2} />
                          {editCertFile ? (
                            <span className="max-w-[200px] truncate">{editCertFile.name}</span>
                          ) : (
                            t('Upload File Baru (JPG/PNG/PDF, Max 5MB)')
                          )}
                          <input
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                            className="hidden"
                            ref={editCertFileRef}
                            onChange={e => setEditCertFile(e.target.files?.[0] || null)}
                          />
                        </label>
                        {editCert.file_path && !editCertFile && (
                          <span className="text-xs text-[#5B6660] bg-gray-100 px-2.5 py-1 rounded-md">
                            File tersimpan: <a href={getFileUrl(editCert.file_path)} target="_blank" rel="noopener noreferrer" className="text-[#2E5E3B] underline font-bold">Lihat</a>
                          </span>
                        )}
                        {editCertFile && (
                          <div className="flex items-center gap-1.5 text-xs text-[#5B6660]">
                            <CheckCircleIcon className="w-4 h-4 text-[#2E5E3B]" strokeWidth={2} />
                            <span>{editCertFile.name} ({(editCertFile.size / 1024).toFixed(0)} KB)</span>
                            <button
                              type="button"
                              className="text-[#B3261E] hover:underline ml-1"
                              onClick={() => { setEditCertFile(null); if (editCertFileRef.current) editCertFileRef.current.value = ''; }}
                            >
                              {t('Batal Ganti')}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button className={BTN_PRIMARY} onClick={() => updateCert(c.id)} disabled={saving}>
                        {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                        {saving ? t('Menyimpan...') : t('Simpan Perubahan')}
                      </button>
                      <button className={BTN_GHOST} onClick={() => { setEditCert(null); setEditCertFile(null); }}>
                        {t('Batal')}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Header Item: Trophy Icon + Nama Sertifikat + Badges */}
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#2E5E3B]/10 text-[#2E5E3B] flex items-center justify-center shrink-0 mt-0.5">
                        <TrophyIcon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm sm:text-base text-[#1F2A22] leading-snug break-words">
                          {c.nama_sertifikat}
                        </h4>
                        
                        {/* Badges bar */}
                        <div className="flex items-center gap-1.5 flex-wrap mt-1.5">
                          {c.is_primary && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs">
                              ★ {t('Tampil di Card (Primary)')}
                            </span>
                          )}
                          {c.file_path ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
                              <CheckCircleIcon className="w-3 h-3 text-emerald-600" strokeWidth={2.5} />
                              {t('File Terlampir')}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 border border-gray-200 px-2 py-0.5 rounded-full">
                              {t('Belum Upload File')}
                            </span>
                          )}
                        </div>

                        {/* Penerbit & Tahun */}
                        <div className="mt-2 text-xs text-[#5B6660] space-y-0.5">
                          {c.penerbit && (
                            <p className="font-medium text-gray-700">
                              {c.penerbit}
                            </p>
                          )}
                          {c.tahun && (
                            <p className="text-gray-500">
                              {t('Tahun')} {c.tahun}
                            </p>
                          )}
                        </div>

                        {/* Tombol Lihat File */}
                        {c.file_path && (
                          <div className="mt-2.5">
                            <a
                              href={getFileUrl(c.file_path)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-[#2E5E3B] bg-[#2E5E3B]/10 hover:bg-[#2E5E3B]/20 transition-colors"
                            >
                              <EyeIcon className="w-3.5 h-3.5" strokeWidth={2} />
                              <span>{t('Lihat File Sertifikat')}</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Baris Tombol Aksi: Terpisah di Bawah (Anti-Offside & Anti-Patah di Mobile) */}
                    <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 flex-wrap">
                      <div>
                        <button
                          type="button"
                          className={c.is_primary
                            ? "inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-colors cursor-pointer"
                            : `${BTN_GHOST} text-xs !py-1.5 !px-3 rounded-xl cursor-pointer`
                          }
                          onClick={() => togglePrimaryCert(c.id)}
                          title={c.is_primary ? t('Sertifikat ini aktif tampil di Card') : t('Jadikan sertifikat ini sebagai yang tampil di Card')}
                        >
                          <CheckBadgeIcon className="w-4 h-4" strokeWidth={2} />
                          <span>{c.is_primary ? t('Primary') : t('Set Primary')}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          className={`${BTN_GHOST} text-xs !py-1.5 !px-3 rounded-xl cursor-pointer`}
                          onClick={() => { setEditCert({ ...c }); setEditCertFile(null); }}
                        >
                          <PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{t('Edit')}</span>
                        </button>
                        <button
                          type="button"
                          className={`${BTN_DANGER} text-xs !py-1.5 !px-2.5 rounded-xl cursor-pointer`}
                          onClick={() => deleteCert(c.id)}
                        >
                          <TrashIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{t('Hapus')}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}

          {addingCert ? (
            <Card>
              <SectionTitle icon={PlusCircleIcon}>{t('Tambah Sertifikat')}</SectionTitle>

              {/* Info banner */}
              <div className="flex items-start gap-2.5 text-xs bg-[#F4E8D0] text-[#6B3410] border border-[#D2B48C] rounded-xl px-3.5 py-3 mb-4">
                <InformationCircleIcon className="w-5 h-5 shrink-0 mt-0.5 text-[#8B4513]" strokeWidth={2} />
                <div className="space-y-1 text-xs">
                  <p>
                    <strong>Info:</strong> {t('Nama, penerbit, dan tahun sertifikat akan ditampilkan di profil publik. File foto/scan sertifikat ')}<strong>{t('hanya dikirim ke admin')}</strong>{t(' untuk keperluan verifikasi dan tidak tampil di profil publik.')}
                  </p>
                  <p className="text-[#5B2E0A] flex items-center gap-1.5 font-semibold pt-1 border-t border-[#D2B48C]/60">
                    <ShieldCheckIcon className="w-4 h-4 text-[#8B4513] shrink-0" strokeWidth={2} />
                    <span>{t('Tips Keamanan: Berikan watermark bertuliskan "Hanya untuk Verifikasi TenagaAhli.com" pada scan sertifikat Anda.')}</span>
                  </p>
                </div>
              </div>

              {/* Text fields — tampil di profil publik */}
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#5B6660] mb-2">{t('Data Sertifikat (tampil di profil publik)')}</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                <div className="md:col-span-2"><Label>{t('Nama Sertifikat *')}</Label><input className={INPUT} value={newCert.nama_sertifikat} onChange={v => setNewCert({ ...newCert, nama_sertifikat: v.target.value })} placeholder={t('Sertifikat AMDAL A')} /></div>
                <div><Label>{t('Tahun')}</Label><input type="number" className={INPUT} value={newCert.tahun} onChange={v => setNewCert({ ...newCert, tahun: v.target.value })} placeholder="2022" /></div>
                <div className="md:col-span-3"><Label>{t('Penerbit / Lembaga')}</Label><input className={INPUT} value={newCert.penerbit} onChange={v => setNewCert({ ...newCert, penerbit: v.target.value })} placeholder={t('KLHK / BPLHD / Instansi Penerbit')} /></div>
              </div>

              {/* File upload — hanya ke admin */}
              <div className="border-t border-outline-variant/20 pt-4 mb-4">
                <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#5B6660]">
                    {t('File Sertifikat (hanya untuk admin — tidak tampil publik)')}
                  </p>
                  <span className="text-[11px] text-amber-800 font-medium flex items-center gap-1">
                    <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-700" strokeWidth={2} />
                    {t('Dianjurkan diberi watermark')}
                  </span>
                </div>
                <p className="text-xs text-[#5B6660] mb-2.5 leading-relaxed">
                  {t('Disarankan membubuhkan watermark tulisan (misal: "Hanya untuk Verifikasi TenagaAhli.com") pada dokumen sertifikat Anda sebelum diunggah.')}
                </p>
                <label className={BTN_GHOST + ' cursor-pointer w-full sm:w-auto justify-center'}>
                  <ArrowUpTrayIcon className="w-4 h-4" strokeWidth={2} />
                  {certFile
                    ? <span className="max-w-[220px] truncate">{certFile.name}</span>
                    : t('Pilih File Foto/Scan Sertifikat (JPG/PNG/PDF, Max 5MB)')}
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    className="hidden"
                    ref={certFileRef}
                    onChange={e => setCertFile(e.target.files?.[0] || null)}
                  />
                </label>
                {certFile && (
                  <div className="flex items-center gap-2 mt-2 text-xs text-[#5B6660]">
                    <CheckCircleIcon className="w-4 h-4 text-[#2E5E3B]" strokeWidth={2} />
                    <span>{certFile.name} · {(certFile.size / 1024).toFixed(0)} KB</span>
                    <button
                      type="button"
                      className="text-[#B3261E] hover:underline ml-1"
                      onClick={() => { setCertFile(null); if (certFileRef.current) certFileRef.current.value = ''; }}
                    >
                      {t('Hapus')}
                    </button>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button className={BTN_PRIMARY} onClick={addCert} disabled={saving}>{saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}{saving ? t('Menyimpan...') : t('Simpan')}</button>
                <button className={BTN_GHOST} onClick={() => { setAddingCert(false); setCertFile(null); if (certFileRef.current) certFileRef.current.value = ''; }}>{t('Batal')}</button>
              </div>
            </Card>
          ) : (
            <button className={BTN_GHOST + ' self-start'} onClick={() => setAddingCert(true)}>
              <PlusCircleIcon className="w-[18px] h-[18px]" strokeWidth={2} />{t('Tambah Sertifikat')}
            </button>
          )}

          <WizardNav onBack={goPrev} onNext={goNext} nextLabel={`${t('profile.wizard.continue_to', 'Lanjut ke')} ${TABS[currentTabIdx + 1]?.label}`} t={t} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: LINK AKADEMIK                                      */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'akademik' && (
        <div className="space-y-6 animate-fadeIn">
          <Card>
            <div className="flex items-center justify-between gap-4 mb-2 flex-wrap">
              <div className="flex items-center gap-1">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                  <LinkIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                  {t('Link Profil Akademik')}
                </h3>
                <Tooltip text="Isi link profil akademik Anda di sini. Data yang Anda isi tetap tersimpan dan otomatis tampil di profil publik ketika Anda upgrade ke paket Ekonomis atau Eksklusif." />
              </div>
              {!(expert?.package_id && expert?.package?.price > 0) && !expert?.verified && (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-3 py-1 rounded-full shadow-2xs">
                  <span className="material-symbols-outlined text-[14px]">workspace_premium</span>
                  {t('Fitur Member Ekonomis & Eksklusif')}
                </span>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-3">{t('Tambahkan link ke profil akademik Anda untuk meningkatkan kredibilitas.')}</p>

            <div className="bg-amber-50/80 border border-amber-200/90 rounded-xl p-3.5 mb-5 flex items-start gap-3">
              <span className="material-symbols-outlined text-amber-700 text-[20px] shrink-0 mt-0.5">info</span>
              <p className="text-xs text-amber-900 leading-relaxed">
                {t('profile.academic_links_notice', 'Anda dapat mengisi seluruh tautan akademik di bawah ini kapan saja. Data akan tersimpan dengan aman dan otomatis tampil secara publik begitu Anda mengaktifkan paket Ekonomis atau Eksklusif.')}
              </p>
            </div>

            <div className="space-y-4">
              {/* Scopus */}
              <div className="p-4 bg-white border border-gray-200/90 rounded-2xl hover:border-orange-300 transition-all shadow-2xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <ScopusLogo />
                  <div>
                    <h5 className="font-bold text-sm text-[#1F2A22]">Scopus</h5>
                    <p className="text-[11px] text-gray-500">Elsevier Scopus Author Profile & Citations</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{t('Scopus URL')}</Label>
                    <input
                      className={INPUT}
                      value={akademikForm.scopus_url}
                      onChange={e => setAkademikForm({ ...akademikForm, scopus_url: e.target.value })}
                      placeholder={t('https://www.scopus.com/authid/detail.uri?authorId=...')}
                    />
                  </div>
                  <div>
                    <Label>{t('Scopus Metrics (opsional)')}</Label>
                    <input
                      className={INPUT}
                      value={akademikForm.scopus_metrics}
                      onChange={e => setAkademikForm({ ...akademikForm, scopus_metrics: e.target.value })}
                      placeholder={t('Contoh: H-index 8 · 24 dokumen')}
                    />
                  </div>
                </div>
              </div>

              {/* Google Scholar */}
              <div className="p-4 bg-white border border-gray-200/90 rounded-2xl hover:border-blue-300 transition-all shadow-2xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <GoogleScholarLogo />
                  <div>
                    <h5 className="font-bold text-sm text-[#1F2A22]">Google Scholar</h5>
                    <p className="text-[11px] text-gray-500">Google Scholar Profile & Citations</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{t('Google Scholar URL')}</Label>
                    <input
                      className={INPUT}
                      value={akademikForm.google_scholar_url}
                      onChange={e => setAkademikForm({ ...akademikForm, google_scholar_url: e.target.value })}
                      placeholder={t('https://scholar.google.com/citations?user=...')}
                    />
                  </div>
                  <div>
                    <Label>{t('Google Scholar Metrics (opsional)')}</Label>
                    <input
                      className={INPUT}
                      value={akademikForm.google_scholar_metrics}
                      onChange={e => setAkademikForm({ ...akademikForm, google_scholar_metrics: e.target.value })}
                      placeholder={t('Contoh: 312 sitasi')}
                    />
                  </div>
                </div>
              </div>

              {/* SINTA */}
              <div className="p-4 bg-white border border-gray-200/90 rounded-2xl hover:border-teal-300 transition-all shadow-2xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <SintaLogo />
                  <div>
                    <h5 className="font-bold text-sm text-[#1F2A22]">SINTA</h5>
                    <p className="text-[11px] text-gray-500">Science and Technology Index (Kemendikbudristek)</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{t('SINTA URL')}</Label>
                    <input
                      className={INPUT}
                      value={akademikForm.sinta_url}
                      onChange={e => setAkademikForm({ ...akademikForm, sinta_url: e.target.value })}
                      placeholder={t('https://sinta.kemdikbud.go.id/authors/profile/...')}
                    />
                  </div>
                  <div>
                    <Label>{t('SINTA Metrics (opsional)')}</Label>
                    <input
                      className={INPUT}
                      value={akademikForm.sinta_metrics}
                      onChange={e => setAkademikForm({ ...akademikForm, sinta_metrics: e.target.value })}
                      placeholder={t('Contoh: Skor SINTA 3 · S3')}
                    />
                  </div>
                </div>
              </div>

              {/* ORCID */}
              <div className="p-4 bg-white border border-gray-200/90 rounded-2xl hover:border-lime-300 transition-all shadow-2xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <OrcidLogo />
                  <div>
                    <h5 className="font-bold text-sm text-[#1F2A22]">ORCID</h5>
                    <p className="text-[11px] text-gray-500">Open Researcher and Contributor ID</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{t('ORCID URL')}</Label>
                    <input
                      className={INPUT}
                      value={akademikForm.orcid_url}
                      onChange={e => setAkademikForm({ ...akademikForm, orcid_url: e.target.value })}
                      placeholder={t('https://orcid.org/0000-0002-XXXX-XXXX')}
                    />
                  </div>
                  <div>
                    <Label>{t('ORCID Metrics (opsional)')}</Label>
                    <input
                      className={INPUT}
                      value={akademikForm.orcid_metrics}
                      onChange={e => setAkademikForm({ ...akademikForm, orcid_metrics: e.target.value })}
                      placeholder={t('Contoh: 0000-0002-XXXX-XXXX')}
                    />
                  </div>
                </div>
              </div>

              {/* ResearchGate */}
              <div className="p-4 bg-white border border-gray-200/90 rounded-2xl hover:border-emerald-300 transition-all shadow-2xs">
                <div className="flex items-center gap-2.5 mb-3">
                  <ResearchGateLogo />
                  <div>
                    <h5 className="font-bold text-sm text-[#1F2A22]">ResearchGate</h5>
                    <p className="text-[11px] text-gray-500">ResearchGate Academic Network</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <Label>{t('ResearchGate URL')}</Label>
                    <input
                      className={INPUT}
                      value={akademikForm.researchgate_url}
                      onChange={e => setAkademikForm({ ...akademikForm, researchgate_url: e.target.value })}
                      placeholder={t('https://www.researchgate.net/profile/...')}
                    />
                  </div>
                  <div>
                    <Label>{t('ResearchGate Metrics (opsional)')}</Label>
                    <input
                      className={INPUT}
                      value={akademikForm.researchgate_metrics}
                      onChange={e => setAkademikForm({ ...akademikForm, researchgate_metrics: e.target.value })}
                      placeholder={t('Contoh: RG Score 12.5')}
                    />
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <WizardNav onBack={goPrev} onNext={goNext} nextLabel={`${t('profile.wizard.continue_to', 'Lanjut ke')} ${TABS[currentTabIdx + 1]?.label}`} t={t} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: PUBLIKASI & RIWAYAT                                */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'publikasi' && (
        <div className="space-y-10 animate-fadeIn">
          {/* ── Sub-tab Pill Navigation ────────────────────────── */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-gray-100 flex-nowrap -mx-1 px-1 touch-pan-x">
            {[
              { id: 'pendidikan', label: t('Publikasi Pendidikan (Disertasi)'), count: pendidikanPubList.length, icon: BookmarkSquareIcon },
              { id: 'buku', label: t('Publikasi Buku'), count: `${bukuPubList.length}/5`, tag: t('5 Terbaik'), icon: BookOpenIcon },
              { id: 'penelitian', label: t('Publikasi Penelitian'), count: penelitianPubList.length, icon: AcademicCapIcon },
              { id: 'jurnal', label: t('Publikasi Jurnal'), count: `${jurnalPubList.length}/10`, tag: t('6-10 Terbaik'), icon: DocumentTextIcon },
            ].map((pill) => {
              const active = publikasiSubTab === pill.id;
              const Icon = pill.icon;
              return (
                <button
                  key={pill.id}
                  type="button"
                  onClick={() => {
                    setPublikasiSubTab(pill.id);
                    setAddingPub(false);
                    setEditPub(null);
                  }}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                    active
                      ? 'bg-[#2E5E3B] text-white shadow-xs'
                      : 'bg-[#F5F4F0] text-[#5B6660] hover:bg-[#EAE8E0] hover:text-[#1F2A22]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                  <span>{pill.label}</span>
                  {pill.count !== undefined && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                        active ? 'bg-white/20 text-white' : 'bg-black/5 text-[#5B6660]'
                      }`}
                    >
                      {pill.count}
                    </span>
                  )}
                  {pill.tag && (
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded-md font-extrabold uppercase tracking-wider ${
                        active ? 'bg-amber-400 text-amber-950' : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {pill.tag}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* ── Widget: Total Jurnal Keseluruhan ────────────────── */}
          {(publikasiSubTab === 'semua' || publikasiSubTab === 'jurnal') && (
            <div className="bg-gradient-to-r from-emerald-50/90 via-white to-emerald-50/40 border border-emerald-200/90 rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-emerald-700/10 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-700/20">
                    <DocumentTextIcon className="w-5 h-5 text-emerald-800" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-gray-900 tracking-tight">
                        {t('Total Publikasi Jurnal Keseluruhan')}
                      </h4>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {t('Portofolio Jurnal')}
                      </span>
                      {expert?.update_status === 'menunggu_verifikasi' && expert?.pending_changes?.total_jurnal !== undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">hourglass_top</span>
                          {t('Menunggu Verifikasi Admin')}
                        </span>
                      )}
                      {expert?.profile_status === 'aktif' && expert?.total_jurnal !== null && expert?.total_jurnal !== undefined && expert?.pending_changes?.total_jurnal === undefined && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          {t('Tersimpan')}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#5B6660] mt-0.5 leading-relaxed max-w-xl">
                      {t('Ketikkan angka total keseluruhan publikasi jurnal yang pernah Anda publikasikan (misal: 15, 30, 50). Dari total ini, Anda dapat melampirkan 6 hingga 10 karya jurnal terbaik pada daftar di bawah.')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-center shrink-0 flex-wrap">
                  <div className="relative w-36">
                    <input
                      type="number"
                      min="0"
                      disabled={!isEditingTotalJurnal && Boolean((expert?.total_jurnal !== null && expert?.total_jurnal !== undefined && expert?.total_jurnal !== '') || expert?.pending_changes?.total_jurnal !== undefined)}
                      className={`w-full h-10 px-3 pr-14 py-2 border-2 rounded-xl font-bold text-base transition-colors text-center shadow-xs ${
                        !isEditingTotalJurnal && Boolean((expert?.total_jurnal !== null && expert?.total_jurnal !== undefined && expert?.total_jurnal !== '') || expert?.pending_changes?.total_jurnal !== undefined)
                          ? 'bg-emerald-50/70 border-emerald-200 text-gray-800 cursor-not-allowed'
                          : 'bg-white border-[#2E5E3B] text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#2E5E3B]/30'
                      }`}
                      value={form.total_jurnal !== undefined && form.total_jurnal !== null ? form.total_jurnal : ''}
                      onChange={(v) => setForm({ ...form, total_jurnal: v.target.value })}
                      placeholder={jurnalPubList.length > 0 ? String(jurnalPubList.length) : '0'}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-bold text-gray-400 pointer-events-none">
                      Jurnal
                    </span>
                  </div>

                  {isEditingTotalJurnal || (!expert?.total_jurnal && expert?.total_jurnal !== 0 && expert?.pending_changes?.total_jurnal === undefined) ? (
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        className="h-10 px-4 rounded-xl bg-[#2E5E3B] hover:bg-[#244B2F] text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
                        onClick={saveTotalJurnal}
                        disabled={saving}
                      >
                        {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                        <span>{t('Simpan')}</span>
                      </button>
                      {Boolean((expert?.total_jurnal !== null && expert?.total_jurnal !== undefined && expert?.total_jurnal !== '') || expert?.pending_changes?.total_jurnal !== undefined) && (
                        <button
                          type="button"
                          className="h-10 px-3 rounded-xl bg-white border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition-all shadow-xs cursor-pointer shrink-0"
                          onClick={() => {
                            setIsEditingTotalJurnal(false);
                            setForm((prev) => ({
                              ...prev,
                              total_jurnal: expert?.pending_changes?.total_jurnal ?? expert?.total_jurnal ?? '',
                            }));
                          }}
                          disabled={saving}
                        >
                          {t('Batal')}
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="h-10 px-3.5 rounded-xl bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                      onClick={() => setIsEditingTotalJurnal(true)}
                    >
                      <PencilIcon className="w-3.5 h-3.5 text-[#2E5E3B]" strokeWidth={2} />
                      <span>{t('Ubah')}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Sub-Sections Publikasi ───────────────────────────── */}
          {/* 1. SEKSI PUBLIKASI JURNAL (6 / 10 Terbaik) */}
          {(publikasiSubTab === 'semua' || publikasiSubTab === 'jurnal') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-emerald-700" strokeWidth={2} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#1F2A22] uppercase tracking-wider">
                        {t('Publikasi Jurnal')}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {t('6 / 10 Jurnal Terbaik')}
                      </span>
                    </div>
                  </div>
                </div>

                {jurnalPubList.length < 10 && addingPub !== 'jurnal' && (
                  <button
                    className={BTN_GHOST + ' text-xs !py-1.5'}
                    onClick={() => {
                      setNewPub({ kategori: 'jurnal', jenis: 'Jurnal', judul: '', penerbit: '', tahun: '', link: '', deskripsi: '' });
                      setAddingPub('jurnal');
                    }}
                  >
                    <PlusCircleIcon className="w-4 h-4" strokeWidth={2} />
                    {t('Tambah Jurnal Terbaik')}
                  </button>
                )}
              </div>

              {/* Status info bar 6 / 10 terbaik */}
              <div
                className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs flex-wrap ${
                  jurnalPubList.length >= 6
                    ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                    : 'bg-amber-50/80 border-amber-200 text-amber-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">
                    {jurnalPubList.length >= 6 ? 'verified' : 'info'}
                  </span>
                  <span>
                    {jurnalPubList.length >= 6
                      ? t(`Kuota jurnal optimal terpenuhi (${jurnalPubList.length} dari maksimal 10 jurnal terbaik).`)
                      : t(`Direkomendasikan menampilkan 6 s/d 10 jurnal terbaik untuk kredibilitas akademik (saat ini ${jurnalPubList.length} dari 10).`)}
                  </span>
                </div>
                <span className="font-extrabold text-[11px] px-2 py-0.5 rounded-md bg-white border border-current shadow-2xs">
                  {jurnalPubList.length} / 10
                </span>
              </div>

              {/* Form Tambah Jurnal Inline */}
              {addingPub === 'jurnal' && (
                <Card className="border-2 border-emerald-500/40 bg-emerald-50/20 shadow-sm animate-fadeIn">
                  <SectionTitle icon={PlusCircleIcon}>
                    {t('Tambah Jurnal Terbaik (Maks. 10)')}
                  </SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="md:col-span-2">
                      <Label>{t('Judul Artikel Jurnal *')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.judul}
                        onChange={(v) => setNewPub({ ...newPub, judul: v.target.value })}
                        placeholder={t('Contoh: Analisis Dampak Lingkungan pada Proyek Infrastruktur...')}
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label>{t('Nama Jurnal & Edisi / Penerbit')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.penerbit}
                        onChange={(v) => setNewPub({ ...newPub, penerbit: v.target.value })}
                        placeholder={t('Contoh: Jurnal Teknik Sipil Vol. 12 (Sinta 2)')}
                      />
                    </div>
                    <div>
                      <Label>{t('Tahun Terbit')}</Label>
                      <input
                        type="number"
                        className={INPUT}
                        value={newPub.tahun}
                        onChange={(v) => setNewPub({ ...newPub, tahun: v.target.value })}
                        placeholder="2024"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t('Link DOI / Tautan Jurnal (opsional)')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.link}
                        onChange={(v) => setNewPub({ ...newPub, link: v.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={BTN_PRIMARY}
                      onClick={() => addPub('jurnal')}
                      disabled={saving}
                    >
                      {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                      {saving ? t('Menyimpan...') : t('Simpan')}
                    </button>
                    <button className={BTN_GHOST} onClick={() => setAddingPub(false)}>
                      {t('Batal')}
                    </button>
                  </div>
                </Card>
              )}

              {jurnalPubList.length === 0 && addingPub !== 'jurnal' && (
                <Card>
                  <p className="text-sm text-[#5B6660] text-center py-4">
                    {t('Belum ada karya jurnal terbaik yang ditambahkan.')}
                  </p>
                </Card>
              )}

              {jurnalPubList.map((p, idx) => (
                <Card key={p.id || idx}>
                  {editPub?.id === p.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <Label>{t('Judul Artikel Jurnal *')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.judul}
                            onChange={(v) => setEditPub({ ...editPub, judul: v.target.value })}
                          />
                        </div>
                        <div>
                          <Label>{t('Nama Jurnal / Penerbit / Indeks')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.penerbit || ''}
                            onChange={(v) => setEditPub({ ...editPub, penerbit: v.target.value })}
                          />
                        </div>
                        <div>
                          <Label>{t('Tahun Terbit')}</Label>
                          <input
                            type="number"
                            className={INPUT}
                            value={editPub.tahun || ''}
                            onChange={(v) => setEditPub({ ...editPub, tahun: v.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>{t('DOI / Tautan Artikel (opsional)')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.link || ''}
                            onChange={(v) => setEditPub({ ...editPub, link: v.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button className={BTN_PRIMARY} onClick={() => updatePub(p.id)} disabled={saving}>
                          {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                          {saving ? t('Menyimpan...') : t('Simpan')}
                        </button>
                        <button className={BTN_GHOST} onClick={() => setEditPub(null)}>
                          {t('Batal')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                            #{idx + 1} {t('Jurnal Terbaik')}
                          </span>
                          {p.tahun && (
                            <span className="text-[11px] font-semibold text-[#5B6660]">
                              {p.tahun}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[#1F2A22] text-sm leading-snug break-words">{p.judul}</p>
                        {p.penerbit && (
                          <p className="text-xs text-[#5B6660] flex items-center gap-1.5 break-words">
                            <span className="material-symbols-outlined text-[14px] shrink-0">menu_book</span>
                            <span>{p.penerbit}</span>
                          </p>
                        )}
                        {p.link && p.link !== '#' && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-[#2E5E3B] font-semibold hover:underline inline-flex items-center gap-1 pt-0.5"
                          >
                            <ArrowTopRightOnSquareIcon className="w-[14px] h-[14px] shrink-0" strokeWidth={2} />
                            {t('Lihat Publikasi Jurnal')}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-end">
                        <button className={BTN_GHOST + ' !px-2.5 !py-1 text-xs'} onClick={() => setEditPub({ ...p, kategori: 'jurnal' })}>
                          <PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{t('Edit')}</span>
                        </button>
                        <button className={BTN_DANGER + ' !px-2.5 !py-1 text-xs'} onClick={() => deletePub(p.id)}>
                          <TrashIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{t('Hapus')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* 2. SEKSI PUBLIKASI BUKU (5 Buku Terbaik) */}
          {(publikasiSubTab === 'semua' || publikasiSubTab === 'buku') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-amber-800" strokeWidth={2} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#1F2A22] uppercase tracking-wider">
                        {t('Publikasi Buku')}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                        {t('5 Buku Terbaik')}
                      </span>
                    </div>
                  </div>
                </div>

                {bukuPubList.length < 5 && addingPub !== 'buku' && (
                  <button
                    className={BTN_GHOST + ' text-xs !py-1.5'}
                    onClick={() => {
                      setNewPub({ kategori: 'buku', jenis: 'Buku', judul: '', penerbit: '', tahun: '', link: '', deskripsi: '' });
                      setAddingPub('buku');
                    }}
                  >
                    <PlusCircleIcon className="w-4 h-4" strokeWidth={2} />
                    {t('Tambah Buku Terbaik')}
                  </button>
                )}
              </div>

              {/* Status info bar 5 buku terbaik */}
              <div className="p-3 rounded-xl border bg-amber-50/80 border-amber-200 text-amber-950 flex items-center justify-between gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">auto_stories</span>
                  <span>
                    {bukuPubList.length >= 5
                      ? t('Batas maksimal 5 buku terbaik telah tercapai.')
                      : t(`Tampilkan hingga 5 karya buku terbaik ber-ISBN atau diterbitkan resmi (saat ini ${bukuPubList.length} dari 5).`)}
                  </span>
                </div>
                <span className="font-extrabold text-[11px] px-2 py-0.5 rounded-md bg-white border border-current shadow-2xs">
                  {bukuPubList.length} / 5
                </span>
              </div>

              {/* Form Tambah Buku Inline */}
              {addingPub === 'buku' && (
                <Card className="border-2 border-amber-500/40 bg-amber-50/20 shadow-sm animate-fadeIn">
                  <SectionTitle icon={PlusCircleIcon}>
                    {t('Tambah Buku Terbaik (Maks. 5)')}
                  </SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="md:col-span-2">
                      <Label>{t('Judul Buku *')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.judul}
                        onChange={(v) => setNewPub({ ...newPub, judul: v.target.value })}
                        placeholder={t('Contoh: Buku Ajar Manajemen Amdal dan Konservasi Alam...')}
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label>{t('Penerbit / ISBN')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.penerbit}
                        onChange={(v) => setNewPub({ ...newPub, penerbit: v.target.value })}
                        placeholder={t('Contoh: Penerbit Erlangga / ISBN: 978-602-...')}
                      />
                    </div>
                    <div>
                      <Label>{t('Tahun Terbit')}</Label>
                      <input
                        type="number"
                        className={INPUT}
                        value={newPub.tahun}
                        onChange={(v) => setNewPub({ ...newPub, tahun: v.target.value })}
                        placeholder="2024"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t('Link Toko / Dokumen Buku (opsional)')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.link}
                        onChange={(v) => setNewPub({ ...newPub, link: v.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={BTN_PRIMARY}
                      onClick={() => addPub('buku')}
                      disabled={saving}
                    >
                      {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                      {saving ? t('Menyimpan...') : t('Simpan')}
                    </button>
                    <button className={BTN_GHOST} onClick={() => setAddingPub(false)}>
                      {t('Batal')}
                    </button>
                  </div>
                </Card>
              )}

              {bukuPubList.length === 0 && addingPub !== 'buku' && (
                <Card>
                  <p className="text-sm text-[#5B6660] text-center py-4">
                    {t('Belum ada karya buku yang ditambahkan.')}
                  </p>
                </Card>
              )}

              {bukuPubList.map((p, idx) => (
                <Card key={p.id || idx}>
                  {editPub?.id === p.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <Label>{t('Judul Buku *')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.judul}
                            onChange={(v) => setEditPub({ ...editPub, judul: v.target.value })}
                          />
                        </div>
                        <div>
                          <Label>{t('Penerbit / ISBN')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.penerbit || ''}
                            onChange={(v) => setEditPub({ ...editPub, penerbit: v.target.value })}
                          />
                        </div>
                        <div>
                          <Label>{t('Tahun Terbit')}</Label>
                          <input
                            type="number"
                            className={INPUT}
                            value={editPub.tahun || ''}
                            onChange={(v) => setEditPub({ ...editPub, tahun: v.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>{t('Link Buku / Toko / PDF (opsional)')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.link || ''}
                            onChange={(v) => setEditPub({ ...editPub, link: v.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button className={BTN_PRIMARY} onClick={() => updatePub(p.id)} disabled={saving}>
                          {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                          {saving ? t('Menyimpan...') : t('Simpan')}
                        </button>
                        <button className={BTN_GHOST} onClick={() => setEditPub(null)}>
                          {t('Batal')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                            #{idx + 1} {t('Buku Terbaik')}
                          </span>
                          {p.tahun && (
                            <span className="text-[11px] font-semibold text-[#5B6660]">
                              {p.tahun}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[#1F2A22] text-sm leading-snug break-words">{p.judul}</p>
                        {p.penerbit && (
                          <p className="text-xs text-[#5B6660] flex items-center gap-1.5 break-words">
                            <span className="material-symbols-outlined text-[14px] shrink-0">domain</span>
                            <span>{p.penerbit}</span>
                          </p>
                        )}
                        {p.link && p.link !== '#' && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-amber-800 font-semibold hover:underline inline-flex items-center gap-1 pt-0.5"
                          >
                            <ArrowTopRightOnSquareIcon className="w-[14px] h-[14px] shrink-0" strokeWidth={2} />
                            {t('Lihat Buku')}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-end">
                        <button className={BTN_GHOST + ' !px-2.5 !py-1 text-xs'} onClick={() => setEditPub({ ...p, kategori: 'buku' })}>
                          <PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{t('Edit')}</span>
                        </button>
                        <button className={BTN_DANGER + ' !px-2.5 !py-1 text-xs'} onClick={() => deletePub(p.id)}>
                          <TrashIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{t('Hapus')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* 3. SEKSI PUBLIKASI PENELITIAN */}
          {(publikasiSubTab === 'semua' || publikasiSubTab === 'penelitian') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AcademicCapIcon className="w-5 h-5 text-blue-700" strokeWidth={2} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#1F2A22] uppercase tracking-wider">
                        {t('Publikasi Penelitian')}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                        {penelitianPubList.length} {t('Karya')}
                      </span>
                    </div>
                  </div>
                </div>

                {addingPub !== 'penelitian' && (
                  <button
                    className={BTN_GHOST + ' text-xs !py-1.5'}
                    onClick={() => {
                      setNewPub({ kategori: 'penelitian', jenis: 'Penelitian', judul: '', penerbit: '', tahun: '', link: '', deskripsi: '' });
                      setAddingPub('penelitian');
                    }}
                  >
                    <PlusCircleIcon className="w-4 h-4" strokeWidth={2} />
                    {t('Tambah Publikasi Penelitian')}
                  </button>
                )}
              </div>

              {/* Form Tambah Penelitian Inline */}
              {addingPub === 'penelitian' && (
                <Card className="border-2 border-blue-500/40 bg-blue-50/20 shadow-sm animate-fadeIn">
                  <SectionTitle icon={PlusCircleIcon}>
                    {t('Tambah Publikasi Penelitian')}
                  </SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="md:col-span-2">
                      <Label>{t('Judul Publikasi Riset *')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.judul}
                        onChange={(v) => setNewPub({ ...newPub, judul: v.target.value })}
                        placeholder={t('Contoh: Studi Kualitas Air Sungai di Kawasan Industri...')}
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label>{t('Media / Prosiding / Institusi')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.penerbit}
                        onChange={(v) => setNewPub({ ...newPub, penerbit: v.target.value })}
                        placeholder={t('Contoh: Prosiding Seminar Nasional Lingkungan Hidup')}
                      />
                    </div>
                    <div>
                      <Label>{t('Tahun')}</Label>
                      <input
                        type="number"
                        className={INPUT}
                        value={newPub.tahun}
                        onChange={(v) => setNewPub({ ...newPub, tahun: v.target.value })}
                        placeholder="2024"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t('Link Publikasi Riset (opsional)')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.link}
                        onChange={(v) => setNewPub({ ...newPub, link: v.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={BTN_PRIMARY}
                      onClick={() => addPub('penelitian')}
                      disabled={saving}
                    >
                      {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                      {saving ? t('Menyimpan...') : t('Simpan')}
                    </button>
                    <button className={BTN_GHOST} onClick={() => setAddingPub(false)}>
                      {t('Batal')}
                    </button>
                  </div>
                </Card>
              )}

              {penelitianPubList.length === 0 && addingPub !== 'penelitian' && (
                <Card>
                  <p className="text-sm text-[#5B6660] text-center py-4">
                    {t('Belum ada data publikasi penelitian & riset.')}
                  </p>
                </Card>
              )}

              {penelitianPubList.map((p, idx) => (
                <Card key={p.id || idx}>
                  {editPub?.id === p.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <Label>{t('Judul Publikasi Riset *')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.judul}
                            onChange={(v) => setEditPub({ ...editPub, judul: v.target.value })}
                          />
                        </div>
                        <div>
                          <Label>{t('Penyelenggara / Media / Prosiding')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.penerbit || ''}
                            onChange={(v) => setEditPub({ ...editPub, penerbit: v.target.value })}
                          />
                        </div>
                        <div>
                          <Label>{t('Tahun')}</Label>
                          <input
                            type="number"
                            className={INPUT}
                            value={editPub.tahun || ''}
                            onChange={(v) => setEditPub({ ...editPub, tahun: v.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>{t('Link Publikasi Riset (opsional)')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.link || ''}
                            onChange={(v) => setEditPub({ ...editPub, link: v.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button className={BTN_PRIMARY} onClick={() => updatePub(p.id)} disabled={saving}>
                          {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                          {saving ? t('Menyimpan...') : t('Simpan')}
                        </button>
                        <button className={BTN_GHOST} onClick={() => setEditPub(null)}>
                          {t('Batal')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            {t('Publikasi Riset')}
                          </span>
                          {p.tahun && (
                            <span className="text-[11px] font-semibold text-[#5B6660]">
                              {p.tahun}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[#1F2A22] text-sm leading-snug break-words">{p.judul}</p>
                        {p.penerbit && (
                          <p className="text-xs text-[#5B6660] flex items-center gap-1.5 break-words">
                            <span className="material-symbols-outlined text-[14px] shrink-0">science</span>
                            <span>{p.penerbit}</span>
                          </p>
                        )}
                        {p.link && p.link !== '#' && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-blue-700 font-semibold hover:underline inline-flex items-center gap-1 pt-0.5"
                          >
                            <ArrowTopRightOnSquareIcon className="w-[14px] h-[14px] shrink-0" strokeWidth={2} />
                            {t('Lihat Publikasi Riset')}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-end">
                        <button className={BTN_GHOST + ' !px-2.5 !py-1 text-xs'} onClick={() => setEditPub({ ...p, kategori: 'penelitian' })}>
                          <PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{t('Edit')}</span>
                        </button>
                        <button className={BTN_DANGER + ' !px-2.5 !py-1 text-xs'} onClick={() => deletePub(p.id)}>
                          <TrashIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{t('Hapus')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          {/* 4. SEKSI PUBLIKASI PENDIDIKAN */}
          {(publikasiSubTab === 'semua' || publikasiSubTab === 'pendidikan') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <BookmarkSquareIcon className="w-5 h-5 text-purple-700" strokeWidth={2} />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-bold text-[#1F2A22] uppercase tracking-wider">
                        {t('Publikasi Pendidikan (Disertasi)')}
                      </h3>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                        {pendidikanPubList.length} {t('Karya')}
                      </span>
                    </div>
                  </div>
                </div>

                {addingPub !== 'pendidikan' && (
                  <button
                    className={BTN_GHOST + ' text-xs !py-1.5'}
                    onClick={() => {
                      setNewPub({ kategori: 'pendidikan', jenis: 'Pendidikan', judul: '', penerbit: '', tahun: '', link: '', deskripsi: '' });
                      setAddingPub('pendidikan');
                    }}
                  >
                    <PlusCircleIcon className="w-4 h-4" strokeWidth={2} />
                    {t('Tambah Publikasi Pendidikan (Disertasi)')}
                  </button>
                )}
              </div>

              {/* Form Tambah Pendidikan Inline */}
              {addingPub === 'pendidikan' && (
                <Card className="border-2 border-purple-500/40 bg-purple-50/20 shadow-sm animate-fadeIn">
                  <SectionTitle icon={PlusCircleIcon}>
                    {t('Tambah Publikasi Pendidikan (Disertasi)')}
                  </SectionTitle>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                    <div className="md:col-span-2">
                      <Label>{t('Judul Bahan Ajar / Karya Pendidikan *')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.judul}
                        onChange={(v) => setNewPub({ ...newPub, judul: v.target.value })}
                        placeholder={t('Contoh: Modul Pembelajaran Praktikum Tata Ruang...')}
                        autoFocus
                      />
                    </div>
                    <div>
                      <Label>{t('Institusi / Penerbit')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.penerbit}
                        onChange={(v) => setNewPub({ ...newPub, penerbit: v.target.value })}
                        placeholder={t('Contoh: Lembaga Penerbitan Universitas...')}
                      />
                    </div>
                    <div>
                      <Label>{t('Tahun Terbit')}</Label>
                      <input
                        type="number"
                        className={INPUT}
                        value={newPub.tahun}
                        onChange={(v) => setNewPub({ ...newPub, tahun: v.target.value })}
                        placeholder="2024"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <Label>{t('Link / Tautan Publikasi (opsional)')}</Label>
                      <input
                        className={INPUT}
                        value={newPub.link}
                        onChange={(v) => setNewPub({ ...newPub, link: v.target.value })}
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className={BTN_PRIMARY}
                      onClick={() => addPub('pendidikan')}
                      disabled={saving}
                    >
                      {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                      {saving ? t('Menyimpan...') : t('Simpan')}
                    </button>
                    <button className={BTN_GHOST} onClick={() => setAddingPub(false)}>
                      {t('Batal')}
                    </button>
                  </div>
                </Card>
              )}

              {pendidikanPubList.length === 0 && addingPub !== 'pendidikan' && (
                <Card>
                  <p className="text-sm text-[#5B6660] text-center py-4">
                    {t('Belum ada data publikasi bahan ajar & materi pendidikan.')}
                  </p>
                </Card>
              )}

              {pendidikanPubList.map((p, idx) => (
                <Card key={p.id || idx}>
                  {editPub?.id === p.id ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="md:col-span-2">
                          <Label>{t('Judul Bahan Ajar / Karya Pendidikan *')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.judul}
                            onChange={(v) => setEditPub({ ...editPub, judul: v.target.value })}
                          />
                        </div>
                        <div>
                          <Label>{t('Institusi / Penerbit')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.penerbit || ''}
                            onChange={(v) => setEditPub({ ...editPub, penerbit: v.target.value })}
                          />
                        </div>
                        <div>
                          <Label>{t('Tahun Terbit')}</Label>
                          <input
                            type="number"
                            className={INPUT}
                            value={editPub.tahun || ''}
                            onChange={(v) => setEditPub({ ...editPub, tahun: v.target.value })}
                          />
                        </div>
                        <div className="md:col-span-2">
                          <Label>{t('Link / Tautan Publikasi (opsional)')}</Label>
                          <input
                            className={INPUT}
                            value={editPub.link || ''}
                            onChange={(v) => setEditPub({ ...editPub, link: v.target.value })}
                          />
                        </div>
                      </div>
                      <div className="flex gap-2 pt-1">
                        <button className={BTN_PRIMARY} onClick={() => updatePub(p.id)} disabled={saving}>
                          {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                          {saving ? t('Menyimpan...') : t('Simpan')}
                        </button>
                        <button className={BTN_GHOST} onClick={() => setEditPub(null)}>
                          {t('Batal')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 sm:gap-4">
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-purple-100 text-purple-800 border border-purple-200">
                            {t('Karya Pendidikan')}
                          </span>
                          {p.tahun && (
                            <span className="text-[11px] font-semibold text-[#5B6660]">
                              {p.tahun}
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[#1F2A22] text-sm leading-snug break-words">{p.judul}</p>
                        {p.penerbit && (
                          <p className="text-xs text-[#5B6660] flex items-center gap-1.5 break-words">
                            <span className="material-symbols-outlined text-[14px] shrink-0">school</span>
                            <span>{p.penerbit}</span>
                          </p>
                        )}
                        {p.link && p.link !== '#' && (
                          <a
                            href={p.link}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-purple-700 font-semibold hover:underline inline-flex items-center gap-1 pt-0.5"
                          >
                            <ArrowTopRightOnSquareIcon className="w-[14px] h-[14px] shrink-0" strokeWidth={2} />
                            {t('Lihat Publikasi Pendidikan (Disertasi)')}
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 self-end sm:self-start shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-end">
                        <button className={BTN_GHOST + ' !px-2.5 !py-1 text-xs'} onClick={() => setEditPub({ ...p, kategori: 'pendidikan' })}>
                          <PencilIcon className="w-3.5 h-3.5" strokeWidth={2} />
                          <span>{t('Edit')}</span>
                        </button>
                        <button className={BTN_DANGER + ' !px-2.5 !py-1 text-xs'} onClick={() => deletePub(p.id)}>
                          <TrashIcon className="w-4 h-4" strokeWidth={2} />
                          <span>{t('Hapus')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </Card>
              ))}
            </div>
          )}

          <WizardNav onBack={goPrev} onNext={goNext} nextLabel={`${t('profile.wizard.continue_to', 'Lanjut ke')} ${TABS[currentTabIdx + 1]?.label}`} t={t} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: ORGANISASI                                          */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'organisasi' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Header & Daftar Organisasi */}
          <div className="space-y-4">
            <div className="flex items-center gap-1 mb-0">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                <UserGroupIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                {t('ORGANISASI')}
              </h3>
              <Tooltip text={t('Cantumkan keanggotaan atau jabatan organisasi profesi yang Anda ikuti. Menunjukkan keterlibatan aktif di komunitas keahlian Anda.')} />
            </div>

            {organisasi.length === 0 && !addingOrg && (
              <Card>
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#2E5E3B] flex items-center justify-center mx-auto">
                    <UserGroupIcon className="w-6 h-6" strokeWidth={1.75} />
                  </div>
                  <p className="text-sm font-bold text-gray-800">{t('Belum Ada Riwayat Organisasi')}</p>
                  <p className="text-xs text-[#5B6660] max-w-sm mx-auto">
                    {t('Tambahkan keanggotaan organisasi profesi, asosiasi keahlian, atau lembaga ilmiah yang Anda ikuti.')}
                  </p>
                </div>
              </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {organisasi.map((o) => (
                <div key={o.id} className={editOrg?.id === o.id ? 'md:col-span-2' : ''}>
                  <Card className="h-full hover:shadow-md transition-shadow duration-200">
                    {editOrg?.id === o.id ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <Label>{t('Nama Organisasi *')}</Label>
                            <input
                              className={INPUT}
                              value={editOrg.nama}
                              onChange={(v) => setEditOrg({ ...editOrg, nama: v.target.value })}
                            />
                          </div>
                          <div>
                            <Label>{t('Jabatan')}</Label>
                            <input
                              className={INPUT}
                              value={editOrg.jabatan}
                              onChange={(v) => setEditOrg({ ...editOrg, jabatan: v.target.value })}
                            />
                          </div>
                          <div>
                            <Label>{t('Periode')}</Label>
                            <input
                              className={INPUT}
                              value={editOrg.periode}
                              onChange={(v) => setEditOrg({ ...editOrg, periode: v.target.value })}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button className={BTN_PRIMARY} onClick={() => updateOrg(o.id)} disabled={saving}>
                            {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                            {saving ? t('Menyimpan...') : t('Simpan')}
                          </button>
                          <button className={BTN_GHOST} onClick={() => setEditOrg(null)}>
                            {t('Batal')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 h-full">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[#1F2A22] text-sm sm:text-base leading-snug break-words">{o.nama}</p>
                          <div className="flex items-center gap-2 flex-wrap mt-2">
                            {o.jabatan && <span className="text-xs sm:text-sm font-semibold text-[#5B6660] break-words">{o.jabatan}</span>}
                            {o.periode && (
                              <span className="inline-block text-[11px] text-[#2E5E3B] font-semibold bg-emerald-50 border border-emerald-200/60 px-2.5 py-0.5 rounded-full">
                                {o.periode}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 w-full sm:w-auto justify-end">
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
                            title={t('Edit')}
                            onClick={() => setEditOrg({ ...o })}
                          >
                            <PencilIcon className="w-4 h-4" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title={t('Hapus')}
                            onClick={() => deleteOrg(o.id)}
                          >
                            <TrashIcon className="w-4 h-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              ))}
            </div>

            {addingOrg ? (
              <Card>
                <SectionTitle icon={PlusCircleIcon}>{t('Tambah Organisasi')}</SectionTitle>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
                  <div>
                    <Label>{t('Nama Organisasi *')}</Label>
                    <input
                      className={INPUT}
                      value={newOrg.nama}
                      onChange={(v) => setNewOrg({ ...newOrg, nama: v.target.value })}
                      placeholder={t('Contoh: Asosiasi Ahli Sistem Dinamik Indonesia')}
                    />
                  </div>
                  <div>
                    <Label>{t('Jabatan')}</Label>
                    <input
                      className={INPUT}
                      value={newOrg.jabatan}
                      onChange={(v) => setNewOrg({ ...newOrg, jabatan: v.target.value })}
                      placeholder={t('Contoh: Ketua Umum / Anggota')}
                    />
                  </div>
                  <div>
                    <Label>{t('Periode')}</Label>
                    <input
                      className={INPUT}
                      value={newOrg.periode}
                      onChange={(v) => setNewOrg({ ...newOrg, periode: v.target.value })}
                      placeholder={t('Contoh: 2020-2025 / 2017-Sekarang')}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className={BTN_PRIMARY} onClick={addOrg} disabled={saving}>
                    {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" strokeWidth={2} />}
                    {saving ? t('Menyimpan...') : t('Simpan')}
                  </button>
                  <button className={BTN_GHOST} onClick={() => setAddingOrg(false)}>
                    {t('Batal')}
                  </button>
                </div>
              </Card>
            ) : (
              <button
                type="button"
                className="h-10 px-4 rounded-xl border-2 border-emerald-800/20 hover:border-[#2E5E3B] hover:bg-emerald-50/50 text-[#2E5E3B] text-xs font-bold transition-all inline-flex items-center gap-2 cursor-pointer shadow-2xs self-start"
                onClick={() => setAddingOrg(true)}
              >
                <PlusCircleIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                <span>{t('Tambah Organisasi')}</span>
              </button>
            )}
          </div>

          <WizardNav
            onBack={goPrev}
            onNext={goNext}
            nextLabel={`${t('profile.wizard.continue_to', 'Lanjut ke')} ${TABS[currentTabIdx + 1]?.label}`}
            t={t}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: GALERI FOTO (Aturan Paket: Free 2-3, Eko 20, Eks 50) */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'galeri' && (() => {
        const tierInfo = getGalleryTierInfo(expert);
        const isFree = tierInfo.tier === 'free';
        const isEkonomis = tierInfo.tier === 'ekonomis';
        const isEksklusif = tierInfo.tier === 'eksklusif';
        const isFull = galleryList.length >= tierInfo.max;
        const isUnderMin = isFree && galleryList.length < tierInfo.min;

        // Filter foto berdasarkan album aktif jika paket eksklusif
        const displayPhotos = (!isEksklusif || activeGalleryAlbum === 'all')
          ? galleryList
          : activeGalleryAlbum === '__unassigned'
            ? galleryList.filter((item) => !(typeof item === 'object' && item.album))
            : galleryList.filter((item) => typeof item === 'object' && item.album === activeGalleryAlbum);

        const unassignedCount = galleryList.filter((item) => !(typeof item === 'object' && item.album)).length;

        return (
          <div className="space-y-6 animate-fadeIn">
            {/* ── 1. Banner Kuota & Status Paket Galeri ────────────────── */}
            <Card className="overflow-hidden border border-black/5 shadow-xs">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-black/5">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#2E5E3B]/10 text-[#2E5E3B] flex items-center justify-center shrink-0">
                    <PhotoIcon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-base sm:text-lg text-gray-900">
                        {t('Galeri Foto & Dokumentasi Proyek')}
                      </h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-extrabold uppercase tracking-wide border ${tierInfo.badgeColor}`}>
                        {tierInfo.name}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {tierInfo.description}
                    </p>
                  </div>
                </div>

                {/* Upgrade Button untuk Free & Ekonomis */}
                {!isEksklusif && (
                  <Link
                    to="/paket-layanan"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#8B4513] to-[#A0522D] hover:opacity-95 shadow-2xs shrink-0 self-start md:self-auto cursor-pointer"
                  >
                    <span>Upgrade Paket</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {/* Progress Bar Kuota Foto */}
              <div className="pt-4 pb-2 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2 text-gray-700">
                    <span>Kapasitas Foto:</span>
                    <span className="text-gray-900 font-black">
                      {galleryList.length} dari {tierInfo.max} Foto
                    </span>
                  </div>
                  <span className={`text-[11px] font-extrabold ${isFull ? 'text-rose-600' : 'text-gray-500'}`}>
                    {isFull ? 'Kuota Penuh' : `${tierInfo.max - galleryList.length} slot tersisa`}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-black/5">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${tierInfo.progressColor}`}
                    style={{ width: `${Math.min(100, (galleryList.length / tierInfo.max) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Box Peringatan / Keterangan Khusus Paket */}
              {isFree && (
                <div className="mt-4 p-4 sm:p-5 rounded-2xl bg-amber-50/90 border border-amber-200 text-xs text-amber-950 space-y-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-200/70 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
                      <ExclamationTriangleIcon className="w-5 h-5 text-amber-800" strokeWidth={2} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-sm text-amber-950">
                        Status Awal: Paket Free (Aktif Setelah Konfirmasi ke Admin)
                      </h4>
                      <p className="text-[12px] text-amber-900 leading-relaxed">
                        Saat awal mendaftar dan mengisi profil, akun Anda secara otomatis berstatus <strong>Paket Free</strong> yang akan aktif setelah Anda melakukan verifikasi dan konfirmasi data ke Admin.
                      </p>
                    </div>
                  </div>

                  {/* Rincian Aturan Free */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2 border-t border-amber-200/80 text-[11.5px]">
                    <div className="flex items-start gap-2 bg-white/60 p-2.5 rounded-xl border border-amber-200/60">
                      <span className="material-symbols-outlined text-[17px] text-amber-800 shrink-0 mt-0.5">photo_library</span>
                      <div>
                        <strong className="text-amber-950">Kuota Foto Portofolio:</strong>
                        <p className="text-amber-900 mt-0.5">Wajib <strong>minimal 2 foto</strong> dan <strong>maksimal 3 foto</strong>.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2 bg-white/60 p-2.5 rounded-xl border border-amber-200/60">
                      <span className="material-symbols-outlined text-[17px] text-amber-800 shrink-0 mt-0.5">folder_off</span>
                      <div>
                        <strong className="text-amber-950">Fitur Album / Folder:</strong>
                        <p className="text-amber-900 mt-0.5">Belum tersedia di Paket Free (galeri tampil dalam 1 halaman datar/flat).</p>
                      </div>
                    </div>
                  </div>

                  {/* Indikator Status Min/Max Free */}
                  {isUnderMin ? (
                    <div className="p-3 rounded-xl bg-amber-100/90 border border-amber-300 text-amber-950 text-xs font-medium flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[20px] text-amber-800 shrink-0">info</span>
                      <span>
                        Saat ini Anda baru mengunggah <strong>{galleryList.length} foto</strong>. Mohon unggah <strong>minimal 2 foto</strong> agar kelengkapan data galeri Anda memenuhi syarat konfirmasi verifikasi admin.
                      </span>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-medium flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-[20px] text-emerald-700 shrink-0">check_circle</span>
                      <span>
                        Syarat minimal foto terpenuhi ({galleryList.length} dari 3 foto). Profil Anda siap untuk diverifikasi oleh admin.
                      </span>
                    </div>
                  )}

                  {/* Penjelasan Verifikasi Admin & Upgrade Paket untuk Album/Folder */}
                  <div className="p-3.5 rounded-xl bg-gradient-to-r from-white via-amber-50/50 to-white border border-amber-300/80 text-[11.5px] text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="material-symbols-outlined text-[20px] text-[#8B4513] shrink-0 mt-0.5">workspace_premium</span>
                      <div className="space-y-0.5">
                        <strong className="text-amber-950 text-xs">Ingin membuat Album Foto & menambah kapasitas foto?</strong>
                        <p className="text-amber-900 leading-relaxed">
                          Setelah Anda melakukan verifikasi data ini ke Admin, Anda dapat meng-upgrade akun ke <strong>Paket Ekonomis</strong> (kapasitas 20 foto) atau <strong>Paket Eksklusif</strong> (kapasitas 50 foto + bebas membuat Album Foto/Folder Proyek).
                        </p>
                      </div>
                    </div>
                    <Link
                      to="/paket-layanan"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#8B4513] hover:bg-[#6e370f] text-white text-xs font-bold shrink-0 self-start sm:self-center transition-all shadow-2xs"
                    >
                      <span>Lihat Paket & Upgrade</span>
                      <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              )}

              {isEkonomis && (
                <div className="mt-4 p-4 rounded-2xl bg-blue-50/80 border border-blue-200/90 text-xs text-blue-900 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <InformationCircleIcon className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" strokeWidth={2} />
                    <div className="space-y-0.5 leading-relaxed">
                      <p className="font-extrabold text-blue-950 text-sm">
                        Ketentuan Paket Ekonomis (Maksimal 20 Foto):
                      </p>
                      <p className="text-[11.5px] text-blue-800">
                        Anda dapat mengunggah hingga 20 foto dokumentasi tanpa pembagian folder/album. Jika ingin mengelompokkan dokumentasi ke dalam Album Foto / Folder dan menambah kapasitas hingga 50 foto, Anda dapat beralih ke <strong>Paket Eksklusif</strong>.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {isEksklusif && (
                <div className="mt-4 p-4 rounded-2xl bg-purple-50/80 border border-purple-200/90 text-xs text-purple-900 space-y-2.5">
                  <div className="flex items-start gap-2.5">
                    <CheckBadgeIcon className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" strokeWidth={2} />
                    <div className="space-y-0.5 leading-relaxed">
                      <p className="font-extrabold text-purple-950 text-sm">
                        Fitur Eksklusif Aktif (Kapasitas 50 Foto & Manajemen Album):
                      </p>
                      <p className="text-[11.5px] text-purple-800">
                        Anda memiliki akses penuh untuk membuat album/folder foto tanpa batas, mengelompokkan dokumentasi proyek lapangan, dan dinikmati pengunjung di profil publik.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            {/* ── Preview Fitur Album untuk Non-Eksklusif (Penjelasan / Peringatan Upgrade) ── */}
            {!isEksklusif && (
              <Card className="border border-dashed border-purple-300 bg-gradient-to-r from-purple-50/60 via-white to-purple-50/40 p-4 sm:p-5 rounded-2xl shadow-xs">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3.5">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 mt-0.5 border border-purple-200">
                      <FolderOpenIcon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-xs sm:text-sm font-extrabold text-gray-900">
                          Fitur Pembuatan Album / Folder Foto
                        </h4>
                        <span className="px-2 py-0.5 text-[10px] font-black rounded-md bg-purple-100 text-purple-800 border border-purple-200 uppercase tracking-wide">
                          Khusus Paket Eksklusif
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed max-w-2xl">
                        Ingin mengelompokkan dokumentasi ke dalam folder terpisah (seperti: <em>Sertifikasi, Proyek Lapangan, Workshop & Pelatihan</em>) dan menambah kapasitas hingga <strong>50 foto</strong>? 
                        Setelah verifikasi data ini ke Admin selesai, Anda dapat meng-upgrade akun Anda ke <strong>Paket Eksklusif</strong> untuk membuka fitur ini.
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/paket-layanan"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 shadow-xs shrink-0 self-start sm:self-center transition-all cursor-pointer"
                  >
                    <span>Upgrade Paket</span>
                    <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </Card>
            )}

            {/* ── 2. Folder & Album Bar (KHUSUS PAKET EKSLUSIF) ─────────── */}
            {isEksklusif && (
              <Card className="border border-purple-200/80 bg-gradient-to-br from-white via-purple-50/20 to-white">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2">
                    <FolderOpenIcon className="w-5 h-5 text-purple-700" strokeWidth={2} />
                    <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 uppercase tracking-wide">
                      Folder / Album Foto Proyek
                    </h4>
                    <span className="px-2 py-0.5 text-[10px] font-black rounded-full bg-purple-100 text-purple-800">
                      {galleryAlbums.length} Album
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNewAlbumInput('');
                      setShowNewAlbumModal(true);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer self-start sm:self-auto"
                  >
                    <PlusIcon className="w-4 h-4" strokeWidth={2.5} />
                    <span>Buat Album Baru</span>
                  </button>
                </div>

                {/* Filter Tabs Album */}
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  {/* Tab Semua Foto */}
                  <button
                    type="button"
                    onClick={() => {
                      setActiveGalleryAlbum('all');
                      setTargetUploadAlbum('');
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                      activeGalleryAlbum === 'all'
                        ? 'bg-purple-700 text-white shadow-xs'
                        : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Squares2X2Icon className="w-4 h-4" />
                    <span>Semua Foto</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                      activeGalleryAlbum === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {galleryList.length}
                    </span>
                  </button>

                  {/* List Custom Albums */}
                  {galleryAlbums.map((albumName) => {
                    const count = galleryList.filter((item) => typeof item === 'object' && item.album === albumName).length;
                    const isActive = activeGalleryAlbum === albumName;

                    return (
                      <div
                        key={albumName}
                        className={`inline-flex items-center gap-1.5 pl-3.5 pr-2 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 border ${
                          isActive
                            ? 'bg-purple-700 text-white border-purple-700 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setActiveGalleryAlbum(albumName);
                            setTargetUploadAlbum(albumName);
                          }}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <FolderIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-purple-600'}`} />
                          <span>{albumName}</span>
                          <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                            isActive ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-800'
                          }`}>
                            {count}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAlbum(albumName)}
                          className={`p-1 rounded-lg hover:bg-black/10 transition-colors cursor-pointer ${
                            isActive ? 'text-white/80 hover:text-white' : 'text-gray-400 hover:text-rose-600'
                          }`}
                          title={`Hapus Album "${albumName}"`}
                        >
                          <XMarkIcon className="w-3.5 h-3.5" strokeWidth={2.5} />
                        </button>
                      </div>
                    );
                  })}

                  {/* Tab Tanpa Album (jika ada foto yang belum ber-album) */}
                  {unassignedCount > 0 && galleryAlbums.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setActiveGalleryAlbum('__unassigned');
                        setTargetUploadAlbum('');
                      }}
                      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${
                        activeGalleryAlbum === '__unassigned'
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      <PhotoIcon className="w-4 h-4" />
                      <span>Tanpa Album</span>
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-gray-100 text-gray-600">
                        {unassignedCount}
                      </span>
                    </button>
                  )}
                </div>
              </Card>
            )}

            {/* ── 3. Form Upload Foto Baru ──────────────────────────────── */}
            <Card>
              <div className="flex items-center justify-between gap-3 mb-2">
                <h4 className="text-xs sm:text-sm font-extrabold text-[#1F2A22] uppercase tracking-wide flex items-center gap-2">
                  <CloudArrowUpIcon className="w-5 h-5 text-[#2E5E3B]" strokeWidth={2} />
                  <span>Unggah Foto Baru (Maks. 2MB per foto)</span>
                </h4>
              </div>
              <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                Mendukung format gambar JPG, JPEG, PNG, atau WebP. Foto akan langsung tersimpan ke galeri portofolio Anda.
              </p>

              <div className="bg-[#FAFBF9] rounded-2xl p-4 sm:p-5 border border-outline-variant/30 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Keterangan Foto */}
                  <div>
                    <Label>{t('Keterangan / Judul Foto (Opsional)')}</Label>
                    <input
                      type="text"
                      value={newGalleryCaption}
                      onChange={(e) => setNewGalleryCaption(e.target.value)}
                      placeholder="Contoh: Survei Lapangan Rencana Pelabuhan Balikpapan"
                      className={INPUT}
                      disabled={uploadingGallery || isFull}
                    />
                  </div>

                  {/* Pilihan Album (Hanya untuk Eksklusif) */}
                  {isEksklusif && (
                    <div>
                      <Label>{t('Simpan ke Album / Folder')}</Label>
                      <select
                        value={targetUploadAlbum}
                        onChange={(e) => setTargetUploadAlbum(e.target.value)}
                        className={INPUT}
                        disabled={uploadingGallery || isFull}
                      >
                        <option value="">-- Tanpa Album (Galeri Umum) --</option>
                        {galleryAlbums.map((a) => (
                          <option key={a} value={a}>📁 {a}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Tombol Aksi Upload */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                  <input
                    ref={galleryFileRef}
                    type="file"
                    accept="image/jpeg,image/png,image/jpg,image/webp"
                    className="hidden"
                    onChange={handleGalleryUpload}
                    disabled={uploadingGallery || isFull}
                  />

                  <button
                    type="button"
                    onClick={() => galleryFileRef.current?.click()}
                    disabled={uploadingGallery || isFull}
                    className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs ${
                      isFull
                        ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                        : 'bg-[#2E5E3B] hover:bg-[#24492e] text-white'
                    }`}
                  >
                    {uploadingGallery ? (
                      <>
                        <Spinner className="w-4 h-4 border-2 border-white/30 border-t-white" />
                        <span>Mengunggah Foto...</span>
                      </>
                    ) : isFull ? (
                      <>
                        <ExclamationCircleIcon className="w-4 h-4 text-gray-400" />
                        <span>Batas Kuota ({tierInfo.max} Foto) Tercapai</span>
                      </>
                    ) : (
                      <>
                        <ArrowUpTrayIcon className="w-4 h-4" strokeWidth={2} />
                        <span>Pilih Foto dari Perangkat (Maks. 2MB)</span>
                      </>
                    )}
                  </button>

                  <span className="text-[11px] text-gray-500 italic">
                    {isFull
                      ? '*Hapus foto yang ada atau upgrade paket untuk menambah foto baru.'
                      : '*Foto otomatis tersimpan begitu dipilih dari perangkat.'}
                  </span>
                </div>
              </div>
            </Card>

            {/* ── 4. Galeri Grid Foto Dokumentasi Tersimpan ─────────────── */}
            <Card>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                <div className="flex items-center gap-2.5">
                  <h4 className="text-xs sm:text-sm font-extrabold text-[#1F2A22] uppercase tracking-wide">
                    Daftar Foto Dokumentasi
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full bg-[#2E5E3B]/10 text-[#2E5E3B] text-xs font-black">
                    {displayPhotos.length} {isEksklusif && activeGalleryAlbum !== 'all' ? `di "${activeGalleryAlbum}"` : 'Foto'}
                  </span>
                </div>

                {isEksklusif && activeGalleryAlbum !== 'all' && (
                  <button
                    type="button"
                    onClick={() => setActiveGalleryAlbum('all')}
                    className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
                  >
                    <span>Tampilkan Semua Foto ({galleryList.length})</span>
                  </button>
                )}
              </div>

              {displayPhotos.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {displayPhotos.map((item, idx) => {
                    // Cari index asli di galleryList untuk penghapusan
                    const originalIdx = galleryList.indexOf(item);
                    const imgPath = typeof item === 'string' ? item : (item.image || item.url || item.foto);
                    const caption = typeof item === 'object' ? (item.caption || item.title || item.keterangan || '') : '';
                    const photoAlbum = typeof item === 'object' ? item.album : '';
                    const fullUrl = getFileUrl(imgPath);

                    return (
                      <div
                        key={idx}
                        className="group bg-[#FAFBF9] rounded-2xl border border-outline-variant/30 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col"
                      >
                        {/* Image Thumbnail Container */}
                        <div
                          className="relative aspect-[4/3] bg-gray-100 overflow-hidden cursor-pointer"
                          onClick={() => setSelectedGalleryPhoto({ url: fullUrl, caption, album: photoAlbum })}
                        >
                          <img
                            src={fullUrl}
                            alt={caption || `Galeri ${idx + 1}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />

                          {/* Album Badge Pill (Khusus Eksklusif) */}
                          {isEksklusif && photoAlbum && (
                            <div className="absolute top-2 left-2 z-10 pointer-events-none">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold border border-white/20">
                                <FolderIcon className="w-3 h-3 text-purple-300" />
                                <span>{photoAlbum}</span>
                              </span>
                            </div>
                          )}

                          {/* Hover Overlay Actions */}
                          <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedGalleryPhoto({ url: fullUrl, caption, album: photoAlbum });
                              }}
                              className="w-9 h-9 rounded-xl bg-white/95 text-gray-800 hover:bg-white flex items-center justify-center shadow transition-transform active:scale-90 cursor-pointer"
                              title="Lihat Pratinjau Foto"
                            >
                              <EyeIcon className="w-4 h-4" strokeWidth={2} />
                            </button>

                            {/* Pindah Album (Khusus Eksklusif) */}
                            {isEksklusif && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMovingPhotoIndex(originalIdx);
                                }}
                                className="w-9 h-9 rounded-xl bg-purple-600/90 text-white hover:bg-purple-600 flex items-center justify-center shadow transition-transform active:scale-90 cursor-pointer"
                                title="Pindah ke Album Lain"
                              >
                                <FolderIcon className="w-4 h-4" strokeWidth={2} />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteGallery(originalIdx);
                              }}
                              className="w-9 h-9 rounded-xl bg-rose-600/90 text-white hover:bg-rose-600 flex items-center justify-center shadow transition-transform active:scale-90 cursor-pointer"
                              title="Hapus Foto"
                            >
                              <TrashIcon className="w-4 h-4" strokeWidth={2} />
                            </button>
                          </div>
                        </div>

                        {/* Card Info & Caption */}
                        <div className="p-3.5 flex-1 flex flex-col justify-between">
                          <p className="text-xs text-[#1F2A22] font-semibold line-clamp-2 min-h-[2rem] leading-snug">
                            {caption || <span className="text-gray-400 italic">Tanpa keterangan judul</span>}
                          </p>

                          <div className="mt-2.5 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                            <span>Foto #{idx + 1}</span>
                            <div className="flex items-center gap-2">
                              {isEksklusif && (
                                <button
                                  type="button"
                                  onClick={() => setMovingPhotoIndex(originalIdx)}
                                  className="text-purple-700 hover:underline font-bold"
                                >
                                  {photoAlbum ? 'Ganti Album' : '+ Album'}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleDeleteGallery(originalIdx)}
                                className="text-rose-600 hover:text-rose-800 font-bold hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <TrashIcon className="w-3.5 h-3.5" />
                                <span>Hapus</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-[#FAFBF9] rounded-2xl border-2 border-dashed border-gray-200">
                  <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <PhotoIcon className="w-7 h-7 text-gray-400" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-800 mb-1">
                    {activeGalleryAlbum !== 'all' ? `Belum Ada Foto di Album "${activeGalleryAlbum}"` : 'Belum Ada Foto di Galeri'}
                  </h4>
                  <p className="text-xs text-gray-500 max-w-sm mx-auto leading-relaxed">
                    {isFree
                      ? 'Paket Free memerlukan minimal 2 foto dokumentasi. Unggah foto kegiatan lapangan atau sertifikat Anda di formulir atas.'
                      : 'Unggah foto dokumentasi proyek, survei lapangan, atau sertifikasi Anda untuk ditampilkan pada profil publik.'}
                  </p>
                </div>
              )}
            </Card>

            {/* ── Modal Buat Album Baru (Khusus Eksklusif) ─────────────── */}
            {showNewAlbumModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-gray-100 animate-scaleUp">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                    <FolderIcon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-gray-900 mb-1">Buat Folder / Album Baru</h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Masukkan nama album untuk mengelompokkan dokumentasi foto (misal: "Survei Laut Amdal 2025" atau "Sertifikasi Profesi").
                  </p>

                  <form onSubmit={handleCreateAlbum} className="space-y-4">
                    <div>
                      <Label>Nama Album Foto *</Label>
                      <input
                        type="text"
                        autoFocus
                        required
                        value={newAlbumInput}
                        onChange={(e) => setNewAlbumInput(e.target.value)}
                        placeholder="Contoh: Survei Lapangan Kalimantan Timur"
                        className={INPUT}
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowNewAlbumModal(false)}
                        className="flex-1 py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        className="flex-1 py-2.5 text-xs font-bold text-white bg-purple-700 hover:bg-purple-800 rounded-xl transition-all shadow-sm cursor-pointer"
                      >
                        Simpan Album
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ── Modal Pindah Album Foto (Khusus Eksklusif) ────────────── */}
            {movingPhotoIndex !== null && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-gray-100 animate-scaleUp">
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                    <FolderOpenIcon className="w-6 h-6" strokeWidth={2} />
                  </div>
                  <h3 className="text-base font-black text-gray-900 mb-1">Pindahkan Foto ke Album</h3>
                  <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                    Pilih album tujuan untuk foto ini:
                  </p>

                  <div className="space-y-2 mb-5">
                    <button
                      type="button"
                      onClick={() => handleMovePhotoAlbum(movingPhotoIndex, '')}
                      className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-purple-600 hover:bg-purple-50/50 text-xs font-bold text-gray-700 flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span>-- Tanpa Album (Galeri Umum) --</span>
                      <CheckIcon className="w-4 h-4 text-gray-400" />
                    </button>
                    {galleryAlbums.map((a) => (
                      <button
                        key={a}
                        type="button"
                        onClick={() => handleMovePhotoAlbum(movingPhotoIndex, a)}
                        className="w-full text-left p-3 rounded-xl border border-gray-200 hover:border-purple-600 hover:bg-purple-50/50 text-xs font-bold text-gray-800 flex items-center justify-between transition-colors cursor-pointer"
                      >
                        <span className="flex items-center gap-2">
                          <FolderIcon className="w-4 h-4 text-purple-600" />
                          <span>{a}</span>
                        </span>
                        <CheckIcon className="w-4 h-4 text-purple-600" />
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => setMovingPhotoIndex(null)}
                    className="w-full py-2.5 text-xs font-bold text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}

            {/* ── BAGIAN VIDEO PROFIL & PORTOFOLIO ── */}
            <Card>
              <div className="flex items-center gap-1 mb-2">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                  <PlayIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                  {t('Video Profil & Portofolio')}
                </h3>
              </div>
              <p className="text-xs text-[#5B6660] leading-relaxed mb-5">
                Tambahkan tautan (link) video presentasi, pengenalan profil keahlian, atau dokumentasi proyek Anda. Sistem mendukung link video dari <strong>YouTube</strong>, <strong>Vimeo</strong>, atau <strong>Google Drive</strong> secara aman.
              </p>

            {/* Input Form Video */}
            <div className="space-y-4">
              <div>
                <Label>{t('Tautan / Link Video (URL) *')}</Label>
                <div className="relative">
                  <input
                    type="url"
                    value={videoForm.video_url}
                    onChange={(e) => setVideoForm({ ...videoForm, video_url: e.target.value })}
                    placeholder="Contoh: https://www.youtube.com/watch?v=xxxx atau https://youtu.be/xxxx"
                    className={INPUT + ' pl-10'}
                  />
                  <LinkIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  Mendukung link video YouTube biasa, YouTube Shorts, Vimeo, atau Google Drive (pastikan akses 'Siapa saja yang memiliki link').
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>{t('Judul Video (Opsional)')}</Label>
                  <input
                    type="text"
                    value={videoForm.video_title}
                    onChange={(e) => setVideoForm({ ...videoForm, video_title: e.target.value })}
                    placeholder="Contoh: Video Pengenalan Keahlian AMDAL & Pengelolaan Lingkungan"
                    className={INPUT}
                  />
                </div>
                <div>
                  <Label>{t('Deskripsi Singkat Video (Opsional)')}</Label>
                  <input
                    type="text"
                    value={videoForm.video_description}
                    onChange={(e) => setVideoForm({ ...videoForm, video_description: e.target.value })}
                    placeholder="Contoh: Rangkuman paparan proyek AMDAL pada komisi penilai."
                    className={INPUT}
                  />
                </div>
              </div>
            </div>

            {/* Live Video Preview Box */}
            <div className="mt-6 pt-5 border-t border-gray-100">
              <Label>{t('Pratinjau (Preview) Video')}</Label>
              {(() => {
                const embedInfo = getVideoEmbedInfo(videoForm.video_url);

                if (!videoForm.video_url?.trim()) {
                  return (
                    <div className="bg-[#FAFBF9] rounded-2xl border-2 border-dashed border-gray-200 p-8 text-center">
                      <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-2">
                        <PlayIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <p className="text-xs font-semibold text-gray-700">Belum ada link video</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Masukkan tautan link video di atas untuk melihat preview pemutar video secara langsung.
                      </p>
                    </div>
                  );
                }

                if (!embedInfo) {
                  return (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-900">
                      <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Format tautan belum dikenali</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Pastikan link diawali dengan <code>https://</code> dan merupakan tautan video yang valid dari YouTube, Vimeo, atau Google Drive.
                        </p>
                      </div>
                    </div>
                  );
                }

                return (
                  <div className="bg-black/5 p-3 sm:p-4 rounded-2xl border border-gray-200 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-red-600 text-white text-[10px] font-black uppercase tracking-wider">
                          {embedInfo.platform}
                        </span>
                        <span className="text-xs font-bold text-gray-800 truncate">
                          {videoForm.video_title || 'Pratinjau Pemutar Video'}
                        </span>
                      </div>
                      <a
                        href={embedInfo.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-bold text-[#2E5E3B] hover:underline flex items-center gap-1 shrink-0"
                      >
                        <span>Buka Link Asli</span>
                        <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    {embedInfo.embedUrl ? (
                      <div className="relative aspect-video w-full rounded-xl overflow-hidden bg-black shadow-md border border-gray-200">
                        {embedInfo.type === 'direct' ? (
                          <video
                            src={embedInfo.embedUrl}
                            controls
                            className="w-full h-full object-contain"
                          />
                        ) : (
                          <iframe
                            src={embedInfo.embedUrl}
                            title={videoForm.video_title || 'Video Profil'}
                            className="w-full h-full border-0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                          />
                        )}
                      </div>
                    ) : (
                      <div className="p-6 bg-white rounded-xl border border-gray-200 text-center">
                        <p className="text-xs text-gray-700 font-semibold mb-2">
                          Video akan dibuka melalui tautan eksternal oleh pengunjung:
                        </p>
                        <a
                          href={embedInfo.originalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2E5E3B] text-white text-xs font-bold rounded-xl hover:bg-[#244B2F] transition-colors"
                        >
                          <PlayIcon className="w-4 h-4" />
                          <span>Tonton Video</span>
                          <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )}

                    {videoForm.video_description && (
                      <p className="text-xs text-gray-600 bg-white p-2.5 rounded-xl border border-gray-100">
                        {videoForm.video_description}
                      </p>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons Video */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-between gap-3">
              {videoForm.video_url ? (
                <button
                  type="button"
                  onClick={deleteVideo}
                  disabled={saving}
                  className="px-3.5 py-2 text-xs font-bold text-red-600 border border-red-200 rounded-xl hover:bg-red-50 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <TrashIcon className="w-4 h-4" />
                  <span>Hapus Video</span>
                </button>
              ) : <span />}

              <button
                type="button"
                onClick={saveVideo}
                disabled={saving}
                className={BTN_PRIMARY}
              >
                {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" />}
                <span>{saving ? 'Menyimpan...' : 'Simpan Video'}</span>
              </button>
            </div>
          </Card>

          <WizardNav onBack={goPrev} onNext={goNext} nextLabel={`${t('profile.wizard.continue_to', 'Lanjut ke')} ${TABS[currentTabIdx + 1]?.label}`} t={t} />
        </div>
      )})()}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: REKENING BANK                                      */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'rekening' && (
        <div className="space-y-6 animate-fadeIn">
          <button className={`${BTN_GHOST} w-full sm:w-auto justify-center text-xs sm:text-sm py-2.5 sm:py-2 self-start`} onClick={goPrev}>
            <ArrowLeftIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2} />{t('Kembali ke')} {TABS[currentTabIdx - 1]?.label}
          </button>

          {/* ── Rekening Bank ─────────────────────────────────── */}
          <Card>
            <div className="mb-4">
              <div className="flex items-center gap-1 mb-1">
                <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                  <span className="material-symbols-outlined text-[18px]">account_balance</span>
                  {t('profile.section.bank_account', 'Rekening Bank')}
                </h3>
                <Tooltip text="Rekening untuk menarik dana konsultasi dan produk Anda." />
              </div>
              <p className="text-xs text-[#5B6660] leading-relaxed">
                {t('profile.section.bank_account_desc', 'Rekening untuk menarik dana konsultasi dan produk Anda.')}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>{t('profile.field.bank_name', 'Nama Bank')}</Label>
                <select
                  className={INPUT}
                  value={form.bank_name}
                  onChange={e => setForm({ ...form, bank_name: e.target.value })}
                >
                  <option value="">-- Pilih Bank --</option>
                  {['BCA', 'BNI', 'BRI', 'Mandiri', 'BSI', 'CIMB Niaga', 'Danamon', 'Maybank', 'Permata', 'BTN', 'BJB', 'Lainnya'].map(b => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label>{t('profile.field.bank_account', 'Nomor Rekening Anda')}</Label>
                <input
                  className={INPUT}
                  value={form.bank_account}
                  onChange={e => setForm({ ...form, bank_account: e.target.value.replace(/\D/g, '') })}
                  placeholder="1234567890"
                  inputMode="numeric"
                  maxLength={20}
                />
              </div>
              <div>
                <Label>{t('profile.field.bank_account_name', 'Nama Pemilik Rekening')}</Label>
                <input
                  className={INPUT}
                  value={form.bank_account_name}
                  onChange={e => setForm({ ...form, bank_account_name: e.target.value })}
                  placeholder="Nama sesuai buku tabungan"
                />
              </div>
            </div>
            {form.bank_account && (
              <div className="mt-3 p-3 bg-[#F0EEE2] rounded-xl text-xs text-[#5B6660] flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-[#978F66] shrink-0 mt-0.5">info</span>
                <span>Rekening penarikan dana: <strong>{form.bank_name || '-'}</strong> &nbsp;•&nbsp; <strong>{form.bank_account}</strong> &nbsp;a.n. <strong>{form.bank_account_name || '-'}</strong></span>
              </div>
            )}

            {/* Tombol Simpan Rekening */}
            <div className="mt-6 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-[#5B6660]">
                {t('Pastikan nomor rekening dan nama pemilik valid untuk keperluan transfer dana.')}
              </span>
              <button
                type="button"
                onClick={saveRekening}
                disabled={saving}
                className={`${BTN_PRIMARY} w-full sm:w-auto justify-center`}
              >
                {saving ? <Spinner /> : <CheckIcon className="w-4 h-4" />}
                <span>{saving ? t('Menyimpan...') : t('Simpan Rekening Bank')}</span>
              </button>
            </div>
          </Card>

          <WizardNav onBack={goPrev} onNext={goNext} nextLabel={`${t('profile.wizard.continue_to', 'Lanjut ke')} ${TABS[currentTabIdx + 1]?.label}`} t={t} />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TAB: VERIFIKASI                                          */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === 'verifikasi' && (
        <div className="space-y-6 animate-fadeIn">
          <button className={`${BTN_GHOST} w-full sm:w-auto justify-center text-xs sm:text-sm py-2.5 sm:py-2 self-start`} onClick={goPrev}>
            <ArrowLeftIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2} />{t('Kembali ke')} {TABS[currentTabIdx - 1]?.label}
          </button>

          {/* ── Status Saat Ini ──────────────────────────────── */}
          <Card>
            <div className="flex items-center gap-1 mb-4">
              <h3 className="flex items-center gap-2 text-sm font-bold text-[#2E5E3B] uppercase tracking-wider">
                <ShieldCheckIcon className="w-[18px] h-[18px]" strokeWidth={2} />
                {t('Kirim Profil untuk Verifikasi')}
              </h3>
              <Tooltip text="Pastikan semua data sudah lengkap dan dokumen sudah diupload sebelum mengirim. Proses review oleh admin biasanya 1–3 hari kerja." />
            </div>
            <div className="text-sm text-[#414844] leading-relaxed mb-6">
              <p>{t('Setelah Anda melengkapi seluruh data profil, memilih paket keanggotaan, dan mengunggah dokumen pendukung, Anda dapat mengirimkan profil ini untuk ditinjau oleh admin.')}</p>
              <p className="mt-2">{t('Pastikan semua data sudah benar karena profil tidak dapat diubah selama proses verifikasi berlangsung.')}</p>
            </div>

            {expert?.profile_status === 'aktif' ? (
              <div className="bg-[#E3F2E7] border border-[#A7D7B0] rounded-xl p-4 flex items-start gap-3">
                <CheckCircleIcon className="text-[#2E5E3B] w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
                <div className="text-sm text-[#1C3822]">
                  <p className="font-semibold mb-0.5">{t('Profil Telah Disetujui')}</p>
                  <p className="text-xs">{t('Profil Anda sudah aktif dan tayang di direktori publik.')}</p>
                </div>
              </div>
            ) : expert?.profile_status === 'menunggu_verifikasi' ? (
              <div className="bg-[#FFF4E5] border border-[#FFD8A8] rounded-xl p-4 flex items-start gap-3">
                <ClockIcon className="text-[#B36B00] w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
                <div className="text-sm text-[#5C3D00]">
                  <p className="font-semibold mb-0.5">{t('Menunggu Verifikasi Admin')}</p>
                  <p className="text-xs">{t('Profil Anda sedang ditinjau. Kami akan memberi tahu Anda melalui email setelah proses selesai.')}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!isProfileComplete && (
                  <div className="bg-[#FFF4E5] border border-[#FFD8A8] rounded-xl p-4 flex items-start gap-3">
                    <ExclamationTriangleIcon className="text-[#B36B00] w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
                    <div className="text-sm text-[#5C3D00]">
                      <p className="font-semibold mb-1">{t('Lengkapi profil Anda terlebih dahulu')}</p>
                      <p className="text-xs leading-relaxed mb-2">{t('Profil baru bisa dikirim ke admin setelah bagian berikut lengkap:')}</p>
                      <ul className="text-xs list-disc list-inside space-y-0.5">
                        {missingSteps.map((s) => <li key={s}>{s}</li>)}
                      </ul>
                    </div>
                  </div>
                )}

                <div className="bg-[#FAF5F0] border border-[#EAD7C5] rounded-xl p-4 flex items-start gap-3 mb-6">
                  <TrophyIcon className="text-[#6B3410] w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
                  <div className="text-sm text-[#55290A]">
                    <p className="font-semibold mb-0.5">{t('Syarat Verifikasi')}</p>
                    <p className="text-xs">{t('Anda harus memiliki')} <strong>{t('Paket Aktif')}</strong> {t('(telah memilih paket dan melunasi pembayaran) sebelum admin memproses verifikasi profil ini.')}</p>
                  </div>
                </div>

                <div className="border-t border-black/5 pt-4">
                  <button
                    onClick={submitVerification}
                    disabled={!isProfileComplete || submitting}
                    className="w-full sm:w-auto bg-[#6B3410] text-white px-8 py-3.5 rounded-xl font-bold hover:bg-[#55290A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  >
                    {submitting ? (
                      <><Spinner className="w-5 h-5 border-2 border-white/30 border-t-white" /> {t('Mengirim...')}</>
                    ) : (
                      <><PaperAirplaneIcon className="w-5 h-5" strokeWidth={2} /> {t('Kirim Profil Sekarang')}</>
                    )}
                  </button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* CAMERA CAPTURE (Real-time camera)                       */}
      {/* ════════════════════════════════════════════════════════ */}
      {cameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onCancel={handleCameraCancel}
        />
      )}



      {/* ════════════════════════════════════════════════════════ */}
      {/* IMAGE CROPPER (WhatsApp Style)                          */}
      {/* ════════════════════════════════════════════════════════ */}
      {cropperOpen && imageToCrop && (
        <ImageCropper
          imageSrc={imageToCrop}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* COVER CROPPER                                           */}
      {/* ════════════════════════════════════════════════════════ */}
      {coverCropperOpen && coverImageToCrop && (
        <CoverCropper
          imageSrc={coverImageToCrop}
          onCropComplete={handleCoverCropComplete}
          onCancel={handleCoverCropCancel}
        />
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL: FOTO PROFIL (WhatsApp Style)                    */}
      {/* ════════════════════════════════════════════════════════ */}
      {photoModal && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPhotoModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl animate-slideUp"
            onClick={(e) => e.stopPropagation()}
          >
            {photoPreview && (
              <div className="p-6 pb-4">
                <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-[#F5F4F0]">
                  <img src={photoPreview} alt="Foto profil" className="w-full h-full object-cover" />
                </div>
              </div>
            )}

            <div className="px-2 pb-2">
              {photoPreview && (
                <button
                  onClick={viewFullPhoto}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl"
                >
                  <EyeIcon className="w-6 h-6 text-[#5B6660]" strokeWidth={2} />
                  <span className="text-[15px] font-medium text-[#1F2A22]">{t('Lihat Foto')}</span>
                </button>
              )}

              <button
                onClick={triggerCamera}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl"
              >
                <CameraIcon className="w-6 h-6 text-[#5B6660]" strokeWidth={2} />
                <span className="text-[15px] font-medium text-[#1F2A22]">{t('Ambil Foto')}</span>
              </button>

              <button
                onClick={triggerPhotoInput}
                className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl"
              >
                <Squares2X2Icon className="w-6 h-6 text-[#5B6660]" strokeWidth={2} />
                <span className="text-[15px] font-medium text-[#1F2A22]">
                  {photoPreview ? t('Ganti dari Galeri') : t('Pilih dari Galeri')}
                </span>
              </button>

              {photoPreview && (
                <button
                  onClick={deletePhoto}
                  disabled={saving}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-red-50 active:bg-red-100 transition-colors rounded-xl disabled:opacity-50"
                >
                  <TrashIcon className="w-6 h-6 text-[#B3261E]" strokeWidth={2} />
                  <span className="text-[15px] font-medium text-[#B3261E]">
                    {saving ? t('Menghapus...') : t('Hapus Foto')}
                  </span>
                </button>
              )}

              <button
                onClick={() => setPhotoModal(false)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 mt-2 text-[14px] font-semibold text-[#5B6660] hover:bg-gray-50 active:bg-gray-100 transition-colors rounded-xl"
              >
                {t('Batal')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* MODAL: LIHAT FOTO FULLSCREEN                            */}
      {/* ════════════════════════════════════════════════════════ */}
      {fullPhotoView && photoPreview && (
        <div
          className="fixed inset-0 bg-black z-[110] flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setFullPhotoView(false)}
        >
          <button
            onClick={() => setFullPhotoView(false)}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-colors z-10"
          >
            <XMarkIcon className="w-5 h-5 text-white" strokeWidth={2} />
          </button>
          <img
            src={photoPreview}
            alt="Foto profil"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* ── MODAL: MAP PICKER ─────────────────────────────────── */}
      {mapPickerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-2.5 sm:p-4 animate-fadeIn"
          onClick={cancelMapPicker}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] h-[92vh] shadow-2xl flex flex-col animate-slideUp overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-outline-variant/20 shrink-0">
              <div className="min-w-0 flex-1 mr-2">
                <h3 className="text-base sm:text-lg font-bold text-[#1F2A22] truncate">{t('Pilih Lokasi Anda')}</h3>
                <p className="text-[11px] sm:text-xs text-[#5B6660] mt-0.5 truncate">{t('Klik pada peta atau geser marker untuk menandai lokasi')}</p>
              </div>
              <button
                onClick={cancelMapPicker}
                className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center transition-colors shrink-0"
              >
                <XMarkIcon className="w-5 h-5 text-[#5B6660]" strokeWidth={2} />
              </button>
            </div>

            {/* Map Container */}
            <div className="flex-1 relative min-h-[220px] sm:min-h-[400px] overflow-hidden">
              <div
                ref={mapRef}
                id="location-picker-map"
                className="w-full h-full"
                onClick={() => setShowSearchResults(false)}
              />

              {/* Floating Search Bar */}
              <div
                className="absolute top-3 left-14 right-3 sm:left-14 sm:right-auto sm:w-[400px] z-[500]"
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onDoubleClick={(e) => e.stopPropagation()}
              >
                <form
                  onSubmit={handleSearchLocation}
                  className="relative flex items-center bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-gray-200 focus-within:border-[#2E5E3B] focus-within:ring-2 focus-within:ring-[#2E5E3B]/20 transition-all overflow-hidden"
                >
                  <div className="pl-3 pr-2 text-gray-400 shrink-0">
                    <MagnifyingGlassIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={mapSearchQuery}
                    onChange={(e) => {
                      setMapSearchQuery(e.target.value);
                      if (!e.target.value) {
                        setMapSearchResults([]);
                        setShowSearchResults(false);
                      }
                    }}
                    onFocus={() => {
                      if (mapSearchResults.length > 0) setShowSearchResults(true);
                    }}
                    placeholder={t('Cari nama tempat, jalan, atau kota...')}
                    className="w-full py-2 text-xs sm:text-sm text-gray-800 bg-transparent placeholder-gray-400 focus:outline-none"
                  />
                  {mapSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setMapSearchQuery('');
                        setMapSearchResults([]);
                        setShowSearchResults(false);
                      }}
                      className="p-1 mr-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors shrink-0"
                      title={t('Hapus')}
                    >
                      <XMarkIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSearchingLocation || !mapSearchQuery.trim()}
                    className="px-3 py-2 text-xs font-semibold text-white bg-[#2E5E3B] hover:bg-[#244B2F] disabled:opacity-50 transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    {isSearchingLocation ? (
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <span>{t('Cari')}</span>
                    )}
                  </button>
                </form>

                {/* Dropdown Hasil Pencarian */}
                {showSearchResults && (
                  <div className="mt-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-xl border border-gray-200 max-h-60 overflow-y-auto divide-y divide-gray-100 animate-fadeIn">
                    {isSearchingLocation ? (
                      <div className="p-3 text-center text-xs text-gray-500 flex items-center justify-center gap-2">
                        <div className="w-3.5 h-3.5 border-2 border-[#2E5E3B]/30 border-t-[#2E5E3B] rounded-full animate-spin" />
                        <span>{t('Mencari lokasi...')}</span>
                      </div>
                    ) : mapSearchResults.length > 0 ? (
                      mapSearchResults.map((item, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => handleSelectLocation(item)}
                          className="w-full text-left p-2.5 hover:bg-[#2E5E3B]/10 transition-colors flex items-start gap-2.5 group"
                        >
                          <MapPinIcon className="w-4 h-4 text-[#8B4513] shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-semibold text-gray-800 line-clamp-1 group-hover:text-[#2E5E3B]">
                              {item.name || (item.display_name ? item.display_name.split(',')[0] : '')}
                            </p>
                            <p className="text-[11px] text-gray-500 line-clamp-1 mt-0.5">
                              {item.display_name}
                            </p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-3 text-center text-xs text-gray-500">
                        {t('Lokasi tidak ditemukan. Coba gunakan kata kunci yang lebih spesifik.')}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Info Card & Coordinate Inputs inside Modal */}
              <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-3 sm:p-4 border border-outline-variant/20 z-[500]">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <MapPinIcon className="text-[#8B4513] w-5 h-5 shrink-0 mt-0.5" strokeWidth={2} />
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[#1F2A22]">{t('Lokasi & Titik Koordinat')}</p>
                      <p className="text-[11px] text-[#5B6660]">
                        {form.lat && form.lng 
                          ? `${form.location || 'Indonesia'} (${parseFloat(form.lat).toFixed(6)}, ${parseFloat(form.lng).toFixed(6)})`
                          : t('Klik pada peta, geser marker, atau ketik koordinat manual:')}
                      </p>
                    </div>
                  </div>

                  {/* Manual Coordinate input in Modal */}
                  <div className="flex items-center gap-2 shrink-0">
                    <input
                      type="number"
                      step="any"
                      placeholder="Lat (-6.xxx)"
                      value={form.lat || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleManualCoordChange('lat', val);
                        if (val && form.lng) applyManualCoordsToMap(val, form.lng);
                      }}
                      className="w-24 sm:w-28 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E5E3B]"
                    />
                    <input
                      type="number"
                      step="any"
                      placeholder="Lng (106.xxx)"
                      value={form.lng || ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        handleManualCoordChange('lng', val);
                        if (form.lat && val) applyManualCoordsToMap(form.lat, val);
                      }}
                      className="w-24 sm:w-28 px-2.5 py-1.5 text-xs bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#2E5E3B]"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-t border-outline-variant/20 gap-2.5 sm:gap-3 shrink-0 bg-white">
              <button
                onClick={() => {
                  if (navigator.geolocation && mapInstance) {
                    navigator.geolocation.getCurrentPosition(
                      (pos) => {
                        const { latitude, longitude } = pos.coords;
                        mapInstance.setView([latitude, longitude], 15);

                        if (mapMarker) {
                          mapMarker.setLatLng([latitude, longitude]);
                        } else {
                          const newMarker = L.marker([latitude, longitude], { draggable: true, icon: locationPinIcon }).addTo(mapInstance);
                          setMapMarker(newMarker);
                          newMarker.on('dragend', function () {
                            const position = newMarker.getLatLng();
                            updateLocationFromCoords(position.lat, position.lng);
                          });
                        }
                        updateLocationFromCoords(latitude, longitude);
                      },
                      () => {
                        flash('err', 'Tidak dapat mengambil lokasi Anda. Pastikan izin lokasi aktif.');
                      }
                    );
                  }
                }}
                className="flex items-center justify-center gap-2 text-xs sm:text-sm font-semibold text-[#8B4513] hover:text-[#6B3410] transition-colors"
              >
                <MapPinIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
                {t('Gunakan Lokasi Saya')}
              </button>

              <div className="flex gap-2 w-full sm:w-auto">
                <button
                  onClick={cancelMapPicker}
                  className={BTN_GHOST + ' flex-1 sm:flex-initial justify-center'}
                >
                  {t('Batal')}
                </button>
                <button
                  onClick={saveMapLocation}
                  disabled={!form.lat || !form.lng}
                  className={BTN_PRIMARY + ' flex-1 sm:flex-initial justify-center disabled:opacity-50 disabled:cursor-not-allowed'}
                >
                  <CheckIcon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" strokeWidth={2} />
                  {t('Pilih Lokasi Ini')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Lightbox Preview Foto Galeri ── */}
      {selectedGalleryPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
          onClick={() => setSelectedGalleryPhoto(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-[#111827] rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={() => setSelectedGalleryPhoto(null)}
                className="w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors shadow-md"
              >
                <XMarkIcon className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <div className="flex-1 overflow-hidden flex items-center justify-center bg-black/95 p-2 sm:p-4">
              <img
                src={selectedGalleryPhoto.url}
                alt={selectedGalleryPhoto.caption || 'Preview Foto'}
                className="max-h-[75vh] w-auto max-w-full object-contain rounded-xl"
              />
            </div>
            {selectedGalleryPhoto.caption && (
              <div className="p-4 bg-gray-900/90 text-white text-xs sm:text-sm text-center border-t border-white/10">
                <p className="font-medium text-gray-200">{selectedGalleryPhoto.caption}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL / BOTTOM SHEET: SEMUA MENU PROFIL (Khusus Mobile) ── */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl animate-slideUp overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between gap-3 bg-[#FAF9F5]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2E5E3B]/10 text-[#2E5E3B] flex items-center justify-center shrink-0">
                  <Squares2X2Icon className="w-5 h-5" strokeWidth={2} />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-gray-900">
                    Navigasi Menu Profil
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 font-medium">
                      {completedTabsCount} dari {TABS.length} Menu Selesai
                    </span>
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.2 rounded-full">
                      {Math.round((completedTabsCount / TABS.length) * 100)}%
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 flex items-center justify-center transition-colors cursor-pointer"
              >
                <XMarkIcon className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>

            {/* List Menu 12 Tab */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-1.5 divide-y divide-gray-50">
              {TABS.map((tabItem, idx) => {
                const done = isTabDone(tabItem.id);
                const TabIcon = tabItem.Icon;
                const isActive = tab === tabItem.id;
                return (
                  <button
                    key={tabItem.id}
                    type="button"
                    onClick={() => {
                      setTab(tabItem.id);
                      setMobileMenuOpen(false);
                      window.scrollTo({ left: 0, top: 120, behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#2E5E3B] text-white shadow-sm ring-2 ring-[#2E5E3B]/20'
                        : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`text-[11px] font-extrabold w-6 text-center shrink-0 ${
                        isActive ? 'text-white/70' : 'text-gray-400'
                      }`}>
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-[#2E5E3B]/10 text-[#2E5E3B]'
                      }`}>
                        <TabIcon className="w-5 h-5" strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold truncate ${isActive ? 'text-white' : 'text-gray-900'}`}>
                          {tabItem.label}
                        </p>
                        <p className={`text-[11px] truncate ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                          {done ? 'Sudah dilengkapi' : 'Belum selesai diisi'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {done ? (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                          isActive ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200/80'
                        }`}>
                          <CheckCircleIcon className="w-3.5 h-3.5 shrink-0" strokeWidth={2.5} />
                          <span>Selesai</span>
                        </span>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          isActive ? 'bg-white/10 text-white/80' : 'bg-gray-100 text-gray-500'
                        }`}>
                          Belum
                        </span>
                      )}
                      <ChevronRightIcon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-gray-400'}`} strokeWidth={2} />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer Modal */}
            <div className="p-3 border-t border-gray-100 bg-gray-50/80 text-center">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-xs font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
              >
                Tutup Menu
              </button>
            </div>
          </div>
        </div>
      )}

    </DashboardLayout>
  );
}