import { useState, useRef, useEffect, useCallback } from 'react';

/* ─── Data negara + dial code ──────────────────────────────────────────── */
const COUNTRIES = [
  { code: 'ID', name: 'Indonesia',            dial: '+62',  flag: '🇮🇩' },
  { code: 'MY', name: 'Malaysia',             dial: '+60',  flag: '🇲🇾' },
  { code: 'SG', name: 'Singapura',            dial: '+65',  flag: '🇸🇬' },
  { code: 'PH', name: 'Filipina',             dial: '+63',  flag: '🇵🇭' },
  { code: 'TH', name: 'Thailand',             dial: '+66',  flag: '🇹🇭' },
  { code: 'VN', name: 'Vietnam',              dial: '+84',  flag: '🇻🇳' },
  { code: 'BN', name: 'Brunei',               dial: '+673', flag: '🇧🇳' },
  { code: 'MM', name: 'Myanmar',              dial: '+95',  flag: '🇲🇲' },
  { code: 'KH', name: 'Kamboja',              dial: '+855', flag: '🇰🇭' },
  { code: 'LA', name: 'Laos',                 dial: '+856', flag: '🇱🇦' },
  { code: 'TL', name: 'Timor-Leste',          dial: '+670', flag: '🇹🇱' },
  { code: 'AU', name: 'Australia',            dial: '+61',  flag: '🇦🇺' },
  { code: 'NZ', name: 'Selandia Baru',        dial: '+64',  flag: '🇳🇿' },
  { code: 'JP', name: 'Jepang',               dial: '+81',  flag: '🇯🇵' },
  { code: 'KR', name: 'Korea Selatan',        dial: '+82',  flag: '🇰🇷' },
  { code: 'CN', name: 'China',                dial: '+86',  flag: '🇨🇳' },
  { code: 'IN', name: 'India',                dial: '+91',  flag: '🇮🇳' },
  { code: 'PK', name: 'Pakistan',             dial: '+92',  flag: '🇵🇰' },
  { code: 'BD', name: 'Bangladesh',           dial: '+880', flag: '🇧🇩' },
  { code: 'SA', name: 'Arab Saudi',           dial: '+966', flag: '🇸🇦' },
  { code: 'AE', name: 'Uni Emirat Arab',      dial: '+971', flag: '🇦🇪' },
  { code: 'QA', name: 'Qatar',                dial: '+974', flag: '🇶🇦' },
  { code: 'KW', name: 'Kuwait',               dial: '+965', flag: '🇰🇼' },
  { code: 'BH', name: 'Bahrain',              dial: '+973', flag: '🇧🇭' },
  { code: 'OM', name: 'Oman',                 dial: '+968', flag: '🇴🇲' },
  { code: 'GB', name: 'Inggris',              dial: '+44',  flag: '🇬🇧' },
  { code: 'DE', name: 'Jerman',               dial: '+49',  flag: '🇩🇪' },
  { code: 'FR', name: 'Prancis',              dial: '+33',  flag: '🇫🇷' },
  { code: 'NL', name: 'Belanda',              dial: '+31',  flag: '🇳🇱' },
  { code: 'IT', name: 'Italia',               dial: '+39',  flag: '🇮🇹' },
  { code: 'ES', name: 'Spanyol',              dial: '+34',  flag: '🇪🇸' },
  { code: 'US', name: 'Amerika Serikat',      dial: '+1',   flag: '🇺🇸' },
  { code: 'CA', name: 'Kanada',               dial: '+1',   flag: '🇨🇦' },
  { code: 'BR', name: 'Brasil',               dial: '+55',  flag: '🇧🇷' },
  { code: 'ZA', name: 'Afrika Selatan',       dial: '+27',  flag: '🇿🇦' },
  { code: 'NG', name: 'Nigeria',              dial: '+234', flag: '🇳🇬' },
  { code: 'EG', name: 'Mesir',               dial: '+20',  flag: '🇪🇬' },
];

const DEFAULT_COUNTRY = COUNTRIES[0]; // Indonesia

/**
 * PhoneInput — input nomor telepon dengan country code selector.
 *
 * Props:
 *  - value (string)       : nilai lengkap, mis. "+62 81234567890"
 *  - onChange (fn)        : dipanggil dengan string lengkap "+<dial> <number>"
 *  - placeholder (string) : placeholder untuk bagian nomor
 *  - required (bool)
 *  - className (string)   : class tambahan untuk wrapper
 *  - error (bool)         : tampilkan border merah
 */
