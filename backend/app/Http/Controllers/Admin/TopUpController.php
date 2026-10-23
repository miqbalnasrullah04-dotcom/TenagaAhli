<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\PointTransaction;
use App\Models\TopUpPackage;
use App\Models\User;
use App\Services\TopUpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TopUpController extends Controller
{
    public function __construct(protected TopUpService $topUpService) {}

    // =========================================================================
    // Dashboard & Statistik
    // =========================================================================

    /**
     * GET /api/admin/topup/stats
     * Statistik keseluruhan sistem Top Up.
     */
    public function stats(Request $request)
    {
        return response()->json([
            'status' => 'success',
            'data'   => $this->topUpService->getAdminStats(),
        ]);
    }

    // =========================================================================
    // Semua Transaksi
    // =========================================================================

    /**
     * GET /api/admin/topup/transactions
     * Semua transaksi Point (semua tipe, semua user) dengan filter.
     */
    public function transactions(Request $request)
    {
        $query = PointTransaction::with([
            'user:id,name,email,point_balance',
            'topUpPackage:id,name,points,price',
            'verifiedBy:id,name',
        ])->orderByDesc('created_at');

        // Filter tipe
        if ($request->filled('type')) {
            $query->where('type', $request->type);
        }

        // Filter status
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        // Filter user
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->user_id);
        }

        // Filter tanggal
        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->date_to);
        }

        // Search reference code / deskripsi
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('reference_code', 'like', "%{$search}%")
                  ->orWhere('description', 'like', "%{$search}%")
                  ->orWhereHas('user', fn ($u) => $u->where('name', 'like', "%{$search}%")
                                                      ->orWhere('email', 'like', "%{$search}%"));
            });
        }

        $perPage = (int) $request->query('per_page', 20);
        $paginated = $query->paginate(min($perPage, 100));

        $paginated->getCollection()->transform(fn ($t) => $this->formatTransaction($t));

        return response()->json([
            'status' => 'success',
            'data'   => $paginated,
        ]);
    }

    /**
     * GET /api/admin/topup/pending
     * Khusus Top Up yang menunggu konfirmasi.
     */
    public function pending(Request $request)
    {
        $transactions = PointTransaction::topUps()
            ->pending()
            ->with([
                'user:id,name,email,point_balance',
                'topUpPackage:id,name,points,price',
            ])
            ->orderBy('created_at') // FIFO — yang lebih lama duluan
            ->paginate(20);

        $transactions->getCollection()->transform(fn ($t) => $this->formatTransaction($t));

        return response()->json([
            'status' => 'success',
            'data'   => $transactions,
        ]);
    }

    /**
     * GET /api/admin/topup/transactions/{id}
     * Detail satu transaksi.
     */
    public function show(Request $request, $id)
    {
        $transaction = PointTransaction::with([
            'user:id,name,email,point_balance',
            'topUpPackage',
            'verifiedBy:id,name',
        ])->where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('reference_code', $id);
        })->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data'   => $this->formatTransaction($transaction),
        ]);
    }

    // =========================================================================
    // Konfirmasi & Refund (Admin Actions)
    // =========================================================================

    /**
     * POST /api/admin/topup/{id}/confirm
     * Konfirmasi Top Up → saldo Point user bertambah.
     */
    public function confirm(Request $request, $id)
    {
        $transaction = PointTransaction::where('type', PointTransaction::TYPE_TOPUP)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('reference_code', $id);
            })
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'notes' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }

        try {
            $transaction = $this->topUpService->confirmTopUp(
                $transaction,
                $request->user(),
                $request->notes
            );

            return response()->json([
                'status'  => 'success',
                'message' => "Top Up {$transaction->points} Point untuk {$transaction->user->name} berhasil dikonfirmasi. Saldo baru: {$transaction->user->point_balance} Point.",
                'data'    => $this->formatTransaction($transaction),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/admin/topup/{id}/cancel
     * Batalkan Top Up yang masih pending.
     */
    public function cancel(Request $request, $id)
    {
        $transaction = PointTransaction::where('type', PointTransaction::TYPE_TOPUP)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('reference_code', $id);
            })
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }

        try {
            $transaction = $this->topUpService->cancelTopUp(
                $transaction,
                $request->user(),
                $request->reason
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Transaksi Top Up berhasil dibatalkan.',
                'data'    => $this->formatTransaction($transaction),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/admin/topup/{id}/refund
     * Refund Point ke user dari transaksi yang sudah sukses.
     */
    public function refund(Request $request, $id)
    {
        $transaction = PointTransaction::where(function ($q) use ($id) {
            $q->where('id', $id)->orWhere('reference_code', $id);
        })->firstOrFail();

        $validator = Validator::make($request->all(), [
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }

        try {
            $refundTransaction = $this->topUpService->refundPoints(
                $transaction,
                $request->user(),
                $request->reason
            );

            return response()->json([
                'status'  => 'success',
                'message' => "Refund {$refundTransaction->points} Point berhasil. Saldo baru user: {$refundTransaction->user->point_balance} Point.",
                'data'    => $this->formatTransaction($refundTransaction),
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    // =========================================================================
    // Manajemen Paket Top Up
    // =========================================================================

    /**
     * GET /api/admin/topup/packages
     * Semua paket Top Up (admin).
     */
    public function packageIndex(Request $request)
    {
        $packages = TopUpPackage::ordered()->get();

        return response()->json([
            'status' => 'success',
            'data'   => $packages,
        ]);
    }

    /**
     * POST /api/admin/topup/packages
     * Buat paket Top Up baru.
     */
    public function packageStore(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'       => ['required', 'string', 'max:100'],
            'points'     => ['required', 'integer', 'min:1'],
            'price'      => ['required', 'integer', 'min:0'],
            'description'=> ['nullable', 'string', 'max:500'],
            'is_active'  => ['boolean'],
            'is_popular' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first(), 'errors' => $validator->errors()], 422);
        }

        $package = TopUpPackage::create($validator->validated());

        return response()->json([
            'status'  => 'success',
            'message' => 'Paket Top Up berhasil dibuat.',
            'data'    => $package,
        ], 201);
    }

    /**
     * PUT /api/admin/topup/packages/{id}
     * Update paket Top Up.
     */
    public function packageUpdate(Request $request, $id)
    {
        $package = TopUpPackage::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name'       => ['sometimes', 'string', 'max:100'],
            'points'     => ['sometimes', 'integer', 'min:1'],
            'price'      => ['sometimes', 'integer', 'min:0'],
            'description'=> ['nullable', 'string', 'max:500'],
            'is_active'  => ['boolean'],
            'is_popular' => ['boolean'],
            'sort_order' => ['integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'message' => $validator->errors()->first()], 422);
        }

        $package->update($validator->validated());

        return response()->json([
            'status'  => 'success',
            'message' => 'Paket Top Up berhasil diperbarui.',
            'data'    => $package->fresh(),
        ]);
    }

    /**
     * DELETE /api/admin/topup/packages/{id}
     * Hapus paket Top Up (soft-disable saja jika punya transaksi).
     */
    public function packageDestroy(Request $request, $id)
    {
        $package = TopUpPackage::findOrFail($id);

        // Jika masih ada transaksi, nonaktifkan saja
        if ($package->transactions()->exists()) {
            $package->update(['is_active' => false]);
            return response()->json([
                'status'  => 'success',
                'message' => 'Paket Top Up dinonaktifkan karena masih memiliki riwayat transaksi.',
            ]);
        }

        $package->delete();

        return response()->json([
            'status'  => 'success',
            'message' => 'Paket Top Up berhasil dihapus.',
        ]);
    }

    // =========================================================================
    // Daftar User dengan saldo Point
    // =========================================================================

    /**
     * GET /api/admin/topup/users
     * Daftar user dengan saldo Point (dengan search & filter).
     */
    public function users(Request $request)
    {
        $query = User::select('id', 'name', 'email', 'role_type', 'point_balance', 'created_at')
            ->orderByDesc('point_balance');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(fn ($q) => $q->where('name', 'like', "%{$search}%")->orWhere('email', 'like', "%{$search}%"));
        }

        return response()->json([
            'status' => 'success',
            'data'   => $query->paginate(20),
        ]);
    }

    // =========================================================================
    // Helper
    // =========================================================================

    private function formatTransaction(PointTransaction $t): array
    {
        return [
            'id'               => $t->id,
            'reference_code'   => $t->reference_code,
            'type'             => $t->type,
            'type_label'       => $t->type_label,
            'points'           => $t->points,
            'absolute_points'  => $t->absolute_points,
            'is_credit'        => $t->is_credit,
            'amount_idr'       => $t->amount_idr,
            'formatted_amount' => $t->formatted_amount_idr,
            'status'           => $t->status,
            'status_label'     => $t->status_label,
            'description'      => $t->description,
            'notes'            => $t->notes,
            'proof_url'        => $t->proof_url,
            'top_up_package'   => $t->topUpPackage ? [
                'id'     => $t->topUpPackage->id,
                'name'   => $t->topUpPackage->name,
                'points' => $t->topUpPackage->points,
                'price'  => $t->topUpPackage->price,
            ] : null,
            'user'             => $t->user ? [
                'id'            => $t->user->id,
                'name'          => $t->user->name,
                'email'         => $t->user->email,
                'point_balance' => $t->user->point_balance,
            ] : null,
            'verified_by'      => $t->verifiedBy?->name,
            'verified_at'      => $t->verified_at?->toISOString(),
            'created_at'       => $t->created_at?->toISOString(),
        ];
    }
}
