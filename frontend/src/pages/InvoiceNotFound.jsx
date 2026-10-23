import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';

export default function InvoiceNotFound() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icon */}
        <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-orange-600 text-4xl">receipt_long</span>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          {t('invoice.not_found.title', 'Invoice Tidak Ditemukan')}
        </h1>

        {/* Description */}
        <div className="text-gray-600 mb-8 space-y-3">
          <p className="text-base leading-relaxed">
            {t('invoice.not_found.desc', 'Tagihan yang Anda cari tidak ada atau Anda tidak memiliki akses ke invoice ini.')}
          </p>
          {id && (
            <div className="bg-gray-50 rounded-lg p-3 text-sm">
              <span className="text-gray-500">Invoice ID:</span>
              <span className="font-mono font-semibold text-gray-800 ml-2">{id}</span>
            </div>
          )}
        </div>

        {/* Possible Reasons */}
        <div className="text-left bg-blue-50 rounded-xl p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600 text-lg">info</span>
            {t('invoice.not_found.reasons_title', 'Kemungkinan Penyebab')}
          </h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5">radio_button_unchecked</span>
              {t('invoice.not_found.reason_1', 'Invoice ID salah atau tidak valid')}
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5">radio_button_unchecked</span>
              {t('invoice.not_found.reason_2', 'Transaksi belum selesai dibuat')}
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5">radio_button_unchecked</span>
              {t('invoice.not_found.reason_3', 'Invoice sudah kedaluwarsa atau dihapus')}
            </li>
            <li className="flex items-start gap-2">
              <span className="material-symbols-outlined text-blue-500 text-sm mt-0.5">radio_button_unchecked</span>
              {t('invoice.not_found.reason_4', 'Anda tidak memiliki akses ke invoice ini')}
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary Action - View Point History */}
          <button
            onClick={() => navigate('/riwayat-point')}
            className="w-full bg-[#8B4513] hover:bg-[#6B3410] text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">receipt_long</span>
            {t('invoice.not_found.view_all', 'Lihat Riwayat Point')}
          </button>

          {/* Secondary Action - Top Up */}
          <button
            onClick={() => navigate('/top-up')}
            className="w-full border border-gray-300 hover:border-[#8B4513] text-gray-700 hover:text-[#8B4513] font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            {t('invoice.not_found.back_packages', 'Top Up Point')}
          </button>

          {/* Tertiary Action - Back to Dashboard / Account */}
          <button
            onClick={() => {
              try {
                const u = JSON.parse(localStorage.getItem('amdal_user') || '{}');
                if (u.role === 'admin') navigate('/admin');
                else if (u.role_type === 'surveyor') navigate('/dashboard-surveyor');
                else if (u.role_type === 'tenaga_ahli') navigate('/dashboard');
                else navigate('/akun');
              } catch {
                navigate('/akun');
              }
            }}
            className="w-full text-gray-500 hover:text-gray-700 font-medium py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">
              {(() => {
                try {
                  const u = JSON.parse(localStorage.getItem('amdal_user') || '{}');
                  return (u.role_type === 'tenaga_ahli' || u.role_type === 'surveyor' || u.role === 'admin') ? 'dashboard' : 'account_circle';
                } catch {
                  return 'account_circle';
                }
              })()}
            </span>
            {(() => {
              try {
                const u = JSON.parse(localStorage.getItem('amdal_user') || '{}');
                return (u.role_type === 'tenaga_ahli' || u.role_type === 'surveyor' || u.role === 'admin') ? t('invoice.not_found.dashboard', 'Dashboard') : 'Akun Saya';
              } catch {
                return 'Akun Saya';
              }
            })()}
          </button>
        </div>

        {/* Help Section */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 mb-3">
            {t('invoice.not_found.need_help', 'Butuh bantuan?')}
          </p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => navigate('/pusat-bantuan')}
              className="text-sm text-[#8B4513] hover:text-[#6B3410] font-medium flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">help</span>
              {t('invoice.not_found.help_center', 'Pusat Bantuan')}
            </button>
            <span className="text-gray-300">•</span>
            <button
              onClick={() => navigate('/tiket')}
              className="text-sm text-[#8B4513] hover:text-[#6B3410] font-medium flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-sm">support_agent</span>
              {t('invoice.not_found.contact_support', 'Hubungi Support')}
            </button>
          </div>
        </div>

        {/* Debug Info (Development Only) */}
        {import.meta.env.DEV && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
              Debug Info (Development Only)
            </summary>
            <div className="mt-2 p-3 bg-gray-50 rounded text-xs text-gray-600 font-mono">
              <div className="space-y-1">
                <div><strong>Request ID:</strong> {id}</div>
                <div><strong>Current Path:</strong> {window.location.pathname}</div>
                <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
                <div><strong>User Agent:</strong> {navigator.userAgent.substring(0, 60)}...</div>
              </div>
            </div>
          </details>
        )}
      </div>
    </div>
  );
}