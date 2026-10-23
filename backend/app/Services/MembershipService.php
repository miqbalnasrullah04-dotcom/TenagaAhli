<?php

namespace App\Services;

use App\Models\User;
use App\Models\MembershipTransaction;
use App\Models\PointTransaction;
use App\Models\Package;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Exception;

class MembershipService
{
    const PREMIUM_PRICE = 200000; // Harga premium 200rb per tahun (sesuai Package)
    const PREMIUM_POINTS_REWARD = 500; // Point yang diberikan saat upgrade/renewal
    const PREMIUM_DURATION_MONTHS = 12; // Durasi premium dalam bulan

    /**
     * Get membership status for user
     */
    public function getMembershipStatus(User $user): array
    {
        return [
            'package'             => $user->package,
            'is_premium'          => $user->isPremium(),
            'premium_started_at'  => $user->premium_started_at,
            'premium_expires_at'  => $user->premium_expires_at,
            'remaining_days'      => $user->getPremiumRemainingDays(),
            'points'              => $user->points,
            'point_balance'       => (int) $user->point_balance,
            'level_display_name'  => $user->getLevelDisplayName(),
            'level_badge_color'   => $user->getLevelBadgeColor(),
            'discount_percentage' => 0,
        ];
    }

    /**
     * Calculate premium price
     */
    public function calculatePremiumPrice(User $user): array
    {
        $originalPrice = self::PREMIUM_PRICE;
        $totalPrice = $originalPrice;

        return [
            'original_price'      => $originalPrice,
            'discount_percentage' => 0,
            'discount_amount'     => 0,
            'total_price'         => $totalPrice,
        ];
    }

