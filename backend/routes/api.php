<?php

use App\Http\Controllers\Api\AdvertisementController;
use App\Http\Controllers\Api\AkademikController;
use App\Http\Controllers\Api\ArticleApiController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryApiController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\ConsultationController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\EducationController;
use App\Http\Controllers\Api\ExperienceController;
use App\Http\Controllers\Api\ExpertController;
use App\Http\Controllers\Api\FileController;
use App\Http\Controllers\Api\HealthCheckController;
use App\Http\Controllers\Api\InvoiceController;
use App\Http\Controllers\Api\MembershipController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\PackageController;
use App\Http\Controllers\Api\PamfletApiController;
use App\Http\Controllers\Api\PartnerApiController;
use App\Http\Controllers\Api\PointController;
use App\Http\Controllers\Api\PresenceController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\RoleUpgradeController;
use App\Http\Controllers\Api\ShippingController;
use App\Http\Controllers\Api\SubmissionController;
use App\Http\Controllers\Api\SurveyController;
use App\Http\Controllers\Api\TicketController;
use App\Http\Controllers\Api\TikaController;
use App\Http\Controllers\Api\TopUpController;
use App\Http\Controllers\Api\WithdrawalController;
use App\Http\Controllers\Api\ConsultationChatController;
use App\Http\Middleware\EnsureIsAdmin;
use Illuminate\Support\Facades\Route;

// =========================================================================
// CORS PREFLIGHT — must be first, no middleware, no auth
// =========================================================================
Route::options('{any}', function () {
    return new \Symfony\Component\HttpFoundation\Response('', 200, [
        'Access-Control-Allow-Origin'  => '*',
        'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept',
        'Access-Control-Max-Age'       => '3600',
    ]);
})->where('any', '.*');

// Health Check Endpoint
Route::get('/health-check', [HealthCheckController::class, 'index']);

// File viewing and download (public access for viewing uploaded files)
Route::get('/files/{path}', [FileController::class, 'view'])->where('path', '.*')->name('api.file.view');
Route::get('/storage/{path}', [FileController::class, 'view'])->where('path', '.*');
Route::get('/files/{path}/info', [FileController::class, 'info'])->where('path', '.*')->name('api.file.info');

Route::post('/register', [AuthController::class, 'register']);
Route::post('/verify-email', [AuthController::class, 'verifyEmail']);
Route::post('/resend-otp', [AuthController::class, 'resendOTP']);
Route::post('/login', [AuthController::class, 'login']);
Route::get('/login', function () {
    return response()->json(['message' => 'Unauthenticated.'], 401);
})->name('login');
Route::get('/register/status', [AuthController::class, 'registrationStatus']);

// Password Reset (Lupa Password)
Route::post('/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/verify-reset-token', [AuthController::class, 'verifyResetToken']);
Route::post('/reset-password', [AuthController::class, 'resetPassword']);

// Midtrans Webhook (no auth required, verified by Midtrans signature)
Route::post('/midtrans/notification', [OrderController::class, 'notification']);
Route::post('/payment/notification', [OrderController::class, 'notification']);
Route::post('/payments/notification', [OrderController::class, 'notification']);

// Instant Status Check / Sync Endpoint with Midtrans API
Route::get('/payment/check-status/{orderId}', [OrderController::class, 'checkPaymentStatus']);
Route::post('/payment/check-status/{orderId}', [OrderController::class, 'checkPaymentStatus']);
Route::get('/midtrans/check-status/{orderId}', [OrderController::class, 'checkPaymentStatus']);
Route::post('/midtrans/check-status/{orderId}', [OrderController::class, 'checkPaymentStatus']);

// Membership payment callback (no auth required, verified by payment gateway)
Route::post('/membership/payment-callback', [MembershipController::class, 'paymentCallback']);

Route::get('/experts', [ExpertController::class, 'index']);
Route::get('/experts/{slug}', [ExpertController::class, 'show']);

// TIKA Chatbot (public access, with rate limiting)
Route::post('/tika/chat', [TikaController::class, 'chat']);

// TIKA Test endpoint (for development)
Route::get('/tika/test', [App\Http\Controllers\Api\TikaTestController::class, 'test']);

