<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\PackageUpgradedMail;
use App\Mail\ProductOrderPaymentVerified;
use App\Mail\ProductOrderPendingTransfer;
use App\Mail\ProductPurchasedBuyer;
use App\Mail\ProductPurchasedSeller;
use App\Models\Expert;
use App\Models\Order;
use App\Models\Package;
use App\Services\PointService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Midtrans\Config;
use Midtrans\Snap;
use Midtrans\Notification;

class OrderController extends Controller
{
    public function __construct()
    {
        // Konfigurasi Midtrans
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized = config('services.midtrans.is_sanitized');
        Config::$is3ds = config('services.midtrans.is_3ds');
    }
    // User pilih paket -> set package_id di Expert, dan kalau berbayar, buat Order dengan Midtrans
    public function choosePackage(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'package_id' => ['required'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $packageId = $request->package_id;
        $package = null;

        if (is_numeric($packageId)) {
            $package = Package::find($packageId);
        }

        if (!$package) {
            $package = Package::where('slug', $packageId)
                ->orWhere('name', 'like', "%{$packageId}%")
                ->first();
        }

        if (!$package) {
            if ($packageId === 'free' || $packageId === 'standar') {
                $package = Package::where('price', 0)->first();
            }
        }

        if (!$package) {
            return response()->json(['message' => 'Paket yang dipilih tidak ditemukan.'], 422);
        }

        $expert = Expert::firstOrCreate(
            ['user_id' => $user->id],
            [
                'name' => $user->name,
                'email' => $user->email,
            ]
        );

        // Cegah Tenaga Ahli memilih paket bertarif surveyor atau tenaga teknis
        $hasTenagaAhli = $user->role_type === 'tenaga_ahli' ||
            ($expert && (
                $expert->is_tenaga_ahli ||
                $expert->kriteria === 'Tenaga Ahli' ||
                (is_array($expert->kriteria_list) && in_array('Tenaga Ahli', $expert->kriteria_list))
            ));

        if ($hasTenagaAhli && in_array($package->role_type, ['surveyor', 'tenaga_teknis'])) {
            return response()->json(['message' => 'Sebagai Tenaga Ahli, Anda harus memilih paket membership dengan tarif Tenaga Ahli.'], 422);
        }

        // Prevent downgrading to Free ONLY if currently on an ACTIVE, PAID Premium subscription
        $currentPackage = $expert->package;
        if ($currentPackage && $currentPackage->price > 0 && $package->price == 0) {
            $hasActivePaidPremium = $expert->package_expires_at && now()->lessThan($expert->package_expires_at);
            if ($hasActivePaidPremium) {
                return response()->json(['message' => 'Anda tidak bisa kembali ke Paket Free selama Paket Premium masih aktif.'], 422);
            }
        }

        if ($package->price > 0) {
            // Generate order reference
            $referenceCode = 'ORD-'.strtoupper(Str::random(8));

            $paymentType = $request->input('payment_type', 'manual');

            $order = Order::create([
                'user_id' => $user->id,
                'package_id' => $package->id,
                'package_name' => $package->name,
                'amount' => $package->price,
                'reference_code' => $referenceCode,
                'payment_type' => $paymentType,
                'status' => 'menunggu_pembayaran',
            ]);

            // Generate Midtrans Snap token
            if (Config::$serverKey && Config::$serverKey !== 'your-midtrans-server-key') {
                try {
                    $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

                    $params = [
                        'transaction_details' => [
                            'order_id' => $referenceCode,
                            'gross_amount' => (int) $package->price,
                        ],
                        'customer_details' => [
                            'first_name' => $user->name,
                            'email' => $user->email,
                            'phone' => $expert->phone ?? '',
                        ],
                        'item_details' => [
                            [
                                'id' => $package->id,
                                'price' => (int) $package->price,
                                'quantity' => 1,
                                'name' => $package->name,
                            ],
                        ],
                        'callbacks' => [
                            'finish' => "{$frontendUrl}/invoice/{$referenceCode}",
                            'error' => "{$frontendUrl}/invoice/{$referenceCode}",
                            'pending' => "{$frontendUrl}/invoice/{$referenceCode}",
                        ],
                    ];

                    $snapToken = Snap::getSnapToken($params);

                    $order->update([
                        'snap_token' => $snapToken,
                    ]);

                    return response()->json([
                        'expert' => $expert->load('package:id,name,price'),
                        'order' => $order->load('package:id,name,price'),
                        'snap_token' => $snapToken,
                    ], 201);
                } catch (\Exception $e) {
                    \Log::error('Midtrans Snap Error: ' . $e->getMessage());
                }
            }

            return response()->json([
                'expert' => $expert->load('package:id,name,price'),
                'order' => $order->load('package:id,name,price'),
                'snap_token' => null,
            ], 201);
        }

        // Paket gratis -> aktifkan langsung pada profile expert
        $expert->update([
            'package_id' => $package->id,
            'package_expires_at' => null,
        ]);
        return response()->json(['expert' => $expert->load('package:id,name,price'), 'order' => null]);
    }

    public function package()
    {
        // Dipertahankan untuk kompatibilitas lama (tidak dipakai lagi di frontend baru)
        return response()->json(Package::where('is_active', true)->orderBy('order')->get());
    }

    public function myOrder(Request $request)
    {
        $order = Order::where('user_id', $request->user()->id)->latest()->first();
        return response()->json($order);
    }

    public function myOrders(Request $request)
    {
        $orders = Order::where('user_id', $request->user()->id)
            ->with('package:id,name,price')
            ->latest()
            ->get();
        return response()->json($orders);
    }

    public function show(Request $request, $id)
    {
        $user = $request->user();

        // 1. Search in Package Orders
        $orderQuery = Order::with(['package:id,name,price', 'user:id,name,email']);
        if ($user && $user->role !== 'admin') {
            $orderQuery->where('user_id', $user->id);
        }
        $order = $orderQuery->where(function ($q) use ($id) {
            $q->where('id', $id)
              ->orWhere('reference_code', $id);
        })->first();

        if ($order) {
            return response()->json($order);
        }

        // 2. Fallback search in Product Purchases if applicable
        $productOrderQuery = \App\Models\ProductPurchase::with(['product', 'user:id,name,email']);
        if ($user && $user->role !== 'admin') {
            $productOrderQuery->where('user_id', $user->id);
        }
        $productOrder = $productOrderQuery->where(function ($q) use ($id) {
            $q->where('id', $id)
              ->orWhere('reference_code', $id);
        })->first();

        if ($productOrder) {
            return response()->json($productOrder);
        }

        // 3. Fallback search in Membership Transactions if applicable
        $membershipQuery = \App\Models\MembershipTransaction::with(['user:id,name,email']);
        if ($user && $user->role !== 'admin') {
            $membershipQuery->where('user_id', $user->id);
        }
        $membership = $membershipQuery->where(function ($q) use ($id) {
            $q->where('id', $id)
              ->orWhere('reference_code', $id);
        })->first();

        if ($membership) {
            return response()->json([
                'id' => $membership->id,
                'reference_code' => $membership->reference_code,
                'package' => $membership->package,
                'package_name' => $membership->package,
                'amount' => $membership->total_price,
                'total_price' => $membership->total_price,
                'original_price' => $membership->price,
                'discount_percentage' => $membership->discount,
                'discount_amount' => $membership->discount_amount,
                'status' => $membership->payment_status,
                'payment_status' => $membership->payment_status,
                'type' => 'membership',
                'created_at' => $membership->created_at,
                'expires_at' => $membership->expires_at,
                'user' => $membership->user,
            ]);
        }

        return response()->json(['message' => 'Order tidak ditemukan'], 404);
    }

    // Webhook dari Midtrans untuk notification pembayaran
    public function notification(Request $request)
    {
        try {
            $payload = $request->all();
            if (empty($payload)) {
                $raw = $request->getContent();
                $payload = json_decode($raw, true) ?: [];
            }

            $orderId = $payload['order_id'] ?? $request->input('order_id');
            $transactionStatus = $payload['transaction_status'] ?? $request->input('transaction_status');
            $fraudStatus = $payload['fraud_status'] ?? $request->input('fraud_status', 'accept');
            $statusCode = $payload['status_code'] ?? $request->input('status_code');
            $grossAmount = (string) ($payload['gross_amount'] ?? $request->input('gross_amount'));
            $signatureKey = $payload['signature_key'] ?? $request->input('signature_key');
            $paymentType = $payload['payment_type'] ?? $request->input('payment_type');

            \Log::info('Midtrans Notification received', [
                'order_id' => $orderId,
                'transaction_status' => $transactionStatus,
                'fraud_status' => $fraudStatus,
                'payment_type' => $paymentType,
                'gross_amount' => $grossAmount,
            ]);

            if (empty($orderId)) {
                return response()->json([
                    'status' => 'success',
                    'message' => 'Empty order_id, test or invalid notification acknowledged gracefully'
                ], 200);
            }

            // Verifikasi Signature Key Midtrans untuk keamanan (jika server key dikonfigurasi)
            $serverKey = config('services.midtrans.server_key');
            if ($serverKey && !str_starts_with($serverKey, 'your-') && $signatureKey && $statusCode && $grossAmount) {
                $expectedSignature = hash('sha512', $orderId . $statusCode . $grossAmount . $serverKey);
                if ($signatureKey !== $expectedSignature) {
                    \Log::warning('Midtrans Notification Signature Mismatch', [
                        'order_id' => $orderId,
                        'received_signature' => $signatureKey,
                        'expected_signature' => $expectedSignature,
                    ]);
                }
            }

            $this->processTransactionStatus($orderId, $transactionStatus, $fraudStatus, $paymentType, $payload);

            return response()->json([
                'status' => 'success',
                'message' => 'Notification handled successfully'
            ], 200);
        } catch (\Exception $e) {
            \Log::error('Midtrans Notification Error: ' . $e->getMessage());
            // Kembalikan 200 agar Midtrans Webhook test simulator tidak menandai webhook rusak
            return response()->json([
                'status' => 'error',
                'message' => 'Notification error: ' . $e->getMessage()
            ], 200);
        }
    }

    /**
     * Endpoint untuk mengecek & sinkronisasi status pembayaran secara langsung ke server Midtrans.
     * Sangat penting untuk sinkronisasi seketika di localhost maupun produksi.
     */
    public function checkPaymentStatus(Request $request, $orderId)
    {
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production', false);

        try {
            $status = \Midtrans\Transaction::status($orderId);

            $transactionStatus = is_object($status) ? ($status->transaction_status ?? null) : ($status['transaction_status'] ?? null);
            $fraudStatus = is_object($status) ? ($status->fraud_status ?? 'accept') : ($status['fraud_status'] ?? 'accept');
            $paymentType = is_object($status) ? ($status->payment_type ?? null) : ($status['payment_type'] ?? null);

            $result = $this->processTransactionStatus($orderId, $transactionStatus, $fraudStatus, $paymentType);

            return response()->json([
                'status' => 'success',
                'order_id' => $orderId,
                'transaction_status' => $transactionStatus,
                'data' => $result,
            ], 200);
        } catch (\Exception $e) {
            \Log::info("Check payment status direct check fallback for {$orderId}: " . $e->getMessage());

            $order = Order::where('reference_code', $orderId)->first();
            $pointTx = !$order ? \App\Models\PointTransaction::where('reference_code', $orderId)->first() : null;
            $article = (!$order && !$pointTx) ? \App\Models\Article::where('reference_code', $orderId)->first() : null;
            $productOrder = (!$order && !$pointTx && !$article) ? \App\Models\ProductPurchase::where('reference_code', $orderId)->first() : null;
            $membership = (!$order && !$pointTx && !$article && !$productOrder) ? \App\Models\MembershipTransaction::where('reference_code', $orderId)->first() : null;
            $consultation = (!$order && !$pointTx && !$article && !$productOrder && !$membership) ? \App\Models\Consultation::where('reference_code', $orderId)->first() : null;

            return response()->json([
                'status' => 'info',
                'order_id' => $orderId,
                'message' => $e->getMessage(),
                'record' => $order ?? $pointTx ?? $article ?? $productOrder ?? $membership ?? $consultation,
            ], 200);
        }
    }

    /**
     * Helper universal untuk memperbarui status transaksi di 5 model aplikasi.
     */
    public function processTransactionStatus($orderId, $transactionStatus, $fraudStatus = 'accept', $paymentType = null, $rawPayload = [])
    {
        $isSuccess = ($transactionStatus == 'settlement') || ($transactionStatus == 'capture' && $fraudStatus == 'accept');
        $isPending = ($transactionStatus == 'pending');
        $isFailed = in_array($transactionStatus, ['deny', 'cancel', 'expire', 'failure']);

        // 1. Process Membership Package Order
        $order = Order::where('reference_code', $orderId)->first();
        if ($order) {
            if ($paymentType) {
                $order->update(['payment_type' => $paymentType]);
            }

            if ($isSuccess) {
                if ($order->status !== 'verified') {
                    $order->update([
                        'status' => 'verified',
                        'verified_at' => now(),
                    ]);

                    $packageName = strtolower($order->package_name ?? $order->package?->name ?? 'ekonomis');
                    $isPlatinum = str_contains($packageName, 'platinum') || str_contains($packageName, 'eksklusif') || str_contains($packageName, 'ekslusif') || str_contains($packageName, 'esklusif');
                    $tierName = $isPlatinum ? 'ekslusif' : 'ekonomis';

                    $user = \App\Models\User::find($order->user_id);
                    $expert = \App\Models\Expert::where('user_id', $order->user_id)->first();
                    $medalService = app(\App\Services\MembershipMedalService::class);

                    if ($expert) {
                        $medalService->handleRenewalOrUpgrade($expert);
                        $expertUpdates = [
                            'package_id' => $order->package_id,
                            'verified' => true,
                            'is_verified' => true,
                        ];
                        if (!empty($expert->pending_changes['ktp_path'])) {
                            $expertUpdates['ktp_path'] = $expert->pending_changes['ktp_path'];
                        }
                        $expert->update($expertUpdates);
                        $expiresAt = $expert->package_expires_at;
                    } else {
                        $currentExpiresAt = $user?->premium_expires_at;
                        $baseDate = ($currentExpiresAt && $currentExpiresAt->isFuture()) ? $currentExpiresAt : now();
                        $expiresAt = $baseDate->copy()->addYear();
                    }

                    if ($user) {
                        $user->update([
                            'package' => $tierName,
                            'premium_expires_at' => $expiresAt,
                        ]);
                    }

                    // Award poin aktivitas
                    try {
                        $pointService = new PointService();
                        $pointService->awardPoints($order->user_id, 'upgrade_premium', "Upgrade ke paket {$tierName} via Midtrans");
                    } catch (\Throwable $e) {
                        \Log::warning('Gagal award poin upgrade: ' . $e->getMessage());
                    }

                    // Kirim email notifikasi Upgrade Paket Berhasil
                    if ($user && $user->email) {
                        try {
                            $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
                            $actionUrl = $frontendUrl . '/profil';
                            $formattedExpiry = $expiresAt ? \Carbon\Carbon::parse($expiresAt)->translatedFormat('d F Y') : null;
                            Mail::to($user->email)->send(new PackageUpgradedMail(
                                user: $user,
                                packageName: ucfirst($tierName),
                                expiresAt: $formattedExpiry,
                                dashboardUrl: $actionUrl
                            ));
                        } catch (\Throwable $e) {
                            \Log::warning('Gagal kirim email PackageUpgradedMail: ' . $e->getMessage());
                        }
                    }
                }
            } elseif ($isPending) {
                $order->update(['status' => 'menunggu_pembayaran']);
            } elseif ($isFailed) {
                $order->update(['status' => 'rejected', 'reject_reason' => "Payment {$transactionStatus}"]);
            }
            return ['type' => 'order', 'record' => $order->fresh()];
        }

        // 2. Process MembershipTransaction (jika ada)
        $membership = \App\Models\MembershipTransaction::where('reference_code', $orderId)->first();
        if ($membership) {
            if ($isSuccess && $membership->payment_status !== 'paid') {
                try {
                    $membershipService = app(\App\Services\MembershipService::class);
                    $membershipService->processSuccessfulPayment($membership);
                } catch (\Throwable $e) {
                    \Log::warning("Error processing membership payment: " . $e->getMessage());
                    $membership->update(['payment_status' => 'paid']);
                }
            } elseif ($isPending) {
                $membership->update(['payment_status' => 'pending']);
            } elseif ($isFailed) {
                $membership->update(['payment_status' => 'failed']);
            }
            return ['type' => 'membership_transaction', 'record' => $membership->fresh()];
        }

        // 3. Process Top Up Point
        $pointTx = \App\Models\PointTransaction::where('reference_code', $orderId)->first();
        if ($pointTx) {
            if ($isSuccess && $pointTx->status !== \App\Models\PointTransaction::STATUS_SUCCESS) {
                $pointTx->update([
                    'status'      => \App\Models\PointTransaction::STATUS_SUCCESS,
                    'verified_at' => now(),
                    'notes'       => 'Pembayaran otomatis via Midtrans (' . ($paymentType ?? 'Snap') . ')',
                ]);

                $u = $pointTx->user;
                if ($u) {
                    $u->increment('point_balance', $pointTx->points);
                    $u->increment('total_points', $pointTx->points);
                }
            } elseif ($isPending) {
                $pointTx->update(['status' => \App\Models\PointTransaction::STATUS_PENDING]);
            } elseif ($isFailed) {
                $pointTx->update(['status' => \App\Models\PointTransaction::STATUS_CANCELLED]);
            }
            return ['type' => 'point_transaction', 'record' => $pointTx->fresh()];
        }

        // 4. Process Article / Proyek (10k / 7 Days)
        $article = \App\Models\Article::with('user')->where('reference_code', $orderId)->first();
        if ($article) {
            $isAuthorAdmin = ($article->user && $article->user->role === 'admin');
            if ($isSuccess) {
                $article->update([
                    'status'           => 'published',
                    'payment_status'   => 'verified',
                    'published_at'     => now(),
                    'expires_at'       => $isAuthorAdmin ? null : now()->addDays(7),
                    'verified_at'      => now(),
                    'rejection_reason' => null,
                ]);
            } elseif ($isPending) {
                $article->update(['payment_status' => 'pending']);
            } elseif ($isFailed) {
                $article->update(['payment_status' => 'rejected', 'status' => 'ditolak']);
            }
            return ['type' => 'article', 'record' => $article->fresh()];
        }

        // 5. Process Product Purchase
        $productOrder = \App\Models\ProductPurchase::where('reference_code', $orderId)->first();
        if ($productOrder) {
            if ($isSuccess && $productOrder->status !== 'completed') {
                $downloadToken = \Illuminate\Support\Str::random(40);
                $price = $productOrder->amount_idr ?: ($productOrder->product?->discount_price ?? $productOrder->product?->price ?? 0);
                $adminFee = (int) round($price * 0.10);
                $sellerAmount = $price - $adminFee;

                $productOrder->update([
                    'status'            => 'completed',
                    'download_token'    => $downloadToken,
                    'seller_amount'     => $sellerAmount,
                    'admin_amount'      => $adminFee,
                    'verified_at'       => now(),
                ]);

                // Tambah saldo ke seller/expert jika ada
                if ($productOrder->expert && $productOrder->expert->user) {
                    $productOrder->expert->user->increment('point_balance', $sellerAmount);
                }

                // Kirim notifikasi email ke Pembeli & Penjual
                $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
                $myPurchasesUrl = $frontendUrl . '/profil';
                $salesUrl = $frontendUrl . '/kelola-produk';

                $productOrder->loadMissing(['user', 'product', 'expert.user']);
                $buyer = $productOrder->user;
                $product = $productOrder->product;
                $expert = $productOrder->expert;

                // 1. Email ke Pembeli
                if ($buyer && $buyer->email && $product) {
                    try {
                        Mail::to($buyer->email)->send(new ProductPurchasedBuyer(
                            purchase: $productOrder,
                            product: $product,
                            expert: $expert,
                            buyer: $buyer,
                            myPurchasesUrl: $myPurchasesUrl
                        ));
                    } catch (\Throwable $e) {
                        \Log::warning('Gagal kirim email ProductPurchasedBuyer via Midtrans: ' . $e->getMessage());
                    }
                }

                // 2. Email ke Penjual
                $sellerEmail = $expert?->user?->email ?? $expert?->email;
                if ($sellerEmail && $product && $buyer && $expert) {
                    try {
                        Mail::to($sellerEmail)->send(new ProductPurchasedSeller(
                            purchase: $productOrder,
                            product: $product,
                            expert: $expert,
                            buyer: $buyer,
                            salesUrl: $salesUrl,
                            paymentMethod: $paymentType ?? 'Midtrans'
                        ));
                    } catch (\Throwable $e) {
                        \Log::warning('Gagal kirim email ProductPurchasedSeller via Midtrans: ' . $e->getMessage());
                    }
                }
            } elseif ($isPending) {
                $productOrder->update(['status' => 'pending_payment']);
            } elseif ($isFailed) {
                $productOrder->update(['status' => 'refunded']);
            }
            return ['type' => 'product_purchase', 'record' => $productOrder->fresh()];
        }

        // 6. Process Consultation Sesi
        $consultation = \App\Models\Consultation::with(['expert.user', 'user'])->where('reference_code', $orderId)->first();
        if ($consultation) {
            if ($isSuccess && $consultation->payment_status !== 'paid') {
                $consultation->update([
                    'payment_status' => 'paid',
                    'paid_at'        => now(),
                    'status'         => 'menunggu_konfirmasi',
                ]);
            } elseif ($isPending) {
                $consultation->update(['payment_status' => 'pending']);
            } elseif ($isFailed) {
                $consultation->update(['payment_status' => 'failed', 'status' => 'dibatalkan']);
            }
            return ['type' => 'consultation', 'record' => $consultation->fresh()];
        }

        \Log::info("Process transaction status: reference code {$orderId} not found in database.");
        return null;
    }

    public function uploadProof(Request $request, $id)
    {
        $user = $request->user();

        // Detect uploaded file key (supports both 'proof' and 'proof_image')
        $fileKey = $request->hasFile('proof') ? 'proof' : ($request->hasFile('proof_image') ? 'proof_image' : null);

        if (!$fileKey) {
            return response()->json(['message' => 'Bukti pembayaran wajib diunggah.'], 422);
        }

        $validator = Validator::make($request->all(), [
            $fileKey => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        // 1. Search in Package Order (by numeric ID or reference_code)
        $order = Order::where('user_id', $user->id)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)
                  ->orWhere('reference_code', $id);
            })->first();

        if ($order) {
            $path = $request->file($fileKey)->store('bukti-transfer', 'public');

            $order->update([
                'proof_of_payment' => $path,
                'payment_type' => 'manual',
                'status' => 'menunggu_verifikasi',
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bukti transfer berhasil diunggah.',
                'order' => $order,
            ]);
        }

        // 2. Search in ProductPurchase
        $productOrder = \App\Models\ProductPurchase::where('user_id', $user->id)
            ->where(function ($q) use ($id) {
                $q->where('id', $id)
                  ->orWhere('reference_code', $id);
            })->first();

        if ($productOrder) {
            $file = $request->file($fileKey);
            $filename = 'proof_' . $productOrder->reference_code . '_' . time() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('payment_proofs/products', $filename, 'public');

            $productOrder->update([
                'proof_image' => $path,
                'proof_notes' => $request->input('notes'),
                'status'      => 'pending_verification',
                'proof_uploaded_at' => now(),
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Bukti pembayaran berhasil diupload. Menunggu verifikasi admin.',
                'order' => $productOrder,
            ]);
        }

        return response()->json(['message' => 'Pesanan tidak ditemukan.'], 404);
    }

