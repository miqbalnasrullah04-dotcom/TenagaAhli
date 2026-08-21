import { Link } from 'react-router-dom';
import { useTranslation } from '../context/LanguageContext.jsx';
import tentangKamiImg from '../assets/About-us-2.png';
import NavbarBackground from '../components/NavbarBackground.jsx';

export default function TentangKami() {
  const { t } = useTranslation();

  return (
    <div className="relative pt-32 pb-24 px-margin-mobile md:px-margin-desktop max-w-container-max mx-auto">
      <NavbarBackground />

      {/* Hero — Foto + Deskripsi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-gutter items-center mb-20">
        <img
          src={tentangKamiImg}
          alt="Tim TenagaAhli.com"
          className="w-full h-[380px] object-cover rounded-xl shadow-md border border-outline-variant"
        />

        <div>
          <span className="inline-block w-14 h-1.5 rounded-full bg-[#0EA5E9] mb-4" />
          <h1 className="font-headline-lg text-headline-lg text-on-background mb-6">{t('about.title', 'Tentang Kami')}</h1>
          <p className="text-on-surface-variant leading-relaxed mb-4">
            {t('about.desc1', 'TenagaAhli.com merupakan platform pencarian tenaga ahli dan profesional di Indonesia yang membantu pengguna menemukan tenaga ahli berdasarkan bidang keahlian, pengalaman, kompetensi, sertifikasi, dan lokasi.')}
          </p>
          <p className="text-on-surface-variant leading-relaxed mb-4">
            {t('about.desc2', 'Platform ini hadir untuk memudahkan individu, perusahaan, maupun organisasi dalam menemukan tenaga ahli yang sesuai dengan kebutuhan secara lebih cepat, mudah, dan terpercaya.')}
          </p>
          <p className="text-on-surface-variant leading-relaxed">
            {t('about.desc3', 'TenagaAhli.com juga menjadi media informasi dan penghubung antara pengguna dengan para tenaga ahli dari berbagai bidang, sehingga proses pencarian dan pemilihan tenaga profesional dapat dilakukan secara lebih efektif.')}
          </p>
        </div>
      </div>

      {/* CTA — Gradasi Biru Gelap Premium */}
      <div className="rounded-xl p-8 text-center mt-16 bg-gradient-to-br from-[#031B2E] via-[#04263F] to-[#010B14] relative overflow-hidden shadow-lg">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#0EA5E9]/10 blur-[60px] pointer-events-none" />
        
        <div className="relative z-10">
          <h2 className="font-headline-md text-xl text-white mb-3">{t('about.cta_title', 'Ingin bergabung sebagai tenaga ahli?')}</h2>
          <p className="text-white/70 mb-6 text-sm">{t('about.cta_desc', 'Daftarkan diri Anda dan perluas jangkauan proyek Anda.')}</p>
          <Link
            to="/daftar"
            className="inline-block bg-[#0EA5E9] text-white px-8 py-3 rounded-full font-label-md hover:bg-[#0284C7] scale-95 active:scale-90 transition-all shadow-sm shadow-[#0EA5E9]/20"
          >
            {t('about.cta_btn', 'Daftar Sekarang')}
          </Link>
        </div>
      </div>
    </div>
  );
}