// Ulasan publik & Konsultasi
Route::get('/experts/{slug}/reviews', [ReviewController::class, 'index']);
Route::post('/experts/{slug}/reviews', [ReviewController::class, 'store']);
Route::post('/experts/{slug}/consultations', [ConsultationController::class, 'store']);
Route::post('/consultations/{id}/payment-proof', [ConsultationController::class, 'uploadPaymentProof']);
Route::post('/consultations/{id}/snap-token', [ConsultationController::class, 'getSnapToken']);
Route::get('/experts/{slug}/consultation-status', [ConsultationController::class, 'checkStatus']);
Route::get('/experts/{slug}/schedule', [ExpertController::class, 'getPublicSchedule']);

Route::get('/partners', [PartnerApiController::class, 'index']);
Route::get('/articles', [ArticleApiController::class, 'index']);
Route::get('/articles/{slug}', [ArticleApiController::class, 'show']);
Route::get('/categories', [CategoryApiController::class, 'index']);
Route::get('/packages', [PackageController::class, 'index']);
Route::get('/pamflets', [PamfletApiController::class, 'index']);
Route::get('/pamflets/{id}', [PamfletApiController::class, 'show']);

// Paket Top Up bisa dilihat tanpa login (untuk halaman landing)
Route::get('/topup-packages', [TopUpController::class, 'packages']);

// Detail produk publik
Route::get('/products/{id}', [ProductController::class, 'showPublic']);

// Product Reviews - GET public (anyone can read), POST/PUT/DELETE needs auth
Route::get('/products/{id}/reviews', [\App\Http\Controllers\Api\ProductReviewController::class, 'index']);

// Iklan Publik
Route::get('/ads', [AdvertisementController::class, 'publicAds']);
Route::post('/ads/{id}/click', [AdvertisementController::class, 'trackClick']);

// Presence Heartbeat & Online Status (Realtime tracking)
Route::post('/presence/ping', [PresenceController::class, 'ping']);
Route::post('/presence/offline', [PresenceController::class, 'offline']);
Route::get('/presence/{identifier}', [PresenceController::class, 'status']);

// RajaOngkir Shipping Routes
Route::get('/shipping/destinations', [ShippingController::class, 'searchDestinations']);
Route::get('/shipping/provinces', [ShippingController::class, 'getProvinces']);
Route::post('/shipping/calculate', [ShippingController::class, 'calculateCost']);

