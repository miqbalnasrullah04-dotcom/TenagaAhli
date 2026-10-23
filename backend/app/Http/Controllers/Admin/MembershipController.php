<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\MembershipService;
use App\Models\User;
use App\Models\PointTransaction;
use App\Models\MembershipTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Exception;

class MembershipController extends Controller
{
    protected $membershipService;

    public function __construct(MembershipService $membershipService)
    {
        $this->membershipService = $membershipService;
    }

    /**
     * Get membership statistics for admin dashboard
     */
    public function statistics(): JsonResponse
    {
        try {
            $stats = $this->membershipService->getAdminStatistics();

            return response()->json([
                'status' => 'success',
                'data' => $stats
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all users with their membership info
     */
    public function users(Request $request): JsonResponse
    {
        try {
            $perPage = $request->input('per_page', 15);
            $search = $request->input('search');
            $package = $request->input('package');
            $level = $request->input('level');

            $query = User::query()
                ->select(['id', 'name', 'email', 'package', 'premium_started_at', 'premium_expires_at', 'points', 'membership_level', 'created_at']);

            if ($search) {
                $query->where(function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('email', 'LIKE', "%{$search}%");
                });
            }

            if ($package) {
                if ($package === 'expired') {
                    // Special filter for expired premium/ekonomis/ekslusif
                    $query->whereIn('package', ['premium', 'platinum', 'ekonomis', 'eksklusif', 'ekslusif', 'esklusif'])
                          ->where('premium_expires_at', '<=', now());
                } else {
                    $query->where('package', $package);
                }
            }

            if ($level) {
                $query->where('membership_level', $level);
            }

            $users = $query->orderBy('created_at', 'desc')->paginate($perPage);

            // Add additional info to each user and ensure data consistency
            $users->getCollection()->transform(function ($user) {
                // Ensure level is calculated correctly
                $calculatedLevel = $user->calculateLevel();
                if ($user->membership_level !== $calculatedLevel) {
                    $user->membership_level = $calculatedLevel;
                    $user->save();
                }

                // Check if paid package should be expired
                $isPremium = $user->isPremium();
                if (in_array($user->package, ['premium', 'platinum', 'ekonomis', 'eksklusif', 'ekslusif', 'esklusif']) && !$isPremium) {
                    $user->package = 'free';
                    $user->save();
                }

                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'package' => $user->package,
                    'is_premium' => $isPremium,
                    'premium_started_at' => $user->premium_started_at,
                    'premium_expires_at' => $user->premium_expires_at,
                    'remaining_days' => $user->getPremiumRemainingDays(),
                    'points' => $user->points,
                    'membership_level' => $user->membership_level,
                    'level_display_name' => $user->getLevelDisplayName(),
                    'level_badge_color' => $user->getLevelBadgeColor(),
                    'discount_percentage' => $user->getDiscountPercentage(),
                    'created_at' => $user->created_at,
                    // Add next level info for admin
                    'next_level_info' => $user->getNextLevelInfo(),
                ];
            });

            return response()->json([
                'status' => 'success',
                'data' => $users
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get user detail with membership info
     */
    public function userDetail($userId): JsonResponse
    {
        try {
            $user = User::findOrFail($userId);
            $membershipStatus = $this->membershipService->getMembershipStatus($user);
            $pointHistory = $this->membershipService->getPointHistory($user, 20);
            $membershipHistory = $this->membershipService->getMembershipHistory($user, 10);

            return response()->json([
                'status' => 'success',
                'data' => [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'created_at' => $user->created_at,
                    ],
                    'membership' => $membershipStatus,
                    'point_history' => $pointHistory,
                    'membership_history' => $membershipHistory,
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
     * Get all point transactions
     */
    public function pointTransactions(Request $request): JsonResponse
    {
        try {
            $perPage = $request->input('per_page', 15);
            $userId = $request->input('user_id');
            $type = $request->input('type');

            $query = PointTransaction::with('user:id,name,email')
                ->orderBy('created_at', 'desc');

            if ($userId) {
                $query->where('user_id', $userId);
            }

            if ($type) {
                $query->where('type', $type);
            }

            $transactions = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $transactions
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all membership transactions
     */
    public function membershipTransactions(Request $request): JsonResponse
    {
        try {
            $perPage = $request->input('per_page', 15);
            $userId = $request->input('user_id');
            $type = $request->input('type');
            $paymentStatus = $request->input('payment_status');

            $query = MembershipTransaction::with('user:id,name,email')
                ->orderBy('created_at', 'desc');

            if ($userId) {
                $query->where('user_id', $userId);
            }

            if ($type) {
                $query->where('type', $type);
            }

            if ($paymentStatus) {
                $query->where('payment_status', $paymentStatus);
            }

            $transactions = $query->paginate($perPage);

            return response()->json([
                'status' => 'success',
                'data' => $transactions
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Process expired memberships
     */
    public function processExpired(): JsonResponse
    {
        try {
            $expiredCount = $this->membershipService->checkExpiredMemberships();

            return response()->json([
                'status' => 'success',
                'message' => "Berhasil memproses {$expiredCount} membership yang expired",
                'data' => ['expired_count' => $expiredCount]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