export default function PhoneInput({
  value = '',
  onChange,
  placeholder = '81234567890',
  required = false,
  className = '',
  error = false,
}) {
  /* ── parse value ─────────────────────────────────────────────── */
  const parseValue = useCallback((val) => {
    if (!val) return { country: DEFAULT_COUNTRY, number: '' };
    for (const c of COUNTRIES) {
      if (val.startsWith(c.dial + ' ')) {
        return { country: c, number: val.slice(c.dial.length + 1) };
      }
    }
    // Nomor lokal Indonesia (08xx) — konversi ke +62
    if (val.startsWith('0')) {
      return { country: DEFAULT_COUNTRY, number: val.slice(1) };
    }
    return { country: DEFAULT_COUNTRY, number: val };
  }, []);

  const parsed       = parseValue(value);
  const [country, setCountry]   = useState(parsed.country);
  const [number, setNumber]     = useState(parsed.number);
  const [open, setOpen]         = useState(false);
  const [search, setSearch]     = useState('');
  const dropRef  = useRef(null);
  const inputRef = useRef(null);
  const searchRef = useRef(null);

  /* sync parent → local state (hanya saat value prop berubah dari luar) */
  useEffect(() => {
    const p = parseValue(value);
    setCountry(p.country);
    setNumber(p.number);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* close dropdown on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* focus search input when dropdown opens */
  useEffect(() => {
    if (open && searchRef.current) {
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  }, [open]);

  const emit = useCallback((c, n) => {
    onChange?.(`${c.dial} ${n}`);
  }, [onChange]);

  const handleSelectCountry = (c) => {
    setCountry(c);
    setOpen(false);
    setSearch('');
    emit(c, number);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleNumberChange = (e) => {
    // Hanya izinkan angka
    const digits = e.target.value.replace(/\D/g, '');
    setNumber(digits);
    emit(country, digits);
  };

  const filtered = search.trim()
    ? COUNTRIES.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.dial.includes(search) ||
          c.code.toLowerCase().includes(search.toLowerCase())
      )
    : COUNTRIES;

  return (
    <div className={`relative ${className}`} ref={dropRef}>
      {/* ── Input group ─────────────────────────────────────────── */}
      <div
        className={`flex items-center border rounded-lg bg-white overflow-hidden transition-colors
          ${error
            ? 'border-red-400 focus-within:ring-2 focus-within:ring-red-300'
            : 'border-outline-variant/50 focus-within:ring-2 focus-within:ring-[#8B4513]/30 focus-within:border-[#8B4513]'
          }`}
      >
        {/* Country code button */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Pilih kode negara"
          className="flex items-center gap-1.5 px-3 py-2.5 border-r border-outline-variant/30 hover:bg-[#F5F4F0] transition-colors shrink-0 select-none"
        >
          <span className="text-base leading-none">{country.flag}</span>
          <span className="text-sm font-semibold text-on-surface-variant">{country.dial}</span>
          <span className={`material-symbols-outlined text-[16px] text-on-surface-variant/50 transition-transform ${open ? 'rotate-180' : ''}`}>
            expand_more
          </span>
        </button>

        {/* Number input — digits only */}
        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          required={required}
          placeholder={placeholder}
          value={number}
          onChange={handleNumberChange}
          className="flex-1 px-3 py-2.5 text-sm bg-transparent outline-none placeholder:text-on-surface-variant/40"
        />

        {/* Clear button */}
        {number.length > 0 && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => { setNumber(''); emit(country, ''); inputRef.current?.focus(); }}
            className="px-2 text-on-surface-variant/40 hover:text-on-surface-variant transition-colors"
            aria-label="Hapus nomor"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        )}
      </div>

      {/* ── Dropdown ─────────────────────────────────────────────── */}
      {open && (
        <div className="absolute z-50 top-full left-0 mt-1.5 w-72 bg-white border border-outline-variant/30 rounded-xl shadow-xl overflow-hidden animate-fadeIn">
          {/* Search */}
          <div className="p-2 border-b border-outline-variant/20">
            <div className="flex items-center gap-2 bg-[#F5F4F0] rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant/50 shrink-0">search</span>
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari negara atau kode..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-on-surface-variant/40"
              />
              {search && (
                <button type="button" onClick={() => setSearch('')} className="shrink-0 text-on-surface-variant/40 hover:text-on-surface-variant">
                  <span className="material-symbols-outlined text-[14px]">close</span>
                </button>
              )}
            </div>
          </div>

          {/* List */}
          <ul className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <li className="px-4 py-3 text-sm text-on-surface-variant/60 text-center">
                Negara tidak ditemukan
              </li>
            ) : (
              filtered.map((c) => (
                <li key={c.code}>
                  <button
                    type="button"
                    onClick={() => handleSelectCountry(c)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-[#F5EBE1] transition-colors text-left
                      ${country.code === c.code ? 'bg-[#F5EBE1] font-semibold' : ''}`}
                  >
                    <span className="text-base leading-none shrink-0">{c.flag}</span>
                    <span className="flex-1 truncate text-on-background">{c.name}</span>
                    <span className="text-xs font-mono text-on-surface-variant/70 shrink-0">{c.dial}</span>
                    {country.code === c.code && (
                      <span className="material-symbols-outlined text-[14px] text-[#8B4513] shrink-0">check</span>
                    )}
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
