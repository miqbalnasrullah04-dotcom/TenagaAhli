/**
 * Utilitas Jadwal & Kalender Konsultasi TenagaAhli.com
 */

export const DAYS = [
  { key: 'senin', label: 'Senin', shortLabel: 'Sen', dayIndex: 1 },
  { key: 'selasa', label: 'Selasa', shortLabel: 'Sel', dayIndex: 2 },
  { key: 'rabu', label: 'Rabu', shortLabel: 'Rab', dayIndex: 3 },
  { key: 'kamis', label: 'Kamis', shortLabel: 'Kam', dayIndex: 4 },
  { key: 'jumat', label: 'Jumat', shortLabel: 'Jum', dayIndex: 5 },
  { key: 'sabtu', label: 'Sabtu', shortLabel: 'Sab', dayIndex: 6 },
  { key: 'minggu', label: 'Minggu', shortLabel: 'Min', dayIndex: 0 },
];

export const TIME_OPTIONS = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
  '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30',
  '19:00', '19:30', '20:00', '20:30', '21:00', '21:30', '22:00',
];

/**
 * Format Date ke string YYYY-MM-DD (WIB/Lokal)
 */
export const toLocalDateStr = (d) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d + (d.includes('T') ? '' : 'T00:00:00')) : d;
  if (isNaN(date.getTime())) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Dapatkan nama hari key dari date
 */
export const getDayKey = (d) => {
  const date = typeof d === 'string' ? new Date(d + (d.includes('T') ? '' : 'T00:00:00')) : d;
  if (isNaN(date.getTime())) return 'senin';
  const dayNames = ['minggu', 'senin', 'selasa', 'rabu', 'kamis', 'jumat', 'sabtu'];
  return dayNames[date.getDay()];
};

/**
 * Format tanggal Indonesia lengkap: "Senin, 19 Oktober 2026"
 */
