<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Expert;
use App\Models\Document;
use App\Models\Education;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Mail;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Str;
use App\Mail\EmailChangeOtpVerification;

class AuthController extends Controller
{
    /**
     * Cek status pendaftaran berdasarkan email (tanpa autentikasi).
     * Digunakan oleh halaman "Menunggu Verifikasi" di frontend.
     */
    public function registrationStatus(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email tidak ditemukan.'], 404);
        }

        $expert = Expert::where('user_id', $user->id)->latest()->first();

        if (!$expert) {
            return response()->json(['message' => 'Data pendaftaran tidak ditemukan.'], 404);
        }

        return match ($expert->profile_status) {
            'aktif' => response()->json([
                'status'  => 'approved',
                'message' => 'Pendaftaran Anda telah disetujui.',
            ]),
            'ditolak' => response()->json([
                'status'  => 'rejected',
                'message' => 'Pendaftaran Anda ditolak.',
                'reason'  => $expert->reject_reason,
            ]),
            default => response()->json([
                'status'  => 'pending',
                'message' => 'Pendaftaran Anda sedang menunggu verifikasi.',
            ]),
        };
    }


    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'              => ['required', 'string', 'max:255'],
            'email'             => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password'          => ['required', 'string', 'min:8'],
            'password_confirmation' => ['required', 'string', 'same:password'],
            'role_type'         => ['required', 'string', 'in:klien,tenaga_ahli,surveyor,tenaga_teknis'],
            'phone'             => ['nullable', 'string', 'max:20'],
            'institution'       => ['nullable', 'string', 'max:255'],
            'field'             => ['nullable', 'string', 'max:255'],
            'tempat_lahir'      => ['nullable', 'string', 'max:255'],
            'tanggal_lahir'     => ['nullable', 'date'],
            'alamat_kota'       => ['nullable', 'string', 'max:255'],
            'alamat_provinsi'   => ['nullable', 'string', 'max:255'],
            'catatan'           => ['nullable', 'string'],
            'kriteria_list'     => ['nullable', 'json'],
            'foto'              => ['nullable', 'file', 'mimes:jpg,jpeg,png', 'max:5120'],
            'cv'                => ['nullable', 'file', 'mimes:pdf', 'max:5120'],
            'bukti_kompetensi'  => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        // 1. Create User dengan OTP
        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $otpExpiresAt = now()->addMinutes(10);

        $roleType = $request->role_type; // klien | tenaga_ahli | surveyor

        $user = User::create([
            'name'            => $request->name,
            'email'           => $request->email,
            'password'        => Hash::make($request->password),
            'role'            => 'user',
            'role_type'       => $roleType,
            'otp_code'        => $otpCode,
            'otp_expires_at'  => $otpExpiresAt,
        ]);

        // 2. Kirim email OTP
        try {
            Mail::to($user->email)->send(new \App\Mail\OtpVerification($otpCode));
            \Log::info("OTP sent to {$user->email}: {$otpCode}");
        } catch (\Exception $e) {
            \Log::error('Failed to send OTP email: ' . $e->getMessage());
            \Log::info("OTP for {$user->email} (email failed, use this code): {$otpCode}");
        }

        $token = $user->createToken('registration_token')->plainTextToken;

        // Award 20 poin untuk registrasi
        $pointService = new PointService();
        $pointService->awardPoints($user, 'register', 'Registrasi akun baru');

        return response()->json([
            'message'  => 'Registrasi berhasil. Silakan cek email Anda untuk kode verifikasi.',
            'user'     => [
                'id'        => $user->id,
                'name'      => $user->name,
                'email'     => $user->email,
                'role_type' => $user->role_type,
            ],
            'otp_sent' => true,
        ], 201);
    }

    /**
     * Verifikasi email dengan OTP
     */
    public function verifyEmail(Request $request)
    {
        $request->validate([
            'email'    => ['required', 'email'],
            'otp_code' => ['required', 'string', 'size:6'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email tidak ditemukan.'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email sudah terverifikasi.'], 400);
        }

        // Debug logging
        \Log::info("OTP Verification Attempt", [
            'email' => $request->email,
            'input_otp' => $request->otp_code,
            'stored_otp' => $user->otp_code,
            'expires_at' => $user->otp_expires_at,
            'current_time' => now(),
           'is_expired' => $user->otp_expires_at ? now()->gt($user->otp_expires_at) : null,
        ]);

        if ($user->otp_code !== $request->otp_code) {
            return response()->json([
                'message' => 'Kode OTP salah.',
            ], 422);
        }

       if ($user->otp_expires_at && now()->gt($user->otp_expires_at)) {
            return response()->json(['message' => 'Kode OTP sudah kadaluarsa.'], 422);
        }

        // Verifikasi berhasil
        $user->update([
            'email_verified_at' => now(),
            'otp_code'          => null,
            'otp_expires_at'    => null,
        ]);

        // Cari paket free
        $freePackage = \App\Models\Package::where('price', 0)->first();

        // Buat Expert profile hanya untuk tenaga_ahli dan surveyor, bukan klien
        if ($user->role_type !== 'klien') {
            // Tentukan kriteria berdasarkan role_type
            $kriteria = $user->role_type === 'surveyor' ? 'Surveyor' : ($user->role_type === 'tenaga_teknis' ? 'Tenaga Teknis' : 'Tenaga Ahli');

            Expert::create([
                'user_id'         => $user->id,
                'slug'            => Str::slug($user->name) . '-' . Str::random(5),
                'name'            => $user->name,
                'email'           => $user->email,
                'kriteria'        => $kriteria,
                'profile_status'  => 'draft',
                'package_id'      => $freePackage ? $freePackage->id : null,
            ]);
        }

        // Award 10 poin untuk verifikasi email
        $pointService = new PointService();
        $pointService->awardPoints($user, 'verify_email', 'Verifikasi email berhasil');

        return response()->json([
            'message' => 'Email berhasil diverifikasi! Silakan login.',
            'verified' => true,
        ]);
    }

    /**
     * Kirim ulang OTP
     */
    public function resendOTP(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email tidak ditemukan.'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email sudah terverifikasi.'], 400);
        }

        // Generate OTP baru
        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $otpExpiresAt = now()->addMinutes(10);

        $user->update([
            'otp_code'       => $otpCode,
            'otp_expires_at' => $otpExpiresAt,
        ]);

        // Kirim email
        try {
            Mail::to($user->email)->send(new \App\Mail\OtpVerification($otpCode));
            \Log::info("OTP resent to {$user->email}: {$otpCode}");

            $response = [
                'message' => 'Kode OTP baru telah dikirim ke email Anda.',
                'otp_sent' => true,
            ];

            return response()->json($response);
        } catch (\Exception $e) {
            \Log::error('Failed to send OTP email: ' . $e->getMessage());
            \Log::info("OTP for {$user->email} (email failed, use this code): {$otpCode}");

            return response()->json([
                'message' => 'Kode OTP dibuat tetapi email gagal dikirim. Cek log server.',
                'otp_sent' => false,
            ], 500);
        }
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required'],
        ]);

        $rawEmail = trim((string) $request->email);
        $user = User::where('email', $rawEmail)->first();

        // Coba match dengan normalize tanpa spasi atau matching keyword expert jika belum ketemu
        if (!$user) {
            $cleaned = strtolower(preg_replace('/\s+/', '', $rawEmail));
            $user = User::whereRaw("LOWER(REPLACE(email, ' ', '')) = ?", [$cleaned])->first();
        }

        if (!$user) {
            $expertMap = [
                'irman'  => 'dr.irman.firmansyah@tenagaahli.com',
                'casnan' => 'dr.casnan@tenagaahli.com',
                'naufal' => 'naufal.nashrullah@tenagaahli.com',
                'yoga'   => 'yoga.hepta.gumilar@tenagaahli.com',
            ];
            foreach ($expertMap as $key => $targetEmail) {
                if (stripos($rawEmail, $key) !== false) {
                    $user = User::where('email', $targetEmail)->first();
                    if ($user) break;
                }
            }
        }

        if (! $user || ! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Email atau kata sandi salah.'],
            ]);
        }

        // Admin tidak perlu verifikasi email, bisa langsung login
        if ($user->role !== 'admin') {
            // Cek apakah email sudah diverifikasi (hanya untuk user biasa)
            if (!$user->email_verified_at) {
                return response()->json([
                    'message' => 'Email Anda belum diverifikasi. Silakan cek email untuk kode verifikasi.',
                    'email_verified' => false,
                    'email' => $user->email,
                ], 403);
            }
        }

        // User yang sudah verify email BISA LOGIN
        // Set status online saat login berhasil
        $user->update([
            'is_online' => true,
            'last_seen_at' => now(),
        ]);
        Expert::where('user_id', $user->id)->update([
            'is_online' => true,
            'last_seen_at' => now(),
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        // Pastikan foto tersinkron dari expert jika ada
        $expert = Expert::where('user_id', $user->id)->first();
        $expertPhoto = $expert?->photo ?? ($expert?->pending_changes['photo'] ?? null);
        if ($expertPhoto && (!$user->getRawOriginal('foto') || !$user->getRawOriginal('avatar_url'))) {
            $user->update([
                'foto' => $expertPhoto,
                'avatar_url' => $expertPhoto,
            ]);
        }

        return response()->json([
            'user'  => array_merge($user->toArray(), [
                'role_type'  => $user->role_type ?? 'klien',
                'is_online'  => true,
                'foto'       => $user->foto ?: $expertPhoto,
                'avatar_url' => $user->avatar_url ?: $expertPhoto,
            ]),
            'token' => $token,
        ]);
    }

    public function logout(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->update([
                'is_online' => false,
                'last_seen_at' => now()->subMinutes(5),
            ]);
            Expert::where('user_id', $user->id)->update([
                'is_online' => false,
                'last_seen_at' => now()->subMinutes(5),
            ]);
            $user->currentAccessToken()?->delete();
        }

        return response()->json(['message' => 'Logged out', 'is_online' => false]);
    }

    public function user(Request $request)
    {
        $user = $request->user();
        if ($user) {
            $user->load(['expert.package']);
            $expertPhoto = $user->expert?->photo;
            $userFoto = $user->getRawOriginal('foto') ?: $user->getRawOriginal('avatar_url');

            // Sinkronisasi dua arah foto antara users dan experts
            if ($expertPhoto && $userFoto !== $expertPhoto) {
                $user->update([
                    'foto'       => $expertPhoto,
                    'avatar_url' => $expertPhoto,
                ]);
            } elseif ($userFoto && (!$expertPhoto || $expertPhoto !== $userFoto) && $user->expert) {
                $user->expert->update([
                    'photo' => $userFoto,
                ]);
            }

            // Sinkronisasi dua arah No. WhatsApp / phone antara users dan experts
            $expertPhone = $user->expert?->phone;
            $userPhone = $user->getRawOriginal('phone');
            if ($expertPhone && $userPhone !== $expertPhone) {
                $user->update(['phone' => $expertPhone]);
            } elseif ($userPhone && (!$expertPhone || $expertPhone !== $userPhone) && $user->expert) {
                $user->expert->update(['phone' => $userPhone]);
            }

            // Sinkronisasi package user dari expert->package
            if ($user->expert?->package) {
                $pkgName = strtolower($user->expert->package->name ?? '');
                $pkgSlug = strtolower($user->expert->package->slug ?? '');
                $canonicalPkg = 'standar';
                if (str_contains($pkgName, 'ekslusif') || str_contains($pkgName, 'eksklusif') || str_contains($pkgSlug, 'ekslusif') || str_contains($pkgSlug, 'eksklusif')) {
                    $canonicalPkg = 'ekslusif';
                } elseif (str_contains($pkgName, 'ekonomis') || str_contains($pkgSlug, 'ekonomis')) {
                    $canonicalPkg = 'ekonomis';
                }
                if ($user->package !== $canonicalPkg) {
                    $user->update(['package' => $canonicalPkg]);
                }
            }
        }
        return response()->json([
            'user' => $user ? $user->fresh(['expert.package']) : null,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'name'  => ['nullable', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:30'],
            'foto'  => ['nullable', 'string'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $data = [];
        if ($request->filled('name')) $data['name'] = $request->name;
        if ($request->has('phone')) $data['phone'] = $request->phone;
        if ($request->has('foto')) {
            $data['foto'] = $request->foto;
            $data['avatar_url'] = $request->foto;
        }

        $user->update($data);

        // Sinkronkan nama, foto & phone ke profil expert jika pengguna adalah ahli/surveyor
        try {
            $expert = \App\Models\Expert::where('user_id', $user->id)->first();
            if ($expert) {
                $expertUpdates = [];
                if ($request->filled('name')) {
                    $expertUpdates['name'] = $request->name;
                }
                if ($request->has('foto')) {
                    $expertUpdates['photo'] = $request->foto;
                }
                if ($request->has('phone')) {
                    $expertUpdates['phone'] = $request->phone;
                }
                if (!empty($expertUpdates)) {
                    $expert->update($expertUpdates);
                }
            }
        } catch (\Exception $e) {}

        return response()->json([
            'message' => 'Profil berhasil diperbarui.',
            'user'    => $user->fresh(['expert.package']),
        ]);
    }

    public function uploadAvatar(Request $request)
    {
        $request->validate([
            'avatar' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'],
        ]);

        $user = $request->user();

        // Delete old avatar if exists
        if ($user->avatar_url && !str_starts_with($user->avatar_url, 'http')) {
            \Illuminate\Support\Facades\Storage::disk('public')->delete($user->avatar_url);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $fullUrl = url('api/files/' . $path);

        $user->update([
            'avatar_url' => $path,
            'foto'       => $path,
        ]);

        // If user is expert/surveyor, also sync photo langsung
        try {
            $expert = \App\Models\Expert::where('user_id', $user->id)->first();
            if ($expert) {
                if ($expert->photo && $expert->photo !== $path && \Illuminate\Support\Facades\Storage::disk('public')->exists($expert->photo)) {
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($expert->photo);
                }
                $expertUpdate = ['photo' => $path];
                if (is_array($expert->pending_changes) && isset($expert->pending_changes['photo'])) {
                    $cp = $expert->pending_changes;
                    if ($cp['photo'] && \Illuminate\Support\Facades\Storage::disk('public')->exists($cp['photo'])) {
                        \Illuminate\Support\Facades\Storage::disk('public')->delete($cp['photo']);
                    }
                    unset($cp['photo']);
                    $expertUpdate['pending_changes'] = empty($cp) ? null : $cp;
                    if (empty($cp) && $expert->update_status === 'menunggu_verifikasi') {
                        $expertUpdate['update_status'] = null;
                        $expertUpdate['update_reject_reason'] = null;
                    }
                }
                $expert->update($expertUpdate);
            }
        } catch (\Exception $e) {}

        return response()->json([
            'success'    => true,
            'message'    => 'Foto profil berhasil diperbarui.',
            'avatar_url' => $path,
            'full_url'   => $fullUrl,
            'user'       => $user->fresh(['expert.package']),
        ]);
    }

    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'Password lama tidak sesuai.'], 422);
        }

        $user->update([
            'password' => Hash::make($request->new_password),
        ]);

        return response()->json(['message' => 'Password berhasil diubah.']);
    }

    public function logoutOtherDevices(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        $currentTokenId = $user->currentAccessToken()?->id;

        if ($currentTokenId) {
            $user->tokens()->where('id', '!=', $currentTokenId)->delete();
        }

        return response()->json([
            'success' => true,
            'message' => 'Semua sesi lain pada perangkat berbeda telah berhasil dikeluarkan.',
        ]);
    }

    /**
     * Request perubahan email (mengirimkan OTP ke email baru).
     */
    public function requestChangeEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'new_email' => ['required', 'string', 'email', 'max:255'],
        ], [
            'new_email.required' => 'Alamat email baru wajib diisi.',
            'new_email.email'    => 'Format alamat email baru tidak valid.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first('new_email') ?: 'Format alamat email tidak valid.',
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = $request->user();
        $newEmail = strtolower(trim($request->new_email));

        if (strtolower($user->email) === $newEmail) {
            return response()->json([
                'message' => 'Email baru tidak boleh sama dengan email akun Anda saat ini.',
            ], 422);
        }

        // Cek apakah email baru sudah terdaftar pada user lain
        $emailExists = User::where('email', $newEmail)->where('id', '!=', $user->id)->exists();
        if ($emailExists) {
            return response()->json([
                'message' => 'Alamat email ini sudah terdaftar pada akun lain. Silakan gunakan email lain.',
            ], 422);
        }

        // Generate kode OTP 6 digit dan masa berlaku 10 menit
        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $otpExpiresAt = now()->addMinutes(10);

        $user->update([
            'pending_email'  => $newEmail,
            'otp_code'       => $otpCode,
            'otp_expires_at' => $otpExpiresAt,
        ]);

        // Kirim email OTP
        $emailSent = true;
        try {
            Mail::to($newEmail)->send(new EmailChangeOtpVerification($otpCode, $newEmail, $user->name));
            \Log::info("Email change OTP sent to {$newEmail}: {$otpCode}");
        } catch (\Exception $e) {
            $emailSent = false;
            \Log::error('Failed to send email change OTP: ' . $e->getMessage());
            \Log::info("Email change OTP for {$newEmail} (email send failed, use this code): {$otpCode}");
        }

        return response()->json([
            'success'       => true,
            'message'       => 'Kode verifikasi (OTP) telah dikirimkan ke alamat email baru Anda.',
            'pending_email' => $newEmail,
            'email_sent'    => $emailSent,
            'otp_debug'     => config('app.debug') ? $otpCode : null,
        ]);
    }

    /**
     * Verifikasi kode OTP dan selesaikan perubahan email.
     */
    public function verifyChangeEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'otp_code' => ['required', 'string', 'size:6'],
        ], [
            'otp_code.required' => 'Kode OTP wajib diisi.',
            'otp_code.size'     => 'Kode OTP harus 6 digit angka.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => $validator->errors()->first('otp_code'),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $user = $request->user();

        if (empty($user->pending_email)) {
            return response()->json([
                'message' => 'Tidak ada permohonan perubahan email yang sedang aktif.',
            ], 400);
        }

        if ($user->otp_code !== $request->otp_code) {
            return response()->json([
                'message' => 'Kode OTP verifikasi tidak sesuai.',
            ], 422);
        }

        if ($user->otp_expires_at && now()->gt($user->otp_expires_at)) {
            return response()->json([
                'message' => 'Kode OTP sudah kadaluarsa. Silakan klik kirim ulang kode OTP.',
            ], 422);
        }

        $newEmail = $user->pending_email;

        // Cek kembali ketersediaan email
        if (User::where('email', $newEmail)->where('id', '!=', $user->id)->exists()) {
            $user->update([
                'pending_email'  => null,
                'otp_code'       => null,
                'otp_expires_at' => null,
            ]);
            return response()->json([
                'message' => 'Alamat email baru sudah dipakai oleh akun lain. Silakan coba email lain.',
            ], 422);
        }

        // Terapkan perubahan email
        $user->update([
            'email'             => $newEmail,
            'email_verified_at' => now(),
            'pending_email'     => null,
            'otp_code'          => null,
            'otp_expires_at'    => null,
        ]);

        // Sinkronkan ke profil Expert/Surveyor jika ada
        try {
            $expert = Expert::where('user_id', $user->id)->first();
            if ($expert) {
                $expert->update(['email' => $newEmail]);
            }
        } catch (\Exception $e) {
            \Log::warning('Failed to sync new email to expert profile: ' . $e->getMessage());
        }

        return response()->json([
            'success' => true,
            'message' => 'Alamat email akun berhasil diperbarui.',
            'user'    => $user->fresh(),
        ]);
    }

    /**
     * Kirim ulang kode OTP perubahan email.
     */
    public function resendChangeEmailOtp(Request $request)
    {
        $user = $request->user();

        if (empty($user->pending_email)) {
            return response()->json([
                'message' => 'Tidak ada permohonan perubahan email yang sedang aktif.',
            ], 400);
        }

        $newEmail = $user->pending_email;
        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        $otpExpiresAt = now()->addMinutes(10);

        $user->update([
            'otp_code'       => $otpCode,
            'otp_expires_at' => $otpExpiresAt,
        ]);

        try {
            Mail::to($newEmail)->send(new EmailChangeOtpVerification($otpCode, $newEmail, $user->name));
            \Log::info("Resent email change OTP to {$newEmail}: {$otpCode}");
        } catch (\Exception $e) {
            \Log::error('Failed to resend email change OTP: ' . $e->getMessage());
            \Log::info("Resent email change OTP for {$newEmail} (failed, use this code): {$otpCode}");
        }

        return response()->json([
            'success'       => true,
            'message'       => 'Kode OTP baru telah dikirimkan ke ' . $newEmail,
            'pending_email' => $newEmail,
            'otp_debug'     => config('app.debug') ? $otpCode : null,
        ]);
    }

    /**
     * Batalkan permintaan perubahan email.
     */
    public function cancelChangeEmail(Request $request)
    {
        $user = $request->user();
        $user->update([
            'pending_email'  => null,
            'otp_code'       => null,
            'otp_expires_at' => null,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Permintaan perubahan email telah dibatalkan.',
        ]);
    }

    /**
     * Kirim OTP untuk reset password
     */
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
        ]);

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'Email tidak terdaftar.'], 404);
        }

        // Generate 6-digit OTP
        $otpCode = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);

        // Simpan token ke database
        \DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $request->email],
            [
                'token' => Hash::make($otpCode),
                'created_at' => now(),
            ]
        );

        // Kirim email dengan OTP
        try {
            Mail::to($user->email)->send(new \App\Mail\PasswordResetMail($otpCode, $user->email));
            \Log::info("Password reset OTP sent to {$user->email}: {$otpCode}");

            return response()->json([
                'message' => 'Kode verifikasi telah dikirim ke email Anda.',
                'email' => $user->email,
            ]);
        } catch (\Exception $e) {
            \Log::error('Failed to send password reset email: ' . $e->getMessage());
            \Log::info("Password reset OTP for {$user->email} (email failed): {$otpCode}");

            return response()->json([
                'message' => 'Gagal mengirim email. Silakan coba lagi.',
            ], 500);
        }
    }

    /**
     * Verifikasi OTP reset password
     */
    public function verifyResetToken(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string', 'size:6'],
        ]);

        $resetRecord = \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return response()->json(['message' => 'Kode verifikasi tidak valid.'], 422);
        }

        // Cek apakah token expired (15 menit)
        if (\Carbon\Carbon::parse($resetRecord->created_at)->addMinutes(15)->isPast()) {
            return response()->json(['message' => 'Kode verifikasi sudah kadaluarsa.'], 422);
        }

        // Verifikasi token
        if (!Hash::check($request->token, $resetRecord->token)) {
            return response()->json(['message' => 'Kode verifikasi salah.'], 422);
        }

        return response()->json([
            'message' => 'Kode verifikasi valid.',
            'valid' => true,
        ]);
    }

    /**
     * Reset password dengan OTP
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'token' => ['required', 'string', 'size:6'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $resetRecord = \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->first();

        if (!$resetRecord) {
            return response()->json(['message' => 'Kode verifikasi tidak valid.'], 422);
        }

        // Cek apakah token expired (15 menit)
        if (\Carbon\Carbon::parse($resetRecord->created_at)->addMinutes(15)->isPast()) {
            return response()->json(['message' => 'Kode verifikasi sudah kadaluarsa.'], 422);
        }

        // Verifikasi token
        if (!Hash::check($request->token, $resetRecord->token)) {
            return response()->json(['message' => 'Kode verifikasi salah.'], 422);
        }

        // Update password
        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User tidak ditemukan.'], 404);
        }

        $user->update([
            'password' => Hash::make($request->password),
        ]);

        // Hapus token setelah digunakan
        \DB::table('password_reset_tokens')
            ->where('email', $request->email)
            ->delete();

        return response()->json([
            'message' => 'Password berhasil direset. Silakan login dengan password baru Anda.',
        ]);
    }
}