    /**
     * Upgrade user to premium (first time)
     */
    public function upgradeToPremium(User $user): MembershipTransaction
    {
        if ($user->isPremium()) {
            throw new Exception('User sudah memiliki paket Premium yang aktif');
        }

        $pricing = $this->calculatePremiumPrice($user);
        $startedAt = Carbon::now();
        $expiresAt = $startedAt->clone()->addMonths(self::PREMIUM_DURATION_MONTHS);

        DB::beginTransaction();
        try {
            // Create membership transaction
            $transaction = MembershipTransaction::create([
                'user_id' => $user->id,
                'package' => 'premium',
                'type' => 'upgrade',
                'price' => $pricing['original_price'],
                'discount' => 0,
                'total_price' => $pricing['total_price'],
                'started_at' => $startedAt,
                'expires_at' => $expiresAt,
                'payment_status' => 'pending',
            ]);

            DB::commit();
            return $transaction;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Renew premium membership
     */
    public function renewPremium(User $user): MembershipTransaction
    {
        if (!$user->isPremium()) {
            throw new Exception('User harus memiliki paket Premium aktif untuk melakukan perpanjangan');
        }

        $pricing = $this->calculatePremiumPrice($user);

        // Perpanjangan dimulai dari tanggal expired yang sekarang
        $startedAt = $user->premium_expires_at;
        $expiresAt = $startedAt->clone()->addMonths(self::PREMIUM_DURATION_MONTHS);

        DB::beginTransaction();
        try {
            // Create membership transaction
            $transaction = MembershipTransaction::create([
                'user_id' => $user->id,
                'package' => 'premium',
                'type' => 'renewal',
                'price' => $pricing['original_price'],
                'discount' => 0,
                'total_price' => $pricing['total_price'],
                'started_at' => $startedAt,
                'expires_at' => $expiresAt,
                'payment_status' => 'pending',
            ]);

            DB::commit();
            return $transaction;
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Process successful payment for membership transaction
     */
    public function processSuccessfulPayment(MembershipTransaction $transaction): void
    {
        if ($transaction->payment_status !== 'pending') {
            throw new Exception('Transaksi sudah diproses sebelumnya');
        }

        DB::beginTransaction();
        try {
            // Update transaction status
            $transaction->update(['payment_status' => 'paid']);

            $user = $transaction->user;

            // Update user membership
            $updateData = [
                'package' => 'premium',
                'premium_expires_at' => $transaction->expires_at,
            ];

            // Set premium_started_at only for first upgrade
            if ($transaction->type === 'upgrade') {
                $updateData['premium_started_at'] = $transaction->started_at;
            }

            $user->update($updateData);

            // Add points reward
            $user->increment('points', self::PREMIUM_POINTS_REWARD);

            // Create point transaction record
            $user->pointTransactions()->create([
                'type' => $transaction->type === 'upgrade' ? 'upgrade_premium' : 'renewal_premium',
                'points' => self::PREMIUM_POINTS_REWARD,
                'description' => $transaction->type === 'upgrade' ? 'Upgrade ke Premium' : 'Perpanjangan Premium',
            ]);

            DB::commit();

            // Send notification email
            if ($user && $user->email) {
                try {
                    $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
                    $formattedExpiry = $transaction->expires_at ? \Carbon\Carbon::parse($transaction->expires_at)->translatedFormat('d F Y') : null;
                    \Illuminate\Support\Facades\Mail::to($user->email)->send(new \App\Mail\PackageUpgradedMail(
                        user: $user,
                        packageName: ucfirst($transaction->package ?? 'Premium'),
                        expiresAt: $formattedExpiry,
                        dashboardUrl: $actionUrl
                    ));
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Gagal kirim email PackageUpgradedMail in MembershipService: ' . $e->getMessage());
                }
            }
        } catch (Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * Process failed payment for membership transaction
     */
    public function processFailedPayment(MembershipTransaction $transaction): void
    {
        $transaction->update(['payment_status' => 'failed']);
    }

    /**
     * Cancel membership transaction
     */
    public function cancelTransaction(MembershipTransaction $transaction): void
    {
        if ($transaction->payment_status === 'paid') {
            throw new Exception('Transaksi yang sudah dibayar tidak dapat dibatalkan');
        }

        $transaction->update(['payment_status' => 'cancelled']);
    }

    /**
     * Check and expire premium memberships
     */
    public function checkExpiredMemberships(): int
    {
        $expiredCount = 0;

        $expiredUsers = User::whereIn('package', ['premium', 'platinum', 'ekonomis', 'eksklusif', 'ekslusif', 'esklusif'])
            ->whereNotNull('premium_expires_at')
            ->where('premium_expires_at', '<', Carbon::now())
            ->get();

        $freePackage = Package::where('slug', 'biasa')->orWhere('price', 0)->first();

        foreach ($expiredUsers as $user) {
            $user->update([
                'package' => 'free',
                'membership_level' => 'basic',
            ]);

            if ($user->expert) {
                $user->expert->update([
                    'package_id' => $freePackage ? $freePackage->id : null,
                    'is_premium' => false,
                    'featured' => false,
                ]);
            }

            $expiredCount++;
        }

        return $expiredCount;
    }

    /**
     * Get point transaction history for user
     */
    public function getPointHistory(User $user, int $limit = 10): array
    {
        $transactions = $user->pointTransactions()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $transactions->map(function ($transaction) {
            return [
                'id' => $transaction->id,
                'type' => $transaction->type,
                'points' => $transaction->points,
                'description' => $transaction->description,
                'formatted_description' => $transaction->formatted_description,
                'created_at' => $transaction->created_at,
            ];
        })->toArray();
    }

    /**
     * Get membership transaction history for user
     */
    public function getMembershipHistory(User $user, int $limit = 10): array
    {
        $transactions = $user->membershipTransactions()
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return $transactions->map(function ($transaction) {
            return [
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
                'payment_method' => 'Membership Transaction', // Add payment_method for frontend compatibility
                'is_active' => $transaction->is_active,
                'remaining_days' => $transaction->remaining_days,
                'created_at' => $transaction->created_at,
            ];
        })->toArray();
    }

    /**
     * Get statistics for admin
     */
    public function getAdminStatistics(): array
    {
        return [
            'total_users' => User::count(),
            'free_users' => User::where('package', 'free')->count(),
            'premium_users' => User::whereIn('package', ['premium', 'platinum', 'ekonomis', 'eksklusif', 'ekslusif'])
                ->where('premium_expires_at', '>', Carbon::now())
                ->count(),
            'expired_premium_users' => User::whereIn('package', ['premium', 'platinum', 'ekonomis', 'eksklusif', 'ekslusif'])
                ->where('premium_expires_at', '<=', Carbon::now())
                ->count(),
            'total_premium_revenue' => MembershipTransaction::where('payment_status', 'paid')->sum('total_price'),
            'monthly_premium_revenue' => MembershipTransaction::where('payment_status', 'paid')
                ->whereMonth('created_at', Carbon::now()->month)
                ->whereYear('created_at', Carbon::now()->year)
                ->sum('total_price'),
            'package_distribution' => [
                'free'     => User::where('package', 'free')->count(),
                'ekonomis' => User::whereIn('package', ['ekonomis', 'premium'])->count(),
                'ekslusif' => User::whereIn('package', ['ekslusif', 'eksklusif', 'platinum'])->count(),
            ],
        ];
    }
}
