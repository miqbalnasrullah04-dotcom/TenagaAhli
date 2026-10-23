import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import CameraCapture from '../components/CameraCapture.jsx';

// ---------------------------------------------------------------------------
// Design tokens — satu sumber warna, dipakai konsisten di seluruh halaman.
// ---------------------------------------------------------------------------
const BRAND = {
  primary: '#8B4513',
  primaryDark: '#6B3410',
  navy: '#1E3A8A',
  green: '#2E5E3B',
  greenBg: '#E3F2E7',
  greenText: '#1C3822',
  amber: '#F59E0B',
  amberBg: '#FFF4D6',
  amberText: '#7A5900',
  neutralBg: '#F5F4F0',
  textMuted: '#5B6660',
  textDark: '#1F2A22',
  infoBg: '#F5EBE1',
  infoText: '#075985',
};

// Warna identitas tiap tingkatan paket: Standar = hijau, Ekonomis = gold, Eksklusif = silver/slate.
function getPackageTheme(pkg) {
  const name = (pkg.name || pkg.id || '').toLowerCase();
  if (name.includes('platinum') || name.includes('eksklusif') || name.includes('ekslusif') || name.includes('esklusif')) {
    return { main: '#9CA3AF', dark: '#6B7280', bg: '#F1F2F4', text: '#4B5563' };
  }
  if (name.includes('premium') || name.includes('ekonomis')) {
    return { main: '#D4AF37', dark: '#A67C00', bg: '#FBF3D9', text: '#8A6A00' };
  }
  return { main: BRAND.green, dark: BRAND.greenText, bg: BRAND.greenBg, text: BRAND.greenText };
}

const getPAYMENTMETHODS = (t) => [
  {
    icon: 'qr_code_2',
    title: t('package.payment.qris', 'QRIS'),
    body: t('package.payment.qris_desc', 'Bayar langsung dengan scan QR dari semua e-wallet dan mobile banking'),
  },
  {
    icon: 'account_balance',
    title: t('package.payment.bank_transfer', 'Transfer Bank'),
    items: [
      t('package.payment.bca_va', 'BCA Virtual Account'),
      t('package.payment.bni_va', 'BNI Virtual Account'),
      t('package.payment.mandiri_va', 'Mandiri Virtual Account'),
      t('package.payment.bri_va', 'BRI Virtual Account')
    ],
  },
  {
    icon: 'wallet',
    title: t('package.payment.ewallet', 'E-Wallet'),
    items: ['GoPay', 'ShopeePay', 'DANA', 'OVO'],
  },
  {
    icon: 'credit_card',
    title: t('package.payment.credit_card', 'Kartu Kredit/Debit'),
    items: ['Visa', 'Mastercard', 'JCB'],
  },
];

function formatRupiah(value, t) {
  if (value === 0) return t('package.free', 'Gratis');
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(value);
}

// ---------------------------------------------------------------------------
// Sub-komponen presentasional kecil — mengurangi duplikasi markup di bawah.
// ---------------------------------------------------------------------------

function StatTile({ label, value, valueColor }) {
  return (
    <div className="bg-white/80 rounded-xl p-4">
      <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: BRAND.textMuted }}>
        {label}
      </p>
      <p className="text-2xl font-black" style={{ color: valueColor ?? BRAND.textDark }}>
        {value}
      </p>
    </div>
  );
}

function InfoBanner({ icon, iconColor, bg, textColor, title, children }) {
  return (
    <div className="rounded-xl px-4 py-3 flex items-start gap-2.5" style={{ backgroundColor: bg }}>
      <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5" style={{ color: iconColor }}>
        {icon}
      </span>
      <div className="text-sm leading-relaxed" style={{ color: textColor }}>
        {title && <p className="font-semibold mb-1">{title}</p>}
        {children}
      </div>
    </div>
  );
}

