<?php

namespace App\Services;

use App\Models\PointTransaction;
use App\Models\TopUpPackage;
use App\Models\User;
use Carbon\Carbon;
use Exception;
use Illuminate\Support\Facades\DB;

/**
 * TopUpService — service utama sistem Top Up Point.
 *
 * Bertanggung jawab atas:
 *  1. Membuat transaksi Top Up (pending → menunggu konfirmasi admin)
 *  2. Konfirmasi Top Up manual oleh admin (saldo bertambah)
 *  3. Pembayaran produk menggunakan Point
 *  4. Pembayaran konsultasi menggunakan Point
 *  5. Refund Point
 *  6. Riwayat transaksi Point
 *
 * Dirancang agar mudah menambahkan payment gateway (Midtrans, dll) nanti:
 *  - Struktur transaksi sudah punya status pending/success
 *  - Kolom amount_idr untuk nilai IDR
 *  - Referensi unik untuk invoice
 */
class TopUpService
{
    // =========================================================================
    // Top Up
    // =========================================================================

    /**
     * Buat transaksi Top Up baru (status: pending — menunggu konfirmasi admin).
     *
     * @param  User         $user       User yang melakukan Top Up
     * @param  TopUpPackage $package    Paket Top Up yang dipilih
     * @param  string|null  $notes      Catatan opsional dari user
     * @return PointTransaction
     * @throws Exception
     */
    public function createTopUp(User $user, TopUpPackage $package, ?string $notes = null): PointTransaction
    {
        if (!$package->is_active) {
            throw new Exception('Paket Top Up tidak tersedia.');
        }

        return DB::transaction(function () use ($user, $package, $notes) {
            $transaction = PointTransaction::create([
                'user_id'          => $user->id,
                'type'             => PointTransaction::TYPE_TOPUP,
                'points'           => $package->points,
                'amount_idr'       => $package->price,
                'status'           => PointTransaction::STATUS_PENDING,
                'top_up_package_id'=> $package->id,
                'description'      => "Top Up {$package->points} Point (Rp " . number_format($package->price, 0, ',', '.') . ')',
                'notes'            => $notes,
            ]);

            // Generate Midtrans Snap token
            $serverKey = config('services.midtrans.server_key');
            if ($serverKey && !str_starts_with($serverKey, 'your-')) {
                try {
                    \Midtrans\Config::$serverKey = $serverKey;
                    \Midtrans\Config::$isProduction = config('services.midtrans.is_production', false);
                    \Midtrans\Config::$isSanitized = config('services.midtrans.is_sanitized', true);
                    \Midtrans\Config::$is3ds = config('services.midtrans.is_3ds', true);

                    $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

                    $params = [
                        'transaction_details' => [
                            'order_id' => $transaction->reference_code,
                            'gross_amount' => (int) $package->price,
                        ],
                        'customer_details' => [
                            'first_name' => $user->name,
                            'email' => $user->email,
                            'phone' => $user->phone ?? '',
                        ],
                        'item_details' => [
                            [
                                'id' => 'TOPUP-' . $package->id,
                                'price' => (int) $package->price,
                                'quantity' => 1,
                                'name' => "Top Up {$package->points} Point",
                            ]
                        ],
                        'callbacks' => [
                            'finish' => "{$frontendUrl}/riwayat-point?ref={$transaction->reference_code}&status=success",
                            'error' => "{$frontendUrl}/riwayat-point?ref={$transaction->reference_code}&status=error",
                            'pending' => "{$frontendUrl}/riwayat-point?ref={$transaction->reference_code}&status=pending",
                        ],
                    ];

                    $snapToken = \Midtrans\Snap::getSnapToken($params);
                    $transaction->update(['snap_token' => $snapToken]);
                } catch (\Throwable $e) {
                    \Log::warning('Gagal generate Midtrans Snap Token untuk TopUp: ' . $e->getMessage());
                }
            }

            return $transaction;
        });
    }

    /**
     * Upload bukti pembayaran untuk transaksi Top Up.
     *
     * @param  PointTransaction $transaction  Transaksi Top Up yang belum dikonfirmasi
     * @param  string           $filePath     Path file hasil upload (dari storage)
     * @return PointTransaction
     * @throws Exception
     */
    public function uploadTopUpProof(PointTransaction $transaction, string $filePath): PointTransaction
    {
        if ($transaction->type !== PointTransaction::TYPE_TOPUP) {
            throw new Exception('Transaksi bukan bertipe Top Up.');
        }

        if ($transaction->status !== PointTransaction::STATUS_PENDING) {
            throw new Exception('Transaksi sudah diproses sebelumnya.');
        }

        $transaction->update([
            'proof_of_payment' => $filePath,
            'notes'            => ($transaction->notes ? $transaction->notes . "\n" : '') . 'Bukti pembayaran diunggah pada ' . now()->format('d/m/Y H:i'),
        ]);

        return $transaction->fresh();
    }

