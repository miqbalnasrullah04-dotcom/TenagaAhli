/**
 * Utility helper to format and beautify Indonesian location strings
 * Shortens verbose prefixes like "Kabupaten" -> "Kab.", "Kota Administrasi" -> "Kota", etc.
 * so badges and cards stay compact and legible without awkward text cut-offs.
 */
export function formatCompactLocation(locationStr) {
  if (!locationStr || typeof locationStr !== 'string') return 'Indonesia';
  
  let text = locationStr.trim();
  if (text.startsWith('Lat:')) return 'Indonesia';

  // Replace common long words
  text = text
    .replace(/^Kabupaten\s+/i, 'Kab. ')
    .replace(/\bKabupaten\s+/gi, 'Kab. ')
    .replace(/^Kota Administrasi\s+/i, '')
    .replace(/\bKota Administrasi\s+/gi, '')
    .replace(/^Daerah Khusus Ibukota\s+/i, 'DKI ')
    .replace(/\bDaerah Khusus Ibukota\s+/gi, 'DKI ')
    .replace(/^Daerah Istimewa\s+/i, 'D.I. ')
    .replace(/\bDaerah Istimewa\s+/gi, 'D.I. ')
    .replace(/\bPropinsi\b/gi, 'Prov.')
    .replace(/\bProvinsi\b/gi, 'Prov.');

  return text;
}

/**
 * Ekstrak nama panggilan (nama depan, atau nama belakang jika nama depan tidak ada)
 * dengan membersihkan gelar depan (Dr., Ir., Prof., dsb) dan gelar belakang (, M.Sc, S.T, dsb).
 * 
 * Contoh:
 * "Dr. Ir. Irman Firmansyah, S.Hut, M.Si, M.Sc" -> "Irman"
 * "Prof. Dr. Bambang Suharto, IPM" -> "Bambang"
 * "dr. Siti Nurhaliza" -> "Siti"
 */
export function getCallingName(fullName) {
  if (!fullName || typeof fullName !== 'string') return 'Pengguna';

  // 1. Buang gelar belakang (semua teks setelah tanda koma pertama)
  let clean = fullName.split(',')[0].trim();
  if (!clean) clean = fullName.trim();

  // 2. Daftar gelar depan umum (disimpan dalam bentuk lowercase tanpa titik)
  const FRONT_TITLES = new Set([
    'dr', 'dra', 'drs', 'prof', 'professor',
    'ir', 'ing', 'drg', 'drh',
    'h', 'hj', 'kh', 'k.h', 'k.h.',
    'ns', 'apt', 'mr', 'mrs', 'ms',
    'bpk', 'bapak', 'ibu', 'ust', 'ustadz', 'ustadzah',
    'sdr', 'tb'
  ]);

  // 3. Pecah berdasarkan spasi
  const rawWords = clean.split(/\s+/).filter(Boolean);

  // 4. Saring kata-kata yang merupakan gelar depan
  const nameParts = rawWords.filter((w) => {
    const normalized = w.toLowerCase().replace(/^[^\w]+|[^\w]+$/g, '');
    if (!normalized) return false;
    if (FRONT_TITLES.has(normalized)) return false;
    if (/^[a-z]\.[a-z]\.?$/i.test(w)) return false;
    return true;
  });

  // 5. Prioritaskan nama depan, fallback ke nama belakang atau kata terakhir
  if (nameParts.length > 0) {
    return nameParts[0] || nameParts[nameParts.length - 1];
  }

  // Fallback jika semua kata teridentifikasi gelar: ambil kata terakhir sebelum koma
  return rawWords[rawWords.length - 1] || rawWords[0] || fullName;
}
