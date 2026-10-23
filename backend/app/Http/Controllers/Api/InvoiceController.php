<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Article;
use App\Models\Consultation;
use App\Models\MembershipTransaction;
use App\Models\Order;
use App\Models\PointTransaction;
use App\Models\ProductPurchase;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InvoiceController extends Controller
{
    /**
     * GET /api/my/invoices
     * Mendapatkan daftar semua invoice gabungan milik pengguna yang login:
     * - Paket Membership
     * - Sesi Konsultasi
     * - Pembayaran Berita / Publikasi Artikel
     * - Top Up Point
     * - Pembelian Produk Digital / Buku
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $category = $request->query('category', 'all'); // all, membership, konsultasi, berita, topup, produk
        $statusFilter = $request->query('status', 'all'); // all, lunas, pending, rejected

        $invoices = collect();

        // 1. Paket Membership (Orders & MembershipTransactions)
        if ($category === 'all' || $category === 'membership') {
            // Orders
            $orders = Order::where('user_id', $user->id)
                ->with('package:id,name,price')
                ->latest()
                ->get();

            foreach ($orders as $o) {
                $status = $this->normalizeStatus($o->status);
                $ref = $o->reference_code ?: 'ORD-' . str_pad($o->id, 5, '0', STR_PAD_LEFT);
                $invoices->push([
                    'id'               => 'ord_' . $o->id,
                    'raw_id'           => $o->id,
                    'reference_code'   => $ref,
                    'invoice_number'   => 'INV/' . date('Ymd', strtotime($o->created_at)) . '/' . $ref,
                    'category'         => 'membership',
                    'category_label'   => 'Paket Membership',
                    'category_icon'    => 'workspace_premium',
                    'category_color'   => '#8B4513',
                    'category_bg'      => '#FAF4EE',
                    'title'            => 'Paket Keanggotaan ' . ($o->package_name ?: ($o->package?->name ?: 'Membership')),
                    'description'      => 'Aktivasi status keanggotaan ' . ($o->package_name ?: 'Membership') . ' TenagaAhli.com',
                    'amount'           => (int) ($o->amount ?? $o->original_price ?? 0),
                    'total_price'      => (int) ($o->amount ?? 0),
                    'payment_method'   => $this->formatPaymentMethod($o->payment_type),
                    'status'           => $status,
                    'created_at'       => $o->created_at ? $o->created_at->toIso8601String() : null,
                    'verified_at'      => $o->verified_at ? $o->verified_at->toIso8601String() : null,
                ]);
            }

            // MembershipTransactions
            $mTransactions = MembershipTransaction::where('user_id', $user->id)
                ->latest()
                ->get();

            foreach ($mTransactions as $m) {
                // Hindari duplikasi jika reference code sudah ada dari Order
                if ($invoices->contains('reference_code', $m->reference_code)) {
                    continue;
                }
                $status = $this->normalizeStatus($m->payment_status);
                $ref = $m->reference_code ?: 'MBRS-' . str_pad($m->id, 5, '0', STR_PAD_LEFT);
                $invoices->push([
                    'id'               => 'mbrs_' . $m->id,
                    'raw_id'           => $m->id,
                    'reference_code'   => $ref,
                    'invoice_number'   => 'INV/' . date('Ymd', strtotime($m->created_at)) . '/' . $ref,
                    'category'         => 'membership',
                    'category_label'   => 'Paket Membership',
                    'category_icon'    => 'workspace_premium',
                    'category_color'   => '#8B4513',
                    'category_bg'      => '#FAF4EE',
                    'title'            => 'Langganan Membership ' . ($m->package ?: 'Premium'),
                    'description'      => 'Pembayaran upgrade paket ' . ($m->package ?: 'Membership'),
                    'amount'           => (int) ($m->total_price ?? $m->price ?? 0),
                    'total_price'      => (int) ($m->total_price ?? 0),
                    'payment_method'   => 'Transfer Bank',
                    'status'           => $status,
                    'created_at'       => $m->created_at ? $m->created_at->toIso8601String() : null,
                    'verified_at'      => $m->verified_at ? Carbon::parse($m->verified_at)->toIso8601String() : null,
                ]);
            }
        }

        // 2. Sesi Konsultasi
        if ($category === 'all' || $category === 'konsultasi') {
            $consultations = Consultation::where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('client_email', $user->email);
                })
                ->with('expert:id,name,slug,field,kriteria')
                ->latest()
                ->get();

            // Load point transactions terkait konsultasi
            $consultationIds = $consultations->pluck('id');
            $pointPayments = PointTransaction::whereIn('related_id', $consultationIds)
                ->where(function ($q) {
                    $q->where('related_type', 'App\\Models\\Consultation')
                      ->orWhere('related_type', Consultation::class);
                })
                ->where('type', PointTransaction::TYPE_CONSULTATION)
                ->get()
                ->keyBy('related_id');

            foreach ($consultations as $c) {
                $ref = 'CONS-' . str_pad($c->id, 5, '0', STR_PAD_LEFT);
                $status = 'verified';
                if ($c->status === 'dibatalkan' || $c->status === 'cancelled') {
                    $status = 'rejected';
                } elseif ($c->status === 'menunggu_konfirmasi' || $c->status === 'pending') {
                    $status = 'menunggu_verifikasi';
                }

                $pt = $pointPayments->get($c->id);
                $points = $pt ? abs($pt->points) : 0;
                $amount = $points > 0 ? ($points * 1000) : ($c->service_type === 'zoom' ? 250000 : 150000);

                $serviceName = $c->service_type === 'zoom' ? 'Zoom Meeting Online' : ($c->service_type === 'chat' ? 'Konsultasi Chat' : 'Konsultasi Teknis');

                $invoices->push([
                    'id'               => 'cons_' . $c->id,
                    'raw_id'           => $c->id,
                    'reference_code'   => $ref,
                    'invoice_number'   => 'INV/' . date('Ymd', strtotime($c->created_at)) . '/' . $ref,
                    'category'         => 'konsultasi',
                    'category_label'   => 'Sesi Konsultasi',
                    'category_icon'    => 'psychology',
                    'category_color'   => '#2563EB',
                    'category_bg'      => '#EFF6FF',
                    'title'            => $serviceName . ' - ' . ($c->expert?->name ?: 'Tenaga Ahli'),
                    'description'      => 'Topik: ' . ($c->topic ?: 'Konsultasi AMDAL / Lingkungan') . ' (' . ($c->duration_minutes ?: 30) . ' Menit)',
                    'amount'           => $amount,
                    'total_price'      => $amount,
                    'points_spent'     => $points,
                    'payment_method'   => $points > 0 ? 'Point' : 'Transfer Bank',
                    'status'           => $status,
                    'created_at'       => $c->created_at ? $c->created_at->toIso8601String() : null,
                    'verified_at'      => $c->created_at ? $c->created_at->toIso8601String() : null,
                ]);
            }
        }

        // 3. Bayar Berita / Publikasi Artikel
        if ($category === 'all' || $category === 'berita') {
            $articles = Article::where('user_id', $user->id)
                ->latest()
                ->get();

            foreach ($articles as $a) {
                $ref = $a->reference_code ?: 'BRT-' . str_pad($a->id, 5, '0', STR_PAD_LEFT);
                $status = $this->normalizeStatus($a->payment_status ?: ($a->status === 'aktif' ? 'verified' : 'pending'));
                $amount = (int) ($a->price ?: 10000);

                $invoices->push([
                    'id'               => 'art_' . $a->id,
                    'raw_id'           => $a->id,
                    'reference_code'   => $ref,
                    'invoice_number'   => 'INV/' . date('Ymd', strtotime($a->created_at)) . '/' . $ref,
                    'category'         => 'berita',
                    'category_label'   => 'Publikasi Berita',
                    'category_icon'    => 'newspaper',
                    'category_color'   => '#7C3AED',
                    'category_bg'      => '#F5F3FF',
                    'title'            => 'Publikasi Artikel: ' . \Illuminate\Support\Str::limit($a->title, 50),
                    'description'      => 'Penerbitan berita kategori ' . ($a->category ?: 'BERITA') . ' di portal TenagaAhli.com',
                    'amount'           => $amount,
                    'total_price'      => $amount,
                    'payment_method'   => $a->snap_token ? 'Midtrans' : 'Transfer Bank',
                    'status'           => $status,
                    'created_at'       => $a->created_at ? $a->created_at->toIso8601String() : null,
                    'verified_at'      => $a->verified_at ? $a->verified_at->toIso8601String() : null,
                ]);
            }
        }

        // 4. Top Up Point
        if ($category === 'all' || $category === 'topup') {
            $topups = PointTransaction::where('user_id', $user->id)
                ->where('type', PointTransaction::TYPE_TOPUP)
                ->with('topUpPackage:id,name,points,price')
                ->latest()
                ->get();

            foreach ($topups as $tp) {
                $ref = $tp->reference_code ?: 'TP-' . str_pad($tp->id, 5, '0', STR_PAD_LEFT);
                $status = $this->normalizeStatus($tp->status);
                $pkgName = $tp->topUpPackage?->name ?: "Paket {$tp->points} Poin";
                $amount = (int) ($tp->amount_idr ?: ($tp->topUpPackage?->price ?: $tp->points * 1000));

                $invoices->push([
                    'id'               => 'tp_' . $tp->id,
                    'raw_id'           => $tp->id,
                    'reference_code'   => $ref,
                    'invoice_number'   => 'INV/' . date('Ymd', strtotime($tp->created_at)) . '/' . $ref,
                    'category'         => 'topup',
                    'category_label'   => 'Top Up Point',
                    'category_icon'    => 'toll',
                    'category_color'   => '#D97706',
                    'category_bg'      => '#FEF3C7',
                    'title'            => 'Pembelian ' . $pkgName,
                    'description'      => "Top Up Saldo {$tp->points} Point TenagaAhli.com",
                    'amount'           => $amount,
                    'total_price'      => $amount,
                    'points'           => $tp->points,
                    'payment_method'   => 'Transfer Bank',
                    'status'           => $status,
                    'created_at'       => $tp->created_at ? $tp->created_at->toIso8601String() : null,
                    'verified_at'      => $tp->verified_at ? $tp->verified_at->toIso8601String() : null,
                ]);
            }
        }

        // 5. Pembelian Produk Digital / Buku
        if ($category === 'all' || $category === 'produk') {
            $purchases = ProductPurchase::where('user_id', $user->id)
                ->latest()
                ->get();

            foreach ($purchases as $p) {
                $ref = $p->reference_code ?: 'PP-' . str_pad($p->id, 5, '0', STR_PAD_LEFT);
                $status = $this->normalizeStatus($p->status);
                $amount = (int) ($p->amount_idr ?: ($p->points_spent ? $p->points_spent * 1000 : 0));

                $invoices->push([
                    'id'               => 'pp_' . $p->id,
                    'raw_id'           => $p->id,
                    'reference_code'   => $ref,
                    'invoice_number'   => 'INV/' . date('Ymd', strtotime($p->created_at)) . '/' . $ref,
                    'category'         => 'produk',
                    'category_label'   => 'Produk Digital',
                    'category_icon'    => 'shopping_bag',
                    'category_color'   => '#059669',
                    'category_bg'      => '#ECFDF5',
                    'title'            => 'Pembelian Buku/Produk: ' . \Illuminate\Support\Str::limit($p->product_title, 50),
                    'description'      => 'Akses unduh berkas digital ' . $p->product_title,
                    'amount'           => $amount,
                    'total_price'      => $amount,
                    'points_spent'     => $p->points_spent,
                    'payment_method'   => $p->points_spent ? 'Point' : $this->formatPaymentMethod($p->payment_method),
                    'status'           => $status,
                    'created_at'       => $p->created_at ? $p->created_at->toIso8601String() : null,
                    'verified_at'      => $p->verified_at ? Carbon::parse($p->verified_at)->toIso8601String() : null,
                ]);
            }
        }

        // Urutkan berdasarkan created_at descending
        $sorted = $invoices->sortByDesc(function ($item) {
            return $item['created_at'] ? strtotime($item['created_at']) : 0;
        })->values();

        // Filter status jika diminta
        if ($statusFilter !== 'all') {
            $sorted = $sorted->filter(function ($item) use ($statusFilter) {
                if ($statusFilter === 'lunas' || $statusFilter === 'verified' || $statusFilter === 'paid') {
                    return $item['status'] === 'verified' || $item['status'] === 'paid';
                }
                if ($statusFilter === 'pending' || $statusFilter === 'menunggu_verifikasi') {
                    return $item['status'] === 'pending' || $item['status'] === 'menunggu_verifikasi';
                }
                if ($statusFilter === 'rejected' || $statusFilter === 'cancelled') {
                    return $item['status'] === 'rejected' || $item['status'] === 'cancelled' || $item['status'] === 'expired';
                }
                return $item['status'] === $statusFilter;
            })->values();
        }

        // Hitung statistik
        $totalCount    = $invoices->count();
        $paidCount     = $invoices->whereIn('status', ['verified', 'paid'])->count();
        $pendingCount  = $invoices->whereIn('status', ['pending', 'menunggu_verifikasi'])->count();
        $totalPaidSum  = $invoices->whereIn('status', ['verified', 'paid'])->sum('total_price');

        return response()->json([
            'status' => 'success',
            'stats'  => [
                'total'           => $totalCount,
                'paid_count'      => $paidCount,
                'pending_count'   => $pendingCount,
                'total_paid_sum'  => $totalPaidSum,
            ],
            'count'  => $sorted->count(),
            'data'   => $sorted,
        ]);
    }

    /**
     * GET /api/my/invoices/{id}
     * Detail satu invoice lengkap berdasarkan reference_code atau ID
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthenticated'], 401);
        }

        $idClean = trim($id);

        // 1. Cek Membership Order
        $order = Order::where('user_id', $user->id)
            ->where(function ($q) use ($idClean) {
                $q->where('reference_code', $idClean)
                  ->orWhere('id', $idClean);
            })
            ->with(['package:id,name,price', 'user:id,name,email,phone'])
            ->first();

        if ($order) {
            $ref = $order->reference_code ?: 'ORD-' . str_pad($order->id, 5, '0', STR_PAD_LEFT);
            $pkgName = $order->package_name ?: ($order->package?->name ?: 'Premium');
            return response()->json([
                'status' => 'success',
                'data'   => [
                    'id'                  => $order->id,
                    'reference_code'      => $ref,
                    'invoice_number'      => 'INV/' . date('Ymd', strtotime($order->created_at)) . '/' . $ref,
                    'category'            => 'membership',
                    'category_label'      => 'Paket Membership',
                    'category_icon'       => 'workspace_premium',
                    'title'               => 'Paket Membership ' . $pkgName,
                    'package_name'        => $pkgName,
                    'amount'              => (int) ($order->amount ?? $order->original_price ?? 0),
                    'total_price'         => (int) ($order->amount ?? 0),
                    'original_price'      => (int) ($order->original_price ?? $order->amount ?? 0),
                    'discount_amount'     => (int) ($order->discount_amount ?? 0),
                    'status'              => $this->normalizeStatus($order->status),
                    'payment_method'      => $this->formatPaymentMethod($order->payment_type),
                    'created_at'          => $order->created_at ? $order->created_at->toIso8601String() : null,
                    'verified_at'         => $order->verified_at ? $order->verified_at->toIso8601String() : null,
                    'proof_url'           => $order->proof_url,
                    'customer'            => [
                        'name'  => $order->user?->name ?: $user->name,
                        'email' => $order->user?->email ?: $user->email,
                        'phone' => $order->user?->phone ?: $user->phone,
                    ],
                    'items'               => [
                        [
                            'name'        => 'Biaya Langganan ' . $pkgName,
                            'description' => 'Aktivasi fitur eksklusif, badge profil, dan akses konsultasi',
                            'qty'         => 1,
                            'price'       => (int) ($order->original_price ?? $order->amount ?? 0),
                            'total'       => (int) ($order->original_price ?? $order->amount ?? 0),
                        ],
                    ],
                ],
            ]);
        }

        // 2. Cek MembershipTransaction
        $mbrs = MembershipTransaction::where('user_id', $user->id)
            ->where(function ($q) use ($idClean) {
                $q->where('reference_code', $idClean)
                  ->orWhere('id', $idClean);
            })
            ->first();

        if ($mbrs) {
            $ref = $mbrs->reference_code ?: 'MBRS-' . str_pad($mbrs->id, 5, '0', STR_PAD_LEFT);
            $pkgName = $mbrs->package ?: 'Premium';
            return response()->json([
                'status' => 'success',
                'data'   => [
                    'id'                  => $mbrs->id,
                    'reference_code'      => $ref,
                    'invoice_number'      => 'INV/' . date('Ymd', strtotime($mbrs->created_at)) . '/' . $ref,
                    'category'            => 'membership',
                    'category_label'      => 'Paket Membership',
                    'category_icon'       => 'workspace_premium',
                    'title'               => 'Upgrade Membership ' . $pkgName,
                    'package_name'        => $pkgName,
                    'amount'              => (int) ($mbrs->total_price ?? $mbrs->price ?? 0),
                    'total_price'         => (int) ($mbrs->total_price ?? 0),
                    'original_price'      => (int) ($mbrs->price ?? $mbrs->total_price ?? 0),
                    'discount_amount'     => (int) ($mbrs->discount ?? 0),
                    'status'              => $this->normalizeStatus($mbrs->payment_status),
                    'payment_method'      => 'Transfer Bank',
                    'created_at'          => $mbrs->created_at ? $mbrs->created_at->toIso8601String() : null,
                    'verified_at'         => $mbrs->verified_at ? Carbon::parse($mbrs->verified_at)->toIso8601String() : null,
                    'customer'            => [
                        'name'  => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                    ],
                    'items'               => [
                        [
                            'name'        => 'Upgrade Paket ' . $pkgName,
                            'description' => 'Masa aktif: ' . ($mbrs->started_at ? $mbrs->started_at->format('d M Y') : '-') . ' s/d ' . ($mbrs->expires_at ? $mbrs->expires_at->format('d M Y') : '-'),
                            'qty'         => 1,
                            'price'       => (int) ($mbrs->price ?? $mbrs->total_price ?? 0),
                            'total'       => (int) ($mbrs->price ?? $mbrs->total_price ?? 0),
                        ],
                    ],
                ],
            ]);
        }

        // 3. Cek Top Up Point (PointTransaction)
        $topup = PointTransaction::where('user_id', $user->id)
            ->where('type', PointTransaction::TYPE_TOPUP)
            ->where(function ($q) use ($idClean) {
                $q->where('reference_code', $idClean)
                  ->orWhere('id', $idClean);
            })
            ->with('topUpPackage')
            ->first();

        if ($topup) {
            $ref = $topup->reference_code ?: 'TP-' . str_pad($topup->id, 5, '0', STR_PAD_LEFT);
            $pkgName = $topup->topUpPackage?->name ?: "Paket {$topup->points} Poin";
            $amount = (int) ($topup->amount_idr ?: ($topup->topUpPackage?->price ?: $topup->points * 1000));
            return response()->json([
                'status' => 'success',
                'data'   => [
                    'id'                  => $topup->id,
                    'reference_code'      => $ref,
                    'invoice_number'      => 'INV/' . date('Ymd', strtotime($topup->created_at)) . '/' . $ref,
                    'category'            => 'topup',
                    'category_label'      => 'Top Up Point',
                    'category_icon'       => 'toll',
                    'title'               => 'Pembelian ' . $pkgName,
                    'package_name'        => $pkgName,
                    'amount'              => $amount,
                    'total_price'         => $amount,
                    'original_price'      => $amount,
                    'discount_amount'     => 0,
                    'points'              => $topup->points,
                    'status'              => $this->normalizeStatus($topup->status),
                    'payment_method'      => 'Transfer Bank',
                    'created_at'          => $topup->created_at ? $topup->created_at->toIso8601String() : null,
                    'verified_at'         => $topup->verified_at ? $topup->verified_at->toIso8601String() : null,
                    'customer'            => [
                        'name'  => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                    ],
                    'items'               => [
                        [
                            'name'        => $pkgName . " ({$topup->points} Poin)",
                            'description' => 'Saldo Point untuk pembayaran sesi konsultasi & pembelian produk digital',
                            'qty'         => 1,
                            'price'       => $amount,
                            'total'       => $amount,
                        ],
                    ],
                ],
            ]);
        }

        // 4. Cek Konsultasi
        $consultId = str_replace('CONS-', '', $idClean);
        $consultation = Consultation::where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('client_email', $user->email);
            })
            ->where(function ($q) use ($idClean, $consultId) {
                $q->where('id', $consultId)
                  ->orWhere('id', $idClean);
            })
            ->with('expert:id,name,field,kriteria')
            ->first();

        if ($consultation) {
            $ref = 'CONS-' . str_pad($consultation->id, 5, '0', STR_PAD_LEFT);
            $pt = PointTransaction::where('related_id', $consultation->id)
                ->where('type', PointTransaction::TYPE_CONSULTATION)
                ->first();
            $points = $pt ? abs($pt->points) : 0;
            $amount = $points > 0 ? ($points * 1000) : ($consultation->service_type === 'zoom' ? 250000 : 150000);

            $status = 'verified';
            if ($consultation->status === 'dibatalkan' || $consultation->status === 'cancelled') {
                $status = 'rejected';
            } elseif ($consultation->status === 'menunggu_konfirmasi') {
                $status = 'menunggu_verifikasi';
            }

            return response()->json([
                'status' => 'success',
                'data'   => [
                    'id'                  => $consultation->id,
                    'reference_code'      => $ref,
                    'invoice_number'      => 'INV/' . date('Ymd', strtotime($consultation->created_at)) . '/' . $ref,
                    'category'            => 'konsultasi',
                    'category_label'      => 'Sesi Konsultasi',
                    'category_icon'       => 'psychology',
                    'title'               => 'Konsultasi: ' . ($consultation->expert?->name ?: 'Tenaga Ahli'),
                    'package_name'        => ucfirst($consultation->service_type ?: 'online') . ' Meeting (' . ($consultation->duration_minutes ?: 30) . ' Menit)',
                    'amount'              => $amount,
                    'total_price'         => $amount,
                    'original_price'      => $amount,
                    'discount_amount'     => 0,
                    'points_spent'        => $points,
                    'status'              => $status,
                    'payment_method'      => $points > 0 ? 'Point' : 'Transfer Bank',
                    'created_at'          => $consultation->created_at ? $consultation->created_at->toIso8601String() : null,
                    'verified_at'         => $consultation->created_at ? $consultation->created_at->toIso8601String() : null,
                    'customer'            => [
                        'name'  => $consultation->client_name ?: $user->name,
                        'email' => $consultation->client_email ?: $user->email,
                        'phone' => $consultation->client_phone ?: $user->phone,
                    ],
                    'items'               => [
                        [
                            'name'        => 'Sesi Konsultasi Daring (' . ($consultation->duration_minutes ?: 30) . ' Menit)',
                            'description' => 'Topik: ' . ($consultation->topic ?: '-') . ' • Ahli: ' . ($consultation->expert?->name ?: 'Tenaga Ahli') . ' • Jadwal: ' . ($consultation->consultation_date ? $consultation->consultation_date->format('d M Y') : '-') . ' (' . ($consultation->consultation_time ?: '-') . ')',
                            'qty'         => 1,
                            'price'       => $amount,
                            'total'       => $amount,
                        ],
                    ],
                ],
            ]);
        }

        // 5. Cek Artikel / Berita
        $artId = str_replace('BRT-', '', $idClean);
        $article = Article::where('user_id', $user->id)
            ->where(function ($q) use ($idClean, $artId) {
                $q->where('reference_code', $idClean)
                  ->orWhere('id', $artId)
                  ->orWhere('id', $idClean);
            })
            ->first();

        if ($article) {
            $ref = $article->reference_code ?: 'BRT-' . str_pad($article->id, 5, '0', STR_PAD_LEFT);
            $amount = (int) ($article->price ?: 10000);
            return response()->json([
                'status' => 'success',
                'data'   => [
                    'id'                  => $article->id,
                    'reference_code'      => $ref,
                    'invoice_number'      => 'INV/' . date('Ymd', strtotime($article->created_at)) . '/' . $ref,
                    'category'            => 'berita',
                    'category_label'      => 'Publikasi Berita',
                    'category_icon'       => 'newspaper',
                    'title'               => 'Publikasi: ' . $article->title,
                    'package_name'        => 'Penerbitan Artikel Berita',
                    'amount'              => $amount,
                    'total_price'         => $amount,
                    'original_price'      => $amount,
                    'discount_amount'     => 0,
                    'status'              => $this->normalizeStatus($article->payment_status ?: 'verified'),
                    'payment_method'      => $article->snap_token ? 'Midtrans' : 'Transfer Bank',
                    'created_at'          => $article->created_at ? $article->created_at->toIso8601String() : null,
                    'verified_at'         => $article->verified_at ? $article->verified_at->toIso8601String() : null,
                    'customer'            => [
                        'name'  => $user->name,
                        'email' => $user->email,
                        'phone' => $user->phone,
                    ],
                    'items'               => [
                        [
                            'name'        => 'Biaya Penerbitan & Review Berita',
                            'description' => 'Judul: ' . $article->title . ' (Kategori: ' . ($article->category ?: 'BERITA') . ')',
                            'qty'         => 1,
                            'price'       => $amount,
                            'total'       => $amount,
                        ],
                    ],
                ],
            ]);
        }

        // 6. Cek Produk Digital (ProductPurchase)
        $purchase = ProductPurchase::where('user_id', $user->id)
            ->where(function ($q) use ($idClean) {
                $q->where('reference_code', $idClean)
                  ->orWhere('id', $idClean);
            })
            ->first();

        if ($purchase) {
            $ref = $purchase->reference_code ?: 'PP-' . str_pad($purchase->id, 5, '0', STR_PAD_LEFT);
            $amount = (int) ($purchase->amount_idr ?: ($purchase->points_spent ? $p->points_spent * 1000 : 0));
            return response()->json([
                'status' => 'success',
                'data'   => [
                    'id'                  => $purchase->id,
                    'reference_code'      => $ref,
                    'invoice_number'      => 'INV/' . date('Ymd', strtotime($purchase->created_at)) . '/' . $ref,
                    'category'            => 'produk',
                    'category_label'      => 'Produk Digital',
                    'category_icon'       => 'shopping_bag',
                    'title'               => 'Produk: ' . $purchase->product_title,
                    'package_name'        => 'Pembelian Berkas Digital',
                    'amount'              => $amount,
                    'total_price'         => $amount,
                    'original_price'      => $amount,
                    'discount_amount'     => 0,
                    'points_spent'        => $purchase->points_spent,
                    'status'              => $this->normalizeStatus($purchase->status),
                    'payment_method'      => $purchase->points_spent ? 'Point' : $this->formatPaymentMethod($purchase->payment_method),
                    'created_at'          => $purchase->created_at ? $purchase->created_at->toIso8601String() : null,
                    'verified_at'         => $purchase->verified_at ? Carbon::parse($purchase->verified_at)->toIso8601String() : null,
                    'customer'            => [
                        'name'  => $purchase->recipient_name ?: $user->name,
                        'email' => $user->email,
                        'phone' => $purchase->recipient_phone ?: $user->phone,
                    ],
                    'items'               => [
                        [
                            'name'        => $purchase->product_title,
                            'description' => 'Akses unduh instan & lisensi penggunaan',
                            'qty'         => 1,
                            'price'       => $amount,
                            'total'       => $amount,
                        ],
                    ],
                ],
            ]);
        }

        return response()->json([
            'status'  => 'error',
            'message' => 'Invoice dengan kode ' . $id . ' tidak ditemukan.',
        ], 404);
    }

    /**
     * Helper untuk standarisasi status pembayaran
     */
    private function normalizeStatus(?string $status): string
    {
        $s = strtolower(trim((string) $status));
        if (in_array($s, ['verified', 'paid', 'success', 'lunas', 'completed'])) {
            return 'verified';
        }
        if (in_array($s, ['menunggu_verifikasi', 'waiting_verification'])) {
            return 'menunggu_verifikasi';
        }
        if (in_array($s, ['pending', 'menunggu_pembayaran', 'waiting_payment'])) {
            return 'pending';
        }
        if (in_array($s, ['rejected', 'ditolak', 'cancelled', 'dibatalkan'])) {
            return 'rejected';
        }
        if (in_array($s, ['expired', 'kadaluwarsa', 'kedaluwarsa'])) {
            return 'expired';
        }
        return 'pending';
    }

    /**
     * Helper untuk standarisasi nama metode pembayaran (singkat & padat)
     */
    private function formatPaymentMethod(?string $method): string
    {
        if (empty($method)) {
            return 'Transfer Bank';
        }

        $m = strtolower(trim($method));
        if (str_contains($m, 'qris')) return 'QRIS';
        if (str_contains($m, 'point') || str_contains($m, 'poin')) return 'Point';
        if (str_contains($m, 'midtrans')) return 'Midtrans';
        if (str_contains($m, 'gopay')) return 'GoPay';
        if (str_contains($m, 'ovo')) return 'OVO';
        if (str_contains($m, 'dana')) return 'DANA';
        if (str_contains($m, 'shopee')) return 'ShopeePay';
        if (str_contains($m, 'bca')) return 'BCA';
        if (str_contains($m, 'mandiri')) return 'Mandiri';
        if (str_contains($m, 'bni')) return 'BNI';
        if (str_contains($m, 'bri')) return 'BRI';
        if (str_contains($m, 'manual') || str_contains($m, 'transfer') || str_contains($m, 'bank')) {
            return 'Transfer Bank';
        }

        return strlen($method) > 18 ? substr($method, 0, 18) : $method;
    }
}
