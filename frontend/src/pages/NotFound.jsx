import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import { usePageLoading } from '../context/LoadingContext.jsx';

export default function NotFound() {
  const { t } = useTranslation();
  const { reportReady } = usePageLoading();

  useEffect(() => {
    reportReady();
  }, [reportReady]);

  return (
    <div className="pt-40 pb-32 text-center px-margin-mobile">
      <h1 className="font-display-lg text-headline-xl text-primary mb-4">404</h1>
      <p className="text-on-surface-variant mb-8">{t('Maaf, halaman yang Anda cari tidak dapat ditemukan.')}</p>
      <Link to="/" className="bg-primary text-white px-8 py-3 rounded-full font-label-md hover:bg-primary-container transition-colors">
        {t('Kembali ke Beranda')}
      </Link>
    </div>
  );
}