    /**
     * Admin mengkonfirmasi Top Up → saldo Point user bertambah.
     *
     * @param  PointTransaction $transaction  Transaksi pending
     * @param  User             $admin        Admin yang mengkonfirmasi
     * @param  string|null      $notes        Catatan admin
     * @return PointTransaction
     * @throws Exception
     */
    public function confirmTopUp(PointTransaction $transaction, User $admin, ?string $notes = null): PointTransaction
    {
        if ($transaction->type !== PointTransaction::TYPE_TOPUP) {
            throw new Exception('Transaksi bukan bertipe Top Up.');
        }

        if ($transaction->status !== PointTransaction::STATUS_PENDING) {
            throw new Exception("Transaksi tidak dapat dikonfirmasi. Status saat ini: {$transaction->status_label}.");
        }

        return DB::transaction(function () use ($transaction, $admin, $notes) {
            // Update status transaksi
            $transaction->update([
                'status'      => PointTransaction::STATUS_SUCCESS,
                'verified_by' => $admin->id,
                'verified_at' => now(),
                'notes'       => $notes ?? $transaction->notes,
            ]);

            // Tambah saldo Point user
            $user = $transaction->user;
            $user->increment('point_balance', $transaction->points);

            return $transaction->fresh()->load('user');
        });
    }

    /**
     * Admin membatalkan transaksi Top Up (belum dikonfirmasi).
     *
     * @param  PointTransaction $transaction
     * @param  User             $admin
     * @param  string|null      $reason  Alasan pembatalan
     * @return PointTransaction
     * @throws Exception
     */
    public function cancelTopUp(PointTransaction $transaction, User $admin, ?string $reason = null): PointTransaction
    {
        if ($transaction->type !== PointTransaction::TYPE_TOPUP) {
            throw new Exception('Transaksi bukan bertipe Top Up.');
        }

        if ($transaction->status !== PointTransaction::STATUS_PENDING) {
            throw new Exception("Hanya transaksi pending yang dapat dibatalkan. Status saat ini: {$transaction->status_label}.");
        }

        $transaction->update([
            'status'      => PointTransaction::STATUS_CANCELLED,
            'verified_by' => $admin->id,
            'verified_at' => now(),
            'notes'       => $reason ?? 'Dibatalkan oleh admin.',
        ]);

        return $transaction->fresh();
    }

    // =========================================================================
    // Pembelian Produk
    // =========================================================================

    /**
     * Bayar produk menggunakan Point.
     *
     * @param  User   $user           User pembeli
     * @param  int    $points         Harga produk dalam Point
     * @param  string $productName    Nama produk
     * @param  int    $relatedId      ID order/produk terkait
     * @param  string $relatedType    Tipe model terkait (misal: 'App\Models\Order')
     * @return PointTransaction
     * @throws Exception
     */
    public function payForProduct(User $user, int $points, string $productName, int $relatedId, string $relatedType): PointTransaction
    {
        return DB::transaction(function () use ($user, $points, $productName, $relatedId, $relatedType) {
            return $user->deductPoints(
                $points,
                PointTransaction::TYPE_PRODUCT_PURCHASE,
                $productName,
                [
                    'related_id'   => $relatedId,
                    'related_type' => $relatedType,
                ]
            );
        });
    }

    // =========================================================================
    // Pembayaran Konsultasi
    // =========================================================================

    /**
     * Bayar konsultasi menggunakan Point.
     *
     * @param  User   $user               User yang konsultasi
     * @param  int    $points             Biaya konsultasi dalam Point
     * @param  string $expertName         Nama tenaga ahli
     * @param  int    $consultationId     ID konsultasi terkait
     * @return PointTransaction
     * @throws Exception
     */
    public function payForConsultation(User $user, int $points, string $expertName, int $consultationId): PointTransaction
    {
        return DB::transaction(function () use ($user, $points, $expertName, $consultationId) {
            return $user->deductPoints(
                $points,
                PointTransaction::TYPE_CONSULTATION,
                $expertName,
                [
                    'related_id'   => $consultationId,
                    'related_type' => 'App\\Models\\Consultation',
                ]
            );
        });
    }

    // =========================================================================
    // Refund
    // =========================================================================

