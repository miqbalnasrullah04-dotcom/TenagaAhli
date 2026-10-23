/**
 * Comprehensive Indonesia City & Regency (Kabupaten) Geocoding Dictionary
 * Maps location strings to real Latitude & Longitude coordinates.
 */

export const INDONESIA_COORDINATES = [
  // --- JAWA BARAT ---
  { keywords: ['kuningan'], lat: -6.9765, lng: 108.4839, name: 'Kuningan, Jawa Barat' },
  { keywords: ['cirebon'], lat: -6.7320, lng: 108.5523, name: 'Cirebon, Jawa Barat' },
  { keywords: ['majalengka'], lat: -6.8361, lng: 108.2274, name: 'Majalengka, Jawa Barat' },
  { keywords: ['indramayu'], lat: -6.3264, lng: 108.3200, name: 'Indramayu, Jawa Barat' },
  { keywords: ['sumedang'], lat: -6.8586, lng: 107.9266, name: 'Sumedang, Jawa Barat' },
  { keywords: ['bogor', 'kabupaten bogor', 'kota bogor', 'cibinong', 'dramaga', 'ciawi'], lat: -6.5950, lng: 106.8166, name: 'Bogor, Jawa Barat' },
  { keywords: ['bandung', 'kota bandung', 'kabupaten bandung', 'cimahi', 'lembang', 'soreang', 'padalarang'], lat: -6.9175, lng: 107.6191, name: 'Bandung, Jawa Barat' },
  { keywords: ['depok', 'sawangan', 'cinere', 'margonda'], lat: -6.4025, lng: 106.7942, name: 'Depok, Jawa Barat' },
  { keywords: ['bekasi', 'cikarang', 'tambun'], lat: -6.2383, lng: 106.9756, name: 'Bekasi, Jawa Barat' },
  { keywords: ['karawang', 'klari', 'cikampek'], lat: -6.3073, lng: 107.3019, name: 'Karawang, Jawa Barat' },
  { keywords: ['purwakarta'], lat: -6.5569, lng: 107.4433, name: 'Purwakarta, Jawa Barat' },
  { keywords: ['subang'], lat: -6.5684, lng: 107.7600, name: 'Subang, Jawa Barat' },
  { keywords: ['sukabumi', 'pelabuhanratu'], lat: -6.9277, lng: 106.9300, name: 'Sukabumi, Jawa Barat' },
  { keywords: ['cianjur', 'cipanas'], lat: -6.8174, lng: 107.1394, name: 'Cianjur, Jawa Barat' },
  { keywords: ['garut', 'tarogong'], lat: -7.2279, lng: 107.9087, name: 'Garut, Jawa Barat' },
  { keywords: ['tasikmalaya', 'singaparna'], lat: -7.3274, lng: 108.2207, name: 'Tasikmalaya, Jawa Barat' },
  { keywords: ['ciamis'], lat: -7.3256, lng: 108.3533, name: 'Ciamis, Jawa Barat' },
  { keywords: ['banjar', 'kota banjar'], lat: -7.3712, lng: 108.5339, name: 'Banjar, Jawa Barat' },
  { keywords: ['pangandaran'], lat: -7.7050, lng: 108.4947, name: 'Pangandaran, Jawa Barat' },

  // --- DKI JAKARTA ---
  { keywords: ['jakarta selatan', 'jaksel', 'kebayoran', 'cilandak', 'tebet', 'pasar minggu', 'mampang'], lat: -6.2615, lng: 106.8106, name: 'Jakarta Selatan, DKI Jakarta' },
  { keywords: ['jakarta pusat', 'jakpus', 'monas', 'gambir', 'menteng', 'senen', 'kemayoran'], lat: -6.1805, lng: 106.8284, name: 'Jakarta Pusat, DKI Jakarta' },
  { keywords: ['jakarta timur', 'jaktim', 'matraman', 'jatinegara', 'duren sawit', 'cakung', 'rawamangun'], lat: -6.2250, lng: 106.9004, name: 'Jakarta Timur, DKI Jakarta' },
  { keywords: ['jakarta barat', 'jakbar', 'kebon jeruk', 'grogol', 'cengkareng', 'kembangan'], lat: -6.1683, lng: 106.7588, name: 'Jakarta Barat, DKI Jakarta' },
  { keywords: ['jakarta utara', 'jakut', 'tanjung priok', 'kelapa gading', 'pluit', 'penjaringan'], lat: -6.1384, lng: 106.8640, name: 'Jakarta Utara, DKI Jakarta' },
  { keywords: ['jakarta', 'dki jakarta', 'dki'], lat: -6.2088, lng: 106.8456, name: 'DKI Jakarta' },

  // --- BANTEN ---
  { keywords: ['tangerang selatan', 'tangsel', 'bsd', 'serpong', 'ciputat', 'pamulang', 'bintaro'], lat: -6.2886, lng: 106.7179, name: 'Tangerang Selatan, Banten' },
  { keywords: ['tangerang', 'kota tangerang', 'kabupaten tangerang', 'cikupa', 'balaraja', 'tigaraksa'], lat: -6.1783, lng: 106.6319, name: 'Tangerang, Banten' },
  { keywords: ['serang', 'kota serang', 'kabupaten serang'], lat: -6.1104, lng: 106.1640, name: 'Serang, Banten' },
  { keywords: ['cilegon', 'merak'], lat: -5.9991, lng: 106.0274, name: 'Cilegon, Banten' },
  { keywords: ['pandeglang'], lat: -6.3084, lng: 106.1064, name: 'Pandeglang, Banten' },
  { keywords: ['lebak', 'rangkasbitung'], lat: -6.3539, lng: 106.2492, name: 'Lebak, Banten' },

  // --- JAWA TENGAH ---
  { keywords: ['semarang', 'kota semarang', 'kabupaten semarang', 'ungaran'], lat: -6.9667, lng: 110.4167, name: 'Semarang, Jawa Tengah' },
  { keywords: ['surakarta', 'solo'], lat: -7.5755, lng: 110.8243, name: 'Surakarta, Jawa Tengah' },
  { keywords: ['salatiga'], lat: -7.3305, lng: 110.5084, name: 'Salatiga, Jawa Tengah' },
  { keywords: ['magelang'], lat: -7.4706, lng: 110.2178, name: 'Magelang, Jawa Tengah' },
  { keywords: ['pekalongan'], lat: -6.8886, lng: 109.6753, name: 'Pekalongan, Jawa Tengah' },
  { keywords: ['tegal', 'slawi'], lat: -6.8694, lng: 109.1402, name: 'Tegal, Jawa Tengah' },
  { keywords: ['brebes', 'bumiayu'], lat: -6.8703, lng: 109.0435, name: 'Brebes, Jawa Tengah' },
  { keywords: ['banyumas', 'purwokerto'], lat: -7.4243, lng: 109.2302, name: 'Purwokerto, Jawa Tengah' },
  { keywords: ['cilacap'], lat: -7.7028, lng: 109.0156, name: 'Cilacap, Jawa Tengah' },
  { keywords: ['kebumen'], lat: -7.6699, lng: 109.6521, name: 'Kebumen, Jawa Tengah' },
  { keywords: ['purworejo'], lat: -7.7161, lng: 110.0080, name: 'Purworejo, Jawa Tengah' },
  { keywords: ['wonosobo'], lat: -7.3633, lng: 109.9000, name: 'Wonosobo, Jawa Tengah' },
  { keywords: ['banjarnegara'], lat: -7.3986, lng: 109.6974, name: 'Banjarnegara, Jawa Tengah' },
  { keywords: ['purbalingga'], lat: -7.3881, lng: 109.3639, name: 'Purbalingga, Jawa Tengah' },
  { keywords: ['klaten'], lat: -7.7056, lng: 110.6017, name: 'Klaten, Jawa Tengah' },
  { keywords: ['sukoharjo'], lat: -7.6833, lng: 110.8333, name: 'Sukoharjo, Jawa Tengah' },
  { keywords: ['wonogiri'], lat: -7.8139, lng: 110.9272, name: 'Wonogiri, Jawa Tengah' },
  { keywords: ['karanganyar'], lat: -7.5969, lng: 110.9511, name: 'Karanganyar, Jawa Tengah' },
  { keywords: ['sragen'], lat: -7.4278, lng: 111.0222, name: 'Sragen, Jawa Tengah' },
  { keywords: ['boyolali'], lat: -7.5333, lng: 110.5958, name: 'Boyolali, Jawa Tengah' },
  { keywords: ['kudus'], lat: -6.8048, lng: 110.8405, name: 'Kudus, Jawa Tengah' },
  { keywords: ['jepara'], lat: -6.5928, lng: 110.6778, name: 'Jepara, Jawa Tengah' },
  { keywords: ['pati'], lat: -6.7556, lng: 111.0378, name: 'Pati, Jawa Tengah' },
  { keywords: ['rembang'], lat: -6.7114, lng: 111.3436, name: 'Rembang, Jawa Tengah' },
  { keywords: ['blora', 'cepu'], lat: -6.9694, lng: 111.4189, name: 'Blora, Jawa Tengah' },
  { keywords: ['grobogan', 'purwodadi'], lat: -7.0869, lng: 110.9169, name: 'Grobogan, Jawa Tengah' },
  { keywords: ['demak'], lat: -6.8944, lng: 110.6389, name: 'Demak, Jawa Tengah' },
  { keywords: ['kendal', 'weleri'], lat: -6.9208, lng: 110.2039, name: 'Kendal, Jawa Tengah' },
  { keywords: ['batang'], lat: -6.9083, lng: 109.7333, name: 'Batang, Jawa Tengah' },
  { keywords: ['pemalang'], lat: -6.8917, lng: 109.3806, name: 'Pemalang, Jawa Tengah' },

  // --- D.I. YOGYAKARTA ---
  { keywords: ['yogyakarta', 'jogja', 'kota yogyakarta', 'malioboro'], lat: -7.7956, lng: 110.3695, name: 'Yogyakarta, D.I. Yogyakarta' },
  { keywords: ['sleman', 'ugm', 'kaliurang', 'depok sleman'], lat: -7.7167, lng: 110.3556, name: 'Sleman, D.I. Yogyakarta' },
  { keywords: ['bantul', 'parangtritis', 'sewon'], lat: -7.8897, lng: 110.3289, name: 'Bantul, D.I. Yogyakarta' },
  { keywords: ['kulon progo', 'wates', 'yia'], lat: -7.8578, lng: 110.1583, name: 'Kulon Progo, D.I. Yogyakarta' },
  { keywords: ['gunungkidul', 'wonosari'], lat: -7.9622, lng: 110.6039, name: 'Gunungkidul, D.I. Yogyakarta' },

  // --- JAWA TIMUR ---
  { keywords: ['surabaya', 'kota surabaya'], lat: -7.2575, lng: 112.7521, name: 'Surabaya, Jawa Timur' },
  { keywords: ['malang', 'kota malang', 'kabupaten malang', 'batu', 'kota batu'], lat: -7.9666, lng: 112.6326, name: 'Malang, Jawa Timur' },
  { keywords: ['sidoarjo', 'waru'], lat: -7.4478, lng: 112.7183, name: 'Sidoarjo, Jawa Timur' },
  { keywords: ['gresik'], lat: -7.1566, lng: 112.6555, name: 'Gresik, Jawa Timur' },
  { keywords: ['mojokerto'], lat: -7.4722, lng: 112.4339, name: 'Mojokerto, Jawa Timur' },
  { keywords: ['pasuruan', 'pandaan'], lat: -7.6469, lng: 112.9078, name: 'Pasuruan, Jawa Timur' },
  { keywords: ['probolinggo', 'kraksaan'], lat: -7.7544, lng: 113.2158, name: 'Probolinggo, Jawa Timur' },
  { keywords: ['jember'], lat: -8.1722, lng: 113.7000, name: 'Jember, Jawa Timur' },
  { keywords: ['banyuwangi', 'ketapang'], lat: -8.2192, lng: 114.3692, name: 'Banyuwangi, Jawa Timur' },
  { keywords: ['kediri'], lat: -7.8167, lng: 112.0167, name: 'Kediri, Jawa Timur' },
  { keywords: ['blitar'], lat: -8.0983, lng: 112.1681, name: 'Blitar, Jawa Timur' },
  { keywords: ['madiun', 'caruban'], lat: -7.6298, lng: 111.5239, name: 'Madiun, Jawa Timur' },
  { keywords: ['bojonegoro'], lat: -7.1503, lng: 111.8817, name: 'Bojonegoro, Jawa Timur' },
  { keywords: ['tuban'], lat: -6.8978, lng: 112.0647, name: 'Tuban, Jawa Timur' },
  { keywords: ['lamongan'], lat: -7.1206, lng: 112.4156, name: 'Lamongan, Jawa Timur' },
  { keywords: ['jombang'], lat: -7.5461, lng: 112.2331, name: 'Jombang, Jawa Timur' },
  { keywords: ['nganjuk'], lat: -7.6050, lng: 111.9039, name: 'Nganjuk, Jawa Timur' },
  { keywords: ['tulungagung'], lat: -8.0667, lng: 111.9000, name: 'Tulungagung, Jawa Timur' },
  { keywords: ['trenggalek'], lat: -8.0500, lng: 111.7167, name: 'Trenggalek, Jawa Timur' },
  { keywords: ['ponorogo'], lat: -7.8686, lng: 111.4639, name: 'Ponorogo, Jawa Timur' },
  { keywords: ['pacitan'], lat: -8.2069, lng: 111.0939, name: 'Pacitan, Jawa Timur' },
  { keywords: ['ngawi'], lat: -7.4039, lng: 111.4456, name: 'Ngawi, Jawa Timur' },
  { keywords: ['magetan'], lat: -7.6539, lng: 111.3289, name: 'Magetan, Jawa Timur' },
  { keywords: ['lumajang'], lat: -8.1333, lng: 113.2247, name: 'Lumajang, Jawa Timur' },
  { keywords: ['bondowoso'], lat: -7.9136, lng: 113.8214, name: 'Bondowoso, Jawa Timur' },
  { keywords: ['situbondo'], lat: -7.7067, lng: 114.0044, name: 'Situbondo, Jawa Timur' },
  { keywords: ['bangkalan'], lat: -7.0456, lng: 112.7483, name: 'Bangkalan, Madura' },
  { keywords: ['sampang'], lat: -7.1883, lng: 113.2483, name: 'Sampang, Madura' },
  { keywords: ['pamekasan'], lat: -7.1583, lng: 113.4750, name: 'Pamekasan, Madura' },
  { keywords: ['sumenep'], lat: -7.0167, lng: 113.8667, name: 'Sumenep, Madura' },

  // --- SUMATERA ---
  { keywords: ['medan', 'kota medan', 'deli serdang', 'sumut', 'sumatera utara'], lat: 3.5952, lng: 98.6722, name: 'Medan, Sumatera Utara' },
  { keywords: ['padang', 'kota padang', 'sumbar', 'sumatera barat', 'bukittinggi', 'padang panjang'], lat: -0.9471, lng: 100.4172, name: 'Padang, Sumatera Barat' },
  { keywords: ['pekanbaru', 'riau', 'dumai'], lat: 0.5071, lng: 101.4478, name: 'Pekanbaru, Riau' },
  { keywords: ['batam', 'kepri', 'tanjung pinang', 'kepulauan riau'], lat: 1.1301, lng: 104.0529, name: 'Batam, Kepulauan Riau' },
  { keywords: ['palembang', 'sumsel', 'sumatera selatan'], lat: -2.9761, lng: 104.7754, name: 'Palembang, Sumatera Selatan' },
  { keywords: ['bandar lampung', 'lampung', 'metro'], lat: -5.4292, lng: 105.2625, name: 'Bandar Lampung, Lampung' },
  { keywords: ['jambi', 'kota jambi'], lat: -1.6101, lng: 103.6131, name: 'Jambi' },
  { keywords: ['bengkulu', 'kota bengkulu'], lat: -3.8004, lng: 102.2655, name: 'Bengkulu' },
  { keywords: ['banda aceh', 'aceh', 'lhokseumawe', 'sabang'], lat: 5.5483, lng: 95.3238, name: 'Banda Aceh, Aceh' },
  { keywords: ['pangkal pinang', 'bangka', 'belitung'], lat: -2.1333, lng: 106.1167, name: 'Pangkal Pinang, Bangka Belitung' },

  // --- KALIMANTAN ---
  { keywords: ['pontianak', 'kalbar', 'kalimantan barat', 'singkawang'], lat: -0.0263, lng: 109.3425, name: 'Pontianak, Kalimantan Barat' },
  { keywords: ['banjarmasin', 'banjarbaru', 'kalsel', 'kalimantan selatan', 'martapura'], lat: -3.3194, lng: 114.5908, name: 'Banjarmasin, Kalimantan Selatan' },
  { keywords: ['samarinda', 'kaltim', 'kalimantan timur'], lat: -0.5022, lng: 117.1536, name: 'Samarinda, Kalimantan Timur' },
  { keywords: ['balikpapan', 'penajam', 'ikn', 'nusantara'], lat: -1.2379, lng: 116.8529, name: 'Balikpapan, Kalimantan Timur' },
  { keywords: ['palangkaraya', 'kalteng', 'kalimantan tengah'], lat: -2.2161, lng: 113.9167, name: 'Palangka Raya, Kalimantan Tengah' },
  { keywords: ['tarakan', 'tanjung selor', 'kaltara', 'kalimantan utara'], lat: 3.3274, lng: 117.5878, name: 'Tarakan, Kalimantan Utara' },

  // --- SULAWESI ---
  { keywords: ['makassar', 'sulsel', 'sulawesi selatan', 'gowa', 'maros'], lat: -5.1477, lng: 119.4327, name: 'Makassar, Sulawesi Selatan' },
  { keywords: ['manado', 'sulut', 'sulawesi utara', 'tomohon', 'bitung'], lat: 1.4748, lng: 124.8428, name: 'Manado, Sulawesi Utara' },
  { keywords: ['palu', 'sulteng', 'sulawesi tengah', 'donggala'], lat: -0.9003, lng: 119.8779, name: 'Palu, Sulawesi Tengah' },
  { keywords: ['kendari', 'sultra', 'sulawesi tenggara', 'bau-bau'], lat: -3.9985, lng: 122.5126, name: 'Kendari, Sulawesi Tenggara' },
  { keywords: ['gorontalo', 'kota gorontalo'], lat: 0.5435, lng: 123.0568, name: 'Gorontalo' },
  { keywords: ['mamuju', 'sulbar', 'sulawesi barat'], lat: -2.6775, lng: 118.8894, name: 'Mamuju, Sulawesi Barat' },

  // --- BALI & NUSA TENGGARA ---
  { keywords: ['denpasar', 'bali', 'badung', 'kuta', 'ubud', 'gianyar', 'sanur', 'buleleng', 'singaraja', 'tabanan'], lat: -8.6705, lng: 115.2126, name: 'Denpasar, Bali' },
  { keywords: ['mataram', 'lombok', 'ntb', 'nusa tenggara barat', 'senggigi', 'sumbawa'], lat: -8.5833, lng: 116.1167, name: 'Mataram, NTB' },
  { keywords: ['kupang', 'ntt', 'nusa tenggara timur', 'labuan bajo', 'flores', 'ende', 'maumere'], lat: -10.1772, lng: 123.6070, name: 'Kupang, NTT' },

  // --- MALUKU & PAPUA ---
  { keywords: ['ambon', 'maluku', 'seram'], lat: -3.6547, lng: 128.1906, name: 'Ambon, Maluku' },
  { keywords: ['ternate', 'tidore', 'maluku utara', 'sofifi'], lat: 0.7903, lng: 127.3828, name: 'Ternate, Maluku Utara' },
  { keywords: ['jayapura', 'papua', 'sentani', 'abepura'], lat: -2.5916, lng: 140.6690, name: 'Jayapura, Papua' },
  { keywords: ['manokwari', 'papua barat', 'sorong', 'raja ampat'], lat: -0.8615, lng: 134.0620, name: 'Manokwari, Papua Barat' },
  { keywords: ['merauke', 'papua selatan'], lat: -8.4991, lng: 140.4011, name: 'Merauke, Papua Selatan' },
  { keywords: ['timika', 'mimika', 'papua tengah'], lat: -4.5441, lng: 136.8833, name: 'Timika, Papua Tengah' },
  { keywords: ['wamena', 'jayawijaya', 'papua pegunungan'], lat: -4.0956, lng: 138.9442, name: 'Wamena, Papua Pegunungan' },
];

