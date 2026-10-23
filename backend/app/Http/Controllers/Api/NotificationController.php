<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Consultation;
use App\Models\ConsultationMessage;
use App\Models\Expert;
use App\Models\PointTransaction;
use App\Models\ProductPurchase;
use App\Models\Ticket;
use App\Models\Withdrawal;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class NotificationController extends Controller
{
    /**
     * Get aggregated notifications and badge counts for the authenticated user.
     * Accessible by ALL roles: Admin, Tenaga Ahli, Tenaga Teknis, Surveyor, Klien.
     * GET /api/my/notifications
     */
    public function getNotifications(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated',
                'unread_total' => 0,
                'counts' => ['chat' => 0, 'product_sales' => 0, 'consultations' => 0, 'orders' => 0, 'admin' => 0],
                'notifications' => [],
            ], 401);
        }

        $isAdmin = (bool)($user->role === 'admin' || $user->is_admin);
        $expert = Expert::where('user_id', $user->id)->first();
        $isExpert = (bool)$expert;

        $chatNotifications = [];
        $salesNotifications = [];
        $orderNotifications = [];
        $consultNotifications = [];
        $adminNotifications = [];
        $systemNotifications = [];

        $unreadChatCount = 0;
        $pendingSalesCount = 0;
        $pendingConsultCount = 0;
        $pendingOrdersCount = 0;
        $adminActionCount = 0;

        // ---------------------------------------------------------------------
        // 1. CHAT NOTIFICATIONS (Untuk Semua Role: Ahli, Teknis, Surveyor, Klien, Admin)
        // ---------------------------------------------------------------------
        $consultationQuery = Consultation::with([
            'expert.user:id,name,avatar_url',
            'user:id,name,avatar_url,email',
        ]);

        if ($expert) {
            $consultationQuery->where(function ($q) use ($expert, $user) {
                $q->where('expert_id', $expert->id)
                  ->orWhere('user_id', $user->id)
                  ->orWhere('client_email', $user->email);
            });
        } else {
            $consultationQuery->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('client_email', $user->email);
            });
        }

        $myConsultations = $consultationQuery->get();
        $myConsultationIds = $myConsultations->pluck('id')->toArray();

        if (!empty($myConsultationIds)) {
            $unreadChatMessages = ConsultationMessage::whereIn('consultation_id', $myConsultationIds)
                ->where('sender_id', '!=', $user->id)
                ->where('is_read', false)
                ->with(['sender:id,name,avatar_url', 'consultation'])
                ->orderBy('created_at', 'desc')
                ->get();

            $unreadChatCount = $unreadChatMessages->count();
            $groupedChat = $unreadChatMessages->groupBy('consultation_id');

            foreach ($groupedChat as $consultId => $messages) {
                $latestMsg = $messages->first();
                $consultation = $myConsultations->firstWhere('id', $consultId);
                $sender = $latestMsg->sender;
                $senderName = $sender ? $sender->name : ($consultation ? ($consultation->client_name ?: 'Pengguna') : 'Pengguna');
                $msgCount = $messages->count();

                $chatNotifications[] = [
                    'id' => 'chat-' . $consultId . '-' . $latestMsg->id,
                    'type' => 'chat',
                    'category' => 'chat',
                    'title' => $msgCount > 1 ? "{$msgCount} Pesan Baru dari {$senderName}" : "Pesan Baru dari {$senderName}",
                    'description' => $latestMsg->message ? Str::limit($latestMsg->message, 80) : 'Mengirim lampiran berkas',
                    'link' => '/chat-konsultasi?id=' . $consultId,
                    'time' => $latestMsg->created_at->diffForHumans(),
                    'created_at' => $latestMsg->created_at->toIso8601String(),
                    'is_read' => false,
                    'icon' => 'chat',
                    'color' => 'blue',
                    'count' => $msgCount,
                    'consultation_id' => $consultId,
                ];
            }
        }

        // ---------------------------------------------------------------------
        // 2. PRODUCT SALES NOTIFICATIONS (Khusus Tenaga Ahli, Tenaga Teknis, Surveyor)
        // ---------------------------------------------------------------------
        if ($expert) {
            $recentSales = ProductPurchase::where('expert_id', $expert->id)
                ->with(['user:id,name,email,avatar_url', 'product:id,title,price'])
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get();

            foreach ($recentSales as $sale) {
                $buyerName = $sale->user ? $sale->user->name : ($sale->recipient_name ?: 'Pembeli');
                $priceLabel = $sale->points_spent > 0 ? "{$sale->points_spent} Point" : ('Rp ' . number_format($sale->amount_idr, 0, ',', '.'));
                
                $st = strtolower((string)$sale->status);
                $isPending = in_array($st, ['pending', 'pending_payment', 'menunggu_verifikasi', 'paid', 'dibayar', 'success']);

                if ($isPending) {
                    $pendingSalesCount++;
                }

                $statusLabel = match ($st) {
                    'paid', 'dibayar', 'success' => 'Pembayaran Terkonfirmasi',
                    'pending', 'pending_payment', 'menunggu_verifikasi' => 'Menunggu Pembayaran / Baru',
                    'dikirim' => 'Pesanan Dikirim',
                    'selesai', 'completed' => 'Pesanan Selesai',
                    default => ucfirst($sale->status),
                };

                $salesNotifications[] = [
                    'id' => 'sale-' . $sale->id,
                    'type' => 'product_sale',
                    'category' => 'product',
                    'title' => "Produk Terjual: " . ($sale->product_title ?: ($sale->product ? $sale->product->title : 'Produk Digital')),
                    'description' => "{$buyerName} membeli produk ini ({$priceLabel}) — {$statusLabel}",
                    'link' => '/penjualan',
                    'time' => $sale->created_at->diffForHumans(),
                    'created_at' => $sale->created_at->toIso8601String(),
                    'is_read' => !$isPending,
                    'icon' => 'shopping_bag',
                    'color' => 'emerald',
                    'amount' => $priceLabel,
                ];
            }
        }

        // ---------------------------------------------------------------------
        // 3. PRODUCT ORDERS NOTIFICATIONS (Bagi Pembeli / Klien / User)
        // ---------------------------------------------------------------------
        $recentOrders = ProductPurchase::where('user_id', $user->id)
            ->with(['product:id,title,is_digital'])
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get();

        foreach ($recentOrders as $order) {
            $st = strtolower((string)$order->status);
            $isPaid = in_array($st, ['paid', 'dibayar', 'selesai', 'completed']);
            if (!$isPaid && in_array($st, ['pending', 'pending_payment', 'menunggu_verifikasi'])) {
                $pendingOrdersCount++;
            }

            $orderNotifications[] = [
                'id' => 'order-' . $order->id,
                'type' => 'product_order',
                'category' => 'order',
                'title' => "Pesanan: " . ($order->product_title ?: ($order->product ? $order->product->title : 'Produk Digital')),
                'description' => "Status: " . ucfirst($order->status) . ($order->product?->is_digital && $isPaid ? ' (Siap diunduh)' : ''),
                'link' => '/pesanan-saya',
                'time' => $order->created_at->diffForHumans(),
                'created_at' => $order->created_at->toIso8601String(),
                'is_read' => $isPaid,
                'icon' => 'inventory_2',
                'color' => 'amber',
            ];
        }

        // ---------------------------------------------------------------------
        // 4. CONSULTATION NOTIFICATIONS
        // ---------------------------------------------------------------------
        if ($expert) {
            // Permintaan konsultasi masuk untuk Tenaga Ahli / Teknis / Surveyor
            $pendingConsults = Consultation::where('expert_id', $expert->id)
                ->whereIn('status', ['menunggu_konfirmasi', 'pending', 'confirmed'])
                ->orderBy('created_at', 'desc')
                ->take(10)
                ->get();

            foreach ($pendingConsults as $c) {
                $isPending = in_array(strtolower($c->status), ['menunggu_konfirmasi', 'pending']);
                if ($isPending) {
                    $pendingConsultCount++;
                }

                $consultNotifications[] = [
                    'id' => 'consult-req-' . $c->id,
                    'type' => 'consultation_request',
                    'category' => 'consultation',
                    'title' => $isPending ? "Permintaan Konsultasi Baru" : "Jadwal Konsultasi Disetujui",
                    'description' => "{$c->client_name} — " . ($c->consultation_date ? Carbon::parse($c->consultation_date)->format('d M Y') : 'Tanggal fleksibel') . " ({$c->topic})",
                    'link' => '/konsultasi',
                    'time' => $c->created_at->diffForHumans(),
                    'created_at' => $c->created_at->toIso8601String(),
                    'is_read' => !$isPending,
                    'icon' => 'psychology',
                    'color' => 'purple',
                ];
            }
        } else {
            // Status konsultasi untuk Klien
            $clientConsults = Consultation::where(function($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere('client_email', $user->email);
                })
                ->with(['expert.user'])
                ->orderBy('created_at', 'desc')
                ->take(8)
                ->get();

            foreach ($clientConsults as $c) {
                $expertName = $c->expert ? ($c->expert->nama_lengkap ?: ($c->expert->user ? $c->expert->user->name : 'Tenaga Ahli')) : 'Tenaga Ahli';
                $st = strtolower((string)$c->status);
                $isConfirmed = in_array($st, ['confirmed', 'disetujui', 'aktif']);
                
                $consultNotifications[] = [
                    'id' => 'client-consult-' . $c->id,
                    'type' => 'consultation_confirmed',
                    'category' => 'consultation',
                    'title' => $isConfirmed ? "Konsultasi Disetujui" : "Status Konsultasi: " . ucfirst($c->status),
                    'description' => "Dengan {$expertName} pada " . ($c->consultation_date ? Carbon::parse($c->consultation_date)->format('d M Y') : '-') . ($c->zoom_link ? ' (Zoom Link Tersedia)' : ''),
                    'link' => '/chat-konsultasi?id=' . $c->id,
                    'time' => $c->created_at->diffForHumans(),
                    'created_at' => $c->created_at->toIso8601String(),
                    'is_read' => !$isConfirmed,
                    'icon' => 'videocam',
                    'color' => 'purple',
                ];
            }
        }

        // ---------------------------------------------------------------------
        // 5. PROFILE VERIFICATION STATUS (Untuk Tenaga Ahli, Teknis, Surveyor)
        // ---------------------------------------------------------------------
        if ($expert) {
            $expertStatus = strtolower((string)($expert->profile_status ?? ''));
            if ($expertStatus === 'menunggu_verifikasi') {
                $systemNotifications[] = [
                    'id' => 'verif-waiting-' . $expert->id,
                    'type' => 'verification',
                    'category' => 'system',
                    'title' => 'Profil Sedang Diverifikasi',
                    'description' => 'Data dan berkas keahlian Anda sedang dalam antrean verifikasi tim admin.',
                    'link' => '/profil-saya',
                    'time' => $expert->updated_at ? $expert->updated_at->diffForHumans() : 'Baru saja',
                    'created_at' => $expert->updated_at ? $expert->updated_at->toIso8601String() : now()->toIso8601String(),
                    'is_read' => true,
                    'icon' => 'verified_user',
                    'color' => 'amber',
                ];
            } elseif ($expertStatus === 'aktif' || $expertStatus === 'verified') {
                $systemNotifications[] = [
                    'id' => 'verif-success-' . $expert->id,
                    'type' => 'verification',
                    'category' => 'system',
                    'title' => 'Profil Terverifikasi',
                    'description' => 'Selamat! Profil keahlian Anda telah terverifikasi dan aktif di pencarian publik.',
                    'link' => '/profil-saya',
                    'time' => $expert->updated_at ? $expert->updated_at->diffForHumans() : 'Aktif',
                    'created_at' => $expert->updated_at ? $expert->updated_at->toIso8601String() : now()->toIso8601String(),
                    'is_read' => true,
                    'icon' => 'verified',
                    'color' => 'emerald',
                ];
            }
        }

        // ---------------------------------------------------------------------
        // 6. ADMIN NOTIFICATIONS (Khusus Administrator)
        // ---------------------------------------------------------------------
        if ($isAdmin) {
            // A. Pending Verifications
            $pendingExperts = Expert::where('profile_status', 'menunggu_verifikasi')->orderBy('created_at', 'desc')->take(5)->get();
            if ($pendingExperts->count() > 0) {
                $adminActionCount += $pendingExperts->count();
                foreach ($pendingExperts as $pe) {
                    $roleName = match($pe->role_type) {
                        'surveyor' => 'Surveyor',
                        'tenaga_teknis' => 'Tenaga Teknis',
                        default => 'Tenaga Ahli',
                    };
                    $adminNotifications[] = [
                        'id' => 'admin-verif-' . $pe->id,
                        'type' => 'admin_task',
                        'category' => 'admin',
                        'title' => "Verifikasi Akun: {$pe->name}",
                        'description' => "Pengajuan berkas baru sebagai {$roleName} ({$pe->field})",
                        'link' => '/admin/verifikasi',
                        'time' => $pe->created_at ? $pe->created_at->diffForHumans() : 'Baru saja',
                        'created_at' => $pe->created_at ? $pe->created_at->toIso8601String() : now()->toIso8601String(),
                        'is_read' => false,
                        'icon' => 'verified_user',
                        'color' => 'amber',
                    ];
                }
            }

            // B. Open Tickets
            $openTickets = Ticket::with('user')->whereIn('status', ['open', 'pending'])->orderBy('created_at', 'desc')->take(5)->get();
            if ($openTickets->count() > 0) {
                $adminActionCount += $openTickets->count();
                foreach ($openTickets as $t) {
                    $ticketUser = $t->user ? $t->user->name : 'Pengguna';
                    $adminNotifications[] = [
                        'id' => 'admin-ticket-' . $t->id,
                        'type' => 'admin_task',
                        'category' => 'admin',
                        'title' => "Tiket Bantuan Baru: {$t->title}",
                        'description' => "Dari {$ticketUser} — Prioritas: " . ucfirst($t->priority ?? 'normal'),
                        'link' => '/admin/tiket',
                        'time' => $t->created_at ? $t->created_at->diffForHumans() : 'Baru saja',
                        'created_at' => $t->created_at ? $t->created_at->toIso8601String() : now()->toIso8601String(),
                        'is_read' => false,
                        'icon' => 'support_agent',
                        'color' => 'red',
                    ];
                }
            }

            // C. Pending Withdrawals
            $pendingWithdrawals = Withdrawal::where('status', 'pending')->orderBy('created_at', 'desc')->take(5)->get();
            if ($pendingWithdrawals->count() > 0) {
                $adminActionCount += $pendingWithdrawals->count();
                foreach ($pendingWithdrawals as $w) {
                    $accHolder = $w->account_holder_name ?: 'Pengguna';
                    $adminNotifications[] = [
                        'id' => 'admin-wd-' . $w->id,
                        'type' => 'admin_task',
                        'category' => 'admin',
                        'title' => "Permintaan Tarik Dana",
                        'description' => "Rp " . number_format($w->amount, 0, ',', '.') . " — {$w->bank_name} ({$accHolder})",
                        'link' => '/admin/penarikan',
                        'time' => $w->created_at ? $w->created_at->diffForHumans() : 'Baru saja',
                        'created_at' => $w->created_at ? $w->created_at->toIso8601String() : now()->toIso8601String(),
                        'is_read' => false,
                        'icon' => 'account_balance_wallet',
                        'color' => 'blue',
                    ];
                }
            }
        }

        // ---------------------------------------------------------------------
        // Gabungkan seluruh notifikasi dan urutkan dari yang paling baru
        // ---------------------------------------------------------------------
        $allNotifications = collect(array_merge(
            $chatNotifications,
            $adminNotifications,
            $salesNotifications,
            $orderNotifications,
            $consultNotifications,
            $systemNotifications
        ))->sortByDesc('created_at')->values()->all();

        $unreadTotal = $unreadChatCount + $pendingSalesCount + $pendingConsultCount + $adminActionCount;

        return response()->json([
            'success' => true,
            'unread_total' => $unreadTotal,
            'counts' => [
                'chat' => $unreadChatCount,
                'product_sales' => $pendingSalesCount,
                'consultations' => $pendingConsultCount,
                'orders' => $pendingOrdersCount,
                'admin' => $adminActionCount,
                'unread_total' => $unreadTotal,
            ],
            'notifications' => $allNotifications,
        ]);
    }

    /**
     * Mark all consultation messages as read for this user.
     * POST /api/my/notifications/mark-all-read
     */
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $expert = Expert::where('user_id', $user->id)->first();

        $consultationQuery = Consultation::query();
        if ($expert) {
            $consultationQuery->where(function ($q) use ($expert, $user) {
                $q->where('expert_id', $expert->id)
                  ->orWhere('user_id', $user->id)
                  ->orWhere('client_email', $user->email);
            });
        } else {
            $consultationQuery->where(function ($q) use ($user) {
                $q->where('user_id', $user->id)
                  ->orWhere('client_email', $user->email);
            });
        }

        $myConsultationIds = $consultationQuery->pluck('id')->toArray();

        if (!empty($myConsultationIds)) {
            ConsultationMessage::whereIn('consultation_id', $myConsultationIds)
                ->where('sender_id', '!=', $user->id)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Semua notifikasi telah ditandai sebagai dibaca.',
        ]);
    }

    /**
     * Mark messages in a specific consultation room as read.
     * POST /api/my/notifications/mark-chat-read
     */
    public function markChatRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $consultationId = $request->input('consultation_id');

        if ($consultationId) {
            ConsultationMessage::where('consultation_id', $consultationId)
                ->where('sender_id', '!=', $user->id)
                ->where('is_read', false)
                ->update([
                    'is_read' => true,
                    'read_at' => now(),
                ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Pesan obrolan telah ditandai sebagai dibaca.',
        ]);
    }
}
