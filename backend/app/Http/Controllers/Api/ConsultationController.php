<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ConsultationBookedClient;
use App\Mail\ConsultationBookedExpert;
use App\Mail\ConsultationStatusUpdated;
use App\Mail\ConsultationZoomReady;
use App\Models\Consultation;
use App\Models\ConsultationMessage;
use App\Models\Expert;
use App\Services\TopUpService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class ConsultationController extends Controller
{
    /**
     * POST /api/experts/{slug}/consultations
     *
     * Semua role bisa konsultasi:
     *   - klien         → bisa bayar dengan Point (jika login & punya saldo)
     *   - tenaga_ahli   → konsultasi ke ahli/surveyor lain, bayar Point
     *   - surveyor      → konsultasi ke ahli/surveyor lain, bayar Point
     *
     * Jika consultation_points > 0, saldo Point user dipotong.
     * Jika user tidak login atau tidak set point, tetap bisa daftar tanpa deduct.
     * Tenaga ahli TIDAK bisa konsultasi ke dirinya sendiri.
     */
    public function store(Request $request, string $slug)
    {
        $expert = Expert::where('slug', $slug)
            ->where('profile_status', 'aktif')
            ->firstOrFail();

        $user = $request->user(); // null jika guest/klien tidak login

        // Cegah konsultasi ke diri sendiri
        if ($user && $expert->user_id === $user->id) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Anda tidak dapat melakukan konsultasi ke profil Anda sendiri.',
            ], 422);
        }

        $validator = Validator::make($request->all(), [
            'client_name'         => ['required', 'string', 'max:150'],
            'client_email'        => ['required', 'email', 'max:150'],
            'client_phone'        => ['nullable', 'string', 'max:30'],
            'service_type'        => ['required', 'string', 'max:100'],
            'consultation_date'   => ['nullable', 'date'],
            'consultation_time'   => ['nullable', 'string', 'max:50'],
            'topic'               => ['required', 'string', 'max:255'],
            'notes'               => ['nullable', 'string', 'max:1500'],
            'consultation_points' => ['nullable', 'integer', 'min:1'], // Point yang akan dipotong
            'payment_method'      => ['nullable', 'string', 'in:midtrans,manual,points'],
            'bank_name'           => ['nullable', 'string', 'max:50'],
            'payment_proof'       => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'proof'               => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ], [
            'client_name.required'  => 'Nama lengkap wajib diisi.',
            'client_email.required' => 'Email aktif wajib diisi.',
            'client_email.email'    => 'Format email tidak valid.',
            'service_type.required' => 'Jenis layanan konsultasi wajib dipilih.',
            'topic.required'        => 'Topik / kebutuhan konsultasi wajib diisi.',
            'payment_proof.mimes'   => 'Format file bukti transfer harus JPG, PNG, WEBP, atau PDF.',
            'proof.mimes'           => 'Format file bukti transfer harus JPG, PNG, WEBP, atau PDF.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        // 1. Validasi Tanggal: Booking harus minimal H-1 (mulai dari besok)
        $consultDateStr = $request->consultation_date ?: Carbon::now('Asia/Jakarta')->addDay()->toDateString();
        try {
            $parsedDate = Carbon::parse($consultDateStr, 'Asia/Jakarta')->startOfDay();
            $tomorrow = Carbon::now('Asia/Jakarta')->addDay()->startOfDay();
            if ($parsedDate->lt($tomorrow)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => 'Pemesanan konsultasi minimal dilakukan 1 hari sebelum jadwal (H-1) / minimal untuk besok.',
                ], 422);
            }
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Format tanggal konsultasi tidak valid.',
            ], 422);
        }

        // 2. Validasi Jadwal Ahli: Pastikan ahli memiliki slot pada tanggal yang dipilih
        $dayMap = [0 => 'minggu', 1 => 'senin', 2 => 'selasa', 3 => 'rabu', 4 => 'kamis', 5 => 'jumat', 6 => 'sabtu'];
        $dayKey = $dayMap[$parsedDate->dayOfWeek];
        $dateFormatted = $parsedDate->toDateString();
        
        $defaultSchedule = [
            'senin'  => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'selasa' => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'rabu'   => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'kamis'  => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'jumat'  => ['09:00', '09:30', '10:00', '10:30', '14:00', '14:30', '15:00', '15:30'],
            'sabtu'  => [],
            'minggu' => [],
        ];
        $expertSchedule = $expert->schedule ?: $defaultSchedule;
        
        // Ambil semua requested times (bisa multi slot / jam sekaligus)
        $rawRequestedTimes = [];
        if ($request->filled('consultation_times') && is_array($request->consultation_times)) {
            $rawRequestedTimes = $request->consultation_times;
        } elseif ($request->filled('consultation_time')) {
            $rawRequestedTimes = preg_split('/[,;\n]+/', (string)$request->consultation_time);
        }

        $cleanRequestedTimes = [];
        foreach ($rawRequestedTimes as $rt) {
            $clean = trim(str_replace(['WIB', 'wib', '(30 menit)', '(15 menit)', '(30 mnt)', '(15 mnt)'], '', $rt));
            if (str_contains($clean, '-')) {
                $clean = trim(explode('-', $clean)[0]);
            }
            if ($clean !== '') {
                $cleanRequestedTimes[] = $clean;
            }
        }
        $cleanRequestedTimes = array_values(array_unique($cleanRequestedTimes));
        sort($cleanRequestedTimes);

        if (empty($cleanRequestedTimes)) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Silakan pilih minimal satu jam konsultasi yang tersedia.',
            ], 422);
        }

        if ($expertSchedule && is_array($expertSchedule)) {
            // Cek slot spesifik tanggal dulu, jika tidak ada cek template hari
            $availableSlots = $expertSchedule[$dateFormatted] ?? $expertSchedule[$dayKey] ?? [];

            if (!is_array($availableSlots) || empty($availableSlots)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Tenaga ahli/surveyor tidak membuka jadwal konsultasi pada tanggal {$dateFormatted} ({$dayKey}). Silakan pilih tanggal lain yang tersedia.",
                ], 422);
            }

            foreach ($cleanRequestedTimes as $reqTime) {
                $matched = false;
                foreach ($availableSlots as $slot) {
                    $cleanSlot = trim(str_replace(['WIB', 'wib', '(30 menit)', '(15 menit)', '(30 mnt)', '(15 mnt)'], '', $slot));
                    if (str_contains($cleanSlot, '-')) {
                        $cleanSlot = trim(explode('-', $cleanSlot)[0]);
                    }
                    if ($cleanSlot === $reqTime || str_contains($cleanSlot, $reqTime) || str_contains($reqTime, $cleanSlot)) {
                        $matched = true;
                        break;
                    }
                }
                if (!$matched) {
                    return response()->json([
                        'status'  => 'error',
                        'message' => "Jam konsultasi {$reqTime} WIB tidak tersedia pada jadwal tenaga ahli.",
                    ], 422);
                }
            }
        }

        // 3. Cegah Double Booking: Pastikan setiap slot waktu yang diminta belum dipesan oleh klien lain
        foreach ($cleanRequestedTimes as $reqTime) {
            $conflict = Consultation::where('expert_id', $expert->id)
                ->whereDate('consultation_date', $dateFormatted)
                ->where(function ($q) use ($reqTime) {
                    $q->where('consultation_time', $reqTime)
                      ->orWhere('consultation_time', 'like', "%{$reqTime}%");
                })
                ->whereNotIn('status', ['dibatalkan', 'ditolak'])
                ->exists();

            if ($conflict) {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Slot waktu {$reqTime} WIB pada tanggal {$dateFormatted} sudah dipesan. Silakan pilih jam atau tanggal lain.",
                ], 422);
            }
        }

        // Validasi & deduct Point jika diminta
        $consultationPoints = (int) $request->consultation_points;

        if ($consultationPoints > 0 && $user) {
            // Cek saldo
            if (!$user->hasEnoughPoints($consultationPoints)) {
                return response()->json([
                    'status'  => 'error',
                    'message' => "Point tidak mencukupi. Saldo Anda: {$user->point_balance} Point, dibutuhkan: {$consultationPoints} Point. Silakan Top Up Point terlebih dahulu.",
                    'data'    => [
                        'point_balance' => $user->point_balance,
                        'required'      => $consultationPoints,
                    ],
                ], 422);
            }
        }

        try {
            $pricing = is_array($expert->pricing) ? $expert->pricing : json_decode($expert->pricing ?? '[]', true);
            $sessionCount = max(1, count($cleanRequestedTimes));
            $ratePerSession = ($request->service_type === 'zoom') ? (int)($pricing['zoom'] ?? 100000) : (int)($pricing['chat'] ?? 50000);
            $totalAmount = $ratePerSession * $sessionCount;
            $refCode = 'KNS-' . date('ymd') . '-' . strtoupper(Str::random(4));

            $paymentMethod = $request->input('payment_method', ($consultationPoints > 0 ? 'points' : 'manual'));
            $paymentStatus = 'pending';
            $proofPath = null;

            if ($paymentMethod === 'points') {
                $paymentStatus = 'paid';
            } elseif ($request->hasFile('payment_proof') || $request->hasFile('proof')) {
                $file = $request->file('payment_proof') ?: $request->file('proof');
                $proofPath = $file->store('consultations/payments', 'public');
                $paymentStatus = 'menunggu_verifikasi';
            } elseif ($paymentMethod === 'manual') {
                $paymentStatus = 'menunggu_verifikasi';
            }

            $result = DB::transaction(function () use ($request, $expert, $user, $consultationPoints, $cleanRequestedTimes, $dateFormatted, $totalAmount, $refCode, $paymentMethod, $paymentStatus, $proofPath) {
                // Tentukan role pemohon untuk keperluan pencatatan
                $requesterRoleType = $user?->role_type ?? 'klien';

                $baseDuration = ($request->service_type === 'chat' ? 15 : 30);
                $sessionCount = max(1, count($cleanRequestedTimes));
                $totalDurationMinutes = $baseDuration * $sessionCount;
                $formattedTimeStr = implode(', ', array_map(fn($t) => "{$t} WIB", $cleanRequestedTimes));

                $consultation = Consultation::create([
                    'expert_id'         => $expert->id,
                    'user_id'           => $user?->id,
                    'reference_code'    => $refCode,
                    'client_name'       => $request->client_name,
                    'client_email'      => $request->client_email,
                    'client_phone'      => $request->client_phone,
                    'service_type'      => $request->service_type,
                    'amount'            => $totalAmount,
                    'payment_method'    => $paymentMethod,
                    'payment_status'    => $paymentStatus,
                    'payment_proof'     => $proofPath,
                    'bank_name'         => $request->input('bank_name'),
                    'paid_at'           => $paymentStatus === 'paid' ? now() : null,
                    'duration_minutes'  => $totalDurationMinutes,
                    'consultation_date' => $dateFormatted,
                    'consultation_time' => $formattedTimeStr,
                    'topic'             => $request->topic,
                    'notes'             => $request->notes,
                    'status'            => 'menunggu_konfirmasi',
                    'requester_role'    => $requesterRoleType,
                ]);

                // Deduct Point jika ada
                $pointTransaction = null;
                if ($consultationPoints > 0 && $user) {
                    $topUpService     = app(TopUpService::class);
                    $pointTransaction = $topUpService->payForConsultation(
                        $user,
                        $consultationPoints,
                        $expert->name,
                        $consultation->id
                    );
                }

                // Buat pesan pengantar otomatis di ruang Chat Konsultasi
                if ($user) {
                    try {
                        ConsultationMessage::create([
                            'consultation_id' => $consultation->id,
                            'sender_id'       => $user->id,
                            'sender_type'     => 'client',
                            'message'         => "Halo {$expert->name}, saya telah memesan sesi konsultasi (" . ucfirst($request->service_type ?: 'online') . ") untuk topik:\n\"{$request->topic}\"\nJadwal: {$dateFormatted} ({$formattedTimeStr}).",
                            'is_read'         => false,
                        ]);
                    } catch (\Throwable $e) {
                        \Log::warning('Gagal membuat pesan awal konsultasi: ' . $e->getMessage());
                    }
                }

                return ['consultation' => $consultation, 'pointTransaction' => $pointTransaction];
            });

            // If payment_method is Midtrans, generate Snap Token
            $snapToken = null;
            if ($paymentMethod === 'midtrans' && $totalAmount > 0) {
                try {
                    \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
                    \Midtrans\Config::$isProduction = config('services.midtrans.is_production', false);
                    \Midtrans\Config::$isSanitized = config('services.midtrans.is_sanitized', true);
                    \Midtrans\Config::$is3ds = config('services.midtrans.is_3ds', true);

                    $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
                    $params = [
                        'transaction_details' => [
                            'order_id' => $refCode,
                            'gross_amount' => $totalAmount,
                        ],
                        'customer_details' => [
                            'first_name' => $request->client_name,
                            'email' => $request->client_email,
                            'phone' => $request->client_phone ?? '',
                        ],
                        'item_details' => [
                            [
                                'id' => 'KNS-' . substr($request->service_type, 0, 10),
                                'price' => $ratePerSession,
                                'quantity' => $sessionCount,
                                'name' => 'Konsultasi ' . ucfirst($request->service_type) . ' (' . ($expert->name) . ')',
                            ]
                        ],
                        'callbacks' => [
                            'finish' => "{$frontendUrl}/kelola-konsultasi?ref={$refCode}&status=success",
                            'error' => "{$frontendUrl}/kelola-konsultasi?ref={$refCode}&status=error",
                            'pending' => "{$frontendUrl}/kelola-konsultasi?ref={$refCode}&status=pending",
                        ],
                    ];
                    $snapToken = \Midtrans\Snap::getSnapToken($params);
                    $result['consultation']->update(['snap_token' => $snapToken]);
                } catch (\Throwable $e) {
                    \Log::warning('Midtrans Snap generation failed for consultation: ' . $e->getMessage());
                }
            }

            $consultationFresh = $result['consultation']->fresh();
            $responseData = [
                'consultation'   => $consultationFresh,
                'reference_code' => $consultationFresh->reference_code,
                'snap_token'     => $snapToken ?: $consultationFresh->snap_token,
                'payment_method' => $consultationFresh->payment_method,
                'payment_status' => $consultationFresh->payment_status,
                'amount'         => $consultationFresh->amount,
            ];
            if ($result['pointTransaction']) {
                $responseData['point_transaction'] = [
                    'reference_code' => $result['pointTransaction']->reference_code,
                    'points_deducted' => abs($result['pointTransaction']->points),
                    'point_balance'   => $user->fresh()->point_balance,
                ];
            }

            // Kirim notifikasi email ke Tenaga Ahli dan Klien
            $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
            $dashboardUrl = $frontendUrl . '/kelola-konsultasi';
            $myConsultationUrl = $frontendUrl . '/profil';

            $expertRecipient = $expert->user?->email ?? $expert->email;
            if ($expertRecipient) {
                try {
                    Mail::to($expertRecipient)->send(new ConsultationBookedExpert($result['consultation'], $expert, $dashboardUrl));
                } catch (\Throwable $e) {
                    \Log::warning('Gagal kirim email ConsultationBookedExpert: ' . $e->getMessage());
                }
            }

            if ($request->client_email) {
                try {
                    Mail::to($request->client_email)->send(new ConsultationBookedClient($result['consultation'], $expert, $myConsultationUrl));
                } catch (\Throwable $e) {
                    \Log::warning('Gagal kirim email ConsultationBookedClient: ' . $e->getMessage());
                }
            }

            return response()->json([
                'status'  => 'success',
                'message' => 'Pengajuan konsultasi berhasil dikirim! Tenaga ahli akan segera meninjau permintaan Anda.',
                'data'    => $responseData,
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * GET /api/experts/{slug}/consultation-status
     * Cek apakah user sudah pernah berkonsultasi (status selesai) dengan expert ini.
     * Digunakan untuk menentukan apakah user boleh memberikan ulasan.
     */
    public function checkStatus(Request $request, string $slug)
    {
        $expert = Expert::where('slug', $slug)
            ->where('profile_status', 'aktif')
            ->firstOrFail();

        $user  = $request->user();
        $email = $request->query('email') ?: $user?->email;

        $hasConsulted = false;
        $canReview    = false;

        if ($user) {
            // Cek apakah pernah mengajukan konsultasi (status apapun)
            $hasConsulted = Consultation::where('expert_id', $expert->id)
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('client_email', $user->email);
                })
                ->exists();

            // Cek apakah ada konsultasi yang sudah selesai (untuk review)
            $canReview = Consultation::where('expert_id', $expert->id)
                ->where('status', 'selesai')
                ->where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('client_email', $user->email);
                })
                ->exists();
        } elseif ($email) {
            $hasConsulted = Consultation::where('expert_id', $expert->id)
                ->where('client_email', $email)
                ->exists();

            $canReview = Consultation::where('expert_id', $expert->id)
                ->where('status', 'selesai')
                ->where('client_email', $email)
                ->exists();
        }

        return response()->json([
            'status'        => 'success',
            'has_consulted' => $hasConsulted,
            'can_review'    => $canReview,
        ]);
    }

    /**
     * GET /api/my/consultations
     * Riwayat konsultasi milik user yang login (sebagai pemohon).
     */
    public function myConsultations(Request $request)
    {
        $user = $request->user();

        $consultations = Consultation::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('client_email', $user->email);
            })
            ->with('expert:id,name,slug,photo,field,kriteria')
            ->latest()
            ->paginate(15);

        $consultations->getCollection()->transform(function ($consultation) {
            if ($consultation->expert) {
                $rawPhoto = $consultation->expert->photo;
                if ($rawPhoto) {
                    $fullUrl = filter_var($rawPhoto, FILTER_VALIDATE_URL)
                        ? $rawPhoto
                        : asset('storage/' . ltrim(str_replace('\\', '/', $rawPhoto), '/'));
                    $consultation->expert->photo = $fullUrl;
                    $consultation->expert->photo_url = $fullUrl;
                }
            }
            return $consultation;
        });

        return response()->json($consultations);
    }

    /**
     * GET /api/my/expert-consultations
     * Daftar konsultasi yang masuk ke profil tenaga ahli yang sedang login.
     * Digunakan di halaman "Kelola Konsultasi" tenaga ahli.
     */
    public function expertConsultations(Request $request)
    {
        $user = $request->user();

        // Ambil SEMUA Expert records milik user (bisa punya lebih dari satu untuk dual-role)
        $expertIds = Expert::where('user_id', $user->id)->pluck('id');

        if ($expertIds->isEmpty()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Profil tenaga ahli tidak ditemukan.',
                'data'    => [],
            ], 404);
        }

        $status = $request->query('status'); // opsional filter status

        $query = Consultation::whereIn('expert_id', $expertIds)
            ->with(['user:id,name,email', 'expert.package']);

        if ($status && $status !== 'all') {
            $query->where('status', $status);
        }

        $consultations = $query->latest()->paginate(20);

        return response()->json([
            'status' => 'success',
            'data'   => $consultations,
            'stats'  => [
                'total'               => Consultation::whereIn('expert_id', $expertIds)->count(),
                'menunggu_konfirmasi' => Consultation::whereIn('expert_id', $expertIds)->where('status', 'menunggu_konfirmasi')->count(),
                'dikonfirmasi'        => Consultation::whereIn('expert_id', $expertIds)->where('status', 'dikonfirmasi')->count(),
                'selesai'             => Consultation::whereIn('expert_id', $expertIds)->where('status', 'selesai')->count(),
                'dibatalkan'          => Consultation::whereIn('expert_id', $expertIds)->where('status', 'dibatalkan')->count(),
            ],
        ]);
    }

    /**
     * PATCH /api/my/expert-consultations/{id}/status
     * Tenaga ahli memperbarui status konsultasi (terima / tolak / selesaikan).
     */
    public function updateStatus(Request $request, int $id)
    {
        $user      = $request->user();
        $expertIds = Expert::where('user_id', $user->id)->pluck('id');

        if ($expertIds->isEmpty()) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Profil tenaga ahli/surveyor tidak ditemukan.',
            ], 404);
        }

        $consultation = Consultation::where('id', $id)
            ->whereIn('expert_id', $expertIds)
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'status' => ['required', 'string', 'in:dikonfirmasi,selesai,dibatalkan'],
        ], [
            'status.required' => 'Status wajib diisi.',
            'status.in'       => 'Status tidak valid. Gunakan: dikonfirmasi, selesai, atau dibatalkan.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $newStatus = $request->status;

        // Validasi transisi status yang masuk akal
        $allowedTransitions = [
            'menunggu_konfirmasi' => ['dikonfirmasi', 'selesai', 'dibatalkan'],
            'dikonfirmasi'        => ['selesai', 'dibatalkan'],
            'selesai'             => [],       // final state
            'dibatalkan'          => [],       // final state
        ];

        $currentStatus = $consultation->status;
        $allowed = $allowedTransitions[$currentStatus] ?? [];

        if (!in_array($newStatus, $allowed)) {
            return response()->json([
                'status'  => 'error',
                'message' => "Tidak dapat mengubah status dari '{$currentStatus}' ke '{$newStatus}'.",
            ], 422);
        }

        $consultation->update(['status' => $newStatus]);

        // Cari transaksi pembayaran point jika ada
        $pointPayment = \App\Models\PointTransaction::where('related_id', $consultation->id)
            ->where(function ($q) {
                $q->where('related_type', 'App\\Models\\Consultation')
                  ->orWhere('related_type', Consultation::class);
            })
            ->where('type', \App\Models\PointTransaction::TYPE_CONSULTATION)
            ->where('status', \App\Models\PointTransaction::STATUS_SUCCESS)
            ->first();

        // 1. Auto-Refund ke klien jika status dibatalkan
        if ($newStatus === 'dibatalkan' && $pointPayment && $consultation->user) {
            $alreadyRefunded = \App\Models\PointTransaction::where('related_id', $consultation->id)
                ->where('type', \App\Models\PointTransaction::TYPE_REFUND)
                ->exists();

            if (!$alreadyRefunded) {
                $refundPoints = abs($pointPayment->points);
                if ($refundPoints > 0) {
                    $consultation->user->increment('point_balance', $refundPoints);
                    \App\Models\PointTransaction::create([
                        'user_id'      => $consultation->user_id,
                        'type'         => \App\Models\PointTransaction::TYPE_REFUND,
                        'points'       => $refundPoints,
                        'status'       => \App\Models\PointTransaction::STATUS_SUCCESS,
                        'description'  => "Refund poin konsultasi ({$consultation->topic}) karena dibatalkan",
                        'related_id'   => $consultation->id,
                        'related_type' => Consultation::class,
                        'notes'        => 'Otomatis di-refund ke saldo poin karena konsultasi dibatalkan',
                        'verified_at'  => now(),
                    ]);
                }
            }
        }

        // 2. Transfer point ke tenaga ahli jika status selesai
        if ($newStatus === 'selesai' && $pointPayment) {
            $alreadyEarned = \App\Models\PointTransaction::where('related_id', $consultation->id)
                ->where('type', 'consultation_income')
                ->exists();

            $expertObj = $consultation->expert ?: Expert::find($consultation->expert_id);
            if (!$alreadyEarned && $expertObj && $expertObj->user) {
                $earnedPoints = abs($pointPayment->points);
                if ($earnedPoints > 0) {
                    $expertObj->user->increment('point_balance', $earnedPoints);
                    \App\Models\PointTransaction::create([
                        'user_id'      => $expertObj->user->id,
                        'type'         => 'consultation_income',
                        'points'       => $earnedPoints,
                        'status'       => \App\Models\PointTransaction::STATUS_SUCCESS,
                        'description'  => "Pendapatan konsultasi ({$consultation->topic}) dari {$consultation->client_name}",
                        'related_id'   => $consultation->id,
                        'related_type' => Consultation::class,
                        'notes'        => 'Poin diterima dari penyelesaian sesi konsultasi',
                        'verified_at'  => now(),
                    ]);
                }
            }
        }

        // Kirim email notifikasi ke klien jika status berubah
        $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
        $myConsultationUrl = $frontendUrl . '/profil';
        $statusName = match ($newStatus) {
            'dikonfirmasi' => 'Dikonfirmasi',
            'selesai'      => 'Selesai',
            'dibatalkan'   => 'Dibatalkan',
            default        => ucfirst($newStatus),
        };

        $clientEmail = $consultation->client_email ?? $consultation->user?->email;
        if ($clientEmail) {
            $expertObj = $consultation->expert ?: Expert::find($consultation->expert_id);
            if ($expertObj) {
                try {
                    Mail::to($clientEmail)->send(new ConsultationStatusUpdated($consultation, $expertObj, $statusName, $myConsultationUrl));
                } catch (\Throwable $e) {
                    \Log::warning('Gagal kirim email ConsultationStatusUpdated: ' . $e->getMessage());
                }
            }
        }

        // Evaluasi dan sinkronisasi medali paket konsultasi expert
        try {
            $expertObjForMedal = $consultation->expert ?: Expert::find($consultation->expert_id);
            if ($expertObjForMedal) {
                app(\App\Services\MembershipMedalService::class)->evaluateAndSync($expertObjForMedal);
            }
        } catch (\Throwable $e) {
            \Log::warning('Gagal sinkronisasi medali expert: ' . $e->getMessage());
        }

        return response()->json([
            'status'  => 'success',
            'message' => $statusLabels[$newStatus] ?? 'Status berhasil diperbarui.',
            'data'    => $consultation->fresh(),
        ]);
    }

    // =========================================================================
    // ADMIN ENDPOINTS: ZOOM MEETING MANAGEMENT
    // =========================================================================

    /**
     * Admin: Get all consultations list with search & filter.
     * GET /api/admin/consultations
     */
    public function adminIndex(Request $request)
    {
        $admin = $request->user();
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $query = Consultation::with(['expert.user', 'user'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        if ($request->filled('service_type') && $request->service_type !== 'all') {
            $query->where('service_type', $request->service_type);
        }

        $consultations = $query->get()->map(function ($c) {
            return [
                'id' => $c->id,
                'ref' => $c->reference_code ?: ('CONS-' . str_pad($c->id, 4, '0', STR_PAD_LEFT)),
                'reference_code' => $c->reference_code ?: ('CONS-' . str_pad($c->id, 4, '0', STR_PAD_LEFT)),
                'amount' => $c->amount,
                'payment_method' => $c->payment_method,
                'payment_status' => $c->payment_status,
                'payment_proof' => $c->payment_proof,
                'payment_proof_url' => $c->payment_proof_url,
                'bank_name' => $c->bank_name,
                'paid_at' => $c->paid_at ? $c->paid_at->format('Y-m-d H:i:s') : null,
                'client_name' => $c->client_name ?: $c->user?->name,
                'client_email' => $c->client_email ?: $c->user?->email,
                'client_phone' => $c->client_phone,
                'expert_id' => $c->expert_id,
                'expert_name' => $c->expert?->name,
                'expert_email' => $c->expert?->user?->email ?: $c->expert?->email,
                'expert_phone' => $c->expert?->whatsapp ?: $c->expert?->phone,
                'service_type' => $c->service_type ?: 'zoom',
                'consultation_date' => $c->consultation_date ? $c->consultation_date->format('Y-m-d') : null,
                'consultation_time' => $c->consultation_time,
                'topic' => $c->topic,
                'notes' => $c->notes,
                'status' => $c->status,
                'zoom_link' => $c->zoom_link,
                'zoom_meeting_id' => $c->zoom_meeting_id,
                'zoom_passcode' => $c->zoom_passcode,
                'duration_minutes' => $c->duration_minutes ?? 30,
                'zoom_set_at' => $c->zoom_set_at ? $c->zoom_set_at->format('Y-m-d H:i:s') : null,
                'created_at' => $c->created_at->format('Y-m-d H:i:s'),
            ];
        });

        return response()->json([
            'success' => true,
            'count' => $consultations->count(),
            'data' => $consultations
        ]);
    }

    /**
     * User: Upload bukti transfer manual untuk sesi konsultasi
     * POST /api/consultations/{id}/payment-proof
     */
    public function uploadPaymentProof(Request $request, $id)
    {
        $consultation = Consultation::where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('reference_code', $id);
        })->firstOrFail();

        $fileKey = $request->hasFile('payment_proof') ? 'payment_proof' : ($request->hasFile('proof') ? 'proof' : null);
        if (!$fileKey) {
            return response()->json(['message' => 'Bukti pembayaran transfer wajib diunggah.'], 422);
        }

        $validator = Validator::make($request->all(), [
            $fileKey    => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'bank_name' => ['nullable', 'string', 'max:50'],
        ], [
            "{$fileKey}.mimes" => 'Format file bukti transfer harus JPG, PNG, WEBP, atau PDF.',
            "{$fileKey}.max"   => 'Ukuran file bukti transfer maksimal 5 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        if ($consultation->payment_proof && !str_starts_with($consultation->payment_proof, 'http')) {
            Storage::disk('public')->delete($consultation->payment_proof);
        }

        $path = $request->file($fileKey)->store('consultations/payments', 'public');
        $consultation->update([
            'payment_proof'  => $path,
            'payment_method' => 'manual',
            'payment_status' => 'menunggu_verifikasi',
            'bank_name'      => $request->input('bank_name', $consultation->bank_name),
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Bukti transfer pembayaran berhasil diunggah! Menunggu verifikasi admin.',
            'data'    => $consultation->fresh(),
        ]);
    }

    /**
     * Admin: Verifikasi manual payment transfer konsultasi
     * POST /api/admin/consultations/{id}/verify-payment
     */
    public function adminVerifyPayment(Request $request, $id)
    {
        $admin = $request->user();
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $consultation = Consultation::findOrFail($id);
        $consultation->update([
            'payment_status' => 'paid',
            'paid_at'        => now(),
            'status'         => in_array($consultation->status, ['pending', 'menunggu_konfirmasi']) ? 'dikonfirmasi' : $consultation->status,
        ]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Pembayaran konsultasi berhasil diverifikasi!',
            'data'    => $consultation->fresh(),
        ]);
    }

    /**
     * POST /api/consultations/{id}/snap-token
     * Generate or return Midtrans Snap token for a pending consultation.
     */
    public function getSnapToken(Request $request, $id)
    {
        $consultation = Consultation::where('id', $id)->orWhere('reference_code', $id)->firstOrFail();
        if ($consultation->payment_status === 'paid') {
            return response()->json([
                'success' => false,
                'message' => 'Konsultasi ini sudah berstatus lunas.',
            ], 400);
        }

        $amount = (int) $consultation->amount;
        if ($amount <= 0) {
            $amount = $consultation->service_type === 'zoom' ? 100000 : 50000;
            $consultation->update(['amount' => $amount]);
        }

        $refCode = $consultation->reference_code ?: ('KNS-' . date('ymd') . '-' . strtoupper(substr(uniqid(), -4)));
        if (!$consultation->reference_code) {
            $consultation->update(['reference_code' => $refCode]);
        }

        try {
            \Midtrans\Config::$serverKey = config('services.midtrans.server_key');
            \Midtrans\Config::$isProduction = config('services.midtrans.is_production', false);
            \Midtrans\Config::$isSanitized = config('services.midtrans.is_sanitized', true);
            \Midtrans\Config::$is3ds = config('services.midtrans.is_3ds', true);

            $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');
            $params = [
                'transaction_details' => [
                    'order_id' => $refCode,
                    'gross_amount' => $amount,
                ],
                'customer_details' => [
                    'first_name' => $consultation->client_name ?: 'Klien',
                    'email' => $consultation->client_email ?: 'klien@example.com',
                    'phone' => $consultation->client_phone ?: '',
                ],
                'item_details' => [
                    [
                        'id' => 'KNS-' . substr($consultation->service_type, 0, 10),
                        'price' => $amount,
                        'quantity' => 1,
                        'name' => 'Konsultasi ' . ucfirst($consultation->service_type),
                    ]
                ],
                'callbacks' => [
                    'finish' => "{$frontendUrl}/jadwal-konsultasi?ref={$refCode}&status=success",
                    'error' => "{$frontendUrl}/jadwal-konsultasi?ref={$refCode}&status=error",
                    'pending' => "{$frontendUrl}/jadwal-konsultasi?ref={$refCode}&status=pending",
                ],
            ];
            $snapToken = \Midtrans\Snap::getSnapToken($params);
            $consultation->update([
                'snap_token' => $snapToken,
                'payment_method' => 'midtrans',
            ]);

            return response()->json([
                'success' => true,
                'snap_token' => $snapToken,
                'reference_code' => $refCode,
                'amount' => $amount,
            ]);
        } catch (\Throwable $e) {
            \Log::error('Gagal generate Snap Token konsultasi: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Gagal menghubungkan ke Midtrans: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Admin: Set Zoom Link & broadcast to Expert and Client.
     * POST /api/admin/consultations/{id}/set-zoom
     */
    public function adminSetZoomLink(Request $request, $id)
    {
        $admin = $request->user();
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $consultation = Consultation::with(['expert.user', 'user'])->findOrFail($id);

        $validator = Validator::make($request->all(), [
            'zoom_link' => ['required', 'url', 'max:500'],
            'zoom_meeting_id' => ['nullable', 'string', 'max:100'],
            'zoom_passcode' => ['nullable', 'string', 'max:100'],
            'duration_minutes' => ['nullable', 'integer', 'min:15', 'max:180'],
        ], [
            'zoom_link.required' => 'Link Zoom Meeting wajib diisi.',
            'zoom_link.url' => 'Format Link Zoom Meeting harus berupa URL yang valid (https://...).',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $duration = (int) ($request->input('duration_minutes') ?: 30);

        $consultation->update([
            'zoom_link' => $request->zoom_link,
            'zoom_meeting_id' => $request->zoom_meeting_id,
            'zoom_passcode' => $request->zoom_passcode,
            'duration_minutes' => $duration,
            'zoom_set_by_admin' => $admin->id,
            'zoom_set_at' => now(),
            // Auto konfirmasi jadwal jika masih pending
            'status' => in_array($consultation->status, ['pending', 'menunggu_konfirmasi']) ? 'confirmed' : $consultation->status,
        ]);

        $expert = $consultation->expert;
        $expertEmail = $expert?->user?->email ?: $expert?->email;
        $clientEmail = $consultation->client_email ?: $consultation->user?->email;

        // 1. Kirim Email Notifikasi Zoom ke Tenaga Ahli
        if ($expertEmail && $expert) {
            try {
                Mail::to($expertEmail)->send(new ConsultationZoomReady(
                    consultation: $consultation,
                    expert: $expert,
                    recipientType: 'expert',
                    zoomLink: $request->zoom_link,
                    meetingId: $request->zoom_meeting_id,
                    passcode: $request->zoom_passcode,
                    durationMinutes: $duration
                ));
            } catch (\Throwable $e) {
                \Log::warning('Gagal kirim email ConsultationZoomReady ke expert: ' . $e->getMessage());
            }
        }

        // 2. Kirim Email Notifikasi Zoom ke Klien
        if ($clientEmail && $expert) {
            try {
                Mail::to($clientEmail)->send(new ConsultationZoomReady(
                    consultation: $consultation,
                    expert: $expert,
                    recipientType: 'client',
                    zoomLink: $request->zoom_link,
                    meetingId: $request->zoom_meeting_id,
                    passcode: $request->zoom_passcode,
                    durationMinutes: $duration
                ));
            } catch (\Throwable $e) {
                \Log::warning('Gagal kirim email ConsultationZoomReady ke client: ' . $e->getMessage());
            }
        }

        // 3. Catat di In-App Chat Room
        try {
            $msgText = "🎥 Admin telah menyiapkan Link Zoom Meeting resmi (Durasi: {$duration} Menit):\n"
                . "Link: {$request->zoom_link}\n"
                . ($request->zoom_meeting_id ? "Meeting ID: {$request->zoom_meeting_id}\n" : '')
                . ($request->zoom_passcode ? "Passcode: {$request->zoom_passcode}" : '');

            ConsultationMessage::create([
                'consultation_id' => $consultation->id,
                'sender_id' => $admin->id,
                'sender_type' => 'admin',
                'message' => $msgText,
                'is_read' => false,
            ]);
        } catch (\Throwable $e) {
            \Log::warning('Gagal catat chat pesan link Zoom: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => "Link Zoom (Durasi {$duration} Menit) berhasil disimpan dan dikirimkan ke Tenaga Ahli & Klien.",
            'data' => $consultation->fresh(),
        ]);
    }
}
