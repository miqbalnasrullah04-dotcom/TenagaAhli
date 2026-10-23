<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Expert;
use App\Models\ProductPurchase;
use App\Models\Withdrawal;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class WithdrawalController extends Controller
{
    /**
     * Get expert's comprehensive earnings statistics and wallet details.
     * GET /api/my/earnings
     */
    public function getEarningsStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();

        if (!$expert) {
            return response()->json([
                'success' => false,
                'message' => 'Profil tenaga ahli tidak ditemukan.'
            ], 404);
        }

        // 1. Ambil seluruh transaksi produk yang telah selesai
        $completedSales = ProductPurchase::where('expert_id', $expert->id)
            ->where('status', 'completed')
            ->with(['product:id,title,price,discount_price', 'user:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->get();

        $totalGrossRevenue = 0;
        $totalNetRevenue = 0;
        $totalCommission = 0;

        foreach ($completedSales as $sale) {
            $price = $sale->amount_idr ?: ($sale->product?->discount_price ?? $sale->product?->price ?? 0);
            $sellerEarned = $sale->seller_amount ?: ($price * 0.90);
            $commission = $sale->admin_amount ?: ($price * 0.10);

            $totalGrossRevenue += $price;
            $totalNetRevenue += $sellerEarned;
            $totalCommission += $commission;
        }

        // 2. Ambil statistik penarikan dana (Withdrawals)
        $withdrawals = Withdrawal::where('expert_id', $expert->id)
            ->orderBy('created_at', 'desc')
            ->get();

        $totalWithdrawn = $withdrawals->where('status', 'approved')->sum('amount');
        $pendingWithdrawalAmount = $withdrawals->where('status', 'pending')->sum('amount');
        $walletBalance = (float) ($expert->wallet_balance ?? 0);

        // 3. Statistik Bulan Ini & Bulan Lalu
        $now = Carbon::now();
        $currentMonthSales = $completedSales->filter(function ($s) use ($now) {
            return Carbon::parse($s->created_at)->isSameMonth($now);
        });
        $lastMonthSales = $completedSales->filter(function ($s) use ($now) {
            return Carbon::parse($s->created_at)->isSameMonth($now->copy()->subMonth());
        });

        $currentMonthNet = $currentMonthSales->sum(fn($s) => $s->seller_amount ?: ($s->amount_idr * 0.9));
        $lastMonthNet = $lastMonthSales->sum(fn($s) => $s->seller_amount ?: ($s->amount_idr * 0.9));

        $growthPercentage = $lastMonthNet > 0
            ? round((($currentMonthNet - $lastMonthNet) / $lastMonthNet) * 100, 1)
            : ($currentMonthNet > 0 ? 100.0 : 0.0);

        // 4. Format riwayat transaksi gabungan (Penjualan & Penarikan)
        $recentTransactions = [];

        foreach ($completedSales->take(15) as $s) {
            $price = $s->amount_idr ?: ($s->product?->discount_price ?? $s->product?->price ?? 0);
            $recentTransactions[] = [
                'id' => 'SALE-' . $s->id,
                'ref' => $s->reference_code,
                'type' => 'sale',
                'title' => 'Penjualan: ' . ($s->product?->title ?? $s->product_title ?? 'Produk Digital/Fisik'),
                'buyer' => $s->user?->name ?? $s->recipient_name ?? 'Pembeli',
                'gross' => (int) $price,
                'commission' => (int) ($s->admin_amount ?: ($price * 0.10)),
                'net' => (int) ($s->seller_amount ?: ($price * 0.90)),
                'date' => $s->created_at->format('Y-m-d H:i:s'),
                'status' => 'completed',
            ];
        }

        foreach ($withdrawals->take(10) as $w) {
            $recentTransactions[] = [
                'id' => 'WD-' . $w->id,
                'ref' => 'WD-' . str_pad($w->id, 5, '0', STR_PAD_LEFT),
                'type' => 'withdrawal',
                'title' => 'Penarikan Dana (' . $w->bank_name . ')',
                'buyer' => $w->account_holder_name . ' (' . $w->account_number . ')',
                'gross' => (int) $w->amount,
                'commission' => 0,
                'net' => -(int) $w->amount,
                'date' => $w->created_at->format('Y-m-d H:i:s'),
                'status' => $w->status,
                'proof_image' => $w->proof_image ? asset('storage/' . $w->proof_image) : null,
                'admin_notes' => $w->admin_notes,
            ];
        }

        // Urutkan berdasarkan tanggal terbaru
        usort($recentTransactions, function ($a, $b) {
            return strtotime($b['date']) - strtotime($a['date']);
        });

        return response()->json([
            'success' => true,
            'data' => [
                'wallet_balance' => $walletBalance,
                'total_earned' => (float) ($expert->total_earned ?? $totalNetRevenue),
                'total_gross_revenue' => $totalGrossRevenue,
                'total_commission' => $totalCommission,
                'total_net_revenue' => $totalNetRevenue,
                'total_withdrawn' => $totalWithdrawn,
                'pending_withdrawal_amount' => $pendingWithdrawalAmount,
                'total_sales_count' => $completedSales->count(),
                'current_month' => [
                    'total_gross' => $currentMonthSales->sum(fn($s) => $s->amount_idr ?: $s->product?->price),
                    'total_net' => $currentMonthNet,
                    'sales_count' => $currentMonthSales->count(),
                    'growth_percentage' => $growthPercentage,
                ],
                'last_month' => [
                    'total_net' => $lastMonthNet,
                    'sales_count' => $lastMonthSales->count(),
                ],
                'recent_transactions' => array_slice($recentTransactions, 0, 20),
            ]
        ]);
    }

    /**
     * Get user's withdrawal request history.
     * GET /api/my/withdrawals
     */
    public function myWithdrawals(Request $request): JsonResponse
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();

        if (!$expert) {
            return response()->json([
                'success' => false,
                'message' => 'Profil tenaga ahli tidak ditemukan.'
            ], 404);
        }

        $withdrawals = Withdrawal::where('expert_id', $expert->id)
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($w) {
                return [
                    'id' => $w->id,
                    'ref' => 'WD-' . str_pad($w->id, 5, '0', STR_PAD_LEFT),
                    'amount' => (int) $w->amount,
                    'bank_name' => $w->bank_name,
                    'account_number' => $w->account_number,
                    'account_holder_name' => $w->account_holder_name,
                    'status' => $w->status,
                    'notes' => $w->notes,
                    'admin_notes' => $w->admin_notes,
                    'proof_image' => $w->proof_image ? asset('storage/' . $w->proof_image) : null,
                    'created_at' => $w->created_at->format('Y-m-d H:i'),
                    'processed_at' => $w->processed_at ? $w->processed_at->format('Y-m-d H:i') : null,
                ];
            });

        return response()->json([
            'success' => true,
            'wallet_balance' => (float) $expert->wallet_balance,
            'data' => $withdrawals
        ]);
    }

    /**
     * Submit a new withdrawal request.
     * POST /api/my/withdrawals
     */
    public function requestWithdrawal(Request $request): JsonResponse
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();

        if (!$expert) {
            return response()->json(['message' => 'Profil tenaga ahli tidak ditemukan.'], 404);
        }

        $validator = Validator::make($request->all(), [
            'amount' => ['required', 'numeric', 'min:50000'],
            'bank_name' => ['required', 'string', 'max:100'],
            'account_number' => ['required', 'string', 'max:50'],
            'account_holder_name' => ['required', 'string', 'max:150'],
            'notes' => ['nullable', 'string', 'max:300'],
        ], [
            'amount.min' => 'Minimal penarikan dana adalah Rp 50.000.',
            'amount.required' => 'Nominal penarikan wajib diisi.',
            'bank_name.required' => 'Nama bank wajib dipilih/diisi.',
            'account_number.required' => 'Nomor rekening tujuan wajib diisi.',
            'account_holder_name.required' => 'Nama pemilik rekening wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $amount = (float) $request->amount;
        $currentBalance = (float) $expert->wallet_balance;

        if ($amount > $currentBalance) {
            return response()->json([
                'message' => 'Saldo dompet tidak mencukupi. Saldo Anda saat ini: Rp ' . number_format($currentBalance, 0, ',', '.')
            ], 422);
        }

        DB::beginTransaction();
        try {
            // Potong saldo dompet
            $expert->decrement('wallet_balance', $amount);

            $withdrawal = Withdrawal::create([
                'user_id' => $user->id,
                'expert_id' => $expert->id,
                'amount' => $amount,
                'bank_name' => $request->bank_name,
                'account_number' => $request->account_number,
                'account_holder_name' => $request->account_holder_name,
                'status' => 'pending',
                'notes' => $request->notes,
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Permintaan penarikan dana sebesar Rp ' . number_format($amount, 0, ',', '.') . ' berhasil diajukan dan sedang diproses oleh admin.',
                'data' => $withdrawal,
                'remaining_wallet_balance' => (float) $expert->fresh()->wallet_balance,
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal memproses penarikan dana: ' . $e->getMessage()], 500);
        }
    }

    // =========================================================================
    // ADMIN ENDPOINTS
    // =========================================================================

    /**
     * Admin: Get all withdrawal requests.
     * GET /api/admin/withdrawals
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $admin = $request->user();
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $query = Withdrawal::with(['user:id,name,email,phone', 'expert:id,name,email,phone,institution', 'processedByAdmin:id,name'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }

        $withdrawals = $query->get()->map(function ($w) {
            return [
                'id' => $w->id,
                'ref' => 'WD-' . str_pad($w->id, 5, '0', STR_PAD_LEFT),
                'amount' => (int) $w->amount,
                'bank_name' => $w->bank_name,
                'account_number' => $w->account_number,
                'account_holder_name' => $w->account_holder_name,
                'status' => $w->status,
                'notes' => $w->notes,
                'admin_notes' => $w->admin_notes,
                'proof_image' => $w->proof_image ? asset('storage/' . $w->proof_image) : null,
                'user' => [
                    'id' => $w->user->id,
                    'name' => $w->user->name,
                    'email' => $w->user->email,
                    'phone' => $w->user->phone,
                ],
                'expert' => [
                    'id' => $w->expert?->id,
                    'name' => $w->expert?->name,
                    'institution' => $w->expert?->institution,
                ],
                'created_at' => $w->created_at->format('Y-m-d H:i:s'),
                'processed_at' => $w->processed_at ? $w->processed_at->format('Y-m-d H:i:s') : null,
                'processed_by' => $w->processedByAdmin?->name,
            ];
        });

        $stats = [
            'total_requests' => $withdrawals->count(),
            'pending_count' => $withdrawals->where('status', 'pending')->count(),
            'pending_amount' => $withdrawals->where('status', 'pending')->sum('amount'),
            'approved_count' => $withdrawals->where('status', 'approved')->count(),
            'approved_amount' => $withdrawals->where('status', 'approved')->sum('amount'),
            'rejected_count' => $withdrawals->where('status', 'rejected')->count(),
        ];

        return response()->json([
            'success' => true,
            'stats' => $stats,
            'data' => $withdrawals
        ]);
    }

    /**
     * Admin: Approve withdrawal request & upload proof.
     * POST /api/admin/withdrawals/{id}/approve
     */
    public function adminApprove(Request $request, $id): JsonResponse
    {
        $admin = $request->user();
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $withdrawal = Withdrawal::with('expert')->findOrFail($id);

        if ($withdrawal->status !== 'pending') {
            return response()->json(['message' => 'Status penarikan harus pending.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'proof_image' => ['nullable', 'file', 'mimes:jpg,jpeg,png,pdf', 'max:5120'],
            'admin_notes' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $proofPath = null;
        if ($request->hasFile('proof_image')) {
            $file = $request->file('proof_image');
            $filename = 'payout_' . $withdrawal->id . '_' . time() . '.' . $file->getClientOriginalExtension();
            $proofPath = $file->storeAs('withdrawals/proofs', $filename, 'public');
        }

        $withdrawal->update([
            'status' => 'approved',
            'proof_image' => $proofPath ?? $withdrawal->proof_image,
            'admin_notes' => $request->admin_notes ?: 'Transfer berhasil diproses oleh Admin.',
            'processed_by_admin' => $admin->id,
            'processed_at' => now(),
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Penarikan dana berhasil disetujui dan bukti transfer tersimpan.',
            'data' => $withdrawal,
        ]);
    }

    /**
     * Admin: Reject withdrawal request & refund wallet balance.
     * POST /api/admin/withdrawals/{id}/reject
     */
    public function adminReject(Request $request, $id): JsonResponse
    {
        $admin = $request->user();
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $withdrawal = Withdrawal::with('expert')->findOrFail($id);

        if ($withdrawal->status !== 'pending') {
            return response()->json(['message' => 'Status penarikan harus pending.'], 422);
        }

        $validator = Validator::make($request->all(), [
            'admin_notes' => ['required', 'string', 'max:500'],
        ], [
            'admin_notes.required' => 'Alasan penolakan wajib diisi agar tenaga ahli mengetahui alasannya.'
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        DB::beginTransaction();
        try {
            // Refund dana kembali ke wallet tenaga ahli
            if ($withdrawal->expert) {
                $withdrawal->expert->increment('wallet_balance', $withdrawal->amount);
            }

            $withdrawal->update([
                'status' => 'rejected',
                'admin_notes' => $request->admin_notes,
                'processed_by_admin' => $admin->id,
                'processed_at' => now(),
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Penarikan dana ditolak dan saldo Rp ' . number_format($withdrawal->amount, 0, ',', '.') . ' telah dikembalikan ke dompet tenaga ahli.',
                'data' => $withdrawal,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['message' => 'Gagal menolak penarikan: ' . $e->getMessage()], 500);
        }
    }
}
