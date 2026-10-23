<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PointTransaction;
use App\Models\TopUpPackage;
use App\Services\TopUpService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TopUpController extends Controller
{
    public function __construct(protected TopUpService $topUpService) {}

    // =========================================================================
    // Paket Top Up
    // =========================================================================

    /**
     * GET /api/topup/packages
     * Daftar paket Top Up yang aktif (publik / terautentikasi).
     */
    public function packages(Request $request)
    {
        $packages = TopUpPackage::active()->ordered()->get()->map(fn ($p) => [
            'id'             => $p->id,
            'name'           => $p->name,
            'points'         => $p->points,
            'price'          => $p->price,
            'formatted_price'=> $p->formatted_price,
            'price_per_point'=> $p->price_per_point,
            'description'    => $p->description,
            'is_popular'     => $p->is_popular,
        ]);

        return response()->json([
            'status' => 'success',
            'data'   => $packages,
        ]);
    }

    // =========================================================================
    // Transaksi Top Up (User)
    // =========================================================================

    /**
     * POST /api/topup
     * User membuat transaksi Top Up baru.
     * Status awal: pending (menunggu upload bukti & konfirmasi admin).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'top_up_package_id' => ['required', 'exists:top_up_packages,id'],
            'notes'             => ['nullable', 'string', 'max:500'],
        ], [
            'top_up_package_id.required' => 'Pilih paket Top Up terlebih dahulu.',
            'top_up_package_id.exists'   => 'Paket Top Up tidak ditemukan.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => $validator->errors()->first(),
                'errors'  => $validator->errors(),
            ], 422);
        }

        $package = TopUpPackage::findOrFail($request->top_up_package_id);

        if (!$package->is_active) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Paket Top Up tidak tersedia.',
            ], 422);
        }

        try {
            $transaction = $this->topUpService->createTopUp(
                $request->user(),
                $package,
                $request->notes
            );

            return response()->json([
                'status'  => 'success',
                'message' => 'Transaksi Top Up berhasil dibuat. Silakan upload bukti pembayaran.',
                'data'    => $this->formatTransaction($transaction),
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'status'  => 'error',
                'message' => $e->getMessage(),
            ], 422);
        }
    }

    /**
     * POST /api/topup/{id}/upload-proof
     * User upload bukti transfer untuk Top Up.
     */
    public function uploadProof(Request $request, $id)
    {
        $transaction = PointTransaction::where('user_id', $request->user()->id)
            ->where('type', PointTransaction::TYPE_TOPUP)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('reference_code', $id);
            })
            ->firstOrFail();

        $validator = Validator::make($request->all(), [
            'proof' => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ], [
            'proof.required' => 'File bukti pembayaran wajib diunggah.',
            'proof.mimes'    => 'Format file harus JPG, JPEG, PNG, WEBP, atau PDF.',
            'proof.max'      => 'Ukuran file maksimal 5 MB.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status'  => 'error',
                'message' => $validator->errors()->first(),
            ], 422);
        }

        try {
            $path        = $request->file('proof')->store('bukti-topup', 'public');
            $transaction = $this->topUpService->uploadTopUpProof($transaction, $path);

            return response()->json([
                'status'  => 'success',
                'message' => 'Bukti pembayaran berhasil diunggah. Menunggu konfirmasi admin.',
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
     * GET /api/topup/history
     * Riwayat semua transaksi Point milik user yang login.
     */
    public function history(Request $request)
    {
        $user    = $request->user();
        $perPage = (int) $request->query('per_page', 15);
        $type    = $request->query('type'); // opsional filter tipe

        $query = PointTransaction::where('user_id', $user->id)
            ->with('topUpPackage:id,name,points,price')
            ->orderByDesc('created_at');

        if ($type && in_array($type, [
            PointTransaction::TYPE_TOPUP,
            PointTransaction::TYPE_PRODUCT_PURCHASE,
            PointTransaction::TYPE_CONSULTATION,
            PointTransaction::TYPE_REFUND,
        ])) {
            $query->where('type', $type);
        }

        $paginated = $query->paginate(min($perPage, 50));

        $paginated->getCollection()->transform(fn ($t) => $this->formatTransaction($t));

        return response()->json([
            'status'  => 'success',
            'summary' => $this->topUpService->getUserSummary($user),
            'data'    => $paginated,
        ]);
    }

    /**
     * GET /api/topup/{id}
     * Detail satu transaksi milik user.
     */
    public function show(Request $request, $id)
    {
        $transaction = PointTransaction::where('user_id', $request->user()->id)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('reference_code', $id);
            })
            ->with('topUpPackage')
            ->firstOrFail();

        return response()->json([
            'status' => 'success',
            'data'   => $this->formatTransaction($transaction),
        ]);
    }

    /**
     * POST /api/topup/{id}/cancel
     * User membatalkan Top Up yang masih pending (sebelum admin konfirmasi).
     */
    public function cancelByUser(Request $request, $id)
    {
        $transaction = PointTransaction::where('user_id', $request->user()->id)
            ->where('type', PointTransaction::TYPE_TOPUP)
            ->where('status', PointTransaction::STATUS_PENDING)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)->orWhere('reference_code', $id);
            })
            ->firstOrFail();

        $transaction->update(['status' => PointTransaction::STATUS_CANCELLED]);

        return response()->json([
            'status'  => 'success',
            'message' => 'Transaksi Top Up berhasil dibatalkan.',
            'data'    => $this->formatTransaction($transaction->fresh()),
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
            'snap_token'       => $t->snap_token,
            'description'      => $t->description,
            'proof_url'        => $t->proof_url,
            'top_up_package'   => $t->topUpPackage ? [
                'id'     => $t->topUpPackage->id,
                'name'   => $t->topUpPackage->name,
                'points' => $t->topUpPackage->points,
                'price'  => $t->topUpPackage->price,
            ] : null,
            'verified_at' => $t->verified_at?->toISOString(),
            'created_at'  => $t->created_at?->toISOString(),
        ];
    }
}
