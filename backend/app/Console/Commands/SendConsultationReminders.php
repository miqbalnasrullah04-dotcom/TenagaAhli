<?php

namespace App\Console\Commands;

use App\Mail\ConsultationReminderOneHour;
use App\Mail\ConsultationReminderTenMinutes;
use App\Mail\ConsultationReminderToday;
use App\Models\Consultation;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class SendConsultationReminders extends Command
{
    protected $signature = 'consultations:send-reminders';
    protected $description = 'Kirim email pengingat jadwal konsultasi: hari ini, 1 jam, dan 10 menit sebelum sesi dimulai';

    public function handle()
    {
        $this->info('🔔 Memeriksa jadwal konsultasi untuk pengingat email...');

        $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
        $actionUrl = $frontendUrl . '/konsultasi';

        $todayStr = Carbon::today('Asia/Jakarta')->format('Y-m-d');
        $now = Carbon::now('Asia/Jakarta');

        // =========================================================================
        // 1. PENGINGAT HARI INI (Reminder Today)
        // =========================================================================
        $todayConsultations = Consultation::with(['expert.user', 'user'])
            ->whereIn('status', ['confirmed', 'dikonfirmasi', 'paid'])
            ->whereDate('consultation_date', $todayStr)
            ->whereNull('reminder_today_sent_at')
            ->get();

        $todaySentCount = 0;
        foreach ($todayConsultations as $consultation) {
            $expert = $consultation->expert;
            if (!$expert) continue;

            $clientEmail = $consultation->client_email ?: $consultation->user?->email;
            $expertEmail = $expert->user?->email ?: $expert->email;

            // Kirim ke Klien
            if ($clientEmail) {
                try {
                    Mail::to($clientEmail)->send(new ConsultationReminderToday($consultation, $expert, 'client', $actionUrl));
                } catch (\Throwable $e) {
                    Log::warning("Gagal kirim ConsultationReminderToday ke client ({$clientEmail}): " . $e->getMessage());
                }
            }

            // Kirim ke Tenaga Ahli / Konsultan
            if ($expertEmail) {
                try {
                    Mail::to($expertEmail)->send(new ConsultationReminderToday($consultation, $expert, 'expert', $actionUrl));
                } catch (\Throwable $e) {
                    Log::warning("Gagal kirim ConsultationReminderToday ke expert ({$expertEmail}): " . $e->getMessage());
                }
            }

            $consultation->update(['reminder_today_sent_at' => now()]);
            $todaySentCount++;
        }

        $this->info("✅ Pengingat Hari Ini terkirim: {$todaySentCount} jadwal");

        // =========================================================================
        // 2. PERINGATAN 1 JAM LAGI (Reminder 1 Hour)
        // =========================================================================
        $oneHourConsultations = Consultation::with(['expert.user', 'user'])
            ->whereIn('status', ['confirmed', 'dikonfirmasi', 'paid'])
            ->whereDate('consultation_date', $todayStr)
            ->whereNull('reminder_1h_sent_at')
            ->get();

        $oneHourSentCount = 0;
        foreach ($oneHourConsultations as $consultation) {
            $expert = $consultation->expert;
            if (!$expert) continue;

            $timeStr = trim($consultation->consultation_time ?? '');
            if (!$timeStr) continue;

            // Ekstrak jam awal (misal '09:00' dari '09:00 - 10:00' atau '14:00 WIB')
            preg_match('/(\d{1,2}:\d{2})/', $timeStr, $matches);
            if (empty($matches[1])) continue;

            $startTime = $matches[1];
            try {
                $sessionDateTime = Carbon::createFromFormat('Y-m-d H:i', "{$todayStr} {$startTime}", 'Asia/Jakarta');
            } catch (\Throwable $e) {
                continue;
            }

            $diffInMinutes = $now->diffInMinutes($sessionDateTime, false);

            // Kirim jika waktu sesi berada antara 16 menit hingga 75 menit ke depan
            if ($diffInMinutes >= 16 && $diffInMinutes <= 75) {
                $clientEmail = $consultation->client_email ?: $consultation->user?->email;
                $expertEmail = $expert->user?->email ?: $expert->email;

                if ($clientEmail) {
                    try {
                        Mail::to($clientEmail)->send(new ConsultationReminderOneHour($consultation, $expert, 'client', $actionUrl));
                    } catch (\Throwable $e) {
                        Log::warning("Gagal kirim ConsultationReminderOneHour ke client ({$clientEmail}): " . $e->getMessage());
                    }
                }

                if ($expertEmail) {
                    try {
                        Mail::to($expertEmail)->send(new ConsultationReminderOneHour($consultation, $expert, 'expert', $actionUrl));
                    } catch (\Throwable $e) {
                        Log::warning("Gagal kirim ConsultationReminderOneHour ke expert ({$expertEmail}): " . $e->getMessage());
                    }
                }

                $consultation->update(['reminder_1h_sent_at' => now()]);
                $oneHourSentCount++;
            }
        }

        $this->info("⚡ Peringatan 1 Jam Lagi terkirim: {$oneHourSentCount} jadwal");

        // =========================================================================
        // 3. PERINGATAN 10 MENIT SEBELUM JADWAL DIMULAI (Reminder 10 Minutes)
        // =========================================================================
        $tenMinuteConsultations = Consultation::with(['expert.user', 'user'])
            ->whereIn('status', ['confirmed', 'dikonfirmasi', 'paid'])
            ->whereDate('consultation_date', $todayStr)
            ->whereNull('reminder_10m_sent_at')
            ->get();

        $tenMinSentCount = 0;
        foreach ($tenMinuteConsultations as $consultation) {
            $expert = $consultation->expert;
            if (!$expert) continue;

            $timeStr = trim($consultation->consultation_time ?? '');
            if (!$timeStr) continue;

            // Ekstrak jam awal (misal '09:00' dari '09:00 WIB' atau '14:00, 14:30')
            preg_match('/(\d{1,2}:\d{2})/', $timeStr, $matches);
            if (empty($matches[1])) continue;

            $startTime = $matches[1];
            try {
                $sessionDateTime = Carbon::createFromFormat('Y-m-d H:i', "{$todayStr} {$startTime}", 'Asia/Jakarta');
            } catch (\Throwable $e) {
                continue;
            }

            $diffInMinutes = $now->diffInMinutes($sessionDateTime, false);

            // Kirim jika waktu sesi berada antara 0 hingga 15 menit ke depan (mencakup jendela 10 menit)
            if ($diffInMinutes >= 0 && $diffInMinutes <= 15) {
                $clientEmail = $consultation->client_email ?: $consultation->user?->email;
                $expertEmail = $expert->user?->email ?: $expert->email;

                if ($clientEmail) {
                    try {
                        Mail::to($clientEmail)->send(new ConsultationReminderTenMinutes($consultation, $expert, 'client', $actionUrl));
                    } catch (\Throwable $e) {
                        Log::warning("Gagal kirim ConsultationReminderTenMinutes ke client ({$clientEmail}): " . $e->getMessage());
                    }
                }

                if ($expertEmail) {
                    try {
                        Mail::to($expertEmail)->send(new ConsultationReminderTenMinutes($consultation, $expert, 'expert', $actionUrl));
                    } catch (\Throwable $e) {
                        Log::warning("Gagal kirim ConsultationReminderTenMinutes ke expert ({$expertEmail}): " . $e->getMessage());
                    }
                }

                $consultation->update(['reminder_10m_sent_at' => now()]);
                $tenMinSentCount++;
            }
        }

        $this->info("⏰ Peringatan 10 Menit Lagi terkirim: {$tenMinSentCount} jadwal");

        return 0;
    }
}
