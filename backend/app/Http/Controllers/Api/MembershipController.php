<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\MembershipService;
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
     * Get current membership status
     */
    public function status(): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            $status = $this->membershipService->getMembershipStatus($user);

            return response()->json([
                'status' => 'success',
                'data' => $status
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get premium pricing for current user
     */
    public function pricing(): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            $pricing = $this->membershipService->calculatePremiumPrice($user);

            return response()->json([
                'status' => 'success',
                'data' => $pricing
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upgrade to premium (create transaction)
     */
    public function upgrade(): JsonResponse
    {
        try {
            $user = auth()->user();

            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            // Check if user already has active premium
            if ($user->isPremium()) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda sudah memiliki paket Premium yang aktif'
                ], 400);
            }

            $transaction = $this->membershipService->upgradeToPremium($user);

            return response()->json([
                'status' => 'success',
                'message' => 'Transaksi upgrade premium berhasil dibuat',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'reference_code' => $transaction->reference_code,
                    'package' => $transaction->package,
                    'type' => $transaction->type,
                    'total_price' => $transaction->total_price,
                    'discount' => $transaction->discount,
                    'started_at' => $transaction->started_at,
                    'expires_at' => $transaction->expires_at,
                    'payment_status' => $transaction->payment_status,
                ]
            ]);
        } catch (Exception $e) {
            \Log::error('Membership upgrade error', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Renew premium membership (create transaction)
     */
    public function renew(): JsonResponse
    {
        try {
            $user = auth()->user();
            $transaction = $this->membershipService->renewPremium($user);

            return response()->json([
                'status' => 'success',
                'message' => 'Transaksi perpanjangan premium berhasil dibuat',
                'data' => [
                    'transaction_id' => $transaction->id,
                    'reference_code' => $transaction->reference_code,
                    'package' => $transaction->package,
                    'type' => $transaction->type,
                    'total_price' => $transaction->total_price,
                    'discount' => $transaction->discount,
                    'started_at' => $transaction->started_at,
                    'expires_at' => $transaction->expires_at,
                    'payment_status' => $transaction->payment_status,
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Process payment callback (webhook)
     */
    public function paymentCallback(Request $request): JsonResponse
    {
        try {
            $transactionId = $request->input('transaction_id');
            $paymentStatus = $request->input('payment_status'); // 'success', 'failed', 'cancelled'

            $transaction = MembershipTransaction::findOrFail($transactionId);

            if ($paymentStatus === 'success') {
                $this->membershipService->processSuccessfulPayment($transaction);
                $message = 'Pembayaran berhasil, membership telah diaktifkan';
            } elseif ($paymentStatus === 'failed') {
                $this->membershipService->processFailedPayment($transaction);
                $message = 'Pembayaran gagal';
            } elseif ($paymentStatus === 'cancelled') {
                $this->membershipService->cancelTransaction($transaction);
                $message = 'Pembayaran dibatalkan';
            } else {
                throw new Exception('Status pembayaran tidak valid');
            }

            return response()->json([
                'status' => 'success',
                'message' => $message
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get point transaction history
     */
    public function pointHistory(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $limit = $request->input('limit', 10);

            $history = $this->membershipService->getPointHistory($user, $limit);

            return response()->json([
                'status' => 'success',
                'data' => $history
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get membership transaction history
     */
    public function membershipHistory(Request $request): JsonResponse
    {
        try {
            $user = auth()->user();
            $limit = $request->input('limit', 10);

            $history = $this->membershipService->getMembershipHistory($user, $limit);

            return response()->json([
                'status' => 'success',
                'data' => $history
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Cancel pending transaction
     */
    public function cancelTransaction(Request $request, $transactionId): JsonResponse
    {
        try {
            $user = auth()->user();
            $transaction = MembershipTransaction::where('user_id', $user->id)
                ->findOrFail($transactionId);

            $this->membershipService->cancelTransaction($transaction);

            return response()->json([
                'status' => 'success',
                'message' => 'Transaksi berhasil dibatalkan'
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 400);
        }
    }

    /**
     * Get single membership transaction by ID or reference code
     */
    public function showTransaction($id): JsonResponse
    {
        try {
            $user = auth()->user();
            if (!$user) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'User tidak terautentikasi'
                ], 401);
            }

            $transaction = $user->membershipTransactions()
                ->where(function($q) use ($id) {
                    $q->where('id', $id)->orWhere('reference_code', $id);
                })
                ->first();

            if (!$transaction) {
                // Fallback to Order model if searched with order reference or ID
                $order = \App\Models\Order::where('user_id', $user->id)
                    ->where(function($q) use ($id) {
                        $q->where('id', $id)->orWhere('reference_code', $id);
                    })
                    ->with('package:id,name,price')
                    ->first();

                if ($order) {
                    return response()->json([
                        'status' => 'success',
                        'data' => [
                            'id' => $order->id,
                            'reference_code' => $order->reference_code,
                            'package' => $order->package_name ?? $order->package?->name ?? 'Premium',
                            'type' => 'membership',
                            'formatted_type' => 'Langganan Paket',
                            'price' => $order->original_price ?? $order->amount,
                            'discount' => $order->discount_percentage ?? 0,
                            'discount_amount' => $order->discount_amount ?? 0,
                            'total_price' => $order->amount,
                            'started_at' => $order->created_at,
                            'expires_at' => null,
                            'payment_status' => $order->status,
                            'payment_method' => $order->payment_type ?? 'Transfer Bank',
                            'is_active' => in_array($order->status, ['verified', 'paid']),
                            'remaining_days' => 365,
                            'created_at' => $order->created_at,
                            'user' => [
                                'name' => $user->name,
                                'email' => $user->email,
                                'phone' => $user->phone ?? null,
                            ],
                        ]
                    ]);
                }

                return response()->json([
                    'status' => 'error',
                    'message' => 'Transaksi tidak ditemukan'
                ], 404);
            }

            return response()->json([
                'status' => 'success',
                'data' => [
                    'id' => $transaction->id,
                    'reference_code' => $transaction->reference_code,
                    'package' => $transaction->package,
                    'type' => $transaction->type,
                    'formatted_type' => $transaction->formatted_type,
                    'price' => $transaction->price,
                    'discount' => $transaction->discount,
                    'discount_amount' => $transaction->discount_amount,
                    'total_price' => $transaction->total_price,
                    'started_at' => $transaction->started_at,
                    'expires_at' => $transaction->expires_at,
                    'payment_status' => $transaction->payment_status,
                    'payment_method' => 'Membership Transaction',
                    'is_active' => $transaction->is_active,
                    'remaining_days' => $transaction->remaining_days,
                    'created_at' => $transaction->created_at,
                    'user' => [
                        'name' => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone ?? null,
                    ]
                ]
            ]);
        } catch (Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}
