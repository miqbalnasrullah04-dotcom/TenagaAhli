import { useLanguage } from '../context/LanguageContext.jsx';

export default function LanguageSwitcher({ fullWidth = false, className = '' }) {
  const { language, changeLanguage } = useLanguage();

  return (
    <div
      className={`${
        fullWidth ? 'flex w-full' : 'inline-flex self-start'
      } items-center p-1 bg-black border border-gray-800 rounded-2xl shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={() => changeLanguage('id')}
        className={`${
          fullWidth ? 'flex-1 py-2 justify-center' : 'px-3.5 py-1.5'
        } flex items-center gap-1.5 text-xs font-bold rounded-xl transition-all duration-200 select-none ${
          language === 'id'
            ? 'bg-gradient-to-r from-[#8B4513] to-[#6B3410] text-white shadow-sm'
            : 'text-gray-300 hover:text-white'
        }`}
        aria-label="Bahasa Indonesia"
      >
        <span>ID</span>
        {fullWidth && <span className="text-[11px] font-normal opacity-75">Indonesia</span>}
      </button>
      <button
        type="button"
        onClick={() => changeLanguage('en')}
        className={`${
          fullWidth ? 'flex-1 py-2 justify-center' : 'px-3.5 py-1.5'
        } flex items-center gap-1.5 text-xs font-bold rounded-xl transition-all duration-200 select-none ${
          language === 'en'
            ? 'bg-gradient-to-r from-[#8B4513] to-[#6B3410] text-white shadow-sm'
            : 'text-gray-300 hover:text-white'
        }`}
        aria-label="English Language"
      >
        <span>EN</span>
        {fullWidth && <span className="text-[11px] font-normal opacity-75">English</span>}
      </button>
    </div>
  );
}