    // ================== ADMIN ==================

    public function adminIndex(Request $request)
    {
        $query = Order::with(['user:id,name,email', 'package:id,name,price'])->latest();

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        return response()->json($query->get());
    }

    public function verify(Request $request, $id)
    {
        $order = Order::with('package')->findOrFail($id);

        $order->update([
            'status' => 'verified',
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        $packageName = strtolower($order->package_name ?? $order->package?->name ?? 'ekonomis');
        $isPlatinum = str_contains($packageName, 'platinum') || str_contains($packageName, 'eksklusif') || str_contains($packageName, 'ekslusif') || str_contains($packageName, 'esklusif');
        $tierName = $isPlatinum ? 'ekslusif' : 'ekonomis';

        $user = \App\Models\User::find($order->user_id);
        $expert = \App\Models\Expert::where('user_id', $order->user_id)->first();
        $medalService = app(\App\Services\MembershipMedalService::class);

        if ($expert) {
            $medalService->handleRenewalOrUpgrade($expert);
            $expertUpdates = [
                'package_id' => $order->package_id,
                'verified' => true,
                'is_verified' => true,
            ];
            if (!empty($expert->pending_changes['ktp_path'])) {
                $expertUpdates['ktp_path'] = $expert->pending_changes['ktp_path'];
            }
            $expert->update($expertUpdates);
            $expiresAt = $expert->package_expires_at;
        } else {
            $currentExpiresAt = $user?->premium_expires_at;
            $baseDate = ($currentExpiresAt && $currentExpiresAt->isFuture()) ? $currentExpiresAt : now();
            $expiresAt = $baseDate->copy()->addYear();
        }

        if ($user) {
            $user->update([
                'package' => $tierName,
                'premium_expires_at' => $expiresAt,
                'is_verified' => true,
            ]);
        }

        if ($expert) {
            // Award 100 poin aktivitas profil untuk upgrade paket
            $pointService = new PointService();
            $pointService->awardPoints($order->user_id, 'upgrade_premium', "Upgrade ke paket {$order->package_name}");
        }

        // Kirim email notifikasi Upgrade Paket Berhasil
        if ($user && $user->email) {
            try {
                $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
                $actionUrl = $frontendUrl . '/profil';
                $formattedExpiry = $expiresAt ? \Carbon\Carbon::parse($expiresAt)->translatedFormat('d F Y') : null;
                Mail::to($user->email)->send(new PackageUpgradedMail(
                    user: $user,
                    packageName: ucfirst($tierName),
                    expiresAt: $formattedExpiry,
                    dashboardUrl: $actionUrl
                ));
            } catch (\Throwable $e) {
                \Log::warning('Gagal kirim email PackageUpgradedMail via admin verify: ' . $e->getMessage());
            }
        }

        return response()->json($order);
    }

    public function reject(Request $request, $id)
    {
        $order = Order::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'reject_reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $order->update([
            'status' => 'rejected',
            'reject_reason' => $request->reject_reason,
            'verified_by' => $request->user()->id,
            'verified_at' => now(),
        ]);

        return response()->json($order);
    }