export const formatDateIndo = (d, withDay = true) => {
  if (!d) return '';
  const date = typeof d === 'string' ? new Date(d + (d.includes('T') ? '' : 'T00:00:00')) : d;
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('id-ID', {
    ...(withDay ? { weekday: 'long' } : {}),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

/**
 * Format bulan dan tahun: "Oktober 2026"
 */
export const formatMonthYearIndo = (year, month) => {
  const date = new Date(year, month, 1);
  return date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
};

/**
 * Buat array hari untuk kalender bulanan (dimulai hari Senin)
 */
export const getMonthCalendarGrid = (year, month) => {
  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const totalDays = lastDayOfMonth.getDate();

  // Hari pertama dalam seminggu (0: Minggu, 1: Senin, ..., 6: Sabtu)
  // Ubah agar minggu dimulai dari Senin (0: Senin, ..., 6: Minggu)
  let startOffset = firstDayOfMonth.getDay() - 1;
  if (startOffset === -1) startOffset = 6; // Minggu jadi indeks 6

  const calendarDays = [];

  // Hari-hari dari bulan sebelumnya untuk padding awal
  const prevMonthLastDate = new Date(year, month, 0).getDate();
  for (let i = startOffset - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDate - i;
    const dateObj = new Date(year, month - 1, dayNum);
    calendarDays.push({
      dateStr: toLocalDateStr(dateObj),
      dayNumber: dayNum,
      isCurrentMonth: false,
      date: dateObj,
    });
  }

  // Hari-hari pada bulan ini
  for (let day = 1; day <= totalDays; day++) {
    const dateObj = new Date(year, month, day);
    calendarDays.push({
      dateStr: toLocalDateStr(dateObj),
      dayNumber: day,
      isCurrentMonth: true,
      date: dateObj,
    });
  }

  // Hari-hari dari bulan berikutnya untuk padding akhir agar kelipatan 7
  const remainingDays = 7 - (calendarDays.length % 7);
  if (remainingDays < 7) {
    for (let day = 1; day <= remainingDays; day++) {
      const dateObj = new Date(year, month + 1, day);
      calendarDays.push({
        dateStr: toLocalDateStr(dateObj),
        dayNumber: day,
        isCurrentMonth: false,
        date: dateObj,
      });
    }
  }

  return calendarDays;
};

/**
 * Generate 30-minute interval slots antara startTime dan endTime
 */
export const generateTimeSlots = (startTime = '09:00', endTime = '17:00', hasBreak = false, breakStart = '12:00', breakEnd = '13:00') => {
  if (!startTime || !endTime) return [];
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  const startTotal = startH * 60 + startM;
  const endTotal = endH * 60 + endM;

  if (startTotal >= endTotal) return [];

  let breakStartTotal = -1;
  let breakEndTotal = -1;
  if (hasBreak && breakStart && breakEnd) {
    const [bsh, bsm] = breakStart.split(':').map(Number);
    const [beh, bem] = breakEnd.split(':').map(Number);
    breakStartTotal = bsh * 60 + bsm;
    breakEndTotal = beh * 60 + bem;
  }

  const slots = [];
  for (let mins = startTotal; mins < endTotal; mins += 30) {
    // Lewati jika berada dalam jam istirahat
    if (hasBreak && mins >= breakStartTotal && mins < breakEndTotal) {
      continue;
    }
    const h = String(Math.floor(mins / 60)).padStart(2, '0');
    const m = String(mins % 60).padStart(2, '0');
    slots.push(`${h}:${m}`);
  }
  return slots;
};

/**
 * Mengekstrak rentang jam (shift/sesi) dari kumpulan slot 30 menit
 */
export const extractTimeRangesFromSlots = (slots = [], collapseLegacyBreak = true) => {
  if (!slots || slots.length === 0) {
    return [{ start: '09:00', end: '17:00' }];
  }

  const sorted = [...slots].sort();
  const ranges = [];
  let currentStart = sorted[0];
  let prevSlot = sorted[0];

  for (let i = 1; i < sorted.length; i++) {
    const [h1, m1] = prevSlot.split(':').map(Number);
    const [h2, m2] = sorted[i].split(':').map(Number);
    const diff = (h2 * 60 + m2) - (h1 * 60 + m1);

    if (diff > 30) {
      const prevEndMins = h1 * 60 + m1 + 30;
      const endH = Math.min(24, Math.floor(prevEndMins / 60));
      const endM = prevEndMins % 60;
      const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
      ranges.push({ start: currentStart, end: endStr });
      currentStart = sorted[i];
    }
    prevSlot = sorted[i];
  }

  const [lastH, lastM] = prevSlot.split(':').map(Number);
  const lastEndMins = lastH * 60 + lastM + 30;
  const endH = Math.min(24, Math.floor(lastEndMins / 60));
  const endM = lastEndMins % 60;
  const endStr = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;
  ranges.push({ start: currentStart, end: endStr });

  // Jika hasil ekstraksi adalah 2 sesi akibat legacy break 12:00 - 13:00, lebur jadi 1 sesi tunggal default
  if (collapseLegacyBreak && ranges.length === 2 && ranges[0].end === '12:00' && ranges[1].start === '13:00') {
    return [{ start: ranges[0].start, end: ranges[1].end }];
  }

  // Maksimal 4 sesi
  return ranges.slice(0, 4);
};

/**
 * Menghitung jam buka & jam tutup dari array slot 30 menit
 */
export const inferHoursFromSlots = (slots = []) => {
  if (!slots || slots.length === 0) {
    return {
      isOpen: false,
      start: '09:00',
      end: '17:00',
      hasBreak: false,
      breakStart: '12:00',
      breakEnd: '13:00',
      ranges: [],
      totalSlots: 0,
      hoursLabel: 'Libur',
    };
  }

  const sorted = [...slots].sort();
  const ranges = extractTimeRangesFromSlots(sorted);
  const start = sorted[0];
  const lastSlot = sorted[sorted.length - 1];
  const [lastH, lastM] = lastSlot.split(':').map(Number);
  const lastMins = lastH * 60 + lastM + 30;
  const endH = Math.min(24, Math.floor(lastMins / 60));
  const endM = lastMins % 60;
  const end = `${String(endH).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

  const hasBreak = ranges.length > 1;
  const breakStart = hasBreak ? ranges[0].end : '12:00';
  const breakEnd = hasBreak ? ranges[1].start : '13:00';
  const hoursLabel = ranges.map(r => `${r.start} - ${r.end}`).join(' & ');

  return {
    isOpen: true,
    start,
    end,
    hasBreak,
    breakStart,
    breakEnd,
    ranges,
    totalSlots: sorted.length,
    hoursLabel,
  };
};

/**
 * Mengambil slot untuk tanggal tertentu dengan mempertimbangkan tanggal spesifik dan template hari
 */
export const resolveSlotsForDate = (schedule = {}, dateStr) => {
  if (!dateStr || !schedule) return [];
  if (schedule[dateStr] !== undefined) {
    return Array.isArray(schedule[dateStr]) ? schedule[dateStr] : [];
  }
  const dayKey = getDayKey(dateStr);
  return Array.isArray(schedule[dayKey]) ? schedule[dayKey] : [];
};