/**
 * Resolves geographic coordinates (Latitude, Longitude) from any location string or expert fields.
 * Includes a small deterministic jitter for multiple experts in the same city so pins don't overlap completely.
 */
export function getCoordinatesFromLocation(locationText, index = 0) {
  if (!locationText || typeof locationText !== 'string') {
    return null;
  }

  const cleanText = locationText.toLowerCase().replace(/kabupaten|kota|provinsi|kecamatan|kelurahan/g, ' ').trim();

  // 1. Search dictionary by keyword match
  for (const item of INDONESIA_COORDINATES) {
    for (const keyword of item.keywords) {
      // Word boundary or inclusion check
      const regex = new RegExp(`(^|[^a-z0-9])${keyword}([^a-z0-9]|$)`, 'i');
      if (regex.test(cleanText) || cleanText.includes(keyword)) {
        // Apply tiny deterministic jitter (+- ~200-400 meters) so overlapping markers in the same city are distinguishable
        const jitterLat = ((index % 5) - 2) * 0.0035;
        const jitterLng = (((index * 3) % 5) - 2) * 0.0035;
        return {
          lat: Number((item.lat + jitterLat).toFixed(6)),
          lng: Number((item.lng + jitterLng).toFixed(6)),
          matchedCity: item.name,
        };
      }
    }
  }

  return null;
}