    /**
     * Admin melakukan refund Point ke user.
     *
     * @param  PointTransaction $originalTransaction  Transaksi yang di-refund
     * @param  User             $admin
     * @param  string|null      $reason
     * @return PointTransaction  Transaksi refund baru
     * @throws Exception
     */
    public function refundPoints(PointTransaction $originalTransaction, User $admin, ?string $reason = null): PointTransaction
    {
        if ($originalTransaction->status === PointTransaction::STATUS_REFUNDED) {
            throw new Exception('Transaksi sudah di-refund sebelumnya.');
        }

        if ($originalTransaction->status !== PointTransaction::STATUS_SUCCESS) {
            throw new Exception('Hanya transaksi sukses yang dapat di-refund.');
        }

        $refundPoints = abs($originalTransaction->points);

        if ($refundPoints <= 0) {
            throw new Exception('Tidak ada Point yang dapat di-refund dari transaksi ini.');
        }

        return DB::transaction(function () use ($originalTransaction, $admin, $reason, $refundPoints) {
            // Tandai transaksi asal sebagai refunded
            $originalTransaction->update([
                'status' => PointTransaction::STATUS_REFUNDED,
                'notes'  => ($originalTransaction->notes ? $originalTransaction->notes . "\n" : '') . "Refund oleh admin ({$admin->name}) pada " . now()->format('d/m/Y H:i') . ($reason ? ": {$reason}" : ''),
            ]);

            // Tambah saldo Point user
            $user = $originalTransaction->user;
            $user->increment('point_balance', $refundPoints);

            // Buat transaksi refund
            return PointTransaction::create([
                'user_id'      => $originalTransaction->user_id,
                'type'         => PointTransaction::TYPE_REFUND,
                'points'       => $refundPoints,
                'status'       => PointTransaction::STATUS_SUCCESS,
                'description'  => 'Refund dari transaksi ' . $originalTransaction->reference_code,
                'related_id'   => $originalTransaction->id,
                'related_type' => PointTransaction::class,
                'verified_by'  => $admin->id,
                'verified_at'  => now(),
                'notes'        => $reason,
            ]);
        });
    }

    // =========================================================================
    // Riwayat & Statistik
    // =========================================================================

    /**
     * Riwayat transaksi Point untuk user (semua tipe).
     *
     * @param  User  $user
     * @param  int   $perPage
     * @return \Illuminate\Contracts\Pagination\LengthAwarePaginator
     */
    public function getUserHistory(User $user, int $perPage = 15)
    {
        return PointTransaction::where('user_id', $user->id)
            ->with('topUpPackage:id,name,points,price')
            ->orderByDesc('created_at')
            ->paginate($perPage);
    }

    /**
     * Ringkasan saldo dan statistik Point user.
     */
    public function getUserSummary(User $user): array
    {
        $totalTopUp = PointTransaction::where('user_id', $user->id)
            ->where('type', PointTransaction::TYPE_TOPUP)
            ->where('status', PointTransaction::STATUS_SUCCESS)
            ->sum('points');

        $totalSpent = PointTransaction::where('user_id', $user->id)
            ->whereIn('type', [PointTransaction::TYPE_PRODUCT_PURCHASE, PointTransaction::TYPE_CONSULTATION])
            ->where('status', PointTransaction::STATUS_SUCCESS)
            ->sum(DB::raw('ABS(points)'));

        $totalRefund = PointTransaction::where('user_id', $user->id)
            ->where('type', PointTransaction::TYPE_REFUND)
            ->where('status', PointTransaction::STATUS_SUCCESS)
            ->sum('points');

        $pendingTopUp = PointTransaction::where('user_id', $user->id)
            ->where('type', PointTransaction::TYPE_TOPUP)
            ->where('status', PointTransaction::STATUS_PENDING)
            ->count();

        return [
            'point_balance'     => (int) $user->fresh()->point_balance,
            'total_top_up'      => (int) $totalTopUp,
            'total_spent'       => (int) $totalSpent,
            'total_refund'      => (int) $totalRefund,
            'pending_top_up'    => (int) $pendingTopUp,
        ];
    }

    /**
     * Statistik Top Up untuk admin dashboard.
     */
    public function getAdminStats(): array
    {
        $today = Carbon::today();

        return [
            'total_pending'          => PointTransaction::topUps()->pending()->count(),
            'total_success_today'    => PointTransaction::topUps()->success()->whereDate('verified_at', $today)->count(),
            'total_revenue_today'    => PointTransaction::topUps()->success()->whereDate('verified_at', $today)->sum('amount_idr'),
            'total_revenue_month'    => PointTransaction::topUps()->success()
                ->whereYear('verified_at', $today->year)
                ->whereMonth('verified_at', $today->month)
                ->sum('amount_idr'),
            'total_points_issued'    => PointTransaction::topUps()->success()->sum('points'),
            'total_transactions'     => PointTransaction::count(),
            'product_purchase_count' => PointTransaction::where('type', PointTransaction::TYPE_PRODUCT_PURCHASE)->where('status', PointTransaction::STATUS_SUCCESS)->count(),
            'consultation_count'     => PointTransaction::where('type', PointTransaction::TYPE_CONSULTATION)->where('status', PointTransaction::STATUS_SUCCESS)->count(),
        ];
    }
}
