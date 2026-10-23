<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Mail\RegistrationApproved;
use App\Mail\RegistrationRejected;
use App\Models\Expert;
use App\Models\Order;
use App\Models\Package;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Exception;

class SurveyorController extends Controller
{
    /**
     * Helper query scope for surveyor records
     */
    private function surveyorFilter()
    {
        return function ($q) {
            $q->whereHas('user', function ($uq) {
                $uq->where('role_type', 'surveyor');
            })
            ->orWhere('kriteria', 'LIKE', '%Surveyor%')
            ->orWhere('kriteria_list', 'LIKE', '%Surveyor%')
            ->orWhere('field', 'LIKE', '%Surveyor%');
        };
    }

    /**
     * Get all surveyors with their info
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search') ?: $request->input('keyword');
            $status = $request->input('status');

            $query = Expert::with([
                'user:id,name,email,role,role_type,membership_level,package,premium_expires_at',
                'package:id,name,slug,price',
                'educations',
                'experiences',
                'certificates',
                'documents'
            ])
            ->where($this->surveyorFilter())
            ->orderBy('created_at', 'desc');

            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%")
                      ->orWhere('institution', 'LIKE', "%{$search}%")
                      ->orWhere('field', 'LIKE', "%{$search}%");
                });
            }

            if ($status && $status !== 'all') {
                if ($status === 'pembaruan_profil') {
                    $query->where('update_status', 'menunggu_verifikasi');
                } else {
                    $query->where('profile_status', $status);
                }
            }

            $surveyors = $query->paginate($perPage);

            // Add additional info to each surveyor
            $surveyors->getCollection()->transform(function ($surveyor) {
                $photoUrl = null;
                if ($surveyor->photo) {
                    $photoUrl = filter_var($surveyor->photo, FILTER_VALIDATE_URL)
                        ? $surveyor->photo
                        : asset('storage/' . $surveyor->photo);
                }

                $coverUrl = null;
                if ($surveyor->cover) {
                    $coverUrl = filter_var($surveyor->cover, FILTER_VALIDATE_URL)
                        ? $surveyor->cover
                        : asset('storage/' . $surveyor->cover);
                }

                return [
                    'id' => $surveyor->id,
                    'name' => $surveyor->name,
                    'slug' => $surveyor->slug,
                    'email' => $surveyor->email,
                    'phone' => $surveyor->phone,
                    'field' => $surveyor->field,
                    'institution' => $surveyor->institution,
                    'kriteria' => $surveyor->kriteria,
                    'kriteria_list' => $surveyor->kriteria_list,
                    'location' => $surveyor->location,
                    'alamat_kota' => $surveyor->alamat_kota,
                    'alamat_provinsi' => $surveyor->alamat_provinsi,
                    'alamat_lengkap' => $surveyor->alamat_lengkap,
                    'tempat_lahir' => $surveyor->tempat_lahir,
                    'tanggal_lahir' => $surveyor->tanggal_lahir,
                    'pendidikan' => $surveyor->pendidikan,
                    'catatan' => $surveyor->catatan,
                    'tentang_saya' => $surveyor->tentang_saya,
                    'ringkasan_keahlian' => $surveyor->ringkasan_keahlian,
                    'photo' => $photoUrl,
                    'cover' => $coverUrl,
                    'profile_status' => $surveyor->profile_status,
                    'update_status' => $surveyor->update_status,
                    'pending_changes' => $surveyor->pending_changes,
                    'update_reject_reason' => $surveyor->update_reject_reason,
                    'reject_reason' => $surveyor->reject_reason,
                    'verified' => (bool)$surveyor->verified,
                    'featured' => (bool)$surveyor->featured,
                    'is_surveyor' => true,
                    'role_label' => 'Surveyor',
                    'package' => $surveyor->package,
                    'package_id' => $surveyor->package_id,
                    'user' => $surveyor->user,
                    'educations' => $surveyor->educations,
                    'experiences' => $surveyor->experiences,
                    'certificates' => $surveyor->certificates,
                    'documents' => $surveyor->documents,
                    'created_at' => $surveyor->created_at,
                    'updated_at' => $surveyor->updated_at,
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $surveyors
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get surveyor statistics for admin dashboard
     */
    public function statistics(): JsonResponse
    {
        try {
            $filter = $this->surveyorFilter();

            $totalSurveyors = Expert::where($filter)->count();
            $activeSurveyors = Expert::where('profile_status', 'aktif')->where($filter)->count();
            $pendingVerification = Expert::where('profile_status', 'menunggu_verifikasi')->where($filter)->count();
            $rejectedSurveyors = Expert::where('profile_status', 'ditolak')->where($filter)->count();

            // Surveyor premium: yang punya package berbayar
            $premiumSurveyors = Expert::whereHas('package', function($q) {
                    $q->where('price', '>', 0);
                })
                ->where($filter)
                ->count();

            // Free surveyors
            $freeSurveyors = max(0, $activeSurveyors - $premiumSurveyors);

            $pendingUpdate = Expert::where('update_status', 'menunggu_verifikasi')->where($filter)->count();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'total_surveyors' => $totalSurveyors,
                    'active_surveyors' => $activeSurveyors,
                    'pending_verification' => $pendingVerification,
                    'pending_update' => $pendingUpdate,
                    'rejected_surveyors' => $rejectedSurveyors,
                    'premium_surveyors' => $premiumSurveyors,
                    'free_surveyors' => $freeSurveyors,
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get surveyor detail with additional info
     */
    public function show($id): JsonResponse
    {
        try {
            $surveyor = Expert::with(['user', 'package', 'educations', 'experiences', 'certificates', 'documents'])
                ->where('id', $id)
                ->where($this->surveyorFilter())
                ->firstOrFail();

            $photoUrl = null;
            if ($surveyor->photo) {
                $photoUrl = filter_var($surveyor->photo, FILTER_VALIDATE_URL)
                    ? $surveyor->photo
                    : asset('storage/' . $surveyor->photo);
            }

            $coverUrl = null;
            if ($surveyor->cover) {
                $coverUrl = filter_var($surveyor->cover, FILTER_VALIDATE_URL)
                    ? $surveyor->cover
                    : asset('storage/' . $surveyor->cover);
            }

            $surveyorData = $surveyor->toArray();
            $surveyorData['photo'] = $photoUrl;
            $surveyorData['cover'] = $coverUrl;
            $surveyorData['is_surveyor'] = true;

            // Get surveyor's orders
            $orders = Order::where('user_id', $surveyor->user_id)
                ->with('package:id,name,price')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'status' => 'success',
                'data' => [
                    'surveyor' => $surveyorData,
                    'orders' => $orders,
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Verify surveyor profile
     */
    public function verifyProfile(Request $request, $id): JsonResponse
    {
        try {
            $surveyor = Expert::with('user')->findOrFail($id);

            $surveyor->update([
                'profile_status' => 'aktif',
                'verified' => true,
                'reject_reason' => null
            ]);

            // Auto-assign free package if no package
            if (!$surveyor->package_id) {
                $freePackage = Package::where('price', 0)->first();
                if ($freePackage) {
                    $surveyor->update(['package_id' => $freePackage->id]);
                }
            }

            // Kirim email notifikasi Profil Disetujui
            $recipientEmail = $surveyor->user?->email ?? $surveyor->email;
            if ($recipientEmail) {
                $loginUrl = rtrim(config('app.frontend_url', config('app.url')), '/') . '/sign-in';
                try {
                    Mail::to($recipientEmail)->send(new RegistrationApproved($surveyor, $loginUrl));
                } catch (\Throwable $e) {
                    Log::warning('Gagal kirim email RegistrationApproved surveyor: ' . $e->getMessage());
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Profil surveyor berhasil disetujui.',
                'data' => $surveyor
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reject surveyor profile
     */
    public function rejectProfile(Request $request, $id): JsonResponse
    {
        try {
            $surveyor = Expert::with('user')->findOrFail($id);

            $reason = $request->input('reject_reason', '');

            $surveyor->update([
                'profile_status' => 'ditolak',
                'reject_reason' => $reason,
            ]);

            // Kirim email notifikasi Profil Ditolak / Butuh Perbaikan
            $recipientEmail = $surveyor->user?->email ?? $surveyor->email;
            if ($recipientEmail) {
                $editUrl = rtrim(config('app.frontend_url', config('app.url')), '/') . '/edit-profil';
                try {
                    Mail::to($recipientEmail)->send(new RegistrationRejected($surveyor, $reason, $editUrl));
                } catch (\Throwable $e) {
                    Log::warning('Gagal kirim email RegistrationRejected surveyor: ' . $e->getMessage());
                }
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Profil surveyor telah ditolak/diminta perbaikan.',
                'data' => $surveyor
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Toggle deactivate / activate surveyor
     */
    public function deactivateProfile(Request $request, $id): JsonResponse
    {
        try {
            $surveyor = Expert::findOrFail($id);

            if ($surveyor->profile_status === 'nonaktif') {
                $surveyor->update(['profile_status' => 'aktif']);
            } else {
                $surveyor->update(['profile_status' => 'nonaktif']);
            }

            return response()->json([
                'status' => 'success',
                'message' => 'Status profil berhasil diperbarui.',
                'data' => $surveyor
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Delete surveyor
     */
    public function destroy($id): JsonResponse
    {
        try {
            $surveyor = Expert::findOrFail($id);
            $surveyor->delete();

            return response()->json([
                'status' => 'success',
                'message' => 'Data surveyor berhasil dihapus.'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Approve profile update for surveyor
     */
    public function approveUpdate(Request $request, $id): JsonResponse
     {
         try {
             $expertController = app(\App\Http\Controllers\Api\ExpertController::class);
             $res = $expertController->approveUpdate($request, $id);
             return response()->json($res->getData(), $res->getStatusCode());
         } catch (Exception $e) {
             return response()->json([
                 'status' => 'error',
                 'message' => $e->getMessage()
             ], 500);
         }
     }

    /**
     * Reject profile update for surveyor
     */
     public function rejectUpdate(Request $request, $id): JsonResponse
     {
         try {
             $expertController = app(\App\Http\Controllers\Api\ExpertController::class);
             $res = $expertController->rejectUpdate($request, $id);
             return response()->json($res->getData(), $res->getStatusCode());
         } catch (Exception $e) {
             return response()->json([
                 'status' => 'error',
                 'message' => $e->getMessage()
             ], 500);
         }
     }
}