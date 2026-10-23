<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\RoleUpgradeApproved;
use App\Mail\RoleUpgradeRejected;
use App\Models\Expert;
use App\Models\Package;
use App\Models\RoleUpgradeRequest;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class RoleUpgradeController extends Controller
{
    /**
     * GET /api/my/role-upgrade-status
     * Cek status pengajuan upgrade role milik user yang login.
     */
    public function myStatus(Request $request)
    {
        $user = $request->user();

        $latest = RoleUpgradeRequest::where('user_id', $user->id)
            ->latest()
            ->first();

        return response()->json([
            'role_type'      => $user->role_type,
            'is_also_expert' => $user->is_also_expert,
            'latest_request' => $latest,
        ]);
    }

    /**
     * POST /api/my/role-upgrade
     * Mengajukan perpindahan atau penambahan peran (Tenaga Ahli <-> Surveyor).
     * Seluruh pengajuan memerlukan konfirmasi dan persetujuan Admin.
     */
    public function apply(Request $request)
    {
        $user = $request->user();

        // Tenaga ahli daftar tambah peran surveyor — butuh review & persetujuan admin
        if ($user->role_type === 'tenaga_ahli') {
            return $this->applyExpertBecomeSurveyor($request, $user);
        }

        // Surveyor apply upgrade ke tenaga_ahli — butuh review & persetujuan admin
        if ($user->role_type === 'surveyor') {
            return $this->applySurveyorBecomeExpert($request, $user);
        }

        return response()->json(['message' => 'Role Anda tidak dapat diupgrade.'], 422);
    }

    // ── Tenaga Ahli daftar juga sebagai Surveyor (Butuh Konfirmasi Admin) ──
    private function applyExpertBecomeSurveyor(Request $request, User $user)
    {
        // Cek sudah ada pengajuan pending
        $pending = RoleUpgradeRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($pending) {
            return response()->json(['message' => 'Pengajuan Anda sedang dalam proses review admin.'], 422);
        }

        // Cek apakah sudah terdaftar sebagai surveyor aktif
        $existing = Expert::where('user_id', $user->id)
            ->where(function ($q) {
                $q->where('kriteria', 'LIKE', '%Surveyor%')
                  ->orWhere('kriteria_list', 'LIKE', '%Surveyor%')
                  ->orWhere('field', 'LIKE', '%Surveyor%');
            })
            ->where('profile_status', 'aktif')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Anda sudah terdaftar sebagai Surveyor yang aktif.'], 422);
        }

        // Upload dokumen jika ada
        $docPath = null;
        if ($request->hasFile('dokumen_kompetensi')) {
            $docPath = $request->file('dokumen_kompetensi')->store('role-upgrade-docs', 'public');
        }

        $upgradeReq = RoleUpgradeRequest::create([
            'user_id'            => $user->id,
            'from_role'          => 'tenaga_ahli',
            'to_role'            => 'surveyor',
            'status'             => 'pending',
            'field_keahlian'     => $request->input('field_keahlian', 'Surveyor & Pemetaan'),
            'institusi'          => $request->input('institusi', '-'),
            'motivasi'           => $request->input('motivasi', 'Pengajuan menjadi Surveyor'),
            'dokumen_kompetensi' => $docPath,
        ]);

        return response()->json([
            'message' => 'Pengajuan menjadi Surveyor berhasil dikirim. Mohon menunggu konfirmasi & verifikasi dari Admin.',
            'data'    => $upgradeReq,
        ], 201);
    }

    // ── Surveyor apply upgrade ke Tenaga Ahli ─────────────────────────────
    private function applySurveyorBecomeExpert(Request $request, User $user)
    {
        // Cek sudah ada pengajuan pending
        $pending = RoleUpgradeRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->exists();

        if ($pending) {
            return response()->json(['message' => 'Pengajuan Anda sedang dalam proses review.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'field_keahlian'      => ['required', 'string', 'max:255'],
            'institusi'           => ['required', 'string', 'max:255'],
            'motivasi'            => ['required', 'string', 'min:50', 'max:2000'],
            'dokumen_kompetensi'  => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ], [
            'field_keahlian.required' => 'Bidang keahlian wajib diisi.',
            'institusi.required'      => 'Institusi wajib diisi.',
            'motivasi.required'       => 'Motivasi upgrade wajib diisi (minimal 50 karakter).',
            'motivasi.min'            => 'Motivasi terlalu singkat (minimal 50 karakter).',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        // Cek syarat minimal: sudah punya profil surveyor yang aktif
        $surveyorExpert = Expert::where('user_id', $user->id)
            ->where('profile_status', 'aktif')
            ->first();

        if (!$surveyorExpert) {
            return response()->json([
                'message' => 'Profil Surveyor Anda harus sudah disetujui admin sebelum bisa apply upgrade ke Tenaga Ahli.',
            ], 422);
        }

        // Upload dokumen jika ada
        $docPath = null;
        if ($request->hasFile('dokumen_kompetensi')) {
            $docPath = $request->file('dokumen_kompetensi')->store('role-upgrade-docs', 'public');
        }

        $upgradeReq = RoleUpgradeRequest::create([
            'user_id'            => $user->id,
            'from_role'          => 'surveyor',
            'to_role'            => 'tenaga_ahli',
            'status'             => 'pending',
            'field_keahlian'     => $request->field_keahlian,
            'institusi'          => $request->institusi,
            'motivasi'           => $request->motivasi,
            'dokumen_kompetensi' => $docPath,
        ]);

        return response()->json([
            'message' => 'Pengajuan upgrade ke Tenaga Ahli berhasil dikirim. Admin akan mereview dalam 1-3 hari kerja.',
            'data'    => $upgradeReq,
        ], 201);
    }

    // ══════════════════════════════════════════════════════════════════════
    // ADMIN
    // ══════════════════════════════════════════════════════════════════════

    /**
     * GET /api/admin/role-upgrade-requests
     */
    public function adminIndex(Request $request)
    {
        $query = RoleUpgradeRequest::with('user:id,name,email,role_type')
            ->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->paginate(20));
    }

    /**
     * POST /api/admin/role-upgrade-requests/{id}/approve
     */
    public function approve(Request $request, $id)
    {
        $upgradeReq = RoleUpgradeRequest::findOrFail($id);

        if ($upgradeReq->status !== 'pending') {
            return response()->json(['message' => 'Pengajuan ini sudah diproses.'], 422);
        }

        $user = User::findOrFail($upgradeReq->user_id);
        $freePackage = Package::where('price', 0)->first();

        if ($upgradeReq->to_role === 'surveyor') {
            // Tenaga Ahli -> Surveyor
            $user->update([
                'is_also_expert' => true,
            ]);

            $existing = Expert::where('user_id', $user->id)
                ->where(function ($q) {
                    $q->where('kriteria', 'LIKE', '%Surveyor%')
                      ->orWhere('field', 'LIKE', '%Surveyor%');
                })->first();

            if (!$existing) {
                Expert::create([
                    'user_id'        => $user->id,
                    'slug'           => Str::slug($user->name) . '-surveyor-' . Str::random(4),
                    'name'           => $user->name,
                    'email'          => $user->email,
                    'kriteria'       => 'Surveyor',
                    'field'          => $upgradeReq->field_keahlian ?: 'Surveyor & Pemetaan',
                    'institution'    => $upgradeReq->institusi ?: '',
                    'profile_status' => 'aktif',
                    'package_id'     => $freePackage?->id,
                ]);
            } else {
                $existing->update(['profile_status' => 'aktif']);
            }
            $targetMessage = 'Pengajuan disetujui. User sekarang aktif sebagai Surveyor.';
        } else {
            // Surveyor -> Tenaga Ahli
            $user->update([
                'role_type'      => 'tenaga_ahli',
                'is_also_expert' => false,
            ]);

            $existing = Expert::where('user_id', $user->id)
                ->where('kriteria', 'Tenaga Ahli')
                ->first();

            if (!$existing) {
                Expert::create([
                    'user_id'        => $user->id,
                    'slug'           => Str::slug($user->name) . '-ahli-' . Str::random(4),
                    'name'           => $user->name,
                    'email'          => $user->email,
                    'kriteria'       => 'Tenaga Ahli',
                    'field'          => $upgradeReq->field_keahlian,
                    'institution'    => $upgradeReq->institusi,
                    'profile_status' => 'aktif',
                    'package_id'     => $freePackage?->id,
                ]);
            } else {
                $existing->update(['profile_status' => 'aktif']);
            }
            $targetMessage = 'Pengajuan disetujui. User sekarang aktif sebagai Tenaga Ahli.';
        }

        $upgradeReq->update([
            'status'      => 'approved',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // Kirim email notifikasi ke pengguna
        if ($user && $user->email) {
            $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
            $dashboardUrl = $frontendUrl . '/profil';
            try {
                Mail::to($user->email)->send(new RoleUpgradeApproved($upgradeReq, $user, $dashboardUrl));
            } catch (\Throwable $e) {
                \Log::warning('Gagal kirim email RoleUpgradeApproved: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => $targetMessage]);
    }

    /**
     * POST /api/admin/role-upgrade-requests/{id}/reject
     */
    public function reject(Request $request, $id)
    {
        $upgradeReq = RoleUpgradeRequest::findOrFail($id);

        if ($upgradeReq->status !== 'pending') {
            return response()->json(['message' => 'Pengajuan ini sudah diproses.'], 422);
        }

        $upgradeReq->update([
            'status'         => 'rejected',
            'catatan_admin'  => $request->input('catatan_admin'),
            'reviewed_by'    => $request->user()->id,
            'reviewed_at'    => now(),
        ]);

        // Kirim email notifikasi ke pengguna
        $user = User::find($upgradeReq->user_id);
        if ($user && $user->email) {
            $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
            $dashboardUrl = $frontendUrl . '/profil';
            $reason = $request->input('catatan_admin');
            try {
                Mail::to($user->email)->send(new RoleUpgradeRejected($upgradeReq, $user, $reason, $dashboardUrl));
            } catch (\Throwable $e) {
                \Log::warning('Gagal kirim email RoleUpgradeRejected: ' . $e->getMessage());
            }
        }

        return response()->json(['message' => 'Pengajuan ditolak.']);
    }
}
