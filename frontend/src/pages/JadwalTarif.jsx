import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../context/LanguageContext.jsx';
import DashboardLayout from '../components/DashboardLayout.jsx';
import api from '../api/client.js';
import { SkeletonJadwalTarif } from '../components/Skeleton.jsx';
import { getConsultationRates } from '../utils/packageCommission.js';
import {
  DAYS,
  TIME_OPTIONS,
  toLocalDateStr,
  getDayKey,
  formatDateIndo,
  formatMonthYearIndo,
  getMonthCalendarGrid,
  generateTimeSlots,
  inferHoursFromSlots,
  extractTimeRangesFromSlots,
  resolveSlotsForDate,
} from '../utils/scheduleCalendar.js';

const BRAND_BROWN = '#8B4513';

export default function JadwalTarif() {
  const { t } = useTranslation();
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toLocalDateStr(today), [today]);

  // Pricing State (Diambil dari cache terlebih dahulu agar tidak kembali ke template saat reload)
  const [pricing, setPricing] = useState(() => {
    try {
      const cached = localStorage.getItem('expert_pricing');
      if (cached) return JSON.parse(cached);
    } catch {}
    return {
      chat: { enabled: true, price: 150000 },
      zoom: { enabled: true, price: 250000, zoomLink: '' },
    };
  });

  // Schedule State: 7 recurring weekly days + optional date-specific overrides
  const [schedule, setSchedule] = useState(() => {
    try {
      const cached = localStorage.getItem('expert_schedule');
      if (cached) return JSON.parse(cached);
    } catch {}
    const defaultSlots = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'];
    return {
      senin: defaultSlots,
      selasa: defaultSlots,
      rabu: defaultSlots,
      kamis: defaultSlots,
      jumat: defaultSlots,
      sabtu: [],
      minggu: [],
    };
  });

  // State Builder Form Hari & Jam Rutin (Default 1 Sesi, Maksimal 4 Sesi)
  const [selectedDays, setSelectedDays] = useState(['senin', 'selasa', 'rabu', 'kamis', 'jumat']);
  const [timeRanges, setTimeRanges] = useState([
    { start: '08:00', end: '16:00' },
  ]);

  // Calendar Preview State
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // State untuk Jadwal Tambahan Khusus Tanggal Tertentu (Di Luar Jadwal Rutin)
  const [isAddingExtra, setIsAddingExtra] = useState(false);
  const [extraStart, setExtraStart] = useState('19:00');
  const [extraEnd, setExtraEnd] = useState('21:00');
  const [extraMode, setExtraMode] = useState('add'); // 'add' (gabung sesi di luar rutin) atau 'replace' (atur ulang tanggal ini)
  const [activeTab, setActiveTab] = useState('jadwal'); // 'jadwal' | 'tarif' | 'semua'

  const [bookedSlots, setBookedSlots] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [expertInfo, setExpertInfo] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('amdal_user') || '{}');
    } catch {
      return {};
    }
  });

  const rates = getConsultationRates(expertInfo);

  // Load saved schedule and pricing
  useEffect(() => {
    let isMounted = true;
    setLoadingSchedule(true);

    api.get('/my/expert-schedule')
      .then((res) => {
        if (!isMounted) return;
        if (res.data?.schedule) {
          setSchedule(res.data.schedule);
          // Deteksi hari aktif
          const active = DAYS.filter(d => (res.data.schedule[d.key] || []).length > 0).map(d => d.key);
          if (active.length > 0) setSelectedDays(active);

          // Deteksi jam buka & rentang jam rutin
          for (const d of DAYS) {
            const slots = res.data.schedule[d.key] || [];
            if (slots.length > 0) {
              const ranges = extractTimeRangesFromSlots(slots);
              if (ranges && ranges.length > 0) {
                setTimeRanges(ranges);
                break;
              }
            }
          }
        }
        if (res.data?.pricing) {
          setPricing(res.data.pricing);
        }
        if (Array.isArray(res.data?.booked_slots)) {
          setBookedSlots(res.data.booked_slots);
        }
        if (res.data?.expert) {
          setExpertInfo(res.data.expert);
        }
      })
      .catch((err) => {
        console.warn('Gagal memuat jadwal dari API, menggunakan cache:', err);
        try {
          const cached = localStorage.getItem('expert_schedule');
          if (cached) {
            const parsed = JSON.parse(cached);
            setSchedule(parsed);
            const active = DAYS.filter(d => (parsed[d.key] || []).length > 0).map(d => d.key);
            if (active.length > 0) setSelectedDays(active);
            for (const d of DAYS) {
              const slots = parsed[d.key] || [];
              if (slots.length > 0) {
                const ranges = extractTimeRangesFromSlots(slots);
                if (ranges && ranges.length > 0) {
                  setTimeRanges(ranges);
                  break;
                }
              }
            }
          }
          const cachedPricing = localStorage.getItem('expert_pricing');
          if (cachedPricing) {
            setPricing(JSON.parse(cachedPricing));
          }
        } catch {}
      })
      .finally(() => {
        if (isMounted) setLoadingSchedule(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Toggle Hari Buka Rutin
  const toggleDay = (key) => {
    setSelectedDays(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Helper Pengaturan Rentang Jam Rutin (Multi-Sesi & Jam Istirahat Mandiri, Maksimal 4 Sesi)
  const MAX_SESSIONS = 4;

  const handleAddTimeRange = () => {
    if (timeRanges.length >= MAX_SESSIONS) {
      alert(`Maksimal hanya dapat menambahkan ${MAX_SESSIONS} sesi.`);
      return;
    }
    setTimeRanges(prev => {
      if (prev.length >= MAX_SESSIONS) return prev;
      const last = prev[prev.length - 1];
      let nextStart = '13:00';
      let nextEnd = '17:00';
      if (last && last.end) {
        const lastEndIdx = TIME_OPTIONS.indexOf(last.end);
        if (lastEndIdx !== -1 && lastEndIdx + 2 < TIME_OPTIONS.length) {
          nextStart = TIME_OPTIONS[lastEndIdx + 2];
          nextEnd = TIME_OPTIONS[Math.min(lastEndIdx + 10, TIME_OPTIONS.length - 1)];
        } else if (lastEndIdx !== -1 && lastEndIdx + 1 < TIME_OPTIONS.length) {
          nextStart = TIME_OPTIONS[lastEndIdx + 1];
          nextEnd = TIME_OPTIONS[Math.min(lastEndIdx + 9, TIME_OPTIONS.length - 1)];
        }
      }
      return [...prev, { start: nextStart, end: nextEnd }];
    });
  };

  const handleRemoveTimeRange = (index) => {
    if (timeRanges.length <= 1) return;
    setTimeRanges(prev => prev.filter((_, i) => i !== index));
  };

  const handleTimeRangeChange = (index, field, value) => {
    setTimeRanges(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  // Helper utama untuk menyimpan schedule & pricing ke backend database & local cache
  const persistSchedule = async (newSchedule, newPricing = pricing, successMessage = '') => {
    setIsSaving(true);
    try {
      await api.post('/my/expert-schedule', { schedule: newSchedule, pricing: newPricing });

      // Simpan ke local cache juga
      try {
        const userRaw = localStorage.getItem('amdal_user');
        const u = userRaw ? JSON.parse(userRaw) : null;
        const key = u?.slug || u?.id || '';
        if (key) {
          localStorage.setItem(`expert_schedule_${key}`, JSON.stringify(newSchedule));
          localStorage.setItem(`expert_pricing_${key}`, JSON.stringify(newPricing));
        }
        localStorage.setItem('expert_schedule', JSON.stringify(newSchedule));
        localStorage.setItem('expert_pricing', JSON.stringify(newPricing));
      } catch {}

      if (successMessage) {
        alert(successMessage);
      }
      return true;
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan pengaturan jadwal ke server.');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Terapkan Jadwal Rutin ke Template Mingguan & LANGSUNG SIMPAN KE DATABASE
  const handleApplySchedule = async () => {
    if (selectedDays.length === 0) {
      alert('Pilih minimal satu hari buka.');
      return;
    }

    // Validasi rentang jam
    for (let i = 0; i < timeRanges.length; i++) {
      const r = timeRanges[i];
      if (r.start >= r.end) {
        alert(`Jam Sesi ${i + 1} (${r.start} - ${r.end}) tidak valid. Jam buka harus lebih awal dari jam tutup.`);
        return;
      }
    }

    // Gabungkan slot dari semua sesi rentang jam
    const slots = Array.from(
      new Set(timeRanges.flatMap(r => generateTimeSlots(r.start, r.end, false)))
    ).sort();

    if (slots.length === 0) {
      alert('Pilihan rentang jam tidak menghasilkan sesi konsultasi yang valid.');
      return;
    }

    // Update 7 hari mingguan, dan pertahankan jadwal tanggal khusus yang sudah pernah ditambahkan
    const updatedSchedule = { ...schedule };
    DAYS.forEach(d => {
      updatedSchedule[d.key] = selectedDays.includes(d.key) ? slots : [];
    });

    setSchedule(updatedSchedule);

    const activeNames = selectedDays.map(k => DAYS.find(d => d.key === k)?.label).join(', ');
    const hoursSummary = timeRanges.map(r => `${r.start} - ${r.end} WIB`).join(' & ');
    const msg = `Jadwal Rutin Berhasil Diterapkan & Disimpan!\n\nBuka setiap hari ${activeNames} pada jam ${hoursSummary}.\n\nJadwal ini telah tersimpan ke database dan otomatis berulang setiap minggu tanpa perlu diatur ulang.`;

    await persistSchedule(updatedSchedule, pricing, msg);
  };

  // Simpan Jadwal Tambahan khusus tanggal ini TANPA merubah jadwal rutin & LANGSUNG SIMPAN KE DATABASE
  const handleSaveExtraSchedule = async () => {
    if (extraStart >= extraEnd) {
      alert('Jam mulai harus lebih awal dari jam selesai.');
      return;
    }
    const newSlots = generateTimeSlots(extraStart, extraEnd, false);
    if (newSlots.length === 0) {
      alert('Pilihan rentang jam tidak menghasilkan sesi yang valid.');
      return;
    }

    const dayKey = getDayKey(selectedDate);
    const routineSlots = schedule[dayKey] || [];

    let finalSlots = newSlots;
    if (routineSlots.length > 0 && extraMode === 'add') {
      // Gabungkan jadwal rutin yang sudah ada dengan jam tambahan di luar jam rutin
      finalSlots = Array.from(new Set([...routineSlots, ...newSlots])).sort();
    }

    const updatedSchedule = {
      ...schedule,
      [selectedDate]: finalSlots,
    };

    setSchedule(updatedSchedule);
    setIsAddingExtra(false);

    const msg = `Jadwal Tambahan Berhasil Disimpan!\n\nTanggal: ${formatDateIndo(selectedDate)}\nJam Tambahan: ${extraStart} - ${extraEnd} WIB\n\nJadwal telah tersimpan ke database. Jadwal rutin mingguan Anda TETAP BERJALAN seperti biasa dan TIDAK BERUBAH.`;

    await persistSchedule(updatedSchedule, pricing, msg);
  };

  // Hapus override tanggal khusus (kembali otomatis ke jadwal rutin) & LANGSUNG SIMPAN
  const handleRemoveDateOverride = async (dateStr) => {
    const next = { ...schedule };
    delete next[dateStr];
    setSchedule(next);
    await persistSchedule(next, pricing, `Jadwal khusus tanggal ${formatDateIndo(dateStr)} telah dihapus dan kembali mengikuti jadwal rutin.`);
  };

  // Liburkan khusus tanggal ini saja & LANGSUNG SIMPAN
  const handleSetHolidayForDate = async (dateStr) => {
    const next = {
      ...schedule,
      [dateStr]: [],
    };
    setSchedule(next);
    await persistSchedule(next, pricing, `Tanggal ${formatDateIndo(dateStr)} berhasil diatur LIBUR khusus.`);
  };

  // Simpan khusus pengaturan tarif layanan ke database
  const handleSavePricing = async () => {
    const chatStatus = pricing.chat.enabled ? `Chat (15 mnt): ${formatCurrency(pricing.chat.price)}` : 'Chat: Nonaktif';
    const zoomStatus = pricing.zoom.enabled ? `Zoom (30 mnt): ${formatCurrency(pricing.zoom.price)}` : 'Zoom: Nonaktif';
    await persistSchedule(
      schedule,
      pricing,
      `Pengaturan Tarif Berhasil Disimpan!\n\n${chatStatus}\n${zoomStatus}\n\nTarif ini telah tersimpan permanen ke database dan langsung aktif di profil publik Anda.`
    );
  };

  // Simpan ke database manual
  const handleSaveAll = async () => {
    await persistSchedule(schedule, pricing, 'Pengaturan jadwal dan tarif berhasil disimpan! Perubahan langsung aktif di kalender profil publik Anda.');
  };

  // Navigasi kalender
  const handlePrevCalMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear(prev => prev - 1);
    } else {
      setCalMonth(prev => prev - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear(prev => prev + 1);
    } else {
      setCalMonth(prev => prev + 1);
    }
  };

  const calGrid = useMemo(() => {
    return getMonthCalendarGrid(calYear, calMonth);
  }, [calYear, calMonth]);

  // Cek apakah tanggal terpilih merupakan jadwal khusus
  const isDateCustomOverride = schedule[selectedDate] !== undefined;
  const isDateCustomExtra = isDateCustomOverride && (schedule[selectedDate] || []).length > 0;
  const isDateCustomHoliday = isDateCustomOverride && (schedule[selectedDate] || []).length === 0;

  const selectedDateSlots = resolveSlotsForDate(schedule, selectedDate);
  const selectedDateInfo = inferHoursFromSlots(selectedDateSlots);

  const selectedDayKey = useMemo(() => (selectedDate ? getDayKey(selectedDate) : null), [selectedDate]);
  const routineSlotsForSelectedDate = useMemo(() => {
    if (!selectedDayKey) return [];
    return schedule[selectedDayKey] || [];
  }, [schedule, selectedDayKey]);
  const routineInfoForSelectedDate = useMemo(() => {
    return inferHoursFromSlots(routineSlotsForSelectedDate);
  }, [routineSlotsForSelectedDate]);

  // Daftar semua jadwal khusus / tambahan
  const customDateList = useMemo(() => {
    return Object.keys(schedule)
      .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k))
      .sort()
      .map(dateStr => {
        const slots = schedule[dateStr] || [];
        const info = inferHoursFromSlots(slots);
        return {
          dateStr,
          slots,
          isOpen: info.isOpen,
          hoursLabel: info.hoursLabel,
        };
      });
  }, [schedule]);

  const activeDayLabels = selectedDays
    .map(k => DAYS.find(d => d.key === k)?.label)
    .join(', ');

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <DashboardLayout
      title="Jadwal & Tarif Konsultasi"
      subtitle="Atur jadwal rutin, jadwal tambahan di tanggal tertentu, dan tarif konsultasi"
    >
      <div className="space-y-6 max-w-5xl">
        {/* ── TOMBOL NAVIGASI TAB: JADWAL & TARIF ── */}
        <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
          <button
            type="button"
            onClick={() => setActiveTab('jadwal')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
              activeTab === 'jadwal'
                ? 'bg-[#8B4513] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            <span>Jadwal Konsultasi</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tarif')}
            className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
              activeTab === 'tarif'
                ? 'bg-[#8B4513] text-white shadow-xs'
                : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">payments</span>
            <span>Tarif Konsultasi</span>
          </button>
        </div>

        {loadingSchedule ? (
          <SkeletonJadwalTarif activeTab={activeTab} />
        ) : (
          <>
            {activeTab === 'jadwal' && (
              <>
                {/* ── CARD 1: PENGATURAN JADWAL RUTIN (BERULANG SETIAP MINGGU) ── */}
                <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-5">
              <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
                <span className="material-symbols-outlined text-[#8B4513] text-[22px]">event_repeat</span>
                <div>
                  <h3 className="font-bold text-base text-gray-900">1. Jadwal Buka Rutin (Setiap Minggu)</h3>
              <p className="text-xs text-gray-500">
                Tentukan hari apa saja Anda buka secara rutin dan jam operasionalnya. Jadwal ini otomatis aktif setiap minggu selamanya.
              </p>
            </div>
          </div>

          {/* 1. Pilih Hari Buka */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-700">
                Pilih Hari Buka Rutin:
              </label>

              {/* Pintasan Cepat Sederhana */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedDays(['jumat', 'sabtu'])}
                  className="text-xs text-[#8B4513] font-semibold hover:underline cursor-pointer"
                >
                  Jumat & Sabtu
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedDays(['senin', 'selasa', 'rabu', 'kamis', 'jumat'])}
                  className="text-xs text-[#8B4513] font-semibold hover:underline cursor-pointer"
                >
                  Senin - Jumat
                </button>
                <span className="text-gray-300">•</span>
                <button
                  type="button"
                  onClick={() => setSelectedDays(DAYS.map(d => d.key))}
                  className="text-xs text-gray-500 hover:text-gray-900 cursor-pointer"
                >
                  Pilih Semua
                </button>
              </div>
            </div>

            {/* 7 Tombol Hari Bersih */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {DAYS.map(d => {
                const isActive = selectedDays.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    className={`py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm transition-all cursor-pointer flex flex-col items-center justify-center gap-0.5 border ${
                      isActive
                        ? 'bg-[#8B4513] text-white border-[#8B4513] shadow-xs'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100 hover:border-gray-300'
                    }`}
                  >
                    <span>{d.shortLabel}</span>
                    <span className={`text-[10px] font-normal ${isActive ? 'text-amber-100' : 'text-gray-400'}`}>
                      {isActive ? 'Buka' : 'Libur'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Atur Sesi / Jam Buka Rutin (Multi-Sesi, Maksimal 4 Sesi) */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                Jam Buka Operasional:
              </label>

              {timeRanges.length < 4 ? (
                <button
                  type="button"
                  onClick={handleAddTimeRange}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border-2 border-[#8B4513] bg-[#8B4513]/5 hover:bg-[#8B4513] text-[#8B4513] hover:text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
                >
                  <span className="material-symbols-outlined text-[17px]">add_circle</span>
                  <span>+ Tambah Sesi ({timeRanges.length}/4)</span>
                </button>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold">
                  <span className="material-symbols-outlined text-[15px] text-gray-500">check_circle</span>
                  Maks. 4 Sesi
                </span>
              )}
            </div>

            <div className="space-y-2.5">
              {timeRanges.map((range, idx) => (
                <div
                  key={idx}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-gray-50/80 rounded-xl border border-gray-200/90 hover:border-amber-200 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-[75px]">
                    <span className="w-6 h-6 rounded-full bg-[#8B4513]/10 text-[#8B4513] font-bold text-xs flex items-center justify-center">
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-gray-700">
                      Sesi {idx + 1}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 flex-1">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Buka dari Jam:
                      </label>
                      <select
                        value={range.start}
                        onChange={(e) => handleTimeRangeChange(idx, 'start', e.target.value)}
                        className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 cursor-pointer"
                      >
                        {TIME_OPTIONS.filter(t => t < range.end).map(t => (
                          <option key={t} value={t}>{t} WIB</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-600 mb-1">
                        Sampai Jam:
                      </label>
                      <select
                        value={range.end}
                        onChange={(e) => handleTimeRangeChange(idx, 'end', e.target.value)}
                        className="w-full px-3 py-2 text-sm font-semibold border border-gray-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-[#8B4513]/20 cursor-pointer"
                      >
                        {TIME_OPTIONS.filter(t => t > range.start).map(t => (
                          <option key={t} value={t}>{t} WIB</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {timeRanges.length > 1 && (
                    <div className="flex items-center justify-end sm:pt-4">
                      <button
                        type="button"
                        onClick={() => handleRemoveTimeRange(idx)}
                        className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus sesi jam ini"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Banner Status & Tombol Terapkan */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-amber-50/70 border border-amber-200/80 rounded-xl p-3.5">
            <p className="text-xs text-amber-950 font-medium">
              Jadwal Rutin: <strong className="text-[#8B4513]">{selectedDays.length > 0 ? activeDayLabels : 'Belum dipilih'}</strong> • Jam <strong>{timeRanges.map(r => `${r.start} - ${r.end} WIB`).join(' & ')}</strong>
            </p>

            <button
              type="button"
              disabled={isSaving}
              onClick={handleApplySchedule}
              className="px-4 py-2 rounded-xl bg-[#8B4513] hover:bg-[#6f370f] text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving && <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>}
              <span>{isSaving ? 'Menyimpan...' : 'Terapkan Jadwal Rutin'}</span>
            </button>
          </div>
        </div>

        {/* ── CARD 2: PRATINJAU KALENDER & JADWAL TAMBAHAN DI TANGGAL TERTENTU ── */}
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#8B4513] text-[22px]">calendar_month</span>
                <h3 className="font-bold text-base text-gray-900">2. Kalender & Jadwal Tambahan Khusus</h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Klik tanggal di kalender jika ingin <strong>membuka sesi konsultasi tambahan di tanggal tertentu</strong> tanpa mengubah jadwal rutin mingguan.
              </p>
            </div>

            {/* Navigasi Bulan */}
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <button
                type="button"
                onClick={handlePrevCalMonth}
                className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                title="Bulan sebelumnya"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_left</span>
              </button>
              <span className="font-bold text-xs sm:text-sm text-gray-800 px-2 min-w-[130px] text-center">
                {formatMonthYearIndo(calYear, calMonth)}
              </span>
              <button
                type="button"
                onClick={handleNextCalMonth}
                className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                title="Bulan berikutnya"
              >
                <span className="material-symbols-outlined text-[16px]">chevron_right</span>
              </button>
            </div>
          </div>

          {/* Grid Kalender Rapi */}
          <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-1">
            {DAYS.map(d => (
              <div key={d.key} className={d.key === 'minggu' ? 'text-red-500' : ''}>
                {d.shortLabel}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {calGrid.map((cell, idx) => {
              const slots = resolveSlotsForDate(schedule, cell.dateStr);
              const isOpen = slots.length > 0;
              const isSelected = cell.dateStr === selectedDate;
              const isToday = cell.dateStr === todayStr;

              // Deteksi status override khusus tanggal ini
              const isSpecific = schedule[cell.dateStr] !== undefined;
              const isCustomExtra = isSpecific && slots.length > 0;
              const isCustomHoliday = isSpecific && slots.length === 0;

              let cellStyle = 'h-10 sm:h-12 rounded-xl flex flex-col items-center justify-center transition-all cursor-pointer relative ';

              if (!cell.isCurrentMonth) {
                cellStyle += 'text-gray-300 opacity-40 ';
              } else if (isCustomExtra) {
                // Jadwal tambahan khusus warna biru/ungu
                if (isSelected) {
                  cellStyle += 'bg-[#8B4513] text-white font-bold shadow-xs ring-2 ring-blue-500 ';
                } else {
                  cellStyle += 'bg-blue-50 text-blue-950 font-bold border-2 border-blue-400 hover:bg-blue-100 ';
                }
              } else if (isCustomHoliday) {
                // Libur khusus
                cellStyle += 'bg-rose-50 text-rose-400 border border-rose-200 ';
              } else if (isOpen) {
                // Buka rutin normal
                if (isSelected) {
                  cellStyle += 'bg-[#8B4513] text-white font-bold shadow-xs ';
                } else {
                  cellStyle += 'bg-emerald-50 text-emerald-950 font-semibold border border-emerald-200/70 hover:bg-emerald-100 ';
                }
              } else {
                cellStyle += 'text-gray-400 hover:bg-gray-50 ';
              }

              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setSelectedDate(cell.dateStr);
                    setIsAddingExtra(false);
                  }}
                  className={cellStyle}
                  title={
                    isCustomExtra
                      ? `${formatDateIndo(cell.dateStr)}: Jadwal Tambahan Khusus (${slots.length} sesi)`
                      : isOpen
                      ? `${formatDateIndo(cell.dateStr)}: Buka Rutin`
                      : `${formatDateIndo(cell.dateStr)}: Libur`
                  }
                >
                  <span className={`text-xs sm:text-sm ${isToday && !isSelected ? 'underline font-black text-[#8B4513]' : ''}`}>
                    {cell.dayNumber}
                  </span>
                  {cell.isCurrentMonth && isCustomExtra && (
                    <span className="text-[10px] text-blue-600 font-black leading-none">★</span>
                  )}
                  {cell.isCurrentMonth && isOpen && !isCustomExtra && !isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Keterangan Simbol Kalender */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-emerald-100 border border-emerald-300"></span>
              <span>Jadwal Rutin</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-blue-100 border border-blue-400 text-blue-600 text-[10px] font-black flex items-center justify-center leading-none">★</span>
              <span className="font-semibold text-blue-900">Jadwal Tambahan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-md bg-gray-100"></span>
              <span>Libur</span>
            </div>
          </div>

          {/* Bar Info Tanggal Terpilih & Tombol Aksi Tambahan */}
          {selectedDate && (
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-gray-900 text-sm">{formatDateIndo(selectedDate)}</span>
                    {isDateCustomExtra && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                        ★ Jadwal Tambahan Khusus
                      </span>
                    )}
                    {isDateCustomHoliday && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        Libur Khusus
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600 text-[11px] mt-0.5">
                    {selectedDateInfo.isOpen
                      ? `Jam Operasional: ${selectedDateInfo.hoursLabel} WIB (${selectedDateSlots.length} sesi tersedia)`
                      : 'Status: Libur / Tutup'}
                  </p>
                </div>

                {/* Tombol Aksi Tanggal Ini */}
                <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
                  {isDateCustomOverride ? (
                    <button
                      type="button"
                      onClick={() => handleRemoveDateOverride(selectedDate)}
                      className="px-3 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-gray-700 font-bold text-xs cursor-pointer shadow-2xs"
                    >
                      Hapus Jadwal Khusus (Kembali ke Rutin)
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setIsAddingExtra(true);
                          if (routineInfoForSelectedDate.isOpen) {
                            setExtraMode('add');
                            setExtraStart('19:00');
                            setExtraEnd('21:00');
                          } else {
                            setExtraMode('replace');
                            setExtraStart('09:00');
                            setExtraEnd('17:00');
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-lg bg-[#8B4513] hover:bg-[#6f370f] text-white font-bold text-xs cursor-pointer shadow-xs flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[15px]">add_circle</span>
                        <span>
                          {routineInfoForSelectedDate.isOpen
                            ? '+ Tambah Jam di Luar Rutin'
                            : '+ Buka Jadwal Tambahan di Tanggal Ini'}
                        </span>
                      </button>

                      {selectedDateInfo.isOpen && (
                        <button
                          type="button"
                          onClick={() => handleSetHolidayForDate(selectedDate)}
                          className="px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs cursor-pointer"
                        >
                          Liburkan Tanggal Ini Saja
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* ── FORM JADWAL TAMBAHAN DI TANGGAL TERTENTU (DI LUAR RUTIN) ── */}
              {isAddingExtra && (
                <div className="bg-white rounded-xl p-4 border-2 border-blue-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                    <span className="font-bold text-xs text-blue-950 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-blue-600 text-[16px]">more_time</span>
                      Jadwal Tambahan di Luar Rutin — {formatDateIndo(selectedDate)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAddingExtra(false)}
                      className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Keterangan & Mode Tambahan */}
                  {routineInfoForSelectedDate.isOpen ? (
                    <div className="bg-amber-50/80 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 space-y-1.5">
                      <div className="font-bold flex items-center gap-1 text-[11px]">
                        <span className="material-symbols-outlined text-[15px] text-amber-700">info</span>
                        Jadwal Rutin Mingguan: Buka {routineInfoForSelectedDate.hoursLabel} WIB
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 pt-1 text-[11px]">
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="extraScheduleMode"
                            value="add"
                            checked={extraMode === 'add'}
                            onChange={() => setExtraMode('add')}
                            className="text-[#8B4513]"
                          />
                          <span className="font-bold text-gray-800">Tambahkan sesi baru di luar jam rutin (Rutin tetap buka)</span>
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                          <input
                            type="radio"
                            name="extraScheduleMode"
                            value="replace"
                            checked={extraMode === 'replace'}
                            onChange={() => setExtraMode('replace')}
                            className="text-[#8B4513]"
                          />
                          <span className="text-gray-600">Ganti jam khusus tanggal ini</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5 text-xs text-blue-900">
                      <div className="font-bold flex items-center gap-1 text-[11px]">
                        <span className="material-symbols-outlined text-[15px] text-blue-700">event_available</span>
                        Hari ini normalnya Libur Rutin
                      </div>
                      <p className="text-[11px] text-blue-800 mt-0.5">
                        Sesi yang Anda tambahkan di bawah ini <strong>hanya berlaku khusus di tanggal {formatDateIndo(selectedDate)}</strong> tanpa merubah jadwal libur mingguan Anda.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Mulai Jam:</label>
                      <select
                        value={extraStart}
                        onChange={(e) => setExtraStart(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg bg-white"
                      >
                        {TIME_OPTIONS.filter(t => t < extraEnd).map(t => (
                          <option key={t} value={t}>{t} WIB</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">Sampai Jam:</label>
                      <select
                        value={extraEnd}
                        onChange={(e) => setExtraEnd(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg bg-white"
                      >
                        {TIME_OPTIONS.filter(t => t > extraStart).map(t => (
                          <option key={t} value={t}>{t} WIB</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsAddingExtra(false)}
                      className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-gray-900 cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveExtraSchedule}
                      className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-[15px]">save</span>
                      <span>Simpan Jadwal Tambahan</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Daftar Jadwal Tambahan Khusus yang Sedang Aktif */}
          {customDateList.length > 0 && (
            <div className="pt-2 border-t border-gray-100">
              <h5 className="font-bold text-xs uppercase tracking-wider text-gray-700 mb-2">
                Daftar Jadwal Tambahan Khusus Anda ({customDateList.length}):
              </h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {customDateList.map(item => (
                  <div
                    key={item.dateStr}
                    className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-gray-900">{formatDateIndo(item.dateStr)}</p>
                      <p className="text-[11px] text-blue-800">
                        {item.isOpen ? `★ Buka Jam ${item.hoursLabel} WIB` : 'Libur Khusus'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDateOverride(item.dateStr)}
                      className="text-xs text-rose-600 hover:underline font-bold px-2 py-1 cursor-pointer"
                      title="Hapus jadwal tambahan ini"
                    >
                      Hapus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        </>
        )}

        {/* ── CARD 3: PENGATURAN TARIF LAYANAN ── */}
        {activeTab === 'tarif' && (
        <div className="bg-white rounded-2xl border border-gray-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
            <div>
              <h3 className="font-bold text-base text-gray-900">3. Tarif Layanan Konsultasi</h3>
              <p className="text-xs text-gray-500">
                Tentukan biaya konsultasi per sesi (Chat: 15 menit, Zoom: 30 menit).
              </p>
            </div>
            <span className={`text-xs font-bold px-3 py-1 rounded-full border ${rates.badgeColor} self-start sm:self-auto`}>
              {rates.tierLabel} • Penghasilan Anda {rates.earningPercent}%
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Layanan Chat */}
            <div className={`p-4 rounded-xl border-2 transition-all ${pricing.chat.enabled ? 'border-blue-200 bg-blue-50/40' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-blue-700 text-[20px]">chat</span>
                  <div>
                    <span className="font-bold text-sm text-gray-900 block leading-tight">Konsultasi Chat</span>
                    <span className="text-[11px] text-blue-700 font-semibold">Durasi: 15 Menit</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pricing.chat.enabled}
                    onChange={(e) => setPricing(prev => ({ ...prev, chat: { ...prev.chat, enabled: e.target.checked } }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8B4513]"></div>
                </label>
              </div>

              {pricing.chat.enabled && (
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-gray-600">Tarif per Sesi Chat (15 Menit):</label>
                  <input
                    type="number"
                    value={pricing.chat.price === 0 ? '' : pricing.chat.price}
                    onChange={(e) => setPricing(prev => ({ ...prev, chat: { ...prev.chat, price: parseInt(e.target.value) || 0 } }))}
                    min="0"
                    step="10000"
                    placeholder="150000"
                    className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-lg bg-white"
                  />
                  {pricing.chat.price > 0 && (
                    <p className="text-[11px] text-gray-500">
                      Anda menerima: <strong className="text-emerald-700">{formatCurrency(pricing.chat.price * (rates.earningPercent / 100))}</strong> (biaya platform {rates.commissionPercent}%)
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Layanan Zoom */}
            <div className={`p-4 rounded-xl border-2 transition-all ${pricing.zoom.enabled ? 'border-purple-200 bg-purple-50/40' : 'border-gray-200 bg-gray-50 opacity-60'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-purple-700 text-[20px]">videocam</span>
                  <div>
                    <span className="font-bold text-sm text-gray-900 block leading-tight">Konsultasi Zoom</span>
                    <span className="text-[11px] text-purple-700 font-semibold">Durasi: 30 Menit</span>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pricing.zoom.enabled}
                    onChange={(e) => setPricing(prev => ({ ...prev, zoom: { ...prev.zoom, enabled: e.target.checked } }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#8B4513]"></div>
                </label>
              </div>

              {pricing.zoom.enabled && (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Tarif per Sesi Zoom (30 Menit):</label>
                    <input
                      type="number"
                      value={pricing.zoom.price === 0 ? '' : pricing.zoom.price}
                      onChange={(e) => setPricing(prev => ({ ...prev, zoom: { ...prev.zoom, price: parseInt(e.target.value) || 0 } }))}
                      min="0"
                      step="10000"
                      placeholder="250000"
                      className="w-full px-3 py-2 text-sm font-bold border border-gray-300 rounded-lg bg-white"
                    />
                    {pricing.zoom.price > 0 && (
                      <p className="text-[11px] text-gray-500 mt-1">
                        Anda menerima: <strong className="text-emerald-700">{formatCurrency(pricing.zoom.price * (rates.earningPercent / 100))}</strong> (biaya platform {rates.commissionPercent}%)
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">Link Zoom Meeting:</label>
                    <input
                      type="url"
                      value={pricing.zoom.zoomLink || ''}
                      onChange={(e) => setPricing(prev => ({ ...prev, zoom: { ...prev.zoom, zoomLink: e.target.value } }))}
                      placeholder="https://zoom.us/j/..."
                      className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Tombol Simpan Tarif Langsung */}
          <div className="pt-3 border-t border-gray-100 flex items-center justify-end">
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSavePricing}
              className="px-5 py-2.5 rounded-xl bg-[#8B4513] hover:bg-[#6f370f] text-white font-bold text-xs shadow-xs transition-all cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              {isSaving && <span className="material-symbols-outlined text-[15px] animate-spin">progress_activity</span>}
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Pengaturan Tarif'}</span>
            </button>
          </div>
        </div>
        )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
}