Route::middleware('auth:sanctum')->group(function () {
    // Authenticated presence routes
    Route::post('/presence/ping', [PresenceController::class, 'ping']);
    Route::post('/presence/offline', [PresenceController::class, 'offline']);

    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::match(['post', 'put'], '/user/profile', [AuthController::class, 'updateProfile']);
    Route::post('/user/avatar', [AuthController::class, 'uploadAvatar']);
    Route::match(['post', 'put'], '/user/change-password', [AuthController::class, 'changePassword']);
    Route::post('/user/logout-other-devices', [AuthController::class, 'logoutOtherDevices']);
    Route::post('/user/request-change-email', [AuthController::class, 'requestChangeEmail']);
    Route::post('/user/verify-change-email', [AuthController::class, 'verifyChangeEmail']);
    Route::post('/user/resend-change-email-otp', [AuthController::class, 'resendChangeEmailOtp']);
    Route::post('/user/cancel-change-email', [AuthController::class, 'cancelChangeEmail']);

    // Dashboard user - profil sendiri
    Route::get('/my/profile', [ExpertController::class, 'myProfile']);
    Route::post('/my/profile', [ExpertController::class, 'saveProfile']);
    Route::patch('/my/profile', [ExpertController::class, 'saveProfile']);

    Route::post('/my/profile/submit', [ExpertController::class, 'submitForVerification']);
    Route::post('/my/profile/cancel-update', [ExpertController::class, 'cancelUpdate']);

    // Role upgrade
    Route::get('/my/role-upgrade-status', [RoleUpgradeController::class, 'myStatus']);
    Route::post('/my/role-upgrade', [RoleUpgradeController::class, 'apply']);

    // Riwayat konsultasi milik user (sebagai pemohon)
    Route::get('/my/consultations', [ConsultationController::class, 'myConsultations']);

    // Konsultasi masuk ke profil tenaga ahli (sebagai penerima konsultasi)
    Route::get('/my/expert-consultations', [ConsultationController::class, 'expertConsultations']);
    Route::patch('/my/expert-consultations/{id}/status', [ConsultationController::class, 'updateStatus']);

    // Jadwal & Tarif Konsultasi Tenaga Ahli / Surveyor
    Route::get('/my/expert-schedule', [ExpertController::class, 'getMySchedule']);
    Route::post('/my/expert-schedule', [ExpertController::class, 'saveMySchedule']);

    Route::get('/my/educations', [EducationController::class, 'index']);
    Route::post('/my/educations', [EducationController::class, 'store']);
    Route::post('/my/educations/{id}', [EducationController::class, 'update']);
    Route::put('/my/educations/{id}', [EducationController::class, 'update']);
    Route::delete('/my/educations/{id}', [EducationController::class, 'destroy']);

    Route::get('/my/experiences', [ExperienceController::class, 'index']);
    Route::post('/my/experiences', [ExperienceController::class, 'store']);
    Route::put('/my/experiences/{id}', [ExperienceController::class, 'update']);
    Route::post('/my/experiences/{id}/primary', [ExperienceController::class, 'setPrimary']);
    Route::delete('/my/experiences/{id}', [ExperienceController::class, 'destroy']);

    Route::get('/my/certificates', [CertificateController::class, 'index']);
    Route::post('/my/certificates', [CertificateController::class, 'store']);
    Route::post('/my/certificates/{id}', [CertificateController::class, 'update']);
    Route::put('/my/certificates/{id}', [CertificateController::class, 'update']);
    Route::post('/my/certificates/{id}/primary', [CertificateController::class, 'setPrimary']);
    Route::delete('/my/certificates/{id}', [CertificateController::class, 'destroy']);

    Route::get('/my/documents', [DocumentController::class, 'index']);
    Route::post('/my/documents', [DocumentController::class, 'store']);
    Route::delete('/my/documents/{id}', [DocumentController::class, 'destroy']);

    // Galeri Foto (Maksimal 2MB per foto)
    Route::post('/my/gallery/upload', [ExpertController::class, 'uploadGalleryPhoto']);

    // Academic data - publikasi, organisasi, reviewer jurnal, instruktur
    Route::get('/my/publikasi', [AkademikController::class, 'indexPublikasi']);
    Route::post('/my/publikasi', [AkademikController::class, 'storePublikasi']);
    Route::put('/my/publikasi/{id}', [AkademikController::class, 'updatePublikasi']);
    Route::delete('/my/publikasi/{id}', [AkademikController::class, 'destroyPublikasi']);

    Route::get('/my/organisasi', [AkademikController::class, 'indexOrganisasi']);
    Route::post('/my/organisasi', [AkademikController::class, 'storeOrganisasi']);
    Route::put('/my/organisasi/{id}', [AkademikController::class, 'updateOrganisasi']);
    Route::delete('/my/organisasi/{id}', [AkademikController::class, 'destroyOrganisasi']);

    Route::get('/my/reviewer-jurnal', [AkademikController::class, 'indexReviewerJurnal']);
    Route::post('/my/reviewer-jurnal', [AkademikController::class, 'storeReviewerJurnal']);
    Route::put('/my/reviewer-jurnal/{id}', [AkademikController::class, 'updateReviewerJurnal']);
    Route::delete('/my/reviewer-jurnal/{id}', [AkademikController::class, 'destroyReviewerJurnal']);

    Route::get('/my/instruktur', [AkademikController::class, 'indexInstruktur']);
    Route::post('/my/instruktur', [AkademikController::class, 'storeInstruktur']);
    Route::put('/my/instruktur/{id}', [AkademikController::class, 'updateInstruktur']);
    Route::delete('/my/instruktur/{id}', [AkademikController::class, 'destroyInstruktur']);

    Route::get('/my/narasumber', [AkademikController::class, 'indexNarasumber']);
    Route::post('/my/narasumber', [AkademikController::class, 'storeNarasumber']);
    Route::put('/my/narasumber/{id}', [AkademikController::class, 'updateNarasumber']);
    Route::delete('/my/narasumber/{id}', [AkademikController::class, 'destroyNarasumber']);

    // Pengalaman Proyek
    Route::get('/my/proyek', [AkademikController::class, 'indexProyek']);
    Route::post('/my/proyek', [AkademikController::class, 'storeProyek']);
    Route::put('/my/proyek/{id}', [AkademikController::class, 'updateProyek']);
    Route::delete('/my/proyek/{id}', [AkademikController::class, 'destroyProyek']);

    // Pengalaman Penelitian
    Route::get('/my/penelitian', [AkademikController::class, 'indexPenelitian']);
    Route::post('/my/penelitian', [AkademikController::class, 'storePenelitian']);
    Route::put('/my/penelitian/{id}', [AkademikController::class, 'updatePenelitian']);
    Route::delete('/my/penelitian/{id}', [AkademikController::class, 'destroyPenelitian']);

    // Kelola Produk (Tenaga Ahli & Surveyor)
    Route::get('/my/products-quota', [ProductController::class, 'quota']);
    Route::get('/my/products', [ProductController::class, 'index']);
    Route::post('/my/products', [ProductController::class, 'store']);
    Route::post('/my/products/{id}', [ProductController::class, 'update']);
    Route::put('/my/products/{id}', [ProductController::class, 'update']);
    Route::delete('/my/products/{id}', [ProductController::class, 'destroy']);
    Route::patch('/my/products/{id}/status', [ProductController::class, 'toggleStatus']);

    // Kelola Iklan (Klien & Pengguna)
    Route::get('/my/ads', [AdvertisementController::class, 'index']);
    Route::post('/my/ads', [AdvertisementController::class, 'store']);
    Route::get('/my/ads/{id}', [AdvertisementController::class, 'show']);
    Route::post('/my/ads/{id}', [AdvertisementController::class, 'update']);
    Route::put('/my/ads/{id}', [AdvertisementController::class, 'update']);
    Route::delete('/my/ads/{id}', [AdvertisementController::class, 'destroy']);
    Route::patch('/my/ads/{id}/status', [AdvertisementController::class, 'toggleStatus']);

    // Kelola Berita / Artikel (Klien & Pengguna)
    Route::get('/my/articles', [ArticleApiController::class, 'myArticles']);
    Route::post('/my/articles', [ArticleApiController::class, 'store']);
    Route::get('/my/articles/{id}', [ArticleApiController::class, 'myArticleDetail']);
    Route::post('/my/articles/{id}/snap-token', [ArticleApiController::class, 'getSnapToken']);
    Route::post('/articles/{id}/snap-token', [ArticleApiController::class, 'getSnapToken']);
    Route::post('/my/articles/{id}/upload-proof', [ArticleApiController::class, 'uploadPaymentProof']);
    Route::post('/my/articles/{id}', [ArticleApiController::class, 'update']);
    Route::put('/my/articles/{id}', [ArticleApiController::class, 'update']);
    Route::delete('/my/articles/{id}', [ArticleApiController::class, 'destroy']);

    // Beli produk dengan Points
    Route::post('/products/{id}/buy', [ProductController::class, 'buyWithPoints']);
    Route::get('/products/{id}/download', [ProductController::class, 'downloadDigitalProduct']);
    Route::get('/my/purchases', [ProductController::class, 'myPurchases']);

    // Lihat penjualan produk mereka (Tenaga Ahli & Surveyor)
    Route::get('/my/product-sales', [OrderController::class, 'myProductSales']);

    // Product Reviews (authenticated POST/PUT/DELETE only)
    Route::post('/products/{id}/reviews', [\App\Http\Controllers\Api\ProductReviewController::class, 'store']);
    Route::put('/reviews/{id}', [\App\Http\Controllers\Api\ProductReviewController::class, 'update']);
    Route::delete('/reviews/{id}', [\App\Http\Controllers\Api\ProductReviewController::class, 'destroy']);

    // =========================================================================
    // LAPORAN PENDAPATAN & PENARIKAN SALDO (Withdrawals)
    // =========================================================================
    Route::get('/my/earnings', [WithdrawalController::class, 'getEarningsStats']);
    Route::get('/my/withdrawals', [WithdrawalController::class, 'myWithdrawals']);
    Route::post('/my/withdrawals', [WithdrawalController::class, 'requestWithdrawal']);

    // =========================================================================
    // IN-APP CHAT KONSULTASI (Realtime Consultation Chat)
    // =========================================================================
    Route::get('/my/chat-rooms', [ConsultationChatController::class, 'getChatRooms']);
    Route::get('/consultations/{id}/messages', [ConsultationChatController::class, 'getMessages']);
    Route::post('/consultations/{id}/messages', [ConsultationChatController::class, 'sendMessage']);

    // =========================================================================
    // PUSAT NOTIFIKASI & BADGE COUNT
    // =========================================================================
    Route::get('/my/notifications', [\App\Http\Controllers\Api\NotificationController::class, 'getNotifications']);
    Route::post('/my/notifications/mark-all-read', [\App\Http\Controllers\Api\NotificationController::class, 'markAllAsRead']);
    Route::post('/my/notifications/mark-chat-read', [\App\Http\Controllers\Api\NotificationController::class, 'markChatRead']);

    // Beli produk dengan uang (transfer manual)
    Route::post('/orders', [OrderController::class, 'createProductOrder']);
    Route::post('/orders/{referenceCode}/upload-proof', [OrderController::class, 'uploadProductPaymentProof']);


    // File upload endpoint for profile images
    Route::post('/upload/profile-image', [FileController::class, 'uploadProfileImage']);

    // Paket & pembayaran (user)
    Route::post('/my/choose-package', [OrderController::class, 'choosePackage']);
    Route::get('/orders/mine', [OrderController::class, 'myOrder']);
    Route::post('/orders/{id}/upload-proof', [OrderController::class, 'uploadProof']);
    Route::get('/orders/history', [OrderController::class, 'myOrders']);
    Route::get('/orders/{id}', [OrderController::class, 'show']);

    // Points & Level (user) — legacy leaderboard
    Route::get('/my/points', [PointController::class, 'myHistory']);
    Route::get('/leaderboard', [PointController::class, 'leaderboard']);

    // =========================================================================
    // TOP UP POINT (User)
    // PENTING: Route statis (packages, history) HARUS sebelum route dinamis ({id})
    // untuk mencegah konflik "history" di-capture sebagai {id}
    // =========================================================================

    // Daftar paket Top Up
    Route::get('/topup/packages', [TopUpController::class, 'packages']);

    // Riwayat semua transaksi Point milik user
    Route::get('/topup/history', [TopUpController::class, 'history']);

    // Buat transaksi Top Up baru
    Route::post('/topup', [TopUpController::class, 'store']);

    // Upload bukti pembayaran Top Up (pakai reference_code atau id)
    Route::post('/topup/{id}/upload-proof', [TopUpController::class, 'uploadProof']);

    // Batalkan Top Up (hanya bisa jika masih pending)
    Route::post('/topup/{id}/cancel', [TopUpController::class, 'cancelByUser']);

    // Detail satu transaksi — WAJIB paling bawah karena {id} akan match semua
    Route::get('/topup/{id}', [TopUpController::class, 'show']);

    // Ulasan (tenaga ahli) — hanya bisa diakses setelah login
    Route::get('/my/reviews', [ReviewController::class, 'myReviews']);
    Route::post('/my/reviews/{id}/reply', [ReviewController::class, 'reply']);
    Route::delete('/my/reviews/{id}/reply', [ReviewController::class, 'deleteReply']);

    // Pengajuan (user)
    Route::post('/submissions', [SubmissionController::class, 'store']);
    Route::get('/submissions/mine', [SubmissionController::class, 'mine']);
    Route::get('/submissions/{id}', [SubmissionController::class, 'show']);

    // Surveyor Dashboard - Tugas & Survei (CRUD)
    Route::get('/my/surveys', [SurveyController::class, 'index']);
    Route::post('/my/surveys', [SurveyController::class, 'store']);
    Route::get('/my/surveys/stats', [SurveyController::class, 'stats']);
    Route::get('/my/surveys/{id}', [SurveyController::class, 'show']);
    Route::put('/my/surveys/{id}', [SurveyController::class, 'update']);
    Route::delete('/my/surveys/{id}', [SurveyController::class, 'destroy']);

    // Tickets (user)
    Route::get('/tickets', [TicketController::class, 'index']);
    Route::post('/tickets', [TicketController::class, 'store']);
    Route::get('/tickets/{id}', [TicketController::class, 'show']);
    Route::post('/tickets/{id}/reply', [TicketController::class, 'reply']);

    // Membership (user) - with sync middleware
    Route::middleware([\App\Http\Middleware\SyncMembershipLevel::class])->group(function () {
        Route::get('/membership/status', [MembershipController::class, 'status']);
        Route::get('/membership/pricing', [MembershipController::class, 'pricing']);
        Route::post('/membership/upgrade', [MembershipController::class, 'upgrade']);
        Route::post('/membership/renew', [MembershipController::class, 'renew']);
        Route::get('/membership/point-history', [MembershipController::class, 'pointHistory']);
        Route::get('/membership/membership-history', [MembershipController::class, 'membershipHistory']);
        Route::get('/membership/transactions/{id}', [MembershipController::class, 'showTransaction']);
        Route::post('/membership/transactions/{id}/cancel', [MembershipController::class, 'cancelTransaction']);
    });

    // Invoices (Semua Pembayaran: Paket Membership, Konsultasi, Berita, Top Up Point, Produk)
    Route::get('/my/invoices', [InvoiceController::class, 'index']);
    Route::get('/my/invoices/{id}', [InvoiceController::class, 'show']);

    Route::middleware([EnsureIsAdmin::class])->group(function () {
        // Pengajuan (admin)
        Route::get('/admin/submissions', [SubmissionController::class, 'adminIndex']);
        Route::post('/admin/submissions/{id}/status', [SubmissionController::class, 'updateStatus']);

        // Endpoint khusus admin: data mentah
        Route::get('/admin/experts', [ExpertController::class, 'adminIndex']);
        Route::post('/admin/experts/{id}/verify-profile', [ExpertController::class, 'verifyProfile']);
        Route::post('/admin/experts/{id}/reject-profile', [ExpertController::class, 'rejectProfile']);
        Route::post('/admin/experts/{id}/approve-update', [ExpertController::class, 'approveUpdate']);
        Route::post('/admin/experts/{id}/reject-update', [ExpertController::class, 'rejectUpdate']);

        Route::get('/admin/articles', [ArticleApiController::class, 'adminIndex']);
        Route::post('/admin/articles', [ArticleApiController::class, 'store']);
        Route::match(['PUT', 'POST', 'PATCH'], '/admin/articles/{id}', [ArticleApiController::class, 'update']);
        Route::post('/admin/articles/{id}/verify', [ArticleApiController::class, 'verify']);
        Route::post('/admin/articles/{id}/reject', [ArticleApiController::class, 'reject']);
        Route::delete('/admin/articles/{id}', [ArticleApiController::class, 'destroy']);

        // Aliases for /admin/berita
        Route::get('/admin/berita', [ArticleApiController::class, 'adminIndex']);
        Route::post('/admin/berita', [ArticleApiController::class, 'store']);
        Route::match(['PUT', 'POST', 'PATCH'], '/admin/berita/{id}', [ArticleApiController::class, 'update']);
        Route::post('/admin/berita/{id}/verify', [ArticleApiController::class, 'verify']);
        Route::post('/admin/berita/{id}/reject', [ArticleApiController::class, 'reject']);
        Route::delete('/admin/berita/{id}', [ArticleApiController::class, 'destroy']);

        Route::get('/admin/categories', [CategoryApiController::class, 'adminIndex']);
        Route::get('/admin/partners', [PartnerApiController::class, 'adminIndex']);
        Route::get('/admin/orders', [OrderController::class, 'adminIndex']);
        Route::post('/admin/orders/{id}/verify', [OrderController::class, 'verify']);
        Route::post('/admin/orders/{id}/reject', [OrderController::class, 'reject']);

        // Product Purchases - Admin verification
        Route::get('/admin/product-purchases/pending', [OrderController::class, 'adminProductPurchasesPending']);
        Route::put('/admin/product-purchases/{id}/verify', [OrderController::class, 'verifyProductPayment']);
        Route::put('/admin/product-purchases/{id}/reject', [OrderController::class, 'rejectProductPayment']);

        // Withdrawals / Payout - Admin verification
        Route::get('/admin/withdrawals', [WithdrawalController::class, 'adminIndex']);
        Route::post('/admin/withdrawals/{id}/approve', [WithdrawalController::class, 'adminApprove']);
        Route::post('/admin/withdrawals/{id}/reject', [WithdrawalController::class, 'adminReject']);

        // Consultations & Zoom Link Management - Admin
        Route::get('/admin/consultations', [ConsultationController::class, 'adminIndex']);
        Route::post('/admin/consultations/{id}/set-zoom', [ConsultationController::class, 'adminSetZoomLink']);
        Route::post('/admin/consultations/{id}/verify-payment', [ConsultationController::class, 'adminVerifyPayment']);

        Route::get('/admin/packages', [PackageController::class, 'adminIndex']);
        Route::post('/admin/packages', [PackageController::class, 'store']);
        Route::put('/admin/packages/{id}', [PackageController::class, 'update']);
        Route::delete('/admin/packages/{id}', [PackageController::class, 'destroy']);

        // Points stats (admin) — legacy
        Route::get('/admin/points/stats', [PointController::class, 'stats']);

        // =========================================================================
        // TOP UP POINT ADMIN
        // =========================================================================
        // Statistik keseluruhan
        Route::get('/admin/topup/stats', [\App\Http\Controllers\Admin\TopUpController::class, 'stats']);

        // Semua transaksi Point (semua user, semua tipe)
        Route::get('/admin/topup/transactions', [\App\Http\Controllers\Admin\TopUpController::class, 'transactions']);

        // Top Up yang pending (menunggu konfirmasi)
        Route::get('/admin/topup/pending', [\App\Http\Controllers\Admin\TopUpController::class, 'pending']);

        // Detail transaksi
        Route::get('/admin/topup/transactions/{id}', [\App\Http\Controllers\Admin\TopUpController::class, 'show']);

        // Konfirmasi Top Up → saldo user bertambah
        Route::post('/admin/topup/{id}/confirm', [\App\Http\Controllers\Admin\TopUpController::class, 'confirm']);

        // Batalkan Top Up
        Route::post('/admin/topup/{id}/cancel', [\App\Http\Controllers\Admin\TopUpController::class, 'cancel']);

        // Refund Point ke user
        Route::post('/admin/topup/{id}/refund', [\App\Http\Controllers\Admin\TopUpController::class, 'refund']);

        // Manajemen paket Top Up
        Route::get('/admin/topup/packages', [\App\Http\Controllers\Admin\TopUpController::class, 'packageIndex']);
        Route::post('/admin/topup/packages', [\App\Http\Controllers\Admin\TopUpController::class, 'packageStore']);
        Route::put('/admin/topup/packages/{id}', [\App\Http\Controllers\Admin\TopUpController::class, 'packageUpdate']);
        Route::delete('/admin/topup/packages/{id}', [\App\Http\Controllers\Admin\TopUpController::class, 'packageDestroy']);

        // Daftar user dengan saldo Point
        Route::get('/admin/topup/users', [\App\Http\Controllers\Admin\TopUpController::class, 'users']);

        // Admin - dashboard stats, deactivate, change password
        Route::get('/admin/dashboard-stats', [ExpertController::class, 'dashboardStats']);
        Route::post('/admin/experts/{id}/deactivate', [ExpertController::class, 'deactivateProfile']);
        Route::put('/admin/change-password', [AuthController::class, 'changePassword']);

        // Admin - Surveyor Management
        Route::get('/admin/surveyors', [\App\Http\Controllers\Admin\SurveyorController::class, 'index']);
        Route::get('/admin/surveyors/statistics', [\App\Http\Controllers\Admin\SurveyorController::class, 'statistics']);
        Route::get('/admin/surveyors/{id}', [\App\Http\Controllers\Admin\SurveyorController::class, 'show']);
        Route::post('/admin/surveyors/{id}/verify-profile', [\App\Http\Controllers\Admin\SurveyorController::class, 'verifyProfile']);
        Route::post('/admin/surveyors/{id}/reject-profile', [\App\Http\Controllers\Admin\SurveyorController::class, 'rejectProfile']);
        Route::post('/admin/surveyors/{id}/deactivate', [\App\Http\Controllers\Admin\SurveyorController::class, 'deactivateProfile']);
        Route::post('/admin/surveyors/{id}/approve-update', [\App\Http\Controllers\Admin\SurveyorController::class, 'approveUpdate']);
        Route::post('/admin/surveyors/{id}/reject-update', [\App\Http\Controllers\Admin\SurveyorController::class, 'rejectUpdate']);
        Route::delete('/admin/surveyors/{id}', [\App\Http\Controllers\Admin\SurveyorController::class, 'destroy']);

        // Admin - Role Upgrade Requests
        Route::get('/admin/role-upgrade-requests', [RoleUpgradeController::class, 'adminIndex']);
        Route::post('/admin/role-upgrade-requests/{id}/approve', [RoleUpgradeController::class, 'approve']);
        Route::post('/admin/role-upgrade-requests/{id}/reject', [RoleUpgradeController::class, 'reject']);

        // TIKA Statistics (admin only)
        Route::get('/admin/tika/statistics', [TikaController::class, 'statistics']);

        // CRUD Admin - Experts (manual, oleh admin sendiri)
        Route::post('/experts', [ExpertController::class, 'store']);
        Route::put('/experts/{id}', [ExpertController::class, 'update']);
        Route::delete('/experts/{id}', [ExpertController::class, 'destroy']);

        Route::post('/articles', [ArticleApiController::class, 'store']);
        Route::match(['PUT', 'POST', 'PATCH'], '/articles/{id}', [ArticleApiController::class, 'update']);
        Route::delete('/articles/{id}', [ArticleApiController::class, 'destroy']);

        Route::post('/categories', [CategoryApiController::class, 'store']);
        Route::put('/categories/{id}', [CategoryApiController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryApiController::class, 'destroy']);

        Route::post('/partners', [PartnerApiController::class, 'store']);
        Route::put('/partners/{id}', [PartnerApiController::class, 'update']);
        Route::delete('/partners/{id}', [PartnerApiController::class, 'destroy']);

        // Tickets (admin)
        Route::get('/admin/tickets', [\App\Http\Controllers\Admin\TicketController::class, 'index']);
        Route::get('/admin/tickets/statistics', [\App\Http\Controllers\Admin\TicketController::class, 'statistics']);
        Route::get('/admin/tickets/{id}', [\App\Http\Controllers\Admin\TicketController::class, 'show']);
        Route::post('/admin/tickets/{id}/reply', [\App\Http\Controllers\Admin\TicketController::class, 'reply']);
        Route::patch('/admin/tickets/{id}/status', [\App\Http\Controllers\Admin\TicketController::class, 'updateStatus']);

        // Membership (admin)
        Route::get('/admin/membership/statistics', [\App\Http\Controllers\Admin\MembershipController::class, 'statistics']);
        Route::get('/admin/membership/users', [\App\Http\Controllers\Admin\MembershipController::class, 'users']);
        Route::get('/admin/membership/users/{id}', [\App\Http\Controllers\Admin\MembershipController::class, 'userDetail']);
        Route::get('/admin/membership/point-transactions', [\App\Http\Controllers\Admin\MembershipController::class, 'pointTransactions']);
        Route::get('/admin/membership/membership-transactions', [\App\Http\Controllers\Admin\MembershipController::class, 'membershipTransactions']);
        Route::post('/admin/membership/process-expired', [\App\Http\Controllers\Admin\MembershipController::class, 'processExpired']);
    });
});
