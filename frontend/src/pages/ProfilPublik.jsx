import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client.js';
import DashboardLayout from '../components/DashboardLayout.jsx';
import { useTranslation } from '../context/LanguageContext.jsx';

// Helper function to construct file URLs - same as in ProfilSaya
const getFileUrl = (filePath) => {
  if (!filePath) return '#';
  if (filePath.startsWith('http')) return filePath;
  const baseUrl = import.meta.env.VITE_BACKEND_URL || 'https://tenagaahli.com';
  return `${baseUrl}/storage/${filePath}`;
};

export default function ProfilPublik() {
  const { t } = useTranslation();
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadData = () => {
      setLoading(true);
      api.get('/my/profile')
        .then((res) => {
          setExpert(res.data);
        })
        .catch(() => setError(t('public_profile.error.load_failed', 'Gagal memuat data profil.')))
        .finally(() => setLoading(false));
    };

    // Initial load
    loadData();

    // Listen for profile updates from ProfilSaya
    const handleProfileUpdate = () => {
      console.log('[ProfilPublik] Profile updated, reloading data...');
      loadData();
    };

    // Also refresh when user comes back to this tab (in case they uploaded in another tab)
    const handleFocus = () => {
      console.log('[ProfilPublik] Tab focused, refreshing profile data...');
      loadData();
    };

    window.addEventListener('amdal-user-updated', handleProfileUpdate);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('amdal-user-updated', handleProfileUpdate);
      window.removeEventListener('focus', handleFocus);
    };
  }, [t]);

  if (loading) {
    return (
      <DashboardLayout title={t('public_profile.title', 'Profil Publik')}>
        <div className="flex items-center gap-3 text-[#5B6660]">
          <span className="w-5 h-5 rounded-full border-2 border-[#2E5E3B]/30 border-t-[#2E5E3B] animate-spin" />
          {t('public_profile.loading', 'Memuat data...')}
        </div>
      </DashboardLayout>
    );
  }

  const profileStatus = expert?.profile_status || 'draft';
  const isAccountActive = profileStatus === 'aktif';

  // Tayang if account is active (approved users auto-get Free package)
  const isProfileLive = isAccountActive;

  return (
    <DashboardLayout
      title={t('public_profile.title', 'Profil Publik')}
      subtitle={t('public_profile.subtitle', 'Pratinjau tampilan profil Anda pada halaman pencarian Tenaga Ahli.')}
    >
      {error && (
        <p className="bg-error-container text-on-error-container text-sm rounded-lg p-3 mb-6">{error}</p>
      )}

      <div className="flex flex-col gap-6 animate-fadeIn">
        <div className="bg-white rounded-2xl border border-black/5 shadow-sm p-4 sm:p-6 max-w-2xl">
          <h3 className="font-bold text-[#1F2A22] mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-[#2E5E3B] text-[20px]">language</span>
            {t('public_profile.directory_view', 'Tampilan Direktori Publik')}
          </h3>
          <p className="text-xs sm:text-sm text-on-surface-variant mb-4 sm:mb-6">
            {t('public_profile.preview_description', 'Berikut adalah pratinjau status tampilan profil Anda di website pencarian Tenaga Ahli nasional.')}
          </p>

          <div className="bg-[#F5F4EF] rounded-xl p-4 sm:p-5 mb-5 sm:mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-on-surface-variant font-bold uppercase tracking-wider mb-1">{t('public_profile.website_status', 'Status Tampil Website')}</p>
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${isProfileLive ? 'bg-[#2E5E3B]' : 'bg-[#B3261E]'}`}></span>
                <span className="font-bold text-sm sm:text-base text-on-background">
                  {isProfileLive ? t('public_profile.active_public', 'Aktif (Tampil Publik)') : t('public_profile.not_visible', 'Tidak Tampil')}
                </span>
              </div>
            </div>
            {isProfileLive ? (
              <div className="flex flex-col items-stretch sm:items-end gap-2 w-full sm:w-auto">
                <Link
                  to={`/profil/${expert.slug}`}
                  target="_blank"
                  className="bg-[#2E5E3B] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-[#1E3E26] shadow-sm flex items-center justify-center gap-1.5 transition-colors w-full sm:w-fit"
                >
                  <span className="material-symbols-outlined text-base">visibility</span>
                  {t('public_profile.view_real_profile', 'Lihat Profil Asli')}
                </Link>
                <div className="text-xs text-[#2E5E3B] flex items-center justify-center gap-1 bg-[#2E5E3B]/10 px-3 py-1.5 rounded-lg border border-[#2E5E3B]/20 font-medium break-all">
                  <span className="material-symbols-outlined text-[14px] shrink-0">link</span>
                  <span>tenagaahli.com/profil/{expert.slug}</span>
                </div>
              </div>
            ) : (
              <div className="text-xs text-on-surface-variant font-medium max-w-xs text-left sm:text-right">
                {t('public_profile.not_visible_reason', 'Profil tidak tampil karena Anda belum diverifikasi admin atau belum memilih paket berlangganan.')}
              </div>
            )}
          </div>

          {/* Preview Card Mockup */}
          <div className="border border-outline-variant/30 rounded-2xl p-4 sm:p-5 max-w-md mx-auto bg-white shadow-md overflow-hidden">
            <div className="flex justify-end mb-3">
              <div className="bg-[#E3F2E7]/80 backdrop-blur-sm border border-[#2E5E3B]/20 rounded-full px-2 py-0.5 flex items-center gap-1 text-[10px] text-[#2E5E3B] font-bold shrink-0">
                <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: '"FILL" 1' }}>verified</span>
                {t('Verified Member')}
              </div>
            </div>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border bg-[#F5F4EF] shrink-0">
                {expert?.photo ? (
                  <img
                    src={`${getFileUrl(expert.photo)}?t=${Date.now()}`}
                    alt="Foto profil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                    <span className="material-symbols-outlined text-[32px]">person</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-on-background text-base truncate">{expert?.name}</h4>
                <p className="text-xs text-[#2E5E3B] font-semibold">{t(expert?.field) || t('Bidang Keahlian Belum Diisi')}</p>
                <p className="text-[11px] text-on-surface-variant mt-0.5">{t(expert?.institution) || '-'}</p>
              </div>
            </div>
            <div className="text-xs text-on-surface-variant border-t border-outline-variant/20 pt-3 flex justify-between">
              <span>{t('Lokasi:')} <strong>{t(expert?.alamat_kota) || t('Belum Diisi')}</strong></span>
              <span>{t('Pendidikan:')} <strong>{t(expert?.pendidikan) || '-'}</strong></span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}