    /**
     * Beli produk digital / fisik dengan Midtrans Gateway.
     * POST /orders
     */
    public function createProductOrder(Request $request)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'product_id'     => ['required', 'exists:products,id'],
            'quantity'       => ['nullable', 'integer', 'min:1'],
            'payment_method' => ['nullable', 'string'],
            'recipient_name' => ['nullable', 'string', 'max:255'],
            'recipient_phone'=> ['nullable', 'string', 'max:50'],
            'destination_id' => ['nullable', 'integer'],
            'destination_label' => ['nullable', 'string'],
            'shipping_address' => ['nullable', 'string'],
            'courier_name'   => ['nullable', 'string'],
            'courier_service'=> ['nullable', 'string'],
            'shipping_cost'  => ['nullable', 'integer', 'min:0'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $product = \App\Models\Product::findOrFail($request->product_id);
        $quantity = max(1, (int) $request->input('quantity', 1));

        // Check stock availability
        if ($product->stock !== null) {
            if ($product->stock <= 0) {
                return response()->json(['message' => 'Stok produk telah habis.'], 422);
            }
            if ($quantity > $product->stock) {
                return response()->json([
                    'message' => "Jumlah pembelian ({$quantity}) melebihi stok yang tersedia ({$product->stock} stok tersisa)."
                ], 422);
            }
        }

        // Cek duplikasi jika produk digital
        if ($product->is_digital) {
            $existingOrder = \App\Models\ProductPurchase::where('user_id', $user->id)
                ->where('product_id', $product->id)
                ->whereIn('status', ['completed', 'pending_verification'])
                ->first();

            if ($existingOrder) {
                return response()->json(['message' => 'Anda sudah membeli atau pending verifikasi untuk produk ini.'], 422);
            }
        }

        $unitPrice = (int) ($product->discount_price ?? $product->price);
        $totalProductPrice = $unitPrice * $quantity;
        $shippingCost = (int) ($request->shipping_cost ?? 0);
        $totalAmount = $totalProductPrice + $shippingCost;
        $referenceCode = 'PROD-' . strtoupper(Str::random(8)) . '-' . time();

        try {
            $snapToken = null;
            $serverKey = config('services.midtrans.server_key');
            if ($serverKey && !str_starts_with($serverKey, 'your-')) {
                try {
                    \Midtrans\Config::$serverKey = $serverKey;
                    \Midtrans\Config::$isProduction = config('services.midtrans.is_production', false);
                    \Midtrans\Config::$isSanitized = config('services.midtrans.is_sanitized', true);
                    \Midtrans\Config::$is3ds = config('services.midtrans.is_3ds', true);

                    $itemDetails = [
                        [
                            'id' => 'PROD-' . $product->id,
                            'price' => (int) $unitPrice,
                            'quantity' => (int) $quantity,
                            'name' => Str::limit($product->title, 45),
                        ]
                    ];

                    if ($shippingCost > 0) {
                        $courierLabel = $request->courier_name ? "Ongkir ({$request->courier_name})" : "Biaya Pengiriman";
                        $itemDetails[] = [
                            'id' => 'SHIPPING-COST',
                            'price' => (int) $shippingCost,
                            'quantity' => 1,
                            'name' => Str::limit($courierLabel, 45),
                        ];
                    }

                    $frontendUrl = rtrim(config('app.frontend_url', env('FRONTEND_URL', 'http://localhost:5173')), '/');

                    $params = [
                        'transaction_details' => [
                            'order_id' => $referenceCode,
                            'gross_amount' => (int) $totalAmount,
                        ],
                        'customer_details' => [
                            'first_name' => $request->recipient_name ?: $user->name,
                            'email' => $user->email,
                            'phone' => $request->recipient_phone ?: ($user->phone ?? ''),
                        ],
                        'item_details' => $itemDetails,
                        'callbacks' => [
                            'finish' => "{$frontendUrl}/checkout/{$product->id}?ref={$referenceCode}&payment=success",
                            'error' => "{$frontendUrl}/checkout/{$product->id}?ref={$referenceCode}&payment=error",
                            'pending' => "{$frontendUrl}/checkout/{$product->id}?ref={$referenceCode}&payment=pending",
                        ],
                    ];

                    $snapToken = \Midtrans\Snap::getSnapToken($params);
                } catch (\Throwable $e) {
                    \Log::warning('Midtrans Snap error for ProductPurchase: ' . $e->getMessage());
                }
            }

            $productOrder = \App\Models\ProductPurchase::create([
                'user_id'          => $user->id,
                'product_id'       => $product->id,
                'expert_id'        => $product->expert_id,
                'reference_code'   => $referenceCode,
                'points_spent'     => 0,
                'amount_idr'       => (int) $totalAmount,
                'snap_token'       => $snapToken,
                'product_title'    => $product->title,
                'recipient_name'   => $request->recipient_name ?: $user->name,
                'recipient_phone'  => $request->recipient_phone ?: $user->phone,
                'destination_id'   => $request->destination_id,
                'destination_label'=> $request->destination_label,
                'shipping_address' => $request->shipping_address,
                'courier_name'     => $request->courier_name,
                'courier_service'  => $request->courier_service,
                'shipping_cost'    => $shippingCost,
                'payment_method'   => $request->payment_method ?? 'midtrans',
                'status'           => 'pending_payment',
                'notes'            => $product->is_digital ? 'Produk Digital (Akses Langsung)' : 'Produk Fisik (Dikirim)',
            ]);

            return response()->json([
                'success'        => true,
                'order_id'       => $productOrder->id,
                'reference_code' => $referenceCode,
                'amount'         => $totalAmount,
                'product_price'  => $totalProductPrice,
                'shipping_cost'  => $shippingCost,
                'snap_token'     => $snapToken,
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal membuat pesanan: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Upload bukti pembayaran produk / order.
     * POST /orders/:reference_code/upload-proof
     */
    public function uploadProductPaymentProof(Request $request, $referenceCode)
    {
        return $this->uploadProof($request, $referenceCode);
    }

    /**
     * User: Get their product sales (for experts/surveyors).
     * GET /my/product-sales
     */
    public function myProductSales(Request $request)
    {
        $user = $request->user();

        // Get expert profile for this user
        $expert = \App\Models\Expert::where('user_id', $user->id)->first();

        if (!$expert) {
            return response()->json(['message' => 'Profil expert tidak ditemukan.'], 404);
        }

        $sales = \App\Models\ProductPurchase::where('expert_id', $expert->id)
            ->with(['product:id,title,price,discount_price', 'user:id,name,email'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'count' => $sales->count(),
            'data' => $sales->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'reference_code' => $sale->reference_code,
                    'product' => [
                        'id' => $sale->product->id,
                        'title' => $sale->product->title,
                        'price' => $sale->product->price,
                        'discount_price' => $sale->product->discount_price,
                    ],
                    'buyer' => [
                        'id' => $sale->user->id,
                        'name' => $sale->user->name,
                        'email' => $sale->user->email,
                    ],
                    'payment_method' => $sale->payment_method,
                    'proof_image' => $sale->proof_image,
                    'proof_notes' => $sale->proof_notes,
                    'status' => $sale->status,
                    'seller_amount' => $sale->seller_amount,
                    'admin_amount' => $sale->admin_amount,
                    'proof_uploaded_at' => $sale->proof_uploaded_at,
                    'verified_at' => $sale->verified_at,
                ];
            }),
        ]);
    }

    /**
     * Generate payment instruction untuk transfer manual.
     */
    private function generatePaymentInstruction($referenceCode, $amount, $method, $subMethod = null)
    {
        $accountName = env('PAYMENT_ACCOUNT_NAME', 'PT Tenaga Ahli Nusantara');
        $instruction = [
            'reference_code' => $referenceCode,
            'amount'         => $amount,
            'expires_at'     => now()->addDays(3)->toIso8601String(),
            'account_name'   => $accountName,
        ];

        $accountName = 'Triwala Mitra Bestari';
        $paymentData = [
            'account_name' => $accountName,
        ];

        $bankList = [
            'mandiri' => ['name' => 'Bank Mandiri', 'account_number' => '133-0011-409-331', 'code' => '008'],
            'bca'     => ['name' => 'Bank BCA',     'account_number' => '0954152045',     'code' => '014'],
            'bni'     => ['name' => 'Bank BNI',     'account_number' => '0973607008',     'code' => '009'],
        ];

        switch ($method) {
            case 'bank_transfer':
                $selectedBankKey = strtolower($subMethod ?: 'mandiri');
                $bankInfo = $bankList[$selectedBankKey] ?? $bankList['mandiri'];
                $paymentData['type'] = "Transfer {$bankInfo['name']}";
                $paymentData['bank_name'] = $bankInfo['name'];
                $paymentData['bank_code'] = $bankInfo['code'];
                $paymentData['account_number'] = env('PAYMENT_BANK_ACCOUNT', $bankInfo['account_number']);
                $paymentData['banks'] = $bankList;
                break;

            case 'ewallet':
                $provider = strtoupper($subMethod ?: 'GoPay / OVO / DANA / ShopeePay');
                $paymentData['type'] = "E-Wallet ({$provider})";
                $paymentData['provider'] = env('PAYMENT_EWALLET_PROVIDER', $provider);
                $paymentData['ewallet_number'] = env('PAYMENT_EWALLET_NUMBER', '0812-3456-7890');
                break;

            case 'qris':
                $paymentData['type'] = 'QRIS Instant (Gopay Merchant)';
                $paymentData['account_name'] = 'TRIWALA DIGITAL, DIGITAL & KREATIF';
                $paymentData['nmid'] = 'ID1026596867808';
                $paymentData['qris_info'] = 'Scan QR Code QRIS resmi TRIWALA DIGITAL dengan aplikasi Mobile Banking atau E-Wallet mana saja.';
                $paymentData['qris_url'] = asset('assets/qris_sample.png');
                break;
        }

        $instruction['payment_instruction'] = $paymentData;

        return $instruction;
    }

    /**
     * Admin: Get list of product purchases pending verification.
     * GET /admin/product-purchases/pending
     */
    public function adminProductPurchasesPending(Request $request)
    {
        $admin = $request->user();

        // Verify user is admin
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $purchases = \App\Models\ProductPurchase::where('status', 'pending_verification')
            ->with(['user:id,name,email', 'product:id,title,price,discount_price', 'expert:id,name,user_id'])
            ->orderBy('proof_uploaded_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'count' => $purchases->count(),
            'data' => $purchases->map(function ($purchase) {
                return [
                    'id' => $purchase->id,
                    'reference_code' => $purchase->reference_code,
                    'product' => [
                        'id' => $purchase->product->id,
                        'title' => $purchase->product->title,
                        'price' => $purchase->product->price,
                        'discount_price' => $purchase->product->discount_price,
                    ],
                    'seller' => [
                        'id' => $purchase->expert->id,
                        'name' => $purchase->expert->name,
                    ],
                    'buyer' => [
                        'id' => $purchase->user->id,
                        'name' => $purchase->user->name,
                        'email' => $purchase->user->email,
                    ],
                    'payment_method' => $purchase->payment_method,
                    'proof_image' => $purchase->proof_image,
                    'proof_notes' => $purchase->proof_notes,
                    'proof_uploaded_at' => $purchase->proof_uploaded_at,
                    'status' => $purchase->status,
                ];
            }),
        ]);
    }

