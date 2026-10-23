/**
 * Utility untuk menghitung persentase komisi admin dan penghasilan tenaga ahli
 * berdasarkan tier paket keanggotaan (Free, Ekonomis, Eksklusif).
 *
 * Aturan Baru:
 * - Tidak ada lagi pembedaan potongan chat (sebelumnya 20%) vs zoom (sebelumnya 25%).
 * - Potongan konsultasi chat dan zoom sama, ditentukan oleh jenis paket ahli:
 *   1. Paket Free (Biasa):
 *      - Potongan Komisi Admin: 30%
 *      - Penghasilan Ahli: 70%
 *   2. Paket Ekonomis:
 *      - Potongan Komisi Admin: 20%
 *      - Penghasilan Ahli: 80%
 *   3. Paket Eksklusif:
 *      - Potongan Komisi Admin: 10%
 *      - Penghasilan Ahli: 90%
 */

export function getExpertPackageTier(target) {
  if (!target) return 'free';

  // Handle nested expert or user object
  const expert = target.expert || target;

  const pkg = String(
    expert.package_name ||
    expert.package?.name ||
    expert.package?.slug ||
    target.package_name ||
    target.package?.name ||
    target.package?.slug ||
    (typeof target.package === 'string' ? target.package : '') ||
    ''
  ).toLowerCase();

  const mem = String(
    expert.membership_level ||
    target.membership_level ||
    ''
  ).toLowerCase();

  const isPlatinum = Boolean(
    expert.is_platinum ||
    target.is_platinum ||
    mem === 'platinum' ||
    mem === 'eksklusif' ||
    mem === 'ekslusif' ||
    mem === 'esklusif' ||
    pkg.includes('platinum') ||
    pkg.includes('eksklusif') ||
    pkg.includes('ekslusif') ||
    pkg.includes('esklusif')
  );

  if (isPlatinum) {
    return 'eksklusif';
  }

  const isPremium = Boolean(
    expert.is_premium ||
    target.is_premium ||
    expert.featured ||
    target.featured ||
    mem === 'premium' ||
    mem === 'ekonomis' ||
    mem === 'gold' ||
    pkg.includes('premium') ||
    pkg.includes('ekonomis') ||
    (expert.package_id && Number(expert.package_id) > 1) ||
    (target.package_id && Number(target.package_id) > 1) ||
    (expert.package && (expert.package.price > 0 || String(expert.package.name || '').toLowerCase() !== 'free')) ||
    (target.package && (target.package.price > 0 || String(target.package.name || '').toLowerCase() !== 'free'))
  );

  if (isPremium) {
    return 'ekonomis';
  }

  return 'free';
}

export function getConsultationRates(target) {
  const tier = getExpertPackageTier(target);

  if (tier === 'eksklusif') {
    return {
      tier: 'eksklusif',
      tierLabel: 'Paket Eksklusif',
      commissionPercent: 10,
      earningPercent: 90,
      adminRate: 0.10,
      expertRate: 0.90,
      badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    };
  }

  if (tier === 'ekonomis') {
    return {
      tier: 'ekonomis',
      tierLabel: 'Paket Ekonomis',
      commissionPercent: 20,
      earningPercent: 80,
      adminRate: 0.20,
      expertRate: 0.80,
      badgeColor: 'bg-amber-50 text-amber-800 border-amber-200',
    };
  }

  return {
    tier: 'free',
    tierLabel: 'Paket Free',
    commissionPercent: 30,
    earningPercent: 70,
    adminRate: 0.30,
    expertRate: 0.70,
    badgeColor: 'bg-gray-100 text-gray-700 border-gray-200',
  };
}

export function calculateConsultationSplit(amount, target) {
  const rates = getConsultationRates(target);
  const totalAmount = Math.max(0, Number(amount) || 0);
  const adminCommission = Math.round(totalAmount * rates.adminRate);
  const expertEarning = totalAmount - adminCommission;

  return {
    amount: totalAmount,
    adminCommission,
    expertEarning,
    ...rates,
  };
}