function PaymentMethodCard({ icon, title, body, items }) {
  return (
    <div className="rounded-lg p-4" style={{ backgroundColor: BRAND.neutralBg }}>
      <div className="flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-[20px]" style={{ color: BRAND.primary }}>
          {icon}
        </span>
        <p className="font-bold text-sm" style={{ color: BRAND.textDark }}>{title}</p>
      </div>
      {body && <p className="text-xs leading-relaxed" style={{ color: BRAND.textMuted }}>{body}</p>}
      {items && (
        <ul className="text-xs space-y-1" style={{ color: BRAND.textMuted }}>
          {items.map((item) => (
            <li key={item} className="flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: BRAND.primary }} />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function PilihPaket() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [packages, setPackages] = useState([]);
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // KTP Verification State
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [ktpFile, setKtpFile] = useState(null);
  const [ktpPreview, setKtpPreview] = useState(null);
  const [ktpUploadError, setKtpUploadError] = useState('');
  const [isUploadingKtp, setIsUploadingKtp] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    return () => {
      if (ktpPreview) {
        URL.revokeObjectURL(ktpPreview);
      }
    };
  }, [ktpPreview]);

  useEffect(() => {
    // Ambil role_type dari localStorage terlebih dahulu
    let userRoleType = 'tenaga_ahli';
    try {
      const u = JSON.parse(localStorage.getItem('amdal_user') || '{}');
      userRoleType = u.role_type || 'tenaga_ahli';
    } catch { /* ignore */ }

    // Load packages + profile
    Promise.all([
      api.get('/packages', { params: { role_type: userRoleType } }).catch(err => {
        console.error('Error loading packages:', err);
        return { data: [] };
      }),
      api.get('/my/profile').catch(err => {
        console.error('Error loading profile:', err);
        return { data: {} };
      }),
    ])
      .then(async ([packagesRes, profileRes]) => {
        const expertData = profileRes.data || {};
        setExpert(expertData);

        const rawCriteria = Array.isArray(expertData.kriteria_list)
          ? expertData.kriteria_list
          : (expertData.kriteria ? [expertData.kriteria] : []);

        const isTenagaAhli = userRoleType === 'tenaga_ahli' ||
          expertData.user?.role_type === 'tenaga_ahli' ||
          expertData.kriteria === 'Tenaga Ahli' ||
          rawCriteria.some(k => String(k).toLowerCase().includes('tenaga ahli'));

        let data = Array.isArray(packagesRes.data) ? packagesRes.data : [];

        // Jika expert berstatus Tenaga Ahli tapi query awal bukan tenaga_ahli, refetch paket tenaga_ahli
        if (isTenagaAhli && userRoleType !== 'tenaga_ahli') {
          try {
            const reRes = await api.get('/packages', { params: { role_type: 'tenaga_ahli' } });
            if (Array.isArray(reRes.data) && reRes.data.length > 0) {
              data = reRes.data;
            }
          } catch { /* ignore */ }
        }

        // Normalize
        const normalizedPackages = data.map((pkg) => ({
          ...pkg,
          features: Array.isArray(pkg.benefits)
            ? pkg.benefits
            : Array.isArray(pkg.features)
            ? pkg.features
            : (pkg.description ? pkg.description.split('\n').filter(Boolean) : []),
          duration:     pkg.duration    || '12 bulan',
          highlighted:  pkg.is_highlighted || pkg.name?.toLowerCase().includes('premium') || pkg.name?.toLowerCase().includes('ekonomis'),
          badge:        pkg.badge       || null,
          roleType:     pkg.role_type   || 'all',
          // Diskon hanya tampil jika original_price ada dan lebih besar dari price
          showDiscount: !!(pkg.original_price && pkg.original_price > pkg.price),
        }));

        setPackages(normalizedPackages);
      })
      .catch((err) => {
        console.error('Critical error loading packages:', err);
        setError(t('package.error.load_failed', 'Gagal memuat data paket. Silakan refresh halaman.'));
      })
      .finally(() => {
        setLoading(false);
      });
  }, [t]);

  const activePackageId = expert?.package_id || 'free';
  const activePackage = packages.find((p) => p.id === activePackageId);
  const isFreePackageActive = activePackage && activePackage.price === 0;
  const canUpgrade = !expert?.package_id || isFreePackageActive;

  // Cek apakah expert sudah pernah upload KTP sebelumnya
  const hasExistingKtp = Boolean(
    expert?.ktp_path ||
    expert?.has_ktp ||
    expert?.documents?.some((d) => d.type === 'ktp') ||
    expert?.pending_changes?.ktp_path
  );

  const handleCameraCapture = (blob) => {
    const file = new File([blob], `ktp_${Date.now()}.jpg`, { type: 'image/jpeg' });
    setKtpFile(file);
    if (ktpPreview) URL.revokeObjectURL(ktpPreview);
    setKtpPreview(URL.createObjectURL(blob));
    setShowCamera(false);
    setKtpUploadError('');
  };

  const handleKtpFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
      setKtpUploadError(t('package.ktp_format_err', 'Format file harus berupa gambar (JPG, PNG, atau WEBP).'));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setKtpUploadError(t('package.ktp_size_err', 'Ukuran foto KTP maksimal 5MB.'));
      return;
    }
    setKtpFile(file);
    if (ktpPreview) URL.revokeObjectURL(ktpPreview);
    setKtpPreview(URL.createObjectURL(file));
    setKtpUploadError('');
  };

  const handleStartUpgrade = () => {
    if (!selected) return;
    setError('');

    // Paket Free langsung aktif tanpa syarat foto KTP
    if (selected.price === 0) {
      handleContinueFree();
      return;
    }

    // Paket berbayar (Ekonomis & Eksklusif) wajib foto KTP untuk badge verifikasi
    setShowVerificationModal(true);
  };

  const handleContinueFree = async () => {
    setSubmitting(true);
    setError('');

    try {
      await api.post('/my/choose-package', {
        package_id: selected.id,
        package_name: selected.name || 'standar'
      });

      const userRaw = localStorage.getItem('amdal_user');
      let roleType = 'tenaga_ahli';
      try { roleType = JSON.parse(userRaw || '{}').role_type || 'tenaga_ahli'; } catch {}
      const redirectDash = roleType === 'surveyor' ? '/dashboard-surveyor' : '/dashboard';

      navigate(redirectDash, { state: { message: t('package.free_activated', 'Paket Free berhasil diaktifkan!') } });
    } catch (err) {
      console.error('Error in handleContinueFree:', err);
      let errorMessage = t('package.error_process', 'Terjadi kesalahan saat memproses paket.');
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmVerificationAndPay = async () => {
    if (!selected) return;
    setIsUploadingKtp(true);
    setKtpUploadError('');

    try {
      // 1. Upload foto KTP jika user memilih / mengambil foto baru
      if (ktpFile) {
        const formData = new FormData();
        formData.append('type', 'ktp');
        formData.append('label', 'Foto KTP');
        formData.append('file', ktpFile);

        await api.post('/my/documents', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }

      // 2. Buat order transaksi paket membership
      const response = await api.post('/my/choose-package', {
        package_id: selected.id,
        package_name: selected.name || 'premium'
      });

      setShowVerificationModal(false);

      const orderData = response.data?.order;
      if (orderData) {
        const invoiceIdentifier = orderData.reference_code || orderData.id;
        navigate(`/invoice/${invoiceIdentifier}`, {
          state: { order: orderData }
        });
      } else {
        navigate('/pembayaran', { state: { package: selected } });
      }
    } catch (err) {
      console.error('Error in handleConfirmVerificationAndPay:', err);
      let errorMessage = t('package.error_process', 'Terjadi kesalahan saat memproses verifikasi dan paket.');
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      }
      setKtpUploadError(errorMessage);
    } finally {
      setIsUploadingKtp(false);
    }
  };



  if (loading) {
    return (
      <DashboardLayout
        title={t('package.choose_title', 'Pilih Paket')}
        subtitle={t('package.choose_subtitle', 'Pilih paket yang sesuai untuk mengaktifkan publikasi profil Anda.')}
      >
        <div className="flex items-center gap-3" style={{ color: BRAND.textMuted }}>
          <span
            className="w-5 h-5 rounded-full border-2 animate-spin"
            style={{ borderColor: `${BRAND.primary}4D`, borderTopColor: BRAND.primary }}
          />
          {t('package.loading', 'Memuat data paket...')}
        </div>
      </DashboardLayout>
    );
  }

  // Kolom grid menyesuaikan jumlah paket, supaya kartu selalu sejajar rapi
  // dalam satu baris (maks. 3 kolom) alih-alih menyisakan satu kartu "nyangkut" sendirian.
  const gridColsClass =
    packages.length >= 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : packages.length === 2
      ? 'grid-cols-1 sm:grid-cols-2'
      : 'grid-cols-1';

  return (
    <DashboardLayout
      title={t('package.choose_title', 'Pilih Paket')}
      subtitle={t('package.choose_subtitle', 'Pilih paket yang sesuai untuk mengaktifkan publikasi profil Anda.')}
    >
      <div className="w-full max-w-5xl mx-auto flex flex-col gap-8">

        {error && (
          <div className="bg-[#FFDAD6] border border-[#B3261E]/20 text-[#93000A] text-sm rounded-xl p-4 flex items-start justify-between gap-3 shadow-sm">
            <div className="flex items-start gap-2.5">
              <span className="material-symbols-outlined text-[20px] text-[#BA1A1A] shrink-0 mt-0.5">error</span>
              <p className="font-semibold leading-relaxed">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-[#93000A]/60 hover:text-[#93000A] p-0.5 rounded transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        )}


        {/* Banner Penjelasan Lencana Verifikasi */}
        <div className="rounded-2xl p-4 sm:p-5 border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-amber-50/90 via-white to-emerald-50/90 border-amber-200/80 shadow-sm">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[26px]">verified</span>
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-bold text-sm text-[#1F2A22]">
                  Dapatkan Badge Verifikasi (Centang Biru) Resmi
                </h4>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Khusus Upgrade Paket
                </span>
              </div>
              <p className="text-xs text-[#5B6660] mt-1 leading-relaxed">
                Saat upgrade ke paket membership, Anda perlu melampirkan foto KTP fisik asli untuk mendapatkan <strong>Badge Terverifikasi (Centang Biru)</strong> pada profil dan direktori pencarian publik Anda.
              </p>
            </div>
          </div>
        </div>

        {/* Daftar Paket */}
        {packages.length === 0 ? (
          <div className="text-center py-10">
            <span className="material-symbols-outlined text-5xl block mb-3" style={{ color: `${BRAND.textMuted}4D` }}>
              inventory_2
            </span>
            <p className="mb-4" style={{ color: BRAND.textMuted }}>{t('package.no_packages', 'Belum ada paket yang tersedia.')}</p>
            <button
              onClick={() => window.location.reload()}
              className="font-semibold text-sm hover:underline"
              style={{ color: BRAND.primary }}
            >
              {t('package.reload', 'Muat ulang')}
            </button>
          </div>
        ) : (
          <div className={`grid ${gridColsClass} gap-6 items-stretch`}>
            {packages.map((pkg) => {
              const isSelected = selected?.id === pkg.id;
              const isActive = activePackageId === pkg.id;
              const theme = getPackageTheme(pkg);
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => !isActive && setSelected(pkg)}
                  disabled={isActive}
                  className={`relative text-left rounded-3xl border-2 p-6 sm:p-7 flex flex-col justify-between h-full bg-white w-full transition-all duration-300 ${
                    isActive
                      ? 'border-emerald-600 ring-4 ring-emerald-500/15 shadow-md cursor-default'
                      : isSelected
                      ? 'border-[#8B4513] ring-4 ring-[#8B4513]/15 shadow-xl -translate-y-1'
                      : 'border-gray-200/90 shadow-sm hover:border-[#8B4513]/40 hover:shadow-xl hover:-translate-y-1'
                  }`}
                >
                  <div className="flex flex-col gap-4">
                    {/* Header Top Badge */}
                    <div className="min-h-[26px] flex items-center justify-between">
                      {isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-600 text-white shadow-xs">
                          <span className="material-symbols-outlined text-[13px]">check_circle</span>
                          {t('package.status.active', 'Aktif')}
                        </span>
                      ) : pkg.badge ? (
                        <span
                          className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider text-white shadow-xs"
                          style={{ backgroundColor: theme.dark }}
                        >
                          {pkg.badge}
                        </span>
                      ) : (
                        <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-gray-100 px-2.5 py-0.5 rounded-full">
                          {pkg.price > 0 ? 'Premium' : 'Free Tier'}
                        </span>
                      )}

                      {pkg.roleType && pkg.roleType !== 'all' && (
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          {pkg.roleType === 'surveyor' ? 'Khusus Surveyor' : 'Tenaga Ahli'}
                        </span>
                      )}
                    </div>

                    {/* Name & Pricing */}
                    <div>
                      <h3 className="text-xl font-extrabold text-[#111827] tracking-tight">{pkg.name}</h3>
                      <div className="mt-2">
                        {pkg.price > 0 ? (
                          <>
                            <div className="flex items-baseline gap-2 flex-wrap">
                              {pkg.showDiscount && (
                                <span className="text-sm line-through opacity-50 text-gray-500">
                                  {formatRupiah(Math.round(pkg.original_price / 12), t)}
                                </span>
                              )}
                              <span className="text-3xl font-black text-[#111827]">
                                {formatRupiah(Math.round(pkg.price / 12), t)}
                              </span>
                              <span className="text-xs font-bold text-gray-500">
                                / bulan
                              </span>
                              {pkg.showDiscount && (
                                <span className="bg-red-100 text-red-700 text-[11px] font-extrabold px-2 py-0.5 rounded-full">
                                  -{pkg.discount_percentage}%
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] font-semibold text-[#8B4513] bg-[#8B4513]/10 border border-[#8B4513]/20 rounded-lg px-2.5 py-1 mt-2 inline-block">
                              Bayar sekaligus 1 tahun ({formatRupiah(pkg.price, t)} / tahun)
                            </p>
                          </>
                        ) : (
                          <div>
                            <span className="text-3xl font-black text-[#111827]">
                              {formatRupiah(0, t)}
                            </span>
                            <p className="text-xs font-semibold text-gray-400 mt-1">
                              Gratis selamanya tanpa biaya
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Features List */}
                    <div className="border-t border-gray-100 pt-4 mt-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-3">
                        Fitur & Keuntungan
                      </p>
                      <ul className="flex flex-col gap-2.5 flex-1">
                        {(pkg.features ?? []).map((feat, fIdx) => {
                          const isObj = typeof feat === 'object' && feat !== null;
                          const text = isObj ? feat.text : feat;
                          const included = isObj ? feat.included !== false : true;
                          return (
                            <li key={fIdx} className="flex items-start gap-2.5 text-xs">
                              {included ? (
                                <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-emerald-500/20 shadow-xs">
                                  <span className="material-symbols-outlined text-[14px] font-bold">check</span>
                                </span>
                              ) : (
                                <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-rose-500/20 shadow-xs">
                                  <span className="material-symbols-outlined text-[14px] font-bold">close</span>
                                </span>
                              )}
                              <span className={`mt-0.5 leading-snug ${included ? 'text-[#374151]' : 'text-gray-400'}`}>
                                {text}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>

                  {/* Footer / Action */}
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    {pkg.note && !isActive && (
                      <p
                        className="text-xs rounded-xl px-3 py-2 mb-3 border text-center"
                        style={{ backgroundColor: `${theme.bg}`, borderColor: `${theme.main}33`, color: BRAND.textMuted }}
                      >
                        {pkg.note}
                      </p>
                    )}

                    {isActive ? (
                      <div
                        className="w-full text-center text-xs font-bold py-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 flex items-center justify-center gap-2 shadow-xs"
                      >
                        <span className="material-symbols-outlined text-[16px]">check_circle</span>
                        {t('package.current_package', 'Paket Saat Ini')}
                      </div>
                    ) : (
                      <div
                        className={`w-full text-center text-xs font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 border shadow-xs ${
                          isSelected
                            ? 'bg-[#8B4513] text-white border-[#8B4513] shadow-md'
                            : 'bg-white hover:bg-[#8B4513]/5 text-[#8B4513] border-[#8B4513]/40'
                        }`}
                      >
                        {isSelected ? (
                          <>
                            <span className="material-symbols-outlined text-[16px]">check</span>
                            {t('package.selected', 'Dipilih')}
                          </>
                        ) : (
                          pkg.id === 'premium'
                            ? t('package.upgrade_now', 'Upgrade Sekarang')
                            : t('package.choose_this', 'Pilih Paket Ini')
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <InfoBanner icon="info" iconColor={BRAND.primaryDark} bg={BRAND.infoBg} textColor={BRAND.infoText}
          title={t('package.info.title', 'Tentang Paket Free, Ekonomis & Eksklusif')}>
          <p dangerouslySetInnerHTML={{ __html: t('package.info.description', 'Paket Free langsung aktif tanpa biaya. Paket Ekonomis & Eksklusif memerlukan pembayaran dan akan diaktifkan setelah konfirmasi pembayaran oleh admin.') }} />
        </InfoBanner>

        {/* Metode Pembayaran */}
        <section className="bg-white rounded-xl border p-6 flex flex-col gap-5" style={{ borderColor: `${BRAND.primaryDark}33` }}>
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="material-symbols-outlined text-[24px]" style={{ color: BRAND.primaryDark }}>payment</span>
              <h3 className="text-lg font-bold" style={{ color: BRAND.textDark }}>{t('package.payment_methods', 'Metode Pembayaran')}</h3>
            </div>
            <p className="text-sm" style={{ color: BRAND.textMuted }}>
              {t('package.payment_description', 'Kami menyediakan berbagai pilihan metode pembayaran yang aman dan mudah:')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {getPAYMENTMETHODS(t).map((method) => (
              <PaymentMethodCard key={method.title} {...method} />
            ))}
          </div>

          <InfoBanner icon="verified_user" iconColor={BRAND.amberText} bg={BRAND.amberBg} textColor={BRAND.amberText}>
            <p
              className="text-xs"
              dangerouslySetInnerHTML={{ __html: t('package.security_info', 'Semua transaksi dilindungi dengan enkripsi SSL dan diproses melalui gateway pembayaran Midtrans yang telah tersertifikasi PCI DSS Level 1.') }}
            />
          </InfoBanner>
        </section>

        {/* Aksi */}
        {canUpgrade ? (
          <div className="flex justify-center">
            {(() => {
              const ctaTheme = selected ? getPackageTheme(selected) : { main: BRAND.primary, dark: BRAND.primaryDark };
              return (
                <button
                  type="button"
                  disabled={!selected || submitting}
                  onClick={handleStartUpgrade}
                  className="w-full sm:w-auto text-white py-3.5 px-8 sm:px-12 rounded-full font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
                  style={{ backgroundColor: ctaTheme.dark }}
                  onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = ctaTheme.main; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = ctaTheme.dark; }}
                >
              {submitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {t('package.processing', 'Memproses...')}
                </>
              ) : selected?.price === 0 ? (
                <>
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                  {t('package.activate_free', 'Aktifkan Paket Free')}
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">verified</span>
                  {isFreePackageActive ? t('package.upgrade_premium', 'Upgrade & Verifikasi KTP') : t('package.continue_payment', 'Lanjut Verifikasi & Pembayaran')}
                </>
              )}
                </button>
              );
            })()}
          </div>
        ) : (
          <InfoBanner icon="info" iconColor={BRAND.green} bg={BRAND.greenBg} textColor={BRAND.greenText}
            title={t('package.already_active_title', 'Paket Sudah Aktif')}>
            {t('package.already_active_desc', 'Anda sudah memiliki paket premium yang aktif. Jika ingin mengganti paket, silakan hubungi admin.')}
          </InfoBanner>
        )}
      </div>

      {/* Modal Verifikasi Foto KTP untuk Upgrade */}
      {showVerificationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl border border-black/10 flex flex-col gap-6 relative my-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-black/5">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/15 text-amber-700 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[28px]">verified</span>
                </div>
                <div>
                  <h3 className="font-bold text-lg text-[#1F2A22]">
                    Verifikasi Foto KTP
                  </h3>
                  <p className="text-xs text-[#5B6660] mt-0.5">
                    Langkah verifikasi identitas untuk upgrade ke <strong className="text-[#1F2A22]">{selected?.name}</strong> & memperoleh <strong className="text-emerald-700">Badge Verifikasi</strong>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                disabled={isUploadingKtp}
                className="text-[#5B6660] hover:text-[#1F2A22] p-1.5 rounded-xl hover:bg-black/5 transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Penjelasan Badge Verifikasi */}
            <div className="bg-emerald-50/80 border border-emerald-200/90 rounded-2xl p-4 flex items-start gap-3">
              <span className="material-symbols-outlined text-emerald-600 text-[22px] shrink-0 mt-0.5">
                verified_user
              </span>
              <div className="text-xs text-emerald-950 leading-relaxed">
                <p className="font-bold text-sm mb-0.5 text-emerald-900">Tujuan: Lencana Centang Biru Resmi</p>
                Dengan mengunggah foto kartu KTP asli, profil Anda akan otomatis berhak memperoleh <strong>Badge Terverifikasi (Centang Biru)</strong> setelah pembayaran paket disetujui. Ini membuktikan keaslian identitas Anda di mata publik dan calon klien.
              </div>
            </div>

            {/* Error Message inside Modal */}
            {ktpUploadError && (
              <div className="bg-[#FFDAD6] border border-[#B3261E]/20 text-[#93000A] text-xs rounded-xl p-3.5 flex items-start gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-[#BA1A1A] shrink-0">error</span>
                <p className="font-semibold leading-relaxed mt-0.5">{ktpUploadError}</p>
              </div>
            )}

            {/* Hidden File Input for Gallery / Device Upload */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleKtpFileInput}
            />

            {/* Konten Foto KTP */}
            {ktpPreview ? (
              /* Preview Foto Baru */
              <div className="rounded-2xl border border-black/10 p-4 bg-[#F5F4F0] flex flex-col sm:flex-row items-center gap-4">
                <div className="relative w-44 h-32 rounded-xl overflow-hidden border border-black/20 bg-black shrink-0 shadow-inner">
                  <img src={ktpPreview} alt="Preview Foto KTP" className="w-full h-full object-cover" />
                  <div className="absolute top-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow">
                    <span className="material-symbols-outlined text-[12px]">check</span>
                    Foto Siap
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left space-y-2">
                  <p className="text-sm font-bold text-[#1F2A22]">Foto KTP Siap Digunakan</p>
                  <p className="text-xs text-[#5B6660] leading-relaxed">
                    Pastikan seluruh kartu KTP fisik dan informasi NIK tampak jelas, fokus, dan tidak terpotong.
                  </p>
                  <div className="pt-1 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                    <button
                      type="button"
                      onClick={() => setShowCamera(true)}
                      className="px-3.5 py-1.5 bg-white border border-black/15 rounded-xl text-xs font-bold text-[#1F2A22] hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-amber-700">photo_camera</span>
                      Foto Ulang Kamera
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-1.5 bg-white border border-black/15 rounded-xl text-xs font-bold text-[#1F2A22] hover:bg-gray-50 flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[16px] text-blue-700">upload_file</span>
                      Pilih dari Galeri
                    </button>
                  </div>
                </div>
              </div>
            ) : hasExistingKtp ? (
              /* Status Sudah Ada KTP Sebelumnya */
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-600 text-[24px] shrink-0 mt-0.5">check_circle</span>
                  <div>
                    <p className="text-sm font-bold text-emerald-900">Foto KTP Sudah Terdaftar di Akun</p>
                    <p className="text-xs text-emerald-800 leading-relaxed mt-0.5">
                      Akun Anda telah memiliki rekaman foto KTP. Anda dapat langsung melanjutkan ke pembayaran untuk mengaktifkan Badge Verifikasi, atau mengunggah foto KTP baru jika ingin memperbarui.
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 pt-1 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">photo_camera</span>
                    Ambil Foto Kamera
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 bg-white border border-emerald-300 text-emerald-800 hover:bg-emerald-50 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <span className="material-symbols-outlined text-[16px]">upload_file</span>
                    Pilih dari Galeri
                  </button>
                </div>
              </div>
            ) : (
              /* Belum Ada Foto: Pilihan Kamera atau Galeri */
              <div className="flex flex-col items-center justify-center gap-4 p-6 sm:p-8 rounded-2xl border-2 border-dashed border-[#8B4513]/40 bg-[#F5EBE1]/40 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#8B4513]/15 text-[#8B4513] flex items-center justify-center shadow-sm">
                  <span className="material-symbols-outlined text-[32px]">badge</span>
                </div>
                <div className="max-w-md">
                  <p className="font-bold text-base text-[#1F2A22]">Unggah Foto Kartu KTP</p>
                  <p className="text-xs text-[#5B6660] mt-1 leading-relaxed">
                    Cukup foto kartu KTP fisik Anda (tidak perlu bersama muka/selfie). Anda dapat mengambil foto langsung dengan kamera atau mengunggah dari galeri file perangkat.
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCamera(true)}
                    className="px-6 py-3 rounded-full text-xs font-bold text-white shadow-md flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all"
                    style={{ backgroundColor: BRAND.primaryDark }}
                  >
                    <span className="material-symbols-outlined text-[18px]">photo_camera</span>
                    Buka Kamera KTP
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-3 rounded-full text-xs font-bold bg-white text-[#1F2A22] border border-black/15 shadow-sm flex items-center gap-2 hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    <span className="material-symbols-outlined text-[18px] text-[#8B4513]">upload_file</span>
                    Upload dari Galeri / File
                  </button>
                </div>
              </div>
            )}

            {/* Panduan Foto */}
            <div className="bg-[#F5F4F0] rounded-2xl p-4 text-xs text-[#5B6660] space-y-1.5">
              <p className="font-bold text-[#1F2A22] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-amber-700">info</span>
                Panduan Foto KTP untuk Verifikasi:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-1 text-[11px] leading-relaxed">
                <li>Cukup foto kartu KTP fisik saja (tidak perlu foto wajah / selfie).</li>
                <li>Posisikan kartu KTP di tempat dengan pencahayaan cukup dan hindari pantulan silau.</li>
                <li>Seluruh informasi pada KTP (NIK, Nama Lengkap, dan Foto KTP) harus terbaca jelas.</li>
              </ul>
            </div>

            {/* Footer Modal */}
            <div className="flex flex-col-reverse sm:flex-row items-center justify-between gap-3 pt-4 border-t border-black/10">
              <button
                type="button"
                onClick={() => setShowVerificationModal(false)}
                disabled={isUploadingKtp}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full text-xs font-bold text-[#5B6660] hover:bg-black/5 transition-colors"
              >
                Kembali
              </button>

              <button
                type="button"
                onClick={handleConfirmVerificationAndPay}
                disabled={isUploadingKtp || (!ktpFile && !hasExistingKtp)}
                className="w-full sm:w-auto text-white py-3 px-7 rounded-full font-bold text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md"
                style={{ backgroundColor: BRAND.primaryDark }}
              >
                {isUploadingKtp ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Menyimpan & Menyiapkan Pembayaran...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">verified</span>
                    Verifikasi & Lanjut ke Pembayaran
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Kamera Langsung Fullscreen (WebRTC) */}
      {showCamera && (
        <CameraCapture
          mode="ktp"
          title="Ambil Foto Kartu KTP"
          instruction="Posisikan kartu KTP Anda di dalam bingkai, lalu tekan tombol bulat untuk mengambil foto."
          onCapture={handleCameraCapture}
          onCancel={() => setShowCamera(false)}
        />
      )}
    </DashboardLayout>
  );
}