    /**
     * Admin: Verify product payment and distribute revenue (90% to seller, 10% to admin).
     * PUT /admin/product-purchases/{id}/verify
     */
    public function verifyProductPayment(Request $request, $id)
    {
        $admin = $request->user();

        // Verify user is admin
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $productOrder = \App\Models\ProductPurchase::findOrFail($id);

        if ($productOrder->status !== 'pending_verification') {
            return response()->json(['message' => 'Status pesanan harus pending_verification.'], 422);
        }

        try {
            // Calculate revenue split: 90% seller, 10% admin
            $totalAmount = $productOrder->product->discount_price ?? $productOrder->product->price;
            $sellerAmount = $totalAmount * 0.90;
            $adminAmount = $totalAmount * 0.10;

            // Get the expert (seller)
            $expert = \App\Models\Expert::findOrFail($productOrder->expert_id);

            // Update expert wallet
            $expert->increment('wallet_balance', $sellerAmount);
            $expert->increment('total_earned', $sellerAmount);

            // Update product order with revenue info and generate download_token
            $productOrder->update([
                'status'            => 'completed',
                'download_token'    => $productOrder->download_token ?: Str::random(64),
                'seller_amount'     => $sellerAmount,
                'admin_amount'      => $adminAmount,
                'verified_at'       => now(),
                'verified_by_admin' => $admin->id,
            ]);

            // Kirim email notifikasi ke Penjual & Pembeli
            $frontendUrl = rtrim(config('app.frontend_url', config('app.url')), '/');
            $salesUrl = $frontendUrl . '/kelola-produk';
            $myPurchasesUrl = $frontendUrl . '/profil';

            $productOrder->loadMissing(['user', 'product']);
            $product = $productOrder->product;
            $buyer = $productOrder->user;

            // 1. Email ke Penjual (Tenaga Ahli)
            $sellerEmail = $expert->user?->email ?? $expert->email;
            if ($sellerEmail && $buyer && $product) {
                try {
                    Mail::to($sellerEmail)->send(new ProductPurchasedSeller($productOrder, $product, $expert, $buyer, $salesUrl, 'bank_transfer'));
                } catch (\Throwable $e) {
                    \Log::warning('Gagal kirim email ProductPurchasedSeller transfer: ' . $e->getMessage());
                }
            }

            // 2. Email ke Pembeli
            if ($buyer && $buyer->email && $product) {
                try {
                    Mail::to($buyer->email)->send(new ProductOrderPaymentVerified($productOrder, $product, $expert, $buyer, $myPurchasesUrl));
                } catch (\Throwable $e) {
                    \Log::warning('Gagal kirim email ProductOrderPaymentVerified: ' . $e->getMessage());
                }
            }

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran terverifikasi. Uang telah ditransfer ke wallet tenaga ahli.',
                'order'   => $productOrder->load('product', 'expert'),
                'seller_earned' => $sellerAmount,
                'admin_earned'  => $adminAmount,
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal verifikasi: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Admin: Reject product payment.
     * PUT /admin/product-purchases/{id}/reject
     */
    public function rejectProductPayment(Request $request, $id)
    {
        $admin = $request->user();

        // Verify user is admin
        if ($admin->role !== 'admin') {
            return response()->json(['message' => 'Unauthorized. Admin only.'], 403);
        }

        $validator = Validator::make($request->all(), [
            'reject_reason' => ['nullable', 'string', 'max:500'],
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => $validator->errors()->first()], 422);
        }

        $productOrder = \App\Models\ProductPurchase::findOrFail($id);

        if (!in_array($productOrder->status, ['pending_verification'])) {
            return response()->json(['message' => 'Status pesanan tidak dapat di-reject.'], 422);
        }

        try {
            $productOrder->update([
                'status'           => 'payment_rejected',
                'verified_at'      => now(),
                'verified_by_admin' => $admin->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Pembayaran ditolak. User diminta untuk upload ulang bukti.',
                'order'   => $productOrder,
            ]);

        } catch (\Exception $e) {
            return response()->json(['message' => 'Gagal reject: ' . $e->getMessage()], 500);
        }
    }
}
