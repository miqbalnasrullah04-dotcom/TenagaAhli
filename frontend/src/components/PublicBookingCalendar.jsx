import { useState, useMemo } from 'react';
import {
  DAYS,
  toLocalDateStr,
  getDayKey,
  formatDateIndo,
  formatMonthYearIndo,
  getMonthCalendarGrid,
  inferHoursFromSlots,
  resolveSlotsForDate,
} from '../utils/scheduleCalendar.js';

const BRAND_BROWN = '#8B4513';

/**
 * Komponen Kalender Booking Publik:
 * Tampilan minimalis, bersih, ramah pengguna (user-friendly), terinspirasi dari Apple Calendar & Airbnb.
 */
export function PublicBookingCalendar({
  expertSchedule = {},
  bookedSlots = [],
  selectedDate = '',
  selectedTime = '',
  selectedTimes = [],
  onSelectDateTime,
  minDate = '',
}) {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toLocalDateStr(today), [today]);

  const effectiveMinDate = useMemo(() => {
    if (minDate) return minDate;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return toLocalDateStr(d);
  }, [minDate]);

  const initialDate = useMemo(() => {
    if (selectedDate) return new Date(selectedDate + 'T00:00:00');
    return new Date(effectiveMinDate + 'T00:00:00');
  }, [selectedDate, effectiveMinDate]);

  const [currentYear, setCurrentYear] = useState(() => initialDate.getFullYear() || today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(() => initialDate.getMonth() ?? today.getMonth());

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(prev => prev - 1);
    } else {
      setCurrentMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(prev => prev + 1);
    } else {
      setCurrentMonth(prev => prev + 1);
    }
  };

  const calendarGrid = useMemo(() => {
    return getMonthCalendarGrid(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  // Ekstrak list jam yang sedang dipilih (mendukung multi-jam / multi-slot)
  const selectedTimesList = useMemo(() => {
    if (Array.isArray(selectedTimes) && selectedTimes.length > 0) {
      return selectedTimes.map(t => t.replace(/WIB/gi, '').trim()).filter(Boolean);
    }
    if (!selectedTime) return [];
    return selectedTime
      .replace(/WIB/gi, '')
      .split(/[,;\n]+/)
      .map(t => t.trim())
      .filter(Boolean);
  }, [selectedTimes, selectedTime]);

  const getAvailableSlotsForDate = (dateStr) => {
    if (!dateStr) return [];
    const rawSlots = resolveSlotsForDate(expertSchedule, dateStr);

    return rawSlots.filter(slotTime => {
      const cleanSlot = slotTime.trim();
      return !bookedSlots.some(b => {
        if (b.date !== dateStr) return false;
        const bookedTime = (b.time || '').trim();
        return bookedTime === cleanSlot || bookedTime.includes(cleanSlot) || cleanSlot.includes(bookedTime);
      });
    });
  };

  const handleDateClick = (dateStr) => {
    const available = getAvailableSlotsForDate(dateStr);
    if (available.length === 0) return;

    // Pilih slot pertama yang tersedia secara default saat ganti tanggal
    const firstSlot = available[0];
    const formatted = `${firstSlot} WIB`;
    onSelectDateTime(dateStr, formatted, [firstSlot]);
  };

  // Toggle pemilihan slot jam (bisa klik beberapa jam sekaligus: 1 jam, 2 jam, dst)
  const handleSlotClick = (timeStr) => {
    const cleanTime = timeStr.trim();
    let updated;
    if (selectedTimesList.includes(cleanTime)) {
      // Batalkan pilihan slot ini
      updated = selectedTimesList.filter(t => t !== cleanTime);
    } else {
      // Tambahkan slot ini ke daftar pilihan dan urutkan waktu
      updated = [...selectedTimesList, cleanTime].sort();
    }
    const formatted = updated.length > 0 ? `${updated.join(', ')} WIB` : '';
    onSelectDateTime(selectedDate, formatted, updated);
  };

  // Semua slot yang dikonfigurasi untuk tanggal yang dipilih
  const allDateSlots = useMemo(() => {
    if (!selectedDate) return [];
    return resolveSlotsForDate(expertSchedule, selectedDate);
  }, [selectedDate, expertSchedule]);

  const currentAvailableSlots = useMemo(() => {
    return getAvailableSlotsForDate(selectedDate);
  }, [selectedDate, expertSchedule, bookedSlots]);

  const selectedDateHoursInfo = useMemo(() => {
    if (!selectedDate) return null;
    return inferHoursFromSlots(allDateSlots);
  }, [selectedDate, allDateSlots]);

  return (
    <div className="space-y-4">
      {/* ── Box Kalender Minimalis ── */}
      <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-2xs">
        {/* Header Navigasi Bulan */}
        <div className="flex items-center justify-between mb-3 px-1">
          <h4 className="font-bold text-sm sm:text-base text-gray-900">
            {formatMonthYearIndo(currentYear, currentMonth)}
          </h4>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              title="Bulan sebelumnya"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_left</span>
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
              title="Bulan berikutnya"
            >
              <span className="material-symbols-outlined text-[16px]">chevron_right</span>
            </button>
          </div>
        </div>

        {/* Header Nama Hari */}
        <div className="grid grid-cols-7 text-center text-xs font-semibold text-gray-400 mb-1">
          {DAYS.map(d => (
            <div key={d.key} className={d.key === 'minggu' ? 'text-red-500' : ''}>
              {d.shortLabel}
            </div>
          ))}
        </div>

        {/* Grid Tanggal Bersih */}
        <div className="grid grid-cols-7 gap-1">
          {calendarGrid.map((cell, idx) => {
            const isPast = cell.dateStr < effectiveMinDate;
            const availableSlots = getAvailableSlotsForDate(cell.dateStr);
            const isOpen = availableSlots.length > 0;
            const isSelected = cell.dateStr === selectedDate;

            let dayStyle = 'h-10 sm:h-11 rounded-xl flex flex-col items-center justify-center transition-all relative ';

            if (!cell.isCurrentMonth) {
              dayStyle += 'text-gray-300 opacity-30 cursor-not-allowed';
            } else if (isPast) {
              dayStyle += 'text-gray-300 cursor-not-allowed';
            } else if (isOpen) {
              if (isSelected) {
                dayStyle += 'bg-[#8B4513] text-white font-bold shadow-xs cursor-pointer ring-2 ring-[#8B4513]/30';
              } else {
                dayStyle += 'bg-emerald-50/80 text-emerald-950 font-semibold hover:bg-emerald-100 cursor-pointer border border-emerald-200/60';
              }
            } else {
              dayStyle += 'text-gray-400 opacity-60 cursor-not-allowed bg-gray-50';
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={!cell.isCurrentMonth || isPast || !isOpen}
                onClick={() => handleDateClick(cell.dateStr)}
                className={dayStyle}
                title={
                  !cell.isCurrentMonth || isPast
                    ? ''
                    : isOpen
                    ? `${formatDateIndo(cell.dateStr)}: Buka (${availableSlots.length} sesi tersedia)`
                    : `${formatDateIndo(cell.dateStr)}: Libur / Penuh`
                }
              >
                <span className="text-xs sm:text-sm">{cell.dayNumber}</span>
                {cell.isCurrentMonth && !isPast && isOpen && !isSelected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-0.5"></span>
                )}
              </button>
            );
          })}
        </div>

        {/* Keterangan Simpel Tanggal */}
        <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 pt-3 mt-2 border-t border-gray-100">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-emerald-100 border border-emerald-300"></span>
            <span>Tersedia</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-[#8B4513]"></span>
            <span>Tanggal Dipilih</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-md bg-gray-100 border border-gray-200"></span>
            <span>Libur / Penuh</span>
          </div>
        </div>
      </div>

      {/* ── Box Pilihan Jam Konsultasi (Multi-Slot & Indikator Warna Hijau/Abu-abu) ── */}
      {selectedDate ? (
        <div className="bg-gray-50/90 border border-gray-200 rounded-2xl p-4 space-y-3.5">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h5 className="font-bold text-xs text-gray-900 flex items-center gap-1.5 flex-wrap">
                <span className="material-symbols-outlined text-[16px] text-[#8B4513]">schedule</span>
                <span>{formatDateIndo(selectedDate)}</span>
                {expertSchedule[selectedDate] !== undefined && (expertSchedule[selectedDate] || []).length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                    Jadwal Tambahan
                  </span>
                )}
              </h5>
              <p className="text-[11px] text-gray-500">
                Jam operasional: {selectedDateHoursInfo?.hoursLabel || '08:00 - 17:00'} WIB &bull;{' '}
                <span className="text-emerald-700 font-semibold">{currentAvailableSlots.length} sesi tersedia</span>
              </p>
            </div>

            {selectedTimesList.length > 0 && (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-600 text-white flex items-center gap-1 shadow-2xs">
                <span className="material-symbols-outlined text-[14px]">check</span>
                <span>{selectedTimesList.length} Sesi Dipilih</span>
              </span>
            )}
          </div>

          {/* Panduan Pemilihan Multi-Jam */}
          <div className="text-[11px] text-gray-600 bg-white/80 p-2.5 rounded-xl border border-gray-200 flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-emerald-600 shrink-0">info</span>
            <span>
              Anda dapat memilih <strong>lebih dari satu jam sekaligus</strong> (misal 2 jam atau lebih). Klik jam hijau untuk menambah/mengurangi.
            </span>
          </div>

          {allDateSlots.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-1">
              {allDateSlots.map(time => {
                const cleanSlot = time.trim();
                const isBooked = bookedSlots.some(b => {
                  if (b.date !== selectedDate) return false;
                  const bookedTime = (b.time || '').trim();
                  return bookedTime === cleanSlot || bookedTime.includes(cleanSlot) || cleanSlot.includes(bookedTime);
                });
                const isSelected = selectedTimesList.includes(cleanSlot);

                if (isBooked) {
                  // SLOT SUDAH DIBOOKING: Warna Abu-abu, disabled, tidak dapat dipilih
                  return (
                    <button
                      key={time}
                      type="button"
                      disabled
                      className="py-2.5 px-2 rounded-xl text-xs font-semibold bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed select-none text-center flex flex-col items-center justify-center gap-0.5"
                      title={`${time} WIB - Sudah dibooking oleh klien lain (tidak tersedia)`}
                    >
                      <span className="line-through">{time} WIB</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                        Sudah Ada Booking
                      </span>
                    </button>
                  );
                }

                // SLOT BELUM ADA YANG BOOKING: Warna Hijau, dapat dipilih
                if (isSelected) {
                  // Slot dipilih (Hijau Pekat Aktif)
                  return (
                    <button
                      key={time}
                      type="button"
                      onClick={() => handleSlotClick(time)}
                      className="py-2.5 px-2 rounded-xl text-xs font-bold bg-emerald-600 text-white border-2 border-emerald-700 shadow-sm ring-2 ring-emerald-500/40 text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all hover:bg-emerald-700"
                      title={`Klik untuk membatalkan pilihan ${time} WIB`}
                    >
                      <span className="flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        <span>{time} WIB</span>
                      </span>
                      <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-tight">
                        Dipilih &bull; Klik Hapus
                      </span>
                    </button>
                  );
                }

                // Slot tersedia belum dipilih (Hijau Muda Segar)
                return (
                  <button
                    key={time}
                    type="button"
                    onClick={() => handleSlotClick(time)}
                    className="py-2.5 px-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-800 border-2 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500 text-center flex flex-col items-center justify-center gap-0.5 cursor-pointer transition-all shadow-2xs"
                    title={`Klik untuk memilih sesi ${time} WIB`}
                  >
                    <span>{time} WIB</span>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-tight">
                      Tersedia
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              Tidak ada sesi jam yang dibuka pada tanggal ini. Silakan pilih tanggal lain yang bertanda hijau di atas.
            </p>
          )}

          {/* Ringkasan Sesi yang Dipilih */}
          {selectedTimesList.length > 0 && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-emerald-700">timer</span>
                <span>
                  <strong>{selectedTimesList.length} Sesi Dipilih:</strong> {selectedTimesList.join(', ')} WIB
                </span>
              </div>
              <span className="text-[10px] font-bold text-emerald-800 bg-white px-2 py-0.5 rounded-full border border-emerald-200">
                Total {selectedTimesList.length} Jam/Sesi
              </span>
            </div>
          )}

          {/* Legenda Warna Slot Jam */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-gray-500 pt-2 border-t border-gray-200">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-50 border-2 border-emerald-300"></span>
              <span>Tersedia (Hijau)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-emerald-600"></span>
              <span>Dipilih</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md bg-gray-100 border border-gray-200"></span>
              <span>Sudah Dipesan (Abu-abu)</span>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center py-2">
          Pilih salah satu tanggal hijau di atas untuk memilih jam konsultasi.
        </p>
      )}
    </div>
  );
}

/**
 * Widget Ringkasan Jam Kerja Ahli untuk Sidebar Profil Publik
 */
export function PublicWeeklyHoursCard({ expertSchedule = {}, onBookClick }) {
  const weeklySummary = useMemo(() => {
    return DAYS.map(d => {
      const slots = expertSchedule[d.key] || [];
      const info = inferHoursFromSlots(slots);
      return {
        ...d,
        isOpen: info.isOpen,
        hoursLabel: info.hoursLabel,
      };
    });
  }, [expertSchedule]);

  const openDaysCount = weeklySummary.filter(d => d.isOpen).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-[#8B4513]">calendar_today</span>
          <h4 className="font-bold text-xs uppercase tracking-wider text-gray-800">
            Jadwal Operasional Ahli
          </h4>
        </div>
        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
          Buka {openDaysCount} hari/minggu
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        {weeklySummary.map(d => (
          <div key={d.key} className="flex items-center justify-between py-0.5 text-gray-600">
            <span className="font-medium">{d.label}</span>
            <span className={d.isOpen ? 'font-bold text-emerald-800' : 'text-gray-400'}>
              {d.isOpen ? d.hoursLabel : 'Libur'}
            </span>
          </div>
        ))}
      </div>

      {onBookClick && (
        <button
          type="button"
          onClick={onBookClick}
          className="w-full mt-2 py-2 px-3 rounded-xl bg-[#8B4513] hover:bg-[#6f370f] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
        >
          <span className="material-symbols-outlined text-[16px]">calendar_add_on</span>
          <span>Lihat Jadwal di Kalender</span>
        </button>
      )}
    </div>
  );
}

export default PublicBookingCalendar;
